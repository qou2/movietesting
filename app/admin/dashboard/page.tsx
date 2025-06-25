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
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"

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
  const { toast } = useToast()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [users, setUsers] = useState<UserData[]>([])
  const [accessCodes, setAccessCodes] = useState<AccessCodeData[]>([])
  const [activeTab, setActiveTab] = useState<"overview" | "users" | "codes" | "settings">("overview")

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
      // Load admin statistics
      const statsResponse = await fetch("/api/admin/stats")
      if (statsResponse.ok) {
        const statsData = await statsResponse.json()
        setStats(statsData.data)
      }

      // Load users data
      const usersResponse = await fetch("/api/admin/users")
      if (usersResponse.ok) {
        const usersData = await usersResponse.json()
        setUsers(usersData.data || [])
      }

      // Load access codes
      const codesResponse = await fetch("/api/admin/access-codes")
      if (codesResponse.ok) {
        const codesData = await codesResponse.json()
        setAccessCodes(codesData.data || [])
      }
    } catch (error) {
      console.error("Error loading dashboard data:", error)
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive",
      })
    }
  }

  const handleLogout = () => {
    localStorage.removeItem("admin_authenticated")
    localStorage.removeItem("admin_auth_time")
    router.push("/admin")
  }

  const revokeAccessCode = async (codeId: string) => {
    try {
      const response = await fetch("/api/admin/revoke-access-code", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ codeId }),
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Access code revoked successfully",
        })
        loadDashboardData()
      } else {
        throw new Error("Failed to revoke access code")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to revoke access code",
        variant: "destructive",
      })
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a0a0a] via-[#1a0a2e] to-[#0a0a0a] flex items-center justify-center">
        <div className="text-red-400 text-lg animate-pulse">Loading admin dashboard...</div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a0a] via-[#1a0a2e] to-[#0a0a0a] text-[#e0e0e0] p-8">
      {/* Grain texture overlay */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.03] z-[-1]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-12">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-gradient-to-r from-red-600 to-orange-600 rounded-xl flex items-center justify-center mr-4">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-red-400 via-orange-400 to-red-600 bg-clip-text text-transparent">
                Admin Dashboard
              </h1>
              <p className="text-[#888] text-lg">Movie Time Administration Panel</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <Button
              onClick={loadDashboardData}
              variant="outline"
              className="border-red-500/30 hover:bg-red-600/20 text-red-300"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            <Button
              onClick={handleLogout}
              variant="outline"
              className="border-red-500/30 hover:bg-red-600/20 text-red-300"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex space-x-4 mb-8">
          {[
            { id: "overview", label: "Overview", icon: BarChart3 },
            { id: "users", label: "Users", icon: Users },
            { id: "codes", label: "Access Codes", icon: Key },
            { id: "settings", label: "Settings", icon: Settings },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-medium transition-all duration-300 ${
                activeTab === tab.id
                  ? "bg-red-600/30 border-2 border-red-500/50 text-red-300"
                  : "bg-black/60 border-2 border-red-500/30 text-[#888] hover:bg-red-600/20 hover:text-red-300"
              }`}
            >
              <tab.icon className="w-5 h-5" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div className="space-y-8">
            {/* Stats Grid */}
            {stats && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="bg-black/60 border-2 border-red-500/30 backdrop-blur-xl">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[#888] text-sm">Total Users</p>
                        <p className="text-3xl font-bold text-red-300">{stats.totalUsers}</p>
                      </div>
                      <Users className="w-8 h-8 text-red-400" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-black/60 border-2 border-orange-500/30 backdrop-blur-xl">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[#888] text-sm">Active Codes</p>
                        <p className="text-3xl font-bold text-orange-300">{stats.activeAccessCodes}</p>
                      </div>
                      <Key className="w-8 h-8 text-orange-400" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-black/60 border-2 border-purple-500/30 backdrop-blur-xl">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[#888] text-sm">Total Watch Time</p>
                        <p className="text-3xl font-bold text-purple-300">{stats.totalWatchTime}h</p>
                      </div>
                      <Clock className="w-8 h-8 text-purple-400" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-black/60 border-2 border-green-500/30 backdrop-blur-xl">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[#888] text-sm">Total Favorites</p>
                        <p className="text-3xl font-bold text-green-300">{stats.totalFavorites}</p>
                      </div>
                      <Heart className="w-8 h-8 text-green-400" />
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Recent Activity */}
            <Card className="bg-black/60 border-2 border-red-500/30 backdrop-blur-xl">
              <CardHeader>
                <CardTitle className="flex items-center text-white">
                  <TrendingUp className="w-5 h-5 mr-2 text-red-400" />
                  Platform Statistics
                </CardTitle>
              </CardHeader>
              <CardContent>
                {stats && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center p-4 bg-red-600/20 rounded-lg">
                      <Film className="w-8 h-8 mx-auto mb-2 text-red-400" />
                      <div className="text-2xl font-bold text-red-300">{stats.totalMoviesWatched}</div>
                      <div className="text-sm text-[#888]">Movies Watched</div>
                    </div>
                    <div className="text-center p-4 bg-blue-600/20 rounded-lg">
                      <Tv className="w-8 h-8 mx-auto mb-2 text-blue-400" />
                      <div className="text-2xl font-bold text-blue-300">{stats.totalTvWatched}</div>
                      <div className="text-sm text-[#888]">TV Episodes</div>
                    </div>
                    <div className="text-center p-4 bg-green-600/20 rounded-lg">
                      <Users className="w-8 h-8 mx-auto mb-2 text-green-400" />
                      <div className="text-2xl font-bold text-green-300">{stats.activeUsers}</div>
                      <div className="text-sm text-[#888]">Active Users</div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === "users" && (
          <Card className="bg-black/60 border-2 border-red-500/30 backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="flex items-center text-white">
                <Users className="w-5 h-5 mr-2 text-red-400" />
                User Management
              </CardTitle>
              <CardDescription className="text-[#888]">Manage platform users and their activity</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {users.length > 0 ? (
                  users.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between p-4 bg-black/40 rounded-lg border border-red-500/20"
                    >
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-red-600/30 rounded-full flex items-center justify-center">
                            <Users className="w-5 h-5 text-red-400" />
                          </div>
                          <div>
                            <div className="font-medium text-white">{user.username || "Anonymous"}</div>
                            <div className="text-sm text-[#888]">ID: {user.id.slice(0, 8)}...</div>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-6 text-sm">
                        <div className="text-center">
                          <div className="text-white font-medium">{user.totalWatched}</div>
                          <div className="text-[#888]">Watched</div>
                        </div>
                        <div className="text-center">
                          <div className="text-white font-medium">{user.totalFavorites}</div>
                          <div className="text-[#888]">Favorites</div>
                        </div>
                        <div className="text-center">
                          <div className="text-white font-medium">{new Date(user.lastActive).toLocaleDateString()}</div>
                          <div className="text-[#888]">Last Active</div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-[#888]">No users found</div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Access Codes Tab */}
        {activeTab === "codes" && (
          <Card className="bg-black/60 border-2 border-red-500/30 backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="flex items-center text-white">
                <Key className="w-5 h-5 mr-2 text-red-400" />
                Access Code Management
              </CardTitle>
              <CardDescription className="text-[#888]">Monitor and manage access codes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {accessCodes.length > 0 ? (
                  accessCodes.map((code) => (
                    <div
                      key={code.id}
                      className="flex items-center justify-between p-4 bg-black/40 rounded-lg border border-red-500/20"
                    >
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-orange-600/30 rounded-full flex items-center justify-center">
                            <Key className="w-5 h-5 text-orange-400" />
                          </div>
                          <div>
                            <div className="font-mono text-white">{code.code}</div>
                            <div className="text-sm text-[#888]">Created by: {code.createdBy.slice(0, 8)}...</div>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-right text-sm">
                          <div className="text-white">Expires: {new Date(code.expiresAt).toLocaleDateString()}</div>
                          <div className="text-[#888]">Created: {new Date(code.createdAt).toLocaleDateString()}</div>
                        </div>
                        <Badge
                          variant="outline"
                          className={
                            code.isUsed
                              ? "border-gray-500/30 text-gray-400"
                              : new Date(code.expiresAt) > new Date()
                                ? "border-green-500/30 text-green-400"
                                : "border-red-500/30 text-red-400"
                          }
                        >
                          {code.isUsed ? "Used" : new Date(code.expiresAt) > new Date() ? "Active" : "Expired"}
                        </Badge>
                        {!code.isUsed && new Date(code.expiresAt) > new Date() && (
                          <Button
                            onClick={() => revokeAccessCode(code.id)}
                            size="sm"
                            variant="outline"
                            className="border-red-500/30 hover:bg-red-600/20 text-red-400"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-[#888]">No access codes found</div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Settings Tab */}
        {activeTab === "settings" && (
          <Card className="bg-black/60 border-2 border-red-500/30 backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="flex items-center text-white">
                <Settings className="w-5 h-5 mr-2 text-red-400" />
                System Settings
              </CardTitle>
              <CardDescription className="text-[#888]">Configure platform settings</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="p-4 bg-yellow-600/10 border border-yellow-500/30 rounded-lg">
                  <div className="flex items-start space-x-2">
                    <div className="w-5 h-5 bg-yellow-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-black text-xs font-bold">!</span>
                    </div>
                    <div className="text-sm text-yellow-200">
                      <p className="font-medium mb-1">Admin Panel Information:</p>
                      <ul className="space-y-1 text-yellow-300/80">
                        <li>• Admin session expires after 4 hours of inactivity</li>
                        <li>• All admin actions are logged for security</li>
                        <li>• Access codes can be revoked but not modified</li>
                        <li>• User data is automatically backed up daily</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="text-center">
                  <Button
                    onClick={() => (window.location.href = "/")}
                    variant="outline"
                    className="border-red-500/30 hover:bg-red-600/20 text-red-300"
                  >
                    Back to Movie Time
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
