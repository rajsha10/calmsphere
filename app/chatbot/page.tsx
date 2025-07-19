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
        return (
          <strong key={index} className="font-bold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-900/30 px-1 rounded">
            {part.slice(2, -2)}
          </strong>
        )
      }
      if (part.startsWith("__") && part.endsWith("__")) {
        return (
          <strong key={index} className="font-bold text-purple-700 dark:text-purple-300">
            {part.slice(2, -2)}
          </strong>
        )
      }
      if (part.startsWith("`") && part.endsWith("`")) {
        return (
          <code key={index} className="bg-gray-100 dark:bg-gray-800 text-pink-600 dark:text-pink-400 px-2 py-0.5 rounded text-sm font-mono">
            {part.slice(1, -1)}
          </code>
        )
      }
      if (part.startsWith("*") && part.endsWith("*") && part.length > 2) {
        return (
          <em key={index} className="italic text-purple-600 dark:text-purple-400">
            {part.slice(1, -1)}
          </em>
        )
      }
      return <span key={index}>{part}</span>
    })
  }

  const formatText = (text: string) => {
    const lines = text.split("\n")

    return lines.map((line, lineIndex) => {
      if (!line.trim()) {
        return <div key={lineIndex} className="h-3" />
      }

      // Check for YouTube links
      const youtubeId = extractYouTubeId(line)
      if (youtubeId) {
        return (
          <div key={lineIndex} className="my-4">
            <div className="relative w-full max-w-lg mx-auto group">
              <div className="absolute -inset-1 bg-gradient-to-r from-pink-600 to-purple-600 rounded-xl blur opacity-25 group-hover:opacity-75 transition duration-1000 group-hover:duration-200"></div>
              <div className="relative">
                <iframe
                  width="100%"
                  height="250"
                  src={`https://www.youtube.com/embed/${youtubeId}`}
                  title="YouTube video player"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="rounded-lg shadow-xl"
                />
              </div>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center flex items-center justify-center gap-1">
              <Sparkles className="h-3 w-3" />
              YouTube Video
            </p>
          </div>
        )
      }

      // Check for bullet points
      if (line.trim().match(/^[•\-*]\s/)) {
        return (
          <div key={lineIndex} className="flex items-start space-x-3 my-2 pl-2">
            <div className="flex-shrink-0 w-2 h-2 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full mt-2.5"></div>
            <span className="flex-1">{formatInlineText(line.replace(/^[•\-*]\s*/, ""))}</span>
          </div>
        )
      }

      // Regular line
      return (
        <div key={lineIndex} className="my-2 leading-relaxed">
          {formatInlineText(line)}
        </div>
      )
    })
  }

  return (
    <div className="leading-relaxed group">
      {formatText(content)}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => handleCopy(content)}
        className="opacity-0 group-hover:opacity-100 transition-opacity mt-2 h-6 px-2 text-xs"
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
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [selectedLanguage, setSelectedLanguage] = useState("English")
  const [isTyping, setIsTyping] = useState(false)

  // Auto-resize textarea with improved logic
  const adjustTextareaHeight = useCallback(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
      const newHeight = Math.min(Math.max(textareaRef.current.scrollHeight, 44), 120)
      textareaRef.current.style.height = newHeight + "px"
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
      return
    }
  }, [session, status, router])

  // Load message history once session is available
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

  // Smooth scroll to bottom
  useEffect(() => {
    const scrollToBottom = () => {
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({
          behavior: "smooth",
          block: "end",
        })
      }
    }
    const timer = setTimeout(scrollToBottom, 100)
    return () => clearTimeout(timer)
  }, [messages, isLoading])

  // Focus textarea when not loading
  useEffect(() => {
    if (!isLoading && textareaRef.current) {
      textareaRef.current.focus()
    }
  }, [isLoading])

  const handleClearChat = async () => {
    if (!confirm("Are you sure you want to clear all chat history? This action cannot be undone.")) {
      return
    }

    setIsClearing(true)
    try {
      const response = await fetch("/api/clear-chat", {
        method: "DELETE",
      })

      if (response.ok) {
        setMessages([])
        console.log("Chat history cleared successfully")
      } else {
        throw new Error("Failed to clear chat history")
      }
    } catch (error) {
      console.error("Error clearing chat:", error)
      alert("Failed to clear chat history. Please try again.")
    } finally {
      setIsClearing(false)
    }
  }

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputMessage.trim(),
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
          message: inputMessage.trim(),
          language: selectedLanguage,
          conversationHistory: messages,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        // Simulate typing delay for better UX
        setTimeout(() => {
          const botMessage: Message = {
            id: (Date.now() + 1).toString(),
            content: data.response,
            sender: "bot",
            timestamp: new Date(),
          }
          setMessages((prev) => [...prev, botMessage])
          setIsTyping(false)
        }, 800)
      } else {
        throw new Error("Failed to get response")
      }
    } catch (error) {
      console.error("Chat error:", error)
      setTimeout(() => {
        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: "I apologize, but I'm experiencing some technical difficulties. Please try again in a moment. 💜",
          sender: "bot",
          timestamp: new Date(),
        }
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

  const handleCopyMessage = (text: string) => {
    // Optional: Add toast notification here
    console.log("Copied:", text)
  }

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-gray-900">
        <div className="text-center">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full blur-xl opacity-20 animate-pulse"></div>
            <Heart className="relative h-12 w-12 text-pink-500 mx-auto mb-6 animate-bounce" />
          </div>
          <h2 className="text-2xl font-semibold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent mb-2">
            Loading Your AI Companion
          </h2>
          <p className="text-gray-600 dark:text-gray-300">Preparing a mindful space for you...</p>
        </div>
      </div>
    )
  }

  if (!session) return null

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 dark:from-gray-900 dark:via-purple-900/10 dark:to-gray-900 relative overflow-hidden">
      {/* Enhanced floating background elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-r from-pink-400 to-purple-400 rounded-full blur-3xl opacity-10 animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-40 h-40 bg-gradient-to-r from-purple-400 to-indigo-400 rounded-full blur-3xl opacity-10 animate-pulse" style={{animationDelay: "2s"}}></div>
        <Star className="absolute top-20 left-10 h-6 w-6 text-pink-400 dark:text-purple-400 float-animation opacity-60" />
        <Moon className="absolute top-40 right-20 h-8 w-8 text-indigo-400 dark:text-indigo-300 float-slow opacity-50" />
        <Heart className="absolute bottom-40 left-20 h-5 w-5 text-purple-400 dark:text-pink-400 float-animation opacity-70" style={{animationDelay: "1s"}} />
        <Sparkles className="absolute top-1/2 left-1/4 h-4 w-4 text-pink-300 dark:text-purple-300 float-animation opacity-50" style={{animationDelay: "3s"}} />
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6 h-screen flex flex-col">
        {/* Enhanced Header */}
        <div className="text-center mb-6 flex-shrink-0">
          <div className="relative inline-block">
            <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-pink-500 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
              Your AI Companion
            </h1>
            <div className="absolute -inset-1 bg-gradient-to-r from-pink-600 to-purple-600 blur opacity-10"></div>
          </div>
          <p className="text-lg text-gray-700 dark:text-gray-300 max-w-2xl mx-auto">
            A compassionate space for mindful conversations, creative exploration, and gentle support
          </p>
        </div>

        {/* Enhanced Language Selector */}
        <div className="flex-shrink-0 mb-6 flex justify-center">
          <div className="relative">
            <div className="absolute -inset-1 bg-gradient-to-r from-pink-500 to-purple-600 rounded-lg blur opacity-25"></div>
            <div className="relative bg-white dark:bg-gray-800 rounded-lg p-1 flex items-center gap-2">
              <Languages className="h-4 w-4 text-purple-500 ml-2" />
              <select
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value)}
                className="bg-transparent border-none outline-none text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer pr-2"
              >
                {supportedLanguages.map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.flag} {lang.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Enhanced Chat Interface */}
        <Card className="backdrop-blur-xl bg-white/80 dark:bg-gray-900/80 border-0 shadow-2xl flex-1 flex flex-col min-h-0 relative overflow-hidden">
          {/* Gradient border effect */}
          <div className="absolute -inset-1 bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 rounded-2xl blur opacity-20"></div>
          
          <div className="relative flex-1 flex flex-col min-h-0">
            <CardHeader className="flex-shrink-0 pb-4 border-b border-gray-200/50 dark:border-gray-700/50">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <Bot className="h-6 w-6 text-purple-500" />
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white dark:border-gray-900"></div>
                  </div>
                  <div>
                    <span className="text-lg">Mindful Conversation</span>
                    <p className="text-sm text-gray-500 dark:text-gray-400 font-normal">
                      Speaking in {selectedLanguage}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                    <MessageCircle className="h-4 w-4" />
                    <span>{messages.length} messages</span>
                  </div>
                  {messages.length > 0 && (
                    <Button
                      onClick={handleClearChat}
                      disabled={isClearing}
                      variant="ghost"
                      size="sm"
                      className="relative group bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 hover:border-red-300 dark:hover:border-red-700 transition-all duration-300"
                    >
                      <div className="absolute -inset-1 bg-gradient-to-r from-red-500 to-pink-500 rounded-lg blur opacity-0 group-hover:opacity-25 transition duration-300"></div>
                      <div className="relative flex items-center gap-2">
                        {isClearing ? (
                          <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                        <span className="text-xs font-medium">Clear Chat</span>
                      </div>
                    </Button>
                  )}
                </div>
              </CardTitle>
            </CardHeader>

            <CardContent className="flex-1 flex flex-col p-0 min-h-0">
              {/* Enhanced Messages Area */}
              <div className="flex-1 min-h-0 relative">
                <ScrollArea ref={scrollAreaRef} className="h-full px-6">
                  <div className="space-y-8 py-6">
                    {messages.length === 0 && (
                      <div className="text-center py-16">
                        <div className="relative inline-block mb-6">
                          <div className="absolute -inset-4 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full blur opacity-20 animate-pulse"></div>
                          <Bot className="relative h-16 w-16 text-purple-400 mx-auto" />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-4">
                          Welcome to your safe space
                        </h3>
                        <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-md mx-auto">
                          I'm here to listen, support, and engage in meaningful conversations with you.
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto text-left">
                          <div className="bg-gradient-to-r from-pink-50 to-purple-50 dark:from-pink-900/20 dark:to-purple-900/20 p-4 rounded-xl border border-pink-200/50 dark:border-purple-700/50">
                            <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-2">💭 Share your thoughts</h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Express your feelings, ideas, or concerns in a judgment-free space</p>
                          </div>
                          <div className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 p-4 rounded-xl border border-purple-200/50 dark:border-indigo-700/50">
                            <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-2">🎥 Share content</h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Drop YouTube links to watch and discuss together</p>
                          </div>
                          <div className="bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 p-4 rounded-xl border border-indigo-200/50 dark:border-blue-700/50">
                            <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-2">✨ Get creative</h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Use **bold** text, *italic*, and `code` for rich formatting</p>
                          </div>
                          <div className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 p-4 rounded-xl border border-blue-200/50 dark:border-cyan-700/50">
                            <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-2">🔒 Stay private</h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Your conversations are secure and confidential</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"} group`}
                      >
                        <div
                          className={`max-w-[85%] rounded-2xl shadow-lg transition-all duration-300 hover:shadow-xl ${
                            message.sender === "user"
                              ? "bg-gradient-to-br from-pink-500 to-purple-600 text-white ml-12"
                              : "bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 border border-gray-200/50 dark:border-gray-700/50 mr-12"
                          }`}
                        >
                          <div className="p-6">
                            <div className="flex items-start space-x-4">
                              <div className="flex-shrink-0">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center shadow-lg ${
                                  message.sender === "user" 
                                    ? "bg-white/20 backdrop-blur-sm" 
                                    : "bg-gradient-to-r from-purple-500 to-pink-500"
                                }`}>
                                  {message.sender === "user" ? (
                                    <User className="h-5 w-5 text-white" />
                                  ) : (
                                    <Bot className="h-5 w-5 text-white" />
                                  )}
                                </div>
                              </div>

                              <div className="flex-1 min-w-0">
                                <div className="mb-3">
                                  <MessageFormatter 
                                    content={message.content} 
                                    onCopy={handleCopyMessage}
                                  />
                                </div>
                                <div className={`flex items-center justify-between text-xs ${
                                  message.sender === "user" 
                                    ? "text-pink-100" 
                                    : "text-gray-500 dark:text-gray-400"
                                }`}>
                                  <span>
                                    {message.timestamp.toLocaleTimeString([], {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })}
                                  </span>
                                  {message.sender === "bot" && (
                                    <span className="flex items-center gap-1">
                                      <Sparkles className="h-3 w-3" />
                                      AI Response
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}

                    {(isLoading || isTyping) && (
                      <div className="flex justify-start">
                        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200/50 dark:border-gray-700/50 max-w-[85%] mr-12">
                          <div className="p-6">
                            <div className="flex items-start space-x-4">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
                                <Bot className="h-5 w-5 text-white" />
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center space-x-2">
                                  <div className="flex space-x-1">
                                    <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"></div>
                                    <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
                                    <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                                  </div>
                                  <span className="text-sm text-gray-500 dark:text-gray-400">AI is thinking...</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} className="h-1" />
                  </div>
                </ScrollArea>
              </div>

              {/* Enhanced Input Area */}
              <div className="flex-shrink-0 border-t border-gray-200/50 dark:border-gray-700/50 bg-gradient-to-r from-pink-50/50 to-purple-50/50 dark:from-pink-900/10 dark:to-purple-900/10">
                <div className="p-6">
                  <div className="flex space-x-4 items-end">
                    <div className="flex-1 relative">
                      <Textarea
                        ref={textareaRef}
                        value={inputMessage}
                        onChange={(e) => setInputMessage(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Share what's on your heart... (Shift+Enter for new line)"
                        className="min-h-[52px] max-h-[120px] resize-none border-2 border-transparent focus:border-purple-400 dark:focus:border-purple-500 rounded-xl bg-white dark:bg-gray-800 shadow-lg transition-all duration-300 focus:shadow-xl pl-4 pr-12"
                        disabled={isLoading}
                        rows={1}
                      />
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                        <MessageCircle className="h-4 w-4" />
                      </div>
                    </div>
                    <Button
                      onClick={handleSendMessage}
                      disabled={!inputMessage.trim() || isLoading}
                      className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white rounded-full transition-all duration-300 transform hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg hover:shadow-xl h-12 w-12 p-0 relative overflow-hidden group"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-pink-600 to-purple-700 transform scale-0 group-hover:scale-100 transition-transform duration-300 rounded-full"></div>
                      <Send className="h-5 w-5 relative z-10" />
                    </Button>
                  </div>
                  <div className="mt-4 flex items-center justify-center space-x-6 text-xs text-gray-500 dark:text-gray-400">
                    <div className="flex items-center gap-1">
                      <Heart className="h-3 w-3 text-pink-500" />
                      <span>Private & Secure</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Sparkles className="h-3 w-3 text-purple-500" />
                      <span>AI-Powered</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="h-3 w-3 text-indigo-500" />
                      <span>Always Learning</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </div>
        </Card>
      </div>

      <style jsx>{`
        .float-animation {
          animation: float 6s ease-in-out infinite;
        }
        .float-slow {
          animation: float 8s ease-in-out infinite;
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(5deg); }
        }
      `}</style>
    </div>
  )
}