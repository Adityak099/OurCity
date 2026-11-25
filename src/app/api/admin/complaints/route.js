import { NextResponse } from "next/server";

import {
  getComplaints,
  updateComplaint,
} from "../../../../../lib/server/complaints-store";
import { DEMO_USERS } from "../../../../lib/demo-user";

export const runtime = "nodejs";

const COMPLAINT_STATUSES = [
  "Submitted",
  "Assigned",
  "In Progress",
  "Resolved",
];

const STATUS_TRANSITIONS = {
  Submitted: ["Submitted", "Assigned"],
  Assigned: ["Submitted", "Assigned"],
  "In Progress": ["In Progress"],
  Resolved: ["Resolved"],
};

function isDemoAdmin(adminId) {
  return DEMO_USERS.some(
    (account) => account.id === adminId && account.role === "admin",
  );
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const adminId = searchParams.get("adminId");

  if (!isDemoAdmin(adminId)) {
    return NextResponse.json(
      { success: false, message: "Admin access is required." },
      { status: 403 },
    );
  }

  try {
    const [complaints, drivers] = await Promise.all([
      getComplaints(),
      Promise.resolve(
        DEMO_USERS.filter((account) => account.role === "driver").map(
          ({ id, name, vehicleNumber, assignedWard }) => ({
            id,
            name,
            vehicleNumber,
            assignedWard,
          }),
        ),
      ),
    ]);

    return NextResponse.json({ success: true, complaints, drivers });
  } catch (error) {
    console.error(
      "GET admin complaints error:",
      error?.name || "UnknownError",
      error?.code || "",
    );

    return NextResponse.json(
      { success: false, message: "Unable to load admin dashboard data." },
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
      { success: false, message: "A valid complaint update is required." },
      { status: 400 },
    );
  }

  if (!isDemoAdmin(payload.adminId)) {
    return NextResponse.json(
      { success: false, message: "Admin access is required." },
      { status: 403 },
    );
  }

  if (typeof payload.complaintId !== "string" || !payload.complaintId.trim()) {
    return NextResponse.json(
      { success: false, message: "A complaint ID is required." },
      { status: 400 },
    );
  }

  const hasStatus = Object.hasOwn(payload, "status");
  const hasAssignment = Object.hasOwn(payload, "assignedDriverId");

  if (!hasStatus && !hasAssignment) {
    return NextResponse.json(
      { success: false, message: "No complaint updates were provided." },
      { status: 400 },
    );
  }

  if (hasStatus && !COMPLAINT_STATUSES.includes(payload.status)) {
    return NextResponse.json(
      { success: false, message: "Invalid complaint status." },
      { status: 400 },
    );
  }

  const drivers = DEMO_USERS.filter((account) => account.role === "driver");

  if (
    hasAssignment &&
    payload.assignedDriverId !== null &&
    !drivers.some((driver) => driver.id === payload.assignedDriverId)
  ) {
    return NextResponse.json(
      { success: false, message: "Select a valid driver." },
      { status: 400 },
    );
  }

  try {
    const complaints = await getComplaints();
    const currentComplaint = complaints.find(
      (complaint) => complaint.id === payload.complaintId,
    );

    if (!currentComplaint) {
      return NextResponse.json(
        { success: false, message: "Complaint not found." },
        { status: 404 },
      );
    }

    if (currentComplaint.status === "Resolved") {
      return NextResponse.json(
        { success: false, message: "Resolved complaints cannot be changed." },
        { status: 409 },
      );
    }

    if (
      currentComplaint.status === "In Progress" &&
      hasAssignment &&
      payload.assignedDriverId !== currentComplaint.assignedDriverId
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "An active collection cannot be reassigned.",
        },
        { status: 409 },
      );
    }

    let assignedDriverId = hasAssignment
      ? payload.assignedDriverId
      : currentComplaint.assignedDriverId;
    let status = hasStatus ? payload.status : currentComplaint.status;

    if (!hasStatus && hasAssignment) {
      if (currentComplaint.status === "Submitted" && assignedDriverId) {
        status = "Assigned";
      } else if (currentComplaint.status === "Assigned" && !assignedDriverId) {
        status = "Submitted";
      }
    }

    if (!STATUS_TRANSITIONS[currentComplaint.status]?.includes(status)) {
      return NextResponse.json(
        {
          success: false,
          message: `A complaint cannot move from ${currentComplaint.status} to ${status}.`,
        },
        { status: 409 },
      );
    }

    if (
      ["Assigned", "In Progress", "Resolved"].includes(status) &&
      !assignedDriverId
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Assign a driver before advancing the complaint status.",
        },
        { status: 400 },
      );
    }

    if (status === "Submitted") assignedDriverId = null;

    const complaint = await updateComplaint(payload.complaintId, {
      status,
      assignedDriverId,
    });

    if (!complaint) {
      return NextResponse.json(
        { success: false, message: "Complaint not found." },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true, complaint });
  } catch (error) {
    console.error(
      "PATCH admin complaint error:",
      error?.name || "UnknownError",
      error?.code || "",
    );

    return NextResponse.json(
      { success: false, message: "Unable to update this complaint." },
      { status: 500 },
    );
  }
}
