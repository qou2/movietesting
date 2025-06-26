"use client"

import type React from "react"
import { useState, useEffect, createContext, useContext } from "react"
import type { User } from "@/lib/auth"
import AuthPage from "./auth-page"

interface AuthContextType {
  user: User | null
  isLoading: boolean
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider")
  }
  return context
}

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const checkAuth = async () => {
    try {
      console.log("Checking authentication...")
      const response = await fetch("/api/auth/me", {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      })

      console.log("Auth response status:", response.status)

      if (response.ok) {
        const data = await response.json()
        console.log("Auth response:", data)

        if (data.success && data.user) {
          setUser(data.user)
          console.log("User authenticated:", data.user.username)
        } else {
          setUser(null)
          console.log("User not authenticated")
        }
      } else {
        console.log("Not authenticated (expected for first visit)")
        setUser(null)
      }
    } catch (error) {
      console.error("Auth check failed:", error)
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }

  const logout = async () => {
    try {
      console.log("Logging out...")
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      })
      setUser(null)
      console.log("Logged out successfully")
    } catch (error) {
      console.error("Logout failed:", error)
      setUser(null)
    }
  }

  const refreshUser = async () => {
    console.log("Refreshing user...")
    setIsLoading(true)
    await checkAuth()
  }

  useEffect(() => {
    checkAuth()
  }, [])

  const loadingStyle: React.CSSProperties = {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #0a0a0a 0%, #1a0a2e 50%, #0a0a0a 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, sans-serif",
  }

  const loadingTextStyle: React.CSSProperties = {
    color: "#a855f7",
    fontSize: "1.125rem",
    animation: "pulse 2s infinite",
  }

  // Show loading spinner
  if (isLoading) {
    return (
      <div style={loadingStyle}>
        <div style={loadingTextStyle}>Loading...</div>
      </div>
    )
  }

  // Show login page if not authenticated
  if (!user) {
    console.log("Showing auth page")
    return <AuthPage onAuthSuccess={refreshUser} />
  }

  // Show main app if authenticated
  console.log("Showing main app for user:", user.username)
  return <AuthContext.Provider value={{ user, isLoading, logout, refreshUser }}>{children}</AuthContext.Provider>
}
