import { getServerSession } from "next-auth/next"
import { NextResponse } from "next/server"
import { authOptions } from "@/lib/auth"
import connectDB from "@/lib/mongodb"
import Message from "@/lib/models/Message"
import JournalEntry from "@/lib/models/JournalEntry"
import User from "@/lib/models/User"

const GEMINI_API_KEY = process.env.GEMINI_API_KEY

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await connectDB()

    const user = await User.findOne({ email: session.user.email })
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Get data for the last 14 days
    const fourteenDaysAgo = new Date()
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14)

    const journalEntries = await JournalEntry.find({
      userId: user._id,
      createdAt: { $gte: fourteenDaysAgo },
    }).sort({ createdAt: 1 })

    const chatMessages = await Message.find({
      userId: session.user.email,
      timestamp: { $gte: fourteenDaysAgo },
      sender: "user",
    }).sort({ timestamp: 1 })

    // Group by day and analyze mood for each day
    const dailyData: { [key: string]: { journals: any[]; chats: any[] } } = {}

    // Group journal entries by day
    journalEntries.forEach((entry) => {
      const dateKey = entry.createdAt.toISOString().split("T")[0]
      if (!dailyData[dateKey]) dailyData[dateKey] = { journals: [], chats: [] }
      dailyData[dateKey].journals.push(entry)
    })

    // Group chat messages by day
    chatMessages.forEach((msg) => {
      const dateKey = msg.timestamp.toISOString().split("T")[0]
      if (!dailyData[dateKey]) dailyData[dateKey] = { journals: [], chats: [] }
      dailyData[dateKey].chats.push(msg)
    })

    // Analyze mood for each day with data
    const moodTrends = []

    for (const [date, data] of Object.entries(dailyData)) {
      if (data.journals.length > 0 || data.chats.length > 0) {
        const dayMood = await analyzeDayMood(data.journals, data.chats)
        moodTrends.push({
          date,
          mood: dayMood.mood,
          score: dayMood.score,
          activities: data.journals.length + data.chats.length,
        })
      }
    }

    return NextResponse.json({ trends: moodTrends })
  } catch (error) {
    console.error("Mood trends API error:", error)
    return NextResponse.json({ error: "Failed to fetch mood trends" }, { status: 500 })
  }
}

async function analyzeDayMood(journals: any[], chats: any[]): Promise<{ mood: string; score: number }> {
  if (!GEMINI_API_KEY) {
    return { mood: "neutral", score: 0 }
  }

  const content = [...journals.map((j) => j.content), ...chats.map((c) => c.content)].join(" ")

  if (!content.trim()) {
    return { mood: "neutral", score: 0 }
  }

  const prompt = `
Analyze the following text and determine the overall mood and emotional score for this day.

Text: "${content}"

Respond with only a JSON object in this format:
{
  "mood": "one word mood (e.g., happy, sad, anxious, calm, excited, peaceful, stressed, grateful)",
  "score": number between -5 and 5 (-5 very negative, 0 neutral, 5 very positive)
}
`

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
                  text: prompt,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 100,
            topP: 0.8,
            topK: 10,
          },
        }),
      },
    )

    const data = await response.json()
    const analysisText = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim()

    if (analysisText) {
      const jsonMatch = analysisText.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const result = JSON.parse(jsonMatch[0])
        return {
          mood: result.mood || "neutral",
          score: Math.max(-5, Math.min(5, result.score || 0)),
        }
      }
    }
  } catch (error) {
    console.error("Day mood analysis error:", error)
  }

  return { mood: "neutral", score: 0 }
}
