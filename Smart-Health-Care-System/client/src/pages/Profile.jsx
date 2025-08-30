import React, { useEffect, useState, useRef } from "react";
import { FiEdit2, FiCamera } from "react-icons/fi";



const Profile = () => {
  const [profile, setProfile] = useState({
    firstName: "",
    lastName: "",
    gender: "",
    age: "",
    phone: "",
    address: "",
    email: "",
    role: "",
    avatar: "", // URL or base64 string
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [saving, setSaving] = useState(false);
  const [avatarFile, setAvatarFile] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [originalProfile, setOriginalProfile] = useState(null);
  const fileInputRef = useRef();

  // Get token from localStorage
  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await fetch("/api/profile", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (!res.ok) throw new Error("Failed to fetch profile");
        const data = await res.json();
        console.log("Fetched profile data:", data.user);
        console.log("Avatar value:", data.user.avatar);
        console.log("Avatar URL constructed:", getAvatarUrl(data.user.avatar));
        setProfile(data.user);
        setOriginalProfile(data.user);
        setAvatarFile(null); // clear any local file
      } catch (err) {
        setError(err.message || "Error fetching profile");
      } finally {
        setLoading(false);
      }
    };
    if (token) fetchProfile();
    else setLoading(false);
  }, [token]);

  // Helper to get absolute avatar URL
  function getAvatarUrl(avatar) {
    if (!avatar) return "";
    if (avatar.startsWith("http")) return avatar;
    if (avatar.startsWith("data:image")) return avatar;
    const baseUrl = window.location.origin;
    if (baseUrl.includes("localhost:3000")) {
      return `http://localhost:5005${avatar}`;
    } else {
      return `${baseUrl}${avatar}`;
    }
  }

  // Helper to get user initials
  function getInitials(firstName, lastName) {
    if (!firstName && !lastName) return "?";
    const first = firstName ? firstName.charAt(0).toUpperCase() : "";
    const last = lastName ? lastName.charAt(0).toUpperCase() : "";
    return first + last;
  }

  // Helper to format fee
  function formatFee(fee) {
    if (!fee) return "";
    return `Rs. ${fee}`;
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfile((prev) => ({ ...prev, [name]: value }));
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file && (file.type === "image/jpeg" || file.type === "image/png")) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfile((prev) => ({ ...prev, avatar: reader.result }));
      };
      reader.readAsDataURL(file);
    } else {
      setAvatarFile(null);
    }
  };

  const handleAvatarClick = () => {
    if (editMode) fileInputRef.current.click();
  };

  const handleEdit = () => {
    setEditMode(true);
    setOriginalProfile(profile);
    setSuccess("");
    setError("");
  };

  const handleCancel = () => {
    setProfile(originalProfile);
    setEditMode(false);
    setAvatarFile(null);
    setSuccess("");
    setError("");
  };

  const validateProfile = () => {
    if (!profile.firstName.trim() || !profile.lastName.trim()) {
      setError("First and last name are required.");
      return false;
    }
    if (!profile.gender) {
      setError("Gender is required.");
      return false;
    }
    if (profile.age && (profile.age < 0 || profile.age > 120)) {
      setError("Age must be between 0 and 120.");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateProfile()) return;
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      let body;
      let headers;
      if (avatarFile) {
        body = new FormData();
        body.append("firstName", profile.firstName);
        body.append("lastName", profile.lastName);
        body.append("gender", profile.gender);
        body.append("age", profile.age);
        body.append("phone", profile.phone);
        body.append("address", profile.address);
        body.append("avatar", avatarFile);
        headers = {
          Authorization: `Bearer ${token}`,
        };
      } else {
        body = JSON.stringify({
          firstName: profile.firstName,
          lastName: profile.lastName,
          gender: profile.gender,
          age: profile.age,
          phone: profile.phone,
          address: profile.address,
        });
        headers = {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        };
      }
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers,
        body,
      });
      if (!res.ok) throw new Error("Failed to update profile");
      const data = await res.json();
      console.log("Profile update response:", data);
      console.log("Updated avatar:", data.user.avatar);
      // Always use backend path after save
      setProfile(data.user);
      setOriginalProfile(data.user);
      setEditMode(false);
      setAvatarFile(null);
      setSuccess("Profile updated successfully!");
    } catch (err) {
      setError(err.message || "Error updating profile");
    } finally {
      setSaving(false);
    }
  };

  if (loading)
    return (
      <div style={{ textAlign: "center", marginTop: 80 }}>Loading profile...</div>
    );
  if (!token)
    return <div style={{ textAlign: "center", marginTop: 80 }}>Please log in to view your profile.</div>;

  // Debug log for avatar
  console.log("Rendering profile with avatar:", profile.avatar);
  console.log("Doctor info:", profile.doctorInfo);
  console.log("Avatar URL for rendering:", getAvatarUrl(profile.avatar));
  console.log("Profile state:", profile);

  // Check if avatar should be displayed
  const shouldShowAvatar = (profile.avatar && profile.avatar.trim() !== "") || 
                          (profile.doctorInfo && profile.doctorInfo.photo && profile.doctorInfo.photo.trim() !== "");
  
  // Get the appropriate image source
  const getImageSource = () => {
    if (profile.avatar && profile.avatar.trim() !== "") {
      return getAvatarUrl(profile.avatar);
    }
    if (profile.doctorInfo && profile.doctorInfo.photo && profile.doctorInfo.photo.trim() !== "") {
      return getAvatarUrl(profile.doctorInfo.photo);
    }
    return "";
  };
  
  const avatarUrl = getImageSource();
  console.log("Should show avatar:", shouldShowAvatar);
  console.log("Avatar URL:", avatarUrl);

  return (
    <div
      className="profile-container"
      style={{
        maxWidth: 420,
        margin: "2.5rem auto",
        padding: 0,
        background: "#fff",
        borderRadius: 16,
        boxShadow: "0 4px 24px #e0e7ef",
        overflow: "hidden",
        position: 'relative',
      }}
    >
      {/* Edit icon button at top right */}
      {!editMode && (
        <button
          onClick={handleEdit}
          style={{
            position: 'absolute',
            top: 18,
            right: 18,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: '#3b82f6',
            fontSize: 22,
            padding: 4,
            zIndex: 2,
          }}
          title="Edit Profile"
        >
          <FiEdit2 />
        </button>
      )}
      <div style={{ background: "#f3f6fa", padding: "2.5rem 0 1.5rem 0", textAlign: "center", position: 'relative' }}>
        <div
          style={{
            width: 96,
            height: 96,
            borderRadius: "50%",
            margin: "0 auto 1rem auto",
            background: "#e5e7eb",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 40,
            color: "#3b82f6",
            fontWeight: 700,
            boxShadow: "0 2px 8px #e0e7ef",
            overflow: "hidden",
            position: "relative",
            cursor: editMode ? "pointer" : "default",
          }}
          onClick={handleAvatarClick}
          title={editMode ? "Click to change photo" : "Profile photo"}
        >
          {shouldShowAvatar ? (
            <img
              src={avatarUrl}
              alt="avatar"
              style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }}
              onError={(e) => {
                console.log("Image failed to load:", profile.avatar);
                console.log("Constructed URL:", getAvatarUrl(profile.avatar));
                e.target.style.display = "none";
                // Show initials when image fails
                const initialsSpan = e.target.parentNode.querySelector('.avatar-initials');
                if (initialsSpan) {
                  initialsSpan.style.display = "flex";
                }
              }}
              onLoad={() => {
                console.log("Image loaded successfully:", getAvatarUrl(profile.avatar));
                // Hide initials when image loads successfully
                const initialsSpan = e.target.parentNode.querySelector('.avatar-initials');
                if (initialsSpan) {
                  initialsSpan.style.display = "none";
                }
              }}
            />
          ) : null}
          <span 
            className="avatar-initials"
            style={{ 
              display: shouldShowAvatar ? "none" : "flex",
              width: "100%",
              height: "100%",
              alignItems: "center",
              justifyContent: "center"
            }}
          >
            {getInitials(profile.firstName, profile.lastName)}
          </span>
          <input
            type="file"
            accept="image/jpeg,image/png"
            style={{ display: "none" }}
            ref={fileInputRef}
            onChange={handleAvatarChange}
            disabled={!editMode}
          />
          {editMode && (
            <span
              style={{
                position: "absolute",
                bottom: 4,
                right: 4,
                background: "#3b82f6",
                color: "#fff",
                borderRadius: "50%",
                width: 32,
                height: 32,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 18,
                border: "2px solid #fff",
                boxShadow: "0 1px 4px #e0e7ef",
              }}
            >
              <FiCamera />
            </span>
          )}
        </div>
        <div style={{ fontSize: 22, fontWeight: 600, color: "#222" }}>
          {profile.doctorInfo ? profile.doctorInfo.name : `${profile.firstName} ${profile.lastName}`}
        </div>
        <div style={{ color: "#6b7280", fontSize: 15, marginTop: 2 }}>{profile.email}</div>
      </div>
      <form
        onSubmit={handleSubmit}
        style={{ padding: "2rem 2rem 1.5rem 2rem", background: "#fff" }}
        autoComplete="off"
      >
        {error && <div style={{ color: "#ef4444", marginBottom: 12 }}>{error}</div>}
        {success && <div style={{ color: "#22c55e", marginBottom: 12 }}>{success}</div>}
        <div style={{ marginBottom: 18 }}>
          <label style={{ fontWeight: 500, display: "block", marginBottom: 6 }}>First Name</label>
          {editMode ? (
            <input
              type="text"
              name="firstName"
              value={profile.firstName}
              onChange={handleChange}
              required
              style={{ width: "100%", padding: 8, borderRadius: 6, border: "1.5px solid #3b82f6", background: "#f8fafc" }}
            />
          ) : (
            <div style={{ padding: 8, background: "#f5f5f5", borderRadius: 6 }}>{profile.firstName}</div>
          )}
        </div>
        <div style={{ marginBottom: 18 }}>
          <label style={{ fontWeight: 500, display: "block", marginBottom: 6 }}>Last Name</label>
          {editMode ? (
            <input
              type="text"
              name="lastName"
              value={profile.lastName}
              onChange={handleChange}
              required
              style={{ width: "100%", padding: 8, borderRadius: 6, border: "1.5px solid #3b82f6", background: "#f8fafc" }}
            />
          ) : (
            <div style={{ padding: 8, background: "#f5f5f5", borderRadius: 6 }}>{profile.lastName}</div>
          )}
        </div>
        <div style={{ marginBottom: 18 }}>
          <label style={{ fontWeight: 500, display: "block", marginBottom: 6 }}>Gender</label>
          {editMode ? (
            <select
              name="gender"
              value={profile.gender}
              onChange={handleChange}
              required
              style={{ width: "100%", padding: 8, borderRadius: 6, border: "1.5px solid #3b82f6", background: "#f8fafc" }}
            >
              <option value="">Select</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          ) : (
            <div style={{ padding: 8, background: "#f5f5f5", borderRadius: 6 }}>{profile.gender}</div>
          )}
        </div>
        <div style={{ marginBottom: 18 }}>
          <label style={{ fontWeight: 500, display: "block", marginBottom: 6 }}>Age</label>
          {editMode ? (
            <input
              type="number"
              name="age"
              value={profile.age || ""}
              onChange={handleChange}
              min="0"
              max="120"
              style={{ width: "100%", padding: 8, borderRadius: 6, border: "1.5px solid #3b82f6", background: "#f8fafc" }}
            />
          ) : (
            <div style={{ padding: 8, background: "#f5f5f5", borderRadius: 6 }}>{profile.age}</div>
          )}
        </div>
        <div style={{ marginBottom: 18 }}>
          <label style={{ fontWeight: 500, display: "block", marginBottom: 6 }}>Phone</label>
          {editMode ? (
            <input
              type="text"
              name="phone"
              value={profile.phone || ""}
              onChange={handleChange}
              style={{ width: "100%", padding: 8, borderRadius: 6, border: "1.5px solid #3b82f6", background: "#f8fafc" }}
            />
          ) : (
            <div style={{ padding: 8, background: "#f5f5f5", borderRadius: 6 }}>{profile.phone}</div>
          )}
        </div>
        <div style={{ marginBottom: 18 }}>
          <label style={{ fontWeight: 500, display: "block", marginBottom: 6 }}>Address</label>
          {editMode ? (
            <input
              type="text"
              name="address"
              value={profile.address || ""}
              onChange={handleChange}
              style={{ width: "100%", padding: 8, borderRadius: 6, border: "1.5px solid #3b82f6", background: "#f8fafc" }}
            />
          ) : (
            <div style={{ padding: 8, background: "#f5f5f5", borderRadius: 6 }}>{profile.address}</div>
          )}
        </div>
        
        {/* Doctor Information Display */}
        {profile.doctorInfo && (
          <div style={{ 
            background: "#f8fafc", 
            padding: "1.5rem", 
            borderRadius: 8, 
            marginBottom: "1.5rem",
            border: "1px solid #e2e8f0"
          }}>
            <h4 style={{ marginBottom: "1rem", color: "#1e293b", fontSize: "1.1rem" }}>Doctor Information</h4>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <div>
                <strong>Category:</strong> {profile.doctorInfo.category}
              </div>
              <div>
                <strong>Qualifications:</strong> {profile.doctorInfo.qualifications}
              </div>
              <div>
                <strong>Experience:</strong> {profile.doctorInfo.experience} years
              </div>
              <div>
                <strong>Expertise:</strong> {profile.doctorInfo.expertise || "Not specified"}
              </div>
              <div>
                <strong>Fee:</strong> Rs. {profile.doctorInfo.fee}
              </div>
              <div>
                <strong>Contact:</strong> {profile.doctorInfo.contactInfo}
              </div>
            </div>
          </div>
        )}
        
        {editMode && (
          <div style={{ display: "flex", gap: 12 }}>
            <button
              type="submit"
              disabled={saving}
              style={{
                flex: 1,
                padding: "10px 0",
                background: "#3b82f6",
                color: "#fff",
                border: "none",
                borderRadius: 6,
                fontWeight: 600,
                fontSize: 16,
                boxShadow: "0 2px 8px #e0e7ef",
                cursor: saving ? "not-allowed" : "pointer",
                marginTop: 8,
                transition: "background 0.2s",
              }}
            >
              {saving ? "Saving..." : "Save"}
            </button>
            <button
              type="button"
              onClick={handleCancel}
              style={{
                flex: 1,
                padding: "10px 0",
                background: "#e5e7eb",
                color: "#222",
                border: "none",
                borderRadius: 6,
                fontWeight: 600,
                fontSize: 16,
                boxShadow: "0 2px 8px #e0e7ef",
                cursor: "pointer",
                marginTop: 8,
                transition: "background 0.2s",
              }}
            >
              Cancel
            </button>
          </div>
        )}
      </form>
    </div>
  );
};

export default Profile; 