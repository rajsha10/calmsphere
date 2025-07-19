import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import connectDB from "@/lib/mongodb"
import JournalEntry from "@/lib/models/JournalEntry"
import User from "@/lib/models/User"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized - Please log in" }, { status: 401 })
    }

    const { content, prompt, geminiComment } = await request.json()

    if (!content || content.trim().length === 0) {
      return NextResponse.json({ error: "Content is required" }, { status: 400 })
    }

    // Connect to MongoDB
    await connectDB()

    // Find user by email
    const user = await User.findOne({ email: session.user.email })
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Create journal entry with the pre-generated Gemini comment from frontend
    const journalEntry = await JournalEntry.create({
      userId: user._id,
      content: content.trim(),
      prompt: prompt || null,
      geminiComment: geminiComment || null,
    })

    return NextResponse.json({
      success: true,
      message: "Journal entry saved successfully! 🌟",
      entry: {
        _id: journalEntry._id,
        content: journalEntry.content,
        prompt: journalEntry.prompt,
        geminiComment: journalEntry.geminiComment,
        createdAt: journalEntry.createdAt,
      },
    })
  } catch (error) {
    console.error("Journal API error:", error)
    return NextResponse.json(
      {
        error: "Failed to save journal entry",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized - Please log in" }, { status: 401 })
    }

    // Connect to MongoDB
    await connectDB()

    // Find user by email
    const user = await User.findOne({ email: session.user.email })
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Get user's journal entries with prompts and Gemini comments
    const entries = await JournalEntry.find({ userId: user._id })
      .sort({ createdAt: -1 })
      .select("_id content prompt geminiComment createdAt")

    return NextResponse.json({
      success: true,
      entries: entries.map((entry) => ({
        _id: entry._id,
        content: entry.content,
        prompt: entry.prompt,
        geminiComment: entry.geminiComment,
        createdAt: entry.createdAt,
      })),
    })
  } catch (error) {
    console.error("Journal GET API error:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch journal entries",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}