"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Eye, EyeOff, Mail, Lock, User, Heart, Star, Moon, Shield, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"

export default function SignupPage() {
  const [step, setStep] = useState<"email" | "otp" | "details">("email")
  const [email, setEmail] = useState("")
  const [otp, setOtp] = useState("")
  const [name, setName] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
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
    setSuccess("")

    console.log("=== SENDING OTP ===")
    console.log("Email:", email)

    try {
      const response = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase(), purpose: "signup" }),
      })

      const data = await response.json()
      console.log("Send OTP response:", data)

      if (response.ok) {
        setStep("otp")
        setCountdown(60)
        setSuccess("Verification code sent to your email!")
      } else {
        setError(data.error || "Failed to send verification code")
      }
    } catch (error) {
      console.error("Send OTP error:", error)
      setError("Network error. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerifyOTP = async () => {
    if (otp.length !== 6) {
      setError("Please enter a valid 6-digit code")
      return
    }
  
    setIsLoading(true)
    setError("")
    setSuccess("")
  
    console.log("=== VERIFYING OTP ===")
    console.log("OTP entered:", otp)
  
    try {
      // Just check if OTP is valid without completing signup
      const response = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          otp: otp.trim(),
          purpose: "signup",
          checkOnly: true // Add this flag
        }),
      })
  
      const data = await response.json()
  
      if (response.ok) {
        setStep("details")
        setError("")
        setSuccess("Code verified! Please complete your account details.")
      } else {
        setError(data.error || "Invalid verification code")
      }
    } catch (error) {
      console.error("OTP verification error:", error)
      setError("Network error. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleCompleteSignup = async (e: React.FormEvent) => {
    e.preventDefault();
  
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
  
    if (password.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }
  
    if (!name.trim()) {
      setError("Please enter your name");
      return;
    }
  
    setIsLoading(true);
    setError("");
    setSuccess("");
  
    try {
      // Changed from '/api/auth/signup' to '/api/auth/verify-otp'
      // This will complete the signup with name and password
      const response = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          otp: otp.trim(),
          purpose: "signup",
          name: name.trim(),
          password,
          // Remove checkOnly flag to complete the signup
        }),
      });
  
      const data = await response.json();
  
      if (response.ok) {
        setSuccess("Account created successfully! Redirecting to login...");
        setTimeout(() => {
          router.push("/login?message=Account created successfully");
        }, 2000);
      } else {
        setError(data.error || "Failed to create account");
      }
    } catch (error) {
      console.error("Complete signup error:", error);
      setError("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const resendOTP = async () => {
    if (countdown > 0) return

    setIsLoading(true)
    setError("")
    setSuccess("")

    try {
      const response = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase(), purpose: "signup" }),
      })

      const data = await response.json()

      if (response.ok) {
        setCountdown(60)
        setSuccess("New verification code sent!")
        setOtp("") // Clear current OTP
      } else {
        setError(data.error || "Failed to resend code")
      }
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
              {step === "details" && <User className="h-8 w-8 text-white" />}
            </div>
          </div>
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent">
            {step === "email" && "Join CalmSphere"}
            {step === "otp" && "Verify Your Email"}
            {step === "details" && "Complete Signup"}
          </CardTitle>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            {step === "email" && "Begin your journey to mental wellness"}
            {step === "otp" && "Enter the verification code sent to your email"}
            {step === "details" && "Create your account details"}
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

          {/* Step 1: Email */}
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
                {isLoading ? "Sending Code..." : "Send Verification Code"}
              </Button>
            </form>
          )}

          {/* Step 2: OTP Verification */}
          {step === "otp" && (
            <div className="space-y-4">
              <div className="text-center">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  We sent a 6-digit code to <strong>{email}</strong>
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="otp" className="text-gray-700 dark:text-gray-300">
                  Verification Code
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
                onClick={handleVerifyOTP}
                disabled={otp.length !== 6}
                className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white py-3 rounded-full transition-all duration-300 transform hover:scale-105 glow-hover"
              >
                Continue
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
            </div>
          )}

          {/* Step 3: Complete Details */}
          {step === "details" && (
            <form onSubmit={handleCompleteSignup} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-gray-700 dark:text-gray-300">
                  Full Name
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="pl-10 glow-hover border-pink-200 dark:border-purple-700 focus:border-pink-400 dark:focus:border-purple-500"
                    placeholder="Your name"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-700 dark:text-gray-300">
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
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
                  Confirm Password
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
                {isLoading ? "Creating Account..." : "Create Account"}
              </Button>
            </form>
          )}

          <div className="text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Already have an account?{" "}
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
