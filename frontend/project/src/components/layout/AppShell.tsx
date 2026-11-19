import React from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { ArrowLeftRight, CalendarDays, Compass, GraduationCap, Home, MessageSquareText, Star, UserCircle2 } from 'lucide-react';
import Navbar from '../Navbar';
import { useSelector } from 'react-redux';
import { RootState } from '../../store/store';

// The swap lifecycle in the words a new member would use.
const swapSteps = [
  { title: 'Find a skill', body: 'Search the marketplace for someone who teaches what you want to learn.' },
  { title: 'Send a swap request', body: 'Offer one of your skills in return and suggest a time.' },
  { title: 'Agree on the terms', body: 'Both of you confirm the agreement before the first session.' },
  { title: 'Meet and log progress', body: 'Use video calls, then record hours and progress after each session.' },
  { title: 'Rate and get certified', body: 'Leave a review when you finish. Completed swaps earn certificates.' },
];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const user = useSelector((state: RootState) => state.auth.user);
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);
  const unreadMessages = useSelector((state: RootState) => state.chat.unreadMessages);
  const { items: posts } = useSelector((state: RootState) => state.posts);
  const { received, sent } = useSelector((state: RootState) => state.swaps);
  const location = useLocation();
  const showSidebars = location.pathname === '/home';

  const initials = user?.name?.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase() || 'U';
  const userSkills = user?.skills?.map((skill) => skill.skillName).filter(Boolean) || [];
  const allSwaps = [...received, ...sent];
  const activeSwaps = allSwaps.filter((swap: any) => swap.status === 'ACCEPTED');
  const pendingSwaps = allSwaps.filter((swap: any) => ['PENDING', 'RESCHEDULED'].includes(swap.status));
  const latestPosts = posts.slice(0, 4);

  const profileChecks = [
    { done: !!user?.profile?.avatarUrl, label: 'Add a profile photo' },
    { done: !!user?.profile?.bio, label: 'Write a short bio' },
    { done: !!user?.profile?.location, label: 'Add your location' },
    { done: (user?.skills?.length ?? 0) > 0, label: 'List a skill you can teach' },
  ];
  const doneCount = profileChecks.filter((c) => c.done).length;
  const profilePercent = Math.round((doneCount / profileChecks.length) * 100);
  const nextStep = profileChecks.find((c) => !c.done);

  const quickLinks = [
    { to: '/swaps', label: 'Waiting for you', count: pendingSwaps.length, icon: ArrowLeftRight },
    { to: '/calendar', label: 'Upcoming sessions', count: activeSwaps.length, icon: CalendarDays },
    { to: '/career', label: 'Certificates', icon: GraduationCap },
  ];

  const rating = user?.profile?.rating;

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900">
      <Navbar />
      <div className={`mx-auto flex max-w-[1240px] gap-6 px-4 ${isAuthenticated ? 'pb-24' : 'pb-10'} pt-20 sm:px-6 md:pb-10 lg:px-8`}>
        {showSidebars && (
          <aside className="hidden w-[240px] shrink-0 xl:block">
            <div className="sticky top-20 space-y-4">
              <section className="rounded-lg border border-neutral-200 bg-white p-4">
                <Link to="/profile" className="flex items-center gap-3">
                  {user?.profile?.avatarUrl ? (
                    <img src={user.profile.avatarUrl} alt="" className="h-12 w-12 rounded-full object-cover" />
                  ) : (
                    <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-100 text-sm font-semibold text-primary-700">
                      {initials}
                    </span>
                  )}
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold text-neutral-900 hover:underline">{user?.name || 'Your profile'}</span>
                    <span className="mt-0.5 block truncate text-xs text-neutral-500">
                      {userSkills.length > 0 ? userSkills.slice(0, 2).join(' · ') : 'No skills listed yet'}
                    </span>
                  </span>
                </Link>

                <dl className="mt-4 grid grid-cols-2 gap-2 border-t border-neutral-100 pt-3 text-center">
                  <div>
                    <dt className="text-xs text-neutral-500">Active swaps</dt>
                    <dd className="mt-0.5 text-base font-semibold">{activeSwaps.length}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-neutral-500">Rating</dt>
                    <dd className="mt-0.5 flex items-center justify-center gap-1 text-base font-semibold">
                      {rating ? (
                        <>
                          <Star className="h-3.5 w-3.5 fill-warning-400 text-warning-400" />
                          {rating}
                        </>
                      ) : (
                        <span className="text-sm font-normal text-neutral-400">No reviews</span>
                      )}
                    </dd>
                  </div>
                </dl>

                {nextStep && (
                  <div className="mt-4 border-t border-neutral-100 pt-3">
                    <div className="flex items-center justify-between text-xs text-neutral-600">
                      <span>Profile {profilePercent}% complete</span>
                    </div>
                    <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-neutral-100">
                      <div className="h-full rounded-full bg-primary-600" style={{ width: `${profilePercent}%` }} />
                    </div>
                    <Link to="/profile" className="mt-2 block text-xs font-medium text-primary-700 hover:underline">
                      Next: {nextStep.label}
                    </Link>
                  </div>
                )}
              </section>

              <nav aria-label="Shortcuts" className="rounded-lg border border-neutral-200 bg-white p-2">
                {quickLinks.map(({ to, label, count, icon: Icon }) => (
                  <NavLink
                    key={to}
                    to={to}
                    className="flex items-center justify-between rounded-md px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-50 hover:text-neutral-900"
                  >
                    <span className="flex items-center gap-2">
                      <Icon className="h-4 w-4 text-neutral-500" />
                      {label}
                    </span>
                    {!!count && (
                      <span className="rounded-full bg-primary-50 px-2 py-0.5 text-xs font-semibold text-primary-700">{count}</span>
                    )}
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
              <section className="rounded-lg border border-neutral-200 bg-white p-4">
                <h2 className="text-sm font-semibold text-neutral-900">How a swap works</h2>
                <ol className="mt-3 space-y-3">
                  {swapSteps.map((step, i) => (
                    <li key={step.title} className="flex gap-3">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-neutral-300 text-xs font-semibold text-neutral-600">
                        {i + 1}
                      </span>
                      <div>
                        <p className="text-sm font-medium text-neutral-900">{step.title}</p>
                        <p className="mt-0.5 text-xs leading-5 text-neutral-500">{step.body}</p>
                      </div>
                    </li>
                  ))}
                </ol>
                <Link to="/marketplace" className="mt-4 block rounded-md border border-neutral-300 py-2 text-center text-sm font-medium text-neutral-800 hover:bg-neutral-50">
                  Start by finding a skill
                </Link>
              </section>

              <section className="rounded-lg border border-neutral-200 bg-white p-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-neutral-900">New skill listings</h2>
                  <Link to="/marketplace" className="text-xs font-medium text-primary-700 hover:underline">See all</Link>
                </div>
                <ul className="mt-3 divide-y divide-neutral-100">
                  {latestPosts.map((post: any) => (
                    <li key={post.id} className="py-2">
                      <p className="truncate text-sm font-medium text-neutral-900">{post.title}</p>
                      <p className="truncate text-xs text-neutral-500">{post.user?.name || 'Community member'}</p>
                    </li>
                  ))}
                  {latestPosts.length === 0 && <li className="py-2 text-xs text-neutral-500">No listings yet.</li>}
                </ul>
              </section>
            </div>
          </aside>
        )}
      </div>

      {isAuthenticated && (
      <nav aria-label="Mobile" className="fixed inset-x-0 bottom-0 z-40 border-t border-neutral-200 bg-white md:hidden">
        <div className="mx-auto flex max-w-md items-center justify-between px-2">
          {[
            { to: '/home', label: 'Home', icon: Home },
            { to: '/marketplace', label: 'Find skills', icon: Compass },
            { to: '/swaps', label: 'My swaps', icon: ArrowLeftRight },
            { to: '/messages', label: 'Messages', icon: MessageSquareText },
            { to: '/profile', label: 'Profile', icon: UserCircle2 },
          ].map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => `flex flex-1 flex-col items-center gap-1 py-2 text-[11px] ${isActive ? 'text-primary-700' : 'text-neutral-500'}`}
            >
              <span className="relative">
                <Icon className="h-5 w-5" />
                {to === '/messages' && unreadMessages > 0 && (
                  <span className="absolute -right-2 -top-1.5 min-w-[16px] rounded-full bg-error-600 px-1 text-center text-[10px] font-semibold leading-4 text-white">
                    {unreadMessages > 9 ? '9+' : unreadMessages}
                  </span>
                )}
              </span>
              {label}
            </NavLink>
          ))}
        </div>
      </nav>
      )}
    </div>
  );
}
