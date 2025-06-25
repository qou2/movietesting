import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET(request: NextRequest) {
  try {
    // Get all users with their watch statistics
    const { data: users, error } = await supabase
      .from("user_profiles")
      .select(`
        id,
        username,
        created_at,
        last_active
      `)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching users:", error)
      return NextResponse.json({ error: "Failed to fetch leaderboard" }, { status: 500 })
    }

    // Get watch statistics for each user
    const leaderboardData = await Promise.all(
      users.map(async (user) => {
        const { data: watchHistory } = await supabase
          .from("watch_history")
          .select("runtime, media_type")
          .eq("user_id", user.id)

        // Calculate total watch time
        const totalMinutes =
          watchHistory?.reduce((total, item) => {
            if (item.runtime) {
              return total + item.runtime
            }
            // Default estimates: 120 min for movies, 45 min for TV episodes
            return total + (item.media_type === "movie" ? 120 : 45)
          }, 0) || 0

        const totalHours = Math.round(totalMinutes / 60)

        return {
          id: user.id,
          username: user.username || `User-${user.id.slice(0, 8)}`,
          totalWatchHours: totalHours,
          totalWatched: watchHistory?.length || 0,
          joinDate: user.created_at,
          lastActive: user.last_active,
        }
      }),
    )

    // Sort by watch time (descending)
    leaderboardData.sort((a, b) => b.totalWatchHours - a.totalWatchHours)

    return NextResponse.json({ success: true, data: leaderboardData })
  } catch (error) {
    console.error("Leaderboard error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
