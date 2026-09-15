import { useState, useEffect, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { RootState, AppDispatch } from '../store/store';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FileText, Award, TrendingUp, Linkedin, ThumbsUp, Download,
    Star, Clock, CheckCircle2, Copy, ChevronRight, Briefcase,
    Users, Target, Shield, ExternalLink, RefreshCw, X,
    BookOpen, Zap, Heart, MessageSquare, MapPin, Globe,
    Plus, GraduationCap, Lock, Image, Link2, AlertCircle,
    QrCode, User
} from 'lucide-react';
import {
    fetchCareerProfile,
    fetchResume,
    fetchCertifications,
    fetchCareerAnalytics,
    fetchLinkedInExport,
    fetchEndorsements,
    submitEndorsement,
    addExternalCertification,
    fetchRecommendations,
} from '../store/slices/careerSlice';
import {
    fetchAllCourses,
    fetchUserRegistrations,
    registerForCourse,
    updateCourseProgress
} from '../store/slices/coursesSlice';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend, RadarChart, Radar, PolarGrid, PolarAngleAxis,
    PolarRadiusAxis, AreaChart, Area, LineChart, Line
} from 'recharts';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import SwapRequestModal from '../components/SwapRequestModal';


const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4'];

type TabType = 'resume' | 'certifications' | 'courses' | 'analytics' | 'linkedin' | 'endorsements' | 'growth';

export default function CareerBooster() {
    const dispatch = useDispatch<AppDispatch>();
    const navigate = useNavigate();
    const { profile, resume, certifications, analytics, linkedIn, endorsements, recommendations, loadingRecommendations, loading } = useSelector((state: RootState) => state.career);
    const { courses, registrations } = useSelector((state: RootState) => state.courses);
    const currentUser = useSelector((state: RootState) => state.auth.user);

    const [activeTab, setActiveTab] = useState<TabType>('resume');
    const [endorseModal, setEndorseModal] = useState<any>(null);
    const [endorseForm, setEndorseForm] = useState({ skillName: '', message: '' });
    const [copySuccess, setCopySuccess] = useState<string | null>(null);
    const [isDownloading, setIsDownloading] = useState(false);
    const [atsMode, setAtsMode] = useState(false);
    const [showExtCertModal, setShowExtCertModal] = useState(false);
    const [extCertForm, setExtCertForm] = useState({ skillName: '', provider: '', credentialUrl: '', hoursLogged: '', certImage: '', platformName: '' });
    const resumeRef = useRef<HTMLDivElement>(null);
    const certRef = useRef<HTMLDivElement>(null);

    const [showSwapModal, setShowSwapModal] = useState(false);
    const [selectedSwapPartner, setSelectedSwapPartner] = useState<any>(null);

    useEffect(() => {
        dispatch(fetchCareerProfile());
    }, [dispatch]);

    useEffect(() => {
        switch (activeTab) {
            case 'resume': dispatch(fetchResume()); break;
            case 'certifications': dispatch(fetchCertifications()); break;
            case 'analytics': dispatch(fetchCareerAnalytics()); break;
            case 'linkedin': dispatch(fetchLinkedInExport()); break;
            case 'endorsements': dispatch(fetchEndorsements()); break;
            case 'courses':
                dispatch(fetchAllCourses());
                dispatch(fetchUserRegistrations());
                break;
            case 'growth':
                dispatch(fetchRecommendations());
                dispatch(fetchUserRegistrations());
                break;
        }
    }, [activeTab, dispatch]);

    const handleDownloadResumePDF = async () => {
        if (!resumeRef.current) return;
        setIsDownloading(true);
        try {
            const canvas = await html2canvas(resumeRef.current, { scale: 2, useCORS: true, logging: false });
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF({ orientation: 'portrait', unit: 'px', format: [canvas.width, canvas.height] });
            pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
            pdf.save(`${resume?.name || 'resume'}-skillswap-resume.pdf`);
        } catch (err) {
            console.error('PDF failed:', err);
        } finally {
            setIsDownloading(false);
        }
    };

    const handleDownloadCertPDF = async (certId: string) => {
        const el = document.getElementById(`cert-${certId}`);
        if (!el) return;
        try {
            const canvas = await html2canvas(el, { scale: 2, useCORS: true, logging: false });
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF({ orientation: 'landscape', unit: 'px', format: [canvas.width, canvas.height] });
            pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
            pdf.save(`certificate-${certId}.pdf`);
        } catch (err) {
            console.error('Cert PDF failed:', err);
        }
    };

    const copyToClipboard = (text: string, label: string) => {
        navigator.clipboard.writeText(text);
        setCopySuccess(label);
        setTimeout(() => setCopySuccess(null), 2000);
    };

    const handleEndorsementSubmit = () => {
        if (!endorseModal || !endorseForm.skillName) return;
        dispatch(submitEndorsement({
            swapRequestId: endorseModal.swapId,
            skillName: endorseForm.skillName,
            message: endorseForm.message || undefined,
        }));
        setEndorseModal(null);
        setEndorseForm({ skillName: '', message: '' });
    };

    const tabs = [
        { key: 'resume' as TabType, label: 'Resume Builder', icon: FileText },
        { key: 'certifications' as TabType, label: 'Certifications', icon: Award },
        { key: 'courses' as TabType, label: 'Courses', icon: GraduationCap },
        { key: 'growth' as TabType, label: 'Growth & Suggestions', icon: Zap },
        { key: 'analytics' as TabType, label: 'Career Analytics', icon: TrendingUp },
        { key: 'linkedin' as TabType, label: 'LinkedIn Export', icon: Linkedin },
        { key: 'endorsements' as TabType, label: 'Endorsements', icon: ThumbsUp },
    ];

    // ─── RESUME TAB (ATS-Friendly) ───
    const renderResume = () => {
        if (!resume) return <LoadingState />;
        return (
            <div className="space-y-6">
                {/* Actions Bar */}
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-bold text-neutral-900">ATS-Friendly Resume</h2>
                        <p className="text-sm text-neutral-500 mt-1">Clean, simple format optimized for applicant tracking systems</p>
                    </div>
                    <button
                        onClick={handleDownloadResumePDF}
                        disabled={isDownloading}
                        className="flex items-center px-5 py-2.5 bg-primary-600 text-white rounded-xl font-bold hover:bg-primary-700 transition-all shadow-lg shadow-primary-200 disabled:opacity-60"
                    >
                        {isDownloading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" /> : <Download className="w-4 h-4 mr-2" />}
                        Download PDF
                    </button>
                </div>

                {/* ATS Resume Preview */}
                <div ref={resumeRef} className="bg-white shadow-xl overflow-hidden mx-auto border border-neutral-200" style={{ fontFamily: 'Inter, Arial, sans-serif', width: '210mm', minHeight: '297mm' }}>
                    {/* Header - Professional Primary Color */}
                    <div className="bg-primary-600 text-white p-10 flex flex-col md:flex-row items-center justify-between gap-8">
                        {/* Profile Picture */}
                        <div className="flex-shrink-0 w-32 h-32 rounded-full border-4 border-white/20 overflow-hidden bg-primary-700 flex items-center justify-center shadow-2xl">
                            {resume.avatarUrl || currentUser?.profile?.avatarUrl ? (
                                <img src={resume.avatarUrl || currentUser?.profile?.avatarUrl} alt="Profile" crossOrigin="anonymous" className="w-full h-full object-cover" />
                            ) : (
                                <User className="w-16 h-16 text-white/50" />
                            )}
                        </div>

                        {/* Middle Content */}
                        <div className="flex-1 text-center">
                            <h1 className="text-4xl font-black tracking-tight uppercase mb-2">{resume.name}</h1>
                            <div className="flex flex-wrap items-center justify-center gap-4 text-primary-100 font-medium text-sm">
                                {(resume.email || currentUser?.email) && <span>{resume.email || currentUser?.email}</span>}
                                {(resume.email || currentUser?.email) && resume.location && <span className="opacity-50">|</span>}
                                {resume.location && <span>{resume.location}</span>}
                                {resume.location && resume.website && <span className="opacity-50">|</span>}
                                {resume.website && <span>{resume.website}</span>}
                            </div>
                        </div>

                        {/* QR Code */}
                        <div className="flex-shrink-0 flex flex-col items-center justify-center bg-white p-3 rounded-xl shadow-2xl">
                            <QRCodeSVG value={`${window.location.origin}/profile/${currentUser?.id}`} size={80} level="M" />
                            <span className="text-[9px] font-bold text-primary-900 uppercase tracking-widest mt-2 border-t border-primary-100 pt-1 w-full text-center">Scan to Verify</span>
                        </div>
                    </div>

                    <div className="p-10 grid grid-cols-3 gap-10 bg-white">
                        {/* Left Column */}
                        <div className="col-span-1 space-y-8 border-r border-neutral-200 pr-8">
                            {/* Skills */}
                            {resume.skills?.length > 0 && (
                                <div>
                                    <h2 className="text-sm font-black text-primary-600 uppercase tracking-widest mb-4 flex items-center">
                                        <span className="w-6 border-t-2 border-primary-600 mr-2"></span> Skills
                                    </h2>
                                    <div className="flex flex-col gap-3 text-sm text-neutral-700">
                                        {resume.skills.map((skill: any, i: number) => (
                                            <div key={i} className="flex flex-col">
                                                <span className="font-bold text-neutral-900">{skill.skillName}</span>
                                                <span className="text-[10px] text-neutral-500 uppercase tracking-widest">{skill.expertiseLevel}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Certifications */}
                            {resume.certifications?.length > 0 && (
                                <div>
                                    <h2 className="text-sm font-black text-primary-600 uppercase tracking-widest mb-4 flex items-center">
                                        <span className="w-6 border-t-2 border-primary-600 mr-2"></span> Certifications
                                    </h2>
                                    <div className="space-y-5">
                                        {resume.certifications.slice(0, 4).map((cert: any, i: number) => (
                                            <div key={i} className="text-sm">
                                                <p className="font-bold text-neutral-900 leading-tight">{cert.skillName}</p>
                                                <p className="text-[11px] text-primary-600 font-bold uppercase tracking-wider my-1">{cert.hoursLogged} hours logged</p>
                                                {cert.partnerVerified && <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider mt-1">✓ Verified</p>}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Right Column */}
                        <div className="col-span-2 space-y-8 pl-2">
                            {/* Professional Summary */}
                            {resume.bio && (
                                <div>
                                    <h2 className="text-sm font-black text-primary-600 uppercase tracking-widest mb-4 flex items-center">
                                        <span className="w-8 border-t-2 border-primary-600 mr-2"></span> Summary
                                    </h2>
                                    <p className="text-sm text-neutral-700 leading-relaxed text-justify">{resume.bio}</p>
                                </div>
                            )}

                            {/* Experience */}
                            {resume.experience?.length > 0 && (
                                <div>
                                    <h2 className="text-sm font-black text-primary-600 uppercase tracking-widest mb-4 flex items-center">
                                        <span className="w-8 border-t-2 border-primary-600 mr-2"></span> Experience
                                    </h2>
                                    <div className="space-y-6">
                                        {resume.experience.map((exp: any, i: number) => (
                                            <div key={i} className="relative pl-5 border-l-2 border-neutral-100">
                                                <div className="absolute w-2.5 h-2.5 bg-primary-600 rounded-full -left-[6px] top-1.5"></div>
                                                <div className="flex justify-between items-baseline mb-1">
                                                    <h3 className="font-bold text-neutral-900 text-base">{exp.role}</h3>
                                                    <span className="text-[10px] font-bold text-primary-600 uppercase tracking-wider bg-primary-50 px-2 py-1 rounded-sm">
                                                        {new Date(exp.completedAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                                                    </span>
                                                </div>
                                                <p className="text-[11px] text-neutral-500 font-bold uppercase tracking-widest mb-2">{exp.hours} hours logged in practical swap sessions</p>
                                                <p className="text-sm text-neutral-700 leading-relaxed text-justify">{exp.description}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Endorsements */}
                            {resume.endorsements?.length > 0 && (
                                <div>
                                    <h2 className="text-sm font-black text-primary-600 uppercase tracking-widest mb-4 flex items-center">
                                        <span className="w-8 border-t-2 border-primary-600 mr-2"></span> Endorsements
                                    </h2>
                                    <div className="space-y-4">
                                        {resume.endorsements.map((end: any, i: number) => (
                                            <div key={i} className="bg-neutral-50 p-5 rounded-xl border border-neutral-100">
                                                <p className="text-sm text-neutral-700 italic mb-3">"{end.message}"</p>
                                                <div className="flex justify-between items-center">
                                                    <span className="text-xs font-bold text-neutral-900">— {end.endorserName}</span>
                                                    <span className="text-[10px] uppercase tracking-wider text-primary-600 font-bold bg-primary-50 px-2 py-1 rounded-sm">{end.skill}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Stats */}
                            <div className="pt-6 mt-6 border-t border-neutral-100">
                                <div className="grid grid-cols-3 gap-4 text-center">
                                    <div className="p-3 bg-primary-50 rounded-lg">
                                        <p className="text-xl font-black text-primary-700">{resume.totalSwaps}</p>
                                        <p className="text-[10px] font-bold text-primary-600 uppercase tracking-widest mt-1">Exchanges</p>
                                    </div>
                                    <div className="p-3 bg-primary-50 rounded-lg">
                                        <p className="text-xl font-black text-primary-700">{resume.totalHours}</p>
                                        <p className="text-[10px] font-bold text-primary-600 uppercase tracking-widest mt-1">Hours Logged</p>
                                    </div>
                                    <div className="p-3 bg-primary-50 rounded-lg">
                                        <p className="text-xl font-black text-primary-700">{resume.averageRating}<span className="text-sm text-primary-500">/5</span></p>
                                        <p className="text-[10px] font-bold text-primary-600 uppercase tracking-widest mt-1">Avg Rating</p>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="text-right pt-4">
                                <p className="text-[10px] text-neutral-400">Generated via Platform · {new Date(resume.generatedAt).toLocaleDateString()}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    // ─── CERTIFICATIONS TAB ───
    const renderCertifications = () => {
        return (
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-bold text-neutral-900">My Certifications</h2>
                        <p className="text-sm text-neutral-500 mt-1">External certificates & platform course completions</p>
                    </div>
                    <button onClick={() => setShowExtCertModal(true)}
                        className="flex items-center px-4 py-2.5 bg-primary-600 text-white rounded-xl font-bold hover:bg-primary-700 transition-all text-sm shadow-lg shadow-primary-200">
                        <Plus className="w-4 h-4 mr-2" />Add External Certificate
                    </button>
                </div>

                {(!certifications || certifications.length === 0) ? (
                    <div className="text-center py-16">
                        <Award className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-neutral-400">No Certifications Yet</h3>
                        <p className="text-neutral-400 mt-2">Add external certificates or complete platform courses</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {certifications.map((cert: any) => {
                            const status = cert.verificationStatus || 'PENDING';
                            return (
                                <div key={cert.id} id={`cert-${cert.certificateId}`} className="relative bg-white border border-neutral-200 rounded-2xl shadow-sm hover:shadow-md transition-shadow flex flex-col overflow-hidden">
                                    <div className="h-2 w-full bg-primary-600"></div>
                                    <div className="p-6 flex-1 flex flex-col">
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="flex items-center">
                                                <div className="w-12 h-12 rounded-xl bg-primary-50 flex items-center justify-center border border-primary-100">
                                                    <Award className="w-6 h-6 text-primary-600" />
                                                </div>
                                            </div>
                                            <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${status === 'VERIFIED' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : status === 'PENDING' ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                                                {status === 'VERIFIED' ? '✓ Verified' : status === 'PENDING' ? '⏳ Pending' : '✗ Rejected'}
                                            </span>
                                        </div>
                                        
                                        <div className="mb-5 flex-1">
                                            <h3 className="text-xl font-black text-neutral-900 mb-1 leading-tight">{cert.skillName}</h3>
                                            <p className="text-sm font-semibold text-primary-600 uppercase tracking-widest">{cert.platformName || 'External Certificate'}</p>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4 mb-5 pt-5 border-t border-neutral-100">
                                            <div>
                                                <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-widest mb-0.5">Provider</p>
                                                <p className="text-sm font-semibold text-neutral-800 truncate">{cert.provider || 'N/A'}</p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-widest mb-0.5">Hours Logged</p>
                                                <p className="text-sm font-semibold text-neutral-800">{cert.hoursLogged ? `${cert.hoursLogged} hrs` : 'N/A'}</p>
                                            </div>
                                        </div>

                                        <div className="flex justify-between items-end bg-neutral-50 p-4 rounded-xl border border-neutral-100">
                                            <div>
                                                <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-widest mb-0.5">Certificate ID</p>
                                                <p className="text-xs font-mono font-medium text-neutral-600">{cert.certificateId?.slice(0, 12)}...</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-widest mb-0.5">Issued</p>
                                                <p className="text-xs font-semibold text-neutral-700">{new Date(cert.issuedAt).toLocaleDateString()}</p>
                                            </div>
                                        </div>

                                        <div className="mt-5 grid grid-cols-2 gap-3">
                                            {cert.credentialUrl ? (
                                                <a href={cert.credentialUrl} target="_blank" rel="noreferrer" 
                                                    className="flex items-center justify-center py-2.5 bg-white border border-primary-200 rounded-xl text-sm font-bold text-primary-600 hover:bg-primary-50 transition-colors shadow-sm">
                                                    <ExternalLink className="w-4 h-4 mr-2" />View
                                                </a>
                                            ) : (
                                                <div className="flex items-center justify-center py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-sm font-bold text-neutral-400 cursor-not-allowed">
                                                    No Link
                                                </div>
                                            )}
                                            <button onClick={() => handleDownloadCertPDF(cert.certificateId)}
                                                className="flex items-center justify-center py-2.5 bg-primary-600 rounded-xl text-sm font-bold text-white hover:bg-primary-700 transition-colors shadow-md shadow-primary-200">
                                                <Download className="w-4 h-4 mr-2" />PDF
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* External Certification Modal */}
                <AnimatePresence>
                    {showExtCertModal && (
                        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                                className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl max-h-[90vh] overflow-y-auto">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-xl font-bold text-neutral-900">Add External Certificate</h3>
                                    <button onClick={() => setShowExtCertModal(false)} className="p-2 hover:bg-neutral-100 rounded-full"><X className="w-5 h-5 text-neutral-400" /></button>
                                </div>
                                <p className="text-sm text-amber-600 bg-amber-50 p-3 rounded-xl mb-4 flex items-start">
                                    <AlertCircle className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                                    External certificates require admin verification before being marked as verified.
                                </p>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-bold text-neutral-700 mb-1">Skill / Certificate Name *</label>
                                        <input type="text" value={extCertForm.skillName} onChange={(e) => setExtCertForm({ ...extCertForm, skillName: e.target.value })}
                                            placeholder="e.g., React Development" className="w-full p-3 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-neutral-700 mb-1">Platform Name</label>
                                        <input type="text" value={extCertForm.platformName} onChange={(e) => setExtCertForm({ ...extCertForm, platformName: e.target.value })}
                                            placeholder="e.g., Coursera, Udemy, freeCodeCamp" className="w-full p-3 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-neutral-700 mb-1">Certificate Link / URL</label>
                                        <input type="url" value={extCertForm.credentialUrl} onChange={(e) => setExtCertForm({ ...extCertForm, credentialUrl: e.target.value })}
                                            placeholder="https://..." className="w-full p-3 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-neutral-700 mb-1">Certificate Image</label>
                                        <input type="file" accept="image/*" onChange={async (e) => {
                                            const file = e.target.files?.[0];
                                            if (file) {
                                                const formData = new FormData();
                                                formData.append('file', file);
                                                try {
                                                    // @ts-ignore - axios might not be imported but let's assume it is or we'll import it
                                                    const res = await axios.post('https://hub-for-skill-exchange-and-collaboration.onrender.com/api/v1/files/upload', formData, { withCredentials: true });
                                                    setExtCertForm({ ...extCertForm, certImage: res.data.data.url });
                                                } catch (err) {
                                                    console.error('Upload failed', err);
                                                }
                                            }
                                        }} className="w-full p-2 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100" />
                                        {extCertForm.certImage && <div className="mt-2 text-xs text-emerald-600 font-semibold flex items-center">✓ Image uploaded successfully</div>}
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-bold text-neutral-700 mb-1">Provider / Issuer</label>
                                            <input type="text" value={extCertForm.provider} onChange={(e) => setExtCertForm({ ...extCertForm, provider: e.target.value })}
                                                placeholder="e.g., Google" className="w-full p-3 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-neutral-700 mb-1">Hours</label>
                                            <input type="number" value={extCertForm.hoursLogged} onChange={(e) => setExtCertForm({ ...extCertForm, hoursLogged: e.target.value })}
                                                placeholder="0" className="w-full p-3 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
                                        </div>
                                    </div>
                                    <div className="flex gap-3 pt-2">
                                        <button onClick={() => setShowExtCertModal(false)} className="flex-1 py-3 border border-neutral-200 rounded-xl font-bold text-neutral-600 hover:bg-neutral-50">Cancel</button>
                                        <button disabled={!extCertForm.skillName} onClick={() => {
                                            dispatch(addExternalCertification({
                                                skillName: extCertForm.skillName,
                                                provider: extCertForm.provider || undefined,
                                                credentialUrl: extCertForm.credentialUrl || undefined,
                                                hoursLogged: extCertForm.hoursLogged ? parseFloat(extCertForm.hoursLogged) : undefined,
                                                certImage: extCertForm.certImage || undefined,
                                                platformName: extCertForm.platformName || undefined,
                                            }));
                                            setShowExtCertModal(false);
                                            setExtCertForm({ skillName: '', provider: '', credentialUrl: '', hoursLogged: '', certImage: '', platformName: '' });
                                        }} className="flex-1 py-3 bg-primary-600 text-white rounded-xl font-bold hover:bg-primary-700 disabled:opacity-50 shadow-lg shadow-primary-200">
                                            Submit for Verification
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>
            </div>
        );
    };

    // ─── CAREER ANALYTICS TAB ───
    const renderAnalytics = () => {
        if (!analytics) return <LoadingState />;

        const skillsData = (analytics.skillsLearned || []).map((s: any) => ({ name: s.name, value: s.count }));
        const hoursData = (analytics.hoursPerSkill || []).map((s: any) => ({ name: s.skill, hours: s.hours }));
        const monthlyData = (analytics.monthlyProgress || []).map((m: any) => ({
            name: m.month?.slice(5) || m.month,
            swaps: m.count
        }));
        const ratingData = (analytics.ratingTrend || []).map((r: any, i: number) => ({
            name: `#${i + 1}`,
            rating: r.rating,
        }));

        return (
            <div className="space-y-6">
                <div>
                    <h2 className="text-xl font-bold text-neutral-900">Career Analytics</h2>
                    <p className="text-sm text-neutral-500 mt-1">Track your learning journey and growth metrics</p>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                        { label: 'Completed Swaps', value: analytics.completedSwaps, icon: CheckCircle2, bg: 'from-success-500 to-success-500' },
                        { label: 'Completion Rate', value: `${analytics.completionRate}%`, icon: Target, bg: 'from-primary-500 to-secondary-500' },
                        { label: 'Total Hours', value: analytics.totalHours, icon: Clock, bg: 'from-accent-500 to-error-500' },
                        { label: 'Avg Rating', value: analytics.averageRating, icon: Star, bg: 'from-warning-500 to-orange-500' },
                    ].map((stat, idx) => (
                        <motion.div key={idx} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: idx * 0.05 }}
                            className="bg-white p-4 rounded-xl shadow-sm border border-neutral-100 relative overflow-hidden"
                        >
                            <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${stat.bg} flex items-center justify-center mb-3 shadow-sm`}>
                                <stat.icon className="w-5 h-5 text-white" />
                            </div>
                            <h3 className="text-2xl font-bold text-neutral-900">{stat.value}</h3>
                            <p className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider mt-1">{stat.label}</p>
                        </motion.div>
                    ))}
                </div>

                {/* Additional Stats Row */}
                <div className="grid grid-cols-3 gap-4">
                    {[
                        { label: 'Active Swaps', value: analytics.activeSwaps, color: 'text-primary-600', bg: 'bg-primary-50' },
                        { label: 'Endorsements', value: analytics.endorsementCount, color: 'text-accent-600', bg: 'bg-accent-50' },
                        { label: 'Certifications', value: analytics.certificationCount, color: 'text-success-600', bg: 'bg-success-50' },
                    ].map((s, i) => (
                        <div key={i} className={`${s.bg} p-4 rounded-xl border border-neutral-100`}>
                            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                            <p className="text-xs text-neutral-500 font-medium mt-1">{s.label}</p>
                        </div>
                    ))}
                </div>

                {/* Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Hours per Skill */}
                    {hoursData.length > 0 && (
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-neutral-100 min-h-[350px]">
                            <h3 className="text-lg font-bold text-neutral-900 mb-4 flex items-center">
                                <Clock className="w-5 h-5 mr-2 text-primary-600" />Hours per Skill
                            </h3>
                            <div className="h-64 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={hoursData}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 11 }} />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 11 }} />
                                        <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                        <Bar dataKey="hours" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={30} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    )}

                    {/* Skills Learned Radar */}
                    {skillsData.length > 0 && (
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-neutral-100 min-h-[350px]">
                            <h3 className="text-lg font-bold text-neutral-900 mb-4 flex items-center">
                                <Target className="w-5 h-5 mr-2 text-accent-600" />Skills Learned
                            </h3>
                            <div className="h-64 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={skillsData}>
                                        <PolarGrid stroke="#f0f0f0" />
                                        <PolarAngleAxis dataKey="name" tick={{ fill: '#9ca3af', fontSize: 10 }} />
                                        <PolarRadiusAxis angle={30} domain={[0, 'auto']} tick={false} axisLine={false} />
                                        <Radar name="Skills" dataKey="value" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.5} />
                                        <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                    </RadarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    )}

                    {/* Monthly Progress */}
                    {monthlyData.length > 0 && (
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-neutral-100 min-h-[350px]">
                            <h3 className="text-lg font-bold text-neutral-900 mb-4 flex items-center">
                                <TrendingUp className="w-5 h-5 mr-2 text-success-600" />Monthly Progress
                            </h3>
                            <div className="h-64 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={monthlyData}>
                                        <defs>
                                            <linearGradient id="colorSwaps" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.1} />
                                                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 10 }} />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 10 }} />
                                        <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                        <Area type="monotone" dataKey="swaps" stroke="#10b981" fillOpacity={1} fill="url(#colorSwaps)" strokeWidth={3} />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    )}

                    {/* Rating Trend */}
                    {ratingData.length > 0 && (
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-neutral-100 min-h-[350px]">
                            <h3 className="text-lg font-bold text-neutral-900 mb-4 flex items-center">
                                <Star className="w-5 h-5 mr-2 text-warning-500" />Rating Trend
                            </h3>
                            <div className="h-64 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={ratingData}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 10 }} />
                                        <YAxis domain={[0, 5]} axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 10 }} />
                                        <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                        <Line type="monotone" dataKey="rating" stroke="#f59e0b" strokeWidth={3} dot={{ fill: '#f59e0b', r: 5 }} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    )}

                    {/* Empty state if no charts */}
                    {hoursData.length === 0 && skillsData.length === 0 && monthlyData.length === 0 && ratingData.length === 0 && (
                        <div className="col-span-2 text-center py-12">
                            <TrendingUp className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
                            <p className="text-neutral-400 font-medium">Complete swaps to see your analytics charts</p>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    // ─── LINKEDIN EXPORT TAB ───
    const renderLinkedIn = () => {
        if (!linkedIn) return <LoadingState />;
        return (
            <div className="space-y-6">
                <div>
                    <h2 className="text-xl font-bold text-neutral-900 flex items-center">
                        <Linkedin className="w-5 h-5 mr-2 text-[#0077B5]" />LinkedIn-Ready Achievements
                    </h2>
                    <p className="text-sm text-neutral-500 mt-1">Copy formatted content directly to your LinkedIn profile</p>
                </div>

                {/* Quick Stats */}
                <div className="bg-gradient-to-r from-[#0077B5] to-[#00a0dc] rounded-2xl p-6 text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl" />
                    <div className="relative z-10 flex gap-6">
                        <div className="bg-white/10 backdrop-blur-sm px-4 py-2 rounded-xl border border-white/20">
                            <p className="text-2xl font-bold">{linkedIn.stats?.totalSwaps || 0}</p>
                            <p className="text-[10px] text-primary-100 uppercase font-semibold">Swaps</p>
                        </div>
                        <div className="bg-white/10 backdrop-blur-sm px-4 py-2 rounded-xl border border-white/20">
                            <p className="text-2xl font-bold">{linkedIn.stats?.totalHours || 0}h</p>
                            <p className="text-[10px] text-primary-100 uppercase font-semibold">Hours</p>
                        </div>
                        <div className="bg-white/10 backdrop-blur-sm px-4 py-2 rounded-xl border border-white/20">
                            <p className="text-2xl font-bold">⭐ {linkedIn.stats?.averageRating || 'N/A'}</p>
                            <p className="text-[10px] text-primary-100 uppercase font-semibold">Rating</p>
                        </div>
                    </div>
                </div>

                {/* Sections */}
                <div className="space-y-4">
                    {/* Headline */}
                    <CopyableSection
                        title="Headline"
                        content={linkedIn.headline || ''}
                        onCopy={copyToClipboard}
                        copySuccess={copySuccess}
                        icon={<Briefcase className="w-4 h-4" />}
                    />

                    {/* Summary */}
                    <CopyableSection
                        title="About / Summary"
                        content={linkedIn.summary || ''}
                        onCopy={copyToClipboard}
                        copySuccess={copySuccess}
                        icon={<FileText className="w-4 h-4" />}
                    />

                    {/* Skills */}
                    <CopyableSection
                        title="Skills"
                        content={linkedIn.skillsList || ''}
                        onCopy={copyToClipboard}
                        copySuccess={copySuccess}
                        icon={<Zap className="w-4 h-4" />}
                    />

                    {/* Experience Entries */}
                    {linkedIn.experienceEntries?.length > 0 && (
                        <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden">
                            <div className="p-4 border-b border-neutral-100 flex items-center justify-between">
                                <h3 className="font-bold text-neutral-900 flex items-center">
                                    <Briefcase className="w-4 h-4 mr-2 text-primary-600" />Experience Entries
                                </h3>
                                <button
                                    onClick={() => {
                                        const text = linkedIn.experienceEntries.map((e: any) =>
                                            `${e.title}\n${e.organization} · ${e.period}\n${e.description}`
                                        ).join('\n\n');
                                        copyToClipboard(text, 'experience');
                                    }}
                                    className={`flex items-center px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${copySuccess === 'experience' ? 'bg-success-100 text-success-700' : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                                        }`}
                                >
                                    {copySuccess === 'experience' ? <CheckCircle2 className="w-3 h-3 mr-1" /> : <Copy className="w-3 h-3 mr-1" />}
                                    {copySuccess === 'experience' ? 'Copied!' : 'Copy All'}
                                </button>
                            </div>
                            <div className="divide-y divide-neutral-100">
                                {linkedIn.experienceEntries.map((exp: any, i: number) => (
                                    <div key={i} className="p-4 hover:bg-neutral-50 transition-colors">
                                        <h4 className="font-bold text-neutral-900">{exp.title}</h4>
                                        <p className="text-sm text-primary-600 font-medium">{exp.organization} · {exp.period}</p>
                                        <p className="text-sm text-neutral-600 mt-1">{exp.description}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Certifications for LinkedIn */}
                    {linkedIn.certEntries?.length > 0 && (
                        <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden">
                            <div className="p-4 border-b border-neutral-100 flex items-center justify-between">
                                <h3 className="font-bold text-neutral-900 flex items-center">
                                    <Award className="w-4 h-4 mr-2 text-warning-600" />Licenses & Certifications
                                </h3>
                                <button
                                    onClick={() => {
                                        const text = linkedIn.certEntries.map((c: any) =>
                                            `${c.name}\n${c.organization} · Issued ${c.issued}\nCredential ID: ${c.credentialId}`
                                        ).join('\n\n');
                                        copyToClipboard(text, 'certs');
                                    }}
                                    className={`flex items-center px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${copySuccess === 'certs' ? 'bg-success-100 text-success-700' : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                                        }`}
                                >
                                    {copySuccess === 'certs' ? <CheckCircle2 className="w-3 h-3 mr-1" /> : <Copy className="w-3 h-3 mr-1" />}
                                    {copySuccess === 'certs' ? 'Copied!' : 'Copy All'}
                                </button>
                            </div>
                            <div className="divide-y divide-neutral-100">
                                {linkedIn.certEntries.map((cert: any, i: number) => (
                                    <div key={i} className="p-4 hover:bg-neutral-50 transition-colors">
                                        <h4 className="font-bold text-neutral-900">{cert.name}</h4>
                                        <p className="text-sm text-primary-600 font-medium">{cert.organization}</p>
                                        <p className="text-xs text-neutral-500 mt-1">Issued {cert.issued} · ID: {cert.credentialId?.slice(0, 12)}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    // ─── ENDORSEMENTS TAB (Blue Theme) ───
    const renderEndorsements = () => {
        const received = endorsements?.endorsements || [];
        const eligible = endorsements?.eligibleForEndorsement || [];

        return (
            <div className="space-y-6">
                <div>
                    <h2 className="text-xl font-bold text-neutral-900">Skill Endorsements</h2>
                    <p className="text-sm text-neutral-500 mt-1">Endorsements from your swap partners</p>
                </div>

                {/* Endorse Partners Section */}
                {eligible.length > 0 && (
                    <div className="bg-gradient-to-r from-blue-50 to-sky-50 rounded-2xl p-6 border border-blue-100">
                        <h3 className="font-bold text-neutral-900 mb-4 flex items-center">
                            <ThumbsUp className="w-5 h-5 mr-2 text-blue-600" />
                            Endorse Your Swap Partners
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {eligible.map((swap: any) => (
                                <div key={swap.swapId} className="bg-white rounded-xl p-4 border border-blue-100 shadow-sm flex items-center justify-between">
                                    <div className="flex items-center">
                                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white font-bold mr-3">
                                            {swap.partnerAvatar ? (
                                                <img src={swap.partnerAvatar} alt="" className="w-full h-full object-cover rounded-xl" />
                                            ) : (
                                                swap.partnerName?.charAt(0)
                                            )}
                                        </div>
                                        <div>
                                            <p className="font-bold text-neutral-900 text-sm">{swap.partnerName}</p>
                                            <p className="text-[10px] text-neutral-500">{swap.offeredSkill} ↔ {swap.requestedSkill}</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setEndorseModal(swap)}
                                        className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-colors shadow-sm"
                                    >
                                        Endorse
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Received Endorsements */}
                {received.length > 0 ? (
                    <div className="space-y-4">
                        <h3 className="font-bold text-neutral-900 flex items-center">
                            <Heart className="w-5 h-5 mr-2 text-blue-500" />
                            Received Endorsements ({received.length})
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {received.map((end: any) => (
                                <motion.div
                                    key={end.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="bg-white rounded-2xl p-5 border border-blue-100 shadow-sm hover:shadow-md transition-shadow"
                                >
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex items-center">
                                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white font-bold mr-3 shadow-sm">
                                                {end.endorser?.profile?.avatarUrl ? (
                                                    <img src={end.endorser.profile.avatarUrl} alt="" className="w-full h-full object-cover rounded-xl" />
                                                ) : (
                                                    end.endorser?.name?.charAt(0)
                                                )}
                                            </div>
                                            <div>
                                                <p className="font-bold text-neutral-900">{end.endorser?.name}</p>
                                                <p className="text-[10px] text-neutral-400">{new Date(end.createdAt).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                        <span className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs font-bold border border-blue-100">
                                            {end.skillName}
                                        </span>
                                    </div>
                                    {end.message && (
                                        <p className="text-sm text-neutral-600 italic bg-blue-50/50 p-3 rounded-xl border border-blue-50">
                                            "{end.message}"
                                        </p>
                                    )}
                                    {end.swapRequest && (
                                        <div className="mt-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                                            <p className="text-xs font-semibold text-slate-600 mb-1">Swap Project Details</p>
                                            <div className="flex items-center gap-3 text-xs text-slate-500">
                                                <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded font-medium">{end.swapRequest.offeredSkill}</span>
                                                <span>↔</span>
                                                <span className="px-2 py-0.5 bg-sky-100 text-sky-700 rounded font-medium">{end.swapRequest.requestedSkill}</span>
                                            </div>
                                            {end.swapRequest.updatedAt && (
                                                <p className="text-[10px] text-slate-400 mt-1.5">Completed: {new Date(end.swapRequest.updatedAt).toLocaleDateString()}</p>
                                            )}
                                        </div>
                                    )}
                                </motion.div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-12">
                        <Heart className="w-16 h-16 text-blue-200 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-neutral-400">No Endorsements Yet</h3>
                        <p className="text-neutral-400 mt-2">Complete swaps to receive endorsements from partners</p>
                    </div>
                )}
            </div>
        );
    };

    // ─── COURSES TAB ───
    const renderCourses = () => {
        return (
            <div className="space-y-6">
                <div>
                    <h2 className="text-xl font-bold text-neutral-900">Platform Courses</h2>
                    <p className="text-sm text-neutral-500 mt-1">Enhance your skills and earn verified certificates</p>
                </div>

                <div className="grid grid-cols-1 gap-6">
                    {/* My Registered Courses */}
                    {registrations?.length > 0 && (
                        <div>
                            <h3 className="text-lg font-bold text-neutral-800 mb-4">My Learning</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {registrations.map((reg: any) => (
                                    <div key={reg.id} className="bg-white rounded-xl border border-neutral-200 flex flex-col group cursor-pointer shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                                        <div className="aspect-video bg-neutral-100 relative overflow-hidden">
                                            {reg.course?.imageUrl ? (
                                                <img src={reg.course.imageUrl} alt={reg.course?.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                                            ) : (
                                                <div className="w-full h-full bg-gradient-to-br from-primary-600 to-primary-800 flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
                                                    <BookOpen className="w-12 h-12 text-white/20" />
                                                </div>
                                            )}
                                            {reg.status === 'COMPLETED' && (
                                                <div className="absolute top-3 left-3 bg-emerald-500 text-white text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wider shadow-sm">
                                                    Completed
                                                </div>
                                            )}
                                        </div>
                                        <div className="p-4 flex-1 flex flex-col">
                                            <h4 className="font-bold text-neutral-900 text-base leading-tight mb-1 line-clamp-2 group-hover:text-primary-600 transition-colors">{reg.course?.title}</h4>
                                            <p className="text-xs text-neutral-500 mb-4">SkillHub Platform</p>
                                            
                                            <div className="mt-auto">
                                                <div className="flex justify-between text-[10px] font-bold text-neutral-500 mb-1.5 uppercase tracking-wider">
                                                    <span>{reg.progress}% Complete</span>
                                                </div>
                                                <div className="w-full bg-neutral-100 rounded-full h-2 mb-4 overflow-hidden">
                                                    <div className={`h-full rounded-full ${reg.progress === 100 ? 'bg-emerald-500' : 'bg-primary-600'}`} style={{ width: `${reg.progress}%` }}></div>
                                                </div>
                                                
                                                {reg.status !== 'COMPLETED' && (
                                                    <div className="flex gap-2">
                                                        <button onClick={() => dispatch(updateCourseProgress({ courseId: reg.courseId, progress: Math.min(100, reg.progress + 20) }))}
                                                            className="flex-1 py-2 border border-primary-600 text-primary-700 rounded-lg text-xs font-bold hover:bg-primary-50 transition-colors">
                                                            Progress (+20%)
                                                        </button>
                                                        {reg.progress >= 80 && (
                                                            <button onClick={() => {
                                                                dispatch(updateCourseProgress({ courseId: reg.courseId, progress: 100 }));
                                                                setTimeout(() => dispatch(fetchCertifications()), 1000);
                                                            }}
                                                                className="flex-1 py-2 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 transition-colors shadow-sm">
                                                                Finish & Get Cert
                                                            </button>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Available Courses */}
                    <div>
                        <h3 className="text-lg font-bold text-neutral-800 mb-4">Available Courses</h3>
                        {courses?.length === 0 ? (
                            <div className="text-center py-10 bg-neutral-50 rounded-xl border border-neutral-100">
                                <p className="text-neutral-500">No courses available at the moment.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {courses?.filter((c: any) => !registrations?.find((r: any) => r.courseId === c.id)).map((course: any) => (
                                    <div key={course.id} className="bg-white border border-neutral-200 hover:border-neutral-300 transition-all flex flex-col cursor-pointer group rounded-xl overflow-hidden shadow-sm hover:shadow-md" style={{ width: '100%' }}>
                                        {/* Cover Image */}
                                        <div className="aspect-video bg-neutral-100 overflow-hidden relative">
                                            {course.imageUrl ? (
                                                <img src={course.imageUrl} alt={course.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                                            ) : (
                                                <div className="w-full h-full bg-gradient-to-br from-primary-600 to-primary-800 flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
                                                    <GraduationCap className="w-12 h-12 text-white/20" />
                                                </div>
                                            )}
                                        </div>
                                        {/* Course Details */}
                                        <div className="p-4 flex-1 flex flex-col">
                                            <h4 className="font-bold text-neutral-900 text-base leading-tight mb-1 line-clamp-2 group-hover:text-primary-600 transition-colors">{course.title}</h4>
                                            <p className="text-xs text-neutral-500 mb-3">SkillHub Platform</p>

                                            <div className="flex gap-2 text-xs text-neutral-500 mb-4">
                                                <span className="flex items-center"><Clock className="w-3.5 h-3.5 mr-1" />{course.hours}h</span>
                                                <span>•</span>
                                                <span className="capitalize">{course.level.toLowerCase()}</span>
                                                <span>•</span>
                                                <span className="truncate">{course.skills.split(',')[0]}</span>
                                            </div>

                                            <div className="mt-auto pt-2">
                                                <button onClick={() => dispatch(registerForCourse(course.id))}
                                                    className="w-full py-2.5 bg-primary-600 text-white rounded-lg text-sm font-bold hover:bg-primary-700 transition-colors shadow-sm">
                                                    Enroll Now
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    // ─── GROWTH & SUGGESTIONS TAB ───
    const renderGrowth = () => {
        if (loadingRecommendations || !recommendations) return <LoadingState />;

        const { collaborationMatches, growthSkills, recommendedCourses, demandTrends } = recommendations;

        // format Recharts data
        const chartData = (demandTrends || []).map((t: any) => ({
            name: t.skill,
            Demand: t.count
        }));

        const handleProposeSwapClick = (partner: any) => {
            setSelectedSwapPartner(partner);
            setShowSwapModal(true);
        };

        return (
            <div className="space-y-8">
                {/* Header */}
                <div>
                    <h2 className="text-2xl font-black text-neutral-900 tracking-tight">Growth & Suggestions</h2>
                    <p className="text-sm text-neutral-500 mt-1">Smart recommendations based on compatibility, trends, and platform courses</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left & Middle: Collaborators & Growth Path */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* 1. Collaboration Matching */}
                        <div className="bg-white rounded-3xl p-6 border border-neutral-200/60 shadow-sm space-y-6">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-black text-neutral-900 flex items-center">
                                    <Users className="w-5 h-5 mr-2 text-primary-600" />
                                    Compatible Collaborators
                                </h3>
                                <span className="text-[10px] uppercase font-black tracking-widest text-primary-600 bg-primary-50 px-2.5 py-1 rounded-md">
                                    Top Mutual Matches
                                </span>
                            </div>

                            {(!collaborationMatches || collaborationMatches.length === 0) ? (
                                <div className="text-center py-10 bg-neutral-50 rounded-2xl border border-neutral-100">
                                    <Users className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
                                    <p className="text-neutral-500 font-medium">No matches found. Try adding more skills to your profile.</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {collaborationMatches.map((match: any) => (
                                        <div key={match.id} className="p-5 bg-neutral-50/50 rounded-2xl border border-neutral-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:shadow-md hover:border-neutral-200/80 transition-all duration-300 group">
                                            <div className="flex items-start gap-4">
                                                {/* Avatar */}
                                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-indigo-600 flex items-center justify-center text-white font-black text-lg shadow-sm flex-shrink-0 relative overflow-hidden">
                                                    {match.avatarUrl ? (
                                                        <img src={match.avatarUrl} alt="" className="w-full h-full object-cover" />
                                                    ) : (
                                                        match.name.charAt(0)
                                                    )}
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <h4 className="font-bold text-neutral-900 group-hover:text-primary-600 transition-colors">{match.name}</h4>
                                                        <span className="px-2 py-0.5 bg-emerald-50 border border-emerald-100 text-emerald-700 text-[10px] font-black rounded-md">
                                                            {match.matchScore}% Match
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-neutral-500 flex items-center mt-1">
                                                        <MapPin className="w-3.5 h-3.5 mr-1 text-neutral-400" />
                                                        {match.location}
                                                    </p>
                                                    
                                                    {/* Explainer */}
                                                    <div className="mt-3 flex flex-wrap gap-2 text-xs">
                                                        <span className="text-neutral-500">
                                                            Offers: <strong className="text-primary-700">{match.theyTeach.join(', ')}</strong>
                                                        </span>
                                                        <span className="text-neutral-300">|</span>
                                                        <span className="text-neutral-500">
                                                            Wants: <strong className="text-success-700">{match.youTeach.join(', ')}</strong>
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Actions */}
                                            <div className="flex items-center gap-2.5 w-full md:w-auto">
                                                <button
                                                    onClick={() => navigate('/messages', { state: { startChatWith: match } })}
                                                    className="flex-1 md:flex-none px-4 py-2.5 bg-white border border-neutral-200 text-neutral-700 rounded-xl text-xs font-bold hover:bg-neutral-50 transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                                                >
                                                    <MessageSquare className="w-3.5 h-3.5" />
                                                    Message
                                                </button>
                                                <button
                                                    onClick={() => handleProposeSwapClick(match)}
                                                    className="flex-1 md:flex-none px-4 py-2.5 bg-primary-600 text-white rounded-xl text-xs font-bold hover:bg-primary-700 hover:shadow-lg hover:shadow-primary-200 transition-all flex items-center justify-center gap-1.5 active:scale-95"
                                                >
                                                    <RefreshCw className="w-3.5 h-3.5" />
                                                    Propose Swap
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* 2. Growth Path & Recommended Courses */}
                        <div className="bg-white rounded-3xl p-6 border border-neutral-200/60 shadow-sm space-y-6">
                            <div>
                                <h3 className="text-lg font-black text-neutral-900 flex items-center">
                                    <GraduationCap className="w-5 h-5 mr-2 text-success-600" />
                                    Learning Integration & Growth Path
                                </h3>
                                <p className="text-xs text-neutral-500 mt-1">Acquire these trending skills via platform courses to unlock new matching opportunities</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {recommendedCourses.map((course: any) => {
                                    // check registration
                                    const reg = registrations?.find((r: any) => r.courseId === course.id);
                                    const isEnrolled = !!reg;
                                    const progress = reg ? reg.progress : 0;
                                    const isCompleted = reg?.status === 'COMPLETED';

                                    return (
                                        <div key={course.id} className="bg-neutral-50/50 border border-neutral-100 rounded-2xl p-5 hover:shadow-md transition-shadow flex flex-col justify-between gap-4">
                                            <div>
                                                <div className="flex justify-between items-start mb-2">
                                                    <span className="text-[10px] font-black uppercase bg-success-50 text-success-700 px-2 py-0.5 rounded border border-success-100">
                                                        {course.level}
                                                    </span>
                                                    <span className="text-[10px] font-semibold text-neutral-400">
                                                        {course.hours} Hours
                                                    </span>
                                                </div>
                                                <h4 className="font-bold text-neutral-950 text-base leading-snug line-clamp-1 mb-1">{course.title}</h4>
                                                <p className="text-xs text-neutral-500 line-clamp-2 leading-relaxed mb-3">{course.description}</p>
                                                
                                                {/* Skills Tag */}
                                                <div className="flex flex-wrap gap-1.5 mt-2">
                                                    {course.skills.split(',').map((skill: string, index: number) => (
                                                        <span key={index} className="text-[9px] font-bold text-neutral-500 bg-neutral-200/50 px-2 py-0.5 rounded">
                                                            {skill.trim()}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Action / Progress */}
                                            <div className="border-t border-neutral-100/80 pt-3">
                                                {isEnrolled ? (
                                                    <div>
                                                        <div className="flex justify-between text-[10px] font-black text-neutral-500 mb-1.5 uppercase">
                                                            <span>{isCompleted ? 'Completed ✓' : `${progress}% Complete`}</span>
                                                        </div>
                                                        <div className="w-full bg-neutral-200 rounded-full h-1.5 overflow-hidden">
                                                            <div className={`h-full rounded-full ${isCompleted ? 'bg-emerald-500' : 'bg-primary-600'}`} style={{ width: `${progress}%` }}></div>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <button
                                                        onClick={() => {
                                                            dispatch(registerForCourse(course.id)).then(() => {
                                                                dispatch(fetchUserRegistrations());
                                                                alert(`Enrolled in ${course.title} successfully!`);
                                                            });
                                                        }}
                                                        className="w-full py-2 bg-primary-50 text-primary-700 hover:bg-primary-100 border border-primary-100 rounded-xl text-xs font-bold transition-all text-center flex items-center justify-center gap-1"
                                                    >
                                                        <Plus className="w-3.5 h-3.5" />
                                                        Enroll Quick
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Demand Trends & Growth Skills */}
                    <div className="space-y-8">
                        {/* 1. Skill Demand Trends Chart */}
                        <div className="bg-white rounded-3xl p-6 border border-neutral-200/60 shadow-sm space-y-6">
                            <div>
                                <h3 className="text-lg font-black text-neutral-900 flex items-center">
                                    <TrendingUp className="w-5 h-5 mr-2 text-indigo-600" />
                                    Demand Trends
                                </h3>
                                <p className="text-xs text-neutral-500 mt-1">Top requested skills by matching swaps across the ecosystem</p>
                            </div>

                            <div className="h-56 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10 }} />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10 }} />
                                        <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', background: '#fff' }} />
                                        <Bar dataKey="Demand" fill="#4f46e5" radius={[6, 6, 0, 0]} barSize={20}>
                                            {chartData.map((entry: any, index: number) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* 2. Growth Skills Suggestions list */}
                        <div className="bg-white rounded-3xl p-6 border border-neutral-200/60 shadow-sm space-y-4">
                            <h3 className="text-lg font-black text-neutral-900 flex items-center">
                                <Zap className="w-5 h-5 mr-2 text-amber-500" />
                                High Value Skills
                            </h3>
                            <p className="text-xs text-neutral-500 leading-relaxed">
                                These skills are highly sought after by users on the platform. Add them to your growth objectives:
                            </p>
                            
                            <div className="space-y-2">
                                {growthSkills.map((skill: string, idx: number) => (
                                    <div key={idx} className="flex items-center justify-between p-3 bg-amber-50/30 rounded-xl border border-amber-100/50">
                                        <span className="font-bold text-neutral-800 text-xs">{skill}</span>
                                        <span className="text-[10px] font-black text-amber-700 bg-amber-100/50 px-2 py-0.5 rounded">
                                            High Demand
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const renderTabContent = () => {
        switch (activeTab) {
            case 'resume': return renderResume();
            case 'certifications': return renderCertifications();
            case 'courses': return renderCourses();
            case 'growth': return renderGrowth();
            case 'analytics': return renderAnalytics();
            case 'linkedin': return renderLinkedIn();
            case 'endorsements': return renderEndorsements();
            default: return null;
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 pt-20">
            <div className="flex">
                {/* Sidebar */}
                <aside className="w-64 min-h-[calc(100vh-5rem)] bg-white border-r border-gray-100 p-4 sticky top-20 flex flex-col">
                    <div className="flex items-center gap-3 mb-8 px-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-primary-600 to-primary-700 rounded-xl flex items-center justify-center">
                            <TrendingUp className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h2 className="font-bold text-gray-900">Career Booster</h2>
                            <p className="text-[10px] text-gray-400 uppercase font-semibold">Growth Dashboard</p>
                        </div>
                    </div>
                    
                    <nav className="space-y-1 flex-1">
                        {tabs.map(t => (
                            <button key={t.key} onClick={() => setActiveTab(t.key)}
                                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${activeTab === t.key ? 'bg-primary-50 text-primary-700 shadow-sm' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}>
                                <t.icon className="w-4 h-4" />{t.label}
                            </button>
                        ))}
                    </nav>

                    {/* Quick Stats in Sidebar */}
                    {profile && (
                        <div className="mt-8 pt-6 border-t border-gray-100 px-3 space-y-3">
                            <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Quick Stats</h3>
                            {[
                                { label: 'Swaps', value: profile.totalCompletedSwaps || 0, color: 'text-primary-600' },
                                { label: 'Hours', value: profile.totalHours || 0, color: 'text-accent-600' },
                                { label: 'Rating', value: `${profile.averageRating || 0}/5`, color: 'text-warning-600' },
                            ].map((s, i) => (
                                <div key={i} className="flex justify-between items-center bg-gray-50 px-3 py-2 rounded-lg border border-gray-100">
                                    <span className="text-xs font-semibold text-gray-500">{s.label}</span>
                                    <span className={`text-sm font-bold ${s.color}`}>{s.value}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </aside>

                {/* Main Content */}
                <main className="flex-1 p-8">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                            className="max-w-5xl"
                        >
                            {renderTabContent()}
                        </motion.div>
                    </AnimatePresence>
                </main>
            </div>

            {/* Endorsement Modal */}
            <AnimatePresence>
                {endorseModal && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl"
                        >
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-xl font-bold text-neutral-900">Endorse {endorseModal.partnerName}</h3>
                                <button onClick={() => setEndorseModal(null)} className="p-2 hover:bg-neutral-100 rounded-full">
                                    <X className="w-5 h-5 text-neutral-400" />
                                </button>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-bold text-neutral-700 mb-1">Skill to Endorse</label>
                                    <input
                                        type="text"
                                        value={endorseForm.skillName}
                                        onChange={(e) => setEndorseForm({ ...endorseForm, skillName: e.target.value })}
                                        placeholder={`e.g., ${endorseModal.requestedSkill || endorseModal.offeredSkill}`}
                                        className="w-full p-3 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-neutral-700 mb-1">Message (Optional)</label>
                                    <textarea
                                        value={endorseForm.message}
                                        onChange={(e) => setEndorseForm({ ...endorseForm, message: e.target.value })}
                                        placeholder="Share your experience working with this person..."
                                        rows={3}
                                        className="w-full p-3 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all resize-none"
                                    />
                                </div>
                                <div className="flex space-x-3">
                                    <button
                                        onClick={() => setEndorseModal(null)}
                                        className="flex-1 py-3 text-neutral-500 font-bold rounded-xl hover:bg-neutral-50 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleEndorsementSubmit}
                                        disabled={!endorseForm.skillName}
                                        className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors disabled:opacity-50 shadow-lg shadow-blue-200"
                                    >
                                        Submit Endorsement
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Swap Request Modal for Collaborator Matching */}
            {showSwapModal && selectedSwapPartner && (
                <SwapRequestModal
                    isOpen={showSwapModal}
                    onClose={() => {
                        setShowSwapModal(false);
                        setSelectedSwapPartner(null);
                    }}
                    recipientName={selectedSwapPartner.name}
                    recipientSkill={selectedSwapPartner.targetSkill}
                    skillId={selectedSwapPartner.targetListingId}
                    userSkills={profile?.user?.skills?.map((s: any) => s.skillName) || currentUser?.skills?.map((s: any) => s.skillName) || []}
                    onSubmit={(data) => {
                        alert(`Swap request successfully sent to ${selectedSwapPartner.name}!`);
                        setShowSwapModal(false);
                        setSelectedSwapPartner(null);
                    }}
                />
            )}
        </div>
    );
}

// ─── Helper Components ───

function LoadingState() {
    return (
        <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600" />
        </div>
    );
}

function CopyableSection({ title, content, onCopy, copySuccess, icon }: {
    title: string; content: string; onCopy: (text: string, label: string) => void;
    copySuccess: string | null; icon: React.ReactNode;
}) {
    const label = title.toLowerCase().replace(/[^a-z]/g, '');
    return (
        <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-neutral-100 flex items-center justify-between">
                <h3 className="font-bold text-neutral-900 flex items-center">
                    <span className="text-primary-600 mr-2">{icon}</span>{title}
                </h3>
                <button
                    onClick={() => onCopy(content, label)}
                    className={`flex items-center px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${copySuccess === label ? 'bg-success-100 text-success-700' : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                        }`}
                >
                    {copySuccess === label ? <CheckCircle2 className="w-3 h-3 mr-1" /> : <Copy className="w-3 h-3 mr-1" />}
                    {copySuccess === label ? 'Copied!' : 'Copy'}
                </button>
            </div>
            <div className="p-4">
                <p className="text-neutral-700 text-sm leading-relaxed whitespace-pre-wrap">{content}</p>
            </div>
        </div>
    );
}
