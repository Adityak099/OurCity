"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";

import {
  Leaf,
  LogOut,
  LayoutDashboard,
  ClipboardList,
  Truck,
  MapPin,
  Bell,
  ArrowUpRight,
} from "lucide-react";

import { useAuth } from "./AuthProvider";
import ProtectedRoute from "./ProtectedRoute";

const LiveTrackingMap = dynamic(
  () => import("../citizen/LiveTrackingMap"),
  {
    ssr: false,
    loading: () => (
      <div className="citizen-map-loading" role="status">
        Loading live map...
      </div>
    ),
  },
);

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
        label: "Submit a garbage complaint",
        href: "/citizen/complaints/new",
      },
      {
        label: "Track your complaints",
        href: "/citizen/complaints",
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
  const { user, logout } = useAuth();
  const router = useRouter();

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
          },
          {
            label: "Active Collections",
            value: citizenComplaints.filter(
              (complaint) => complaint.status === "In Progress",
            ).length,
            icon: Truck,
          },
          {
            label: "Resolved Issues",
            value: citizenComplaints.filter(
              (complaint) => complaint.status === "Resolved",
            ).length,
            icon: Leaf,
          },
        ]
      : config.cards;

  const trackableComplaints = citizenComplaints.filter(
    (complaint) =>
      ["Assigned", "In Progress"].includes(complaint.status) &&
      complaint.assignedDriver,
  );

  const handleLogout = () => {
    logout();
    router.replace("/login");
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
            <span>{role.toUpperCase()}</span>
          </div>

          <button className="logout-button" onClick={handleLogout}>
            <LogOut size={17} />
            Logout
          </button>
        </div>
      </header>

      <main className="dashboard-main container">
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
              <div className="dashboard-stat-card" key={card.label}>
                <div className="dashboard-stat-icon">
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
                <h2 id="citizen-tracking-title">Collection tracking</h2>
                <p>
                  Driver status and location refresh automatically every five
                  seconds.
                </p>
              </div>
              <MapPin size={21} />
            </div>

            {citizenError && (
              <p className="citizen-tracking-error" role="alert">
                {citizenError}
              </p>
            )}

            {citizenLoading ? (
              <p className="citizen-tracking-empty" role="status">
                Loading your reports...
              </p>
            ) : trackableComplaints.length === 0 ? (
              <p className="citizen-tracking-empty">
                No driver has been assigned to your open reports yet.
              </p>
            ) : (
              <div className="citizen-tracking-list">
                {trackableComplaints.map((complaint) => {
                  const isActive = complaint.status === "In Progress";
                  const driverLocation = complaint.driverLocation;
                  const hasDriverLocation =
                    Number.isFinite(driverLocation?.latitude) &&
                    Number.isFinite(driverLocation?.longitude);
                  const hasTargetLocation =
                    Number.isFinite(complaint.location?.latitude) &&
                    Number.isFinite(complaint.location?.longitude);
                  const locationUpdatedAt = Date.parse(
                    driverLocation?.updatedAt || "",
                  );
                  const locationUpdateLabel =
                    formatDriverLocationUpdate(
                      driverLocation?.updatedAt,
                      currentTime,
                    );
                  const isLocationStale =
                    !Number.isFinite(locationUpdatedAt) ||
                    (currentTime > 0 &&
                      currentTime - locationUpdatedAt > 15000);

                  return (
                    <article
                      className="citizen-tracking-card"
                      key={complaint.id}
                    >
                      <div className="citizen-tracking-card-heading">
                        <div>
                          <span className="citizen-tracking-reference">
                            {complaint.id}
                          </span>
                          <h3>{complaint.title}</h3>
                        </div>
                        <span
                          className={`citizen-live-status ${
                            isActive ? "citizen-live-status-active" : ""
                          }`}
                        >
                          {isActive ? "Active" : "Assigned"}
                        </span>
                      </div>

                      <p className="citizen-driver-details">
                        <Truck size={15} />
                        {complaint.assignedDriver.name}
                        {complaint.assignedDriver.vehicleNumber
                          ? ` · ${complaint.assignedDriver.vehicleNumber}`
                          : ""}
                      </p>

                      {isActive ? (
                        hasDriverLocation && hasTargetLocation ? (
                          <>
                            <LiveTrackingMap
                              driverLocation={driverLocation}
                              targetLocation={complaint.location}
                            />
                            <p
                              className={`citizen-location-updated ${
                                isLocationStale
                                  ? "citizen-location-updated-stale"
                                  : ""
                              }`}
                            >
                              <MapPin size={14} />
                              {locationUpdateLabel}
                            </p>
                          </>
                        ) : (
                          <p className="citizen-tracking-empty">
                            Collection is active. Waiting for the driver&apos;s
                            live location...
                          </p>
                        )
                      ) : (
                        <p className="citizen-tracking-empty">
                          Your driver is assigned. Live tracking will begin
                          when collection starts.
                        </p>
                      )}
                    </article>
                  );
                })}
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
