import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function GET() {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { data: accessCodes, error } = await supabase
      .from("access_codes")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) throw error

    const codesData =
      accessCodes?.map((code) => ({
        id: code.id,
        code: code.code,
        createdBy: code.created_by,
        createdAt: code.created_at,
        expiresAt: code.expires_at,
        isUsed: code.is_used,
        usedBy: code.used_by,
        usedAt: code.used_at,
      })) || []

    return NextResponse.json({
      success: true,
      data: codesData,
    })
  } catch (error) {
    console.error("Admin access codes error:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch access codes" }, { status: 500 })
  }
}
