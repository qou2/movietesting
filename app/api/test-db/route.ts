import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET() {
  try {
    console.log("Testing database connection...")

    // Test basic connection
    const { data, error } = await supabase.from("user_profiles").select("count").single()

    if (error) {
      console.error("Database connection error:", error)
      return NextResponse.json({
        success: false,
        error: "Database connection failed",
        details: error.message,
        supabaseUrl: process.env.SUPABASE_URL ? "SET" : "NOT SET",
        supabaseKey: process.env.SUPABASE_ANON_KEY ? "SET" : "NOT SET",
      })
    }

    // Test user query
    const { data: users, error: userError } = await supabase.from("user_profiles").select("*").limit(5)

    if (userError) {
      console.error("User query error:", userError)
      return NextResponse.json({
        success: false,
        error: "User query failed",
        details: userError.message,
      })
    }

    return NextResponse.json({
      success: true,
      message: "Database connection successful",
      userCount: users?.length || 0,
      users: users?.map((u) => ({ id: u.id, username: u.username, created_at: u.created_at })) || [],
      environment: {
        supabaseUrl: process.env.SUPABASE_URL ? "SET" : "NOT SET",
        supabaseKey: process.env.SUPABASE_ANON_KEY ? "SET" : "NOT SET",
        jwtSecret: process.env.JWT_SECRET ? "SET" : "NOT SET",
        moviePassword: process.env.MOVIE_APP_PASSWORD ? "SET" : "NOT SET",
      },
    })
  } catch (error) {
    console.error("Test error:", error)
    return NextResponse.json({
      success: false,
      error: "Test failed",
      details: error instanceof Error ? error.message : "Unknown error",
    })
  }
}
