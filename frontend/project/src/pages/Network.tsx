import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../store/store';
import { fetchPendingRequests, acceptConnectionRequest, rejectConnectionRequest } from '../store/slices/connectionSlice';
import { fetchNotifications } from '../store/slices/notificationsSlice';
import { Check, X, UserPlus, Users } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Network() {
    const dispatch = useDispatch<AppDispatch>();
    const { pendingRequests, loading } = useSelector((state: RootState) => state.connections);

    useEffect(() => {
        dispatch(fetchPendingRequests());
    }, [dispatch]);

    const handleAcceptConnection = async (id: number) => {
        await dispatch(acceptConnectionRequest(id));
        dispatch(fetchNotifications());
    };

    const handleRejectConnection = async (id: number) => {
        await dispatch(rejectConnectionRequest(id));
    };

    return (
        <div className="min-h-screen bg-neutral-50 pt-24 pb-12">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-neutral-900">My Network</h1>
                    <p className="text-neutral-600 mt-2">Manage your connections and pending requests</p>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden">
                    <div className="p-6 border-b border-neutral-200 flex justify-between items-center">
                        <h2 className="text-lg font-semibold text-neutral-900 flex items-center">
                            <UserPlus className="w-5 h-5 mr-2 text-primary-600" />
                            Connection Requests
                            {pendingRequests.length > 0 && (
                                <span className="ml-2 px-2.5 py-0.5 bg-primary-100 text-primary-800 text-xs font-medium rounded-full">
                                    {pendingRequests.length}
                                </span>
                            )}
                        </h2>
                    </div>

                    {loading ? (
                        <div className="p-12 flex justify-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                        </div>
                    ) : pendingRequests.length === 0 ? (
                        <div className="p-12 text-center text-neutral-500">
                            <Users className="w-12 h-12 mx-auto mb-4 text-neutral-300" />
                            <p>No pending connection requests</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-neutral-100">
                            {pendingRequests.map((req) => (
                                <motion.div
                                    key={req.id}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="p-6 flex items-center justify-between hover:bg-neutral-50 transition-colors"
                                >
                                    <div className="flex items-center space-x-4">
                                        {req.sender?.profile?.avatarUrl ? (
                                            <img
                                                src={req.sender.profile.avatarUrl}
                                                alt={req.sender.name}
                                                className="w-12 h-12 rounded-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white font-bold text-lg">
                                                {req.sender?.name?.charAt(0) || 'U'}
                                            </div>
                                        )}
                                        <div>
                                            <h3 className="font-medium text-neutral-900">{req.sender?.name}</h3>
                                        </div>
                                    </div>
                                    <div className="flex space-x-2">
                                        <button
                                            onClick={() => handleAcceptConnection(req.id)}
                                            className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors shadow-sm"
                                        >
                                            <Check className="w-4 h-4 mr-2" />
                                            Accept
                                        </button>
                                        <button
                                            onClick={() => handleRejectConnection(req.id)}
                                            className="flex items-center px-4 py-2 bg-white border border-neutral-300 text-neutral-700 rounded-lg hover:bg-neutral-50 transition-colors"
                                        >
                                            <X className="w-4 h-4 mr-2" />
                                            Ignore
                                        </button>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
