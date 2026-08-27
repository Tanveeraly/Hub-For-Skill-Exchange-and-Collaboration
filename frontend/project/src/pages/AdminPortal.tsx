import { Link } from 'react-router-dom';
import { Shield, Users } from 'lucide-react';
import { useSelector } from 'react-redux';
import { RootState } from '../store/store';

export default function AdminPortal() {
    const { user } = useSelector((state: RootState) => state.auth);

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
            <div className="max-w-2xl w-full bg-white rounded-3xl shadow-xl overflow-hidden p-8 text-center">
                <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Shield className="w-10 h-10 text-blue-600" />
                </div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome back, {user?.name}!</h1>
                <p className="text-gray-500 mb-10">Where would you like to go today?</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Link to="/admin" className="group block p-8 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl text-white hover:shadow-lg hover:shadow-blue-500/30 transition-all hover:-translate-y-1 text-left relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl transition-all group-hover:scale-150" />
                        <div className="relative z-10">
                            <Shield className="w-8 h-8 text-blue-200 mb-4" />
                            <h2 className="text-2xl font-bold mb-2">Admin Panel</h2>
                            <p className="text-blue-100 text-sm opacity-90">Manage users, courses, certifications, portfolios, and system complaints.</p>
                        </div>
                    </Link>

                    <Link to="/home" className="group block p-8 bg-white border border-gray-200 rounded-2xl hover:border-blue-500 hover:shadow-lg transition-all hover:-translate-y-1 text-left">
                        <Users className="w-8 h-8 text-blue-600 mb-4" />
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">User Site</h2>
                        <p className="text-gray-500 text-sm">Access the main SkillHub platform, view your feed, messages, and swaps.</p>
                    </Link>
                </div>
            </div>
        </div>
    );
}
