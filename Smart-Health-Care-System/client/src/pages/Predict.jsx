"use client";

import React from "react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import { Brain, AlertTriangle, CheckCircle, ArrowLeft } from "lucide-react";

const Predict = () => {
  const [formData, setFormData] = useState({
    pregnancies: "",
    glucose: "",
    highPressure: "",
    lowPressure: "",
    skinThickness: "",
    insulin: "",
    height: "",
    weight: "",
    bmi: "",
    age: "",
    familyHistory: "no",
    relativesWithDiabetes: "",
  });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  // Auto-calculate BMI when height and weight change
  React.useEffect(() => {
    const h = parseFloat(formData.height);
    const w = parseFloat(formData.weight);
    if (h > 0 && w > 0) {
      const bmi = w / ((h / 100) * (h / 100));
      setFormData((prev) => ({ ...prev, bmi: bmi.toFixed(2) }));
    } else {
      setFormData((prev) => ({ ...prev, bmi: "" }));
    }
  }, [formData.height, formData.weight]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    setError("");

    // Validation for pregnancies
    const preg = Number(formData.pregnancies);
    if (isNaN(preg) || preg < 0 || preg > 3) {
      setLoading(false);
      setError("Pregnancies must be between 0 and 3.");
      return;
    }

    // Map family history to diabetesPedigree for backend
    let diabetesPedigree = 0;
    if (formData.familyHistory === "yes") {
      // Scale the number of relatives to a value between 0 and 2 (for example)
      const n = Number(formData.relativesWithDiabetes);
      diabetesPedigree = Math.min(Math.max(n * 0.5, 0.1), 2); // 1 relative = 0.5, 2 = 1, 3+ = 1.5-2
    }

    try {
      const bloodPressure = formData.lowPressure; // backend expects diastolic (low)
      const response = await axios.post("/api/predictions", {
        pregnancies: Number.parseInt(formData.pregnancies),
        glucose: Number.parseFloat(formData.glucose),
        bloodPressure: Number.parseFloat(bloodPressure),
        skinThickness: Number.parseFloat(formData.skinThickness),
        insulin: Number.parseFloat(formData.insulin),
        bmi: Number.parseFloat(formData.bmi),
        diabetesPedigree: diabetesPedigree,
        age: Number.parseInt(formData.age),
      });

      setResult(response.data.prediction);
      toast.success("Prediction completed successfully!");
    } catch (error) {
      const message =
        error.response?.data?.message || "Failed to make prediction";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{ minHeight: "100vh", background: "#f8fafc", padding: "2rem 0" }}
    >
      <div className="container">
        {/* Header */}
        <div style={{ marginBottom: "2rem" }}>
          <button
            onClick={() => navigate("/dashboard")}
            className="btn btn-secondary"
            style={{ marginBottom: "1rem" }}
          >
            <ArrowLeft size={16} />
            Back to Dashboard
          </button>
          <h1
            style={{
              fontSize: "2.5rem",
              fontWeight: "700",
              marginBottom: "0.5rem",
            }}
          >
            AI Diabetes Prediction
          </h1>
          <p style={{ color: "#64748b", fontSize: "1.1rem" }}>
            Enter your health information for AI-powered diabetes risk
            assessment
          </p>
        </div>

        <div className="grid md:grid-cols-2" style={{ gap: "2rem" }}>
          {/* Prediction Form */}
          <div className="card">
            <h2
              style={{
                fontSize: "1.5rem",
                fontWeight: "600",
                marginBottom: "1.5rem",
              }}
            >
              Health Parameters
            </h2>

            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-2" style={{ gap: "1rem" }}>
                <div className="form-group">
                  <label className="form-label">Pregnancies</label>
                  <input
                    type="number"
                    name="pregnancies"
                    min={0}
                    max={3}
                    step={1}
                    value={formData.pregnancies}
                    onChange={handleChange}
                    placeholder="Enter number of pregnancies (0-3)"
                    required
                    className="form-input"
                  />
                  <div style={{ fontSize: "0.9em", color: "#64748b" }}>
                    Total number of pregnancies (must be between 0 and 3)
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Glucose (mg/dL)</label>
                  <input
                    type="number"
                    name="glucose"
                    value={formData.glucose}
                    onChange={handleChange}
                    className="form-input"
                    min="50"
                    max="400"
                    step="0.1"
                    placeholder="120"
                    required
                  />
                  <p
                    style={{
                      fontSize: "0.75rem",
                      color: "#64748b",
                      marginTop: "0.25rem",
                    }}
                  >
                    Fasting blood glucose level
                  </p>
                </div>

                <div className="form-group">
                  <label className="form-label">
                    High Pressure (top number)
                  </label>
                  <input
                    type="number"
                    name="highPressure"
                    value={formData.highPressure}
                    onChange={handleChange}
                    className="form-input"
                    min="70"
                    max="200"
                    step="0.1"
                    placeholder="120"
                    required
                  />
                  <p
                    style={{
                      fontSize: "0.75rem",
                      color: "#64748b",
                      marginTop: "0.25rem",
                    }}
                  >
                    High pressure (top number in 120/80)
                  </p>
                </div>

                <div className="form-group">
                  <label className="form-label">
                    Low Pressure (bottom number)
                  </label>
                  <input
                    type="number"
                    name="lowPressure"
                    value={formData.lowPressure}
                    onChange={handleChange}
                    className="form-input"
                    min="40"
                    max="120"
                    step="0.1"
                    placeholder="80"
                    required
                  />
                  <p
                    style={{
                      fontSize: "0.75rem",
                      color: "#64748b",
                      marginTop: "0.25rem",
                    }}
                  >
                    Low pressure (bottom number in 120/80)
                  </p>
                </div>

                {/* Blood Pressure Reference Box */}
                <div
                  style={{
                    gridColumn: "1 / -1",
                    background: "#f1f5f9",
                    border: "1px solid #cbd5e1",
                    borderRadius: "8px",
                    padding: "0.75rem 1rem",
                    marginTop: "-0.5rem",
                    marginBottom: "1rem",
                    fontSize: "0.95rem",
                    color: "#334155",
                  }}
                >
                  <strong>Blood Pressure Reference (Adults):</strong>
                  <br />
                  <span style={{ color: "#059669" }}>Normal:</span> 120/80 mmHg
                  &nbsp;|&nbsp;
                  <span style={{ color: "#f59e42" }}>High:</span> 130–180 (top)
                  / 80–120 (bottom) mmHg
                </div>

                <div className="form-group">
                  <label className="form-label">Skin Thickness (mm)</label>
                  <input
                    type="number"
                    name="skinThickness"
                    min={5}
                    max={50}
                    step={1}
                    value={formData.skinThickness}
                    onChange={handleChange}
                    placeholder="Typical: 10-40 mm"
                    required
                    className="form-input"
                  />
                  <div style={{ fontSize: "0.9em", color: "#64748b" }}>
                    Pinch of skin and fat on the back of your upper arm,
                    measured in millimeters (mm). Typical healthy range: 10-40
                    mm.
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Insulin (μU/mL)</label>
                  <input
                    type="number"
                    name="insulin"
                    value={formData.insulin}
                    onChange={handleChange}
                    className="form-input"
                    min="0"
                    max="1000"
                    step="0.1"
                    placeholder="80"
                    required
                  />
                  <p
                    style={{
                      fontSize: "0.75rem",
                      color: "#64748b",
                      marginTop: "0.25rem",
                    }}
                  >
                    2-Hour serum insulin level
                  </p>
                </div>

                <div className="form-group">
                  <label className="form-label">Height (cm)</label>
                  <input
                    type="number"
                    name="height"
                    value={formData.height}
                    onChange={handleChange}
                    className="form-input"
                    min="100"
                    max="250"
                    placeholder="170"
                    required
                  />
                  <p
                    style={{
                      fontSize: "0.75rem",
                      color: "#64748b",
                      marginTop: "0.25rem",
                    }}
                  >
                    Enter your height in centimeters (cm)
                  </p>
                </div>

                <div className="form-group">
                  <label className="form-label">Weight (kg)</label>
                  <input
                    type="number"
                    name="weight"
                    value={formData.weight}
                    onChange={handleChange}
                    className="form-input"
                    min="30"
                    max="250"
                    placeholder="65"
                    required
                  />
                  <p
                    style={{
                      fontSize: "0.75rem",
                      color: "#64748b",
                      marginTop: "0.25rem",
                    }}
                  >
                    Enter your weight in kilograms (kg)
                  </p>
                </div>

                <div className="form-group">
                  <label className="form-label">BMI (auto-calculated)</label>
                  <input
                    type="number"
                    name="bmi"
                    value={formData.bmi}
                    className="form-input"
                    readOnly
                    placeholder="BMI will be calculated"
                  />
                  <p
                    style={{
                      fontSize: "0.75rem",
                      color: "#64748b",
                      marginTop: "0.25rem",
                    }}
                  >
                    Body Mass Index (BMI) is calculated automatically from your
                    height and weight.
                  </p>
                </div>

                {/* BMI Reference Box */}
                <div
                  style={{
                    gridColumn: "1 / -1",
                    background: "#f1f5f9",
                    border: "1px solid #cbd5e1",
                    borderRadius: "8px",
                    padding: "0.75rem 1rem",
                    marginTop: "-0.5rem",
                    marginBottom: "1rem",
                    fontSize: "0.95rem",
                    color: "#334155",
                  }}
                >
                  <strong>BMI Reference (Adults):</strong>
                  <br />
                  <span style={{ color: "#059669" }}>Normal:</span> 18.5–24.9
                  &nbsp;|&nbsp;
                  <span style={{ color: "#f59e42" }}>Overweight:</span> 25–29.9
                  &nbsp;|&nbsp;
                  <span style={{ color: "#ef4444" }}>Obese:</span> 30+
                </div>

                {/* Family History of Diabetes */}
                <div className="form-group" style={{ gridColumn: "1 / -1" }}>
                  <label className="form-label">
                    Do you have a family history of diabetes?
                  </label>
                  <div
                    style={{
                      display: "flex",
                      gap: "1.5rem",
                      marginTop: "0.5rem",
                    }}
                  >
                    <label
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                      }}
                    >
                      <input
                        type="radio"
                        name="familyHistory"
                        value="yes"
                        checked={formData.familyHistory === "yes"}
                        onChange={handleChange}
                        required
                      />
                      Yes
                    </label>
                    <label
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                      }}
                    >
                      <input
                        type="radio"
                        name="familyHistory"
                        value="no"
                        checked={formData.familyHistory === "no"}
                        onChange={handleChange}
                        required
                      />
                      No
                    </label>
                  </div>
                  {formData.familyHistory === "yes" && (
                    <div style={{ marginTop: "0.75rem" }}>
                      <label className="form-label">
                        How many close relatives have diabetes?
                      </label>
                      <input
                        type="number"
                        name="relativesWithDiabetes"
                        value={formData.relativesWithDiabetes}
                        onChange={handleChange}
                        className="form-input"
                        min="1"
                        max="4"
                        placeholder="1"
                        required
                      />
                      <p
                        style={{
                          fontSize: "0.75rem",
                          color: "#64748b",
                          marginTop: "0.25rem",
                        }}
                      >
                        Include parents, siblings, or children only.
                      </p>
                    </div>
                  )}
                  <p
                    style={{
                      fontSize: "0.75rem",
                      color: "#64748b",
                      marginTop: "0.5rem",
                    }}
                  >
                    This helps us estimate your genetic risk for diabetes. Your
                    answer is mapped to a medical risk score for the AI model.
                  </p>
                </div>

                <div className="form-group">
                  <label className="form-label">Age (years)</label>
                  <input
                    type="number"
                    name="age"
                    value={formData.age}
                    onChange={handleChange}
                    className="form-input"
                    min="18"
                    max="120"
                    placeholder="30"
                    required
                  />
                  <p
                    style={{
                      fontSize: "0.75rem",
                      color: "#64748b",
                      marginTop: "0.25rem",
                    }}
                  >
                    Current age in years
                  </p>
                </div>
              </div>

              {error && (
                <div style={{ color: "#ef4444", marginBottom: 12 }}>
                  {error}
                </div>
              )}

              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: "100%", marginTop: "1.5rem" }}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <div className="loading-spinner"></div>
                    Analyzing with AI Model...
                  </>
                ) : (
                  <>
                    <Brain size={16} />
                    Predict Diabetes Risk
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Results */}
          <div>
            {result && (
              <div
                className="card"
                style={{
                  border: result.result
                    ? "2px solid #ef4444"
                    : "2px solid #10b981",
                  background: result.result ? "#fef2f2" : "#f0fdf4",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "1rem",
                    marginBottom: "1.5rem",
                  }}
                >
                  {result.result ? (
                    <AlertTriangle size={32} color="#ef4444" />
                  ) : (
                    <CheckCircle size={32} color="#10b981" />
                  )}
                  <div>
                    <h3
                      style={{
                        fontSize: "1.5rem",
                        fontWeight: "700",
                        color: result.result ? "#dc2626" : "#059669",
                      }}
                    >
                      {result.result
                        ? "High Diabetes Risk"
                        : "Low Diabetes Risk"}
                    </h3>
                    <p style={{ color: "#64748b" }}>
                      Confidence: {result.confidence}%
                    </p>
                  </div>
                </div>

                <div style={{ marginBottom: "1.5rem" }}>
                  <h4
                    style={{
                      fontSize: "1rem",
                      fontWeight: "600",
                      marginBottom: "1rem",
                    }}
                  >
                    Probability Breakdown
                  </h4>
                  <div style={{ marginBottom: "0.5rem" }}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        fontSize: "0.875rem",
                        marginBottom: "0.25rem",
                      }}
                    >
                      <span>Diabetic Risk</span>
                      <span>{result.probabilityDiabetic}%</span>
                    </div>
                    <div
                      style={{
                        width: "100%",
                        height: "8px",
                        background: "#e2e8f0",
                        borderRadius: "4px",
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          width: `${result.probabilityDiabetic}%`,
                          height: "100%",
                          background: "#ef4444",
                          transition: "width 0.3s ease",
                        }}
                      ></div>
                    </div>
                  </div>
                  <div>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        fontSize: "0.875rem",
                        marginBottom: "0.25rem",
                      }}
                    >
                      <span>Non-Diabetic</span>
                      <span>{result.probabilityNonDiabetic}%</span>
                    </div>
                    <div
                      style={{
                        width: "100%",
                        height: "8px",
                        background: "#e2e8f0",
                        borderRadius: "4px",
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          width: `${result.probabilityNonDiabetic}%`,
                          height: "100%",
                          background: "#10b981",
                          transition: "width 0.3s ease",
                        }}
                      ></div>
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    padding: "1rem",
                    background: "#dbeafe",
                    borderRadius: "0.5rem",
                    border: "1px solid #93c5fd",
                  }}
                >
                  <p style={{ fontSize: "0.875rem", color: "#1e40af" }}>
                    <strong>Medical Disclaimer:</strong> This AI preidctor
                    created by our team is for educataional and informational
                    purpose only,we suggest you must visit medical professional
                    for proper diagonsis.Thank you!!!
                  </p>
                </div>
              </div>
            )}

            {!result && (
              <div className="card text-center">
                <Brain
                  size={48}
                  color="#64748b"
                  style={{ margin: "0 auto 1rem" }}
                />
                <h3
                  style={{
                    fontSize: "1.25rem",
                    fontWeight: "600",
                    marginBottom: "0.5rem",
                  }}
                >
                  Ready for AI Analysis
                </h3>
                <p style={{ color: "#64748b" }}>
                  Fill out the form on the left to get your diabetes risk
                  prediction using our custom machine learning model.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Predict;
