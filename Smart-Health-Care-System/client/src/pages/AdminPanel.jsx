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
  FaCalendarPlus, 
  FaTrashAlt, 
  FaTimesCircle,
  FaUserMd
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
  { name: "Doctor Availability", icon: <FaUserMd /> },
  { name: "Manage Doctors", icon: <FaUserMd /> },
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
  const [reportStats, setReportStats] = useState(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportError, setReportError] = useState("");
  const [doctorAvailability, setDoctorAvailability] = useState([]);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [availabilityError, setAvailabilityError] = useState("");
  const [doctorsForUser, setDoctorsForUser] = useState([]);
  const [doctorsForUserLoading, setDoctorsForUserLoading] = useState(false);
  const [doctorsForUserError, setDoctorsForUserError] = useState("");
  const [showCreateDoctorUser, setShowCreateDoctorUser] = useState(false);
  const [createDoctorUserForm, setCreateDoctorUserForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    doctorId: ""
  });

  // Doctor edit state
  const [editDoctor, setEditDoctor] = useState(null);
  const [editDoctorForm, setEditDoctorForm] = useState({
    name: "",
    category: "",
    qualifications: "",
    experience: "",
    expertise: "",
    fee: "",
    contactInfo: ""
  });



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
    } else if (active === "Doctor Availability") {
      setAvailabilityLoading(true);
      setAvailabilityError("");
      fetch("/api/doctors/admin/availability", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      })
        .then((res) => {
          if (!res.ok) throw new Error("Failed to fetch doctor availability");
          return res.json();
        })
        .then((data) => {
          setDoctorAvailability(data.doctors || []);
          setAvailabilityLoading(false);
        })
        .catch((err) => {
          setAvailabilityError(err.message);
          setAvailabilityLoading(false);
        });
    } else if (active === "Manage Doctors") {
      setDoctorsForUserLoading(true);
      setDoctorsForUserError("");
      fetch("/api/auth/admin/doctors", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      })
        .then((res) => {
          if (!res.ok) throw new Error("Failed to fetch doctors");
          return res.json();
        })
        .then((data) => {
          setDoctorsForUser(data.doctors || []);
          setDoctorsForUserLoading(false);
        })
        .catch((err) => {
          setDoctorsForUserError(err.message);
          setDoctorsForUserLoading(false);
        });
    } else if (active === "Reports") {
      setReportLoading(true);
      setReportError("");
      fetch("/api/appointments/admin/stats", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      })
        .then((res) => {
          if (!res.ok) throw new Error("Failed to fetch appointment stats");
          return res.json();
        })
        .then((data) => {
          setReportStats(data);
          setReportLoading(false);
        })
        .catch((err) => {
          setReportError(err.message);
          setReportLoading(false);
        });
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

  const handleAdminAccept = async (id) => {
    try {
      const res = await fetch(`/api/appointments/${id}/status`, {
        method: "PATCH",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}` 
        },
        body: JSON.stringify({ status: "confirmed" })
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
      const res = await fetch(`/api/appointments/${id}/status`, {
        method: "PATCH",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}` 
        },
        body: JSON.stringify({ status: "rejected" })
      });
      if (!res.ok) throw new Error("Failed to reject appointment");
      setAppointments((prev) => prev.map(a => a._id === id ? { ...a, status: "rejected" } : a));
      toast.success("Appointment rejected.");
    } catch (err) {
      toast.error("Error rejecting appointment");
    }
  };

  const handleAdminComplete = async (id) => {
    if (!window.confirm("Mark this appointment as completed?")) return;
    try {
      const res = await fetch(`/api/appointments/${id}/status`, {
        method: "PATCH",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}` 
        },
        body: JSON.stringify({ status: "completed" })
      });
      if (!res.ok) throw new Error("Failed to complete appointment");
      setAppointments((prev) => prev.map(a => a._id === id ? { ...a, status: "completed" } : a));
      toast.success("Appointment marked as completed.");
    } catch (err) {
      toast.error("Error completing appointment");
    }
  };

  const handleAdminCancel = async (id) => {
    if (!window.confirm("Are you sure you want to cancel this appointment?")) return;
    try {
      const res = await fetch(`/api/appointments/${id}/status`, {
        method: "PATCH",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}` 
        },
        body: JSON.stringify({ status: "cancelled" })
      });
      if (!res.ok) throw new Error("Failed to cancel appointment");
      setAppointments((prev) => prev.map(a => a._id === id ? { ...a, status: "cancelled" } : a));
      toast.success("Appointment cancelled.");
    } catch (err) {
      toast.error("Error cancelling appointment");
    }
  };

  const handleAdminDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this appointment?")) return;
    try {
      const res = await fetch(`/api/appointments/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      if (!res.ok) throw new Error("Failed to delete appointment");
      setAppointments((prev) => prev.filter(a => a._id !== id));
      toast.success("Appointment deleted.");
    } catch (err) {
      toast.error("Error deleting appointment");
    }
  };

  // Enhanced status-based action rendering
  const renderAppointmentActions = (appointment) => {
    const { status, _id } = appointment;
    
    switch (status) {
      case 'pending':
        return (
          <>
            <button
              title="Accept Appointment"
              onClick={() => handleAdminAccept(_id)}
              style={{ background: "none", border: "none", cursor: "pointer", color: "#22c55e" }}
            >
              <FaCheckCircle />
            </button>
            <button
              title="Reject Appointment"
              onClick={() => handleAdminReject(_id)}
              style={{ background: "none", border: "none", cursor: "pointer", color: "#ef4444" }}
            >
              <FaTimesCircle />
            </button>
            <button
              title="Cancel Appointment"
              onClick={() => handleAdminCancel(_id)}
              style={{ background: "none", border: "none", cursor: "pointer", color: "#f59e42" }}
            >
              <FaTrash />
            </button>
          </>
        );
      
      case 'confirmed':
        return (
          <button
            title="Mark as Completed"
            onClick={() => handleAdminComplete(_id)}
            style={{ background: "none", border: "none", cursor: "pointer", color: "#22c55e" }}
          >
            <FaCheckCircle />
          </button>
        );
      
      case 'in_progress':
        return (
          <button
            title="Mark as Completed"
            onClick={() => handleAdminComplete(_id)}
            style={{ background: "none", border: "none", cursor: "pointer", color: "#22c55e" }}
          >
            <FaCheckCircle />
          </button>
        );
      
      case 'completed':
      case 'cancelled':
      case 'rejected':
      case 'no_show':
        return (
          <button
            title="Delete Appointment"
            onClick={() => handleAdminDelete(_id)}
            style={{ background: "none", border: "none", cursor: "pointer", color: "#ef4444" }}
          >
            <FaTrash />
          </button>
        );
      
      default:
        return null;
    }
  };

  // Enhanced status color mapping
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



  // Doctor management functions
  const handleEditDoctor = (doctor) => {
    setEditDoctor(doctor);
    setEditDoctorForm({
      name: doctor.name || "",
      category: doctor.category || "",
      qualifications: doctor.qualifications || "",
      experience: doctor.experience || "",
      expertise: doctor.expertise || "",
      fee: doctor.fee || "",
      contactInfo: doctor.contactInfo || ""
    });
  };

  const closeEditDoctorModal = () => {
    setEditDoctor(null);
    setEditDoctorForm({
      name: "",
      category: "",
      qualifications: "",
      experience: "",
      expertise: "",
      fee: "",
      contactInfo: ""
    });
  };

  const handleEditDoctorChange = (e) => {
    setEditDoctorForm({ ...editDoctorForm, [e.target.name]: e.target.value });
  };

  const handleEditDoctorSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/doctors/${editDoctor._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(editDoctorForm),
      });
      
      if (!res.ok) throw new Error("Failed to update doctor");
      
      toast.success("Doctor updated successfully");
      closeEditDoctorModal();
      
      // Refresh doctors list
      setDoctorsForUserLoading(true);
      const doctorsRes = await fetch("/api/auth/admin/doctors", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      const doctorsData = await doctorsRes.json();
      setDoctorsForUser(doctorsData.doctors || []);
      setDoctorsForUserLoading(false);
    } catch (err) {
      toast.error("Error updating doctor");
    }
  };

  const handleDeleteDoctor = async (doctorId) => {
    if (!window.confirm("Are you sure you want to delete this doctor? This action cannot be undone.")) {
      return;
    }
    
    try {
      const res = await fetch(`/api/doctors/${doctorId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      
      if (!res.ok) throw new Error("Failed to delete doctor");
      
      setDoctorsForUser(doctorsForUser.filter(d => d._id !== doctorId));
      toast.success("Doctor deleted successfully");
    } catch (err) {
      toast.error("Error deleting doctor");
    }
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
                      <td>{app.reason || "-"}</td>
                      <td style={{ color: getStatusColor(app.status), fontWeight: 500 }}>{app.status}</td>
                      <td style={{ display: "flex", gap: "0.5rem" }}>
                        {renderAppointmentActions(app)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
        {active === "Doctor Availability" && (
          <div>
            <h3>Doctor Availability Management</h3>
            {availabilityLoading && <p>Loading doctor availability...</p>}
            {availabilityError && <p style={{ color: "red" }}>{availabilityError}</p>}
            {!availabilityLoading && !availabilityError && (
              <div>
                <div style={{ marginBottom: "1rem" }}>
                  <p>Monitor and manage doctor availability status. Doctors can set themselves as available, busy, or offline.</p>
                </div>
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Doctor Name</th>
                      <th>Category</th>
                      <th>Status</th>
                      <th>Last Updated</th>
                      <th>Notes</th>
                      <th>Current Patient</th>
                    </tr>
                  </thead>
                  <tbody>
                    {doctorAvailability.map(doctor => (
                      <tr key={doctor._id}>
                        <td>{doctor.name}</td>
                        <td>{doctor.category}</td>
                        <td>
                          <span style={{ 
                            color: doctor.availabilityStatus === 'available' ? '#22c55e' : 
                                   doctor.availabilityStatus === 'busy' ? '#f59e42' : '#6b7280',
                            fontWeight: 500,
                            textTransform: 'uppercase'
                          }}>
                            {doctor.availabilityStatus}
                          </span>
                        </td>
                        <td>
                          {doctor.lastStatusUpdate ? 
                            new Date(doctor.lastStatusUpdate).toLocaleString() : 
                            'Never'
                          }
                        </td>
                        <td>{doctor.statusNotes || '-'}</td>
                        <td>{doctor.currentPatientId || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                
                {doctorAvailability.length === 0 && (
                  <div style={{ textAlign: "center", color: "#6b7280", marginTop: "2rem" }}>
                    No doctors found or no availability data available.
                  </div>
                )}
              </div>
            )}
          </div>
        )}
        {active === "Manage Doctors" && (
          <div>
            <h3>Manage Doctors</h3>
            <p>Add new doctors to the system or manage existing doctors.</p>
            
            <button 
              onClick={() => setShowCreateDoctorUser(true)}
              style={{ 
                marginBottom: "1rem", 
                padding: "8px 18px", 
                borderRadius: 6, 
                border: "none", 
                background: "#2563eb", 
                color: "#fff", 
                fontWeight: 600, 
                cursor: "pointer" 
              }}
            >
              Add New Doctor
            </button>
            
            {doctorsForUserLoading && <p>Loading doctors...</p>}
            {doctorsForUserError && <p style={{ color: "red" }}>{doctorsForUserError}</p>}
            {!doctorsForUserLoading && !doctorsForUserError && (
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Doctor Name</th>
                    <th>Category</th>
                    <th>Contact Info</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {doctorsForUser.map(doctor => (
                    <tr key={doctor._id}>
                      <td>{doctor.name}</td>
                      <td>{doctor.category}</td>
                      <td>{doctor.contactInfo || "Not set"}</td>
                      <td>
                        <button
                          onClick={() => handleEditDoctor(doctor)}
                          style={{ 
                            padding: "4px 8px", 
                            borderRadius: 4, 
                            border: "none", 
                            background: "#3b82f6", 
                            color: "#fff", 
                            cursor: "pointer" 
                          }}
                          title="Edit Doctor"
                        >
                          <FaEdit />
                        </button>
                        <button
                          onClick={() => handleDeleteDoctor(doctor._id)}
                          style={{ 
                            padding: "4px 8px", 
                            borderRadius: 4, 
                            border: "none", 
                            background: "#ef4444", 
                            color: "#fff", 
                            cursor: "pointer",
                            marginLeft: "4px"
                          }}
                          title="Delete Doctor"
                        >
                          <FaTrash />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            
            {/* Create Doctor User Modal */}
            {showCreateDoctorUser && (
              <div style={{
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
              }}>
                <div style={{
                  background: "#fff",
                  borderRadius: 12,
                  padding: "2rem",
                  minWidth: 400,
                  maxWidth: 500,
                  boxShadow: "0 4px 24px rgba(0,0,0,0.12)",
                }}>
                  <h3 style={{ marginBottom: "1rem" }}>Add New Doctor</h3>
                  <form onSubmit={async (e) => {
                    e.preventDefault();
                    try {
                      const res = await fetch("/api/doctors", {
                        method: "POST",
                        headers: {
                          "Content-Type": "application/json",
                          Authorization: `Bearer ${localStorage.getItem("token")}`,
                        },
                        body: JSON.stringify({
                          name: createDoctorUserForm.firstName,
                          category: createDoctorUserForm.lastName,
                          qualifications: createDoctorUserForm.qualifications,
                          experience: createDoctorUserForm.experience,
                          fee: createDoctorUserForm.fee,
                          contactInfo: createDoctorUserForm.contactEmail
                        }),
                      });
                      
                      if (!res.ok) {
                        const data = await res.json();
                        throw new Error(data.message || "Failed to add doctor");
                      }
                      
                      toast.success("Doctor added successfully!");
                      setShowCreateDoctorUser(false);
                      setCreateDoctorUserForm({
                        firstName: "",
                        lastName: "",
                        email: "",
                        password: "",
                        doctorId: "",
                        qualifications: "",
                        experience: "",
                        fee: "",
                        contactEmail: ""
                      });
                      
                      // Refresh doctors list
                      setDoctorsForUserLoading(true);
                      const doctorsRes = await fetch("/api/auth/admin/doctors", {
                        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
                      });
                      const doctorsData = await doctorsRes.json();
                      setDoctorsForUser(doctorsData.doctors || []);
                      setDoctorsForUserLoading(false);
                    } catch (err) {
                      toast.error(err.message);
                    }
                  }}>
                    <div style={{ marginBottom: "1rem" }}>
                      <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 500 }}>
                        Doctor Name:
                      </label>
                      <input
                        type="text"
                        value={createDoctorUserForm.firstName}
                        onChange={(e) => setCreateDoctorUserForm(prev => ({ ...prev, firstName: e.target.value }))}
                        placeholder="e.g., Dr. John Smith"
                        required
                        style={{ width: "100%", padding: "0.5rem", borderRadius: 6, border: "1px solid #cbd5e1" }}
                      />
                    </div>
                    <div style={{ marginBottom: "1rem" }}>
                      <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 500 }}>
                        Category:
                      </label>
                      <input
                        type="text"
                        value={createDoctorUserForm.lastName}
                        onChange={(e) => setCreateDoctorUserForm(prev => ({ ...prev, lastName: e.target.value }))}
                        placeholder="e.g., Diabetes Specialist"
                        required
                        style={{ width: "100%", padding: "0.5rem", borderRadius: 6, border: "1px solid #cbd5e1" }}
                      />
                    </div>
                    <div style={{ marginBottom: "1rem" }}>
                      <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 500 }}>
                        Qualifications:
                      </label>
                      <input
                        type="text"
                        value={createDoctorUserForm.qualifications}
                        onChange={(e) => setCreateDoctorUserForm(prev => ({ ...prev, qualifications: e.target.value }))}
                        placeholder="e.g., MBBS, MD"
                        style={{ width: "100%", padding: "0.5rem", borderRadius: 6, border: "1px solid #cbd5e1" }}
                      />
                    </div>
                    <div style={{ marginBottom: "1rem" }}>
                      <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 500 }}>
                        Experience (years):
                      </label>
                      <input
                        type="number"
                        value={createDoctorUserForm.experience}
                        onChange={(e) => setCreateDoctorUserForm(prev => ({ ...prev, experience: e.target.value }))}
                        placeholder="e.g., 10"
                        style={{ width: "100%", padding: "0.5rem", borderRadius: 6, border: "1px solid #cbd5e1" }}
                      />
                    </div>
                    <div style={{ marginBottom: "1rem" }}>
                      <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 500 }}>
                        Fee:
                      </label>
                      <input
                        type="number"
                        value={createDoctorUserForm.fee}
                        onChange={(e) => setCreateDoctorUserForm(prev => ({ ...prev, fee: e.target.value }))}
                        placeholder="e.g., 1500"
                        required
                        style={{ width: "100%", padding: "0.5rem", borderRadius: 6, border: "1px solid #cbd5e1" }}
                      />
                    </div>
                    <div style={{ marginBottom: "1rem" }}>
                      <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 500 }}>
                        Contact Email:
                      </label>
                      <input
                        type="email"
                        value={createDoctorUserForm.contactEmail}
                        onChange={(e) => setCreateDoctorUserForm(prev => ({ ...prev, contactEmail: e.target.value }))}
                        placeholder="e.g., doctor.smith@hospital.com"
                        required
                        style={{ width: "100%", padding: "0.5rem", borderRadius: 6, border: "1px solid #cbd5e1" }}
                      />
                    </div>
                    <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
                      <button
                        type="button"
                        onClick={() => setShowCreateDoctorUser(false)}
                        style={{
                          padding: "0.5rem 1rem",
                          borderRadius: 6,
                          border: "1px solid #cbd5e1",
                          background: "#fff",
                          cursor: "pointer"
                        }}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        style={{
                          padding: "0.5rem 1rem",
                          borderRadius: 6,
                          border: "none",
                          background: "#2563eb",
                          color: "#fff",
                          cursor: "pointer"
                        }}
                      >
                        Add Doctor
                      </button>
                    </div>
                  </form>
                </div>
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
                    <div className="admin-stat-value">{reportStats.total || 0}</div>
                  </div>
                  {reportStats.byStatus && Object.entries(reportStats.byStatus).map(([status, count]) => (
                    <div key={status} className="admin-stat-card">
                      <div className="admin-stat-label">{status.charAt(0).toUpperCase() + status.slice(1)}</div>
                      <div className="admin-stat-value">{count || 0}</div>
                    </div>
                  ))}
                </div>
                {/* Charts */}
                {reportStats.byDoctor && reportStats.byDoctor.length > 0 && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 32 }}>
                    {/* Bar chart: Appointments per doctor */}
                    <div style={{ flex: 1, minWidth: 320 }}>
                      <h4>Appointments per Doctor</h4>
                      <Bar
                        data={{
                          labels: reportStats.byDoctor.map(d => d.doctorName || "Unknown"),
                          datasets: [{
                            label: "Appointments",
                            data: reportStats.byDoctor.map(d => d.count || 0),
                            backgroundColor: "#3b82f6"
                          }]
                        }}
                        options={{ responsive: true, plugins: { legend: { display: false } } }}
                      />
                    </div>
                    {/* Pie chart: Appointments by status */}
                    {reportStats.byStatus && Object.keys(reportStats.byStatus).length > 0 && (
                      <div style={{ flex: 1, minWidth: 320 }}>
                        <h4>Appointment Status Distribution</h4>
                        <Pie
                          data={{
                            labels: Object.keys(reportStats.byStatus),
                            datasets: [{
                              data: Object.values(reportStats.byStatus),
                              backgroundColor: ["#3b82f6", "#22c55e", "#ef4444", "#f59e42", "#8b5cf6", "#06b6d4"]
                            }]
                          }}
                          options={{ responsive: true }}
                        />
                      </div>
                    )}
                  </div>
                )}
                {/* Line chart: Appointments per day */}
                {reportStats.byDay && reportStats.byDay.length > 0 && (
                  <div style={{ marginTop: 40 }}>
                    <h4>Appointments Trend (Last 30 Days)</h4>
                    <Line
                      data={{
                        labels: reportStats.byDay.map(d => d._id || "Unknown"),
                        datasets: [{
                          label: "Appointments",
                          data: reportStats.byDay.map(d => d.count || 0),
                          borderColor: "#3b82f6",
                          backgroundColor: "rgba(59,130,246,0.2)",
                          tension: 0.3
                        }]
                      }}
                      options={{ responsive: true }}
                    />
                  </div>
                )}
                {/* Show message if no data */}
                {(!reportStats.byDoctor || reportStats.byDoctor.length === 0) && 
                 (!reportStats.byStatus || Object.keys(reportStats.byStatus).length === 0) && (
                  <div style={{ textAlign: "center", color: "#6b7280", marginTop: 40 }}>
                    No appointment data available for analytics.
                  </div>
                )}
              </div>
            ) : (
              <div style={{ textAlign: "center", color: "#6b7280" }}>
                No analytics data available.
              </div>
            )}
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
        
        {/* Edit Doctor Modal */}
        {editDoctor && (
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
            onClick={closeEditDoctorModal}
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
              <h3 style={{ marginBottom: "1rem" }}>Edit Doctor</h3>
              <form onSubmit={handleEditDoctorSubmit}>
                <div style={{ marginBottom: "1rem" }}>
                  <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 500 }}>
                    Name:
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={editDoctorForm.name}
                    onChange={handleEditDoctorChange}
                    required
                    style={{ width: "100%", padding: "0.5rem", borderRadius: 6, border: "1px solid #cbd5e1" }}
                  />
                </div>
                <div style={{ marginBottom: "1rem" }}>
                  <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 500 }}>
                    Category:
                  </label>
                  <input
                    type="text"
                    name="category"
                    value={editDoctorForm.category}
                    onChange={handleEditDoctorChange}
                    required
                    style={{ width: "100%", padding: "0.5rem", borderRadius: 6, border: "1px solid #cbd5e1" }}
                  />
                </div>
                <div style={{ marginBottom: "1rem" }}>
                  <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 500 }}>
                    Qualifications:
                  </label>
                  <input
                    type="text"
                    name="qualifications"
                    value={editDoctorForm.qualifications}
                    onChange={handleEditDoctorChange}
                    style={{ width: "100%", padding: "0.5rem", borderRadius: 6, border: "1px solid #cbd5e1" }}
                  />
                </div>
                <div style={{ marginBottom: "1rem" }}>
                  <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 500 }}>
                    Experience (years):
                  </label>
                  <input
                    type="number"
                    name="experience"
                    value={editDoctorForm.experience}
                    onChange={handleEditDoctorChange}
                    style={{ width: "100%", padding: "0.5rem", borderRadius: 6, border: "1px solid #cbd5e1" }}
                  />
                </div>
                <div style={{ marginBottom: "1rem" }}>
                  <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 500 }}>
                    Expertise:
                  </label>
                  <input
                    type="text"
                    name="expertise"
                    value={editDoctorForm.expertise}
                    onChange={handleEditDoctorChange}
                    style={{ width: "100%", padding: "0.5rem", borderRadius: 6, border: "1px solid #cbd5e1" }}
                  />
                </div>
                <div style={{ marginBottom: "1rem" }}>
                  <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 500 }}>
                    Fee:
                  </label>
                  <input
                    type="number"
                    name="fee"
                    value={editDoctorForm.fee}
                    onChange={handleEditDoctorChange}
                    required
                    style={{ width: "100%", padding: "0.5rem", borderRadius: 6, border: "1px solid #cbd5e1" }}
                  />
                </div>
                <div style={{ marginBottom: "1rem" }}>
                  <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 500 }}>
                    Contact Info:
                  </label>
                  <input
                    type="email"
                    name="contactInfo"
                    value={editDoctorForm.contactInfo}
                    onChange={handleEditDoctorChange}
                    style={{ width: "100%", padding: "0.5rem", borderRadius: 6, border: "1px solid #cbd5e1" }}
                  />
                </div>
                <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
                  <button
                    type="button"
                    onClick={closeEditDoctorModal}
                    style={{
                      padding: "0.5rem 1rem",
                      borderRadius: 6,
                      border: "1px solid #cbd5e1",
                      background: "#fff",
                      cursor: "pointer"
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    style={{
                      padding: "0.5rem 1rem",
                      borderRadius: 6,
                      border: "none",
                      background: "#2563eb",
                      color: "#fff",
                      cursor: "pointer"
                    }}
                  >
                    Update Doctor
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
