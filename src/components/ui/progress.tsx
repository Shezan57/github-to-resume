/**
 * Progress Component
 */

import * as React from 'react';
import { cn } from '@/lib/utils';

interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
    value?: number;
    max?: number;
    showLabel?: boolean;
}

const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
    ({ className, value = 0, max = 100, showLabel = false, ...props }, ref) => {
        const percentage = Math.min(100, Math.max(0, (value / max) * 100));

        return (
            <div className="w-full">
                <div
                    ref={ref}
                    role="progressbar"
                    aria-valuemin={0}
                    aria-valuemax={max}
                    aria-valuenow={value}
                    className={cn(
                        'relative h-3 w-full overflow-hidden rounded-full bg-[hsl(var(--secondary))]',
                        className
                    )}
                    {...props}
                >
                    <div
                        className="h-full rounded-full gradient-bg transition-all duration-500 ease-out"
                        style={{ width: `${percentage}%` }}
                    />
                </div>
                {showLabel && (
                    <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
                        {Math.round(percentage)}%
                    </p>
                )}
            </div>
        );
    }
);
Progress.displayName = 'Progress';

export { Progress };
