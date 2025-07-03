"use client"

import { Link } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext.jsx"
import { Activity, Shield, TrendingUp, Users, ArrowRight } from "lucide-react"

const Home = () => {
  const { user } = useAuth()

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" }}>
      {/* Hero Section */}
      <section style={{ padding: "4rem 0", color: "white" }}>
        <div className="container text-center">
          <h1
            style={{
              fontSize: "3.5rem",
              fontWeight: "800",
              marginBottom: "1.5rem",
              lineHeight: "1.1",
            }}
          >
            Predict Diabetes Risk with <span style={{ color: "#60a5fa" }}>AI Precision</span>
          </h1>
          <p
            style={{
              fontSize: "1.25rem",
              marginBottom: "2rem",
              opacity: 0.9,
              maxWidth: "600px",
              margin: "0 auto 2rem",
            }}
          >
            Advanced machine learning model to assess your diabetes risk based on key health parameters. Track your
            health journey with personalized insights and historical data.
          </p>
          <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
            {user ? (
              <>
                <Link
                  to="/dashboard"
                  className="btn btn-primary"
                  style={{
                    textDecoration: "none",
                    fontSize: "1.1rem",
                    padding: "1rem 2rem",
                  }}
                >
                  Go to Dashboard
                  <ArrowRight size={20} />
                </Link>
                <Link
                  to="/predict"
                  className="btn btn-secondary"
                  style={{
                    textDecoration: "none",
                    fontSize: "1.1rem",
                    padding: "1rem 2rem",
                    background: "rgba(255, 255, 255, 0.2)",
                    color: "white",
                    border: "1px solid rgba(255, 255, 255, 0.3)",
                  }}
                >
                  Make Prediction
                </Link>
              </>
            ) : (
              <>
                <Link
                  to="/register"
                  className="btn btn-primary"
                  style={{
                    textDecoration: "none",
                    fontSize: "1.1rem",
                    padding: "1rem 2rem",
                  }}
                >
                  Get Started Free
                  <ArrowRight size={20} />
                </Link>
                <Link
                  to="/login"
                  className="btn btn-secondary"
                  style={{
                    textDecoration: "none",
                    fontSize: "1.1rem",
                    padding: "1rem 2rem",
                    background: "rgba(255, 255, 255, 0.2)",
                    color: "white",
                    border: "1px solid rgba(255, 255, 255, 0.3)",
                  }}
                >
                  Sign In
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section style={{ padding: "4rem 0", background: "white" }}>
        <div className="container">
          <div className="grid md:grid-cols-3" style={{ gap: "2rem" }}>
            <div className="card text-center">
              <Shield size={48} color="#3b82f6" style={{ margin: "0 auto 1rem" }} />
              <h3 style={{ fontSize: "1.5rem", fontWeight: "600", marginBottom: "1rem" }}>Secure & Private</h3>
              <p style={{ color: "#64748b" }}>
                Your health data is encrypted and stored securely. We prioritize your privacy above all.
              </p>
            </div>
            <div className="card text-center">
              <TrendingUp size={48} color="#10b981" style={{ margin: "0 auto 1rem" }} />
              <h3 style={{ fontSize: "1.5rem", fontWeight: "600", marginBottom: "1rem" }}>AI-Powered Predictions</h3>
              <p style={{ color: "#64748b" }}>
                Our custom machine learning model provides accurate diabetes risk assessments based on clinical data.
              </p>
            </div>
            <div className="card text-center">
              <Users size={48} color="#8b5cf6" style={{ margin: "0 auto 1rem" }} />
              <h3 style={{ fontSize: "1.5rem", fontWeight: "600", marginBottom: "1rem" }}>Track Your History</h3>
              <p style={{ color: "#64748b" }}>
                Monitor your health trends over time with comprehensive prediction history and insights.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section
        style={{
          padding: "4rem 0",
          background: "#1e293b",
          color: "white",
        }}
      >
        <div className="container text-center">
          <h2 style={{ fontSize: "2.5rem", fontWeight: "700", marginBottom: "1rem" }}>
            Ready to Take Control of Your Health?
          </h2>
          <p
            style={{
              fontSize: "1.25rem",
              marginBottom: "2rem",
              opacity: 0.8,
            }}
          >
            Join the growing number of people who trust our system to stay on top of their health.
          </p>
          {!user && (
            <Link
              to="/register"
              className="btn btn-primary"
              style={{
                textDecoration: "none",
                fontSize: "1.1rem",
                padding: "1rem 2rem",
              }}
            >
              Start Your Health Journey
              <ArrowRight size={20} />
            </Link>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer
        style={{
          background: "#0f172a",
          color: "white",
          padding: "2rem 0",
          textAlign: "center",
        }}
      >
        <div className="container">
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.5rem",
              marginBottom: "1rem",
            }}
          >
            <Activity size={24} />
            <span style={{ fontSize: "1.25rem", fontWeight: "600" }}>Predict Diabetes</span>
          </div>
          <p style={{ opacity: 0.7 }}>
            © 2025 Smart Health Care System. All rights reserved. This tool is for educational and informational purpose only.
          </p>
        </div>
      </footer>
    </div>
  )
}

export default Home
