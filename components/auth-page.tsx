"use client"

import type React from "react"
import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Play, User, UserPlus, Eye, EyeOff, AlertCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface AuthPageProps {
  onAuthSuccess: () => void
}

export default function AuthPage({ onAuthSuccess }: AuthPageProps) {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  // Login
  const [loginData, setLoginData] = useState({
    username: "",
    password: "",
  })

  // Register form state
  const [registerData, setRegisterData] = useState({
    username: "",
    password: "",
    confirmPassword: "",
    accessCode: "",
  })

  const [error, setError] = useState("")

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(loginData),
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Welcome back!",
          description: `Logged in as ${data.user.username}`,
        })
        onAuthSuccess()
      } else {
        setError(data.error || "Login failed")
      }
    } catch (error) {
      setError("Network error. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(registerData),
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Account created!",
          description: `Welcome to Movie Time, ${data.user.username}!`,
        })
        onAuthSuccess()
      } else {
        setError(data.error || "Registration failed")
      }
    } catch (error) {
      setError("Network error. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div
      className="min-h-screen text-white flex items-center justify-center p-8"
      style={{
        background: "linear-gradient(135deg, #0a0a0a 0%, #1a0a2e 50%, #0a0a0a 100%)",
        color: "#e0e0e0",
        minHeight: "100vh",
        fontFamily: "Inter, -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      {/* Grain texture overlay */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.03] z-[-1]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />

      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center mr-4"
              style={{
                background: "linear-gradient(135deg, #9333ea 0%, #ec4899 100%)",
              }}
            >
              <Play className="w-6 h-6 text-white" />
            </div>
            <h1
              className="text-4xl font-bold"
              style={{
                background: "linear-gradient(135deg, #a855f7 0%, #f472b6 50%, #9333ea 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              movie time
            </h1>
          </div>
          <p style={{ color: "#888", fontSize: "1.125rem" }}>Sign in to access unlimited streaming</p>
        </div>

        <Card
          className="border-2 backdrop-blur-xl"
          style={{
            backgroundColor: "rgba(0, 0, 0, 0.6)",
            borderColor: "rgba(147, 51, 234, 0.3)",
            backdropFilter: "blur(12px)",
          }}
        >
          <CardHeader className="text-center">
            <CardTitle style={{ color: "white" }}>Welcome</CardTitle>
            <CardDescription style={{ color: "#888" }}>Sign in to your account or create a new one</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2" style={{ backgroundColor: "rgba(0, 0, 0, 0.4)" }}>
                <TabsTrigger value="login" className="data-[state=active]:bg-purple-600" style={{ color: "white" }}>
                  <User className="w-4 h-4 mr-2" />
                  Sign In
                </TabsTrigger>
                <TabsTrigger value="register" className="data-[state=active]:bg-purple-600" style={{ color: "white" }}>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Sign Up
                </TabsTrigger>
              </TabsList>

              {error && (
                <Alert
                  className="mt-4"
                  style={{
                    borderColor: "rgba(239, 68, 68, 0.3)",
                    backgroundColor: "rgba(239, 68, 68, 0.1)",
                  }}
                >
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription style={{ color: "#f87171" }}>{error}</AlertDescription>
                </Alert>
              )}

              <TabsContent value="login" className="space-y-4 mt-6">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-username" style={{ color: "white" }}>
                      Username
                    </Label>
                    <Input
                      id="login-username"
                      type="text"
                      value={loginData.username}
                      onChange={(e) => setLoginData({ ...loginData, username: e.target.value })}
                      placeholder="Enter your username"
                      required
                      disabled={isLoading}
                      style={{
                        backgroundColor: "rgba(0, 0, 0, 0.6)",
                        borderColor: "rgba(147, 51, 234, 0.3)",
                        color: "white",
                      }}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password" style={{ color: "white" }}>
                      Password
                    </Label>
                    <div className="relative">
                      <Input
                        id="login-password"
                        type={showPassword ? "text" : "password"}
                        value={loginData.password}
                        onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                        placeholder="Enter your password"
                        required
                        disabled={isLoading}
                        style={{
                          backgroundColor: "rgba(0, 0, 0, 0.6)",
                          borderColor: "rgba(147, 51, 234, 0.3)",
                          color: "white",
                          paddingRight: "2.5rem",
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        style={{
                          position: "absolute",
                          right: "0.75rem",
                          top: "50%",
                          transform: "translateY(-50%)",
                          color: "#888",
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                        }}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isLoading}
                    style={{
                      background: "linear-gradient(135deg, #9333ea 0%, #ec4899 100%)",
                      color: "white",
                      border: "none",
                      padding: "0.5rem 1rem",
                      borderRadius: "0.375rem",
                      cursor: isLoading ? "not-allowed" : "pointer",
                      opacity: isLoading ? 0.7 : 1,
                    }}
                  >
                    {isLoading ? "Signing in..." : "Sign In"}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="register" className="space-y-4 mt-6">
                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="register-username" style={{ color: "white" }}>
                      Username
                    </Label>
                    <Input
                      id="register-username"
                      type="text"
                      value={registerData.username}
                      onChange={(e) => setRegisterData({ ...registerData, username: e.target.value })}
                      placeholder="Choose a username (min 3 characters)"
                      required
                      disabled={isLoading}
                      minLength={3}
                      style={{
                        backgroundColor: "rgba(0, 0, 0, 0.6)",
                        borderColor: "rgba(147, 51, 234, 0.3)",
                        color: "white",
                      }}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register-password" style={{ color: "white" }}>
                      Password
                    </Label>
                    <div className="relative">
                      <Input
                        id="register-password"
                        type={showPassword ? "text" : "password"}
                        value={registerData.password}
                        onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                        placeholder="Create a password (min 6 characters)"
                        required
                        disabled={isLoading}
                        minLength={6}
                        style={{
                          backgroundColor: "rgba(0, 0, 0, 0.6)",
                          borderColor: "rgba(147, 51, 234, 0.3)",
                          color: "white",
                          paddingRight: "2.5rem",
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        style={{
                          position: "absolute",
                          right: "0.75rem",
                          top: "50%",
                          transform: "translateY(-50%)",
                          color: "#888",
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                        }}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register-confirm-password" style={{ color: "white" }}>
                      Confirm Password
                    </Label>
                    <div className="relative">
                      <Input
                        id="register-confirm-password"
                        type={showConfirmPassword ? "text" : "password"}
                        value={registerData.confirmPassword}
                        onChange={(e) => setRegisterData({ ...registerData, confirmPassword: e.target.value })}
                        placeholder="Confirm your password"
                        required
                        disabled={isLoading}
                        style={{
                          backgroundColor: "rgba(0, 0, 0, 0.6)",
                          borderColor: "rgba(147, 51, 234, 0.3)",
                          color: "white",
                          paddingRight: "2.5rem",
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        style={{
                          position: "absolute",
                          right: "0.75rem",
                          top: "50%",
                          transform: "translateY(-50%)",
                          color: "#888",
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                        }}
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register-access-code" style={{ color: "white" }}>
                      Access Code
                    </Label>
                    <Input
                      id="register-access-code"
                      type="text"
                      value={registerData.accessCode}
                      onChange={(e) => setRegisterData({ ...registerData, accessCode: e.target.value.toUpperCase() })}
                      placeholder="Enter your access code"
                      required
                      disabled={isLoading}
                      style={{
                        backgroundColor: "rgba(0, 0, 0, 0.6)",
                        borderColor: "rgba(147, 51, 234, 0.3)",
                        color: "white",
                        fontFamily: "monospace",
                      }}
                    />
                    <p style={{ fontSize: "0.75rem", color: "#666" }}>
                      You need a valid access code to create an account
                    </p>
                  </div>
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isLoading}
                    style={{
                      background: "linear-gradient(135deg, #9333ea 0%, #ec4899 100%)",
                      color: "white",
                      border: "none",
                      padding: "0.5rem 1rem",
                      borderRadius: "0.375rem",
                      cursor: isLoading ? "not-allowed" : "pointer",
                      opacity: isLoading ? 0.7 : 1,
                    }}
                  >
                    {isLoading ? "Creating account..." : "Create Account"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <div className="mt-8 text-center">
          <p style={{ color: "#666", fontSize: "0.875rem" }}>Need an access code? Contact an administrator</p>
        </div>
      </div>
    </div>
  )
}
