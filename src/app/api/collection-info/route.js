import { NextResponse } from "next/server";
import { deleteCollectionInfo, getCollectionInfo, saveCollectionInfo } from "@/lib/server/complaints-store";
import { requireRole } from "@/lib/server/auth";

export const runtime = "nodejs";

export async function GET() {
  try { return NextResponse.json({ success: true, collectionInfo: await getCollectionInfo() }, { headers: { "Cache-Control": "no-store" } }); }
  catch (error) { console.error("collection info load:", error?.name || "UnknownError"); return NextResponse.json({ success: false, message: "Unable to load collection details." }, { status: 500 }); }
}

export async function POST(request) {
  if (!(await requireRole("admin"))) return NextResponse.json({ success: false, message: "Admin access is required." }, { status: 403 });
  let data;
  try { data = await request.json(); } catch { return NextResponse.json({ success: false, message: "Valid JSON is required." }, { status: 400 }); }
  const fields = ["city", "area", "driverName", "contactNumber", "collectionTiming"];
  if (fields.some((field) => typeof data?.[field] !== "string" || !data[field].trim()) || ["city", "area", "driverName", "contactNumber", "collectionTiming"].some((field) => data[field].length > 120)) return NextResponse.json({ success: false, message: "Complete the required collection details." }, { status: 400 });
  try { const saved = await saveCollectionInfo(data); return NextResponse.json({ success: true, collectionInfo: saved }, { status: 201 }); }
  catch (error) { console.error("collection info save:", error?.name || "UnknownError"); return NextResponse.json({ success: false, message: "Unable to save collection details." }, { status: 500 }); }
}

export async function DELETE(request) {
  if (!(await requireRole("admin"))) return NextResponse.json({ success: false, message: "Admin access is required." }, { status: 403 });
  const id = new URL(request.url).searchParams.get("id");
  if (!id) return NextResponse.json({ success: false, message: "A record ID is required." }, { status: 400 });
  try { await deleteCollectionInfo(id); return NextResponse.json({ success: true }); }
  catch (error) { console.error("collection info delete:", error?.name || "UnknownError"); return NextResponse.json({ success: false, message: "Unable to delete the collection record." }, { status: 500 }); }
}
