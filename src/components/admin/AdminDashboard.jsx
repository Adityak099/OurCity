"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  LayoutDashboard,
  MapPin,
  RefreshCw,
  Search,
  Truck,
} from "lucide-react";

import ProtectedRoute from "../auth/ProtectedRoute";
import { useAuth } from "../auth/AuthProvider";
import { ReportSkeleton } from "@/components/ui/Skeleton";
import { formatReportLocation } from "@/lib/report-location";

const filters = ["All", "Pending", "Resolved"];

const statusClassNames = {
  Reported: "admin-status-submitted",
  Submitted: "admin-status-submitted",
  Assigned: "admin-status-assigned",
  "In Progress": "admin-status-progress",
  Resolved: "admin-status-resolved",
  Cleaned: "admin-status-resolved",
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
  const { user } = useAuth();
  const adminId = user?.id;

  const [complaints, setComplaints] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [areas, setAreas] = useState([]);
  const [driverSelections, setDriverSelections] = useState({});
  const [filter, setFilter] = useState("All");
  const [categoryFilter, setCategoryFilter] = useState("All categories");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [savingIds, setSavingIds] = useState({});
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [accounts, setAccounts] = useState({
    name: "",
    phone: "",
    password: "",
    role: "driver",
    vehicleNumber: "",
    assignedWard: "",
  });

  useEffect(() => {
    if (!adminId) return;

    let active = true;

    const loadDashboard = async () => {
      try {
        const response = await fetch("/api/admin/complaints", {
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
        setAreas(result.areas || []);
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
      const resolved = ["Resolved", "Cleaned"].includes(complaint.status);
      const matchesStatus = filter === "All" || (filter === "Resolved" ? resolved : !resolved);
      const matchesCategory = categoryFilter === "All categories" || complaint.category === categoryFilter;
      const matchesQuery =
        !normalizedQuery ||
        [
          complaint.id,
          complaint.title,
          complaint.description,
          complaint.category,
          complaint.city,
          complaint.area,
        ].some((value) => value?.toLowerCase().includes(normalizedQuery));

      return matchesStatus && matchesCategory && matchesQuery;
    });
  }, [categoryFilter, complaints, filter, query]);

  const complaintCategories = [...new Set(complaints.map((item) => item.category).filter(Boolean))].sort();

  const metrics = [
    {
      label: "Total spot reports",
      value: complaints.length,
      icon: ClipboardList,
      tone: "admin-metric-blue",
    },
    {
      label: "Reported spots",
      value: complaints.filter((item) =>
        ["Reported", "Submitted"].includes(item.status),
      ).length,
      icon: AlertCircle,
      tone: "admin-metric-amber",
    },
    {
      label: "Active drivers",
      value: drivers.length,
      icon: Truck,
      tone: "admin-metric-green",
    },
    {
      label: "Cleaned spots",
      value: complaints.filter((item) =>
        ["Cleaned", "Resolved"].includes(item.status),
      ).length,
      icon: CheckCircle2,
      tone: "admin-metric-green",
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

  const createRoleAccount = async (event) => {
    event.preventDefault();
    setError("");
    setNotice("");
    try {
      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(accounts),
      });
      const result = await response.json();
      if (!response.ok)
        throw new Error(result.message || "Unable to create account.");
      setAccounts({
        name: "",
        phone: "",
        password: "",
        role: "driver",
        vehicleNumber: "",
        assignedWard: "",
      });
      setNotice(
        `${result.user.role === "driver" ? "Driver" : "Admin"} account created for ${result.user.name}.`,
      );
      setRefreshKey((current) => current + 1);
    } catch (createError) {
      setError(createError.message || "Unable to create role account.");
    }
  };

  const handleRefresh = () => {
    setLoading(true);
    setError("");
    setRefreshKey((current) => current + 1);
  };

  return (
    <div className="dashboard-shell">
      <main id="main-content" className="dashboard-main container admin-dashboard-main">
        <div className="dashboard-welcome admin-dashboard-welcome">
          <div>
            <span className="eyebrow">
              <LayoutDashboard size={13} />
              Management portal
            </span>
            <h1>Admin Dashboard</h1>
            <p>Monitor spot reports, cleaning progress and area performance.</p>
          </div>
          <div className="dashboard-avatar">{user?.name?.charAt(0) || "A"}</div>
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

        <section className="admin-area-grid">
          <article>
            <h2>Area hotspots</h2>
            {areas.length ? (
              [...areas]
                .sort((a, b) => b.total - a.total)
                .map((area, index) => (
                  <p key={`${area.city}-${area.area}`}>
                    <strong>
                      {index === 0 && area.total > 1
                        ? "Highest report volume · "
                        : ""}
                      {area.city} · {area.area}
                    </strong>{" "}
                    — {area.reported} reported · {area.inProgress} active ·{" "}
                    {area.cleaned} cleaned
                  </p>
                ))
            ) : (
              <p>Hotspots appear as reports come in.</p>
            )}
          </article>
          <article>
            <h2>Team performance</h2>
            {drivers.map((driver) => (
              <p key={driver.id}>
                <strong>{driver.name}</strong> ·{" "}
                {
                  complaints.filter(
                    (item) =>
                      item.assignedDriverId === driver.id &&
                      ["Cleaned", "Resolved"].includes(item.status),
                  ).length
                }{" "}
                spots cleaned
              </p>
            ))}
          </article>
          <article>
            <h2>Collection details</h2>
            <p>Publish verified local contact and schedule information.</p>
            <Link href="/admin/collection-info" className="primary-btn">
              Manage collection details
            </Link>
          </article>
        </section>

        <section className="dashboard-content-card admin-user-management">
          <div className="dashboard-card-heading">
            <div>
              <h2>Role accounts</h2>
              <p>
                Create staff accounts. Citizens register from the sign-in page.
              </p>
            </div>
          </div>
          <form className="collection-form" onSubmit={createRoleAccount}>
            <h2>Create a staff account</h2>
            <label>
              Role
              <select
                className="admin-role-select"
                name="role"
                value={accounts.role}
                onChange={(event) =>
                  setAccounts({ ...accounts, role: event.target.value })
                }
              >
                <option value="driver">Driver</option>
                <option value="admin">Admin</option>
              </select>
            </label>
            <label>
              Full name
              <input
                required
                minLength={2}
                maxLength={100}
                value={accounts.name}
                onChange={(event) =>
                  setAccounts({ ...accounts, name: event.target.value })
                }
              />
            </label>
            <label>
              Phone number
              <input
                required
                name="phone"
                type="tel"
                autoComplete="tel"
                maxLength={24}
                placeholder="+91 98765 43210"
                value={accounts.phone}
                onChange={(event) =>
                  setAccounts({ ...accounts, phone: event.target.value })
                }
              />
            </label>
            <label>
              Temporary password
              <input
                required
                type="password"
                minLength={10}
                maxLength={128}
                value={accounts.password}
                onChange={(event) =>
                  setAccounts({ ...accounts, password: event.target.value })
                }
              />
            </label>
            {accounts.role === "driver" && (
              <>
                <label>
                  Vehicle number
                  <input
                    maxLength={40}
                    value={accounts.vehicleNumber}
                    onChange={(event) =>
                      setAccounts({
                        ...accounts,
                        vehicleNumber: event.target.value,
                      })
                    }
                  />
                </label>
                <label>
                  Assigned ward
                  <input
                    maxLength={100}
                    value={accounts.assignedWard}
                    onChange={(event) =>
                      setAccounts({
                        ...accounts,
                        assignedWard: event.target.value,
                      })
                    }
                  />
                </label>
              </>
            )}
            <button className="primary-btn">Create account</button>
          </form>
        </section>

        <section className="admin-complaints-panel">
          <div className="admin-panel-heading">
            <div>
              <h2>Shared spot reports</h2>
              <p>
                Reports are sent to active drivers assigned to their ward.
                Follow claims and cleanup evidence here.
              </p>
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

            <div className="admin-filters status-filter-pills" role="group" aria-label="Filter complaints by status">
              {filters.map((item) => (
                <button
                  type="button"
                  key={item}
                  className={`filter-pill${filter === item ? ` filter-pill-${item.toLowerCase()}-active admin-filter-active` : ""}`}
                  onClick={() => setFilter(item)}
                  aria-pressed={filter === item}
                >
                  {item}
                </button>
              ))}
            </div>
            <label className="category-filter-control" htmlFor="admin-report-category">Category
              <select id="admin-report-category" value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}>
                <option>All categories</option>
                {complaintCategories.map((item) => <option key={item}>{item}</option>)}
              </select>
            </label>
          </div>

          {loading ? (
            <div className="admin-complaint-list" role="status" aria-label="Loading reports">
              <ReportSkeleton /><ReportSkeleton /><ReportSkeleton />
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
                {query || filter !== "All" || categoryFilter !== "All categories"
                  ? "Try another search, status or category filter."
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
                  complaint.driverName ||
                  drivers.find(
                    (driver) => driver.id === complaint.assignedDriverId,
                  )?.name ||
                  "Unassigned";
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
                        sizes="(max-width: 760px) 100vw, 260px"
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
                          <AlertCircle size={13} aria-hidden="true" />
                          {complaint.severity}
                        </span>
                        <span>
                          <CalendarDays size={13} aria-hidden="true" />
                          {formatDate(complaint.createdAt)}
                        </span>
                        <span>
                          <MapPin size={13} aria-hidden="true" />
                          {complaint.location.latitude.toFixed(4)},{" "}
                          {complaint.location.longitude.toFixed(4)}
                        </span>
                        <span>
                          Reporter: {complaint.reporterName || "Anonymous"}
                        </span>
                        {complaint.contactNumber && (
                          <span>Contact: {complaint.contactNumber}</span>
                        )}
                        <span>
                          {formatReportLocation(complaint.area, complaint.city)}
                        </span>
                        <span>Ward: {complaint.ward || "Not set"}</span>
                        {complaint.driverName && (
                          <span>Driver: {complaint.driverName}</span>
                        )}
                      </div>

                      <div className="admin-complaint-actions admin-status-view">
                        {complaint.afterPhoto && (
                          <a
                            href={complaint.afterPhoto}
                            target="_blank"
                            rel="noreferrer"
                            className="primary-btn"
                          >
                            View after photo
                          </a>
                        )}
                        <p>
                          {complaint.cleanedAt
                            ? `Cleaned ${formatDate(complaint.cleanedAt)}`
                            : complaint.status === "In Progress"
                              ? `Accepted by ${complaint.driverName || "a driver"}.`
                              : complaint.ward
                                ? "Available to drivers assigned to this ward."
                                : "No ward selected; drivers cannot see this report."}
                        </p>
                      </div>
                      {false && (
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
                      )}
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
