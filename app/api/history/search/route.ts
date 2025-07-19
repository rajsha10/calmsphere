// /api/history/search/route.ts
import { getServerSession } from "next-auth/next"
import { NextResponse, NextRequest } from "next/server"
import { authOptions } from "@/lib/auth"
import connectDB from "@/lib/mongodb"
import Message from "@/lib/models/Message"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await connectDB()

    const { 
      query, 
      searchType = "content", // "content", "dateRange", "emotionalTone", "summary"
      startDate,
      endDate,
      emotionalTone,
      limit = 50 
    } = await request.json()

    const userId = session.user?.email

    let messages = []
    let summary = null

    switch (searchType) {
      case "content":
        if (query) {
          // Search by text content
          messages = await Message.find({
            userId,
            content: { $regex: query, $options: 'i' }
          })
          .sort({ timestamp: -1 })
          .limit(limit)
        }
        break

      case "dateRange":
        if (startDate && endDate) {
          messages = await Message.findByUserInDateRange(
            userId!,
            new Date(startDate),
            new Date(endDate)
          )
        }
        break

      case "emotionalTone":
        if (emotionalTone) {
          messages = await Message.findByEmotionalTone(userId!, emotionalTone, limit)
        }
        break

      case "summary":
        const days = query ? parseInt(query) : 7
        summary = await Message.getConversationSummary(userId!, days)
        break

      case "recent":
        messages = await Message.find({ userId })
          .sort({ timestamp: -1 })
          .limit(limit)
        break

      case "topics":
        // Search for specific topics mentioned
        if (query) {
          const topicKeywords = query.split(',').map((k: string) => k.trim())
          const regexPattern = topicKeywords.map((keyword: string) => 
            `(?=.*${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`
          ).join('')
          
          messages = await Message.find({
            userId,
            content: { $regex: regexPattern, $options: 'i' }
          })
          .sort({ timestamp: -1 })
          .limit(limit)
        }
        break

      default:
        // Default: get recent messages
        messages = await Message.find({ userId })
          .sort({ timestamp: -1 })
          .limit(20)
    }

    // Format messages for better readability
    const formattedMessages = messages.map(msg => ({
      id: msg._id,
      sender: msg.sender,
      content: msg.content,
      timestamp: msg.timestamp,
      formattedTime: new Date(msg.timestamp).toLocaleString(),
      emotionalTone: msg.emotionalTone || 'neutral'
    }))

    return NextResponse.json({ 
      messages: formattedMessages,
      summary,
      totalFound: messages.length,
      searchType,
      query 
    })

  } catch (error) {
    console.error("Error in history search route:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await connectDB()

    const { searchParams } = new URL(request.url)
    const days = parseInt(searchParams.get('days') || '7')
    const userId = session.user?.email

    // Get conversation analytics
    const summary = await Message.getConversationSummary(userId!, days)
    
    // Get message distribution by day
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)
    
    const dailyMessages = await Message.aggregate([
      {
        $match: {
          userId,
          timestamp: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: "%Y-%m-%d", date: "$timestamp" } },
            sender: "$sender"
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { "_id.date": 1 }
      }
    ])

    return NextResponse.json({ 
      summary,
      dailyMessages,
      analytics: {
        totalDays: days,
        avgMessagesPerDay: Math.round(summary.totalMessages / days),
        userBotRatio: summary.userMessages / (summary.botMessages || 1)
      }
    })

  } catch (error) {
    console.error("Error in history analytics route:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}