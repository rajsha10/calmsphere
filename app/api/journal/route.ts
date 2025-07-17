import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import connectDB from "@/lib/mongodb"
import JournalEntry from "@/lib/models/JournalEntry"
import User from "@/lib/models/User"

export async function POST(request: NextRequest) {
  try {
    console.log("Journal POST API called")

    const session = await getServerSession(authOptions)
    console.log("Session:", session)

    if (!session?.user?.email) {
      console.log("No session or email found")
      return NextResponse.json({ error: "Unauthorized - Please log in" }, { status: 401 })
    }

    const { content } = await request.json()
    console.log("Content received:", content?.substring(0, 50) + "...")

    if (!content || content.trim().length === 0) {
      return NextResponse.json({ error: "Content is required" }, { status: 400 })
    }

    // Connect to MongoDB
    console.log("Connecting to MongoDB...")
    await connectDB()

    // Find user by email
    console.log("Finding user with email:", session.user.email)
    const user = await User.findOne({ email: session.user.email })
    if (!user) {
      console.log("User not found in database")
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    console.log("User found:", user._id)

    // Create journal entry
    const journalEntry = await JournalEntry.create({
      userId: user._id,
      content: content.trim(),
    })

    console.log("Journal entry created:", journalEntry._id)

    return NextResponse.json({
      success: true,
      message: "Journal entry saved successfully! 🌟",
      entry: {
        _id: journalEntry._id,
        content: journalEntry.content,
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
    console.log("Journal GET API called")

    const session = await getServerSession(authOptions)
    console.log("Session:", session)

    if (!session?.user?.email) {
      console.log("No session or email found")
      return NextResponse.json({ error: "Unauthorized - Please log in" }, { status: 401 })
    }

    // Connect to MongoDB
    await connectDB()

    // Find user by email
    const user = await User.findOne({ email: session.user.email })
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Get user's journal entries
    const entries = await JournalEntry.find({ userId: user._id })
      .sort({ createdAt: -1 })
      .select("_id content createdAt")

    console.log(`Found ${entries.length} entries for user`)

    return NextResponse.json({
      success: true,
      entries: entries.map((entry) => ({
        _id: entry._id,
        content: entry.content,
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
