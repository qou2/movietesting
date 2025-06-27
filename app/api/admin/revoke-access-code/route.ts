import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Force dynamic rendering
export const dynamic = "force-dynamic"

export async function POST(request: Request) {
  try {
    const { codeId } = await request.json()

    if (!codeId) {
      return NextResponse.json({ success: false, error: "Code ID is required" }, { status: 400 })
    }

    console.log("🔐 Revoking access code:", codeId)

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // First, check if the code exists and is active
    const { data: existingCode, error: fetchError } = await supabase
      .from("access_codes")
      .select("*")
      .eq("id", codeId)
      .single()

    if (fetchError || !existingCode) {
      console.error("❌ Code not found:", fetchError)
      return NextResponse.json({ success: false, error: "Access code not found" }, { status: 404 })
    }

    // Check if code is already used or inactive
    if (existingCode.used_at || existingCode.is_used) {
      return NextResponse.json({ success: false, error: "Cannot revoke a used access code" }, { status: 400 })
    }

    if (!existingCode.is_active) {
      return NextResponse.json({ success: false, error: "Access code is already revoked" }, { status: 400 })
    }

    // Check if code is expired
    if (new Date(existingCode.expires_at) < new Date()) {
      return NextResponse.json({ success: false, error: "Cannot revoke an expired access code" }, { status: 400 })
    }

    // Revoke the access code
    const { error: updateError } = await supabase
      .from("access_codes")
      .update({
        is_active: false,
        admin_action: "revoked",
        updated_at: new Date().toISOString(),
      })
      .eq("id", codeId)

    if (updateError) {
      console.error("❌ Error revoking access code:", updateError)
      return NextResponse.json(
        { success: false, error: "Failed to revoke access code", details: updateError.message },
        { status: 500 },
      )
    }

    console.log("✅ Access code revoked successfully:", codeId)

    return NextResponse.json({
      success: true,
      message: "Access code revoked successfully",
    })
  } catch (error) {
    console.error("💥 Revoke access code error:", error)
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
