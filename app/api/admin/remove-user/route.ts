import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Force dynamic rendering
export const dynamic = "force-dynamic"

export async function POST(request: Request) {
  try {
    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json({ success: false, error: "User ID is required" }, { status: 400 })
    }

    console.log("🗑️ Removing user:", userId)

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // First, check if the user exists
    const { data: existingUser, error: fetchError } = await supabase
      .from("user_profiles")
      .select("username")
      .eq("id", userId)
      .single()

    if (fetchError || !existingUser) {
      console.error("❌ User not found:", fetchError)
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 })
    }

    // Remove user data in the correct order (respecting foreign key constraints)

    // 1. Remove watch history
    const { error: watchHistoryError } = await supabase.from("watch_history").delete().eq("user_id", userId)

    if (watchHistoryError) {
      console.error("❌ Error removing watch history:", watchHistoryError)
      return NextResponse.json(
        { success: false, error: "Failed to remove user watch history", details: watchHistoryError.message },
        { status: 500 },
      )
    }

    // 2. Remove favorites
    const { error: favoritesError } = await supabase.from("favorites").delete().eq("user_id", userId)

    if (favoritesError) {
      console.error("❌ Error removing favorites:", favoritesError)
      return NextResponse.json(
        { success: false, error: "Failed to remove user favorites", details: favoritesError.message },
        { status: 500 },
      )
    }

    // 3. Deactivate access codes created by this user (don't delete to preserve audit trail)
    const { error: accessCodesError } = await supabase
      .from("access_codes")
      .update({
        is_active: false,
        admin_action: "user_removed",
        updated_at: new Date().toISOString(),
      })
      .eq("created_by", userId)

    if (accessCodesError) {
      console.error("❌ Error deactivating access codes:", accessCodesError)
      // Don't fail the entire operation for this
    }

    // 4. Finally, remove the user profile
    const { error: userError } = await supabase.from("user_profiles").delete().eq("id", userId)

    if (userError) {
      console.error("❌ Error removing user profile:", userError)
      return NextResponse.json(
        { success: false, error: "Failed to remove user profile", details: userError.message },
        { status: 500 },
      )
    }

    console.log("✅ User removed successfully:", existingUser.username)

    return NextResponse.json({
      success: true,
      message: `User "${existingUser.username}" removed successfully`,
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
