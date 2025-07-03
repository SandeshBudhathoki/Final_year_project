"use client";

import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext.jsx";
import axios from "axios";
import { toast } from "react-toastify";
import {
  Activity,
  TrendingUp,
  TrendingDown,
  Calendar,
  Brain,
  History,
} from "lucide-react";

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [recentPredictions, setRecentPredictions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;
      const [statsResponse, predictionsResponse] = await Promise.all([
        axios.get("/api/predictions/stats", {
          headers: {
            Authorization: "Bearer " + token,
          },
        }),
        axios.get("/api/predictions?limit=5", {
          headers: {
            Authorization: "Bearer " + token,
          },
        }),
      ]);

      setStats(statsResponse.data.stats);
      setRecentPredictions(predictionsResponse.data.predictions);
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

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
          <h1
            style={{
              fontSize: "2.5rem",
              fontWeight: "700",
              marginBottom: "0.5rem",
            }}
          >
            Dashboard
          </h1>
          <p style={{ color: "#64748b", fontSize: "1.1rem" }}>
            Welcome back, {user?.fullName}! Here's your health overview.
          </p>
        </div>

        {/* Stats Cards */}
        <div
          className="grid md:grid-cols-3"
          style={{ gap: "1.5rem", marginBottom: "2rem" }}
        >
          <div className="card">
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "1rem",
              }}
            >
              <h3
                style={{
                  fontSize: "0.875rem",
                  fontWeight: "500",
                  color: "#64748b",
                }}
              >
                Total Predictions
              </h3>
              <Activity size={20} color="#64748b" />
            </div>
            <div style={{ fontSize: "2rem", fontWeight: "700" }}>
              {stats?.totalPredictions || 0}
            </div>
          </div>

          <div className="card">
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "1rem",
              }}
            >
              <h3
                style={{
                  fontSize: "0.875rem",
                  fontWeight: "500",
                  color: "#64748b",
                }}
              >
                High Risk Predictions
              </h3>
              <TrendingUp size={20} color="#ef4444" />
            </div>
            <div
              style={{ fontSize: "2rem", fontWeight: "700", color: "#ef4444" }}
            >
              {stats?.diabeticPredictions || 0}
            </div>
          </div>

          <div className="card">
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "1rem",
              }}
            >
              <h3
                style={{
                  fontSize: "0.875rem",
                  fontWeight: "500",
                  color: "#64748b",
                }}
              >
                Low Risk Predictions
              </h3>
              <TrendingDown size={20} color="#10b981" />
            </div>
            <div
              style={{ fontSize: "2rem", fontWeight: "700", color: "#10b981" }}
            >
              {stats?.nonDiabeticPredictions || 0}
            </div>
          </div>
        </div>

        {/* Action Cards */}
        <div
          className="grid md:grid-cols-2"
          style={{ gap: "1.5rem", marginBottom: "2rem" }}
        >
          <div className="card">
            <h3
              style={{
                fontSize: "1.25rem",
                fontWeight: "600",
                marginBottom: "0.5rem",
              }}
            >
              Make New Prediction
            </h3>
            <p style={{ color: "#64748b", marginBottom: "1.5rem" }}>
              Enter your health parameters to get a diabetes risk assessment
            </p>
            <Link
              to="/predict"
              className="btn btn-primary"
              style={{ textDecoration: "none" }}
            >
              <Brain size={16} />
              Start Prediction
            </Link>
          </div>

          <div className="card">
            <h3
              style={{
                fontSize: "1.25rem",
                fontWeight: "600",
                marginBottom: "0.5rem",
              }}
            >
              View History
            </h3>
            <p style={{ color: "#64748b", marginBottom: "1.5rem" }}>
              Review your past predictions and track your health trends
            </p>
            <Link
              to="/history"
              className="btn btn-secondary"
              style={{ textDecoration: "none" }}
            >
              <History size={16} />
              View History
            </Link>
          </div>
        </div>

        {/* Recent Predictions */}
        {recentPredictions.length > 0 && (
          <div className="card">
            <h3
              style={{
                fontSize: "1.25rem",
                fontWeight: "600",
                marginBottom: "1.5rem",
              }}
            >
              Recent Predictions
            </h3>
            <div
              style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
            >
              {recentPredictions.map((prediction) => (
                <div
                  key={prediction.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "1rem",
                    border: "1px solid #e2e8f0",
                    borderRadius: "0.5rem",
                    background: "#f8fafc",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "1rem",
                    }}
                  >
                    {prediction.result.prediction ? (
                      <TrendingUp size={20} color="#ef4444" />
                    ) : (
                      <TrendingDown size={20} color="#10b981" />
                    )}
                    <div>
                      <p style={{ fontWeight: "500", marginBottom: "0.25rem" }}>
                        {prediction.result.prediction
                          ? "High Risk"
                          : "Low Risk"}
                      </p>
                      <p style={{ fontSize: "0.875rem", color: "#64748b" }}>
                        Confidence: {prediction.result.confidence}%
                      </p>
                    </div>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      color: "#64748b",
                    }}
                  >
                    <Calendar size={16} />
                    <span style={{ fontSize: "0.875rem" }}>
                      {new Date(prediction.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            {recentPredictions.length >= 5 && (
              <div style={{ marginTop: "1rem", textAlign: "center" }}>
                <Link
                  to="/history"
                  className="btn btn-secondary"
                  style={{ textDecoration: "none" }}
                >
                  View All Predictions
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Empty State */}
        {recentPredictions.length === 0 && (
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
              No predictions yet
            </h3>
            <p style={{ color: "#64748b", marginBottom: "1.5rem" }}>
              Get started by making your first diabetes risk prediction
            </p>
            <Link
              to="/predict"
              className="btn btn-primary"
              style={{ textDecoration: "none" }}
            >
              <Brain size={16} />
              Make Your First Prediction
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
