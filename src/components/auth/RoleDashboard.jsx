"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import dynamic from "next/dynamic";

import {
  AlertCircle,
  CheckCircle2,
  Leaf,
  LayoutDashboard,
  ClipboardList,
  Truck,
  MapPin,
  Bell,
  ArrowUpRight,
} from "lucide-react";

import { useAuth } from "./AuthProvider";
import ProtectedRoute from "./ProtectedRoute";

const LiveTrackingMap = dynamic(() => import("../citizen/LiveTrackingMap"), {
  ssr: false,
  loading: () => (
    <div className="citizen-map-loading" role="status">
      Loading live map...
    </div>
  ),
});

function formatDriverLocationUpdate(value, now) {
  const updatedAt = new Date(value);

  if (Number.isNaN(updatedAt.getTime())) {
    return "Driver location timestamp unavailable.";
  }

  const formatted = updatedAt.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  if (!now) return `Last location update ${formatted}.`;

  return now - updatedAt.getTime() > 15000
    ? `Location may be stale - last updated ${formatted}.`
    : `Live location updated ${formatted}.`;
}

const reportDateFormatter = new Intl.DateTimeFormat("en-IN", {
  dateStyle: "medium",
  timeStyle: "short",
});

const citizenReportStatuses = {
  Reported: { label: "Reported", tone: "reported" },
  Submitted: { label: "Reported", tone: "reported" },
  Assigned: { label: "Assigned", tone: "assigned" },
  "In Progress": { label: "In progress", tone: "in-progress" },
  Resolved: { label: "Resolved", tone: "resolved" },
  Cleaned: { label: "Resolved", tone: "resolved" },
};

function formatReportDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Date unavailable"
    : reportDateFormatter.format(date);
}

function CitizenReportCard({ complaint, currentTime }) {
  const status =
    citizenReportStatuses[complaint.status] || {
      label: "Status unavailable",
      tone: "unknown",
    };
  const isActive = complaint.status === "In Progress";
  const isResolved = ["Resolved", "Cleaned"].includes(complaint.status);
  const beforePhoto = complaint.beforePhoto || complaint.imageUrl;
  const afterPhoto = complaint.afterPhoto || complaint.resolutionImageUrl;
  const driverLocation = complaint.driverLocation;
  const hasDriverLocation =
    Number.isFinite(driverLocation?.latitude) &&
    Number.isFinite(driverLocation?.longitude);
  const hasTargetLocation =
    Number.isFinite(complaint.location?.latitude) &&
    Number.isFinite(complaint.location?.longitude);
  const locationUpdatedAt = Date.parse(driverLocation?.updatedAt || "");

  return (
    <article
      className={`citizen-report-card citizen-report-card-${status.tone}`}
    >
      <header className="citizen-report-card-heading">
        <div className="citizen-report-title">
          <span className="citizen-report-reference">{complaint.id}</span>
          <h3>{complaint.title}</h3>
        </div>
        <span
          className={`citizen-report-status citizen-report-status-${status.tone}`}
          aria-label={`Report status: ${status.label}`}
          role="status"
        >
          {status.label}
        </span>
      </header>

      <div className="citizen-report-card-body">
        <div
          className={`citizen-report-photos${afterPhoto ? " citizen-report-photos-comparison" : ""}`}
        >
          {beforePhoto ? (
            <figure className="citizen-report-photo">
              <div className="citizen-report-photo-frame">
                <Image
                  src={beforePhoto}
                  alt={`Before cleanup: ${complaint.title}`}
                  fill
                  sizes="(max-width: 760px) 44vw, (max-width: 1200px) 240px, 320px"
                  unoptimized
                />
              </div>
              <figcaption>Before cleanup</figcaption>
            </figure>
          ) : (
            <div className="citizen-report-photo-placeholder">
              Before photo unavailable
            </div>
          )}

          {afterPhoto && (
            <figure className="citizen-report-photo">
              <div className="citizen-report-photo-frame citizen-report-photo-frame-after">
                <Image
                  src={afterPhoto}
                  alt={`After cleanup: ${complaint.title}`}
                  fill
                  sizes="(max-width: 760px) 44vw, (max-width: 1200px) 240px, 320px"
                  unoptimized
                />
              </div>
              <figcaption>After cleanup</figcaption>
            </figure>
          )}
        </div>

        <div className="citizen-report-details">
          {complaint.description && (
            <p className="citizen-report-description">
              {complaint.description}
            </p>
          )}

          <div className="citizen-report-meta">
            <span className="citizen-report-category">
              {complaint.category || "Community report"}
            </span>
            <span>
              <MapPin size={14} aria-hidden="true" />
              {complaint.area || "Area unknown"}, {complaint.city || "City unknown"}
            </span>
            {complaint.ward && <span>Ward {complaint.ward}</span>}
            <time dateTime={complaint.createdAt}>
              {formatReportDate(complaint.createdAt)}
            </time>
          </div>

          {complaint.assignedDriver && (
            <div className="citizen-report-driver">
              <span className="citizen-report-driver-icon" aria-hidden="true">
                <Truck size={18} />
              </span>
              <span className="citizen-report-driver-copy">
                <small>Assigned driver</small>
                <strong>
                  {complaint.assignedDriver.name || "Driver assigned"}
                </strong>
              </span>
              {complaint.assignedDriver.vehicleNumber && (
                <span className="citizen-report-vehicle">
                  {complaint.assignedDriver.vehicleNumber}
                </span>
              )}
            </div>
          )}

          {isResolved ? (
            <div className="citizen-report-status-note citizen-report-status-note-resolved">
              <CheckCircle2 size={18} aria-hidden="true" />
              <span>
                {complaint.cleanedAt
                  ? `Resolved ${formatReportDate(complaint.cleanedAt)}`
                  : "This issue has been resolved."}
                {afterPhoto
                  ? " View the after-cleaning photo above."
                  : " No after-cleaning photo is available."}
              </span>
            </div>
          ) : isActive ? (
            <>
              <div className="citizen-report-status-note citizen-report-status-note-active">
                <Truck size={18} aria-hidden="true" />
                <span>The driver is on the way to clean this spot.</span>
              </div>
              {hasDriverLocation && hasTargetLocation && (
                <div className="citizen-report-map">
                  <LiveTrackingMap
                    driverLocation={driverLocation}
                    targetLocation={complaint.location}
                  />
                </div>
              )}
              <p
                className={`citizen-report-location-update${
                  !hasDriverLocation ||
                  !Number.isFinite(locationUpdatedAt) ||
                  (currentTime > 0 &&
                    currentTime - locationUpdatedAt > 15000)
                    ? " citizen-report-location-update-stale"
                    : ""
                }`}
              >
                <MapPin size={14} aria-hidden="true" />
                {hasDriverLocation
                  ? formatDriverLocationUpdate(
                      driverLocation.updatedAt,
                      currentTime,
                    )
                  : "Waiting for the driver’s live location."}
              </p>
            </>
          ) : complaint.status === "Assigned" ? (
            <div className="citizen-report-status-note citizen-report-status-note-assigned">
              <Truck size={18} aria-hidden="true" />
              <span>
                A driver has been assigned. Live tracking starts when collection
                begins.
              </span>
            </div>
          ) : (
            <div className="citizen-report-status-note citizen-report-status-note-reported">
              <ClipboardList size={18} aria-hidden="true" />
              <span>
                Your report is waiting for a driver to accept it.
              </span>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}

const dashboardConfig = {
  citizen: {
    title: "Citizen Dashboard",
    subtitle: "Stay connected with your neighbourhood.",
    cards: [
      { label: "My Complaints", value: "0", icon: ClipboardList },
      { label: "Resolved Issues", value: "0", icon: Leaf },
      { label: "Nearby Vehicles", value: "0", icon: Truck },
    ],
    actions: [
      {
        label: "Report a garbage spot",
        href: "/citizen/complaints/new",
      },
      {
        label: "Public Clean City Map",
        href: "/map",
      },
    ],
  },

  admin: {
    title: "Management Dashboard",
    subtitle: "Monitor and manage city waste operations.",
    cards: [
      { label: "Total Complaints", value: "0", icon: ClipboardList },
      { label: "Active Drivers", value: "0", icon: Truck },
      { label: "Resolved Issues", value: "0", icon: Leaf },
    ],
    actions: [
      "Review citizen complaints",
      "Assign complaints to drivers",
      "Monitor collection operations",
    ],
  },

  driver: {
    title: "Driver Dashboard",
    subtitle: "Manage your collection assignments.",
    cards: [
      { label: "Assigned Tasks", value: "0", icon: ClipboardList },
      { label: "Completed Tasks", value: "0", icon: Leaf },
      { label: "Route Status", value: "Not started", icon: Truck },
    ],
    actions: [
      "View assigned complaints",
      "Start your collection route",
      "Share your live location",
    ],
  },
};

function DashboardContent({ role }) {
  const { user } = useAuth();

  const config = dashboardConfig[role];
  const [citizenComplaints, setCitizenComplaints] = useState([]);
  const [citizenLoading, setCitizenLoading] = useState(true);
  const [citizenError, setCitizenError] = useState("");
  const [currentTime, setCurrentTime] = useState(0);

  useEffect(() => {
    if (role !== "citizen" || !user?.id) return;

    let active = true;
    let fetching = false;

    const loadComplaints = async () => {
      if (fetching) return;
      fetching = true;

      try {
        const response = await fetch(
          `/api/complaints?citizenId=${encodeURIComponent(user.id)}`,
          { cache: "no-store" },
        );
        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.message || "Unable to load your reports.");
        }

        if (active) {
          setCitizenComplaints(result.complaints || []);
          setCitizenError("");
          setCurrentTime(Date.now());
        }
      } catch (loadError) {
        if (active) {
          setCitizenError(loadError.message || "Unable to load your reports.");
        }
      } finally {
        fetching = false;
        if (active) setCitizenLoading(false);
      }
    };

    loadComplaints();
    const intervalId = window.setInterval(loadComplaints, 5000);

    return () => {
      active = false;
      window.clearInterval(intervalId);
    };
  }, [role, user?.id]);

  useEffect(() => {
    if (role !== "citizen") return;

    const intervalId = window.setInterval(
      () => setCurrentTime(Date.now()),
      5000,
    );

    return () => window.clearInterval(intervalId);
  }, [role]);

  const cards =
    role === "citizen"
      ? [
          {
            label: "My Complaints",
            value: citizenLoading ? "…" : citizenComplaints.length,
            icon: ClipboardList,
            tone: "blue",
          },
          {
            label: "Active Collections",
            value: citizenComplaints.filter(
              (complaint) =>
                ["Assigned", "In Progress"].includes(complaint.status),
            ).length,
            icon: Truck,
            tone: "amber",
          },
          {
            label: "Resolved Issues",
            value: citizenComplaints.filter(
              (complaint) =>
                ["Resolved", "Cleaned"].includes(complaint.status),
            ).length,
            icon: Leaf,
            tone: "green",
          },
        ]
      : config.cards;

  return (
    <div className="dashboard-shell">
      <main id="main-content" className="dashboard-main container">
        <div className="dashboard-welcome">
          <div>
            <span className="eyebrow">
              <LayoutDashboard size={13} />
              {role} portal
            </span>

            <h1>{config.title}</h1>
            <p>{config.subtitle}</p>
          </div>

          <div className="dashboard-avatar">{user?.name?.charAt(0) || "U"}</div>
        </div>

        {role === "driver" && (
          <div className="driver-info">
            <Truck size={20} />
            <div>
              <strong>{user?.vehicleNumber}</strong>
              <span>Assigned vehicle</span>
            </div>
            <MapPin size={20} />
            <div>
              <strong>{user?.assignedWard}</strong>
              <span>Assigned area</span>
            </div>
          </div>
        )}

        <div className="dashboard-stats-grid">
          {cards.map((card) => {
            const Icon = card.icon;

            return (
              <div
                className={`dashboard-stat-card${
                  card.tone
                    ? ` citizen-dashboard-stat-card citizen-dashboard-stat-${card.tone}`
                    : ""
                }`}
                key={card.label}
              >
                <div
                  className={`dashboard-stat-icon${
                    card.tone
                      ? ` citizen-dashboard-stat-icon-${card.tone}`
                      : ""
                  }`}
                >
                  <Icon size={22} />
                </div>

                <span>{card.label}</span>
                <strong>{card.value}</strong>
              </div>
            );
          })}
        </div>

        {role === "citizen" && (
          <section
            className="citizen-tracking-section"
            aria-labelledby="citizen-tracking-title"
          >
            <div className="citizen-tracking-heading">
              <div>
                <h2 id="citizen-tracking-title">My reports &amp; collection tracking</h2>
                <p>
                  Status updates refresh automatically. Resolved reports include
                  before-and-after photos.
                </p>
              </div>
              <span className="citizen-tracking-icon" aria-hidden="true">
                <MapPin size={21} aria-hidden="true" />
              </span>
            </div>

            {citizenError && citizenComplaints.length > 0 && (
              <p className="citizen-tracking-error" role="alert">
                {citizenError}
              </p>
            )}

            {citizenLoading ? (
              <p className="citizen-tracking-empty" role="status">
                Loading your reports…
              </p>
            ) : citizenError && citizenComplaints.length === 0 ? (
              <div className="citizen-report-empty-state citizen-report-empty-state-error" role="alert">
                <AlertCircle size={28} aria-hidden="true" />
                <h3>Reports could not be loaded</h3>
                <p>{citizenError} The dashboard will retry automatically.</p>
              </div>
            ) : citizenComplaints.length === 0 ? (
              <div className="citizen-report-empty-state">
                <span className="citizen-report-empty-icon" aria-hidden="true">
                  <ClipboardList size={23} />
                </span>
                <h3>No reports yet</h3>
                <p>
                  Reports you submit and their status updates will appear here.
                </p>
                <Link
                  href="/citizen/complaints/new"
                  className="citizen-report-empty-action"
                >
                  Report a waste issue
                  <ArrowUpRight size={16} aria-hidden="true" />
                </Link>
              </div>
            ) : (
              <div className="citizen-tracking-list">
                {citizenComplaints.map((complaint) => (
                  <CitizenReportCard
                    key={complaint.id}
                    complaint={complaint}
                    currentTime={currentTime}
                  />
                ))}
              </div>
            )}
          </section>
        )}

        <section className="dashboard-content-card">
          <div className="dashboard-card-heading">
            <div>
              <h2>Quick Actions</h2>
              <p>Choose what you would like to do next.</p>
            </div>

            <Bell size={21} />
          </div>

          <div className="quick-actions">
            {config.actions.map((action, index) => {
              const label = typeof action === "string" ? action : action.label;

              const href = typeof action === "string" ? null : action.href;

              const content = (
                <>
                  <span>
                    <ClipboardList size={19} />
                  </span>

                  <strong>{label}</strong>

                  <ArrowUpRight size={17} />
                </>
              );

              return href ? (
                <Link href={href} className="quick-action" key={label}>
                  {content}
                </Link>
              ) : (
                <div className="quick-action" key={label}>
                  {content}
                </div>
              );
            })}
          </div>
        </section>

        <div className="dashboard-note">
          <Leaf size={19} />
          <span>
            {role === "citizen"
              ? "Your report and collection status refresh automatically."
              : "Welcome to CleanCity. More features are coming soon."}
          </span>
        </div>
      </main>
    </div>
  );
}

export default function RoleDashboard({ role }) {
  return (
    <ProtectedRoute allowedRole={role}>
      <DashboardContent role={role} />
    </ProtectedRoute>
  );
}
