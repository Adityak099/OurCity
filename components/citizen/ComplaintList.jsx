"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

import {
  ArrowLeft,
  Plus,
  ClipboardList,
  MapPin,
  CalendarDays,
  AlertCircle,
  LoaderCircle,
  RefreshCw,
} from "lucide-react";

import { useAuth } from "../auth/AuthProvider";

const statusConfig = {
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
};

export default function ComplaintList() {
  const { user } = useAuth();
  const searchParams = useSearchParams();

  const [complaints, setComplaints] = useState([]);
  const [filter, setFilter] = useState("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const submittedId = searchParams.get("submitted");

  const fetchComplaints = async () => {
    if (!user?.id) return;

    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `/api/complaints?citizenId=${encodeURIComponent(user.id)}`,
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
    const citizenId = user?.id;
    if (!citizenId) return;

    let active = true;

    const loadComplaints = async () => {
      try {
        const response = await fetch(
          `/api/complaints?citizenId=${encodeURIComponent(citizenId)}`,
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
  }, [user?.id]);

  const filteredComplaints =
    filter === "All"
      ? complaints
      : complaints.filter((item) => item.status === filter);

  const formatDate = (date) => {
    return new Date(date).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <main className="my-complaints-page">
      <div className="container my-complaints-container">
        <Link href="/citizen/dashboard" className="complaint-back">
          <ArrowLeft size={17} />
          Back to dashboard
        </Link>

        <div className="my-complaints-heading">
          <div>
            <span className="eyebrow">
              <ClipboardList size={14} />
              Citizen portal
            </span>

            <h1>My Complaints</h1>

            <p>Track your reported waste-management issues.</p>
          </div>

          <Link href="/citizen/complaints/new" className="primary-btn">
            <Plus size={18} />
            New Complaint
          </Link>
        </div>

        {submittedId && (
          <div className="submission-success">
            <ClipboardList size={21} />
            <div>
              <strong>Complaint submitted successfully!</strong>
              <p>Your reference ID is {submittedId}</p>
            </div>
          </div>
        )}

        <div className="complaint-summary">
          <div>
            <span>Total complaints</span>
            <strong>{complaints.length}</strong>
          </div>

          <div>
            <span>Pending / Active</span>
            <strong>
              {complaints.filter((item) => item.status !== "Resolved").length}
            </strong>
          </div>

          <div>
            <span>Resolved</span>
            <strong>
              {complaints.filter((item) => item.status === "Resolved").length}
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

        <div className="complaint-filters">
          {["All", "Submitted", "Assigned", "In Progress", "Resolved"].map(
            (item) => (
              <button
                type="button"
                key={item}
                className={filter === item ? "filter-active" : ""}
                onClick={() => setFilter(item)}
              >
                {item}
              </button>
            ),
          )}
        </div>

        {loading ? (
          <div className="complaint-empty">
            <LoaderCircle className="spin-icon" size={25} />
            <p>Loading your complaints...</p>
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
              {filter === "All"
                ? "You haven't reported any waste issues yet."
                : `You don't have any ${filter.toLowerCase()} complaints.`}
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
                        {status.label}
                      </span>
                    </div>

                    <h3>{complaint.title}</h3>

                    <p>{complaint.description}</p>

                    <div className="complaint-item-meta">
                      <span>{complaint.category}</span>
                      <span>
                        <AlertCircle size={13} />
                        {complaint.severity}
                      </span>
                      <span>
                        <CalendarDays size={13} />
                        {formatDate(complaint.createdAt)}
                      </span>
                      <span>
                        <MapPin size={13} />
                        {complaint.location.latitude.toFixed(4)},{" "}
                        {complaint.location.longitude.toFixed(4)}
                      </span>
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
