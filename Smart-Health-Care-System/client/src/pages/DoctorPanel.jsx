import React, { useState, useEffect } from "react";
import {
  FaTachometerAlt,
  FaCalendarAlt,
  FaUserMd,
  FaHistory,
  FaUser,
  FaPlay,
  FaEye,
  FaEdit,
  FaCheckCircle,
  FaTimesCircle,
  FaClock
} from "react-icons/fa";
import { useAuth } from "../contexts/AuthContext.jsx";
import { useNavigate } from "react-router-dom";
import { Activity } from "lucide-react";
import { toast } from "react-toastify";
import "./DoctorPanel.css";

const menuItems = [
  { name: "Dashboard", icon: <FaTachometerAlt /> },
  { name: "Appointments", icon: <FaCalendarAlt /> },
  { name: "Availability", icon: <FaUserMd /> },
  { name: "Profile", icon: <FaUser /> },
  { name: "History", icon: <FaHistory /> },
];

export default function DoctorPanel() {
  const [active, setActive] = useState("Dashboard");
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);
  const [availabilityStatus, setAvailabilityStatus] = useState("available");
  const [statusNotes, setStatusNotes] = useState("");
  const [doctorInfo, setDoctorInfo] = useState(null);
  const [filterStatus, setFilterStatus] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [viewAppointment, setViewAppointment] = useState(null);
  const [appointmentHistory, setAppointmentHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [editProfile, setEditProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    name: "",
    category: "",
    qualifications: "",
    experience: "",
    expertise: "",
    fee: "",
    contactInfo: "",
    photo: ""
  });
  const [objectUrl, setObjectUrl] = useState(null);
  const { logout } = useAuth();
  const navigate = useNavigate();

  // Cleanup object URL when component unmounts or photo changes
  useEffect(() => {
    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [objectUrl]);

  // Fetch data based on active tab
  useEffect(() => {
      if (active === "Dashboard") {
      setLoading(true);
      setError(null);
      fetch("/api/doctors/me/stats", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      })
        .then((res) => {
          if (!res.ok) throw new Error("Failed to fetch stats");
          return res.json();
        })
        .then((data) => {
          setStats(data);
          setLoading(false);
        })
        .catch((err) => {
          setError(err.message);
          setLoading(false);
        });
      
      // Also fetch availability for dashboard
        fetchAvailability();
      } else if (active === "Appointments") {
        setLoading(true);
      setError(null);
      fetch("/api/appointments/doctor/my", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      })
        .then((res) => {
          if (!res.ok) throw new Error("Failed to fetch appointments");
          return res.json();
        })
        .then((data) => {
          setAppointments(data.appointments || []);
        setLoading(false);
        })
        .catch((err) => {
          setError(err.message);
          setLoading(false);
        });
      } else if (active === "History") {
        setHistoryLoading(true);
      setError(null);
      fetch("/api/appointments/doctor/history", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      })
        .then((res) => {
          if (!res.ok) throw new Error("Failed to fetch appointment history");
          return res.json();
        })
        .then((data) => {
          setAppointmentHistory(data.appointments || []);
        setHistoryLoading(false);
        })
        .catch((err) => {
          setError(err.message);
          setHistoryLoading(false);
        });
      } else if (active === "Profile") {
      setLoading(true);
      setError(null);
      fetch("/api/doctors/me/profile", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      })
        .then((res) => {
          if (!res.ok) throw new Error("Failed to fetch doctor profile");
          return res.json();
        })
        .then((data) => {
          setDoctorInfo(data.doctor);
          setProfileForm({
            name: data.doctor.name || "",
            category: data.doctor.category || "",
            qualifications: data.doctor.qualifications || "",
            experience: data.doctor.experience || "",
            expertise: data.doctor.expertise || "",
            fee: data.doctor.fee || "",
            contactInfo: data.doctor.contactInfo || "",
            photo: data.doctor.photo || ""
          });
          setLoading(false);
        })
        .catch((err) => {
          setError(err.message);
          setLoading(false);
        });
    }
  }, [active]);

  const fetchAvailability = async () => {
    try {
    const res = await fetch("/api/doctors/me/availability", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    });
    if (res.ok) {
      const data = await res.json();
      if (data.doctor) {
        setAvailabilityStatus(data.doctor.availabilityStatus);
        setStatusNotes(data.doctor.statusNotes || "");
        setDoctorInfo(data.doctor);
      }
      }
    } catch (error) {
      console.error("Error fetching availability:", error);
    }
  };

  const handleStatusUpdate = async () => {
    try {
      console.log("=== STATUS UPDATE DEBUG ===");
      console.log("Current user from localStorage:", JSON.parse(localStorage.getItem("user") || "{}"));
      console.log("Updating status to:", availabilityStatus, "Notes:", statusNotes);
      console.log("Request body:", { availabilityStatus, statusNotes });
      
    const res = await fetch("/api/doctors/me/availability", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify({ availabilityStatus, statusNotes }),
    });
      
      console.log("Response status:", res.status);
      console.log("Response headers:", Object.fromEntries(res.headers.entries()));
      
    if (res.ok) {
        const data = await res.json();
        console.log("Success response:", data);
        toast.success(data.message || `Status updated to ${availabilityStatus}`);
      fetchAvailability();
    } else {
        const errorData = await res.json();
        console.error("Status update failed:", errorData);
        toast.error(errorData.message || "Error updating status");
      }
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Error updating status");
    }
  };

  const handleAppointmentAction = async (appointmentId, action) => {
    try {
      let endpoint = `/api/appointments/${appointmentId}`;
      let body = {};
      
      // Map actions to correct endpoints and body data
      switch (action) {
        case 'start':
          endpoint += '/start';
          body = { status: 'in_progress' };
          break;
        case 'complete':
          endpoint += '/complete';
          body = {};
          break;
        case 'cancel':
          endpoint += '/cancel';
          body = {};
          break;
        case 'accept':
          endpoint += '/accept';
          body = {};
          break;
        case 'reject':
          endpoint += '/reject';
          body = {};
          break;
        default:
          // For other actions, use the generic status update
          endpoint += '/status';
          body = { status: action };
      }
      
      const res = await fetch(endpoint, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
        body: JSON.stringify(body),
    });
      
    if (res.ok) {
        toast.success(`Appointment ${action} successfully`);
        // Refresh appointments
        setActive("Appointments");
    } else {
        const errorData = await res.json();
        toast.error(errorData.message || `Failed to ${action} appointment`);
      }
    } catch (error) {
      console.error(`Error ${action}ing appointment:`, error);
      toast.error(`Failed to ${action} appointment`);
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    try {
      // Create FormData for file upload
      const formData = new FormData();
      formData.append("name", profileForm.name);
      formData.append("category", profileForm.category);
      formData.append("qualifications", profileForm.qualifications);
      formData.append("experience", profileForm.experience);
      formData.append("expertise", profileForm.expertise);
      formData.append("fee", profileForm.fee);
      formData.append("contactInfo", profileForm.contactInfo);
      
      // Add photo if it's a file
      if (profileForm.photo instanceof File) {
        console.log("Adding photo to FormData:", profileForm.photo.name, profileForm.photo.size, profileForm.photo.type);
        formData.append("photo", profileForm.photo);
      } else {
        console.log("No photo file to upload");
      }

      console.log("FormData contents:");
      for (let [key, value] of formData.entries()) {
        console.log(key, ":", value);
      }

    const res = await fetch("/api/doctors/me/profile", {
      method: "PUT",
      headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
        body: formData, // Use FormData instead of JSON
    });
      
    if (res.ok) {
      toast.success("Profile updated successfully");
      setEditProfile(false);
        setActive("Profile"); // Refresh profile data
    } else {
        const errorData = await res.json();
        console.error("Profile update failed:", errorData);
        const errorMessage = errorData.message || errorData.error || "Error updating profile";
        toast.error(errorMessage);
      }
    } catch (error) {
      console.error("Profile update error:", error);
      let errorMessage = "Error updating profile";
      
      if (error.message) {
        errorMessage = error.message;
      } else if (error.name === "TypeError" && error.message.includes("fetch")) {
        errorMessage = "Network error. Please check your connection.";
      }
      
      toast.error(errorMessage);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: '#3b82f6',
      confirmed: '#22c55e', 
      in_progress: '#f59e42',
      completed: '#059669',
      cancelled: '#ef4444',
      rejected: '#dc2626',
      no_show: '#7c3aed',
      rescheduled: '#0891b2'
    };
    return colors[status] || '#6b7280';
  };

  const filteredAppointments = appointments.filter(app => {
    const statusMatch = filterStatus === "" || app.status === filterStatus;
    const dateMatch = filterDate === "" || (app.slot?.date && app.slot.date === filterDate);
    return statusMatch && dateMatch;
  });

  const filteredHistory = appointmentHistory.filter(app => {
    const statusMatch = filterStatus === "" || app.status === filterStatus;
    const dateMatch = filterDate === "" || (app.slot?.date && app.slot.date === filterDate);
    return statusMatch && dateMatch;
  });

  if (loading) {
    return (
      <div className="admin-panel-container">
        <div style={{ 
          display: "flex", 
          justifyContent: "center", 
          alignItems: "center", 
          width: "100%",
          fontSize: "1.2rem",
          color: "#64748b"
        }}>
          Loading...
        </div>
      </div>
    );
  }

  return (
    <div className="admin-panel-container">
      <aside className="admin-sidebar">
        <div className="admin-logo">
          <Activity size={32} color="#3b82f6" style={{ marginRight: 8 }} />
          Doctor Panel
        </div>
        <nav>
          {menuItems.map((item) => (
            <div
              key={item.name}
              className={`admin-menu-item${active === item.name ? " active" : ""}`}
              onClick={() => setActive(item.name)}
            >
              <span className="icon">{item.icon}</span>
              <span className="label">{item.name}</span>
            </div>
          ))}
        </nav>
        <div className="admin-logout-btn-container">
          <button
            className="admin-logout-btn"
            onClick={() => {
              logout();
              navigate("/login");
            }}
          >
            Logout
          </button>
        </div>
      </aside>

      <main className="admin-main-content">
        
        <h2>{active}</h2>
        
        {error && (
          <div style={{ 
            background: "#fef2f2", 
            color: "#dc2626", 
            padding: "1rem", 
            borderRadius: "8px", 
            marginBottom: "2rem",
            border: "1px solid #fecaca"
          }}>
            {error}
          </div>
        )}
        
        {active === "Dashboard" && (
          <div>
            {stats && (
              <div style={{ display: "flex", gap: "2rem", marginBottom: "2rem", flexWrap: "wrap" }}>
                <div className="admin-stat-card">
                  <div className="admin-stat-label">Today's Appointments</div>
                  <div className="admin-stat-value">{stats.todayAppointments || 0}</div>
                </div>
                <div className="admin-stat-card">
                  <div className="admin-stat-label">Pending</div>
                  <div className="admin-stat-value">{stats.pendingAppointments || 0}</div>
                </div>
                <div className="admin-stat-card">
                  <div className="admin-stat-label">Completed Today</div>
                  <div className="admin-stat-value">{stats.completedToday || 0}</div>
                </div>
                <div className="admin-stat-card">
                  <div className="admin-stat-label">Total Patients</div>
                  <div className="admin-stat-value">{stats.totalPatients || 0}</div>
                </div>
              </div>
            )}
            
            {doctorInfo && (
              <div style={{ 
                background: "#f8fafc", 
                padding: "1.5rem", 
                borderRadius: "12px", 
                marginBottom: "2rem",
                border: "1px solid #e2e8f0"
              }}>
                <h3 style={{ marginBottom: "1rem", color: "#1e293b" }}>Current Status</h3>
                <div style={{ display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
                  <span style={{ 
                    color: getStatusColor(doctorInfo.availabilityStatus),
                    fontWeight: "bold",
                    fontSize: "1.1rem",
                    textTransform: "uppercase"
                  }}>
                    {doctorInfo.availabilityStatus}
                  </span>
                  {doctorInfo.statusNotes && (
                    <span style={{ color: "#64748b" }}>
                      - {doctorInfo.statusNotes}
                    </span>
                  )}
                </div>
              </div>
            )}

            <div style={{ display: "flex", gap: "2rem", flexWrap: "wrap" }}>
              <div style={{ flex: 1, minWidth: "300px" }}>
                <h3 style={{ marginBottom: "1rem", color: "#1e293b" }}>Recent Appointments</h3>
                <div className="admin-list">
                  {appointments.slice(0, 5).map(app => (
                    <div key={app._id} className="admin-list-item">
                      <div>
                        <div style={{ fontWeight: "600", color: "#1e293b" }}>
                          {app.userId ? `${app.userId.firstName} ${app.userId.lastName}` : "Unknown Patient"}
                        </div>
                        <div style={{ fontSize: "0.9rem", color: "#64748b" }}>
                          {app.slot?.date} {app.slot?.startTime}
                        </div>
                      </div>
                      <span style={{ 
                        color: getStatusColor(app.status), 
                        fontWeight: "500",
                        fontSize: "0.9rem"
                      }}>
                        {app.status}
                      </span>
                    </div>
                  ))}
                  {appointments.length === 0 && (
                    <div style={{ padding: "1rem", color: "#64748b", textAlign: "center" }}>
                      No recent appointments
                    </div>
                  )}
                </div>
              </div>

              <div style={{ flex: 1, minWidth: "300px" }}>
                <h3 style={{ marginBottom: "1rem", color: "#1e293b" }}>Quick Actions</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  <button
                    onClick={() => setActive("Appointments")}
                    className="admin-action-btn"
                  >
                    <FaCalendarAlt color="#3b82f6" />
                    View All Appointments
                  </button>
                  <button
                    onClick={() => setActive("Availability")}
                    className="admin-action-btn"
                  >
                    <FaUserMd color="#3b82f6" />
                    Update Availability
                  </button>
                  <button
                    onClick={() => setActive("Profile")}
                    className="admin-action-btn"
                  >
                    <FaUser color="#3b82f6" />
                    Edit Profile
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {active === "Appointments" && (
          <div>
            <div style={{ 
              background: "#fff", 
              padding: "1.5rem", 
              borderRadius: "12px", 
              marginBottom: "2rem",
              boxShadow: "0 2px 8px rgba(0,0,0,0.03)"
            }}>
              <h3 style={{ marginBottom: "1rem", color: "#1e293b" }}>Filters</h3>
              <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                  style={{
                    padding: "0.5rem",
                    borderRadius: "6px",
                    border: "1px solid #d1d5db",
                    background: "#fff"
                  }}
              >
                  <option value="">All Status</option>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
              <input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                  style={{
                    padding: "0.5rem",
                    borderRadius: "6px",
                    border: "1px solid #d1d5db",
                    background: "#fff"
                  }}
                />
              </div>
            </div>

            <div className="admin-table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Patient</th>
                    <th>Date & Time</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAppointments.map(app => (
                    <tr key={app._id}>
                      <td>
                        <div>
                          <div style={{ fontWeight: "600" }}>
                            {app.userId ? `${app.userId.firstName} ${app.userId.lastName}` : "Unknown"}
                          </div>
                          <div style={{ fontSize: "0.9rem", color: "#64748b" }}>
                            {app.userId?.email}
                          </div>
                        </div>
                      </td>
                      <td>
                        <div>
                          <div>{app.slot?.date}</div>
                          <div style={{ fontSize: "0.9rem", color: "#64748b" }}>
                            {app.slot?.startTime} - {app.slot?.endTime}
                          </div>
                        </div>
                      </td>
                      <td>
                        <span style={{ 
                          color: getStatusColor(app.status), 
                          fontWeight: "500",
                          textTransform: "capitalize"
                        }}>
                          {app.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: "0.5rem" }}>
                          {app.status === "confirmed" && (
                          <button
                              onClick={() => handleAppointmentAction(app._id, "start")}
                              style={{
                                background: "#3b82f6",
                                color: "white",
                                border: "none",
                                padding: "0.25rem 0.5rem",
                                borderRadius: "4px",
                                cursor: "pointer",
                                fontSize: "0.8rem"
                              }}
                          >
                              <FaPlay size={12} />
                          </button>
                        )}
                          {app.status === "in_progress" && (
                          <button
                              onClick={() => handleAppointmentAction(app._id, "complete")}
                              style={{
                                background: "#22c55e",
                                color: "white",
                                border: "none",
                                padding: "0.25rem 0.5rem",
                                borderRadius: "4px",
                                cursor: "pointer",
                                fontSize: "0.8rem"
                              }}
                          >
                              <FaCheckCircle size={12} />
                          </button>
                        )}
                        <button
                          onClick={() => setViewAppointment(app)}
                            style={{
                              background: "#6b7280",
                              color: "white",
                              border: "none",
                              padding: "0.25rem 0.5rem",
                              borderRadius: "4px",
                              cursor: "pointer",
                              fontSize: "0.8rem"
                            }}
                        >
                            <FaEye size={12} />
                        </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredAppointments.length === 0 && (
                <div style={{ 
                  padding: "2rem", 
                  textAlign: "center", 
                  color: "#64748b",
                  background: "#fff",
                  borderRadius: "8px"
                }}>
                  No appointments found
              </div>
            )}
            </div>
          </div>
        )}

        {active === "Availability" && (
          <div>
            <div style={{ 
              background: "#fff", 
              padding: "2rem", 
              borderRadius: "12px", 
              boxShadow: "0 2px 8px rgba(0,0,0,0.03)"
            }}>
              <h3 style={{ marginBottom: "1.5rem", color: "#1e293b" }}>Update Availability Status</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <div>
                  <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500" }}>
                    Status
                </label>
                  <select
                    value={availabilityStatus}
                    onChange={(e) => setAvailabilityStatus(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "0.75rem",
                      borderRadius: "6px",
                      border: "1px solid #d1d5db",
                      background: "#fff"
                    }}
                  >
                    <option value="available">Available</option>
                    <option value="busy">Busy</option>
                    <option value="offline">Offline</option>
                    <option value="booked">Booked</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500" }}>
                    Notes (Optional)
                </label>
                <textarea
                  value={statusNotes}
                  onChange={(e) => setStatusNotes(e.target.value)}
                  placeholder="Add any notes about your current status..."
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    borderRadius: "6px",
                      border: "1px solid #d1d5db",
                      background: "#fff",
                      minHeight: "100px",
                      resize: "vertical"
                  }}
                />
              </div>
              <button
                onClick={handleStatusUpdate}
                style={{
                    background: "#3b82f6",
                    color: "white",
                    border: "none",
                  padding: "0.75rem 1.5rem",
                  borderRadius: "6px",
                    fontWeight: "600",
                  cursor: "pointer",
                    alignSelf: "flex-start"
                }}
              >
                Update Status
              </button>
            </div>
                  </div>
          </div>
        )}

        {active === "Profile" && (
          <div>
            {editProfile ? (
              <div style={{ 
                background: "#fff", 
                padding: "2rem", 
                borderRadius: "12px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.03)"
              }}>
                <h3 style={{ marginBottom: "1.5rem", color: "#1e293b" }}>Edit Profile</h3>
                <form onSubmit={handleProfileUpdate}>
                  {/* Profile Picture Section */}
                  <div style={{ marginBottom: "2rem", textAlign: "center" }}>
                    <div style={{ marginBottom: "1rem" }}>
                      <div style={{
                        width: "120px",
                        height: "120px",
                        borderRadius: "50%",
                        margin: "0 auto 1rem",
                        overflow: "hidden",
                        border: "3px solid #e5e7eb",
                        position: "relative"
                      }}>
                        <img
                          src={
                            profileForm.photo instanceof File 
                              ? objectUrl
                              : profileForm.photo || ""
                          }
                          alt="Profile"
                    style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover"
                          }}
                          onError={(e) => {
                            e.target.style.display = "none";
                          }}
                        />
                      </div>
                    </div>
                    <div>
                      <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500" }}>
                        Profile Picture
                      </label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files[0];
                          if (file) {
                            // Validate file size (2MB)
                            if (file.size > 2 * 1024 * 1024) {
                              toast.error("File size must be less than 2MB");
                              return;
                            }
                            // Validate file type
                            if (!file.type.startsWith('image/')) {
                              toast.error("Please select an image file");
                              return;
                            }
                            
                            // Clean up previous object URL
                            if (objectUrl) {
                              URL.revokeObjectURL(objectUrl);
                            }
                            // Create new object URL
                            const newObjectUrl = URL.createObjectURL(file);
                            setObjectUrl(newObjectUrl);
                            setProfileForm({...profileForm, photo: file});
                          }
                        }}
                        style={{
                          width: "100%",
                          padding: "0.5rem",
                      borderRadius: "6px",
                          border: "1px solid #d1d5db",
                          background: "#fff"
                        }}
                      />
                      {profileForm.photo instanceof File && (
                        <div style={{ marginTop: "0.5rem", fontSize: "0.75rem", color: "#059669" }}>
                          Selected: {profileForm.photo.name} ({(profileForm.photo.size / 1024 / 1024).toFixed(2)} MB)
                        </div>
                      )}
                      <div style={{ marginTop: "0.5rem", display: "flex", gap: "0.5rem", justifyContent: "center" }}>
                        <button
                          type="button"
                          onClick={() => setProfileForm({...profileForm, photo: ""})}
                          style={{
                            background: "#ef4444",
                            color: "white",
                            border: "none",
                            padding: "0.25rem 0.5rem",
                            borderRadius: "4px",
                            fontSize: "0.75rem",
                            cursor: "pointer"
                          }}
                        >
                          Remove Photo
                  </button>
                      </div>
                      <small style={{ color: "#6b7280", fontSize: "0.875rem" }}>
                        Recommended: Square image, max 2MB
                      </small>
                    </div>
                </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1.5rem" }}>
                      <div>
                      <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500" }}>
                        Name
                        </label>
                        <input
                          type="text"
                          value={profileForm.name}
                        onChange={(e) => setProfileForm({...profileForm, name: e.target.value})}
                        style={{
                          width: "100%",
                          padding: "0.75rem",
                          borderRadius: "6px",
                          border: "1px solid #d1d5db",
                          background: "#fff"
                        }}
                        />
                      </div>
                      <div>
                      <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500" }}>
                        Category
                        </label>
                        <input
                          type="text"
                          value={profileForm.category}
                        onChange={(e) => setProfileForm({...profileForm, category: e.target.value})}
                        style={{
                          width: "100%",
                          padding: "0.75rem",
                          borderRadius: "6px",
                          border: "1px solid #d1d5db",
                          background: "#fff"
                        }}
                        />
                      </div>
                      <div>
                      <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500" }}>
                        Qualifications
                        </label>
                        <input
                          type="text"
                          value={profileForm.qualifications}
                        onChange={(e) => setProfileForm({...profileForm, qualifications: e.target.value})}
                        style={{
                          width: "100%",
                          padding: "0.75rem",
                          borderRadius: "6px",
                          border: "1px solid #d1d5db",
                          background: "#fff"
                        }}
                        />
                      </div>
                      <div>
                      <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500" }}>
                        Experience (years)
                        </label>
                        <input
                          type="number"
                          value={profileForm.experience}
                        onChange={(e) => setProfileForm({...profileForm, experience: e.target.value})}
                        style={{
                          width: "100%",
                          padding: "0.75rem",
                          borderRadius: "6px",
                          border: "1px solid #d1d5db",
                          background: "#fff"
                        }}
                        />
                      </div>
                    </div>
                  <div style={{ marginBottom: "1.5rem" }}>
                    <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500" }}>
                      Expertise
                        </label>
                    <textarea
                          value={profileForm.expertise}
                      onChange={(e) => setProfileForm({...profileForm, expertise: e.target.value})}
                      style={{
                        width: "100%",
                        padding: "0.75rem",
                        borderRadius: "6px",
                        border: "1px solid #d1d5db",
                        background: "#fff",
                        minHeight: "80px",
                        resize: "vertical"
                      }}
                        />
                      </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1.5rem" }}>
                      <div>
                      <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500" }}>
                        Fee
                        </label>
                        <input
                          type="number"
                          value={profileForm.fee}
                        onChange={(e) => setProfileForm({...profileForm, fee: e.target.value})}
                        style={{
                          width: "100%",
                          padding: "0.75rem",
                          borderRadius: "6px",
                          border: "1px solid #d1d5db",
                          background: "#fff"
                        }}
                        />
                      </div>
                    <div>
                      <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500" }}>
                        Contact Info
                      </label>
                      <input
                        type="text"
                        value={profileForm.contactInfo}
                        onChange={(e) => setProfileForm({...profileForm, contactInfo: e.target.value})}
                        style={{
                          width: "100%",
                          padding: "0.75rem",
                          borderRadius: "6px",
                          border: "1px solid #d1d5db",
                          background: "#fff"
                        }}
                      />
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: "1rem" }}>
                    <button
                      type="submit"
                      style={{
                        background: "#3b82f6",
                        color: "white",
                        border: "none",
                        padding: "0.75rem 1.5rem",
                        borderRadius: "6px",
                        fontWeight: "600",
                        cursor: "pointer"
                      }}
                    >
                      Save Changes
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditProfile(false)}
                      style={{
                        background: "#6b7280",
                        color: "white",
                        border: "none",
                        padding: "0.75rem 1.5rem",
                        borderRadius: "6px",
                        fontWeight: "600",
                        cursor: "pointer"
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                  </form>
              </div>
                ) : (
              <div style={{ 
                background: "#fff", 
                padding: "2rem", 
                borderRadius: "12px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.03)"
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
                  <h3 style={{ color: "#1e293b" }}>Profile Information</h3>
                  <button
                    onClick={() => setEditProfile(true)}
                    style={{
                      background: "#3b82f6",
                      color: "white",
                      border: "none",
                      padding: "0.5rem 1rem",
                      borderRadius: "6px",
                      fontWeight: "600",
                      cursor: "pointer"
                    }}
                  >
                    <FaEdit style={{ marginRight: "0.5rem" }} />
                    Edit Profile
                  </button>
                </div>
                
                {/* Profile Picture Display */}
                {doctorInfo && (
                  <div style={{ textAlign: "center", marginBottom: "2rem" }}>
                    <div style={{
                      width: "120px",
                      height: "120px",
                      borderRadius: "50%",
                      margin: "0 auto 1rem",
                      overflow: "hidden",
                      border: "3px solid #e5e7eb"
                    }}>
                      <img
                        src={doctorInfo.photo || ""}
                        alt="Profile"
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover"
                        }}
                        onError={(e) => {
                          e.target.style.display = "none";
                        }}
                      />
                    </div>
                  </div>
                )}
                
                {doctorInfo ? (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem" }}>
                    <div>
                      <h4 style={{ marginBottom: "0.5rem", color: "#374151" }}>Basic Information</h4>
                      <div style={{ marginBottom: "1rem" }}>
                        <strong>Name:</strong> {doctorInfo.name}
                      </div>
                      <div style={{ marginBottom: "1rem" }}>
                        <strong>Category:</strong> {doctorInfo.category}
                      </div>
                      <div style={{ marginBottom: "1rem" }}>
                        <strong>Qualifications:</strong> {doctorInfo.qualifications}
                      </div>
                      <div style={{ marginBottom: "1rem" }}>
                        <strong>Experience:</strong> {doctorInfo.experience} years
                      </div>
                    </div>
                    <div>
                      <h4 style={{ marginBottom: "0.5rem", color: "#374151" }}>Additional Details</h4>
                      <div style={{ marginBottom: "1rem" }}>
                        <strong>Expertise:</strong> {doctorInfo.expertise}
                      </div>
                      <div style={{ marginBottom: "1rem" }}>
                        <strong>Fee:</strong> Rs. {doctorInfo.fee}
                      </div>
                      <div style={{ marginBottom: "1rem" }}>
                        <strong>Contact:</strong> {doctorInfo.contactInfo}
                      </div>
                      </div>
                    </div>
                ) : (
                  <div style={{ textAlign: "center", color: "#64748b", padding: "2rem" }}>
                    No profile information available
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {active === "History" && (
          <div>
            <div style={{ 
              background: "#fff", 
              padding: "1.5rem", 
              borderRadius: "12px", 
              marginBottom: "2rem",
              boxShadow: "0 2px 8px rgba(0,0,0,0.03)"
            }}>
              <h3 style={{ marginBottom: "1rem", color: "#1e293b" }}>Filters</h3>
              <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                  style={{
                    padding: "0.5rem",
                    borderRadius: "6px",
                    border: "1px solid #d1d5db",
                    background: "#fff"
                  }}
              >
                  <option value="">All Status</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
                <option value="no_show">No Show</option>
              </select>
              <input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                  style={{
                    padding: "0.5rem",
                    borderRadius: "6px",
                    border: "1px solid #d1d5db",
                    background: "#fff"
                  }}
                />
              </div>
            </div>

            <div className="admin-table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Patient</th>
                    <th>Date & Time</th>
                    <th>Status</th>
                    <th>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredHistory.map(app => (
                    <tr key={app._id}>
                      <td>
                        <div>
                          <div style={{ fontWeight: "600" }}>
                            {app.userId ? `${app.userId.firstName} ${app.userId.lastName}` : "Unknown"}
                          </div>
                          <div style={{ fontSize: "0.9rem", color: "#64748b" }}>
                            {app.userId?.email}
                          </div>
                        </div>
                      </td>
                      <td>
                        <div>
                          <div>{app.slot?.date}</div>
                          <div style={{ fontSize: "0.9rem", color: "#64748b" }}>
                            {app.slot?.startTime} - {app.slot?.endTime}
                          </div>
                        </div>
                      </td>
                      <td>
                        <span style={{ 
                          color: getStatusColor(app.status), 
                          fontWeight: "500",
                          textTransform: "capitalize"
                        }}>
                          {app.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td>
                        {app.notes || "No notes"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredHistory.length === 0 && (
                <div style={{ 
                  padding: "2rem", 
                  textAlign: "center", 
                  color: "#64748b",
                  background: "#fff",
                  borderRadius: "8px"
                }}>
                  No appointment history found
              </div>
            )}
            </div>
          </div>
        )}

        {/* Appointment View Modal */}
        {viewAppointment && (
          <div style={{
              position: "fixed",
              top: 0,
              left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.5)",
              display: "flex",
              justifyContent: "center",
            alignItems: "center",
            zIndex: 1000
          }}>
            <div style={{
                background: "#fff",
                padding: "2rem",
              borderRadius: "12px",
              maxWidth: "500px",
              width: "90%",
              maxHeight: "80vh",
              overflow: "auto"
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
                <h3 style={{ color: "#1e293b" }}>Appointment Details</h3>
                <button
                  onClick={() => setViewAppointment(null)}
                  style={{
                    background: "none",
                    border: "none",
                    fontSize: "1.5rem",
                    cursor: "pointer",
                    color: "#6b7280"
                  }}
                >
                  ×
                </button>
              </div>
              <div style={{ marginBottom: "1rem" }}>
                <strong>Patient:</strong> {viewAppointment.userId ? `${viewAppointment.userId.firstName} ${viewAppointment.userId.lastName}` : "Unknown"}
              </div>
              <div style={{ marginBottom: "1rem" }}>
                <strong>Email:</strong> {viewAppointment.userId?.email || "N/A"}
              </div>
              <div style={{ marginBottom: "1rem" }}>
                <strong>Date:</strong> {viewAppointment.slot?.date}
              </div>
              <div style={{ marginBottom: "1rem" }}>
                <strong>Time:</strong> {viewAppointment.slot?.startTime} - {viewAppointment.slot?.endTime}
              </div>
              <div style={{ marginBottom: "1rem" }}>
                <strong>Status:</strong> 
                <span style={{ 
                  color: getStatusColor(viewAppointment.status),
                  fontWeight: "500",
                  marginLeft: "0.5rem",
                  textTransform: "capitalize"
                }}>
                  {viewAppointment.status.replace('_', ' ')}
                </span>
              </div>
              {viewAppointment.reason && (
                <div style={{ marginBottom: "1rem" }}>
                  <strong>Reason:</strong> {viewAppointment.reason}
                </div>
              )}
              {viewAppointment.urgency && (
                <div style={{ marginBottom: "1rem" }}>
                  <strong>Urgency:</strong> {viewAppointment.urgency}
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
