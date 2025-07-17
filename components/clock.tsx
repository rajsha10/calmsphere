"use client"

import { useState, useEffect } from "react"

export function Clock() {
  const [time, setTime] = useState<string>("")

  useEffect(() => {
    const updateTime = () => {
      const now = new Date()
      setTime(now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }))
    }

    updateTime()
    const interval = setInterval(updateTime, 1000)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="text-sm font-medium text-gray-600 dark:text-gray-300 bg-pink-50 dark:bg-purple-900/50 px-3 py-1 rounded-full">
      {time}
    </div>
  )
}
