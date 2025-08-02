const express = require("express");
const mongoose = require("mongoose");
const Doctor = require("../models/Doctor");
const auth = require("../middleware/auth");
const { admin } = require("../middleware/auth");
const { sendEmail } = require("../services/emailService");
const User = require("../models/User");

const router = express.Router();

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
  const { availabilityStatus, statusNotes, currentPatientId } = req.body;
  const validStatuses = ["available", "busy", "offline"];

  if (!validStatuses.includes(availabilityStatus)) {
    return res.status(400).json({ message: "Invalid availability status" });
  }

  const oldStatus = doctor.availabilityStatus;
  doctor.availabilityStatus = availabilityStatus;
  doctor.statusNotes = statusNotes || "";
  doctor.currentPatientId = currentPatientId || null;
  doctor.lastStatusUpdate = new Date();

  await doctor.save();

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
      for (const adminUser of adminUsers) {
        if (adminUser.email) sendEmail(adminUser.email, subject, html);
      }
    } catch (emailErr) {
      console.error("Failed to send availability notification:", emailErr);
    }
  }

  res.json({ message: "Doctor availability updated", doctor, statusChange: { from: oldStatus, to: availabilityStatus } });
};

// Doctor/Admin: Update specific doctor availability
router.patch("/:id/availability", auth, async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id);
    if (!doctor) return res.status(404).json({ message: "Doctor not found" });
    updateAvailability(doctor, req, res);
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

// Doctor: Get own availability
router.get("/me/availability", auth, async (req, res) => {
  try {
    const doctor = await Doctor.findOne({ contactInfo: req.user.email });
    if (!doctor) return res.status(404).json({ message: "Doctor not found" });
    res.json({ doctor });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch doctor availability" });
  }
});

// Doctor: Update own availability
router.patch("/me/availability", auth, async (req, res) => {
  try {
    const doctor = await Doctor.findOne({ contactInfo: req.user.email });
    if (!doctor) return res.status(404).json({ message: "Doctor not found" });
    updateAvailability(doctor, req, res);
  } catch (err) {
    res.status(500).json({ message: "Failed to update doctor availability" });
  }
});

// Doctor: Get own stats
router.get("/me/stats", auth, async (req, res) => {
  try {
    const doctor = await Doctor.findOne({ contactInfo: req.user.email });
    if (!doctor) return res.status(404).json({ message: "Doctor not found" });
    const Appointment = require("../models/Appointment");
    const today = new Date().toISOString().split('T')[0];

    const [todayAppointments, pendingAppointments, completedToday, totalAppointments, totalPatients] = await Promise.all([
      Appointment.countDocuments({ doctorId: doctor._id, 'slot.date': today }),
      Appointment.countDocuments({ doctorId: doctor._id, status: 'pending' }),
      Appointment.countDocuments({ doctorId: doctor._id, status: 'completed', 'slot.date': today }),
      Appointment.countDocuments({ doctorId: doctor._id }),
      Appointment.distinct('userId', { doctorId: doctor._id }).then(users => users.length)
    ]);

    res.json({ todayAppointments, pendingAppointments, completedToday, totalAppointments, totalPatients });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch doctor stats" });
  }
});

// Doctor: Get own profile
router.get("/me/profile", auth, async (req, res) => {
  try {
    const doctor = await Doctor.findOne({ contactInfo: req.user.email });
    if (!doctor) return res.status(404).json({ message: "Doctor not found" });
    res.json({ doctor });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch doctor profile" });
  }
});

// Doctor: Update own profile
router.put("/me/profile", auth, async (req, res) => {
  try {
    const doctor = await Doctor.findOne({ contactInfo: req.user.email });
    if (!doctor) return res.status(404).json({ message: "Doctor not found" });
    
    const { name, category, qualifications, experience, expertise, fee, contactInfo } = req.body;
    const updateData = {};
    
    if (name) updateData.name = name;
    if (category) updateData.category = category;
    if (qualifications) updateData.qualifications = qualifications;
    if (experience) updateData.experience = experience;
    if (expertise) updateData.expertise = expertise;
    if (fee) updateData.fee = fee;
    if (contactInfo) updateData.contactInfo = contactInfo;
    
    const updatedDoctor = await Doctor.findByIdAndUpdate(doctor._id, updateData, { new: true });
    res.json({ message: "Profile updated successfully", doctor: updatedDoctor });
  } catch (err) {
    res.status(500).json({ message: "Failed to update doctor profile" });
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