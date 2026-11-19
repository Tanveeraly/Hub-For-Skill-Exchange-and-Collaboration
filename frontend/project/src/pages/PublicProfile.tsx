import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import axios from 'axios';
import { ArrowLeft, ArrowLeftRight, ExternalLink, MapPin, MessageSquare } from 'lucide-react';
import { RootState } from '../store/store';
import { API_BASE } from '../config';
import SwapRequestModal from '../components/SwapRequestModal';
import { toast } from '../lib/toast';

interface PublicUser {
  id: number;
  name: string;
  createdAt?: string;
  profile: { bio?: string; avatarUrl?: string; coverimageUrl?: string; website?: string; location?: string } | null;
  skills: { id: number; skillName: string; expertiseLevel: string }[];
  portfolios: { id: number; title: string; description?: string; mediaUrl?: string; mediaType?: string | null }[];
  listings: { id: number; title: string; description?: string; location?: string; isFeatured?: boolean }[];
}

const levelLabel: Record<string, string> = {
  BEGINNER: 'Beginner',
  INTERMEDIATE: 'Intermediate',
  ADVANCED: 'Advanced',
  EXPERT: 'Expert',
};

const initials = (name: string) => name.split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase();

/** Read-only view of another member, reached from Find skills, Network or Messages. */
export default function PublicProfile({ userId }: { userId: number }) {
  const navigate = useNavigate();
  const me = useSelector((state: RootState) => state.auth.user);
  const [person, setPerson] = useState<PublicUser | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'missing' | 'error'>('loading');
  const [swapListing, setSwapListing] = useState<PublicUser['listings'][number] | null>(null);
  const mySkills = (me?.skills ?? []).map((s: any) => s.skillName).filter(Boolean);

  useEffect(() => {
    let cancelled = false;
    setStatus('loading');
    axios
      .get(`${API_BASE}/auth/getAllUsersFullInfo`, { withCredentials: true })
      .then((res) => {
        if (cancelled) return;
        const found = (res.data?.data as PublicUser[] | undefined)?.find((u) => Number(u.id) === userId) ?? null;
        setPerson(found);
        setStatus(found ? 'ready' : 'missing');
      })
      .catch(() => !cancelled && setStatus('error'));
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const back = (
    <button onClick={() => navigate(-1)} className="mb-4 inline-flex items-center gap-1 text-sm text-neutral-600 hover:text-neutral-900">
      <ArrowLeft className="h-4 w-4" /> Back
    </button>
  );

  if (status === 'loading') {
    return (
      <div className="mx-auto max-w-4xl space-y-4" aria-busy="true">
        <div className="h-40 rounded-lg skeleton" />
        <div className="h-32 rounded-lg skeleton" />
      </div>
    );
  }

  if (status !== 'ready' || !person) {
    return (
      <div className="mx-auto max-w-4xl">
        {back}
        <div className="rounded-lg border border-dashed border-neutral-300 bg-white p-10 text-center">
          <h1 className="text-lg font-semibold text-neutral-900">
            {status === 'error' ? 'We could not load this profile' : 'This profile is private or no longer exists'}
          </h1>
          <p className="mt-2 text-sm text-neutral-600">
            {status === 'error' ? 'Check your connection and try again.' : 'The person may have hidden their profile.'}
          </p>
          <Link to="/marketplace" className="mt-5 inline-block rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-800 hover:bg-neutral-50">
            Back to Find skills
          </Link>
        </div>
      </div>
    );
  }

  const p = person.profile ?? {};
  const startChat = () =>
    navigate('/messages', { state: { startChatWith: { id: person.id, name: person.name, avatarUrl: p.avatarUrl } } });
  const offers = (title: string) => title.split('<->')[0].trim();
  const wants = (title: string) => title.split('<->')[1]?.trim();

  return (
    <div className="mx-auto max-w-4xl">
      {back}

      <section className="overflow-hidden rounded-lg border border-neutral-200 bg-white">
        <div className="h-28 bg-neutral-100">
          {p.coverimageUrl && <img src={p.coverimageUrl} alt="" className="h-full w-full object-cover" />}
        </div>
        <div className="px-6 pb-6">
          <div className="-mt-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex items-end gap-4">
              {p.avatarUrl ? (
                <img src={p.avatarUrl} alt="" className="h-20 w-20 rounded-full border-4 border-white object-cover" />
              ) : (
                <span className="flex h-20 w-20 items-center justify-center rounded-full border-4 border-white bg-primary-100 text-xl font-semibold text-primary-700">
                  {initials(person.name)}
                </span>
              )}
              <div className="pb-1">
                <h1 className="text-xl font-semibold text-neutral-900">{person.name}</h1>
                <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-neutral-500">
                  {p.location && <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{p.location}</span>}
                  {person.createdAt && <span>Member since {new Date(person.createdAt).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</span>}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={startChat} className="inline-flex items-center gap-2 rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-800 hover:bg-neutral-50">
                <MessageSquare className="h-4 w-4" /> Message
              </button>
            </div>
          </div>

          {p.bio ? (
            <p className="mt-5 max-w-2xl whitespace-pre-line text-sm leading-relaxed text-neutral-700">{p.bio}</p>
          ) : (
            <p className="mt-5 text-sm text-neutral-500">{person.name.split(' ')[0]} hasn't written a bio yet.</p>
          )}
          {p.website && (
            <a href={p.website} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1 text-sm text-primary-700 hover:underline">
              {p.website.replace(/^https?:\/\//, '')} <ExternalLink className="h-3.5 w-3.5" />
            </a>
          )}
        </div>
      </section>

      <section className="mt-6 rounded-lg border border-neutral-200 bg-white p-6">
        <h2 className="text-base font-semibold text-neutral-900">Can teach</h2>
        {person.skills.length > 0 ? (
          <ul className="mt-3 flex flex-wrap gap-2">
            {person.skills.map((s) => (
              <li key={s.id} className="rounded-md border border-neutral-200 px-3 py-1.5 text-sm">
                <span className="font-medium text-neutral-900">{s.skillName}</span>
                <span className="ml-1.5 text-neutral-500">{levelLabel[s.expertiseLevel] ?? s.expertiseLevel}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-neutral-500">No skills listed yet.</p>
        )}
      </section>

      <section className="mt-6 rounded-lg border border-neutral-200 bg-white p-6">
        <h2 className="text-base font-semibold text-neutral-900">Open to swap</h2>
        <p className="mt-1 text-sm text-neutral-500">Pick a listing to send a swap request. You'll offer one of your skills in return.</p>
        {person.listings.length > 0 ? (
          <ul className="mt-4 divide-y divide-neutral-100">
            {person.listings.map((l) => (
              <li key={l.id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="font-medium text-neutral-900">Teaches {offers(l.title)}</p>
                  {wants(l.title) && <p className="text-sm text-neutral-600">Wants to learn {wants(l.title)}</p>}
                  {l.description && <p className="mt-1 line-clamp-2 text-sm text-neutral-500">{l.description}</p>}
                </div>
                <button
                  onClick={() => setSwapListing(l)}
                  className="inline-flex shrink-0 items-center justify-center gap-2 rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
                >
                  <ArrowLeftRight className="h-4 w-4" /> Request swap
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-4 text-sm text-neutral-500">
            {person.name.split(' ')[0]} has no open listings right now. You can still send a message.
          </p>
        )}
      </section>

      {person.portfolios.length > 0 && (
        <section className="mt-6 rounded-lg border border-neutral-200 bg-white p-6">
          <h2 className="text-base font-semibold text-neutral-900">Portfolio</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {person.portfolios.map((item) => (
              <article key={item.id} className="overflow-hidden rounded-md border border-neutral-200">
                {item.mediaUrl && item.mediaType?.startsWith('image') && (
                  <img src={item.mediaUrl} alt="" className="h-36 w-full object-cover" />
                )}
                <div className="p-3">
                  <h3 className="text-sm font-medium text-neutral-900">{item.title}</h3>
                  {item.description && <p className="mt-1 line-clamp-2 text-sm text-neutral-600">{item.description}</p>}
                  {item.mediaUrl && !item.mediaType?.startsWith('image') && (
                    <a href={item.mediaUrl} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1 text-sm text-primary-700 hover:underline">
                      Open <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  )}
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {swapListing && (
        <SwapRequestModal
          isOpen
          onClose={() => setSwapListing(null)}
          recipientName={person.name}
          recipientSkill={offers(swapListing.title)}
          skillId={swapListing.id}
          userSkills={mySkills}
          onSubmit={() => toast.success(`Swap request sent to ${person.name}. Follow its progress in My swaps.`)}
        />
      )}
    </div>
  );
}
