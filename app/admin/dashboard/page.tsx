"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  Shield,
  Users,
  Key,
  BarChart3,
  Settings,
  LogOut,
  Trash2,
  RefreshCw,
  Clock,
  Film,
  Tv,
  Heart,
  TrendingUp,
  UserX,
  AlertTriangle,
} from "lucide-react"

interface AdminStats {
  totalUsers: number
  activeUsers: number
  totalAccessCodes: number
  activeAccessCodes: number
  totalWatchTime: number
  totalMoviesWatched: number
  totalTvWatched: number
  totalFavorites: number
}

interface UserData {
  id: string
  username: string
  lastActive: string
  totalWatched: number
  totalFavorites: number
  joinDate: string
}

interface AccessCodeData {
  id: string
  code: string
  createdBy: string
  createdAt: string
  expiresAt: string
  isUsed: boolean
  usedBy?: string
  usedAt?: string
}

export default function AdminDashboard() {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [users, setUsers] = useState<UserData[]>([])
  const [accessCodes, setAccessCodes] = useState<AccessCodeData[]>([])
  const [activeTab, setActiveTab] = useState<"overview" | "users" | "codes" | "settings">("overview")
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [confirmDialog, setConfirmDialog] = useState<{
    show: boolean
    type: "revoke" | "remove"
    id: string
    title: string
    message: string
  } | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)

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
    border: "2px solid rgba(239, 68, 68, 0.3)",
    borderRadius: "1.5rem",
    backdropFilter: "blur(12px)",
  }

  const headerStyle: React.CSSProperties = {
    padding: "1.5rem",
    borderBottom: "1px solid rgba(239, 68, 68, 0.2)",
  }

  const contentStyle: React.CSSProperties = {
    padding: "1.5rem",
  }

  const buttonStyle: React.CSSProperties = {
    background: "linear-gradient(135deg, #dc2626, #f97316)",
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

  const tabStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    padding: "0.75rem 1.5rem",
    borderRadius: "0.75rem",
    fontWeight: "500",
    transition: "all 0.3s ease",
    border: "2px solid",
    cursor: "pointer",
  }

  const modalStyle: React.CSSProperties = {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "rgba(0, 0, 0, 0.8)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
  }

  const modalContentStyle: React.CSSProperties = {
    background: "rgba(0, 0, 0, 0.9)",
    border: "2px solid rgba(239, 68, 68, 0.3)",
    borderRadius: "1rem",
    padding: "2rem",
    maxWidth: "400px",
    width: "90%",
    textAlign: "center",
  }

  const showMessage = (type: "success" | "error", text: string) => {
    setMessage({ type, text })
    setTimeout(() => setMessage(null), 5000)
  }

  const showConfirmDialog = (type: "revoke" | "remove", id: string, title: string, message: string) => {
    setConfirmDialog({ show: true, type, id, title, message })
  }

  const hideConfirmDialog = () => {
    setConfirmDialog(null)
  }

  useEffect(() => {
    // Check admin authentication
    const adminAuth = localStorage.getItem("admin_authenticated")
    const adminAuthTime = localStorage.getItem("admin_auth_time")

    if (adminAuth === "true" && adminAuthTime) {
      const authTime = Number.parseInt(adminAuthTime)
      const now = Date.now()
      const fourHours = 4 * 60 * 60 * 1000

      if (now - authTime < fourHours) {
        setIsAuthenticated(true)
        loadDashboardData()
      } else {
        // Session expired
        handleLogout()
      }
    } else {
      router.push("/admin")
    }

    setIsLoading(false)
  }, [router])

  const loadDashboardData = async () => {
    try {
      setIsLoading(true)

      // Add cache busting timestamp
      const timestamp = Date.now()

      // Load admin statistics with cache busting
      const statsResponse = await fetch(`/api/admin/stats?t=${timestamp}`, {
        cache: "no-store",
        headers: {
          "Cache-Control": "no-cache",
        },
      })
      if (statsResponse.ok) {
        const statsData = await statsResponse.json()
        console.log("Stats loaded:", statsData)
        setStats(statsData.data)
      } else {
        console.error("Failed to load stats:", statsResponse.status)
      }

      // Load users data with cache busting
      const usersResponse = await fetch(`/api/admin/users?t=${timestamp}`, {
        cache: "no-store",
        headers: {
          "Cache-Control": "no-cache",
        },
      })
      if (usersResponse.ok) {
        const usersData = await usersResponse.json()
        console.log("Users loaded:", usersData.data?.length || 0, "users")
        setUsers(usersData.data || [])
      } else {
        console.error("Failed to load users:", usersResponse.status)
      }

      // Load access codes with cache busting
      const codesResponse = await fetch(`/api/admin/access-codes?t=${timestamp}`, {
        cache: "no-store",
        headers: {
          "Cache-Control": "no-cache",
        },
      })
      if (codesResponse.ok) {
        const codesData = await codesResponse.json()
        console.log("Access codes loaded:", codesData.data?.length || 0, "codes")
        setAccessCodes(codesData.data || [])
      } else {
        console.error("Failed to load access codes:", codesResponse.status)
      }

      showMessage("success", "Dashboard data refreshed successfully")
    } catch (error) {
      console.error("Error loading dashboard data:", error)
      showMessage("error", "Failed to load dashboard data")
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem("admin_authenticated")
    localStorage.removeItem("admin_auth_time")
    router.push("/admin")
  }

  const revokeAccessCode = async (codeId: string) => {
    try {
      console.log("Revoking access code:", codeId)
      const response = await fetch("/api/admin/revoke-access-code", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ codeId }),
      })

      const data = await response.json()
      console.log("Revoke response:", data)

      if (response.ok && data.success) {
        showMessage("success", "Access code revoked successfully")
        loadDashboardData()
      } else {
        throw new Error(data.error || "Failed to revoke access code")
      }
    } catch (error) {
      console.error("Revoke access code error:", error)
      showMessage("error", error instanceof Error ? error.message : "Failed to revoke access code")
    }
    hideConfirmDialog()
  }

  const removeUser = async (userId: string) => {
    try {
      console.log("Removing user:", userId)
      const response = await fetch("/api/admin/remove-user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId }),
      })

      const data = await response.json()
      console.log("Remove user response:", data)

      if (response.ok && data.success) {
        showMessage("success", "User removed successfully")
        loadDashboardData()
      } else {
        throw new Error(data.error || "Failed to remove user")
      }
    } catch (error) {
      console.error("Remove user error:", error)
      showMessage("error", error instanceof Error ? error.message : "Failed to remove user")
    }
    hideConfirmDialog()
  }

  const handleConfirmAction = () => {
    if (!confirmDialog) return

    if (confirmDialog.type === "revoke") {
      revokeAccessCode(confirmDialog.id)
    } else if (confirmDialog.type === "remove") {
      removeUser(confirmDialog.id)
    }
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await loadDashboardData()
    setIsRefreshing(false)
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
            color: "#ef4444",
            fontSize: "1.125rem",
          }}
        >
          Loading admin dashboard...
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <div style={containerStyle}>
      <div style={{ maxWidth: "112rem", margin: "0 auto" }}>
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

        {/* Confirmation Dialog */}
        {confirmDialog && (
          <div style={modalStyle}>
            <div style={modalContentStyle}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "1rem" }}>
                <AlertTriangle style={{ width: "2rem", height: "2rem", color: "#f59e0b", marginRight: "0.5rem" }} />
                <h3 style={{ color: "white", margin: 0 }}>{confirmDialog.title}</h3>
              </div>
              <p style={{ color: "#888", marginBottom: "2rem" }}>{confirmDialog.message}</p>
              <div style={{ display: "flex", gap: "1rem", justifyContent: "center" }}>
                <button
                  onClick={hideConfirmDialog}
                  style={{
                    background: "rgba(156, 163, 175, 0.2)",
                    border: "1px solid rgba(156, 163, 175, 0.3)",
                    color: "#9ca3af",
                    padding: "0.75rem 1.5rem",
                    borderRadius: "0.5rem",
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmAction}
                  style={{
                    background: "rgba(239, 68, 68, 0.2)",
                    border: "1px solid rgba(239, 68, 68, 0.3)",
                    color: "#ef4444",
                    padding: "0.75rem 1.5rem",
                    borderRadius: "0.5rem",
                    cursor: "pointer",
                  }}
                >
                  {confirmDialog.type === "revoke" ? "Revoke" : "Remove"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "3rem" }}>
          <div style={{ display: "flex", alignItems: "center" }}>
            <div
              style={{
                width: "3rem",
                height: "3rem",
                background: "linear-gradient(135deg, #dc2626, #f97316)",
                borderRadius: "0.75rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginRight: "1rem",
              }}
            >
              <Shield style={{ width: "1.5rem", height: "1.5rem", color: "white" }} />
            </div>
            <div>
              <h1
                style={{
                  fontSize: "2.25rem",
                  fontWeight: "bold",
                  background: "linear-gradient(135deg, #ef4444, #f97316, #ef4444)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                Admin Dashboard
              </h1>
              <p style={{ color: "#888", fontSize: "1.125rem" }}>Movie Time Administration Panel</p>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              style={{
                ...buttonStyle,
                background: isRefreshing ? "rgba(156, 163, 175, 0.2)" : "rgba(239, 68, 68, 0.2)",
                border: "1px solid rgba(239, 68, 68, 0.3)",
                color: isRefreshing ? "#9ca3af" : "#ef4444",
                cursor: isRefreshing ? "not-allowed" : "pointer",
              }}
            >
              <RefreshCw
                style={{
                  width: "1rem",
                  height: "1rem",
                  animation: isRefreshing ? "spin 1s linear infinite" : "none",
                }}
              />
              {isRefreshing ? "Refreshing..." : "Refresh"}
            </button>
            <button
              onClick={handleLogout}
              style={{
                ...buttonStyle,
                background: "rgba(239, 68, 68, 0.2)",
                border: "1px solid rgba(239, 68, 68, 0.3)",
                color: "#ef4444",
              }}
            >
              <LogOut style={{ width: "1rem", height: "1rem" }} />
              Logout
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div style={{ display: "flex", gap: "1rem", marginBottom: "2rem", flexWrap: "wrap" }}>
          {[
            { id: "overview", label: "Overview", icon: BarChart3 },
            { id: "users", label: "Users", icon: Users },
            { id: "codes", label: "Access Codes", icon: Key },
            { id: "settings", label: "Settings", icon: Settings },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              style={{
                ...tabStyle,
                background: activeTab === tab.id ? "rgba(239, 68, 68, 0.3)" : "rgba(0, 0, 0, 0.6)",
                borderColor: activeTab === tab.id ? "rgba(239, 68, 68, 0.5)" : "rgba(239, 68, 68, 0.3)",
                color: activeTab === tab.id ? "#ef4444" : "#888",
              }}
            >
              <tab.icon style={{ width: "1.25rem", height: "1.25rem" }} />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
            {/* Stats Grid */}
            {stats && (
              <div
                style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "1.5rem" }}
              >
                <div style={cardStyle}>
                  <div style={contentStyle}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div>
                        <p style={{ color: "#888", fontSize: "0.875rem" }}>Total Users</p>
                        <p style={{ fontSize: "1.875rem", fontWeight: "bold", color: "#ef4444" }}>{stats.totalUsers}</p>
                      </div>
                      <Users style={{ width: "2rem", height: "2rem", color: "#ef4444" }} />
                    </div>
                  </div>
                </div>

                <div style={cardStyle}>
                  <div style={contentStyle}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div>
                        <p style={{ color: "#888", fontSize: "0.875rem" }}>Active Codes</p>
                        <p style={{ fontSize: "1.875rem", fontWeight: "bold", color: "#f97316" }}>
                          {stats.activeAccessCodes}
                        </p>
                      </div>
                      <Key style={{ width: "2rem", height: "2rem", color: "#f97316" }} />
                    </div>
                  </div>
                </div>

                <div style={cardStyle}>
                  <div style={contentStyle}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div>
                        <p style={{ color: "#888", fontSize: "0.875rem" }}>Total Watch Time</p>
                        <p style={{ fontSize: "1.875rem", fontWeight: "bold", color: "#a855f7" }}>
                          {stats.totalWatchTime}h
                        </p>
                      </div>
                      <Clock style={{ width: "2rem", height: "2rem", color: "#a855f7" }} />
                    </div>
                  </div>
                </div>

                <div style={cardStyle}>
                  <div style={contentStyle}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div>
                        <p style={{ color: "#888", fontSize: "0.875rem" }}>Total Favorites</p>
                        <p style={{ fontSize: "1.875rem", fontWeight: "bold", color: "#10b981" }}>
                          {stats.totalFavorites}
                        </p>
                      </div>
                      <Heart style={{ width: "2rem", height: "2rem", color: "#10b981" }} />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Platform Statistics */}
            <div style={cardStyle}>
              <div style={headerStyle}>
                <h3 style={{ color: "white", fontWeight: "600", display: "flex", alignItems: "center", margin: 0 }}>
                  <TrendingUp
                    style={{ width: "1.25rem", height: "1.25rem", marginRight: "0.5rem", color: "#ef4444" }}
                  />
                  Platform Statistics
                </h3>
              </div>
              <div style={contentStyle}>
                {stats && (
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                      gap: "1.5rem",
                    }}
                  >
                    <div
                      style={{
                        textAlign: "center",
                        padding: "1rem",
                        background: "rgba(239, 68, 68, 0.2)",
                        borderRadius: "0.5rem",
                      }}
                    >
                      <Film style={{ width: "2rem", height: "2rem", margin: "0 auto 0.5rem auto", color: "#ef4444" }} />
                      <div style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#ef4444" }}>
                        {stats.totalMoviesWatched}
                      </div>
                      <div style={{ fontSize: "0.875rem", color: "#888" }}>Movies Watched</div>
                    </div>
                    <div
                      style={{
                        textAlign: "center",
                        padding: "1rem",
                        background: "rgba(59, 130, 246, 0.2)",
                        borderRadius: "0.5rem",
                      }}
                    >
                      <Tv style={{ width: "2rem", height: "2rem", margin: "0 auto 0.5rem auto", color: "#3b82f6" }} />
                      <div style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#3b82f6" }}>
                        {stats.totalTvWatched}
                      </div>
                      <div style={{ fontSize: "0.875rem", color: "#888" }}>TV Episodes</div>
                    </div>
                    <div
                      style={{
                        textAlign: "center",
                        padding: "1rem",
                        background: "rgba(16, 185, 129, 0.2)",
                        borderRadius: "0.5rem",
                      }}
                    >
                      <Users
                        style={{ width: "2rem", height: "2rem", margin: "0 auto 0.5rem auto", color: "#10b981" }}
                      />
                      <div style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#10b981" }}>
                        {stats.activeUsers}
                      </div>
                      <div style={{ fontSize: "0.875rem", color: "#888" }}>Active Users</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === "users" && (
          <div style={cardStyle}>
            <div style={headerStyle}>
              <h3 style={{ color: "white", fontWeight: "600", display: "flex", alignItems: "center", margin: 0 }}>
                <Users style={{ width: "1.25rem", height: "1.25rem", marginRight: "0.5rem", color: "#ef4444" }} />
                User Management
              </h3>
              <p style={{ color: "#888", fontSize: "0.875rem", margin: "0.5rem 0 0 0" }}>
                Manage platform users and their activity
              </p>
            </div>
            <div style={contentStyle}>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid rgba(239, 68, 68, 0.2)" }}>
                      <th style={{ textAlign: "left", padding: "0.75rem", color: "#ef4444", fontSize: "0.875rem" }}>
                        Username
                      </th>
                      <th style={{ textAlign: "left", padding: "0.75rem", color: "#ef4444", fontSize: "0.875rem" }}>
                        Join Date
                      </th>
                      <th style={{ textAlign: "left", padding: "0.75rem", color: "#ef4444", fontSize: "0.875rem" }}>
                        Last Active
                      </th>
                      <th style={{ textAlign: "left", padding: "0.75rem", color: "#ef4444", fontSize: "0.875rem" }}>
                        Watched
                      </th>
                      <th style={{ textAlign: "left", padding: "0.75rem", color: "#ef4444", fontSize: "0.875rem" }}>
                        Favorites
                      </th>
                      <th style={{ textAlign: "left", padding: "0.75rem", color: "#ef4444", fontSize: "0.875rem" }}>
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user.id} style={{ borderBottom: "1px solid rgba(239, 68, 68, 0.1)" }}>
                        <td style={{ padding: "0.75rem", color: "white" }}>{user.username}</td>
                        <td style={{ padding: "0.75rem", color: "#888", fontSize: "0.875rem" }}>
                          {new Date(user.joinDate).toLocaleDateString()}
                        </td>
                        <td style={{ padding: "0.75rem", color: "#888", fontSize: "0.875rem" }}>
                          {new Date(user.lastActive).toLocaleDateString()}
                        </td>
                        <td style={{ padding: "0.75rem", color: "#888", fontSize: "0.875rem" }}>{user.totalWatched}</td>
                        <td style={{ padding: "0.75rem", color: "#888", fontSize: "0.875rem" }}>
                          {user.totalFavorites}
                        </td>
                        <td style={{ padding: "0.75rem" }}>
                          <button
                            onClick={() =>
                              showConfirmDialog(
                                "remove",
                                user.id,
                                "Remove User",
                                `Are you sure you want to remove user "${user.username}"? This will permanently delete their account and all associated data.`,
                              )
                            }
                            style={{
                              background: "rgba(239, 68, 68, 0.2)",
                              border: "1px solid rgba(239, 68, 68, 0.3)",
                              color: "#ef4444",
                              padding: "0.25rem 0.5rem",
                              borderRadius: "0.25rem",
                              fontSize: "0.75rem",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              gap: "0.25rem",
                            }}
                          >
                            <UserX style={{ width: "0.75rem", height: "0.75rem" }} />
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Access Codes Tab */}
        {activeTab === "codes" && (
          <div style={cardStyle}>
            <div style={headerStyle}>
              <h3 style={{ color: "white", fontWeight: "600", display: "flex", alignItems: "center", margin: 0 }}>
                <Key style={{ width: "1.25rem", height: "1.25rem", marginRight: "0.5rem", color: "#ef4444" }} />
                Access Code Management
              </h3>
              <p style={{ color: "#888", fontSize: "0.875rem", margin: "0.5rem 0 0 0" }}>
                Monitor and manage user-generated access codes
              </p>
            </div>
            <div style={contentStyle}>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid rgba(239, 68, 68, 0.2)" }}>
                      <th style={{ textAlign: "left", padding: "0.75rem", color: "#ef4444", fontSize: "0.875rem" }}>
                        Code
                      </th>
                      <th style={{ textAlign: "left", padding: "0.75rem", color: "#ef4444", fontSize: "0.875rem" }}>
                        Created By
                      </th>
                      <th style={{ textAlign: "left", padding: "0.75rem", color: "#ef4444", fontSize: "0.875rem" }}>
                        Created
                      </th>
                      <th style={{ textAlign: "left", padding: "0.75rem", color: "#ef4444", fontSize: "0.875rem" }}>
                        Expires
                      </th>
                      <th style={{ textAlign: "left", padding: "0.75rem", color: "#ef4444", fontSize: "0.875rem" }}>
                        Status
                      </th>
                      <th style={{ textAlign: "left", padding: "0.75rem", color: "#ef4444", fontSize: "0.875rem" }}>
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {accessCodes.map((code) => (
                      <tr key={code.id} style={{ borderBottom: "1px solid rgba(239, 68, 68, 0.1)" }}>
                        <td style={{ padding: "0.75rem" }}>
                          <code
                            style={{
                              background: "rgba(239, 68, 68, 0.2)",
                              color: "#ef4444",
                              padding: "0.25rem 0.5rem",
                              borderRadius: "0.25rem",
                              fontSize: "0.875rem",
                            }}
                          >
                            {code.code}
                          </code>
                        </td>
                        <td style={{ padding: "0.75rem", color: "white" }}>{code.createdBy}</td>
                        <td style={{ padding: "0.75rem", color: "#888", fontSize: "0.875rem" }}>
                          {new Date(code.createdAt).toLocaleDateString()}
                        </td>
                        <td style={{ padding: "0.75rem", color: "#888", fontSize: "0.875rem" }}>
                          {new Date(code.expiresAt).toLocaleDateString()}
                        </td>
                        <td style={{ padding: "0.75rem" }}>
                          <span
                            style={{
                              padding: "0.25rem 0.5rem",
                              borderRadius: "0.25rem",
                              fontSize: "0.75rem",
                              fontWeight: "500",
                              background: code.isUsed
                                ? "rgba(239, 68, 68, 0.2)"
                                : new Date(code.expiresAt) < new Date()
                                  ? "rgba(156, 163, 175, 0.2)"
                                  : "rgba(34, 197, 94, 0.2)",
                              color: code.isUsed
                                ? "#ef4444"
                                : new Date(code.expiresAt) < new Date()
                                  ? "#9ca3af"
                                  : "#22c55e",
                            }}
                          >
                            {code.isUsed ? "Used" : new Date(code.expiresAt) < new Date() ? "Expired" : "Active"}
                          </span>
                        </td>
                        <td style={{ padding: "0.75rem" }}>
                          {!code.isUsed && new Date(code.expiresAt) > new Date() && (
                            <button
                              onClick={() =>
                                showConfirmDialog(
                                  "revoke",
                                  code.id,
                                  "Revoke Access Code",
                                  `Are you sure you want to revoke access code "${code.code}"? This action cannot be undone.`,
                                )
                              }
                              style={{
                                background: "rgba(239, 68, 68, 0.2)",
                                border: "1px solid rgba(239, 68, 68, 0.3)",
                                color: "#ef4444",
                                padding: "0.25rem 0.5rem",
                                borderRadius: "0.25rem",
                                fontSize: "0.75rem",
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                gap: "0.25rem",
                              }}
                            >
                              <Trash2 style={{ width: "0.75rem", height: "0.75rem" }} />
                              Revoke
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === "settings" && (
          <div style={cardStyle}>
            <div style={headerStyle}>
              <h3 style={{ color: "white", fontWeight: "600", display: "flex", alignItems: "center", margin: 0 }}>
                <Settings style={{ width: "1.25rem", height: "1.25rem", marginRight: "0.5rem", color: "#ef4444" }} />
                System Settings
              </h3>
              <p style={{ color: "#888", fontSize: "0.875rem", margin: "0.5rem 0 0 0" }}>
                Configure platform settings and preferences
              </p>
            </div>
            <div style={contentStyle}>
              <div style={{ textAlign: "center", padding: "3rem 0" }}>
                <Settings style={{ width: "4rem", height: "4rem", color: "#888", margin: "0 auto 1rem auto" }} />
                <p style={{ color: "#888", fontSize: "1.125rem" }}>Settings panel coming soon</p>
                <p style={{ color: "#666", fontSize: "0.875rem" }}>
                  Advanced configuration options will be available in future updates
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div style={{ marginTop: "3rem", textAlign: "center" }}>
          <button
            onClick={() => (window.location.href = "/")}
            style={{
              ...buttonStyle,
              background: "rgba(239, 68, 68, 0.2)",
              border: "1px solid rgba(239, 68, 68, 0.3)",
              color: "#ef4444",
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

        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  )
}
