import { NextResponse } from "next/server";
import { findUserByEmail, findUserByPhone } from "@/lib/server/complaints-store";
import { authCookie, createSessionToken, verifyPassword } from "@/lib/server/auth";
import {
  normalizePhoneNumber,
  phoneFromStaffInternalEmail,
  staffPhoneInternalEmail,
} from "@/lib/phone";

const ROLE_ROUTES = { citizen: "/citizen/dashboard", admin: "/admin/dashboard", driver: "/driver/dashboard" };

export async function POST(request) {
  let payload;
  try { payload = await request.json(); } catch { return NextResponse.json({ success: false, message: "Valid JSON is required." }, { status: 400 }); }
  try {
    const identifier = typeof payload?.identifier === "string"
      ? payload.identifier.trim()
      : typeof payload?.email === "string"
        ? payload.email.trim()
        : "";
    const phone = identifier.includes("@") ? null : normalizePhoneNumber(identifier);
    const account = identifier.includes("@")
      ? await findUserByEmail(identifier.toLowerCase())
      : phone
        ? (await findUserByPhone(phone)) ||
          (await findUserByEmail(staffPhoneInternalEmail(phone)))
        : null;
    if (!account || !account.isActive || !(await verifyPassword(typeof payload?.password === "string" ? payload.password : "", account.passwordHash))) return NextResponse.json({ success: false, message: "Invalid email/phone or password." }, { status: 401 });
    const accountPhone = account.phone || phoneFromStaffInternalEmail(account.email);
    const user = {
      id: String(account._id),
      name: account.name,
      ...(accountPhone ? { phone: accountPhone } : { email: account.email }),
      role: account.role,
      vehicleNumber: account.vehicleNumber || "",
      assignedWard: account.assignedWard || "",
    };
    const response = NextResponse.json({ success: true, user, redirect: ROLE_ROUTES[user.role] });
    response.cookies.set(authCookie.name, createSessionToken(user), { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: authCookie.maxAge });
    return response;
  } catch (error) {
    console.error("Sign in error:", error?.name || "UnknownError");
    return NextResponse.json({ success: false, message: "Unable to sign in. Please try again." }, { status: 500 });
  }
}
