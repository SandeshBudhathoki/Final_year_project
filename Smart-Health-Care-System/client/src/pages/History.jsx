"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import axios from "axios"
import { toast } from "react-toastify"
import { ArrowLeft, Calendar, TrendingUp, TrendingDown, Trash2, Filter } from "lucide-react"

const History = () => {
  const [predictions, setPredictions] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState("all") // all, diabetic, non-diabetic
  const navigate = useNavigate()

  useEffect(() => {
    fetchPredictions()
  }, [])

  const fetchPredictions = async () => {
    try {
      const response = await axios.get("/api/predictions")
      setPredictions(response.data.predictions)
    } catch (error) {
      console.error("Failed to fetch predictions:", error)
      toast.error("Failed to load prediction history")
    } finally {
      setLoading(false)
    }
  }

  const deletePrediction = async (id) => {
    if (!window.confirm("Are you sure you want to delete this prediction?")) {
      return
    }

    try {
      await axios.delete(`/api/predictions/${id}`)
      setPredictions(predictions.filter((p) => p.id !== id))
      toast.success("Prediction deleted successfully")
    } catch (error) {
      console.error("Failed to delete prediction:", error)
      toast.error("Failed to delete prediction")
    }
  }

  const filteredPredictions = predictions.filter((prediction) => {
    if (filter === "diabetic") return prediction.result.prediction
    if (filter === "non-diabetic") return !prediction.result.prediction
    return true
  })

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "50vh",
        }}
      >
        <div className="loading-spinner"></div>
      </div>
    )
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
          <h1 style={{ fontSize: "2.5rem", fontWeight: "700", marginBottom: "0.5rem" }}>Prediction History</h1>
          <p style={{ color: "#64748b", fontSize: "1.1rem" }}>
            Review your past diabetes risk predictions and track trends over time
          </p>
        </div>

        {/* Filter */}
        <div className="card" style={{ marginBottom: "2rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Filter size={16} color="#64748b" />
              <span style={{ fontWeight: "500" }}>Filter:</span>
            </div>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button
                onClick={() => setFilter("all")}
                className={`btn ${filter === "all" ? "btn-primary" : "btn-secondary"}`}
                style={{ fontSize: "0.875rem", padding: "0.5rem 1rem" }}
              >
                All ({predictions.length})
              </button>
              <button
                onClick={() => setFilter("diabetic")}
                className={`btn ${filter === "diabetic" ? "btn-primary" : "btn-secondary"}`}
                style={{ fontSize: "0.875rem", padding: "0.5rem 1rem" }}
              >
                High Risk ({predictions.filter((p) => p.result.prediction).length})
              </button>
              <button
                onClick={() => setFilter("non-diabetic")}
                className={`btn ${filter === "non-diabetic" ? "btn-primary" : "btn-secondary"}`}
                style={{ fontSize: "0.875rem", padding: "0.5rem 1rem" }}
              >
                Low Risk ({predictions.filter((p) => !p.result.prediction).length})
              </button>
            </div>
          </div>
        </div>

        {/* Predictions List */}
        {filteredPredictions.length === 0 ? (
          <div className="card text-center">
            <Calendar size={48} color="#64748b" style={{ margin: "0 auto 1rem" }} />
            <h3 style={{ fontSize: "1.25rem", fontWeight: "600", marginBottom: "0.5rem" }}>
              {filter === "all" ? "No predictions found" : `No ${filter.replace("-", " ")} predictions found`}
            </h3>
            <p style={{ color: "#64748b" }}>
              {filter === "all"
                ? "Start by making your first prediction"
                : "Try adjusting your filter or make more predictions"}
            </p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {filteredPredictions.map((prediction) => (
              <div key={prediction.id} className="card">
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    marginBottom: "1rem",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                    {prediction.result.prediction ? (
                      <TrendingUp size={24} color="#ef4444" />
                    ) : (
                      <TrendingDown size={24} color="#10b981" />
                    )}
                    <div>
                      <h3
                        style={{
                          fontSize: "1.25rem",
                          fontWeight: "600",
                          color: prediction.result.prediction ? "#dc2626" : "#059669",
                        }}
                      >
                        {prediction.result.prediction ? "High Risk" : "Low Risk"}
                      </h3>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#64748b" }}>
                        <Calendar size={14} />
                        <span style={{ fontSize: "0.875rem" }}>
                          {new Date(prediction.createdAt).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                    <div
                      style={{
                        padding: "0.5rem 1rem",
                        background: prediction.result.prediction ? "#fef2f2" : "#f0fdf4",
                        color: prediction.result.prediction ? "#dc2626" : "#059669",
                        borderRadius: "0.5rem",
                        fontSize: "0.875rem",
                        fontWeight: "500",
                      }}
                    >
                      {prediction.result.confidence}% Confidence
                    </div>
                    <button
                      onClick={() => deletePrediction(prediction.id)}
                      className="btn btn-danger"
                      style={{ padding: "0.5rem" }}
                      title="Delete prediction"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <div className="grid md:grid-cols-4" style={{ gap: "1rem", fontSize: "0.875rem" }}>
                  <div>
                    <p style={{ fontWeight: "500", color: "#64748b" }}>Glucose</p>
                    <p style={{ fontSize: "1rem" }}>{prediction.features.glucose} mg/dL</p>
                  </div>
                  <div>
                    <p style={{ fontWeight: "500", color: "#64748b" }}>BMI</p>
                    <p style={{ fontSize: "1rem" }}>{prediction.features.bmi}</p>
                  </div>
                  <div>
                    <p style={{ fontWeight: "500", color: "#64748b" }}>Age</p>
                    <p style={{ fontSize: "1rem" }}>{prediction.features.age} years</p>
                  </div>
                  <div>
                    <p style={{ fontWeight: "500", color: "#64748b" }}>Blood Pressure</p>
                    <p style={{ fontSize: "1rem" }}>{prediction.features.bloodPressure} mmHg</p>
                  </div>
                </div>

                {prediction.result.riskFactors && prediction.result.riskFactors.length > 0 && (
                  <div style={{ marginTop: "1rem" }}>
                    <p style={{ fontWeight: "500", color: "#64748b", marginBottom: "0.5rem" }}>Risk Factors:</p>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                      {prediction.result.riskFactors.map((factor, index) => (
                        <span
                          key={index}
                          style={{
                            padding: "0.25rem 0.75rem",
                            background: "#fed7aa",
                            color: "#9a3412",
                            borderRadius: "1rem",
                            fontSize: "0.75rem",
                          }}
                        >
                          {factor}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default History
