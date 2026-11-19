import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../store/store';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Shield, ShieldAlert, ShieldCheck, ShieldX,
    Search, Filter, Download, FileText, FileJson,
    Users, AlertTriangle, Lock, Eye, Activity,
    ChevronLeft, ChevronRight, RefreshCw, Calendar,
    LogIn, LogOut, UserX, KeyRound, Trash2,
    CheckCircle2, XCircle, Settings, Database,
    TrendingUp, Clock, ChevronDown
} from 'lucide-react';
import {
    fetchSecurityOverview,
    fetchAuditLogs,
    exportAuditLogs,
} from '../store/slices/securitySlice';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import Tabs from '../components/ui/Tabs';

type SecurityTab = 'overview' | 'logs';

const ACTION_OPTIONS = [
    { value: '', label: 'All Actions' },
    { value: 'LOGIN', label: 'Login' },
    { value: 'LOGOUT', label: 'Logout' },
    { value: 'FAILED_LOGIN', label: 'Failed Login' },
    { value: 'PASSWORD_CHANGE', label: 'Password Change' },
    { value: 'ACCOUNT_SUSPENDED', label: 'Account Suspended' },
    { value: 'ACCOUNT_DELETED', label: 'Account Deleted' },
    { value: 'CERT_VERIFIED', label: 'Cert Verified' },
    { value: 'CERT_REJECTED', label: 'Cert Rejected' },
    { value: 'COMPLAINT_RESOLVED', label: 'Complaint Resolved' },
    { value: 'DISPUTE_RESOLVED', label: 'Dispute Resolved' },
    { value: 'POST_DELETED', label: 'Post Deleted' },
    { value: 'PORTFOLIO_DELETED', label: 'Portfolio Deleted' },
    { value: 'ROLE_CHANGE', label: 'Role Change' },
    { value: 'SETTINGS_CHANGE', label: 'Settings Change' },
    { value: 'DATA_EXPORT', label: 'Data Export' },
];

const CATEGORY_OPTIONS = [
    { value: '', label: 'All Categories' },
    { value: 'AUTH', label: 'Authentication' },
    { value: 'USER_MGMT', label: 'User Management' },
    { value: 'CONTENT', label: 'Content' },
    { value: 'SECURITY', label: 'Security' },
    { value: 'SYSTEM', label: 'System' },
];

export default function SecurityDashboard() {
    const dispatch = useDispatch<AppDispatch>();
    const { overview, logs, loading, exportLoading } = useSelector((s: RootState) => s.security);

    const [tab, setTab] = useState<SecurityTab>('overview');
    const [search, setSearch] = useState('');
    const [actionFilter, setActionFilter] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('');
    const [severityFilter, setSeverityFilter] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [page, setPage] = useState(1);
    const [showExportMenu, setShowExportMenu] = useState(false);
    const [showFilters, setShowFilters] = useState(false);

    useEffect(() => {
        dispatch(fetchSecurityOverview());
    }, [dispatch]);

    useEffect(() => {
        if (tab === 'logs') {
            dispatch(fetchAuditLogs({
                search: search || undefined,
                action: actionFilter || undefined,
                category: categoryFilter || undefined,
                severity: severityFilter || undefined,
                startDate: startDate || undefined,
                endDate: endDate || undefined,
                page,
                limit: 20,
            }));
        }
    }, [tab, dispatch, search, actionFilter, categoryFilter, severityFilter, startDate, endDate, page]);

    const getActionIcon = (action: string) => {
        switch (action) {
            case 'LOGIN': return <LogIn className="w-4 h-4" />;
            case 'LOGOUT': return <LogOut className="w-4 h-4" />;
            case 'FAILED_LOGIN': return <ShieldX className="w-4 h-4" />;
            case 'PASSWORD_CHANGE': return <KeyRound className="w-4 h-4" />;
            case 'ACCOUNT_SUSPENDED': return <UserX className="w-4 h-4" />;
            case 'ACCOUNT_DELETED': return <Trash2 className="w-4 h-4" />;
            case 'CERT_VERIFIED': return <CheckCircle2 className="w-4 h-4" />;
            case 'CERT_REJECTED': return <XCircle className="w-4 h-4" />;
            case 'COMPLAINT_RESOLVED': return <ShieldCheck className="w-4 h-4" />;
            case 'DISPUTE_RESOLVED': return <ShieldCheck className="w-4 h-4" />;
            case 'POST_DELETED': return <Trash2 className="w-4 h-4" />;
            case 'PORTFOLIO_DELETED': return <Trash2 className="w-4 h-4" />;
            case 'ROLE_CHANGE': return <Settings className="w-4 h-4" />;
            case 'SETTINGS_CHANGE': return <Settings className="w-4 h-4" />;
            case 'DATA_EXPORT': return <Database className="w-4 h-4" />;
            default: return <Activity className="w-4 h-4" />;
        }
    };

    const getActionColor = (action: string) => {
        switch (action) {
            case 'LOGIN': return 'bg-success-100 text-success-700 border-success-200';
            case 'LOGOUT': return 'bg-primary-100 text-primary-700 border-primary-200';
            case 'FAILED_LOGIN': return 'bg-error-100 text-error-700 border-error-200';
            case 'PASSWORD_CHANGE': return 'bg-warning-100 text-warning-700 border-warning-200';
            case 'ACCOUNT_SUSPENDED': return 'bg-warning-100 text-warning-700 border-warning-200';
            case 'ACCOUNT_DELETED': return 'bg-error-100 text-error-700 border-error-200';
            case 'CERT_VERIFIED': return 'bg-success-100 text-success-700 border-success-200';
            case 'CERT_REJECTED': return 'bg-error-100 text-error-700 border-error-200';
            case 'POST_DELETED': case 'PORTFOLIO_DELETED': return 'bg-error-100 text-error-700 border-error-200';
            default: return 'bg-neutral-100 text-neutral-600 border-neutral-200';
        }
    };

    const getSeverityColor = (severity: string) => {
        switch (severity) {
            case 'CRITICAL': return 'bg-error-100 text-error-700';
            case 'WARNING': return 'bg-warning-100 text-warning-700';
            case 'INFO': return 'bg-primary-100 text-primary-700';
            default: return 'bg-neutral-100 text-neutral-600';
        }
    };

    const getCategoryColor = (category: string) => {
        switch (category) {
            case 'AUTH': return 'bg-primary-500';
            case 'USER_MGMT': return 'bg-primary-500';
            case 'CONTENT': return 'bg-warning-500';
            case 'SECURITY': return 'bg-error-500';
            case 'SYSTEM': return 'bg-neutral-500';
            default: return 'bg-neutral-500';
        }
    };

    const handleExport = (format: 'csv' | 'json') => {
        dispatch(exportAuditLogs({
            format,
            startDate: startDate || undefined,
            endDate: endDate || undefined,
            action: actionFilter || undefined,
            category: categoryFilter || undefined,
        }));
        setShowExportMenu(false);
    };

    const tabs = [
        { key: 'overview' as SecurityTab, label: 'Overview', icon: Shield },
        { key: 'logs' as SecurityTab, label: 'Audit Logs', icon: FileText },
    ];

    // ─── OVERVIEW ───
    const renderOverview = () => {
        if (!overview) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600" /></div>;

        const stats = [
            { label: 'Total Log Entries', value: overview.totalLogs, icon: FileText, color: 'bg-primary-500', desc: 'All recorded events' },
            { label: 'Failed Logins', value: overview.failedLogins, icon: ShieldX, color: 'bg-error-500', desc: 'Last 24 hours' },
            { label: 'Blocked Attacks', value: overview.blockedAttacks, icon: ShieldAlert, color: 'bg-warning-500', desc: 'Last 24 hours' },
            { label: 'Active Users', value: overview.activeUsers, icon: Users, color: 'bg-success-500', desc: 'Currently active' },
        ];

        return (
            <div>
                <p className="mb-6 text-sm text-neutral-600">Sign-in activity and security events across the platform.</p>

                {/* Main Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    {stats.map((s, i) => (
                        <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                            className="bg-white rounded-xl p-5 border border-neutral-100 shadow-sm hover:shadow-md transition-shadow">
                            <div className={`w-10 h-10 ${s.color} rounded-lg flex items-center justify-center mb-3`}>
                                <s.icon className="w-5 h-5 text-white" />
                            </div>
                            <p className="text-2xl font-bold text-neutral-900">{s.value?.toLocaleString() ?? 0}</p>
                            <p className="text-xs text-neutral-500 font-medium mt-1">{s.label}</p>
                            <p className="text-[10px] text-neutral-400 mt-0.5">{s.desc}</p>
                        </motion.div>
                    ))}
                </div>

                {/* Secondary Stats Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                    {/* Critical Events */}
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                        className="bg-white rounded-xl p-5 border border-neutral-100 shadow-sm">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-9 h-9 bg-error-500 rounded-lg flex items-center justify-center">
                                <AlertTriangle className="w-4 h-4 text-white" />
                            </div>
                            <div>
                                <h3 className="font-bold text-neutral-900">Critical Events</h3>
                                <p className="text-xs text-neutral-500">Last 7 days</p>
                            </div>
                        </div>
                        <p className="text-3xl font-bold text-neutral-900">{overview.recentCritical}</p>
                        <p className="text-xs text-neutral-400 mt-1">Requires immediate attention</p>
                    </motion.div>

                    {/* Category Breakdown */}
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
                        className="bg-white rounded-xl p-5 border border-neutral-100 shadow-sm">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-9 h-9 bg-primary-500 rounded-lg flex items-center justify-center">
                                <TrendingUp className="w-4 h-4 text-white" />
                            </div>
                            <div>
                                <h3 className="font-bold text-neutral-900">Logs by Category</h3>
                                <p className="text-xs text-neutral-500">Distribution across categories</p>
                            </div>
                        </div>
                        <div className="space-y-4">
                            {(() => {
                                const totalCategoryCount = (overview.logsByCategory || []).reduce((acc: number, curr: any) => acc + (curr._count?.id || 0), 0) || 1;
                                return (overview.logsByCategory || []).map((cat: any, i: number) => {
                                    const count = cat._count?.id ?? 0;
                                    const percentage = Math.round((count / totalCategoryCount) * 100);
                                    
                                    const barColorClass = (() => {
                                        switch (cat.category) {
                                            case 'AUTH': return 'bg-primary-500';
                                            case 'USER_MGMT': return 'bg-primary-500';
                                            case 'CONTENT': return 'bg-warning-500';
                                            case 'SECURITY': return 'bg-error-500';
                                            case 'SYSTEM': return 'bg-neutral-500';
                                            default: return 'bg-neutral-400';
                                        }
                                    })();

                                    return (
                                        <div key={i} className="space-y-1.5">
                                            <div className="flex items-center justify-between text-xs">
                                                <div className="flex items-center gap-2 font-semibold text-neutral-700">
                                                    <div className={`w-2.5 h-2.5 rounded-full ${barColorClass}`} />
                                                    <span>{cat.category}</span>
                                                </div>
                                                <div className="flex items-center gap-1.5 font-bold text-neutral-900">
                                                    <span>{count}</span>
                                                    <span className="text-neutral-400 font-medium">({percentage}%)</span>
                                                </div>
                                            </div>
                                            <div className="w-full bg-neutral-100 rounded-full h-2">
                                                <div className={`h-2 rounded-full ${barColorClass}`} style={{ width: `${percentage}%` }} />
                                            </div>
                                        </div>
                                    );
                                });
                            })()}
                            {(!overview.logsByCategory || overview.logsByCategory.length === 0) && (
                                <p className="text-xs text-neutral-400 text-center py-4">No data available</p>
                            )}
                        </div>
                    </motion.div>
                </div>

                {/* Activity Timeline */}
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
                    className="bg-white rounded-xl p-5 border border-neutral-100 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-9 h-9 bg-primary-500 rounded-lg flex items-center justify-center">
                            <Activity className="w-4 h-4 text-white" />
                        </div>
                        <div>
                            <h3 className="font-bold text-neutral-900">Activity Timeline</h3>
                            <p className="text-xs text-neutral-500">Events in the last 7 days</p>
                        </div>
                    </div>
                    {overview.logsByDay && overview.logsByDay.length > 0 ? (
                        <div className="h-64 w-full mt-4">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={(overview.logsByDay || []).map((day: any) => {
                                    const dayCount = Number(day.count) || 0;
                                    const dateStr = typeof day.date === 'string' ? day.date : new Date(day.date).toISOString().split('T')[0];
                                    const name = new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short' });
                                    return {
                                        name,
                                        count: dayCount,
                                        date: dateStr
                                    };
                                })} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorSecurityLogs" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis
                                        dataKey="name"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#64748b', fontSize: 11, fontWeight: 500 }}
                                        dy={10}
                                    />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#64748b', fontSize: 11, fontWeight: 500 }}
                                        dx={-10}
                                        allowDecimals={false}
                                    />
                                    <Tooltip
                                        contentStyle={{
                                            borderRadius: '12px',
                                            border: '1px solid #e2e8f0',
                                            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05), 0 2px 4px -2px rgb(0 0 0 / 0.05)',
                                            padding: '10px 14px',
                                            fontFamily: 'Inter, sans-serif'
                                        }}
                                        itemStyle={{ color: '#1e293b', fontSize: '12px', fontWeight: 600 }}
                                        labelStyle={{ color: '#64748b', fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', marginBottom: '4px' }}
                                        formatter={(value: any) => [`${value} Events`, 'Log Entries']}
                                        labelFormatter={(label: string, items: any[]) => {
                                            if (items && items[0]) {
                                                return items[0].payload.date;
                                            }
                                            return label;
                                        }}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="count"
                                        stroke="#3b82f6"
                                        strokeWidth={2.5}
                                        fillOpacity={1}
                                        fill="url(#colorSecurityLogs)"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <div className="flex items-center justify-center h-32 text-neutral-400 text-sm">
                            No activity data for the last 7 days
                        </div>
                    )}
                </motion.div>
            </div>
        );
    };

    // ─── AUDIT LOGS TABLE ───
    const renderLogs = () => (
        <div>
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <p className="text-sm text-neutral-600">Every recorded action. Filter by severity or search by user.</p>
                    <p className="text-sm text-neutral-500 mt-1">Track all system events and user activities</p>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={() => {
                        dispatch(fetchSecurityOverview());
                        dispatch(fetchAuditLogs({ page, limit: 20 }));
                    }} className="flex items-center gap-2 px-4 py-2 bg-primary-50 text-primary-700 rounded-lg text-sm font-semibold hover:bg-primary-100 transition-colors">
                        <RefreshCw className="w-4 h-4" /> Refresh
                    </button>

                    {/* Export Dropdown */}
                    <div className="relative">
                        <button onClick={() => setShowExportMenu(!showExportMenu)}
                            disabled={exportLoading}
                            className="flex items-center gap-2 px-4 py-2 bg-success-600 text-white rounded-lg text-sm font-bold hover:bg-success-700 transition-colors disabled:opacity-50">
                            {exportLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                            Export
                            <ChevronDown className="w-3 h-3" />
                        </button>
                        <AnimatePresence>
                            {showExportMenu && (
                                <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }}
                                    className="absolute right-0 mt-2 w-48 bg-white rounded-xl border border-neutral-100 shadow-lg z-20 overflow-hidden">
                                    <button onClick={() => handleExport('csv')}
                                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-neutral-50 transition-colors text-left">
                                        <FileText className="w-4 h-4 text-success-600" />
                                        <div>
                                            <p className="text-sm font-semibold text-neutral-900">Export CSV</p>
                                            <p className="text-[10px] text-neutral-400">Spreadsheet format</p>
                                        </div>
                                    </button>
                                    <button onClick={() => handleExport('json')}
                                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-neutral-50 transition-colors text-left border-t border-neutral-50">
                                        <FileJson className="w-4 h-4 text-primary-600" />
                                        <div>
                                            <p className="text-sm font-semibold text-neutral-900">Export JSON</p>
                                            <p className="text-[10px] text-neutral-400">Structured data format</p>
                                        </div>
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>

            {/* Search & Filters */}
            <div className="bg-white rounded-xl border border-neutral-100 shadow-sm p-4 mb-5">
                <div className="flex flex-wrap items-center gap-3">
                    {/* Search */}
                    <div className="relative flex-1 min-w-[200px]">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                        <input type="text" placeholder="Search by user name or email..." value={search}
                            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                            className="w-full pl-10 pr-4 py-2.5 border border-neutral-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
                    </div>

                    {/* Toggle Filters */}
                    <button onClick={() => setShowFilters(!showFilters)}
                        className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-semibold border transition-colors ${showFilters ? 'bg-primary-600 text-white border-primary-600' : 'bg-white text-neutral-600 border-neutral-200 hover:bg-neutral-50'}`}>
                        <Filter className="w-4 h-4" /> Filters
                        {(actionFilter || categoryFilter || severityFilter || startDate || endDate) && (
                            <span className="w-2 h-2 bg-error-500 rounded-full" />
                        )}
                    </button>
                </div>

                {/* Expandable Filters */}
                <AnimatePresence>
                    {showFilters && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden">
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-4 pt-4 border-t border-neutral-100">
                                {/* Action Filter */}
                                <div>
                                    <label className="block text-[10px] font-bold text-neutral-500 uppercase mb-1.5">Action</label>
                                    <select value={actionFilter} onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}
                                        className="w-full p-2 border border-neutral-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white">
                                        {ACTION_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                                    </select>
                                </div>

                                {/* Category Filter */}
                                <div>
                                    <label className="block text-[10px] font-bold text-neutral-500 uppercase mb-1.5">Category</label>
                                    <select value={categoryFilter} onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
                                        className="w-full p-2 border border-neutral-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white">
                                        {CATEGORY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                                    </select>
                                </div>

                                {/* Severity Filter */}
                                <div>
                                    <label className="block text-[10px] font-bold text-neutral-500 uppercase mb-1.5">Severity</label>
                                    <select value={severityFilter} onChange={(e) => { setSeverityFilter(e.target.value); setPage(1); }}
                                        className="w-full p-2 border border-neutral-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white">
                                        <option value="">All Severities</option>
                                        <option value="INFO">Info</option>
                                        <option value="WARNING">Warning</option>
                                        <option value="CRITICAL">Critical</option>
                                    </select>
                                </div>

                                {/* Date Range */}
                                <div>
                                    <label className="block text-[10px] font-bold text-neutral-500 uppercase mb-1.5">Start Date</label>
                                    <input type="date" value={startDate} onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
                                        className="w-full p-2 border border-neutral-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-neutral-500 uppercase mb-1.5">End Date</label>
                                    <input type="date" value={endDate} onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
                                        className="w-full p-2 border border-neutral-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
                                </div>
                            </div>

                            {/* Clear Filters */}
                            {(actionFilter || categoryFilter || severityFilter || startDate || endDate) && (
                                <div className="mt-3 flex justify-end">
                                    <button onClick={() => {
                                        setActionFilter(''); setCategoryFilter(''); setSeverityFilter('');
                                        setStartDate(''); setEndDate(''); setPage(1);
                                    }} className="text-xs text-primary-600 font-semibold hover:text-primary-700 transition-colors">
                                        Clear all filters
                                    </button>
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Logs Table */}
            <div className="bg-white rounded-xl border border-neutral-100 shadow-sm overflow-hidden">
                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600" />
                    </div>
                ) : (
                    <>
                        <table className="w-full">
                            <thead>
                                <tr className="bg-neutral-50 border-b border-neutral-100">
                                    {['Action', 'User', 'Description', 'Category', 'Severity', 'IP Address', 'Date'].map(h => (
                                        <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-50">
                                {(logs?.logs || []).map((log: any) => (
                                    <tr key={log.id} className="hover:bg-neutral-50 transition-colors">
                                        <td className="px-4 py-3">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${getActionColor(log.action)}`}>
                                                {getActionIcon(log.action)}
                                                {log.action?.replace(/_/g, ' ')}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            {log.user ? (
                                                <div className="flex items-center gap-2">
                                                    <div className="w-7 h-7 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-bold text-xs">
                                                        {log.user.profile?.avatarUrl
                                                            ? <img src={log.user.profile.avatarUrl} className="w-7 h-7 rounded-full object-cover" />
                                                            : log.user.name?.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-medium text-neutral-900">{log.user.name}</p>
                                                        <p className="text-[10px] text-neutral-400">{log.user.email}</p>
                                                    </div>
                                                </div>
                                            ) : (
                                                <span className="text-xs text-neutral-400 italic">System</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-neutral-600 max-w-[200px] truncate">{log.description || '—'}</td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-1.5">
                                                <div className={`w-2 h-2 rounded-full ${getCategoryColor(log.category)}`} />
                                                <span className="text-xs text-neutral-600 font-medium">{log.category}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`px-2 py-1 rounded-md text-xs font-bold ${getSeverityColor(log.severity)}`}>
                                                {log.severity}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-xs text-neutral-500 font-mono">{log.ipAddress || '—'}</td>
                                        <td className="px-4 py-3">
                                            <div>
                                                <p className="text-xs text-neutral-600 font-medium">{new Date(log.createdAt).toLocaleDateString()}</p>
                                                <p className="text-[10px] text-neutral-400">{new Date(log.createdAt).toLocaleTimeString()}</p>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {(!logs?.logs || logs.logs.length === 0) && (
                            <div className="text-center py-16">
                                <Shield className="w-12 h-12 text-neutral-200 mx-auto mb-3" />
                                <p className="text-neutral-400 font-medium">No audit logs found</p>
                                <p className="text-xs text-neutral-300 mt-1">Adjust filters or check back later</p>
                            </div>
                        )}

                        {/* Pagination */}
                        {logs && logs.total > 0 && (
                            <div className="flex items-center justify-between px-4 py-3 border-t border-neutral-100 bg-neutral-50/50">
                                <p className="text-xs text-neutral-500">
                                    Showing <strong>{((page - 1) * 20) + 1}</strong> to <strong>{Math.min(page * 20, logs.total)}</strong> of <strong>{logs.total}</strong> entries
                                </p>
                                <div className="flex items-center gap-2">
                                    <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}
                                        className="p-2 rounded-lg border border-neutral-200 hover:bg-neutral-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                                        <ChevronLeft className="w-4 h-4 text-neutral-600" />
                                    </button>
                                    <div className="flex items-center gap-1">
                                        {Array.from({ length: Math.min(logs.totalPages, 5) }, (_, i) => {
                                            const startPage = Math.max(1, Math.min(page - 2, logs.totalPages - 4));
                                            const pageNum = startPage + i;
                                            if (pageNum > logs.totalPages) return null;
                                            return (
                                                <button key={pageNum} onClick={() => setPage(pageNum)}
                                                    className={`w-8 h-8 rounded-lg text-xs font-bold transition-colors ${page === pageNum ? 'bg-primary-600 text-white' : 'text-neutral-600 hover:bg-neutral-100'}`}>
                                                    {pageNum}
                                                </button>
                                            );
                                        })}
                                    </div>
                                    <button onClick={() => setPage(p => Math.min(logs.totalPages, p + 1))} disabled={page >= logs.totalPages}
                                        className="p-2 rounded-lg border border-neutral-200 hover:bg-neutral-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                                        <ChevronRight className="w-4 h-4 text-neutral-600" />
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-end justify-between gap-4">
                <Tabs
                    active={tab}
                    onChange={(value) => setTab(value as typeof tab)}
                    items={tabs.map((t) => ({ value: t.key, label: t.label }))}
                />
                {overview && (
                    <dl className="flex gap-6 text-sm">
                        <div className="flex gap-1.5"><dt className="text-neutral-500">Log entries</dt><dd className="font-semibold text-neutral-900">{overview.totalLogs?.toLocaleString()}</dd></div>
                        <div className="flex gap-1.5"><dt className="text-neutral-500">Failed sign-ins (24h)</dt><dd className="font-semibold text-error-700">{overview.failedLogins}</dd></div>
                        <div className="flex gap-1.5"><dt className="text-neutral-500">Critical (7d)</dt><dd className="font-semibold text-warning-700">{overview.recentCritical}</dd></div>
                    </dl>
                )}
            </div>
            <motion.div key={tab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
                        {tab === 'overview' && renderOverview()}
                        {tab === 'logs' && renderLogs()}
                    </motion.div>
        </div>
    );
}
