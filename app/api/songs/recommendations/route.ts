import { getServerSession } from "next-auth/next"
import { NextResponse } from "next/server"
import { authOptions } from "@/lib/auth"
import connectDB from "@/lib/mongodb"
import Message from "@/lib/models/Message"
import JournalEntry from "@/lib/models/JournalEntry"
import User from "@/lib/models/User"

//rate limit
import { checkAndUpdateCredits } from "@/lib/middlewares/rate-limiter"

const GEMINI_API_KEY = process.env.GEMINI_API_KEY

function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

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

// Mood analysis function
async function getCurrentMoodAnalysis(
  userId: string,
  userEmail: string,
): Promise<{ mood: string; score: number; emotions: string[] }> {
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
      // `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${GEMINI_API_KEY}`,
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

async function findYouTubeVideo(
  title: string,
  artist: string,
): Promise<string | null> {
  const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
  if (!YOUTUBE_API_KEY) {
    console.error("YouTube API key is missing.");
    return null;
  }

  //search query for the YouTube API
  const query = encodeURIComponent(`${title} ${artist}`);
  const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${query}&type=video&videoCategoryId=10&maxResults=1&key=${YOUTUBE_API_KEY}`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (data.items && data.items.length > 0) {
      return data.items[0].id.videoId;
    }
    console.warn(`No YouTube video found for: ${title} - ${artist}`);
    return null;
  } catch (error) {
    console.error(`YouTube API error for "${title}":`, error);
    return null;
  }
}

async function generateSongRecommendations(
  mood: string,
  score: number,
  emotions: string[],
  userEmail: string
): Promise<SongRecommendation[]> {
  if (!GEMINI_API_KEY) return [];

  const today = new Date().toISOString().split("T")[0];

  const recommendationPrompt = `
You are a music therapist and DJ specializing in mood-based music curation. Based on the current mood analysis, recommend 6 songs.

Current Analysis:
- Primary Mood: ${mood}
- Mood Score: ${score} (scale: -5 to +5)
- Emotions: ${emotions.join(", ")}

CRITICAL: Respond with ONLY a valid JSON array in this exact format. Do not include any other text.
[
  {
    "title": "Song Title",
    "artist": "Artist Name",
    "reason": "Why this song matches the mood and emotions.",
    "mood": "${mood}",
    "genre": "Genre"
  }
]
`;

  const inputTokens = estimateTokens(recommendationPrompt);

  try {
    // Get Song Ideas from Gemini
    const response = await fetch(
      // `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${GEMINI_API_KEY}`,
      `https://generativelanguage.googleapis.com/v1beta/models/gemma-3n-e2b-it:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: recommendationPrompt }] }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1500,
          },
        }),
      },
    );

    if (!response.ok) {
        const errorData = await response.json();
        console.error("Gemini API Error:", errorData);
        return [];
    }
    
    const data = await response.json();
    const recommendationText = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

    if (!recommendationText) {
      console.error("No recommendation text received from Gemini.");
      return [];
    }

    const outputTokens = data.usageMetadata?.candidates_token_count || estimateTokens(recommendationText || "");
    await checkAndUpdateCredits(userEmail, inputTokens, outputTokens);

    let songIdeas = [];
    const jsonMatch = recommendationText.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
        try {
            songIdeas = JSON.parse(jsonMatch[0]);
        } catch (e) {
            console.error("Failed to parse JSON from Gemini response.", e);
            return [];
        }
    } else {
        console.error("No JSON array found in Gemini response.");
        return [];
    }


    // Verify and Enrich with YouTube API
    const verifiedSongs: SongRecommendation[] = [];

    for (const idea of songIdeas) {
      if (idea.title && idea.artist) {
        const youtubeId = await findYouTubeVideo(idea.title, idea.artist);
        
        if (youtubeId) {
          verifiedSongs.push({
            ...idea,
            youtubeId,
          });
        }
      }
      if (verifiedSongs.length >= 6) break;
    }

    return verifiedSongs;

  } catch (error) {
    console.error("Song recommendation error:", error);
    return [];
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

    const moodAnalysis = await getCurrentMoodAnalysis(session.user.id || "", session.user.email)

    const songs = await generateSongRecommendations(
      moodAnalysis.mood,
      moodAnalysis.score,
      moodAnalysis.emotions,
      userEmail
    )

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
    const userEmail = session.user.email;

    await connectDB()

    const user = await User.findOne({ email: session.user.email })
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const today = new Date().toISOString().split("T")[0]

    if (user.lastRecommendationDate !== today) {
      user.recommendationCount = 0
      user.lastRecommendationDate = today
    }

    if (user.recommendationCount >= 2) {
      return NextResponse.json(
        { error: "You have reached your daily limit of 2 recommendation generations." },
        { status: 429 },
      )
    }
    // End of Daily Limit Logic

    const { mood, emotions } = await request.json()

    if (!mood) {
      return NextResponse.json({ error: "Mood is required" }, { status: 400 })
    }

    const songs = await generateSongRecommendations(mood, 0, emotions || ["neutral"], userEmail)

    user.recommendationCount += 1
    await user.save()

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