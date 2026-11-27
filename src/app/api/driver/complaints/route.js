import { NextResponse } from "next/server";

import { claimReportedSpot, getComplaints, getUserById, updateComplaint } from "@/lib/server/complaints-store";
import { deleteComplaintImage, uploadComplaintImage } from "@/lib/server/cloudinary";
import { requireRole } from "@/lib/server/auth";
import { normalizeWard } from "@/lib/ward";

export const runtime = "nodejs";

function normalizeDriverLocation(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  const { latitude, longitude, accuracy } = value;

  if (
    typeof latitude !== "number" ||
    !Number.isFinite(latitude) ||
    latitude < -90 ||
    latitude > 90 ||
    typeof longitude !== "number" ||
    !Number.isFinite(longitude) ||
    longitude < -180 ||
    longitude > 180 ||
    (accuracy !== undefined &&
      (typeof accuracy !== "number" ||
        !Number.isFinite(accuracy) ||
        accuracy < 0))
  ) {
    return null;
  }

  return {
    latitude,
    longitude,
    ...(accuracy === undefined ? {} : { accuracy }),
    updatedAt: new Date().toISOString(),
  };
}

export async function GET() {
  const session = await requireRole("driver");
  const driver = session ? await getUserById(session.id) : null;

  if (!driver || !driver.isActive) {
    return NextResponse.json(
      { success: false, message: "Driver access is required." },
      { status: 403 },
    );
  }
  if (!normalizeWard(driver.assignedWard)) {
    return NextResponse.json(
      { success: false, message: "Your driver account has no assigned ward. Ask an administrator to assign one." },
      { status: 409 },
    );
  }

  try {
    const complaints = await getComplaints();
    const driverId = String(driver._id);
    const driverWard = normalizeWard(driver.assignedWard);
    const tasks = complaints
      .filter((complaint) => {
        if (complaint.assignedDriverId === driverId) return true;
        if (normalizeWard(complaint.ward) !== driverWard) return false;
        if (complaint.assignedDriverId) {
          return false;
        }
        return ["Reported", "Submitted", "Assigned"].includes(complaint.status);
      })
      .map((complaint) => ({
        ...complaint,
        status:
          complaint.status === "Submitted"
            ? "Reported"
            : complaint.status === "Resolved"
              ? "Cleaned"
              : complaint.status,
      }));

    return NextResponse.json({
      success: true,
      driver: {
        id: String(driver._id),
        name: driver.name,
        vehicleNumber: driver.vehicleNumber,
        assignedWard: driver.assignedWard,
      },
      tasks,
    });
  } catch (error) {
    console.error(
      "GET driver tasks error:",
      error?.name || "UnknownError",
      error?.code || "",
    );

    return NextResponse.json(
      { success: false, message: "Unable to load your assigned tasks." },
      { status: 500 },
    );
  }
}

export async function PATCH(request) {
  const contentType = request.headers.get("content-type") || "";
  const session = await requireRole("driver");
  if (!session) return NextResponse.json({ success: false, message: "Driver access is required." }, { status: 403 });
  if (contentType.includes("multipart/form-data")) {
    const form = await request.formData();
    const driverId = session.id;
    const complaintId = form.get("complaintId");
    const photo = form.get("afterPhoto");
    if (!session || session.id !== driverId || typeof complaintId !== "string" || !(photo instanceof File) || photo.size === 0 || photo.size > 5 * 1024 * 1024 || !["image/jpeg", "image/png", "image/webp"].includes(photo.type)) {
      return NextResponse.json({ success: false, message: "Valid driver, spot and after-photo are required." }, { status: 400 });
    }
    let uploaded;
    try {
      const task = (await getComplaints()).find((item) => item.id === complaintId);
      if (!task || task.assignedDriverId !== driverId || task.status !== "In Progress") return NextResponse.json({ success: false, message: "An active spot claimed by this driver is required." }, { status: 409 });
      uploaded = await uploadComplaintImage(Buffer.from(await photo.arrayBuffer()));
      const updated = await updateComplaint(task.id, { status: "Cleaned", afterPhoto: uploaded.secureUrl, resolutionImageUrl: uploaded.secureUrl, cleanedAt: new Date().toISOString(), driverLocation: null });
      return NextResponse.json({ success: true, task: updated });
    } catch (error) {
      if (uploaded?.publicId) await deleteComplaintImage(uploaded.publicId).catch(() => {});
      console.error("POST driver after-photo error:", error?.name || "UnknownError");
      return NextResponse.json({ success: false, message: "Unable to save after-photo." }, { status: 500 });
    }
  }
  let payload;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, message: "A valid JSON request is required." },
      { status: 400 },
    );
  }

  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return NextResponse.json(
      { success: false, message: "A valid task update is required." },
      { status: 400 },
    );
  }

  const driverId = session.id;

  if (typeof payload.complaintId !== "string" || !payload.complaintId.trim()) {
    return NextResponse.json(
      { success: false, message: "A task ID is required." },
      { status: 400 },
    );
  }

  const hasStatus = Object.hasOwn(payload, "status");
  const hasDriverLocation = Object.hasOwn(payload, "driverLocation");

  if (!hasStatus && !hasDriverLocation) {
    return NextResponse.json(
      { success: false, message: "No task updates were provided." },
      { status: 400 },
    );
  }

  const driverLocation = hasDriverLocation
    ? normalizeDriverLocation(payload.driverLocation)
    : null;

  if (hasDriverLocation && !driverLocation) {
    return NextResponse.json(
      { success: false, message: "A valid driver location is required." },
      { status: 400 },
    );
  }

  try {
    const complaints = await getComplaints();
    const spot = complaints.find((item) => item.id === payload.complaintId);
    const driver = hasStatus ? await getUserById(driverId) : null;
    const driverWard = normalizeWard(driver?.assignedWard);
    const isUnclaimedReport =
      spot &&
      ["Reported", "Submitted"].includes(spot.status) &&
      !spot.assignedDriverId;
    const isAssignedToDriver =
      spot?.status === "Assigned" && spot.assignedDriverId === driverId;

    if (
      hasStatus &&
      payload.status === "In Progress" &&
      (!driver?.isActive ||
        !driverWard ||
        !spot ||
        normalizeWard(spot.ward) !== driverWard ||
        (!isUnclaimedReport && !isAssignedToDriver))
    ) {
      return NextResponse.json(
        { success: false, message: "This report is no longer available in your assigned ward." },
        { status: 409 },
      );
    }
    const task = complaints.find(
      (complaint) => complaint.id === payload.complaintId,
    );

    if (!task || (task.assignedDriverId && task.assignedDriverId !== driverId)) {
      return NextResponse.json(
        { success: false, message: "Assigned task not found." },
        { status: 404 },
      );
    }

    if (
      hasStatus &&
      payload.status === "In Progress" &&
      complaints.some(
        (complaint) =>
          complaint.assignedDriverId === driverId &&
          complaint.status === "In Progress" &&
          complaint.id !== task.id,
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Complete your active collection before starting another.",
        },
        { status: 409 },
      );
    }

    const nextStatusByCurrentStatus = { Reported: "In Progress", Submitted: "In Progress", Assigned: "In Progress" };

    if (
      hasStatus &&
      payload.status !== nextStatusByCurrentStatus[task.status]
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            task.status === "Resolved"
              ? "This task is already complete."
              : "This task cannot move to the requested status.",
        },
        { status: 409 },
      );
    }

    if (!hasStatus && task.status !== "In Progress") {
      return NextResponse.json(
        {
          success: false,
          message: "Live location can only be updated during an active task.",
        },
        { status: 409 },
      );
    }

    const updates = {};

    if (hasStatus) {
      updates.status = payload.status;
      updates.assignedDriverId = driverId;
      updates.driverName = session.name;
      updates.driverLocation = driverLocation;
    } else {
      updates.driverLocation = driverLocation;
    }

    const updatedTask = hasStatus && ["Reported", "Submitted"].includes(task.status) && !task.assignedDriverId
      ? await claimReportedSpot(task.id, driverId, session.name, driverLocation, task.ward)
      : await updateComplaint(task.id, updates);

    if (!updatedTask) {
      return NextResponse.json(
        { success: false, message: "This report was already accepted by another driver." },
        { status: 409 },
      );
    }

    return NextResponse.json({ success: true, task: updatedTask });
  } catch (error) {
    console.error(
      "PATCH driver task error:",
      error?.name || "UnknownError",
      error?.code || "",
    );

    return NextResponse.json(
      { success: false, message: "Unable to update this task." },
      { status: 500 },
    );
  }
}
