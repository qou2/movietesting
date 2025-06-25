import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  try {
    const { code, userId } = await request.json()

    if (!code || typeof code !== "string") {
      return NextResponse.json({ error: "Invalid access code" }, { status: 400 })
    }

    // Find the access code
    const { data: accessCodeData, error: fetchError } = await supabase
      .from("access_codes")
      .select("*")
      .eq("code", code.toUpperCase())
      .eq("is_active", true)
      .single()

    if (fetchError || !accessCodeData) {
      return NextResponse.json({ error: "Invalid or expired access code" }, { status: 401 })
    }

    // Check if code has expired
    if (new Date(accessCodeData.expires_at) < new Date()) {
      return NextResponse.json({ error: "Access code has expired" }, { status: 401 })
    }

    // Check if code has already been used
    if (accessCodeData.used_at) {
      return NextResponse.json({ error: "Access code has already been used" }, { status: 401 })
    }

    // Mark the code as used
    const { error: updateError } = await supabase
      .from("access_codes")
      .update({
        used_by: userId,
        used_at: new Date().toISOString(),
        is_active: false,
      })
      .eq("id", accessCodeData.id)

    if (updateError) {
      console.error("Error updating access code:", updateError)
      return NextResponse.json({ error: "Failed to process access code" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Access code verification error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
