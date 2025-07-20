import { getServerSession } from "next-auth/next"
import { NextResponse } from "next/server"
import { authOptions } from "@/lib/auth"

const GEMINI_API_KEY = process.env.GEMINI_API_KEY

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { mood, genre, energy } = await request.json()

    if (!mood) {
      return NextResponse.json({ error: "Mood is required" }, { status: 400 })
    }

    const customPrompt = `
Generate 4 YouTube song recommendations for someone feeling ${mood}.

${genre ? `Preferred genre: ${genre}` : ""}
${energy ? `Energy level: ${energy}` : ""}

Respond with only a JSON array:
[
  {
    "title": "exact song title",
    "artist": "artist name", 
    "youtubeId": "real_youtube_video_id",
    "reason": "why this fits the mood",
    "mood": "${mood}",
    "genre": "music genre"
  }
]

Use real YouTube video IDs for popular songs.
`

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
                  text: customPrompt,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.8,
            maxOutputTokens: 1000,
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
        const songs = JSON.parse(jsonMatch[0])
        return NextResponse.json({
          date: new Date().toISOString().split("T")[0],
          mood,
          moodScore: 0,
          songs: songs.slice(0, 4),
          moodDescription: `Custom recommendations for ${mood} mood.`,
        })
      }
    }

    return NextResponse.json({ error: "Failed to generate recommendations" }, { status: 500 })
  } catch (error) {
    console.error("Custom song recommendations error:", error)
    return NextResponse.json({ error: "Failed to generate custom recommendations" }, { status: 500 })
  }
}
