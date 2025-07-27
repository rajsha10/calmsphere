"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useRefresh } from "@/context/RefreshContext"

import {
  BookOpen,
  MessageCircle,
  Heart,
  Calendar,
  Star,
  Moon,
  Feather,
  TrendingUp,
  Brain,
  Activity,
  Smile,
  RefreshCw,
  BarChart3,
  Zap,
  Music,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"

//credits
import { useCredits } from "@/context/CreditContext";
import { toast } from "sonner"

interface DashboardData {
  moodAnalysis: {
    overallMood: string
    moodScore: number
    emotions: string[]
    insights: string[]
    trends: Array<{
      date: string
      mood: string
      score: number
    }>
  }
  stats: {
    totalJournalEntries: number
    totalChatMessages: number
    totalBotResponses: number
    streakDays: number
    avgEntriesPerWeek: number
    mostActiveDay: string
  }
  recentActivities: Array<{
    type: "journal" | "chat"
    content: string
    timestamp: string
    mood: string | null
  }>
  lastUpdated: string
}

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)
  const { needsRefresh, resetRefresh } = useRefresh()
  const { setCredits, setInitialised } = useCredits();

  useEffect(() => {
    if (status === "loading") return
    if (!session) {
      router.push("/login")
      return
    }
  }, [session, status, router])

  const fetchDashboardData = async (showRefreshing = false) => {
    if (showRefreshing) setIsRefreshing(true)

    try {
      const response = await fetch("/api/dashboard")
      if (response.ok) {
        const data = await response.json()

        if (data.creditError) {
          toast.error("Credit Limit Reached", {
            description: data.creditError,
          });
        }
  
        if (data.credits) {
          setCredits(data.credits);
          setInitialised(true);
        }
        
        setDashboardData(data)
        setLastRefresh(new Date())
      }
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error)
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  // Initial load onyl
  useEffect(() => {
    if (session && needsRefresh) {
      fetchDashboardData().then(() => {
        resetRefresh()
      })
    }
  }, [session, needsRefresh, resetRefresh]) 

  const getMoodColor = (mood: string, score: number) => {
    if (score >= 3) return "text-green-600 bg-green-50 border-green-200"
    if (score >= 1) return "text-blue-600 bg-blue-50 border-blue-200"
    if (score >= -1) return "text-yellow-600 bg-yellow-50 border-yellow-200"
    if (score >= -3) return "text-orange-600 bg-orange-50 border-orange-200"
    return "text-red-600 bg-red-50 border-red-200"
  }

  const handleManualRefresh = () => {
    fetchDashboardData(true)
  }

  const getMoodEmoji = (mood: string) => {
    const emojiMap: { [key: string]: string } = {
      happy: "😊",
      sad: "😢",
      anxious: "😰",
      calm: "😌",
      angry: "😠",
      grateful: "🙏",
      hopeful: "🌟",
      excited: "🎉",
      peaceful: "☮️",
      energetic: "⚡",
      reflective: "🤔",
      optimistic: "🌈",
    }
    return emojiMap[mood.toLowerCase()] || "😊"
  }

  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full blur-xl opacity-20 animate-pulse"></div>
            <Brain className="relative h-12 w-12 text-purple-500 mx-auto mb-6 animate-bounce" />
          </div>
          <h2 className="text-2xl font-semibold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent mb-2">
            Analyzing Your Journey
          </h2>
          <p className="text-gray-600 dark:text-gray-300">Gathering insights from your thoughts and conversations...</p>
        </div>
      </div>
    )
  }

  if (!session || !dashboardData) return null

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Floating Background Elements */}
      <div className="absolute inset-0 pointer-events-none">
        <Star className="absolute top-20 left-10 h-6 w-6 text-pink-300 dark:text-purple-400 float-animation opacity-60" />
        <Moon className="absolute top-40 right-20 h-8 w-8 text-blue-300 dark:text-indigo-400 float-slow opacity-50" />
        <Feather className="absolute bottom-40 left-20 h-5 w-5 text-purple-300 dark:text-pink-400 float-animation opacity-70" />
        <Heart className="absolute bottom-20 right-10 h-7 w-7 text-pink-400 dark:text-purple-300 float-slow opacity-60" />
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header with Refresh */}
        <div className="mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent">
              Welcome back, {session.user?.name || "Beautiful Soul"}
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              Your mindful journey insights and real-time mood analysis
            </p>
          </div>
          <div className="flex items-center gap-4">
            {lastRefresh && (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Last updated: {lastRefresh.toLocaleTimeString()}
              </p>
            )}
            <Button
              onClick={() => handleManualRefresh()}
              disabled={isRefreshing}
              variant="outline"
              size="sm"
              className="border-purple-300 dark:border-purple-600"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
              {isRefreshing ? "Updating..." : "Refresh"}
            </Button>
          </div>
        </div>

        {/* Mood Analysis Section */}
        <div className="mb-8">
          <Card className="soft-glow bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-purple-200 dark:border-purple-800">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Brain className="h-6 w-6 text-purple-500" />
                <span> Mood Analysis</span>
                <Badge variant="secondary" className="ml-2">
                  Live
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div
                    className={`inline-flex items-center px-4 py-2 rounded-full border-2 ${getMoodColor(dashboardData.moodAnalysis.overallMood, dashboardData.moodAnalysis.moodScore)}`}
                  >
                    <span className="text-2xl mr-2">{getMoodEmoji(dashboardData.moodAnalysis.overallMood)}</span>
                    <span className="font-semibold">{dashboardData.moodAnalysis.overallMood}</span>
                  </div>
                  <div className="mt-4">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Mood Score</p>
                    <div className="flex items-center justify-center space-x-2">
                      <span className="text-xs">-5</span>
                      <Progress value={((dashboardData.moodAnalysis.moodScore + 5) / 10) * 100} className="w-24 h-2" />
                      <span className="text-xs">+5</span>
                    </div>
                    <p className="text-lg font-bold mt-1">{dashboardData.moodAnalysis.moodScore}</p>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-3 text-gray-800 dark:text-gray-200">Detected Emotions</h4>
                  <div className="flex flex-wrap gap-2">
                    {dashboardData.moodAnalysis.emotions.map((emotion, index) => (
                      <Badge key={index} variant="outline" className="capitalize">
                        {emotion}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-3 text-gray-800 dark:text-gray-200">Key Insights</h4>
                  <ul className="space-y-2">
                    {dashboardData.moodAnalysis.insights.slice(0, 3).map((insight, index) => (
                      <li key={index} className="text-sm text-gray-600 dark:text-gray-400 flex items-start">
                        <Zap className="h-3 w-3 text-purple-500 mr-2 mt-0.5 flex-shrink-0" />
                        {insight}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
          <Card className="soft-glow bg-gradient-to-br from-pink-50 to-purple-50 dark:from-purple-900/20 dark:to-indigo-900/20 border-pink-200 dark:border-purple-800">
            <CardContent className="p-6 text-center">
              <TrendingUp className="h-8 w-8 text-pink-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-800 dark:text-gray-200">{dashboardData.stats.streakDays}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Day Streak</p>
            </CardContent>
          </Card>

          <Card className="soft-glow bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-indigo-900/20 dark:to-blue-900/20 border-blue-200 dark:border-indigo-800">
            <CardContent className="p-6 text-center">
              <BookOpen className="h-8 w-8 text-blue-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-800 dark:text-gray-200">
                {dashboardData.stats.totalJournalEntries}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Journal Entries</p>
            </CardContent>
          </Card>

          <Card className="soft-glow bg-gradient-to-br from-purple-50 to-pink-50 dark:from-pink-900/20 dark:to-purple-900/20 border-purple-200 dark:border-pink-800">
            <CardContent className="p-6 text-center">
              <MessageCircle className="h-8 w-8 text-purple-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-800 dark:text-gray-200">
                {dashboardData.stats.totalChatMessages}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Chat Messages</p>
            </CardContent>
          </Card>

          <Card className="soft-glow bg-gradient-to-br from-green-50 to-teal-50 dark:from-teal-900/20 dark:to-green-900/20 border-green-200 dark:border-teal-800">
            <CardContent className="p-6 text-center">
              <BarChart3 className="h-8 w-8 text-green-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-800 dark:text-gray-200">
                {dashboardData.stats.avgEntriesPerWeek}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Avg/Week</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-3 gap-8 mb-8">
          {/* Navigation Cards */}
          <div className="lg:col-span-2 grid md:grid-cols-2 gap-6">
            <Link href="/journal">
              <Card className="soft-glow hover:shadow-lg transition-all duration-300 transform hover:-translate-y-2 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-pink-200 dark:border-purple-800 cursor-pointer group h-full">
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
                    {dashboardData.stats.totalJournalEntries} Entries
                  </Badge>
                </CardContent>
              </Card>
            </Link>

            <Link href="/chatbot">
              <Card className="soft-glow hover:shadow-lg transition-all duration-300 transform hover:-translate-y-2 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-pink-200 dark:border-purple-800 cursor-pointer group h-full">
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                    <MessageCircle className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3 text-gray-800 dark:text-gray-200">Calm Bot</h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">Chat with your compassionate AI companion</p>
                  <Badge
                    variant="secondary"
                    className="bg-blue-100 dark:bg-indigo-900 text-blue-700 dark:text-indigo-300"
                  >
                    {dashboardData.stats.totalChatMessages} Messages
                  </Badge>
                </CardContent>
              </Card>
            </Link>

            <Link href="/songs">
              <Card className="soft-glow hover:shadow-lg transition-all duration-300 transform hover:-translate-y-2 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-pink-200 dark:border-purple-800 cursor-pointer group h-full">
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                    <Music className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3 text-gray-800 dark:text-gray-200">Daily Songs</h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">AI-curated music based on your mood</p>
                  <Badge
                    variant="secondary"
                    className="bg-purple-100 dark:bg-pink-900 text-purple-700 dark:text-pink-300"
                  >
                    Mood-Based
                  </Badge>
                </CardContent>
              </Card>
            </Link>
          </div>

          {/* Recent Activities */}
          <Card className="soft-glow bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-pink-200 dark:border-purple-800">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Activity className="h-5 w-5 text-purple-500" />
                <span>Recent Activities</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 max-h-96 overflow-y-auto">
              {dashboardData.recentActivities.map((activity, index) => (
                <div key={index} className="flex items-start space-x-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      activity.type === "journal"
                        ? "bg-pink-100 dark:bg-pink-900/30"
                        : "bg-blue-100 dark:bg-blue-900/30"
                    }`}
                  >
                    {activity.type === "journal" ? (
                      <BookOpen className="h-4 w-4 text-pink-600 dark:text-pink-400" />
                    ) : (
                      <MessageCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-800 dark:text-gray-200 line-clamp-2">{activity.content}</p>
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(activity.timestamp).toLocaleDateString()}
                      </p>
                      {activity.mood && (
                        <Badge variant="outline" className="text-xs capitalize">
                          {getMoodEmoji(activity.mood)} {activity.mood}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Additional Stats */}
        <div className="grid md:grid-cols-2 gap-8">
          <Card className="soft-glow bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-pink-200 dark:border-purple-800">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Calendar className="h-5 w-5 text-green-500" />
                <span>Activity Patterns</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Most Active Day</span>
                  <Badge variant="outline">{dashboardData.stats.mostActiveDay}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Weekly Average</span>
                  <span className="font-semibold">{dashboardData.stats.avgEntriesPerWeek} entries</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">AI Responses</span>
                  <span className="font-semibold">{dashboardData.stats.totalBotResponses}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="soft-glow bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-pink-200 dark:border-purple-800">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Smile className="h-5 w-5 text-yellow-500" />
                <span>Wellness Insights</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {dashboardData.moodAnalysis.insights.slice(0, 4).map((insight, index) => (
                  <div key={index} className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full mt-2 flex-shrink-0"></div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{insight}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

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
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  )
}
