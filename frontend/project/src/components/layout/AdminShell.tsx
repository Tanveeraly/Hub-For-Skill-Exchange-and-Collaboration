import React from 'react';
import { NavLink } from 'react-router-dom';
import { BarChart3, BookOpenCheck, Briefcase, FileWarning, ShieldCheck, Users, ScrollText, BadgeCheck, LayoutDashboard, LogOut } from 'lucide-react';

const navItems = [
  { to: '/admin', label: 'Dashboard Overview', icon: LayoutDashboard },
  { to: '/admin/users', label: 'Users', icon: Users },
  { to: '/admin/disputes', label: 'Disputes', icon: FileWarning },
  { to: '/admin/audit-logs', label: 'Audit Logs', icon: ScrollText },
  { to: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/admin/portfolios', label: 'Portfolios', icon: Briefcase },
  { to: '/admin/certifications', label: 'Certifications', icon: BadgeCheck },
  { to: '/admin/complaints', label: 'Complaints', icon: ShieldCheck },
  { to: '/admin/courses', label: 'Courses', icon: BookOpenCheck },
  { to: '/admin/security', label: 'Security', icon: ShieldCheck },
];

export default function AdminShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-slate-100 text-slate-100">
      <aside className="w-72 bg-slate-900 text-slate-200">
        <div className="flex items-center gap-3 border-b border-slate-700 px-4 py-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-600 font-bold text-white">H</div>
          <div>
            <p className="font-semibold text-white">HubForSkills</p>
            <p className="text-xs text-slate-400">Admin Portal</p>
          </div>
        </div>

        <nav className="space-y-1 p-3">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${isActive ? 'bg-slate-700 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'}`
              }
            >
              <Icon className="h-4 w-4" />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="mt-auto border-t border-slate-700 p-4 text-sm text-slate-300">
          <button className="flex items-center gap-2 text-slate-300 hover:text-white">
            <LogOut className="h-4 w-4" />
            Return to User Site
          </button>
        </div>
      </aside>

      <div className="flex-1 bg-slate-100">
        <header className="border-b border-slate-200 bg-white px-6 py-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary-600">Administration</p>
              <h1 className="mt-1 text-2xl font-bold text-slate-900">Admin dashboard</h1>
            </div>
            <div className="flex items-center gap-3 rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 font-semibold text-primary-700">AM</span>
              Admin User
            </div>
          </div>
        </header>
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
