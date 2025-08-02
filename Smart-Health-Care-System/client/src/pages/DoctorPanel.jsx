import React, { useState, useEffect } from "react";
import {
  FaTachometerAlt,
  FaCalendarAlt,
  FaUserMd,
  FaHistory,
  FaUser,
  FaPlay,
  FaEye
} from "react-icons/fa";
import { useAuth } from "../contexts/AuthContext.jsx";
import { useNavigate } from "react-router-dom";
import { Activity } from "lucide-react";
import { toast } from "react-toastify";
import "./DoctorPanel.css";

const menuItems = [
  { name: "Dashboard", icon: <FaTachometerAlt /> },
  { name: "Appointments", icon: <FaCalendarAlt /> },
  { name: "Availability", icon: <FaUser Md /> },
  { name: "Profile", icon: <FaUser  /> },
  { name: "History", icon: <FaHistory /> },
];

export default function DoctorPanel() {
  const [active, setActive] = useState("Dashboard");
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
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
    contactInfo: ""
  });
  const { logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem("token");
      const headers = { headers: { Authorization: `Bearer ${token}` } };

      if (active === "Dashboard") {
        const res = await fetch("/api/doctors/me/stats", headers);
        if (res.ok) setStats(await res.json());
        fetchAvailability();
      } else if (active === "Appointments") {
        setLoading(true);
        const res = await fetch("/api/appointments/doctor/my", headers);
        if (res.ok) setAppointments((await res.json()).appointments || []);
        setLoading(false);
      } else if (active === "History") {
        setHistoryLoading(true);
        const res = await fetch("/api/appointments/doctor/history", headers);
        if (res.ok) setAppointmentHistory((await res.json()).appointments || []);
        setHistoryLoading(false);
      } else if (active === "Profile") {
        const res = await fetch("/api/doctors/me/profile", headers);
        if (res.ok) {
          const data = await res.json();
          setDoctorInfo(data.doctor);
          setProfileForm({
            name: data.doctor.name || "",
            category: data.doctor.category || "",
            qualifications: data.doctor.qualifications || "",
            experience: data.doctor.experience || "",
            expertise: data.doctor.expertise || "",
            fee: data.doctor.fee || "",
            contactInfo: data.doctor.contactInfo || ""
          });
        }
      }
    };
    fetchData();
  }, [active]);

  const fetchAvailability = async () => {
    const token = localStorage.getItem("token");
    const res = await fetch("/api/doctors/me/availability", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      const data = await res.json();
      if (data.doctor) {
        setAvailabilityStatus(data.doctor.availabilityStatus);
        setStatusNotes(data.doctor.statusNotes || "");
        setDoctorInfo(data.doctor);
      }
    }
  };

  const handleStatusUpdate = async () => {
    const token = localStorage.getItem("token");
    const res = await fetch("/api/doctors/me/availability", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ availabilityStatus, statusNotes }),
    });
    if (res.ok) {
      toast.success(`Status updated to ${availabilityStatus}`);
      fetchAvailability();
    } else {
      toast.error("Error updating status");
    }
  };

  const handleAppointmentAction = async (appointmentId, action) => {
    const token = localStorage.getItem("token");
    const res = await fetch(`/api/appointments/${appointmentId}/${action}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
    if (res.ok) {
      setAppointments(prev => prev.map(app => 
        app._id === appointmentId 
          ? { ...app, status: action === 'start' ? 'in_progress' : 'completed' }
          : app
      ));
      toast.success(`Appointment ${action}ed successfully`);
    } else {
      toast.error(`Error ${action}ing appointment`);
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    const res = await fetch("/api/doctors/me/profile", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(profileForm),
    });
    if (res.ok) {
      toast.success("Profile updated successfully");
      setEditProfile(false);
      fetchDoctorProfile();
    } else {
      toast.error("Error updating profile");
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
                    <FaUser Md color="#3b82f6" />
                    Update Availability
                  </button>
                  <button
                    onClick={() => setActive("Profile")}
                    className="admin-action-btn"
                  >
                    <FaUser  color="#3b82f6" />
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
              display: "flex", 
              gap: "1rem", 
              marginBottom: "1rem", 
              alignItems: "center",
              flexWrap: "wrap"
            }}>
              <input
                type="text"
                placeholder="Search patient..."
                className="admin-search-input"
              />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="admin-filter-select"
              >
                <option value="">All Statuses</option>
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
                className="admin-filter-input"
              />
              <button
                onClick={() => {
                  setFilterStatus("");
                  setFilterDate("");
                }}
                className="admin-clear-btn"
              >
                Clear
              </button>
            </div>

            {loading && <p>Loading appointments...</p>}
            {!loading && (
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Patient</th>
                    <th>Date & Time</th>
                    <th>Reason</th>
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
                            {app.userId?.email || "N/A"}
                          </div>
                        </div>
                      </td>
                      <td>
                        <div>
                          <div style={{ fontWeight: "500" }}>
                            {app.slot?.date || "N/A"}
                          </div>
                          <div style={{ fontSize: "0.9rem", color: "#64748b" }}>
                            {app.slot?.startTime}-{app.slot?.endTime}
                          </div>
                        </div>
                      </td>
                      <td>{app.reason || "-"}</td>
                      <td style={{ color: getStatusColor(app.status), fontWeight: 500 }}>{app.status}</td>
                      <td style={{ display: "flex", gap: "0.5rem" }}>
                        {app.status === 'confirmed' && (
                          <button
                            title="Start Appointment"
                            onClick={() => handleAppointmentAction(app._id, 'start')}
                            className="admin-action-btn"
                          >
                            <FaPlay />
                          </button>
                        )}
                        {app.status === 'in_progress' && (
                          <button
                            title="Complete Appointment"
                            onClick={() => handleAppointmentAction(app._id, 'complete')}
                            className="admin-action-btn"
                          >
                            <FaCheck />
                          </button>
                        )}
                        <button
                          title="View Details"
                          onClick={() => setViewAppointment(app)}
                          className="admin-action-btn"
                        >
                          <FaEye />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            {filteredAppointments.length === 0 && !loading && (
              <div style={{ textAlign: "center", color: "#6b7280", marginTop: "2rem" }}>
                No appointments found matching the filters.
              </div>
            )}
          </div>
        )}

        {active === "Availability" && (
          <div>
            <div style={{ 
              background: "#f8fafc", 
              padding: "2rem", 
              borderRadius: "12px", 
              marginBottom: "2rem",
              border: "1px solid #e2e8f0"
            }}>
              <h3 style={{ marginBottom: "1.5rem", color: "#1e293b" }}>Update Availability Status</h3>
              
              <div style={{ marginBottom: "1.5rem" }}>
                <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 500, color: "#374151" }}>
                  Current Status:
                </label>
                <div style={{ display: "flex", gap: "1rem", marginBottom: "1rem", flexWrap: "wrap" }}>
                  {["available", "busy", "offline"].map(status => (
                    <label key={status} style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer" }}>
                      <input
                        type="radio"
                        name="availability"
                        value={status}
                        checked={availabilityStatus === status}
                        onChange={() => setAvailabilityStatus(status)}
                      />
                      <span style={{ color: status === "available" ? '#22c55e' : status === "busy" ? '#f59e42' : '#6b7280', fontWeight: "500" }}>
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: "1.5rem" }}>
                <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 500, color: "#374151" }}>
                  Status Notes (Optional):
                </label>
                <textarea
                  value={statusNotes}
                  onChange={(e) => setStatusNotes(e.target.value)}
                  placeholder="Add any notes about your current status..."
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    borderRadius: "6px",
                    border: "1px solid #cbd5e1",
                    minHeight: "80px",
                    resize: "vertical",
                    fontFamily: "inherit"
                  }}
                />
              </div>

              <button
                onClick={handleStatusUpdate}
                style={{
                  padding: "0.75rem 1.5rem",
                  borderRadius: "6px",
                  border: "none",
                  background: "#2563eb",
                  color: "#fff",
                  fontWeight: 600,
                  cursor: "pointer",
                  fontSize: "1rem"
                }}
              >
                Update Status
              </button>
            </div>

            {doctorInfo && (
              <div style={{ 
                background: "#fff", 
                padding: "1.5rem", 
                borderRadius: "12px",
                border: "1px solid #e2e8f0"
              }}>
                <h3 style={{ marginBottom: "1rem", color: "#1e293b" }}>Current Status</h3>
                <div style={{ display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
                  <div style={{ 
                    padding: "0.5rem 1rem",
                    borderRadius: "6px",
                    background: availabilityStatus === 'available' ? '#dcfce7' : 
                               availabilityStatus === 'busy' ? '#fef3c7' : '#f3f4f6',
                    color: availabilityStatus === 'available' ? '#166534' : 
                           availabilityStatus === 'busy' ? '#92400e' : '#374151',
                    fontWeight: "600"
                  }}>
                    {availabilityStatus.toUpperCase()}
                  </div>
                  {statusNotes && (
                    <span style={{ color: "#64748b" }}>
                      {statusNotes}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {active === "Profile" && (
          <div>
            {doctorInfo ? (
              <div style={{ 
                background: "#fff", 
                padding: "2rem", 
                borderRadius: "12px",
                border: "1px solid #e2e8f0"
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
                  <h3 style={{ color: "#1e293b" }}>Doctor Profile</h3>
                  <button
                    onClick={() => setEditProfile(!editProfile)}
                    style={{
                      padding: "0.5rem 1rem",
                      borderRadius: "6px",
                      border: "1px solid #cbd5e1",
                      background: editProfile ? "#ef4444" : "#2563eb",
                      color: "#fff",
                      cursor: "pointer",
                      fontWeight: "500"
                    }}
                  >
                    {editProfile ? "Cancel" : "Edit Profile"}
                  </button>
                </div>

                {editProfile ? (
                  <form onSubmit={handleProfileUpdate}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
                      <div>
                        <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 500 }}>
                          Name:
                        </label>
                        <input
                          type="text"
                          value={profileForm.name}
                          onChange={(e) => setProfileForm(prev => ({ ...prev, name: e.target.value }))}
                          required
                          style={{ width: "100%", padding: "0.5rem", borderRadius: 6, border: "1px solid #cbd5e1" }}
                        />
                      </div>
                      <div>
                        <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 500 }}>
                          Category:
                        </label>
                        <input
                          type="text"
                          value={profileForm.category}
                          onChange={(e) => setProfileForm(prev => ({ ...prev, category: e.target.value }))}
                          required
                          style={{ width: "100%", padding: "0.5rem", borderRadius: 6, border: "1px solid #cbd5e1" }}
                        />
                      </div>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
                      <div>
                        <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 500 }}>
                          Qualifications:
                        </label>
                        <input
                          type="text"
                          value={profileForm.qualifications}
                          onChange={(e) => setProfileForm(prev => ({ ...prev, qualifications: e.target.value }))}
                          style={{ width: "100%", padding: "0.5rem", borderRadius: 6, border: "1px solid #cbd5e1" }}
                        />
                      </div>
                      <div>
                        <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 500 }}>
                          Experience (years):
                        </label>
                        <input
                          type="number"
                          value={profileForm.experience}
                          onChange={(e) => setProfileForm(prev => ({ ...prev, experience: e.target.value }))}
                          style={{ width: "100%", padding: "0.5rem", borderRadius: 6, border: "1px solid #cbd5e1" }}
                        />
                      </div>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
                      <div>
                        <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 500 }}>
                          Expertise:
                        </label>
                        <input
                          type="text"
                          value={profileForm.expertise}
                          onChange={(e) => setProfileForm(prev => ({ ...prev, expertise: e.target.value }))}
                          style={{ width: "100%", padding: "0.5rem", borderRadius: 6, border: "1px solid #cbd5e1" }}
                        />
                      </div>
                      <div>
                        <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 500 }}>
                          Fee:
                        </label>
                        <input
                          type="number"
                          value={profileForm.fee}
                          onChange={(e) => setProfileForm(prev => ({ ...prev, fee: e.target.value }))}
                          required
                          style={{ width: "100%", padding: "0.5rem", borderRadius: 6, border: "1px solid #cbd5e1" }}
                        />
                      </div>
                    </div>
                    <div style={{ marginBottom: "1rem" }}>
                      <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 500 }}>
                        Contact Info:
                      </label>
                      <input
                        type="email"
                        value={profileForm.contactInfo}
                        onChange={(e) => setProfileForm(prev => ({ ...prev, contactInfo: e.target.value }))}
                        style={{ width: "100%", padding: "0.5rem", borderRadius: 6, border: "1px solid #cbd5e1" }}
                      />
                    </div>
                    <button
                      type="submit"
                      style={{
                        padding: "0.75rem 1.5rem",
                        borderRadius: "6px",
                        border: "none",
                        background: "#2563eb",
                        color: "#fff",
                        cursor: "pointer",
                        fontWeight: "600"
                      }}
                    >
                      Update Profile
                    </button>
                  </form>
                ) : (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem" }}>
                    <div>
                      <h4 style={{ marginBottom: "1rem", color: "#374151" }}>Basic Information</h4>
                      <div style={{ marginBottom: "0.5rem" }}>
                        <strong>Name:</strong> {doctorInfo.name}
                      </div>
                      <div style={{ marginBottom: "0.5rem" }}>
                        <strong>Category:</strong> {doctorInfo.category}
                      </div>
                      <div style={{ marginBottom: "0.5rem" }}>
                        <strong>Qualifications:</strong> {doctorInfo.qualifications || "Not specified"}
                      </div>
                      <div style={{ marginBottom: "0.5rem" }}>
                        <strong>Experience:</strong> {doctorInfo.experience || "Not specified"} years
                      </div>
                    </div>
                    <div>
                      <h4 style={{ marginBottom: "1rem", color: "#374151" }}>Professional Details</h4>
                      <div style={{ marginBottom: "0.5rem" }}>
                        <strong>Expertise:</strong> {doctorInfo.expertise || "Not specified"}
                      </div>
                      <div style={{ marginBottom: "0.5rem" }}>
                        <strong>Fee:</strong> Rs. {doctorInfo.fee}
                      </div>
                      <div style={{ marginBottom: "0.5rem" }}>
                        <strong>Contact:</strong> {doctorInfo.contactInfo || "Not specified"}
                      </div>
                      <div style={{ marginBottom: "0.5rem" }}>
                        <strong>Status:</strong> 
                        <span style={{ 
                          color: getStatusColor(doctorInfo.availabilityStatus),
                          fontWeight: "500",
                          marginLeft: "0.5rem"
                        }}>
                          {doctorInfo.availabilityStatus}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p>Loading profile...</p>
            )}
          </div>
        )}

        {active === "History" && (
          <div>
            <div style={{ 
              display: "flex", 
              gap: "1rem", 
              marginBottom: "1rem", 
              alignItems: "center",
              flexWrap: "wrap"
            }}>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="admin-filter-select"
              >
                <option value="">All Statuses</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
                <option value="no_show">No Show</option>
              </select>
              <input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="admin-filter-input"
              />
              <button
                onClick={() => {
                  setFilterStatus("");
                  setFilterDate("");
                }}
                className="admin-clear-btn"
              >
                Clear
              </button>
            </div>

            {historyLoading && <p>Loading history...</p>}
            {!historyLoading && (
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Patient</th>
                    <th>Date & Time</th>
                    <th>Reason</th>
                    <th>Status</th>
                    <th>Actions</th>
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
                            {app.userId?.email || "N/A"}
                          </div>
                        </div>
                      </td>
                      <td>
                        <div>
                          <div style={{ fontWeight: "500" }}>
                            {app.slot?.date || "N/A"}
                          </div>
                          <div style={{ fontSize: "0.9rem", color: "#64748b" }}>
                            {app.slot?.startTime}-{app.slot?.endTime}
                          </div>
                        </div>
                      </td>
                      <td>{app.reason || "-"}</td>
                      <td style={{ color: getStatusColor(app.status), fontWeight: 500 }}>{app.status}</td>
                      <td>
                        <button
                          title="View Details"
                          onClick={() => setViewAppointment(app)}
                          className="admin-action-btn"
                        >
                          <FaEye />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            {filteredHistory.length === 0 && !historyLoading && (
              <div style={{ textAlign: "center", color: "#6b7280", marginTop: "2rem" }}>
                No appointment history found.
              </div>
            )}
          </div>
        )}

        {/* Appointment Details Modal */}
        {viewAppointment && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              width: "100vw",
              height: "100vh",
              background: "rgba(0,0,0,0.25)",
              zIndex: 1000,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            onClick={() => setViewAppointment(null)}
          >
            <div
              style={{
                background: "#fff",
                borderRadius: 12,
                padding: "2rem",
                minWidth: 400,
                maxWidth: 500,
                boxShadow: "0 4px 24px rgba(0,0,0,0.12)",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 style={{ marginBottom: "1rem", color: "#1e293b" }}>Appointment Details</h3>
              <div style={{ marginBottom: "1rem" }}>
                <strong>Patient:</strong> {viewAppointment.userId ? `${viewAppointment.userId.firstName} ${viewAppointment.userId.lastName}` : "Unknown"}
                <br />
                <strong>Email:</strong> {viewAppointment.userId?.email || "N/A"}
                <br />
                <strong>Date:</strong> {viewAppointment.slot?.date || "N/A"}
                <br />
                <strong>Time:</strong> {viewAppointment.slot?.startTime} - {viewAppointment.slot?.endTime}
                <br />
                <strong>Reason:</strong> {viewAppointment.reason || "General consultation"}
                <br />
                <strong>Status:</strong> 
                <span style={{ 
                  color: getStatusColor(viewAppointment.status),
                  fontWeight: "500",
                  marginLeft: "0.5rem"
                }}>
                  {viewAppointment.status}
                </span>
              </div>
              <button
                onClick={() => setViewAppointment(null)}
                style={{
                  padding: "0.5rem 1.5rem",
                  borderRadius: 6,
                  border: "none",
                  background: "#e0e7ff",
                  color: "#2563eb",
                  fontWeight: 500,
                  cursor: "pointer",
                }}
              >
                Close
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
