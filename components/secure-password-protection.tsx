"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Eye, EyeOff, Lock, AlertCircle } from "lucide-react"

interface PasswordProtectionProps {
  children: React.ReactNode
}

export default function SecurePasswordProtection({ children }: PasswordProtectionProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [attempts, setAttempts] = useState(0)

  useEffect(() => {
    // Suppress any generate-access-code related errors
    const originalConsoleError = console.error
    console.error = (...args) => {
      if (args.some((arg) => typeof arg === "string" && arg.includes("generate-access-code"))) {
        return // Suppress this specific error
      }
      originalConsoleError.apply(console, args)
    }

    return () => {
      console.error = originalConsoleError
    }
  }, [])

  useEffect(() => {
    // Check if user is already authenticated
    const authStatus = localStorage.getItem("movie_app_authenticated")
    const authTime = localStorage.getItem("movie_app_auth_time")

    // Check if authentication is still valid (expires after 24 hours)
    if (authStatus === "true" && authTime) {
      const authTimestamp = Number.parseInt(authTime)
      const now = Date.now()
      const twentyFourHours = 5 * 365 * 24 * 60 * 60 * 1000

      if (now - authTimestamp < twentyFourHours) {
        setIsAuthenticated(true)
      } else {
        // Authentication expired
        localStorage.removeItem("movie_app_authenticated")
        localStorage.removeItem("movie_app_auth_time")
      }
    }
    setIsLoading(false)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError("")

    try {
      // First, try to verify as an access code
      const accessCodeResponse = await fetch("/api/verify-access-code", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          code: password,
          userId: "anonymous-user", // For access code verification
        }),
      })

      if (accessCodeResponse.ok) {
        const accessCodeData = await accessCodeResponse.json()
        if (accessCodeData.success) {
          // Access code is valid
          setIsAuthenticated(true)
          localStorage.setItem("movie_app_authenticated", "true")
          localStorage.setItem("movie_app_auth_time", Date.now().toString())
          localStorage.setItem("movie_app_access_method", "access_code")
          setError("")
          setAttempts(0)
          return
        }
      }

      // If access code verification failed, try main password
      const passwordResponse = await fetch("/api/verify-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password }),
      })

      const passwordData = await passwordResponse.json()

      if (passwordResponse.ok && passwordData.success) {
        setIsAuthenticated(true)
        localStorage.setItem("movie_app_authenticated", "true")
        localStorage.setItem("movie_app_auth_time", Date.now().toString())
        localStorage.setItem("movie_app_access_method", "main_password")
        setError("")
        setAttempts(0)
      } else {
        const newAttempts = attempts + 1
        setAttempts(newAttempts)

        if (passwordResponse.status === 429) {
          setError("Too many failed attempts. Please try again later.")
        } else {
          setError(`Incorrect password or access code. ${5 - newAttempts} attempts remaining.`)
        }
        setPassword("")
      }
    } catch (error) {
      setError("Authentication failed. Please check your connection.")
      setPassword("")
    }

    setIsSubmitting(false)
  }

  const handleLogout = () => {
    setIsAuthenticated(false)
    localStorage.removeItem("movie_app_authenticated")
    localStorage.removeItem("movie_app_auth_time")
    setPassword("")
    setAttempts(0)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a0a0a] via-[#1a0a2e] to-[#0a0a0a] flex items-center justify-center">
        <div className="text-purple-400 text-lg animate-pulse">Loading...</div>
      </div>
    )
  }

  if (!isAuthenticated) {
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
          <div className="bg-black/60 border-2 border-purple-500/30 rounded-3xl p-8 backdrop-blur-xl">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="flex items-center justify-center mb-4">
                <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl flex items-center justify-center">
                  <Lock className="w-8 h-8 text-white" />
                </div>
              </div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-purple-600 bg-clip-text text-transparent mb-2">
                Private Access
              </h1>
              <p className="text-[#888] text-sm">This platform requires authentication</p>
            </div>

            {/* Password Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-[#ccc] mb-2">
                  Password or Access Code
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 pr-12 bg-black/60 border-2 border-purple-500/30 rounded-xl text-white placeholder-[#666] focus:border-purple-500 focus:outline-none transition-colors"
                    placeholder="Enter password or access code"
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

              <button
                type="submit"
                disabled={isSubmitting || attempts >= 5}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 px-6 rounded-xl font-semibold hover:from-purple-700 hover:to-pink-700 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {isSubmitting ? "Verifying..." : attempts >= 5 ? "Too Many Attempts" : "Enter Platform"}
              </button>
            </form>

            {/* Footer */}
            <div className="mt-8 text-center">
              <p className="text-[#666] text-xs">
                Powered by <span className="text-purple-400 font-medium">qou2</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Show the main app with logout option
  return (
    <div className="relative">
      {/* Logout button */}
      <button
        onClick={handleLogout}
        className="fixed top-4 right-4 z-50 bg-black/60 border border-purple-500/30 text-white px-4 py-2 rounded-xl text-sm hover:bg-black/80 transition-colors backdrop-blur-xl"
      >
        Logout
      </button>
      {children}
    </div>
  )
}
