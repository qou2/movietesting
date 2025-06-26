import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import jwt from "jsonwebtoken"
import { supabase } from "@/lib/supabase"

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-this"

export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const token = cookieStore.get("auth-token")?.value

    if (!token) {
      return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 })
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; username: string }

    // Get fresh user data
    const { data: user, error } = await supabase
      .from("user_profiles")
      .select("id, username, created_at, last_active")
      .eq("id", decoded.userId)
      .single()

    if (error || !user) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      user,
    })
  } catch (error) {
    console.error("Auth check error:", error)
    return NextResponse.json({ success: false, error: "Invalid token" }, { status: 401 })
  }
}
