import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import connectDB from "@/lib/mongodb"
import Message from "@/lib/models/Message"
import { getScystemPrompt } from "@/lib/prompt"

//credits
import { checkAndUpdateCredits } from "@/lib/middlewares/rate-limiter"

const GEMINI_API_KEY = process.env.GEMINI_API_KEY

function estimateTokens(text: string) {
  return Math.ceil(text.length / 4);
}

function isHistoryQuestion(message: string): boolean {
  const historyKeywords = [
    'what did i', 'what have i', 'did i tell you', 'did i mention', 'did i say',
    'what was i', 'remember when', 'you remember', 'we talked about',
    'earlier today', 'yesterday', 'last time', 'before', 'previously',
    'conversation', 'chat history', 'our discussion', 'what did we discuss',
    'summarize our', 'summary of', 'topics we covered', 'feelings i shared',
    'emotions i expressed', 'problems i mentioned', 'issues i discussed'
  ]
  
  const lowerMessage = message.toLowerCase()
  return historyKeywords.some(keyword => lowerMessage.includes(keyword))
}

// Helper function to get relevant message history based on query
async function getRelevantHistory(userId: string, query: string, limit: number = 50): Promise<any[]> {
  await connectDB()
  
  // Get recent messages (last 50 or specified limit)
  const recentMessages = await Message.find({ userId })
    .sort({ timestamp: -1 })
    .limit(limit)
    .lean()
  
  return recentMessages.reverse()
}

// Helper function to extract key topics and emotions from conversation history
function analyzeConversationHistory(messages: any[]): string {
  if (messages.length === 0) return "No previous conversations found."
  
  const userMessages = messages.filter(msg => msg.sender === 'user')
  const botMessages = messages.filter(msg => msg.sender === 'bot')
  
  const totalMessages = messages.length
  const conversationSpan = messages.length > 0 ? 
    `from ${new Date(messages[0].timestamp).toLocaleDateString()} to ${new Date(messages[messages.length - 1].timestamp).toLocaleDateString()}` : 
    'today'
  
  return `
CONVERSATION ANALYSIS:
- Total messages: ${totalMessages} (${userMessages.length} from user, ${botMessages.length} from Mindsphere)
- Conversation span: ${conversationSpan}
- Recent conversation context available for analysis and questions
  `
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userEmail = session.user.email;

    const { message, language = "English", conversationHistory = [] } = await request.json()

    if (!GEMINI_API_KEY) {
      return NextResponse.json({ error: "Gemini API key not configured" }, { status: 500 })
    }

    await connectDB()

    const systemPrompt = getScystemPrompt(language)
    const userId = session.user?.email

    const isAskingAboutHistory = isHistoryQuestion(message)
    
    let contextualPrompt = ""
    let conversationContext = ""

    if (isAskingAboutHistory) {
      const fullHistory = await getRelevantHistory(userId!, message, 100)
      const historyAnalysis = analyzeConversationHistory(fullHistory)
      
      conversationContext = fullHistory
        .map((msg: any) => {
          const timestamp = new Date(msg.timestamp).toLocaleString()
          return `[${timestamp}] ${msg.sender === "user" ? "You" : "Mindsphere"}: ${msg.content}`
        })
        .join("\n")

      contextualPrompt = `${systemPrompt}
      
You are Mindsphere, analyzing the user's conversation history. The user is asking about their past conversations with you.

IMPORTANT INSTRUCTIONS:
- You have access to the user's complete conversation history below
- Answer questions about what they discussed, shared emotions, topics covered, or any patterns you notice
- Be specific and reference actual conversations when possible
- Include timestamps when relevant
- Maintain your warm, supportive tone even when analyzing data
- If they ask about emotions or feelings they shared, be empathetic in your response
- Provide insights that could be helpful for their self-reflection or growth

${historyAnalysis}

FULL CONVERSATION HISTORY:
${conversationContext}

Current question about conversation history: ${message}

Mindsphere (analyzing your conversation history):`

    } else {
      // Normal conversation flow with recent context
      conversationContext = conversationHistory
        .slice(-6)
        .map((msg: any) => `${msg.sender === "user" ? "Human" : "Mindsphere"}: ${msg.content}`)
        .join("\n")

      contextualPrompt = `${systemPrompt}
      Please understand and respond in ${language}, even if the message is typed in English letters or phonetics.

      You are Mindsphere, a warm and emotionally supportive AI companion. Your tone must always be gentle, compassionate, and calming. Speak like a kind friend who listens deeply and responds thoughtfully.

      💬 If the user shares emotions (e.g., anxious, sad, joyful), respond with empathy and suggest something helpful like breathing exercises, journaling prompts, or a kind affirmation.

      🎵 Only if the mood truly calls for it (such as deep sadness, anxiety, or celebration), you may suggest a calming or uplifting real YouTube song link. Format it like this: 
      🎶 Here's a song that might help you right now: [YouTube link]

      Do **not** recommend a song every time. Only do so when it feels emotionally appropriate.

      Keep your messages short, heartfelt, and natural.

      Previous conversation:
      ${conversationContext}
      Human: ${message}
      Mindsphere:`
    }
    const inputTokens = estimateTokens(contextualPrompt);

    const userMessageToSave = new Message({
      userId: userEmail,
      sender: "user",
      content: message,
    });
    await userMessageToSave.save();

    const estimatedOutputTokens = 200; 

    try {
      await checkAndUpdateCredits(userEmail, inputTokens, estimatedOutputTokens);
    } catch (error) {
      return NextResponse.json({ error: (error as Error).message }, { status: 429 });
    }

    // Send request to Gemini API - CORRECTED FORMAT
    const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemma-3n-e2b-it:generateContent?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: contextualPrompt
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.85,
          maxOutputTokens: isAskingAboutHistory ? 1000 : 500,
          topP: 0.8,
          topK: 10
        }
      })      
    })

    const geminiData = await geminiRes.json()
    console.log("Gemini response:", geminiData)
      
    if (!geminiRes.ok) {
      console.error("Gemini API error:", geminiData)
      throw new Error(`Gemini API error: ${geminiRes.status}`)
    }
      
    const reply = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "💜 I'm here for you."
    const outputTokens = geminiData.usageMetadata?.candidates_token_count || estimateTokens(reply);
    
    let credits;
    try {
      credits = await checkAndUpdateCredits(userEmail, inputTokens, outputTokens);
    } catch (error) {
      return NextResponse.json({ 
        response: reply,
        creditError: (error as Error).message
      });
    }

    // Save bot response to DB
    const botMessageDoc = new Message({
      userId: userEmail,
      sender: "bot",
      content: reply,
    });
    await botMessageDoc.save();

    return NextResponse.json({ response: reply, credits });
  } catch (error) {
    console.error("Error in chat route:", error);
    const errorMessage = error instanceof Error ? error.message : "Internal Server Error";
    const status = (error as any).status || 500;
    return NextResponse.json({ error: errorMessage }, { status });
  }
}