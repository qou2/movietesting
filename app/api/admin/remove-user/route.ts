import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function POST(request: Request) {
  try {
    console.log("🗑️ Remove user request started")

    const { userId } = await request.json()
    console.log("👤 User ID to remove:", userId)

    if (!userId || typeof userId !== "string") {
      console.log("❌ Invalid user ID provided")
      return NextResponse.json({ success: false, error: "Invalid user ID" }, { status: 400 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // First, check if the user exists
    const { data: existingUsers, error: fetchError } = await supabase
      .from("user_profiles")
      .select("id, username")
      .eq("id", userId)

    if (fetchError) {
      console.error("❌ Error fetching user:", fetchError)
      return NextResponse.json(
        {
          success: false,
          error: "Database error while fetching user",
          details: fetchError.message,
        },
        { status: 500 },
      )
    }

    if (!existingUsers || existingUsers.length === 0) {
      console.log("❌ User not found")
      return NextResponse.json(
        {
          success: false,
          error: "User not found",
        },
        { status: 404 },
      )
    }

    const user = existingUsers[0]
    console.log("📊 Found user to remove:", { id: user.id, username: user.username })

    // Remove user's favorites first
    console.log("🗑️ Removing user favorites...")
    const { error: favoritesError } = await supabase.from("favorites").delete().eq("user_id", userId)

    if (favoritesError) {
      console.error("❌ Error removing favorites:", favoritesError)
      // Continue anyway, don't fail the whole operation
    } else {
      console.log("✅ User favorites removed")
    }

    // Remove user's watch history
    console.log("🗑️ Removing user watch history...")
    const { error: historyError } = await supabase.from("watch_history").delete().eq("user_id", userId)

    if (historyError) {
      console.error("❌ Error removing watch history:", historyError)
      // Continue anyway, don't fail the whole operation
    } else {
      console.log("✅ User watch history removed")
    }

    // Deactivate access codes created by this user (don't delete them for audit trail)
    console.log("🔐 Deactivating user's access codes...")
    const { error: codesError } = await supabase
      .from("access_codes")
      .update({
        is_active: false,
        admin_action: "user_removed",
      })
      .eq("created_by", userId)

    if (codesError) {
      console.error("❌ Error deactivating access codes:", codesError)
      // Continue anyway, don't fail the whole operation
    } else {
      console.log("✅ User's access codes deactivated")
    }

    // Finally, remove the user profile
    console.log("🗑️ Removing user profile...")
    const { error: userError } = await supabase.from("user_profiles").delete().eq("id", userId)

    if (userError) {
      console.error("❌ Error removing user profile:", userError)
      return NextResponse.json(
        {
          success: false,
          error: "Failed to remove user profile",
          details: userError.message,
        },
        { status: 500 },
      )
    }

    console.log("✅ User removed successfully")
    return NextResponse.json({
      success: true,
      message: `User "${user.username}" removed successfully`,
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
