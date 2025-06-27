"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
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
import { useToast } from "@/hooks/use-toast"
import { Users, Key, Trash2, UserX, RefreshCw } from "lucide-react"

interface User {
  id: string
  username: string
  created_at: string
  last_active: string
}

interface AccessCode {
  id: string
  code: string
  created_by: string
  used_by: string | null
  created_at: string
  used_at: string | null
  expires_at: string
  is_active: boolean
  is_used: boolean
  admin_action: string | null
  created_by_username: string | null
  used_by_username: string | null
}

interface Stats {
  totalUsers: number
  activeUsers: number
  totalAccessCodes: number
  usedAccessCodes: number
  expiredAccessCodes: number
}

export default function AdminDashboard() {
  const [users, setUsers] = useState<User[]>([])
  const [accessCodes, setAccessCodes] = useState<AccessCode[]>([])
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    activeUsers: 0,
    totalAccessCodes: 0,
    usedAccessCodes: 0,
    expiredAccessCodes: 0,
  })
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  const fetchData = async () => {
    setLoading(true)
    try {
      // Fetch users
      const usersResponse = await fetch("/api/admin/users")
      const usersData = await usersResponse.json()

      if (usersData.error) {
        throw new Error(usersData.error)
      }

      setUsers(usersData.users || [])

      // Fetch access codes
      const codesResponse = await fetch("/api/admin/access-codes")
      const codesData = await codesResponse.json()

      if (codesData.error) {
        throw new Error(codesData.error)
      }

      setAccessCodes(codesData.accessCodes || [])

      // Fetch stats
      const statsResponse = await fetch("/api/admin/stats")
      const statsData = await statsResponse.json()

      if (statsData.error) {
        throw new Error(statsData.error)
      }

      setStats(statsData.stats || stats)
    } catch (error) {
      console.error("Error fetching data:", error)
      toast({
        title: "Error",
        description: "Failed to fetch dashboard data",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const removeUser = async (userId: string, username: string) => {
    try {
      const response = await fetch("/api/admin/remove-user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId }),
      })

      const data = await response.json()

      if (data.error) {
        throw new Error(data.error)
      }

      toast({
        title: "Success",
        description: `User ${username} has been removed`,
      })

      fetchData() // Refresh data
    } catch (error) {
      console.error("Error removing user:", error)
      toast({
        title: "Error",
        description: "Failed to remove user",
        variant: "destructive",
      })
    }
  }

  const revokeAccessCode = async (codeId: string, code: string) => {
    try {
      const response = await fetch("/api/admin/revoke-access-code", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ codeId }),
      })

      const data = await response.json()

      if (data.error) {
        throw new Error(data.error)
      }

      toast({
        title: "Success",
        description: `Access code ${code} has been revoked`,
      })

      fetchData() // Refresh data
    } catch (error) {
      console.error("Error revoking access code:", error)
      toast({
        title: "Error",
        description: "Failed to revoke access code",
        variant: "destructive",
      })
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  const isExpired = (expiresAt: string) => {
    return new Date(expiresAt) < new Date()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="flex items-center space-x-2 text-white">
          <RefreshCw className="h-4 w-4 animate-spin" />
          <span>Loading dashboard...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto p-6 max-w-7xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            <p className="text-gray-400 mt-2">Manage users and access codes</p>
          </div>
          <Button
            onClick={fetchData}
            variant="outline"
            className="border-gray-700 text-white hover:bg-gray-800 bg-transparent"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">Total Users</CardTitle>
              <Users className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{stats.totalUsers}</div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">Active Users</CardTitle>
              <Users className="h-4 w-4 text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{stats.activeUsers}</div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">Total Codes</CardTitle>
              <Key className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{stats.totalAccessCodes}</div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">Used Codes</CardTitle>
              <Key className="h-4 w-4 text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{stats.usedAccessCodes}</div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">Expired Codes</CardTitle>
              <Key className="h-4 w-4 text-red-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{stats.expiredAccessCodes}</div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="users" className="space-y-6">
          <TabsList className="bg-gray-900 border-gray-800">
            <TabsTrigger value="users" className="data-[state=active]:bg-gray-800 data-[state=active]:text-white">
              Users
            </TabsTrigger>
            <TabsTrigger
              value="access-codes"
              className="data-[state=active]:bg-gray-800 data-[state=active]:text-white"
            >
              Access Codes
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users">
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white">Users</CardTitle>
                <CardDescription className="text-gray-400">Manage registered users</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow className="border-gray-800">
                      <TableHead className="text-gray-400">Username</TableHead>
                      <TableHead className="text-gray-400">Created</TableHead>
                      <TableHead className="text-gray-400">Last Active</TableHead>
                      <TableHead className="text-gray-400">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id} className="border-gray-800">
                        <TableCell className="text-white font-medium">{user.username}</TableCell>
                        <TableCell className="text-gray-400">{formatDate(user.created_at)}</TableCell>
                        <TableCell className="text-gray-400">{formatDate(user.last_active)}</TableCell>
                        <TableCell>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                className="border-red-600 text-red-400 hover:bg-red-600 hover:text-white bg-transparent"
                              >
                                <UserX className="h-4 w-4 mr-1" />
                                Remove
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="bg-gray-900 border-gray-800">
                              <AlertDialogHeader>
                                <AlertDialogTitle className="text-white">Remove User</AlertDialogTitle>
                                <AlertDialogDescription className="text-gray-400">
                                  Are you sure you want to remove user "{user.username}"? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel className="border-gray-700 text-white hover:bg-gray-800">
                                  Cancel
                                </AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => removeUser(user.id, user.username)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Remove
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="access-codes">
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white">Access Codes</CardTitle>
                <CardDescription className="text-gray-400">Manage access codes and their usage</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow className="border-gray-800">
                      <TableHead className="text-gray-400">Code</TableHead>
                      <TableHead className="text-gray-400">Status</TableHead>
                      <TableHead className="text-gray-400">Created By</TableHead>
                      <TableHead className="text-gray-400">Used By</TableHead>
                      <TableHead className="text-gray-400">Created</TableHead>
                      <TableHead className="text-gray-400">Expires</TableHead>
                      <TableHead className="text-gray-400">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {accessCodes.map((code) => (
                      <TableRow key={code.id} className="border-gray-800">
                        <TableCell className="text-white font-mono">{code.code}</TableCell>
                        <TableCell>
                          {code.is_used ? (
                            <Badge variant="secondary" className="bg-blue-600 text-white">
                              Used
                            </Badge>
                          ) : isExpired(code.expires_at) ? (
                            <Badge variant="destructive" className="bg-red-600 text-white">
                              Expired
                            </Badge>
                          ) : code.is_active ? (
                            <Badge variant="default" className="bg-green-600 text-white">
                              Active
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="border-gray-600 text-gray-400">
                              Inactive
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-gray-400">{code.created_by_username || "Unknown"}</TableCell>
                        <TableCell className="text-gray-400">{code.used_by_username || "-"}</TableCell>
                        <TableCell className="text-gray-400">{formatDate(code.created_at)}</TableCell>
                        <TableCell className="text-gray-400">{formatDate(code.expires_at)}</TableCell>
                        <TableCell>
                          {code.is_active && !code.is_used && !isExpired(code.expires_at) && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="border-red-600 text-red-400 hover:bg-red-600 hover:text-white bg-transparent"
                                >
                                  <Trash2 className="h-4 w-4 mr-1" />
                                  Revoke
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent className="bg-gray-900 border-gray-800">
                                <AlertDialogHeader>
                                  <AlertDialogTitle className="text-white">Revoke Access Code</AlertDialogTitle>
                                  <AlertDialogDescription className="text-gray-400">
                                    Are you sure you want to revoke access code "{code.code}"? This action cannot be
                                    undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel className="border-gray-700 text-white hover:bg-gray-800">
                                    Cancel
                                  </AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => revokeAccessCode(code.id, code.code)}
                                    className="bg-red-600 hover:bg-red-700"
                                  >
                                    Revoke
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
