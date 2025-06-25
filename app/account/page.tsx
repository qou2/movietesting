"use client"

import { useState, useEffect } from "react"
import { useDatabase } from "@/hooks/useDatabase"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import { User, Film, Tv, Clock, Copy, Calendar, BarChart3, Trophy, Edit3, Save, X } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

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
  const { userId, username, watchHistory, favorites, isLoading, updateUsername } = useDatabase()
  const { toast } = useToast()
  const [isEditingUsername, setIsEditingUsername] = useState(false)
  const [newUsername, setNewUsername] = useState("")
  const [isUpdatingUsername, setIsUpdatingUsername] = useState(false)
  const [userStats, setUserStats] = useState<UserStats | null>(null)
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])

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
        joinDate: new Date().toLocaleDateString(), // This would come from user profile in real app
      })
    }
  }, [watchHistory, favorites, isLoading])

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

  const handleUsernameEdit = () => {
    setNewUsername(username)
    setIsEditingUsername(true)
  }

  const handleUsernameSave = async () => {
    if (!newUsername.trim()) {
      toast({
        title: "Error",
        description: "Username cannot be empty",
        variant: "destructive",
      })
      return
    }

    setIsUpdatingUsername(true)
    try {
      const result = await updateUsername(newUsername.trim())
      if (result.success) {
        setIsEditingUsername(false)
        toast({
          title: "Success",
          description: "Username updated successfully!",
        })
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to update username",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update username",
        variant: "destructive",
      })
    } finally {
      setIsUpdatingUsername(false)
    }
  }

  const handleUsernameCancel = () => {
    setIsEditingUsername(false)
    setNewUsername("")
  }

  const getUserRank = () => {
    const userIndex = leaderboard.findIndex((entry) => entry.id === userId)
    return userIndex !== -1 ? userIndex + 1 : null
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a0a0a] via-[#1a0a2e] to-[#0a0a0a] flex items-center justify-center">
        <div className="text-purple-400 text-lg animate-pulse">Loading account...</div>
      </div>
    )
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

      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl flex items-center justify-center mr-4">
              <User className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-purple-600 bg-clip-text text-transparent">
                {username ? `Welcome back, ${username}!` : "Account Dashboard"}
              </h1>
              {getUserRank() && <p className="text-[#888] text-lg">Ranked #{getUserRank()} on the leaderboard</p>}
            </div>
          </div>
          <p className="text-[#888] text-lg">Manage your movie time experience</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* User Information */}
          <Card className="bg-black/60 border-2 border-purple-500/30 backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="flex items-center text-white">
                <User className="w-5 h-5 mr-2 text-purple-400" />
                User Information
              </CardTitle>
              <CardDescription className="text-[#888]">Your account details and identification</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm text-[#888] block mb-2">Username</label>
                {isEditingUsername ? (
                  <div className="flex items-center space-x-2">
                    <Input
                      value={newUsername}
                      onChange={(e) => setNewUsername(e.target.value)}
                      placeholder="Enter username"
                      className="bg-black/60 border-purple-500/30 text-white"
                      disabled={isUpdatingUsername}
                    />
                    <Button
                      onClick={handleUsernameSave}
                      size="sm"
                      disabled={isUpdatingUsername}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Save className="w-4 h-4" />
                    </Button>
                    <Button
                      onClick={handleUsernameCancel}
                      size="sm"
                      variant="outline"
                      className="border-red-500/30 hover:bg-red-600/20"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <div className="bg-purple-600/20 text-purple-300 px-3 py-2 rounded-lg text-sm flex-1">
                      {username || "No username set"}
                    </div>
                    <Button
                      onClick={handleUsernameEdit}
                      size="sm"
                      variant="outline"
                      className="border-purple-500/30 hover:bg-purple-600/20"
                    >
                      <Edit3 className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>

              <div>
                <label className="text-sm text-[#888] block mb-1">User ID</label>
                <div className="flex items-center space-x-2">
                  <code className="bg-purple-600/20 text-purple-300 px-3 py-2 rounded-lg text-sm font-mono flex-1 break-all">
                    {userId}
                  </code>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(userId)
                      toast({ title: "Copied!", description: "User ID copied to clipboard." })
                    }}
                    className="border-purple-500/30 hover:bg-purple-600/20"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div>
                <label className="text-sm text-[#888] block mb-1">Member Since</label>
                <div className="flex items-center text-white">
                  <Calendar className="w-4 h-4 mr-2 text-purple-400" />
                  {userStats?.joinDate || "Today"}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Statistics */}
          <Card className="bg-black/60 border-2 border-purple-500/30 backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="flex items-center text-white">
                <BarChart3 className="w-5 h-5 mr-2 text-purple-400" />
                Watch Statistics
              </CardTitle>
              <CardDescription className="text-[#888]">Your viewing activity overview</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {userStats && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-purple-600/20 rounded-lg">
                      <div className="text-2xl font-bold text-purple-300">{userStats.totalWatched}</div>
                      <div className="text-xs text-[#888]">Total Watched</div>
                    </div>
                    <div className="text-center p-3 bg-pink-600/20 rounded-lg">
                      <div className="text-2xl font-bold text-pink-300">{userStats.totalFavorites}</div>
                      <div className="text-xs text-[#888]">Favorites</div>
                    </div>
                  </div>

                  <Separator className="bg-purple-500/20" />

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Film className="w-4 h-4 mr-2 text-purple-400" />
                        <span className="text-white">Movies</span>
                      </div>
                      <Badge variant="outline" className="border-purple-500/30 text-purple-300">
                        {userStats.moviesWatched}
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Tv className="w-4 h-4 mr-2 text-blue-400" />
                        <span className="text-white">TV Episodes</span>
                      </div>
                      <Badge variant="outline" className="border-blue-500/30 text-blue-300">
                        {userStats.tvShowsWatched}
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Clock className="w-4 h-4 mr-2 text-green-400" />
                        <span className="text-white">Watch Time</span>
                      </div>
                      <Badge variant="outline" className="border-green-500/30 text-green-300">
                        ~{userStats.watchTimeHours}h
                      </Badge>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Leaderboard */}
        <Card className="bg-black/60 border-2 border-purple-500/30 backdrop-blur-xl mb-8">
          <CardHeader>
            <CardTitle className="flex items-center text-white">
              <Trophy className="w-5 h-5 mr-2 text-yellow-400" />
              Leaderboard
            </CardTitle>
            <CardDescription className="text-[#888]">Top users by watch time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {leaderboard.slice(0, 10).map((entry, index) => (
                <div
                  key={entry.id}
                  className={`flex items-center justify-between p-3 rounded-lg ${
                    entry.id === userId
                      ? "bg-purple-600/30 border border-purple-500/50"
                      : "bg-black/40 hover:bg-black/60"
                  } transition-colors`}
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                        index === 0
                          ? "bg-yellow-500 text-black"
                          : index === 1
                            ? "bg-gray-400 text-black"
                            : index === 2
                              ? "bg-amber-600 text-white"
                              : "bg-purple-600/50 text-white"
                      }`}
                    >
                      {index + 1}
                    </div>
                    <div>
                      <div className="text-white font-medium">{entry.username}</div>
                      <div className="text-xs text-[#888]">{entry.totalWatched} items watched</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-white font-bold">{entry.totalWatchHours}h</div>
                    <div className="text-xs text-[#888]">watch time</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* User Statistics Summary */}
        <Card className="bg-black/60 border-2 border-purple-500/30 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="flex items-center text-white">
              <BarChart3 className="w-5 h-5 mr-2 text-purple-400" />
              Activity Summary
            </CardTitle>
            <CardDescription className="text-[#888]">Your movie time journey</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {userStats && (
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-xl border border-purple-500/30">
                  <div className="text-3xl font-bold text-purple-300 mb-2">{userStats.totalWatched}</div>
                  <div className="text-sm text-[#888]">Total Items Watched</div>
                </div>
                <div className="text-center p-4 bg-gradient-to-r from-blue-600/20 to-cyan-600/20 rounded-xl border border-blue-500/30">
                  <div className="text-3xl font-bold text-blue-300 mb-2">~{userStats.watchTimeHours}h</div>
                  <div className="text-sm text-[#888]">Estimated Watch Time</div>
                </div>
              </div>
            )}

            <div className="p-4 bg-gradient-to-r from-green-600/10 to-emerald-600/10 border border-green-500/30 rounded-xl">
              <div className="text-center">
                <div className="text-lg font-semibold text-green-300 mb-1">Keep Watching!</div>
                <div className="text-sm text-[#888]">Discover new movies and TV shows to expand your collection</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="mt-12 text-center">
          <Button
            onClick={() => (window.location.href = "/")}
            variant="outline"
            className="border-purple-500/30 hover:bg-purple-600/20 text-purple-300"
          >
            Back to Movie Time
          </Button>
        </div>
      </div>
    </div>
  )
}
