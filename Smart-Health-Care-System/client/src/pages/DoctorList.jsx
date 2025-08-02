import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const DoctorList = () => {
  const [doctors, setDoctors] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDoctors = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(`/api/doctors${search ? `?search=${encodeURIComponent(search)}` : ""}`);
        if (!res.ok) throw new Error("Failed to fetch doctors");
        const data = await res.json();
        setDoctors(data.doctors);
      } catch (err) {
        setError(err.message || "Error fetching doctors");
      } finally {
        setLoading(false);
      }
    };
    fetchDoctors();
  }, [search]);

  return (
    <div style={{ maxWidth: 900, margin: "2rem auto", padding: 24 }}>
      <h2 style={{ marginBottom: 24 }}>Find a Doctor</h2>
      <input
        type="text"
        placeholder="Search by name, category, or expertise..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        style={{ width: "100%", padding: 10, borderRadius: 8, border: "1.5px solid #3b82f6", marginBottom: 32, fontSize: 16 }}
      />
      {loading ? (
        <div>Loading doctors...</div>
      ) : error ? (
        <div style={{ color: "#ef4444" }}>{error}</div>
      ) : doctors.length === 0 ? (
        <div>No doctors found.</div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 24 }}>
          {doctors.map(doc => (
            <div key={doc._id} style={{ background: "#fff", borderRadius: 12, boxShadow: "0 2px 12px #e0e7ef", padding: 24, display: "flex", flexDirection: "column", alignItems: "center" }}>
              <div style={{ width: 80, height: 80, borderRadius: "50%", background: "#e5e7eb", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32, color: "#3b82f6", fontWeight: 700, marginBottom: 12, overflow: "hidden" }}>
                {doc.photo ? (
                  <img src={doc.photo} alt={doc.name} style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }} />
                ) : (
                  doc.name.split(" ").map(n => n[0]).join("").toUpperCase()
                )}
              </div>
              <div style={{ fontWeight: 600, fontSize: 18, marginBottom: 4 }}>{doc.name}</div>
              <div style={{ color: "#3b82f6", fontSize: 15, marginBottom: 4 }}>{doc.category}</div>
              <div style={{ color: "#6b7280", fontSize: 14, marginBottom: 4 }}>{doc.qualifications}</div>
              <div style={{ color: "#6b7280", fontSize: 14, marginBottom: 4 }}>Experience: {doc.experience} yrs</div>
              <div style={{ color: "#6b7280", fontSize: 14, marginBottom: 4 }}>{doc.expertise}</div>
              <div style={{ color: "#222", fontWeight: 500, marginBottom: 8 }}>Fee: Rs. {doc.fee}</div>
              <div style={{ 
                display: "flex", 
                alignItems: "center", 
                gap: "0.5rem", 
                marginBottom: "0.5rem",
                padding: "0.25rem 0.5rem",
                borderRadius: "4px",
                background: doc.availabilityStatus === "available" ? "#f0fdf4" : 
                           doc.availabilityStatus === "busy" ? "#fef3c7" : 
                           doc.availabilityStatus === "booked" ? "#fef2f2" : "#f3f4f6",
                border: `1px solid ${
                  doc.availabilityStatus === "available" ? "#22c55e" : 
                  doc.availabilityStatus === "busy" ? "#f59e42" : 
                  doc.availabilityStatus === "booked" ? "#ef4444" : "#6b7280"
                }`
              }}>
                <span style={{ 
                  color: doc.availabilityStatus === "available" ? "#22c55e" : 
                         doc.availabilityStatus === "busy" ? "#f59e42" : 
                         doc.availabilityStatus === "booked" ? "#ef4444" : "#6b7280",
                  fontWeight: "bold",
                  textTransform: "uppercase",
                  fontSize: "0.7rem"
                }}>
                  {doc.availabilityStatus === "booked" ? "BOOKED" : 
                   doc.availabilityStatus === "busy" ? "BUSY" : doc.availabilityStatus}
                </span>
                {doc.availabilityStatus === "busy" && (
                  <span style={{ color: "#a16207", fontSize: "0.6rem" }}>
                    With Patient
                  </span>
                )}
                {doc.availabilityStatus === "booked" && (
                  <span style={{ color: "#b91c1c", fontSize: "0.6rem" }}>
                    No Bookings
                  </span>
                )}
              </div>
              <button 
                onClick={() => navigate(`/doctors/${doc._id}`)} 
                style={{ 
                  marginTop: 8, 
                  padding: "8px 20px", 
                  background: doc.availabilityStatus === "available" ? "#3b82f6" : 
                             doc.availabilityStatus === "booked" ? "#ef4444" : "#9ca3af", 
                  color: "#fff", 
                  border: "none", 
                  borderRadius: 6, 
                  fontWeight: 600, 
                  fontSize: 15, 
                  cursor: doc.availabilityStatus === "available" ? "pointer" : "not-allowed" 
                }}
                disabled={doc.availabilityStatus !== "available"}
              >
                {doc.availabilityStatus === "available" ? "View Profile" : 
                 doc.availabilityStatus === "booked" ? "Fully Booked" : "Unavailable"}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DoctorList; 