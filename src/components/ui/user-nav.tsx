'use client';

import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { LogOut, User, Zap, Star } from 'lucide-react';
import Link from 'next/link';

export function UserNav() {
    const { user, logout, upgradeToPremium, downgradeToFree } = useAuth();

    if (!user) {
        return (
            <div className="flex gap-4">
                <Link href="/login">
                    <Button variant="ghost">Sign In</Button>
                </Link>
                <Link href="/signup">
                    <Button>Get Started</Button>
                </Link>
            </div>
        );
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                    <Avatar className="h-10 w-10 border">
                        <AvatarImage src={`https://github.com/${user.username}.png`} alt={user.username} />
                        <AvatarFallback>{user.username.slice(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{user.username}</p>
                        <p className="text-xs leading-none text-muted-foreground">
                            {user.tier === 'premium' ? (
                                <span className="text-amber-500 font-semibold flex items-center gap-1">
                                    <Star className="h-3 w-3 fill-current" /> Premium Plan
                                </span>
                            ) : (
                                <span className="text-muted-foreground flex items-center gap-1">
                                    <User className="h-3 w-3" /> Free Plan
                                </span>
                            )}
                        </p>
                    </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => user.tier === 'free' ? upgradeToPremium() : downgradeToFree()}>
                    {user.tier === 'free' ? (
                        <>
                            <Zap className="mr-2 h-4 w-4 text-amber-500" />
                            <span>Upgrade to Premium</span>
                        </>
                    ) : (
                        <>
                            <User className="mr-2 h-4 w-4" />
                            <span>Switch to Free Tier</span>
                        </>
                    )}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout} className="text-red-500 focus:text-red-500">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
