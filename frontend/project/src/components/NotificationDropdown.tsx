import { useState } from 'react';
import { Bell, Heart, MessageSquare, RefreshCw, UserPlus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

export interface Notification {
    id: number | string;
    type: string;
    title?: string;
    message: string;
    createdAt?: string; // API returns createdAt
    timestamp?: string; // legacy support
    isRead: boolean;
    link?: string;
    sender?: {
        id: number;
        name: string;
        profile?: {
            avatarUrl: string;
        };
    };
    avatar?: string; // legacy support
    userName?: string;
}

interface NotificationDropdownProps {
    notifications: Notification[];
    onMarkAsRead: (id: string | number) => void;
    onMarkAllAsRead: () => void;
    onClearAll: () => void;
}

export default function NotificationDropdown({
    notifications,
    onMarkAsRead,
    onMarkAllAsRead,
    onClearAll
}: NotificationDropdownProps) {
    const [isOpen, setIsOpen] = useState(false);
    const navigate = useNavigate();

    const unreadCount = notifications.filter(n => !n.isRead).length;

    const getIcon = (type: string) => {
        switch (type) {
            case 'like': return <Heart className="w-4 h-4 text-error-500" />;
            case 'comment': return <MessageSquare className="w-4 h-4 text-primary-500" />;
            case 'swap':
            case 'SWAP_REQUEST':
            case 'SWAP_ACCEPTED':
            case 'SWAP_REJECTED':
                return <RefreshCw className="w-4 h-4 text-accent-500" />;
            case 'message': return <MessageSquare className="w-4 h-4 text-success-500" />;
            case 'connection': return <UserPlus className="w-4 h-4 text-orange-500" />;
            default: return <Bell className="w-4 h-4 text-neutral-500" />;
        }
    };

    const handleNotificationClick = (notification: Notification) => {
        onMarkAsRead(notification.id);
        if (notification.link) {
            navigate(notification.link);
        }
        setIsOpen(false);
    };

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-full transition"
            >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 w-5 h-5 bg-error-500 text-white text-xs flex items-center justify-center rounded-full font-bold">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            <AnimatePresence>
                {isOpen && (
                    <>
                        {/* Backdrop */}
                        <div
                            className="fixed inset-0 z-40"
                            onClick={() => setIsOpen(false)}
                        />

                        {/* Dropdown */}
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="absolute right-0 mt-2 w-96 bg-white rounded-xl shadow-2xl border border-neutral-100 z-50 max-h-[600px] flex flex-col"
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between p-4 border-b border-neutral-100">
                                <h3 className="font-bold text-neutral-900 text-lg">Notifications</h3>
                                <div className="flex space-x-2">
                                    {unreadCount > 0 && (
                                        <button
                                            onClick={onMarkAllAsRead}
                                            className="text-xs text-primary-600 hover:text-primary-700 font-medium"
                                        >
                                            Mark all read
                                        </button>
                                    )}
                                    {notifications.length > 0 && (
                                        <button
                                            onClick={onClearAll}
                                            className="text-xs text-neutral-500 hover:text-neutral-700 font-medium"
                                        >
                                            Clear all
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Notifications List */}
                            <div className="overflow-y-auto flex-1">
                                {notifications.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-12 text-neutral-400">
                                        <Bell className="w-12 h-12 mb-3" />
                                        <p className="text-sm">No notifications yet</p>
                                    </div>
                                ) : (
                                    <div>
                                        {notifications.map((notification) => (
                                            <motion.div
                                                key={notification.id}
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                className={`p-4 border-b border-neutral-50 hover:bg-neutral-50 cursor-pointer transition ${!notification.isRead ? 'bg-primary-50/30' : ''
                                                    }`}
                                                onClick={() => handleNotificationClick(notification)}
                                            >
                                                <div className="flex items-start space-x-3">
                                                    <div className="flex-shrink-0 mt-1">
                                                        {(notification.sender?.profile?.avatarUrl || notification.avatar) ? (
                                                            <div className="w-10 h-10 rounded-full bg-cover bg-center border border-neutral-200"
                                                                style={{ backgroundImage: `url(${notification.sender?.profile?.avatarUrl || notification.avatar})` }}
                                                            />
                                                        ) : (
                                                            <div className="w-10 h-10 rounded-full bg-neutral-100 flex items-center justify-center">
                                                                {getIcon(notification.type)}
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-medium text-neutral-900 mb-1">
                                                            {notification.title}
                                                        </p>
                                                        <p className="text-sm text-neutral-600 line-clamp-2">
                                                            {notification.message}
                                                        </p>
                                                        <p className="text-xs text-neutral-400 mt-1">
                                                            {notification.createdAt ? new Date(notification.createdAt).toLocaleDateString() : notification.timestamp}
                                                        </p>
                                                    </div>

                                                    {!notification.isRead && (
                                                        <div className="flex-shrink-0">
                                                            <div className="w-2 h-2 bg-primary-600 rounded-full"></div>
                                                        </div>
                                                    )}
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Footer */}
                            {notifications.length > 0 && (
                                <div className="p-3 border-t border-neutral-100">
                                    <button
                                        onClick={() => {
                                            navigate('/notifications');
                                            setIsOpen(false);
                                        }}
                                        className="w-full text-center text-sm text-primary-600 hover:text-primary-700 font-medium"
                                    >
                                        View all notifications
                                    </button>
                                </div>
                            )}
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
