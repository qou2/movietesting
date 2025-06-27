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
import {
  Shield,
  UsersIcon,
  Key,
  Trash2,
  RefreshCw,
  Clock,
  Calendar,
  Ban,
  Plus,
  LogOut,
  Home,
  Activity,
  TrendingUp,
  Star,
} from "lucide-react"

interface User {
  id: string
  username: string
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
  const [activeTab, setActiveTab] = useState<"overview" | "users" | "codes">("overview")
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

      if (statsResult.status === "fulfilled" && statsResult.value.ok) {
        const statsData = await statsResult.value.json()
        if (statsData.success && statsData.stats) {
          setStats(statsData.stats)
        }
      } else {
        console.error("Failed to fetch stats:", statsResult)
        showMessage("error", "Failed to load statistics")
      }

      if (usersResult.status === "fulfilled" && usersResult.value.ok) {
        const usersData = await usersResult.value.json()
        if (usersData.success && usersData.users) {
          setUsers(usersData.users)
        }
      } else {
        console.error("Failed to fetch users:", usersResult)
        showMessage("error", "Failed to load users")
      }

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
        showMessage("success", "Dashboard data refreshed successfully!")
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
      return { status: "Revoked", variant: "secondary" as const, color: "text-red-400" }
    }
    if (accessCode.is_used || accessCode.used_at) {
      return { status: "Used", variant: "outline" as const, color: "text-blue-400" }
    }
    if (expiresAt < now) {
      return { status: "Expired", variant: "destructive" as const, color: "text-yellow-400" }
    }
    return { status: "Active", variant: "default" as const, color: "text-green-400" }
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
          <div className="relative">
            <div className="w-16 h-16 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto mb-4"></div>
            <Shield className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 h-6 w-6 text-purple-400" />
          </div>
          <p className="text-white text-lg font-medium">Loading Admin Dashboard...</p>
          <p className="text-purple-300 text-sm mt-2">Securing your data</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]"></div>

      <div className="relative z-10 p-6">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-600/20 rounded-lg backdrop-blur-sm border border-purple-500/20">
                  <Shield className="h-8 w-8 text-purple-400" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold text-white">Admin Dashboard</h1>
                  <p className="text-purple-200 text-lg">Manage your Movie Time platform</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button
                onClick={() => fetchAllData(true)}
                disabled={isRefreshing}
                className="bg-purple-600/20 hover:bg-purple-600/30 text-purple-100 border border-purple-500/30 backdrop-blur-sm"
                variant="outline"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
                Refresh Data
              </Button>
              <Button
                onClick={() => (window.location.href = "/")}
                className="bg-slate-600/20 hover:bg-slate-600/30 text-slate-100 border border-slate-500/30 backdrop-blur-sm"
                variant="outline"
              >
                <Home className="h-4 w-4 mr-2" />
                Back to App
              </Button>
              <Button
                onClick={handleLogout}
                className="bg-red-600/20 hover:bg-red-600/30 text-red-100 border border-red-500/30 backdrop-blur-sm"
                variant="outline"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex flex-wrap gap-2">
            {[
              { id: "overview", label: "Overview", icon: TrendingUp },
              { id: "users", label: "Users", icon: UsersIcon },
              { id: "codes", label: "Access Codes", icon: Key },
            ].map((tab) => {
              const Icon = tab.icon
              return (
                <Button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  variant={activeTab === tab.id ? "default" : "outline"}
                  className={
                    activeTab === tab.id
                      ? "bg-purple-600 hover:bg-purple-700 text-white shadow-lg shadow-purple-600/25"
                      : "bg-slate-800/50 hover:bg-slate-700/50 text-slate-200 border-slate-600/50 backdrop-blur-sm"
                  }
                >
                  <Icon className="h-4 w-4 mr-2" />
                  {tab.label}
                </Button>
              )
            })}
          </div>

          {/* Overview Tab */}
          {activeTab === "overview" && (
            <div className="space-y-8">
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm hover:bg-slate-800/60 transition-all duration-300">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-slate-300">Total Users</CardTitle>
                    <div className="p-2 bg-blue-600/20 rounded-lg">
                      <UsersIcon className="h-4 w-4 text-blue-400" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-white mb-1">{stats.totalUsers}</div>
                    <p className="text-xs text-blue-400 flex items-center gap-1">
                      <Activity className="h-3 w-3" />
                      {stats.activeUsers} active this week
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm hover:bg-slate-800/60 transition-all duration-300">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-slate-300">Access Codes</CardTitle>
                    <div className="p-2 bg-green-600/20 rounded-lg">
                      <Key className="h-4 w-4 text-green-400" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-white mb-1">{stats.totalAccessCodes}</div>
                    <p className="text-xs text-green-400 flex items-center gap-1">
                      <Activity className="h-3 w-3" />
                      {stats.activeAccessCodes} active codes
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm hover:bg-slate-800/60 transition-all duration-300">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-slate-300">Used Codes</CardTitle>
                    <div className="p-2 bg-purple-600/20 rounded-lg">
                      <Key className="h-4 w-4 text-purple-400" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-white mb-1">{stats.usedAccessCodes}</div>
                    <p className="text-xs text-purple-400 flex items-center gap-1">
                      <Activity className="h-3 w-3" />
                      Successfully registered
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm hover:bg-slate-800/60 transition-all duration-300">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-slate-300">Favorites</CardTitle>
                    <div className="p-2 bg-pink-600/20 rounded-lg">
                      <Star className="h-4 w-4 text-pink-400" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-white mb-1">{stats.totalFavorites}</div>
                    <p className="text-xs text-pink-400 flex items-center gap-1">
                      <Activity className="h-3 w-3" />
                      Total user favorites
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Code Status Breakdown */}
              <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Key className="h-5 w-5 text-purple-400" />
                    Access Code Status Overview
                  </CardTitle>
                  <CardDescription className="text-slate-400">
                    Detailed breakdown of all access codes in the system
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <div className="text-center p-4 bg-green-600/10 rounded-lg border border-green-600/20">
                      <div className="text-3xl font-bold text-green-400 mb-2">{stats.activeAccessCodes}</div>
                      <div className="text-sm text-green-300 font-medium">Active</div>
                      <div className="text-xs text-slate-400 mt-1">Ready to use</div>
                    </div>
                    <div className="text-center p-4 bg-blue-600/10 rounded-lg border border-blue-600/20">
                      <div className="text-3xl font-bold text-blue-400 mb-2">{stats.usedAccessCodes}</div>
                      <div className="text-sm text-blue-300 font-medium">Used</div>
                      <div className="text-xs text-slate-400 mt-1">Successfully registered</div>
                    </div>
                    <div className="text-center p-4 bg-yellow-600/10 rounded-lg border border-yellow-600/20">
                      <div className="text-3xl font-bold text-yellow-400 mb-2">{stats.expiredAccessCodes}</div>
                      <div className="text-sm text-yellow-300 font-medium">Expired</div>
                      <div className="text-xs text-slate-400 mt-1">Past expiration date</div>
                    </div>
                    <div className="text-center p-4 bg-red-600/10 rounded-lg border border-red-600/20">
                      <div className="text-3xl font-bold text-red-400 mb-2">{stats.revokedAccessCodes}</div>
                      <div className="text-sm text-red-300 font-medium">Revoked</div>
                      <div className="text-xs text-slate-400 mt-1">Manually disabled</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Users Tab */}
          {activeTab === "users" && (
            <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <UsersIcon className="h-5 w-5 text-blue-400" />
                  User Management
                  <Badge variant="secondary" className="bg-blue-600/20 text-blue-300 border-blue-600/30">
                    {users.length} total
                  </Badge>
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Manage registered users and their account status
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {users.length === 0 ? (
                  <div className="text-center py-12">
                    <UsersIcon className="h-12 w-12 text-slate-600 mx-auto mb-4" />
                    <p className="text-slate-400 text-lg mb-2">No users found</p>
                    <p className="text-slate-500 text-sm">Users will appear here once they register</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {users.map((user) => (
                      <div
                        key={user.id}
                        className="flex items-center justify-between p-4 bg-slate-700/30 rounded-lg border border-slate-600/30 hover:bg-slate-700/50 transition-all duration-200"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                              {user.username.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <span className="font-semibold text-white text-lg">{user.username}</span>
                              {user.isActive && (
                                <Badge
                                  variant="default"
                                  className="ml-2 bg-green-600/20 text-green-300 border-green-600/30"
                                >
                                  Active
                                </Badge>
                              )}
                            </div>
                          </div>
                          <div className="text-sm text-slate-400 space-y-2 ml-13">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-purple-400" />
                              <span>Joined: {formatDate(user.joinDate)}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-blue-400" />
                              <span>Last active: {formatRelativeTime(user.lastActive)}</span>
                            </div>
                            <div className="flex items-center gap-4">
                              <span className="flex items-center gap-1">
                                <Activity className="h-4 w-4 text-green-400" />
                                Watched: {user.totalWatched}
                              </span>
                              <span className="flex items-center gap-1">
                                <Star className="h-4 w-4 text-pink-400" />
                                Favorites: {user.totalFavorites}
                              </span>
                            </div>
                          </div>
                        </div>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={actionLoading === `remove-${user.id}`}
                              className="bg-red-600/10 hover:bg-red-600/20 text-red-400 border-red-600/30 hover:border-red-600/50"
                            >
                              {actionLoading === `remove-${user.id}` ? (
                                <RefreshCw className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="bg-slate-800 border-slate-700 backdrop-blur-sm">
                            <AlertDialogHeader>
                              <AlertDialogTitle className="text-white">Remove User</AlertDialogTitle>
                              <AlertDialogDescription className="text-slate-300">
                                Are you sure you want to remove user "{user.username}"? This action cannot be undone and
                                will delete all their data including favorites and watch history.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel className="bg-slate-700 text-white hover:bg-slate-600 border-slate-600">
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
            <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Key className="h-5 w-5 text-green-400" />
                      Access Code Management
                      <Badge variant="secondary" className="bg-green-600/20 text-green-300 border-green-600/30">
                        {accessCodes.length} total
                      </Badge>
                    </CardTitle>
                    <CardDescription className="text-slate-400">
                      Generate and manage access codes for user registration
                    </CardDescription>
                  </div>
                  <Button
                    onClick={generateAccessCode}
                    disabled={actionLoading === "generate"}
                    className="bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-600/25"
                  >
                    {actionLoading === "generate" ? (
                      <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Plus className="h-4 w-4 mr-2" />
                    )}
                    Generate New Code
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {accessCodes.length === 0 ? (
                  <div className="text-center py-12">
                    <Key className="h-12 w-12 text-slate-600 mx-auto mb-4" />
                    <p className="text-slate-400 text-lg mb-2">No access codes found</p>
                    <p className="text-slate-500 text-sm mb-4">
                      Generate your first access code to allow user registration
                    </p>
                    <Button
                      onClick={generateAccessCode}
                      disabled={actionLoading === "generate"}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      {actionLoading === "generate" ? (
                        <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <Plus className="h-4 w-4 mr-2" />
                      )}
                      Generate Access Code
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {accessCodes.map((code) => {
                      const { status, variant, color } = getAccessCodeStatus(code)
                      const canRevoke = status === "Active"

                      return (
                        <div
                          key={code.id}
                          className="flex items-center justify-between p-4 bg-slate-700/30 rounded-lg border border-slate-600/30 hover:bg-slate-700/50 transition-all duration-200"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-3">
                              <code className="font-mono text-lg bg-slate-600/50 px-3 py-1 rounded-md text-white border border-slate-500/50">
                                {code.code}
                              </code>
                              <Badge variant={variant} className={`${color} border-current/30 bg-current/10`}>
                                {status}
                              </Badge>
                            </div>
                            <div className="text-sm text-slate-400 space-y-2">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                <div className="flex items-center gap-2">
                                  <UsersIcon className="h-4 w-4 text-purple-400" />
                                  <span>Created by: {code.createdBy}</span>
                                </div>
                                {code.used_by && (
                                  <div className="flex items-center gap-2">
                                    <UsersIcon className="h-4 w-4 text-blue-400" />
                                    <span>Used by: {code.used_by}</span>
                                  </div>
                                )}
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                <div className="flex items-center gap-2">
                                  <Calendar className="h-4 w-4 text-green-400" />
                                  <span>Created: {formatDate(code.created_at)}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Clock className="h-4 w-4 text-yellow-400" />
                                  <span>Expires: {formatDate(code.expires_at)}</span>
                                </div>
                              </div>
                              {code.used_at && (
                                <div className="flex items-center gap-2">
                                  <Activity className="h-4 w-4 text-blue-400" />
                                  <span>Used: {formatDate(code.used_at)}</span>
                                </div>
                              )}
                            </div>
                          </div>
                          {canRevoke && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  disabled={actionLoading === `revoke-${code.id}`}
                                  className="bg-orange-600/10 hover:bg-orange-600/20 text-orange-400 border-orange-600/30 hover:border-orange-600/50"
                                >
                                  {actionLoading === `revoke-${code.id}` ? (
                                    <RefreshCw className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <Ban className="h-4 w-4" />
                                  )}
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent className="bg-slate-800 border-slate-700 backdrop-blur-sm">
                                <AlertDialogHeader>
                                  <AlertDialogTitle className="text-white">Revoke Access Code</AlertDialogTitle>
                                  <AlertDialogDescription className="text-slate-300">
                                    Are you sure you want to revoke access code "{code.code}"? This will prevent it from
                                    being used for registration. This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel className="bg-slate-700 text-white hover:bg-slate-600 border-slate-600">
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
        </div>
      </div>
    </div>
  )
}
