"use client";

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import {
  ArrowLeft,
  Calendar,
  TrendingUp,
  TrendingDown,
  Trash2,
  Filter,
} from "lucide-react";

const History = () => {
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // all, diabetic, non-diabetic
  const [filterFromDate, setFilterFromDate] = useState("");
  const [filterToDate, setFilterToDate] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    fetchPredictions();
  }, []);

  const fetchPredictions = async () => {
    try {
      const response = await axios.get("/api/predictions");
      setPredictions(response.data.predictions);
    } catch (error) {
      console.error("Failed to fetch predictions:", error);
      toast.error("Failed to load prediction history");
    } finally {
      setLoading(false);
    }
  };

  const deletePrediction = async (id) => {
    if (!window.confirm("Are you sure you want to delete this prediction?")) {
      return;
    }

    try {
      await axios.delete(`/api/predictions/${id}`);
      setPredictions(predictions.filter((p) => p.id !== id));
      toast.success("Prediction deleted successfully");
    } catch (error) {
      console.error("Failed to delete prediction:", error);
      toast.error("Failed to delete prediction");
    }
  };

  const filteredPredictions = predictions.filter((prediction) => {
    if (filter === "diabetic" && !prediction.result.prediction) return false;
    if (filter === "non-diabetic" && prediction.result.prediction) return false;
    // Date filtering
    const date = new Date(prediction.createdAt);
    const from = filterFromDate ? new Date(filterFromDate) : null;
    const to = filterToDate ? new Date(filterToDate) : null;
    if (from && date < from) return false;
    if (to && date > to) return false;
    return true;
  });

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
    );
  }

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
            Prediction History
          </h1>
          <p style={{ color: "#64748b", fontSize: "1.1rem" }}>
            Review your past diabetes risk predictions and track trends over
            time
          </p>
        </div>

        {/* Filter Bar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "1rem",
            marginBottom: 24,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Filter size={16} color="#64748b" />
            <span style={{ fontWeight: "500" }}>Filter:</span>
          </div>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button
              onClick={() => setFilter("all")}
              className={`btn ${
                filter === "all" ? "btn-primary" : "btn-secondary"
              }`}
              style={{ fontSize: "0.875rem", padding: "0.5rem 1rem" }}
            >
              All ({predictions.length})
            </button>
            <button
              onClick={() => setFilter("diabetic")}
              className={`btn ${
                filter === "diabetic" ? "btn-primary" : "btn-secondary"
              }`}
              style={{ fontSize: "0.875rem", padding: "0.5rem 1rem" }}
            >
              High Risk ({predictions.filter((p) => p.result.prediction).length}
              )
            </button>
            <button
              onClick={() => setFilter("non-diabetic")}
              className={`btn ${
                filter === "non-diabetic" ? "btn-primary" : "btn-secondary"
              }`}
              style={{ fontSize: "0.875rem", padding: "0.5rem 1rem" }}
            >
              Low Risk ({predictions.filter((p) => !p.result.prediction).length}
              )
            </button>
          </div>
          <label style={{ fontWeight: 500, color: "#64748b" }}>
            From:
            <input
              type="date"
              value={filterFromDate}
              onChange={(e) => setFilterFromDate(e.target.value)}
              style={{
                marginLeft: 4,
                padding: "0.25rem 0.5rem",
                borderRadius: 4,
                border: "1px solid #cbd5e1",
              }}
            />
          </label>
          <label style={{ fontWeight: 500, color: "#64748b" }}>
            To:
            <input
              type="date"
              value={filterToDate}
              onChange={(e) => setFilterToDate(e.target.value)}
              style={{
                marginLeft: 4,
                padding: "0.25rem 0.5rem",
                borderRadius: 4,
                border: "1px solid #cbd5e1",
              }}
            />
          </label>
          <button
            onClick={() => {
              setFilterFromDate("");
              setFilterToDate("");
            }}
            style={{
              marginLeft: 8,
              padding: "0.25rem 1rem",
              borderRadius: 6,
              border: "none",
              background: "#e0e7ff",
              color: "#2563eb",
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            Clear Dates
          </button>
        </div>

        {/* Predictions List */}
        {filteredPredictions.length === 0 ? (
          <div className="card text-center">
            <Calendar
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
              {filter === "all"
                ? "No predictions found"
                : `No ${filter.replace("-", " ")} predictions found`}
            </h3>
            <p style={{ color: "#64748b" }}>
              {filter === "all"
                ? "Start by making your first prediction"
                : "Try adjusting your filter or make more predictions"}
            </p>
          </div>
        ) : (
          <div
            style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
          >
            <h2 style={{ margin: "2rem 0 1rem 0" }}>Prediction History</h2>
            <style>{`
              .history-table {
                width: 100%;
                border-collapse: collapse;
                background: #fff;
                margin-top: 24px;
                box-shadow: 0 2px 8px rgba(0,0,0,0.05);
                border-radius: 10px;
                overflow: hidden;
              }
              .history-table th, .history-table td {
                padding: 14px 18px;
                text-align: center;
                border-bottom: 1px solid #f1f5f9;
                font-size: 1rem;
              }
              .history-table th {
                background: #f7f8fa;
                font-weight: 700;
                color: #1e293b;
              }
              .history-table tr:nth-child(even) {
                background: #f8fafc;
              }
              .history-table tr:last-child td {
                border-bottom: none;
              }
              @media (max-width: 900px) {
                .history-table th, .history-table td {
                  padding: 8px 6px;
                  font-size: 0.95rem;
                }
              }
            `}</style>
            <table className="history-table">
              <thead>
                <tr>
                  <th>S.N</th>
                  <th>Pregnancies (No of times)</th>
                  <th>Glucose (mg/dL)</th>
                  <th>Blood Pressure</th>
                  <th>Skin Thickness (mm)</th>
                  <th>Insulin (µU/mL)</th>
                  <th>BMI</th>
                  <th>Diabetes Pedigree</th>
                  <th>Age</th>
                  <th>Result</th>
                </tr>
              </thead>
              <tbody>
                {filteredPredictions.map((prediction, idx) => (
                  <tr key={prediction.id || idx}>
                    <td>{idx + 1}</td>
                    <td>{prediction.features.pregnancies}</td>
                    <td>{prediction.features.glucose}</td>
                    <td>{prediction.features.bloodPressure}</td>
                    <td>{prediction.features.skinThickness}</td>
                    <td>{prediction.features.insulin}</td>
                    <td>{prediction.features.bmi}</td>
                    <td>{prediction.features.diabetesPedigree}</td>
                    <td>{prediction.features.age}</td>
                    <td>
                      {prediction.result.prediction
                        ? "Diabetic"
                        : "Not Diabetic"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default History;
