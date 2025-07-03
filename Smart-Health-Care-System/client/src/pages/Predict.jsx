"use client"

import { useState } from "react"
import { useNavigate } from "react-router-dom"
import axios from "axios"
import { toast } from "react-toastify"
import { Brain, AlertTriangle, CheckCircle, ArrowLeft } from "lucide-react"

const Predict = () => {
  const [formData, setFormData] = useState({
    pregnancies: "",
    glucose: "",
    bloodPressure: "",
    skinThickness: "",
    insulin: "",
    bmi: "",
    diabetesPedigree: "",
    age: "",
  })
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setResult(null)

    try {
      const response = await axios.post("/api/predictions", {
        pregnancies: Number.parseInt(formData.pregnancies),
        glucose: Number.parseFloat(formData.glucose),
        bloodPressure: Number.parseFloat(formData.bloodPressure),
        skinThickness: Number.parseFloat(formData.skinThickness),
        insulin: Number.parseFloat(formData.insulin),
        bmi: Number.parseFloat(formData.bmi),
        diabetesPedigree: Number.parseFloat(formData.diabetesPedigree),
        age: Number.parseInt(formData.age),
      })

      setResult(response.data.prediction)
      toast.success("Prediction completed successfully!")
    } catch (error) {
      const message = error.response?.data?.message || "Failed to make prediction"
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", padding: "2rem 0" }}>
      <div className="container">
        {/* Header */}
        <div style={{ marginBottom: "2rem" }}>
          <button onClick={() => navigate("/dashboard")} className="btn btn-secondary" style={{ marginBottom: "1rem" }}>
            <ArrowLeft size={16} />
            Back to Dashboard
          </button>
          <h1 style={{ fontSize: "2.5rem", fontWeight: "700", marginBottom: "0.5rem" }}>AI Diabetes Prediction</h1>
          <p style={{ color: "#64748b", fontSize: "1.1rem" }}>
            Enter your health information for AI-powered diabetes risk assessment
          </p>
        </div>

        <div className="grid md:grid-cols-2" style={{ gap: "2rem" }}>
          {/* Prediction Form */}
          <div className="card">
            <h2 style={{ fontSize: "1.5rem", fontWeight: "600", marginBottom: "1.5rem" }}>Health Parameters</h2>

            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-2" style={{ gap: "1rem" }}>
                <div className="form-group">
                  <label className="form-label">Pregnancies</label>
                  <input
                    type="number"
                    name="pregnancies"
                    value={formData.pregnancies}
                    onChange={handleChange}
                    className="form-input"
                    min="0"
                    max="20"
                    placeholder="0"
                    required
                  />
                  <p style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "0.25rem" }}>
                    Total number of pregnancies
                  </p>
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
                  <p style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "0.25rem" }}>
                    Fasting blood glucose level
                  </p>
                </div>

                <div className="form-group">
                  <label className="form-label">Blood Pressure (mmHg)</label>
                  <input
                    type="number"
                    name="bloodPressure"
                    value={formData.bloodPressure}
                    onChange={handleChange}
                    className="form-input"
                    min="40"
                    max="200"
                    step="0.1"
                    placeholder="80"
                    required
                  />
                  <p style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "0.25rem" }}>
                    Diastolic blood pressure
                  </p>
                </div>

                <div className="form-group">
                  <label className="form-label">Skin Thickness (mm)</label>
                  <input
                    type="number"
                    name="skinThickness"
                    value={formData.skinThickness}
                    onChange={handleChange}
                    className="form-input"
                    min="0"
                    max="100"
                    step="0.1"
                    placeholder="20"
                    required
                  />
                  <p style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "0.25rem" }}>
                    Triceps skin fold thickness
                  </p>
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
                  <p style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "0.25rem" }}>
                    2-Hour serum insulin level
                  </p>
                </div>

                <div className="form-group">
                  <label className="form-label">BMI</label>
                  <input
                    type="number"
                    name="bmi"
                    value={formData.bmi}
                    onChange={handleChange}
                    className="form-input"
                    min="10"
                    max="70"
                    step="0.1"
                    placeholder="25.0"
                    required
                  />
                  <p style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "0.25rem" }}>Body Mass Index</p>
                </div>

                <div className="form-group">
                  <label className="form-label">Diabetes Pedigree</label>
                  <input
                    type="number"
                    name="diabetesPedigree"
                    value={formData.diabetesPedigree}
                    onChange={handleChange}
                    className="form-input"
                    min="0"
                    max="3"
                    step="0.001"
                    placeholder="0.5"
                    required
                  />
                  <p style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "0.25rem" }}>
                    Family history diabetes likelihood
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
                  <p style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "0.25rem" }}>Current age in years</p>
                </div>
              </div>

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
                  border: result.result ? "2px solid #ef4444" : "2px solid #10b981",
                  background: result.result ? "#fef2f2" : "#f0fdf4",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.5rem" }}>
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
                      {result.result ? "High Diabetes Risk" : "Low Diabetes Risk"}
                    </h3>
                    <p style={{ color: "#64748b" }}>Confidence: {result.confidence}%</p>
                  </div>
                </div>

                <div style={{ marginBottom: "1.5rem" }}>
                  <h4 style={{ fontSize: "1rem", fontWeight: "600", marginBottom: "1rem" }}>Probability Breakdown</h4>
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

                {result.riskFactors && result.riskFactors.length > 0 && (
                  <div style={{ marginBottom: "1.5rem" }}>
                    <h4 style={{ fontSize: "1rem", fontWeight: "600", marginBottom: "1rem" }}>
                      Risk Factors Identified
                    </h4>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                      {result.riskFactors.map((factor, index) => (
                        <div
                          key={index}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "0.5rem",
                            padding: "0.5rem",
                            background: "#fed7aa",
                            borderRadius: "0.375rem",
                          }}
                        >
                          <div
                            style={{ width: "8px", height: "8px", background: "#ea580c", borderRadius: "50%" }}
                          ></div>
                          <span style={{ fontSize: "0.875rem", color: "#9a3412" }}>{factor}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div
                  style={{
                    padding: "1rem",
                    background: "#dbeafe",
                    borderRadius: "0.5rem",
                    border: "1px solid #93c5fd",
                  }}
                >
                  <p style={{ fontSize: "0.875rem", color: "#1e40af" }}>
                    <strong>Medical Disclaimer:</strong> This AI preidctor created by our team is for educataional and informational purpose only,we suggest you must visit medical professional for proper diagonsis.Thank you!!!
                  </p>
                </div>
              </div>
            )}

            {!result && (
              <div className="card text-center">
                <Brain size={48} color="#64748b" style={{ margin: "0 auto 1rem" }} />
                <h3 style={{ fontSize: "1.25rem", fontWeight: "600", marginBottom: "0.5rem" }}>
                  Ready for AI Analysis
                </h3>
                <p style={{ color: "#64748b" }}>
                  Fill out the form on the left to get your diabetes risk prediction using our custom machine learning
                  model.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Predict
