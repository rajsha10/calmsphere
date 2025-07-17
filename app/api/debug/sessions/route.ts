import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    return NextResponse.json({
      session: session,
      hasSession: !!session,
      userEmail: session?.user?.email || null,
      userId: session?.user?.id || null,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Session debug error:", error)
    return NextResponse.json(
      {
        error: "Failed to get session",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
