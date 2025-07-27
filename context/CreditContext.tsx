"use client";

import React, { createContext, useContext, useState, ReactNode, useCallback } from "react";

interface CreditContextType {
  credits: {
    remaining: number;
    limit: number;
  };
  setCredits: (credits: { remaining: number; limit: number }) => void;
  isInitialised: boolean;
  setInitialised: (status: boolean) => void;
}

const CreditContext = createContext<CreditContextType | undefined>(undefined);

export const CreditProvider = ({ children }: { children: ReactNode }) => {
  const [credits, setCreditsState] = useState({ remaining: 20000, limit: 20000 });
  const [isInitialised, setInitialised] = useState(false);

  const setCredits = useCallback((newCredits: { remaining: number; limit: number }) => {
    setCreditsState(newCredits);
  }, []);

  return (
    <CreditContext.Provider value={{ credits, setCredits, isInitialised, setInitialised }}>
      {children}
    </CreditContext.Provider>
  );
};

export const useCredits = () => {
  const context = useContext(CreditContext);
  if (context === undefined) {
    throw new Error("useCredits must be used within a CreditProvider");
  }
  return context;
};