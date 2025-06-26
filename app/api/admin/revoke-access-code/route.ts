import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function POST(request: Request) {
  try {
    console.log("🔐 Revoke access code request started")

    const { codeId } = await request.json()
    console.log("📝 Code ID to revoke:", codeId)

    if (!codeId || typeof codeId !== "string") {
      console.log("❌ Invalid code ID provided")
      return NextResponse.json({ success: false, error: "Invalid code ID" }, { status: 400 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // First, check if the access code exists
    const { data: existingCodes, error: fetchError } = await supabase.from("access_codes").select("*").eq("id", codeId)

    if (fetchError) {
      console.error("❌ Error fetching access code:", fetchError)
      return NextResponse.json(
        {
          success: false,
          error: "Database error while fetching access code",
          details: fetchError.message,
        },
        { status: 500 },
      )
    }

    if (!existingCodes || existingCodes.length === 0) {
      console.log("❌ Access code not found")
      return NextResponse.json(
        {
          success: false,
          error: "Access code not found",
        },
        { status: 404 },
      )
    }

    const existingCode = existingCodes[0]
    console.log("📊 Found access code:", {
      id: existingCode.id,
      code: existingCode.code,
      is_active: existingCode.is_active,
      is_used: existingCode.is_used,
      used_at: existingCode.used_at,
      expires_at: existingCode.expires_at,
    })

    // Check if already revoked/used
    if (existingCode.is_used || existingCode.used_at) {
      console.log("❌ Access code is already used")
      return NextResponse.json(
        {
          success: false,
          error: "Access code is already used or revoked",
        },
        { status: 400 },
      )
    }

    if (!existingCode.is_active) {
      console.log("❌ Access code is already inactive")
      return NextResponse.json(
        {
          success: false,
          error: "Access code is already inactive",
        },
        { status: 400 },
      )
    }

    // Revoke the access code (don't set used_by since it expects a UUID)
    const { error: updateError } = await supabase
      .from("access_codes")
      .update({
        is_active: false,
        is_used: true,
        used_at: new Date().toISOString(),
        // Remove used_by field since it expects a UUID and we don't have an admin user ID
      })
      .eq("id", codeId)

    if (updateError) {
      console.error("❌ Error revoking access code:", updateError)
      return NextResponse.json(
        {
          success: false,
          error: "Failed to revoke access code",
          details: updateError.message,
        },
        { status: 500 },
      )
    }

    console.log("✅ Access code revoked successfully")
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
