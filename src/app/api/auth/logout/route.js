import { NextResponse } from "next/server";
import { authCookie } from "@/lib/server/auth";

export async function POST() {
  const response = NextResponse.json({ success: true });
  response.cookies.set(authCookie.name, "", { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 0 });
  return response;
}
