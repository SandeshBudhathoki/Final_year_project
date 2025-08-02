const express = require("express");
const Appointment = require("../models/Appointment");
const Doctor = require("../models/Doctor");
const auth = require("../middleware/auth");
const User = require("../models/User");
const { sendEmail } = require("../services/emailService");

const router = express.Router();

// Enhanced status validation
const VALID_STATUS_TRANSITIONS = {
  pending: ['confirmed', 'cancelled', 'rejected', 'rescheduled'],
  confirmed: ['in_progress', 'cancelled', 'no_show'],
  in_progress: ['completed', 'cancelled'],
  completed: [], // Terminal state
  cancelled: [], // Terminal state
  rejected: [], // Terminal state
  no_show: ['rescheduled'],
  rescheduled: ['confirmed', 'cancelled']
};

// Validate status transition
const validateStatusTransition = (currentStatus, newStatus) => {
  return VALID_STATUS_TRANSITIONS[currentStatus]?.includes(newStatus) || false;
};

// Book an appointment with enhanced validation
router.post("/", auth, async (req, res) => {
  try {
    const { doctorId, slot, reason, urgency } = req.body;
    
    console.log("Booking appointment:", { doctorId, slot, reason, urgency });
    
    // Enhanced validation
    if (!doctorId || !slot || !slot.date || !slot.startTime || !slot.endTime) {
      console.log("Validation failed:", { doctorId, slot });
      return res.status(400).json({ 
        message: "Doctor, date, start time, and end time are required" 
      });
    }

    // Validate doctorId format
    if (typeof doctorId !== 'string' || doctorId.length !== 24) {
      console.log("Invalid doctorId format:", doctorId);
      return res.status(400).json({ 
        message: "Invalid doctor ID format" 
      });
    }

    // Check if date is in the future
    console.log("Checking date:", slot.date);
    const appointmentDate = new Date(slot.date + 'T00:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    console.log("Appointment date:", appointmentDate);
    console.log("Today:", today);
    
    if (appointmentDate < today) {
      console.log("Date validation failed - appointment in past");
      return res.status(400).json({ 
        message: "Cannot book appointments in the past" 
      });
    }

    // Check if doctor exists and is available
    const doctor = await Doctor.findById(doctorId);
    if (!doctor) return res.status(404).json({ message: "Doctor not found" });
    
    // Check doctor availability status
    if (doctor.availabilityStatus !== "available") {
      return res.status(400).json({ 
        message: `Doctor is currently ${doctor.availabilityStatus}. Please try again later.` 
      });
    }

    // Check if doctor has confirmed appointments and update status accordingly
    const confirmedAppointments = await Appointment.countDocuments({
      doctorId: doctorId,
      status: 'confirmed'
    });

    if (confirmedAppointments > 0) {
      // Update doctor status to "booked" if they have confirmed appointments
      if (doctor.availabilityStatus !== "booked") {
        doctor.availabilityStatus = "booked";
        await doctor.save();
      }
      return res.status(400).json({ 
        message: "Doctor has confirmed appointments and is not available for new bookings." 
      });
    }

    // Check for conflicting appointments (same user, same time)
    const conflictingAppointment = await Appointment.findOne({
      userId: req.user._id,
      'slot.date': slot.date,
      'slot.startTime': slot.startTime,
      status: { $in: ['pending', 'confirmed', 'in_progress'] }
    });

    console.log("Conflicting appointment check:", conflictingAppointment);

    if (conflictingAppointment) {
      console.log("Conflict detected");
      return res.status(400).json({ 
        message: "You already have an appointment at this time" 
      });
    }



    // Create appointment with enhanced data
    const appointment = new Appointment({
      userId: req.user._id,
      doctorId,
      slot,
      reason: reason || "General consultation",
      urgency: urgency || "normal", // normal, urgent, emergency
      status: "pending",
      createdAt: new Date()
    });

    await appointment.save();

    // Enhanced email notifications
    const user = await User.findById(req.user._id);
    const doctorUser = await User.findOne({ email: doctor.contactInfo });
    
    const subject = "Appointment Booked - Smart Health Care System";
    const userHtml = `
      <h3>Appointment Confirmation</h3>
      <p><strong>Doctor:</strong> Dr. ${doctor.name} (${doctor.category})</p>
      <p><strong>Date:</strong> ${slot.date}</p>
      <p><strong>Time:</strong> ${slot.startTime} - ${slot.endTime}</p>
      <p><strong>Reason:</strong> ${reason || "General consultation"}</p>
      <p><strong>Status:</strong> Pending confirmation</p>
      <p>You will receive another email once the appointment is confirmed by the doctor.</p>
    `;
    
    const doctorHtml = `
      <h3>New Appointment Request</h3>
      <p><strong>Patient:</strong> ${user.firstName} ${user.lastName}</p>
      <p><strong>Email:</strong> ${user.email}</p>
      <p><strong>Date:</strong> ${slot.date}</p>
      <p><strong>Time:</strong> ${slot.startTime} - ${slot.endTime}</p>
      <p><strong>Reason:</strong> ${reason || "General consultation"}</p>
      <p>Please review and confirm this appointment.</p>
    `;

    if (user?.email) sendEmail(user.email, subject, userHtml);
    if (doctorUser?.email) sendEmail(doctorUser.email, subject, doctorHtml);

    res.status(201).json({ 
      message: "Appointment booked successfully", 
      appointment,
      nextSteps: "Your appointment is pending confirmation. You'll be notified once confirmed."
    });
  } catch (err) {
    console.error("Appointment booking error:", err);
    res.status(500).json({ message: "Failed to book appointment" });
  }
});

// Enhanced appointment listing with filters
router.get("/", auth, async (req, res) => {
  try {
    const { status, date, doctorId, filter } = req.query;
    let query = { userId: req.user._id };
    
    console.log("Appointment fetch request:", { status, date, doctorId, filter, userId: req.user._id });
    
    // Apply filters
    if (status) query.status = status;
    if (date) query['slot.date'] = date;
    if (doctorId) query.doctorId = doctorId;

    // Add filter for past/upcoming appointments
    if (filter === 'past') {
      const today = new Date().toISOString().split('T')[0];
      query['slot.date'] = { $lt: today };
    } else if (filter === 'upcoming') {
      const today = new Date().toISOString().split('T')[0];
      query['slot.date'] = { $gte: today };
    }

    console.log("Final query:", JSON.stringify(query, null, 2));

    const appointments = await Appointment.find(query)
      .populate("doctorId")
      .sort({ 'slot.date': 1, 'slot.startTime': 1 });

    console.log(`Found ${appointments.length} appointments for user ${req.user._id}`);

    // Add additional metadata for debugging
    const appointmentStats = {
      total: appointments.length,
      byStatus: {},
      byDate: {}
    };

    appointments.forEach(apt => {
      // Count by status
      appointmentStats.byStatus[apt.status] = (appointmentStats.byStatus[apt.status] || 0) + 1;
      
      // Count by date
      const date = apt.slot?.date;
      if (date) {
        appointmentStats.byDate[date] = (appointmentStats.byDate[date] || 0) + 1;
      }
    });

    console.log("Appointment stats:", appointmentStats);

    res.json({ 
      appointments,
      stats: appointmentStats,
      query: query,
      user: req.user._id
    });
  } catch (err) {
    console.error("Error fetching appointments:", err);
    res.status(500).json({ message: "Failed to fetch appointments" });
  }
});

// Enhanced admin appointment management
router.patch("/:id/status", auth, async (req, res) => {
  try {
    const { status, notes } = req.body;
    const appointment = await Appointment.findById(req.params.id);
    
    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    // Validate status transition
    if (!validateStatusTransition(appointment.status, status)) {
      return res.status(400).json({ 
        message: `Invalid status transition from ${appointment.status} to ${status}` 
      });
    }

    const oldStatus = appointment.status;
    appointment.status = status;
    if (notes) appointment.adminNotes = notes;
    appointment.updatedAt = new Date();

    // Handle slot management and doctor availability based on status
    const doctor = await Doctor.findById(appointment.doctorId);
    if (doctor) {
      const slotObj = doctor.availableSlots.find(s => 
        s.date === appointment.slot.date && 
        s.startTime === appointment.slot.startTime && 
        s.endTime === appointment.slot.endTime
      );

      if (slotObj) {
        // Free slot for certain statuses
        if (['cancelled', 'rejected', 'no_show'].includes(status)) {
          slotObj.isBooked = false;
        }
        // Mark as booked for confirmed appointments
        else if (status === 'confirmed') {
          slotObj.isBooked = true;
        }
        await doctor.save();
      }

      // Update doctor availability status based on appointment status
      let shouldUpdateAvailability = false;
      let newAvailabilityStatus = doctor.availabilityStatus;

      if (status === 'confirmed') {
        // Check if doctor has any other confirmed appointments
        const confirmedAppointments = await Appointment.countDocuments({
          doctorId: doctor._id,
          status: 'confirmed',
          _id: { $ne: appointment._id } // Exclude current appointment
        });
        
        if (confirmedAppointments === 0) {
          // This is the only confirmed appointment, set doctor to busy
          newAvailabilityStatus = 'busy';
          shouldUpdateAvailability = true;
        } else {
          // Doctor has multiple confirmed appointments, set to booked
          newAvailabilityStatus = 'booked';
          shouldUpdateAvailability = true;
        }
      } else if (['cancelled', 'rejected', 'no_show', 'completed'].includes(status)) {
        // Check if doctor has any other confirmed appointments
        const confirmedAppointments = await Appointment.countDocuments({
          doctorId: doctor._id,
          status: 'confirmed'
        });
        
        if (confirmedAppointments === 0) {
          // No more confirmed appointments, set doctor to available
          newAvailabilityStatus = 'available';
          shouldUpdateAvailability = true;
        } else if (confirmedAppointments === 1) {
          // Only one confirmed appointment left, set to busy
          newAvailabilityStatus = 'busy';
          shouldUpdateAvailability = true;
        } else {
          // Multiple confirmed appointments still exist, keep as booked
          newAvailabilityStatus = 'booked';
          shouldUpdateAvailability = true;
        }
      }

      // Update doctor availability if needed
      if (shouldUpdateAvailability && newAvailabilityStatus !== doctor.availabilityStatus) {
        doctor.availabilityStatus = newAvailabilityStatus;
        doctor.lastStatusUpdate = new Date();
        await doctor.save();
        
        console.log(`Doctor ${doctor.name} availability updated to: ${newAvailabilityStatus}`);
      }
    }

    await appointment.save();

    // Enhanced email notifications
    const user = await User.findById(appointment.userId);
    if (user?.email) {
      const statusMessages = {
        confirmed: "Your appointment has been confirmed by the doctor.",
        cancelled: "Your appointment has been cancelled.",
        rejected: "Your appointment request has been rejected.",
        completed: "Your appointment has been marked as completed.",
        no_show: "You were marked as no-show for your appointment."
      };

      const subject = `Appointment ${status.charAt(0).toUpperCase() + status.slice(1)} - Smart Health Care System`;
      const html = `
        <h3>Appointment Update</h3>
        <p><strong>Status:</strong> ${status.charAt(0).toUpperCase() + status.slice(1)}</p>
        <p><strong>Doctor:</strong> Dr. ${doctor.name}</p>
        <p><strong>Date:</strong> ${appointment.slot.date}</p>
        <p><strong>Time:</strong> ${appointment.slot.startTime} - ${appointment.slot.endTime}</p>
        <p>${statusMessages[status] || "Your appointment status has been updated."}</p>
        ${notes ? `<p><strong>Notes:</strong> ${notes}</p>` : ''}
      `;

      sendEmail(user.email, subject, html);
    }

    res.json({ 
      message: `Appointment ${status} successfully`, 
      appointment,
      statusTransition: { from: oldStatus, to: status },
      doctorAvailabilityUpdated: shouldUpdateAvailability
    });
  } catch (err) {
    console.error("Status update error:", err);
    res.status(500).json({ message: "Failed to update appointment status" });
  }
});

// Legacy endpoints for backward compatibility
router.patch("/:id/accept", auth, async (req, res) => {
  req.body.status = 'confirmed';
  return router.patch("/:id/status", auth, req, res);
});

router.patch("/:id/reject", auth, async (req, res) => {
  req.body.status = 'rejected';
  return router.patch("/:id/status", auth, req, res);
});

router.patch("/:id/complete", auth, async (req, res) => {
  req.body.status = 'completed';
  return router.patch("/:id/status", auth, req, res);
});

router.patch("/:id/cancel", auth, async (req, res) => {
  req.body.status = 'cancelled';
  return router.patch("/:id/status", auth, req, res);
});

// Enhanced appointment analytics
router.get("/admin/stats", auth, async (req, res) => {
  try {
    console.log("Fetching appointment stats...");
    const { startDate, endDate } = req.query;
    let dateFilter = {};
    
    if (startDate && endDate) {
      dateFilter = {
        createdAt: {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        }
      };
    }
    
    console.log("Date filter:", dateFilter);

    // Comprehensive analytics
    const stats = await Appointment.aggregate([
      { $match: dateFilter },
      {
        $facet: {
          total: [{ $count: "count" }],
          byStatus: [
            { $group: { _id: "$status", count: { $sum: 1 } } },
            { $sort: { count: -1 } }
          ],
          byDoctor: [
            { $group: { _id: "$doctorId", count: { $sum: 1 } } },
            { $sort: { count: -1 } }
          ],
          byDay: [
            {
              $group: {
                _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                count: { $sum: 1 }
              }
            },
            { $sort: { _id: 1 } }
          ],
          byUrgency: [
            { $group: { _id: "$urgency", count: { $sum: 1 } } }
          ]
        }
      }
    ]);
    
    console.log("Aggregation result:", JSON.stringify(stats, null, 2));

    // Get doctor names for byDoctor stats
    const byDoctor = stats[0]?.byDoctor || [];
    const doctorIds = byDoctor.map(d => d._id);
    const doctors = await Doctor.find({ _id: { $in: doctorIds } });
    
    // Convert byStatus array to object for easier frontend consumption
    const byStatusArray = stats[0]?.byStatus || [];
    const byStatusObject = {};
    byStatusArray.forEach(item => {
      if (item._id && typeof item.count === 'number') {
        byStatusObject[item._id] = item.count;
      }
    });

    const enhancedStats = {
      total: stats[0]?.total[0]?.count || 0,
      byStatus: byStatusObject,
      byDoctor: byDoctor.map(d => ({
        ...d,
        doctorName: doctors.find(doc => doc._id.toString() === d._id.toString())?.name || "Unknown"
      })),
      byDay: stats[0]?.byDay || [],
      byUrgency: stats[0]?.byUrgency || []
    };
    
    console.log("Enhanced stats:", JSON.stringify(enhancedStats, null, 2));

    res.json(enhancedStats);
  } catch (err) {
    console.error("Stats error:", err);
    res.status(500).json({ message: "Failed to fetch appointment stats" });
  }
});

// Enhanced appointment listing for admin
router.get("/admin/all", auth, async (req, res) => {
  try {
    const { status, date, doctorId, userId, page = 1, limit = 20 } = req.query;
    let query = {};
    
    // Apply filters
    if (status) query.status = status;
    if (date) query['slot.date'] = date;
    if (doctorId) query.doctorId = doctorId;
    if (userId) query.userId = userId;

    const skip = (page - 1) * limit;
    
    const appointments = await Appointment.find(query)
      .populate("userId", "firstName lastName email")
      .populate("doctorId", "name category")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Appointment.countDocuments(query);

    res.json({ 
      appointments, 
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch all appointments" });
  }
});

// Get appointments for a specific doctor
router.get("/doctor/my", auth, async (req, res) => {
  try {
    const { status, date, page = 1, limit = 20 } = req.query;
    
    // Find doctor by user's email
    const Doctor = require("../models/Doctor");
    const doctor = await Doctor.findOne({ contactInfo: req.user.email });
    
    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found for this user" });
    }
    
    let query = { doctorId: doctor._id };
    
    // Apply filters
    if (status) query.status = status;
    if (date) query['slot.date'] = date;

    const skip = (page - 1) * limit;
    
    const appointments = await Appointment.find(query)
      .populate("userId", "firstName lastName email")
      .sort({ 'slot.date': 1, 'slot.startTime': 1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Appointment.countDocuments(query);

    res.json({ 
      appointments, 
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch doctor appointments" });
  }
});

// Get appointment history for a specific doctor
router.get("/doctor/history", auth, async (req, res) => {
  try {
    const { status, date, page = 1, limit = 20 } = req.query;
    
    // Find doctor by user's email
    const Doctor = require("../models/Doctor");
    const doctor = await Doctor.findOne({ contactInfo: req.user.email });
    
    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found for this user" });
    }
    
    let query = { 
      doctorId: doctor._id,
      status: { $in: ['completed', 'cancelled', 'no_show'] }
    };
    
    // Apply filters
    if (status) query.status = status;
    if (date) query['slot.date'] = date;

    const skip = (page - 1) * limit;
    
    const appointments = await Appointment.find(query)
      .populate("userId", "firstName lastName email")
      .sort({ 'slot.date': -1, 'slot.startTime': -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Appointment.countDocuments(query);

    res.json({ 
      appointments, 
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch doctor appointment history" });
  }
});

// Start appointment (doctor marks appointment as in progress)
router.patch("/:id/start", auth, async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    
    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    // Find doctor by user's email
    const Doctor = require("../models/Doctor");
    const doctor = await Doctor.findOne({ contactInfo: req.user.email });
    
    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found for this user" });
    }

    // Check if doctor owns this appointment
    if (appointment.doctorId.toString() !== doctor._id.toString()) {
      return res.status(403).json({ message: "Not authorized to manage this appointment" });
    }

    if (appointment.status !== 'confirmed') {
      return res.status(400).json({ message: "Only confirmed appointments can be started" });
    }

    appointment.status = 'in_progress';
    appointment.updatedAt = new Date();
    await appointment.save();

    // Update doctor availability to busy
    if (doctor) {
      doctor.availabilityStatus = 'busy';
      doctor.currentPatientId = appointment.userId;
      doctor.lastStatusUpdate = new Date();
      await doctor.save();
    }

    res.json({ 
      message: "Appointment started successfully", 
      appointment 
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to start appointment" });
  }
});

// Complete appointment (doctor marks appointment as completed)
router.patch("/:id/complete", auth, async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    
    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    // Find doctor by user's email
    const Doctor = require("../models/Doctor");
    const doctor = await Doctor.findOne({ contactInfo: req.user.email });
    
    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found for this user" });
    }

    // Check if doctor owns this appointment
    if (appointment.doctorId.toString() !== doctor._id.toString()) {
      return res.status(403).json({ message: "Not authorized to manage this appointment" });
    }

    if (appointment.status !== 'in_progress') {
      return res.status(400).json({ message: "Only in-progress appointments can be completed" });
    }

    appointment.status = 'completed';
    appointment.updatedAt = new Date();
    await appointment.save();

    // Update doctor availability to available
    if (doctor) {
      doctor.availabilityStatus = 'available';
      doctor.currentPatientId = null;
      doctor.lastStatusUpdate = new Date();
      await doctor.save();
    }

    res.json({ 
      message: "Appointment completed successfully", 
      appointment 
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to complete appointment" });
  }
});

// Enhanced appointment deletion
router.delete("/:id", auth, async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    // Only allow deletion of certain statuses
    const deletableStatuses = ['cancelled', 'rejected', 'no_show', 'completed'];
    if (!deletableStatuses.includes(appointment.status)) {
      return res.status(400).json({ 
        message: `Cannot delete appointment with status: ${appointment.status}` 
      });
    }

    // Free up slot if needed
    if (['confirmed', 'pending'].includes(appointment.status)) {
      const doctor = await Doctor.findById(appointment.doctorId);
      if (doctor) {
        const slotObj = doctor.availableSlots.find(s => 
          s.date === appointment.slot.date && 
          s.startTime === appointment.slot.startTime && 
          s.endTime === appointment.slot.endTime
        );
        if (slotObj) {
          slotObj.isBooked = false;
          await doctor.save();
        }
      }
    }

    await Appointment.findByIdAndDelete(req.params.id);
    res.json({ message: "Appointment deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete appointment" });
  }
});

// Get appointment statistics for user
router.get("/stats", auth, async (req, res) => {
  try {
    const userId = req.user._id;
    const today = new Date().toISOString().split('T')[0];
    
    // Get all appointments for the user
    const allAppointments = await Appointment.find({ userId }).populate("doctorId");
    
    const stats = {
      total: allAppointments.length,
      upcoming: 0,
      past: 0,
      byStatus: {},
      byDoctor: {},
      recent: []
    };

    allAppointments.forEach(apt => {
      // Count by status
      stats.byStatus[apt.status] = (stats.byStatus[apt.status] || 0) + 1;
      
      // Count by doctor
      const doctorName = apt.doctorId?.name || 'Unknown';
      stats.byDoctor[doctorName] = (stats.byDoctor[doctorName] || 0) + 1;
      
      // Check if past or upcoming
      const appointmentDate = apt.slot?.date;
      if (appointmentDate) {
        if (appointmentDate < today) {
          stats.past++;
        } else {
          stats.upcoming++;
        }
      }
      
      // Get recent appointments (last 5)
      if (stats.recent.length < 5) {
        stats.recent.push({
          id: apt._id,
          doctor: apt.doctorId?.name,
          date: apt.slot?.date,
          status: apt.status
        });
      }
    });

    console.log(`Appointment stats for user ${userId}:`, stats);
    res.json({ stats });
  } catch (err) {
    console.error("Error fetching appointment stats:", err);
    res.status(500).json({ message: "Failed to fetch appointment statistics" });
  }
});

module.exports = router;