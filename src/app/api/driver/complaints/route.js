import { NextResponse } from "next/server";

import { getComplaints, updateComplaint } from "../../../../../lib/server/complaints-store";
import { DEMO_USERS } from "../../../../lib/demo-user";

export const runtime = "nodejs";

function isDemoDriver(driverId) {
  return DEMO_USERS.some(
    (account) => account.id === driverId && account.role === "driver",
  );
}

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

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const driverId = searchParams.get("driverId");
  const driver = DEMO_USERS.find(
    (account) => account.id === driverId && account.role === "driver",
  );

  if (!driver) {
    return NextResponse.json(
      { success: false, message: "Driver access is required." },
      { status: 403 },
    );
  }

  try {
    const complaints = await getComplaints();

    return NextResponse.json({
      success: true,
      driver: {
        id: driver.id,
        name: driver.name,
        vehicleNumber: driver.vehicleNumber,
        assignedWard: driver.assignedWard,
      },
      tasks: complaints.filter(
        (complaint) => complaint.assignedDriverId === driverId,
      ),
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

  if (!isDemoDriver(payload.driverId)) {
    return NextResponse.json(
      { success: false, message: "Driver access is required." },
      { status: 403 },
    );
  }

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
    const task = complaints.find(
      (complaint) => complaint.id === payload.complaintId,
    );

    if (!task || task.assignedDriverId !== payload.driverId) {
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
          complaint.assignedDriverId === payload.driverId &&
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

    const nextStatusByCurrentStatus = {
      Assigned: "In Progress",
      "In Progress": "Resolved",
    };

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

    if (
      hasStatus &&
      payload.status === "In Progress" &&
      !hasDriverLocation
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Share your current location before starting collection.",
        },
        { status: 400 },
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
      updates.driverLocation =
        payload.status === "Resolved" ? null : driverLocation;
    } else {
      updates.driverLocation = driverLocation;
    }

    const updatedTask = await updateComplaint(task.id, updates);

    if (!updatedTask) {
      return NextResponse.json(
        { success: false, message: "Assigned task not found." },
        { status: 404 },
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
