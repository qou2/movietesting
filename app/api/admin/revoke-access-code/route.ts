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

    // First, check if the access code exists and get its current state
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
      admin_action: existingCode.admin_action,
    })

    // Check if already revoked/used - be more flexible with the checks
    const isAlreadyUsed = existingCode.is_used === true || existingCode.used_at !== null
    const isInactive = existingCode.is_active === false
    const isExpired = new Date(existingCode.expires_at) < new Date()

    if (isAlreadyUsed) {
      console.log("❌ Access code is already used")
      return NextResponse.json(
        {
          success: false,
          error: "Access code is already used",
        },
        { status: 400 },
      )
    }

    if (isInactive && existingCode.admin_action) {
      console.log("❌ Access code is already revoked by admin")
      return NextResponse.json(
        {
          success: false,
          error: "Access code is already revoked",
        },
        { status: 400 },
      )
    }

    if (isExpired) {
      console.log("❌ Access code has expired")
      return NextResponse.json(
        {
          success: false,
          error: "Access code has expired",
        },
        { status: 400 },
      )
    }

    // Revoke the access code
    console.log("🔐 Revoking access code...")
    const updateData: any = {
      is_active: false,
      admin_action: "revoked_by_admin",
    }

    // Only set is_used and used_at if they exist in the schema
    if (existingCode.hasOwnProperty("is_used")) {
      updateData.is_used = true
    }
    if (existingCode.hasOwnProperty("used_at")) {
      updateData.used_at = new Date().toISOString()
    }

    const { error: updateError } = await supabase.from("access_codes").update(updateData).eq("id", codeId)

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
