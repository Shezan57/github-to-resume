"use client"

import { useRouter } from "next/navigation"
import { Sparkles, CheckCircle2, Lock } from "lucide-react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useUsage } from "@/contexts/usage-context"

export function RegistrationWall() {
    const { showRegistrationWall, setShowRegistrationWall, registrationWallReason } = useUsage()
    const router = useRouter()

    const handleLogin = () => {
        setShowRegistrationWall(false)
        router.push("/login?redirect=/analyze") // Redirect back to analyze or dashboard
    }

    const handleSignup = () => {
        setShowRegistrationWall(false)
        router.push("/signup?redirect=/analyze")
    }

    return (
        <Dialog open={showRegistrationWall} onOpenChange={setShowRegistrationWall}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 mb-4">
                        <Lock className="h-6 w-6 text-primary" />
                    </div>
                    <DialogTitle className="text-center text-xl">
                        {registrationWallReason === 'ats' ? "Resume Analysis Limit Reached" : "Resume Generation Limit Reached"}
                    </DialogTitle>
                    <DialogDescription className="text-center">
                        You've reached the limit for guest usage. Create a free account to continue using our AI power tools.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="flex items-center gap-3 rounded-lg border p-4 bg-muted/50">
                        <Sparkles className="h-5 w-5 text-amber-500" />
                        <div className="flex-1">
                            <h4 className="font-semibold text-sm">Free Account Benefits</h4>
                            <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                                <li className="flex items-center gap-2">
                                    <CheckCircle2 className="h-3 w-3 text-green-500" />
                                    Unlimited Groq AI Analysis
                                </li>
                                <li className="flex items-center gap-2">
                                    <CheckCircle2 className="h-3 w-3 text-green-500" />
                                    Save multiple resume versions
                                </li>
                                <li className="flex items-center gap-2">
                                    <CheckCircle2 className="h-3 w-3 text-green-500" />
                                    Access to standard templates
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>

                <DialogFooter className="flex-col gap-2 sm:gap-0">
                    <Button onClick={handleSignup} className="w-full font-semibold" size="lg">
                        Create Free Account
                    </Button>
                    <div className="mt-2 text-center text-sm text-muted-foreground">
                        Already have an account?{" "}
                        <button
                            onClick={handleLogin}
                            className="font-medium text-primary hover:underline underline-offset-4"
                        >
                            Sign in
                        </button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
