import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { GoogleGenerativeAI } from "@google/generative-ai"

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "")

async function getGeminiComment(journalContent: string, prompt?: string): Promise<string> {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

    const systemPrompt = `You are a compassionate and supportive AI journal companion. Your role is to provide thoughtful, empathetic, and encouraging responses to journal entries. 

Guidelines:
- Be warm, understanding, and non-judgmental
- Offer gentle insights or reflections when appropriate
- Acknowledge the person's feelings and experiences
- Provide encouragement and positive reinforcement
- Keep responses concise but meaningful (2-4 sentences)
- Avoid giving medical or professional advice
- Focus on emotional support and validation
- Use emojis sparingly but meaningfully

${prompt ? `The journal entry was written in response to this prompt: "${prompt}"` : ""}

Please respond to this journal entry with empathy and support:`

    const fullPrompt = `${systemPrompt}\n\nJournal Entry: "${journalContent}"`

    const result = await model.generateContent(fullPrompt)
    const response = await result.response
    return response.text()
  } catch (error) {
    console.error("Error getting Gemini comment:", error)
    return "Thank you for sharing your thoughts. Your reflections are valuable and I appreciate you taking the time to journal today. 💙"
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized - Please log in" }, { status: 401 })
    }

    const { content, prompt } = await request.json()

    if (!content || content.trim().length === 0) {
      return NextResponse.json({ error: "Content is required" }, { status: 400 })
    }

    // Generate Gemini comment
    const comment = await getGeminiComment(content.trim(), prompt)

    return NextResponse.json({
      success: true,
      comment: comment,
    })
  } catch (error) {
    console.error("Generate comment API error:", error)
    return NextResponse.json(
      {
        error: "Failed to generate comment",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}