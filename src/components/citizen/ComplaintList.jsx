"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useAuth } from "../auth/AuthProvider";

import {
  ArrowLeft,
  Plus,
  ClipboardList,
  MapPin,
  CalendarDays,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { ReportSkeleton } from "@/components/ui/Skeleton";

const statusConfig = {
  Reported: { className: "status-submitted", label: "Reported" },
  Submitted: {
    className: "status-submitted",
    label: "Submitted",
  },
  Assigned: {
    className: "status-assigned",
    label: "Assigned",
  },
  "In Progress": {
    className: "status-progress",
    label: "Active",
  },
  Resolved: {
    className: "status-resolved",
    label: "Resolved",
  },
  Cleaned: { className: "status-resolved", label: "Cleaned" },
};

export default function ComplaintList() {
  const searchParams = useSearchParams();
  const { user } = useAuth();

  const [complaints, setComplaints] = useState([]);
  const [filter, setFilter] = useState("All");
  const [categoryFilter, setCategoryFilter] = useState("All categories");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submittedId = searchParams.get("submitted");
  const [reference, setReference] = useState("");
  const [contactNumber, setContactNumber] = useState("");

  const fetchComplaints = async () => {
    if (!reference.trim()) return;

    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `/api/complaints?reference=${encodeURIComponent(reference.trim())}&contactNumber=${encodeURIComponent(contactNumber.trim())}`,
        { cache: "no-store" },
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Unable to load complaints.");
      }

      setComplaints(result.complaints || []);
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === "citizen") {
      let active = true;
      const loadOwnReports = async () => {
        setLoading(true);
        setError("");
        try {
          const response = await fetch(
            `/api/complaints?citizenId=${encodeURIComponent(user.id)}`,
            { cache: "no-store" },
          );
          const result = await response.json();
          if (!response.ok)
            throw new Error(result.message || "Unable to load your reports.");
          if (active) setComplaints(result.complaints || []);
        } catch (loadError) {
          if (active)
            setError(loadError.message || "Unable to load your reports.");
        } finally {
          if (active) setLoading(false);
        }
      };
      loadOwnReports();
      return () => {
        active = false;
      };
    }
    const savedReference =
      sessionStorage.getItem("ourcity-last-account-report") ||
      sessionStorage.getItem("ourcity-last-report") ||
      submittedId ||
      "";
    if (!savedReference) return;

    let active = true;

    const loadComplaints = async () => {
      try {
        const response = await fetch(
          `/api/complaints?reference=${encodeURIComponent(savedReference)}&contactNumber=${encodeURIComponent(sessionStorage.getItem("ourcity-last-contact") || "")}`,
          { cache: "no-store" },
        );
        const result = await response.json();

        if (!active) return;

        if (!response.ok) {
          throw new Error(result.message || "Unable to load complaints.");
        }

        setComplaints(result.complaints || []);
      } catch (err) {
        if (active) {
          setError(err.message || "Something went wrong.");
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    loadComplaints();

    return () => {
      active = false;
    };
  }, [submittedId, reference, user]);

  const categories = [...new Set(complaints.map((item) => item.category).filter(Boolean))].sort();
  const filteredComplaints = complaints.filter((item) => {
    const resolved = ["Resolved", "Cleaned"].includes(item.status);
    const matchesStatus = filter === "All" || (filter === "Resolved" ? resolved : !resolved);
    return matchesStatus && (categoryFilter === "All categories" || item.category === categoryFilter);
  });

  const formatDate = (date) => {
    return new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(date));
  };

  return (
    <main id="main-content" className="my-complaints-page">
      <div className="container my-complaints-container">
        <Link href="/" className="complaint-back">
          <ArrowLeft size={17} />
          Back to dashboard
        </Link>

        <div className="my-complaints-heading">
          <div>
            <span className="eyebrow">
              <ClipboardList size={14} />
              Public report tracking
            </span>

            <h1>Track a Spot Report</h1>

            <p>
              {user?.role === "citizen"
                ? "Your account reports and cleaning progress."
                : "Use your report reference and contact number to check cleaning progress."}
            </p>
          </div>

          <Link href="/citizen/complaints/new" className="primary-btn">
            <Plus size={18} />
            Report a Spot
          </Link>
        </div>

        {submittedId && (
          <div className="submission-success">
            <ClipboardList size={21} />
            <div>
              <strong>Spot report submitted successfully!</strong>
              <p>Your reference ID is {submittedId}</p>
            </div>
          </div>
        )}

        {user?.role !== "citizen" && (
          <form
            className="complaint-list-toolbar"
            onSubmit={(event) => {
              event.preventDefault();
              fetchComplaints();
            }}
          >
            <label htmlFor="report-reference">Report reference</label>
            <input
              id="report-reference"
              value={reference}
              onChange={(event) => setReference(event.target.value)}
              placeholder="e.g. CC-..."
            />
            <label htmlFor="contact-number">Contact number</label>
            <input
              id="contact-number"
              value={contactNumber}
              onChange={(event) => setContactNumber(event.target.value)}
              placeholder="Number used to report"
            />
            <button type="submit" className="refresh-button" disabled={loading}>
              Find report
            </button>
          </form>
        )}

        <div className="complaint-summary">
          <div>
            <span>Reports found</span>
            <strong>{complaints.length}</strong>
          </div>

          <div>
            <span>Pending / Active</span>
            <strong>
              {
                complaints.filter(
                  (item) => !["Resolved", "Cleaned"].includes(item.status),
                ).length
              }
            </strong>
          </div>

          <div>
            <span>Resolved</span>
            <strong>
              {
                complaints.filter((item) =>
                  ["Resolved", "Cleaned"].includes(item.status),
                ).length
              }
            </strong>
          </div>
        </div>

        <div className="complaint-list-toolbar">
          <h2>Reported issues</h2>

          <button
            type="button"
            className="refresh-button"
            onClick={fetchComplaints}
            disabled={loading}
          >
            <RefreshCw size={15} />
            Refresh
          </button>
        </div>

        <div className="report-filter-toolbar">
        <div className="complaint-filters status-filter-pills" role="group" aria-label="Filter reports by status">
          {["All", "Pending", "Resolved"].map((item) => (
            <button
              type="button"
              key={item}
              className={`filter-pill${filter === item ? ` filter-pill-${item.toLowerCase()}-active filter-active` : ""}`}
              onClick={() => setFilter(item)}
              aria-pressed={filter === item}
            >
              {item}
            </button>
          ))}
        </div>
        <label className="category-filter-control" htmlFor="citizen-report-category">Category
          <select id="citizen-report-category" value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}>
            <option>All categories</option>
            {categories.map((item) => <option key={item}>{item}</option>)}
          </select>
        </label>
        </div>

        {loading ? (
          <div className="complaint-list" role="status" aria-label="Loading reports">
            <ReportSkeleton /><ReportSkeleton /><ReportSkeleton />
          </div>
        ) : error ? (
          <div className="complaint-empty">
            <AlertCircle size={27} />
            <p>{error}</p>
            <button onClick={fetchComplaints} className="primary-btn">
              Try again
            </button>
          </div>
        ) : filteredComplaints.length === 0 ? (
          <div className="complaint-empty">
            <ClipboardList size={35} />
            <h3>No complaints found</h3>
            <p>
              {filter === "All" && categoryFilter === "All categories"
                ? "You haven't reported any waste issues yet."
                : "Try another status or category filter."}
            </p>

            {filter === "All" && (
              <Link href="/citizen/complaints/new" className="primary-btn">
                <Plus size={17} />
                Report an issue
              </Link>
            )}
          </div>
        ) : (
          <div className="complaint-list">
            {filteredComplaints.map((complaint) => {
              const status =
                statusConfig[complaint.status] || statusConfig.Submitted;

              return (
                <article className="complaint-item" key={complaint.id}>
                  <div className="complaint-item-image">
                    <Image
                      src={complaint.imageUrl}
                      alt={complaint.title}
                      fill
                      sizes="(max-width: 700px) 100vw, 180px"
                      unoptimized
                    />
                  </div>

                  <div className="complaint-item-content">
                    <div className="complaint-item-top">
                      <span className="complaint-reference">
                        {complaint.id}
                      </span>

                      <span className={`status-badge ${status.className}`}>
                        {filter === "Pending" ? (complaint.status === "Submitted" ? "Pending" : complaint.status) : status.label}
                      </span>
                    </div>

                    <h3>{complaint.title}</h3>

                    <p>{complaint.description}</p>

                    <div className="complaint-item-meta">
                      <span className="complaint-category-badge">{complaint.category}</span>
                      <span>
                        <AlertCircle size={13} />
                        {complaint.severity}
                      </span>
                      <span>
                        <CalendarDays size={13} />
                        {formatDate(complaint.createdAt)}
                      </span>
                      <span><MapPin size={13} />{complaint.location?.place || `${complaint.area || "Area unknown"}, ${complaint.city || "City unknown"}`}</span>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
