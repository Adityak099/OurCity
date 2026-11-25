"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  Truck,
} from "lucide-react";

import ProtectedRoute from "../auth/ProtectedRoute";
import { useAuth } from "../auth/AuthProvider";

const taskFilters = ["Active", "Completed", "All"];

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

function getLocationError(error) {
  if (error.code === 1) {
    return "Location access is blocked. Allow location access in your browser to start or continue tracking.";
  }
  if (error.code === 2) {
    return "Your current location is unavailable. Check your device location settings and try again.";
  }
  if (error.code === 3) {
    return "Location request timed out. Please try again.";
  }
  return "Unable to access your current location.";
}

function getDirectionsUrl(task) {
  const origin = task.driverLocation;
  const destination = task.location;

  if (!origin || !destination) return null;

  const route = `${origin.latitude},${origin.longitude};${destination.latitude},${destination.longitude}`;

  return `https://www.openstreetmap.org/directions?engine=fossgis_osrm_car&route=${encodeURIComponent(route)}`;
}

function DriverDashboardContent() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const driverId = user?.id;

  const [tasks, setTasks] = useState([]);
  const [driver, setDriver] = useState(null);
  const [filter, setFilter] = useState("Active");
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [savingIds, setSavingIds] = useState({});
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const watchIdRef = useRef(null);
  const lastLocationSentAtRef = useRef(0);
  const locationUpdateInFlightRef = useRef(false);

  const stopLocationTracking = useCallback(() => {
    if (watchIdRef.current !== null && navigator.geolocation) {
      navigator.geolocation.clearWatch(watchIdRef.current);
    }

    watchIdRef.current = null;
  }, []);

  const startLocationTracking = useCallback(
    (taskId) => {
      stopLocationTracking();

      if (!navigator.geolocation) {
        setError("This device does not support live location sharing.");
        return;
      }

      lastLocationSentAtRef.current = Date.now();

      try {
        watchIdRef.current = navigator.geolocation.watchPosition(
          async (position) => {
            const now = Date.now();

            if (
              now - lastLocationSentAtRef.current < 5000 ||
              locationUpdateInFlightRef.current
            ) {
              return;
            }

            lastLocationSentAtRef.current = now;
            locationUpdateInFlightRef.current = true;

            try {
              const response = await fetch("/api/driver/complaints", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  driverId,
                  complaintId: taskId,
                  driverLocation: {
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                    accuracy: position.coords.accuracy,
                  },
                }),
              });
              const result = await response.json();

              if (!response.ok) {
                throw new Error(
                  result.message || "Unable to share your live location.",
                );
              }

              setTasks((current) =>
                current.map((task) =>
                  task.id === taskId ? result.task : task,
                ),
              );
            } catch (locationError) {
              setError(
                locationError.message || "Unable to share your live location.",
              );
            } finally {
              locationUpdateInFlightRef.current = false;
            }
          },
          (locationError) => {
            setError(getLocationError(locationError));
            stopLocationTracking();
          },
          {
            enableHighAccuracy: true,
            maximumAge: 5000,
            timeout: 15000,
          },
        );
      } catch {
        setError("Unable to start live location sharing on this device.");
      }
    },
    [driverId, stopLocationTracking],
  );

  useEffect(() => {
    if (!driverId) return;

    let active = true;

    const loadTasks = async () => {
      try {
        const params = new URLSearchParams({ driverId });
        const response = await fetch(`/api/driver/complaints?${params}`, {
          cache: "no-store",
        });
        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.message || "Unable to load your tasks.");
        }

        if (!active) return;
        setTasks(result.tasks);
        setDriver(result.driver);
        setError("");

        const activeTask = result.tasks.find(
          (task) => task.status === "In Progress",
        );
        if (activeTask) {
          startLocationTracking(activeTask.id);
        } else {
          stopLocationTracking();
        }
      } catch (loadError) {
        if (active) {
          setError(loadError.message || "Unable to load your tasks.");
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    loadTasks();

    return () => {
      active = false;
      stopLocationTracking();
    };
  }, [driverId, refreshKey, startLocationTracking, stopLocationTracking]);

  const filteredTasks = useMemo(
    () =>
      tasks.filter((task) => {
        if (filter === "Active") return task.status !== "Resolved";
        if (filter === "Completed") return task.status === "Resolved";
        return true;
      }),
    [filter, tasks],
  );

  const activeCount = tasks.filter((task) => task.status !== "Resolved").length;
  const inProgressCount = tasks.filter(
    (task) => task.status === "In Progress",
  ).length;
  const completedCount = tasks.filter(
    (task) => task.status === "Resolved",
  ).length;
  const routeStatus = inProgressCount
    ? "On route"
    : activeCount
      ? "Ready to start"
      : "No active tasks";

  const updateTask = async (task) => {
    const nextStatus =
      task.status === "Assigned" ? "In Progress" : "Resolved";
    setSavingIds((current) => ({ ...current, [task.id]: true }));
    setError("");
    setNotice("");

    try {
      let driverLocation;

      if (nextStatus === "In Progress") {
        if (!navigator.geolocation) {
          throw new Error("This device does not support location sharing.");
        }

        const position = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            maximumAge: 5000,
            timeout: 15000,
          });
        }).catch((locationError) => {
          throw new Error(getLocationError(locationError));
        });

        driverLocation = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        };
      }

      const response = await fetch("/api/driver/complaints", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          driverId,
          complaintId: task.id,
          status: nextStatus,
          ...(driverLocation ? { driverLocation } : {}),
        }),
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Unable to update this task.");
      }

      setTasks((current) =>
        current.map((item) => (item.id === task.id ? result.task : item)),
      );
      if (nextStatus === "Resolved") {
        stopLocationTracking();
        setNotice("Task marked as complete. Live location sharing has stopped.");
      } else {
        startLocationTracking(task.id);
        setNotice(
          "Collection started. Your live location is shared with the citizen while this task is active.",
        );
      }
    } catch (updateError) {
      setError(updateError.message || "Unable to update this task.");
    } finally {
      setSavingIds((current) => {
        const next = { ...current };
        delete next[task.id];
        return next;
      });
    }
  };

  const handleRefresh = () => {
    setLoading(true);
    setError("");
    setRefreshKey((current) => current + 1);
  };

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
            <strong>{driver?.name || user?.name}</strong>
            <span>DRIVER</span>
          </div>
          <button className="logout-button" onClick={handleLogout}>
            <LogOut size={17} />
            Logout
          </button>
        </div>
      </header>

      <main className="dashboard-main container driver-dashboard-main">
        <div className="dashboard-welcome driver-dashboard-welcome">
          <div>
            <span className="eyebrow">
              <LayoutDashboard size={13} />
              Driver portal
            </span>
            <h1>My Collection Route</h1>
            <p>Review assigned reports and keep each collection task updated.</p>
          </div>
          <div className="dashboard-avatar">
            {driver?.name?.charAt(0) || user?.name?.charAt(0) || "D"}
          </div>
        </div>

        <section className="driver-info" aria-label="Driver and vehicle">
          <Truck size={20} />
          <div>
            <strong>{driver?.vehicleNumber || user?.vehicleNumber}</strong>
            <span>Assigned vehicle</span>
          </div>
          <MapPin size={20} />
          <div>
            <strong>{driver?.assignedWard || user?.assignedWard}</strong>
            <span>Assigned area</span>
          </div>
          <div className="driver-route-status">
            <span>Route status</span>
            <strong>{routeStatus}</strong>
          </div>
        </section>

        {error && (
          <div className="driver-feedback driver-feedback-error" role="alert">
            <AlertCircle size={17} />
            {error}
          </div>
        )}
        {notice && (
          <div className="driver-feedback driver-feedback-success" role="status">
            <CheckCircle2 size={17} />
            {notice}
          </div>
        )}

        <section
          className="dashboard-stats-grid driver-stats-grid"
          aria-label="Task overview"
        >
          <article className="dashboard-stat-card">
            <div className="dashboard-stat-icon">
              <ClipboardList size={21} />
            </div>
            <span>Active tasks</span>
            <strong>{activeCount}</strong>
          </article>
          <article className="dashboard-stat-card">
            <div className="dashboard-stat-icon driver-stat-progress">
              <Truck size={21} />
            </div>
            <span>Active</span>
            <strong>{inProgressCount}</strong>
          </article>
          <article className="dashboard-stat-card">
            <div className="dashboard-stat-icon driver-stat-complete">
              <CheckCircle2 size={21} />
            </div>
            <span>Completed tasks</span>
            <strong>{completedCount}</strong>
          </article>
        </section>

        <section className="driver-tasks-panel">
          <div className="driver-panel-heading">
            <div>
              <h2>Collection tasks</h2>
              <p>
                Start assigned work to share your live location with the
                reporting citizen. Sharing stops when you complete the task.
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

          <div className="driver-task-filters" aria-label="Filter tasks">
            {taskFilters.map((item) => (
              <button
                type="button"
                key={item}
                className={filter === item ? "driver-filter-active" : ""}
                aria-pressed={filter === item}
                onClick={() => setFilter(item)}
              >
                {item}
                {item === "Active" && <span>{activeCount}</span>}
                {item === "Completed" && <span>{completedCount}</span>}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="driver-task-state" role="status">
              <span className="loading-spinner" />
              <p>Loading assigned tasks...</p>
            </div>
          ) : error && tasks.length === 0 ? (
            <div className="driver-task-state">
              <AlertCircle size={30} />
              <h3>Unable to load tasks</h3>
              <p>Check the connection and try again.</p>
              <button
                type="button"
                className="primary-btn"
                onClick={handleRefresh}
              >
                Try again
              </button>
            </div>
          ) : filteredTasks.length === 0 ? (
            <div className="driver-task-state">
              <ClipboardList size={32} />
              <h3>
                {filter === "Completed"
                  ? "No completed tasks yet"
                  : filter === "Active"
                    ? "No active tasks assigned"
                    : "No tasks assigned"}
              </h3>
              <p>
                {filter === "Active"
                  ? "New tasks will appear here when management assigns them to you."
                  : "Assigned tasks will appear here."}
              </p>
            </div>
          ) : (
            <div className="driver-task-list">
              {filteredTasks.map((task) => {
                const saving = Boolean(savingIds[task.id]);
                const hasAnotherActiveTask =
                  task.status === "Assigned" && inProgressCount > 0;
                const nextAction =
                  task.status === "Assigned"
                    ? "Start collection"
                    : task.status === "In Progress"
                      ? "Mark as complete"
                      : null;
                const directionsUrl =
                  task.status === "In Progress"
                    ? getDirectionsUrl(task)
                    : null;

                return (
                  <article className="driver-task-card" key={task.id}>
                    <div className="driver-task-image">
                      <Image
                        src={task.imageUrl}
                        alt={task.title}
                        fill
                        sizes="(max-width: 650px) 100px, 112px"
                        unoptimized
                        onError={(event) => {
                          event.currentTarget.style.display = "none";
                        }}
                      />
                    </div>

                    <div className="driver-task-content">
                      <div className="driver-task-heading">
                        <div>
                          <span className="driver-task-id">{task.id}</span>
                          <h3>{task.title}</h3>
                        </div>
                        <span
                          className={`driver-task-status driver-task-status-${task.status
                            .toLowerCase()
                            .replaceAll(" ", "-")}`}
                        >
                          {task.status === "In Progress" ? "Active" : task.status}
                        </span>
                      </div>

                      <p className="driver-task-description">
                        {task.description}
                      </p>

                      <div className="driver-task-meta">
                        <span>{task.category}</span>
                        <span>
                          <AlertCircle size={13} />
                          {task.severity}
                        </span>
                        <span>
                          <CalendarDays size={13} />
                          {formatDate(task.createdAt)}
                        </span>
                        <span>
                          <MapPin size={13} />
                          {task.location.latitude.toFixed(4)},{" "}
                          {task.location.longitude.toFixed(4)}
                        </span>
                      </div>

                      <div className="driver-task-footer">
                        <span>
                          {task.status === "Resolved"
                            ? "Collection completed"
                            : task.status === "In Progress"
                              ? task.driverLocation?.updatedAt
                                ? `Live location updated ${formatDate(task.driverLocation.updatedAt)}`
                                : "Waiting for GPS location"
                              : "Assigned to your route"}
                        </span>
                        <div className="driver-task-controls">
                          {directionsUrl && (
                            <a
                              className="driver-task-action driver-directions-action"
                              href={directionsUrl}
                              target="_blank"
                              rel="noreferrer"
                            >
                              <MapPin size={14} />
                              Get directions
                            </a>
                          )}
                          {nextAction ? (
                            <button
                              type="button"
                              className="driver-task-action"
                              disabled={saving || hasAnotherActiveTask}
                              onClick={() => updateTask(task)}
                            >
                              {saving
                                ? "Updating..."
                                : hasAnotherActiveTask
                                  ? "Complete active task first"
                                : task.status === "Assigned"
                                  ? "Start collection"
                                  : "Mark as complete"}
                            </button>
                          ) : (
                            <span className="driver-complete-label">
                              <CheckCircle2 size={15} />
                              Completed
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default function DriverDashboard() {
  return (
    <ProtectedRoute allowedRole="driver">
      <DriverDashboardContent />
    </ProtectedRoute>
  );
}
