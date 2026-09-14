import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
}

export default function Card({ className = '', hover = false, children, ...props }: CardProps) {
  return (
    <div
      className={`rounded-lg border border-neutral-200 bg-white ${hover ? 'transition-shadow hover:shadow-md' : 'shadow-sm'} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
