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
      style={{
        background: "white",
        borderBottom: "1px solid #e2e8f0",
        padding: "1rem 0",
        position: "sticky",
        top: 0,
        zIndex: 1000,
      }}
    >
      <div
        className="container"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        {/* Logo */}
        <Link
          to="/"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            textDecoration: "none",
            color: "#1e293b",
            fontSize: "1.5rem",
            fontWeight: "700",
          }}
        >
          <Activity size={32} color="#3b82f6" />
          Smart Health Care System
        </Link>

        {/* Navigation Links */}
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          {user ? (
            <>
              <Link
                to="/dashboard"
                className={`btn ${isActive("/dashboard") ? "btn-primary" : "btn-secondary"}`}
                style={{ textDecoration: "none" }}
              >
                <BarChart3 size={16} />
                Dashboard
              </Link>
              <Link
                to="/predict"
                className={`btn ${isActive("/predict") ? "btn-primary" : "btn-secondary"}`}
                style={{ textDecoration: "none" }}
              >
                <Brain size={16} />
                Predict
              </Link>
              <Link
                to="/history"
                className={`btn ${isActive("/history") ? "btn-primary" : "btn-secondary"}`}
                style={{ textDecoration: "none" }}
              >
                History
              </Link>
              <button onClick={handleLogout} className="btn btn-secondary">
                <LogOut size={16} />
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-secondary" style={{ textDecoration: "none" }}>
                Login
              </Link>
              <Link to="/register" className="btn btn-primary" style={{ textDecoration: "none" }}>
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
