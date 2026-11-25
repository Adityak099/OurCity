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

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [severity, setSeverity] = useState("Medium");

  const [photo, setPhoto] = useState(null);
  const [preview, setPreview] = useState("");

  const [location, setLocation] = useState(null);
  const [locationError, setLocationError] = useState("");
  const [locationLoading, setLocationLoading] = useState(false);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  // Tracks the latest geolocation request to prevent race conditions
  const locationRequestIdRef = useRef(0);

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  const captureLocation = () => {
    const requestId = ++locationRequestIdRef.current;

    setLocationError("");
    setLocation(null);
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
          place: "",
          area: "",
        };
        setLocation(capturedLocation);

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
              ? { ...currentLocation, place: result.place, area: result.area }
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

    if (!user || user.role !== "citizen") {
      setMessage("Please sign in with a citizen account.");
      return;
    }

    if (!location) {
      setMessage("Please capture your current location.");
      return;
    }

    if (locationLoading) {
      setMessage("Please wait for location lookup to finish.");
      return;
    }

    if (!photo) {
      setMessage("Please upload a photograph.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const formData = new FormData();

      formData.append("citizenId", user.id);
      formData.append("title", title);
      formData.append("category", category);
      formData.append("description", description);
      formData.append("severity", severity);
      formData.append("latitude", String(location.latitude));
      formData.append("longitude", String(location.longitude));
      formData.append("place", location.place || "");
      formData.append("area", location.area || "");
      formData.append("photo", photo);

      const response = await fetch("/api/complaints", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Submission failed.");
      }

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
          <div className="complaint-section">
            <div className="complaint-section-title">
              <span>01</span>
              <div>
                <h2>Issue details</h2>
                <p>Tell us what needs attention.</p>
              </div>
            </div>

            <div className="complaint-fields">
              <div className="complaint-field">
                <label htmlFor="title">Complaint title *</label>
                <input
                  id="title"
                  type="text"
                  placeholder="e.g. Garbage near the main road"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  maxLength={100}
                  required
                />
              </div>

              <div className="complaint-field">
                <label htmlFor="category">Issue category *</label>
                <select
                  id="category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  required
                >
                  <option value="">Select a category</option>

                  {categories.map((item) => (
                    <option value={item} key={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>

              <div className="complaint-field">
                <label htmlFor="description">Description *</label>
                <textarea
                  id="description"
                  placeholder="Describe the waste issue and its surroundings..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  maxLength={1000}
                  rows={5}
                  required
                />
                <small>{description.length}/1000 characters</small>
              </div>

              <div className="complaint-field">
                <label htmlFor="severity">Severity *</label>
                <select
                  id="severity"
                  value={severity}
                  onChange={(e) => setSeverity(e.target.value)}
                  required
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Critical">Critical</option>
                </select>
                <small>
                  Severity describes the seriousness of the issue, not its
                  processing status.
                </small>
              </div>
            </div>
          </div>

          <div className="complaint-section">
            <div className="complaint-section-title">
              <span>02</span>
              <div>
                <h2>Photographic evidence</h2>
                <p>Upload a photograph of the issue.</p>
              </div>
            </div>

            <div className="photo-upload">
              {preview ? (
                <div className="photo-preview">
                  <Image
                    src={preview}
                    alt="Complaint preview"
                    width={500}
                    height={300}
                    unoptimized
                  />

                  <button
                    type="button"
                    onClick={() => {
                      if (preview) URL.revokeObjectURL(preview);
                      setPhoto(null);
                      setPreview("");
                    }}
                    aria-label="Remove photograph"
                    className="remove-photo"
                  >
                    <X size={18} />
                  </button>
                </div>
              ) : (
                <label className="upload-box">
                  <span className="upload-icon">
                    <Upload size={24} />
                  </span>

                  <strong>Click to upload photograph</strong>
                  <span>JPG, PNG or WebP · Maximum 5 MB</span>

                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    capture="environment"
                    onChange={handlePhoto}
                    hidden
                  />
                </label>
              )}
            </div>
          </div>

          <div className="complaint-section">
            <div className="complaint-section-title">
              <span>03</span>
              <div>
                <h2>Issue location</h2>
                <p>Share the location where the issue exists.</p>
              </div>
            </div>

            <div className="location-box">
              <div className="location-description">
                <MapPin size={23} />

                <div aria-live="polite">
                  <strong>
                    {locationLoading
                      ? location
                        ? "Looking up place and area..."
                        : "Detecting location..."
                      : location
                        ? "Location captured"
                        : "Location not captured"}
                  </strong>

                  <p>
                    {location
                      ? `${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`
                      : locationLoading
                        ? "Getting your current position..."
                        : "Allow browser location access to continue."}
                  </p>

                  {location && (
                    <>
                      <div className="location-address">
                        <p>
                          <strong>Place:</strong>{" "}
                          {location.place ||
                            (locationLoading
                              ? "Looking up..."
                              : "Not available")}
                        </p>
                        <p>
                          <strong>Area:</strong>{" "}
                          {location.area ||
                            (locationLoading
                              ? "Looking up..."
                              : "Not available")}
                        </p>
                      </div>
                      <small className="location-attribution">
                        Location data ©{" "}
                        <a
                          href="https://openstreetmap.org"
                          target="_blank"
                          rel="noreferrer"
                        >
                          OpenStreetMap contributors
                        </a>
                      </small>
                      <small>
                        Accuracy: approximately {Math.round(location.accuracy)}{" "}
                        metres
                      </small>
                    </>
                  )}
                </div>
              </div>

              <button
                type="button"
                className="location-button"
                onClick={captureLocation}
                disabled={locationLoading}
              >
                {locationLoading ? (
                  <LoaderCircle size={17} className="spin-icon" />
                ) : (
                  <LocateFixed size={17} />
                )}
                {locationLoading
                  ? "Detecting..."
                  : location
                    ? "Refresh location"
                    : "Capture location"}
              </button>
            </div>

            {locationError && (
              <p className="form-error">
                <AlertCircle size={15} />
                {locationError}
              </p>
            )}
          </div>

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
                  Submitting...
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
