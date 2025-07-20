import { type NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import connectDB from "@/lib/mongodb"
import User from "@/lib/models/User"

export async function POST(request: NextRequest) {
  try {
    const { email, otp, purpose, name, password, checkOnly } = await request.json()
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

    console.log("=== VERIFY OTP DEBUG ===")
    console.log("Request data:", {
      email,
      otp: otp?.toString(),
      purpose,
      hasName: !!name,
      hasPassword: !!password,
    })

    if (!email || !otp || !purpose) {
      console.log("❌ Missing required fields")
      return NextResponse.json({ error: "Email, OTP, and purpose are required" }, { status: 400 })
    }

    await connectDB()

    const user = await User.findOne({ email })

    if (checkOnly) {
      if (!user.otpCode) {
        return NextResponse.json({ error: "No verification code found. Please request a new one." }, { status: 400 })
      }

      const providedOTP = otp.toString().trim()
      const storedOTP = user.otpCode.toString().trim()

      if (storedOTP !== providedOTP) {
        return NextResponse.json({ error: "Invalid verification code" }, { status: 400 })
      }

      if (!user.otpExpiry || user.otpExpiry < new Date()) {
        await User.findOneAndUpdate({ email }, { otpCode: null, otpExpiry: null })
        return NextResponse.json({ error: "Verification code has expired. Please request a new one." }, { status: 400 })
      }

      return NextResponse.json({
        success: true,
        message: "OTP verified successfully"
      })
    }

    if (!user) {
      console.log("❌ User not found for email:", email)
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    console.log("✅ User found:", {
      email: user.email,
      otpCode: user.otpCode,
      otpExpiry: user.otpExpiry,
      resetToken: user.resetPasswordToken,
      resetExpiry: user.resetPasswordExpiry,
      isVerified: user.isVerified,
    })

    if (purpose === "signup") {
      // Check if user is already verified
      if (user.isVerified) {
        console.log("❌ User already verified")
        return NextResponse.json({ error: "Account is already verified. Please sign in." }, { status: 400 })
      }

      // Verify signup OTP
      if (!user.otpCode) {
        console.log("❌ No OTP code found for user")
        return NextResponse.json({ error: "No verification code found. Please request a new one." }, { status: 400 })
      }

      const providedOTP = otp.toString().trim()
      const storedOTP = user.otpCode.toString().trim()

      console.log("OTP Comparison:", {
        provided: providedOTP,
        stored: storedOTP,
        match: providedOTP === storedOTP,
      })

      if (storedOTP !== providedOTP) {
        console.log("❌ OTP mismatch")
        return NextResponse.json({ error: "Invalid verification code" }, { status: 400 })
      }

      if (!user.otpExpiry || user.otpExpiry < new Date()) {
        await User.findOneAndUpdate({ email }, { otpCode: null, otpExpiry: null })
        return NextResponse.json({ error: "Verification code has expired." }, { status: 400 })
      }      

      if (!name || !password) {
        console.log("❌ Missing name or password for signup")
        return NextResponse.json({ error: "Name and password are required" }, { status: 400 })
      }

      if (password.length < 6) {
        console.log("❌ Password too short")
        return NextResponse.json({ error: "Password must be at least 6 characters long" }, { status: 400 })
      }

      // Hash password and complete signup
      const hashedPassword = await bcrypt.hash(password, 12)

      const updatedUser = await User.findOneAndUpdate(
        { email },
        {
          otpCode: otp,
          otpExpiry,
          isVerified: false,
        },
        { upsert: true, new: true }
      )      

      console.log("✅ User signup completed:", updatedUser.email)

      return NextResponse.json({
        success: true,
        message: "Account verified successfully! You can now sign in.",
      })
    } else if (purpose === "reset") {
      // Verify reset password OTP
      if (!user.resetPasswordToken) {
        console.log("❌ No reset token found for user")
        return NextResponse.json({ error: "No reset code found. Please request a new one." }, { status: 400 })
      }

      const providedOTP = otp.toString().trim()
      const storedToken = user.resetPasswordToken.toString().trim()

      console.log("Reset Token Comparison:", {
        provided: providedOTP,
        stored: storedToken,
        match: providedOTP === storedToken,
      })

      if (storedToken !== providedOTP) {
        console.log("❌ Reset token mismatch")
        return NextResponse.json({ error: "Invalid reset code" }, { status: 400 })
      }

      if (!user.resetPasswordExpiry || user.resetPasswordExpiry < new Date()) {
        console.log("❌ Reset token expired")
        // Clear expired token
        await User.findOneAndUpdate({ email }, { resetPasswordToken: null, resetPasswordExpiry: null })
        return NextResponse.json({ error: "Reset code has expired. Please request a new one." }, { status: 400 })
      }

      console.log("✅ Reset OTP verified successfully")

      return NextResponse.json({
        success: true,
        message: "Reset code verified successfully",
        resetToken: otp,
      })
    }

    return NextResponse.json({ error: "Invalid purpose" }, { status: 400 })
  } catch (error) {
    console.error("❌ Verify OTP error:", error)
    return NextResponse.json(
      {
        error: "Failed to verify code",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
