const statusClasses = {
  resolved: "bg-civic-green-soft text-civic-green",
  pending: "bg-civic-amber-soft text-civic-amber",
  urgent: "bg-rose-50 text-civic-rose",
  active: "bg-civic-blue-tint text-civic-blue",
};

export default function StatusBadge({ children, status = "active", className = "" }) {
  return <span className={`inline-flex w-max items-center rounded-full px-2.5 py-1 text-xs font-semibold ${statusClasses[status] || statusClasses.active} ${className}`}>{children}</span>;
}
