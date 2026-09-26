import React, { useState } from "react";
import { Link } from "react-router";
import { motion } from "framer-motion";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";

function GoogleIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

const inputStyle = {
  width: "100%",
  padding: "12px 16px",
  borderRadius: 12,
  backgroundColor: "#111111",
  border: "1px solid #2B2B2B",
  color: "#FAFAFA",
  fontSize: 14,
  outline: "none",
  transition: "border-color 0.2s ease",
  fontFamily: "'DM Sans', sans-serif",
};

function PasswordField({ id, label, name, value, onChange, placeholder }) {
  const [show, setShow] = useState(false);
  return (
    <div>
      <label htmlFor={id} style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#A3A3A3", marginBottom: 8 }}>
        {label}
      </label>
      <div style={{ position: "relative" }}>
        <input
          id={id}
          type={show ? "text" : "password"}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          style={{ ...inputStyle, paddingRight: 44 }}
          onFocus={(e) => (e.currentTarget.style.borderColor = "#D4A017")}
          onBlur={(e) => (e.currentTarget.style.borderColor = "#2B2B2B")}
        />
        <button
          type="button"
          onClick={() => setShow((v) => !v)}
          style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#A3A3A3", display: "flex" }}
        >
          {show ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24M1 1l22 22"/></svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
          )}
        </button>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  const [form, setForm] = useState({ name: "", email: "", password: "", confirmPassword: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { registerWithEmail, loginWithGoogle } = useAuth();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  };

  const mismatch = form.confirmPassword && form.password !== form.confirmPassword;

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password || !form.confirmPassword) {
      setError("Please fill in all required fields.");
      return;
    }
    if (mismatch) {
      setError("Passwords do not match.");
      return;
    }
    if (form.password.length < 6) {
      setError("Password should be at least 6 characters long.");
      return;
    }

    try {
      setError("");
      setLoading(true);
      await registerWithEmail(form.email, form.password, form.name);
    } catch (err) {
      console.error("Registration error:", err);
      if (err.code === "auth/email-already-in-use") {
        setError("An account with this email already exists.");
      } else if (err.code === "auth/weak-password") {
        setError("Password is too weak. Please use a stronger password.");
      } else {
        setError("Failed to create an account. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setError("");
      setLoading(true);
      await loginWithGoogle();
    } catch (err) {
      console.error("Google sign-in error:", err);
      setError("Google sign-in was cancelled or failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ backgroundColor: "#0A0A0A", minHeight: "100vh" }}>
      <Navbar />

      <div
        className="notebook-grid"
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "130px 24px 80px",
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          style={{ width: "100%", maxWidth: 390 }}
        >
          {/* Header */}
          <div style={{ textAlign: "center", marginBottom: 32 }}>
            <h1
              style={{
                fontFamily: "'Space Grotesk', system-ui, sans-serif",
                fontSize: 32,
                fontWeight: 700,
                color: "#FAFAFA",
                margin: "0 0 8px",
                letterSpacing: "-0.02em",
              }}
            >
              Create your account
            </h1>
            <p style={{ color: "#A3A3A3", fontSize: 14, margin: 0 }}>
              Start organising your academic life today.
            </p>
          </div>

          {/* Error Banner */}
          {error && (
            <div
              style={{
                backgroundColor: "rgba(239, 68, 68, 0.1)",
                border: "1px solid rgba(239, 68, 68, 0.3)",
                color: "#EF4444",
                borderRadius: 10,
                padding: "10px 14px",
                fontSize: 13,
                marginBottom: 20,
                textAlign: "center",
              }}
            >
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleRegisterSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {/* Full Name */}
            <div>
              <label htmlFor="register-name" style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#A3A3A3", marginBottom: 8 }}>
                Full Name
              </label>
              <input
                id="register-name"
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Alex Johnson"
                style={inputStyle}
                onFocus={(e) => (e.currentTarget.style.borderColor = "#D4A017")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "#2B2B2B")}
              />
            </div>

            {/* Email */}
            <div>
              <label htmlFor="register-email" style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#A3A3A3", marginBottom: 8 }}>
                Email address
              </label>
              <input
                id="register-email"
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="you@university.edu"
                style={inputStyle}
                onFocus={(e) => (e.currentTarget.style.borderColor = "#D4A017")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "#2B2B2B")}
              />
            </div>

            <PasswordField
              id="register-password"
              label="Password"
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="••••••••"
            />

            {/* Confirm Password */}
            <div>
              <label htmlFor="register-confirm" style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#A3A3A3", marginBottom: 8 }}>
                Confirm Password
              </label>
              <input
                id="register-confirm"
                type="password"
                name="confirmPassword"
                value={form.confirmPassword}
                onChange={handleChange}
                placeholder="••••••••"
                style={{ ...inputStyle, borderColor: mismatch ? "#EF4444" : "#2B2B2B" }}
                onFocus={(e) => (e.currentTarget.style.borderColor = mismatch ? "#EF4444" : "#D4A017")}
                onBlur={(e) => (e.currentTarget.style.borderColor = mismatch ? "#EF4444" : "#2B2B2B")}
              />
              {mismatch && (
                <p style={{ color: "#EF4444", fontSize: 12, marginTop: 6 }}>Passwords do not match.</p>
              )}
            </div>

            <button
              id="register-submit"
              type="submit"
              disabled={loading}
              style={{
                width: "100%",
                padding: "13px 0",
                borderRadius: 12,
                backgroundColor: "#D4A017",
                color: "#0A0A0A",
                fontWeight: 600,
                fontSize: 15,
                border: "none",
                cursor: loading ? "wait" : "pointer",
                transition: "background 0.2s ease, transform 0.15s ease, box-shadow 0.2s ease",
                fontFamily: "'DM Sans', sans-serif",
                boxShadow: "0 2px 10px rgba(212, 160, 23, 0.2)",
                marginTop: 4,
                opacity: loading ? 0.7 : 1,
              }}
              onMouseEnter={(e) => { if (!loading) { e.currentTarget.style.backgroundColor = "#E4B63B"; e.currentTarget.style.transform = "translateY(-1px)"; } }}
              onMouseLeave={(e) => { if (!loading) { e.currentTarget.style.backgroundColor = "#D4A017"; e.currentTarget.style.transform = "translateY(0)"; } }}
            >
              {loading ? "Creating account..." : "Create Account"}
            </button>
          </form>

          {/* Divider */}
          <div style={{ display: "flex", alignItems: "center", gap: 14, margin: "24px 0" }}>
            <div style={{ flex: 1, height: 1, backgroundColor: "#2B2B2B" }} />
            <span style={{ color: "#A3A3A3", fontSize: 12, textTransform: "uppercase", letterSpacing: "0.05em" }}>or</span>
            <div style={{ flex: 1, height: 1, backgroundColor: "#2B2B2B" }} />
          </div>

          {/* Google Register Button */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
              padding: "12px 0",
              borderRadius: 12,
              backgroundColor: "#111111",
              border: "1px solid #2B2B2B",
              color: "#FAFAFA",
              fontSize: 14,
              fontWeight: 500,
              cursor: loading ? "wait" : "pointer",
              transition: "border-color 0.2s ease, background-color 0.2s ease",
              fontFamily: "'DM Sans', sans-serif",
              opacity: loading ? 0.7 : 1,
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                e.currentTarget.style.borderColor = "#D4A017";
                e.currentTarget.style.backgroundColor = "rgba(212, 160, 23, 0.05)";
              }
            }}
            onMouseLeave={(e) => {
              if (!loading) {
                e.currentTarget.style.borderColor = "#2B2B2B";
                e.currentTarget.style.backgroundColor = "#111111";
              }
            }}
          >
            <GoogleIcon />
            Continue with Google
          </button>

          <p style={{ textAlign: "center", fontSize: 13, color: "#A3A3A3", margin: "24px 0 0" }}>
            Already have an account?{" "}
            <Link to="/login" style={{ color: "#D4A017", fontWeight: 600, textDecoration: "none" }}>
              Login
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
