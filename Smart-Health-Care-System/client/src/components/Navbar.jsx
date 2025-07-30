"use client"

import { Link, useNavigate, useLocation } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext.jsx"
import { Activity, LogOut, BarChart3, Brain } from "lucide-react"

const Navbar = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogout = () => {
    logout()
    navigate("/")
  }

  const isActive = (path) => location.pathname === path

  return (
    <nav
      style={
        {
          background: "white",
          borderBottom: "1px solid #e2e8f0",
          padding: "1rem 0",
          position: "sticky",
          top: 0,
          zIndex: 1000,
        }
      }
    >
      <div
        className="container"
        style={
          {
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            maxWidth: 1200,
            margin: "0 auto",
            padding: "0 24px",
          }
        }
      >
        {/* Logo */}
        <Link
          to="/"
          style={
            {
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              textDecoration: "none",
              color: "#1e293b",
              fontSize: "1.5rem",
              fontWeight: "700",
            }
          }
        >
          <Activity size={32} color="#3b82f6" />
          Smart Health Care System
        </Link>

        {/* Navigation Links */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {user ? (
            <>
              <Link
                to="/dashboard"
                className={`btn ${isActive("/dashboard") ? "btn-primary" : "btn-secondary"}`}
                style={{ textDecoration: "none", padding: "8px 18px", margin: 0, display: 'flex', alignItems: 'center' }}
              >
                <BarChart3 size={16} />
                Dashboard
              </Link>
              <Link
                to="/predict"
                className={`btn ${isActive("/predict") ? "btn-primary" : "btn-secondary"}`}
                style={{ textDecoration: "none", padding: "8px 18px", margin: 0, display: 'flex', alignItems: 'center' }}
              >
                <Brain size={16} />
                Predict
              </Link>
              <Link
                to="/history"
                className={`btn ${isActive("/history") ? "btn-primary" : "btn-secondary"}`}
                style={{ textDecoration: "none", padding: "8px 18px", margin: 0, display: 'flex', alignItems: 'center' }}
              >
                History
              </Link>
              <Link
                to="/appointments"
                className={`btn ${isActive("/appointments") ? "btn-primary" : "btn-secondary"}`}
                style={{ textDecoration: "none", padding: "8px 18px", margin: 0, display: 'flex', alignItems: 'center' }}
              >
                Appointments
              </Link>
              <Link
                to="/profile"
                className={`btn ${isActive("/profile") ? "btn-primary" : "btn-secondary"}`}
                style={{ textDecoration: "none", padding: "8px 18px", margin: 0, display: 'flex', alignItems: 'center' }}
              >
                Profile
              </Link>
              <button onClick={handleLogout} className="btn btn-secondary" style={{ padding: "8px 18px", margin: 0, display: 'flex', alignItems: 'center' }}>
                <LogOut size={16} />
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-secondary" style={{ textDecoration: "none", padding: "8px 18px", margin: 0 }}>
                Login
              </Link>
              <Link to="/register" className="btn btn-primary" style={{ textDecoration: "none", padding: "8px 18px", margin: 0 }}>
                Sign Up
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}

export default Navbar
