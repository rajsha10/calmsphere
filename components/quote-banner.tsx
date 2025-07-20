"use client"

import { useState, useEffect } from "react"
import { Sparkles } from "lucide-react"

const quotes = [
  "You are doing your best. That's enough. ✨",
  "Peace begins with a deep breath. 🌸",
  "Even slow progress is progress. 🌱",
  "Trust the journey. 🦋",
  "You are not alone. 💜",
  "Your feelings are valid. 🌙",
  "Healing is not linear. 🌊",
  "You are worthy of love and kindness. 🌺",
  "This too shall pass. ☁️",
  "You have survived 100% of your difficult days. 🌟",
  "Self-care is how you take your power back. — Lalah Delia 🌿",
  "It’s okay not to be okay. — Unknown 🤍",
  "Almost everything will work again if you unplug it — including you. — Anne Lamott 🔌",
  "When you say yes to others, make sure you’re not saying no to yourself. — Paulo Coelho 🙌",
  "Rest and self‑care are so important... You cannot serve from an empty vessel. — Eleanor Brownn 🌊",
  "The wound is where the light enters you. — Rumi ✨",
  "You are stronger than you realize. — Unknown 💪",
  "You are the most constant thing in your own life. Befriend yourself first. — Brianna Wiest 🤝",
  "Mental health problems don’t define who you are... You are not the rain. — Matt Haig 🌧️",
  "Self-care is never a selfish act — it is simply good stewardship of the only gift I have. — Parker Palmer 🌺",
  "You can’t stop the waves, but you can learn to surf. — Jon Kabat‑Zinn 🏄‍♀️"
]


export function QuoteBanner() {
  const [quote, setQuote] = useState("")

  const getRandomQuote = () => {
    const randomQuote = quotes[Math.floor(Math.random() * quotes.length)]
    setQuote(randomQuote)
  }

  useEffect(() => {
    getRandomQuote()
    
    const interval = setInterval(() => {
      getRandomQuote()
    }, 10 * 60 * 1000)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="bg-gradient-to-r from-pink-100 via-purple-50 to-blue-100 dark:from-purple-900/30 dark:via-indigo-900/30 dark:to-slate-900/30 py-3 text-center border-b border-pink-200/50 dark:border-purple-800/50">
      <div className="flex items-center justify-center space-x-2">
        <Sparkles className="h-4 w-4 text-pink-500 float-animation" />
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{quote}</p>
        <Sparkles className="h-4 w-4 text-purple-500 float-animation" />
      </div>
    </div>
  )
}