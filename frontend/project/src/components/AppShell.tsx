import type { ReactNode } from 'react';
import { Bookmark, CalendarRange, Compass, LayoutGrid, MessageSquareText, Sparkles, Star, TrendingUp, Users } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../store/store';

interface AppShellProps {
  children: ReactNode;
}

const quickLinks = [
  { label: 'Home Feed', to: '/home', icon: LayoutGrid },
  { label: 'Marketplace', to: '/marketplace', icon: Compass },
  { label: 'My Swaps', to: '/swaps', icon: CalendarRange },
  { label: 'Messages', to: '/messages', icon: MessageSquareText },
  { label: 'Bookmarks', to: '/notifications', icon: Bookmark },
];

const trendingSkills = [
  { name: 'React Architecture', score: '94% match', tone: 'Frontend' },
  { name: 'UI/UX Research', score: '91% match', tone: 'Product' },
  { name: 'Technical Writing', score: '89% match', tone: 'Learning' },
  { name: 'Data Storytelling', score: '87% match', tone: 'Analytics' },
];

const suggestedMatches = [
  { name: 'Maya Chen', role: 'Product Designer', badge: 'Verified', score: '96% fit', avatar: 'MC' },
  { name: 'David Okafor', role: 'Frontend Engineer', badge: 'Top Mentor', score: '92% fit', avatar: 'DO' },
  { name: 'Priya Nair', role: 'Research Analyst', badge: 'New', score: '90% fit', avatar: 'PN' },
];

const mobileNav = [
  { label: 'Home', to: '/home', icon: LayoutGrid },
  { label: 'Market', to: '/marketplace', icon: Compass },
  { label: 'Swaps', to: '/swaps', icon: CalendarRange },
  { label: 'Messages', to: '/messages', icon: MessageSquareText },
  { label: 'Profile', to: '/profile', icon: Users },
];

export default function AppShell({ children }: AppShellProps) {
  const location = useLocation();
  const currentUser = useSelector((state: RootState) => state.auth.user);

  const profileImage = currentUser?.profile?.avatarUrl || currentUser?.avatarUrl || 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=250&q=80';

  return (
    <div className="min-h-screen bg-neutral-100">
      <div className="mx-auto max-w-[1600px] px-4 pb-20 pt-24 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[280px_minmax(0,1fr)_320px]">
          <aside className="hidden xl:flex xl:flex-col xl:gap-6">
            <div className="card p-4">
              <div className="flex items-center gap-3">
                <img
                  src={profileImage}
                  alt={currentUser?.name || 'Profile'}
                  className="h-14 w-14 rounded-full object-cover ring-4 ring-primary-50"
                />
                <div className="min-w-0">
                  <p className="truncate text-base font-semibold text-neutral-900">{currentUser?.name || 'Your Profile'}</p>
                  <p className="text-sm text-neutral-500">{currentUser?.role || 'Skill exchange member'}</p>
                </div>
              </div>

              <div className="mt-4 rounded-2xl border border-primary-100 bg-primary-50 p-3">
                <div className="flex items-center justify-between text-sm text-primary-700">
                  <span className="font-medium">Profile strength</span>
                  <span className="font-semibold">82%</span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-primary-100">
                  <div className="h-full w-[82%] rounded-full bg-primary-600" />
                </div>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-2">
                  <div className="text-lg font-semibold text-neutral-900">18</div>
                  <div className="text-[11px] text-neutral-500">Swaps</div>
                </div>
                <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-2">
                  <div className="text-lg font-semibold text-neutral-900">4.9</div>
                  <div className="text-[11px] text-neutral-500">Rating</div>
                </div>
                <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-2">
                  <div className="text-lg font-semibold text-neutral-900">612</div>
                  <div className="text-[11px] text-neutral-500">Endors.</div>
                </div>
              </div>
            </div>

            <div className="card p-2">
              <p className="px-3 pb-2 pt-1 text-xs font-semibold uppercase tracking-[0.12em] text-neutral-500">
                Quick links
              </p>
              <nav className="space-y-1">
                {quickLinks.map(({ label, to, icon: Icon }) => {
                  const active = location.pathname === to;

                  return (
                    <Link
                      key={to}
                      to={to}
                      className={[
                        'flex items-center justify-between rounded-xl px-3 py-2.5 text-sm transition-colors',
                        active
                          ? 'bg-primary-50 text-primary-700 ring-1 ring-primary-100'
                          : 'text-neutral-700 hover:bg-neutral-50 hover:text-primary-700',
                      ].join(' ')}
                    >
                      <span className="flex items-center gap-3">
                        <Icon className="h-4 w-4" />
                        {label}
                      </span>
                      {label === 'Messages' && (
                        <span className="rounded-full bg-primary-600 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                          3
                        </span>
                      )}
                    </Link>
                  );
                })}
              </nav>
            </div>
          </aside>

          <main className="min-w-0">{children}</main>

          <aside className="hidden xl:flex xl:flex-col xl:gap-6">
            <div className="card p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-neutral-500">Trending</p>
                  <h3 className="mt-1 text-lg font-semibold text-neutral-900">Skills this week</h3>
                </div>
                <Sparkles className="h-5 w-5 text-primary-600" />
              </div>

              <div className="mt-4 space-y-3">
                {trendingSkills.map((skill) => (
                  <div key={skill.name} className="rounded-xl border border-neutral-200 bg-neutral-50 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="font-medium text-neutral-900">{skill.name}</p>
                        <p className="text-xs text-neutral-500">{skill.tone}</p>
                      </div>
                      <span className="rounded-full bg-primary-50 px-2 py-1 text-[10px] font-semibold text-primary-700">
                        {skill.score}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="card p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-neutral-500">Suggested</p>
                  <h3 className="mt-1 text-lg font-semibold text-neutral-900">People to swap with</h3>
                </div>
                <TrendingUp className="h-5 w-5 text-primary-600" />
              </div>

              <div className="mt-4 space-y-3">
                {suggestedMatches.map((person) => (
                  <div key={person.name} className="flex items-center justify-between rounded-xl border border-neutral-200 bg-neutral-50 p-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100 text-xs font-semibold text-primary-700">
                        {person.avatar}
                      </div>
                      <div>
                        <p className="font-medium text-neutral-900">{person.name}</p>
                        <p className="text-xs text-neutral-500">{person.role}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="inline-flex rounded-full bg-success-50 px-2 py-1 text-[10px] font-semibold text-success-700">
                        {person.badge}
                      </div>
                      <p className="mt-2 text-[11px] font-medium text-primary-700">{person.score}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-neutral-200 bg-white/95 px-4 py-2 shadow-[0_-10px_30px_rgba(10,18,33,0.08)] backdrop-blur-xl xl:hidden">
        <div className="mx-auto grid max-w-xl grid-cols-5 gap-2 text-center">
          {mobileNav.map(({ label, to, icon: Icon }) => {
            const active = location.pathname === to;

            return (
              <Link
                key={to}
                to={to}
                className={[
                  'flex flex-col items-center justify-center rounded-xl px-1 py-2 text-[11px] font-medium transition-colors',
                  active ? 'bg-primary-50 text-primary-700' : 'text-neutral-500',
                ].join(' ')}
              >
                <Icon className="mb-1 h-4 w-4" />
                {label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
