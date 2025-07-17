"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Moon, Sun, Heart, Home, BookOpen, MessageCircle, LayoutDashboard, LogOut } from "lucide-react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import { Clock } from "@/components/clock"
import { useSession, signOut } from "next-auth/react"

export function Navbar() {
  const { theme, setTheme } = useTheme()
  const pathname = usePathname()
  const [mounted, setMounted] = useState(false)
  const { data: session } = useSession()

  useEffect(() => {
    setMounted(true)
  }, [])

  const navItems = [
    { href: "/", label: "Home", icon: Home },
    { href: "/journal", label: "Journal", icon: BookOpen },
    { href: "/chatbot", label: "Chatbot", icon: MessageCircle },
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  ]

  if (!mounted) return null

  return (
    <nav className="sticky top-0 z-50 backdrop-blur-md bg-white/80 dark:bg-slate-900/80 border-b border-pink-200 dark:border-purple-800 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2 group">
            <Heart className="h-8 w-8 text-pink-500 group-hover:text-pink-600 transition-colors float-animation" />
            <span className="text-xl font-bold bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent">
              MindMate
            </span>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center space-x-1 px-3 py-2 rounded-full transition-all duration-300 ${
                    isActive
                      ? "bg-pink-100 dark:bg-purple-900 text-pink-600 dark:text-purple-300"
                      : "text-gray-600 dark:text-gray-300 hover:text-pink-500 dark:hover:text-purple-400"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="text-sm font-medium">{item.label}</span>
                </Link>
              )
            })}
          </div>

          {/* Right side - Clock, Theme Toggle, and Logout */}
          <div className="flex items-center space-x-4">
            <Clock />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "light" ? "dark" : "light")}
              className="rounded-full hover:bg-pink-100 dark:hover:bg-purple-900 transition-colors"
            >
              {theme === "light" ? (
                <Moon className="h-5 w-5 text-purple-600" />
              ) : (
                <Sun className="h-5 w-5 text-yellow-500" />
              )}
            </Button>

            {session && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => signOut({ callbackUrl: "/" })}
                className="rounded-full hover:bg-pink-100 dark:hover:bg-purple-900 transition-colors text-gray-600 dark:text-gray-300 hover:text-pink-500 dark:hover:text-purple-400"
              >
                <LogOut className="h-4 w-4 mr-2" />
                <span className="text-sm font-medium">Logout</span>
              </Button>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
