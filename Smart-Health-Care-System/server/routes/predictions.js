const express = require("express");
const axios = require("axios");
const { body, validationResult } = require("express-validator");
const Prediction = require("../models/Prediction");
const auth = require("../middleware/auth");
const { admin } = require("../middleware/auth");

const router = express.Router();

const PYTHON_API_URL = process.env.PYTHON_API_URL || "http://localhost:5000";

// @route   POST /api/predictions
// @desc    Make a diabetes prediction
// @access  Private
router.post(
  "/",
  auth,
  [
    body("pregnancies")
      .isInt({ min: 0, max: 20 })
      .withMessage("Pregnancies must be between 0 and 20"),
    body("glucose")
      .isFloat({ min: 50, max: 400 })
      .withMessage("Glucose must be between 50 and 400"),
    body("bloodPressure")
      .isFloat({ min: 40, max: 200 })
      .withMessage("Blood pressure must be between 40 and 200"),
    body("skinThickness")
      .isFloat({ min: 0, max: 100 })
      .withMessage("Skin thickness must be between 0 and 100"),
    body("insulin")
      .isFloat({ min: 0, max: 1000 })
      .withMessage("Insulin must be between 0 and 1000"),
    body("bmi")
      .isFloat({ min: 10, max: 70 })
      .withMessage("BMI must be between 10 and 70"),
    body("diabetesPedigree")
      .isFloat({ min: 0, max: 3 })
      .withMessage("Diabetes pedigree must be between 0 and 3"),
    body("age")
      .isInt({ min: 18, max: 120 })
      .withMessage("Age must be between 18 and 120"),
  ],
  async (req, res) => {
    try {
      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          message: "Validation failed",
          errors: errors.array(),
        });
      }

      const features = req.body;

      // Call Python ML API
      const mlResponse = await axios.post(
        `${PYTHON_API_URL}/predict`,
        features,
        {
          timeout: 30000, // 30 seconds timeout
        }
      );

      const mlResult = mlResponse.data;

      // Save prediction to database
      const prediction = new Prediction({
        userId: req.user._id,
        features,
        result: {
          prediction: mlResult.prediction,
          confidence: mlResult.confidence,
          probabilityDiabetic: mlResult.probability_diabetic,
          probabilityNonDiabetic: mlResult.probability_non_diabetic,
          // riskFactors removed
        },
        modelInfo: {
          modelType: mlResult.model_type || "CustomRandomForestClassifier",
          version: mlResult.model_version || "1.0",
        },
      });

      await prediction.save();

      res.json({
        message: "Prediction completed successfully",
        prediction: {
          id: prediction._id,
          result: mlResult.prediction,
          confidence: Math.round(mlResult.confidence * 100),
          probabilityDiabetic: Math.round(mlResult.probability_diabetic * 100),
          probabilityNonDiabetic: Math.round(
            mlResult.probability_non_diabetic * 100
          ),
          // riskFactors removed
          timestamp: prediction.createdAt,
        },
      });
    } catch (error) {
      console.error("Prediction error:", error);

      if (error.code === "ECONNREFUSED") {
        return res.status(503).json({
          message:
            "ML service is unavailable. Please ensure the Python API is running.",
        });
      }

      if (error.response?.data?.error) {
        return res.status(400).json({ message: error.response.data.error });
      }

      res.status(500).json({ message: "Failed to make prediction" });
    }
  }
);

// @route   GET /api/predictions
// @desc    Get user's prediction history
// @access  Private
router.get("/", auth, async (req, res) => {
  try {
    const page = Number.parseInt(req.query.page) || 1;
    const limit = Number.parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const predictions = await Prediction.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Prediction.countDocuments({ userId: req.user._id });
    console.log(predictions);

    const formattedPredictions = predictions.map((pred) => ({
      id: pred._id,
      features: pred.features,
      result: {
        prediction: pred.result.prediction,
        confidence: Math.round(pred.result.confidence * 100),
        probabilityDiabetic: Math.round(pred.result.probabilityDiabetic * 100),
        probabilityNonDiabetic: Math.round(
          pred.result.probabilityNonDiabetic * 100
        ),
        // riskFactors removed
      },
      createdAt: pred.createdAt,
    }));

    res.json({
      predictions: formattedPredictions,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalPredictions: total,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error("Get predictions error:", error);
    res.status(500).json({ message: "Failed to fetch predictions" });
  }
});

// @route   GET /api/predictions/stats
// @desc    Get user's prediction statistics
// @access  Private
router.get("/stats", auth, async (req, res) => {
  try {
    const stats = await Prediction.aggregate([
      { $match: { userId: req.user._id } },
      {
        $group: {
          _id: null,
          totalPredictions: { $sum: 1 },
          diabeticPredictions: {
            $sum: { $cond: ["$result.prediction", 1, 0] },
          },
          averageConfidence: { $avg: "$result.confidence" },
          lastPrediction: { $max: "$createdAt" },
        },
      },
    ]);

    const result = stats[0] || {
      totalPredictions: 0,
      diabeticPredictions: 0,
      averageConfidence: 0,
      lastPrediction: null,
    };

    res.json({
      stats: {
        totalPredictions: result.totalPredictions,
        diabeticPredictions: result.diabeticPredictions,
        nonDiabeticPredictions:
          result.totalPredictions - result.diabeticPredictions,
        averageConfidence: Math.round(result.averageConfidence * 100) || 0,
        lastPrediction: result.lastPrediction,
      },
    });
  } catch (error) {
    console.error("Get stats error:", error);
    res.status(500).json({ message: "Failed to fetch statistics" });
  }
});

// @route   DELETE /api/predictions/:id
// @desc    Delete a prediction
// @access  Private
router.delete("/:id", auth, async (req, res) => {
  try {
    const prediction = await Prediction.findById(req.params.id);
    if (!prediction) {
      return res.status(404).json({ message: "Prediction not found" });
    }
    // Allow if admin or owner
    if (req.user.role !== "admin" && !prediction.userId.equals(req.user._id)) {
      return res.status(403).json({ message: "Not authorized" });
    }
    await Prediction.findByIdAndDelete(req.params.id);
    res.json({ message: "Prediction deleted successfully" });
  } catch (error) {
    console.error("Delete prediction error:", error);
    res.status(500).json({ message: "Failed to delete prediction" });
  }
});

// @route   GET /api/admin/predictions
// @desc    Get all predictions (admin only)
// @access  Admin
router.get("/admin/predictions", auth, admin, async (req, res) => {
  try {
    const predictions = await Prediction.find()
      .populate("userId", "email firstName lastName")
      .sort({ createdAt: -1 });
    res.json({ predictions });
  } catch (error) {
    console.error("Get all predictions (admin) error:", error);
    res.status(500).json({ message: "Server error fetching predictions" });
  }
});

module.exports = router;
