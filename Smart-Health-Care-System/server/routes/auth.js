const express = require("express");
const jwt = require("jsonwebtoken");
const { body, validationResult } = require("express-validator");
const User = require("../models/User");
const auth = require("../middleware/auth");
const { admin } = require("../middleware/auth");
const {
  generateOTP,
  sendOTPEmail,
  verifyOTP,
  sendEmail,
} = require("../services/emailService");
const crypto = require("crypto");
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
  [
    body("email")
      .isEmail()
      .normalizeEmail()
      .withMessage("Please enter a valid email"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          message: "Validation failed",
          errors: errors.array(),
        });
      }

      const { email } = req.body;

      // Check if user already exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res
          .status(400)
          .json({ message: "User already exists with this email" });
      }

      // Generate OTP
      const otp = generateOTP();
      const otpExpiry = Date.now() + 10 * 60 * 1000; // 10 minutes

      // Store OTP temporarily (in production, use Redis or similar)
      // For now, we'll store it in a temporary object
      if (!global.tempOTP) global.tempOTP = {};
      global.tempOTP[email] = {
        otp,
        expiry: otpExpiry,
      };

      // Send OTP email
      const emailResult = await sendOTPEmail(email, otp);

      if (emailResult.success) {
        res.json({
          message: "OTP sent successfully",
          email: email,
        });
      } else {
        res.status(500).json({
          message: "Failed to send OTP",
          error: emailResult.error,
        });
      }
    } catch (error) {
      console.error("Send OTP error:", error);
      res.status(500).json({ message: "Server error while sending OTP" });
    }
  }
);

// @route   POST /api/auth/verify-otp
// @desc    Verify OTP and complete registration
// @access  Public
router.post(
  "/verify-otp",
  [
    body("firstName")
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage("First name must be between 2 and 50 characters"),
    body("lastName")
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage("Last name must be between 2 and 50 characters"),
    body("gender")
      .isIn(["male", "female", "other"])
      .withMessage("Gender must be male, female, or other"),
    body("email")
      .isEmail()
      .normalizeEmail()
      .withMessage("Please enter a valid email"),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters long"),
    body("otp")
      .isLength({ min: 6, max: 6 })
      .withMessage("OTP must be 6 digits"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          message: "Validation failed",
          errors: errors.array(),
        });
      }

      const { firstName, lastName, gender, email, password, otp } = req.body;

      // Verify OTP
      if (!global.tempOTP || !global.tempOTP[email]) {
        return res.status(400).json({ message: "OTP expired or not found" });
      }

      const storedOTPData = global.tempOTP[email];
      const isOTPValid = verifyOTP(
        storedOTPData.otp,
        otp,
        storedOTPData.expiry
      );

      if (!isOTPValid) {
        return res.status(400).json({ message: "Invalid or expired OTP" });
      }

      // Check if user already exists (double check)
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res
          .status(400)
          .json({ message: "User already exists with this email" });
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

      // Clear OTP from temporary storage
      delete global.tempOTP[email];

      // Generate token
      const token = generateToken(user._id);

      res.status(201).json({
        message: "User registered successfully",
        token,
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          fullName: user.fullName,
          gender: user.gender,
          email: user.email,
          isEmailVerified: user.isEmailVerified,
        },
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ message: "Server error during registration" });
    }
  }
);

// @route   POST /api/auth/register
// @desc    Register a new user (legacy route - now redirects to OTP flow)
// @access  Public
router.post(
  "/register",
  [
    body("firstName")
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage("First name must be between 2 and 50 characters")
      .matches(/^[A-Za-z ]+$/)
      .withMessage("First name can only contain letters and spaces"),
    body("lastName")
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage("Last name must be between 2 and 50 characters")
      .matches(/^[A-Za-z ]+$/)
      .withMessage("Last name can only contain letters and spaces"),
    body("gender")
      .isIn(["male", "female", "other"])
      .withMessage("Gender must be male, female, or other"),
    body("email")
      .isEmail()
      .normalizeEmail()
      .withMessage("Please enter a valid email"),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters long")
      .matches(/[A-Z]/)
      .withMessage("Password must contain at least one uppercase letter")
      .matches(/[a-z]/)
      .withMessage("Password must contain at least one lowercase letter")
      .matches(/[0-9]/)
      .withMessage("Password must contain at least one number")
      .matches(/[^A-Za-z0-9]/)
      .withMessage("Password must contain at least one symbol"),
  ],
  async (req, res) => {
    try {
      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          message: "Validation failed",
          errors: errors.array(),
        });
      }

      const { firstName, lastName, gender, email, password } = req.body;

      // Check if user already exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res
          .status(400)
          .json({ message: "User already exists with this email" });
      }

      // Create new user
      const user = new User({
        firstName,
        lastName,
        gender,
        email,
        password,
      });

      await user.save();

      // Generate token
      const token = generateToken(user._id);

      res.status(201).json({
        message: "User registered successfully",
        token,
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          fullName: user.fullName,
          gender: user.gender,
          email: user.email,
        },
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ message: "Server error during registration" });
    }
  }
);

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post(
  "/login",
  [
    body("email")
      .isEmail()
      .normalizeEmail()
      .withMessage("Please enter a valid email"),
    body("password").exists().withMessage("Password is required"),
  ],
  async (req, res) => {
    try {
      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          message: "Validation failed",
          errors: errors.array(),
        });
      }

      const { email, password } = req.body;

      // Find user by email
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(400).json({ message: "Invalid Email" });
      }

      // Check password
      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        return res.status(400).json({ message: "Invalid Password" });
      }

      // Update last login
      user.lastLogin = new Date();
      await user.save();

      // Generate token
      const token = generateToken(user._id);

      res.json({
        message: "Login successful",
        token,
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          fullName: user.fullName,
          gender: user.gender,
          email: user.email,
          lastLogin: user.lastLogin,
          role: user.role, // Include role for admin redirect
        },
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Server error during login" });
    }
  }
);

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
    body("email")
      .isEmail()
      .normalizeEmail()
      .withMessage("Please enter a valid email"),
    body("code")
      .isLength({ min: 6, max: 6 })
      .withMessage("Code must be 6 digits"),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters long")
      .matches(/[A-Z]/)
      .withMessage("Password must contain at least one uppercase letter")
      .matches(/[a-z]/)
      .withMessage("Password must contain at least one lowercase letter")
      .matches(/[0-9]/)
      .withMessage("Password must contain at least one number")
      .matches(/[^A-Za-z0-9]/)
      .withMessage("Password must contain at least one symbol"),
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
    console.log("RESET REQUEST:", { email, code, password });

    const user = await User.findOne({ email });
    if (!user || !user.resetPasswordToken || !user.resetPasswordExpires) {
      console.log("User or token/expiry missing", { user });
      return res.status(400).json({ message: "Invalid or expired code." });
    }
    if (Date.now() > user.resetPasswordExpires) {
      console.log("Code expired", {
        expires: user.resetPasswordExpires,
        now: Date.now(),
      });
      return res.status(400).json({ message: "Code has expired." });
    }
    if (user.resetPasswordToken !== code) {
      console.log("Code mismatch", {
        expected: user.resetPasswordToken,
        got: code,
      });
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
  try {
    res.json({
      user: {
        id: req.user._id,
        firstName: req.user.firstName,
        lastName: req.user.lastName,
        fullName: req.user.fullName,
        gender: req.user.gender,
        email: req.user.email,
        createdAt: req.user.createdAt,
        lastLogin: req.user.lastLogin,
      },
    });
  } catch (error) {
    console.error("Get user error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// @route   GET /api/admin/users
// @desc    Get all users (admin only)
// @access  Admin
router.get("/admin/users", auth, admin, async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.json({ users });
  } catch (error) {
    console.error("Get all users error:", error);
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
      return res.status(404).json({ message: "User not found" });
    }
    res.json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Delete user error:", error);
    res.status(500).json({ message: "Server error deleting user" });
  }
});

// @route   PATCH /api/admin/users/:id/role
// @desc    Update a user's role (admin only)
// @access  Admin
router.patch("/admin/users/:id/role", auth, admin, async (req, res) => {
  try {
    const { role } = req.body;
    if (!role || !["user", "admin"].includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true }
    );
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json({ message: "User role updated", user });
  } catch (error) {
    console.error("Update user role error:", error);
    res.status(500).json({ message: "Server error updating user role" });
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
    console.error("Admin update user error:", error);
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
    console.error("Admin stats error:", error);
    res.status(500).json({ message: "Server error fetching admin stats" });
  }
});

module.exports = router;
