import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import jwt from "jsonwebtoken"
import { supabase } from "@/lib/supabase"

export async function GET(request: NextRequest) {
  try {
    console.log("Auth check started")

    // Get JWT_SECRET from environment - fail if not set
    const JWT_SECRET = process.env.JWT_SECRET
    if (!JWT_SECRET) {
      console.error("JWT_SECRET environment variable is not set")
      return NextResponse.json(
        {
          success: false,
          error: "Server configuration error: JWT_SECRET not configured",
        },
        { status: 500 },
      )
    }

    const cookieStore = cookies()
    const token = cookieStore.get("auth-token")?.value

    if (!token) {
      console.log("No auth token found in cookies")
      return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 })
    }

    console.log("Token found, verifying with JWT_SECRET...")

    let decoded: { userId: string; username: string }
    try {
      decoded = jwt.verify(token, JWT_SECRET) as { userId: string; username: string }
      console.log("Token verified for user:", decoded.username)
    } catch (jwtError) {
      console.error("JWT verification failed:", jwtError)
      return NextResponse.json({ success: false, error: "Invalid or expired token" }, { status: 401 })
    }

    // Check Supabase connection
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
      console.error("Supabase environment variables not set")
      return NextResponse.json(
        {
          success: false,
          error: "Database configuration error",
        },
        { status: 500 },
      )
    }

    console.log("Querying database for user:", decoded.userId)

    // Get fresh user data
    const { data: user, error } = await supabase
      .from("user_profiles")
      .select("id, username, created_at, last_active")
      .eq("id", decoded.userId)
      .single()

    if (error) {
      console.error("Database error:", error)
      return NextResponse.json(
        {
          success: false,
          error: `Database query failed: ${error.message}`,
        },
        { status: 500 },
      )
    }

    if (!user) {
      console.log("User not found in database for ID:", decoded.userId)
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 })
    }

    console.log("User found successfully:", user.username)
    return NextResponse.json({
      success: true,
      user,
    })
  } catch (error) {
    console.error("Unexpected error in auth check:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 },
    )
  }
}
