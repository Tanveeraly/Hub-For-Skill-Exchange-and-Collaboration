import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../store/store';
import { motion, AnimatePresence } from 'framer-motion';
import {
    LayoutDashboard, Users, Briefcase, Award, AlertTriangle,
    Search, Trash2, Ban, CheckCircle2, XCircle, Eye,
    ChevronLeft, ChevronRight, Shield, TrendingUp, UserX,
    Clock, FileText, Scale, ShieldAlert, ShieldCheck, ShieldX,
    ArrowUpCircle, CheckCircle, XOctagon, Lock, Unlock,
    CalendarX, MessageSquareWarning, History, BarChart3,
    RefreshCw, ChevronDown, ChevronUp, Filter
} from 'lucide-react';
import {
    fetchAdminOverview, fetchAdminUsers, suspendUserAdmin, deleteUserAdmin,
    fetchAdminPortfolios, deletePortfolioAdmin,
    fetchAdminComplaints, resolveComplaintAdmin, deletePostAdmin,
    fetchAdminJobLogs, fetchAdminCertifications, verifyCertAdmin, deleteCertAdmin
} from '../store/slices/adminSlice';
import {
    fetchAllDisputes, fetchDisputeStats,
    escalateDisputeAdmin, resolveDisputeAdmin
} from '../store/slices/disputeSlice';
import { fetchAllCourses, createCourse, deleteCourse } from '../store/slices/coursesSlice';
import { Plus } from 'lucide-react';

type AdminTab = 'overview' | 'users' | 'portfolios' | 'certifications' | 'complaints' | 'courses' | 'jobs' | 'conflicts';

export default function AdminPanel() {
    const dispatch = useDispatch<AppDispatch>();
    const { overview, users, portfolios, certifications, complaints, jobLogs } = useSelector((s: RootState) => s.admin);
    const { adminDisputes, stats: disputeStats } = useSelector((s: RootState) => s.disputes);
    const currentUser = useSelector((s: RootState) => s.auth.user);
    const [tab, setTab] = useState<AdminTab>('overview');
    const [search, setSearch] = useState('');
    const [certFilter, setCertFilter] = useState('');
    const [complaintFilter, setComplaintFilter] = useState('');
    const [confirmAction, setConfirmAction] = useState<any>(null);
    const [viewDetails, setViewDetails] = useState<{type: 'portfolio' | 'certification', data: any} | null>(null);
    const [showCourseModal, setShowCourseModal] = useState(false);
    const [courseForm, setCourseForm] = useState({ title: '', description: '', level: 'BEGINNER', hours: '', imageUrl: '', skills: '' });

    // ─── Conflict Resolver State ───
    const [disputeFilter, setDisputeFilter] = useState('');
    const [disputePriority, setDisputePriority] = useState('');
    const [selectedDispute, setSelectedDispute] = useState<any>(null);
    const [showResolveModal, setShowResolveModal] = useState(false);
    const [showEscalateModal, setShowEscalateModal] = useState(false);
    const [resolveForm, setResolveForm] = useState({ status: 'RESOLVED', resolution: '', adminNotes: '' });
    const [escalateForm, setEscalateForm] = useState({ adminNotes: '', priority: 'HIGH' });
    const [expandedDispute, setExpandedDispute] = useState<number | null>(null);
    const [conflictActionLoading, setConflictActionLoading] = useState(false);
    
    const { courses } = useSelector((s: RootState) => s.courses);

    useEffect(() => { dispatch(fetchAdminOverview()); }, [dispatch]);
    useEffect(() => {
        switch (tab) {
            case 'users': dispatch(fetchAdminUsers({ search })); break;
            case 'portfolios': dispatch(fetchAdminPortfolios({ search })); break;
            case 'certifications': dispatch(fetchAdminCertifications({ status: certFilter })); break;
            case 'complaints': dispatch(fetchAdminComplaints({ status: complaintFilter })); break;
            case 'courses': dispatch(fetchAllCourses()); break;
            case 'jobs': dispatch(fetchAdminJobLogs({ page: 1 })); break;
            case 'conflicts':
                dispatch(fetchAllDisputes({ status: disputeFilter, priority: disputePriority }));
                dispatch(fetchDisputeStats());
                break;
        }
    }, [tab, dispatch, search, certFilter, complaintFilter, disputeFilter, disputePriority]);

    const tabs = [
        { key: 'overview' as AdminTab, label: 'Overview', icon: LayoutDashboard },
        { key: 'users' as AdminTab, label: 'Users', icon: Users },
        { key: 'portfolios' as AdminTab, label: 'Portfolios', icon: Briefcase },
        { key: 'courses' as AdminTab, label: 'Courses', icon: FileText },
        { key: 'certifications' as AdminTab, label: 'Certificates', icon: Award },
        { key: 'complaints' as AdminTab, label: 'Complaints', icon: AlertTriangle },
        { key: 'conflicts' as AdminTab, label: 'Conflict Resolver', icon: Scale },
        { key: 'jobs' as AdminTab, label: 'Automated Jobs', icon: Clock },
    ];

    const handleConfirm = () => {
        if (!confirmAction) return;
        const { type, id, extra } = confirmAction;
        switch (type) {
            case 'suspendUser': dispatch(suspendUserAdmin(id)); break;
            case 'deleteUser': dispatch(deleteUserAdmin(id)); break;
            case 'deletePortfolio': dispatch(deletePortfolioAdmin(id)); break;
            case 'verifyCert': dispatch(verifyCertAdmin({ certId: id, action: extra })); break;
            case 'deleteCert': dispatch(deleteCertAdmin(id)); break;
            case 'resolveComplaint': dispatch(resolveComplaintAdmin({ complaintId: id, status: extra })); break;
            case 'deleteCourse': dispatch(deleteCourse(id)); break;
            case 'deletePost': dispatch(deletePostAdmin(id)); break;
        }
        setConfirmAction(null);
    };

    // ─── CONFLICT RESOLVER HELPERS ───
    const handleResolveDispute = async () => {
        if (!selectedDispute) return;
        setConflictActionLoading(true);
        await dispatch(resolveDisputeAdmin({
            disputeId: selectedDispute.id,
            status: resolveForm.status,
            resolution: resolveForm.resolution,
            adminNotes: resolveForm.adminNotes
        }));
        setConflictActionLoading(false);
        setShowResolveModal(false);
        setSelectedDispute(null);
        setResolveForm({ status: 'RESOLVED', resolution: '', adminNotes: '' });
        dispatch(fetchDisputeStats());
    };

    const handleEscalateDispute = async () => {
        if (!selectedDispute) return;
        setConflictActionLoading(true);
        await dispatch(escalateDisputeAdmin({
            disputeId: selectedDispute.id,
            adminNotes: escalateForm.adminNotes,
            priority: escalateForm.priority
        }));
        setConflictActionLoading(false);
        setShowEscalateModal(false);
        setSelectedDispute(null);
        setEscalateForm({ adminNotes: '', priority: 'HIGH' });
        dispatch(fetchDisputeStats());
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'OPEN': return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'UNDER_REVIEW': return 'bg-amber-100 text-amber-700 border-amber-200';
            case 'ESCALATED': return 'bg-orange-100 text-orange-700 border-orange-200';
            case 'RESOLVED': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
            case 'DISMISSED': return 'bg-gray-100 text-gray-600 border-gray-200';
            default: return 'bg-gray-100 text-gray-600 border-gray-200';
        }
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'URGENT': return 'bg-red-100 text-red-700';
            case 'HIGH': return 'bg-orange-100 text-orange-700';
            case 'MEDIUM': return 'bg-yellow-100 text-yellow-700';
            case 'LOW': return 'bg-green-100 text-green-700';
            default: return 'bg-gray-100 text-gray-600';
        }
    };

    const getCategoryIcon = (category: string) => {
        switch (category) {
            case 'NO_SHOW': return <CalendarX className="w-4 h-4" />;
            case 'QUALITY_ISSUE': return <ShieldAlert className="w-4 h-4" />;
            case 'PAYMENT': return <Lock className="w-4 h-4" />;
            default: return <MessageSquareWarning className="w-4 h-4" />;
        }
    };

    // ─── OVERVIEW ───
    const renderOverview = () => {
        if (!overview) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" /></div>;
        const stats = [
            { label: 'Total Users', value: overview.totalUsers, icon: Users, color: 'bg-blue-500' },
            { label: 'Active Users', value: overview.activeUsers, icon: CheckCircle2, color: 'bg-emerald-500' },
            { label: 'Suspended', value: overview.suspendedUsers, icon: UserX, color: 'bg-red-500' },
            { label: 'New This Week', value: overview.newUsersThisWeek, icon: TrendingUp, color: 'bg-violet-500' },
            { label: 'Portfolios', value: overview.totalPortfolios, icon: Briefcase, color: 'bg-amber-500' },
            { label: 'Certificates', value: overview.totalCertifications, icon: Award, color: 'bg-cyan-500' },
            { label: 'Pending Certs', value: overview.pendingCertifications, icon: Clock, color: 'bg-orange-500' },
            { label: 'Open Complaints', value: overview.openComplaints, icon: AlertTriangle, color: 'bg-rose-500' },
            { label: 'Total Swaps', value: overview.totalSwaps, icon: FileText, color: 'bg-indigo-500' },
            { label: 'Completed Swaps', value: overview.completedSwaps, icon: CheckCircle2, color: 'bg-teal-500' },
        ];
        return (
            <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Dashboard Overview</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                    {stats.map((s, i) => (
                        <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                            className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                            <div className={`w-10 h-10 ${s.color} rounded-lg flex items-center justify-center mb-3`}>
                                <s.icon className="w-5 h-5 text-white" />
                            </div>
                            <p className="text-2xl font-bold text-gray-900">{s.value}</p>
                            <p className="text-xs text-gray-500 font-medium mt-1">{s.label}</p>
                        </motion.div>
                    ))}
                </div>

                {overview.serverHealth && (
                    <div className="mt-8">
                        <h2 className="text-2xl font-bold text-gray-900 mb-6">Site Health & Infrastructure</h2>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                                <p className="text-sm text-gray-500 font-medium mb-1">Memory Usage</p>
                                <p className="text-xl font-bold text-gray-900">{overview.serverHealth.usedMemoryPercent}</p>
                                <p className="text-xs text-gray-400 mt-1">{overview.serverHealth.freeMemory} free of {overview.serverHealth.totalMemory}</p>
                            </div>
                            <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                                <p className="text-sm text-gray-500 font-medium mb-1">CPU Load</p>
                                <p className="text-xl font-bold text-gray-900">{overview.serverHealth.cpuLoad}</p>
                                <p className="text-xs text-gray-400 mt-1">1-minute load average</p>
                            </div>
                            <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                                <p className="text-sm text-gray-500 font-medium mb-1">Server Uptime</p>
                                <p className="text-xl font-bold text-gray-900">{overview.serverHealth.uptime}</p>
                                <p className="text-xs text-gray-400 mt-1">Continuous operation</p>
                            </div>
                            <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                                <p className="text-sm text-gray-500 font-medium mb-1">Platform</p>
                                <p className="text-xl font-bold text-gray-900 capitalize">{overview.serverHealth.platform}</p>
                                <p className="text-xs text-gray-400 mt-1">{overview.serverHealth.architecture} architecture</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    // ─── USERS ───
    const renderUsers = () => (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Manage Users</h2>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input type="text" placeholder="Search users..." value={search} onChange={(e) => setSearch(e.target.value)}
                        className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                </div>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <table className="w-full">
                    <thead><tr className="bg-gray-50 border-b border-gray-100">
                        {['User', 'Email', 'Role', 'Status', 'Joined', 'Actions'].map(h => (
                            <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{h}</th>
                        ))}
                    </tr></thead>
                    <tbody className="divide-y divide-gray-50">
                        {(users?.users || []).map((u: any) => (
                            <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-4 py-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm">
                                            {u.profile?.avatarUrl ? <img src={u.profile.avatarUrl} className="w-8 h-8 rounded-full object-cover" /> : u.name?.charAt(0)}
                                        </div>
                                        <span className="font-medium text-gray-900 text-sm">{u.name}</span>
                                    </div>
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-600">{u.email}</td>
                                <td className="px-4 py-3"><span className={`px-2 py-1 rounded-md text-xs font-semibold ${u.role === 'ADMIN' ? 'bg-violet-100 text-violet-700' : 'bg-gray-100 text-gray-600'}`}>{u.role}</span></td>
                                <td className="px-4 py-3"><span className={`px-2 py-1 rounded-md text-xs font-semibold ${u.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>{u.status}</span></td>
                                <td className="px-4 py-3 text-sm text-gray-500">{new Date(u.createdAt).toLocaleDateString()}</td>
                                <td className="px-4 py-3">
                                    {u.role !== 'ADMIN' && (
                                        <div className="flex gap-2">
                                            <button onClick={() => setConfirmAction({ type: 'suspendUser', id: u.id, label: `${u.status === 'SUSPENDED' ? 'Reactivate' : 'Suspend'} ${u.name}?` })}
                                                className={`p-1.5 rounded-lg transition-colors ${u.status === 'SUSPENDED' ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100' : 'bg-amber-50 text-amber-600 hover:bg-amber-100'}`}>
                                                <Ban className="w-4 h-4" />
                                            </button>
                                            <button onClick={() => setConfirmAction({ type: 'deleteUser', id: u.id, label: `Delete ${u.name}? This cannot be undone.` })}
                                                className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors"><Trash2 className="w-4 h-4" /></button>
                                        </div>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {(!users?.users || users.users.length === 0) && <p className="text-center py-8 text-gray-400">No users found</p>}
            </div>
        </div>
    );

    // ─── PORTFOLIOS ───
    const renderPortfolios = () => (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Manage Portfolios</h2>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input type="text" placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)}
                        className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {(portfolios?.portfolios || []).map((p: any) => (
                    <div key={p.id} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                        {p.mediaUrl && <img src={p.mediaUrl} className="w-full h-40 object-cover" alt={p.title} />}
                        <div className="p-4">
                            <h3 className="font-bold text-gray-900">{p.title}</h3>
                            <p className="text-sm text-gray-500 mt-1 line-clamp-2">{p.description}</p>
                            <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50">
                                <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-xs font-bold">
                                        {p.user?.name?.charAt(0)}
                                    </div>
                                    <span className="text-xs text-gray-600">{p.user?.name}</span>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => setViewDetails({ type: 'portfolio', data: p })} title="View Details"
                                        className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"><Eye className="w-4 h-4" /></button>
                                    <button onClick={() => setConfirmAction({ type: 'deletePortfolio', id: p.id, label: `Delete portfolio "${p.title}"?` })} title="Delete Portfolio"
                                        className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors"><Trash2 className="w-4 h-4" /></button>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            {(!portfolios?.portfolios || portfolios.portfolios.length === 0) && <p className="text-center py-12 text-gray-400">No portfolios found</p>}
        </div>
    );

    // ─── CERTIFICATIONS ───
    const renderCertifications = () => (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Manage Certificates</h2>
                <div className="flex gap-2">
                    {['', 'PENDING', 'VERIFIED', 'REJECTED'].map(f => (
                        <button key={f} onClick={() => setCertFilter(f)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${certFilter === f ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                            {f || 'All'}
                        </button>
                    ))}
                </div>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <table className="w-full">
                    <thead><tr className="bg-gray-50 border-b border-gray-100">
                        {['Skill', 'User', 'Platform', 'Type', 'Status', 'Issued', 'Actions'].map(h => (
                            <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{h}</th>
                        ))}
                    </tr></thead>
                    <tbody className="divide-y divide-gray-50">
                        {(certifications?.certifications || []).map((c: any) => (
                            <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-4 py-3 font-medium text-gray-900 text-sm">{c.skillName}</td>
                                <td className="px-4 py-3 text-sm text-gray-600">{c.user?.name}</td>
                                <td className="px-4 py-3 text-sm text-gray-600">{c.platformName || c.provider || 'SkillHub'}</td>
                                <td className="px-4 py-3"><span className={`px-2 py-1 rounded-md text-xs font-semibold ${c.swapRequestId ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>{c.swapRequestId ? 'Swap' : 'External'}</span></td>
                                <td className="px-4 py-3">
                                    <span className={`px-2 py-1 rounded-md text-xs font-semibold ${c.verificationStatus === 'VERIFIED' ? 'bg-emerald-100 text-emerald-700' : c.verificationStatus === 'PENDING' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                                        {c.verificationStatus}
                                    </span>
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-500">{new Date(c.issuedAt).toLocaleDateString()}</td>
                                <td className="px-4 py-3">
                                    <div className="flex gap-2">
                                        <button onClick={() => setViewDetails({ type: 'certification', data: c })} title="View Details"
                                            className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 flex items-center gap-1">
                                            <Eye className="w-4 h-4" /><span className="text-xs font-semibold hidden md:inline">View</span>
                                        </button>
                                        {c.verificationStatus === 'PENDING' && (
                                            <>
                                                <button onClick={() => setConfirmAction({ type: 'verifyCert', id: c.id, extra: 'VERIFIED', label: `Verify certificate for "${c.skillName}"?` })} title="Verify"
                                                    className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100"><CheckCircle2 className="w-4 h-4" /></button>
                                                <button onClick={() => setConfirmAction({ type: 'verifyCert', id: c.id, extra: 'REJECTED', label: `Reject certificate for "${c.skillName}"?` })} title="Reject"
                                                    className="p-1.5 rounded-lg bg-amber-50 text-amber-600 hover:bg-amber-100"><XCircle className="w-4 h-4" /></button>
                                            </>
                                        )}
                                        <button onClick={() => setConfirmAction({ type: 'deleteCert', id: c.id, label: `Delete certificate "${c.skillName}"?` })} title="Delete"
                                            className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100"><Trash2 className="w-4 h-4" /></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {(!certifications?.certifications || certifications.certifications.length === 0) && <p className="text-center py-8 text-gray-400">No certificates found</p>}
            </div>
        </div>
    );

    // ─── COURSES ───
    const renderCourses = () => (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Manage Courses</h2>
                <button onClick={() => setShowCourseModal(true)} className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-colors">
                    <Plus className="w-4 h-4 mr-2" />Add Course
                </button>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <table className="w-full">
                    <thead><tr className="bg-gray-50 border-b border-gray-100">
                        {['Title', 'Level', 'Hours', 'Skills', 'Actions'].map(h => (
                            <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{h}</th>
                        ))}
                    </tr></thead>
                    <tbody className="divide-y divide-gray-50">
                        {(courses || []).map((c: any) => (
                            <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-4 py-3 font-medium text-gray-900 text-sm">
                                    <div className="flex items-center">
                                        {c.imageUrl && <img src={c.imageUrl} alt={c.title} className="w-10 h-10 rounded-lg object-cover mr-3" />}
                                        <div>
                                            {c.title}
                                            <p className="text-xs text-gray-500 font-normal">{c.description.slice(0, 50)}...</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-600"><span className="px-2 py-1 bg-gray-100 rounded-md text-xs font-semibold">{c.level}</span></td>
                                <td className="px-4 py-3 text-sm text-gray-600">{c.hours}h</td>
                                <td className="px-4 py-3 text-sm text-gray-600 max-w-[150px] truncate">{c.skills}</td>
                                <td className="px-4 py-3">
                                    <button onClick={() => setConfirmAction({ type: 'deleteCourse', id: c.id, label: `Delete course "${c.title}"?` })}
                                        className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors"><Trash2 className="w-4 h-4" /></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {(!courses || courses.length === 0) && <p className="text-center py-12 text-gray-400">No courses found</p>}
            </div>

            {/* Add Course Modal */}
            {showCourseModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold text-gray-900">Add New Course</h3>
                            <button onClick={() => setShowCourseModal(false)} className="p-2 hover:bg-gray-100 rounded-full"><XCircle className="w-5 h-5 text-gray-400" /></button>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Title</label>
                                <input type="text" value={courseForm.title} onChange={e => setCourseForm({ ...courseForm, title: e.target.value })} className="w-full p-2 border border-gray-200 rounded-lg" />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Description</label>
                                <textarea value={courseForm.description} onChange={e => setCourseForm({ ...courseForm, description: e.target.value })} className="w-full p-2 border border-gray-200 rounded-lg" rows={3}></textarea>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Level</label>
                                    <select value={courseForm.level} onChange={e => setCourseForm({ ...courseForm, level: e.target.value })} className="w-full p-2 border border-gray-200 rounded-lg">
                                        <option value="BEGINNER">Beginner</option>
                                        <option value="INTERMEDIATE">Intermediate</option>
                                        <option value="ADVANCED">Advanced</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Hours</label>
                                    <input type="number" value={courseForm.hours} onChange={e => setCourseForm({ ...courseForm, hours: e.target.value })} className="w-full p-2 border border-gray-200 rounded-lg" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Skills (comma separated)</label>
                                <input type="text" value={courseForm.skills} onChange={e => setCourseForm({ ...courseForm, skills: e.target.value })} placeholder="React, Node, etc." className="w-full p-2 border border-gray-200 rounded-lg" />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Image URL</label>
                                <input type="url" value={courseForm.imageUrl} onChange={e => setCourseForm({ ...courseForm, imageUrl: e.target.value })} className="w-full p-2 border border-gray-200 rounded-lg" />
                            </div>
                            <button onClick={() => {
                                dispatch(createCourse(courseForm));
                                setShowCourseModal(false);
                                setCourseForm({ title: '', description: '', level: 'BEGINNER', hours: '', imageUrl: '', skills: '' });
                            }} disabled={!courseForm.title || !courseForm.hours || !courseForm.skills} className="w-full py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 disabled:opacity-50">
                                Create Course
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );

    // ─── COMPLAINTS ───
    const renderComplaints = () => (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Reports & Complaints</h2>
                <div className="flex gap-2">
                    {['', 'OPEN', 'RESOLVED', 'DISMISSED'].map(f => (
                        <button key={f} onClick={() => setComplaintFilter(f)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${complaintFilter === f ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                            {f || 'All'}
                        </button>
                    ))}
                </div>
            </div>
            <div className="space-y-3">
                {(complaints?.complaints || []).map((c: any) => (
                    <div key={c.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                        <div className="flex justify-between items-start">
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                    <span className={`px-2 py-1 rounded-md text-xs font-semibold ${c.status === 'OPEN' ? 'bg-red-100 text-red-700' : c.status === 'RESOLVED' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}>{c.status}</span>
                                    <span className="text-xs text-gray-400">{new Date(c.createdAt).toLocaleDateString()}</span>
                                </div>
                                <h3 className="font-bold text-gray-900">{c.subject}</h3>
                                <p className="text-sm text-gray-600 mt-1">{c.description}</p>
                                <div className="flex gap-4 mt-3 text-xs text-gray-500">
                                    <span>From: <strong>{c.sender?.name || 'Unknown'}</strong></span>
                                    {c.target && <span>Against: <strong>{c.target?.name}</strong></span>}
                                    {c.post && <span>Post: <strong>{c.post.title}</strong></span>}
                                </div>
                            </div>
                            <div className="flex flex-col gap-2 ml-4 items-end">
                                {c.status === 'OPEN' && (
                                    <div className="flex gap-2">
                                        <button onClick={() => setConfirmAction({ type: 'resolveComplaint', id: c.id, extra: 'RESOLVED', label: 'Mark as resolved?' })}
                                            className="px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-lg text-xs font-semibold hover:bg-emerald-100">Resolve</button>
                                        <button onClick={() => setConfirmAction({ type: 'resolveComplaint', id: c.id, extra: 'DISMISSED', label: 'Dismiss this complaint?' })}
                                            className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-xs font-semibold hover:bg-gray-200">Dismiss</button>
                                    </div>
                                )}
                                {c.post && (
                                    <button onClick={() => setConfirmAction({ type: 'deletePost', id: c.post.id, label: `Delete reported post "${c.post.title}"?` })}
                                        className="px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-xs font-semibold hover:bg-red-100 flex items-center gap-1 mt-1">
                                        <Trash2 className="w-3 h-3" /> Delete Post
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
                {(!complaints?.complaints || complaints.complaints.length === 0) && <p className="text-center py-12 text-gray-400">No complaints found</p>}
            </div>
        </div>
    );

    // ─── AUTOMATED JOBS ───
    const renderJobs = () => (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Automated Jobs Logs</h2>
                <div className="flex gap-2">
                    <span className="text-sm text-gray-500 mt-2">Monitoring server and matching tasks</span>
                </div>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <table className="w-full">
                    <thead><tr className="bg-gray-50 border-b border-gray-100">
                        {['Job Name', 'Status', 'Message', 'Time'].map(h => (
                            <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{h}</th>
                        ))}
                    </tr></thead>
                    <tbody className="divide-y divide-gray-50">
                        {(jobLogs?.logs || []).map((j: any) => (
                            <tr key={j.id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-4 py-4 text-sm font-bold text-gray-900">{j.jobName}</td>
                                <td className="px-4 py-4">
                                    <span className={`px-2 py-1 rounded-md text-xs font-bold ${
                                        j.status === 'SUCCESS' ? 'bg-emerald-100 text-emerald-700' :
                                        j.status === 'WARNING' ? 'bg-amber-100 text-amber-700' :
                                        'bg-red-100 text-red-700'
                                    }`}>
                                        {j.status}
                                    </span>
                                </td>
                                <td className="px-4 py-4 text-sm text-gray-600 max-w-lg break-words">{j.message}</td>
                                <td className="px-4 py-4 text-sm text-gray-500 whitespace-nowrap">{new Date(j.createdAt).toLocaleString()}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {(!jobLogs?.logs || jobLogs.logs.length === 0) && <p className="text-center py-12 text-gray-400">No job logs recorded yet</p>}
            </div>
        </div>
    );

    // ─── CONFLICT RESOLVER TAB ───
    const renderConflicts = () => (
        <div>
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Conflict Resolver</h2>
                    <p className="text-sm text-gray-500 mt-1">Manage swap disputes, escrow confirmations, cancellations & resolution history</p>
                </div>
                <button onClick={() => {
                    dispatch(fetchAllDisputes({ status: disputeFilter, priority: disputePriority }));
                    dispatch(fetchDisputeStats());
                }} className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm font-semibold hover:bg-blue-100 transition-colors">
                    <RefreshCw className="w-4 h-4" /> Refresh
                </button>
            </div>

            {/* Stats Row */}
            {disputeStats && (
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
                    {[
                        { label: 'Total', value: disputeStats.total, icon: BarChart3, color: 'bg-indigo-500', bg: 'bg-indigo-50 border-indigo-100' },
                        { label: 'Open', value: disputeStats.open, icon: ShieldAlert, color: 'bg-blue-500', bg: 'bg-blue-50 border-blue-100' },
                        { label: 'Escalated', value: disputeStats.escalated, icon: ArrowUpCircle, color: 'bg-orange-500', bg: 'bg-orange-50 border-orange-100' },
                        { label: 'Resolved', value: disputeStats.resolved, icon: ShieldCheck, color: 'bg-emerald-500', bg: 'bg-emerald-50 border-emerald-100' },
                        { label: 'Dismissed', value: disputeStats.dismissed, icon: ShieldX, color: 'bg-gray-500', bg: 'bg-gray-50 border-gray-100' },
                    ].map((s, i) => (
                        <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                            className={`rounded-xl p-4 border ${s.bg} flex items-center gap-3`}>
                            <div className={`w-9 h-9 ${s.color} rounded-lg flex items-center justify-center flex-shrink-0`}>
                                <s.icon className="w-4 h-4 text-white" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-gray-900">{s.value}</p>
                                <p className="text-xs text-gray-500 font-medium">{s.label}</p>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Filters */}
            <div className="flex flex-wrap gap-3 mb-5">
                <div className="flex items-center gap-1.5">
                    <Filter className="w-4 h-4 text-gray-400" />
                    <span className="text-xs font-semibold text-gray-500 uppercase">Status:</span>
                </div>
                {['', 'OPEN', 'UNDER_REVIEW', 'ESCALATED', 'RESOLVED', 'DISMISSED'].map(f => (
                    <button key={f} onClick={() => setDisputeFilter(f)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                            disputeFilter === f
                                ? 'bg-blue-600 text-white border-blue-600'
                                : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                        }`}>
                        {f || 'All'}
                    </button>
                ))}
                <div className="flex items-center gap-1.5 ml-4">
                    <span className="text-xs font-semibold text-gray-500 uppercase">Priority:</span>
                </div>
                {['', 'URGENT', 'HIGH', 'MEDIUM', 'LOW'].map(p => (
                    <button key={p} onClick={() => setDisputePriority(p)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                            disputePriority === p
                                ? 'bg-indigo-600 text-white border-indigo-600'
                                : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                        }`}>
                        {p || 'All'}
                    </button>
                ))}
            </div>

            {/* Disputes List */}
            <div className="space-y-3">
                {(adminDisputes?.disputes || []).length === 0 && (
                    <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
                        <Scale className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                        <p className="text-gray-400 font-medium">No disputes found</p>
                        <p className="text-xs text-gray-300 mt-1">Adjust filters to see more results</p>
                    </div>
                )}
                {(adminDisputes?.disputes || []).map((d: any) => {
                    const isExpanded = expandedDispute === d.id;
                    const swap = d.swapRequest;
                    const escrowBoth = swap?.senderConfirmed && swap?.receiverConfirmed;
                    const isActive = ['OPEN', 'UNDER_REVIEW', 'ESCALATED'].includes(d.status);
                    return (
                        <motion.div key={d.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                            className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

                            {/* Card Header */}
                            <div className="p-5">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex flex-wrap items-center gap-2 mb-2">
                                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border ${getStatusColor(d.status)}`}>
                                                {d.status === 'OPEN' && <ShieldAlert className="w-3 h-3" />}
                                                {d.status === 'ESCALATED' && <ArrowUpCircle className="w-3 h-3" />}
                                                {d.status === 'RESOLVED' && <ShieldCheck className="w-3 h-3" />}
                                                {d.status === 'DISMISSED' && <ShieldX className="w-3 h-3" />}
                                                {d.status}
                                            </span>
                                            {d.priority && (
                                                <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${getPriorityColor(d.priority)}`}>
                                                    {d.priority}
                                                </span>
                                            )}
                                            {d.category && (
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-700">
                                                    {getCategoryIcon(d.category)}
                                                    {d.category.replace('_', ' ')}
                                                </span>
                                            )}
                                            <span className="text-xs text-gray-400 ml-auto">#{d.id} · {new Date(d.createdAt).toLocaleDateString()}</span>
                                        </div>
                                        <h3 className="font-bold text-gray-900 text-base leading-snug">{d.subject}</h3>
                                        <p className="text-sm text-gray-500 mt-1 line-clamp-2">{d.description}</p>

                                        {/* Parties */}
                                        <div className="flex flex-wrap gap-4 mt-3 text-xs text-gray-500">
                                            <span className="flex items-center gap-1.5">
                                                <span className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center text-red-600 font-bold text-[10px] flex-shrink-0">
                                                    {d.filedBy?.name?.charAt(0)}
                                                </span>
                                                <span><span className="font-semibold text-gray-700">Filed by:</span> {d.filedBy?.name}</span>
                                            </span>
                                            <span className="flex items-center gap-1.5">
                                                <span className="w-5 h-5 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 font-bold text-[10px] flex-shrink-0">
                                                    {d.against?.name?.charAt(0)}
                                                </span>
                                                <span><span className="font-semibold text-gray-700">Against:</span> {d.against?.name}</span>
                                            </span>
                                            {swap && (
                                                <span className="flex items-center gap-1">
                                                    <FileText className="w-3 h-3" />
                                                    <span><span className="font-semibold text-gray-700">Swap:</span> #{swap.id} — {swap.offeredSkill} ↔ {swap.requestedSkill}</span>
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex flex-col gap-2 flex-shrink-0">
                                        {isActive && (
                                            <>
                                                {d.status !== 'ESCALATED' && (
                                                    <button onClick={() => { setSelectedDispute(d); setShowEscalateModal(true); }}
                                                        className="px-3 py-1.5 bg-orange-50 text-orange-700 border border-orange-200 rounded-lg text-xs font-bold hover:bg-orange-100 transition-colors flex items-center gap-1.5">
                                                        <ArrowUpCircle className="w-3.5 h-3.5" /> Escalate
                                                    </button>
                                                )}
                                                <button onClick={() => { setSelectedDispute(d); setShowResolveModal(true); }}
                                                    className="px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-bold hover:bg-emerald-100 transition-colors flex items-center gap-1.5">
                                                    <CheckCircle className="w-3.5 h-3.5" /> Resolve
                                                </button>
                                            </>
                                        )}
                                        <button onClick={() => setExpandedDispute(isExpanded ? null : d.id)}
                                            className="px-3 py-1.5 bg-gray-50 text-gray-600 border border-gray-200 rounded-lg text-xs font-bold hover:bg-gray-100 transition-colors flex items-center gap-1.5">
                                            <Eye className="w-3.5 h-3.5" /> {isExpanded ? 'Hide' : 'Details'}
                                            {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                                        </button>
                                    </div>
                                </div>

                                {/* Escrow Status Indicator */}
                                {swap && (
                                    <div className="mt-4 flex flex-wrap gap-2">
                                        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border ${
                                            swap.senderConfirmed
                                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                                : 'bg-gray-50 text-gray-500 border-gray-200'
                                        }`}>
                                            {swap.senderConfirmed ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                                            Sender Escrow: {swap.senderConfirmed ? 'Confirmed ✓' : 'Pending'}
                                        </div>
                                        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border ${
                                            swap.receiverConfirmed
                                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                                : 'bg-gray-50 text-gray-500 border-gray-200'
                                        }`}>
                                            {swap.receiverConfirmed ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                                            Receiver Escrow: {swap.receiverConfirmed ? 'Confirmed ✓' : 'Pending'}
                                        </div>
                                        {escrowBoth && (
                                            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                                                <ShieldCheck className="w-3 h-3" /> Mutual Escrow Confirmed
                                            </div>
                                        )}
                                        {swap.cancellationDeadline && (
                                            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                                                <CalendarX className="w-3 h-3" />
                                                Cancel Deadline: {new Date(swap.cancellationDeadline).toLocaleDateString()}
                                            </div>
                                        )}
                                        {swap.cancelledAt && (
                                            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-red-50 text-red-700 border border-red-200">
                                                <XOctagon className="w-3 h-3" /> Swap Cancelled
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Expanded Detail Panel */}
                            <AnimatePresence>
                                {isExpanded && (
                                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                                        className="border-t border-gray-100 overflow-hidden">
                                        <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-5 bg-gray-50/60">

                                            {/* Swap Contract Details */}
                                            {swap && (
                                                <div className="bg-white rounded-xl border border-gray-100 p-4">
                                                    <h4 className="text-xs font-bold text-gray-500 uppercase mb-3 flex items-center gap-1.5">
                                                        <FileText className="w-3.5 h-3.5" /> Swap Contract
                                                    </h4>
                                                    <div className="space-y-2 text-sm">
                                                        <div className="flex justify-between">
                                                            <span className="text-gray-500">Status</span>
                                                            <span className={`px-2 py-0.5 rounded-md text-xs font-bold ${getStatusColor(swap.status)}`}>{swap.status}</span>
                                                        </div>
                                                        <div className="flex justify-between">
                                                            <span className="text-gray-500">Offered Skill</span>
                                                            <span className="font-semibold text-gray-800">{swap.offeredSkill || '—'}</span>
                                                        </div>
                                                        <div className="flex justify-between">
                                                            <span className="text-gray-500">Requested Skill</span>
                                                            <span className="font-semibold text-gray-800">{swap.requestedSkill || '—'}</span>
                                                        </div>
                                                        {swap.scheduledAt && (
                                                            <div className="flex justify-between">
                                                                <span className="text-gray-500">Scheduled</span>
                                                                <span className="font-semibold text-gray-800">{new Date(swap.scheduledAt).toLocaleString()}</span>
                                                            </div>
                                                        )}
                                                        {swap.duration && (
                                                            <div className="flex justify-between">
                                                                <span className="text-gray-500">Duration</span>
                                                                <span className="font-semibold text-gray-800">{swap.duration} min</span>
                                                            </div>
                                                        )}
                                                        {swap.cancellationReason && (
                                                            <div className="mt-2 p-2 bg-red-50 rounded-lg">
                                                                <p className="text-xs font-bold text-red-700 mb-1">Cancellation Reason:</p>
                                                                <p className="text-xs text-red-600">{swap.cancellationReason}</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Evidence & Details */}
                                            <div className="bg-white rounded-xl border border-gray-100 p-4">
                                                <h4 className="text-xs font-bold text-gray-500 uppercase mb-3 flex items-center gap-1.5">
                                                    <MessageSquareWarning className="w-3.5 h-3.5" /> Dispute Details
                                                </h4>
                                                <div className="space-y-2 text-sm">
                                                    {d.evidence && (
                                                        <div>
                                                            <p className="text-xs text-gray-500 font-semibold mb-1">Evidence Submitted:</p>
                                                            <p className="text-xs text-gray-700 bg-gray-50 p-2 rounded-lg">{typeof d.evidence === 'string' ? d.evidence : JSON.stringify(d.evidence, null, 2)}</p>
                                                        </div>
                                                    )}
                                                    {d.adminNotes && (
                                                        <div className="mt-2">
                                                            <p className="text-xs text-gray-500 font-semibold mb-1">Admin Notes:</p>
                                                            <p className="text-xs text-indigo-700 bg-indigo-50 p-2 rounded-lg">{d.adminNotes}</p>
                                                        </div>
                                                    )}
                                                    {d.updatedAt && (
                                                        <div className="flex justify-between text-xs text-gray-400 mt-2">
                                                            <span>Last updated</span>
                                                            <span>{new Date(d.updatedAt).toLocaleString()}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Resolution History */}
                                            {(d.status === 'RESOLVED' || d.status === 'DISMISSED') && (
                                                <div className="md:col-span-2 bg-white rounded-xl border border-gray-100 p-4">
                                                    <h4 className="text-xs font-bold text-gray-500 uppercase mb-3 flex items-center gap-1.5">
                                                        <History className="w-3.5 h-3.5" /> Resolution History
                                                    </h4>
                                                    <div className="flex items-start gap-3">
                                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                                                            d.status === 'RESOLVED' ? 'bg-emerald-100' : 'bg-gray-100'
                                                        }`}>
                                                            {d.status === 'RESOLVED'
                                                                ? <ShieldCheck className="w-4 h-4 text-emerald-600" />
                                                                : <ShieldX className="w-4 h-4 text-gray-500" />
                                                            }
                                                        </div>
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <span className={`text-xs font-bold ${d.status === 'RESOLVED' ? 'text-emerald-700' : 'text-gray-600'}`}>
                                                                    {d.status === 'RESOLVED' ? 'Dispute Resolved' : 'Dispute Dismissed'}
                                                                </span>
                                                                {d.resolvedBy && (
                                                                    <span className="text-xs text-gray-400">by Admin: {d.resolvedBy.name}</span>
                                                                )}
                                                                <span className="text-xs text-gray-400">{new Date(d.updatedAt).toLocaleString()}</span>
                                                            </div>
                                                            {d.resolution && (
                                                                <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg border border-gray-100">{d.resolution}</p>
                                                            )}
                                                            {d.adminNotes && (
                                                                <p className="text-xs text-indigo-600 mt-2 italic">Admin notes: {d.adminNotes}</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    );
                })}
            </div>

            {/* Pagination info */}
            {adminDisputes && adminDisputes.total > 0 && (
                <p className="text-xs text-gray-400 text-center mt-4">
                    Showing {adminDisputes.disputes.length} of {adminDisputes.total} disputes
                </p>
            )}
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50 pt-20">
            <div className="flex">
                {/* Sidebar */}
                <aside className="w-64 min-h-[calc(100vh-5rem)] bg-white border-r border-gray-100 p-4 sticky top-20">
                    <div className="flex items-center gap-3 mb-8 px-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center">
                            <Shield className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h2 className="font-bold text-gray-900">Admin Panel</h2>
                            <p className="text-[10px] text-gray-400 uppercase font-semibold">Management Console</p>
                        </div>
                    </div>
                    <nav className="space-y-1">
                        {tabs.map(t => (
                            <button key={t.key} onClick={() => { setTab(t.key); setSearch(''); }}
                                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${tab === t.key ? 'bg-blue-50 text-blue-700 shadow-sm' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}>
                                <t.icon className="w-4 h-4" />{t.label}
                                {t.key === 'certifications' && overview?.pendingCertifications > 0 && (
                                    <span className="ml-auto bg-amber-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{overview.pendingCertifications}</span>
                                )}
                                {t.key === 'complaints' && overview?.openComplaints > 0 && (
                                    <span className="ml-auto bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{overview.openComplaints}</span>
                                )}
                                {t.key === 'conflicts' && (disputeStats?.open ?? 0) + (disputeStats?.escalated ?? 0) > 0 && (
                                    <span className="ml-auto bg-orange-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                                        {(disputeStats?.open ?? 0) + (disputeStats?.escalated ?? 0)}
                                    </span>
                                )}
                            </button>
                        ))}
                    </nav>
                    <div className="mt-4 pt-4 border-t border-gray-100">
                        <a href="/admin/security"
                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-gray-600 hover:bg-red-50 hover:text-red-700">
                            <ShieldAlert className="w-4 h-4" />Security Dashboard
                        </a>
                    </div>
                </aside>

                {/* Main Content */}
                <main className="flex-1 p-8">
                    <motion.div key={tab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
                        {tab === 'overview' && renderOverview()}
                        {tab === 'users' && renderUsers()}
                        {tab === 'portfolios' && renderPortfolios()}
                        {tab === 'courses' && renderCourses()}
                        {tab === 'certifications' && renderCertifications()}
                        {tab === 'complaints' && renderComplaints()}
                        {tab === 'conflicts' && renderConflicts()}
                        {tab === 'jobs' && renderJobs()}
                    </motion.div>
                </main>
            </div>

            {/* View Details Modal */}
            {viewDetails && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                        className="bg-white rounded-2xl p-6 max-w-2xl w-full shadow-2xl max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-start mb-6 border-b border-gray-100 pb-4">
                            <h3 className="text-xl font-bold text-gray-900">
                                {viewDetails.type === 'portfolio' ? 'Portfolio Details' : 'Certificate Details'}
                            </h3>
                            <button onClick={() => setViewDetails(null)} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><XCircle className="w-5 h-5 text-gray-400" /></button>
                        </div>
                        
                        {viewDetails.type === 'portfolio' && (
                            <div className="space-y-4">
                                {viewDetails.data.mediaUrl && (
                                    <div className="rounded-xl overflow-hidden bg-gray-50 border border-gray-100 mb-4 flex justify-center">
                                        {viewDetails.data.mediaType === 'video' ? (
                                            <video src={viewDetails.data.mediaUrl} controls className="max-w-full max-h-80 object-contain" />
                                        ) : (
                                            <img src={viewDetails.data.mediaUrl} alt={viewDetails.data.title} className="max-w-full max-h-80 object-contain" />
                                        )}
                                    </div>
                                )}
                                <div>
                                    <h4 className="text-lg font-bold text-gray-900 mb-1">{viewDetails.data.title}</h4>
                                    <div className="flex items-center gap-2 mb-4">
                                        <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-xs font-bold">
                                            {viewDetails.data.user?.name?.charAt(0)}
                                        </div>
                                        <span className="text-sm font-medium text-gray-700">{viewDetails.data.user?.name}</span>
                                        <span className="text-xs text-gray-400 ml-2">{new Date(viewDetails.data.createdAt).toLocaleString()}</span>
                                    </div>
                                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                                        <p className="text-sm text-gray-700 whitespace-pre-wrap">{viewDetails.data.description || 'No description provided.'}</p>
                                    </div>
                                    {viewDetails.data.mediaUrl && (
                                        <div className="mt-4 flex justify-end">
                                            <a href={viewDetails.data.mediaUrl} target="_blank" rel="noreferrer" className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 transition-colors">
                                                Open Media Fullscreen
                                            </a>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {viewDetails.type === 'certification' && (
                            <div className="space-y-4">
                                {viewDetails.data.credentialUrl && (
                                    <div className="rounded-xl overflow-hidden bg-gray-50 border border-gray-100 mb-4 flex justify-center">
                                        {viewDetails.data.credentialUrl.toLowerCase().endsWith('.pdf') ? (
                                            <iframe src={viewDetails.data.credentialUrl} className="w-full h-80" title="Certificate PDF" />
                                        ) : (
                                            <img src={viewDetails.data.credentialUrl} alt={viewDetails.data.skillName} className="max-w-full max-h-80 object-contain" />
                                        )}
                                    </div>
                                )}
                                <div>
                                    <h4 className="text-lg font-bold text-gray-900 mb-1">{viewDetails.data.skillName}</h4>
                                    <div className="flex items-center gap-2 mb-4">
                                        <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-xs font-bold">
                                            {viewDetails.data.user?.name?.charAt(0)}
                                        </div>
                                        <span className="text-sm font-medium text-gray-700">{viewDetails.data.user?.name}</span>
                                        <span className="text-xs text-gray-400 ml-2">Issued: {new Date(viewDetails.data.issuedAt).toLocaleDateString()}</span>
                                    </div>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                                        <p className="text-xs text-gray-500 font-semibold mb-1 uppercase">Platform</p>
                                        <p className="font-bold text-gray-900">{viewDetails.data.platformName || viewDetails.data.provider || 'SkillHub'}</p>
                                    </div>
                                    <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                                        <p className="text-xs text-gray-500 font-semibold mb-1 uppercase">Status</p>
                                        <span className={`px-2 py-1 rounded-md text-xs font-semibold ${viewDetails.data.verificationStatus === 'VERIFIED' ? 'bg-emerald-100 text-emerald-700' : viewDetails.data.verificationStatus === 'PENDING' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                                            {viewDetails.data.verificationStatus}
                                        </span>
                                    </div>
                                    {viewDetails.data.credentialId && (
                                        <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 col-span-2">
                                            <p className="text-xs text-gray-500 font-semibold mb-1 uppercase">Credential ID</p>
                                            <p className="font-medium text-gray-900">{viewDetails.data.credentialId}</p>
                                        </div>
                                    )}
                                    {viewDetails.data.description && (
                                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 col-span-2">
                                            <p className="text-xs text-gray-500 font-semibold mb-1 uppercase">Description</p>
                                            <p className="text-sm text-gray-700 whitespace-pre-wrap">{viewDetails.data.description}</p>
                                        </div>
                                    )}
                                </div>
                                
                                {viewDetails.data.credentialUrl && (
                                    <div className="mt-6 border-t border-gray-100 pt-4 flex justify-between items-center">
                                        <p className="text-sm text-gray-600">Document available for review</p>
                                        <a href={viewDetails.data.credentialUrl} target="_blank" rel="noreferrer" className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 transition-colors flex items-center gap-2">
                                            <Eye className="w-4 h-4" /> View Original Document
                                        </a>
                                    </div>
                                )}
                            </div>
                        )}
                    </motion.div>
                </div>
            )}

            {/* Confirm Modal */}
            {confirmAction && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                        className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
                        <h3 className="text-lg font-bold text-gray-900 mb-2">Confirm Action</h3>
                        <p className="text-sm text-gray-600 mb-6">{confirmAction.label}</p>
                        <div className="flex gap-3">
                            <button onClick={() => setConfirmAction(null)} className="flex-1 py-2.5 border border-gray-200 rounded-xl font-medium text-gray-600 hover:bg-gray-50">Cancel</button>
                            <button onClick={handleConfirm} className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700">Confirm</button>
                        </div>
                    </motion.div>
                </div>
            )}

            {/* ─── RESOLVE DISPUTE MODAL ─── */}
            {showResolveModal && selectedDispute && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                        className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl">
                        <div className="flex items-center justify-between mb-5">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                                    <ShieldCheck className="w-5 h-5 text-emerald-600" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900">Resolve Dispute</h3>
                                    <p className="text-xs text-gray-500">#{selectedDispute.id} · {selectedDispute.subject}</p>
                                </div>
                            </div>
                            <button onClick={() => { setShowResolveModal(false); setSelectedDispute(null); }}
                                className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                                <XCircle className="w-5 h-5 text-gray-400" />
                            </button>
                        </div>

                        {/* Parties Summary */}
                        <div className="bg-gray-50 rounded-xl p-3 mb-4 flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                                <span className="w-7 h-7 rounded-full bg-red-100 flex items-center justify-center text-red-600 font-bold text-xs">{selectedDispute.filedBy?.name?.charAt(0)}</span>
                                <span className="font-medium text-gray-700">{selectedDispute.filedBy?.name}</span>
                            </div>
                            <span className="text-gray-400 text-xs font-semibold">vs</span>
                            <div className="flex items-center gap-2">
                                <span className="font-medium text-gray-700">{selectedDispute.against?.name}</span>
                                <span className="w-7 h-7 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 font-bold text-xs">{selectedDispute.against?.name?.charAt(0)}</span>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1.5">Resolution Outcome <span className="text-red-500">*</span></label>
                                <select value={resolveForm.status} onChange={e => setResolveForm({ ...resolveForm, status: e.target.value })}
                                    className="w-full p-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent">
                                    <option value="RESOLVED">✅ Resolved — Dispute settled in favour of filer</option>
                                    <option value="DISMISSED">❌ Dismissed — Dispute found to be invalid</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1.5">Resolution Summary <span className="text-red-500">*</span></label>
                                <textarea value={resolveForm.resolution}
                                    onChange={e => setResolveForm({ ...resolveForm, resolution: e.target.value })}
                                    placeholder="Describe what action was taken and how the dispute was settled..."
                                    className="w-full p-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
                                    rows={3} />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1.5">Admin Notes (internal)</label>
                                <textarea value={resolveForm.adminNotes}
                                    onChange={e => setResolveForm({ ...resolveForm, adminNotes: e.target.value })}
                                    placeholder="Optional internal notes for record keeping..."
                                    className="w-full p-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none bg-indigo-50/40"
                                    rows={2} />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button onClick={() => { setShowResolveModal(false); setSelectedDispute(null); }}
                                    className="flex-1 py-3 border border-gray-200 rounded-xl font-semibold text-gray-600 hover:bg-gray-50 transition-colors">
                                    Cancel
                                </button>
                                <button onClick={handleResolveDispute}
                                    disabled={!resolveForm.resolution || conflictActionLoading}
                                    className="flex-1 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2">
                                    {conflictActionLoading
                                        ? <><RefreshCw className="w-4 h-4 animate-spin" /> Processing...</>
                                        : <><ShieldCheck className="w-4 h-4" /> Confirm Resolution</>
                                    }
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}

            {/* ─── ESCALATE DISPUTE MODAL ─── */}
            {showEscalateModal && selectedDispute && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                        className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl">
                        <div className="flex items-center justify-between mb-5">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
                                    <ArrowUpCircle className="w-5 h-5 text-orange-600" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900">Escalate Dispute</h3>
                                    <p className="text-xs text-gray-500">#{selectedDispute.id} · {selectedDispute.subject}</p>
                                </div>
                            </div>
                            <button onClick={() => { setShowEscalateModal(false); setSelectedDispute(null); }}
                                className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                                <XCircle className="w-5 h-5 text-gray-400" />
                            </button>
                        </div>

                        <div className="bg-orange-50 border border-orange-100 rounded-xl p-3 mb-4">
                            <p className="text-xs text-orange-700 font-semibold">⚠️ Escalating will mark this dispute as high-priority and notify both parties that the case requires urgent attention.</p>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1.5">Escalation Priority</label>
                                <select value={escalateForm.priority} onChange={e => setEscalateForm({ ...escalateForm, priority: e.target.value })}
                                    className="w-full p-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent">
                                    <option value="URGENT">🔴 URGENT — Immediate attention required</option>
                                    <option value="HIGH">🟠 HIGH — Must resolve within 24 hours</option>
                                    <option value="MEDIUM">🟡 MEDIUM — Resolve within 3 days</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1.5">Escalation Reason / Notes <span className="text-red-500">*</span></label>
                                <textarea value={escalateForm.adminNotes}
                                    onChange={e => setEscalateForm({ ...escalateForm, adminNotes: e.target.value })}
                                    placeholder="Explain why this dispute is being escalated and what action is pending..."
                                    className="w-full p-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
                                    rows={3} />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button onClick={() => { setShowEscalateModal(false); setSelectedDispute(null); }}
                                    className="flex-1 py-3 border border-gray-200 rounded-xl font-semibold text-gray-600 hover:bg-gray-50 transition-colors">
                                    Cancel
                                </button>
                                <button onClick={handleEscalateDispute}
                                    disabled={!escalateForm.adminNotes || conflictActionLoading}
                                    className="flex-1 py-3 bg-orange-600 text-white rounded-xl font-bold hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2">
                                    {conflictActionLoading
                                        ? <><RefreshCw className="w-4 h-4 animate-spin" /> Processing...</>
                                        : <><ArrowUpCircle className="w-4 h-4" /> Escalate Dispute</>
                                    }
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
}
