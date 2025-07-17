"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { BookOpen, MessageCircle, Heart, Calendar, Star, Moon, Feather, TrendingUp } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [dashboardData, setDashboardData] = useState({
    lastMood: "Peaceful",
    lastJournalEntry: "Reflected on gratitude and mindfulness...",
    nextReminder: "2:00 PM - Meditation Break",
    streakDays: 7,
  })

  useEffect(() => {
    document.body.classList.add("page-transition")

    if (status === "loading") return
    if (!session) {
      router.push("/login")
      return
    }
  }, [session, status, router])

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Heart className="h-8 w-8 animate-pulse text-pink-500 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-300">Loading your peaceful space...</p>
        </div>
      </div>
    )
  }

  if (!session) return null

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Floating Background Elements */}
      <div className="absolute inset-0 pointer-events-none">
        <Star className="absolute top-20 left-10 h-6 w-6 text-pink-300 dark:text-purple-400 float-animation opacity-60" />
        <Moon className="absolute top-40 right-20 h-8 w-8 text-blue-300 dark:text-indigo-400 float-slow opacity-50" />
        <Feather className="absolute bottom-40 left-20 h-5 w-5 text-purple-300 dark:text-pink-400 float-animation opacity-70" />
        <Heart className="absolute bottom-20 right-10 h-7 w-7 text-pink-400 dark:text-purple-300 float-slow opacity-60" />
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Welcome Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent">
            Welcome back, {session.user?.name || "Beautiful Soul"}
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            How are you feeling today? Let's continue your journey of self-discovery.
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="soft-glow bg-gradient-to-br from-pink-50 to-purple-50 dark:from-purple-900/20 dark:to-indigo-900/20 border-pink-200 dark:border-purple-800">
            <CardContent className="p-6 text-center">
              <TrendingUp className="h-8 w-8 text-pink-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-800 dark:text-gray-200">{dashboardData.streakDays}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Day Streak</p>
            </CardContent>
          </Card>

          <Card className="soft-glow bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-indigo-900/20 dark:to-blue-900/20 border-blue-200 dark:border-indigo-800">
            <CardContent className="p-6 text-center">
              <Heart className="h-8 w-8 text-blue-500 mx-auto mb-2" />
              <p className="text-lg font-semibold text-gray-800 dark:text-gray-200">{dashboardData.lastMood}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Last Mood</p>
            </CardContent>
          </Card>

          <Card className="soft-glow bg-gradient-to-br from-purple-50 to-pink-50 dark:from-pink-900/20 dark:to-purple-900/20 border-purple-200 dark:border-pink-800">
            <CardContent className="p-6 text-center">
              <BookOpen className="h-8 w-8 text-purple-500 mx-auto mb-2" />
              <p className="text-lg font-semibold text-gray-800 dark:text-gray-200">12</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Journal Entries</p>
            </CardContent>
          </Card>

          <Card className="soft-glow bg-gradient-to-br from-green-50 to-teal-50 dark:from-teal-900/20 dark:to-green-900/20 border-green-200 dark:border-teal-800">
            <CardContent className="p-6 text-center">
              <MessageCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
              <p className="text-lg font-semibold text-gray-800 dark:text-gray-200">8</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">AI Conversations</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Navigation Cards */}
        <div className="grid md:grid-cols-3 gap-8 mb-8">
          <Link href="/journal">
            <Card className="soft-glow hover:shadow-lg transition-all duration-300 transform hover:-translate-y-2 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-pink-200 dark:border-purple-800 cursor-pointer group">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-pink-400 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                  <BookOpen className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-3 text-gray-800 dark:text-gray-200">Journal</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Express your thoughts and emotions in a safe space
                </p>
                <Badge
                  variant="secondary"
                  className="bg-pink-100 dark:bg-purple-900 text-pink-700 dark:text-purple-300"
                >
                  New Entry Available
                </Badge>
              </CardContent>
            </Card>
          </Link>

          <Link href="/chatbot">
            <Card className="soft-glow hover:shadow-lg transition-all duration-300 transform hover:-translate-y-2 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-pink-200 dark:border-purple-800 cursor-pointer group">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                  <MessageCircle className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-3 text-gray-800 dark:text-gray-200">AI Companion</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">Chat with your compassionate AI companion</p>
                <Badge
                  variant="secondary"
                  className="bg-blue-100 dark:bg-indigo-900 text-blue-700 dark:text-indigo-300"
                >
                  Always Available
                </Badge>
              </CardContent>
            </Card>
          </Link>

          <Card className="soft-glow hover:shadow-lg transition-all duration-300 transform hover:-translate-y-2 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-pink-200 dark:border-purple-800 cursor-pointer group">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <Heart className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-gray-800 dark:text-gray-200">Mood Tracker</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">Monitor your emotional journey</p>
              <Badge variant="secondary" className="bg-purple-100 dark:bg-pink-900 text-purple-700 dark:text-pink-300">
                Coming Soon
              </Badge>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <div className="grid md:grid-cols-2 gap-8">
          <Card className="soft-glow bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-pink-200 dark:border-purple-800">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BookOpen className="h-5 w-5 text-pink-500" />
                <span>Recent Journal Entry</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 dark:text-gray-400 mb-4">"{dashboardData.lastJournalEntry}"</p>
              <Link href="/journal">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-pink-300 dark:border-purple-600 text-pink-600 dark:text-purple-400 bg-transparent"
                >
                  Continue Writing
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="soft-glow bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-pink-200 dark:border-purple-800">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Calendar className="h-5 w-5 text-purple-500" />
                <span>Next Reminder</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 dark:text-gray-400 mb-4">{dashboardData.nextReminder}</p>
              <Button
                variant="outline"
                size="sm"
                className="border-purple-300 dark:border-pink-600 text-purple-600 dark:text-pink-400 bg-transparent"
              >
                Set New Reminder
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
