import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Force dynamic rendering
export const dynamic = "force-dynamic"

export async function GET() {
  try {
    console.log("🔑 Fetching access codes for admin...")

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get all access codes with creator information
    const { data: accessCodes, error } = await supabase
      .from("access_codes")
      .select(`
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
      `)
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

    if (!accessCodes) {
      console.log("⚠️ No access codes found")
      return NextResponse.json({
        success: true,
        accessCodes: [],
      })
    }

    // Transform the data for the frontend
    const transformedCodes = accessCodes.map((code: any) => ({
      id: code.id,
      code: code.code,
      created_by: code.created_by,
      createdBy: code.user_profiles?.username || "Unknown User",
      created_at: code.created_at,
      expires_at: code.expires_at,
      used_by: code.used_by,
      used_at: code.used_at,
      is_used: Boolean(code.is_used || code.used_at),
      is_active: code.is_active !== false,
      admin_action: code.admin_action,
    }))

    console.log(`✅ Fetched ${transformedCodes.length} access codes`)

    return NextResponse.json(
      {
        success: true,
        accessCodes: transformedCodes,
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
