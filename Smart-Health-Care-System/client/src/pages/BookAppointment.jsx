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

  // New states for validation
  const [phone, setPhone] = useState("");
  const [age, setAge] = useState("");

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

    // Set default date to tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setSelectedDate(tomorrow.toISOString().split("T")[0]);

    // Set default time to 9:00 AM
    setSelectedTime("09:00");
  }, [doctorId]);

  const selectedReasonObj =
    REASON_OPTIONS.find((r) => r.value === reason) || REASON_OPTIONS[0];
  const duration = selectedReasonObj.duration;

  const isDoctorAvailable = doctor?.availabilityStatus === "available";
  const isDoctorBooked = doctor?.availabilityStatus === "booked";

  const isDateTimeValid = () => {
    if (!selectedDate || !selectedTime) return false;
    const selectedDateTime = new Date(`${selectedDate}T${selectedTime}`);
    const now = new Date();
    return selectedDateTime > now;
  };

  // Phone validation
  const isPhoneValid = (phone) => {
    return /^\+?[0-9]{7,15}$/.test(phone); // allows + and 7–15 digits
  };

  // Age bounds check (optional)
  const isAgeValid = (age) => {
    if (!age) return true; // optional
    const n = Number(age);
    return n >= 0 && n <= 120;
  };

  const handleBook = async (e) => {
    e.preventDefault();

    // Validate inputs
    if (!selectedDate || !selectedTime) {
      setError("Please select a date and time.");
      return;
    }
    if (!isDateTimeValid()) {
      setError(
        "Cannot book appointments in the past. Please select a future date and time."
      );
      return;
    }
    if (!isPhoneValid(phone)) {
      setError("Please enter a valid phone number (7–15 digits).");
      return;
    }
    if (!isAgeValid(age)) {
      setError("Please enter a valid age between 0 and 120.");
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
      if (!token) {
        setError("Please login to book an appointment.");
        return;
      }

      const bookingEndTime = addMinutes(selectedTime, duration);
      const requestBody = {
        doctorId,
        slot: {
          date: selectedDate,
          startTime: selectedTime,
          endTime: bookingEndTime,
        },
        reason,
        phone,
        age,
      };

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
        throw new Error(
          data.message || `Failed to book appointment (${res.status})`
        );
      }

      setSuccess("Appointment booked successfully!");
      setTimeout(() => navigate("/appointments"), 1200);
    } catch (err) {
      setError(err.message || "Error booking appointment");
    } finally {
      setBooking(false);
    }
  };

  if (loading)
    return (
      <div style={{ textAlign: "center", marginTop: 80 }}>Loading doctor...</div>
    );
  if (error)
    return (
      <div style={{ color: "#ef4444", textAlign: "center", marginTop: 80 }}>
        {error}
      </div>
    );
  if (!doctor) return null;

  return (
    <div
      style={{
        maxWidth: 500,
        margin: "2.5rem auto",
        background: "#fff",
        borderRadius: 16,
        boxShadow: "0 4px 24px #e0e7ef",
        padding: 32,
      }}
    >
      <h2 style={{ textAlign: "center", marginBottom: 16 }}>Book Appointment</h2>

      {/* Doctor Info */}
      <div style={{ textAlign: "center", marginBottom: 24 }}>
        <div style={{ fontWeight: 700, fontSize: 22 }}>{doctor.name}</div>
        <div style={{ color: "#3b82f6", fontSize: 16 }}>{doctor.category}</div>
        <div style={{ color: "#6b7280", fontSize: 14 }}>
          {doctor.qualifications}
        </div>
      </div>

      {/* Booking Form */}
      <form
        onSubmit={handleBook}
        autoComplete="off"
        style={{ opacity: isDoctorAvailable ? 1 : 0.5 }}
      >
        {/* Reason */}
        <div style={{ marginBottom: 18 }}>
          <label style={{ fontWeight: 500, display: "block", marginBottom: 6 }}>
            Reason/Seriousness
          </label>
          <select
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            style={{
              width: "100%",
              padding: 12,
              borderRadius: 8,
              border: "1.5px solid #d1d5db",
              fontSize: 16,
            }}
            disabled={!isDoctorAvailable}
          >
            {REASON_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Phone */}
        <div style={{ marginBottom: 18 }}>
          <label style={{ fontWeight: 500, display: "block", marginBottom: 6 }}>
            Phone Number
          </label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+977XXXXXXXXX"
            style={{
              width: "100%",
              padding: 12,
              borderRadius: 8,
              border: "1.5px solid #d1d5db",
              fontSize: 16,
            }}
            required
          />
        </div>

        {/* Age */}
        <div style={{ marginBottom: 18 }}>
          <label style={{ fontWeight: 500, display: "block", marginBottom: 6 }}>
            Age (Optional)
          </label>
          <input
            type="number"
            value={age}
            onChange={(e) => setAge(e.target.value)}
            placeholder="e.g. 35"
            style={{
              width: "100%",
              padding: 12,
              borderRadius: 8,
              border: "1.5px solid #d1d5db",
              fontSize: 16,
            }}
          />
        </div>

        {/* Date */}
        <div style={{ marginBottom: 18 }}>
          <label style={{ fontWeight: 500, display: "block", marginBottom: 6 }}>
            Select Date
          </label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            min={new Date().toISOString().split("T")[0]}
            style={{
              width: "100%",
              padding: 12,
              borderRadius: 8,
              border: "1.5px solid #d1d5db",
              fontSize: 16,
            }}
            disabled={!isDoctorAvailable}
          />
        </div>

        {/* Time */}
        <div style={{ marginBottom: 24 }}>
          <label style={{ fontWeight: 500, display: "block", marginBottom: 6 }}>
            Select Time
          </label>
          <input
            type="time"
            value={selectedTime}
            onChange={(e) => setSelectedTime(e.target.value)}
            style={{
              width: "100%",
              padding: 12,
              borderRadius: 8,
              border: "1.5px solid #d1d5db",
              fontSize: 16,
            }}
            disabled={!isDoctorAvailable}
          />
        </div>

        {error && <div style={{ color: "#ef4444", marginBottom: 10 }}>{error}</div>}
        {success && (
          <div style={{ color: "#22c55e", marginBottom: 10 }}>{success}</div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={!isDoctorAvailable || !isDateTimeValid() || booking}
          style={{
            width: "100%",
            padding: 14,
            background:
              isDoctorAvailable && isDateTimeValid()
                ? "#3b82f6"
                : isDoctorBooked
                ? "#ef4444"
                : "#9ca3af",
            color: "#fff",
            border: "none",
            borderRadius: 8,
            fontWeight: 600,
            fontSize: 16,
            cursor:
              isDoctorAvailable && isDateTimeValid() && !booking
                ? "pointer"
                : "not-allowed",
          }}
        >
          {booking
            ? "Booking..."
            : !isDateTimeValid()
            ? "Select Future Date/Time"
            : isDoctorAvailable
            ? "Book Appointment"
            : isDoctorBooked
            ? "Doctor Fully Booked"
            : "Doctor Unavailable"}
        </button>
      </form>
    </div>
  );
};

export default BookAppointment;
