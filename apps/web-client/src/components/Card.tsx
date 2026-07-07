import type { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  variant?: 'elevated' | 'flat' | 'outlined';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  className?: string;
}

/**
 * Card component matching dashboard-blueprint.png design system.
 * Default variant is 'elevated' with shadow and refined styling.
 */
export default function Card({ 
  children, 
  variant = 'elevated', 
  padding = 'md',
  className = '' 
}: CardProps) {
  const baseClasses = 'bg-surface-elevated rounded-lg';
  
  const variantClasses = {
    elevated: 'shadow-sm border border-border/50',
    flat: 'border border-border',
    outlined: 'border-2 border-border',
  };

  const paddingClasses = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };

  return (
    <div className={`${baseClasses} ${variantClasses[variant]} ${paddingClasses[padding]} ${className}`}>
      {children}
    </div>
  );
}
