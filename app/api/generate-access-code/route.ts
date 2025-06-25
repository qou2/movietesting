import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

// Generate a random 12-character alphanumeric code
function generateAccessCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
  let result = ""
  for (let i = 0; i < 12; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json()

    if (!userId || typeof userId !== "string") {
      return NextResponse.json({ error: "Invalid user ID" }, { status: 400 })
    }

    // Generate a unique access code
    let accessCode: string
    let isUnique = false
    let attempts = 0
    const maxAttempts = 10

    do {
      accessCode = generateAccessCode()
      attempts++

      // Check if code already exists
      const { data: existingCode } = await supabase.from("access_codes").select("id").eq("code", accessCode).single()

      if (!existingCode) {
        isUnique = true
      }

      if (attempts >= maxAttempts) {
        return NextResponse.json({ error: "Failed to generate unique code" }, { status: 500 })
      }
    } while (!isUnique)

    // Deactivate any existing active codes for this user
    await supabase.from("access_codes").update({ is_active: false }).eq("created_by", userId).eq("is_active", true)

    // Insert the new access code
    const { data, error } = await supabase
      .from("access_codes")
      .insert({
        code: accessCode,
        created_by: userId,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
      })
      .select()
      .single()

    if (error) {
      console.error("Error creating access code:", error)
      return NextResponse.json({ error: "Failed to create access code" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      code: accessCode,
      expiresAt: data.expires_at,
    })
  } catch (error) {
    console.error("Access code generation error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
