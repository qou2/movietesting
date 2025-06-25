import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  try {
    const { userId, username } = await request.json()

    if (!userId || typeof userId !== "string") {
      return NextResponse.json({ error: "Invalid user ID" }, { status: 400 })
    }

    if (!username || typeof username !== "string" || username.trim().length === 0) {
      return NextResponse.json({ error: "Invalid username" }, { status: 400 })
    }

    const trimmedUsername = username.trim()

    // Check if username is already taken
    const { data: existingUser } = await supabase
      .from("user_profiles")
      .select("id")
      .eq("username", trimmedUsername)
      .neq("id", userId)
      .single()

    if (existingUser) {
      return NextResponse.json({ error: "Username already taken" }, { status: 409 })
    }

    // Update the user's username
    const { error } = await supabase.from("user_profiles").update({ username: trimmedUsername }).eq("id", userId)

    if (error) {
      console.error("Error updating username:", error)
      return NextResponse.json({ error: "Failed to update username" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Username update error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
