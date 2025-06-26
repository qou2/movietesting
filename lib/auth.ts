import bcrypt from "bcryptjs"
import { supabase } from "./supabase"

export interface User {
  id: string
  username: string
  created_at: string
  last_active: string
}

export interface AuthResult {
  success: boolean
  user?: User
  error?: string
}

export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12
  return bcrypt.hash(password, saltRounds)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

export async function authenticateUser(username: string, password: string): Promise<AuthResult> {
  try {
    // Get user by username
    const { data: user, error } = await supabase.from("user_profiles").select("*").eq("username", username).single()

    if (error || !user) {
      return { success: false, error: "Invalid username or password" }
    }

    // Verify password
    const isValidPassword = await verifyPassword(password, user.password_hash)

    if (!isValidPassword) {
      return { success: false, error: "Invalid username or password" }
    }

    // Update last active
    await supabase.from("user_profiles").update({ last_active: new Date().toISOString() }).eq("id", user.id)

    return {
      success: true,
      user: {
        id: user.id,
        username: user.username,
        created_at: user.created_at,
        last_active: user.last_active,
      },
    }
  } catch (error) {
    console.error("Authentication error:", error)
    return { success: false, error: "Authentication failed" }
  }
}

export async function createUser(username: string, password: string, accessCode: string): Promise<AuthResult> {
  try {
    // Verify access code first
    const { data: codeData, error: codeError } = await supabase
      .from("access_codes")
      .select("*")
      .eq("code", accessCode.toUpperCase())
      .eq("is_active", true)
      .single()

    if (codeError || !codeData) {
      return { success: false, error: "Invalid or expired access code" }
    }

    // Check if code has expired
    if (new Date(codeData.expires_at) < new Date()) {
      return { success: false, error: "Access code has expired" }
    }

    // Check if code has already been used
    if (codeData.used_at) {
      return { success: false, error: "Access code has already been used" }
    }

    // Check if username already exists
    const { data: existingUser } = await supabase.from("user_profiles").select("id").eq("username", username).single()

    if (existingUser) {
      return { success: false, error: "Username already exists" }
    }

    // Hash password
    const passwordHash = await hashPassword(password)

    // Create user
    const { data: newUser, error: userError } = await supabase
      .from("user_profiles")
      .insert({
        username,
        password_hash: passwordHash,
        created_at: new Date().toISOString(),
        last_active: new Date().toISOString(),
      })
      .select()
      .single()

    if (userError || !newUser) {
      console.error("User creation error:", userError)
      return { success: false, error: "Failed to create account" }
    }

    // Mark access code as used
    await supabase
      .from("access_codes")
      .update({
        used_by: newUser.id,
        used_at: new Date().toISOString(),
        is_active: false,
      })
      .eq("id", codeData.id)

    return {
      success: true,
      user: {
        id: newUser.id,
        username: newUser.username,
        created_at: newUser.created_at,
        last_active: newUser.last_active,
      },
    }
  } catch (error) {
    console.error("User creation error:", error)
    return { success: false, error: "Failed to create account" }
  }
}

export async function changePassword(
  userId: string,
  currentPassword: string,
  newPassword: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    // Get current user data
    const { data: user, error } = await supabase.from("user_profiles").select("password_hash").eq("id", userId).single()

    if (error || !user) {
      return { success: false, error: "User not found" }
    }

    // Verify current password
    const isValidPassword = await verifyPassword(currentPassword, user.password_hash)

    if (!isValidPassword) {
      return { success: false, error: "Current password is incorrect" }
    }

    // Hash new password
    const newPasswordHash = await hashPassword(newPassword)

    // Update password
    const { error: updateError } = await supabase
      .from("user_profiles")
      .update({ password_hash: newPasswordHash })
      .eq("id", userId)

    if (updateError) {
      console.error("Password update error:", updateError)
      return { success: false, error: "Failed to update password" }
    }

    return { success: true }
  } catch (error) {
    console.error("Password change error:", error)
    return { success: false, error: "Failed to change password" }
  }
}
