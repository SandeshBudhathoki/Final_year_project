const mongoose = require("mongoose")

const predictionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  features: {
    pregnancies: {
      type: Number,
      required: true,
      min: 0,
      max: 20,
    },
    glucose: {
      type: Number,
      required: true,
      min: 50,
      max: 400,
    },
    bloodPressure: {
      type: Number,
      required: true,
      min: 40,
      max: 200,
    },
    skinThickness: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    insulin: {
      type: Number,
      required: true,
      min: 0,
      max: 1000,
    },
    bmi: {
      type: Number,
      required: true,
      min: 10,
      max: 70,
    },
    diabetesPedigree: {
      type: Number,
      required: true,
      min: 0,
      max: 3,
    },
    age: {
      type: Number,
      required: true,
      min: 18,
      max: 120,
    },
  },
  result: {
    prediction: {
      type: Boolean,
      required: true,
    },
    confidence: {
      type: Number,
      required: true,
      min: 0,
      max: 1,
    },
    probabilityDiabetic: {
      type: Number,
      required: true,
      min: 0,
      max: 1,
    },
    probabilityNonDiabetic: {
      type: Number,
      required: true,
      min: 0,
      max: 1,
    },
    riskFactors: [
      {
        type: String,
      },
    ],
  },
  modelInfo: {
    modelType: {
      type: String,
      default: "CustomRandomForestClassifier",
    },
    version: {
      type: String,
      default: "1.0",
    },
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
})

// Index for faster queries
predictionSchema.index({ userId: 1, createdAt: -1 })

module.exports = mongoose.model("Prediction", predictionSchema)
