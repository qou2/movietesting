import { NextResponse } from "next/server"
import { hashPassword } from "@/lib/auth"
import { supabase } from "@/lib/supabase"

export async function GET() {
  try {
    console.log("Creating test user...")

    // Delete existing user first
    const { error: deleteError } = await supabase.from("user_profiles").delete().eq("username", "qou2")

    if (deleteError) {
      console.log("Delete error (might not exist):", deleteError.message)
    }

    // Hash the password properly
    const passwordHash = await hashPassword("qou2")
    console.log("Password hash created:", passwordHash.substring(0, 20) + "...")

    // Create user with proper hash
    const { data: newUser, error } = await supabase
      .from("user_profiles")
      .insert({
        username: "qou2",
        password_hash: passwordHash,
        created_at: new Date().toISOString(),
        last_active: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      console.error("User creation error:", error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    console.log("Test user created successfully")

    return NextResponse.json({
      success: true,
      message: "Test user created successfully",
      user: {
        id: newUser.id,
        username: newUser.username,
        passwordHashPreview: passwordHash.substring(0, 20) + "...",
      },
    })
  } catch (error) {
    console.error("Error creating test user:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

export async function POST() {
  return GET() // Same logic for both GET and POST
}
