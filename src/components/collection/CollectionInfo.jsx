"use client";
import { useCallback, useEffect, useState } from "react";
import { Clock3, MapPin, Phone, Truck, Trash2 } from "lucide-react";
import { useAuth } from "../auth/AuthProvider";

const emptyRecord = {
  city: "",
  area: "",
  driverName: "",
  contactNumber: "",
  vehicleNumber: "",
  collectionTiming: "",
};

export default function CollectionInfo({ manage = false }) {
  const { user } = useAuth();
  const [records, setRecords] = useState([]);
  const [form, setForm] = useState(emptyRecord);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const load = useCallback(async () => {
    try {
      const response = await fetch("/api/collection-info", {
        cache: "no-store",
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      setRecords(data.collectionInfo || []);
    } catch (loadError) {
      setError(loadError.message || "Unable to load collection details.");
    }
  }, []);
  useEffect(() => {
    const timer = window.setTimeout(load, 0);
    return () => window.clearTimeout(timer);
  }, [load]);
  const save = async (event) => {
    event.preventDefault();
    setError("");
    setNotice("");
    try {
      const response = await fetch("/api/collection-info", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      setForm(emptyRecord);
      setNotice("Collection details saved.");
      await load();
    } catch (saveError) {
      setError(saveError.message || "Unable to save record.");
    }
  };
  const remove = async (id) => {
    try {
      const response = await fetch(
        `/api/collection-info?id=${encodeURIComponent(id)}`,
        { method: "DELETE" },
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      setRecords((current) => current.filter((record) => record._id !== id));
    } catch (deleteError) {
      setError(deleteError.message || "Unable to delete record.");
    }
  };
  return (
    <main id="main-content" className="my-complaints-page">
      <div className="container my-complaints-container">
        <span className="eyebrow">
          <Truck size={14} /> {manage ? "Municipal tools" : "Local collection"}
        </span>
        <h1>
          {manage
            ? "Manage collection details"
            : "Find collection details in your area"}
        </h1>
        <p className="collection-intro">
          Verified driver contacts, vehicles and collection timings for the
          areas they serve.
        </p>
        {error && (
          <p role="alert" className="form-error">
            {error}
          </p>
        )}
        {notice && (
          <p role="status" className="submission-success">
            {notice}
          </p>
        )}
        {manage && user?.role === "admin" && (
          <form className="collection-form" onSubmit={save}>
            <h2>Add an area collection record</h2>
            {[
              ["city", "City"],
              ["area", "Village / Area"],
              ["driverName", "Driver name"],
              ["contactNumber", "Contact number"],
              ["vehicleNumber", "Vehicle number"],
              ["collectionTiming", "Collection timing"],
            ].map(([key, label]) => (
              <label key={key}>
                {label}
                {key === "collectionTiming" ? (
                  <input
                    required
                    value={form[key]}
                    placeholder="e.g. 7:00–9:00 AM, Mon–Sat"
                    onChange={(event) =>
                      setForm({ ...form, [key]: event.target.value })
                    }
                  />
                ) : (
                  <input
                    required={key !== "vehicleNumber"}
                    value={form[key]}
                    onChange={(event) =>
                      setForm({ ...form, [key]: event.target.value })
                    }
                  />
                )}
              </label>
            ))}
            <button className="primary-btn">Save area details</button>
          </form>
        )}
        {records.length ? (
          <div className="collection-records">
            {records.map((record) => (
              <article key={record._id}>
                <span className="eyebrow">
                  <MapPin size={13} />
                  {record.city} · {record.area}
                </span>
                <h2>{record.driverName}</h2>
                <p>
                  <Phone size={16} />{" "}
                  <a href={`tel:${record.contactNumber}`}>
                    {record.contactNumber}
                  </a>
                </p>
                <p>
                  <Truck size={16} />
                  {record.vehicleNumber || "Vehicle details not listed"}
                </p>
                <p>
                  <Clock3 size={16} />
                  {record.collectionTiming}
                </p>
                {manage && user?.role === "admin" && (
                  <button
                    className="refresh-button"
                    type="button"
                    onClick={() => remove(record._id)}
                  >
                    <Trash2 size={15} /> Remove record
                  </button>
                )}
              </article>
            ))}
          </div>
        ) : (
          <div className="complaint-empty">
            <Truck size={30} />
            <h2>No collection details published yet</h2>
            <p>
              Municipal teams can add verified contact and schedule information
              from the admin dashboard.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
