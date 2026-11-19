import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Award,
  BookOpen,
  CalendarDays,
  Check,
  ChevronDown,
  GraduationCap,
  MessageSquareText,
  Search,
  ShieldCheck,
  Video,
} from 'lucide-react';
import Navbar from '../components/Navbar';

// Two clear starting points so a visitor never has to guess where to click.
const paths = [
  {
    icon: BookOpen,
    title: 'I want to learn a skill',
    body: 'Look through what people are offering. You can browse without an account.',
    cta: 'Browse skills',
    to: '/marketplace',
    primary: false,
  },
  {
    icon: GraduationCap,
    title: 'I want to teach and learn',
    body: 'Create a profile, list what you can teach, and start sending swap requests.',
    cta: 'Create a free account',
    to: '/signup',
    primary: true,
  },
];

// Each step names the screen where it happens, so the app feels familiar on first sign-in.
const steps = [
  { title: 'Create your profile', body: 'Add a photo, a short bio, and the skills you can teach.', where: 'Profile' },
  { title: 'Find a match', body: 'Search by skill, category, level or location and open someone’s profile.', where: 'Find skills' },
  { title: 'Send a swap request', body: 'Pick one of your skills to offer in return and suggest a time.', where: 'Find skills → Request swap' },
  { title: 'Agree and meet', body: 'When they accept, both of you confirm the terms. Meet on a video call.', where: 'My swaps' },
  { title: 'Log, rate and finish', body: 'Record hours and progress after sessions. Rate each other at the end.', where: 'My swaps → Completed' },
];

const checklist = [
  'An email address or Google account',
  'One skill you are comfortable teaching',
  'One skill you would like to learn',
  'About two minutes to fill in your profile',
];

const features = [
  { icon: Search, title: 'Skill marketplace', body: 'Filter listings by category, rating, location and experience level.' },
  { icon: ShieldCheck, title: 'Written agreements', body: 'Every swap has terms both people confirm before the first session.' },
  { icon: Video, title: 'Video calls in the browser', body: 'No extra apps or meeting links to share.' },
  { icon: MessageSquareText, title: 'Messaging', body: 'Chat with your partner and share files in one place.' },
  { icon: CalendarDays, title: 'Scheduling', body: 'Propose, accept or reschedule sessions from a shared calendar.' },
  { icon: Award, title: 'Reviews and certificates', body: 'Finished swaps build a record of what you have learned and taught.' },
];

const faqs = [
  {
    q: 'Does it cost anything?',
    a: 'No. There are no payments on HubForSkills. You pay for a lesson by teaching something back.',
  },
  {
    q: 'Do I need to be an expert to teach?',
    a: 'No. When you list a skill you choose your level — beginner, intermediate, advanced or expert — so people know what to expect.',
  },
  {
    q: 'What if my partner stops showing up?',
    a: 'You can cancel a swap before its cancellation deadline. If something goes wrong after that, open a dispute from My swaps and an administrator will review it.',
  },
  {
    q: 'How do we meet?',
    a: 'Through the built-in video call. You can also message each other at any time from the Messages page.',
  },
  {
    q: 'What do I get at the end?',
    a: 'Both of you confirm the swap is complete and leave a rating. Completed swaps appear on your profile and count toward your certificates.',
  },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <main className="pt-14">
        {/* Hero */}
        <section className="border-b border-neutral-200">
          <div className="mx-auto max-w-[1120px] px-4 py-16 sm:px-6 md:py-20 lg:px-8">
            <div className="max-w-2xl">
              <h1 className="text-4xl font-bold leading-tight tracking-tight text-neutral-900 md:text-5xl">
                Teach what you know.<br />Learn what you don't.
              </h1>
              <p className="mt-5 text-lg leading-relaxed text-neutral-600">
                HubForSkills pairs people who want to swap skills. You teach someone for an hour,
                they teach you for an hour. No money changes hands.
              </p>
            </div>

            <h2 className="mt-10 text-sm font-semibold text-neutral-900">What would you like to do?</h2>
            <div className="mt-3 grid gap-4 md:grid-cols-2">
              {paths.map(({ icon: Icon, title, body, cta, to, primary }) => (
                <Link
                  key={title}
                  to={to}
                  className={`group flex flex-col rounded-lg border p-5 transition-colors ${
                    primary ? 'border-primary-600 bg-primary-50 hover:bg-primary-100' : 'border-neutral-300 hover:border-neutral-400 hover:bg-neutral-50'
                  }`}
                >
                  <Icon className={`h-6 w-6 ${primary ? 'text-primary-700' : 'text-neutral-600'}`} />
                  <span className="mt-3 text-lg font-semibold text-neutral-900">{title}</span>
                  <span className="mt-1 text-sm leading-relaxed text-neutral-600">{body}</span>
                  <span className={`mt-4 inline-flex items-center gap-1 text-sm font-medium ${primary ? 'text-primary-700' : 'text-neutral-800'}`}>
                    {cta}
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </Link>
              ))}
            </div>
            <p className="mt-4 text-sm text-neutral-500">
              Already a member? <Link to="/login" className="font-medium text-primary-700 hover:underline">Sign in</Link>
            </p>
          </div>
        </section>

        {/* How it works */}
        <section id="how-it-works" className="scroll-mt-16 border-b border-neutral-200 bg-neutral-50">
          <div className="mx-auto max-w-[1120px] px-4 py-16 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold text-neutral-900 md:text-3xl">How a swap works</h2>
            <p className="mt-2 max-w-xl text-neutral-600">
              Five steps from sign-up to a finished swap. Each one tells you where to find it in the app.
            </p>
            <ol className="mt-10 grid gap-x-6 gap-y-8 md:grid-cols-5">
              {steps.map((step, i) => (
                <li key={step.title} className="relative border-t-2 border-neutral-300 pt-4">
                  <span className="absolute -top-[13px] left-0 flex h-6 w-6 items-center justify-center rounded-full border-2 border-neutral-300 bg-neutral-50 text-xs font-semibold text-neutral-700">
                    {i + 1}
                  </span>
                  <h3 className="mt-2 text-base font-semibold text-neutral-900">{step.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-neutral-600">{step.body}</p>
                  <p className="mt-2 text-xs text-neutral-500">
                    In the app: <span className="font-medium text-neutral-700">{step.where}</span>
                  </p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Example + checklist */}
        <section className="border-b border-neutral-200">
          <div className="mx-auto grid max-w-[1120px] gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:px-8">
            <div>
              <h2 className="text-2xl font-bold text-neutral-900">An example</h2>
              <p className="mt-2 text-neutral-600">
                Ayesha is a designer who wants to learn Python. Bilal is a developer who wants better-looking apps.
                They agree on six one-hour sessions each.
              </p>
              <div className="mt-6 rounded-lg border border-neutral-200 bg-neutral-50 p-5" aria-hidden>
                <div className="space-y-3">
                  {[
                    { name: 'Ayesha', teaches: 'UI design', learns: 'Python', initials: 'A' },
                    { name: 'Bilal', teaches: 'Python basics', learns: 'UI design', initials: 'B' },
                  ].map((p) => (
                    <div key={p.name} className="flex items-center gap-3 rounded-md border border-neutral-200 bg-white p-3">
                      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-100 text-sm font-semibold text-primary-700">{p.initials}</span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-neutral-900">{p.name}</p>
                        <p className="text-xs text-neutral-500">Teaches {p.teaches} · Learns {p.learns}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <dl className="mt-4 grid grid-cols-3 gap-3 border-t border-neutral-200 pt-4 text-sm">
                  <div><dt className="text-xs text-neutral-500">Sessions</dt><dd className="font-medium">6 × 1 hour</dd></div>
                  <div><dt className="text-xs text-neutral-500">Where</dt><dd className="font-medium">Video call</dd></div>
                  <div><dt className="text-xs text-neutral-500">Status</dt><dd className="font-medium text-success-700">Agreed</dd></div>
                </dl>
              </div>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-neutral-900">Before you start</h2>
              <p className="mt-2 text-neutral-600">You only need a few things to make your first swap.</p>
              <ul className="mt-6 space-y-3">
                {checklist.map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-success-50 text-success-700">
                      <Check className="h-3.5 w-3.5" />
                    </span>
                    <span className="text-neutral-800">{item}</span>
                  </li>
                ))}
              </ul>
              <Link to="/signup" className="mt-8 inline-flex items-center gap-2 rounded-md bg-primary-600 px-5 py-2.5 font-medium text-white hover:bg-primary-700">
                Create a free account
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="border-b border-neutral-200 bg-neutral-50">
          <div className="mx-auto max-w-[1120px] px-4 py-16 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold text-neutral-900 md:text-3xl">What's included</h2>
            <div className="mt-10 grid gap-x-10 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
              {features.map(({ icon: Icon, title, body }) => (
                <div key={title} className="flex gap-4">
                  <Icon className="mt-0.5 h-5 w-5 shrink-0 text-primary-600" />
                  <div>
                    <h3 className="text-base font-semibold text-neutral-900">{title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-neutral-600">{body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="scroll-mt-16 border-b border-neutral-200">
          <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold text-neutral-900 md:text-3xl">Common questions</h2>
            <div className="mt-8 divide-y divide-neutral-200 border-y border-neutral-200">
              {faqs.map(({ q, a }) => (
                <details key={q} className="group py-4">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium text-neutral-900 [&::-webkit-details-marker]:hidden">
                    {q}
                    <ChevronDown className="h-5 w-5 shrink-0 text-neutral-500 transition-transform group-open:rotate-180" />
                  </summary>
                  <p className="mt-3 leading-relaxed text-neutral-600">{a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* Closing call to action */}
        <section>
          <div className="mx-auto flex max-w-[1120px] flex-col items-start justify-between gap-6 px-4 py-16 sm:px-6 md:flex-row md:items-center lg:px-8">
            <div>
              <h2 className="text-2xl font-bold text-neutral-900">Ready to make your first swap?</h2>
              <p className="mt-1 text-neutral-600">Set up your profile now, or look around first.</p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link to="/marketplace" className="inline-flex items-center justify-center rounded-md border border-neutral-300 px-5 py-2.5 font-medium text-neutral-800 hover:bg-neutral-50">
                Browse skills
              </Link>
              <Link to="/signup" className="inline-flex items-center justify-center gap-2 rounded-md bg-primary-600 px-5 py-2.5 font-medium text-white hover:bg-primary-700">
                Create a free account
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
