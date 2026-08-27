import { Link } from 'react-router-dom';
import { Github, Linkedin, Twitter, Mail, MapPin, Phone } from 'lucide-react';

export default function Footer() {
    return (
        <footer className="bg-neutral-900 text-neutral-400">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Main Footer Content */}
                <div className="py-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                    {/* Brand Column */}
                    <div className="space-y-4">
                        <div className="flex items-center space-x-2">
                            <img
                                src="/hsec-logo.png"
                                alt="HSEC - Skill Exchange & Collaboration Network"
                                className="h-10 w-auto object-contain brightness-0 invert"
                            />
                        </div>
                        <p className="text-sm leading-relaxed">
                            Exchange skills, build connections, and grow your professional network with HSEC.
                        </p>
                        <div className="flex space-x-3">
                            <a href="#" className="w-9 h-9 bg-neutral-800 hover:bg-primary-600 rounded-lg flex items-center justify-center transition-colors duration-200">
                                <Linkedin className="w-4 h-4" />
                            </a>
                            <a href="#" className="w-9 h-9 bg-neutral-800 hover:bg-secondary-500 rounded-lg flex items-center justify-center transition-colors duration-200">
                                <Twitter className="w-4 h-4" />
                            </a>
                            <a href="#" className="w-9 h-9 bg-neutral-800 hover:bg-neutral-700 rounded-lg flex items-center justify-center transition-colors duration-200">
                                <Github className="w-4 h-4" />
                            </a>
                        </div>
                    </div>

                    {/* Platform Links */}
                    <div>
                        <h4 className="text-white font-semibold mb-4">Platform</h4>
                        <ul className="space-y-2 text-sm">
                            <li><Link to="/marketplace" className="hover:text-white transition-colors">Marketplace</Link></li>
                            <li><Link to="/signup" className="hover:text-white transition-colors">Get Started</Link></li>
                            <li><Link to="/login" className="hover:text-white transition-colors">Sign In</Link></li>
                            <li><Link to="/dashboard" className="hover:text-white transition-colors">Dashboard</Link></li>
                        </ul>
                    </div>

                    {/* Resources */}
                    <div>
                        <h4 className="text-white font-semibold mb-4">Resources</h4>
                        <ul className="space-y-2 text-sm">
                            <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
                            <li><a href="#" className="hover:text-white transition-colors">Community Guidelines</a></li>
                            <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                            <li><a href="#" className="hover:text-white transition-colors">Tutorials</a></li>
                        </ul>
                    </div>

                    {/* Contact */}
                    <div>
                        <h4 className="text-white font-semibold mb-4">Contact</h4>
                        <ul className="space-y-3 text-sm">
                            <li className="flex items-center space-x-2">
                                <Mail className="w-4 h-4 text-primary-400" />
                                <span>support@hsec.com</span>
                            </li>
                            <li className="flex items-center space-x-2">
                                <Phone className="w-4 h-4 text-primary-400" />
                                <span>+1 (555) 000-0000</span>
                            </li>
                            <li className="flex items-start space-x-2">
                                <MapPin className="w-4 h-4 text-primary-400 mt-0.5 shrink-0" />
                                <a
                                    href="https://maps.google.com/?q=SZABIST+University+Islamabad"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="hover:text-white transition-colors leading-snug"
                                >
                                    SZABIST University,<br />Islamabad, Pakistan
                                </a>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="py-6 border-t border-neutral-800 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <p className="text-sm">&copy; {new Date().getFullYear()} HSEC. All rights reserved.</p>
                    <div className="flex space-x-6 text-sm">
                        <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
                        <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
                        <a href="#" className="hover:text-white transition-colors">Cookie Policy</a>
                    </div>
                </div>
            </div>
        </footer>
    );
}
