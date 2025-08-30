const express = require("express");
const jwt = require("jsonwebtoken");
const { body, validationResult } = require("express-validator");
const User = require("../models/User");
const auth = require("../middleware/auth");
const { admin } = require("../middleware/auth");
const { generateOTP, sendOTPEmail } = require("../services/emailService");
const Prediction = require("../models/Prediction");

const router = express.Router();

// Generate JWT Token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET || "your-secret-key", {
    expiresIn: "7d",
  });
};

// @route   POST /api/auth/send-otp
// @desc    Send OTP to user's email
// @access  Public
router.post(
  "/send-otp",
  [body("email").isEmail().normalizeEmail().withMessage("Please enter a valid email")],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: "Validation failed", errors: errors.array() });
    }

    const { email } = req.body;

    // Check if user already exists
    const existingUser  = await User.findOne({ email });
    if (existingUser ) {
      return res.status(400).json({ message: "User  already exists with this email" });
    }

    // Generate and store OTP
    const otp = generateOTP();
    const otpExpiry = Date.now() + 10 * 60 * 1000; // 10 minutes
    global.tempOTP = global.tempOTP || {};
    global.tempOTP[email] = { otp, expiry: otpExpiry };

    // Send OTP email
    const emailResult = await sendOTPEmail(email, otp);
    if (emailResult.success) {
      return res.json({ message: "OTP sent successfully", email });
    } else {
      return res.status(500).json({ message: "Failed to send OTP", error: emailResult.error });
    }
  }
);

// @route   POST /api/auth/verify-otp
// @desc    Verify OTP and complete registration
// @access  Public
router.post(
  "/verify-otp",
  [
    body("firstName").trim().isLength({ min: 2, max: 50 }).withMessage("First name must be between 2 and 50 characters"),
    body("lastName").trim().isLength({ min: 2, max: 50 }).withMessage("Last name must be between 2 and 50 characters"),
    body("gender").isIn(["male", "female", "other"]).withMessage("Gender must be male, female, or other"),
    body("email").isEmail().normalizeEmail().withMessage("Please enter a valid email"),
    body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters long"),
    body("otp").isLength({ min: 6, max: 6 }).withMessage("OTP must be 6 digits"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: "Validation failed", errors: errors.array() });
    }

    const { firstName, lastName, gender, email, password, otp } = req.body;

    // Verify OTP
    if (!global.tempOTP || !global.tempOTP[email]) {
      return res.status(400).json({ message: "OTP expired or not found" });
    }

    const storedOTPData = global.tempOTP[email];
    const isOTPValid = storedOTPData.otp === otp && Date.now() < storedOTPData.expiry;

    if (!isOTPValid) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    // Check if user already exists
    const existingUser  = await User.findOne({ email });
    if (existingUser ) {
      return res.status(400).json({ message: "User  already exists with this email" });
    }

    // Create new user
    const user = new User({
      firstName,
      lastName,
      gender,
      email,
      password,
      isEmailVerified: true,
    });

    await user.save();
    delete global.tempOTP[email]; // Clear OTP

    const token = generateToken(user._id);
    res.status(201).json({ message: "User  registered successfully", token, user });
  }
);

// @route   POST /api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Check if password matches
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Check if email is verified
    if (!user.isEmailVerified) {
      return res.status(400).json({ message: "Please verify your email first" });
    }

    // Generate token
    const token = generateToken(user._id);

    // Remove password from response
    const userResponse = {
      _id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      doctorId: user.doctorId,
      isEmailVerified: user.isEmailVerified,
    };

    res.json({
      message: "Login successful",
      token,
      user: userResponse,
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// @route   PATCH /api/auth/update-role
// @desc    Update user role and doctorId (for doctor setup)
// @access  Private
router.patch("/update-role", auth, async (req, res) => {
  try {
    const { role, doctorId } = req.body;
    const userId = req.user._id;

    // Validate input
    if (!role || !doctorId) {
      return res.status(400).json({ message: "Role and doctorId are required" });
    }

    if (role !== "doctor") {
      return res.status(400).json({ message: "Only doctor role is supported for this endpoint" });
    }

    // Update user
    const user = await User.findByIdAndUpdate(
      userId,
      { 
        role: role,
        doctorId: doctorId
      },
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Remove password from response
    const userResponse = {
      _id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      doctorId: user.doctorId,
      isEmailVerified: user.isEmailVerified,
    };

    res.json({
      message: "User role updated successfully",
      user: userResponse,
    });
  } catch (err) {
    console.error("Update role error:", err);
    res.status(500).json({ message: "Failed to update user role" });
  }
});

// Forgot Password (send 6-digit code)
router.post("/forgot-password", async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  if (!user) {
    // Don't reveal if user exists
    return res.json({
      message: "If your email is registered, you will receive a reset code.",
    });
  }
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  user.resetPasswordToken = code;
  user.resetPasswordExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
  await user.save();
  await sendOTPEmail(user.email, code, user.firstName || "");
  res.json({
    message: "If your email is registered, you will receive a reset code.",
  });
});

// Reset Password (verify code)
router.post(
  "/reset-password",
  [
    body("email").isEmail().normalizeEmail().withMessage("Please enter a valid email"),
    body("code").isLength({ min: 6, max: 6 }).withMessage("Code must be 6 digits"),
    body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters long"),
  ],
  async (req, res) => {
    const { email, code, password } = req.body;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: "Validation failed",
        errors: errors.array(),
      });
    }

    const user = await User.findOne({ email });
    if (!user || !user.resetPasswordToken || !user.resetPasswordExpires) {
      return res.status(400).json({ message: "Invalid or expired code." });
    }
    if (Date.now() > user.resetPasswordExpires) {
      return res.status(400).json({ message: "Code has expired." });
    }
    if (user.resetPasswordToken !== code) {
      return res.status(400).json({ message: "Invalid code." });
    }
    user.password = password; // Make sure your User model hashes passwords!
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();
    res.json({ message: "Password has been reset successfully." });
  }
);

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get("/me", auth, async (req, res) => {
  res.json({
    user: {
      id: req.user._id,
      firstName: req.user.firstName,
      lastName: req.user.lastName,
      gender: req.user.gender,
      email: req.user.email,
    },
  });
});

// @route   GET /api/admin/users
// @desc    Get all users (admin only)
// @access  Admin
router.get("/admin/users", auth, admin, async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.json({ users });
  } catch (error) {
    res.status(500).json({ message: "Server error fetching users" });
  }
});

// @route   DELETE /api/admin/users/:id
// @desc    Delete a user (admin only)
// @access  Admin
router.delete("/admin/users/:id", auth, admin, async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User  not found" });
    }
    res.json({ message: "User  deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error deleting user" });
  }
});

// @route   PATCH /api/admin/users/:id/role
// @desc    Update a user's role (admin only)
// @access  Admin
router.patch("/admin/users/:id/role", auth, admin, async (req, res) => {
  const { role } = req.body;
  if (!role || !["user", "admin", "doctor"].includes(role)) {
    return res.status(400).json({ message: "Invalid role" });
  }
  const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true });
  if (!user) {
    return res.status(404).json({ message: "User  not found" });
  }
  res.json({ message: "User  role updated", user });
});

// @route   POST /api/auth/admin/doctor/register
// @desc    Register a new doctor user
// @access  Private (admin only)
router.post("/admin/doctor/register", auth, admin, async (req, res) => {
  try {
    const { firstName, lastName, email, password, doctorId } = req.body;
    
    // Validate required fields
    if (!firstName || !lastName || !email || !password || !doctorId) {
      return res.status(400).json({ 
        message: "All fields are required: firstName, lastName, email, password, doctorId" 
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists with this email" });
    }

    // Check if doctor exists
    const Doctor = require("../models/Doctor");
    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    // Create new doctor user
    const doctorUser = new User({
      firstName,
      lastName,
      email,
      password,
      role: "doctor",
      doctorId: doctorId,
      gender: "other" // Default value, can be updated later
    });

    await doctorUser.save();

    // Update doctor's contactInfo to match user email
    doctor.contactInfo = email;
    await doctor.save();

    res.status(201).json({ 
      message: "Doctor user created successfully", 
      user: doctorUser,
      doctor: doctor
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to create doctor user" });
  }
});

// @route   PATCH /api/admin/users/:id
// @desc    Update a user's details (admin only)
// @access  Admin
router.patch("/admin/users/:id", auth, admin, async (req, res) => {
  try {
    const { firstName, lastName, gender, password, role } = req.body;
    const update = {};
    if (firstName) update.firstName = firstName;
    if (lastName) update.lastName = lastName;
    if (gender) update.gender = gender;
    if (role) update.role = role;

    let user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Update fields
    Object.assign(user, update);

    // If password is provided, hash it
    if (password) user.password = password;

    await user.save();

    res.json({ message: "User updated", user });
  } catch (error) {
    res.status(500).json({ message: "Server error updating user" });
  }
});

// @route   GET /api/admin/stats
// @desc    Get admin dashboard stats (total users, total predictions, recent users, recent predictions)
// @access  Admin
router.get("/admin/stats", auth, admin, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalPredictions = await Prediction.countDocuments();
    const recentUsers = await User.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select("-password");
    const recentPredictions = await Prediction.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate("userId", "email firstName lastName");
    res.json({
      totalUsers,
      totalPredictions,
      recentUsers,
      recentPredictions,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error fetching admin stats" });
  }
});

// @route   GET /api/auth/admin/doctors
// @desc    Get all doctors for admin to create doctor users
// @access  Admin
router.get("/admin/doctors", auth, admin, async (req, res) => {
  try {
    const Doctor = require("../models/Doctor");
    const doctors = await Doctor.find({}).select("name category contactInfo");
    res.json({ doctors });
  } catch (error) {
    res.status(500).json({ message: "Server error fetching doctors" });
  }
});

module.exports = router;
