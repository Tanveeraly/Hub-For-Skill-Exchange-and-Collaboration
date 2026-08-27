import { useState } from 'react';
import { Bell, Check, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import type { Notification } from '../components/NotificationDropdown';

export default function Notifications() {
    const [notifications, setNotifications] = useState<Notification[]>([
        {
            id: '1',
            type: 'swap',
            title: 'New Swap Request',
            message: 'Sarah Wilson wants to swap UI/UX Design for your React Development skills.',
            timestamp: '2 hours ago',
            isRead: false,
            avatar: 'SW',
            userName: 'Sarah Wilson',
            link: '/swaps'
        },
        {
            id: '2',
            type: 'like',
            title: 'Post Liked',
            message: 'Mike Chen liked your skill swap post.',
            timestamp: '5 hours ago',
            isRead: false,
            avatar: 'MC',
            userName: 'Mike Chen',
            link: '/home'
        },
        {
            id: '3',
            type: 'message',
            title: 'New Message',
            message: 'You have a new message from Emma Davis.',
            timestamp: '1 day ago',
            isRead: true,
            avatar: 'ED',
            userName: 'Emma Davis',
            link: '/messages'
        },
        {
            id: '4',
            type: 'connection',
            title: 'Connection Request',
            message: 'John Smith wants to connect with you.',
            timestamp: '2 days ago',
            isRead: true,
            avatar: 'JS',
            userName: 'John Smith',
            link: '/profile'
        }
    ]);

    const [filter, setFilter] = useState<'all' | 'unread'>('all');

    const filteredNotifications = filter === 'unread'
        ? notifications.filter(n => !n.isRead)
        : notifications;

    const handleMarkAsRead = (id: string | number) => {
        setNotifications(notifications.map(n =>
            n.id === id ? { ...n, isRead: true } : n
        ));
    };

    const handleMarkAllAsRead = () => {
        setNotifications(notifications.map(n => ({ ...n, isRead: true })));
    };

    const handleDelete = (id: string | number) => {
        setNotifications(notifications.filter(n => n.id !== id));
    };

    const handleClearAll = () => {
        setNotifications([]);
    };

    return (
        <div className="min-h-screen bg-neutral-50 pt-20 pb-12">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-neutral-900 mb-2 flex items-center">
                        <Bell className="w-8 h-8 mr-3 text-primary-600" />
                        Notifications
                    </h1>
                    <p className="text-neutral-600">Stay updated with your activity</p>
                </div>

                {/* Controls */}
                <div className="bg-white rounded-xl shadow-sm p-4 mb-4">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center space-x-2">
                            <button
                                onClick={() => setFilter('all')}
                                className={`px-4 py-2 rounded-lg font-medium transition ${filter === 'all'
                                        ? 'bg-primary-600 text-white'
                                        : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                                    }`}
                            >
                                All ({notifications.length})
                            </button>
                            <button
                                onClick={() => setFilter('unread')}
                                className={`px-4 py-2 rounded-lg font-medium transition ${filter === 'unread'
                                        ? 'bg-primary-600 text-white'
                                        : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                                    }`}
                            >
                                Unread ({notifications.filter(n => !n.isRead).length})
                            </button>
                        </div>

                        <div className="flex items-center space-x-2">
                            {notifications.some(n => !n.isRead) && (
                                <button
                                    onClick={handleMarkAllAsRead}
                                    className="flex items-center space-x-2 px-4 py-2 bg-success-50 text-success-700 rounded-lg hover:bg-success-100 transition font-medium"
                                >
                                    <Check className="w-4 h-4" />
                                    <span>Mark all read</span>
                                </button>
                            )}
                            {notifications.length > 0 && (
                                <button
                                    onClick={handleClearAll}
                                    className="flex items-center space-x-2 px-4 py-2 bg-error-50 text-error-700 rounded-lg hover:bg-error-100 transition font-medium"
                                >
                                    <Trash2 className="w-4 h-4" />
                                    <span>Clear all</span>
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Notifications List */}
                {filteredNotifications.length === 0 ? (
                    <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                        <Bell className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-neutral-700 mb-2">
                            {filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
                        </h3>
                        <p className="text-neutral-500">
                            {filter === 'unread'
                                ? 'You\'re all caught up!'
                                : 'When you get notifications, they\'ll show up here'}
                        </p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {filteredNotifications.map((notification) => (
                            <motion.div
                                key={notification.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={`bg-white rounded-xl shadow-sm p-5 hover:shadow-md transition ${!notification.isRead ? 'border-l-4 border-primary-600' : ''
                                    }`}
                            >
                                <div className="flex items-start space-x-4">
                                    {/* Avatar */}
                                    <div className="flex-shrink-0">
                                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white font-bold">
                                            {notification.avatar}
                                        </div>
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <h3 className="text-base font-semibold text-neutral-900 mb-1">
                                                    {notification.title}
                                                </h3>
                                                <p className="text-sm text-neutral-600 mb-2">
                                                    {notification.message}
                                                </p>
                                                <div className="flex items-center space-x-3 text-xs text-neutral-400">
                                                    <span>{notification.timestamp}</span>
                                                    {notification.userName && (
                                                        <>
                                                            <span>•</span>
                                                            <span>{notification.userName}</span>
                                                        </>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Actions */}
                                            <div className="flex items-center space-x-2 ml-4">
                                                {!notification.isRead && (
                                                    <button
                                                        onClick={() => handleMarkAsRead(notification.id)}
                                                        className="p-2 text-success-600 hover:bg-success-50 rounded-lg transition"
                                                        title="Mark as read"
                                                    >
                                                        <Check className="w-4 h-4" />
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => handleDelete(notification.id)}
                                                    className="p-2 text-error-600 hover:bg-error-50 rounded-lg transition"
                                                    title="Delete"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
