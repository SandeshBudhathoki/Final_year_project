import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const DoctorList = () => {
  const [doctors, setDoctors] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [bookingData, setBookingData] = useState({
    date: "",
    time: "",
    reason: "Routine checkup"
  });
  const [booking, setBooking] = useState(false);
  const navigate = useNavigate();

  // Set default date to tomorrow
  useEffect(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setBookingData(prev => ({ ...prev, date: tomorrow.toISOString().split('T')[0] }));
  }, []);

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

  const handleDoctorClick = (doctor) => {
    setSelectedDoctor(doctor);
    setShowModal(true);
  };

  const handleBookAppointment = async () => {
    if (!bookingData.date || !bookingData.time) {
      alert("Please select date and time");
      return;
    }

    setBooking(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        alert("Please login to book an appointment");
        return;
      }

      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          doctorId: selectedDoctor._id,
          slot: {
            date: bookingData.date,
            startTime: bookingData.time,
            endTime: addMinutes(bookingData.time, getDuration(bookingData.reason))
          },
          reason: bookingData.reason,
          status: "pending"
        }),
      });

      if (res.ok) {
        alert("Appointment booked successfully!");
        setShowModal(false);
        setSelectedDoctor(null);
        // Refresh doctors list to update availability
        window.location.reload();
      } else {
        const errorData = await res.json();
        alert(errorData.message || "Failed to book appointment");
      }
    } catch (error) {
      alert("Error booking appointment");
    } finally {
      setBooking(false);
    }
  };

  const addMinutes = (time, mins) => {
    const [h, m] = time.split(":").map(Number);
    const date = new Date(0, 0, 0, h, m + mins);
    return date.toTimeString().slice(0, 5);
  };

  const getDuration = (reason) => {
    const durations = {
      "Routine checkup": 15,
      "New diagnosis": 30,
      "Emergency": 45
    };
    return durations[reason] || 15;
  };

  const isDateTimeValid = () => {
    if (!bookingData.date || !bookingData.time) return false;
    const selectedDateTime = new Date(`${bookingData.date}T${bookingData.time}`);
    const now = new Date();
    return selectedDateTime > now;
  };

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
            <div 
              key={doc._id} 
              onClick={() => handleDoctorClick(doc)}
              style={{ 
                background: "#fff", 
                borderRadius: 12, 
                boxShadow: "0 2px 12px #e0e7ef", 
                padding: 24, 
                display: "flex", 
                flexDirection: "column", 
                alignItems: "center",
                cursor: "pointer",
                transition: "all 0.2s ease",
                border: "1px solid transparent"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-4px)";
                e.currentTarget.style.boxShadow = "0 8px 25px rgba(0,0,0,0.15)";
                e.currentTarget.style.borderColor = "#3b82f6";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 2px 12px #e0e7ef";
                e.currentTarget.style.borderColor = "transparent";
              }}
            >
              {/* Enhanced Profile Picture */}
              <div style={{ 
                width: 100, 
                height: 100, 
                borderRadius: "50%", 
                marginBottom: 16, 
                overflow: "hidden",
                border: "3px solid #e5e7eb",
                boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
              }}>
                {doc.photo ? (
                  <img 
                    src={doc.photo} 
                    alt={doc.name} 
                    style={{ 
                      width: "100%", 
                      height: "100%", 
                      objectFit: "cover" 
                    }}
                    onError={(e) => {
                      e.target.style.display = "none";
                      e.target.nextSibling.style.display = "flex";
                    }}
                  />
                ) : null}
                <div style={{ 
                  width: "100%", 
                  height: "100%", 
                  background: "#3b82f6", 
                  display: doc.photo ? "none" : "flex",
                  alignItems: "center", 
                  justifyContent: "center", 
                  fontSize: 28, 
                  color: "#fff", 
                  fontWeight: 700 
                }}>
                  {doc.name.split(" ").map(n => n[0]).join("").toUpperCase()}
                </div>
              </div>
              
              {/* Doctor Info */}
              <div style={{ textAlign: "center", marginBottom: 16 }}>
                <div style={{ fontWeight: 600, fontSize: 18, marginBottom: 4, color: "#1f2937" }}>{doc.name}</div>
                <div style={{ color: "#3b82f6", fontSize: 15, marginBottom: 4, fontWeight: "500" }}>{doc.category}</div>
                {doc.qualifications && (
                  <div style={{ color: "#6b7280", fontSize: 14, marginBottom: 4 }}>{doc.qualifications}</div>
                )}
                {doc.experience && (
                  <div style={{ color: "#6b7280", fontSize: 14, marginBottom: 4 }}>Experience: {doc.experience} yrs</div>
                )}
                {doc.expertise && (
                  <div style={{ color: "#6b7280", fontSize: 14, marginBottom: 8 }}>{doc.expertise}</div>
                )}
                <div style={{ color: "#222", fontWeight: 600, marginBottom: 12, fontSize: 16 }}>Rs. {doc.fee}</div>
              </div>

              {/* Enhanced Status Display */}
              <div style={{ 
                display: "flex", 
                alignItems: "center", 
                gap: "0.5rem", 
                marginBottom: 16,
                padding: "8px 16px",
                borderRadius: "20px",
                background: doc.availabilityStatus === "available" ? "#f0fdf4" : 
                           doc.availabilityStatus === "busy" ? "#fef3c7" : 
                           doc.availabilityStatus === "booked" ? "#fef2f2" : "#f3f4f6",
                border: `2px solid ${
                  doc.availabilityStatus === "available" ? "#22c55e" : 
                  doc.availabilityStatus === "busy" ? "#f59e42" : 
                  doc.availabilityStatus === "booked" ? "#ef4444" : "#6b7280"
                }`
              }}>
                <div style={{
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  background: doc.availabilityStatus === "available" ? "#22c55e" : 
                             doc.availabilityStatus === "busy" ? "#f59e42" : 
                             doc.availabilityStatus === "booked" ? "#ef4444" : "#6b7280"
                }} />
                <span style={{ 
                  color: doc.availabilityStatus === "available" ? "#22c55e" : 
                         doc.availabilityStatus === "busy" ? "#f59e42" : 
                         doc.availabilityStatus === "booked" ? "#ef4444" : "#6b7280",
                  fontWeight: "600",
                  textTransform: "uppercase",
                  fontSize: "0.75rem"
                }}>
                  {doc.availabilityStatus === "booked" ? "Fully Booked" : 
                   doc.availabilityStatus === "busy" ? "With Patient" : 
                   doc.availabilityStatus === "available" ? "Available" : "Offline"}
                </span>
              </div>

              {/* Action Button */}
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  handleDoctorClick(doc);
                }}
                style={{ 
                  width: "100%",
                  padding: "12px 20px", 
                  background: doc.availabilityStatus === "available" ? "#3b82f6" : 
                             doc.availabilityStatus === "booked" ? "#ef4444" : "#9ca3af", 
                  color: "#fff", 
                  border: "none", 
                  borderRadius: "8px", 
                  fontWeight: "600", 
                  fontSize: "14px", 
                  cursor: doc.availabilityStatus === "available" ? "pointer" : "not-allowed",
                  transition: "background-color 0.2s"
                }}
                disabled={doc.availabilityStatus !== "available"}
              >
                {doc.availabilityStatus === "available" ? "View Profile & Book" : 
                 doc.availabilityStatus === "booked" ? "Fully Booked" : "Unavailable"}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Doctor Profile Modal */}
      {showModal && selectedDoctor && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0, 0, 0, 0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000,
          padding: "20px"
        }}>
          <div style={{
            background: "#fff",
            borderRadius: "16px",
            maxWidth: "600px",
            width: "100%",
            maxHeight: "90vh",
            overflow: "auto",
            position: "relative"
          }}>
            {/* Close Button */}
            <button
              onClick={() => setShowModal(false)}
              style={{
                position: "absolute",
                top: "16px",
                right: "16px",
                background: "#ef4444",
                color: "#fff",
                border: "none",
                borderRadius: "50%",
                width: "32px",
                height: "32px",
                cursor: "pointer",
                fontSize: "18px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}
            >
              ×
            </button>

            {/* Modal Content */}
            <div style={{ padding: "32px" }}>
              {/* Doctor Header */}
              <div style={{ textAlign: "center", marginBottom: "32px" }}>
                <div style={{
                  width: "120px",
                  height: "120px",
                  borderRadius: "50%",
                  margin: "0 auto 16px",
                  overflow: "hidden",
                  border: "4px solid #e5e7eb",
                  boxShadow: "0 4px 16px rgba(0,0,0,0.1)"
                }}>
                  {selectedDoctor.photo ? (
                    <img
                      src={selectedDoctor.photo}
                      alt={selectedDoctor.name}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover"
                      }}
                    />
                  ) : (
                    <div style={{
                      width: "100%",
                      height: "100%",
                      background: "#3b82f6",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "36px",
                      color: "#fff",
                      fontWeight: "700"
                    }}>
                      {selectedDoctor.name.split(" ").map(n => n[0]).join("").toUpperCase()}
                    </div>
                  )}
                </div>
                
                <h2 style={{ marginBottom: "8px", color: "#1f2937" }}>{selectedDoctor.name}</h2>
                <div style={{ color: "#3b82f6", fontSize: "18px", fontWeight: "600", marginBottom: "16px" }}>
                  {selectedDoctor.category}
                </div>
                
                {/* Status Badge */}
                <div style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "8px 16px",
                  borderRadius: "20px",
                  background: selectedDoctor.availabilityStatus === "available" ? "#f0fdf4" : 
                             selectedDoctor.availabilityStatus === "busy" ? "#fef3c7" : 
                             selectedDoctor.availabilityStatus === "booked" ? "#fef2f2" : "#f3f4f6",
                  border: `2px solid ${
                    selectedDoctor.availabilityStatus === "available" ? "#22c55e" : 
                    selectedDoctor.availabilityStatus === "busy" ? "#f59e42" : 
                    selectedDoctor.availabilityStatus === "booked" ? "#ef4444" : "#6b7280"
                  }`
                }}>
                  <div style={{
                    width: "10px",
                    height: "10px",
                    borderRadius: "50%",
                    background: selectedDoctor.availabilityStatus === "available" ? "#22c55e" : 
                               selectedDoctor.availabilityStatus === "busy" ? "#f59e42" : 
                               selectedDoctor.availabilityStatus === "booked" ? "#ef4444" : "#6b7280"
                  }} />
                  <span style={{
                    color: selectedDoctor.availabilityStatus === "available" ? "#22c55e" : 
                           selectedDoctor.availabilityStatus === "busy" ? "#f59e42" : 
                           selectedDoctor.availabilityStatus === "booked" ? "#ef4444" : "#6b7280",
                    fontWeight: "600",
                    textTransform: "uppercase",
                    fontSize: "14px"
                  }}>
                    {selectedDoctor.availabilityStatus === "booked" ? "Fully Booked" : 
                     selectedDoctor.availabilityStatus === "busy" ? "With Patient" : 
                     selectedDoctor.availabilityStatus === "available" ? "Available" : "Offline"}
                  </span>
                </div>
              </div>

              {/* Doctor Details */}
              <div style={{ marginBottom: "32px" }}>
                <h3 style={{ marginBottom: "16px", color: "#374151" }}>Professional Information</h3>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                  {selectedDoctor.qualifications && (
                    <div>
                      <strong>Qualifications:</strong> {selectedDoctor.qualifications}
                    </div>
                  )}
                  {selectedDoctor.experience && (
                    <div>
                      <strong>Experience:</strong> {selectedDoctor.experience} years
                    </div>
                  )}
                  {selectedDoctor.expertise && (
                    <div>
                      <strong>Expertise:</strong> {selectedDoctor.expertise}
                    </div>
                  )}
                  <div>
                    <strong>Consultation Fee:</strong> Rs. {selectedDoctor.fee}
                  </div>
                </div>
              </div>

              {/* Booking Form - Only show if doctor is available */}
              {selectedDoctor.availabilityStatus === "available" ? (
                <div>
                  <h3 style={{ marginBottom: "16px", color: "#374151" }}>Book Appointment</h3>
                  
                  <div style={{ marginBottom: "16px" }}>
                    <label style={{ display: "block", marginBottom: "8px", fontWeight: "500" }}>
                      Reason for Visit
                    </label>
                    <select
                      value={bookingData.reason}
                      onChange={(e) => setBookingData({...bookingData, reason: e.target.value})}
                      style={{
                        width: "100%",
                        padding: "12px",
                        borderRadius: "8px",
                        border: "1px solid #d1d5db",
                        fontSize: "16px"
                      }}
                    >
                      <option value="Routine checkup">Routine checkup (15 min)</option>
                      <option value="New diagnosis">New diagnosis (30 min)</option>
                      <option value="Emergency">Emergency (45 min)</option>
                    </select>
                  </div>

                  <div style={{ marginBottom: "16px" }}>
                    <label style={{ display: "block", marginBottom: "8px", fontWeight: "500" }}>
                      Date
                    </label>
                    <input
                      type="date"
                      value={bookingData.date}
                      onChange={(e) => setBookingData({...bookingData, date: e.target.value})}
                      min={new Date().toISOString().split('T')[0]}
                      style={{
                        width: "100%",
                        padding: "12px",
                        borderRadius: "8px",
                        border: "1px solid #d1d5db",
                        fontSize: "16px"
                      }}
                    />
                  </div>

                  <div style={{ marginBottom: "24px" }}>
                    <label style={{ display: "block", marginBottom: "8px", fontWeight: "500" }}>
                      Time
                    </label>
                    <input
                      type="time"
                      value={bookingData.time}
                      onChange={(e) => setBookingData({...bookingData, time: e.target.value})}
                      style={{
                        width: "100%",
                        padding: "12px",
                        borderRadius: "8px",
                        border: "1px solid #d1d5db",
                        fontSize: "16px"
                      }}
                    />
                  </div>

                  <button
                    onClick={handleBookAppointment}
                    disabled={!isDateTimeValid() || booking}
                    style={{
                      width: "100%",
                      padding: "16px",
                      background: isDateTimeValid() ? "#3b82f6" : "#9ca3af",
                      color: "#fff",
                      border: "none",
                      borderRadius: "8px",
                      fontWeight: "600",
                      fontSize: "16px",
                      cursor: isDateTimeValid() && !booking ? "pointer" : "not-allowed"
                    }}
                  >
                    {booking ? "Booking..." : "Book Appointment"}
                  </button>
                </div>
              ) : (
                <div style={{
                  background: selectedDoctor.availabilityStatus === "booked" ? "#fef2f2" : "#fef3c7",
                  border: `1px solid ${selectedDoctor.availabilityStatus === "booked" ? "#ef4444" : "#f59e42"}`,
                  borderRadius: "8px",
                  padding: "16px",
                  textAlign: "center",
                  color: selectedDoctor.availabilityStatus === "booked" ? "#dc2626" : "#92400e"
                }}>
                  {selectedDoctor.availabilityStatus === "booked" 
                    ? "This doctor is fully booked and not available for new appointments."
                    : "This doctor is currently unavailable. Please try again later."
                  }
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorList; 