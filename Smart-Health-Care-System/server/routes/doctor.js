const express = require("express");
const Doctor = require("../models/Doctor");
const auth = require("../middleware/auth");
const { admin } = require("../middleware/auth");

const router = express.Router();

// List all doctors (public, with search)
router.get("/", async (req, res) => {
  try {
    const { search } = req.query;
    let query = {};
    if (search) {
      const regex = new RegExp(search, "i");
      query = {
        $or: [
          { name: regex },
          { category: regex },
          { expertise: regex }
        ]
      };
    }
    const doctors = await Doctor.find(query);
    res.json({ doctors });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch doctors" });
  }
});

// Add a doctor (admin only)
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

// Edit a doctor (admin only)
router.put("/:id", auth, admin, async (req, res) => {
  try {
    const update = req.body;
    const doctor = await Doctor.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!doctor) return res.status(404).json({ message: "Doctor not found" });
    res.json({ message: "Doctor updated", doctor });
  } catch (err) {
    res.status(500).json({ message: "Failed to update doctor" });
  }
});

// Remove a doctor (admin only)
router.delete("/:id", auth, admin, async (req, res) => {
  try {
    const doctor = await Doctor.findByIdAndDelete(req.params.id);
    if (!doctor) return res.status(404).json({ message: "Doctor not found" });
    res.json({ message: "Doctor removed" });
  } catch (err) {
    res.status(500).json({ message: "Failed to remove doctor" });
  }
});

// Add a slot to a doctor (admin only)
router.post("/:id/slots", auth, async (req, res) => {
  try {
    const { date, startTime, endTime } = req.body;
    if (!date || !startTime || !endTime) return res.status(400).json({ message: "Date, start time, and end time required" });

    // Validate time range (no cross-midnight slots)
    if (endTime <= startTime) {
      return res.status(400).json({ message: "End time must be after start time (no cross-midnight slots supported)" });
    }

    const doctor = await Doctor.findById(req.params.id);
    if (!doctor) return res.status(404).json({ message: "Doctor not found" });
    // Prevent duplicate slot
    if (doctor.availableSlots.some(s => s.date === date && s.startTime === startTime && s.endTime === endTime)) {
      return res.status(400).json({ message: "Slot already exists" });
    }
    doctor.availableSlots.push({ date, startTime, endTime, isBooked: false });
    await doctor.save();
    res.json({ message: "Slot added", doctor });
  } catch (err) {
    console.error("Error adding slot:", err);
    res.status(500).json({ message: "Failed to add slot" });
  }
});

// Remove a slot from a doctor (admin only)
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

// Edit a slot for a doctor (admin only)
router.patch("/:id/slots", auth, async (req, res) => {
  try {
    const { oldDate, oldStartTime, oldEndTime, newDate, newStartTime, newEndTime } = req.body;
    const doctor = await Doctor.findById(req.params.id);
    if (!doctor) return res.status(404).json({ message: "Doctor not found" });
    const slot = doctor.availableSlots.find(s => s.date === oldDate && s.startTime === oldStartTime && s.endTime === oldEndTime && !s.isBooked);
    if (!slot) return res.status(404).json({ message: "Slot not found or already booked" });
    slot.date = newDate;
    slot.startTime = newStartTime;
    slot.endTime = newEndTime;
    await doctor.save();
    res.json({ message: "Slot updated", doctor });
  } catch (err) {
    res.status(500).json({ message: "Failed to update slot" });
  }
});

// Get a single doctor by ID (public)
router.get("/:id", async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id);
    if (!doctor) return res.status(404).json({ message: "Doctor not found" });
    res.json({ doctor });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch doctor" });
  }
});

module.exports = router; 