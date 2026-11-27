"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import dynamic from "next/dynamic";
import { List, MapPin, RefreshCw, Search, Map as MapIcon, ClipboardList } from "lucide-react";
import StatusBadge from "@/components/ui/StatusBadge";
import { ReportSkeleton } from "@/components/ui/Skeleton";
import { formatReportLocation } from "@/lib/report-location";

const ReportMapClient = dynamic(() => import("./ReportMap"), {
  ssr: false,
  loading: () => <div className="public-map-canvas map-loading" role="status">Loading map…</div>,
});

const statusFilters = ["All", "Pending", "Resolved"];

function isResolved(status) {
  return ["Resolved", "Cleaned"].includes(status);
}

function formatDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Date unavailable"
    : new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

export default function PublicMap() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("All");
  const [category, setCategory] = useState("All categories");
  const [query, setQuery] = useState("");
  const [mobileView, setMobileView] = useState("map");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/complaints?public=true", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Unable to load reports.");
      setReports(data.complaints || []);
      setError("");
    } catch (loadError) {
      setError(loadError.message || "Unable to load reports.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const categories = useMemo(
    () => [...new Set(reports.map((report) => report.category).filter(Boolean))].sort(),
    [reports],
  );
  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return reports.filter((report) => {
      const matchesStatus = status === "All" || (status === "Resolved" ? isResolved(report.status) : !isResolved(report.status));
      const matchesCategory = category === "All categories" || report.category === category;
      const matchesQuery = !normalizedQuery || `${report.city} ${report.area} ${report.title}`.toLowerCase().includes(normalizedQuery);
      return matchesStatus && matchesCategory && matchesQuery;
    });
  }, [category, query, reports, status]);

  return (
    <main id="main-content" className="my-complaints-page public-map-page">
      <div className="container my-complaints-container">
        <Link href="/" className="complaint-back"><MapPin size={16} aria-hidden="true" /> OurCity</Link>
        <div className="my-complaints-heading">
          <div>
            <span className="eyebrow"><MapPin size={14} aria-hidden="true" /> Public transparency</span>
            <h1>Clean City Map</h1>
            <p>Follow each reported spot from report to cleanup.</p>
          </div>
          <button className="refresh-button" onClick={load} disabled={loading} type="button"><RefreshCw size={15} aria-hidden="true" /> Refresh</button>
        </div>

        <section className="public-reports-section" aria-label="Public reports">
          <div className="public-map-toolbar">
            <label className="public-map-search">
              <Search size={17} aria-hidden="true" />
              <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search city, area or report…" aria-label="Search map reports" />
            </label>
            <div className="status-filter-pills" role="group" aria-label="Filter reports by status">
              {statusFilters.map((item) => (
                <button key={item} type="button" className={`filter-pill${status === item ? ` filter-pill-${item.toLowerCase()}-active` : ""}`} aria-pressed={status === item} onClick={() => setStatus(item)}>{item}</button>
              ))}
            </div>
            <label className="category-filter-label" htmlFor="public-report-category">Category</label>
            <select id="public-report-category" className="category-filter" value={category} onChange={(event) => setCategory(event.target.value)}>
              <option>All categories</option>
              {categories.map((item) => <option key={item}>{item}</option>)}
            </select>
          </div>

          <div className="public-map-mobile-tabs" role="group" aria-label="Choose map or report list">
            <button type="button" aria-pressed={mobileView === "map"} className={mobileView === "map" ? "active" : ""} onClick={() => setMobileView("map")}><MapIcon size={16} aria-hidden="true" /> Map</button>
            <button type="button" aria-pressed={mobileView === "reports"} className={mobileView === "reports" ? "active" : ""} onClick={() => setMobileView("reports")}><List size={16} aria-hidden="true" /> Reports <span>{filtered.length}</span></button>
          </div>

          {error && <div className="public-map-error" role="alert"><p>{error}</p><button className="refresh-button" type="button" onClick={load}>Try again</button></div>}
          <div className={`public-map-layout public-map-show-${mobileView}`}>
            <section className="public-map-panel" aria-label="Reports map">
              {loading ? <div className="public-map-canvas map-loading" role="status">Loading map…</div> : <ReportMapClient reports={filtered} />}
            </section>
            <section className="public-map-list-panel" aria-label="Filtered report cards">
              <div className="public-map-list-heading"><div><h2>Community Reports</h2><p>{filtered.length} {filtered.length === 1 ? "spot" : "spots"} match your filters</p></div></div>
              {loading ? (
                <div className="public-map-results-scroll" role="status" aria-label="Loading reports"><ReportSkeleton /><ReportSkeleton /><ReportSkeleton /></div>
              ) : filtered.length === 0 ? (
                <div className="public-map-empty"><ClipboardList size={30} aria-hidden="true" /><h3>No reports match these filters</h3><p>Try a different status, category or search term to see more community reports.</p><button type="button" className="secondary-btn" onClick={() => { setStatus("All"); setCategory("All categories"); setQuery(""); }}>Clear Filters</button></div>
              ) : (
                <div className="public-map-results-scroll">
                  {filtered.map((report) => (
                    <article className="public-report-card" key={report.id}>
                      <div className="public-report-image">{report.beforePhoto || report.imageUrl ? <Image src={report.beforePhoto || report.imageUrl} alt={`Reported issue: ${report.title}`} fill sizes="(max-width: 900px) 100vw, 420px" unoptimized /> : <MapPin size={24} aria-hidden="true" />}</div>
                      <div className="public-report-card-content">
                        <div className="public-report-card-top"><StatusBadge status={isResolved(report.status) ? "resolved" : "pending"}>{report.status === "Submitted" ? "Pending" : isResolved(report.status) ? "Resolved" : report.status}</StatusBadge><span className="public-report-category">{report.category || "Community report"}</span></div>
                        <h3>{report.title}</h3>
                        <p className="public-report-location"><MapPin size={15} aria-hidden="true" /> <span>{formatReportLocation(report.area, report.city)}</span></p>
                        <time dateTime={report.createdAt} className="public-report-time">Reported {formatDate(report.createdAt)}</time>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>
          </div>
        </section>
      </div>
    </main>
  );
}
