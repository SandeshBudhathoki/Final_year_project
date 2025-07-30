import React, { useState, useEffect } from "react";
import {
  FaTachometerAlt,
  FaUsers,
  FaHistory,
  FaTrash,
  FaUserShield,
  FaUser,
  FaEye,
  FaEdit,
  FaCheckCircle,
  FaCalendarPlus, FaTrashAlt, FaTimesCircle
} from "react-icons/fa";
import "./AdminPanel.css";
import { useAuth } from "../contexts/AuthContext.jsx";
import { useNavigate } from "react-router-dom";
import { Activity } from "lucide-react";
import { toast } from "react-toastify";
import { Bar, Pie, Line } from "react-chartjs-2";
import { Chart, CategoryScale, LinearScale, BarElement, ArcElement, PointElement, LineElement, Tooltip, Legend } from "chart.js";
Chart.register(CategoryScale, LinearScale, BarElement, ArcElement, PointElement, LineElement, Tooltip, Legend);

const menuItems = [
  { name: "Dashboard", icon: <FaTachometerAlt /> },
  { name: "Users", icon: <FaUsers /> },
  { name: "History", icon: <FaHistory /> },
  { name: "Appointments", icon: <FaHistory /> },
  { name: "Doctor Schedules", icon: <FaUserShield /> },
  { name: "Reports", icon: <FaTachometerAlt /> },
];

export default function AdminPanel() {
  const [active, setActive] = useState("Dashboard");
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);
  const [predictions, setPredictions] = useState([]);
  const [filterUser, setFilterUser] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [filterRisk, setFilterRisk] = useState("");
  const [viewPrediction, setViewPrediction] = useState(null);
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [editUser, setEditUser] = useState(null);
  const [editForm, setEditForm] = useState({
    firstName: "",
    lastName: "",
    gender: "male",
    password: "",
    role: "user",
  });
  const [appointments, setAppointments] = useState([]);
  const [appointmentsLoading, setAppointmentsLoading] = useState(false);
  const [appointmentsError, setAppointmentsError] = useState("");
  const [filterAppUser, setFilterAppUser] = useState("");
  const [filterAppDoctor, setFilterAppDoctor] = useState("");
  const [filterAppStatus, setFilterAppStatus] = useState("");
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotDate, setSlotDate] = useState("");
  const [slotStartTime, setSlotStartTime] = useState("");
  const [slotEndTime, setSlotEndTime] = useState("");
  const [slotError, setSlotError] = useState("");
  const [slotSuccess, setSlotSuccess] = useState("");
  const [editSlotIdx, setEditSlotIdx] = useState(null);
  const [editSlotDate, setEditSlotDate] = useState("");
  const [editSlotStartTime, setEditSlotStartTime] = useState("");
  const [editSlotEndTime, setEditSlotEndTime] = useState("");
  const [reportStats, setReportStats] = useState(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportError, setReportError] = useState("");

  useEffect(() => {
    if (active === "Users") {
      setLoading(true);
      setError(null);
      fetch("/api/auth/admin/users", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      })
        .then((res) => {
          if (!res.ok) throw new Error("Failed to fetch users");
          return res.json();
        })
        .then((data) => {
          setUsers(data.users || []);
          setLoading(false);
        })
        .catch((err) => {
          setError(err.message);
          setLoading(false);
        });
    } else if (active === "Dashboard") {
      setLoading(true);
      setError(null);
      fetch("/api/auth/admin/stats", {
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
    } else if (active === "History") {
      setLoading(true);
      setError(null);
      fetch("/api/predictions/admin/predictions", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      })
        .then((res) => {
          if (!res.ok) throw new Error("Failed to fetch predictions");
          return res.json();
        })
        .then((data) => {
          setPredictions(data.predictions || []);
          setLoading(false);
        })
        .catch((err) => {
          setError(err.message);
          setLoading(false);
        });
    } else if (active === "Appointments") {
      setAppointmentsLoading(true);
      setAppointmentsError("");
      fetch("/api/appointments/admin/all", {
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
          setAppointmentsLoading(false);
        })
        .catch((err) => {
          setAppointmentsError(err.message);
          setAppointmentsLoading(false);
        });
    } else if (active === "Doctor Schedules") {
      setSlotsLoading(true);
      fetch("/api/doctors", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      })
        .then((res) => res.json())
        .then((data) => {
          setDoctors(data.doctors || []);
          setSlotsLoading(false);
        })
        .catch(() => setSlotsLoading(false));
    } else if (active === "Reports") {
      setReportLoading(true);
      setReportError("");
      fetch("/api/appointments/admin/stats", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      })
        .then((res) => res.json())
        .then((data) => {
          setReportStats(data);
          setReportLoading(false);
        })
        .catch(() => setReportLoading(false));
    }
  }, [active]);

  // Delete user handler
  const handleDeleteUser = async (userId) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this user? This action cannot be undone."
      )
    )
      return;
    try {
      const res = await fetch(`/api/auth/admin/users/${userId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      if (!res.ok) throw new Error("Failed to delete user");
      setUsers(users.filter((u) => u._id !== userId));
      toast.success("User deleted successfully");
    } catch (err) {
      toast.error("Error deleting user");
    }
  };

  // Promote/demote user handler
  const handleToggleRole = async (userId, currentRole) => {
    const newRole = currentRole === "admin" ? "user" : "admin";
    try {
      const res = await fetch(`/api/auth/admin/users/${userId}/role`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ role: newRole }),
      });
      if (!res.ok) throw new Error("Failed to update user role");
      setUsers(
        users.map((u) => (u._id === userId ? { ...u, role: newRole } : u))
      );
      toast.success(`User role updated to ${newRole}`);
    } catch (err) {
      toast.error("Error updating user role");
    }
  };

  // Delete prediction handler
  const handleDeletePrediction = async (predictionId) => {
    if (!window.confirm("Are you sure you want to delete this prediction?"))
      return;
    try {
      const res = await fetch(`/api/predictions/${predictionId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      if (!res.ok) throw new Error("Failed to delete prediction");
      setPredictions(predictions.filter((p) => p._id !== predictionId));
      toast.success("Prediction deleted successfully");
    } catch (err) {
      toast.error("Error deleting prediction");
    }
  };

  // Filtered predictions
  const filteredPredictions = predictions.filter((pred) => {
    const userMatch =
      filterUser === "" ||
      (pred.userId &&
        (pred.userId.firstName
          ?.toLowerCase()
          .includes(filterUser.toLowerCase()) ||
          pred.userId.lastName
            ?.toLowerCase()
            .includes(filterUser.toLowerCase()) ||
          pred.userId.email?.toLowerCase().includes(filterUser.toLowerCase())));
    const dateMatch =
      filterDate === "" ||
      (pred.createdAt &&
        new Date(pred.createdAt).toISOString().slice(0, 10) === filterDate);
    const riskMatch =
      filterRisk === "" ||
      (filterRisk === "high" && pred.result?.prediction) ||
      (filterRisk === "low" && !pred.result?.prediction);
    return userMatch && dateMatch && riskMatch;
  });

  const openEditModal = (user) => {
    setEditUser(user);
    setEditForm({
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      gender: user.gender || "male",
      password: "",
      role: user.role || "user",
    });
  };
  const closeEditModal = () => {
    setEditUser(null);
    setEditForm({
      firstName: "",
      lastName: "",
      gender: "male",
      password: "",
      role: "user",
    });
  };
  const handleEditChange = (e) => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
  };
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/auth/admin/users/${editUser._id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          firstName: editForm.firstName,
          lastName: editForm.lastName,
          gender: editForm.gender,
          password: editForm.password || undefined,
          role: editForm.role,
        }),
      });
      if (!res.ok) throw new Error("Failed to update user");
      toast.success("User updated successfully");
      closeEditModal();
      // Refresh users
      setLoading(true);
      const usersRes = await fetch("/api/auth/admin/users", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      const usersData = await usersRes.json();
      setUsers(usersData.users || []);
      setLoading(false);
    } catch (err) {
      toast.error("Error updating user");
    }
  };

  const handleAdminCancel = async (id) => {
    if (!window.confirm("Are you sure you want to cancel this appointment?")) return;
    try {
      const res = await fetch(`/api/appointments/${id}/cancel`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      if (!res.ok) throw new Error("Failed to cancel appointment");
      setAppointments((prev) => prev.map(a => a._id === id ? { ...a, status: "cancelled" } : a));
      toast.success("Appointment cancelled.");
    } catch (err) {
      toast.error("Error cancelling appointment");
    }
  };

  const handleAdminComplete = async (id) => {
    if (!window.confirm("Mark this appointment as completed?")) return;
    try {
      const res = await fetch(`/api/appointments/${id}/complete`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      if (!res.ok) throw new Error("Failed to complete appointment");
      setAppointments((prev) => prev.map(a => a._id === id ? { ...a, status: "completed" } : a));
      toast.success("Appointment marked as completed.");
    } catch (err) {
      toast.error("Error completing appointment");
    }
  };

  const handleAdminAccept = async (id) => {
    try {
      const res = await fetch(`/api/appointments/${id}/accept`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      if (!res.ok) throw new Error("Failed to accept appointment");
      setAppointments((prev) => prev.map(a => a._id === id ? { ...a, status: "confirmed" } : a));
      toast.success("Appointment accepted.");
    } catch (err) {
      toast.error("Error accepting appointment");
    }
  };

  const handleAdminReject = async (id) => {
    if (!window.confirm("Are you sure you want to reject this appointment?")) return;
    try {
      const res = await fetch(`/api/appointments/${id}/reject`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      if (!res.ok) throw new Error("Failed to reject appointment");
      setAppointments((prev) => prev.map(a => a._id === id ? { ...a, status: "cancelled" } : a));
      toast.success("Appointment rejected.");
    } catch (err) {
      toast.error("Error rejecting appointment");
    }
  };

  const filteredAppointments = appointments.filter(app => {
    const userMatch = filterAppUser === "" || (app.userId && (
      app.userId.firstName?.toLowerCase().includes(filterAppUser.toLowerCase()) ||
      app.userId.lastName?.toLowerCase().includes(filterAppUser.toLowerCase()) ||
      app.userId.email?.toLowerCase().includes(filterAppUser.toLowerCase())
    ));
    const doctorMatch = filterAppDoctor === "" || (app.doctorId && (
      app.doctorId.name?.toLowerCase().includes(filterAppDoctor.toLowerCase()) ||
      app.doctorId.category?.toLowerCase().includes(filterAppDoctor.toLowerCase())
    ));
    const statusMatch = filterAppStatus === "" || app.status === filterAppStatus;
    return userMatch && doctorMatch && statusMatch;
  });

  // Export appointments as CSV
  const handleExportAppointmentsCSV = () => {
    const headers = [
      "User Name",
      "User Email",
      "Doctor Name",
      "Doctor Category",
      "Slot Date",
      "Slot Time",
      "Reason",
      "Status"
    ];
    const rows = filteredAppointments.map(app => [
      app.userId ? `${app.userId.firstName} ${app.userId.lastName}` : "Unknown",
      app.userId?.email || "N/A",
      app.doctorId?.name || "N/A",
      app.doctorId?.category || "N/A",
      app.slot?.date || "",
      app.slot?.time || "",
      app.reason || "-",
      app.status
    ]);
    let csvContent = headers.join(",") + "\n" + rows.map(r => r.map(v => `"${v}"`).join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `appointments_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleSelectDoctor = (id) => {
    setSelectedDoctor(doctors.find((d) => d._id === id));
    setSlotDate("");
    setSlotStartTime("");
    setSlotEndTime("");
    setSlotError("");
    setSlotSuccess("");
  };

  const handleAddSlot = async (e) => {
    e.preventDefault();
    setSlotError("");
    setSlotSuccess("");
    if (!slotDate || !slotStartTime || !slotEndTime) {
      setSlotError("Date, start time, and end time are required.");
      return;
    }
    try {
      const res = await fetch(`/api/doctors/${selectedDoctor._id}/slots`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ date: slotDate, startTime: slotStartTime, endTime: slotEndTime }),
      });
      if (!res.ok) throw new Error("Failed to add slot");
      setSlotSuccess("Slot added.");
      setSlotDate("");
      setSlotStartTime("");
      setSlotEndTime("");
    } catch (err) {
      setSlotError("Error adding slot");
    }
  };

  const handleRemoveSlot = async (date, startTime, endTime) => {
    if (!window.confirm("Remove this slot?")) return;
    setSlotError("");
    setSlotSuccess("");
    try {
      const res = await fetch(`/api/doctors/${selectedDoctor._id}/slots`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ date, startTime, endTime }),
      });
      if (!res.ok) throw new Error("Failed to remove slot");
      setSlotSuccess("Slot removed.");
    } catch (err) {
      setSlotError("Error removing slot");
    }
  };

  const handleEditSlot = (idx, slot) => {
    setEditSlotIdx(idx);
    setEditSlotDate(slot.date);
    setEditSlotStartTime(slot.startTime);
    setEditSlotEndTime(slot.endTime);
    setSlotError("");
    setSlotSuccess("");
  };

  const handleSaveEditSlot = async (e) => {
    e.preventDefault();
    setSlotError("");
    setSlotSuccess("");
    if (!editSlotDate || !editSlotStartTime || !editSlotEndTime) {
      setSlotError("Date, start time, and end time are required.");
      return;
    }
    try {
      const res = await fetch(`/api/doctors/${selectedDoctor._id}/slots`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          oldDate: selectedDoctor.availableSlots[editSlotIdx].date,
          oldStartTime: selectedDoctor.availableSlots[editSlotIdx].startTime,
          oldEndTime: selectedDoctor.availableSlots[editSlotIdx].endTime,
          newDate: editSlotDate,
          newStartTime: editSlotStartTime,
          newEndTime: editSlotEndTime,
        }),
      });
      if (!res.ok) throw new Error("Failed to update slot");
      setSlotSuccess("Slot updated.");
      setEditSlotIdx(null);
    } catch (err) {
      setSlotError("Error updating slot");
    }
  };

  const handleCancelEditSlot = () => {
    setEditSlotIdx(null);
    setEditSlotDate("");
    setEditSlotStartTime("");
    setEditSlotEndTime("");
  };

  return (
    <div className="admin-panel-container">
      <aside className="admin-sidebar">
        <div className="admin-logo">
          <Activity size={32} color="#3b82f6" style={{ marginRight: 8 }} />
          Smart Health Care System
        </div>
        <nav>
          {menuItems.map((item) => (
            <div
              key={item.name}
              className={`admin-menu-item${
                active === item.name ? " active" : ""
              }`}
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
            {loading && <p>Loading dashboard...</p>}
            {error && <p style={{ color: "red" }}>{error}</p>}
            {!loading && !error && stats && (
              <div>
                <div
                  style={{ display: "flex", gap: "2rem", marginBottom: "2rem" }}
                >
                  <div className="admin-stat-card">
                    <div className="admin-stat-label">Total Users</div>
                    <div className="admin-stat-value">{stats.totalUsers}</div>
                  </div>
                  <div className="admin-stat-card">
                    <div className="admin-stat-label">Total Predictions</div>
                    <div className="admin-stat-value">
                      {stats.totalPredictions}
                    </div>
                  </div>
                </div>
                <div style={{ display: "flex", gap: "2rem" }}>
                  <div style={{ flex: 1 }}>
                    <div
                      className="admin-stat-label"
                      style={{ marginBottom: "0.5rem" }}
                    >
                      Recent Users
                    </div>
                    <ul className="admin-list">
                      {stats.recentUsers.map((u) => (
                        <li key={u._id} className="admin-list-item">
                          {u.fullName || `${u.firstName} ${u.lastName}`}{" "}
                          <span style={{ color: "#64748b", fontSize: "0.9em" }}>
                            ({u.email})
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div
                      className="admin-stat-label"
                      style={{ marginBottom: "0.5rem" }}
                    >
                      Recent Predictions
                    </div>
                    <ul className="admin-list">
                      {stats.recentPredictions.map((p) => (
                        <li key={p._id} className="admin-list-item">
                          {p.userId
                            ? `${p.userId.firstName} ${p.userId.lastName}`
                            : "Unknown User"}
                          <span style={{ color: "#64748b", fontSize: "0.9em" }}>
                            {" "}
                            ({p.userId?.email || "N/A"})
                          </span>
                          <span
                            style={{
                              float: "right",
                              color: p.result?.prediction
                                ? "#ef4444"
                                : "#059669",
                            }}
                          >
                            {p.result?.prediction ? "High Risk" : "Low Risk"}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
        {active === "Users" && (
          <div>
            {loading && <p>Loading users...</p>}
            {error && <p style={{ color: "red" }}>{error}</p>}
            {!loading && !error && (
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Gender</th>
                    <th>Role</th>
                    <th>Created At</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user._id}>
                      <td>
                        {user.fullName || `${user.firstName} ${user.lastName}`}
                      </td>
                      <td>{user.email}</td>
                      <td>{user.gender}</td>
                      <td>{user.role}</td>
                      <td>
                        {user.createdAt
                          ? new Date(user.createdAt).toLocaleDateString()
                          : ""}
                      </td>
                      <td style={{ display: "flex", gap: "0.5rem" }}>
                        <button
                          title={
                            user.role === "admin"
                              ? "Demote to User"
                              : "Promote to Admin"
                          }
                          onClick={() => handleToggleRole(user._id, user.role)}
                          style={{
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            color:
                              user.role === "admin" ? "#f59e42" : "#2563eb",
                          }}
                        >
                          {user.role === "admin" ? (
                            <FaUser />
                          ) : (
                            <FaUserShield />
                          )}
                        </button>
                        <button
                          title="Edit User"
                          onClick={() => openEditModal(user)}
                          style={{
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            color: "#3b82f6",
                          }}
                        >
                          <FaEdit />
                        </button>
                        <button
                          title="Delete User"
                          onClick={() => handleDeleteUser(user._id)}
                          style={{
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            color: "#ef4444",
                          }}
                        >
                          <FaTrash />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
        {active === "History" && (
          <div>
            {/* Filters */}
            <div
              style={{
                display: "flex",
                gap: "1rem",
                marginBottom: "1rem",
                alignItems: "center",
              }}
            >
              <input
                type="text"
                placeholder="Search user/email..."
                value={filterUser}
                onChange={(e) => setFilterUser(e.target.value)}
                style={{
                  padding: "0.5rem",
                  borderRadius: 6,
                  border: "1px solid #cbd5e1",
                  minWidth: 180,
                }}
              />
              <input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                style={{
                  padding: "0.5rem",
                  borderRadius: 6,
                  border: "1px solid #cbd5e1",
                }}
              />
              <select
                value={filterRisk}
                onChange={(e) => setFilterRisk(e.target.value)}
                style={{
                  padding: "0.5rem",
                  borderRadius: 6,
                  border: "1px solid #cbd5e1",
                }}
              >
                <option value="">All Risks</option>
                <option value="high">High Risk</option>
                <option value="low">Low Risk</option>
              </select>
              <button
                onClick={() => {
                  setFilterUser("");
                  setFilterDate("");
                  setFilterRisk("");
                }}
                style={{
                  marginLeft: 8,
                  padding: "0.5rem 1rem",
                  borderRadius: 6,
                  border: "none",
                  background: "#e0e7ff",
                  color: "#2563eb",
                  fontWeight: 500,
                  cursor: "pointer",
                }}
              >
                Clear
              </button>
            </div>
            {loading && <p>Loading predictions...</p>}
            {error && <p style={{ color: "red" }}>{error}</p>}
            {!loading && !error && (
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Email</th>
                    <th>Date</th>
                    <th>Result</th>
                    <th>Confidence</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPredictions.map((pred) => (
                    <tr key={pred._id}>
                      <td>
                        {pred.userId
                          ? `${pred.userId.firstName} ${pred.userId.lastName}`
                          : "Unknown"}
                      </td>
                      <td>{pred.userId?.email || "N/A"}</td>
                      <td>
                        {pred.createdAt
                          ? new Date(pred.createdAt).toLocaleString()
                          : ""}
                      </td>
                      <td
                        style={{
                          color: pred.result?.prediction
                            ? "#ef4444"
                            : "#059669",
                        }}
                      >
                        {pred.result?.prediction ? "High Risk" : "Low Risk"}
                      </td>
                      <td>
                        {pred.result?.confidence
                          ? Math.round(pred.result.confidence * 100) + "%"
                          : ""}
                      </td>
                      <td style={{ display: "flex", gap: "0.5rem" }}>
                        <button
                          title="View Details"
                          onClick={() => setViewPrediction(pred)}
                          style={{
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            color: "#2563eb",
                          }}
                        >
                          <FaEye />
                        </button>
                        <button
                          title="Delete Prediction"
                          onClick={() => handleDeletePrediction(pred._id)}
                          style={{
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            color: "#ef4444",
                          }}
                        >
                          <FaTrash />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            {/* View Details Modal */}
            {viewPrediction && (
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
                onClick={() => setViewPrediction(null)}
              >
                <div
                  style={{
                    background: "#fff",
                    borderRadius: 12,
                    padding: "2rem",
                    minWidth: 340,
                    maxWidth: 420,
                    boxShadow: "0 4px 24px rgba(0,0,0,0.12)",
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <h3 style={{ marginBottom: 12 }}>Prediction Details</h3>
                  <div style={{ fontSize: "1rem", marginBottom: 8 }}>
                    <strong>User:</strong>{" "}
                    {viewPrediction.userId
                      ? `${viewPrediction.userId.firstName} ${viewPrediction.userId.lastName}`
                      : "Unknown"}
                    <br />
                    <strong>Email:</strong>{" "}
                    {viewPrediction.userId?.email || "N/A"}
                    <br />
                    <strong>Date:</strong>{" "}
                    {viewPrediction.createdAt
                      ? new Date(viewPrediction.createdAt).toLocaleString()
                      : ""}
                    <br />
                    <strong>Result:</strong>{" "}
                    <span
                      style={{
                        color: viewPrediction.result?.prediction
                          ? "#ef4444"
                          : "#059669",
                      }}
                    >
                      {viewPrediction.result?.prediction
                        ? "High Risk"
                        : "Low Risk"}
                    </span>
                    <br />
                    <strong>Confidence:</strong>{" "}
                    {viewPrediction.result?.confidence
                      ? Math.round(viewPrediction.result.confidence * 100) + "%"
                      : ""}
                    <br />
                  </div>
                  <div style={{ fontSize: "0.98rem", marginBottom: 8 }}>
                    <strong>Input Parameters:</strong>
                    <ul style={{ margin: "0.5rem 0 0 1.2rem", padding: 0 }}>
                      {viewPrediction.features &&
                        Object.entries(viewPrediction.features).map(
                          ([k, v]) => (
                            <li key={k}>
                              <strong>{k}:</strong> {v}
                            </li>
                          )
                        )}
                    </ul>
                  </div>
                  <button
                    onClick={() => setViewPrediction(null)}
                    style={{
                      marginTop: 16,
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
          </div>
        )}
        {active === "Appointments" && (
          <div>
            <button onClick={handleExportAppointmentsCSV} style={{ marginBottom: 16, padding: "8px 18px", borderRadius: 6, border: "none", background: "#2563eb", color: "#fff", fontWeight: 600, cursor: "pointer" }}>Export CSV</button>
            <div style={{ display: "flex", gap: "1rem", marginBottom: "1rem", alignItems: "center" }}>
              <input
                type="text"
                placeholder="Search user/email..."
                value={filterAppUser}
                onChange={e => setFilterAppUser(e.target.value)}
                style={{ padding: "0.5rem", borderRadius: 6, border: "1px solid #cbd5e1", minWidth: 180 }}
              />
              <input
                type="text"
                placeholder="Search doctor/category..."
                value={filterAppDoctor}
                onChange={e => setFilterAppDoctor(e.target.value)}
                style={{ padding: "0.5rem", borderRadius: 6, border: "1px solid #cbd5e1", minWidth: 180 }}
              />
              <select
                value={filterAppStatus}
                onChange={e => setFilterAppStatus(e.target.value)}
                style={{ padding: "0.5rem", borderRadius: 6, border: "1px solid #cbd5e1" }}
              >
                <option value="">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
              <button
                onClick={() => {
                  setFilterAppUser("");
                  setFilterAppDoctor("");
                  setFilterAppStatus("");
                }}
                style={{ marginLeft: 8, padding: "0.5rem 1rem", borderRadius: 6, border: "none", background: "#e0e7ff", color: "#2563eb", fontWeight: 500, cursor: "pointer" }}
              >
                Clear
              </button>
            </div>
            {appointmentsLoading && <p>Loading appointments...</p>}
            {appointmentsError && <p style={{ color: "red" }}>{appointmentsError}</p>}
            {!appointmentsLoading && !appointmentsError && (
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Email</th>
                    <th>Doctor</th>
                    <th>Category</th>
                    <th>Slot</th>
                    <th>Reason</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAppointments.map(app => (
                    <tr key={app._id}>
                      <td>{app.userId ? `${app.userId.firstName} ${app.userId.lastName}` : "Unknown"}</td>
                      <td>{app.userId?.email || "N/A"}</td>
                      <td>{app.doctorId?.name || "N/A"}</td>
                      <td>{app.doctorId?.category || "N/A"}</td>
                      <td>{app.slot ? `${app.slot.date} ${app.slot.startTime} to ${app.slot.endTime}` : "N/A"}</td>
                      <td>{app.reason || "-"}</td>
                      <td style={{ color: app.status === 'cancelled' ? '#ef4444' : app.status === 'completed' ? '#22c55e' : '#3b82f6', fontWeight: 500 }}>{app.status}</td>
                      <td style={{ display: "flex", gap: "0.5rem" }}>
                        {app.status === 'pending' && (
                          <>
                           <button
                             title="Accept Appointment"
                             onClick={() => handleAdminAccept(app._id)}
                             style={{ background: "none", border: "none", cursor: "pointer", color: "#22c55e" }}
                           >
                             <FaCheckCircle />
                           </button>
                           <button
                             title="Reject Appointment"
                             onClick={() => handleAdminReject(app._id)}
                             style={{ background: "none", border: "none", cursor: "pointer", color: "#ef4444" }}
                           >
                             <FaTimesCircle />
                           </button>
                            <button
                              title="Mark as Completed"
                              onClick={() => handleAdminComplete(app._id)}
                              style={{ background: "none", border: "none", cursor: "pointer", color: "#22c55e" }}
                            >
                              <FaCheckCircle />
                            </button>
                            <button
                              title="Cancel Appointment"
                              onClick={() => handleAdminCancel(app._id)}
                              style={{ background: "none", border: "none", cursor: "pointer", color: "#ef4444" }}
                            >
                              <FaTrash />
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
        {active === "Doctor Schedules" && (
          <div>
            <h3>Doctor Schedules</h3>
            {slotsLoading ? (
              <div>Loading doctors...</div>
            ) : (
              <div style={{ marginBottom: 24 }}>
                <label style={{ fontWeight: 500, marginRight: 8 }}>Select Doctor:</label>
                <select
                  value={selectedDoctor?._id || ""}
                  onChange={e => handleSelectDoctor(e.target.value)}
                  style={{ padding: 8, borderRadius: 6, border: "1px solid #cbd5e1", minWidth: 200 }}
                >
                  <option value="">-- Select --</option>
                  {doctors.map(doc => (
                    <option key={doc._id} value={doc._id}>
                      {doc.name} ({doc.category})
                    </option>
                  ))}
                </select>
              </div>
            )}
            {selectedDoctor && (
              <div style={{ marginBottom: 32 }}>
                <h4>Available Slots for {selectedDoctor.name}</h4>
                <form onSubmit={handleAddSlot} style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 16 }}>
                  <input
                    type="date"
                    value={slotDate}
                    onChange={e => setSlotDate(e.target.value)}
                    style={{ padding: 8, borderRadius: 6, border: "1px solid #cbd5e1" }}
                  />
                  <input
                    type="time"
                    value={slotStartTime}
                    onChange={e => setSlotStartTime(e.target.value)}
                    style={{ padding: 8, borderRadius: 6, border: "1px solid #cbd5e1" }}
                  />
                  <span>to</span>
                  <input
                    type="time"
                    value={slotEndTime}
                    onChange={e => setSlotEndTime(e.target.value)}
                    style={{ padding: 8, borderRadius: 6, border: "1px solid #cbd5e1" }}
                  />
                  <button type="submit" style={{ padding: "8px 18px", borderRadius: 6, border: "none", background: "#3b82f6", color: "#fff", fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <FaCalendarPlus /> Add Slot
                  </button>
                </form>
                {slotError && <div style={{ color: "#ef4444", marginBottom: 8 }}>{slotError}</div>}
                {slotSuccess && <div style={{ color: "#22c55e", marginBottom: 8 }}>{slotSuccess}</div>}
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Time</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedDoctor.availableSlots && selectedDoctor.availableSlots.length > 0 ? (
                      selectedDoctor.availableSlots.map((slot, idx) => (
                        <tr key={idx}>
                          <td>
                            {editSlotIdx === idx ? (
                              <input type="date" value={editSlotDate} onChange={e => setEditSlotDate(e.target.value)} style={{ padding: 6, borderRadius: 6, border: "1px solid #cbd5e1" }} />
                            ) : (
                              slot.date
                            )}
                          </td>
                          <td>
                            {editSlotIdx === idx ? (
                              <>
                                <input type="time" value={editSlotStartTime} onChange={e => setEditSlotStartTime(e.target.value)} style={{ padding: 6, borderRadius: 6, border: "1px solid #cbd5e1", marginRight: 4 }} />
                                <span>to</span>
                                <input type="time" value={editSlotEndTime} onChange={e => setEditSlotEndTime(e.target.value)} style={{ padding: 6, borderRadius: 6, border: "1px solid #cbd5e1", marginLeft: 4 }} />
                              </>
                            ) : (
                              `${slot.startTime} to ${slot.endTime}`
                            )}
                          </td>
                          <td style={{ color: slot.isBooked ? '#ef4444' : '#22c55e', fontWeight: 500 }}>{slot.isBooked ? 'Booked' : 'Available'}</td>
                          <td>
                            {!slot.isBooked && (
                              editSlotIdx === idx ? (
                                <>
                                  <button onClick={handleSaveEditSlot} style={{ marginRight: 8, padding: "6px 14px", borderRadius: 6, border: "none", background: "#22c55e", color: "#fff", fontWeight: 600 }}>Save</button>
                                  <button onClick={handleCancelEditSlot} style={{ padding: "6px 14px", borderRadius: 6, border: "none", background: "#e5e7eb", color: "#222", fontWeight: 600 }}>Cancel</button>
                                </>
                              ) : (
                                <>
                                  <button
                                    title="Edit Slot"
                                    onClick={() => handleEditSlot(idx, slot)}
                                    style={{ background: "none", border: "none", cursor: "pointer", color: "#2563eb", marginRight: 8 }}
                                  >
                                    <FaEdit />
                                  </button>
                                  <button
                                    title="Remove Slot"
                                    onClick={() => handleRemoveSlot(slot.date, slot.startTime, slot.endTime)}
                                    style={{ background: "none", border: "none", cursor: "pointer", color: "#ef4444" }}
                                  >
                                    <FaTrashAlt />
                                  </button>
                                </>
                              )
                            )}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr><td colSpan={4}>No slots found.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
        {active === "Reports" && (
          <div>
            <h3>Appointment Analytics</h3>
            {reportLoading ? (
              <div>Loading analytics...</div>
            ) : reportError ? (
              <div style={{ color: "#ef4444" }}>{reportError}</div>
            ) : reportStats ? (
              <div>
                {/* Stat cards */}
                <div style={{ display: "flex", gap: 24, marginBottom: 32 }}>
                  <div className="admin-stat-card">
                    <div className="admin-stat-label">Total Appointments</div>
                    <div className="admin-stat-value">{reportStats.total}</div>
                  </div>
                  {Object.entries(reportStats.byStatus).map(([status, count]) => (
                    <div key={status} className="admin-stat-card">
                      <div className="admin-stat-label">{status.charAt(0).toUpperCase() + status.slice(1)}</div>
                      <div className="admin-stat-value">{count}</div>
                    </div>
                  ))}
                </div>
                {/* Charts */}
                <div style={{ display: "flex", flexWrap: "wrap", gap: 32 }}>
                  {/* Bar chart: Appointments per doctor */}
                  <div style={{ flex: 1, minWidth: 320 }}>
                    <h4>Appointments per Doctor</h4>
                    <Bar
                      data={{
                        labels: reportStats.byDoctor.map(d => d.doctorName),
                        datasets: [{
                          label: "Appointments",
                          data: reportStats.byDoctor.map(d => d.count),
                          backgroundColor: "#3b82f6"
                        }]
                      }}
                      options={{ responsive: true, plugins: { legend: { display: false } } }}
                    />
                  </div>
                  {/* Pie chart: Appointments by status */}
                  <div style={{ flex: 1, minWidth: 320 }}>
                    <h4>Appointment Status Distribution</h4>
                    <Pie
                      data={{
                        labels: Object.keys(reportStats.byStatus),
                        datasets: [{
                          data: Object.values(reportStats.byStatus),
                          backgroundColor: ["#3b82f6", "#22c55e", "#ef4444", "#f59e42"]
                        }]
                      }}
                      options={{ responsive: true }}
                    />
                  </div>
                </div>
                {/* Line chart: Appointments per day */}
                <div style={{ marginTop: 40 }}>
                  <h4>Appointments Trend (Last 30 Days)</h4>
                  <Line
                    data={{
                      labels: reportStats.byDay.map(d => d._id),
                      datasets: [{
                        label: "Appointments",
                        data: reportStats.byDay.map(d => d.count),
                        borderColor: "#3b82f6",
                        backgroundColor: "rgba(59,130,246,0.2)",
                        tension: 0.3
                      }]
                    }}
                    options={{ responsive: true }}
                  />
                </div>
              </div>
            ) : null}
          </div>
        )}
        {/* Edit User Modal */}
        {editUser && (
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
            onClick={closeEditModal}
          >
            <div
              style={{
                background: "#fff",
                borderRadius: 12,
                padding: "2rem",
                minWidth: 340,
                maxWidth: 420,
                boxShadow: "0 4px 24px rgba(0,0,0,0.12)",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 style={{ marginBottom: 12 }}>Edit User</h3>
              <form onSubmit={handleEditSubmit}>
                <div style={{ marginBottom: 12 }}>
                  <label>First Name:</label>
                  <input
                    type="text"
                    name="firstName"
                    value={editForm.firstName}
                    onChange={handleEditChange}
                    required
                    style={{
                      width: "100%",
                      padding: 8,
                      borderRadius: 6,
                      border: "1px solid #cbd5e1",
                    }}
                  />
                </div>
                <div style={{ marginBottom: 12 }}>
                  <label>Last Name:</label>
                  <input
                    type="text"
                    name="lastName"
                    value={editForm.lastName}
                    onChange={handleEditChange}
                    required
                    style={{
                      width: "100%",
                      padding: 8,
                      borderRadius: 6,
                      border: "1px solid #cbd5e1",
                    }}
                  />
                </div>
                <div style={{ marginBottom: 12 }}>
                  <label>Gender:</label>
                  <select
                    name="gender"
                    value={editForm.gender}
                    onChange={handleEditChange}
                    style={{
                      width: "100%",
                      padding: 8,
                      borderRadius: 6,
                      border: "1px solid #cbd5e1",
                    }}
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div style={{ marginBottom: 12 }}>
                  <label>Password (leave blank to keep unchanged):</label>
                  <input
                    type="password"
                    name="password"
                    value={editForm.password}
                    onChange={handleEditChange}
                    style={{
                      width: "100%",
                      padding: 8,
                      borderRadius: 6,
                      border: "1px solid #cbd5e1",
                    }}
                  />
                </div>
                <div style={{ marginBottom: 12 }}>
                  <label>Role:</label>
                  <select
                    name="role"
                    value={editForm.role}
                    onChange={handleEditChange}
                    style={{
                      width: "100%",
                      padding: 8,
                      borderRadius: 6,
                      border: "1px solid #cbd5e1",
                    }}
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "flex-end",
                    gap: 8,
                  }}
                >
                  <button
                    type="button"
                    onClick={closeEditModal}
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
                    Cancel
                  </button>
                  <button
                    type="submit"
                    style={{
                      padding: "0.5rem 1.5rem",
                      borderRadius: 6,
                      border: "none",
                      background: "#2563eb",
                      color: "#fff",
                      fontWeight: 500,
                      cursor: "pointer",
                    }}
                  >
                    Save
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
        {/* Content for other sections will go here */}
      </main>
    </div>
  );
}
