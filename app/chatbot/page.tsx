"use client"
import type React from "react"
import { useState, useEffect, useRef, useCallback } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Send, Bot, User, Heart, Star, Moon, Sparkles, MessageCircle, Languages, Copy, Check, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { supportedLanguages } from "@/lib/prompt"

//credits
import { useCredits } from "@/context/CreditContext";
import { toast } from "sonner"

interface Message {
  id: string
  content: string
  sender: "user" | "bot"
  timestamp: Date
}

// YouTube video ID extractor
const extractYouTubeId = (url: string): string | null => {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /youtube\.com\/watch\?.*v=([^&\n?#]+)/,
  ]

  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match) return match[1]
  }
  return null
}

// Enhanced Message formatter component
const MessageFormatter: React.FC<{ content: string; onCopy?: (text: string) => void }> = ({ content, onCopy }) => {
  const [copiedText, setCopiedText] = useState<string | null>(null)

  const handleCopy = useCallback((text: string) => {
    navigator.clipboard.writeText(text)
    setCopiedText(text)
    onCopy?.(text)
    setTimeout(() => setCopiedText(null), 2000)
  }, [onCopy])

  const formatInlineText = (text: string) => {
    // Enhanced formatting for bold, italic, and code
    const parts = text.split(/(\*\*.*?\*\*|__.*?__|`.*?`|\*.*?\*|_.*?_)/g)

    return parts.map((part, index) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return <strong key={index} className="font-bold">{part.slice(2, -2)}</strong>
      }
      if (part.startsWith("__") && part.endsWith("__")) {
        return <strong key={index} className="font-bold">{part.slice(2, -2)}</strong>
      }
      if (part.startsWith("`") && part.endsWith("`")) {
        return <code key={index} className="bg-gray-100 dark:bg-gray-800 text-pink-500 dark:text-pink-400 px-1 py-0.5 rounded-md text-sm font-mono">{part.slice(1, -1)}</code>
      }
      if (part.startsWith("*") && part.endsWith("*") && part.length > 2) {
        return <em key={index} className="italic">{part.slice(1, -1)}</em>
      }
      return <span key={index}>{part}</span>
    })
  }

  const formatText = (text: string) => {
    const lines = text.split("\n")

    return lines.map((line, lineIndex) => {
      if (!line.trim()) {
        return <div key={lineIndex} className="h-4" /> // Provide consistent space for newlines
      }

      // Check for YouTube links
      const youtubeId = extractYouTubeId(line)
      if (youtubeId) {
        return (
          <div key={lineIndex} className="my-4">
            <div className="relative w-full max-w-lg mx-auto group">
              <div className="relative overflow-hidden rounded-lg shadow-xl" style={{ paddingTop: '56.25%' }}>
                 <iframe
                  src={`https://www.youtube.com/embed/${youtubeId}`}
                  title="YouTube video player"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="absolute top-0 left-0 w-full h-full"
                />
              </div>
            </div>
          </div>
        )
      }

      // Check for bullet points
      if (line.trim().match(/^[•\-*]\s/)) {
        return (
          <div key={lineIndex} className="flex items-start space-x-3 my-2 pl-2">
            <div className="flex-shrink-0 w-1.5 h-1.5 bg-purple-400 rounded-full mt-2"></div>
            <span className="flex-1">{formatInlineText(line.replace(/^[•\-*]\s*/, ""))}</span>
          </div>
        )
      }

      // Regular paragraph
      return (
        <p key={lineIndex} className="my-1 leading-relaxed">
          {formatInlineText(line)}
        </p>
      )
    })
  }

  return (
    <div className="text-xs sm:text-sm group">
      {formatText(content)}
       <Button
        variant="ghost"
        size="icon"
        onClick={() => handleCopy(content)}
        className="opacity-0 group-hover:opacity-100 transition-opacity mt-1 h-6 w-6 text-xs"
      >
        {copiedText === content ? (
          <Check className="h-3 w-3 text-green-500" />
        ) : (
          <Copy className="h-3 w-3" />
        )}
      </Button>
    </div>
  )
}

export default function ChatbotPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [messages, setMessages] = useState<Message[]>([])
  const [inputMessage, setInputMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isClearing, setIsClearing] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [selectedLanguage, setSelectedLanguage] = useState("English")
  const [isTyping, setIsTyping] = useState(false);
  const { setCredits, setInitialised } = useCredits();

  // Auto-resize textarea
  const adjustTextareaHeight = useCallback(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
      const newHeight = Math.min(textareaRef.current.scrollHeight, 120) // Set max height
      textareaRef.current.style.height = `${newHeight}px`
    }
  }, [])

  useEffect(() => {
    adjustTextareaHeight()
  }, [inputMessage, adjustTextareaHeight])

  // Redirect to login if not logged in
  useEffect(() => {
    if (status === "loading") return
    if (!session) {
      router.push("/login")
    }
  }, [session, status, router])

  // Load message history
  useEffect(() => {
    if (!session) return
    const fetchHistory = async () => {
      try {
        const res = await fetch("/api/history")
        const data = await res.json()
        if (res.ok) {
          const formatted = data.messages.map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp),
          }))
          setMessages(formatted)
        }
      } catch (err) {
        console.error("Failed to fetch history:", err)
      }
    }
    fetchHistory()
  }, [session])

  // --- SCROLLING & FOCUS FIX ---
  // More reliable scroll-to-bottom logic
  useEffect(() => {
    const timer = setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }, 100) // Delay ensures the DOM is updated before scrolling
    return () => clearTimeout(timer)
  }, [messages, isTyping])

  // Focus textarea when not loading, without causing scroll jumps
  useEffect(() => {
    if (!isLoading && textareaRef.current) {
      setTimeout(() => textareaRef.current?.focus(), 150)
    }
  }, [isLoading])


  const handleClearChat = async () => {
    if (!confirm("Are you sure you want to clear all chat history?")) {
      return
    }
    setIsClearing(true)
    try {
      await fetch("/api/clear-chat", { method: "DELETE" })
      setMessages([])
    } catch (error) {
      console.error("Error clearing chat:", error)
      alert("Failed to clear chat history.")
    } finally {
      setIsClearing(false)
    }
  }

  const handleSendMessage = async () => {
    const trimmedMessage = inputMessage.trim()
    if (!trimmedMessage || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      content: trimmedMessage,
      sender: "user",
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInputMessage("")
    setIsLoading(true)
    setIsTyping(true)

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: trimmedMessage,
          language: selectedLanguage,
          conversationHistory: messages,
        }),
      })

      if (!response.ok) throw new Error("API response was not ok.")
      
      const data = await response.json()

      if (data.creditError) {
        toast.error("Credit Limit Reached", {
          description: data.creditError,
        });
      }

      if (data.credits) {
        setCredits(data.credits);
        setInitialised(true);
      }

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: data.response,
        sender: "bot",
        timestamp: new Date(),
      }
      
      // Simulate typing delay for better UX
      setTimeout(() => {
        setMessages((prev) => [...prev, botMessage])
        setIsTyping(false)
      }, 800)

    } catch (error) {
      console.error("Chat error:", error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: "I apologize, but I'm having some trouble connecting. Please try again in a moment. ❤️",
        sender: "bot",
        timestamp: new Date(),
      }
      setTimeout(() => {
          setMessages((prev) => [...prev, errorMessage])
          setIsTyping(false)
      }, 500)
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  if (status === "loading" || !session) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="text-center">
          <Heart className="h-10 w-10 text-pink-500 mx-auto mb-4 animate-bounce" />
          <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300">
            Loading Your Safe Space...
          </h2>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen w-full items-center justify-center bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 dark:from-gray-900 dark:via-purple-900 dark:to-indigo-900 p-2 sm:p-4">
      <div className="flex h-full w-full max-w-[95%] flex-col">
        {/* Header */}
        <div className="flex-shrink-0 text-center mb-3 sm:mb-4">
          <h1 className="text-lg sm:text-2xl md:text-3xl font-bold bg-gradient-to-r from-pink-500 via-purple-600 to-indigo-500 bg-clip-text text-transparent">
            Your Calm bot
          </h1>
          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 max-w-xl mx-auto mt-1">
            A compassionate space for mindful conversations and gentle support
          </p>
        </div>

        {/* Language Selector */}
        <div className="mb-3 sm:mb-4 flex justify-center">
          <div className="flex items-center gap-2 rounded-lg bg-gray-100 dark:bg-gray-800 p-1">
            <Languages className="h-3 w-3 sm:h-4 sm:w-4 text-purple-500 ml-2" />
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              className="cursor-pointer bg-transparent text-xs font-medium text-gray-700 dark:text-gray-300 outline-none pr-1"
            >
              {supportedLanguages.map((lang) => (
                <option key={lang.code} value={lang.name}>
                  {lang.flag} {lang.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Chat Card - Full Height */}
        <Card className="flex flex-1 flex-col min-h-0 w-full rounded-xl border border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm shadow-xl">
          {/* Header */}
          <CardHeader className="flex-shrink-0 border-b border-gray-200/80 dark:border-gray-800/80 px-3 py-2 sm:px-4 sm:py-3">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2 sm:space-x-3">
                <Bot className="h-4 w-4 sm:h-5 sm:w-5 text-purple-500" />
                <div>
                  <span className="text-sm sm:text-base font-semibold">Mindful Conversation</span>
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-normal">
                    Speaking in {selectedLanguage}
                  </p>
                </div>
              </div>
              {messages.length > 0 && (
                <Button
                  onClick={handleClearChat}
                  disabled={isClearing}
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs text-red-500 hover:bg-red-500/10"
                >
                  {isClearing ? (
                    <div className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  ) : (
                    <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                  )}
                  <span className="ml-1 hidden sm:inline">Clear</span>
                </Button>
              )}
            </CardTitle>
          </CardHeader>

          {/* Messages Area - Scrollable */}
          <CardContent className="flex-1 p-0 min-h-0 overflow-hidden">
            <ScrollArea className="h-full">
              <div className="space-y-4 sm:space-y-6 p-3 sm:p-4 md:p-6">
                {messages.length === 0 && (
                  <div className="text-center py-8 sm:py-10">
                    <Bot className="h-10 w-10 sm:h-12 sm:w-12 text-purple-400 mx-auto mb-3 sm:mb-4" />
                    <h3 className="text-base sm:text-lg font-semibold text-gray-800 dark:text-gray-200">Ready when you are</h3>
                    <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-2 max-w-sm mx-auto">
                      Feel free to share what's on your mind or drop a YouTube link to discuss.
                    </p>
                  </div>
                )}

                {messages.map((message) => (
                  <div key={message.id} className={`flex items-end gap-2 sm:gap-3 ${message.sender === "user" ? "justify-end" : "justify-start"}`}>
                    {message.sender === "bot" && (
                      <div className="flex-shrink-0 w-6 h-6 sm:w-8 sm:h-8 md:w-9 md:h-9 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                        <Bot className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 text-white" />
                      </div>
                    )}
                    <div className={`max-w-[85%] sm:max-w-[80%] rounded-2xl px-3 py-2 sm:px-4 sm:py-3 ${
                        message.sender === "user"
                          ? "bg-gradient-to-br from-pink-500 to-purple-600 text-white"
                          : "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200"
                      }`}
                    >
                      <MessageFormatter content={message.content} />
                      <div className="mt-1 text-right text-xs opacity-70">
                        {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </div>
                    </div>
                     {message.sender === "user" && (
                       <div className="flex-shrink-0 w-6 h-6 sm:w-8 sm:h-8 md:w-9 md:h-9 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                        <User className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 text-gray-600 dark:text-gray-300" />
                      </div>
                    )}
                  </div>
                ))}

                {isTyping && (
                  <div className="flex items-end gap-2 sm:gap-3">
                    <div className="w-6 h-6 sm:w-8 sm:h-8 md:w-9 md:h-9 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                      <Bot className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 text-white" />
                    </div>
                    <div className="rounded-2xl bg-gray-100 dark:bg-gray-800 px-3 py-2 sm:px-4 sm:py-3">
                      <div className="flex items-center space-x-1">
                        <div className="h-1.5 w-1.5 sm:h-2 sm:w-2 animate-bounce rounded-full bg-purple-400" style={{ animationDelay: "0s" }}></div>
                        <div className="h-1.5 w-1.5 sm:h-2 sm:w-2 animate-bounce rounded-full bg-purple-400" style={{ animationDelay: "0.1s" }}></div>
                        <div className="h-1.5 w-1.5 sm:h-2 sm:w-2 animate-bounce rounded-full bg-purple-400" style={{ animationDelay: "0.2s" }}></div>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>
          </CardContent>

          {/* Input Area */}
          <div className="flex-shrink-0 border-t border-gray-200/80 dark:border-gray-800/80 p-2 sm:p-3 md:p-4">
            <div className="flex items-end gap-2 sm:gap-3">
              <Textarea
                ref={textareaRef}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Share what's on your heart..."
                className="flex-1 resize-none border-gray-300 dark:border-gray-700 rounded-lg min-h-[40px] text-sm"
                rows={1}
                disabled={isLoading}
              />
              <Button
                onClick={handleSendMessage}
                disabled={!inputMessage.trim() || isLoading}
                className="h-10 w-10 sm:h-11 sm:w-11 md:h-12 md:w-12 rounded-lg bg-gradient-to-r from-pink-500 to-purple-600 text-white"
                size="icon"
              >
                <Send className="h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}