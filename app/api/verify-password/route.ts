import { type NextRequest, NextResponse } from "next/server"
import { headers } from "next/headers"

// Rate limiting store (in production, use Redis or database)
const attempts = new Map<string, { count: number; lastAttempt: number }>()

export async function POST(request: NextRequest) {
  try {
    // Get client IP for rate limiting
    const headersList = headers()
    const forwarded = headersList.get("x-forwarded-for")
    const ip = forwarded ? forwarded.split(",")[0] : "unknown"

    // Rate limiting: max 5 attempts per 15 minutes
    const now = Date.now()
    const userAttempts = attempts.get(ip) || { count: 0, lastAttempt: 0 }

    // Reset attempts if 15 minutes have passed
    if (now - userAttempts.lastAttempt > 15 * 60 * 1000) {
      userAttempts.count = 0
    }

    // Check if user has exceeded attempts
    if (userAttempts.count >= 5) {
      return NextResponse.json({ error: "Too many attempts. Please try again later." }, { status: 429 })
    }

    const { password } = await request.json()

    // Validate input
    if (!password || typeof password !== "string") {
      return NextResponse.json({ error: "Invalid password format" }, { status: 400 })
    }

    // Get password from environment variable
    const correctPassword = process.env.MOVIE_APP_PASSWORD

    if (!correctPassword) {
      console.error("MOVIE_APP_PASSWORD environment variable not set")
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 })
    }

    if (password === correctPassword) {
      // Reset attempts on successful login
      attempts.delete(ip)
      return NextResponse.json({ success: true })
    } else {
      // Increment failed attempts
      userAttempts.count += 1
      userAttempts.lastAttempt = now
      attempts.set(ip, userAttempts)

      return NextResponse.json({ success: false }, { status: 401 })
    }
  } catch (error) {
    console.error("Password verification error:", error)
    return NextResponse.json({ error: "Invalid request" }, { status: 400 })
  }
}
