"use client";

import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext.jsx";
import { toast } from "react-toastify";
import {
  UserPlus,
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Users,
  Shield,
  UserCheck,
  Stethoscope,
} from "lucide-react";
import axios from "axios";

function isNameValid(name) {
  return /^[A-Za-z ]+$/.test(name);
}

const Register = () => {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    gender: "",
    email: "",
    password: "",
    confirmPassword: "",
    accountType: "user", // "user" or "doctor"
    // Doctor-specific fields
    category: "",
    qualifications: "",
    experience: "",
    fee: "",
  });
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState(1); // 1: Collect data, 2: Verify OTP
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "firstName" || name === "lastName") {
      // Only allow letters and spaces
      setFormData({
        ...formData,
        [name]: value.replace(/[^A-Za-z ]/g, ""),
      });
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };

  const handleSendOTP = async (e) => {
    e.preventDefault();

    if (!isNameValid(formData.firstName)) {
      toast.error("First name can only contain letters and spaces.");
      return;
    }
    if (!isNameValid(formData.lastName)) {
      toast.error("Last name can only contain letters and spaces.");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (formData.password.length < 6) {
      toast.error("Password must be at least 6 characters long");
      return;
    }

    // Validate doctor-specific fields if account type is doctor
    if (formData.accountType === "doctor") {
      if (!formData.category || !formData.fee) {
        toast.error("Category and fee are required for doctor accounts");
        return;
      }
      
      // Validate fee is a positive number
      const feeNum = parseInt(formData.fee);
      if (isNaN(feeNum) || feeNum <= 0) {
        toast.error("Please enter a valid consultation fee");
        return;
      }
      
      // Validate experience is a non-negative number
      if (formData.experience) {
        const expNum = parseInt(formData.experience);
        if (isNaN(expNum) || expNum < 0) {
          toast.error("Experience must be a valid number");
          return;
        }
      }
    }

    setLoading(true);

    try {
      const response = await axios.post("/api/auth/send-otp", {
        email: formData.email,
      });

      if (response.data.message === "OTP sent successfully") {
        toast.success("OTP sent to your email!");
        setStep(2);
      } else {
        toast.error(response.data.message || "Failed to send OTP");
      }
    } catch (error) {
      const message = error.response?.data?.message || "Failed to send OTP";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();

    if (otp.length !== 6) {
      toast.error("Please enter a valid 6-digit OTP");
      return;
    }

    setLoading(true);

    try {
      let response;
      
      if (formData.accountType === "doctor") {
        // For doctor registration, we need to create both doctor and user
        response = await axios.post("/api/auth/verify-otp", {
          ...formData,
          otp,
          role: "doctor",
        });
      } else {
        // For regular user registration
        response = await axios.post("/api/auth/verify-otp", {
          ...formData,
          otp,
        });
      }

      if (response.data.token) {
        // Store token and user data
        localStorage.setItem("token", response.data.token);
        toast.success("Registration successful!");
        
        // Redirect based on account type
        if (formData.accountType === "doctor") {
          navigate("/doctor");
        } else {
          navigate("/dashboard");
        }
      } else {
        toast.error(response.data.message || "Verification failed");
      }
    } catch (error) {
      console.error("Verification error:", error);
      console.error("Error response:", error.response?.data);
      const message = error.response?.data?.message || "Verification failed";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setLoading(true);
    try {
      const response = await axios.post("/api/auth/send-otp", {
        email: formData.email,
      });

      if (response.data.message === "OTP sent successfully") {
        toast.success("OTP resent successfully!");
      } else {
        toast.error(response.data.message || "Failed to resend OTP");
      }
    } catch (error) {
      const message = error.response?.data?.message || "Failed to resend OTP";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #667eea 0%,rgb(45, 26, 65) 100%)",
        padding: "2rem",
      }}
    >
      <div className="card" style={{ width: "100%", maxWidth: "450px" }}>
        <div className="text-center mb-6">
          <UserPlus
            size={48}
            color="#3b82f6"
            style={{ margin: "0 auto 1rem" }}
          />
          <h1
            style={{
              fontSize: "2rem",
              fontWeight: "700",
              marginBottom: "0.5rem",
            }}
          >
            {step === 1 ? "Create Account" : "Verify Email"}
          </h1>
          <p style={{ color: "#64748b" }}>
            {step === 1
              ? "Sign up for your diabetes prediction"
              : `Enter the 6-digit code sent to ${formData.email}`}
          </p>
        </div>

        {step === 1 ? (
          <form onSubmit={handleSendOTP}>
            {/* Account Type Selection */}
            <div className="form-group">
              <label className="form-label">
                <UserCheck
                  size={16}
                  style={{ display: "inline", marginRight: "0.5rem" }}
                />
                Account Type
              </label>
              <div
                style={{
                  display: "flex",
                  gap: "1rem",
                  alignItems: "center",
                  marginTop: "0.25rem",
                }}
              >
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    fontWeight: 400,
                    padding: "0.5rem 1rem",
                    border: formData.accountType === "user" ? "2px solid #3b82f6" : "2px solid #e2e8f0",
                    borderRadius: "8px",
                    cursor: "pointer",
                    backgroundColor: formData.accountType === "user" ? "#eff6ff" : "transparent",
                  }}
                >
                  <input
                    type="radio"
                    name="accountType"
                    value="user"
                    checked={formData.accountType === "user"}
                    onChange={handleChange}
                    required
                    style={{ accentColor: "#3b82f6" }}
                  />
                  <User size={16} />
                  Patient
                </label>
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    fontWeight: 400,
                    padding: "0.5rem 1rem",
                    border: formData.accountType === "doctor" ? "2px solid #3b82f6" : "2px solid #e2e8f0",
                    borderRadius: "8px",
                    cursor: "pointer",
                    backgroundColor: formData.accountType === "doctor" ? "#eff6ff" : "transparent",
                  }}
                >
                  <input
                    type="radio"
                    name="accountType"
                    value="doctor"
                    checked={formData.accountType === "doctor"}
                    onChange={handleChange}
                    required
                    style={{ accentColor: "#3b82f6" }}
                  />
                  <Stethoscope size={16} />
                  Doctor
                </label>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">
                <User
                  size={16}
                  style={{ display: "inline", marginRight: "0.5rem" }}
                />
                First Name
              </label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                className="form-input"
                placeholder="Enter your first name"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                <User
                  size={16}
                  style={{ display: "inline", marginRight: "0.5rem" }}
                />
                Last Name
              </label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                className="form-input"
                placeholder="Enter your last name"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                <Users
                  size={16}
                  style={{ display: "inline", marginRight: "0.5rem" }}
                />
                Gender
              </label>
              <div
                style={{
                  display: "flex",
                  gap: "1.5rem",
                  alignItems: "center",
                  marginTop: "0.25rem",
                }}
              >
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    fontWeight: 400,
                  }}
                >
                  <input
                    type="radio"
                    name="gender"
                    value="male"
                    checked={formData.gender === "male"}
                    onChange={handleChange}
                    required
                    style={{ accentColor: "#3b82f6" }}
                  />
                  Male
                </label>
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    fontWeight: 400,
                  }}
                >
                  <input
                    type="radio"
                    name="gender"
                    value="female"
                    checked={formData.gender === "female"}
                    onChange={handleChange}
                    required
                    style={{ accentColor: "#3b82f6" }}
                  />
                  Female
                </label>
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    fontWeight: 400,
                  }}
                >
                  <input
                    type="radio"
                    name="gender"
                    value="other"
                    checked={formData.gender === "other"}
                    onChange={handleChange}
                    required
                    style={{ accentColor: "#3b82f6" }}
                  />
                  Other
                </label>
              </div>
            </div>

            {/* Doctor-specific fields */}
            {formData.accountType === "doctor" && (
              <>
                <div className="form-group">
                  <label className="form-label">
                    <Stethoscope
                      size={16}
                      style={{ display: "inline", marginRight: "0.5rem" }}
                    />
                    Specialization
                  </label>
                  <input
                    type="text"
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="e.g., Diabetes Specialist"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">
                    <Shield
                      size={16}
                      style={{ display: "inline", marginRight: "0.5rem" }}
                    />
                    Qualifications
                  </label>
                  <input
                    type="text"
                    name="qualifications"
                    value={formData.qualifications}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="e.g., MBBS, MD"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">
                    <UserCheck
                      size={16}
                      style={{ display: "inline", marginRight: "0.5rem" }}
                    />
                    Experience (years)
                  </label>
                  <input
                    type="number"
                    name="experience"
                    value={formData.experience}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="e.g., 10"
                    min="0"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">
                    <Shield
                      size={16}
                      style={{ display: "inline", marginRight: "0.5rem" }}
                    />
                    Consultation Fee
                  </label>
                  <input
                    type="number"
                    name="fee"
                    value={formData.fee}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="e.g., 1500"
                    min="0"
                    required
                  />
                </div>
              </>
            )}

            <div className="form-group">
              <label className="form-label">
                <Mail
                  size={16}
                  style={{ display: "inline", marginRight: "0.5rem" }}
                />
                Email Address
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="form-input"
                placeholder="Enter your email"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                <Lock
                  size={16}
                  style={{ display: "inline", marginRight: "0.5rem" }}
                />
                Password
              </label>
              <div style={{ position: "relative" }}>
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="Enter your password"
                  required
                />
                <span
                  onClick={() => setShowPassword((prev) => !prev)}
                  style={{
                    position: "absolute",
                    right: "10px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    cursor: "pointer",
                  }}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </span>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">
                <Lock
                  size={16}
                  style={{ display: "inline", marginRight: "0.5rem" }}
                />
                Confirm Password
              </label>
              <div style={{ position: "relative" }}>
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="Confirm your password"
                  required
                />
                <span
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  style={{
                    position: "absolute",
                    right: "10px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    cursor: "pointer",
                  }}
                >
                  {showConfirmPassword ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}
                </span>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: "100%", marginBottom: "1rem" }}
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="loading-spinner"></div>
                  Sending OTP...
                </>
              ) : (
                <>
                  <Shield size={16} />
                  Send Verification Code
                </>
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOTP}>
            <div className="form-group">
              <label className="form-label">
                <Shield
                  size={16}
                  style={{ display: "inline", marginRight: "0.5rem" }}
                />
                Verification Code
              </label>
              <input
                type="text"
                value={otp}
                onChange={(e) =>
                  setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
                }
                className="form-input"
                placeholder="Enter 6-digit code"
                maxLength={6}
                style={{
                  textAlign: "center",
                  fontSize: "1.2rem",
                  letterSpacing: "0.5rem",
                }}
                required
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: "100%", marginBottom: "1rem" }}
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="loading-spinner"></div>
                  Verifying...
                </>
              ) : (
                <>
                  <UserPlus size={16} />
                  Complete Registration
                </>
              )}
            </button>

            <div className="text-center">
              <button
                type="button"
                onClick={handleResendOTP}
                disabled={loading}
                style={{
                  background: "none",
                  border: "none",
                  color: "#3b82f6",
                  cursor: "pointer",
                  textDecoration: "underline",
                  fontSize: "0.875rem",
                }}
              >
                Didn't receive code? Resend
              </button>
            </div>

            <div className="text-center" style={{ marginTop: "1rem" }}>
              <button
                type="button"
                onClick={() => setStep(1)}
                style={{
                  background: "none",
                  border: "none",
                  color: "#64748b",
                  cursor: "pointer",
                  fontSize: "0.875rem",
                }}
              >
                ← Back to registration
              </button>
            </div>
          </form>
        )}

        <div className="text-center">
          <p style={{ color: "#64748b" }}>
            Already have an account?{" "}
            <Link
              to="/login"
              style={{
                color: "#3b82f6",
                textDecoration: "none",
                fontWeight: "500",
              }}
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
