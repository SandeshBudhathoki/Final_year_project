const mongoose = require("mongoose");

const slotSchema = new mongoose.Schema({
  date: { type: String, required: true }, // e.g., "2025-09-01"
  startTime: { type: String, required: true }, // e.g., "11:00"
  endTime: { type: String, required: true },   // e.g., "11:30"
  isBooked: { type: Boolean, default: false }
});

const doctorSchema = new mongoose.Schema({
  // 🔗 Link back to User (account)
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true, // one-to-one relation: one User = one Doctor profile
  },

  // Doctor details
  name: { type: String, required: true },
  category: { type: String, required: true }, // e.g., "Diabetes Specialist"
  qualifications: { type: String },
  experience: { type: Number }, // years
  expertise: { type: String },
  fee: { type: Number, required: true },
  photo: { type: String },
  contactInfo: { type: String },

  // Slots
  availableSlots: [slotSchema],

  // Availability management
  availabilityStatus: {
    type: String,
    enum: ["available", "busy", "offline", "booked"],
    default: "available"
  },
  lastStatusUpdate: { type: Date, default: Date.now },
  currentPatientId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  statusNotes: { type: String }, // optional notes

  // Different types of slot durations
  slotDurations: {
    routine: { type: Number, default: 15 },
    newDiagnosis: { type: Number, default: 30 },
    emergency: { type: Number, default: 45 }
  },

  createdAt: { type: Date, default: Date.now }
});

// Auto-update lastStatusUpdate when availabilityStatus changes
doctorSchema.pre("save", function (next) {
  if (this.isModified("availabilityStatus")) {
    this.lastStatusUpdate = new Date();
  }
  next();
});

module.exports = mongoose.model("Doctor", doctorSchema);
