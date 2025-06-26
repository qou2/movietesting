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

    // First, check if the access code exists and is active
    const { data: existingCode, error: fetchError } = await supabase
      .from("access_codes")
      .select("*")
      .eq("id", codeId)
      .single()

    if (fetchError) {
      console.error("❌ Error fetching access code:", fetchError)
      return NextResponse.json(
        {
          success: false,
          error: "Access code not found",
          details: fetchError.message,
        },
        { status: 404 },
      )
    }

    console.log("📊 Found access code:", {
      id: existingCode.id,
      code: existingCode.code,
      is_active: existingCode.is_active,
      used_at: existingCode.used_at,
      expires_at: existingCode.expires_at,
    })

    // Check if already revoked/used
    if (!existingCode.is_active || existingCode.used_at) {
      console.log("❌ Access code is already inactive or used")
      return NextResponse.json(
        {
          success: false,
          error: "Access code is already inactive or has been used",
        },
        { status: 400 },
      )
    }

    // Revoke the access code
    const { error: updateError } = await supabase
      .from("access_codes")
      .update({
        is_active: false,
        is_used: true,
        used_at: new Date().toISOString(),
        used_by: "admin-revoked",
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
