import { useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { Mail } from "lucide-react";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [code, setCode] = useState("");
  const [codeVerified, setCodeVerified] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [resetSuccess, setResetSuccess] = useState(false);

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post("/api/auth/forgot-password", { email });
      setSubmitted(true);
      toast.success(
        "If your email is registered, you will receive a reset code."
      );
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to send reset code."
      );
    }
  };

  const handleCodeSubmit = async (e) => {
    e.preventDefault();
    if (code.length !== 6) {
      toast.error("Please enter the 6-digit code sent to your email.");
      return;
    }
    // Optionally, you could verify the code with the backend here, but for simplicity, we'll just move to the next step
    setCodeVerified(true);
  };

  const handleResetSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirm) {
      toast.error("Passwords do not match.");
      return;
    }
    try {
      await axios.post("/api/auth/reset-password", { email, code, password });
      setResetSuccess(true);
      toast.success("Password reset! You can now log in.");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to reset password.");
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#f8fafc",
      }}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: "1rem",
          boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
          padding: "2.5rem 2rem",
          maxWidth: 400,
          width: "100%",
          textAlign: "center",
        }}
      >
        <div
          style={{
            background: "#e0e7ff",
            borderRadius: "50%",
            width: 56,
            height: 56,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 1rem",
          }}
        >
          <Mail size={32} color="#6366f1" />
        </div>
        <h2
          style={{ fontWeight: 700, fontSize: "2rem", marginBottom: "0.5rem" }}
        >
          Forgot Password?
        </h2>
        <p style={{ color: "#64748b", marginBottom: "1.5rem" }}>
          Enter your email address and we'll send you a 6-digit code to reset
          your password.
        </p>
        {resetSuccess ? (
          <div>
            <div
              style={{
                background: "#d1fae5",
                borderRadius: "50%",
                width: 48,
                height: 48,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 1rem",
              }}
            >
              <span
                role="img"
                aria-label="check"
                style={{ fontSize: 28, color: "#10b981" }}
              >
                ✔️
              </span>
            </div>
            <p style={{ color: "#10b981", fontWeight: 600 }}>
              Password reset! You can now log in.
            </p>
          </div>
        ) : !submitted ? (
          <form onSubmit={handleEmailSubmit}>
            <div style={{ marginBottom: "1rem", textAlign: "left" }}>
              <label
                style={{ fontWeight: 500, marginBottom: 4, display: "block" }}
              >
                Email address
              </label>
              <input
                type="email"
                className="form-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  borderRadius: "0.5rem",
                  border: "1px solid #e5e7eb",
                  fontSize: "1rem",
                }}
              />
            </div>
            <button
              type="submit"
              className="btn btn-primary"
              style={{
                width: "100%",
                background: "#6366f1",
                color: "#fff",
                fontWeight: 600,
                padding: "0.75rem",
                borderRadius: "0.5rem",
                border: "none",
                fontSize: "1rem",
                cursor: "pointer",
                transition: "background 0.2s",
              }}
              onMouseOver={(e) =>
                (e.currentTarget.style.background = "#4f46e5")
              }
              onMouseOut={(e) => (e.currentTarget.style.background = "#6366f1")}
            >
              <Mail
                size={18}
                style={{ marginRight: 8, verticalAlign: "middle" }}
              />
              Send Reset Code
            </button>
          </form>
        ) : !codeVerified ? (
          <form onSubmit={handleCodeSubmit}>
            <div style={{ marginBottom: "1.5rem", textAlign: "left" }}>
              <label
                style={{ fontWeight: 500, marginBottom: 4, display: "block" }}
              >
                6-digit Code
              </label>
              <input
                type="text"
                className="form-input"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                required
                maxLength={6}
                minLength={6}
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  borderRadius: "0.5rem",
                  border: "1px solid #e5e7eb",
                  fontSize: "1rem",
                  letterSpacing: "0.3em",
                  textAlign: "center",
                }}
              />
            </div>
            <button
              type="submit"
              className="btn btn-primary"
              style={{
                width: "100%",
                background: "#6366f1",
                color: "#fff",
                fontWeight: 600,
                padding: "0.75rem",
                borderRadius: "0.5rem",
                border: "none",
                fontSize: "1rem",
                cursor: "pointer",
                transition: "background 0.2s",
              }}
              onMouseOver={(e) =>
                (e.currentTarget.style.background = "#4f46e5")
              }
              onMouseOut={(e) => (e.currentTarget.style.background = "#6366f1")}
            >
              Verify Code
            </button>
          </form>
        ) : (
          <form onSubmit={handleResetSubmit}>
            <div style={{ marginBottom: "1rem", textAlign: "left" }}>
              <label
                style={{ fontWeight: 500, marginBottom: 4, display: "block" }}
              >
                New Password
              </label>
              <input
                type="password"
                className="form-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  borderRadius: "0.5rem",
                  border: "1px solid #e5e7eb",
                  fontSize: "1rem",
                }}
              />
            </div>
            <div style={{ marginBottom: "1.5rem", textAlign: "left" }}>
              <label
                style={{ fontWeight: 500, marginBottom: 4, display: "block" }}
              >
                Confirm Password
              </label>
              <input
                type="password"
                className="form-input"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  borderRadius: "0.5rem",
                  border: "1px solid #e5e7eb",
                  fontSize: "1rem",
                }}
              />
            </div>
            <button
              type="submit"
              className="btn btn-primary"
              style={{
                width: "100%",
                background: "#6366f1",
                color: "#fff",
                fontWeight: 600,
                padding: "0.75rem",
                borderRadius: "0.5rem",
                border: "none",
                fontSize: "1rem",
                cursor: "pointer",
                transition: "background 0.2s",
              }}
              onMouseOver={(e) =>
                (e.currentTarget.style.background = "#4f46e5")
              }
              onMouseOut={(e) => (e.currentTarget.style.background = "#6366f1")}
            >
              Reset Password
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;
