import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function GET() {
  try {
    console.log("🔑 Fetching access codes for admin...")

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get all access codes with creator information
    const { data: accessCodes, error } = await supabase
      .from("access_codes")
      .select(
        `
        id,
        code,
        created_by,
        created_at,
        expires_at,
        used_by,
        used_at,
        is_active,
        is_used,
        admin_action,
        user_profiles!access_codes_created_by_fkey(username)
      `,
      )
      .order("created_at", { ascending: false })

    if (error) {
      console.error("❌ Error fetching access codes:", error)
      return NextResponse.json(
        {
          success: false,
          error: "Failed to fetch access codes",
          details: error.message,
        },
        { status: 500 },
      )
    }

    // Transform the data for the frontend
    const transformedCodes = (accessCodes || []).map((code: any) => ({
      id: code.id,
      code: code.code,
      createdBy: code.user_profiles?.username || "Unknown User",
      createdAt: code.created_at,
      expiresAt: code.expires_at,
      usedBy: code.used_by,
      usedAt: code.used_at,
      isUsed: code.is_used || code.used_at !== null,
      isActive: code.is_active !== false,
      adminAction: code.admin_action,
    }))

    console.log(`✅ Fetched ${transformedCodes.length} access codes`)

    return NextResponse.json({
      success: true,
      data: transformedCodes,
    })
  } catch (error) {
    console.error("💥 Access codes fetch error:", error)
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
