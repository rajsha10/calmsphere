import { type NextRequest, NextResponse } from "next/server"
import connectDB from "@/lib/mongodb"
import User from "@/lib/models/User"
import { sendEmail, generateOTP, getOTPEmailTemplate } from "@/lib/email"

export async function POST(request: NextRequest) {
  try {
    const { email, purpose } = await request.json()

    console.log("=== SEND OTP DEBUG ===")
    console.log("Request:", { email, purpose })

    if (!email || !purpose) {
      return NextResponse.json({ error: "Email and purpose are required" }, { status: 400 })
    }

    if (!["signup", "reset"].includes(purpose)) {
      return NextResponse.json({ error: "Invalid purpose" }, { status: 400 })
    }

    await connectDB()

    if (purpose === "signup") {
      // Check if user already exists and is verified
      const existingUser = await User.findOne({ email })
      if (existingUser && existingUser.isVerified) {
        console.log("❌ User already verified")
        return NextResponse.json({ error: "User already exists and is verified. Please sign in." }, { status: 400 })
      }
    } else if (purpose === "reset") {
      // Check if user exists for password reset
      const user = await User.findOne({ email })
      if (!user) {
        console.log("❌ User not found for reset")
        return NextResponse.json({ error: "No account found with this email" }, { status: 404 })
      }
    }

    // Generate OTP
    const otp = generateOTP()
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000)

    console.log("Generated OTP:", { otp, expiry: otpExpiry })

    let updatedUser
    if (purpose === "signup") {
      updatedUser = await User.findOneAndUpdate(
        { email },
        {
          email,
          otpCode: otp,
          otpExpiry,
          isVerified: false,
        },
        { upsert: true, new: true, runValidators: false }
      )      
      console.log("✅ Signup OTP saved:", { email: updatedUser.email, otpCode: updatedUser.otpCode })
    } else {
      updatedUser = await User.findOneAndUpdate(
        { email },
        {
          resetPasswordToken: otp,
          resetPasswordExpiry: otpExpiry,
        },
        { new: true },
      )
      console.log("✅ Reset OTP saved:", { email: updatedUser.email, resetToken: updatedUser.resetPasswordToken })
    }

    // Verify the OTP was saved correctly
    const verifyUser = await User.findOne({ email })
    console.log("Verification check:", {
      email: verifyUser?.email,
      otpCode: verifyUser?.otpCode,
      resetToken: verifyUser?.resetPasswordToken,
      otpExpiry: verifyUser?.otpExpiry,
      resetExpiry: verifyUser?.resetPasswordExpiry,
    })

    // Send email
    try {
      const emailTemplate = getOTPEmailTemplate(otp, purpose)
      const subject = purpose === "signup" ? "Verify Your CalmSphere Account" : "Reset Your CalmSphere Password"

      await sendEmail({
        to: email,
        subject,
        html: emailTemplate,
      })

      console.log("✅ OTP email sent successfully to:", email)
    } catch (emailError) {
      console.error("❌ Email sending failed:", emailError)
      // Don't fail the request if email fails, but log it
    }

    return NextResponse.json({
      success: true,
      message: `Verification code sent to ${email}`,
      expiresIn: 10 * 60 * 1000,
      debug: {
        otpSaved: !!updatedUser?.otpCode || !!updatedUser?.resetPasswordToken,
        expiry: otpExpiry,
      },
    })
  } catch (error) {
    console.error("❌ Send OTP error:", error)
    return NextResponse.json(
      {
        error: "Failed to send verification code",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
