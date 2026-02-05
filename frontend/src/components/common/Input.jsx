import React, { forwardRef } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

const Input = forwardRef(({
    label,
    error,
    className,
    id,
    type = 'text',
    rightElement,
    ...props
}, ref) => {
    return (
        <div className="flex flex-col gap-1.5 w-full">
            {label && (
                <label htmlFor={id} className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    {label}
                </label>
            )}
            <div className="relative group/field">
                <input
                    ref={ref}
                    id={id}
                    type={type}
                    className={twMerge(
                        'w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all',
                        rightElement && 'pr-11',
                        error && 'border-red-500 focus:border-red-500 focus:ring-red-500/20',
                        className
                    )}
                    {...props}
                />
                {rightElement && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center text-slate-400 group-focus-within/field:text-blue-600 transition-colors">
                        {rightElement}
                    </div>
                )}
            </div>
            {error && (
                <span className="text-sm text-red-500">{error}</span>
            )}
        </div>
    );
});

Input.displayName = "Input";

export default Input;
