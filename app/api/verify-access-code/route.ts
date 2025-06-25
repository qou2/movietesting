import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  console.log("🔐 Access code verification started")

  try {
    const body = await request.json()
    console.log("📝 Request body:", { ...body, code: body.code ? "[REDACTED]" : "missing" })

    const { code, userId } = body

    if (!code || typeof code !== "string") {
      console.log("❌ Invalid access code format")
      return NextResponse.json({ error: "Invalid access code" }, { status: 400 })
    }

    console.log("🔍 Looking for access code in database...")

    // Find the access code
    const { data: accessCodeData, error: fetchError } = await supabase
      .from("access_codes")
      .select("*")
      .eq("code", code.toUpperCase())
      .eq("is_active", true)
      .single()

    console.log("📊 Database query result:", {
      found: !!accessCodeData,
      error: fetchError?.message,
      code: accessCodeData?.code ? "[FOUND]" : "not found",
    })

    if (fetchError) {
      console.error("❌ Database fetch error:", fetchError)
      if (fetchError.code === "PGRST116") {
        // No rows returned
        return NextResponse.json({ error: "Invalid or expired access code" }, { status: 401 })
      }
      return NextResponse.json({ error: "Database error" }, { status: 500 })
    }

    if (!accessCodeData) {
      console.log("❌ No access code found")
      return NextResponse.json({ error: "Invalid or expired access code" }, { status: 401 })
    }

    // Check if code has expired
    const expiresAt = new Date(accessCodeData.expires_at)
    const now = new Date()
    console.log("⏰ Time check:", { expiresAt, now, expired: expiresAt < now })

    if (expiresAt < now) {
      console.log("❌ Access code has expired")
      return NextResponse.json({ error: "Access code has expired" }, { status: 401 })
    }

    // Check if code has already been used
    if (accessCodeData.used_at) {
      console.log("❌ Access code already used at:", accessCodeData.used_at)
      return NextResponse.json({ error: "Access code has already been used" }, { status: 401 })
    }

    console.log("✅ Access code is valid, marking as used...")

    // Prepare the used_by value - only set if we have a valid UUID
    let usedByValue = null
    if (
      userId &&
      userId !== "anonymous-user" &&
      userId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)
    ) {
      usedByValue = userId
    }

    console.log("👤 Used by value:", usedByValue ? "[UUID]" : "null")

    // Mark the code as used
    const { error: updateError } = await supabase
      .from("access_codes")
      .update({
        used_by: usedByValue,
        used_at: new Date().toISOString(),
        is_active: false,
      })
      .eq("id", accessCodeData.id)

    if (updateError) {
      console.error("❌ Error updating access code:", updateError)
      return NextResponse.json({ error: "Failed to process access code" }, { status: 500 })
    }

    console.log("✅ Access code verification successful")
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("💥 Access code verification error:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
