import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function GET() {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get user stats
    const { data: users, error: usersError } = await supabase.from("user_profiles").select("*")

    if (usersError) throw usersError

    // Get access codes stats
    const { data: accessCodes, error: codesError } = await supabase.from("access_codes").select("*")

    if (codesError) throw codesError

    // Get watch history stats
    const { data: watchHistory, error: watchError } = await supabase.from("watch_history").select("*")

    if (watchError) throw watchError

    // Get favorites stats
    const { data: favorites, error: favoritesError } = await supabase.from("favorites").select("*")

    if (favoritesError) throw favoritesError

    // Calculate stats
    const totalUsers = users?.length || 0
    const activeUsers =
      users?.filter((user) => {
        const lastActive = new Date(user.last_active)
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        return lastActive > weekAgo
      }).length || 0

    const totalAccessCodes = accessCodes?.length || 0
    const activeAccessCodes =
      accessCodes?.filter((code) => !code.is_used && new Date(code.expires_at) > new Date()).length || 0

    const totalMoviesWatched = watchHistory?.filter((item) => item.media_type === "movie").length || 0
    const totalTvWatched = watchHistory?.filter((item) => item.media_type === "tv").length || 0

    // Estimate total watch time (rough calculation)
    const totalWatchTime = Math.round(
      (watchHistory?.reduce((total, item) => {
        return total + (item.runtime || (item.media_type === "movie" ? 120 : 45))
      }, 0) || 0) / 60,
    )

    const totalFavorites = favorites?.length || 0

    const stats = {
      totalUsers,
      activeUsers,
      totalAccessCodes,
      activeAccessCodes,
      totalWatchTime,
      totalMoviesWatched,
      totalTvWatched,
      totalFavorites,
    }

    return NextResponse.json({
      success: true,
      data: stats,
    })
  } catch (error) {
    console.error("Admin stats error:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch admin stats" }, { status: 500 })
  }
}
