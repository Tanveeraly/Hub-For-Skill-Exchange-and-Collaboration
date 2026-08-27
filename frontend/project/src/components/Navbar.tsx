import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, LogOut, LayoutDashboard, Calendar, MessageSquare, Users, TrendingUp, Zap, Shield, AlertTriangle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import NotificationDropdown from './NotificationDropdown';
import ComplaintModal from './ComplaintModal';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../store/store';
import { logout as logoutAction } from '../store/slices/authSlice';
import { fetchPendingRequests } from '../store/slices/connectionSlice';
import { fetchNotifications, markAsRead, markAllAsRead, clearAllNotifications } from '../store/slices/notificationsSlice';

interface NavbarProps {
  // isAuthenticated and onLogout are now handled internally via Redux
}

export default function Navbar({ }: NavbarProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDashboardOpen, setIsDashboardOpen] = useState(false);
  const [isNetworkOpen, setIsNetworkOpen] = useState(false);
  const [isComplaintModalOpen, setIsComplaintModalOpen] = useState(false);
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const location = useLocation();

  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);
  const currentUser = useSelector((state: RootState) => state.auth.user);
  const { pendingRequests } = useSelector((state: RootState) => state.connections);
  const { items: notifications } = useSelector((state: RootState) => state.notifications);

  useEffect(() => {
    if (isAuthenticated) {
      dispatch(fetchPendingRequests());
      dispatch(fetchNotifications());
    }
  }, [isAuthenticated, dispatch]);

  const handleMarkAsRead = (id: string | number) => {
    dispatch(markAsRead(Number(id)));
  };

  const handleMarkAllAsRead = () => {
    dispatch(markAllAsRead());
  };

  const handleClearAll = () => {
    dispatch(clearAllNotifications());
  };

  const handleLogout = () => {
    dispatch(logoutAction());
    navigate('/login');
  };

  // Helper function to check if a link is active
  const isActive = (path: string) => {
    return location.pathname === path;
  };

  // Helper function to check if any path in array is active
  const isAnyActive = (paths: string[]) => {
    return paths.some(path => location.pathname === path);
  };

  return (
    <nav className="fixed w-full z-50 transition-all duration-300 glass border-b border-neutral-200/50">
      <div className="container-wide">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center space-x-2 group">
            <img
              src="/hsec-logo.png"
              alt="HSEC - Skill Exchange & Collaboration Network"
              className="h-12 w-auto object-contain"
            />
          </Link>

          <div className="hidden md:flex items-center space-x-1">
            <Link
              to={isAuthenticated ? "/home" : "/"}
              className={`px-4 py-2 rounded-lg transition-all font-medium ${(isActive('/') || isActive('/home'))
                ? 'text-primary-600 bg-primary-50 border-b-2 border-primary-600'
                : 'text-neutral-700 hover:text-primary-600 hover:bg-primary-50'
                }`}
            >
              Home
            </Link>
            <Link
              to="/marketplace"
              className={`px-4 py-2 rounded-lg transition-all font-medium ${isActive('/marketplace')
                ? 'text-primary-600 bg-primary-50 border-b-2 border-primary-600'
                : 'text-neutral-700 hover:text-primary-600 hover:bg-primary-50'
                }`}
            >
              Marketplace
            </Link>
            {isAuthenticated ? (
              <>
                {/* Dashboard Dropdown */}
                <div
                  className="relative"
                  onMouseEnter={() => setIsDashboardOpen(true)}
                  onMouseLeave={() => setIsDashboardOpen(false)}
                >
                  <button
                    className={`px-4 py-2 rounded-lg transition-all flex items-center space-x-2 font-medium ${isAnyActive(['/dashboard', '/analytics', '/career', '/admin'])
                      ? 'text-primary-600 bg-primary-50 border-b-2 border-primary-600'
                      : 'text-neutral-700 hover:text-primary-600 hover:bg-primary-50'
                      }`}
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    <span>Dashboard</span>
                  </button>

                  <AnimatePresence>
                    {isDashboardOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className="absolute right-0 mt-1 w-48 bg-white rounded-xl shadow-xl border border-neutral-100 p-2 z-50"
                      >
                        <Link
                          to="/dashboard"
                          className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${isActive('/dashboard')
                            ? 'bg-primary-50 text-primary-600'
                            : 'text-neutral-700 hover:bg-neutral-50'
                            }`}
                          onClick={() => setIsDashboardOpen(false)}
                        >
                          <LayoutDashboard className="w-4 h-4" />
                          <span>Overview</span>
                        </Link>
                        <Link
                          to="/analytics"
                          className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${isActive('/analytics')
                            ? 'bg-primary-50 text-primary-600'
                            : 'text-neutral-700 hover:bg-neutral-50'
                            }`}
                          onClick={() => setIsDashboardOpen(false)}
                        >
                          <TrendingUp className="w-4 h-4" />
                          <span>Analytics</span>
                        </Link>
                        <Link
                          to="/career"
                          className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${isActive('/career')
                            ? 'bg-primary-50 text-primary-600'
                            : 'text-neutral-700 hover:bg-neutral-50'
                            }`}
                          onClick={() => setIsDashboardOpen(false)}
                        >
                          <Zap className="w-4 h-4" />
                          <span>Career Booster</span>
                        </Link>
                        {currentUser?.role === 'ADMIN' && (
                          <Link
                            to="/admin"
                            className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${isActive('/admin')
                              ? 'bg-primary-50 text-primary-600'
                              : 'text-neutral-700 hover:bg-neutral-50'
                              }`}
                            onClick={() => setIsDashboardOpen(false)}
                          >
                            <Shield className="w-4 h-4" />
                            <span>Admin Panel</span>
                          </Link>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Network Dropdown */}
                <div
                  className="relative"
                  onMouseEnter={() => setIsNetworkOpen(true)}
                  onMouseLeave={() => setIsNetworkOpen(false)}
                >
                  <button
                    className={`px-4 py-2 rounded-lg transition-all flex items-center space-x-2 font-medium ${isAnyActive(['/network', '/swaps'])
                      ? 'text-primary-600 bg-primary-50 border-b-2 border-primary-600'
                      : 'text-neutral-700 hover:text-primary-600 hover:bg-primary-50'
                      }`}
                  >
                    <Users className="w-4 h-4" />
                    <span>Network</span>
                    {pendingRequests.length > 0 && (
                      <span className="bg-error-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                        {pendingRequests.length}
                      </span>
                    )}
                  </button>

                  <AnimatePresence>
                    {isNetworkOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className="absolute right-0 mt-1 w-56 bg-white rounded-xl shadow-xl border border-neutral-100 p-2 z-50"
                      >
                        <Link
                          to="/network"
                          className={`flex items-center justify-between px-4 py-2 rounded-lg transition-colors ${isActive('/network')
                            ? 'bg-primary-50 text-primary-600'
                            : 'text-neutral-700 hover:bg-neutral-50'
                            }`}
                          onClick={() => setIsNetworkOpen(false)}
                        >
                          <div className="flex items-center space-x-2">
                            <Users className="w-4 h-4" />
                            <span>My Network</span>
                          </div>
                          {pendingRequests.length > 0 && (
                            <span className="bg-error-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                              {pendingRequests.length}
                            </span>
                          )}
                        </Link>
                        <Link
                          to="/swaps"
                          className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${isActive('/swaps')
                            ? 'bg-primary-50 text-primary-600'
                            : 'text-neutral-700 hover:bg-neutral-50'
                            }`}
                          onClick={() => setIsNetworkOpen(false)}
                        >
                          <Calendar className="w-4 h-4" />
                          <span>Swaps</span>
                        </Link>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <Link
                  to="/messages"
                  className={`px-4 py-2 rounded-lg transition-all flex items-center space-x-2 font-medium ${isActive('/messages')
                    ? 'text-primary-600 bg-primary-50 border-b-2 border-primary-600'
                    : 'text-neutral-700 hover:text-primary-600 hover:bg-primary-50'
                    }`}
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Messages</span>
                </Link>

                <Link
                  to="/profile"
                  className={`px-4 py-2 rounded-lg transition-all font-medium ${isActive('/profile')
                    ? 'text-primary-600 bg-primary-50 border-b-2 border-primary-600'
                    : 'text-neutral-700 hover:text-primary-600 hover:bg-primary-50'
                    }`}
                >
                  My Profile
                </Link>

                <NotificationDropdown
                  notifications={notifications}
                  onMarkAsRead={handleMarkAsRead}
                  onMarkAllAsRead={handleMarkAllAsRead}
                  onClearAll={handleClearAll}
                />
                <button
                  onClick={() => setIsComplaintModalOpen(true)}
                  className="px-4 py-2 text-neutral-700 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all font-medium flex items-center gap-2"
                >
                  <AlertTriangle className="w-4 h-4" />
                  <span>Report</span>
                </button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleLogout}
                  className="flex items-center space-x-2 px-4 py-2 text-error-600 hover:bg-error-50 rounded-lg transition-all font-medium"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </motion.button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className={`px-4 py-2 rounded-lg transition-all font-medium ${isActive('/login')
                    ? 'text-primary-600 bg-primary-50 border-b-2 border-primary-600'
                    : 'text-neutral-700 hover:text-primary-600 hover:bg-primary-50'
                    }`}
                >
                  Login
                </Link>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Link
                    to="/signup"
                    className="btn-primary ml-2"
                  >
                    Sign Up
                  </Link>
                </motion.div>
              </>
            )}
          </div>

          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden text-neutral-700 focus:outline-none"
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white border-t border-neutral-200 shadow-lg overflow-hidden"
          >
            <div className="px-4 py-4 space-y-2">
              <Link
                to={isAuthenticated ? "/home" : "/"}
                className={`block px-4 py-2 rounded-lg transition-all font-medium ${(isActive('/') || isActive('/home'))
                  ? 'text-primary-600 bg-primary-50 border-l-4 border-primary-600'
                  : 'text-neutral-700 hover:text-primary-600 hover:bg-primary-50'
                  }`}
                onClick={() => setIsMenuOpen(false)}
              >
                Home
              </Link>
              <Link
                to="/marketplace"
                className={`block px-4 py-2 rounded-lg transition-all font-medium ${isActive('/marketplace')
                  ? 'text-primary-600 bg-primary-50 border-l-4 border-primary-600'
                  : 'text-neutral-700 hover:text-primary-600 hover:bg-primary-50'
                  }`}
                onClick={() => setIsMenuOpen(false)}
              >
                Marketplace
              </Link>
              {isAuthenticated ? (
                <>
                  <Link
                    to="/profile"
                    className={`block px-4 py-2 rounded-lg transition-all font-medium ${isActive('/profile')
                      ? 'text-primary-600 bg-primary-50 border-l-4 border-primary-600'
                      : 'text-neutral-700 hover:text-primary-600 hover:bg-primary-50'
                      }`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    My Profile
                  </Link>
                  <Link
                    to="/home"
                    className={`block px-4 py-2 rounded-lg transition-all font-medium ${isActive('/home')
                      ? 'text-primary-600 bg-primary-50 border-l-4 border-primary-600'
                      : 'text-neutral-700 hover:text-primary-600 hover:bg-primary-50'
                      }`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Feed
                  </Link>
                  <Link
                    to="/dashboard"
                    className={`block px-4 py-2 rounded-lg transition-all font-medium ${isActive('/dashboard')
                      ? 'text-primary-600 bg-primary-50 border-l-4 border-primary-600'
                      : 'text-neutral-700 hover:text-primary-600 hover:bg-primary-50'
                      }`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Dashboard
                  </Link>
                  <Link
                    to="/analytics"
                    className={`block px-4 py-2 rounded-lg transition-all font-medium ${isActive('/analytics')
                      ? 'text-primary-600 bg-primary-50 border-l-4 border-primary-600'
                      : 'text-neutral-700 hover:text-primary-600 hover:bg-primary-50'
                      }`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Analytics
                  </Link>
                  <Link
                    to="/swaps"
                    className={`block px-4 py-2 rounded-lg transition-all font-medium ${isActive('/swaps')
                      ? 'text-primary-600 bg-primary-50 border-l-4 border-primary-600'
                      : 'text-neutral-700 hover:text-primary-600 hover:bg-primary-50'
                      }`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Swaps
                  </Link>
                  <Link
                    to="/messages"
                    className={`block px-4 py-2 rounded-lg transition-all font-medium ${isActive('/messages')
                      ? 'text-primary-600 bg-primary-50 border-l-4 border-primary-600'
                      : 'text-neutral-700 hover:text-primary-600 hover:bg-primary-50'
                      }`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Messages
                  </Link>
                  <Link
                    to="/career"
                    className={`block px-4 py-2 rounded-lg transition-all font-medium ${isActive('/career')
                      ? 'text-primary-600 bg-primary-50 border-l-4 border-primary-600'
                      : 'text-neutral-700 hover:text-primary-600 hover:bg-primary-50'
                      }`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Career Booster
                  </Link>
                  {currentUser?.role === 'ADMIN' && (
                    <Link
                      to="/admin"
                      className={`block px-4 py-2 rounded-lg transition-all font-medium ${isActive('/admin')
                        ? 'text-primary-600 bg-primary-50 border-l-4 border-primary-600'
                        : 'text-neutral-700 hover:text-primary-600 hover:bg-primary-50'
                        }`}
                      onClick={() => setIsMenuOpen(false)}
                    >
                      🛡️ Admin Panel
                    </Link>
                  )}
                  <button
                    onClick={() => {
                      setIsComplaintModalOpen(true);
                      setIsMenuOpen(false);
                    }}
                    className="block w-full text-left px-4 py-2 text-neutral-700 hover:bg-red-50 hover:text-red-600 rounded-lg transition-all font-medium"
                  >
                    Report Issue
                  </button>
                  <button
                    onClick={() => {
                      handleLogout();
                      setIsMenuOpen(false);
                    }}
                    className="block w-full text-left px-4 py-2 text-error-600 hover:bg-error-50 rounded-lg transition-all font-medium"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className={`block px-4 py-2 rounded-lg transition-all font-medium ${isActive('/login')
                      ? 'text-primary-600 bg-primary-50 border-l-4 border-primary-600'
                      : 'text-neutral-700 hover:text-primary-600 hover:bg-primary-50'
                      }`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Login
                  </Link>
                  <Link
                    to="/signup"
                    className="block btn-primary text-center"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Sign Up
                  </Link>
                </>
              )}

              {isAuthenticated && (
                <div className="pt-4 border-t border-neutral-200">
                  <NotificationDropdown
                    notifications={notifications}
                    onMarkAsRead={handleMarkAsRead}
                    onMarkAllAsRead={handleMarkAllAsRead}
                    onClearAll={handleClearAll}
                  />
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Complaint Modal */}
      {isComplaintModalOpen && (
        <ComplaintModal onClose={() => setIsComplaintModalOpen(false)} />
      )}
    </nav>
  );
}