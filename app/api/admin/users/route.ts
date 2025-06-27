import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Force dynamic rendering
export const dynamic = "force-dynamic"

export async function GET() {
  try {
    console.log("🔍 Fetching all users for admin...")

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get all users with their basic information
    const { data: users, error } = await supabase
      .from("user_profiles")
      .select("id, username, email, created_at, last_active")
      .order("created_at", { ascending: false })

    if (error) {
      console.error("❌ Error fetching users:", error)
      return NextResponse.json(
        {
          success: false,
          error: "Failed to fetch users",
          details: error.message,
        },
        { status: 500 },
      )
    }

    // Get additional stats for each user
    const usersWithStats = await Promise.all(
      (users || []).map(async (user) => {
        // Get watch history count
        const { count: watchCount } = await supabase
          .from("watch_history")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id)

        // Get favorites count
        const { count: favoritesCount } = await supabase
          .from("favorites")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id)

        return {
          id: user.id,
          username: user.username,
          email: user.email,
          joinDate: user.created_at,
          lastActive: user.last_active,
          totalWatched: watchCount || 0,
          totalFavorites: favoritesCount || 0,
          isActive: user.last_active
            ? new Date(user.last_active) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
            : false,
        }
      }),
    )

    console.log(`✅ Fetched ${usersWithStats.length} users with stats`)

    return NextResponse.json(
      {
        success: true,
        users: usersWithStats,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      },
    )
  } catch (error) {
    console.error("💥 Users fetch error:", error)
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
