import { getServerSession } from "next-auth/next"
import { NextResponse } from "next/server"
import { authOptions } from "@/lib/auth"
import connectDB from "@/lib/mongodb"
import Message from "@/lib/models/Message"
import JournalEntry from "@/lib/models/JournalEntry"
import User from "@/lib/models/User"

//credit checker
import { checkAndUpdateCredits } from "@/lib/middlewares/rate-limiter"

const GEMINI_API_KEY = process.env.GEMINI_API_KEY

function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

interface MoodAnalysis {
  overallMood: string
  moodScore: number // -5 to +5 scale
  emotions: string[]
  insights: string[]
  trends: {
    date: string
    mood: string
    score: number
  }[]
}

async function analyzeMoodWithGemini(
  journalEntries: any[], 
  chatMessages: any[],
  userEmail: string
): Promise<MoodAnalysis> {
  if (!GEMINI_API_KEY) {
    throw new Error("Gemini API key not configured")
  }

  //data for analysis
  const recentJournals = journalEntries.slice(-10).map((entry) => ({
    date: entry.createdAt.toISOString().split("T")[0],
    content: entry.content,
    geminiComment: entry.geminiComment,
  }))

  const recentChats = chatMessages
    .slice(-50)
    .filter((msg) => msg.sender === "user")
    .map((msg) => ({
      date: msg.timestamp.toISOString().split("T")[0],
      content: msg.content,
    }))

  const analysisPrompt = `
You are an expert mood analyst. Analyze the following journal entries and chat messages to provide comprehensive mood insights.

JOURNAL ENTRIES:
${recentJournals.map((j) => `[${j.date}] ${j.content}`).join("\n")}

CHAT MESSAGES:
${recentChats.map((c) => `[${c.date}] ${c.content}`).join("\n")}

Please provide a JSON response with the following structure:
{
  "overallMood": "string (e.g., 'Optimistic', 'Reflective', 'Anxious', 'Peaceful', 'Energetic')",
  "moodScore": number (-5 to +5, where -5 is very negative, 0 is neutral, +5 is very positive),
  "emotions": ["array", "of", "detected", "emotions"],
  "insights": ["array", "of", "meaningful", "insights", "about", "the", "person's", "mental", "state"],
  "trends": [
    {"date": "YYYY-MM-DD", "mood": "mood_name", "score": number},
    {"date": "YYYY-MM-DD", "mood": "mood_name", "score": number}
  ]
}

Focus on:
- Emotional patterns and changes over time
- Stress indicators and coping mechanisms
- Positive developments and growth
- Areas that might need attention or support
- Overall mental wellness trajectory

Be empathetic, insightful, and constructive in your analysis.
`

  const inputTokens = estimateTokens(analysisPrompt);

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemma-3n-e2b-it:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: analysisPrompt,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 1500,
            topP: 0.8,
            topK: 10,
          },
        }),
      },
    )

    const data = await response.json()
    const analysisText = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim()

    const outputTokens = data.usageMetadata?.candidates_token_count || estimateTokens(analysisText || "");
    await checkAndUpdateCredits(userEmail, inputTokens, outputTokens);

    if (!analysisText) {
      throw new Error("No analysis received from Gemini")
    }

    // Extract JSON from the response
    const jsonMatch = analysisText.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error("No valid JSON found in analysis")
    }

    const analysis = JSON.parse(jsonMatch[0])
    return analysis
  } catch (error) {
    console.error("Mood analysis error:", error)
    // Fallback analysis
    return {
      overallMood: "Neutral",
      moodScore: 0,
      emotions: ["calm", "reflective"],
      insights: ["Continue journaling for better mood tracking"],
      trends: [],
    }
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const userEmail = session.user.email;

    await connectDB()

    // Find user
    const user = await User.findOne({ email: session.user.email })
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Get recent data (last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    // Fetch journal entries
    const journalEntries = await JournalEntry.find({
      userId: user._id,
      createdAt: { $gte: thirtyDaysAgo },
    }).sort({ createdAt: -1 })

    // Fetch chat messages
    const chatMessages = await Message.find({
      userId: session.user.email,
      timestamp: { $gte: thirtyDaysAgo },
    }).sort({ timestamp: -1 })

    // Analyze mood using Gemini
    const moodAnalysis = await analyzeMoodWithGemini(journalEntries, chatMessages, userEmail)

    // Calculate statistics
    const stats = {
      totalJournalEntries: journalEntries.length,
      totalChatMessages: chatMessages.filter((m) => m.sender === "user").length,
      totalBotResponses: chatMessages.filter((m) => m.sender === "bot").length,
      streakDays: calculateStreakDays(journalEntries, chatMessages),
      avgEntriesPerWeek: Math.round((journalEntries.length / 4) * 10) / 10,
      mostActiveDay: getMostActiveDay(journalEntries, chatMessages),
    }

    // Get recent activities
    const recentActivities = [
      ...journalEntries.slice(0, 5).map((entry) => ({
        type: "journal",
        content: entry.content.substring(0, 100) + "...",
        timestamp: entry.createdAt,
        mood: extractMoodFromGeminiComment(entry.geminiComment),
      })),
      ...chatMessages
        .filter((m) => m.sender === "user")
        .slice(0, 5)
        .map((msg) => ({
          type: "chat",
          content: msg.content.substring(0, 100) + "...",
          timestamp: msg.timestamp,
          mood: null,
        })),
    ]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 8)

    return NextResponse.json({
      moodAnalysis,
      stats,
      recentActivities,
      lastUpdated: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Dashboard API error:", error)
    return NextResponse.json({ error: "Failed to fetch dashboard data" }, { status: 500 })
  }
}

function calculateStreakDays(journalEntries: any[], chatMessages: any[]): number {
  const today = new Date()
  let streak = 0
  const currentDate = new Date(today)

  for (let i = 0; i < 30; i++) {
    const dateStr = currentDate.toISOString().split("T")[0]

    const hasJournalEntry = journalEntries.some((entry) => entry.createdAt.toISOString().split("T")[0] === dateStr)

    const hasChatActivity = chatMessages.some(
      (msg) => msg.timestamp.toISOString().split("T")[0] === dateStr && msg.sender === "user",
    )

    if (hasJournalEntry || hasChatActivity) {
      streak++
    } else if (i > 0) {
      break
    }

    currentDate.setDate(currentDate.getDate() - 1)
  }

  return streak
}

function getMostActiveDay(journalEntries: any[], chatMessages: any[]): string {
  const dayCount: { [key: string]: number } = {}
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]

  journalEntries.forEach((entry) => {
    const day = days[entry.createdAt.getDay()]
    dayCount[day] = (dayCount[day] || 0) + 1
  })

  chatMessages
    .filter((m) => m.sender === "user")
    .forEach((msg) => {
      const day = days[msg.timestamp.getDay()]
      dayCount[day] = (dayCount[day] || 0) + 1
    })

  return Object.keys(dayCount).reduce((a, b) => (dayCount[a] > dayCount[b] ? a : b), "Monday")
}

function extractMoodFromGeminiComment(comment: string | null): string | null {
  if (!comment) return null

  const moodKeywords = {
    happy: ["happy", "joy", "excited", "cheerful", "delighted"],
    sad: ["sad", "down", "melancholy", "blue", "dejected"],
    anxious: ["anxious", "worried", "nervous", "stressed", "tense"],
    calm: ["calm", "peaceful", "serene", "tranquil", "relaxed"],
    angry: ["angry", "frustrated", "irritated", "mad", "furious"],
    grateful: ["grateful", "thankful", "appreciative", "blessed"],
    hopeful: ["hopeful", "optimistic", "positive", "confident"],
  }

  const lowerComment = comment.toLowerCase()

  for (const [mood, keywords] of Object.entries(moodKeywords)) {
    if (keywords.some((keyword) => lowerComment.includes(keyword))) {
      return mood
    }
  }

  return null
}
