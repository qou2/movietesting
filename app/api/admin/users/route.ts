import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function GET() {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get users with their stats
    const { data: users, error: usersError } = await supabase
      .from("user_profiles")
      .select("*")
      .order("last_active", { ascending: false })

    if (usersError) throw usersError

    // Get watch history counts for each user
    const { data: watchCounts, error: watchError } = await supabase.from("watch_history").select("user_id")

    if (watchError) throw watchError

    // Get favorites counts for each user
    const { data: favoriteCounts, error: favoritesError } = await supabase.from("favorites").select("user_id")

    if (favoritesError) throw favoritesError

    // Combine data
    const userData =
      users?.map((user) => {
        const totalWatched = watchCounts?.filter((w) => w.user_id === user.id).length || 0
        const totalFavorites = favoriteCounts?.filter((f) => f.user_id === user.id).length || 0

        return {
          id: user.id,
          username: user.username,
          lastActive: user.last_active,
          totalWatched,
          totalFavorites,
          joinDate: user.created_at,
        }
      }) || []

    return NextResponse.json({
      success: true,
      data: userData,
    })
  } catch (error) {
    console.error("Admin users error:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch users data" }, { status: 500 })
  }
}
