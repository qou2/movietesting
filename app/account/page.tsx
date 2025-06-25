"use client"

import { useState, useEffect } from "react"
import { useDatabase } from "@/hooks/useDatabase"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { User, Film, Tv, Clock, Key, Copy, CheckCircle, Calendar, BarChart3 } from "lucide-react"
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

export default function AccountPage() {
  const { userId, watchHistory, favorites, isLoading } = useDatabase()
  const { toast } = useToast()
  const [accessCode, setAccessCode] = useState<AccessCode | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [copied, setCopied] = useState(false)
  const [userStats, setUserStats] = useState<UserStats | null>(null)

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

  const generateAccessCode = async () => {
    if (!userId) {
      toast({
        title: "Error",
        description: "User not authenticated",
        variant: "destructive",
      })
      return
    }

    setIsGenerating(true)
    try {
      const response = await fetch("/api/generate-access-code", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId }),
      })

      const data = await response.json()

      if (data.success) {
        setAccessCode({
          code: data.code,
          expiresAt: data.expiresAt,
        })
        toast({
          title: "Access Code Generated",
          description: "Your one-time access code has been created successfully.",
        })
      } else {
        throw new Error(data.error || "Failed to generate access code")
      }
    } catch (error) {
      console.error("Error generating access code:", error)
      toast({
        title: "Error",
        description: "Failed to generate access code. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const copyToClipboard = async () => {
    if (!accessCode) return

    try {
      await navigator.clipboard.writeText(accessCode.code)
      setCopied(true)
      toast({
        title: "Copied!",
        description: "Access code copied to clipboard.",
      })
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy to clipboard.",
        variant: "destructive",
      })
    }
  }

  const formatExpiryTime = (expiresAt: string) => {
    const expiry = new Date(expiresAt)
    const now = new Date()
    const diffHours = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60))
    return `${diffHours} hours`
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

      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl flex items-center justify-center mr-4">
              <User className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-purple-600 bg-clip-text text-transparent">
              Account Dashboard
            </h1>
          </div>
          <p className="text-[#888] text-lg">Manage your movie time experience</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
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

          {/* Access Code Generator */}
          <Card className="bg-black/60 border-2 border-purple-500/30 backdrop-blur-xl lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center text-white">
                <Key className="w-5 h-5 mr-2 text-purple-400" />
                One-Time Access Code
              </CardTitle>
              <CardDescription className="text-[#888]">
                Generate a temporary access code to share with others. Each code can only be used once and expires in 24
                hours.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {!accessCode ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-purple-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Key className="w-8 h-8 text-purple-400" />
                  </div>
                  <p className="text-[#888] mb-4">No active access code</p>
                  <Button
                    onClick={generateAccessCode}
                    disabled={isGenerating}
                    className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                  >
                    {isGenerating ? "Generating..." : "Generate Access Code"}
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="p-6 bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-xl border border-purple-500/30">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-white">Active Access Code</h3>
                      <Badge className="bg-green-600/20 text-green-300 border-green-500/30">Active</Badge>
                    </div>

                    <div className="flex items-center space-x-3 mb-4">
                      <code className="bg-black/40 text-purple-300 px-4 py-3 rounded-lg text-xl font-mono tracking-wider flex-1 text-center border border-purple-500/30">
                        {accessCode.code}
                      </code>
                      <Button
                        onClick={copyToClipboard}
                        variant="outline"
                        className="border-purple-500/30 hover:bg-purple-600/20"
                      >
                        {copied ? <CheckCircle className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                      </Button>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <span className="text-[#888]">Expires in: {formatExpiryTime(accessCode.expiresAt)}</span>
                      <Button
                        onClick={generateAccessCode}
                        variant="ghost"
                        size="sm"
                        disabled={isGenerating}
                        className="text-purple-400 hover:text-purple-300 hover:bg-purple-600/20"
                      >
                        Generate New
                      </Button>
                    </div>
                  </div>

                  <div className="p-4 bg-yellow-600/10 border border-yellow-500/30 rounded-lg">
                    <div className="flex items-start space-x-2">
                      <div className="w-5 h-5 bg-yellow-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-black text-xs font-bold">!</span>
                      </div>
                      <div className="text-sm text-yellow-200">
                        <p className="font-medium mb-1">Important:</p>
                        <ul className="space-y-1 text-yellow-300/80">
                          <li>• This code can only be used once</li>
                          <li>• It will expire in 24 hours</li>
                          <li>• Generating a new code will deactivate the current one</li>
                          <li>• Share this code securely with trusted users only</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

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
