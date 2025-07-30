const express = require("express");
const Appointment = require("../models/Appointment");
const Doctor = require("../models/Doctor");
const auth = require("../middleware/auth");
const User = require("../models/User");
const { sendEmail } = require("../services/emailService");

const router = express.Router();

// Book an appointment
router.post("/", auth, async (req, res) => {
  try {
    const { doctorId, slot, reason } = req.body;
    if (!doctorId || !slot || !slot.date || !slot.startTime || !slot.endTime) {
      return res.status(400).json({ message: "Doctor, date, start time, and end time are required" });
    }
    // Check if slot is available
    const doctor = await Doctor.findById(doctorId);
    if (!doctor) return res.status(404).json({ message: "Doctor not found" });
    const slotObj = doctor.availableSlots.find(s => s.date === slot.date && s.startTime === slot.startTime && s.endTime === slot.endTime && !s.isBooked);
    if (!slotObj) return res.status(400).json({ message: "Slot not available" });
    // Mark slot as booked
    slotObj.isBooked = true;
    await doctor.save();
    // Create appointment
    const appointment = new Appointment({
      userId: req.user._id,
      doctorId,
      slot,
      reason
    });
    await appointment.save();
    // Send email notifications
    const user = await User.findById(req.user._id);
    const doctorUser = await User.findOne({ email: doctor.contactInfo }); // assuming doctor contactInfo is email
    const subject = "Appointment Booked - Smart Health Care System";
    const html = `<p>Your appointment with Dr. ${doctor.name} (${doctor.category}) is booked for ${slot.date} from ${slot.startTime} to ${slot.endTime}.<br/>Reason: ${reason || "-"}</p>`;
    if (user?.email) sendEmail(user.email, subject, html);
    if (doctorUser?.email) sendEmail(doctorUser.email, subject, `<p>You have a new appointment with ${user.firstName} ${user.lastName} on ${slot.date} from ${slot.startTime} to ${slot.endTime}.<br/>Reason: ${reason || "-"}</p>`);
    res.status(201).json({ message: "Appointment booked", appointment });
  } catch (err) {
    res.status(500).json({ message: "Failed to book appointment" });
  }
});

// List user's appointments
router.get("/", auth, async (req, res) => {
  try {
    const appointments = await Appointment.find({ userId: req.user._id }).populate("doctorId");
    res.json({ appointments });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch appointments" });
  }
});

// List doctor's appointments (for doctor/admin use)
router.get("/doctor/:doctorId", auth, async (req, res) => {
  try {
    const appointments = await Appointment.find({ doctorId: req.params.doctorId }).populate("userId");
    res.json({ appointments });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch appointments" });
  }
});

// Cancel an appointment (user)
router.patch("/:id/cancel", auth, async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) return res.status(404).json({ message: "Appointment not found" });
    if (!appointment.userId.equals(req.user._id)) return res.status(403).json({ message: "Not authorized" });
    if (appointment.status !== "pending") return res.status(400).json({ message: "Only pending appointments can be cancelled" });
    appointment.status = "cancelled";
    await appointment.save();
    // Free up the slot in the doctor's availableSlots
    const doctor = await Doctor.findById(appointment.doctorId);
    if (doctor) {
      const slotObj = doctor.availableSlots.find(s => s.date === appointment.slot.date && s.startTime === appointment.slot.startTime && s.endTime === appointment.slot.endTime);
      if (slotObj) slotObj.isBooked = false;
      await doctor.save();
    }
    // Send email notifications
    const user = await User.findById(appointment.userId);
    const doctorUser = await User.findOne({ email: doctor.contactInfo });
    const subject = "Appointment Cancelled - Smart Health Care System";
    const html = `<p>Your appointment with Dr. ${doctor.name} (${doctor.category}) on ${appointment.slot.date} from ${appointment.slot.startTime} to ${appointment.slot.endTime} has been cancelled.</p>`;
    if (user?.email) sendEmail(user.email, subject, html);
    if (doctorUser?.email) sendEmail(doctorUser.email, subject, `<p>The appointment with ${user.firstName} ${user.lastName} on ${appointment.slot.date} from ${appointment.slot.startTime} to ${appointment.slot.endTime} has been cancelled.</p>`);
    res.json({ message: "Appointment cancelled" });
  } catch (err) {
    res.status(500).json({ message: "Failed to cancel appointment" });
  }
});

// Accept (confirm) an appointment (admin/doctor)
router.patch("/:id/accept", auth, async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) return res.status(404).json({ message: "Appointment not found" });
    if (appointment.status !== "pending") return res.status(400).json({ message: "Only pending appointments can be accepted" });
    appointment.status = "confirmed";
    await appointment.save();
    res.json({ message: "Appointment accepted", appointment });
  } catch (err) {
    res.status(500).json({ message: "Failed to accept appointment" });
  }
});

// Reject (cancel) an appointment (admin/doctor)
router.patch("/:id/reject", auth, async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) return res.status(404).json({ message: "Appointment not found" });
    if (appointment.status !== "pending") return res.status(400).json({ message: "Only pending appointments can be rejected" });
    appointment.status = "cancelled";
    await appointment.save();
    // Free up the slot in the doctor's availableSlots
    const doctor = await Doctor.findById(appointment.doctorId);
    if (doctor) {
      const slotObj = doctor.availableSlots.find(s => s.date === appointment.slot.date && s.startTime === appointment.slot.startTime && s.endTime === appointment.slot.endTime);
      if (slotObj) slotObj.isBooked = false;
      await doctor.save();
    }
    res.json({ message: "Appointment rejected", appointment });
  } catch (err) {
    res.status(500).json({ message: "Failed to reject appointment" });
  }
});

// Complete an appointment (admin/doctor)
router.patch('/:id/complete', auth, async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) return res.status(404).json({ message: 'Appointment not found' });
    if (appointment.status !== 'confirmed') return res.status(400).json({ message: 'Only confirmed appointments can be completed' });
    appointment.status = 'completed';
    await appointment.save();
    // Optionally, send notifications to user and doctor
    res.json({ message: 'Appointment marked as completed', appointment });
  } catch (err) {
    res.status(500).json({ message: 'Failed to complete appointment' });
  }
});

// Reschedule an appointment (user)
router.patch('/:id/reschedule', auth, async (req, res) => {
  try {
    const { slot, reason } = req.body;
    if (!slot || !slot.date || !slot.startTime || !slot.endTime) {
      return res.status(400).json({ message: 'Date, start time, and end time are required' });
    }
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) return res.status(404).json({ message: 'Appointment not found' });
    if (!appointment.userId.equals(req.user._id)) return res.status(403).json({ message: 'Not authorized' });
    if (appointment.status !== 'pending') return res.status(400).json({ message: 'Only pending appointments can be rescheduled' });
    // Free up the old slot
    const doctor = await Doctor.findById(appointment.doctorId);
    if (!doctor) return res.status(404).json({ message: 'Doctor not found' });
    const oldSlotObj = doctor.availableSlots.find(s => s.date === appointment.slot.date && s.startTime === appointment.slot.startTime && s.endTime === appointment.slot.endTime);
    if (oldSlotObj) oldSlotObj.isBooked = false;
    // Check if new slot is available
    const newSlotObj = doctor.availableSlots.find(s => s.date === slot.date && s.startTime === slot.startTime && s.endTime === slot.endTime && !s.isBooked);
    if (!newSlotObj) return res.status(400).json({ message: 'New slot not available' });
    newSlotObj.isBooked = true;
    // Update appointment
    appointment.slot = slot;
    if (reason) appointment.reason = reason;
    await doctor.save();
    await appointment.save();
    // Optionally, send notifications
    res.json({ message: 'Appointment rescheduled', appointment });
  } catch (err) {
    res.status(500).json({ message: 'Failed to reschedule appointment' });
  }
});

// Admin: Get appointment stats for analytics
router.get("/admin/stats", auth, async (req, res) => {
  try {
    // Total appointments
    const total = await Appointment.countDocuments();
    // Appointments by status
    const byStatusAgg = await Appointment.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } }
    ]);
    const byStatus = {};
    byStatusAgg.forEach(s => { byStatus[s._id] = s.count; });
    // Appointments per doctor
    const byDoctorAgg = await Appointment.aggregate([
      { $group: { _id: "$doctorId", count: { $sum: 1 } } }
    ]);
    // Get doctor names
    const doctorIds = byDoctorAgg.map(d => d._id);
    const doctors = await Doctor.find({ _id: { $in: doctorIds } });
    const byDoctor = byDoctorAgg.map(d => ({
      doctorId: d._id,
      doctorName: (doctors.find(doc => doc._id.equals(d._id)) || {}).name || "Unknown",
      count: d.count
    }));
    // Appointments per day (last 30 days)
    const byDayAgg = await Appointment.aggregate([
      { $match: { createdAt: { $gte: new Date(Date.now() - 30*24*60*60*1000) } } },
      { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);
    res.json({
      total,
      byStatus,
      byDoctor,
      byDay: byDayAgg
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch appointment stats" });
  }
});

// List all appointments (admin only)
router.get("/admin/all", auth, async (req, res) => {
  try {
    // Optionally, check if req.user.role === 'admin'
    const appointments = await Appointment.find()
      .populate("userId")
      .populate("doctorId");
    res.json({ appointments });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch all appointments" });
  }
});

module.exports = router;