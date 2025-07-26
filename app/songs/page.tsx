"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import {
  Music,
  Play,
  Heart,
  RefreshCw,
  Calendar,
  Headphones,
  Star,
  Volume2,
  Sparkles,
  Brain,
  Smile,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"

interface SongRecommendation {
  title: string
  artist: string
  youtubeId: string
  reason: string
  mood: string
  genre: string
}

interface DailyRecommendations {
  date: string
  mood: string
  moodScore: number
  songs: SongRecommendation[]
  moodDescription: string
}

export default function SongsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [recommendations, setRecommendations] = useState<DailyRecommendations | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [favorites, setFavorites] = useState<Set<string>>(new Set())
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null)

  useEffect(() => {
    if (status === "loading") return
    if (!session) {
      router.push("/login")
      return
    }
  }, [session, status, router])

  //fetchRecommendations Function
  const fetchRecommendations = async (showRefreshing = false) => {
    if (showRefreshing) setIsRefreshing(true)
    else setIsLoading(true)

    try {
      const response = await fetch("/api/songs/recommendations")
      const today = new Date().toISOString().split("T")[0]
      const storageKey = `songRecommendations-${today}`

      if (response.ok) {
        const data = await response.json()
        setRecommendations(data)
        localStorage.setItem(storageKey, JSON.stringify(data))
      } else if (response.status === 429) {
        const data = await response.json()
        alert(data.error || "You have reached your daily generation limit.")
        const cachedData = localStorage.getItem(storageKey)
        if (cachedData) {
            setRecommendations(JSON.parse(cachedData))
        }
      } else {
        throw new Error("Failed to fetch recommendations")
      }
    } catch (error) {
      console.error("Failed to fetch song recommendations:", error)
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  //Initial Load ---
  useEffect(() => {
    if (session) {
      const today = new Date().toISOString().split("T")[0]
      const storageKey = `songRecommendations-${today}`
      const cachedData = localStorage.getItem(storageKey)

      if (cachedData) {
        console.log("Loading recommendations from cache for today.")
        setRecommendations(JSON.parse(cachedData))
        setIsLoading(false)
      } else {
        console.log("No cache for today. Fetching new recommendations.")
        fetchRecommendations()
      }
    }
  }, [session])


  const toggleFavorite = (youtubeId: string) => {
    const newFavorites = new Set(favorites)
    if (newFavorites.has(youtubeId)) {
      newFavorites.delete(youtubeId)
    } else {
      newFavorites.add(youtubeId)
    }
    setFavorites(newFavorites)
    localStorage.setItem("favoriteSongs", JSON.stringify(Array.from(newFavorites)))
  }

  useEffect(() => {
    const savedFavorites = localStorage.getItem("favoriteSongs")
    if (savedFavorites) {
      setFavorites(new Set(JSON.parse(savedFavorites)))
    }
  }, [])

  const getMoodColor = (mood: string, score: number) => {
    if (score >= 3) return "from-green-400 to-emerald-500"
    if (score >= 1) return "from-blue-400 to-cyan-500"
    if (score >= -1) return "from-yellow-400 to-orange-500"
    if (score >= -3) return "from-orange-400 to-red-500"
    return "from-red-400 to-pink-500"
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
      stressed: "😤",
      neutral: "😐",
    }
    return emojiMap[mood.toLowerCase()] || "🎵"
  }

  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
        <div className="text-center">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full blur-xl opacity-30 animate-pulse"></div>
            <Music className="relative h-16 w-16 text-white mx-auto mb-6 animate-bounce" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-4">Curating Your Perfect Playlist</h2>
          <p className="text-purple-200 text-lg">Analyzing your mood to find the perfect songs...</p>
          <div className="mt-6 flex items-center justify-center space-x-2">
            <div className="w-2 h-2 bg-pink-400 rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
            <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
          </div>
        </div>
      </div>
    )
  }

  if (!session || !recommendations) return null

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full blur-3xl opacity-20 animate-pulse"></div>
        <div
          className="absolute bottom-20 right-10 w-40 h-40 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full blur-3xl opacity-20 animate-pulse"
          style={{ animationDelay: "2s" }}
        ></div>
        <div
          className="absolute top-1/2 left-1/4 w-24 h-24 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full blur-2xl opacity-15 animate-pulse"
          style={{ animationDelay: "4s" }}
        ></div>

        {/* Floating Music Notes */}
        <Music className="absolute top-32 right-32 h-8 w-8 text-white/20 float-animation" />
        <Headphones className="absolute bottom-32 left-32 h-6 w-6 text-white/20 float-slow" />
        <Star
          className="absolute top-1/3 right-1/4 h-5 w-5 text-white/20 float-animation"
          style={{ animationDelay: "1s" }}
        />
        <Heart
          className="absolute bottom-1/3 right-1/3 h-7 w-7 text-pink-400/30 float-slow"
          style={{ animationDelay: "3s" }}
        />
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 relative z-10">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-6">
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full blur opacity-30"></div>
              <div className="relative bg-white/10 backdrop-blur-sm rounded-full p-4">
                <Music className="h-12 w-12 text-white" />
              </div>
            </div>
          </div>
          <h1 className="text-5xl font-bold text-white mb-4">Your Daily Music Therapy</h1>
          <p className="text-xl text-purple-200 max-w-3xl mx-auto mb-6">
            AI-curated songs perfectly matched to your current mood and emotional state
          </p>

          {/* Refresh Button */}
          <Button
            onClick={() => fetchRecommendations(true)}
            disabled={isRefreshing}
            className="bg-white/20 hover:bg-white/30 text-white border-white/30 backdrop-blur-sm"
            size="lg"
          >
            <RefreshCw className={`h-5 w-5 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
            {isRefreshing ? "Generating New Mix..." : "Refresh Recommendations"}
          </Button>
        </div>

        {/* Mood Analysis Card */}
        <Card className="mb-8 bg-white/10 backdrop-blur-md border-white/20 text-white">
          <CardHeader>
            <CardTitle className="flex items-center space-x-3">
              <Brain className="h-6 w-6 text-purple-300" />
              <span>Today's Mood Analysis</span>
              <Badge variant="secondary" className="bg-purple-500/30 text-purple-100">
                {new Date(recommendations.date).toLocaleDateString()}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <div
                  className={`inline-flex items-center px-6 py-3 rounded-full bg-gradient-to-r ${getMoodColor(recommendations.mood, recommendations.moodScore)} text-white font-semibold text-lg shadow-lg`}
                >
                  <span className="text-2xl mr-3">{getMoodEmoji(recommendations.mood)}</span>
                  {recommendations.mood.charAt(0).toUpperCase() + recommendations.mood.slice(1)}
                </div>
                <div className="mt-4">
                  <p className="text-sm text-purple-200 mb-2">Mood Intensity</p>
                  <div className="flex items-center justify-center space-x-2">
                    <span className="text-xs text-purple-300">-5</span>
                    <Progress value={((recommendations.moodScore + 5) / 10) * 100} className="w-32 h-3" />
                    <span className="text-xs text-purple-300">+5</span>
                  </div>
                  <p className="text-lg font-bold mt-1">{recommendations.moodScore}</p>
                </div>
              </div>

              <div className="md:col-span-2">
                <h4 className="font-semibold mb-3 text-purple-100 flex items-center">
                  <Sparkles className="h-4 w-4 mr-2" />
                  Calm Analysis
                </h4>
                <p className="text-purple-200 leading-relaxed">{recommendations.moodDescription}</p>
                <div className="mt-4 flex items-center space-x-4 text-sm text-purple-300">
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-1" />
                    Updated Today
                  </div>
                  <div className="flex items-center">
                    <Volume2 className="h-4 w-4 mr-1" />
                    {recommendations.songs.length} Songs
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Songs Grid */}
        <div className="grid lg:grid-cols-2 gap-8">
          {recommendations.songs.map((song, index) => (
            <Card
              key={index}
              className="bg-white/10 backdrop-blur-md border-white/20 hover:bg-white/15 transition-all duration-300 group overflow-hidden"
            >
              <CardContent className="p-0">
                <div className="relative">
                  {/* YouTube Embed */}
                  <div className="aspect-video relative overflow-hidden">
                    <iframe
                      width="100%"
                      height="100%"
                      src={`https://www.youtube.com/embed/${song.youtubeId}?rel=0&modestbranding=1`}
                      title={`${song.title} by ${song.artist}`}
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      className="rounded-t-lg"
                    />
                  </div>

                  {/* Song Info Overlay */}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="bg-white/20 backdrop-blur-sm rounded-full p-2">
                          <Play className="h-4 w-4 text-white" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-white text-lg">{song.title}</h3>
                          <p className="text-purple-200">{song.artist}</p>
                        </div>
                      </div>
                      <Button
                        onClick={() => toggleFavorite(song.youtubeId)}
                        variant="ghost"
                        size="sm"
                        className="text-white hover:bg-white/20"
                      >
                        <Heart
                          className={`h-5 w-5 ${favorites.has(song.youtubeId) ? "fill-red-500 text-red-500" : ""}`}
                        />
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Song Details */}
                <div className="p-6 text-white">
                  <div className="flex items-center justify-between mb-4">
                    <Badge variant="outline" className="border-purple-300 text-purple-200">
                      {song.genre}
                    </Badge>
                    <Badge variant="outline" className="border-blue-300 text-blue-200 capitalize">
                      {getMoodEmoji(song.mood)} {song.mood}
                    </Badge>
                  </div>

                  <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                    <h4 className="font-medium text-purple-100 mb-2 flex items-center">
                      <Smile className="h-4 w-4 mr-2" />
                      Why this song?
                    </h4>
                    <p className="text-purple-200 text-sm leading-relaxed">{song.reason}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Footer Stats */}
        <div className="mt-12 text-center">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20">
            <div className="grid md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="bg-purple-500/30 rounded-full p-3 w-16 h-16 mx-auto mb-3 flex items-center justify-center">
                  <Music className="h-8 w-8 text-white" />
                </div>
                <p className="text-2xl font-bold text-white">{recommendations.songs.length}</p>
                <p className="text-purple-200 text-sm">Songs Today</p>
              </div>
              <div className="text-center">
                <div className="bg-pink-500/30 rounded-full p-3 w-16 h-16 mx-auto mb-3 flex items-center justify-center">
                  <Heart className="h-8 w-8 text-white" />
                </div>
                <p className="text-2xl font-bold text-white">{favorites.size}</p>
                <p className="text-purple-200 text-sm">Favorites</p>
              </div>
              <div className="text-center">
                <div className="bg-blue-500/30 rounded-full p-3 w-16 h-16 mx-auto mb-3 flex items-center justify-center">
                  <Brain className="h-8 w-8 text-white" />
                </div>
                <p className="text-2xl font-bold text-white capitalize">{recommendations.mood}</p>
                <p className="text-purple-200 text-sm">Current Mood</p>
              </div>
              <div className="text-center">
                <div className="bg-green-500/30 rounded-full p-3 w-16 h-16 mx-auto mb-3 flex items-center justify-center">
                  <Sparkles className="h-8 w-8 text-white" />
                </div>
                <p className="text-2xl font-bold text-white">Good</p>
                <p className="text-purple-200 text-sm">Brain</p>
              </div>
            </div>
          </div>
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
      `}</style>
    </div>
  )
}
