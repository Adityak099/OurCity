export default function Skeleton({ className = "" }) {
  return <div aria-hidden="true" className={`animate-pulse rounded-lg bg-civic-border/70 ${className}`} />;
}

export function ReportSkeleton() {
  return <div className="grid gap-4 rounded-xl border border-civic-border bg-civic-surface p-4 sm:grid-cols-[180px_minmax(0,1fr)]"><Skeleton className="h-36" /><div className="grid content-start gap-3"><Skeleton className="h-5 w-1/3" /><Skeleton className="h-7 w-2/3" /><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-1/2" /></div></div>;
}
