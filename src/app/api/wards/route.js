import { NextResponse } from "next/server";

import { getUsersByRole } from "@/lib/server/complaints-store";
import { normalizeWard } from "@/lib/ward";

export const runtime = "nodejs";

export async function GET() {
  try {
    const drivers = await getUsersByRole("driver");
    const wards = new Map();

    for (const driver of drivers) {
      const ward = typeof driver.assignedWard === "string" ? driver.assignedWard.trim() : "";
      const key = normalizeWard(ward);
      if (key && !wards.has(key)) wards.set(key, ward);
    }

    return NextResponse.json({
      success: true,
      wards: [...wards.values()].sort((first, second) =>
        first.localeCompare(second, undefined, { numeric: true, sensitivity: "base" }),
      ),
    });
  } catch (error) {
    console.error("GET available wards error:", error?.name || "UnknownError");

    return NextResponse.json(
      { success: false, message: "Unable to load available wards." },
      { status: 500 },
    );
  }
}
