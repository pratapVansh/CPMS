'use client';

import { forwardRef, ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive' | 'success';
type ButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

interface ButtonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  fullWidth?: boolean;
  disabled?: boolean;
  children?: ReactNode;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
  onClick?: () => void;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: `
    bg-primary-600 text-white
    hover:bg-primary-700 
    active:bg-primary-800
    focus-visible:ring-primary-500
    dark:bg-primary-500 dark:hover:bg-primary-600
    shadow-sm hover:shadow-md
  `,
  secondary: `
    bg-secondary-100 text-secondary-900
    hover:bg-secondary-200
    active:bg-secondary-300
    focus-visible:ring-secondary-500
    dark:bg-secondary-800 dark:text-secondary-100 
    dark:hover:bg-secondary-700
  `,
  outline: `
    border-2 border-secondary-300 text-secondary-700
    hover:bg-secondary-50 hover:border-secondary-400
    active:bg-secondary-100
    focus-visible:ring-secondary-500
    dark:border-secondary-600 dark:text-secondary-300
    dark:hover:bg-secondary-800 dark:hover:border-secondary-500
  `,
  ghost: `
    text-secondary-600
    hover:bg-secondary-100 hover:text-secondary-900
    active:bg-secondary-200
    focus-visible:ring-secondary-500
    dark:text-secondary-400
    dark:hover:bg-secondary-800 dark:hover:text-secondary-100
  `,
  destructive: `
    bg-danger-600 text-white
    hover:bg-danger-700
    active:bg-danger-800
    focus-visible:ring-danger-500
    dark:bg-danger-600 dark:hover:bg-danger-700
    shadow-sm hover:shadow-md
  `,
  success: `
    bg-success-600 text-white
    hover:bg-success-700
    active:bg-success-800
    focus-visible:ring-success-500
    dark:bg-success-600 dark:hover:bg-success-700
    shadow-sm hover:shadow-md
  `,
};

const sizeStyles: Record<ButtonSize, string> = {
  xs: 'h-7 px-2.5 text-xs gap-1 rounded-md',
  sm: 'h-8 px-3 text-sm gap-1.5 rounded-md',
  md: 'h-10 px-4 text-sm gap-2 rounded-lg',
  lg: 'h-11 px-5 text-base gap-2 rounded-lg',
  xl: 'h-12 px-6 text-base gap-2.5 rounded-xl',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      fullWidth = false,
      disabled,
      children,
      type = 'button',
      onClick,
    },
    ref
  ) => {
    const isDisabled = disabled || isLoading;

    return (
      <motion.button
        ref={ref}
        type={type}
        onClick={onClick}
        whileHover={!isDisabled ? { scale: 1.02 } : undefined}
        whileTap={!isDisabled ? { scale: 0.98 } : undefined}
        transition={{ duration: 0.15 }}
        disabled={isDisabled}
        className={cn(
          // Base styles
          'inline-flex items-center justify-center font-medium',
          'transition-all duration-200',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
          'disabled:pointer-events-none disabled:opacity-50',
          // Variant and size
          variantStyles[variant],
          sizeStyles[size],
          // Full width
          fullWidth && 'w-full',
          className
        )}
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          leftIcon
        )}
        {children}
        {!isLoading && rightIcon}
      </motion.button>
    );
  }
);

Button.displayName = 'Button';

export default Button;
