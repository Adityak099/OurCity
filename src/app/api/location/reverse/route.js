import { NextResponse } from "next/server";

export const runtime = "nodejs";

// Simple in-memory cache to avoid redundant Nominatim requests for the same spot
const geocodeCache = new Map();
const CACHE_TTL_MS = 1000 * 60 * 60; // 1 hour

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const latitudeValue = searchParams.get("lat");
  const longitudeValue = searchParams.get("lon");
  const latitude = Number(latitudeValue);
  const longitude = Number(longitudeValue);

  if (
    latitudeValue === null ||
    longitudeValue === null ||
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude) ||
    latitude < -90 ||
    latitude > 90 ||
    longitude < -180 ||
    longitude > 180
  ) {
    return NextResponse.json(
      { message: "Valid latitude and longitude are required." },
      { status: 400 },
    );
  }

  // Round to 4 decimal places (~11m precision) for caching
  const cacheKey = `${latitude.toFixed(4)},${longitude.toFixed(4)}`;
  const cached = geocodeCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return NextResponse.json(cached.data);
  }

  const baseUrl = process.env.NOMINATIM_BASE_URL;
  const userAgent =
    process.env.NOMINATIM_USER_AGENT || "OurCity/0.1.0 (admin@ourcity.local)";

  if (!baseUrl) {
    return NextResponse.json(
      { message: "Place and area lookup is not configured." },
      { status: 503 },
    );
  }

  let endpoint;

  try {
    const parsedBaseUrl = new URL(baseUrl);

    if (
      parsedBaseUrl.username ||
      parsedBaseUrl.password ||
      parsedBaseUrl.search ||
      parsedBaseUrl.hash ||
      (parsedBaseUrl.protocol !== "https:" &&
        !(
          parsedBaseUrl.protocol === "http:" &&
          ["localhost", "127.0.0.1", "[::1]"].includes(parsedBaseUrl.hostname)
        ))
    ) {
      return NextResponse.json(
        { message: "Configure a valid Nominatim service URL over HTTPS." },
        { status: 503 },
      );
    }

    endpoint = new URL(
      "reverse",
      `${parsedBaseUrl.toString().replace(/\/+$/, "")}/`,
    );
  } catch {
    return NextResponse.json(
      { message: "The configured place lookup service URL is invalid." },
      { status: 500 },
    );
  }

  endpoint.searchParams.set("format", "jsonv2");
  endpoint.searchParams.set("addressdetails", "1");
  endpoint.searchParams.set("zoom", "18");
  endpoint.searchParams.set("lat", String(latitude));
  endpoint.searchParams.set("lon", String(longitude));

  let response;

  try {
    response = await fetch(endpoint, {
      headers: {
        Accept: "application/json",
        "User-Agent": userAgent,
      },
      signal: AbortSignal.timeout(10000),
      cache: "no-store",
    });
  } catch (error) {
    console.error("Reverse geocoding request failed:", error.name);

    return NextResponse.json(
      { message: "Unable to look up the place and area. Please try again." },
      { status: 502 },
    );
  }

  if (!response.ok) {
    console.error(
      "Reverse geocoding service returned status:",
      response.status,
    );

    return NextResponse.json(
      { message: "Unable to look up the place and area. Please try again." },
      { status: 502 },
    );
  }

  let result;

  try {
    result = await response.json();
  } catch {
    return NextResponse.json(
      { message: "The place lookup service returned an invalid response." },
      { status: 502 },
    );
  }

  if (!result || typeof result !== "object" || Array.isArray(result)) {
    return NextResponse.json(
      { message: "The place lookup service returned an invalid response." },
      { status: 502 },
    );
  }

  const address =
    result.address && typeof result.address === "object" ? result.address : {};

  // Expanded fields to better capture sectors, blocks, and colonies
  const areaParts = [
    address.neighbourhood,
    address.quarter,
    address.residential,
    address.locality,
    address.suburb,
    address.city_district,
    address.town || address.city || address.village || address.municipality,
  ]
    .filter((part) => typeof part === "string" && part.trim())
    .map((part) => part.trim())
    .filter((part, index, parts) => parts.indexOf(part) === index);

  const place = [
    result.name,
    address.amenity,
    address.building,
    address.road,
    address.pedestrian,
    result.display_name?.split(",")[0],
  ]
    .find((part) => typeof part === "string" && part.trim())
    ?.trim();

  const areaFallback = [address.county, address.state].find(
    (part) => typeof part === "string" && part.trim(),
  );

  const area = areaParts.join(", ") || areaFallback?.trim();

  if (!place && !area) {
    return NextResponse.json(
      { message: "No nearby place or area name was found." },
      { status: 404 },
    );
  }

  const responsePayload = {
    place: place || "Not available",
    area: area || "Not available",
  };

  // Store in cache (cap cache size at 500 entries)
  if (geocodeCache.size >= 500) {
    const oldestKey = geocodeCache.keys().next().value;
    geocodeCache.delete(oldestKey);
  }
  geocodeCache.set(cacheKey, { data: responsePayload, timestamp: Date.now() });

  return NextResponse.json(responsePayload);
}
