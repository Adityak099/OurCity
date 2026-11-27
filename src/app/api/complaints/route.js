import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";

import {
  saveComplaint,
  getComplaintsByCitizen,
  getComplaints,
  getComplaintByReferenceAndContact,
  getUsersByRole,
} from "@/lib/server/complaints-store";
import { normalizeWard } from "@/lib/ward";
import {
  deleteComplaintImage,
  uploadComplaintImage,
} from "@/lib/server/cloudinary";
import { requireRole } from "@/lib/server/auth";

export const runtime = "nodejs";

const ALLOWED_CATEGORIES = [
  "Garbage Accumulation",
  "Overflowing Dustbin",
  "Illegal Dumping",
  "Roadside Waste",
  "Other",
];

const ALLOWED_SEVERITIES = ["Low", "Medium", "High", "Critical"];

const MAX_FILE_SIZE = 5 * 1024 * 1024;

const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    if (searchParams.get("public") === "true") {
      const publicReports = await getComplaints();
      return NextResponse.json({ success: true, complaints: publicReports.map(({ contactNumber, reporterName, citizenId, reporterSessionId, driverLocation, ...report }) => ({ ...report, status: report.status === "Submitted" ? "Reported" : report.status === "Resolved" ? "Cleaned" : report.status })) });
    }
    const citizenId = searchParams.get("citizenId");
    const reference = searchParams.get("reference");
    const contactNumber = searchParams.get("contactNumber")?.trim();
    if (citizenId) {
      const session = await requireRole("citizen");
      if (!session || session.id !== citizenId) return NextResponse.json({ success: false, message: "Citizen access is required." }, { status: 403 });
      const complaints = await getComplaintsByCitizen(session.id);
      const driverAccounts = await getUsersByRole("driver");
      const drivers = new Map(driverAccounts.map(({ _id, name, vehicleNumber, assignedWard }) => [String(_id), { id: String(_id), name, vehicleNumber, assignedWard }]));
      return NextResponse.json({ success: true, complaints: complaints.map((complaint) => ({ ...complaint, status: complaint.status === "Submitted" ? "Reported" : complaint.status === "Resolved" ? "Cleaned" : complaint.status, assignedDriver: complaint.assignedDriverId ? drivers.get(complaint.assignedDriverId) || null : null })) });
    }
    if (!reference && !contactNumber) return NextResponse.json({ success: true, complaints: [] });
    if (!reference || !contactNumber) return NextResponse.json({ success: false, message: "A report reference and contact number are required." }, { status: 400 });
    const reports = [await getComplaintByReferenceAndContact(reference, contactNumber)].filter(Boolean);
    const driverAccounts = await getUsersByRole("driver");
    const drivers = new Map(driverAccounts.map(({ _id, name, vehicleNumber, assignedWard }) => [String(_id), { id: String(_id), name, vehicleNumber, assignedWard }]));

    return NextResponse.json({
      success: true,
      complaints: reports.map((complaint) => ({
        ...complaint,
        status: complaint.status === "Submitted" ? "Reported" : complaint.status === "Resolved" ? "Cleaned" : complaint.status,
        assignedDriver: complaint.assignedDriverId
          ? (drivers.get(complaint.assignedDriverId) ?? null)
          : null,
      })),
    });
  } catch (error) {
    console.error(
      "GET complaints error:",
      error?.name || "UnknownError",
      error?.code || "",
    );

    return NextResponse.json(
      { success: false, message: "Unable to fetch complaints." },
      { status: 500 },
    );
  }
}

export async function POST(request) {
  const session = await requireRole("citizen").catch(() => null);
  let uploadedImage;
  let complaintSaved = false;

  try {
    const formData = await request.formData();

    const reporterName = formData.get("reporterName");
    const contactNumber = formData.get("contactNumber");
    const city = formData.get("city");
    const area = formData.get("area");
    const ward = formData.get("ward");
    const title = formData.get("title");
    const category = formData.get("category");
    const description = formData.get("description");
    const severity = formData.get("severity");
    const latitude = formData.get("latitude");
    const longitude = formData.get("longitude");
    const accuracy = formData.get("accuracy");
    const capturedAt = formData.get("capturedAt");
    const photo = formData.get("photo");

    // Validate required fields
    if (
      typeof reporterName !== "string" ||
      typeof contactNumber !== "string" ||
      typeof city !== "string" ||
      typeof area !== "string" ||
      typeof ward !== "string" ||
      typeof title !== "string" ||
      typeof category !== "string" ||
      typeof description !== "string" ||
      typeof severity !== "string" ||
      typeof latitude !== "string" ||
      typeof longitude !== "string" ||
      typeof accuracy !== "string" ||
      typeof capturedAt !== "string" ||
      !photo ||
      typeof photo === "string"
    ) {
      return NextResponse.json(
        { success: false, message: "Please complete all required fields." },
        { status: 400 },
      );
    }

    if (
      !reporterName.trim() ||
      !contactNumber.trim() ||
      !city.trim() ||
      !area.trim() ||
      !ward.trim() ||
      !title.trim() ||
      !description.trim() ||
      title.length > 100 ||
      description.length > 1000
    ) {
      return NextResponse.json(
        { success: false, message: "Invalid complaint details." },
        { status: 400 },
      );
    }

    if (!ALLOWED_CATEGORIES.includes(category)) {
      return NextResponse.json(
        { success: false, message: "Invalid complaint category." },
        { status: 400 },
      );
    }

    if (!ALLOWED_SEVERITIES.includes(severity)) {
      return NextResponse.json(
        { success: false, message: "Invalid severity level." },
        { status: 400 },
      );
    }

    const drivers = await getUsersByRole("driver");
    const assignedWard = drivers.find(
      (driver) => normalizeWard(driver.assignedWard) === normalizeWard(ward),
    )?.assignedWard?.trim();

    if (!assignedWard) {
      return NextResponse.json(
        { success: false, message: "Choose a ward with an active driver." },
        { status: 400 },
      );
    }

    const lat = Number(latitude);
    const lng = Number(longitude);
    const locationAccuracy = Number(accuracy);
    const locationTimestamp = Number(capturedAt);

    if (
      !Number.isFinite(lat) ||
      !Number.isFinite(lng) ||
      lat < -90 ||
      lat > 90 ||
      lng < -180 ||
      lng > 180
    ) {
      return NextResponse.json(
        { success: false, message: "Invalid location coordinates." },
        { status: 400 },
      );
    }

    if (!Number.isFinite(locationAccuracy) || locationAccuracy < 0 || locationAccuracy > 150 || !Number.isFinite(locationTimestamp) || Date.now() - locationTimestamp > 2 * 60 * 1000 || locationTimestamp - Date.now() > 30 * 1000) {
      return NextResponse.json({ success: false, message: "Capture a fresh, accurate GPS location at the reported spot." }, { status: 400 });
    }

    const requestedCity = String(city).trim();
    const requestedArea = String(area).trim();
    const reverseResponse = await fetch(`${new URL(request.url).origin}/api/location/reverse?lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lng)}`, { cache: "no-store" });
    if (!reverseResponse.ok) {
      return NextResponse.json({ success: false, message: "We could not verify your location. Refresh GPS and try again." }, { status: 400 });
    }
    const reverseLocation = await reverseResponse.json();
    const matchesCity = reverseLocation.city && reverseLocation.city !== "Not available" && reverseLocation.city.toLowerCase() === requestedCity.toLowerCase();
    const detectedAreas = (reverseLocation.area || "").split(",").map((part) => part.trim().toLowerCase());
    const matchesArea = detectedAreas.includes(requestedArea.toLowerCase());
    if (!matchesCity || !matchesArea) {
      return NextResponse.json({ success: false, message: `The city and area must match your GPS location (${reverseLocation.city}, ${reverseLocation.area}).` }, { status: 400 });
    }

    if (!(photo instanceof File) || photo.size === 0) {
      return NextResponse.json(
        { success: false, message: "Please upload a valid photograph." },
        { status: 400 },
      );
    }

    if (!ALLOWED_IMAGE_TYPES.has(photo.type)) {
      return NextResponse.json(
        {
          success: false,
          message: "Only JPG, PNG and WebP images are allowed.",
        },
        { status: 400 },
      );
    }

    if (photo.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, message: "Image must be smaller than 5 MB." },
        { status: 400 },
      );
    }

    const imageBuffer = Buffer.from(await photo.arrayBuffer());
    uploadedImage = await uploadComplaintImage(imageBuffer);

    // Generate complaint record
    const complaint = {
      id: `CC-${Date.now()}-${randomUUID().slice(0, 6).toUpperCase()}`,
      citizenId: session?.id || null,
      reporterSessionId: session?.id || null,
      reporterName: session?.name || reporterName.trim(),
      contactNumber: contactNumber.trim(),
      city: city.trim(),
      area: area.trim(),
      ward: assignedWard,
      title: title.trim(),
      category,
      description: description.trim(),
      severity,
      status: "Reported",
      imageUrl: uploadedImage.secureUrl,
      beforePhoto: uploadedImage.secureUrl,
      location: {
        latitude: lat,
        longitude: lng,
      },
      assignedDriverId: null,
      resolutionImageUrl: null,
      afterPhoto: null,
      cleanedAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await saveComplaint(complaint);
    complaintSaved = true;

    return NextResponse.json(
      {
        success: true,
        message: "Spot reported successfully.",
        complaint,
      },
      { status: 201 },
    );
  } catch (error) {
    if (uploadedImage?.publicId && !complaintSaved) {
      try {
        await deleteComplaintImage(uploadedImage.publicId);
      } catch (cleanupError) {
        console.error(
          "POST complaint image cleanup error:",
          cleanupError?.name || "UnknownError",
          cleanupError?.http_code || "",
        );
      }
    }

    console.error(
      "POST complaint error:",
      error?.name || "UnknownError",
      error?.code || "",
    );

    return NextResponse.json(
      { success: false, message: "Unable to submit complaint." },
      { status: 500 },
    );
  }
}
