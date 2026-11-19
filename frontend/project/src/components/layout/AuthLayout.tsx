import React from 'react';
import { Link } from 'react-router-dom';
import Logo from '../ui/Logo';

interface AuthLayoutProps {
  title: string;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
  /** Short numbered list shown beside the form on wide screens. */
  asideTitle?: string;
  asideSteps?: string[];
  footer?: React.ReactNode;
}

export default function AuthLayout({ title, subtitle, children, asideTitle, asideSteps, footer }: AuthLayoutProps) {
  return (
    <div className="flex min-h-screen bg-white">
      <div className="flex w-full flex-col lg:w-1/2">
        <header className="flex h-14 items-center border-b border-neutral-200 px-4 sm:px-8">
          <Link to="/" className="flex items-center" aria-label="HubForSkills home">
            <Logo />
          </Link>
        </header>

        <main className="flex flex-1 items-start justify-center px-4 py-10 sm:px-8 sm:py-16">
          <div className="w-full max-w-sm">
            <h1 className="text-2xl font-semibold text-neutral-900">{title}</h1>
            {subtitle && <p className="mt-2 text-sm text-neutral-600">{subtitle}</p>}
            <div className="mt-8">{children}</div>
            {footer && <div className="mt-8 text-center text-sm text-neutral-600">{footer}</div>}
          </div>
        </main>
      </div>

      {asideSteps && (
        <aside className="hidden w-1/2 border-l border-neutral-200 bg-neutral-50 lg:flex lg:items-center lg:justify-center">
          <div className="max-w-sm px-8">
            {asideTitle && <h2 className="text-lg font-semibold text-neutral-900">{asideTitle}</h2>}
            <ol className="mt-6 space-y-5">
              {asideSteps.map((step, i) => (
                <li key={step} className="flex gap-4">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-neutral-300 bg-white text-sm font-semibold text-neutral-700">
                    {i + 1}
                  </span>
                  <p className="pt-0.5 text-neutral-700">{step}</p>
                </li>
              ))}
            </ol>
          </div>
        </aside>
      )}
    </div>
  );
}
