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
  slotDurations: {
    routine: { type: Number, default: 15 },
    newDiagnosis: { type: Number, default: 30 },
    emergency: { type: Number, default: 45 }
  }
});

module.exports = mongoose.model("Doctor", doctorSchema); 