import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

const DoctorProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [doctor, setDoctor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchDoctor = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(`/api/doctors/${id}`);
        if (!res.ok) throw new Error("Failed to fetch doctor");
        const data = await res.json();
        setDoctor(data.doctor);
      } catch (err) {
        setError(err.message || "Error fetching doctor");
      } finally {
        setLoading(false);
      }
    };
    fetchDoctor();
  }, [id]);

  if (loading) return <div style={{ textAlign: "center", marginTop: 80 }}>Loading doctor...</div>;
  if (error) return <div style={{ color: "#ef4444", textAlign: "center", marginTop: 80 }}>{error}</div>;
  if (!doctor) return null;

  return (
    <div style={{ maxWidth: 500, margin: "2.5rem auto", background: "#fff", borderRadius: 16, boxShadow: "0 4px 24px #e0e7ef", padding: 32 }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
        <div style={{ width: 100, height: 100, borderRadius: "50%", background: "#e5e7eb", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 36, color: "#3b82f6", fontWeight: 700, marginBottom: 16, overflow: "hidden" }}>
          {doctor.photo ? (
            <img src={doctor.photo} alt={doctor.name} style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }} />
          ) : (
            doctor.name.split(" ").map(n => n[0]).join("").toUpperCase()
          )}
        </div>
        <div style={{ fontWeight: 700, fontSize: 24, marginBottom: 4 }}>{doctor.name}</div>
        <div style={{ color: "#3b82f6", fontSize: 17, marginBottom: 4 }}>{doctor.category}</div>
        <div style={{ color: "#6b7280", fontSize: 15, marginBottom: 4 }}>{doctor.qualifications}</div>
        <div style={{ color: "#6b7280", fontSize: 15, marginBottom: 4 }}>Experience: {doctor.experience} yrs</div>
        <div style={{ color: "#6b7280", fontSize: 15, marginBottom: 4 }}>{doctor.expertise}</div>
        <div style={{ color: "#222", fontWeight: 500, marginBottom: 8 }}>Fee: Rs. {doctor.fee}</div>
        {doctor.contactInfo && <div style={{ color: "#6b7280", fontSize: 15, marginBottom: 8 }}>{doctor.contactInfo}</div>}
        
        {/* Availability Status */}
        <div style={{ 
          display: "flex", 
          alignItems: "center", 
          justifyContent: "center",
          gap: "0.5rem", 
          marginTop: "1rem",
          padding: "0.5rem",
          borderRadius: "6px",
          background: doctor.availabilityStatus === "available" ? "#f0fdf4" : 
                     doctor.availabilityStatus === "busy" ? "#fef3c7" : 
                     doctor.availabilityStatus === "booked" ? "#fef2f2" : "#f3f4f6",
          border: `1px solid ${
            doctor.availabilityStatus === "available" ? "#22c55e" : 
            doctor.availabilityStatus === "busy" ? "#f59e42" : 
            doctor.availabilityStatus === "booked" ? "#ef4444" : "#6b7280"
          }`
        }}>
          <span style={{ 
            color: doctor.availabilityStatus === "available" ? "#22c55e" : 
                   doctor.availabilityStatus === "busy" ? "#f59e42" : 
                   doctor.availabilityStatus === "booked" ? "#ef4444" : "#6b7280",
            fontWeight: "bold",
            textTransform: "uppercase",
            fontSize: "0.8rem"
          }}>
            {doctor.availabilityStatus === "booked" ? "BOOKED" : doctor.availabilityStatus}
          </span>
          {doctor.availabilityStatus !== "available" && (
            <span style={{ color: "#64748b", fontSize: "0.8rem" }}>
              {doctor.availabilityStatus === "busy" ? "Currently with patient" : 
               doctor.availabilityStatus === "booked" ? "No new bookings" : "Offline"}
            </span>
          )}
        </div>
        
        <button
          style={{ 
            marginTop: 16, 
            padding: "10px 32px", 
            background: doctor.availabilityStatus === "available" ? "#3b82f6" : 
                       doctor.availabilityStatus === "booked" ? "#ef4444" : "#9ca3af", 
            color: "#fff", 
            border: "none", 
            borderRadius: 6, 
            fontWeight: 600, 
            fontSize: 16, 
            cursor: doctor.availabilityStatus === "available" ? "pointer" : "not-allowed" 
          }}
          onClick={() => navigate(`/book/${doctor._id}`)}
          disabled={doctor.availabilityStatus !== "available"}
        >
          {doctor.availabilityStatus === "available" ? "Book Appointment" : 
           doctor.availabilityStatus === "booked" ? "Doctor Fully Booked" : "Doctor Unavailable"}
        </button>
      </div>
      <div style={{ marginTop: 32 }}>
        <h4 style={{ marginBottom: 12 }}>Available Slots</h4>
        {doctor.availableSlots && doctor.availableSlots.length > 0 ? (
          <ul style={{ paddingLeft: 0, listStyle: "none" }}>
            {doctor.availableSlots.map((slot, idx) => (
              <li key={idx} style={{ marginBottom: 8, color: slot.isBooked ? '#aaa' : '#222' }}>
                {slot.isBooked
                  ? `Booked from ${slot.startTime} to ${slot.endTime}`
                  : `Available from ${slot.startTime} to ${slot.endTime}`}
              </li>
            ))}
          </ul>
        ) : (
          <div style={{ color: "#888" }}>No available slots.</div>
        )}
      </div>
    </div>
  );
};

export default DoctorProfile; 