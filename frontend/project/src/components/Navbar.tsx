import { useEffect, useRef, useState } from 'react';
import {
  Bell,
  BarChart3,
  CalendarDays,
  ChevronDown,
  GraduationCap,
  LogOut,
  Menu,
  Search,
  ShieldCheck,
  UserCircle2,
  X,
} from 'lucide-react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../store/store';
import { logout as logoutAction } from '../store/slices/authSlice';
import Logo from './ui/Logo';

// Primary destinations: the four things a member does most often.
const primaryNav = [
  { to: '/home', label: 'Home' },
  { to: '/marketplace', label: 'Find skills' },
  { to: '/swaps', label: 'My swaps' },
  { to: '/messages', label: 'Messages' },
  { to: '/network', label: 'Network' },
];

// Everything else lives under the account menu so the top bar stays calm.
const accountNav = [
  { to: '/profile', label: 'My profile', icon: UserCircle2 },
  { to: '/calendar', label: 'Calendar', icon: CalendarDays },
  { to: '/career', label: 'Career & certificates', icon: GraduationCap },
  { to: '/analytics', label: 'My progress', icon: BarChart3 },
];

function initialsOf(name?: string) {
  return name ? name.split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase() : 'U';
}

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [query, setQuery] = useState('');
  const menuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);
  const currentUser = useSelector((state: RootState) => state.auth.user);
  const unread = useSelector((state: RootState) => state.notifications.items.filter((n) => !n.isRead).length);
  const unreadMessages = useSelector((state: RootState) => state.chat.unreadMessages);
  const isAdmin = currentUser?.role === 'ADMIN';

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const handleLogout = () => {
    dispatch(logoutAction());
    setMobileOpen(false);
    setMenuOpen(false);
    navigate('/login');
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    navigate(q ? `/marketplace?q=${encodeURIComponent(q)}` : '/marketplace');
    setMobileOpen(false);
  };

  const avatar = currentUser?.profile?.avatarUrl ? (
    <img src={currentUser.profile.avatarUrl} alt="" className="h-8 w-8 rounded-full object-cover" />
  ) : (
    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 text-xs font-semibold text-primary-700">
      {initialsOf(currentUser?.name)}
    </span>
  );

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-neutral-200 bg-white">
      <div className="mx-auto flex h-14 max-w-[1240px] items-center gap-4 px-4 sm:px-6 lg:px-8">
        <Link to={isAuthenticated ? '/home' : '/'} className="flex shrink-0 items-center">
          <Logo />
        </Link>

        {isAuthenticated && (
          <form onSubmit={handleSearch} role="search" className="hidden w-full max-w-xs lg:block">
            <label className="flex items-center gap-2 rounded-md border border-neutral-200 bg-neutral-50 px-3 py-1.5 text-sm focus-within:border-primary-500 focus-within:bg-white">
              <Search className="h-4 w-4 text-neutral-500" aria-hidden />
              <span className="sr-only">Search skills</span>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search skills or people"
                className="w-full bg-transparent text-neutral-900 placeholder:text-neutral-400 focus:outline-none"
              />
            </label>
          </form>
        )}

        {isAuthenticated ? (
          <>
            <nav aria-label="Main" className="ml-auto hidden h-full items-stretch md:flex">
              {primaryNav.map(({ to, label }) => (
                <NavLink
                  key={to}
                  to={to}
                  className={({ isActive }) =>
                    `flex items-center border-b-2 px-3 text-sm font-medium transition-colors ${
                      isActive ? 'border-primary-600 text-neutral-900' : 'border-transparent text-neutral-600 hover:text-neutral-900'
                    }`
                  }
                >
                  {label}
                  {to === '/messages' && unreadMessages > 0 && (
                    <span className="ml-1.5 min-w-[18px] rounded-full bg-error-600 px-1.5 text-center text-[11px] font-semibold leading-[18px] text-white" aria-label={`${unreadMessages} unread`}>
                      {unreadMessages > 9 ? '9+' : unreadMessages}
                    </span>
                  )}
                </NavLink>
              ))}
            </nav>

            <div className="hidden items-center gap-1 md:flex">
              <Link
                to="/notifications"
                className="relative rounded-md p-2 text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
                aria-label={unread ? `Notifications, ${unread} unread` : 'Notifications'}
              >
                <Bell className="h-5 w-5" />
                {unread > 0 && (
                  <span className="absolute right-1 top-1 min-w-[16px] rounded-full bg-error-600 px-1 text-center text-[10px] font-semibold leading-4 text-white">
                    {unread > 9 ? '9+' : unread}
                  </span>
                )}
              </Link>

              <div className="relative" ref={menuRef}>
                <button
                  type="button"
                  onClick={() => setMenuOpen((v) => !v)}
                  className="flex items-center gap-1 rounded-md p-1 hover:bg-neutral-100"
                  aria-haspopup="menu"
                  aria-expanded={menuOpen}
                >
                  {avatar}
                  <ChevronDown className="h-4 w-4 text-neutral-500" />
                </button>

                {menuOpen && (
                  <div role="menu" className="absolute right-0 mt-2 w-60 rounded-lg border border-neutral-200 bg-white py-1 shadow-lg">
                    <div className="border-b border-neutral-100 px-4 py-3">
                      <p className="truncate text-sm font-semibold text-neutral-900">{currentUser?.name || 'Your account'}</p>
                      <p className="truncate text-xs text-neutral-500">{currentUser?.email}</p>
                    </div>
                    {accountNav.map(({ to, label, icon: Icon }) => (
                      <Link
                        key={to}
                        to={to}
                        role="menuitem"
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50"
                      >
                        <Icon className="h-4 w-4 text-neutral-500" />
                        {label}
                      </Link>
                    ))}
                    {isAdmin && (
                      <Link
                        to="/admin"
                        role="menuitem"
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50"
                      >
                        <ShieldCheck className="h-4 w-4 text-neutral-500" />
                        Admin panel
                      </Link>
                    )}
                    <button
                      type="button"
                      role="menuitem"
                      onClick={handleLogout}
                      className="mt-1 flex w-full items-center gap-3 border-t border-neutral-100 px-4 py-2 text-left text-sm text-neutral-700 hover:bg-neutral-50"
                    >
                      <LogOut className="h-4 w-4 text-neutral-500" />
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="ml-auto hidden items-center gap-2 md:flex">
            <a href="/#how-it-works" className="px-3 py-2 text-sm font-medium text-neutral-700 hover:text-neutral-900">How it works</a>
            <a href="/#faq" className="px-3 py-2 text-sm font-medium text-neutral-700 hover:text-neutral-900">FAQ</a>
            <Link to="/marketplace" className="px-3 py-2 text-sm font-medium text-neutral-700 hover:text-neutral-900">Browse skills</Link>
            <Link to="/login" className="px-3 py-2 text-sm font-medium text-neutral-700 hover:text-neutral-900">Sign in</Link>
            <Link to="/signup" className="rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700">Create account</Link>
          </div>
        )}

        {isAuthenticated && (
          <Link
            to="/notifications"
            className="relative ml-auto inline-flex h-10 w-10 items-center justify-center rounded-md text-neutral-700 hover:bg-neutral-100 md:hidden"
            aria-label={unread ? `Notifications, ${unread} unread` : 'Notifications'}
          >
            <Bell className="h-5 w-5" />
            {unread > 0 && (
              <span className="absolute right-1 top-1 min-w-[16px] rounded-full bg-error-600 px-1 text-center text-[10px] font-semibold leading-4 text-white">
                {unread > 9 ? '9+' : unread}
              </span>
            )}
          </Link>
        )}

        <button
          type="button"
          onClick={() => setMobileOpen((value) => !value)}
          className={`${isAuthenticated ? '' : 'ml-auto '}inline-flex h-10 w-10 items-center justify-center rounded-md text-neutral-700 hover:bg-neutral-100 md:hidden`}
          aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="max-h-[calc(100vh-3.5rem)] overflow-y-auto border-t border-neutral-200 bg-white md:hidden">
          <div className="space-y-1 px-4 py-3">
            {isAuthenticated ? (
              <>
                <form onSubmit={handleSearch} role="search" className="mb-2">
                  <label className="flex items-center gap-2 rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm">
                    <Search className="h-4 w-4 text-neutral-500" aria-hidden />
                    <span className="sr-only">Search skills</span>
                    <input
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Search skills or people"
                      className="w-full bg-transparent focus:outline-none"
                    />
                  </label>
                </form>
                {[...primaryNav.map((item) => item.to === '/messages' && unreadMessages ? { ...item, label: `Messages (${unreadMessages})` } : item), { to: '/notifications', label: unread ? `Notifications (${unread})` : 'Notifications' }].map(({ to, label }) => (
                  <NavLink
                    key={to}
                    to={to}
                    onClick={() => setMobileOpen(false)}
                    className={({ isActive }) => `block rounded-md px-3 py-2 text-sm font-medium ${isActive ? 'bg-primary-50 text-primary-700' : 'text-neutral-700 hover:bg-neutral-100'}`}
                  >
                    {label}
                  </NavLink>
                ))}
                <div className="my-2 border-t border-neutral-100" />
                {accountNav.map(({ to, label }) => (
                  <NavLink
                    key={to}
                    to={to}
                    onClick={() => setMobileOpen(false)}
                    className={({ isActive }) => `block rounded-md px-3 py-2 text-sm ${isActive ? 'bg-primary-50 text-primary-700' : 'text-neutral-700 hover:bg-neutral-100'}`}
                  >
                    {label}
                  </NavLink>
                ))}
                {isAdmin && (
                  <Link to="/admin" onClick={() => setMobileOpen(false)} className="block rounded-md px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-100">
                    Admin panel
                  </Link>
                )}
                <button onClick={handleLogout} className="block w-full rounded-md px-3 py-2 text-left text-sm text-neutral-700 hover:bg-neutral-100">
                  Sign out
                </button>
              </>
            ) : (
              <>
                <a href="/#how-it-works" onClick={() => setMobileOpen(false)} className="block rounded-md px-3 py-2 text-sm font-medium text-neutral-700">How it works</a>
                <a href="/#faq" onClick={() => setMobileOpen(false)} className="block rounded-md px-3 py-2 text-sm font-medium text-neutral-700">FAQ</a>
                <Link to="/marketplace" onClick={() => setMobileOpen(false)} className="block rounded-md px-3 py-2 text-sm font-medium text-neutral-700">Browse skills</Link>
                <Link to="/login" onClick={() => setMobileOpen(false)} className="block rounded-md px-3 py-2 text-sm font-medium text-neutral-700">Sign in</Link>
                <Link to="/signup" onClick={() => setMobileOpen(false)} className="block rounded-md bg-primary-600 px-3 py-2 text-center text-sm font-medium text-white">Create account</Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
