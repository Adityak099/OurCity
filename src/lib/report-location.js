export function formatReportLocation(area, city) {
  const parts = [area, city]
    .filter((part) => typeof part === "string")
    .map((part) => part.trim())
    .filter(Boolean);

  return parts.length ? parts.join(", ") : "Location details unavailable";
}
