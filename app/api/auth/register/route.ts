import { type NextRequest, NextResponse } from "next/server"
import { createUser } from "@/lib/auth"
import { cookies } from "next/headers"
import jwt from "jsonwebtoken"

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-this"

export async function POST(request: NextRequest) {
  try {
    const { username, password, confirmPassword, accessCode } = await request.json()

    // Validation
    if (!username || !password || !confirmPassword || !accessCode) {
      return NextResponse.json({ success: false, error: "All fields are required" }, { status: 400 })
    }

    if (password !== confirmPassword) {
      return NextResponse.json({ success: false, error: "Passwords do not match" }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json(
        { success: false, error: "Password must be at least 6 characters long" },
        { status: 400 },
      )
    }

    if (username.length < 3) {
      return NextResponse.json(
        { success: false, error: "Username must be at least 3 characters long" },
        { status: 400 },
      )
    }

    const result = await createUser(username, password, accessCode)

    if (!result.success || !result.user) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 })
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

    return NextResponse.json({
      success: true,
      user: result.user,
    })
  } catch (error) {
    console.error("Registration error:", error)
    return NextResponse.json({ success: false, error: "Registration failed" }, { status: 500 })
  }
}
