import nodemailer from "nodemailer"

// Create transporter using Gmail
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER, // Your Gmail address
    pass: process.env.EMAIL_APP_PASSWORD, // Gmail App Password
  },
})

export interface EmailOptions {
  to: string
  subject: string
  html: string
}

export async function sendEmail({ to, subject, html }: EmailOptions) {
  try {
    const info = await transporter.sendMail({
      from: `"CalmSphere" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    })

    console.log("Email sent successfully:", info.messageId)
    return { success: true, messageId: info.messageId }
  } catch (error) {
    console.error("Email sending failed:", error)
    throw new Error("Failed to send email")
  }
}

export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export function getOTPEmailTemplate(otp: string, purpose: "signup" | "reset"): string {
  const title = purpose === "signup" ? "Verify Your Email" : "Reset Your Password"
  const message =
    purpose === "signup"
      ? "Welcome to CalmSphere! Please verify your email address to complete your registration."
      : "You requested to reset your password. Use the OTP below to proceed."

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 20px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #ff6b6b, #ee5a24, #ff9ff3, #54a0ff); padding: 40px 20px; text-align: center; }
        .header h1 { color: white; margin: 0; font-size: 28px; font-weight: 600; }
        .content { padding: 40px 30px; text-align: center; }
        .otp-box { background: linear-gradient(135deg, #667eea, #764ba2); color: white; padding: 20px; border-radius: 15px; margin: 30px 0; display: inline-block; }
        .otp-code { font-size: 36px; font-weight: bold; letter-spacing: 8px; margin: 0; }
        .message { color: #333; font-size: 16px; line-height: 1.6; margin-bottom: 30px; }
        .warning { background: #fff3cd; border: 1px solid #ffeaa7; color: #856404; padding: 15px; border-radius: 10px; margin: 20px 0; }
        .footer { background: #f8f9fa; padding: 20px; text-align: center; color: #6c757d; font-size: 14px; }
        .heart { color: #ff6b6b; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🧘‍♀️ CalmSphere</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 18px;">${title}</p>
        </div>
        
        <div class="content">
          <p class="message">${message}</p>
          
          <div class="otp-box">
            <p style="margin: 0 0 10px 0; font-size: 14px; opacity: 0.9;">Your verification code:</p>
            <p class="otp-code">${otp}</p>
          </div>
          
          <div class="warning">
            <strong>⚠️ Important:</strong> This code will expire in 10 minutes. Do not share this code with anyone.
          </div>
          
          <p style="color: #666; font-size: 14px; margin-top: 30px;">
            If you didn't request this ${purpose === "signup" ? "account creation" : "password reset"}, please ignore this email.
          </p>
        </div>
        
        <div class="footer">
          <p>Made with <span class="heart">❤️</span> by CalmSphere Team</p>
          <p>Your journey to mental wellness starts here</p>
        </div>
      </div>
    </body>
    </html>
  `
}
