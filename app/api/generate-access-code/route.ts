import { type NextRequest, NextResponse } from "next/server"
import { supabaseServer } from "@/lib/supabase-server"

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

    // Verify the user exists
    const { data: userExists, error: userError } = await supabaseServer
      .from("user_profiles")
      .select("id")
      .eq("id", userId)
      .single()

    if (userError || !userExists) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
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
      const { data: existingCode, error: checkError } = await supabaseServer
        .from("access_codes")
        .select("id")
        .eq("code", accessCode)
        .single()

      if (checkError && checkError.code === "PGRST116") {
        // No rows returned, code is unique
        isUnique = true
      } else if (checkError) {
        console.error("Error checking existing code:", checkError)
        return NextResponse.json({ error: "Database error while checking code uniqueness" }, { status: 500 })
      } else if (!existingCode) {
        isUnique = true
      }

      if (attempts >= maxAttempts) {
        return NextResponse.json({ error: "Failed to generate unique code" }, { status: 500 })
      }
    } while (!isUnique)

    // Deactivate any existing active codes for this user
    const { error: deactivateError } = await supabaseServer
      .from("access_codes")
      .update({ is_active: false })
      .eq("created_by", userId)
      .eq("is_active", true)

    if (deactivateError) {
      console.error("Error deactivating existing codes:", deactivateError)
      // Continue anyway, this is not critical
    }

    // Insert the new access code
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours

    const { data, error } = await supabaseServer
      .from("access_codes")
      .insert({
        code: accessCode,
        created_by: userId,
        expires_at: expiresAt,
        is_active: true,
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      console.error("Error creating access code:", error)
      return NextResponse.json(
        {
          error: "Failed to create access code",
          details: error.message,
        },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: true,
      code: accessCode,
      expiresAt: expiresAt,
    })
  } catch (error) {
    console.error("Access code generation error:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
