import React from 'react';
import { NavLink } from 'react-router-dom';
import { Briefcase, CalendarDays, Compass, Home, MessageSquareText, PanelLeftClose, Users, Settings } from 'lucide-react';
import Navbar from '../Navbar';
import { useSelector } from 'react-redux';
import { RootState } from '../../store/store';

const quickLinks = [
  { to: '/home', label: 'Home Feed', icon: Home },
  { to: '/marketplace', label: 'Marketplace', icon: Compass },
  { to: '/swaps', label: 'My Swaps', icon: Briefcase },
  { to: '/messages', label: 'Messages', icon: MessageSquareText },
  { to: '/network', label: 'Network', icon: Users },
  { to: '/calendar', label: 'Calendar', icon: CalendarDays },
];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const user = useSelector((state: RootState) => state.auth.user);
  const initials = user?.name?.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase() || 'U';

  return (
    <div className="min-h-screen bg-[#f3f6f8] text-neutral-900">
      <Navbar />
      <div className="mx-auto flex max-w-[1280px] gap-5 px-4 pt-20 pb-8 sm:px-6 lg:px-8">
        <aside className="hidden w-64 shrink-0 xl:block">
          <div className="sticky top-20 overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-sm">
            <div className="h-16 bg-primary-950" />
            <div className="px-4 pb-4">
              <div className="-mt-6 flex h-12 w-12 items-center justify-center rounded-full border-4 border-white bg-primary-100 text-sm font-semibold text-primary-700">
                {initials}
              </div>
              <div className="mt-2 border-b border-neutral-200 pb-4">
                <p className="truncate font-semibold text-neutral-900">{user?.name || 'Your profile'}</p>
                <p className="truncate text-xs text-neutral-500">{user?.email || 'Skill exchange'}</p>
              </div>
            </div>
            <nav className="mt-3 space-y-0.5">
              {quickLinks.map(({ to, label, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  className={({ isActive }) =>
                    `flex items-center gap-3 border-l-2 px-3 py-2.5 text-sm font-medium transition ${isActive ? 'border-primary-600 bg-primary-50 text-primary-700' : 'border-transparent text-neutral-700 hover:bg-neutral-50'}`
                  }
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </NavLink>
              ))}
            </nav>
            <div className="mt-3 border-t border-neutral-200 pt-3">
              <NavLink to="/profile" className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-neutral-600 hover:text-primary-700">
                <Settings className="h-4 w-4" />
                Account settings
              </NavLink>
            </div>
          </div>
        </aside>

        <main className="min-w-0 flex-1">{children}</main>

      </div>
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-neutral-200 bg-white/90 px-3 py-2 backdrop-blur md:hidden">
        <div className="mx-auto flex max-w-md items-center justify-between">
          {[{ to: '/home', label: 'Home', icon: Home }, { to: '/marketplace', label: 'Market', icon: Compass }, { to: '/swaps', label: 'Swaps', icon: Briefcase }, { to: '/messages', label: 'Messages', icon: MessageSquareText }, { to: '/profile', label: 'Profile', icon: PanelLeftClose }].map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} className={({ isActive }) => `flex flex-col items-center gap-1 text-[10px] ${isActive ? 'text-primary-600' : 'text-neutral-500'}`}>
              <Icon className="h-4 w-4" />
              {label}
            </NavLink>
          ))}
        </div>
      </div>
    </div>
  );
}
