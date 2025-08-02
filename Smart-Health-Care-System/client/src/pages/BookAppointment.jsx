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
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
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

  // Check if doctor is available
  const isDoctorAvailable = doctor?.availabilityStatus === "available";
  const isDoctorBooked = doctor?.availabilityStatus === "booked";

  const handleBook = async (e) => {
    e.preventDefault();
    if (!selectedDate || !selectedTime) {
      setError("Please select a date and time.");
      return;
    }
    if (!isDoctorAvailable) {
      setError("Doctor is not available for appointments.");
      return;
    }
    setBooking(true);
    setError("");
    setSuccess("");
    try {
      const token = localStorage.getItem("token");
      // Calculate the end time for this booking
      const bookingEndTime = addMinutes(selectedTime, duration);
      const requestBody = {
        doctorId,
        slot: {
          date: selectedDate,
          startTime: selectedTime,
          endTime: bookingEndTime
        },
        reason,
      };
      
      console.log("Sending appointment request:", requestBody);
      
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      });
      if (!res.ok) {
        const data = await res.json();
        console.error("Appointment booking failed:", data);
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
        <div style={{ 
          display: "flex", 
          alignItems: "center", 
          justifyContent: "center",
          gap: "0.5rem", 
          marginTop: "0.5rem",
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
      </div>

      {/* Show message when doctor is not available */}
      {!isDoctorAvailable && (
        <div style={{ 
          background: isDoctorBooked ? "#fef2f2" : "#fef3c7", 
          border: `1px solid ${isDoctorBooked ? "#ef4444" : "#f59e42"}`, 
          borderRadius: 8, 
          padding: 16, 
          marginBottom: 24,
          textAlign: "center"
        }}>
          <div style={{ 
            color: isDoctorBooked ? "#dc2626" : "#92400e", 
            fontWeight: 600, 
            marginBottom: 8 
          }}>
            {isDoctorBooked ? "Doctor Fully Booked" : "Doctor Currently Unavailable"}
          </div>
          <div style={{ 
            color: isDoctorBooked ? "#b91c1c" : "#a16207", 
            fontSize: 14 
          }}>
            {isDoctorBooked 
              ? "This doctor has confirmed appointments and is not available for new bookings."
              : doctor.availabilityStatus === "busy" 
                ? "This doctor is currently with a patient."
                : "This doctor is currently offline. Please try again later."
            }
          </div>
        </div>
      )}

      <form onSubmit={handleBook} autoComplete="off" style={{ opacity: isDoctorAvailable ? 1 : 0.5 }}>
        <div style={{ marginBottom: 18 }}>
          <label style={{ fontWeight: 500, display: "block", marginBottom: 6 }}>Reason/Seriousness</label>
          <select
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            style={{ width: "100%", padding: 12, borderRadius: 8, border: "1.5px solid #d1d5db", fontSize: 16 }}
            disabled={!isDoctorAvailable}
          >
            {REASON_OPTIONS.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div style={{ marginBottom: 18 }}>
          <label style={{ fontWeight: 500, display: "block", marginBottom: 6 }}>Select Date</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            min={new Date().toISOString().split('T')[0]}
            style={{ width: "100%", padding: 12, borderRadius: 8, border: "1.5px solid #d1d5db", fontSize: 16 }}
            disabled={!isDoctorAvailable}
          />
        </div>
        <div style={{ marginBottom: 24 }}>
          <label style={{ fontWeight: 500, display: "block", marginBottom: 6 }}>Select Time</label>
          <input
            type="time"
            value={selectedTime}
            onChange={(e) => setSelectedTime(e.target.value)}
            style={{ width: "100%", padding: 12, borderRadius: 8, border: "1.5px solid #d1d5db", fontSize: 16 }}
            disabled={!isDoctorAvailable}
          />
        </div>
        {error && <div style={{ color: "#ef4444", marginBottom: 10 }}>{error}</div>}
        {success && <div style={{ color: "#22c55e", marginBottom: 10 }}>{success}</div>}
        <button
          type="submit"
          disabled={!isDoctorAvailable || booking}
          style={{
            width: "100%",
            padding: 14,
            background: isDoctorAvailable ? "#3b82f6" : isDoctorBooked ? "#ef4444" : "#9ca3af",
            color: "#fff",
            border: "none",
            borderRadius: 8,
            fontWeight: 600,
            fontSize: 16,
            cursor: isDoctorAvailable && !booking ? "pointer" : "not-allowed"
          }}
        >
          {booking ? "Booking..." : isDoctorAvailable ? "Book Appointment" : isDoctorBooked ? "Doctor Fully Booked" : "Doctor Unavailable"}
        </button>
      </form>
    </div>
  );
};

export default BookAppointment; 