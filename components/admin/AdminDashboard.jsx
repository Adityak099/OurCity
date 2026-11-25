"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  MapPin,
  RefreshCw,
  Search,
  Truck,
} from "lucide-react";

import ProtectedRoute from "../auth/ProtectedRoute";
import { useAuth } from "../auth/AuthProvider";

const filters = ["All", "Submitted", "Assigned", "In Progress", "Resolved"];

const statusClassNames = {
  Submitted: "admin-status-submitted",
  Assigned: "admin-status-assigned",
  "In Progress": "admin-status-progress",
  Resolved: "admin-status-resolved",
};

function formatDate(value) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Date unavailable";

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function AdminDashboardContent() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const adminId = user?.id;

  const [complaints, setComplaints] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [driverSelections, setDriverSelections] = useState({});
  const [filter, setFilter] = useState("All");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [savingIds, setSavingIds] = useState({});
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    if (!adminId) return;

    let active = true;

    const loadDashboard = async () => {
      try {
        const params = new URLSearchParams({ adminId });
        const response = await fetch(`/api/admin/complaints?${params}`, {
          cache: "no-store",
        });
        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.message || "Unable to load dashboard data.");
        }

        if (!active) return;
        setError("");
        setComplaints(result.complaints);
        setDrivers(result.drivers);
        setDriverSelections({});
      } catch (loadError) {
        if (active) {
          setError(loadError.message || "Unable to load dashboard data.");
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    loadDashboard();

    return () => {
      active = false;
    };
  }, [adminId, refreshKey]);

  const filteredComplaints = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return complaints.filter((complaint) => {
      const matchesStatus = filter === "All" || complaint.status === filter;
      const matchesQuery =
        !normalizedQuery ||
        [
          complaint.id,
          complaint.title,
          complaint.description,
          complaint.category,
          complaint.citizenId,
        ].some((value) => value?.toLowerCase().includes(normalizedQuery));

      return matchesStatus && matchesQuery;
    });
  }, [complaints, filter, query]);

  const metrics = [
    {
      label: "Total complaints",
      value: complaints.length,
      icon: ClipboardList,
      tone: "admin-metric-green",
    },
    {
      label: "Awaiting assignment",
      value: complaints.filter((item) => item.status === "Submitted").length,
      icon: AlertCircle,
      tone: "admin-metric-amber",
    },
    {
      label: "Active drivers",
      value: drivers.length,
      icon: Truck,
      tone: "admin-metric-blue",
    },
    {
      label: "Resolved",
      value: complaints.filter((item) => item.status === "Resolved").length,
      icon: CheckCircle2,
      tone: "admin-metric-purple",
    },
  ];

  const updateComplaint = async (complaintId, updates, successMessage) => {
    setSavingIds((current) => ({ ...current, [complaintId]: true }));
    setError("");
    setNotice("");

    try {
      const response = await fetch("/api/admin/complaints", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          adminId: user.id,
          complaintId,
          ...updates,
        }),
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Unable to update this complaint.");
      }

      setComplaints((current) =>
        current.map((item) =>
          item.id === complaintId ? result.complaint : item,
        ),
      );
      setDriverSelections((current) => ({
        ...current,
        [complaintId]: result.complaint.assignedDriverId || "",
      }));
      setNotice(successMessage);
    } catch (updateError) {
      setError(updateError.message || "Unable to update this complaint.");
    } finally {
      setSavingIds((current) => {
        const next = { ...current };
        delete next[complaintId];
        return next;
      });
    }
  };

  const handleLogout = () => {
    logout();
    router.replace("/login");
  };

  const handleRefresh = () => {
    setLoading(true);
    setError("");
    setRefreshKey((current) => current + 1);
  };

  return (
    <div className="dashboard-shell">
      <header className="dashboard-header">
        <Link href="/" className="brand">
          <Image
            src="/hero/OurCity-Mark.png"
            alt="OurCity"
            width={44}
            height={44}
            className="brand-logo"
          />
          <span>
            Clean<span>City</span>
          </span>
        </Link>

        <div className="dashboard-user">
          <div className="user-details">
            <strong>{user?.name}</strong>
            <span>ADMIN</span>
          </div>
          <button className="logout-button" onClick={handleLogout}>
            <LogOut size={17} />
            Logout
          </button>
        </div>
      </header>

      <main className="dashboard-main container admin-dashboard-main">
        <div className="dashboard-welcome admin-dashboard-welcome">
          <div>
            <span className="eyebrow">
              <LayoutDashboard size={13} />
              Management portal
            </span>
            <h1>Admin Dashboard</h1>
            <p>Review reports, assign drivers, and track resolution progress.</p>
          </div>
          <div className="dashboard-avatar">
            {user?.name?.charAt(0) || "A"}
          </div>
        </div>

        {error && (
          <div className="admin-feedback admin-feedback-error" role="alert">
            <AlertCircle size={17} />
            {error}
          </div>
        )}
        {notice && (
          <div className="admin-feedback admin-feedback-success" role="status">
            <CheckCircle2 size={17} />
            {notice}
          </div>
        )}

        <section
          className="dashboard-stats-grid admin-stats-grid"
          aria-label="Complaint overview"
        >
          {metrics.map((metric) => {
            const Icon = metric.icon;

            return (
              <article className="dashboard-stat-card" key={metric.label}>
                <div className={`admin-metric-icon ${metric.tone}`}>
                  <Icon size={20} />
                </div>
                <span>{metric.label}</span>
                <strong>{metric.value}</strong>
              </article>
            );
          })}
        </section>

        <section className="admin-complaints-panel">
          <div className="admin-panel-heading">
            <div>
              <h2>Citizen complaints</h2>
              <p>Assign a driver and update each complaint’s progress.</p>
            </div>
            <button
              type="button"
              className="refresh-button"
              onClick={handleRefresh}
              disabled={loading}
            >
              <RefreshCw size={15} />
              Refresh
            </button>
          </div>

          <div className="admin-list-toolbar">
            <label className="admin-search">
              <Search size={17} aria-hidden="true" />
              <input
                type="search"
                aria-label="Search complaints"
                placeholder="Search reports..."
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </label>

            <div className="admin-filters" aria-label="Filter complaints">
              {filters.map((item) => (
                <button
                  type="button"
                  key={item}
                  className={filter === item ? "admin-filter-active" : ""}
                  onClick={() => setFilter(item)}
                  aria-pressed={filter === item}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="admin-list-state" role="status">
              <span className="loading-spinner" />
              <p>Loading complaints...</p>
            </div>
          ) : error && complaints.length === 0 ? (
            <div className="admin-list-state">
              <AlertCircle size={30} />
              <h3>Unable to load complaints</h3>
              <p>Check the connection and try again.</p>
              <button
                type="button"
                className="primary-btn"
                onClick={handleRefresh}
              >
                Try again
              </button>
            </div>
          ) : filteredComplaints.length === 0 ? (
            <div className="admin-list-state">
              <ClipboardList size={30} />
              <h3>No complaints found</h3>
              <p>
                {query || filter !== "All"
                  ? "Try another search or status filter."
                  : "New citizen reports will appear here."}
              </p>
            </div>
          ) : (
            <div className="admin-complaint-list">
              {filteredComplaints.map((complaint) => {
                const status = statusClassNames[complaint.status]
                  ? complaint.status
                  : "Submitted";
                const selectedDriver =
                  driverSelections[complaint.id] ??
                  complaint.assignedDriverId ??
                  "";
                const currentDriver =
                  drivers.find(
                    (driver) => driver.id === complaint.assignedDriverId,
                  )?.name || "Unassigned";
                const saving = Boolean(savingIds[complaint.id]);
                const assignmentChanged =
                  selectedDriver !== (complaint.assignedDriverId || "");

                return (
                  <article className="admin-complaint-card" key={complaint.id}>
                    <div className="admin-complaint-image">
                      <Image
                        src={complaint.imageUrl}
                        alt={complaint.title}
                        fill
                        sizes="(max-width: 700px) 100px, 120px"
                        unoptimized
                        onError={(event) => {
                          event.currentTarget.style.display = "none";
                        }}
                      />
                    </div>

                    <div className="admin-complaint-content">
                      <div className="admin-complaint-heading">
                        <div>
                          <span className="admin-complaint-id">
                            {complaint.id}
                          </span>
                          <h3>{complaint.title}</h3>
                        </div>
                        <span
                          className={`admin-status ${statusClassNames[status]}`}
                        >
                          {complaint.status}
                        </span>
                      </div>

                      <p className="admin-complaint-description">
                        {complaint.description}
                      </p>

                      <div className="admin-complaint-meta">
                        <span>{complaint.category}</span>
                        <span className="admin-severity">
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
                        <span>Citizen: {complaint.citizenId}</span>
                      </div>

                      <div className="admin-complaint-actions">
                        <div className="admin-action-field">
                          <label htmlFor={`driver-${complaint.id}`}>
                            Driver <span>({currentDriver})</span>
                          </label>
                          <div className="admin-action-control">
                            <select
                              id={`driver-${complaint.id}`}
                              value={selectedDriver}
                              disabled={
                                saving ||
                                ["In Progress", "Resolved"].includes(
                                  complaint.status,
                                )
                              }
                              onChange={(event) =>
                                setDriverSelections((current) => ({
                                  ...current,
                                  [complaint.id]: event.target.value,
                                }))
                              }
                            >
                              <option value="">Unassigned</option>
                              {drivers.map((driver) => (
                                <option key={driver.id} value={driver.id}>
                                  {driver.name} · {driver.assignedWard}
                                </option>
                              ))}
                            </select>
                            <button
                              type="button"
                              className="admin-action-button"
                              disabled={
                                saving ||
                                ["In Progress", "Resolved"].includes(
                                  complaint.status,
                                ) ||
                                !assignmentChanged
                              }
                              onClick={() =>
                                updateComplaint(
                                  complaint.id,
                                  {
                                    assignedDriverId: selectedDriver || null,
                                  },
                                  selectedDriver
                                    ? "Driver assignment saved."
                                    : "Driver assignment removed.",
                                )
                              }
                            >
                              {saving ? "Saving..." : "Save"}
                            </button>
                          </div>
                        </div>

                        <div className="admin-action-field">
                          <label>Collection status</label>
                          <p className="admin-status-guidance">
                            {complaint.status === "Submitted"
                              ? "Assign a driver to begin collection."
                              : complaint.status === "Assigned"
                                ? "The assigned driver starts and completes collection."
                                : "Collection progress is managed by the assigned driver."}
                          </p>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          {!loading && (
            <p className="admin-results-count">
              Showing {filteredComplaints.length} of {complaints.length} reports
            </p>
          )}
        </section>

      </main>
    </div>
  );
}

export default function AdminDashboard() {
  return (
    <ProtectedRoute allowedRole="admin">
      <AdminDashboardContent />
    </ProtectedRoute>
  );
}
