import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Force dynamic rendering
export const dynamic = "force-dynamic"

export async function GET() {
  try {
    console.log("📊 Fetching admin stats...")

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get all data in parallel
    const [usersResult, codesResult, watchHistoryResult, favoritesResult] = await Promise.allSettled([
      supabase.from("user_profiles").select("id, last_active, created_at"),
      supabase.from("access_codes").select("id, is_used, expires_at, is_active, admin_action, used_at"),
      supabase.from("watch_history").select("id, media_type, runtime, user_id"),
      supabase.from("favorites").select("id, user_id"),
    ])

    // Process users
    const users = usersResult.status === "fulfilled" ? usersResult.value.data || [] : []
    const totalUsers = users.length

    // Calculate active users (active in last 7 days)
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    const activeUsers = users.filter((user) => {
      try {
        return new Date(user.last_active) > weekAgo
      } catch {
        return false
      }
    }).length

    // Process access codes
    const accessCodes = codesResult.status === "fulfilled" ? codesResult.value.data || [] : []
    const totalAccessCodes = accessCodes.length

    let activeAccessCodes = 0
    let usedAccessCodes = 0
    let expiredAccessCodes = 0
    let revokedAccessCodes = 0

    const now = new Date()
    accessCodes.forEach((code) => {
      if (!code.is_active || code.admin_action) {
        revokedAccessCodes++
      } else if (code.is_used || code.used_at) {
        usedAccessCodes++
      } else if (new Date(code.expires_at) < now) {
        expiredAccessCodes++
      } else {
        activeAccessCodes++
      }
    })

    // Process watch history
    const watchHistory = watchHistoryResult.status === "fulfilled" ? watchHistoryResult.value.data || [] : []
    const totalMoviesWatched = watchHistory.filter((item) => item.media_type === "movie").length
    const totalTvWatched = watchHistory.filter((item) => item.media_type === "tv").length

    // Calculate total watch time (rough estimation)
    const totalWatchTime = Math.round(
      watchHistory.reduce((total, item) => {
        const runtime = item.runtime || (item.media_type === "movie" ? 120 : 45)
        return total + runtime
      }, 0) / 60,
    )

    // Process favorites
    const favorites = favoritesResult.status === "fulfilled" ? favoritesResult.value.data || [] : []
    const totalFavorites = favorites.length

    const stats = {
      totalUsers,
      activeUsers,
      totalAccessCodes,
      activeAccessCodes,
      usedAccessCodes,
      expiredAccessCodes,
      revokedAccessCodes,
      totalWatchTime,
      totalMoviesWatched,
      totalTvWatched,
      totalFavorites,
    }

    console.log("✅ Admin stats calculated:", stats)

    return NextResponse.json(
      {
        success: true,
        stats,
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
    console.error("❌ Admin stats error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch admin stats",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
