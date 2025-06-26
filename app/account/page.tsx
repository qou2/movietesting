"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useDatabase } from "@/hooks/useDatabase"
import { useAuth } from "@/components/auth-guard"
import {
  User,
  Film,
  Tv,
  Clock,
  Key,
  Copy,
  CheckCircle,
  Calendar,
  BarChart3,
  Trophy,
  AlertCircle,
  Eye,
  EyeOff,
  LogOut,
  Lock,
} from "lucide-react"

interface AccessCode {
  code: string
  expiresAt: string
}

interface UserStats {
  totalWatched: number
  moviesWatched: number
  tvShowsWatched: number
  totalFavorites: number
  watchTimeHours: number
  joinDate: string
}

interface LeaderboardEntry {
  id: string
  username: string
  totalWatchHours: number
  totalWatched: number
  joinDate: string
  lastActive: string
}

export default function AccountPage() {
  const { user, logout } = useAuth()
  const { watchHistory, favorites, isLoading } = useDatabase()
  const [accessCode, setAccessCode] = useState<AccessCode | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [copied, setCopied] = useState(false)
  const [userStats, setUserStats] = useState<UserStats | null>(null)
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [generationError, setGenerationError] = useState<string | null>(null)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  // Password change state
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  })
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })

  // Inline styles
  const containerStyle: React.CSSProperties = {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #0a0a0a 0%, #1a0a2e 50%, #0a0a0a 100%)",
    color: "#e0e0e0",
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, sans-serif",
    padding: "2rem",
  }

  const cardStyle: React.CSSProperties = {
    background: "rgba(0, 0, 0, 0.6)",
    border: "2px solid rgba(168, 85, 247, 0.3)",
    borderRadius: "1.5rem",
    backdropFilter: "blur(12px)",
    marginBottom: "2rem",
  }

  const headerStyle: React.CSSProperties = {
    padding: "1.5rem",
    borderBottom: "1px solid rgba(168, 85, 247, 0.2)",
  }

  const contentStyle: React.CSSProperties = {
    padding: "1.5rem",
  }

  const buttonStyle: React.CSSProperties = {
    background: "linear-gradient(135deg, #7c3aed, #ec4899)",
    color: "white",
    padding: "0.75rem 1.5rem",
    borderRadius: "0.75rem",
    border: "none",
    fontWeight: "500",
    cursor: "pointer",
    transition: "all 0.3s ease",
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
  }

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "0.75rem",
    background: "rgba(0, 0, 0, 0.6)",
    border: "1px solid rgba(168, 85, 247, 0.3)",
    borderRadius: "0.75rem",
    color: "white",
    fontSize: "0.875rem",
    outline: "none",
  }

  const showMessage = (type: "success" | "error", text: string) => {
    setMessage({ type, text })
    setTimeout(() => setMessage(null), 5000)
  }

  // Calculate user statistics
  useEffect(() => {
    if (!isLoading && watchHistory) {
      const moviesWatched = watchHistory.filter((item) => item.mediaType === "movie").length
      const tvShowsWatched = watchHistory.filter((item) => item.mediaType === "tv").length

      // Estimate watch time (rough calculation)
      const estimatedWatchTime = watchHistory.reduce((total, item) => {
        if (item.runtime) {
          return total + item.runtime
        }
        // Default estimates: 120 min for movies, 45 min for TV episodes
        return total + (item.mediaType === "movie" ? 120 : 45)
      }, 0)

      setUserStats({
        totalWatched: watchHistory.length,
        moviesWatched,
        tvShowsWatched,
        totalFavorites: favorites.length,
        watchTimeHours: Math.round(estimatedWatchTime / 60),
        joinDate: user ? new Date(user.created_at).toLocaleDateString() : new Date().toLocaleDateString(),
      })
    }
  }, [watchHistory, favorites, isLoading, user])

  // Load leaderboard
  useEffect(() => {
    const loadLeaderboard = async () => {
      try {
        const response = await fetch("/api/leaderboard")
        const data = await response.json()
        if (data.success) {
          setLeaderboard(data.data)
        }
      } catch (error) {
        console.error("Error loading leaderboard:", error)
      }
    }

    loadLeaderboard()
  }, [])

  const generateAccessCode = async () => {
    if (!user) {
      showMessage("error", "User not authenticated")
      return
    }

    setIsGenerating(true)
    setGenerationError(null)

    try {
      console.log("Generating access code for user:", user.id)

      const response = await fetch("/api/generate-access-code", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId: user.id }),
      })

      const data = await response.json()

      console.log("Access code response:", data)

      if (response.ok && data.success) {
        setAccessCode({
          code: data.code,
          expiresAt: data.expiresAt,
        })
        showMessage("success", "Your one-time access code has been created successfully.")
      } else {
        const errorMessage = data.error || `Server error: ${response.status}`
        console.error("Access code generation failed:", errorMessage, data.details)
        setGenerationError(errorMessage)
        showMessage("error", errorMessage)
      }
    } catch (error) {
      console.error("Error generating access code:", error)
      const errorMessage = "Failed to generate access code. Please try again."
      setGenerationError(errorMessage)
      showMessage("error", errorMessage)
    } finally {
      setIsGenerating(false)
    }
  }

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      showMessage("error", "New passwords do not match")
      return
    }

    if (passwordData.newPassword.length < 6) {
      showMessage("error", "New password must be at least 6 characters long")
      return
    }

    setIsChangingPassword(true)

    try {
      const response = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(passwordData),
      })

      const data = await response.json()

      if (data.success) {
        showMessage("success", "Password changed successfully!")
        setPasswordData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        })
      } else {
        showMessage("error", data.error || "Failed to change password")
      }
    } catch (error) {
      showMessage("error", "Failed to change password")
    } finally {
      setIsChangingPassword(false)
    }
  }

  const copyToClipboard = async () => {
    if (!accessCode) return

    try {
      await navigator.clipboard.writeText(accessCode.code)
      setCopied(true)
      showMessage("success", "Access code copied to clipboard.")
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      showMessage("error", "Failed to copy to clipboard.")
    }
  }

  const formatExpiryTime = (expiresAt: string) => {
    const expiry = new Date(expiresAt)
    const now = new Date()
    const diffHours = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60))
    return `${diffHours} hours`
  }

  const getUserRank = () => {
    const userIndex = leaderboard.findIndex((entry) => entry.id === user?.id)
    return userIndex !== -1 ? userIndex + 1 : null
  }

  if (isLoading) {
    return (
      <div style={containerStyle}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "100vh",
            color: "#a855f7",
            fontSize: "1.125rem",
          }}
        >
          Loading account...
        </div>
      </div>
    )
  }

  return (
    <div style={containerStyle}>
      <div style={{ maxWidth: "96rem", margin: "0 auto" }}>
        {/* Message Display */}
        {message && (
          <div
            style={{
              position: "fixed",
              top: "2rem",
              right: "2rem",
              padding: "1rem 1.5rem",
              borderRadius: "0.75rem",
              background: message.type === "success" ? "rgba(34, 197, 94, 0.9)" : "rgba(239, 68, 68, 0.9)",
              color: "white",
              zIndex: 1000,
              animation: "slideIn 0.3s ease-out",
            }}
          >
            {message.text}
          </div>
        )}

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "3rem" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "1rem" }}>
            <div
              style={{
                width: "4rem",
                height: "4rem",
                background: "linear-gradient(135deg, #7c3aed, #ec4899)",
                borderRadius: "1rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginRight: "1rem",
              }}
            >
              <User style={{ width: "2rem", height: "2rem", color: "white" }} />
            </div>
            <div>
              <h1
                style={{
                  fontSize: "2.25rem",
                  fontWeight: "bold",
                  background: "linear-gradient(135deg, #a855f7, #ec4899, #a855f7)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                Welcome back, {user?.username}!
              </h1>
              {getUserRank() && (
                <p style={{ color: "#888", fontSize: "1.125rem" }}>Ranked #{getUserRank()} on the leaderboard</p>
              )}
            </div>
          </div>
          <p style={{ color: "#888", fontSize: "1.125rem" }}>Manage your movie time experience</p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))",
            gap: "2rem",
            marginBottom: "2rem",
          }}
        >
          {/* User Information */}
          <div style={cardStyle}>
            <div style={headerStyle}>
              <h3 style={{ color: "white", fontWeight: "600", display: "flex", alignItems: "center", margin: 0 }}>
                <User style={{ width: "1.25rem", height: "1.25rem", marginRight: "0.5rem", color: "#a855f7" }} />
                Account Information
              </h3>
              <p style={{ color: "#888", fontSize: "0.875rem", margin: "0.5rem 0 0 0" }}>
                Your account details and settings
              </p>
            </div>
            <div style={contentStyle}>
              <div style={{ marginBottom: "1rem" }}>
                <label style={{ fontSize: "0.875rem", color: "#888", display: "block", marginBottom: "0.5rem" }}>
                  Username
                </label>
                <div
                  style={{
                    background: "rgba(168, 85, 247, 0.2)",
                    color: "#a855f7",
                    padding: "0.75rem",
                    borderRadius: "0.5rem",
                    fontSize: "0.875rem",
                  }}
                >
                  {user?.username}
                </div>
              </div>

              <div style={{ marginBottom: "1rem" }}>
                <label style={{ fontSize: "0.875rem", color: "#888", display: "block", marginBottom: "0.25rem" }}>
                  User ID
                </label>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <code
                    style={{
                      background: "rgba(168, 85, 247, 0.2)",
                      color: "#a855f7",
                      padding: "0.75rem",
                      borderRadius: "0.5rem",
                      fontSize: "0.875rem",
                      fontFamily: "monospace",
                      flex: 1,
                      wordBreak: "break-all",
                    }}
                  >
                    {user?.id}
                  </code>
                  <button
                    onClick={() => {
                      if (user?.id) {
                        navigator.clipboard.writeText(user.id)
                        showMessage("success", "User ID copied to clipboard.")
                      }
                    }}
                    style={{
                      ...buttonStyle,
                      background: "rgba(168, 85, 247, 0.2)",
                      border: "1px solid rgba(168, 85, 247, 0.3)",
                      color: "#a855f7",
                      padding: "0.5rem",
                    }}
                  >
                    <Copy style={{ width: "1rem", height: "1rem" }} />
                  </button>
                </div>
              </div>

              <div style={{ marginBottom: "1rem" }}>
                <label style={{ fontSize: "0.875rem", color: "#888", display: "block", marginBottom: "0.25rem" }}>
                  Member Since
                </label>
                <div style={{ display: "flex", alignItems: "center", color: "white" }}>
                  <Calendar style={{ width: "1rem", height: "1rem", marginRight: "0.5rem", color: "#a855f7" }} />
                  {userStats?.joinDate || "Today"}
                </div>
              </div>

              <div style={{ height: "1px", background: "rgba(168, 85, 247, 0.2)", margin: "1rem 0" }} />

              <div>
                <button
                  onClick={logout}
                  style={{
                    ...buttonStyle,
                    background: "rgba(239, 68, 68, 0.2)",
                    border: "1px solid rgba(239, 68, 68, 0.3)",
                    color: "#ef4444",
                    width: "100%",
                    justifyContent: "center",
                  }}
                >
                  <LogOut style={{ width: "1rem", height: "1rem" }} />
                  Sign Out
                </button>
              </div>
            </div>
          </div>

          {/* Statistics */}
          <div style={cardStyle}>
            <div style={headerStyle}>
              <h3 style={{ color: "white", fontWeight: "600", display: "flex", alignItems: "center", margin: 0 }}>
                <BarChart3 style={{ width: "1.25rem", height: "1.25rem", marginRight: "0.5rem", color: "#a855f7" }} />
                Watch Statistics
              </h3>
              <p style={{ color: "#888", fontSize: "0.875rem", margin: "0.5rem 0 0 0" }}>
                Your viewing activity overview
              </p>
            </div>
            <div style={contentStyle}>
              {userStats && (
                <>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
                    <div
                      style={{
                        textAlign: "center",
                        padding: "0.75rem",
                        background: "rgba(168, 85, 247, 0.2)",
                        borderRadius: "0.5rem",
                      }}
                    >
                      <div style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#a855f7" }}>
                        {userStats.totalWatched}
                      </div>
                      <div style={{ fontSize: "0.75rem", color: "#888" }}>Total Watched</div>
                    </div>
                    <div
                      style={{
                        textAlign: "center",
                        padding: "0.75rem",
                        background: "rgba(236, 72, 153, 0.2)",
                        borderRadius: "0.5rem",
                      }}
                    >
                      <div style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#ec4899" }}>
                        {userStats.totalFavorites}
                      </div>
                      <div style={{ fontSize: "0.75rem", color: "#888" }}>Favorites</div>
                    </div>
                  </div>

                  <div style={{ height: "1px", background: "rgba(168, 85, 247, 0.2)", margin: "1rem 0" }} />

                  <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div style={{ display: "flex", alignItems: "center" }}>
                        <Film style={{ width: "1rem", height: "1rem", marginRight: "0.5rem", color: "#a855f7" }} />
                        <span style={{ color: "white" }}>Movies</span>
                      </div>
                      <span
                        style={{
                          background: "rgba(168, 85, 247, 0.2)",
                          color: "#a855f7",
                          padding: "0.25rem 0.5rem",
                          borderRadius: "0.25rem",
                          fontSize: "0.875rem",
                        }}
                      >
                        {userStats.moviesWatched}
                      </span>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div style={{ display: "flex", alignItems: "center" }}>
                        <Tv style={{ width: "1rem", height: "1rem", marginRight: "0.5rem", color: "#3b82f6" }} />
                        <span style={{ color: "white" }}>TV Episodes</span>
                      </div>
                      <span
                        style={{
                          background: "rgba(59, 130, 246, 0.2)",
                          color: "#3b82f6",
                          padding: "0.25rem 0.5rem",
                          borderRadius: "0.25rem",
                          fontSize: "0.875rem",
                        }}
                      >
                        {userStats.tvShowsWatched}
                      </span>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div style={{ display: "flex", alignItems: "center" }}>
                        <Clock style={{ width: "1rem", height: "1rem", marginRight: "0.5rem", color: "#10b981" }} />
                        <span style={{ color: "white" }}>Watch Time</span>
                      </div>
                      <span
                        style={{
                          background: "rgba(16, 185, 129, 0.2)",
                          color: "#10b981",
                          padding: "0.25rem 0.5rem",
                          borderRadius: "0.25rem",
                          fontSize: "0.875rem",
                        }}
                      >
                        ~{userStats.watchTimeHours}h
                      </span>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Password Change */}
        <div style={cardStyle}>
          <div style={headerStyle}>
            <h3 style={{ color: "white", fontWeight: "600", display: "flex", alignItems: "center", margin: 0 }}>
              <Lock style={{ width: "1.25rem", height: "1.25rem", marginRight: "0.5rem", color: "#a855f7" }} />
              Change Password
            </h3>
            <p style={{ color: "#888", fontSize: "0.875rem", margin: "0.5rem 0 0 0" }}>Update your account password</p>
          </div>
          <div style={contentStyle}>
            <form onSubmit={handlePasswordChange}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                  gap: "1rem",
                  marginBottom: "1rem",
                }}
              >
                <div>
                  <label style={{ fontSize: "0.875rem", color: "white", display: "block", marginBottom: "0.5rem" }}>
                    Current Password
                  </label>
                  <div style={{ position: "relative" }}>
                    <input
                      type={showPasswords.current ? "text" : "password"}
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                      style={{ ...inputStyle, paddingRight: "2.5rem" }}
                      placeholder="Enter current password"
                      required
                      disabled={isChangingPassword}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                      style={{
                        position: "absolute",
                        right: "0.75rem",
                        top: "50%",
                        transform: "translateY(-50%)",
                        background: "none",
                        border: "none",
                        color: "#888",
                        cursor: "pointer",
                      }}
                    >
                      {showPasswords.current ? (
                        <EyeOff style={{ width: "1rem", height: "1rem" }} />
                      ) : (
                        <Eye style={{ width: "1rem", height: "1rem" }} />
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: "0.875rem", color: "white", display: "block", marginBottom: "0.5rem" }}>
                    New Password
                  </label>
                  <div style={{ position: "relative" }}>
                    <input
                      type={showPasswords.new ? "text" : "password"}
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                      style={{ ...inputStyle, paddingRight: "2.5rem" }}
                      placeholder="Enter new password"
                      required
                      disabled={isChangingPassword}
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                      style={{
                        position: "absolute",
                        right: "0.75rem",
                        top: "50%",
                        transform: "translateY(-50%)",
                        background: "none",
                        border: "none",
                        color: "#888",
                        cursor: "pointer",
                      }}
                    >
                      {showPasswords.new ? (
                        <EyeOff style={{ width: "1rem", height: "1rem" }} />
                      ) : (
                        <Eye style={{ width: "1rem", height: "1rem" }} />
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: "0.875rem", color: "white", display: "block", marginBottom: "0.5rem" }}>
                    Confirm Password
                  </label>
                  <div style={{ position: "relative" }}>
                    <input
                      type={showPasswords.confirm ? "text" : "password"}
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                      style={{ ...inputStyle, paddingRight: "2.5rem" }}
                      placeholder="Confirm new password"
                      required
                      disabled={isChangingPassword}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                      style={{
                        position: "absolute",
                        right: "0.75rem",
                        top: "50%",
                        transform: "translateY(-50%)",
                        background: "none",
                        border: "none",
                        color: "#888",
                        cursor: "pointer",
                      }}
                    >
                      {showPasswords.confirm ? (
                        <EyeOff style={{ width: "1rem", height: "1rem" }} />
                      ) : (
                        <Eye style={{ width: "1rem", height: "1rem" }} />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={isChangingPassword}
                style={{
                  ...buttonStyle,
                  opacity: isChangingPassword ? 0.5 : 1,
                  cursor: isChangingPassword ? "not-allowed" : "pointer",
                }}
              >
                {isChangingPassword ? "Changing Password..." : "Change Password"}
              </button>
            </form>
          </div>
        </div>

        {/* Leaderboard */}
        <div style={cardStyle}>
          <div style={headerStyle}>
            <h3 style={{ color: "white", fontWeight: "600", display: "flex", alignItems: "center", margin: 0 }}>
              <Trophy style={{ width: "1.25rem", height: "1.25rem", marginRight: "0.5rem", color: "#eab308" }} />
              Leaderboard
            </h3>
            <p style={{ color: "#888", fontSize: "0.875rem", margin: "0.5rem 0 0 0" }}>Top users by watch time</p>
          </div>
          <div style={contentStyle}>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.75rem",
                maxHeight: "24rem",
                overflowY: "auto",
              }}
            >
              {leaderboard.slice(0, 10).map((entry, index) => (
                <div
                  key={entry.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "0.75rem",
                    borderRadius: "0.5rem",
                    background: entry.id === user?.id ? "rgba(168, 85, 247, 0.3)" : "rgba(0, 0, 0, 0.4)",
                    border: entry.id === user?.id ? "1px solid rgba(168, 85, 247, 0.5)" : "none",
                    transition: "background 0.3s ease",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    <div
                      style={{
                        width: "2rem",
                        height: "2rem",
                        borderRadius: "50%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: "bold",
                        fontSize: "0.875rem",
                        background:
                          index === 0
                            ? "#eab308"
                            : index === 1
                              ? "#9ca3af"
                              : index === 2
                                ? "#d97706"
                                : "rgba(168, 85, 247, 0.5)",
                        color: index < 3 ? "black" : "white",
                      }}
                    >
                      {index + 1}
                    </div>
                    <div>
                      <div style={{ color: "white", fontWeight: "500" }}>{entry.username}</div>
                      <div style={{ fontSize: "0.75rem", color: "#888" }}>{entry.totalWatched} items watched</div>
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ color: "white", fontWeight: "bold" }}>{entry.totalWatchHours}h</div>
                    <div style={{ fontSize: "0.75rem", color: "#888" }}>watch time</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Access Code Generator */}
        <div style={cardStyle}>
          <div style={headerStyle}>
            <h3 style={{ color: "white", fontWeight: "600", display: "flex", alignItems: "center", margin: 0 }}>
              <Key style={{ width: "1.25rem", height: "1.25rem", marginRight: "0.5rem", color: "#a855f7" }} />
              One-Time Access Code
            </h3>
            <p style={{ color: "#888", fontSize: "0.875rem", margin: "0.5rem 0 0 0" }}>
              Generate a temporary access code to share with others. Each code can only be used once and expires in 24
              hours.
            </p>
          </div>
          <div style={contentStyle}>
            {generationError && (
              <div
                style={{
                  padding: "0.75rem",
                  background: "rgba(239, 68, 68, 0.2)",
                  border: "1px solid rgba(239, 68, 68, 0.3)",
                  borderRadius: "0.75rem",
                  color: "#ef4444",
                  fontSize: "0.875rem",
                  display: "flex",
                  alignItems: "center",
                  marginBottom: "1.5rem",
                }}
              >
                <AlertCircle style={{ width: "1rem", height: "1rem", marginRight: "0.5rem", flexShrink: 0 }} />
                {generationError}
              </div>
            )}

            {!accessCode ? (
              <div style={{ textAlign: "center", padding: "2rem 0" }}>
                <div
                  style={{
                    width: "4rem",
                    height: "4rem",
                    background: "rgba(168, 85, 247, 0.2)",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto 1rem auto",
                  }}
                >
                  <Key style={{ width: "2rem", height: "2rem", color: "#a855f7" }} />
                </div>
                <p style={{ color: "#888", marginBottom: "1rem" }}>No active access code</p>
                <button
                  onClick={generateAccessCode}
                  disabled={isGenerating}
                  style={{
                    ...buttonStyle,
                    opacity: isGenerating ? 0.5 : 1,
                    cursor: isGenerating ? "not-allowed" : "pointer",
                  }}
                >
                  {isGenerating ? "Generating..." : "Generate Access Code"}
                </button>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <div
                  style={{
                    padding: "1.5rem",
                    background: "linear-gradient(135deg, rgba(168, 85, 247, 0.2), rgba(236, 72, 153, 0.2))",
                    borderRadius: "0.75rem",
                    border: "1px solid rgba(168, 85, 247, 0.3)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: "1rem",
                    }}
                  >
                    <h4 style={{ fontSize: "1.125rem", fontWeight: "600", color: "white" }}>Active Access Code</h4>
                    <span
                      style={{
                        background: "rgba(34, 197, 94, 0.2)",
                        color: "#22c55e",
                        padding: "0.25rem 0.5rem",
                        borderRadius: "0.25rem",
                        fontSize: "0.75rem",
                        border: "1px solid rgba(34, 197, 94, 0.3)",
                      }}
                    >
                      Active
                    </span>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1rem" }}>
                    <code
                      style={{
                        background: "rgba(0, 0, 0, 0.4)",
                        color: "#a855f7",
                        padding: "0.75rem 1rem",
                        borderRadius: "0.5rem",
                        fontSize: "1.25rem",
                        fontFamily: "monospace",
                        letterSpacing: "0.1em",
                        flex: 1,
                        textAlign: "center",
                        border: "1px solid rgba(168, 85, 247, 0.3)",
                      }}
                    >
                      {accessCode.code}
                    </code>
                    <button
                      onClick={copyToClipboard}
                      style={{
                        ...buttonStyle,
                        background: "rgba(168, 85, 247, 0.2)",
                        border: "1px solid rgba(168, 85, 247, 0.3)",
                        color: "#a855f7",
                        padding: "0.75rem",
                      }}
                    >
                      {copied ? (
                        <CheckCircle style={{ width: "1rem", height: "1rem", color: "#22c55e" }} />
                      ) : (
                        <Copy style={{ width: "1rem", height: "1rem" }} />
                      )}
                    </button>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      fontSize: "0.875rem",
                    }}
                  >
                    <span style={{ color: "#888" }}>Expires in: {formatExpiryTime(accessCode.expiresAt)}</span>
                    <button
                      onClick={generateAccessCode}
                      disabled={isGenerating}
                      style={{
                        background: "none",
                        border: "none",
                        color: "#a855f7",
                        cursor: "pointer",
                        fontSize: "0.875rem",
                        opacity: isGenerating ? 0.5 : 1,
                      }}
                    >
                      Generate New
                    </button>
                  </div>
                </div>

                <div
                  style={{
                    padding: "1rem",
                    background: "rgba(245, 158, 11, 0.1)",
                    border: "1px solid rgba(245, 158, 11, 0.3)",
                    borderRadius: "0.5rem",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "flex-start", gap: "0.5rem" }}>
                    <div
                      style={{
                        width: "1.25rem",
                        height: "1.25rem",
                        background: "#f59e0b",
                        borderRadius: "50%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                        marginTop: "0.125rem",
                      }}
                    >
                      <span style={{ color: "black", fontSize: "0.75rem", fontWeight: "bold" }}>!</span>
                    </div>
                    <div style={{ fontSize: "0.875rem", color: "#fbbf24" }}>
                      <p style={{ fontWeight: "500", marginBottom: "0.25rem" }}>Important:</p>
                      <ul style={{ margin: 0, paddingLeft: "1rem", color: "rgba(251, 191, 36, 0.8)" }}>
                        <li>This code can only be used once by others</li>
                        <li>It will expire in 24 hours</li>
                        <li>Generating a new code will deactivate the current one</li>
                        <li>Share this code securely with trusted users only</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <div style={{ marginTop: "3rem", textAlign: "center" }}>
          <button
            onClick={() => (window.location.href = "/")}
            style={{
              ...buttonStyle,
              background: "rgba(168, 85, 247, 0.2)",
              border: "1px solid rgba(168, 85, 247, 0.3)",
              color: "#a855f7",
            }}
          >
            Back to Movie Time
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  )
}
