import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    // Since this endpoint is being called but we don't need it,
    // let's return a simple response to prevent the error
    return NextResponse.json({
      success: true,
      message: "Access code generation not required for this application",
    })
  } catch (error) {
    console.error("Generate access code error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
