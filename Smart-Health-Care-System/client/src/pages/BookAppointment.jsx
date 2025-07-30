import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

const REASON_OPTIONS = [
  { label: "Routine checkup", value: "Routine checkup", duration: 15 },
  { label: "New diagnosis", value: "New diagnosis", duration: 30 },
  { label: "Emergency", value: "Emergency", duration: 45 },
];

function addMinutes(time, mins) {
  const [h, m] = time.split(":").map(Number);
  const date = new Date(0, 0, 0, h, m + mins);
  return date.toTimeString().slice(0, 5);
}

const BookAppointment = () => {
  const { doctorId } = useParams();
  const navigate = useNavigate();
  const [doctor, setDoctor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [reason, setReason] = useState(REASON_OPTIONS[0].value);
  const [booking, setBooking] = useState(false);

  useEffect(() => {
    const fetchDoctor = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(`/api/doctors/${doctorId}`);
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
  }, [doctorId]);

  // Find the selected reason's duration
  const selectedReasonObj = REASON_OPTIONS.find(r => r.value === reason) || REASON_OPTIONS[0];
  const duration = selectedReasonObj.duration;

  // Only show slots that fit the required duration
  const availableSlots = doctor?.availableSlots?.filter(s => {
    if (s.isBooked) return false;
    // Check if slot duration is enough
    return (
      addMinutes(s.startTime, duration) <= s.endTime
    );
  }) || [];

  const handleBook = async (e) => {
    e.preventDefault();
    if (!selectedSlot) {
      setError("Please select a slot.");
      return;
    }
    setBooking(true);
    setError("");
    setSuccess("");
    try {
      const token = localStorage.getItem("token");
      // Calculate the end time for this booking
      const bookingEndTime = addMinutes(selectedSlot.startTime, duration);
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          doctorId,
          slot: {
            date: selectedSlot.date,
            startTime: selectedSlot.startTime,
            endTime: bookingEndTime
          },
          reason,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to book appointment");
      }
      setSuccess("Appointment booked successfully!");
      setTimeout(() => navigate("/appointments"), 1200);
    } catch (err) {
      setError(err.message || "Error booking appointment");
    } finally {
      setBooking(false);
    }
  };

  if (loading) return <div style={{ textAlign: "center", marginTop: 80 }}>Loading doctor...</div>;
  if (error) return <div style={{ color: "#ef4444", textAlign: "center", marginTop: 80 }}>{error}</div>;
  if (!doctor) return null;

  return (
    <div style={{ maxWidth: 500, margin: "2.5rem auto", background: "#fff", borderRadius: 16, boxShadow: "0 4px 24px #e0e7ef", padding: 32 }}>
      <h2 style={{ textAlign: "center", marginBottom: 16 }}>Book Appointment</h2>
      <div style={{ textAlign: "center", marginBottom: 24 }}>
        <div style={{ fontWeight: 700, fontSize: 22 }}>{doctor.name}</div>
        <div style={{ color: "#3b82f6", fontSize: 16 }}>{doctor.category}</div>
        <div style={{ color: "#6b7280", fontSize: 14 }}>{doctor.qualifications}</div>
      </div>
      <form onSubmit={handleBook} autoComplete="off">
        <div style={{ marginBottom: 18 }}>
          <label style={{ fontWeight: 500, display: "block", marginBottom: 6 }}>Reason/Seriousness</label>
          <select
            value={reason}
            onChange={e => setReason(e.target.value)}
            style={{ width: "100%", padding: 8, borderRadius: 6, border: "1.5px solid #3b82f6", background: "#f8fafc" }}
          >
            {REASON_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label} ({opt.duration} min)</option>
            ))}
          </select>
        </div>
        <div style={{ marginBottom: 18 }}>
          <label style={{ fontWeight: 500, display: "block", marginBottom: 6 }}>Select Slot</label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            {availableSlots.length > 0 ? (
              availableSlots.map((slot, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSelectedSlot(slot)}
                  style={{
                    padding: "8px 14px",
                    borderRadius: 6,
                    border: selectedSlot === slot ? "2px solid #3b82f6" : "1px solid #e5e7eb",
                    background: selectedSlot === slot ? "#3b82f6" : "#f8fafc",
                    color: selectedSlot === slot ? "#fff" : "#222",
                    fontWeight: 500,
                    cursor: "pointer",
                  }}
                >
                  {slot.date} {slot.startTime} to {slot.endTime}
                </button>
              ))
            ) : (
              <div style={{ color: "#888" }}>No available slots for the selected reason/duration.</div>
            )}
          </div>
        </div>
        {error && <div style={{ color: "#ef4444", marginBottom: 10 }}>{error}</div>}
        {success && <div style={{ color: "#22c55e", marginBottom: 10 }}>{success}</div>}
        <button
          type="submit"
          disabled={booking}
          style={{ width: "100%", padding: "10px 0", background: "#3b82f6", color: "#fff", border: "none", borderRadius: 6, fontWeight: 600, fontSize: 16, cursor: booking ? "not-allowed" : "pointer" }}
        >
          {booking ? "Booking..." : "Book Appointment"}
        </button>
      </form>
    </div>
  );
};

export default BookAppointment; 