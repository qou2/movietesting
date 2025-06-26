import { type NextRequest, NextResponse } from "next/server"
import { createUser } from "@/lib/auth"
import { cookies } from "next/headers"
import jwt from "jsonwebtoken"

export async function POST(request: NextRequest) {
  try {
    console.log("=== REGISTRATION REQUEST STARTED ===")

    const { username, password, confirmPassword, accessCode } = await request.json()

    console.log("Registration data received:")
    console.log("- Username:", username)
    console.log("- Password length:", password?.length)
    console.log("- Access code provided:", accessCode ? `"${accessCode}"` : "NONE")
    console.log(
      "- Environment MOVIE_APP_PASSWORD:",
      process.env.MOVIE_APP_PASSWORD ? `"${process.env.MOVIE_APP_PASSWORD}"` : "NOT SET",
    )

    // Validation
    if (!username || !password || !confirmPassword || !accessCode) {
      console.log("Missing required fields")
      return NextResponse.json({ success: false, error: "All fields are required" }, { status: 400 })
    }

    if (password !== confirmPassword) {
      console.log("Passwords do not match")
      return NextResponse.json({ success: false, error: "Passwords do not match" }, { status: 400 })
    }

    if (password.length < 6) {
      console.log("Password too short:", password.length)
      return NextResponse.json(
        { success: false, error: "Password must be at least 6 characters long" },
        { status: 400 },
      )
    }

    if (username.length < 3) {
      console.log("Username too short:", username.length)
      return NextResponse.json(
        { success: false, error: "Username must be at least 3 characters long" },
        { status: 400 },
      )
    }

    console.log("Calling createUser function...")
    const result = await createUser(username, password, accessCode)
    console.log("createUser result:", result)

    if (!result.success || !result.user) {
      console.log("User creation failed:", result.error)
      return NextResponse.json({ success: false, error: result.error }, { status: 400 })
    }

    // Get JWT_SECRET
    const JWT_SECRET = process.env.JWT_SECRET
    if (!JWT_SECRET) {
      console.error("JWT_SECRET not configured")
      return NextResponse.json({ success: false, error: "Server configuration error" }, { status: 500 })
    }

    // Create JWT
    const token = jwt.sign(
      {
        userId: result.user.id,
        username: result.user.username,
      },
      JWT_SECRET,
      { expiresIn: "7d" },
    )

    // Set HTTP-only cookie
    const cookieStore = cookies()
    cookieStore.set("auth-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60, // 7 days
    })

    console.log("Registration successful for user:", result.user.username)
    return NextResponse.json({
      success: true,
      user: result.user,
    })
  } catch (error) {
    console.error("Registration error:", error)
    return NextResponse.json({ success: false, error: "Registration failed" }, { status: 500 })
  }
}
