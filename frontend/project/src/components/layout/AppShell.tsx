import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Bell, Briefcase, CalendarDays, CheckCircle2, Compass, Home, MessageSquareText, Settings, ShieldCheck, Star, TrendingUp, Users } from 'lucide-react';
import Navbar from '../Navbar';
import { useSelector } from 'react-redux';
import { RootState } from '../../store/store';


export default function AppShell({ children }: { children: React.ReactNode }) {
  const user = useSelector((state: RootState) => state.auth.user);
  const { items: posts } = useSelector((state: RootState) => state.posts);
  const { connections } = useSelector((state: RootState) => state.connections);
  const { received, sent } = useSelector((state: RootState) => state.swaps);
  const location = useLocation();
  const initials = user?.name?.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase() || 'SL';
  const userSkills = user?.skills?.map((skill) => skill.skillName).filter(Boolean) || [];
  const displayedPosts = posts.slice(0, 3);
  const showSidebars = location.pathname === '/home';

  const allSwaps = [...received, ...sent];
  const activeSwaps = allSwaps.filter((swap: any) => swap.status === 'ACCEPTED');
  const pendingSwaps = allSwaps.filter((swap: any) => ['PENDING', 'RESCHEDULED'].includes(swap.status));

  const profileCompleteness = (() => {
    const fields = [
      user?.name,
      user?.email,
      user?.profile?.bio,
      user?.profile?.avatarUrl,
      user?.profile?.location,
      (user?.skills?.length ?? 0) > 0,
    ];

    const completed = fields.filter(Boolean).length;
    return Math.round((completed / fields.length) * 100);
  })();

  const quickLinks = [
    { to: '/home', label: 'Inbox & Active Deals', count: activeSwaps.length || posts.length || 0, icon: Home },
    { to: '/calendar', label: 'Scheduled Sessions', count: activeSwaps.length || 0, icon: CalendarDays },
    { to: '/swaps', label: 'Mutual Escrow Agreements', count: pendingSwaps.length || 0, icon: Briefcase },
    { to: '/network', label: 'Certifications & Badges', count: connections.length || 0, icon: ShieldCheck },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Navbar />
      <div className="mx-auto flex max-w-[1240px] gap-6 px-4 pb-8 pt-20 sm:px-6 lg:px-8">
        {showSidebars && (
          <aside className="hidden w-[240px] shrink-0 xl:block">
            <div className="sticky top-20 space-y-4">
              <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.05)]">
                <div className="flex items-center gap-3">
                  {user?.profile?.avatarUrl ? (
                    <img src={user.profile.avatarUrl} alt={user.name || 'Profile'} className="h-12 w-12 rounded-md object-cover" />
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded-md border border-slate-200 bg-slate-100 text-sm font-semibold text-slate-800">
                      {initials}
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-[15px] font-semibold text-slate-900">{user?.name || 'Profile'}</p>
                      <ShieldCheck className="h-4 w-4 text-[#0A66C2]" />
                    </div>
                    <p className="mt-0.5 truncate text-[11px] text-slate-500">
                      {userSkills.length > 0 ? userSkills.slice(0, 2).join(' · ') : 'Add skills to your profile'}
                    </p>
                  </div>
                </div>

                <div className="mt-4 rounded-md bg-slate-100 p-2">
                  <div className="flex items-center justify-between text-[11px] font-medium uppercase tracking-[0.02em] text-slate-600">
                    <span>Profile completeness</span>
                    <span>{profileCompleteness}%</span>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded bg-slate-200">
                    <div className="h-full rounded bg-[#0A66C2]" style={{ width: `${profileCompleteness}%` }} />
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-2 border-t border-slate-200 pt-3">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.02em] text-slate-500">Swaps</p>
                    <p className="mt-1 text-[15px] font-semibold text-slate-900">{activeSwaps.length}</p>
                  </div>
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.02em] text-slate-500">Rating</p>
                    <p className="mt-1 flex items-center gap-1 text-[15px] font-semibold text-slate-900">
                      <Star className="h-3.5 w-3.5 fill-[#fbbf24] text-[#fbbf24]" />
                      {user?.profile?.rating ?? '4.9'}
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.02em] text-slate-500">Hours</p>
                    <p className="mt-1 text-[15px] font-semibold text-slate-900">{user?.profile?.hours ?? '0'}</p>
                  </div>
                </div>
              </div>

              <nav className="rounded-lg border border-slate-200 bg-white p-2 shadow-[0_1px_2px_rgba(15,23,42,0.05)]">
                {quickLinks.map(({ to, label, count, icon: Icon }) => (
                  <NavLink
                    key={to}
                    to={to}
                    className={({ isActive }) =>
                      `flex items-center justify-between rounded-md px-3 py-2 text-[13px] font-medium transition ${isActive ? 'bg-slate-100 text-slate-900' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`
                    }
                  >
                    <span className="flex items-center gap-2">
                      <Icon className="h-4 w-4" />
                      {label}
                    </span>
                    <span className="rounded-full bg-slate-900 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                      {count}
                    </span>
                  </NavLink>
                ))}
              </nav>
            </div>
          </aside>
        )}

        <main className={`min-w-0 ${showSidebars ? 'flex-1' : 'w-full'}`}>{children}</main>

        {showSidebars && (
          <aside className="hidden w-[280px] shrink-0 xl:block">
            <div className="sticky top-20 space-y-4">
              <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.05)]">
                <div className="flex items-center justify-between">
                  <h3 className="text-[15px] font-semibold text-slate-900">Marketplace Liquidity</h3>
                  <TrendingUp className="h-4 w-4 text-[#0A66C2]" />
                </div>
                <div className="mt-3 space-y-3">
                  {displayedPosts.map((post: any) => (
                    <div key={post.id} className="rounded-md border border-slate-200 bg-slate-50 p-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-[13px] font-semibold text-slate-900">{post.title}</p>
                      </div>
                      <p className="mt-1 truncate text-[11px] text-slate-500">{post.user?.name || 'Community member'}</p>
                    </div>
                  ))}
                  {displayedPosts.length === 0 && <p className="text-[11px] text-slate-500">No public listings yet.</p>}
                </div>
              </div>

              <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.05)]">
                <div className="flex items-center justify-between">
                  <h3 className="text-[15px] font-semibold text-slate-900">Mutual Exchange Recommendations</h3>
                  <Users className="h-4 w-4 text-slate-500" />
                </div>
                <div className="mt-3 space-y-3">
                  {displayedPosts.map((post: any) => (
                    <div key={post.id} className="flex items-center justify-between gap-2 rounded-md border border-slate-200 bg-slate-50 p-2.5">
                      <div className="min-w-0">
                        <p className="truncate text-[13px] font-semibold text-slate-900">{post.user?.name || 'Community member'}</p>
                        <p className="mt-0.5 truncate text-[11px] text-slate-500">{post.title}</p>
                      </div>
                    </div>
                  ))}
                  {displayedPosts.length === 0 && <p className="text-[11px] text-slate-500">No recommendations yet.</p>}
                </div>
              </div>

              <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.05)]">
                <div className="flex items-center justify-between">
                  <h3 className="text-[15px] font-semibold text-slate-900">Escrow & Platform Security</h3>
                  <Bell className="h-4 w-4 text-[#0A66C2]" />
                </div>
                <div className="mt-3 rounded-md border border-[#FDE68A] bg-[#FFFBEB] p-3">
                  <div className="flex items-center gap-2 text-[#B45309]">
                    <CheckCircle2 className="h-4 w-4" />
                    <span className="text-[11px] font-semibold uppercase tracking-[0.02em]">Verified trust layer</span>
                  </div>
                  <p className="mt-2 text-[12px] text-slate-700">
                    Mutual verification, escrow locking, and anti-ghosting protocols protect every swap commitment.
                  </p>
                </div>
              </div>
            </div>
          </aside>
        )}
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white px-3 py-2 md:hidden">
        <div className="mx-auto flex max-w-md items-center justify-between">
          {[{ to: '/home', label: 'Home', icon: Home }, { to: '/marketplace', label: 'Market', icon: Compass }, { to: '/swaps', label: 'Swaps', icon: Briefcase }, { to: '/messages', label: 'Messages', icon: MessageSquareText }, { to: '/profile', label: 'Profile', icon: Settings }].map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} className={({ isActive }) => `flex flex-col items-center gap-1 text-[10px] ${isActive ? 'text-[#0A66C2]' : 'text-slate-500'}`}>
              <Icon className="h-4 w-4" />
              {label}
            </NavLink>
          ))}
        </div>
      </div>
    </div>
  );
}
