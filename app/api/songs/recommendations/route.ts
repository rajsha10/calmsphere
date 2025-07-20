import { getServerSession } from "next-auth/next"
import { NextResponse } from "next/server"
import { authOptions } from "@/lib/auth"
import connectDB from "@/lib/mongodb"
import Message from "@/lib/models/Message"
import JournalEntry from "@/lib/models/JournalEntry"
import User from "@/lib/models/User"

const GEMINI_API_KEY = process.env.GEMINI_API_KEY

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

async function getCurrentMoodAnalysis(
  userId: string,
  userEmail: string,
): Promise<{ mood: string; score: number; emotions: string[] }> {
  // Get recent data (last 3 days for current mood)
  const threeDaysAgo = new Date()
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3)

  const user = await User.findOne({ email: userEmail })
  if (!user) {
    return { mood: "neutral", score: 0, emotions: ["calm"] }
  }

  const recentJournals = await JournalEntry.find({
    userId: user._id,
    createdAt: { $gte: threeDaysAgo },
  })
    .sort({ createdAt: -1 })
    .limit(5)

  const recentChats = await Message.find({
    userId: userEmail,
    timestamp: { $gte: threeDaysAgo },
    sender: "user",
  })
    .sort({ timestamp: -1 })
    .limit(10)

  if (recentJournals.length === 0 && recentChats.length === 0) {
    return { mood: "neutral", score: 0, emotions: ["calm", "peaceful"] }
  }

  const analysisPrompt = `
Analyze the following recent journal entries and chat messages to determine the current mood:

JOURNAL ENTRIES:
${recentJournals.map((j) => `- ${j.content.substring(0, 200)}`).join("\n")}

CHAT MESSAGES:
${recentChats.map((c) => `- ${c.content.substring(0, 150)}`).join("\n")}

Respond with only a JSON object:
{
  "mood": "primary mood (happy, sad, anxious, calm, excited, peaceful, energetic, reflective, hopeful, stressed)",
  "score": number (-5 to 5),
  "emotions": ["array", "of", "2-4", "emotions"]
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
                  text: analysisPrompt,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 200,
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
          emotions: result.emotions || ["calm"],
        }
      }
    }
  } catch (error) {
    console.error("Mood analysis error:", error)
  }

  return { mood: "neutral", score: 0, emotions: ["calm"] }
}

async function generateSongRecommendations(
  mood: string,
  score: number,
  emotions: string[],
): Promise<SongRecommendation[]> {
  if (!GEMINI_API_KEY) {
    return []
  }

  const today = new Date().toISOString().split("T")[0]

  const recommendationPrompt = `
You are a music therapist and DJ. Based on the current mood analysis, recommend 6 YouTube songs that would be perfect for today (${today}).

Current Mood: ${mood}
Mood Score: ${score} (-5 to 5 scale)
Emotions: ${emotions.join(", ")}

Guidelines:
- Mix of popular and lesser-known songs
- Consider therapeutic value for the mood
- Include variety of genres and eras
- Provide real, existing YouTube songs with accurate titles and artists
- Match energy level to mood (uplifting for low moods, calming for anxious moods)

Respond with only a JSON array:
[
  {
    "title": "exact song title",
    "artist": "artist name",
    "youtubeId": "actual_youtube_video_id",
    "reason": "why this song fits the current mood (1-2 sentences)",
    "mood": "mood this song addresses",
    "genre": "music genre"
  }
]

Important: Use real YouTube video IDs for popular songs. For example:
- "Weightless" by Marconi Union: "UfcAVejslrU"
- "Clair de Lune" by Debussy: "CvFH_6DNRCY"
- "Here Comes the Sun" by The Beatles: "KQetemT1sWc"
- "Three Little Birds" by Bob Marley: "zaGUr6wzyT8"
- "Good Vibrations" by The Beach Boys: "Eab_beh07HU"
- "Mad World" by Gary Jules: "4N3N1MlvVc4"
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
                  text: recommendationPrompt,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1500,
            topP: 0.9,
            topK: 20,
          },
        }),
      },
    )

    const data = await response.json()
    const recommendationText = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim()

    if (recommendationText) {
      const jsonMatch = recommendationText.match(/\[[\s\S]*\]/)
      if (jsonMatch) {
        const recommendations = JSON.parse(jsonMatch[0])
        return recommendations.slice(0, 6) // Ensure max 6 songs
      }
    }
  } catch (error) {
    console.error("Song recommendation error:", error)
  }

  // Fallback recommendations based on mood
  const fallbackSongs: { [key: string]: SongRecommendation[] } = {
    happy: [
      {
        title: "Good Vibrations",
        artist: "The Beach Boys",
        youtubeId: "Eab_beh07HU",
        reason: "Uplifting and energetic to match your positive mood",
        mood: "happy",
        genre: "Pop Rock",
      },
      {
        title: "Here Comes the Sun",
        artist: "The Beatles",
        youtubeId: "KQetemT1sWc",
        reason: "A classic feel-good song to brighten your day",
        mood: "happy",
        genre: "Rock",
      },
    ],
    sad: [
      {
        title: "Mad World",
        artist: "Gary Jules",
        youtubeId: "4N3N1MlvVc4",
        reason: "A gentle, melancholic song that validates your feelings",
        mood: "sad",
        genre: "Alternative",
      },
      {
        title: "The Sound of Silence",
        artist: "Simon & Garfunkel",
        youtubeId: "4fWyzwo1xg0",
        reason: "Contemplative and soothing for reflective moments",
        mood: "sad",
        genre: "Folk",
      },
    ],
    calm: [
      {
        title: "Weightless",
        artist: "Marconi Union",
        youtubeId: "UfcAVejslrU",
        reason: "Scientifically designed to reduce anxiety and promote calm",
        mood: "calm",
        genre: "Ambient",
      },
      {
        title: "Clair de Lune",
        artist: "Claude Debussy",
        youtubeId: "CvFH_6DNRCY",
        reason: "Beautiful classical piece perfect for peaceful moments",
        mood: "calm",
        genre: "Classical",
      },
    ],
  }

  return fallbackSongs[mood] || fallbackSongs.calm
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await connectDB()

    const moodAnalysis = await getCurrentMoodAnalysis(session.user.id || "", session.user.email)

    const songs = await generateSongRecommendations(moodAnalysis.mood, moodAnalysis.score, moodAnalysis.emotions)

    const recommendations: DailyRecommendations = {
      date: new Date().toISOString().split("T")[0],
      mood: moodAnalysis.mood,
      moodScore: moodAnalysis.score,
      songs,
      moodDescription: `Based on your recent journal entries and conversations, you seem to be feeling ${moodAnalysis.mood} with emotions including ${moodAnalysis.emotions.join(", ")}.`,
    }

    return NextResponse.json(recommendations)
  } catch (error) {
    console.error("Song recommendations API error:", error)
    return NextResponse.json({ error: "Failed to generate recommendations" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { mood, emotions } = await request.json()

    if (!mood) {
      return NextResponse.json({ error: "Mood is required" }, { status: 400 })
    }

    // Generate recommendations for custom mood
    const songs = await generateSongRecommendations(mood, 0, emotions || ["neutral"])

    return NextResponse.json({
      date: new Date().toISOString().split("T")[0],
      mood,
      moodScore: 0,
      songs,
      moodDescription: `Custom recommendations for ${mood} mood.`,
    })
  } catch (error) {
    console.error("Custom song recommendations error:", error)
    return NextResponse.json({ error: "Failed to generate custom recommendations" }, { status: 500 })
  }
}
