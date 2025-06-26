import { type NextRequest, NextResponse } from "next/server"
import { authenticateUser } from "@/lib/auth"
import { cookies } from "next/headers"
import jwt from "jsonwebtoken"

const JWT_SECRET = process.env.JWT_SECRET

export async function POST(request: NextRequest) {
  try {
    console.log("Login attempt started")

    // Check if JWT_SECRET is configured
    if (!JWT_SECRET) {
      console.error("JWT_SECRET not configured")
      return NextResponse.json({ success: false, error: "Server configuration error" }, { status: 500 })
    }

    const body = await request.json()
    console.log("Login request body received")

    const { username, password } = body

    if (!username || !password) {
      console.log("Missing username or password")
      return NextResponse.json({ success: false, error: "Username and password are required" }, { status: 400 })
    }

    console.log(`Attempting to authenticate user: ${username}`)

    const result = await authenticateUser(username, password)
    console.log("Authentication result:", { success: result.success, error: result.error })

    if (!result.success || !result.user) {
      console.log("Authentication failed:", result.error)
      return NextResponse.json({ success: false, error: result.error || "Authentication failed" }, { status: 401 })
    }

    console.log("User authenticated successfully:", result.user.username)

    // Create JWT
    const token = jwt.sign(
      {
        userId: result.user.id,
        username: result.user.username,
      },
      JWT_SECRET,
      { expiresIn: "7d" },
    )

    console.log("JWT token created")

    // Set HTTP-only cookie
    const cookieStore = cookies()
    cookieStore.set("auth-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: "/",
    })

    console.log("Auth cookie set")

    return NextResponse.json({
      success: true,
      user: result.user,
    })
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Login failed: " + (error instanceof Error ? error.message : "Unknown error"),
      },
      { status: 500 },
    )
  }
}
