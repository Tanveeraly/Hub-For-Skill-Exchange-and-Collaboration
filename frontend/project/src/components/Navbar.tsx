import { useState } from 'react';
import { Bell, LogOut, Menu, MessageSquareText, UserCircle2, X } from 'lucide-react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../store/store';
import { logout as logoutAction } from '../store/slices/authSlice';
import SearchInput from './ui/SearchInput';

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);
  const currentUser = useSelector((state: RootState) => state.auth.user);

  const handleLogout = () => {
    dispatch(logoutAction());
    setMobileOpen(false);
    navigate('/login');
  };

  const navItems = [
    { to: '/home', label: 'Home' },
    { to: '/marketplace', label: 'Marketplace' },
    { to: '/swaps', label: 'Swaps' },
    { to: '/messages', label: 'Messages' },
    { to: '/network', label: 'Network' },
  ];

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-neutral-200 bg-white/90 backdrop-blur-sm">
      <div className="mx-auto flex max-w-[1280px] items-center gap-4 px-4 py-2.5 sm:px-6 lg:px-8">
        <Link to={isAuthenticated ? '/home' : '/'} className="flex items-center gap-3">
          <img src="/hsec-logo.png" alt="HSEC" className="h-9 w-auto object-contain" />
        </Link>

        {isAuthenticated && (
          <div className="hidden flex-1 md:block">
            <SearchInput className="max-w-xl" />
          </div>
        )}

        <nav className="hidden items-center gap-1 md:flex md:ml-auto">
          {navItems.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `border-b-2 px-3 py-3 text-sm font-medium transition ${isActive ? 'border-primary-600 text-primary-700' : 'border-transparent text-neutral-600 hover:border-neutral-300 hover:text-primary-600'}`
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>

        {isAuthenticated ? (
          <div className="ml-auto hidden items-center gap-2 md:flex">
            <button className="rounded-md p-2 text-neutral-600 hover:bg-neutral-100 hover:text-primary-600" aria-label="Messages">
              <MessageSquareText className="h-4 w-4" />
            </button>
            <button className="rounded-md p-2 text-neutral-600 hover:bg-neutral-100 hover:text-primary-600" aria-label="Notifications">
              <Bell className="h-4 w-4" />
            </button>
            <Link to="/profile" className="flex items-center gap-2 border-l border-neutral-200 pl-3 text-sm font-medium text-neutral-800">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 text-xs font-semibold text-primary-700">
                {currentUser?.name ? currentUser.name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase() : 'U'}
              </div>
              <span className="hidden lg:block">{currentUser?.name || 'Profile'}</span>
            </Link>
            <button onClick={handleLogout} className="flex items-center gap-2 rounded-lg border border-neutral-200 px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50" aria-label="Logout">
              <LogOut className="h-4 w-4" />
              <span className="hidden lg:block">Logout</span>
            </button>
          </div>
        ) : (
          <div className="ml-auto hidden items-center gap-2 md:flex">
            <Link to="/login" className="rounded-lg px-3 py-2 text-sm font-medium text-neutral-700 hover:text-primary-600">Login</Link>
            <Link to="/signup" className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700">Join now</Link>
          </div>
        )}

        <button
          type="button"
          onClick={() => setMobileOpen((value) => !value)}
          className="ml-auto inline-flex h-10 w-10 items-center justify-center rounded-lg border border-neutral-200 text-neutral-700 md:hidden"
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="border-t border-neutral-200 bg-white md:hidden">
          <div className="space-y-1 px-4 py-3">
            {navItems.map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) => `block rounded-lg px-3 py-2 text-sm font-medium ${isActive ? 'bg-primary-50 text-primary-700' : 'text-neutral-700 hover:bg-neutral-100'}`}
              >
                {label}
              </NavLink>
            ))}
            {isAuthenticated ? (
              <>
                <Link to="/profile" onClick={() => setMobileOpen(false)} className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-neutral-700">
                  <UserCircle2 className="h-4 w-4" />
                  Profile
                </Link>
                <button onClick={handleLogout} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium text-neutral-700">
                  <LogOut className="h-4 w-4" />
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" onClick={() => setMobileOpen(false)} className="block rounded-lg px-3 py-2 text-sm font-medium text-neutral-700">Login</Link>
                <Link to="/signup" onClick={() => setMobileOpen(false)} className="block rounded-lg bg-primary-600 px-3 py-2 text-sm font-medium text-white">Join now</Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
