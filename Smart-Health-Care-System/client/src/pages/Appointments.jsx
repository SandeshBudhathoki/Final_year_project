import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import BookAppointment from "./BookAppointment";

const getStatusColor = (status) => {
  if (status === "completed") return "#22c55e";
  if (status === "cancelled") return "#ef4444";
  return "#3b82f6";
};

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

const Appointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [canceling, setCanceling] = useState("");
  const [success, setSuccess] = useState("");
  const [tab, setTab] = useState("upcoming");
  const [doctors, setDoctors] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const navigate = useNavigate();
  const [rescheduleId, setRescheduleId] = useState("");
  const [rescheduleReason, setRescheduleReason] = useState(REASON_OPTIONS[0].value);
  const [rescheduleSlot, setRescheduleSlot] = useState(null);
  const [rescheduleLoading, setRescheduleLoading] = useState(false);
  const [rescheduleError, setRescheduleError] = useState("");
  const [rescheduleDoctor, setRescheduleDoctor] = useState(null);
  const [rescheduleSlots, setRescheduleSlots] = useState([]);

  useEffect(() => {
    const fetchAppointments = async () => {
      setLoading(true);
      setError("");
      try {
        const token = localStorage.getItem("token");
        const res = await fetch("/api/appointments", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Failed to fetch appointments");
        const data = await res.json();
        setAppointments(data.appointments);
      } catch (err) {
        setError(err.message || "Error fetching appointments");
      } finally {
        setLoading(false);
      }
    };
    fetchAppointments();
  }, [success]);

  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const res = await fetch("/api/doctors");
        if (!res.ok) throw new Error("Failed to fetch doctors");
        const data = await res.json();
        setDoctors(data.doctors);
      } catch {}
    };
    fetchDoctors();
  }, []);

  const handleCancel = async (id) => {
    if (!window.confirm("Are you sure you want to cancel this appointment?")) return;
    setCanceling(id);
    setError("");
    setSuccess("");
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/appointments/${id}/cancel`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to cancel appointment");
      setSuccess("Appointment cancelled.");
    } catch (err) {
      setError(err.message || "Error cancelling appointment");
    } finally {
      setCanceling("");
    }
  };

  // Open reschedule form
  const openReschedule = async (app) => {
    setRescheduleId(app._id);
    setRescheduleReason(app.reason || REASON_OPTIONS[0].value);
    setRescheduleSlot(null);
    setRescheduleError("");
    setRescheduleLoading(true);
    try {
      const res = await fetch(`/api/doctors/${app.doctorId._id}`);
      if (!res.ok) throw new Error("Failed to fetch doctor");
      const data = await res.json();
      setRescheduleDoctor(data.doctor);
      // Filter slots by required duration
      const selectedReasonObj = REASON_OPTIONS.find(r => r.value === (app.reason || REASON_OPTIONS[0].value)) || REASON_OPTIONS[0];
      const duration = selectedReasonObj.duration;
      const availableSlots = data.doctor.availableSlots.filter(s => {
        if (s.isBooked) return false;
        return addMinutes(s.startTime, duration) <= s.endTime;
      });
      setRescheduleSlots(availableSlots);
    } catch (err) {
      setRescheduleError(err.message || "Error loading doctor slots");
    } finally {
      setRescheduleLoading(false);
    }
  };

  // Submit reschedule
  const handleReschedule = async (e) => {
    e.preventDefault();
    if (!rescheduleSlot) {
      setRescheduleError("Please select a slot.");
      return;
    }
    setRescheduleLoading(true);
    setRescheduleError("");
    try {
      const token = localStorage.getItem("token");
      const selectedReasonObj = REASON_OPTIONS.find(r => r.value === rescheduleReason) || REASON_OPTIONS[0];
      const duration = selectedReasonObj.duration;
      const bookingEndTime = addMinutes(rescheduleSlot.startTime, duration);
      const res = await fetch(`/api/appointments/${rescheduleId}/reschedule`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          slot: {
            date: rescheduleSlot.date,
            startTime: rescheduleSlot.startTime,
            endTime: bookingEndTime
          },
          reason: rescheduleReason,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to reschedule appointment");
      }
      setSuccess("Appointment rescheduled successfully!");
      setRescheduleId("");
    } catch (err) {
      setRescheduleError(err.message || "Error rescheduling appointment");
    } finally {
      setRescheduleLoading(false);
    }
  };

  // Tabs logic
  const now = new Date();
  const filteredAppointments = appointments.filter(app => {
    // Use startTime for filtering
    const slotDateTime = app.slot?.date && app.slot?.startTime
      ? new Date(app.slot.date + 'T' + app.slot.startTime)
      : null;
    if (tab === "upcoming") {
      return app.status === "pending" && slotDateTime && slotDateTime >= now;
    } else if (tab === "past") {
      return app.status === "completed" || app.status === "cancelled" || (slotDateTime && slotDateTime < now);
    }
    return true;
  });

  // Doctor categories
  const categories = Array.from(new Set(doctors.map(d => d.category)));
  const doctorsInCategory = selectedCategory ? doctors.filter(d => d.category === selectedCategory) : doctors;

  return (
    <div style={{ maxWidth: 1000, margin: "2rem auto", padding: 24 }}>
      <h2 style={{ marginBottom: 24 }}>My Appointments</h2>
      {/* Doctor Booking Section */}
      <div style={{ marginBottom: 36, background: "#f8fafc", borderRadius: 12, padding: 24 }}>
        <h3 style={{ marginBottom: 12 }}>Book a Doctor</h3>
        <div style={{ display: "flex", gap: 16, marginBottom: 16, flexWrap: "wrap" }}>
          <button
            onClick={() => setSelectedCategory("")}
            style={{ padding: "8px 18px", borderRadius: 6, border: selectedCategory === "" ? "2px solid #3b82f6" : "1px solid #e5e7eb", background: selectedCategory === "" ? "#3b82f6" : "#fff", color: selectedCategory === "" ? "#fff" : "#222", fontWeight: 500, cursor: "pointer" }}
          >
            All
          </button>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              style={{ padding: "8px 18px", borderRadius: 6, border: selectedCategory === cat ? "2px solid #3b82f6" : "1px solid #e5e7eb", background: selectedCategory === cat ? "#3b82f6" : "#fff", color: selectedCategory === cat ? "#fff" : "#222", fontWeight: 500, cursor: "pointer" }}
            >
              {cat}
            </button>
          ))}
        </div>
        <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
          {doctorsInCategory.length === 0 ? (
            <div>No doctors found in this category.</div>
          ) : (
            doctorsInCategory.map(doc => (
              <div key={doc._id} style={{ background: "#fff", borderRadius: 10, boxShadow: "0 2px 8px #e0e7ef", padding: 18, minWidth: 220, flex: 1, display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 12 }}>
                <div style={{ width: 60, height: 60, borderRadius: "50%", background: "#e5e7eb", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, color: "#3b82f6", fontWeight: 700, overflow: "hidden", marginBottom: 8 }}>
                  {doc.photo ? (
                    <img src={doc.photo} alt={doc.name} style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }} />
                  ) : (
                    doc.name.split(" ").map(n => n[0]).join("").toUpperCase()
                  )}
                </div>
                <div style={{ fontWeight: 600, fontSize: 16 }}>{doc.name}</div>
                <div style={{ color: "#3b82f6", fontSize: 14 }}>{doc.category}</div>
                <div style={{ color: "#6b7280", fontSize: 13 }}>{doc.qualifications}</div>
                <div style={{ color: "#6b7280", fontSize: 13 }}>Fee: Rs. {doc.fee}</div>
                <button onClick={() => navigate(`/book/${doc._id}`)} style={{ marginTop: 10, padding: "7px 18px", background: "#3b82f6", color: "#fff", border: "none", borderRadius: 6, fontWeight: 600, fontSize: 14, cursor: "pointer" }}>
                  Book Appointment
                </button>
              </div>
            ))
          )}
        </div>
      </div>
      {/* Tabs for All/Upcoming/Past */}
      <div style={{ display: "flex", gap: 16, marginBottom: 24 }}>
        <button onClick={() => setTab("all")}
          style={{ padding: "8px 18px", borderRadius: 6, border: tab === "all" ? "2px solid #3b82f6" : "1px solid #e5e7eb", background: tab === "all" ? "#3b82f6" : "#fff", color: tab === "all" ? "#fff" : "#222", fontWeight: 500, cursor: "pointer" }}>All</button>
        <button onClick={() => setTab("upcoming")}
          style={{ padding: "8px 18px", borderRadius: 6, border: tab === "upcoming" ? "2px solid #3b82f6" : "1px solid #e5e7eb", background: tab === "upcoming" ? "#3b82f6" : "#fff", color: tab === "upcoming" ? "#fff" : "#222", fontWeight: 500, cursor: "pointer" }}>Upcoming</button>
        <button onClick={() => setTab("past")}
          style={{ padding: "8px 18px", borderRadius: 6, border: tab === "past" ? "2px solid #3b82f6" : "1px solid #e5e7eb", background: tab === "past" ? "#3b82f6" : "#fff", color: tab === "past" ? "#fff" : "#222", fontWeight: 500, cursor: "pointer" }}>Past</button>
      </div>
      {loading ? (
        <div>Loading appointments...</div>
      ) : error ? (
        <div style={{ color: "#ef4444" }}>{error}</div>
      ) : filteredAppointments.length === 0 ? (
        <div>No appointments found.</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          {filteredAppointments.map(app => (
            <div key={app._id} style={{ background: "#fff", borderRadius: 10, boxShadow: "0 2px 8px #e0e7ef", padding: 20, display: "flex", alignItems: "center", gap: 18 }}>
              <div style={{ width: 60, height: 60, borderRadius: "50%", background: "#e5e7eb", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, color: "#3b82f6", fontWeight: 700, overflow: "hidden" }}>
                {app.doctorId.photo ? (
                  <img src={app.doctorId.photo} alt={app.doctorId.name} style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }} />
                ) : (
                  app.doctorId.name.split(" ").map(n => n[0]).join("").toUpperCase()
                )}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 17 }}>{app.doctorId.name}</div>
                <div style={{ color: "#3b82f6", fontSize: 14 }}>{app.doctorId.category}</div>
                <div style={{ color: "#6b7280", fontSize: 14 }}>Slot: {app.slot.date} {app.slot.startTime} to {app.slot.endTime}</div>
                <div style={{ color: "#6b7280", fontSize: 14 }}>Reason: {app.reason}</div>
                <div style={{ color: getStatusColor(app.status), fontWeight: 500, fontSize: 14 }}>Status: {app.status}</div>
              </div>
              {tab !== "past" && app.status === 'pending' && (
                <>
                  <button
                    onClick={() => handleCancel(app._id)}
                    disabled={canceling === app._id}
                    style={{ padding: "8px 16px", background: "#ef4444", color: "#fff", border: "none", borderRadius: 6, fontWeight: 600, fontSize: 15, cursor: canceling === app._id ? "not-allowed" : "pointer", marginRight: 8 }}
                  >
                    {canceling === app._id ? "Cancelling..." : "Cancel"}
                  </button>
                  <button
                    onClick={() => openReschedule(app)}
                    style={{ padding: "8px 16px", background: "#f59e42", color: "#fff", border: "none", borderRadius: 6, fontWeight: 600, fontSize: 15, cursor: "pointer" }}
                  >
                    Reschedule
                  </button>
                </>
              )}
            </div>
          ))}
        </div>
      )}
      {success && <div style={{ color: "#22c55e", marginTop: 16 }}>{success}</div>}
      {/* Reschedule Form */}
      {rescheduleId && (
        <div style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", background: "rgba(0,0,0,0.25)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "#fff", borderRadius: 12, padding: 32, minWidth: 340, maxWidth: 400, boxShadow: "0 4px 24px #e0e7ef", position: "relative" }}>
            <button onClick={() => setRescheduleId("")} style={{ position: "absolute", top: 12, right: 12, background: "none", border: "none", fontSize: 22, color: "#888", cursor: "pointer" }}>&times;</button>
            <h3 style={{ marginBottom: 18 }}>Reschedule Appointment</h3>
            {rescheduleLoading ? (
              <div>Loading...</div>
            ) : rescheduleError ? (
              <div style={{ color: "#ef4444", marginBottom: 10 }}>{rescheduleError}</div>
            ) : rescheduleDoctor ? (
              <form onSubmit={handleReschedule} autoComplete="off">
                <div style={{ marginBottom: 16 }}>
                  <label style={{ fontWeight: 500, display: "block", marginBottom: 6 }}>Reason/Seriousness</label>
                  <select
                    value={rescheduleReason}
                    onChange={e => setRescheduleReason(e.target.value)}
                    style={{ width: "100%", padding: 8, borderRadius: 6, border: "1.5px solid #3b82f6", background: "#f8fafc" }}
                  >
                    {REASON_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label} ({opt.duration} min)</option>
                    ))}
                  </select>
                </div>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ fontWeight: 500, display: "block", marginBottom: 6 }}>Select New Slot</label>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                    {rescheduleSlots.length > 0 ? (
                      rescheduleSlots.map((slot, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setRescheduleSlot(slot)}
                          style={{
                            padding: "8px 14px",
                            borderRadius: 6,
                            border: rescheduleSlot === slot ? "2px solid #3b82f6" : "1px solid #e5e7eb",
                            background: rescheduleSlot === slot ? "#3b82f6" : "#f8fafc",
                            color: rescheduleSlot === slot ? "#fff" : "#222",
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
                <button
                  type="submit"
                  disabled={rescheduleLoading}
                  style={{ width: "100%", padding: "10px 0", background: "#3b82f6", color: "#fff", border: "none", borderRadius: 6, fontWeight: 600, fontSize: 16, cursor: rescheduleLoading ? "not-allowed" : "pointer" }}
                >
                  {rescheduleLoading ? "Rescheduling..." : "Reschedule Appointment"}
                </button>
              </form>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
};

export default Appointments; 