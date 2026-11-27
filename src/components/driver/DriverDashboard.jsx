"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  LayoutDashboard,
  MapPin,
  RefreshCw,
  Truck,
} from "lucide-react";

import ProtectedRoute from "../auth/ProtectedRoute";
import { useAuth } from "../auth/AuthProvider";
import { ReportSkeleton } from "@/components/ui/Skeleton";
import { formatReportLocation } from "@/lib/report-location";

const taskFilters = ["All", "Pending", "Resolved"];

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

  if (
    !destination ||
    !Number.isFinite(destination.latitude) ||
    !Number.isFinite(destination.longitude)
  ) {
    return null;
  }

  const params = new URLSearchParams({
    api: "1",
    destination: `${destination.latitude},${destination.longitude}`,
  });

  if (
    origin &&
    Number.isFinite(origin.latitude) &&
    Number.isFinite(origin.longitude)
  ) {
    params.set("origin", `${origin.latitude},${origin.longitude}`);
  }

  return `https://www.google.com/maps/dir/?${params.toString()}`;
}

function DriverDashboardContent() {
  const { user } = useAuth();
  const driverId = user?.id;

  const [tasks, setTasks] = useState([]);
  const [driver, setDriver] = useState(null);
  const [filter, setFilter] = useState("Pending");
  const [categoryFilter, setCategoryFilter] = useState("All categories");
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [savingIds, setSavingIds] = useState({});
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [afterPhotos, setAfterPhotos] = useState({});
  const taskLoadErrorRef = useRef("");
  const watchIdRef = useRef(null);
  const trackedTaskIdRef = useRef(null);
  const failedTrackingTaskIdRef = useRef(null);
  const lastLocationSentAtRef = useRef(0);
  const locationUpdateInFlightRef = useRef(false);

  const stopLocationTracking = useCallback(() => {
    if (watchIdRef.current !== null && navigator.geolocation) {
      navigator.geolocation.clearWatch(watchIdRef.current);
    }

    watchIdRef.current = null;
    trackedTaskIdRef.current = null;
  }, []);

  const startLocationTracking = useCallback(
    (taskId) => {
      if (
        trackedTaskIdRef.current === taskId ||
        failedTrackingTaskIdRef.current === taskId
      ) {
        return;
      }

      stopLocationTracking();
      trackedTaskIdRef.current = taskId;

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
            failedTrackingTaskIdRef.current = taskId;
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
        failedTrackingTaskIdRef.current = taskId;
        trackedTaskIdRef.current = null;
        setError("Unable to start live location sharing on this device.");
      }
    },
    [stopLocationTracking],
  );

  useEffect(() => {
    if (!driverId) return;

    let active = true;
    let requestPending = false;

    const loadTasks = async () => {
      if (requestPending) return;
      requestPending = true;

      try {
        const response = await fetch("/api/driver/complaints", {
          cache: "no-store",
        });
        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.message || "Unable to load your tasks.");
        }

        if (!active) return;
        setTasks(result.tasks);
        setDriver(result.driver);
        if (taskLoadErrorRef.current) {
          const previousLoadError = taskLoadErrorRef.current;
          setError((current) =>
            current === previousLoadError ? "" : current,
          );
          taskLoadErrorRef.current = "";
        }

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
          const message = loadError.message || "Unable to load your tasks.";
          taskLoadErrorRef.current = message;
          setError(message);
        }
      } finally {
        requestPending = false;
        if (active) setLoading(false);
      }
    };

    loadTasks();
    const refreshInterval = window.setInterval(loadTasks, 10000);

    return () => {
      active = false;
      window.clearInterval(refreshInterval);
      stopLocationTracking();
    };
  }, [driverId, refreshKey, startLocationTracking, stopLocationTracking]);

  const filteredTasks = useMemo(
    () =>
      tasks.filter((task) => {
        const resolved = ["Resolved", "Cleaned"].includes(task.status);
        const matchesStatus = filter === "All" || (filter === "Resolved" ? resolved : !resolved);
        return matchesStatus && (categoryFilter === "All categories" || task.category === categoryFilter);
      }),
    [categoryFilter, filter, tasks],
  );

  const taskCategories = [...new Set(tasks.map((task) => task.category).filter(Boolean))].sort();

  const activeCount = tasks.filter(
    (task) => !["Resolved", "Cleaned"].includes(task.status),
  ).length;
  const inProgressCount = tasks.filter(
    (task) => task.status === "In Progress",
  ).length;
  const completedCount = tasks.filter((task) =>
    ["Resolved", "Cleaned"].includes(task.status),
  ).length;
  const routeStatus = inProgressCount
    ? "On route"
    : activeCount
      ? "Ready to start"
      : "No active tasks";

  const updateTask = async (task) => {
    const nextStatus = "In Progress";
    setSavingIds((current) => ({ ...current, [task.id]: true }));
    setError("");
    setNotice("");

    try {
      let driverLocation;

      if (nextStatus === "In Progress") {
        if (navigator.geolocation) {
          const position = await new Promise((resolve) => {
            navigator.geolocation.getCurrentPosition(
              resolve,
              () => resolve(null),
              {
                enableHighAccuracy: true,
                maximumAge: 5000,
                timeout: 5000,
              },
            );
          });
          if (position)
            driverLocation = {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              accuracy: position.coords.accuracy,
            };
        }
      }

      const response = await fetch("/api/driver/complaints", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          complaintId: task.id,
          status: nextStatus,
          ...(driverLocation ? { driverLocation } : {}),
        }),
      });
      const result = await response.json();

      if (!response.ok) {
        if (response.status === 409) {
          setRefreshKey((current) => current + 1);
        }
        throw new Error(result.message || "Unable to update this task.");
      }

      setTasks((current) =>
        current.map((item) => (item.id === task.id ? result.task : item)),
      );
      if (driverLocation) startLocationTracking(task.id);
      setNotice(
        "Report accepted. Follow the directions, then add an after-photo when the spot is clean.",
      );
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

  const completeTask = async (task) => {
    const photo = afterPhotos[task.id];
    if (!photo) {
      setError("Upload an after-cleaning photo before completing this spot.");
      return;
    }
    setSavingIds((current) => ({ ...current, [task.id]: true }));
    setError("");
    try {
      const form = new FormData();
      form.append("complaintId", task.id);
      form.append("afterPhoto", photo);
      const response = await fetch("/api/driver/complaints", {
        method: "PATCH",
        body: form,
      });
      const result = await response.json();
      if (!response.ok)
        throw new Error(result.message || "Unable to complete this spot.");
      setTasks((current) =>
        current.map((item) => (item.id === task.id ? result.task : item)),
      );
      stopLocationTracking();
      setNotice("Spot marked cleaned with after-photo evidence.");
    } catch (error) {
      setError(error.message || "Unable to complete this spot.");
    } finally {
      setSavingIds((current) => {
        const next = { ...current };
        delete next[task.id];
        return next;
      });
    }
  };

  const handleRefresh = () => {
    failedTrackingTaskIdRef.current = null;
    setLoading(true);
    setError("");
    setRefreshKey((current) => current + 1);
  };

  return (
    <div className="dashboard-shell">
      <main id="main-content" className="dashboard-main container driver-dashboard-main">
        <div className="dashboard-welcome driver-dashboard-welcome">
          <div>
            <span className="eyebrow">
              <LayoutDashboard size={13} aria-hidden="true" />
              Driver portal
            </span>
            <h1>Find spots to clean</h1>
            <p>
              Accept reports in your assigned ward and get directions to the spot.
            </p>
          </div>
          <div className="dashboard-avatar" aria-hidden="true">
            {driver?.name?.charAt(0) || user?.name?.charAt(0) || "D"}
          </div>
        </div>

        <section className="driver-summary-grid" aria-label="Driver and route overview">
          <article className="driver-summary-card">
            <div className="driver-summary-icon driver-summary-icon-vehicle">
              <Truck size={20} aria-hidden="true" />
            </div>
            <div className="driver-summary-copy">
              <span>Assigned vehicle</span>
              <strong>{driver?.vehicleNumber || user?.vehicleNumber || "Not assigned"}</strong>
            </div>
          </article>
          <article className="driver-summary-card">
            <div className="driver-summary-icon driver-summary-icon-area">
              <MapPin size={20} aria-hidden="true" />
            </div>
            <div className="driver-summary-copy">
              <span>Assigned ward</span>
              <strong>{driver?.assignedWard || user?.assignedWard || "Not assigned"}</strong>
            </div>
          </article>
          <article className="driver-summary-card">
            <div className="driver-summary-icon driver-summary-icon-route">
              <ClipboardList size={20} aria-hidden="true" />
            </div>
            <div className="driver-summary-copy">
              <span>Route status</span>
              <strong>{routeStatus}</strong>
            </div>
          </article>
        </section>

        {error && (
          <div className="driver-feedback driver-feedback-error" role="alert">
            <AlertCircle size={17} aria-hidden="true" />
            {error}
          </div>
        )}
        {notice && (
          <div
            className="driver-feedback driver-feedback-success"
            role="status"
          >
            <CheckCircle2 size={17} aria-hidden="true" />
            {notice}
          </div>
        )}

        <section
          className="dashboard-stats-grid driver-stats-grid"
          aria-label="Task overview"
        >
          <article className="dashboard-stat-card">
            <div className="dashboard-stat-icon">
              <ClipboardList size={21} aria-hidden="true" />
            </div>
            <span>Active tasks</span>
            <strong>{activeCount}</strong>
          </article>
          <article className="dashboard-stat-card">
            <div className="dashboard-stat-icon driver-stat-progress">
              <Truck size={21} aria-hidden="true" />
            </div>
            <span>In progress</span>
            <strong>{inProgressCount}</strong>
          </article>
          <article className="dashboard-stat-card">
            <div className="dashboard-stat-icon driver-stat-complete">
              <CheckCircle2 size={21} aria-hidden="true" />
            </div>
            <span>Completed tasks</span>
            <strong>{completedCount}</strong>
          </article>
        </section>

        <section className="driver-tasks-panel">
          <div className="driver-panel-heading">
            <div>
              <h2>Reports in your assigned ward</h2>
              <p>
                {inProgressCount > 0
                  ? "Complete your active route before accepting another report. Claimed reports are hidden from other drivers."
                  : "New reports for your ward appear here. Accept one to get directions; claimed reports are hidden from other drivers."}
              </p>
            </div>
            <button
              type="button"
              className="refresh-button"
              onClick={handleRefresh}
              disabled={loading}
            >
              <RefreshCw size={15} aria-hidden="true" />
              Refresh
            </button>
          </div>

          <div className="driver-task-toolbar">
            <div
              className="driver-task-filters status-filter-pills"
              role="group"
              aria-label="Filter tasks by status"
            >
              {taskFilters.map((item) => (
                <button
                  type="button"
                  key={item}
                  className={`filter-pill${filter === item ? ` filter-pill-${item.toLowerCase()}-active driver-filter-active` : ""}`}
                  aria-pressed={filter === item}
                  onClick={() => setFilter(item)}
                >
                  {item}
                  {item === "Pending" && <span>{activeCount}</span>}
                  {item === "Resolved" && <span>{completedCount}</span>}
                </button>
              ))}
            </div>
            <label
              className="category-filter-control"
              htmlFor="driver-task-category"
            >
              Category
              <select
                id="driver-task-category"
                value={categoryFilter}
                onChange={(event) => setCategoryFilter(event.target.value)}
              >
                <option>All categories</option>
                {taskCategories.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </label>
          </div>

          {loading ? (
            <div className="driver-task-list" role="status" aria-label="Loading reports">
              <ReportSkeleton /><ReportSkeleton /><ReportSkeleton />
            </div>
          ) : error && tasks.length === 0 ? (
            <div className="driver-task-state">
              <AlertCircle size={30} aria-hidden="true" />
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
              <ClipboardList size={32} aria-hidden="true" />
              <h3>
                {filter === "Resolved"
                  ? "No resolved spots yet"
                  : filter === "Pending"
                    ? "No new reports in your ward"
                    : "No matching spots"}
              </h3>
              <p>
                {filter === "Pending"
                  ? "New unclaimed reports in your assigned ward will appear here."
                  : "Reports in your assigned ward appear here."}
              </p>
            </div>
          ) : (
            <div className="driver-task-list">
              {filteredTasks.map((task) => {
                const saving = Boolean(savingIds[task.id]);
                const canStartTask = [
                  "Reported",
                  "Submitted",
                  "Assigned",
                ].includes(task.status);
                const nextAction = canStartTask
                  ? task.status === "Assigned"
                    ? "Start assigned route"
                    : "Accept & get directions"
                  : task.status === "In Progress"
                    ? "Upload after photo"
                    : null;
                const directionsUrl =
                  task.status === "In Progress" ? getDirectionsUrl(task) : null;

                return (
                  <article className="driver-task-card" key={task.id}>
                    <div className="driver-task-image">
                      <Image
                        src={task.beforePhoto || task.imageUrl}
                        alt={task.title}
                        fill
                        sizes="(max-width: 760px) 100vw, 260px"
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
                          {task.status === "In Progress"
                            ? "In Progress"
                            : task.status}
                        </span>
                      </div>

                      <p className="driver-task-description">
                        {task.description}
                      </p>

                      <div className="driver-task-meta">
                        <span>{task.category}</span>
                        <span className="driver-task-severity">
                          <AlertCircle size={13} aria-hidden="true" />
                          {task.severity}
                        </span>
                        <span>
                          <CalendarDays size={13} aria-hidden="true" />
                          {formatDate(task.createdAt)}
                        </span>
                        <span>
                          <MapPin size={13} aria-hidden="true" />
                          {formatReportLocation(task.area, task.city)}
                        </span>
                      </div>

                      <div className="driver-task-footer">
                        <span>
                          {task.status === "Cleaned" ||
                          task.status === "Resolved"
                            ? "Spot cleaned"
                            : task.status === "In Progress"
                              ? task.driverLocation?.updatedAt
                                ? `Live location updated ${formatDate(task.driverLocation.updatedAt)}`
                                : "Waiting for GPS location"
                              : "Available in your assigned ward"}
                        </span>
                        <div className="driver-task-controls">
                          {directionsUrl && (
                            <a
                              className="driver-task-action driver-directions-action"
                              href={directionsUrl}
                              target="_blank"
                              rel="noreferrer"
                            >
                              <MapPin size={14} aria-hidden="true" />
                              Get directions
                            </a>
                          )}
                          {task.status === "In Progress" ? (
                            <>
                              <label className="driver-task-action driver-task-upload">
                                {afterPhotos[task.id]?.name || "Take after-photo"}
                                <input
                                  type="file"
                                  name="after-photo"
                                  accept="image/jpeg,image/png,image/webp"
                                  capture="environment"
                                  onChange={(event) =>
                                    setAfterPhotos((current) => ({
                                      ...current,
                                      [task.id]: event.target.files?.[0],
                                    }))
                                  }
                                />
                              </label>
                              <button
                                type="button"
                                className="driver-task-action driver-task-complete-action"
                                disabled={saving || !afterPhotos[task.id]}
                                onClick={() => completeTask(task)}
                              >
                                {saving ? "Saving…" : "Submit & close report"}
                              </button>
                            </>
                          ) : nextAction ? (
                            <button
                              type="button"
                              className="driver-task-action driver-task-primary-action"
                              disabled={saving || inProgressCount > 0}
                              title={
                                inProgressCount > 0
                                  ? "Complete your active route before accepting another report."
                                  : undefined
                              }
                              onClick={() => updateTask(task)}
                            >
                              {saving ? "Updating…" : nextAction}
                            </button>
                          ) : (
                            <span className="driver-complete-label">
                              <CheckCircle2 size={15} aria-hidden="true" />
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
