"use client"

import { useCredits } from "@/context/CreditContext"
import { Progress } from "./ui/progress"
import { Zap } from "lucide-react"

export function CreditUsageIndicator() {
    const { credits, isInitialised } = useCredits();

    if(!isInitialised){
        return null;
    }

    const percentage = (credits.remaining / credits.limit) * 100;

    return(
        <div className="flex items-center gap-2 text-xs font-medium text-gray-600 dark:text-gray-300">
            <Zap className="h-4 w-4 text-yellow-500" />
            <span>{credits.remaining.toLocaleString()}</span>
            <Progress value={percentage} className="w-20 h-1.5" />
        </div>
    );
}