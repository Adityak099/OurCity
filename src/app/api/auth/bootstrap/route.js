import { NextResponse } from "next/server";
import {
  createUser,
  findUserByEmail,
  getUsersByRole,
} from "@/lib/server/complaints-store";
import {
  authCookie,
  createSessionToken,
  hashPassword,
} from "@/lib/server/auth";

export const runtime = "nodejs";

export async function POST(request) {
  const expectedKey = process.env.AUTH_BOOTSTRAP_KEY;
  const suppliedKey = request.headers.get("x-bootstrap-key");
  if (
    !expectedKey ||
    expectedKey.length < 32 ||
    !suppliedKey ||
    suppliedKey.length !== expectedKey.length ||
    !Buffer.from(suppliedKey).equals(Buffer.from(expectedKey))
  ) {
    return NextResponse.json(
      {
        success: false,
        message: "Bootstrap is unavailable or the key is invalid.",
      },
      { status: 403 },
    );
  }
  let payload;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, message: "Valid JSON is required." },
      { status: 400 },
    );
  }
  const name = typeof payload?.name === "string" ? payload.name.trim() : "";
  const email =
    typeof payload?.email === "string"
      ? payload.email.trim().toLowerCase()
      : "";
  const password =
    typeof payload?.password === "string" ? payload.password : "";
  if (
    name.length < 2 ||
    name.length > 100 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
    password.length < 10 ||
    password.length > 128
  )
    return NextResponse.json(
      {
        success: false,
        message:
          "Enter a valid name, email and a password of at least 10 characters.",
      },
      { status: 400 },
    );
  try {
    const admins = await getUsersByRole("admin");
    if (admins.length)
      return NextResponse.json(
        {
          success: false,
          message:
            "An admin account already exists. Bootstrap is permanently closed.",
        },
        { status: 409 },
      );
    if (await findUserByEmail(email))
      return NextResponse.json(
        {
          success: false,
          message: "An account with this email already exists.",
        },
        { status: 409 },
      );
    const user = await createUser({
      name,
      email,
      passwordHash: await hashPassword(password),
      role: "admin",
    });
    const publicUser = {
      id: String(user._id),
      name: user.name,
      email: user.email,
      role: user.role,
      vehicleNumber: "",
      assignedWard: "",
    };
    const response = NextResponse.json(
      { success: true, user: publicUser },
      { status: 201 },
    );
    response.cookies.set(authCookie.name, createSessionToken(publicUser), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: authCookie.maxAge,
    });
    return response;
  } catch (error) {
    if (error?.code === 11000)
      return NextResponse.json(
        {
          success: false,
          message: "An account with this email already exists.",
        },
        { status: 409 },
      );
    console.error("Admin bootstrap error:", error?.name || "UnknownError");
    return NextResponse.json(
      { success: false, message: "Unable to bootstrap the first admin." },
      { status: 500 },
    );
  }
}
