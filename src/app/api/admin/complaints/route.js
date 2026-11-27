import { NextResponse } from "next/server";

import { getComplaints, getUsersByRole, updateComplaint } from "@/lib/server/complaints-store";
import { requireRole } from "@/lib/server/auth";

export const runtime = "nodejs";

export async function GET(request) {
  const admin = await requireRole("admin");
  if (!admin) {
    return NextResponse.json(
      { success: false, message: "Admin access is required." },
      { status: 403 },
    );
  }

  try {
    const [complaints, driverAccounts] = await Promise.all([getComplaints(), getUsersByRole("driver")]);
    const drivers = driverAccounts.map(({ _id, name, vehicleNumber, assignedWard }) => ({ id: String(_id), name, vehicleNumber, assignedWard }));

    const normalized = complaints.map((item) => ({ ...item, status: item.status === "Submitted" ? "Reported" : item.status === "Resolved" ? "Cleaned" : item.status }));
    const areas = Object.values(normalized.reduce((map, item) => { const key = `${item.city || "Unknown"}|${item.area || "Unknown"}`; map[key] ||= { city: item.city || "Unknown", area: item.area || "Unknown", total: 0, reported: 0, inProgress: 0, cleaned: 0 }; map[key].total++; if (["Reported", "Submitted"].includes(item.status)) map[key].reported++; if (item.status === "In Progress") map[key].inProgress++; if (["Cleaned", "Resolved"].includes(item.status)) map[key].cleaned++; return map; }, {}));
    return NextResponse.json({ success: true, complaints: normalized, drivers, areas });
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
  if (!(await requireRole("admin"))) {
    return NextResponse.json(
      { success: false, message: "Admin access is required." },
      { status: 403 },
    );
  }

  let payload;
  try { payload = await request.json(); } catch { return NextResponse.json({ success: false, message: "Valid JSON is required." }, { status: 400 }); }
  if (typeof payload?.complaintId !== "string" || typeof payload.assignedDriverId !== "string") return NextResponse.json({ success: false, message: "A report and driver are required." }, { status: 400 });
  try {
    const existing = (await getComplaints()).find((item) => item.id === payload.complaintId);
    if (!existing) return NextResponse.json({ success: false, message: "Report not found." }, { status: 404 });
    if (["In Progress", "Resolved", "Cleaned"].includes(existing.status)) return NextResponse.json({ success: false, message: "An active or completed report cannot be reassigned." }, { status: 409 });
    const driverAccounts = await getUsersByRole("driver");
    const driver = payload.assignedDriverId ? driverAccounts.find((item) => String(item._id) === payload.assignedDriverId) : null;
    if (payload.assignedDriverId && !driver) return NextResponse.json({ success: false, message: "Select an active driver account." }, { status: 400 });
    const complaint = await updateComplaint(payload.complaintId, { assignedDriverId: driver ? String(driver._id) : null, driverName: driver?.name || null, status: driver ? "Assigned" : "Reported" });
    if (!complaint) return NextResponse.json({ success: false, message: "Report not found." }, { status: 404 });
    return NextResponse.json({ success: true, complaint: { ...complaint, status: complaint.status === "Submitted" ? "Reported" : complaint.status } });
  } catch (error) {
    console.error("Admin report assignment error:", error?.name || "UnknownError");
    return NextResponse.json({ success: false, message: "Unable to update this report." }, { status: 500 });
  }
}
