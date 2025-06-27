"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { toast } from "@/hooks/use-toast"
import { Shield, UsersIcon, Key, Trash2, RefreshCw, Clock, Calendar, Ban, Plus, LogOut } from "lucide-react"

interface User {
  id: string
  username: string
  email?: string
  joinDate: string
  lastActive: string
  totalWatched: number
  totalFavorites: number
  isActive: boolean
}

interface AccessCode {
  id: string
  code: string
  created_at: string
  expires_at: string
  used_at: string | null
  used_by: string | null
  is_active: boolean
  is_used: boolean
  createdBy: string
  admin_action?: string
}

interface AdminStats {
  totalUsers: number
  activeUsers: number
  totalAccessCodes: number
  activeAccessCodes: number
  usedAccessCodes: number
  expiredAccessCodes: number
  revokedAccessCodes: number
  totalWatchTime: number
  totalMoviesWatched: number
  totalTvWatched: number
  totalFavorites: number
}

export default function AdminDashboard() {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    activeUsers: 0,
    totalAccessCodes: 0,
    activeAccessCodes: 0,
    usedAccessCodes: 0,
    expiredAccessCodes: 0,
    revokedAccessCodes: 0,
    totalWatchTime: 0,
    totalMoviesWatched: 0,
    totalTvWatched: 0,
    totalFavorites: 0,
  })
  const [users, setUsers] = useState<User[]>([])
  const [accessCodes, setAccessCodes] = useState<AccessCode[]>([])
  const [activeTab, setActiveTab] = useState<"overview" | "users" | "codes" | "settings">("overview")
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const showMessage = (type: "success" | "error", text: string) => {
    toast({
      title: type === "success" ? "Success" : "Error",
      description: text,
      variant: type === "success" ? undefined : "destructive",
    })
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
        fetchAllData()
      } else {
        handleLogout()
      }
    } else {
      router.push("/admin")
    }
    setIsLoading(false)
  }

  const fetchAllData = async (showRefreshToast = false) => {
    try {
      setIsRefreshing(true)

      // Add cache-busting timestamp
      const timestamp = Date.now()

      const [statsResult, usersResult, codesResult] = await Promise.allSettled([
        fetch(`/api/admin/stats?t=${timestamp}`, {
          method: "GET",
          headers: { "Cache-Control": "no-cache" },
        }),
        fetch(`/api/admin/users?t=${timestamp}`, {
          method: "GET",
          headers: { "Cache-Control": "no-cache" },
        }),
        fetch(`/api/admin/access-codes?t=${timestamp}`, {
          method: "GET",
          headers: { "Cache-Control": "no-cache" },
        }),
      ])

      // Handle stats
      if (statsResult.status === "fulfilled" && statsResult.value.ok) {
        const statsData = await statsResult.value.json()
        if (statsData.success && statsData.stats) {
          setStats(statsData.stats)
        }
      } else {
        console.error("Failed to fetch stats:", statsResult)
        showMessage("error", "Failed to load statistics")
      }

      // Handle users
      if (usersResult.status === "fulfilled" && usersResult.value.ok) {
        const usersData = await usersResult.value.json()
        if (usersData.success && usersData.users) {
          setUsers(usersData.users)
        }
      } else {
        console.error("Failed to fetch users:", usersResult)
        showMessage("error", "Failed to load users")
      }

      // Handle access codes
      if (codesResult.status === "fulfilled" && codesResult.value.ok) {
        const codesData = await codesResult.value.json()
        if (codesData.success && codesData.accessCodes) {
          setAccessCodes(codesData.accessCodes)
        }
      } else {
        console.error("Failed to fetch access codes:", codesResult)
        showMessage("error", "Failed to load access codes")
      }

      if (showRefreshToast) {
        showMessage("success", "All admin data has been updated successfully.")
      }
    } catch (error) {
      console.error("Error fetching admin data:", error)
      showMessage("error", "Failed to fetch admin data. Please try again.")
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  const removeUser = async (userId: string, username: string) => {
    try {
      setActionLoading(`remove-${userId}`)

      const response = await fetch("/api/admin/remove-user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId }),
      })

      const data = await response.json()

      if (data.success) {
        showMessage("success", `User "${username}" has been successfully removed.`)
        // Refresh data after successful removal
        await fetchAllData()
      } else {
        showMessage("error", data.error || "Failed to remove user.")
      }
    } catch (error) {
      console.error("Error removing user:", error)
      showMessage("error", "Failed to remove user. Please try again.")
    } finally {
      setActionLoading(null)
    }
  }

  const revokeAccessCode = async (codeId: string, code: string) => {
    try {
      setActionLoading(`revoke-${codeId}`)

      const response = await fetch("/api/admin/revoke-access-code", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ codeId }),
      })

      const data = await response.json()

      if (data.success) {
        showMessage("success", `Access code "${code}" has been revoked.`)
        // Refresh data after successful revocation
        await fetchAllData()
      } else {
        showMessage("error", data.error || "Failed to revoke access code.")
      }
    } catch (error) {
      console.error("Error revoking access code:", error)
      showMessage("error", "Failed to revoke access code. Please try again.")
    } finally {
      setActionLoading(null)
    }
  }

  const generateAccessCode = async () => {
    try {
      setActionLoading("generate")

      const response = await fetch("/api/generate-access-code", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      const data = await response.json()

      if (data.success) {
        showMessage("success", `New access code generated: ${data.code}`)
        // Refresh data after successful generation
        await fetchAllData()
      } else {
        showMessage("error", data.error || "Failed to generate access code.")
      }
    } catch (error) {
      console.error("Error generating access code:", error)
      showMessage("error", "Failed to generate access code. Please try again.")
    } finally {
      setActionLoading(null)
    }
  }

  const getAccessCodeStatus = (accessCode: AccessCode) => {
    const now = new Date()
    const expiresAt = new Date(accessCode.expires_at)

    if (!accessCode.is_active || accessCode.admin_action) {
      return { status: "Revoked", variant: "secondary" as const }
    }
    if (accessCode.is_used || accessCode.used_at) {
      return { status: "Used", variant: "outline" as const }
    }
    if (expiresAt < now) {
      return { status: "Expired", variant: "destructive" as const }
    }
    return { status: "Active", variant: "default" as const }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))

    if (diffInHours < 1) return "Less than an hour ago"
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? "s" : ""} ago`

    const diffInDays = Math.floor(diffInHours / 24)
    if (diffInDays < 7) return `${diffInDays} day${diffInDays > 1 ? "s" : ""} ago`

    return formatDate(dateString)
  }

  const handleLogout = () => {
    localStorage.removeItem("admin_authenticated")
    localStorage.removeItem("admin_auth_time")
    router.push("/admin")
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin text-purple-400 mx-auto mb-4" />
          <p className="text-white">Loading admin dashboard...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-2">
              <Shield className="h-8 w-8 text-purple-400" />
              Admin Dashboard
            </h1>
            <p className="text-slate-300 mt-1">Manage users and access codes</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={() => fetchAllData(true)}
              disabled={isRefreshing}
              className="bg-purple-600 hover:bg-purple-700"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
              Refresh Data
            </Button>
            <Button
              onClick={handleLogout}
              variant="outline"
              className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white bg-transparent"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-2">
          {[
            { id: "overview", label: "Overview" },
            { id: "users", label: "Users" },
            { id: "codes", label: "Access Codes" },
            { id: "settings", label: "Settings" },
          ].map((tab) => (
            <Button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              variant={activeTab === tab.id ? "default" : "outline"}
              className={activeTab === tab.id ? "bg-purple-600 hover:bg-purple-700" : ""}
            >
              {tab.label}
            </Button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-slate-200">Total Users</CardTitle>
                  <UsersIcon className="h-4 w-4 text-blue-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white">{stats.totalUsers}</div>
                  <p className="text-xs text-slate-400">Active: {stats.activeUsers}</p>
                </CardContent>
              </Card>

              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-slate-200">Access Codes</CardTitle>
                  <Key className="h-4 w-4 text-green-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white">{stats.totalAccessCodes}</div>
                  <p className="text-xs text-slate-400">Active: {stats.activeAccessCodes}</p>
                </CardContent>
              </Card>

              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-slate-200">Watch Time</CardTitle>
                  <Clock className="h-4 w-4 text-purple-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white">{stats.totalWatchTime}h</div>
                  <p className="text-xs text-slate-400">
                    Movies: {stats.totalMoviesWatched} | TV: {stats.totalTvWatched}
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-slate-200">Favorites</CardTitle>
                  <Key className="h-4 w-4 text-pink-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white">{stats.totalFavorites}</div>
                </CardContent>
              </Card>
            </div>

            {/* Code Status Breakdown */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Access Code Status Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-400">{stats.activeAccessCodes}</div>
                    <div className="text-sm text-slate-400">Active</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-400">{stats.usedAccessCodes}</div>
                    <div className="text-sm text-slate-400">Used</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-400">{stats.expiredAccessCodes}</div>
                    <div className="text-sm text-slate-400">Expired</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-400">{stats.revokedAccessCodes}</div>
                    <div className="text-sm text-slate-400">Revoked</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === "users" && (
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <UsersIcon className="h-5 w-5 text-blue-400" />
                Users Management ({users.length} total)
              </CardTitle>
              <CardDescription className="text-slate-400">Manage registered users</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {users.length === 0 ? (
                <p className="text-slate-400 text-center py-8">No users found</p>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {users.map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-medium text-white">{user.username}</span>
                          {user.isActive && (
                            <Badge variant="default" className="bg-green-600">
                              Active
                            </Badge>
                          )}
                        </div>
                        <div className="text-sm text-slate-400 space-y-1">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Joined: {formatDate(user.joinDate)}
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Last active: {formatRelativeTime(user.lastActive)}
                          </div>
                          <div>
                            Watched: {user.totalWatched} | Favorites: {user.totalFavorites}
                          </div>
                        </div>
                      </div>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" size="sm" disabled={actionLoading === `remove-${user.id}`}>
                            {actionLoading === `remove-${user.id}` ? (
                              <RefreshCw className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="bg-slate-800 border-slate-700">
                          <AlertDialogHeader>
                            <AlertDialogTitle className="text-white">Remove User</AlertDialogTitle>
                            <AlertDialogDescription className="text-slate-300">
                              Are you sure you want to remove user "{user.username}"? This action cannot be undone and
                              will delete all their data.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel className="bg-slate-700 text-white hover:bg-slate-600">
                              Cancel
                            </AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => removeUser(user.id, user.username)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Remove User
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Access Codes Tab */}
        {activeTab === "codes" && (
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Key className="h-5 w-5 text-green-400" />
                    Access Codes ({accessCodes.length} total)
                  </CardTitle>
                  <CardDescription className="text-slate-400">Manage access codes</CardDescription>
                </div>
                <Button
                  onClick={generateAccessCode}
                  disabled={actionLoading === "generate"}
                  size="sm"
                  className="bg-green-600 hover:bg-green-700"
                >
                  {actionLoading === "generate" ? (
                    <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Plus className="h-4 w-4 mr-2" />
                  )}
                  Generate Code
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {accessCodes.length === 0 ? (
                <p className="text-slate-400 text-center py-8">No access codes found</p>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {accessCodes.map((code) => {
                    const { status, variant } = getAccessCodeStatus(code)
                    const canRevoke = status === "Active"

                    return (
                      <div key={code.id} className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <code className="font-mono text-sm bg-slate-600 px-2 py-1 rounded text-white">
                              {code.code}
                            </code>
                            <Badge variant={variant}>{status}</Badge>
                          </div>
                          <div className="text-sm text-slate-400 space-y-1">
                            <div>Created by: {code.createdBy}</div>
                            <div>Created: {formatDate(code.created_at)}</div>
                            <div>Expires: {formatDate(code.expires_at)}</div>
                            {code.used_at && <div>Used: {formatDate(code.used_at)}</div>}
                          </div>
                        </div>
                        {canRevoke && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                disabled={actionLoading === `revoke-${code.id}`}
                                className="border-orange-500 text-orange-500 hover:bg-orange-500 hover:text-white bg-transparent"
                              >
                                {actionLoading === `revoke-${code.id}` ? (
                                  <RefreshCw className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Ban className="h-4 w-4" />
                                )}
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="bg-slate-800 border-slate-700">
                              <AlertDialogHeader>
                                <AlertDialogTitle className="text-white">Revoke Access Code</AlertDialogTitle>
                                <AlertDialogDescription className="text-slate-300">
                                  Are you sure you want to revoke access code "{code.code}"? This will prevent it from
                                  being used for registration.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel className="bg-slate-700 text-white hover:bg-slate-600">
                                  Cancel
                                </AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => revokeAccessCode(code.id, code.code)}
                                  className="bg-orange-600 hover:bg-orange-700"
                                >
                                  Revoke Code
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Settings Tab */}
        {activeTab === "settings" && (
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">System Settings</CardTitle>
              <CardDescription className="text-slate-400">Configure platform settings</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <p className="text-slate-400 text-lg mb-2">Settings panel coming soon</p>
                <p className="text-slate-500 text-sm">
                  Advanced configuration options will be available in future updates
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Back to App */}
        <div className="text-center">
          <Button onClick={() => (window.location.href = "/")} variant="outline">
            Back to Movie Time
          </Button>
        </div>
      </div>
    </div>
  )
}

