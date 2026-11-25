import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";

import {
  saveComplaint,
  getComplaintsByCitizen,
} from "../../../../lib/server/complaints-store";
import {
  deleteComplaintImage,
  uploadComplaintImage,
} from "../../../../lib/server/cloudinary";
import { DEMO_USERS } from "../../../lib/demo-user";

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
    const citizenId = searchParams.get("citizenId");

    if (!citizenId) {
      return NextResponse.json(
        { success: false, message: "Citizen ID is required." },
        { status: 400 },
      );
    }

    const complaints = await getComplaintsByCitizen(citizenId);
    const drivers = new Map(
      DEMO_USERS.filter((account) => account.role === "driver").map(
        ({ id, name, vehicleNumber, assignedWard }) => [
          id,
          { id, name, vehicleNumber, assignedWard },
        ],
      ),
    );

    return NextResponse.json({
      success: true,
      complaints: complaints.map((complaint) => ({
        ...complaint,
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
  let uploadedImage;
  let complaintSaved = false;

  try {
    const formData = await request.formData();

    const citizenId = formData.get("citizenId");
    const title = formData.get("title");
    const category = formData.get("category");
    const description = formData.get("description");
    const severity = formData.get("severity");
    const latitude = formData.get("latitude");
    const longitude = formData.get("longitude");
    const photo = formData.get("photo");

    // Validate required fields
    if (
      typeof citizenId !== "string" ||
      typeof title !== "string" ||
      typeof category !== "string" ||
      typeof description !== "string" ||
      typeof severity !== "string" ||
      typeof latitude !== "string" ||
      typeof longitude !== "string" ||
      !photo ||
      typeof photo === "string"
    ) {
      return NextResponse.json(
        { success: false, message: "Please complete all required fields." },
        { status: 400 },
      );
    }

    if (
      !citizenId.trim() ||
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

    const lat = Number(latitude);
    const lng = Number(longitude);

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
      citizenId: citizenId.trim(),
      title: title.trim(),
      category,
      description: description.trim(),
      severity,
      status: "Submitted",
      imageUrl: uploadedImage.secureUrl,
      location: {
        latitude: lat,
        longitude: lng,
      },
      assignedDriverId: null,
      resolutionImageUrl: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await saveComplaint(complaint);
    complaintSaved = true;

    return NextResponse.json(
      {
        success: true,
        message: "Complaint submitted successfully.",
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
