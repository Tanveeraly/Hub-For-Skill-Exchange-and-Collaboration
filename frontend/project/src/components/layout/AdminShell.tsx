import React from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { ArrowLeft, BadgeCheck, BookOpenCheck, Briefcase, FileWarning, LayoutDashboard, Lock, MessageSquareWarning, ScrollText, Users } from 'lucide-react';
import { RootState } from '../../store/store';
import Logo from '../ui/Logo';

const navItems = [
  { to: '/admin', label: 'Overview', icon: LayoutDashboard },
  { to: '/admin/users', label: 'Users', icon: Users },
  { to: '/admin/disputes', label: 'Disputes', icon: FileWarning },
  { to: '/admin/complaints', label: 'Complaints', icon: MessageSquareWarning },
  { to: '/admin/portfolios', label: 'Portfolios', icon: Briefcase },
  { to: '/admin/certifications', label: 'Certifications', icon: BadgeCheck },
  { to: '/admin/courses', label: 'Courses', icon: BookOpenCheck },
  { to: '/admin/jobs', label: 'Automated jobs', icon: ScrollText },
  { to: '/admin/security', label: 'Security & audit log', icon: Lock },
];

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const { pathname } = useLocation();
  const user = useSelector((state: RootState) => state.auth.user);
  const current = navItems.find((item) => item.to === pathname) ?? navItems[0];
  const initials = user?.name?.split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase() || 'A';

  return (
    <div className="flex min-h-screen bg-neutral-50 text-neutral-900">
      <aside className="hidden w-60 shrink-0 flex-col border-r border-neutral-200 bg-white md:flex">
        <div className="flex h-14 items-center gap-2 border-b border-neutral-200 px-4">
          <Logo />
          <span className="rounded bg-neutral-100 px-1.5 py-0.5 text-xs font-medium text-neutral-600">Admin</span>
        </div>
        <nav aria-label="Admin" className="flex-1 space-y-0.5 p-2">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium ${
                  isActive ? 'bg-primary-50 text-primary-700' : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900'
                }`
              }
            >
              <Icon className="h-4 w-4" />
              {label}
            </NavLink>
          ))}
        </nav>
        <Link to="/home" className="flex items-center gap-2 border-t border-neutral-200 px-4 py-3 text-sm text-neutral-600 hover:text-neutral-900">
          <ArrowLeft className="h-4 w-4" />
          Back to site
        </Link>
      </aside>

      <div className="min-w-0 flex-1">
        <header className="flex h-14 items-center justify-between border-b border-neutral-200 bg-white px-4 md:px-6">
          <h1 className="text-lg font-semibold text-neutral-900">{current.label}</h1>
          <div className="flex items-center gap-2 text-sm text-neutral-700">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 text-xs font-semibold text-primary-700">{initials}</span>
            <span className="hidden sm:inline">{user?.name || 'Administrator'}</span>
          </div>
        </header>

        {/* Mobile: horizontal section switcher */}
        <nav aria-label="Admin sections" className="flex gap-1 overflow-x-auto border-b border-neutral-200 bg-white px-2 py-2 md:hidden">
          <Link to="/home" className="whitespace-nowrap rounded-md px-3 py-1.5 text-sm text-neutral-600">← Site</Link>
          {navItems.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              end
              className={({ isActive }) => `whitespace-nowrap rounded-md px-3 py-1.5 text-sm ${isActive ? 'bg-primary-50 font-medium text-primary-700' : 'text-neutral-600'}`}
            >
              {label}
            </NavLink>
          ))}
        </nav>

        <main className="p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
