export function normalizeWard(value) {
  return typeof value === "string"
    ? value
        .trim()
        .replace(/\s+/g, " ")
        .toLowerCase()
        .replace(/^ward(?:\s+#?\s*|#\s*)/, "")
    : "";
}
