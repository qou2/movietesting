import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    console.log("Admin login attempt started")

    // Parse request body
    let body
    try {
      body = await request.json()
    } catch (parseError) {
      console.error("Failed to parse request body:", parseError)
      return NextResponse.json({ success: false, error: "Invalid request format" }, { status: 400 })
    }

    const { username, password } = body
    console.log("Received username:", username ? "***" : "undefined")
    console.log("Received password:", password ? "***" : "undefined")

    // Get admin credentials from environment variables
    const ADMIN_USERNAME = process.env.ADMIN_USERNAME
    const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD

    console.log("Environment ADMIN_USERNAME:", ADMIN_USERNAME ? "set" : "not set")
    console.log("Environment ADMIN_PASSWORD:", ADMIN_PASSWORD ? "set" : "not set")

    // Check if environment variables are set
    if (!ADMIN_USERNAME || !ADMIN_PASSWORD) {
      console.error("Admin credentials not configured in environment variables")
      return NextResponse.json(
        {
          success: false,
          error: "Server configuration error",
          debug: {
            usernameSet: !!ADMIN_USERNAME,
            passwordSet: !!ADMIN_PASSWORD,
          },
        },
        { status: 500 },
      )
    }

    // Validate input
    if (!username || !password) {
      console.log("Missing username or password in request")
      return NextResponse.json({ success: false, error: "Username and password are required" }, { status: 400 })
    }

    // Check credentials (with detailed logging)
    const usernameMatch = username === ADMIN_USERNAME
    const passwordMatch = password === ADMIN_PASSWORD

    console.log("Username match:", usernameMatch)
    console.log("Password match:", passwordMatch)
    console.log("Expected username length:", ADMIN_USERNAME.length)
    console.log("Received username length:", username.length)
    console.log("Expected password length:", ADMIN_PASSWORD.length)
    console.log("Received password length:", password.length)

    if (usernameMatch && passwordMatch) {
      console.log("Admin authentication successful")
      return NextResponse.json({
        success: true,
        message: "Admin authentication successful",
      })
    } else {
      console.log("Admin authentication failed - invalid credentials")
      return NextResponse.json(
        {
          success: false,
          error: "Invalid credentials",
          debug: {
            usernameMatch,
            passwordMatch,
            expectedUsernameLength: ADMIN_USERNAME.length,
            receivedUsernameLength: username.length,
            expectedPasswordLength: ADMIN_PASSWORD.length,
            receivedPasswordLength: password.length,
          },
        },
        { status: 401 },
      )
    }
  } catch (error) {
    console.error("Admin login error:", error)
    console.error("Error stack:", error instanceof Error ? error.stack : "No stack trace")
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        debug: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
