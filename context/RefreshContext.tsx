"use client"

import { createContext, useContext, useState, ReactNode } from "react"

interface RefreshContextType {
  needsRefresh: boolean
  triggerRefresh: () => void
  resetRefresh: () => void
}

const RefreshContext = createContext<RefreshContextType | undefined>(undefined)

export const RefreshProvider = ({ children }: { children: ReactNode }) => {
  const [needsRefresh, setNeedsRefresh] = useState(true)

  const triggerRefresh = () => setNeedsRefresh(true)
  const resetRefresh = () => setNeedsRefresh(false)

  const value = { needsRefresh, triggerRefresh, resetRefresh }

  return (
    <RefreshContext.Provider value={value}>
      {children}
    </RefreshContext.Provider>
  )
}

export const useRefresh = () => {
  const context = useContext(RefreshContext)
  if (context === undefined) {
    throw new Error("useRefresh must be used within a RefreshProvider")
  }
  return context
}