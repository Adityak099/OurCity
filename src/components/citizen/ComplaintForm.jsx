"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

import {
  Camera,
  MapPin,
  Upload,
  X,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  LoaderCircle,
  LocateFixed,
} from "lucide-react";

import Link from "next/link";
import { useAuth } from "../auth/AuthProvider";

const categories = [
  "Garbage Accumulation",
  "Overflowing Dustbin",
  "Illegal Dumping",
  "Roadside Waste",
  "Other",
];

export default function ComplaintForm() {
  const router = useRouter();
  const { user } = useAuth();

  const [reporterName, setReporterName] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [city, setCity] = useState("");
  const [area, setArea] = useState("");
  const [ward, setWard] = useState("");
  const [availableWards, setAvailableWards] = useState([]);
  const [wardsLoading, setWardsLoading] = useState(true);
  const [wardError, setWardError] = useState("");
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [severity, setSeverity] = useState("Medium");

  const [photo, setPhoto] = useState(null);
  const [preview, setPreview] = useState("");

  const [location, setLocation] = useState(null);
  const [locationError, setLocationError] = useState("");
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationCapturedAt, setLocationCapturedAt] = useState(null);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  // Tracks the latest geolocation request to prevent race conditions
  const locationRequestIdRef = useRef(0);

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  useEffect(() => {
    let active = true;

    const loadWards = async () => {
      try {
        const response = await fetch("/api/wards", { cache: "no-store" });
        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.message || "Unable to load available wards.");
        }
        if (!Array.isArray(result.wards)) {
          throw new Error("The available ward list is invalid.");
        }

        if (active) {
          setAvailableWards(result.wards);
          setWardError(
            result.wards.length
              ? ""
              : "No wards are available yet. Ask an administrator to assign a ward to a driver.",
          );
        }
      } catch (error) {
        if (active) {
          setWardError(error.message || "Unable to load available wards.");
        }
      } finally {
        if (active) setWardsLoading(false);
      }
    };

    loadWards();

    return () => {
      active = false;
    };
  }, []);

  const captureLocation = () => {
    const requestId = ++locationRequestIdRef.current;

    setLocationError("");
    setLocation(null);
    setLocationCapturedAt(null);
    setLocationLoading(true);

    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser.");
      setLocationLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        if (requestId !== locationRequestIdRef.current) return;

        const capturedLocation = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          capturedAt: position.timestamp || Date.now(),
          place: "",
          area: "",
          city: "",
        };
        setLocation(capturedLocation);
        setLocationCapturedAt(capturedLocation.capturedAt);

        try {
          const query = new URLSearchParams({
            lat: String(capturedLocation.latitude),
            lon: String(capturedLocation.longitude),
          });
          const response = await fetch(`/api/location/reverse?${query}`);
          const result = await response.json();

          if (requestId !== locationRequestIdRef.current) return;

          if (!response.ok) {
            throw new Error(
              result.message || "Unable to look up this location.",
            );
          }

          setLocation((currentLocation) =>
            currentLocation?.latitude === capturedLocation.latitude &&
            currentLocation?.longitude === capturedLocation.longitude
              ? { ...currentLocation, place: result.place, area: result.area, city: result.city }
              : currentLocation,
          );
        } catch (error) {
          if (requestId !== locationRequestIdRef.current) return;

          setLocationError(
            error.message || "Unable to look up the place and area.",
          );
        } finally {
          if (requestId === locationRequestIdRef.current) {
            setLocationLoading(false);
          }
        }
      },
      (error) => {
        if (requestId !== locationRequestIdRef.current) return;

        const errors = {
          1: "Location permission denied. Please enable location access.",
          2: "Unable to determine your location. Try again.",
          3: "Location request timed out. Try again.",
        };

        setLocationError(
          errors[error.code] || "Unable to retrieve your location.",
        );
        setLocationLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      },
    );
  };

  const handlePhoto = (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

    if (!allowedTypes.includes(file.type)) {
      setMessage("Please select a JPG, PNG or WebP image.");
      event.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setMessage("Image size must be less than 5 MB.");
      event.target.value = "";
      return;
    }

    if (preview) URL.revokeObjectURL(preview);

    setMessage("");
    setPhoto(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!location) {
      setMessage("Please capture your current location.");
      return;
    }

    if (locationLoading) {
      setMessage("Please wait for location lookup to finish.");
      return;
    }

    if (wardsLoading) {
      setMessage("Please wait for the ward list to load.");
      return;
    }

    if (wardError) {
      setMessage(wardError);
      return;
    }

    if (!availableWards.includes(ward)) {
      setMessage("Choose the ward where the report is located.");
      return;
    }

    if (!locationCapturedAt || Date.now() - locationCapturedAt > 2 * 60 * 1000) {
      setMessage("Refresh your location just before reporting from the spot.");
      return;
    }

    if (!Number.isFinite(location.accuracy) || location.accuracy > 150) {
      setMessage("Your location is too imprecise. Move to an open area and capture it again.");
      return;
    }

    if (!(user?.name || reporterName).trim() || !contactNumber.trim() || !(city || location.city) || !(area || location.area)) {
      setMessage("Add your name and contact number, then confirm the detected city and area.");
      return;
    }

    if (!photo) {
      setMessage("Please upload a photograph.");
      return;
    }

    if (!category) {
      setMessage("Choose the category that best describes this issue.");
      document.getElementById("category-options")?.focus();
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const formData = new FormData();

      formData.append("reporterName", user?.name || reporterName);
      formData.append("contactNumber", contactNumber);
      formData.append("city", city || location.city || "");
      formData.append("area", area || location.area.split(",")[0] || "");
      formData.append("ward", ward);
      formData.append("title", title);
      formData.append("category", category);
      formData.append("description", description);
      formData.append("severity", severity);
      formData.append("latitude", String(location.latitude));
      formData.append("longitude", String(location.longitude));
      formData.append("accuracy", String(location.accuracy));
      formData.append("capturedAt", String(locationCapturedAt));
      formData.append("place", location.place || "");
      formData.append("photo", photo);

      const response = await fetch("/api/complaints", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Submission failed.");
      }

      if (user) sessionStorage.setItem("ourcity-last-account-report", result.complaint.id);
      sessionStorage.setItem("ourcity-last-report", result.complaint.id);
      sessionStorage.setItem("ourcity-last-contact", contactNumber);
      router.push(
        `/citizen/complaints?submitted=${encodeURIComponent(result.complaint.id)}`,
      );
    } catch (error) {
      setMessage(error.message || "Something went wrong.");
      setLoading(false);
    }
  };

  return (
    <div className="complaint-page">
      <div className="container complaint-container">
        <Link href="/citizen/dashboard" className="complaint-back">
          <ArrowLeft size={17} />
          Back to dashboard
        </Link>

        <div className="complaint-heading">
          <span className="eyebrow">
            <Camera size={14} />
            Citizen reporting
          </span>

          <h1>Report a waste issue</h1>

          <p>
            Help us keep your neighbourhood clean. Share the details and
            location of the issue.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="complaint-form">
          <section className="complaint-section" aria-labelledby="location-step-title">
            <div className="complaint-section-title">
              <span aria-hidden="true">01</span>
              <div>
                <h2 id="location-step-title">Step 1: Pin Location</h2>
                <p>Capture the spot so local teams can find it.</p>
              </div>
            </div>

            <div className="location-box">
              <div className="location-description">
                <MapPin size={23} aria-hidden="true" />
                <div aria-live="polite">
                  <strong>{locationLoading ? (location ? "Looking up address…" : "Detecting location…") : location ? "Location captured" : "Location not captured"}</strong>
                  <p>{location ? `${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}` : "Use your current location to mark where cleanup is needed."}</p>
                  {location && (
                    <>
                      <div className="location-address">
                        <p><strong>Address:</strong> {location.place || (locationLoading ? "Looking up…" : "Not available")}</p>
                        <p><strong>Area:</strong> {location.area || (locationLoading ? "Looking up…" : "Not available")}</p>
                      </div>
                      <small className="location-attribution">Location data © <a href="https://openstreetmap.org" target="_blank" rel="noreferrer">OpenStreetMap contributors</a></small>
                      <small>Accuracy: approximately {Math.round(location.accuracy)} metres</small>
                    </>
                  )}
                </div>
              </div>

              <button type="button" className="location-button" onClick={captureLocation} disabled={locationLoading}>
                {locationLoading ? <LoaderCircle size={17} className="spin-icon" aria-hidden="true" /> : <LocateFixed size={17} aria-hidden="true" />}
                {locationLoading ? "Finding Location…" : location ? "Refresh Location" : "Use Current Location"}
              </button>
            </div>

            {location && (
              <div className="report-location-map">
                <iframe title="OpenStreetMap location preview" src={`https://www.openstreetmap.org/export/embed.html?bbox=${location.longitude - 0.005}%2C${location.latitude - 0.005}%2C${location.longitude + 0.005}%2C${location.latitude + 0.005}&layer=mapnik&marker=${location.latitude}%2C${location.longitude}`} loading="lazy" />
                <small>Map data © <a href="https://openstreetmap.org" target="_blank" rel="noreferrer">OpenStreetMap contributors</a></small>
              </div>
            )}

            <div className="complaint-fields mt-6">
              <div className="complaint-field"><label htmlFor="reporterName">Your Name *</label><input id="reporterName" name="reporterName" autoComplete="name" value={user?.name || reporterName} onChange={(event) => setReporterName(event.target.value)} maxLength={100} required readOnly={Boolean(user?.name)} /></div>
              <div className="complaint-field"><label htmlFor="contactNumber">Contact Number *</label><input id="contactNumber" name="contactNumber" type="tel" autoComplete="tel" value={contactNumber} onChange={(event) => setContactNumber(event.target.value)} maxLength={20} required /></div>
              <div className="complaint-field"><label htmlFor="city">City Detected from GPS *</label><input id="city" name="city" autoComplete="off" value={city || location?.city || ""} onChange={(event) => setCity(event.target.value)} placeholder="Use your current location first…" required readOnly={!location?.city || location.city === "Not available"} /></div>
              <div className="complaint-field"><label htmlFor="area">Area Detected from GPS *</label><input id="area" name="area" autoComplete="off" value={area || location?.area?.split(",")[0] || ""} onChange={(event) => setArea(event.target.value)} placeholder="Use your current location first…" required readOnly={!location?.area || location.area === "Not available"} /></div>
              <div className="complaint-field report-ward-field">
                <label htmlFor="report-ward">Ward *</label>
                <select
                  id="report-ward"
                  name="ward"
                  value={ward}
                  onChange={(event) => setWard(event.target.value)}
                  disabled={wardsLoading || Boolean(wardError)}
                  required
                  aria-describedby="report-ward-help"
                >
                  <option value="">
                    {wardsLoading
                      ? "Loading wards…"
                      : wardError
                        ? "Wards unavailable"
                        : "Select your ward"}
                  </option>
                  {availableWards.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
                <small id="report-ward-help" aria-live="polite">
                  {wardError ||
                    "Select the ward containing the pinned spot. Reports go only to its assigned drivers."}
                </small>
              </div>
            </div>
            {locationError && <p className="form-error mt-4" role="alert"><AlertCircle size={15} aria-hidden="true" />{locationError}</p>}
          </section>

          <section className="complaint-section" aria-labelledby="details-step-title">
            <div className="complaint-section-title">
              <span aria-hidden="true">02</span>
              <div>
                <h2 id="details-step-title">Step 2: Issue Details</h2>
                <p>Describe what needs attention.</p>
              </div>
            </div>

            <div className="complaint-field">
              <label htmlFor="title">Issue Title *</label>
              <input id="title" name="title" type="text" autoComplete="off" placeholder="Example: Waste near the market…" value={title} onChange={(event) => setTitle(event.target.value)} maxLength={100} required />
            </div>

            <fieldset className="category-field">
              <legend>Issue Category *</legend>
              <div className="category-options" id="category-options" tabIndex={-1}>
                {categories.map((item) => (
                  <button key={item} type="button" className={`category-option${category === item ? " category-option-selected" : ""}`} aria-pressed={category === item} onClick={() => { setCategory(item); setMessage(""); }}>
                    {item}
                  </button>
                ))}
              </div>
            </fieldset>

            <div className="complaint-fields mt-6">
              <div className="complaint-field">
                <label htmlFor="description">Description *</label>
                <textarea id="description" name="description" placeholder="Describe the issue and nearby landmarks…" value={description} onChange={(event) => setDescription(event.target.value)} maxLength={1000} rows={5} required />
                <small>{description.length}/1000 characters</small>
              </div>
              <div className="complaint-field">
                <label htmlFor="severity">Severity *</label>
                <select id="severity" name="severity" value={severity} onChange={(event) => setSeverity(event.target.value)} required>
                  <option value="Low">Low</option><option value="Medium">Medium</option><option value="High">High</option><option value="Critical">Critical</option>
                </select>
                <small>Severity describes the seriousness of the issue, not its processing status.</small>
              </div>
            </div>
          </section>

          <section className="complaint-section" aria-labelledby="photo-step-title">
            <div className="complaint-section-title">
              <span aria-hidden="true">03</span>
              <div>
                <h2 id="photo-step-title">Step 3: Photo Evidence</h2>
                <p>Show the issue clearly to help crews prepare.</p>
              </div>
            </div>

            <div className="photo-upload">
              {preview ? (
                <div className="photo-preview">
                  <Image src={preview} alt="Preview of the selected issue photo" width={500} height={300} unoptimized />
                  <button type="button" onClick={() => { URL.revokeObjectURL(preview); setPhoto(null); setPreview(""); }} aria-label="Remove photograph" className="remove-photo"><X size={18} aria-hidden="true" /></button>
                </div>
              ) : (
                <label className="upload-box">
                  <span className="upload-icon"><Upload size={24} aria-hidden="true" /></span>
                  <strong>Choose a Photo or Take One</strong>
                  <span>JPG, PNG or WebP · Maximum 5 MB</span>
                  <input className="sr-only" type="file" name="photo" accept="image/jpeg,image/png,image/webp" capture="environment" onChange={handlePhoto} />
                </label>
              )}
            </div>
          </section>

          {message && (
            <div className="complaint-message" role="alert">
              <AlertCircle size={17} />
              {message}
            </div>
          )}

          <div className="complaint-submit-area">
            <div>
              <strong>Ready to submit?</strong>
              <p>Your complaint will be recorded for authority review.</p>
            </div>

            <button
              type="submit"
              className="primary-btn complaint-submit"
              disabled={loading || locationLoading}
            >
              {loading ? (
                <>
                  <LoaderCircle size={18} className="spin-icon" />
                  Submitting…
                </>
              ) : (
                <>
                  Submit Complaint
                  <CheckCircle2 size={18} />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
