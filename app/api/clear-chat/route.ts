// Add this new API route: /api/clear-chat/route.ts

import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import connectDB from "@/lib/mongodb"
import Message from "@/lib/models/Message"

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await connectDB()
    
    // Delete all messages for the current user
    await Message.deleteMany({ userId: session.user?.email })

    return NextResponse.json({ success: true, message: "Chat history cleared successfully" })
  } catch (error) {
    console.error("Error clearing chat history:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}