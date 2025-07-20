"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Moon, Sun, Heart, Home, BookOpen, MessageCircle, LayoutDashboard, LogOut, Menu, X, Music } from "lucide-react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import { Clock } from "@/components/clock"
import { useSession, signOut } from "next-auth/react"

export function Navbar() {
  const { theme, setTheme } = useTheme()
  const pathname = usePathname()
  const [mounted, setMounted] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const { data: session } = useSession()

  useEffect(() => {
    setMounted(true)
  }, [])

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMenuOpen(false)
  }, [pathname])

  const navItems = [
    { href: "/journal", label: "Journal", icon: BookOpen },
    { href: "/chatbot", label: "Chatbot", icon: MessageCircle },
    { href: "/songs", label: "Playlist", icon: Music },
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  ]

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen)

  if (!mounted) return null

  return (
    <>
      <nav className="sticky top-0 z-50 backdrop-blur-md bg-white/80 dark:bg-slate-900/80 border-b border-pink-200 dark:border-purple-800 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-2 group">
              <Heart className="h-8 w-8 text-pink-500 group-hover:text-pink-600 transition-colors float-animation" />
              <span className="text-xl font-bold bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent">
                CalmSphere
              </span>
            </Link>

            {/* Desktop Navigation Links */}
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

            {/* Right side - Clock, Theme Toggle, and Desktop Logout */}
            <div className="flex items-center space-x-4">
              <div className="hidden sm:block">
                <Clock />
              </div>
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
                  className="hidden md:flex rounded-full hover:bg-pink-100 dark:hover:bg-purple-900 transition-colors text-gray-600 dark:text-gray-300 hover:text-pink-500 dark:hover:text-purple-400"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  <span className="text-sm font-medium">Logout</span>
                </Button>
              )}

              {/* Mobile Menu Toggle */}
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleMenu}
                className="md:hidden rounded-full hover:bg-pink-100 dark:hover:bg-purple-900 transition-all duration-300"
              >
                <div className="relative w-6 h-6">
                  <Menu 
                    className={`absolute inset-0 h-6 w-6 text-gray-600 dark:text-gray-300 transition-all duration-300 ${
                      isMenuOpen ? 'rotate-90 opacity-0' : 'rotate-0 opacity-100'
                    }`} 
                  />
                  <X 
                    className={`absolute inset-0 h-6 w-6 text-gray-600 dark:text-gray-300 transition-all duration-300 ${
                      isMenuOpen ? 'rotate-0 opacity-100' : '-rotate-90 opacity-0'
                    }`} 
                  />
                </div>
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      <div className={`md:hidden fixed inset-0 z-40 transition-all duration-300 ${
        isMenuOpen ? 'opacity-100 visible' : 'opacity-0 invisible'
      }`}>
        {/* Backdrop */}
        <div 
          className="absolute inset-0 bg-black/20 backdrop-blur-sm"
          onClick={toggleMenu}
        />
        
        {/* Mobile Menu Panel */}
        <div className={`absolute top-16 left-0 right-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-lg border-b border-pink-200 dark:border-purple-800 shadow-lg transition-all duration-300 ${
          isMenuOpen ? 'translate-y-0 opacity-100' : '-translate-y-4 opacity-0'
        }`}>
          <div className="px-4 py-6 space-y-4">
            {/* Mobile Clock */}
            <div className="sm:hidden flex justify-center pb-4 border-b border-pink-100 dark:border-purple-800">
              <Clock />
            </div>

            {/* Mobile Navigation Items */}
            <div className="space-y-2">
              {navItems.map((item, index) => {
                const Icon = item.icon
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-300 group ${
                      isActive
                        ? "bg-gradient-to-r from-pink-100 to-purple-100 dark:from-purple-900 dark:to-pink-900 text-pink-600 dark:text-purple-300 shadow-sm"
                        : "text-gray-600 dark:text-gray-300 hover:bg-gradient-to-r hover:from-pink-50 hover:to-purple-50 dark:hover:from-purple-900/50 dark:hover:to-pink-900/50 hover:text-pink-500 dark:hover:text-purple-400"
                    }`}
                    style={{
                      animationDelay: `${index * 0.1}s`,
                      animation: isMenuOpen ? 'slideInFromRight 0.3s ease-out forwards' : undefined
                    }}
                  >
                    <Icon className={`h-5 w-5 transition-transform duration-300 ${
                      isActive ? 'scale-110' : 'group-hover:scale-105'
                    }`} />
                    <span className="text-base font-medium">{item.label}</span>
                  </Link>
                )
              })}
            </div>

            {/* Mobile Logout Button */}
            {session && (
              <div className="pt-4 border-t border-pink-100 dark:border-purple-800">
                <Button
                  variant="ghost"
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="w-full justify-start px-4 py-3 h-auto rounded-xl hover:bg-gradient-to-r hover:from-red-50 hover:to-pink-50 dark:hover:from-red-900/50 dark:hover:to-pink-900/50 text-gray-600 dark:text-gray-300 hover:text-red-500 dark:hover:text-red-400 transition-all duration-300"
                >
                  <LogOut className="h-5 w-5 mr-3" />
                  <span className="text-base font-medium">Logout</span>
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Animation Styles */}
      <style jsx>{`
        @keyframes slideInFromRight {
          from {
            opacity: 0;
            transform: translateX(20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        .float-animation {
          animation: float 3s ease-in-out infinite;
        }
        
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-5px); }
        }
      `}</style>
    </>
  )
}