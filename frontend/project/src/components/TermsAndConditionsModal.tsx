import { useState } from 'react';
import { X, Check, Shield, FileText, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface TermsAndConditionsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAccept: () => void;
}

export default function TermsAndConditionsModal({ isOpen, onClose, onAccept }: TermsAndConditionsModalProps) {
    const [agreements, setAgreements] = useState({
        termsOfService: false,
        privacyPolicy: false,
        codeOfConduct: false
    });

    const allAgreed = agreements.termsOfService && agreements.privacyPolicy && agreements.codeOfConduct;

    const handleAccept = () => {
        if (allAgreed) {
            onAccept();
        }
    };

    const toggleAgreement = (key: keyof typeof agreements) => {
        setAgreements(prev => ({ ...prev, [key]: !prev[key] }));
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[70]">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[85vh] overflow-hidden flex flex-col"
                    >
                        {/* Header */}
                        <div className="relative bg-gradient-to-r from-primary-600 via-accent-600 to-error-500 p-6">
                            <div className="flex items-start justify-between text-white">
                                <div>
                                    <h2 className="text-2xl font-bold mb-2">Terms & Conditions</h2>
                                    <p className="text-white/90 text-sm">Please review and accept our terms before proceeding</p>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="text-white/80 hover:text-white transition p-1 hover:bg-white/20 rounded-lg"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            {/* Decorative elements */}
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl"></div>
                            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full blur-2xl"></div>
                        </div>

                        {/* Scrollable Content */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                            {/* Terms of Service Section */}
                            <section className="space-y-3">
                                <div className="flex items-center space-x-2 text-primary-600">
                                    <FileText className="w-5 h-5" />
                                    <h3 className="text-lg font-bold">Terms of Service</h3>
                                </div>
                                <div className="text-neutral-700 space-y-2 text-sm leading-relaxed">
                                    <p>By using our skill exchange platform, you agree to:</p>
                                    <ul className="list-disc pl-5 space-y-1">
                                        <li>Provide accurate information about your skills and expertise</li>
                                        <li>Engage in respectful and professional communication with other users</li>
                                        <li>Honor your commitments when accepting swap requests</li>
                                        <li>Not use the platform for commercial purposes without authorization</li>
                                        <li>Comply with all applicable laws and regulations</li>
                                    </ul>
                                    <p className="pt-2">
                                        We reserve the right to suspend or terminate accounts that violate these terms.
                                        All skill exchanges are conducted at your own risk, and we do not guarantee
                                        the quality or outcome of any swap.
                                    </p>
                                </div>
                            </section>

                            {/* Privacy Policy Section */}
                            <section className="space-y-3">
                                <div className="flex items-center space-x-2 text-accent-600">
                                    <Shield className="w-5 h-5" />
                                    <h3 className="text-lg font-bold">Privacy Policy</h3>
                                </div>
                                <div className="text-neutral-700 space-y-2 text-sm leading-relaxed">
                                    <p>We are committed to protecting your privacy:</p>
                                    <ul className="list-disc pl-5 space-y-1">
                                        <li>Your personal information is encrypted and stored securely</li>
                                        <li>We will never sell or share your data with third parties without consent</li>
                                        <li>You can request to view, modify, or delete your data at any time</li>
                                        <li>Communication between users may be monitored to ensure platform safety</li>
                                        <li>We use cookies and analytics to improve your experience</li>
                                    </ul>
                                    <p className="pt-2">
                                        For detailed information about data collection and usage, please refer to our
                                        complete Privacy Policy document available on our website.
                                    </p>
                                </div>
                            </section>

                            {/* Code of Conduct Section */}
                            <section className="space-y-3">
                                <div className="flex items-center space-x-2 text-error-600">
                                    <Users className="w-5 h-5" />
                                    <h3 className="text-lg font-bold">Community Code of Conduct</h3>
                                </div>
                                <div className="text-neutral-700 space-y-2 text-sm leading-relaxed">
                                    <p>Our community thrives on mutual respect and learning:</p>
                                    <ul className="list-disc pl-5 space-y-1">
                                        <li>Be respectful, patient, and supportive of all skill levels</li>
                                        <li>Zero tolerance for harassment, discrimination, or hate speech</li>
                                        <li>Provide constructive feedback and encourage growth</li>
                                        <li>Report inappropriate behavior or content immediately</li>
                                        <li>Maintain professionalism in all interactions</li>
                                        <li>Respect intellectual property and give credit where due</li>
                                    </ul>
                                    <p className="pt-2">
                                        Violations of our code of conduct may result in warnings, temporary suspensions,
                                        or permanent bans depending on severity.
                                    </p>
                                </div>
                            </section>

                            {/* Important Notice */}
                            <div className="bg-amber-50 border-l-4 border-amber-400 p-4 rounded">
                                <p className="text-sm text-amber-800">
                                    <strong>Important:</strong> These terms may be updated periodically. Continued use
                                    of the platform constitutes acceptance of any changes. Last updated: November 2025.
                                </p>
                            </div>
                        </div>

                        {/* Agreement Checkboxes */}
                        <div className="border-t border-neutral-200 p-6 bg-neutral-50 space-y-3">
                            <label className="flex items-start space-x-3 cursor-pointer group">
                                <div className="relative flex items-center justify-center">
                                    <input
                                        type="checkbox"
                                        checked={agreements.termsOfService}
                                        onChange={() => toggleAgreement('termsOfService')}
                                        className="sr-only"
                                    />
                                    <div className={`w-6 h-6 rounded-lg border-2 transition-all ${agreements.termsOfService
                                        ? 'bg-primary-600 border-primary-600'
                                        : 'border-neutral-300 group-hover:border-primary-400'
                                        }`}>
                                        {agreements.termsOfService && (
                                            <Check className="w-full h-full text-white p-0.5" />
                                        )}
                                    </div>
                                </div>
                                <span className="text-sm text-neutral-700 flex-1">
                                    I have read and agree to the <strong>Terms of Service</strong>
                                </span>
                            </label>

                            <label className="flex items-start space-x-3 cursor-pointer group">
                                <div className="relative flex items-center justify-center">
                                    <input
                                        type="checkbox"
                                        checked={agreements.privacyPolicy}
                                        onChange={() => toggleAgreement('privacyPolicy')}
                                        className="sr-only"
                                    />
                                    <div className={`w-6 h-6 rounded-lg border-2 transition-all ${agreements.privacyPolicy
                                        ? 'bg-accent-600 border-accent-600'
                                        : 'border-neutral-300 group-hover:border-accent-400'
                                        }`}>
                                        {agreements.privacyPolicy && (
                                            <Check className="w-full h-full text-white p-0.5" />
                                        )}
                                    </div>
                                </div>
                                <span className="text-sm text-neutral-700 flex-1">
                                    I have read and agree to the <strong>Privacy Policy</strong>
                                </span>
                            </label>

                            <label className="flex items-start space-x-3 cursor-pointer group">
                                <div className="relative flex items-center justify-center">
                                    <input
                                        type="checkbox"
                                        checked={agreements.codeOfConduct}
                                        onChange={() => toggleAgreement('codeOfConduct')}
                                        className="sr-only"
                                    />
                                    <div className={`w-6 h-6 rounded-lg border-2 transition-all ${agreements.codeOfConduct
                                        ? 'bg-error-600 border-error-600'
                                        : 'border-neutral-300 group-hover:border-error-400'
                                        }`}>
                                        {agreements.codeOfConduct && (
                                            <Check className="w-full h-full text-white p-0.5" />
                                        )}
                                    </div>
                                </div>
                                <span className="text-sm text-neutral-700 flex-1">
                                    I have read and agree to the <strong>Community Code of Conduct</strong>
                                </span>
                            </label>
                        </div>

                        {/* Actions */}
                        <div className="border-t border-neutral-200 p-6 flex space-x-3">
                            <button
                                onClick={onClose}
                                className="flex-1 px-6 py-3 border border-neutral-300 text-neutral-700 rounded-lg font-semibold hover:bg-neutral-50 transition"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleAccept}
                                disabled={!allAgreed}
                                className={`flex-1 px-6 py-3 rounded-lg font-semibold transition ${allAgreed
                                    ? 'bg-gradient-to-r from-primary-600 to-accent-600 text-white hover:shadow-lg hover:scale-[1.02]'
                                    : 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
                                    }`}
                            >
                                Accept & Continue
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
