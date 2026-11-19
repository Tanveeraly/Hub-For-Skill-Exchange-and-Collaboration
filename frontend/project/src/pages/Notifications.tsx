import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { ArrowLeftRight, Award, Bell, Heart, MessageCircle, ShieldAlert, UserPlus } from 'lucide-react';
import { RootState, AppDispatch } from '../store/store';
import { fetchNotifications, markAsRead, markAllAsRead, clearAllNotifications } from '../store/slices/notificationsSlice';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import { toast } from '../lib/toast';

type Item = {
    id: number;
    type: string;
    title?: string;
    message: string;
    isRead: boolean;
    createdAt: string;
    sender?: { id: number; name: string; profile?: { avatarUrl?: string } };
};

// Where each kind of notification takes you, and the icon that represents it.
function meta(type: string) {
    if (type.startsWith('SWAP') || type === 'ESCROW_CONFIRMED') return { to: '/swaps', icon: ArrowLeftRight };
    if (type.startsWith('DISPUTE')) return { to: '/swaps', icon: ShieldAlert };
    if (type.startsWith('CONNECTION')) return { to: '/network', icon: UserPlus };
    if (type === 'ENDORSEMENT') return { to: '/career', icon: Award };
    if (type === 'LIKE') return { to: '/home', icon: Heart };
    if (type === 'COMMENT') return { to: '/home', icon: MessageCircle };
    return { to: null as string | null, icon: Bell };
}

function timeAgo(iso: string) {
    const then = new Date(iso).getTime();
    if (Number.isNaN(then)) return '';
    const s = Math.max(0, Math.round((Date.now() - then) / 1000));
    if (s < 60) return 'Just now';
    const m = Math.round(s / 60);
    if (m < 60) return `${m} min ago`;
    const h = Math.round(m / 60);
    if (h < 24) return `${h} h ago`;
    const d = Math.round(h / 24);
    if (d < 7) return `${d} day${d === 1 ? '' : 's'} ago`;
    return new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function Notifications() {
    const dispatch = useDispatch<AppDispatch>();
    const navigate = useNavigate();
    const { items, loading, error } = useSelector((state: RootState) => state.notifications);
    const [filter, setFilter] = useState<'all' | 'unread'>('all');
    const [confirmClear, setConfirmClear] = useState(false);

    useEffect(() => {
        dispatch(fetchNotifications());
    }, [dispatch]);

    const list = (items as unknown as Item[]) ?? [];
    const unreadCount = list.filter((n) => !n.isRead).length;
    const shown = filter === 'unread' ? list.filter((n) => !n.isRead) : list;

    const open = (n: Item) => {
        if (!n.isRead) dispatch(markAsRead(n.id));
        const { to } = meta(n.type);
        if (to) navigate(to);
    };

    const clearAll = async () => {
        try {
            await dispatch(clearAllNotifications()).unwrap();
            toast.success('All notifications cleared.');
        } catch {
            toast.error('Could not clear notifications. Please try again.');
        }
    };

    return (
        <div className="mx-auto max-w-3xl pb-12">
            <header className="mb-4 flex flex-wrap items-end justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-semibold text-neutral-900">Notifications</h1>
                    <p className="mt-1 text-sm text-neutral-600">
                        {unreadCount ? `${unreadCount} unread` : 'You are all caught up.'} New messages show on the Messages tab.
                    </p>
                </div>
                <div className="flex gap-2">
                    {unreadCount > 0 && (
                        <button onClick={() => dispatch(markAllAsRead())} className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm font-medium text-neutral-800 hover:bg-neutral-50">
                            Mark all as read
                        </button>
                    )}
                    {list.length > 0 && (
                        <button onClick={() => setConfirmClear(true)} className="rounded-md px-3 py-1.5 text-sm font-medium text-neutral-600 hover:bg-neutral-100">
                            Clear all
                        </button>
                    )}
                </div>
            </header>

            <div className="mb-4 inline-flex rounded-md border border-neutral-300 bg-white p-0.5" role="group" aria-label="Show">
                {([['all', 'All'], ['unread', `Unread${unreadCount ? ` (${unreadCount})` : ''}`]] as const).map(([value, label]) => (
                    <button
                        key={value}
                        onClick={() => setFilter(value)}
                        aria-pressed={filter === value}
                        className={`rounded px-3 py-1.5 text-sm ${filter === value ? 'bg-neutral-900 font-medium text-white' : 'text-neutral-700 hover:bg-neutral-100'}`}
                    >
                        {label}
                    </button>
                ))}
            </div>

            {loading && list.length === 0 ? (
                <div className="space-y-2" aria-busy="true">
                    {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-20 rounded-lg skeleton" />)}
                </div>
            ) : error && list.length === 0 ? (
                <div className="rounded-lg border border-neutral-200 bg-white p-8 text-center">
                    <p className="font-medium text-neutral-900">We couldn't load your notifications</p>
                    <button onClick={() => dispatch(fetchNotifications())} className="mt-4 rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-800 hover:bg-neutral-50">
                        Try again
                    </button>
                </div>
            ) : shown.length === 0 ? (
                <div className="rounded-lg border border-dashed border-neutral-300 bg-white p-10 text-center">
                    <Bell className="mx-auto h-8 w-8 text-neutral-300" />
                    <p className="mt-3 font-medium text-neutral-900">{filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}</p>
                    <p className="mx-auto mt-1 max-w-sm text-sm text-neutral-600">
                        You'll be notified here about swap requests and replies, connection requests, reminders and disputes.
                    </p>
                </div>
            ) : (
                <ul className="divide-y divide-neutral-100 overflow-hidden rounded-lg border border-neutral-200 bg-white">
                    {shown.map((n) => {
                        const { to, icon: Icon } = meta(n.type);
                        const avatar = n.sender?.profile?.avatarUrl;
                        return (
                            <li key={n.id}>
                                <button
                                    onClick={() => open(n)}
                                    className={`flex w-full items-start gap-3 px-4 py-3.5 text-left transition-colors hover:bg-neutral-50 ${n.isRead ? '' : 'bg-primary-50/60'}`}
                                >
                                    <span className="relative shrink-0">
                                        {avatar ? (
                                            <img src={avatar} alt="" className="h-10 w-10 rounded-full object-cover" />
                                        ) : (
                                            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-100 text-neutral-600">
                                                <Icon className="h-5 w-5" />
                                            </span>
                                        )}
                                    </span>
                                    <span className="min-w-0 flex-1">
                                        <span className="flex items-start justify-between gap-3">
                                            <span className={`text-sm text-neutral-900 ${n.isRead ? 'font-medium' : 'font-semibold'}`}>
                                                {n.title || 'Notification'}
                                            </span>
                                            <span className="shrink-0 text-xs text-neutral-500">{timeAgo(n.createdAt)}</span>
                                        </span>
                                        <span className="mt-0.5 block text-sm text-neutral-600">{n.message}</span>
                                        {to && <span className="mt-1 block text-xs font-medium text-primary-700">Open →</span>}
                                    </span>
                                    {!n.isRead && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary-600" aria-label="Unread" />}
                                </button>
                            </li>
                        );
                    })}
                </ul>
            )}

            <ConfirmDialog
                isOpen={confirmClear}
                title="Clear all notifications?"
                description="This removes every notification from your list. It can't be undone."
                confirmLabel="Clear all"
                tone="danger"
                onConfirm={clearAll}
                onClose={() => setConfirmClear(false)}
            />
        </div>
    );
}
