"use client"

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './auth-context';
import { FREE_TIER_LIMITS, LOCAL_STORAGE_KEYS } from '@/lib/limits';

interface UsageContextType {
    atsChecksCount: number;
    generationsCount: number;
    remainingATSChecks: number;
    remainingGenerations: number;
    hasReachedATSLimit: boolean;
    hasReachedGenerationLimit: boolean;
    incrementATSCheck: () => void;
    incrementGeneration: () => void;
    showRegistrationWall: boolean;
    setShowRegistrationWall: (show: boolean) => void;
    registrationWallReason: 'ats' | 'generation' | null;
}

const UsageContext = createContext<UsageContextType | undefined>(undefined);

export function UsageProvider({ children }: { children: React.ReactNode }) {
    const { user, isLoading } = useAuth();
    const [atsChecksCount, setAtsChecksCount] = useState(0);
    const [generationsCount, setGenerationsCount] = useState(0);
    const [showRegistrationWall, setShowRegistrationWall] = useState(false);
    const [registrationWallReason, setRegistrationWallReason] = useState<'ats' | 'generation' | null>(null);

    // Load usage from local storage on mount
    useEffect(() => {
        const savedAtsUsage = localStorage.getItem(LOCAL_STORAGE_KEYS.ATS_USAGE);
        const savedGenUsage = localStorage.getItem(LOCAL_STORAGE_KEYS.GENERATION_USAGE);

        if (savedAtsUsage) setAtsChecksCount(parseInt(savedAtsUsage, 10));
        if (savedGenUsage) setGenerationsCount(parseInt(savedGenUsage, 10));
    }, []);

    // Sync to local storage
    useEffect(() => {
        localStorage.setItem(LOCAL_STORAGE_KEYS.ATS_USAGE, atsChecksCount.toString());
        localStorage.setItem(LOCAL_STORAGE_KEYS.GENERATION_USAGE, generationsCount.toString());
    }, [atsChecksCount, generationsCount]);

    const isPremium = user?.tier === 'premium';
    const hasReachedATSLimit = !isPremium && atsChecksCount >= FREE_TIER_LIMITS.ATS_CHECKS;
    const hasReachedGenerationLimit = !isPremium && generationsCount >= FREE_TIER_LIMITS.GENERATIONS;

    const incrementATSCheck = () => {
        if (!user && hasReachedATSLimit) {
            setRegistrationWallReason('ats');
            setShowRegistrationWall(true);
            return;
        }
        setAtsChecksCount(prev => prev + 1);
    };

    const incrementGeneration = () => {
        if (!user && hasReachedGenerationLimit) {
            setRegistrationWallReason('generation');
            setShowRegistrationWall(true);
            return;
        }
        setGenerationsCount(prev => prev + 1);
    };

    // If user logs in (even free tier), we might want to reset or increase limits?
    // For now, let's say logged in Free users have same limits but persisted in DB (simulated).
    // The requirement says "after checking ats 5th time... our app will ask for registration".
    // "If user use free tier continue with groq".
    // So logging in might NOT reset the limit immediately unless we want to incentivize login.
    // The prompt implies: 5 checks -> Ask Registration.
    // Let's assume after registration, they are "Free Tier" and can continue (maybe with higher/reset limits or just tracked differently).
    // For this implementation: Guests hit limit -> Register -> Becomes Free User -> Limit applies or resets?
    // "after checking ats 5th time ... ask for registration ... if user use free tier continue with groq"
    // This implies that becoming a Free User allows you to continue. So we should effectively ignore the "Guest" limit once logged in,
    // OR have a separate "Free User" limit.
    // Let's interpret "ask for registration" as a hard wall for guests. Once logged in, they are "Free" users.
    // Let's assume Free Users have UNLIMITED Groq usage (or a much higher limit), but Guests have 5.
    // The prompt says "if user use free tier continue with groq". It doesn't explicitly say Free Tier has a limit, only that Guests do ("ask for registration").

    const effectiveATSCount = user ? 0 : atsChecksCount; // Reset count effect if user is logged in (unlimited for free/premium for now)
    const effectiveGenCount = user ? 0 : generationsCount;

    // Actually, let's keep it simple:
    // Limit applies to UNAUTHENTICATED users.
    // Once authenticated (Free or Premium), they can proceed (Free uses Groq, Premium uses OpenAI).

    return (
        <UsageContext.Provider value={{
            atsChecksCount,
            generationsCount,
            remainingATSChecks: Math.max(0, FREE_TIER_LIMITS.ATS_CHECKS - atsChecksCount),
            remainingGenerations: Math.max(0, FREE_TIER_LIMITS.GENERATIONS - generationsCount),
            hasReachedATSLimit: !user && hasReachedATSLimit, // Only applies if not logged in
            hasReachedGenerationLimit: !user && hasReachedGenerationLimit,
            incrementATSCheck,
            incrementGeneration,
            showRegistrationWall,
            setShowRegistrationWall,
            registrationWallReason
        }}>
            {children}
        </UsageContext.Provider>
    );
}

export function useUsage() {
    const context = useContext(UsageContext);
    if (context === undefined) {
        throw new Error('useUsage must be used within a UsageProvider');
    }
    return context;
}
