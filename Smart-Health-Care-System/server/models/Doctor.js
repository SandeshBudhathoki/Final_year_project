const mongoose = require("mongoose");

const slotSchema = new mongoose.Schema({
  date: { type: String, required: true }, // e.g., "2024-06-10"
  startTime: { type: String, required: true }, // e.g., "11:00"
  endTime: { type: String, required: true },   // e.g., "11:30"
  isBooked: { type: Boolean, default: false }
});

const doctorSchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: { type: String, required: true }, // e.g., "Diabetes Specialist"
  qualifications: { type: String },
  experience: { type: Number }, // years
  expertise: { type: String },
  fee: { type: Number, required: true },
  availableSlots: [slotSchema],
  photo: { type: String },
  contactInfo: { type: String },
  // New availability management fields
  availabilityStatus: {
    type: String,
    enum: ["available", "busy", "offline", "booked"],
    default: "available"
  },
  lastStatusUpdate: { type: Date, default: Date.now },
  currentPatientId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  statusNotes: { type: String }, // Optional notes about current status
  slotDurations: {
    routine: { type: Number, default: 15 },
    newDiagnosis: { type: Number, default: 30 },
    emergency: { type: Number, default: 45 }
  }
});

// Update lastStatusUpdate when availabilityStatus changes
doctorSchema.pre('save', function(next) {
  if (this.isModified('availabilityStatus')) {
    this.lastStatusUpdate = new Date();
  }
  next();
});

module.exports = mongoose.model("Doctor", doctorSchema); 