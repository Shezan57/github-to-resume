"use client"

import { Check, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export function PricingPlans() {
    return (
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Free Tier */}
            <Card className="relative">
                <CardHeader>
                    <CardTitle className="text-2xl">Free</CardTitle>
                    <CardDescription>Perfect for trying out the power of AI</CardDescription>
                    <div className="mt-4">
                        <span className="text-4xl font-bold">$0</span>
                        <span className="text-[hsl(var(--muted-foreground))]">/month</span>
                    </div>
                </CardHeader>
                <CardContent>
                    <ul className="space-y-3">
                        <li className="flex items-center gap-2">
                            <Check className="h-4 w-4 text-green-500" />
                            <span>Groq AI Model (Llama 3 70B)</span>
                        </li>
                        <li className="flex items-center gap-2">
                            <Check className="h-4 w-4 text-green-500" />
                            <span>5 ATS Checks per day</span>
                        </li>
                        <li className="flex items-center gap-2">
                            <Check className="h-4 w-4 text-green-500" />
                            <span>3 Resume Generations per day</span>
                        </li>
                        <li className="flex items-center gap-2">
                            <Check className="h-4 w-4 text-green-500" />
                            <span>Standard Resume Templates</span>
                        </li>
                        <li className="flex items-center gap-2 text-[hsl(var(--muted-foreground))]">
                            <X className="h-4 w-4" />
                            <span>OpenAI GPT-4 Support</span>
                        </li>
                    </ul>
                </CardContent>
                <CardFooter>
                    <Button variant="outline" className="w-full">Current Plan</Button>
                </CardFooter>
            </Card>

            {/* Premium Tier */}
            <Card className="relative border-purple-500 shadow-lg shadow-purple-500/10">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 border-0">Most Popular</Badge>
                </div>
                <CardHeader>
                    <CardTitle className="text-2xl">Premium</CardTitle>
                    <CardDescription>For serious job seekers</CardDescription>
                    <div className="mt-4">
                        <span className="text-4xl font-bold">$10</span>
                        <span className="text-[hsl(var(--muted-foreground))]">/month</span>
                    </div>
                </CardHeader>
                <CardContent>
                    <ul className="space-y-3">
                        <li className="flex items-center gap-2">
                            <Check className="h-4 w-4 text-green-500" />
                            <span><strong>OpenAI GPT-4</strong> Analysis</span>
                        </li>
                        <li className="flex items-center gap-2">
                            <Check className="h-4 w-4 text-green-500" />
                            <span><strong>Unlimited</strong> ATS Checks</span>
                        </li>
                        <li className="flex items-center gap-2">
                            <Check className="h-4 w-4 text-green-500" />
                            <span><strong>Unlimited</strong> Resume Generations</span>
                        </li>
                        <li className="flex items-center gap-2">
                            <Check className="h-4 w-4 text-green-500" />
                            <span>Premium Templates</span>
                        </li>
                        <li className="flex items-center gap-2">
                            <Check className="h-4 w-4 text-green-500" />
                            <span>Priority Support</span>
                        </li>
                    </ul>
                </CardContent>
                <CardFooter>
                    <Button className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-90">Upgrade Now</Button>
                </CardFooter>
            </Card>
        </div>
    )
}
