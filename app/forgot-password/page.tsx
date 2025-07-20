"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Mail, Lock, Shield, Heart, Star, Moon, Eye, EyeOff, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<"email" | "otp" | "reset">("email")
  const [email, setEmail] = useState("")
  const [otp, setOtp] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [resetToken, setResetToken] = useState("")
  const router = useRouter()

  useEffect(() => {
    document.body.classList.add("page-transition")
  }, [])

  // Countdown timer for OTP resend
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [countdown])

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const response = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, purpose: "reset" }),
      })

      const data = await response.json()

      if (response.ok) {
        setStep("otp")
        setCountdown(60)
        setSuccess("Reset code sent to your email!")
      } else {
        setError(data.error || "Failed to send reset code")
      }
    } catch (error) {
      setError("Network error. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const response = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          otp,
          purpose: "reset",
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setResetToken(data.resetToken)
        setStep("reset")
        setSuccess("OTP verified! Now set your new password.")
      } else {
        setError(data.error || "Invalid OTP")
      }
    } catch (error) {
      setError("Network error. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match")
      return
    }

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters long")
      return
    }

    setIsLoading(true)
    setError("")

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          resetToken,
          newPassword,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess("Password reset successfully! Redirecting to login...")
        setTimeout(() => {
          router.push("/login")
        }, 2000)
      } else {
        setError(data.error || "Failed to reset password")
      }
    } catch (error) {
      setError("Network error. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const resendOTP = async () => {
    if (countdown > 0) return

    setIsLoading(true)
    try {
      await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, purpose: "reset" }),
      })
      setCountdown(60)
      setSuccess("New reset code sent!")
    } catch (error) {
      setError("Failed to resend code")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden py-12 px-4">
      {/* Floating Background Elements */}
      <div className="absolute inset-0 pointer-events-none">
        <Star className="absolute top-20 left-10 h-8 w-8 text-pink-300 dark:text-purple-400 float-animation opacity-40" />
        <Moon className="absolute top-40 right-20 h-10 w-10 text-blue-300 dark:text-indigo-400 float-slow opacity-30" />
        <Heart className="absolute bottom-40 left-20 h-6 w-6 text-purple-300 dark:text-pink-400 float-animation opacity-50" />
        <Star className="absolute bottom-20 right-10 h-7 w-7 text-pink-400 dark:text-purple-300 float-slow opacity-40" />
      </div>

      <Card className="w-full max-w-md soft-glow bg-white/90 dark:bg-slate-800/90 backdrop-blur-md border-pink-200 dark:border-purple-800">
        <CardHeader className="text-center pb-8">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-pink-400 to-purple-500 rounded-full flex items-center justify-center">
              {step === "email" && <Mail className="h-8 w-8 text-white" />}
              {step === "otp" && <Shield className="h-8 w-8 text-white" />}
              {step === "reset" && <Lock className="h-8 w-8 text-white" />}
            </div>
          </div>
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent">
            {step === "email" && "Reset Password"}
            {step === "otp" && "Verify Reset Code"}
            {step === "reset" && "New Password"}
          </CardTitle>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            {step === "email" && "Enter your email to receive a reset code"}
            {step === "otp" && "Enter the verification code sent to your email"}
            {step === "reset" && "Create a new secure password"}
          </p>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Error/Success Messages */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}
          {success && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 px-4 py-3 rounded-lg">
              {success}
            </div>
          )}

          {step === "email" && (
            <form onSubmit={handleSendOTP} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-700 dark:text-gray-300">
                  Email Address
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 glow-hover border-pink-200 dark:border-purple-700 focus:border-pink-400 dark:focus:border-purple-500"
                    placeholder="your@email.com"
                    required
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white py-3 rounded-full transition-all duration-300 transform hover:scale-105 glow-hover"
              >
                {isLoading ? "Sending Code..." : "Send Reset Code"}
              </Button>
            </form>
          )}

          {step === "otp" && (
            <form onSubmit={handleVerifyOTP} className="space-y-4">
              <div className="text-center">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  We sent a 6-digit code to <strong>{email}</strong>
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="otp" className="text-gray-700 dark:text-gray-300">
                  Reset Code
                </Label>
                <div className="relative">
                  <Shield className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="otp"
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    className="pl-10 text-center text-2xl font-mono tracking-widest glow-hover border-pink-200 dark:border-purple-700 focus:border-pink-400 dark:focus:border-purple-500"
                    placeholder="000000"
                    maxLength={6}
                    required
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={otp.length !== 6 || isLoading}
                className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white py-3 rounded-full transition-all duration-300 transform hover:scale-105 glow-hover"
              >
                {isLoading ? "Verifying..." : "Verify Code"}
              </Button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={resendOTP}
                  disabled={countdown > 0 || isLoading}
                  className="text-sm text-pink-500 hover:text-pink-600 dark:text-purple-400 dark:hover:text-purple-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {countdown > 0 ? (
                    <span className="flex items-center justify-center gap-1">
                      <Clock className="h-4 w-4" />
                      Resend in {countdown}s
                    </span>
                  ) : (
                    "Resend Code"
                  )}
                </button>
              </div>
            </form>
          )}

          {step === "reset" && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="newPassword" className="text-gray-700 dark:text-gray-300">
                  New Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="newPassword"
                    type={showPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="pl-10 pr-10 glow-hover border-pink-200 dark:border-purple-700 focus:border-pink-400 dark:focus:border-purple-500"
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-gray-700 dark:text-gray-300">
                  Confirm New Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-10 glow-hover border-pink-200 dark:border-purple-700 focus:border-pink-400 dark:focus:border-purple-500"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white py-3 rounded-full transition-all duration-300 transform hover:scale-105 glow-hover"
              >
                {isLoading ? "Resetting Password..." : "Reset Password"}
              </Button>
            </form>
          )}

          <div className="text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Remember your password?{" "}
              <Link
                href="/login"
                className="text-pink-500 hover:text-pink-600 dark:text-purple-400 dark:hover:text-purple-300 font-medium"
              >
                Sign in
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>

      <style jsx>{`
        .float-animation {
          animation: float 6s ease-in-out infinite;
        }
        .float-slow {
          animation: float 8s ease-in-out infinite;
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(5deg); }
        }
      `}</style>
    </div>
  )
}
