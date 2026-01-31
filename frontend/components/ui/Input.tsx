'use client';

import { forwardRef, InputHTMLAttributes, TextareaHTMLAttributes, useState } from 'react';
import { Eye, EyeOff, AlertCircle, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  success?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  variant?: 'default' | 'filled';
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      type = 'text',
      label,
      error,
      success,
      hint,
      leftIcon,
      rightIcon,
      variant = 'default',
      disabled,
      ...props
    },
    ref
  ) => {
    const [showPassword, setShowPassword] = useState(false);
    const isPassword = type === 'password';
    const inputType = isPassword && showPassword ? 'text' : type;

    const baseStyles = `
      w-full rounded-lg text-sm
      transition-all duration-200
      placeholder:text-secondary-400 dark:placeholder:text-secondary-500
      focus:outline-none focus:ring-2 focus:ring-offset-0
      disabled:cursor-not-allowed disabled:opacity-50
    `;

    const variantStyles = {
      default: `
        border border-secondary-300 dark:border-secondary-700
        bg-white dark:bg-secondary-900
        text-secondary-900 dark:text-secondary-100
        hover:border-secondary-400 dark:hover:border-secondary-600
        focus:border-primary-500 focus:ring-primary-500/20
      `,
      filled: `
        border-0
        bg-secondary-100 dark:bg-secondary-800
        text-secondary-900 dark:text-secondary-100
        hover:bg-secondary-200 dark:hover:bg-secondary-700
        focus:bg-white dark:focus:bg-secondary-900
        focus:ring-primary-500/20
        focus:shadow-soft
      `,
    };

    const stateStyles = error
      ? 'border-danger-500 focus:border-danger-500 focus:ring-danger-500/20'
      : success
      ? 'border-success-500 focus:border-success-500 focus:ring-success-500/20'
      : '';

    return (
      <div className="w-full">
        {label && (
          <label className="mb-1.5 block text-sm font-medium text-secondary-700 dark:text-secondary-300">
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-secondary-400">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            type={inputType}
            disabled={disabled}
            className={cn(
              baseStyles,
              variantStyles[variant],
              stateStyles,
              'h-10 px-3',
              leftIcon && 'pl-10',
              (rightIcon || isPassword || error || success) && 'pr-10',
              className
            )}
            {...props}
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
            {error && <AlertCircle className="h-4 w-4 text-danger-500" />}
            {success && <Check className="h-4 w-4 text-success-500" />}
            {isPassword && (
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-secondary-400 hover:text-secondary-600 dark:hover:text-secondary-300"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            )}
            {!isPassword && !error && !success && rightIcon}
          </div>
        </div>
        {(error || success || hint) && (
          <p
            className={cn(
              'mt-1.5 text-xs',
              error && 'text-danger-500',
              success && 'text-success-500',
              !error && !success && 'text-secondary-500'
            )}
          >
            {error || success || hint}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

// Textarea Component
interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  success?: string;
  hint?: string;
  variant?: 'default' | 'filled';
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, success, hint, variant = 'default', disabled, ...props }, ref) => {
    const baseStyles = `
      w-full rounded-lg text-sm
      transition-all duration-200
      placeholder:text-secondary-400 dark:placeholder:text-secondary-500
      focus:outline-none focus:ring-2 focus:ring-offset-0
      disabled:cursor-not-allowed disabled:opacity-50
      resize-none
    `;

    const variantStyles = {
      default: `
        border border-secondary-300 dark:border-secondary-700
        bg-white dark:bg-secondary-900
        text-secondary-900 dark:text-secondary-100
        hover:border-secondary-400 dark:hover:border-secondary-600
        focus:border-primary-500 focus:ring-primary-500/20
      `,
      filled: `
        border-0
        bg-secondary-100 dark:bg-secondary-800
        text-secondary-900 dark:text-secondary-100
        hover:bg-secondary-200 dark:hover:bg-secondary-700
        focus:bg-white dark:focus:bg-secondary-900
        focus:ring-primary-500/20
        focus:shadow-soft
      `,
    };

    const stateStyles = error
      ? 'border-danger-500 focus:border-danger-500 focus:ring-danger-500/20'
      : success
      ? 'border-success-500 focus:border-success-500 focus:ring-success-500/20'
      : '';

    return (
      <div className="w-full">
        {label && (
          <label className="mb-1.5 block text-sm font-medium text-secondary-700 dark:text-secondary-300">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          disabled={disabled}
          className={cn(baseStyles, variantStyles[variant], stateStyles, 'min-h-[100px] p-3', className)}
          {...props}
        />
        {(error || success || hint) && (
          <p
            className={cn(
              'mt-1.5 text-xs',
              error && 'text-danger-500',
              success && 'text-success-500',
              !error && !success && 'text-secondary-500'
            )}
          >
            {error || success || hint}
          </p>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';

export default Input;
