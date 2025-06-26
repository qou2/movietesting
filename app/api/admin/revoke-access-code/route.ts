import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function POST(request: NextRequest) {
  try {
    console.log("Revoke access code request received")

    const body = await request.json()
    console.log("Request body:", body)

    const { codeId } = body

    if (!codeId) {
      console.log("Missing codeId in request")
      return NextResponse.json({ success: false, error: "Code ID is required" }, { status: 400 })
    }

    if (!supabaseUrl || !supabaseServiceKey) {
      console.log("Missing Supabase environment variables")
      return NextResponse.json({ success: false, error: "Server configuration error" }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // First check if the access code exists
    const { data: existingCode, error: fetchError } = await supabase
      .from("access_codes")
      .select("*")
      .eq("id", codeId)
      .single()

    if (fetchError) {
      console.error("Error fetching access code:", fetchError)
      return NextResponse.json({ success: false, error: "Access code not found" }, { status: 404 })
    }

    console.log("Found access code:", existingCode)

    // Mark the access code as used (effectively revoking it)
    const { data, error } = await supabase
      .from("access_codes")
      .update({
        is_used: true,
        used_at: new Date().toISOString(),
        used_by: "admin-revoked",
      })
      .eq("id", codeId)
      .select()

    if (error) {
      console.error("Error updating access code:", error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    console.log("Access code revoked successfully:", data)

    return NextResponse.json({
      success: true,
      message: "Access code revoked successfully",
      data,
    })
  } catch (error) {
    console.error("Revoke access code error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to revoke access code",
      },
      { status: 500 },
    )
  }
}
