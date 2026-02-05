"use client"

import { useState } from "react"
import { Sparkles, X, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/auth-context"

export function PricingBanner() {
    const { user, login } = useAuth()
    const [isVisible, setIsVisible] = useState(true)

    // Don't show if hidden or if user is already premium
    if (!isVisible || user?.tier === 'premium') return null

    return (
        <div className="relative overflow-hidden rounded-lg bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-blue-500/10 p-6 border border-purple-500/20 mb-8">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                    <div className="p-3 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex-shrink-0">
                        <Sparkles className="h-6 w-6 text-white" />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent dark:from-purple-400 dark:to-pink-400">
                            Upgrade to Premium
                        </h3>
                        <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1 max-w-md">
                            Unlock unlimited AI analysis, OpenAI GPT-4 power, and advanced resume templates.
                        </p>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3">
                            <span className="text-xs flex items-center gap-1">
                                <Check className="h-3 w-3 text-green-500" /> OpenAI Models
                            </span>
                            <span className="text-xs flex items-center gap-1">
                                <Check className="h-3 w-3 text-green-500" /> Unlimited Checks
                            </span>
                            <span className="text-xs flex items-center gap-1">
                                <Check className="h-3 w-3 text-green-500" /> Priority Support
                            </span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-3 w-full sm:w-auto">
                    {/* If user is not logged in, show Sign In, if Free showing Upgrade */}
                    {!user ? (
                        <Button onClick={login} variant="outline" className="w-full sm:w-auto">
                            Sign In
                        </Button>
                    ) : (
                        <Button variant="default" className="w-full sm:w-auto bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-90 transition-opacity">
                            Upgrade Now
                        </Button>
                    )}
                </div>
            </div>
            <button
                onClick={() => setIsVisible(false)}
                className="absolute top-2 right-2 p-1 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
            >
                <X className="h-4 w-4" />
            </button>
        </div>
    )
}
