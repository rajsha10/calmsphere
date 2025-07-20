"use client"

import { useEffect } from "react"
import Link from "next/link"
import { ArrowRight, Heart, Star, Moon, Feather } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

export default function HomePage() {
  useEffect(() => {
    document.body.classList.add("page-transition")
  }, [])

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Floating Background Elements */}
      <div className="absolute inset-0 pointer-events-none">
        <Star className="absolute top-20 left-10 h-6 w-6 text-pink-300 dark:text-purple-400 float-animation opacity-60" />
        <Moon className="absolute top-40 right-20 h-8 w-8 text-blue-300 dark:text-indigo-400 float-slow opacity-50" />
        <Feather className="absolute bottom-40 left-20 h-5 w-5 text-purple-300 dark:text-pink-400 float-animation opacity-70" />
        <Heart className="absolute bottom-20 right-10 h-7 w-7 text-pink-400 dark:text-purple-300 float-slow opacity-60" />
      </div>

      <div className="max-w-6xl mx-auto px-4 py-20">
        {/* Hero Section */}
        <div className="text-center mb-20">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 bg-clip-text text-transparent">
            Welcome to Calm Sphere
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed">
            Your gentle companion for mental wellness and spiritual growth. Find peace, clarity, and healing in this
            sacred digital space.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/login">
              <Button
                size="lg"
                className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white px-8 py-3 rounded-full transition-all duration-300 transform hover:scale-105 glow-hover"
              >
                Begin Your Journey
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button
                variant="outline"
                size="lg"
                className="border-pink-300 dark:border-purple-600 text-pink-600 dark:text-purple-400 hover:bg-pink-50 dark:hover:bg-purple-900/20 px-8 py-3 rounded-full transition-all duration-300 bg-transparent"
              >
                Explore Features
              </Button>
            </Link>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-20">
          <Card className="soft-glow hover:shadow-lg transition-all duration-300 transform hover:-translate-y-2 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-pink-200 dark:border-purple-800">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-pink-400 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Heart className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-gray-800 dark:text-gray-200">Mindful Journaling</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Express your thoughts and emotions in a safe, private space with AI-powered insights.
              </p>
            </CardContent>
          </Card>

          <Card className="soft-glow hover:shadow-lg transition-all duration-300 transform hover:-translate-y-2 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-pink-200 dark:border-purple-800">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Star className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-gray-800 dark:text-gray-200">AI Companion</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Chat with our compassionate AI companion for support, guidance, and gentle conversations.
              </p>
            </CardContent>
          </Card>

          <Card className="soft-glow hover:shadow-lg transition-all duration-300 transform hover:-translate-y-2 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-pink-200 dark:border-purple-800">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Moon className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-gray-800 dark:text-gray-200">Mood Tracking</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Monitor your emotional journey with gentle mood tracking and personalized insights.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Call to Action */}
        <div className="text-center bg-gradient-to-r from-pink-50 to-purple-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-3xl p-12 border border-pink-200 dark:border-purple-800">
          <h2 className="text-3xl font-bold mb-4 text-gray-800 dark:text-gray-200">
            Ready to nurture your mind and soul?
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-8 max-w-2xl mx-auto">
            Join thousands who have found peace and clarity through CalmSphere. Your journey to mental wellness starts
            with a single step.
          </p>
          <Link href="/signup">
            <Button
              size="lg"
              className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white px-10 py-4 rounded-full transition-all duration-300 transform hover:scale-105 glow-hover"
            >
              Start Your Free Journey
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
