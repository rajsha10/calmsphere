import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { message } = await request.json()

    // Placeholder for Gemini API integration
    // Replace with actual Gemini API call
    const response = await generateGeminiResponse(message)

    return NextResponse.json({ response })
  } catch (error) {
    console.error("Chat API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

async function generateGeminiResponse(message: string): Promise<string> {
  // Placeholder implementation - replace with actual Gemini API call
  // For now, return a compassionate response based on keywords

  const lowerMessage = message.toLowerCase()

  if (lowerMessage.includes("sad") || lowerMessage.includes("depressed")) {
    return "I hear that you're going through a difficult time. Your feelings are completely valid, and it's okay to not be okay sometimes. Remember that this feeling is temporary, and you have the strength to get through this. What's one small thing that might bring you a moment of peace today? 🌸"
  }

  if (lowerMessage.includes("anxious") || lowerMessage.includes("worried")) {
    return "Anxiety can feel overwhelming, but you're not alone in this feeling. Let's take a moment together - try taking three deep breaths with me. Breathe in for 4 counts, hold for 4, and out for 4. Your worries are heard, and we can work through them one step at a time. 🌙"
  }

  if (lowerMessage.includes("grateful") || lowerMessage.includes("thankful")) {
    return "How beautiful that you're focusing on gratitude! Gratitude has such a powerful way of shifting our perspective and opening our hearts. It sounds like you're cultivating a practice of appreciation, which is truly wonderful for the soul. What else are you feeling grateful for today? ✨"
  }

  if (lowerMessage.includes("stressed") || lowerMessage.includes("overwhelmed")) {
    return "Feeling overwhelmed is your mind's way of telling you that you're carrying a lot right now. It's okay to feel this way, and it's a sign of your caring nature. Remember, you don't have to do everything at once. What's one thing you could let go of today, even temporarily? 🦋"
  }

  // Default compassionate response
  return "Thank you for sharing that with me. I'm here to listen and support you. Your thoughts and feelings matter, and this is a safe space for you to express whatever is on your heart. How can I best support you right now? 💜"
}
