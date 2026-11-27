"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, MapPin } from "lucide-react";
import StatusBadge from "@/components/ui/StatusBadge";
import { ReportSkeleton } from "@/components/ui/Skeleton";
import { formatReportLocation } from "@/lib/report-location";

function badgeStatus(status) {
  if (["Resolved", "Cleaned"].includes(status)) return "resolved";
  if (["Submitted", "Reported", "Assigned"].includes(status)) return "pending";
  return "active";
}

function formatDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Date unavailable"
    : new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(date);
}

export default function RecentReports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/complaints?public=true", { cache: "no-store", signal: controller.signal })
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok) throw new Error(result.message || "Reports are temporarily unavailable.");
        setReports(result.complaints || []);
      })
      .catch((loadError) => { if (loadError.name !== "AbortError") setError(loadError.message); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, []);

  const resolved = reports.filter((report) => ["Resolved", "Cleaned"].includes(report.status)).length;

  return (
    <section className="section bg-civic-bg" aria-labelledby="recent-reports-heading">
      <div className="container">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className="eyebrow">Community progress</span>
            <h2 id="recent-reports-heading" className="mt-4 text-3xl font-extrabold text-civic-slate sm:text-4xl">Small reports. Visible results.</h2>
            <p className="mt-2 max-w-xl text-civic-body">See what neighbours have reported and how local teams are responding.</p>
          </div>
          <Link href="/map" className="secondary-btn">Explore public map <ArrowRight size={16} aria-hidden="true" /></Link>
        </div>
        <div className="mb-6 grid grid-cols-2 gap-3 sm:max-w-md">
          <div className="rounded-xl border border-civic-border bg-civic-surface p-4"><p className="m-0 text-sm text-civic-body">Community reports</p><strong className="mt-1 block text-2xl tabular-nums text-civic-slate">{loading ? "…" : reports.length}</strong></div>
          <div className="rounded-xl border border-civic-border bg-civic-surface p-4"><p className="m-0 text-sm text-civic-body">Resolved reports</p><strong className="mt-1 block text-2xl tabular-nums text-civic-green">{loading ? "…" : resolved}</strong></div>
        </div>
        {loading ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3" role="status" aria-label="Loading community reports"><ReportSkeleton /><ReportSkeleton /><ReportSkeleton /></div>
        ) : error ? (
          <p role="status" className="rounded-xl border border-civic-border bg-civic-surface p-5 text-civic-body">{error} <Link className="font-semibold text-civic-blue" href="/map">Open the public map</Link></p>
        ) : reports.length === 0 ? (
          <div className="rounded-xl border border-civic-border bg-civic-surface p-8 text-center"><h3 className="text-lg font-bold text-civic-slate">No public reports yet</h3><p className="text-civic-body">Be the first to share a spot that needs attention.</p><Link className="primary-btn mt-2" href="/citizen/complaints/new">Report an issue</Link></div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {reports.slice(0, 3).map((report) => (
              <article key={report.id} className="overflow-hidden rounded-xl border border-civic-border bg-civic-surface shadow-sm">
                <div className="relative h-44 bg-civic-blue-soft">{report.beforePhoto || report.imageUrl ? <Image src={report.beforePhoto || report.imageUrl} alt={`Reported spot: ${report.title}`} fill sizes="(max-width: 768px) 100vw, 33vw" unoptimized className="object-cover" /> : <div className="grid h-full place-items-center text-civic-blue"><MapPin size={24} aria-hidden="true" /></div>}</div>
                <div className="p-6">
                  <div className="flex items-center justify-between gap-3"><StatusBadge status={badgeStatus(report.status)}>{report.status === "Submitted" ? "Pending" : report.status === "Resolved" ? "Resolved" : report.status}</StatusBadge><time dateTime={report.createdAt} className="text-xs text-civic-muted">{formatDate(report.createdAt)}</time></div>
                  <span className="mt-3 inline-flex max-w-full rounded-full bg-civic-blue-soft px-2.5 py-1 text-xs font-semibold text-civic-blue">{report.category || "Community report"}</span>
                  <h3 className="mt-3 truncate text-lg font-bold text-civic-slate">{report.title}</h3>
                  <div className="mt-4 border-t border-civic-border pt-3">
                    <p className="m-0 flex items-start gap-2 text-sm text-civic-body">
                      <MapPin size={16} className="mt-0.5 shrink-0 text-civic-blue" aria-hidden="true" />
                      <span className="min-w-0 break-words">{formatReportLocation(report.area, report.city)}</span>
                    </p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
