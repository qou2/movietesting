import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function POST(request: Request) {
  try {
    console.log("👤 Remove user request started")

    const { userId } = await request.json()
    console.log("📝 User ID to remove:", userId)

    if (!userId || typeof userId !== "string") {
      console.log("❌ Invalid user ID provided")
      return NextResponse.json({ success: false, error: "Invalid user ID" }, { status: 400 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // First, check if the user exists
    const { data: existingUser, error: fetchError } = await supabase
      .from("user_profiles")
      .select("id, username")
      .eq("id", userId)
      .single()

    if (fetchError) {
      console.error("❌ Error fetching user:", fetchError)
      return NextResponse.json(
        {
          success: false,
          error: "User not found",
          details: fetchError.message,
        },
        { status: 404 },
      )
    }

    console.log("📊 Found user:", {
      id: existingUser.id,
      username: existingUser.username,
    })

    // Start transaction-like operations
    // Delete user's favorites
    const { error: favoritesError } = await supabase.from("favorites").delete().eq("user_id", userId)

    if (favoritesError) {
      console.error("❌ Error deleting user favorites:", favoritesError)
      // Continue anyway, this is not critical
    } else {
      console.log("✅ User favorites deleted")
    }

    // Delete user's watch history
    const { error: watchHistoryError } = await supabase.from("watch_history").delete().eq("user_id", userId)

    if (watchHistoryError) {
      console.error("❌ Error deleting user watch history:", watchHistoryError)
      // Continue anyway, this is not critical
    } else {
      console.log("✅ User watch history deleted")
    }

    // Deactivate access codes created by this user (don't delete, for audit trail)
    const { error: accessCodesError } = await supabase
      .from("access_codes")
      .update({
        is_active: false,
        is_used: true,
        used_at: new Date().toISOString(),
        used_by: "user-deleted",
      })
      .eq("created_by", userId)

    if (accessCodesError) {
      console.error("❌ Error deactivating user access codes:", accessCodesError)
      // Continue anyway, this is not critical
    } else {
      console.log("✅ User access codes deactivated")
    }

    // Finally, delete the user profile
    const { error: deleteUserError } = await supabase.from("user_profiles").delete().eq("id", userId)

    if (deleteUserError) {
      console.error("❌ Error deleting user profile:", deleteUserError)
      return NextResponse.json(
        {
          success: false,
          error: "Failed to delete user profile",
          details: deleteUserError.message,
        },
        { status: 500 },
      )
    }

    console.log("✅ User removed successfully")
    return NextResponse.json({
      success: true,
      message: `User ${existingUser.username} removed successfully`,
    })
  } catch (error) {
    console.error("💥 Remove user error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
