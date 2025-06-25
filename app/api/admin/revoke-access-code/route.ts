import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function POST(request: NextRequest) {
  try {
    const { codeId } = await request.json()

    if (!codeId) {
      return NextResponse.json({ success: false, error: "Code ID is required" }, { status: 400 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Mark the access code as used (effectively revoking it)
    const { error } = await supabase
      .from("access_codes")
      .update({
        is_used: true,
        used_at: new Date().toISOString(),
        used_by: "admin-revoked",
      })
      .eq("id", codeId)

    if (error) throw error

    return NextResponse.json({
      success: true,
      message: "Access code revoked successfully",
    })
  } catch (error) {
    console.error("Revoke access code error:", error)
    return NextResponse.json({ success: false, error: "Failed to revoke access code" }, { status: 500 })
  }
}
