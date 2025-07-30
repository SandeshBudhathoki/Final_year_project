const express = require("express");
const User = require("../models/User");
const auth = require("../middleware/auth");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const router = express.Router();

// Multer setup for avatar uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, "../uploads/avatars");
    fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    cb(null, req.user._id + "_avatar" + ext);
  },
});
const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "image/jpeg" || file.mimetype === "image/png") {
      cb(null, true);
    } else {
      cb(new Error("Only JPG/PNG images are allowed"));
    }
  },
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB max
});

// @route   GET /api/profile
// @desc    Get current user's profile
// @access  Private
router.get("/", auth, async (req, res) => {
  try {
    const user = req.user;
    res.json({
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        gender: user.gender,
        age: user.age,
        phone: user.phone,
        address: user.address,
        email: user.email,
        role: user.role,
        avatar: user.avatar || "",
        createdAt: user.createdAt,
        lastLogin: user.lastLogin,
      },
    });
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// @route   PUT /api/profile
// @desc    Update current user's profile (with optional avatar upload)
// @access  Private
router.put("/", auth, upload.single("avatar"), async (req, res) => {
  try {
    const user = req.user;
    // Accept both JSON and multipart/form-data
    const data = req.body;
    const { firstName, lastName, gender, age, phone, address } = data;

    if (firstName !== undefined) user.firstName = firstName;
    if (lastName !== undefined) user.lastName = lastName;
    if (gender !== undefined) user.gender = gender;
    if (age !== undefined) user.age = age;
    if (phone !== undefined) user.phone = phone;
    if (address !== undefined) user.address = address;

    if (req.file) {
      // Save avatar URL (relative path)
      user.avatar = `/uploads/avatars/${req.file.filename}`;
    }

    await user.save();

    res.json({
      message: "Profile updated successfully",
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        gender: user.gender,
        age: user.age,
        phone: user.phone,
        address: user.address,
        email: user.email,
        role: user.role,
        avatar: user.avatar || "",
        createdAt: user.createdAt,
        lastLogin: user.lastLogin,
      },
    });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({ message: "Server error updating profile" });
  }
});

module.exports = router; 