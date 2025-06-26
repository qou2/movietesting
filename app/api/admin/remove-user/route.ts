import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function POST(request: NextRequest) {
  try {
    console.log("Remove user request received")

    const body = await request.json()
    console.log("Request body:", body)

    const { userId } = body

    if (!userId) {
      console.log("Missing userId in request")
      return NextResponse.json({ success: false, error: "User ID is required" }, { status: 400 })
    }

    if (!supabaseUrl || !supabaseServiceKey) {
      console.log("Missing Supabase environment variables")
      return NextResponse.json({ success: false, error: "Server configuration error" }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // First check if the user exists
    const { data: existingUser, error: fetchError } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("id", userId)
      .single()

    if (fetchError) {
      console.error("Error fetching user:", fetchError)
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 })
    }

    console.log("Found user:", existingUser)

    // Delete user's related data first (cascading delete)

    // Delete favorites
    const { error: favoritesError } = await supabase.from("favorites").delete().eq("user_id", userId)

    if (favoritesError) {
      console.error("Error deleting user favorites:", favoritesError)
    }

    // Delete watch history
    const { error: watchHistoryError } = await supabase.from("watch_history").delete().eq("user_id", userId)

    if (watchHistoryError) {
      console.error("Error deleting user watch history:", watchHistoryError)
    }

    // Delete access codes created by this user
    const { error: accessCodesError } = await supabase.from("access_codes").delete().eq("created_by", userId)

    if (accessCodesError) {
      console.error("Error deleting user access codes:", accessCodesError)
    }

    // Finally delete the user profile
    const { data, error } = await supabase.from("user_profiles").delete().eq("id", userId).select()

    if (error) {
      console.error("Error deleting user profile:", error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    console.log("User removed successfully:", data)

    return NextResponse.json({
      success: true,
      message: "User removed successfully",
      data,
    })
  } catch (error) {
    console.error("Remove user error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to remove user",
      },
      { status: 500 },
    )
  }
}
