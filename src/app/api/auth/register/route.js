import { NextResponse } from "next/server";
import { createUser, findUserByEmail } from "@/lib/server/complaints-store";
import { authCookie, createSessionToken, hashPassword } from "@/lib/server/auth";

export const runtime = "nodejs";

export async function POST(request) {
  let payload;
  try { payload = await request.json(); } catch { return NextResponse.json({ success: false, message: "Valid JSON is required." }, { status: 400 }); }
  const name = typeof payload?.name === "string" ? payload.name.trim() : "";
  const email = typeof payload?.email === "string" ? payload.email.trim().toLowerCase() : "";
  const password = typeof payload?.password === "string" ? payload.password : "";
  if (name.length < 2 || name.length > 100 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254 || password.length < 10 || password.length > 128) {
    return NextResponse.json({ success: false, message: "Enter your name, a valid email and a password with at least 10 characters." }, { status: 400 });
  }
  try {
    if (await findUserByEmail(email)) return NextResponse.json({ success: false, message: "An account with this email already exists." }, { status: 409 });
    const user = await createUser({ name, email, passwordHash: await hashPassword(password), role: "citizen" });
    const publicUser = { id: String(user._id), name: user.name, email: user.email, role: user.role, vehicleNumber: "", assignedWard: "" };
    const response = NextResponse.json({ success: true, user: publicUser, redirect: "/citizen/dashboard" }, { status: 201 });
    response.cookies.set(authCookie.name, createSessionToken(user), { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: authCookie.maxAge });
    return response;
  } catch (error) {
    if (error?.code === 11000) return NextResponse.json({ success: false, message: "An account with this email already exists." }, { status: 409 });
    console.error("Account registration error:", error?.name || "UnknownError");
    return NextResponse.json({ success: false, message: "Unable to create the account. Please try again." }, { status: 500 });
  }
}
