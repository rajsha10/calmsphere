"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import {
  Sparkles,
  Save,
  Lightbulb,
  Star,
  Moon,
  Heart,
  Edit3,
  Trash2,
  Plus,
  Calendar,
  BookOpen,
  X,
  Check,
  AlertCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

const journalPrompts = [
  "What am I most grateful for today?",
  "How did I show kindness to myself or others?",
  "What emotions am I experiencing right now?",
  "What would I tell my younger self?",
  "What brought me peace today?",
  "How can I practice self-compassion?",
  "What patterns do I notice in my thoughts?",
  "What would love do in this situation?",
]

interface JournalEntry {
  _id: string
  content: string
  createdAt: string
}

export default function JournalPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [entries, setEntries] = useState<JournalEntry[]>([])
  const [newEntry, setNewEntry] = useState("")
  const [editingEntry, setEditingEntry] = useState<string | null>(null)
  const [editContent, setEditContent] = useState("")
  const [currentPrompt, setCurrentPrompt] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [showNewEntry, setShowNewEntry] = useState(false)
  const [wordCount, setWordCount] = useState(0)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    document.body.classList.add("page-transition")

    if (status === "loading") return
    if (!session) {
      router.push("/login")
      return
    }

    console.log("Session in journal page:", session)

    // Set a random prompt
    const randomPrompt = journalPrompts[Math.floor(Math.random() * journalPrompts.length)]
    setCurrentPrompt(randomPrompt)

    // Fetch existing entries
    fetchEntries()
  }, [session, status, router])

  useEffect(() => {
    setWordCount(
      newEntry
        .trim()
        .split(/\s+/)
        .filter((word) => word.length > 0).length,
    )
  }, [newEntry])

  const fetchEntries = async () => {
    try {
      setError(null)
      console.log("Fetching entries...")

      const response = await fetch("/api/journal", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })

      console.log("Fetch response status:", response.status)

      if (response.ok) {
        const data = await response.json()
        console.log("Entries fetched:", data)
        setEntries(data.entries || [])
      } else {
        const errorData = await response.json()
        console.error("Failed to fetch entries:", errorData)
        setError(errorData.error || "Failed to fetch entries")
      }
    } catch (error) {
      console.error("Error fetching entries:", error)
      setError("Network error while fetching entries")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveNew = async () => {
    if (!newEntry.trim()) return

    setIsSaving(true)
    setError(null)

    try {
      console.log("Saving new entry...")
      console.log("Session status:", status)
      console.log("Session data:", session)

      const response = await fetch("/api/journal", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content: newEntry }),
      })

      console.log("Save response status:", response.status)

      const data = await response.json()
      console.log("Save response data:", data)

      if (response.ok) {
        setEntries([data.entry, ...entries])
        setNewEntry("")
        setShowNewEntry(false)
        alert(data.message)
      } else {
        console.error("Save failed:", data)
        setError(data.error || "Failed to save entry")
        if (response.status === 401) {
          // Session expired, redirect to login
          router.push("/login")
        }
      }
    } catch (error) {
      console.error("Save error:", error)
      setError("Network error while saving entry")
    } finally {
      setIsSaving(false)
    }
  }

  const handleEdit = (entry: JournalEntry) => {
    setEditingEntry(entry._id)
    setEditContent(entry.content)
  }

  const handleSaveEdit = async (entryId: string) => {
    if (!editContent.trim()) return

    try {
      setError(null)
      const response = await fetch(`/api/journal/${entryId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: editContent }),
      })

      const data = await response.json()
      if (response.ok) {
        setEntries(entries.map((entry) => (entry._id === entryId ? { ...entry, content: editContent } : entry)))
        setEditingEntry(null)
        setEditContent("")
        alert(data.message)
      } else {
        setError(data.error || "Failed to update entry")
        if (response.status === 401) {
          router.push("/login")
        }
      }
    } catch (error) {
      console.error("Update error:", error)
      setError("Network error while updating entry")
    }
  }

  const handleDelete = async (entryId: string) => {
    if (!confirm("Are you sure you want to delete this journal entry? This action cannot be undone.")) {
      return
    }

    try {
      setError(null)
      const response = await fetch(`/api/journal/${entryId}`, {
        method: "DELETE",
      })

      const data = await response.json()
      if (response.ok) {
        setEntries(entries.filter((entry) => entry._id !== entryId))
        alert(data.message)
      } else {
        setError(data.error || "Failed to delete entry")
        if (response.status === 401) {
          router.push("/login")
        }
      }
    } catch (error) {
      console.error("Delete error:", error)
      setError("Network error while deleting entry")
    }
  }

  const getNewPrompt = () => {
    const randomPrompt = journalPrompts[Math.floor(Math.random() * journalPrompts.length)]
    setCurrentPrompt(randomPrompt)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Heart className="h-8 w-8 animate-pulse text-pink-500 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-300">Loading your journal...</p>
        </div>
      </div>
    )
  }

  if (!session) return null

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Floating Background Elements */}
      <div className="absolute inset-0 pointer-events-none">
        <Star className="absolute top-20 left-10 h-6 w-6 text-pink-300 dark:text-purple-400 float-animation opacity-60" />
        <Moon className="absolute top-40 right-20 h-8 w-8 text-blue-300 dark:text-indigo-400 float-slow opacity-50" />
        <Heart className="absolute bottom-40 left-20 h-5 w-5 text-purple-300 dark:text-pink-400 float-animation opacity-70" />
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent">
            Your Sacred Journal
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            A safe space for your thoughts, feelings, and reflections
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <Card className="mb-6 border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2 text-red-600 dark:text-red-400">
                <AlertCircle className="h-5 w-5" />
                <span>{error}</span>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* New Entry Button */}
            <Card className="soft-glow bg-white/90 dark:bg-slate-800/90 backdrop-blur-md border-pink-200 dark:border-purple-800">
              <CardContent className="p-6 text-center">
                <Button
                  onClick={() => setShowNewEntry(true)}
                  className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white rounded-full transition-all duration-300 transform hover:scale-105 glow-hover"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  New Entry
                </Button>
              </CardContent>
            </Card>

            {/* AI Prompt Suggestion */}
            <Card className="soft-glow bg-white/90 dark:bg-slate-800/90 backdrop-blur-md border-pink-200 dark:border-purple-800">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Lightbulb className="h-5 w-5 text-yellow-500" />
                  <span>Writing Prompt</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-600 dark:text-gray-400 italic">"{currentPrompt}"</p>
                <Button
                  onClick={getNewPrompt}
                  variant="outline"
                  size="sm"
                  className="w-full border-pink-300 dark:border-purple-600 text-pink-600 dark:text-purple-400 hover:bg-pink-50 dark:hover:bg-purple-900/20 bg-transparent"
                >
                  Get New Prompt
                </Button>
              </CardContent>
            </Card>

            {/* Journal Stats */}
            <Card className="soft-glow bg-white/90 dark:bg-slate-800/90 backdrop-blur-md border-pink-200 dark:border-purple-800">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BookOpen className="h-5 w-5 text-purple-500" />
                  <span>Your Progress</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Total entries</span>
                  <span className="font-semibold text-purple-600 dark:text-purple-400">{entries.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">This month</span>
                  <span className="font-semibold text-pink-600 dark:text-pink-400">
                    {entries.filter((entry) => new Date(entry.createdAt).getMonth() === new Date().getMonth()).length}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* New Entry Form */}
            {showNewEntry && (
              <Card className="soft-glow bg-white/90 dark:bg-slate-800/90 backdrop-blur-md border-pink-200 dark:border-purple-800 mb-8">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center space-x-2">
                      <Sparkles className="h-5 w-5 text-pink-500" />
                      <span>New Entry</span>
                    </span>
                    <div className="flex items-center space-x-2">
                      <Badge
                        variant="secondary"
                        className="bg-pink-100 dark:bg-purple-900 text-pink-700 dark:text-purple-300"
                      >
                        {wordCount} words
                      </Badge>
                      <Button variant="ghost" size="sm" onClick={() => setShowNewEntry(false)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Textarea
                    value={newEntry}
                    onChange={(e) => setNewEntry(e.target.value)}
                    placeholder="Let your thoughts flow freely... What's on your heart today?"
                    className="min-h-[300px] glow-hover border-pink-200 dark:border-purple-700 focus:border-pink-400 dark:focus:border-purple-500 resize-none text-base leading-relaxed"
                  />

                  <div className="flex justify-between items-center">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Your thoughts are safe and private here</p>
                    <Button
                      onClick={handleSaveNew}
                      disabled={!newEntry.trim() || isSaving}
                      className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white rounded-full transition-all duration-300 transform hover:scale-105 glow-hover"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      {isSaving ? "Saving..." : "Save Entry"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Journal Entries */}
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 flex items-center space-x-2">
                <BookOpen className="h-6 w-6 text-pink-500" />
                <span>Your Journal Entries</span>
              </h2>

              {entries.length === 0 ? (
                <Card className="soft-glow bg-white/90 dark:bg-slate-800/90 backdrop-blur-md border-pink-200 dark:border-purple-800">
                  <CardContent className="p-12 text-center">
                    <Heart className="h-12 w-12 text-pink-400 mx-auto mb-4 opacity-50" />
                    <h3 className="text-xl font-semibold mb-2 text-gray-600 dark:text-gray-400">No entries yet</h3>
                    <p className="text-gray-500 dark:text-gray-500 mb-6">
                      Start your journaling journey by writing your first entry
                    </p>
                    <Button
                      onClick={() => setShowNewEntry(true)}
                      className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white rounded-full"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Write First Entry
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {entries.map((entry) => (
                    <Card
                      key={entry._id}
                      className="soft-glow bg-white/90 dark:bg-slate-800/90 backdrop-blur-md border-pink-200 dark:border-purple-800"
                    >
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Calendar className="h-4 w-4 text-gray-500" />
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                              {formatDate(entry.createdAt)}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(entry)}
                              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                            >
                              <Edit3 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(entry._id)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        {editingEntry === entry._id ? (
                          <div className="space-y-4">
                            <Textarea
                              value={editContent}
                              onChange={(e) => setEditContent(e.target.value)}
                              className="min-h-[200px] glow-hover border-pink-200 dark:border-purple-700 focus:border-pink-400 dark:focus:border-purple-500 resize-none text-base leading-relaxed"
                            />
                            <div className="flex justify-end space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setEditingEntry(null)
                                  setEditContent("")
                                }}
                              >
                                <X className="h-4 w-4 mr-1" />
                                Cancel
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => handleSaveEdit(entry._id)}
                                className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white"
                              >
                                <Check className="h-4 w-4 mr-1" />
                                Save
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="prose dark:prose-invert max-w-none">
                            <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                              {entry.content}
                            </p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
