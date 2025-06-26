"use client"

import type React from "react"
import { useState } from "react"
import { Play, User, UserPlus, Eye, EyeOff, AlertCircle } from "lucide-react"

interface AuthPageProps {
  onAuthSuccess: () => void
}

export default function AuthPage({ onAuthSuccess }: AuthPageProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [activeTab, setActiveTab] = useState<"login" | "register">("login")

  // Login form state
  const [loginData, setLoginData] = useState({
    username: "",
    password: "",
  })

  // Register form state
  const [registerData, setRegisterData] = useState({
    username: "",
    password: "",
    confirmPassword: "",
    accessCode: "",
  })

  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const showToast = (title: string, description: string) => {
    setSuccess(`${title}: ${description}`)
    setTimeout(() => setSuccess(""), 5000)
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")
    setSuccess("")

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(loginData),
      })

      const data = await response.json()

      if (data.success) {
        showToast("Welcome back!", `Logged in as ${data.user.username}`)
        setTimeout(() => onAuthSuccess(), 1000)
      } else {
        setError(data.error || "Login failed")
      }
    } catch (error) {
      setError("Network error. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")
    setSuccess("")

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(registerData),
      })

      const data = await response.json()

      if (data.success) {
        showToast("Account created!", `Welcome to Movie Time, ${data.user.username}!`)
        setTimeout(() => onAuthSuccess(), 1000)
      } else {
        setError(data.error || "Registration failed")
      }
    } catch (error) {
      setError("Network error. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const containerStyle: React.CSSProperties = {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #0a0a0a 0%, #1a0a2e 50%, #0a0a0a 100%)",
    color: "#e0e0e0",
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, sans-serif",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "2rem",
  }

  const cardStyle: React.CSSProperties = {
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    border: "2px solid rgba(147, 51, 234, 0.3)",
    borderRadius: "12px",
    padding: "2rem",
    width: "100%",
    maxWidth: "400px",
    backdropFilter: "blur(12px)",
    boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
  }

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "0.75rem",
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    border: "1px solid rgba(147, 51, 234, 0.3)",
    borderRadius: "6px",
    color: "white",
    fontSize: "1rem",
    outline: "none",
  }

  const buttonStyle: React.CSSProperties = {
    width: "100%",
    padding: "0.75rem 1rem",
    background: "linear-gradient(135deg, #9333ea 0%, #ec4899 100%)",
    color: "white",
    border: "none",
    borderRadius: "6px",
    fontSize: "1rem",
    fontWeight: "600",
    cursor: isLoading ? "not-allowed" : "pointer",
    opacity: isLoading ? 0.7 : 1,
    transition: "all 0.2s",
  }

  const tabStyle: React.CSSProperties = {
    flex: 1,
    padding: "0.75rem",
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    color: "white",
    border: "none",
    cursor: "pointer",
    fontSize: "0.875rem",
    fontWeight: "500",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "0.5rem",
    transition: "all 0.2s",
  }

  const activeTabStyle: React.CSSProperties = {
    ...tabStyle,
    backgroundColor: "#9333ea",
  }

  return (
    <div style={containerStyle}>
      <div style={{ width: "100%", maxWidth: "400px" }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "1rem" }}>
            <div
              style={{
                width: "48px",
                height: "48px",
                background: "linear-gradient(135deg, #9333ea 0%, #ec4899 100%)",
                borderRadius: "12px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginRight: "1rem",
              }}
            >
              <Play size={24} color="white" />
            </div>
            <h1
              style={{
                fontSize: "2.5rem",
                fontWeight: "bold",
                background: "linear-gradient(135deg, #a855f7 0%, #f472b6 50%, #9333ea 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                margin: 0,
              }}
            >
              movie time
            </h1>
          </div>
          <p style={{ color: "#888", fontSize: "1.125rem", margin: 0 }}>Sign in to access unlimited streaming</p>
        </div>

        <div style={cardStyle}>
          {/* Header */}
          <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
            <h2 style={{ color: "white", fontSize: "1.5rem", fontWeight: "600", margin: "0 0 0.5rem 0" }}>Welcome</h2>
            <p style={{ color: "#888", fontSize: "0.875rem", margin: 0 }}>
              Sign in to your account or create a new one
            </p>
          </div>

          {/* Tabs */}
          <div style={{ display: "flex", marginBottom: "1.5rem", borderRadius: "6px", overflow: "hidden" }}>
            <button style={activeTab === "login" ? activeTabStyle : tabStyle} onClick={() => setActiveTab("login")}>
              <User size={16} />
              Sign In
            </button>
            <button
              style={activeTab === "register" ? activeTabStyle : tabStyle}
              onClick={() => setActiveTab("register")}
            >
              <UserPlus size={16} />
              Sign Up
            </button>
          </div>

          {/* Success Message */}
          {success && (
            <div
              style={{
                padding: "0.75rem",
                backgroundColor: "rgba(34, 197, 94, 0.1)",
                border: "1px solid rgba(34, 197, 94, 0.3)",
                borderRadius: "6px",
                color: "#4ade80",
                fontSize: "0.875rem",
                marginBottom: "1rem",
              }}
            >
              {success}
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div
              style={{
                padding: "0.75rem",
                backgroundColor: "rgba(239, 68, 68, 0.1)",
                border: "1px solid rgba(239, 68, 68, 0.3)",
                borderRadius: "6px",
                color: "#f87171",
                fontSize: "0.875rem",
                marginBottom: "1rem",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
              }}
            >
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          {/* Login Form */}
          {activeTab === "login" && (
            <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div>
                <label style={{ display: "block", color: "white", fontSize: "0.875rem", marginBottom: "0.5rem" }}>
                  Username
                </label>
                <input
                  type="text"
                  value={loginData.username}
                  onChange={(e) => setLoginData({ ...loginData, username: e.target.value })}
                  placeholder="Enter your username"
                  required
                  disabled={isLoading}
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={{ display: "block", color: "white", fontSize: "0.875rem", marginBottom: "0.5rem" }}>
                  Password
                </label>
                <div style={{ position: "relative" }}>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={loginData.password}
                    onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                    placeholder="Enter your password"
                    required
                    disabled={isLoading}
                    style={{ ...inputStyle, paddingRight: "3rem" }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: "absolute",
                      right: "0.75rem",
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: "none",
                      border: "none",
                      color: "#888",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <button type="submit" disabled={isLoading} style={buttonStyle}>
                {isLoading ? "Signing in..." : "Sign In"}
              </button>
            </form>
          )}

          {/* Register Form */}
          {activeTab === "register" && (
            <form onSubmit={handleRegister} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div>
                <label style={{ display: "block", color: "white", fontSize: "0.875rem", marginBottom: "0.5rem" }}>
                  Username
                </label>
                <input
                  type="text"
                  value={registerData.username}
                  onChange={(e) => setRegisterData({ ...registerData, username: e.target.value })}
                  placeholder="Choose a username (min 3 characters)"
                  required
                  disabled={isLoading}
                  minLength={3}
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={{ display: "block", color: "white", fontSize: "0.875rem", marginBottom: "0.5rem" }}>
                  Password
                </label>
                <div style={{ position: "relative" }}>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={registerData.password}
                    onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                    placeholder="Create a password (min 6 characters)"
                    required
                    disabled={isLoading}
                    minLength={6}
                    style={{ ...inputStyle, paddingRight: "3rem" }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: "absolute",
                      right: "0.75rem",
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: "none",
                      border: "none",
                      color: "#888",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <div>
                <label style={{ display: "block", color: "white", fontSize: "0.875rem", marginBottom: "0.5rem" }}>
                  Confirm Password
                </label>
                <div style={{ position: "relative" }}>
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={registerData.confirmPassword}
                    onChange={(e) => setRegisterData({ ...registerData, confirmPassword: e.target.value })}
                    placeholder="Confirm your password"
                    required
                    disabled={isLoading}
                    style={{ ...inputStyle, paddingRight: "3rem" }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    style={{
                      position: "absolute",
                      right: "0.75rem",
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: "none",
                      border: "none",
                      color: "#888",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <div>
                <label style={{ display: "block", color: "white", fontSize: "0.875rem", marginBottom: "0.5rem" }}>
                  Access Code
                </label>
                <input
                  type="text"
                  value={registerData.accessCode}
                  onChange={(e) => setRegisterData({ ...registerData, accessCode: e.target.value.toUpperCase() })}
                  placeholder="Enter your access code"
                  required
                  disabled={isLoading}
                  style={{ ...inputStyle, fontFamily: "monospace" }}
                />
                <p style={{ fontSize: "0.75rem", color: "#666", margin: "0.25rem 0 0 0" }}>
                  You need a valid access code to create an account
                </p>
              </div>
              <button type="submit" disabled={isLoading} style={buttonStyle}>
                {isLoading ? "Creating account..." : "Create Account"}
              </button>
            </form>
          )}
        </div>

        <div style={{ marginTop: "2rem", textAlign: "center" }}>
          <p style={{ color: "#666", fontSize: "0.875rem", margin: 0 }}>
            Need an access code? Contact an administrator
          </p>
        </div>
      </div>
    </div>
  )
}
