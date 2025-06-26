import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import jwt from "jsonwebtoken"
import { changePassword } from "@/lib/auth"

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-this"

export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const token = cookieStore.get("auth-token")?.value

    if (!token) {
      return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 })
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; username: string }
    const { currentPassword, newPassword, confirmPassword } = await request.json()

    // Validation
    if (!currentPassword || !newPassword || !confirmPassword) {
      return NextResponse.json({ success: false, error: "All fields are required" }, { status: 400 })
    }

    if (newPassword !== confirmPassword) {
      return NextResponse.json({ success: false, error: "New passwords do not match" }, { status: 400 })
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { success: false, error: "New password must be at least 6 characters long" },
        { status: 400 },
      )
    }

    const result = await changePassword(decoded.userId, currentPassword, newPassword)

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Password change error:", error)
    return NextResponse.json({ success: false, error: "Failed to change password" }, { status: 500 })
  }
}
