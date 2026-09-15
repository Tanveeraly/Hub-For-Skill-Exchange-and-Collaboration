import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, Users, Clock, Star, CheckCircle2, Layout, Activity, Award, ThumbsUp, Target, AlertCircle, Lightbulb, TrendingDown, X, Download, RefreshCw } from 'lucide-react';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, LineChart, Line, AreaChart, Area } from 'recharts';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

interface AnalyticsData {
    totalSwaps: number;
    activeSwaps: number;
    runningProjects: number;
    totalHours: number;
    totalSessions: number;
    overallProgress: number;
    averageRating: number;
    weeklyActivity: Array<{ startTime: string; _sum: { hoursWorked: number } }>;
}

interface SkillTrend {
    name: string;
    count: number;
}

interface Recommendation {
    type: 'warning' | 'info' | 'success';
    title: string;
    message: string;
    icon: any;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function AnalyticsDashboard() {
    const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
    const [trends, setTrends] = useState<SkillTrend[]>([]);
    const [loading, setLoading] = useState(true);
    const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
    const [activeModal, setActiveModal] = useState<string | null>(null);
    const [reportBasis, setReportBasis] = useState<'daily' | 'weekly'>('daily');
    const [isDownloading, setIsDownloading] = useState(false);
    const dashboardRef = useRef<HTMLDivElement>(null);

    const fetchData = async () => {
        setLoading(true);
        try {
            const config = { withCredentials: true, timeout: 5000 };
            const [statsRes, trendsRes] = await Promise.allSettled([
                axios.get('https://hub-for-skill-exchange-and-collaboration.onrender.com/api/v1/analytics/user-stats', config),
                axios.get('https://hub-for-skill-exchange-and-collaboration.onrender.com/api/v1/analytics/trends', config)
            ]);

            let data: AnalyticsData;
            if (statsRes.status === 'fulfilled') {
                data = statsRes.value.data.data || statsRes.value.data;
            } else {
                data = {
                    totalSwaps: 12, activeSwaps: 3, runningProjects: 2,
                    totalHours: 45, totalSessions: 18, overallProgress: 68,
                    averageRating: 4.8,
                    weeklyActivity: Array.from({ length: 7 }, (_, i) => ({
                        startTime: new Date(Date.now() - (6 - i) * 86400000).toISOString(),
                        _sum: { hoursWorked: Math.floor(Math.random() * 8) + 2 }
                    }))
                };
            }

            // Deep clone to prevent Immer/freezing issues
            const clonedData = JSON.parse(JSON.stringify(data));
            setAnalytics(clonedData);

            let trendsData: SkillTrend[];
            if (trendsRes.status === 'fulfilled') {
                trendsData = trendsRes.value.data.data || trendsRes.value.data || [];
            } else {
                trendsData = [
                    { name: 'React', count: 15 }, { name: 'TypeScript', count: 12 },
                    { name: 'Node.js', count: 10 }, { name: 'UI/UX', count: 8 },
                    { name: 'Python', count: 6 }
                ];
            }
            const clonedTrends = JSON.parse(JSON.stringify(trendsData));
            setTrends(clonedTrends);

        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        if (analytics) {
            const recs: Recommendation[] = [];
            if (analytics.totalHours < 10) recs.push({ type: 'warning', title: 'Low Activity', message: 'Start a new swap to boost your activity!', icon: TrendingDown });
            if (analytics.averageRating > 0 && analytics.averageRating < 4.0) recs.push({ type: 'info', title: 'Improve Rating', message: 'Be responsive and deliver quality work.', icon: Star });
            if (analytics.activeSwaps === 0) recs.push({ type: 'info', title: 'No Active Swaps', message: 'Browse the marketplace!', icon: Users });
            if (analytics.overallProgress > 0 && analytics.overallProgress < 50) recs.push({ type: 'warning', title: 'Complete Projects', message: 'Finish active projects to build reputation.', icon: CheckCircle2 });
            if (analytics.averageRating >= 4.5 && analytics.totalSwaps > 5) recs.push({ type: 'success', title: 'Excellent!', message: 'You\'re a top performer!', icon: Award });

            const finalRecs = recs.length > 0 ? recs : [{ type: 'info', title: 'Keep it up!', message: 'You are doing great. Check out new opportunities.', icon: ThumbsUp }];
            setRecommendations(finalRecs);
        }
    }, [analytics]);

    const handleDownloadPDF = async () => {
        if (!dashboardRef.current) return;
        setIsDownloading(true);
        try {
            const canvas = await html2canvas(dashboardRef.current, { scale: 2, useCORS: true, logging: false });
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF({ orientation: 'landscape', unit: 'px', format: [canvas.width, canvas.height] });
            pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
            pdf.save(`analytics-report-${reportBasis}-${new Date().toISOString().split('T')[0]}.pdf`);
        } catch (error) {
            console.error('PDF generation failed:', error);
        } finally {
            setIsDownloading(false);
        }
    };

    const renderModalContent = () => {
        if (!activeModal || !analytics) return null;
        switch (activeModal) {
            case 'swaps':
                return (<div className="space-y-4"><div className="flex justify-between p-3 bg-primary-50 rounded-lg"><span className="font-medium">Completed</span><span className="text-2xl font-bold text-primary-600">{analytics.totalSwaps}</span></div><div className="flex justify-between p-3 bg-primary-50 rounded-lg"><span className="font-medium">Active</span><span className="text-2xl font-bold text-primary-600">{analytics.activeSwaps}</span></div></div>);
            case 'projects':
                return (<div className="space-y-4"><div className="flex justify-between p-3 bg-primary-50 rounded-lg"><span className="font-medium">Running</span><span className="text-2xl font-bold text-primary-600">{analytics.runningProjects}</span></div><div className="flex justify-between p-3 bg-accent-50 rounded-lg"><span className="font-medium">Avg Progress</span><span className="text-2xl font-bold text-accent-600">{analytics.overallProgress}%</span></div></div>);
            case 'sessions':
                return (<div className="space-y-4"><div className="flex justify-between p-3 bg-orange-50 rounded-lg"><span className="font-medium">Total Sessions</span><span className="text-2xl font-bold text-orange-600">{analytics.totalSessions}</span></div><div className="flex justify-between p-3 bg-amber-50 rounded-lg"><span className="font-medium">Total Hours</span><span className="text-2xl font-bold text-amber-600">{analytics.totalHours}h</span></div></div>);
            case 'progress':
                return (<div className="space-y-4"><div className="flex justify-between p-3 bg-success-50 rounded-lg"><span className="font-medium">Overall Progress</span><span className="text-2xl font-bold text-success-600">{analytics.overallProgress}%</span></div><div className="w-full bg-neutral-200 rounded-full h-4"><div className="bg-gradient-to-r from-success-500 to-success-500 h-4 rounded-full" style={{ width: `${analytics.overallProgress}%` }}></div></div></div>);
            case 'hours':
                return (<div className="space-y-4"><div className="flex justify-between p-3 bg-accent-50 rounded-lg"><span className="font-medium">Total Hours</span><span className="text-2xl font-bold text-accent-600">{analytics.totalHours}h</span></div></div>);
            case 'rating':
                return (<div className="space-y-4 text-center"><div className="text-6xl font-bold text-warning-600 mb-2">{analytics.averageRating.toFixed(1)}</div><div className="flex justify-center text-warning-500 mb-4">{[...Array(5)].map((_, i) => (<Star key={i} className={`w-6 h-6 ${i < Math.round(analytics.averageRating) ? 'fill-current' : ''}`} />))}</div></div>);
            default: return null;
        }
    };

    const weeklyData = (analytics?.weeklyActivity || []).map(day => ({
        name: new Date(day.startTime).toLocaleDateString(undefined, { weekday: 'short' }),
        hours: day._sum?.hoursWorked || 0
    }));

    const displayWeeklyData = weeklyData.length > 0 ? weeklyData : [
        { name: 'Mon', hours: 0 }, { name: 'Tue', hours: 0 }, { name: 'Wed', hours: 0 },
        { name: 'Thu', hours: 0 }, { name: 'Fri', hours: 0 }, { name: 'Sat', hours: 0 }, { name: 'Sun', hours: 0 }
    ];

    const skillsData = trends.slice(0, 5).map(skill => ({
        name: skill.name,
        value: skill.count
    }));

    const engagementTrend = [
        { name: 'Week 1', score: 65 },
        { name: 'Week 2', score: 72 },
        { name: 'Week 3', score: 68 },
        { name: 'Week 4', score: 85 },
    ];

    if (loading && !analytics) return (<div className="min-h-screen bg-neutral-50 flex items-center justify-center pt-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div></div>);

    return (
        <div className="min-h-screen bg-neutral-50 pt-20 pb-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto" ref={dashboardRef}>
                {/* Header Actions */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                    <div className="flex items-center space-x-2 bg-white p-1 rounded-xl shadow-sm border border-neutral-200">
                        <button onClick={() => setReportBasis('daily')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${reportBasis === 'daily' ? 'bg-primary-600 text-white shadow-md' : 'text-neutral-600 hover:bg-neutral-50'}`}>Daily</button>
                        <button onClick={() => setReportBasis('weekly')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${reportBasis === 'weekly' ? 'bg-primary-600 text-white shadow-md' : 'text-neutral-600 hover:bg-neutral-50'}`}>Weekly</button>
                    </div>
                    <div className="flex items-center gap-3">
                        <button onClick={fetchData} className="p-2 text-neutral-600 hover:bg-white hover:shadow-sm rounded-lg transition-all border border-transparent hover:border-neutral-200"><RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} /></button>
                        <button onClick={handleDownloadPDF} disabled={isDownloading} className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors shadow-sm disabled:opacity-70">
                            {isDownloading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div> : <Download className="w-4 h-4 mr-2" />}
                            Download {reportBasis === 'daily' ? 'Daily' : 'Weekly'} Report
                        </button>
                    </div>
                </div>

                {/* Recommendations */}
                {recommendations.length > 0 && (
                    <div className="mb-8">
                        <h2 className="text-lg font-bold text-neutral-900 mb-4 flex items-center"><Lightbulb className="w-5 h-5 mr-2 text-warning-500" />Personalized Recommendations</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {recommendations.map((rec, idx) => (
                                <motion.div key={idx} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }} className={`p-4 rounded-xl border ${rec.type === 'warning' ? 'bg-orange-50 border-orange-100' : rec.type === 'success' ? 'bg-success-50 border-success-100' : 'bg-primary-50 border-primary-100'}`}>
                                    <div className="flex items-start">
                                        <rec.icon className={`w-5 h-5 mr-3 mt-0.5 ${rec.type === 'warning' ? 'text-orange-600' : rec.type === 'success' ? 'text-success-600' : 'text-primary-600'}`} />
                                        <div><h3 className="font-bold text-neutral-900 mb-1 text-sm">{rec.title}</h3><p className="text-xs text-neutral-700 leading-relaxed">{rec.message}</p></div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
                    {[
                        { label: 'Total Swaps', value: analytics?.totalSwaps || 0, icon: Users, bg: 'from-primary-500 to-secondary-500', type: 'swaps' },
                        { label: 'Active Projects', value: analytics?.runningProjects || 0, icon: Activity, bg: 'from-primary-500 to-accent-500', type: 'projects' },
                        { label: 'Sessions', value: analytics?.totalSessions || 0, icon: Layout, bg: 'from-orange-500 to-amber-500', type: 'sessions' },
                        { label: 'Progress', value: `${analytics?.overallProgress || 0}%`, icon: CheckCircle2, bg: 'from-success-500 to-success-500', type: 'progress' },
                        { label: 'Total Hours', value: analytics?.totalHours || 0, icon: Clock, bg: 'from-accent-500 to-error-500', type: 'hours' },
                        { label: 'Avg Rating', value: (analytics?.averageRating || 0).toFixed(1), icon: Star, bg: 'from-warning-500 to-orange-500', type: 'rating' }
                    ].map((stat, idx) => (
                        <motion.div key={idx} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: idx * 0.05 }} whileHover={{ scale: 1.02 }} onClick={() => setActiveModal(stat.type)} className="bg-white p-4 rounded-xl shadow-sm border border-neutral-100 relative overflow-hidden cursor-pointer group">
                            <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity"><stat.icon className="w-12 h-12 text-neutral-900" /></div>
                            <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${stat.bg} flex items-center justify-center mb-3 shadow-sm`}><stat.icon className="w-5 h-5 text-white" /></div>
                            <h3 className="text-2xl font-bold text-neutral-900">{stat.value}</h3>
                            <p className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider mt-1">{stat.label}</p>
                        </motion.div>
                    ))}
                </div>

                {/* Charts Section */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-neutral-100 lg:col-span-2 min-h-[400px]">
                        <h3 className="text-lg font-bold text-neutral-900 mb-6 flex items-center"><Clock className="w-5 h-5 mr-2 text-primary-600" />Activity Overview</h3>
                        <div className="h-72 w-full">
                            <ResponsiveContainer width="100%" height="100%" key={`bar-${displayWeeklyData.length}`}>
                                <BarChart data={displayWeeklyData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} dy={10} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} />
                                    <Tooltip cursor={{ fill: '#f9fafb' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                    <Bar dataKey="hours" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={30} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-neutral-100 min-h-[400px]">
                        <h3 className="text-lg font-bold text-neutral-900 mb-6 flex items-center"><Target className="w-5 h-5 mr-2 text-accent-600" />Skill Proficiency</h3>
                        <div className="h-72 w-full">
                            <ResponsiveContainer width="100%" height="100%" key={`radar-${skillsData.length}`}>
                                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={skillsData}>
                                    <PolarGrid stroke="#f0f0f0" />
                                    <PolarAngleAxis dataKey="name" tick={{ fill: '#9ca3af', fontSize: 10 }} />
                                    <PolarRadiusAxis angle={30} domain={[0, 20]} tick={false} axisLine={false} />
                                    <Radar name="Skills" dataKey="value" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.6} />
                                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                </RadarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-neutral-100 min-h-[350px]">
                        <h3 className="text-lg font-bold text-neutral-900 mb-6 flex items-center"><TrendingUp className="w-5 h-5 mr-2 text-success-600" />Engagement Trend</h3>
                        <div className="h-64 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={engagementTrend}>
                                    <defs>
                                        <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1} />
                                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 10 }} />
                                    <YAxis hide domain={[0, 100]} />
                                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                    <Area type="monotone" dataKey="score" stroke="#6366f1" fillOpacity={1} fill="url(#colorScore)" strokeWidth={3} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-neutral-100 min-h-[350px]">
                        <h3 className="text-lg font-bold text-neutral-900 mb-6 flex items-center"><Activity className="w-5 h-5 mr-2 text-orange-600" />Market Trends</h3>
                        <div className="h-64 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={skillsData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                                        {skillsData.map((_, index) => (<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />))}
                                    </Pie>
                                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                    <Legend verticalAlign="bottom" height={36} iconType="circle" />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-primary-600 to-primary-700 rounded-2xl p-6 text-white relative overflow-hidden flex flex-col justify-between shadow-lg">
                        <div className="relative z-10">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h2 className="text-xl font-bold mb-1 flex items-center"><Award className="w-5 h-5 mr-2 text-warning-300" />Engagement</h2>
                                    <p className="text-primary-100 text-[10px]">Community activity score</p>
                                </div>
                                <div className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-lg border border-white/30">
                                    <span className="text-xl font-bold">85</span>
                                    <span className="text-xs ml-0.5 opacity-80">/100</span>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div className="bg-white/10 backdrop-blur-sm p-3 rounded-xl border border-white/10">
                                    <div className="flex justify-between text-[10px] mb-1"><span className="text-primary-200 uppercase font-semibold">Response Rate</span><span className="font-bold">98%</span></div>
                                    <div className="w-full bg-white/20 h-1 rounded-full"><div className="bg-success-400 h-1 rounded-full" style={{ width: '98%' }}></div></div>
                                </div>
                                <div className="bg-white/10 backdrop-blur-sm p-3 rounded-xl border border-white/10">
                                    <div className="flex justify-between text-[10px] mb-1"><span className="text-primary-200 uppercase font-semibold">Completion</span><span className="font-bold">92%</span></div>
                                    <div className="w-full bg-white/20 h-1 rounded-full"><div className="bg-warning-400 h-1 rounded-full" style={{ width: '92%' }}></div></div>
                                </div>
                            </div>
                        </div>
                        <div className="absolute top-0 right-0 -mr-10 -mt-10 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
                    </div>
                </div>

                {/* Bottom Section: Activity Log & Reviews */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-neutral-100 lg:col-span-1">
                        <h3 className="text-lg font-bold text-neutral-900 flex items-center mb-4"><TrendingUp className="w-5 h-5 mr-2 text-success-600" />Recent Activity Log</h3>
                        <div className="space-y-4">
                            {analytics?.weeklyActivity && analytics.weeklyActivity.length > 0 ? analytics.weeklyActivity.slice(-5).reverse().map((day, idx) => (
                                <div key={idx} className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg">
                                    <div className="flex items-center">
                                        <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center mr-3"><Clock className="w-4 h-4 text-primary-600" /></div>
                                        <div>
                                            <p className="text-sm font-medium text-neutral-900">{new Date(day.startTime).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}</p>
                                            <p className="text-xs text-neutral-500">Logged session</p>
                                        </div>
                                    </div>
                                    <span className="font-bold text-primary-600 text-sm">{day._sum.hoursWorked}h</span>
                                </div>
                            )) : <p className="text-neutral-500 text-sm text-center py-4">No recent activity logged</p>}
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-neutral-100 lg:col-span-2">
                        <h3 className="text-lg font-bold text-neutral-900 flex items-center mb-4"><Star className="w-5 h-5 mr-2 text-warning-500" />Recent Community Feedback</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {[
                                { user: "Tanveer Ali", rating: 5, comment: "Incredible collaboration on the React project!", date: "2 days ago" },
                                { user: "Basit Ali", rating: 4, comment: "Very professional and skilled in TypeScript.", date: "1 week ago" }
                            ].map((review, idx) => (
                                <div key={idx} className="p-4 rounded-xl bg-neutral-50 border border-neutral-100">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex items-center">
                                            <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center mr-2 text-primary-700 font-bold text-xs">{review.user[0]}</div>
                                            <span className="text-sm font-bold text-neutral-900">{review.user}</span>
                                        </div>
                                        <div className="flex text-warning-400">
                                            {[...Array(review.rating)].map((_, i) => <Star key={i} className="w-3 h-3 fill-current" />)}
                                        </div>
                                    </div>
                                    <p className="text-xs text-neutral-600 italic mb-2">"{review.comment}"</p>
                                    <p className="text-[10px] text-neutral-400">{review.date}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <AnimatePresence>
                {activeModal && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setActiveModal(null)}>
                        <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} onClick={(e) => e.stopPropagation()} className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 relative">
                            <button onClick={() => setActiveModal(null)} className="absolute top-4 right-4 p-2 hover:bg-neutral-100 rounded-full transition-colors"><X className="w-5 h-5 text-neutral-500" /></button>
                            <h2 className="text-xl font-bold text-neutral-900 mb-4 capitalize">{activeModal.replace('-', ' ')} Details</h2>
                            {renderModalContent()}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
