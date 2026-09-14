import React from 'react';

interface BadgeProps {
  children?: React.ReactNode;
  variant?: 'default' | 'verified' | 'topMentor' | 'new' | 'level' | 'status' | 'count';
  tone?: 'default' | 'primary' | 'success' | 'warning' | 'neutral';
  className?: string;
}

const tones: Record<NonNullable<BadgeProps['tone']>, string> = {
  default: 'bg-primary-50 text-primary-700 border-primary-200',
  primary: 'bg-primary-50 text-primary-700 border-primary-200',
  success: 'bg-success-50 text-success-700 border-success-200',
  warning: 'bg-warning-50 text-warning-700 border-warning-200',
  neutral: 'bg-neutral-100 text-neutral-700 border-neutral-200',
};

export default function Badge({ children, variant = 'default', tone = 'default', className = '' }: BadgeProps) {
  const variantLabel = variant === 'default' ? '' : `${variant}`;

  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide ${tones[tone]} ${className}`}>
      {children ?? variantLabel}
    </span>
  );
}
