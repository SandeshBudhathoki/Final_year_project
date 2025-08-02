const mongoose = require("mongoose");

const appointmentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: "Doctor", required: true },
  slot: {
    date: { type: String, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true }
  },
  reason: { type: String, default: "General consultation" },
  urgency: {
    type: String,
    enum: ["normal", "urgent", "emergency"],
    default: "normal"
  },
  status: {
    type: String,
    enum: ["pending", "confirmed", "in_progress", "completed", "cancelled", "rejected", "no_show", "rescheduled"],
    default: "pending"
  },
  adminNotes: { type: String },
  patientNotes: { type: String },
  symptoms: [String],
  diagnosis: { type: String },
  prescription: { type: String },
  followUpDate: { type: Date },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Update the updatedAt field before saving
appointmentSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Add indexes for better query performance
appointmentSchema.index({ userId: 1, status: 1 });
appointmentSchema.index({ doctorId: 1, status: 1 });
appointmentSchema.index({ 'slot.date': 1 });
appointmentSchema.index({ createdAt: -1 });

module.exports = mongoose.model("Appointment", appointmentSchema); 