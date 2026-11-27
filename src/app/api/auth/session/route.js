import { NextResponse } from "next/server";
import { getSession } from "@/lib/server/auth";

export async function GET() {
  try { return NextResponse.json({ success: true, user: await getSession() }, { headers: { "Cache-Control": "no-store" } }); }
  catch (error) { console.error("Session lookup error:", error?.name || "UnknownError"); return NextResponse.json({ success: false, user: null, message: "Session service is unavailable." }, { status: 503, headers: { "Cache-Control": "no-store" } }); }
}
