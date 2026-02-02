/**
 * Input Component
 */

import * as React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps
    extends React.InputHTMLAttributes<HTMLInputElement> {
    error?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
    ({ className, type, error, ...props }, ref) => {
        return (
            <div className="relative">
                <input
                    type={type}
                    className={cn(
                        'flex h-11 w-full rounded-lg border bg-transparent px-4 py-2 text-base transition-colors',
                        'border-[hsl(var(--border))]',
                        'placeholder:text-[hsl(var(--muted-foreground))]',
                        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))] focus-visible:ring-offset-2',
                        'disabled:cursor-not-allowed disabled:opacity-50',
                        error && 'border-[hsl(var(--destructive))] focus-visible:ring-[hsl(var(--destructive))]',
                        className
                    )}
                    ref={ref}
                    {...props}
                />
                {error && (
                    <p className="mt-1 text-sm text-[hsl(var(--destructive))]">{error}</p>
                )}
            </div>
        );
    }
);
Input.displayName = 'Input';

export { Input };
