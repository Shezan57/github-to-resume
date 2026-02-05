'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

type UserTier = 'free' | 'premium';

interface User {
    username: string;
    tier: UserTier;
}

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    login: (username: string) => void;
    logout: () => void;
    upgradeToPremium: () => void;
    downgradeToFree: () => void;
    isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Load user from local storage on mount
        const storedUser = localStorage.getItem('auth_user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
        setIsLoading(false);
    }, []);

    const login = (username: string) => {
        const newUser: User = { username, tier: 'free' };
        setUser(newUser);
        localStorage.setItem('auth_user', JSON.stringify(newUser));
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('auth_user');
    };

    const upgradeToPremium = () => {
        if (!user) return;
        const updatedUser: User = { ...user, tier: 'premium' };
        setUser(updatedUser);
        localStorage.setItem('auth_user', JSON.stringify(updatedUser));
    };

    const downgradeToFree = () => {
        if (!user) return;
        const updatedUser: User = { ...user, tier: 'free' };
        setUser(updatedUser);
        localStorage.setItem('auth_user', JSON.stringify(updatedUser));
    };

    return (
        <AuthContext.Provider value={{
            user,
            isAuthenticated: !!user,
            login,
            logout,
            upgradeToPremium,
            downgradeToFree,
            isLoading
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
