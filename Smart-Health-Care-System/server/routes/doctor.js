const express = require("express");
const mongoose = require("mongoose");
const Doctor = require("../models/Doctor");
const auth = require("../middleware/auth");
const { admin } = require("../middleware/auth");
const { sendEmail } = require("../services/emailService");
const User = require("../models/User");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const router = express.Router();

// Multer setup for doctor photo uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, "../uploads/doctors");
    console.log("=== MULTER DEBUG ===");
    console.log("Upload path:", uploadPath);
    console.log("File:", file.originalname, "Size:", file.size, "Type:", file.mimetype);
    
    try {
      fs.mkdirSync(uploadPath, { recursive: true });
      console.log("Upload directory created/verified successfully");
      cb(null, uploadPath);
    } catch (error) {
      console.error("Error creating upload directory:", error);
      cb(error);
    }
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const filename = req.user._id + "_doctor" + ext;
    console.log("Generated filename:", filename);
    cb(null, filename);
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    console.log("File filter check:", file.originalname, file.mimetype);
    if (file.mimetype === "image/jpeg" || file.mimetype === "image/png") {
      cb(null, true);
    } else {
      console.log("File type rejected:", file.mimetype);
      cb(new Error("Only JPG/PNG images are allowed"));
    }
  },
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB max
}).single("photo");

// Wrap multer in error handling middleware
const uploadWithErrorHandling = (req, res, next) => {
  upload(req, res, (err) => {
    if (err) {
      console.error("Multer error:", err);
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ message: "File size too large. Maximum size is 2MB." });
      }
      if (err.message && err.message.includes('Only JPG/PNG images are allowed')) {
        return res.status(400).json({ message: "Only JPG/PNG images are allowed." });
      }
      if (err.code === 'ENOENT' || err.message.includes('ENOENT')) {
        return res.status(500).json({ message: "Server upload directory error. Please try again." });
      }
      return res.status(400).json({ message: "File upload error: " + err.message });
    }
    next();
  });
};

// Public: List doctors with search and status filters
router.get("/", async (req, res) => {
  try {
    const { search, availabilityStatus } = req.query;
    const query = {};

    if (search) {
      const regex = new RegExp(search, "i");
      query.$or = [
        { name: regex },
        { category: regex },
        { expertise: regex }
      ];
    }

    if (availabilityStatus) {
      query.availabilityStatus = availabilityStatus;
    }

    console.log("Fetching doctors with query:", query);
    const doctors = await Doctor.find(query);
    console.log(`Found ${doctors.length} doctors`);
    
    // Simple availability check without updating the database
    const Appointment = require("../models/Appointment");
    const doctorsWithAvailability = await Promise.all(
      doctors.map(async (doctor) => {
        try {
          // Check if doctor has confirmed appointments
          const confirmedAppointments = await Appointment.countDocuments({
            doctorId: doctor._id,
            status: 'confirmed'
          });

          // Create a copy of the doctor object with updated availability
          const doctorObj = doctor.toObject();
          
          // Override availability status based on confirmed appointments
          if (confirmedAppointments > 0) {
            doctorObj.availabilityStatus = 'busy';
            doctorObj.hasConfirmedAppointments = true;
          } else {
            doctorObj.availabilityStatus = doctor.availabilityStatus;
            doctorObj.hasConfirmedAppointments = false;
          }

          return doctorObj;
        } catch (err) {
          console.error(`Error checking availability for doctor ${doctor._id}:`, err);
          // Return doctor as is if there's an error
          return doctor.toObject();
        }
      })
    );

    console.log(`Returning ${doctorsWithAvailability.length} doctors`);
    res.json({ doctors: doctorsWithAvailability });
  } catch (err) {
    console.error("Error fetching doctors:", err);
    res.status(500).json({ message: "Failed to fetch doctors" });
  }
});

// Admin: Add new doctor
router.post("/", auth, admin, async (req, res) => {
  try {
    const { name, category, qualifications, experience, expertise, fee, availableSlots, photo, contactInfo } = req.body;
    if (!name || !category || !fee) {
      return res.status(400).json({ message: "Name, category, and fee are required" });
    }
    const doctor = new Doctor({ name, category, qualifications, experience, expertise, fee, availableSlots, photo, contactInfo });
    await doctor.save();
    res.status(201).json({ message: "Doctor added", doctor });
  } catch (err) {
    res.status(500).json({ message: "Failed to add doctor" });
  }
});

// Admin: Edit doctor
router.put("/:id", auth, admin, async (req, res) => {
  try {
    const doctor = await Doctor.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!doctor) return res.status(404).json({ message: "Doctor not found" });
    res.json({ message: "Doctor updated", doctor });
  } catch (err) {
    res.status(500).json({ message: "Failed to update doctor" });
  }
});

// Admin: Delete doctor
router.delete("/:id", auth, admin, async (req, res) => {
  try {
    const doctor = await Doctor.findByIdAndDelete(req.params.id);
    if (!doctor) return res.status(404).json({ message: "Doctor not found" });
    res.json({ message: "Doctor removed" });
  } catch (err) {
    res.status(500).json({ message: "Failed to remove doctor" });
  }
});

// Admin: View all doctors' availability
router.get("/admin/availability", auth, admin, async (req, res) => {
  try {
    console.log("Authenticated user:", req.user);
    if (mongoose.connection.readyState !== 1) {
      return res.status(500).json({ message: "Database not connected" });
    }
    const doctors = await Doctor.find().select("name category availabilityStatus lastStatusUpdate statusNotes currentPatientId");
    res.json({ doctors });
  } catch (err) {
    console.error("Error fetching doctor availability (admin):", err);
    res.status(500).json({ message: "Failed to fetch doctor availability", error: err.message });
  }
});

// Shared: Update availability logic
const updateAvailability = async (doctor, req, res) => {
  try {
    const { availabilityStatus, statusNotes, currentPatientId } = req.body;
    const validStatuses = ["available", "busy", "offline", "booked"];

    if (!availabilityStatus) {
      throw new Error("Availability status is required");
    }

    if (!validStatuses.includes(availabilityStatus)) {
      throw new Error(`Invalid availability status. Must be one of: ${validStatuses.join(", ")}`);
    }

    console.log("Updating doctor availability:", {
      doctorId: doctor._id,
      oldStatus: doctor.availabilityStatus,
      newStatus: availabilityStatus,
      notes: statusNotes
    });

    const oldStatus = doctor.availabilityStatus;
    doctor.availabilityStatus = availabilityStatus;
    doctor.statusNotes = statusNotes || "";
    doctor.currentPatientId = currentPatientId || null;
    doctor.lastStatusUpdate = new Date();

    await doctor.save();
    console.log("Doctor availability updated successfully");

    // Try to send admin notification but don't fail if email fails
    if (oldStatus !== "available" && availabilityStatus === "available") {
      try {
        const adminUsers = await User.find({ role: "admin" });
        const subject = "Doctor Available - Smart Health Care System";
        const html = `
          <h3>Doctor Status Update</h3>
          <p><strong>Doctor:</strong> Dr. ${doctor.name} (${doctor.category})</p>
          <p><strong>Status:</strong> Now Available</p>
          <p><strong>Previous Status:</strong> ${oldStatus}</p>
          <p><strong>Updated:</strong> ${new Date().toLocaleString()}</p>
          ${statusNotes ? `<p><strong>Notes:</strong> ${statusNotes}</p>` : ''}
          <p>Patients can now book appointments with this doctor.</p>
        `;
        
        // Send emails to admin users but don't fail if they don't work
        for (const adminUser of adminUsers) {
          if (adminUser.email) {
            sendEmail(adminUser.email, subject, html).catch(emailErr => {
              console.log("Failed to send admin notification:", emailErr.message);
            });
          }
        }
      } catch (emailErr) {
        console.log("Failed to send availability notification:", emailErr.message);
        // Don't fail the entire request if email fails
      }
    }

    // Return the result instead of calling res.json()
    return { 
      message: "Doctor availability updated successfully", 
      doctor, 
      statusChange: { from: oldStatus, to: availabilityStatus } 
    };
  } catch (err) {
    console.error("Error in updateAvailability:", err);
    throw err; // Re-throw the error to be handled by the main route
  }
};

// Doctor/Admin: Update specific doctor availability
router.patch("/:id/availability", auth, async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id);
    if (!doctor) return res.status(404).json({ message: "Doctor not found" });
    const result = await updateAvailability(doctor, req, res);
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: "Failed to update doctor availability" });
  }
});

// Public: Get doctor availability by ID
router.get("/:id/availability", async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id).select("name category availabilityStatus lastStatusUpdate statusNotes currentPatientId");
    if (!doctor) return res.status(404).json({ message: "Doctor not found" });
    res.json({ doctor });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch doctor availability" });
  }
});

// Test route to debug user authentication
router.get("/me/debug", auth, async (req, res) => {
  try {
    console.log("=== DEBUG USER ===");
    console.log("req.user exists:", !!req.user);
    console.log("req.user:", req.user);
    
    res.json({
      userExists: !!req.user,
      user: req.user,
      message: "Debug info retrieved successfully"
    });
  } catch (err) {
    console.error("Debug error:", err);
    res.status(500).json({ message: "Debug failed", error: err.message });
  }
});

// Doctor: Get own availability
router.get("/me/availability", auth, async (req, res) => {
  try {
    console.log("=== GET /me/availability DEBUG ===");
    console.log("User object:", {
      _id: req.user._id,
      email: req.user.email,
      role: req.user.role,
      doctorId: req.user.doctorId,
      firstName: req.user.firstName,
      lastName: req.user.lastName
    });
    
    // If user is not a doctor or doesn't have doctorId, return default data
    if (req.user.role !== "doctor" || !req.user.doctorId) {
      console.log("User not set up as doctor, returning default availability");
      return res.json({ 
        doctor: {
          availabilityStatus: "offline",
          statusNotes: "Please complete doctor profile setup",
          name: `${req.user.firstName} ${req.user.lastName}`,
          category: "Not Set",
          qualifications: "Not Set",
          experience: 0,
          expertise: "Not Set",
          fee: 0,
          contactInfo: req.user.email
        }
      });
    }
    
    console.log("User is a doctor, looking up doctor profile with ID:", req.user.doctorId);
    
    // Find doctor by user's doctorId reference
    const doctor = await Doctor.findById(req.user.doctorId);
    if (!doctor) {
      console.log("Doctor not found for doctorId:", req.user.doctorId);
      return res.json({ 
        doctor: {
          availabilityStatus: "offline",
          statusNotes: "Doctor profile not found",
          name: `${req.user.firstName} ${req.user.lastName}`,
          category: "Not Set",
          qualifications: "Not Set",
          experience: 0,
          expertise: "Not Set",
          fee: 0,
          contactInfo: req.user.email
        }
      });
    }
    
    console.log("Found doctor:", doctor.name);
    res.json({ doctor });
  } catch (err) {
    console.error("=== ERROR in /me/availability ===");
    console.error("Error details:", err);
    console.error("Error message:", err.message);
    console.error("Error stack:", err.stack);
    res.status(500).json({ message: "Failed to fetch doctor availability" });
  }
});

// Doctor: Update own availability
router.patch("/me/availability", auth, async (req, res) => {
  try {
    console.log("Updating availability for user:", req.user._id, "Role:", req.user.role, "DoctorId:", req.user.doctorId);
    console.log("Request body:", req.body);
    
    // If user is not a doctor or doesn't have doctorId, return error
    if (req.user.role !== "doctor" || !req.user.doctorId) {
      console.log("User not authorized to update availability");
      return res.status(400).json({ 
        message: "Please complete doctor profile setup before updating availability" 
      });
    }
    
    const doctor = await Doctor.findById(req.user.doctorId);
    if (!doctor) {
      console.log("Doctor not found for doctorId:", req.user.doctorId);
      return res.status(400).json({ 
        message: "Doctor profile not found. Please complete setup first." 
      });
    }
    
    console.log("Found doctor:", doctor.name, "Current status:", doctor.availabilityStatus);
    
    // Handle availability update directly here
    const { availabilityStatus, statusNotes, currentPatientId } = req.body;
    const validStatuses = ["available", "busy", "offline", "booked"];

    if (!availabilityStatus) {
      return res.status(400).json({ message: "Availability status is required" });
    }

    if (!validStatuses.includes(availabilityStatus)) {
      return res.status(400).json({ 
        message: `Invalid availability status. Must be one of: ${validStatuses.join(", ")}` 
      });
    }

    console.log("Updating doctor availability:", {
      doctorId: doctor._id,
      oldStatus: doctor.availabilityStatus,
      newStatus: availabilityStatus,
      notes: statusNotes
    });

    const oldStatus = doctor.availabilityStatus;
    doctor.availabilityStatus = availabilityStatus;
    doctor.statusNotes = statusNotes || "";
    doctor.currentPatientId = currentPatientId || null;
    doctor.lastStatusUpdate = new Date();

    await doctor.save();
    console.log("Doctor availability updated successfully");

    // Try to send admin notification but don't fail if email fails
    if (oldStatus !== "available" && availabilityStatus === "available") {
      try {
        const adminUsers = await User.find({ role: "admin" });
        const subject = "Doctor Available - Smart Health Care System";
        const html = `
          <h3>Doctor Status Update</h3>
          <p><strong>Doctor:</strong> Dr. ${doctor.name} (${doctor.category})</p>
          <p><strong>Status:</strong> Now Available</p>
          <p><strong>Previous Status:</strong> ${oldStatus}</p>
          <p><strong>Updated:</strong> ${new Date().toLocaleString()}</p>
          ${statusNotes ? `<p><strong>Notes:</strong> ${statusNotes}</p>` : ''}
          <p>Patients can now book appointments with this doctor.</p>
        `;
        
        // Send emails to admin users but don't fail if they don't work
        for (const adminUser of adminUsers) {
          if (adminUser.email) {
            sendEmail(adminUser.email, subject, html).catch(emailErr => {
              console.log("Failed to send admin notification:", emailErr.message);
            });
          }
        }
      } catch (emailErr) {
        console.log("Failed to send availability notification:", emailErr.message);
        // Don't fail the entire request if email fails
      }
    }

    res.json({
      message: "Doctor availability updated successfully",
      doctor,
      statusChange: { from: oldStatus, to: availabilityStatus }
    });
    
  } catch (err) {
    console.error("Error in /me/availability PATCH:", err);
    res.status(500).json({ message: "Failed to update doctor availability" });
  }
});

// Doctor: Get own stats
router.get("/me/stats", auth, async (req, res) => {
  try {
    console.log("Getting stats for user:", req.user._id, "Role:", req.user.role, "DoctorId:", req.user.doctorId);
    
    // If user is not a doctor or doesn't have doctorId, return default stats
    if (req.user.role !== "doctor" || !req.user.doctorId) {
      console.log("User not set up as doctor, returning default stats");
      return res.json({
        todayAppointments: 0,
        pendingAppointments: 0,
        completedToday: 0,
        totalAppointments: 0,
        totalPatients: 0,
        message: "Complete doctor profile setup to see real stats"
      });
    }
    
    const doctor = await Doctor.findById(req.user.doctorId);
    if (!doctor) {
      console.log("Doctor not found for doctorId:", req.user.doctorId);
      return res.json({
        todayAppointments: 0,
        pendingAppointments: 0,
        completedToday: 0,
        totalAppointments: 0,
        totalPatients: 0,
        message: "Doctor profile not found"
      });
    }
    
    console.log("Found doctor for stats:", doctor.name);
    const Appointment = require("../models/Appointment");
    const today = new Date().toISOString().split('T')[0];

    const [todayAppointments, pendingAppointments, completedToday, totalAppointments, totalPatients] = await Promise.all([
      Appointment.countDocuments({ doctorId: doctor._id, 'slot.date': today }),
      Appointment.countDocuments({ doctorId: doctor._id, status: 'pending' }),
      Appointment.countDocuments({ doctorId: doctor._id, status: 'completed', 'slot.date': today }),
      Appointment.countDocuments({ doctorId: doctor._id }),
      Appointment.distinct('userId', { doctorId: doctor._id }).then(users => users.length)
    ]);

    const stats = { todayAppointments, pendingAppointments, completedToday, totalAppointments, totalPatients };
    console.log("Stats calculated:", stats);
    res.json(stats);
  } catch (err) {
    console.error("Error in /me/stats:", err);
    res.status(500).json({ message: "Failed to fetch doctor stats" });
  }
});

// Doctor: Get own profile
router.get("/me/profile", auth, async (req, res) => {
  try {
    console.log("Getting profile for user:", req.user._id, "Role:", req.user.role, "DoctorId:", req.user.doctorId);
    
    // If user is not a doctor or doesn't have doctorId, return default profile
    if (req.user.role !== "doctor" || !req.user.doctorId) {
      console.log("User not set up as doctor, returning default profile");
      return res.json({ 
        doctor: {
          name: `${req.user.firstName} ${req.user.lastName}`,
          category: "Not Set",
          qualifications: "Not Set",
          experience: 0,
          expertise: "Not Set",
          fee: 0,
          contactInfo: req.user.email,
          photo: "",
          availabilityStatus: "offline",
          message: "Please complete doctor profile setup"
        }
      });
    }
    
    const doctor = await Doctor.findById(req.user.doctorId);
    if (!doctor) {
      console.log("Doctor not found for doctorId:", req.user.doctorId);
      return res.json({ 
        doctor: {
          name: `${req.user.firstName} ${req.user.lastName}`,
          category: "Not Set",
          qualifications: "Not Set",
          experience: 0,
          expertise: "Not Set",
          fee: 0,
          contactInfo: req.user.email,
          photo: "",
          availabilityStatus: "offline",
          message: "Doctor profile not found"
        }
      });
    }
    
    console.log("Found doctor profile:", doctor.name);
    res.json({ doctor });
  } catch (err) {
    console.error("Error in /me/profile:", err);
    res.status(500).json({ message: "Failed to fetch doctor profile" });
  }
});

// Doctor: Update own profile
router.put("/me/profile", auth, uploadWithErrorHandling, async (req, res) => {
  try {
    console.log("=== PROFILE UPDATE DEBUG ===");
    console.log("User:", req.user._id, "Role:", req.user.role, "DoctorId:", req.user.doctorId);
    console.log("Request body:", req.body);
    console.log("Request file:", req.file);
    
    const doctor = await Doctor.findById(req.user.doctorId);
    if (!doctor) {
      console.log("Doctor not found for user");
      return res.status(404).json({ message: "Doctor not found for this user" });
    }
    
    console.log("Found doctor:", doctor.name);
    
    const { name, category, qualifications, experience, expertise, fee, contactInfo } = req.body;
    const updateData = {};
    
    if (name) updateData.name = name;
    if (category) updateData.category = category;
    if (qualifications) updateData.qualifications = qualifications;
    if (experience) updateData.experience = experience;
    if (expertise) updateData.expertise = expertise;
    if (fee) updateData.fee = fee;
    if (contactInfo) updateData.contactInfo = contactInfo;
    
    // Handle photo upload
    if (req.file) {
      console.log("Photo file received:", req.file);
      updateData.photo = `/uploads/doctors/${req.file.filename}`;
      console.log("Photo path set to:", updateData.photo);
    } else {
      console.log("No photo file in request");
    }
    
    console.log("Update data:", updateData);
    
    const updatedDoctor = await Doctor.findByIdAndUpdate(doctor._id, updateData, { new: true });
    console.log("Doctor updated successfully:", updatedDoctor.name);
    
    res.json({ message: "Profile updated successfully", doctor: updatedDoctor });
  } catch (err) {
    console.error("=== ERROR UPDATING DOCTOR PROFILE ===");
    console.error("Error details:", err);
    console.error("Error message:", err.message);
    console.error("Error stack:", err.stack);
    
    // Check if it's a multer error
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: "File size too large. Maximum size is 2MB." });
    }
    if (err.message && err.message.includes('Only JPG/PNG images are allowed')) {
      return res.status(400).json({ message: "Only JPG/PNG images are allowed." });
    }
    
    res.status(500).json({ message: "Failed to update doctor profile", error: err.message });
  }
});

// Public: Add new slot
router.post("/:id/slots", async (req, res) => {
  try {
    const { date, startTime, endTime } = req.body;
    if (!date || !startTime || !endTime || endTime <= startTime) {
      return res.status(400).json({ message: "Invalid slot data" });
    }
    const doctor = await Doctor.findById(req.params.id);
    if (!doctor) return res.status(404).json({ message: "Doctor not found" });

    if (doctor.availableSlots.some(s => s.date === date && s.startTime === startTime && s.endTime === endTime)) {
      return res.status(400).json({ message: "Slot already exists" });
    }

    doctor.availableSlots.push({ date, startTime, endTime, isBooked: false });
    await doctor.save();
    res.json({ message: "Slot added", doctor });
  } catch (err) {
    res.status(500).json({ message: "Failed to add slot" });
  }
});

// Admin: Delete slot
router.delete("/:id/slots", auth, async (req, res) => {
  try {
    const { date, startTime, endTime } = req.body;
    const doctor = await Doctor.findById(req.params.id);
    if (!doctor) return res.status(404).json({ message: "Doctor not found" });
    doctor.availableSlots = doctor.availableSlots.filter(s => !(s.date === date && s.startTime === startTime && s.endTime === endTime && !s.isBooked));
    await doctor.save();
    res.json({ message: "Slot removed", doctor });
  } catch (err) {
    res.status(500).json({ message: "Failed to remove slot" });
  }
});

// Admin: Edit slot
router.patch("/:id/slots", auth, async (req, res) => {
  try {
    const { oldDate, oldStartTime, oldEndTime, newDate, newStartTime, newEndTime } = req.body;
    const doctor = await Doctor.findById(req.params.id);
    if (!doctor) return res.status(404).json({ message: "Doctor not found" });
    const slot = doctor.availableSlots.find(s => s.date === oldDate && s.startTime === oldStartTime && s.endTime === oldEndTime && !s.isBooked);
    if (!slot) return res.status(404).json({ message: "Slot not found or already booked" });
    Object.assign(slot, { date: newDate, startTime: newStartTime, endTime: newEndTime });
    await doctor.save();
    res.json({ message: "Slot updated", doctor });
  } catch (err) {
    res.status(500).json({ message: "Failed to update slot" });
  }
});

// Public: Get doctor by ID
router.get("/:id", async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id);
    if (!doctor) return res.status(404).json({ message: "Doctor not found" });
    res.json({ doctor });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch doctor" });
  }
});

// Dev: Create test doctor
router.post("/test", async (req, res) => {
  try {
    const testDoctor = new Doctor({
      name: "Dr. John Smith",
      category: "Diabetes Specialist",
      qualifications: "MBBS, MD",
      experience: 10,
      expertise: "Diabetes Management",
      fee: 1500,
      photo: "",
      contactInfo: "john.smith@hospital.com"
    });
    await testDoctor.save();
    res.status(201).json({ message: "Test doctor created", doctor: testDoctor });
  } catch (err) {
    res.status(500).json({ message: "Failed to create test doctor" });
  }
});

module.exports = router;