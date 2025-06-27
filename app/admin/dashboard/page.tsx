"use client"

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
  CheckCircle,
  XCircle,
  Calendar,
  Activity,
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
  email?: string
  lastActive: string
  totalWatched: number
  totalFavorites: number
  joinDate: string
  isActive: boolean
}

interface AccessCodeData {
  id: string
  code: string
  createdBy: string
  createdAt: string
  expiresAt: string
  isUsed: boolean
  isActive: boolean
  usedBy?: string
  usedAt?: string
  adminAction?: string
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
  const [actionLoading, setActionLoading] = useState<string | null>(null)

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
    checkAuthentication()
  }, [])

  const checkAuthentication = () => {
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
        handleLogout()
      }
    } else {
      router.push("/admin")
    }
    setIsLoading(false)
  }

  const loadDashboardData = async () => {
    try {
      setIsLoading(true)
      console.log("🔄 Loading dashboard data...")

      // Load all data in parallel with proper error handling
      const [statsResult, usersResult, codesResult] = await Promise.allSettled([
        fetch("/api/admin/stats", {
          method: "GET",
          headers: {
            "Cache-Control": "no-cache",
            Pragma: "no-cache",
          },
        }).then((res) => res.json()),
        fetch("/api/admin/users", {
          method: "GET",
          headers: {
            "Cache-Control": "no-cache",
            Pragma: "no-cache",
          },
        }).then((res) => res.json()),
        fetch("/api/admin/access-codes", {
          method: "GET",
          headers: {
            "Cache-Control": "no-cache",
            Pragma: "no-cache",
          },
        }).then((res) => res.json()),
      ])

      // Handle stats
      if (statsResult.status === "fulfilled" && statsResult.value.success) {
        setStats(statsResult.value.data)
        console.log("✅ Stats loaded:", statsResult.value.data)
      } else {
        console.error("❌ Failed to load stats:", statsResult)
        showMessage("error", "Failed to load statistics")
      }

      // Handle users
      if (usersResult.status === "fulfilled" && usersResult.value.success) {
        setUsers(usersResult.value.data || [])
        console.log("✅ Users loaded:", usersResult.value.data?.length || 0)
      } else {
        console.error("❌ Failed to load users:", usersResult)
        showMessage("error", "Failed to load users")
      }

      // Handle access codes
      if (codesResult.status === "fulfilled" && codesResult.value.success) {
        setAccessCodes(codesResult.value.data || [])
        console.log("✅ Access codes loaded:", codesResult.value.data?.length || 0)
      } else {
        console.error("❌ Failed to load access codes:", codesResult)
        showMessage("error", "Failed to load access codes")
      }

      if (
        statsResult.status === "fulfilled" ||
        usersResult.status === "fulfilled" ||
        codesResult.status === "fulfilled"
      ) {
        showMessage("success", "Dashboard data refreshed")
      }
    } catch (error) {
      console.error("💥 Error loading dashboard data:", error)
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
      setActionLoading(codeId)
      console.log("🔐 Revoking access code:", codeId)

      const response = await fetch("/api/admin/revoke-access-code", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ codeId }),
      })

      const data = await response.json()
      console.log("📝 Revoke response:", data)

      if (response.ok && data.success) {
        showMessage("success", "Access code revoked successfully")
        // Refresh only access codes data
        await loadAccessCodes()
      } else {
        throw new Error(data.error || "Failed to revoke access code")
      }
    } catch (error) {
      console.error("❌ Revoke error:", error)
      showMessage("error", error instanceof Error ? error.message : "Failed to revoke access code")
    } finally {
      setActionLoading(null)
      hideConfirmDialog()
    }
  }

  const removeUser = async (userId: string) => {
    try {
      setActionLoading(userId)
      console.log("🗑️ Removing user:", userId)

      const response = await fetch("/api/admin/remove-user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId }),
      })

      const data = await response.json()
      console.log("📝 Remove response:", data)

      if (response.ok && data.success) {
        showMessage("success", "User removed successfully")
        // Refresh all data since removing a user affects multiple tables
        await loadDashboardData()
      } else {
        throw new Error(data.error || "Failed to remove user")
      }
    } catch (error) {
      console.error("❌ Remove error:", error)
      showMessage("error", error instanceof Error ? error.message : "Failed to remove user")
    } finally {
      setActionLoading(null)
      hideConfirmDialog()
    }
  }

  const loadAccessCodes = async () => {
    try {
      const response = await fetch("/api/admin/access-codes", {
        method: "GET",
        headers: {
          "Cache-Control": "no-cache",
          Pragma: "no-cache",
        },
      })
      const data = await response.json()
      if (data.success) {
        setAccessCodes(data.data || [])
      }
    } catch (error) {
      console.error("Error loading access codes:", error)
    }
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

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    } catch {
      return "Invalid Date"
    }
  }

  const formatDateTime = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    } catch {
      return "Invalid Date"
    }
  }

  const isCodeExpired = (expiresAt: string) => {
    return new Date(expiresAt) < new Date()
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 text-red-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-300 text-lg">Loading admin dashboard...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 text-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Message Display */}
        {message && (
          <div
            className={`fixed top-6 right-6 z-50 p-4 rounded-lg shadow-lg ${
              message.type === "success" ? "bg-green-600 text-white" : "bg-red-600 text-white"
            } animate-in slide-in-from-right duration-300`}
          >
            <div className="flex items-center gap-2">
              {message.type === "success" ? <CheckCircle className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
              {message.text}
            </div>
          </div>
        )}

        {/* Confirmation Dialog */}
        {confirmDialog && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
            <div className="bg-gray-800 border border-red-500/30 rounded-xl p-6 max-w-md w-full mx-4">
              <div className="flex items-center gap-3 mb-4">
                <AlertTriangle className="w-6 h-6 text-yellow-500" />
                <h3 className="text-xl font-semibold text-white">{confirmDialog.title}</h3>
              </div>
              <p className="text-gray-300 mb-6">{confirmDialog.message}</p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={hideConfirmDialog}
                  disabled={actionLoading !== null}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmAction}
                  disabled={actionLoading !== null}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {actionLoading === confirmDialog.id && <RefreshCw className="w-4 h-4 animate-spin" />}
                  {confirmDialog.type === "revoke" ? "Revoke" : "Remove"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-r from-red-600 to-orange-600 rounded-xl flex items-center justify-center">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text text-transparent">
                Admin Dashboard
              </h1>
              <p className="text-gray-400">Movie Time Administration Panel</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="flex items-center gap-2 px-4 py-2 bg-red-600/20 border border-red-500/30 text-red-400 rounded-lg hover:bg-red-600/30 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
              {isRefreshing ? "Refreshing..." : "Refresh"}
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 bg-red-600/20 border border-red-500/30 text-red-400 rounded-lg hover:bg-red-600/30 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-2 mb-8">
          {[
            { id: "overview", label: "Overview", icon: BarChart3 },
            { id: "users", label: "Users", icon: Users },
            { id: "codes", label: "Access Codes", icon: Key },
            { id: "settings", label: "Settings", icon: Settings },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors border-2 ${
                activeTab === tab.id
                  ? "bg-red-600/30 border-red-500/50 text-red-400"
                  : "bg-gray-800/60 border-gray-700/50 text-gray-400 hover:bg-gray-700/60"
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* Stats Grid */}
            {stats && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-gray-800/60 border border-red-500/30 rounded-xl p-6 backdrop-blur-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-400 text-sm">Total Users</p>
                      <p className="text-3xl font-bold text-red-500">{stats.totalUsers}</p>
                    </div>
                    <Users className="w-8 h-8 text-red-500" />
                  </div>
                </div>

                <div className="bg-gray-800/60 border border-orange-500/30 rounded-xl p-6 backdrop-blur-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-400 text-sm">Active Codes</p>
                      <p className="text-3xl font-bold text-orange-500">{stats.activeAccessCodes}</p>
                    </div>
                    <Key className="w-8 h-8 text-orange-500" />
                  </div>
                </div>

                <div className="bg-gray-800/60 border border-purple-500/30 rounded-xl p-6 backdrop-blur-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-400 text-sm">Watch Time</p>
                      <p className="text-3xl font-bold text-purple-500">{stats.totalWatchTime}h</p>
                    </div>
                    <Clock className="w-8 h-8 text-purple-500" />
                  </div>
                </div>

                <div className="bg-gray-800/60 border border-green-500/30 rounded-xl p-6 backdrop-blur-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-400 text-sm">Total Favorites</p>
                      <p className="text-3xl font-bold text-green-500">{stats.totalFavorites}</p>
                    </div>
                    <Heart className="w-8 h-8 text-green-500" />
                  </div>
                </div>
              </div>
            )}

            {/* Platform Statistics */}
            <div className="bg-gray-800/60 border border-red-500/30 rounded-xl backdrop-blur-sm">
              <div className="p-6 border-b border-red-500/20">
                <h3 className="text-xl font-semibold text-white flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-red-500" />
                  Platform Statistics
                </h3>
              </div>
              <div className="p-6">
                {stats && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center p-4 bg-red-600/20 rounded-lg">
                      <Film className="w-8 h-8 mx-auto mb-2 text-red-500" />
                      <div className="text-2xl font-bold text-red-500">{stats.totalMoviesWatched}</div>
                      <div className="text-sm text-gray-400">Movies Watched</div>
                    </div>
                    <div className="text-center p-4 bg-blue-600/20 rounded-lg">
                      <Tv className="w-8 h-8 mx-auto mb-2 text-blue-500" />
                      <div className="text-2xl font-bold text-blue-500">{stats.totalTvWatched}</div>
                      <div className="text-sm text-gray-400">TV Episodes</div>
                    </div>
                    <div className="text-center p-4 bg-green-600/20 rounded-lg">
                      <Activity className="w-8 h-8 mx-auto mb-2 text-green-500" />
                      <div className="text-2xl font-bold text-green-500">{stats.activeUsers}</div>
                      <div className="text-sm text-gray-400">Active Users</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === "users" && (
          <div className="bg-gray-800/60 border border-red-500/30 rounded-xl backdrop-blur-sm">
            <div className="p-6 border-b border-red-500/20">
              <h3 className="text-xl font-semibold text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-red-500" />
                User Management ({users.length} users)
              </h3>
              <p className="text-gray-400 text-sm mt-1">Manage platform users and their activity</p>
            </div>
            <div className="p-6">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-red-500/20">
                      <th className="text-left py-3 px-2 text-red-500 font-medium">Username</th>
                      <th className="text-left py-3 px-2 text-red-500 font-medium">Join Date</th>
                      <th className="text-left py-3 px-2 text-red-500 font-medium">Last Active</th>
                      <th className="text-left py-3 px-2 text-red-500 font-medium">Watched</th>
                      <th className="text-left py-3 px-2 text-red-500 font-medium">Favorites</th>
                      <th className="text-left py-3 px-2 text-red-500 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user.id} className="border-b border-gray-700/50 hover:bg-gray-700/20">
                        <td className="py-3 px-2">
                          <div className="flex items-center gap-2">
                            <span className="text-white font-medium">{user.username}</span>
                            {user.isActive && <span className="w-2 h-2 bg-green-500 rounded-full"></span>}
                          </div>
                        </td>
                        <td className="py-3 px-2 text-gray-400 text-sm">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {formatDate(user.joinDate)}
                          </div>
                        </td>
                        <td className="py-3 px-2 text-gray-400 text-sm">{formatDate(user.lastActive)}</td>
                        <td className="py-3 px-2 text-gray-400 text-sm">{user.totalWatched}</td>
                        <td className="py-3 px-2 text-gray-400 text-sm">{user.totalFavorites}</td>
                        <td className="py-3 px-2">
                          <button
                            onClick={() =>
                              showConfirmDialog(
                                "remove",
                                user.id,
                                "Remove User",
                                `Are you sure you want to remove user "${user.username}"? This will permanently delete their account and all associated data.`,
                              )
                            }
                            disabled={actionLoading === user.id}
                            className="flex items-center gap-1 px-3 py-1 bg-red-600/20 border border-red-500/30 text-red-400 rounded text-xs hover:bg-red-600/30 transition-colors disabled:opacity-50"
                          >
                            {actionLoading === user.id ? (
                              <RefreshCw className="w-3 h-3 animate-spin" />
                            ) : (
                              <UserX className="w-3 h-3" />
                            )}
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {users.length === 0 && (
                  <div className="text-center py-8 text-gray-400">
                    <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>No users found</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Access Codes Tab */}
        {activeTab === "codes" && (
          <div className="bg-gray-800/60 border border-red-500/30 rounded-xl backdrop-blur-sm">
            <div className="p-6 border-b border-red-500/20">
              <h3 className="text-xl font-semibold text-white flex items-center gap-2">
                <Key className="w-5 h-5 text-red-500" />
                Access Code Management ({accessCodes.length} codes)
              </h3>
              <p className="text-gray-400 text-sm mt-1">Monitor and manage user-generated access codes</p>
            </div>
            <div className="p-6">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-red-500/20">
                      <th className="text-left py-3 px-2 text-red-500 font-medium">Code</th>
                      <th className="text-left py-3 px-2 text-red-500 font-medium">Created By</th>
                      <th className="text-left py-3 px-2 text-red-500 font-medium">Created</th>
                      <th className="text-left py-3 px-2 text-red-500 font-medium">Expires</th>
                      <th className="text-left py-3 px-2 text-red-500 font-medium">Status</th>
                      <th className="text-left py-3 px-2 text-red-500 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {accessCodes.map((code) => {
                      const expired = isCodeExpired(code.expiresAt)
                      const canRevoke = !code.isUsed && !expired && code.isActive

                      return (
                        <tr key={code.id} className="border-b border-gray-700/50 hover:bg-gray-700/20">
                          <td className="py-3 px-2">
                            <code className="bg-red-600/20 text-red-400 px-2 py-1 rounded text-sm font-mono">
                              {code.code}
                            </code>
                          </td>
                          <td className="py-3 px-2 text-white">{code.createdBy}</td>
                          <td className="py-3 px-2 text-gray-400 text-sm">{formatDateTime(code.createdAt)}</td>
                          <td className="py-3 px-2 text-gray-400 text-sm">{formatDateTime(code.expiresAt)}</td>
                          <td className="py-3 px-2">
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${
                                code.isUsed
                                  ? "bg-red-600/20 text-red-400"
                                  : expired
                                    ? "bg-gray-600/20 text-gray-400"
                                    : code.adminAction
                                      ? "bg-yellow-600/20 text-yellow-400"
                                      : "bg-green-600/20 text-green-400"
                              }`}
                            >
                              {code.isUsed ? "Used" : expired ? "Expired" : code.adminAction ? "Revoked" : "Active"}
                            </span>
                          </td>
                          <td className="py-3 px-2">
                            {canRevoke && (
                              <button
                                onClick={() =>
                                  showConfirmDialog(
                                    "revoke",
                                    code.id,
                                    "Revoke Access Code",
                                    `Are you sure you want to revoke access code "${code.code}"? This action cannot be undone.`,
                                  )
                                }
                                disabled={actionLoading === code.id}
                                className="flex items-center gap-1 px-3 py-1 bg-red-600/20 border border-red-500/30 text-red-400 rounded text-xs hover:bg-red-600/30 transition-colors disabled:opacity-50"
                              >
                                {actionLoading === code.id ? (
                                  <RefreshCw className="w-3 h-3 animate-spin" />
                                ) : (
                                  <Trash2 className="w-3 h-3" />
                                )}
                                Revoke
                              </button>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
                {accessCodes.length === 0 && (
                  <div className="text-center py-8 text-gray-400">
                    <Key className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>No access codes found</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === "settings" && (
          <div className="bg-gray-800/60 border border-red-500/30 rounded-xl backdrop-blur-sm">
            <div className="p-6 border-b border-red-500/20">
              <h3 className="text-xl font-semibold text-white flex items-center gap-2">
                <Settings className="w-5 h-5 text-red-500" />
                System Settings
              </h3>
              <p className="text-gray-400 text-sm mt-1">Configure platform settings and preferences</p>
            </div>
            <div className="p-6">
              <div className="text-center py-12">
                <Settings className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400 text-lg mb-2">Settings panel coming soon</p>
                <p className="text-gray-500 text-sm">
                  Advanced configuration options will be available in future updates
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Back to App */}
        <div className="mt-8 text-center">
          <button
            onClick={() => (window.location.href = "/")}
            className="px-6 py-3 bg-red-600/20 border border-red-500/30 text-red-400 rounded-lg hover:bg-red-600/30 transition-colors"
          >
            Back to Movie Time
          </button>
        </div>
      </div>
    </div>
  )
}
