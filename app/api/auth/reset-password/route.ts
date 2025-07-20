import { type NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import connectDB from "@/lib/mongodb"
import User from "@/lib/models/User"

export async function POST(request: NextRequest) {
  try {
    const { email, resetToken, newPassword } = await request.json()

    if (!email || !resetToken || !newPassword) {
      return NextResponse.json({ error: "Email, reset token, and new password are required" }, { status: 400 })
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters long" }, { status: 400 })
    }

    await connectDB()

    const user = await User.findOne({ email })
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    if (!user.resetPasswordToken || user.resetPasswordToken !== resetToken) {
      return NextResponse.json({ error: "Invalid reset token" }, { status: 400 })
    }

    if (!user.resetPasswordExpiry || user.resetPasswordExpiry < new Date()) {
      return NextResponse.json({ error: "Reset token has expired" }, { status: 400 })
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12)

    await User.findOneAndUpdate(
      { email },
      {
        password: hashedPassword,
        resetPasswordToken: null,
        resetPasswordExpiry: null,
      },
    )

    return NextResponse.json({
      success: true,
      message: "Password reset successfully! You can now sign in with your new password.",
    })
  } catch (error) {
    console.error("Reset password error:", error)
    return NextResponse.json({ error: "Failed to reset password" }, { status: 500 })
  }
}
