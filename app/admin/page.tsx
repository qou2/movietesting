"use client"

import type React from "react"

import { useState } from "react"
import { Shield, Eye, EyeOff, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function AdminLogin() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [attempts, setAttempts] = useState(0)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError("")

    try {
      const response = await fetch("/api/admin-login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        // Store admin session
        localStorage.setItem("admin_authenticated", "true")
        localStorage.setItem("admin_auth_time", Date.now().toString())

        // Redirect to admin dashboard
        window.location.href = "/admin/dashboard"
      } else {
        const newAttempts = attempts + 1
        setAttempts(newAttempts)

        if (response.status === 429) {
          setError("Too many failed attempts. Please try again later.")
        } else {
          setError(`Invalid credentials. ${5 - newAttempts} attempts remaining.`)
        }
        setPassword("")
      }
    } catch (error) {
      setError("Authentication failed. Please check your connection.")
      setPassword("")
    }

    setIsSubmitting(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a0a] via-[#1a0a2e] to-[#0a0a0a] flex items-center justify-center p-8">
      {/* Grain texture overlay */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.03] z-[-1]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />

      <div className="max-w-md w-full">
        <Card className="bg-black/60 border-2 border-red-500/30 backdrop-blur-xl">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center mb-4">
              <div className="w-16 h-16 bg-gradient-to-r from-red-600 to-orange-600 rounded-2xl flex items-center justify-center">
                <Shield className="w-8 h-8 text-white" />
              </div>
            </div>
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-red-400 via-orange-400 to-red-600 bg-clip-text text-transparent">
              Admin Access
            </CardTitle>
            <CardDescription className="text-[#888]">
              Restricted area - Administrator credentials required
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-[#ccc] mb-2">
                  Username
                </label>
                <Input
                  type="text"
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="bg-black/60 border-2 border-red-500/30 text-white placeholder-[#666] focus:border-red-500"
                  placeholder="Enter admin username"
                  required
                  disabled={isSubmitting || attempts >= 5}
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-[#ccc] mb-2">
                  Password
                </label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-black/60 border-2 border-red-500/30 text-white placeholder-[#666] focus:border-red-500 pr-12"
                    placeholder="Enter admin password"
                    required
                    disabled={isSubmitting || attempts >= 5}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#666] hover:text-white transition-colors"
                    disabled={isSubmitting}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-xl text-red-400 text-sm flex items-center">
                  <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0" />
                  {error}
                </div>
              )}

              {attempts > 0 && attempts < 5 && (
                <div className="p-3 bg-yellow-500/20 border border-yellow-500/30 rounded-xl text-yellow-400 text-sm">
                  {attempts} failed attempt{attempts > 1 ? "s" : ""}. {5 - attempts} remaining.
                </div>
              )}

              <Button
                type="submit"
                disabled={isSubmitting || attempts >= 5}
                className="w-full bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white"
              >
                {isSubmitting ? "Authenticating..." : attempts >= 5 ? "Too Many Attempts" : "Access Admin Panel"}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <Button
                variant="ghost"
                onClick={() => (window.location.href = "/")}
                className="text-[#666] hover:text-white"
              >
                ← Back to Movie Time
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
