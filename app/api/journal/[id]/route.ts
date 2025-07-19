import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import connectDB from "@/lib/mongodb"
import JournalEntry from "@/lib/models/JournalEntry"
import User from "@/lib/models/User"
import mongoose from "mongoose"

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { content, geminiComment } = await request.json()
    const { id } = params

    if (!content || content.trim().length === 0) {
      return NextResponse.json({ error: "Content is required" }, { status: 400 })
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid entry ID" }, { status: 400 })
    }

    // Connect to MongoDB
    await connectDB()

    // Find user by email
    const user = await User.findOne({ email: session.user.email })
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Find the existing entry to verify ownership
    const existingEntry = await JournalEntry.findOne({ _id: id, userId: user._id })
    if (!existingEntry) {
      return NextResponse.json({ error: "Journal entry not found" }, { status: 404 })
    }

    // Update journal entry with new content and pre-generated Gemini comment
    const updatedEntry = await JournalEntry.findOneAndUpdate(
      { _id: id, userId: user._id },
      {
        content: content.trim(),
        geminiComment: geminiComment || existingEntry.geminiComment, // Use new comment or keep existing
      },
      { new: true },
    )

    return NextResponse.json({
      success: true,
      message: "Journal entry updated successfully! ✨",
      entry: {
        _id: updatedEntry._id,
        content: updatedEntry.content,
        prompt: updatedEntry.prompt,
        geminiComment: updatedEntry.geminiComment,
        createdAt: updatedEntry.createdAt,
      },
    })
  } catch (error) {
    console.error("Journal UPDATE API error:", error)
    return NextResponse.json({ error: "Failed to update journal entry" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = params

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid entry ID" }, { status: 400 })
    }

    // Connect to MongoDB
    await connectDB()

    // Find user by email
    const user = await User.findOne({ email: session.user.email })
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Delete journal entry (only if it belongs to the user)
    const deletedEntry = await JournalEntry.findOneAndDelete({
      _id: id,
      userId: user._id,
    })

    if (!deletedEntry) {
      return NextResponse.json({ error: "Journal entry not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      message: "Journal entry deleted successfully",
    })
  } catch (error) {
    console.error("Journal DELETE API error:", error)
    return NextResponse.json({ error: "Failed to delete journal entry" }, { status: 500 })
  }
}