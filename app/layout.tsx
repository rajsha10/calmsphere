import type React from "react"
import type { Metadata } from "next"
import { Quicksand } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { Navbar } from "@/components/navbar"
import { QuoteBanner } from "@/components/quote-banner"
import { LoadingProvider } from "@/components/loading-provider"
import { AuthProvider } from "@/components/auth-provider"

const quicksand = Quicksand({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "MindMate - Your Spiritual Mental Health Companion",
  description: "A peaceful space for mental wellness and spiritual growth",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={quicksand.className}>
        <AuthProvider>
          <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange={false}>
            <LoadingProvider>
              <div className="min-h-screen bg-gradient-to-br from-pink-50 via-blue-50 to-purple-50 dark:from-slate-900 dark:via-purple-900 dark:to-indigo-900 transition-all duration-1000">
                <QuoteBanner />
                <Navbar />
                <main className="transition-all duration-500 ease-in-out">{children}</main>
              </div>
            </LoadingProvider>
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
