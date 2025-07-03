const express = require("express");
const jwt = require("jsonwebtoken");
const { body, validationResult } = require("express-validator");
const User = require("../models/User");
const auth = require("../middleware/auth");
const {
  generateOTP,
  sendOTPEmail,
  verifyOTP,
} = require("../services/emailService");

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
        },
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Server error during login" });
    }
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

module.exports = router;
