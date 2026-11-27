import { NextResponse } from "next/server";
import { createUser, findUserByPhone, getUsersByRole } from "@/lib/server/complaints-store";
import { hashPassword, requireRole } from "@/lib/server/auth";
import { normalizePhoneNumber, staffPhoneInternalEmail } from "@/lib/phone";

export const runtime = "nodejs";

export async function GET() {
  if (!(await requireRole("admin"))) return NextResponse.json({ success: false, message: "Admin access is required." }, { status: 403 });
  try {
    const [drivers, admins] = await Promise.all([getUsersByRole("driver"), getUsersByRole("admin")]);
    const users = [...drivers, ...admins].map(({ _id, name, phone, role, vehicleNumber, assignedWard }) => ({ id: String(_id), name, phone: phone || "", role, vehicleNumber, assignedWard }));
    return NextResponse.json({ success: true, users }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Admin user list error:", error?.name || "UnknownError");
    return NextResponse.json({ success: false, message: "Unable to load role accounts." }, { status: 500 });
  }
}

export async function POST(request) {
  if (!(await requireRole("admin"))) return NextResponse.json({ success: false, message: "Admin access is required." }, { status: 403 });
  let payload;
  try { payload = await request.json(); } catch { return NextResponse.json({ success: false, message: "Valid JSON is required." }, { status: 400 }); }
  const name = typeof payload?.name === "string" ? payload.name.trim() : "";
  const rawPhone = typeof payload?.phone === "string" ? payload.phone.trim() : "";
  const phone = normalizePhoneNumber(rawPhone);
  const password = typeof payload?.password === "string" ? payload.password : "";
  const role = payload?.role;
  const vehicleNumber = typeof payload?.vehicleNumber === "string" ? payload.vehicleNumber.trim() : "";
  const assignedWard = typeof payload?.assignedWard === "string" ? payload.assignedWard.trim() : "";
  if (!phone || rawPhone.length > 24) {
    return NextResponse.json({ success: false, message: "Enter a valid phone number with 8–15 digits." }, { status: 400 });
  }
  if (name.length < 2 || name.length > 100 || password.length < 10 || password.length > 128 || !["admin", "driver"].includes(role) || (role === "driver" && (!vehicleNumber || vehicleNumber.length > 40 || !assignedWard || assignedWard.length > 100))) {
    return NextResponse.json({ success: false, message: "Enter valid account details. Passwords must be at least 10 characters." }, { status: 400 });
  }
  try {
    if (await findUserByPhone(phone)) return NextResponse.json({ success: false, message: "An account with this phone number already exists." }, { status: 409 });
    // Keep the legacy unique email field populated without exposing a false contact address.
    const internalEmail = staffPhoneInternalEmail(phone);
    const user = await createUser({ name, email: internalEmail, phone, passwordHash: await hashPassword(password), role, vehicleNumber, assignedWard });
    if (user.phone !== phone) throw new Error("Staff phone number was not persisted.");
    return NextResponse.json({ success: true, user: { id: String(user._id), name: user.name, phone: user.phone, role: user.role, vehicleNumber: user.vehicleNumber, assignedWard: user.assignedWard } }, { status: 201 });
  } catch (error) {
    if (error?.code === 11000) return NextResponse.json({ success: false, message: "An account with this phone number already exists." }, { status: 409 });
    console.error("Admin role account creation error:", error?.name || "UnknownError");
    return NextResponse.json({ success: false, message: "Unable to create the role account." }, { status: 500 });
  }
}
