
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, Star, MapPin, Bookmark, MessageSquare, TrendingUp, Plus, X, Globe, Link, Mail, Send, RefreshCw, CheckCircle, AlertOctagon } from 'lucide-react';
import axios from 'axios';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../store/store';
import { fetchPosts, createPost } from '../store/slices/postsSlice';
import { sendMessage } from '../store/slices/chatSlice';
import { submitComplaint } from '../store/slices/adminSlice';
import NotificationToast, { Toast } from '../components/NotificationToast';
import SwapRequestModal from '../components/SwapRequestModal';

interface User {
  id: number;
  name: string;
  email: string;
  isVerified: boolean;
  role: string;
  profile: {
    bio: string;
    avatarUrl: string;
    coverimageUrl: string;
    socialLinks: string;
    website: string;
    location: string;
  } | null;
  skills: Array<{
    id: number;
    skillName: string;
    expertiseLevel: 'BEGINNER' | 'INTERMEDIATE' | 'EXPERT';
  }>;
  portfolios: Array<{
    id: number;
    title: string;
    description: string;
    mediaUrl: string;
    mediaType: string | null;
    createdAt: string;
  }>;
  listings: Array<{
    id: number;
    title: string;
    description: string;
    location: string;
    isFeatured: boolean;
  }>;
}

interface CreateListingForm {
  title: string;
  description: string;
  location: string;
  isFeatured: boolean;
  categoryId: string;
}

// Random categories for filtering
const randomCategories = [
  'Web Development',
  'Mobile Development',
  'Design',
  'Marketing',
  'Writing',
  'Data Science',
  'Consulting',
  'Photography',
  'Video Editing',
  'Business'
];

export default function Marketplace() {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showChatModal, setShowChatModal] = useState(false);
  const [showSwapModal, setShowSwapModal] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<User | null>(null);
  const [selectedChatUser, setSelectedChatUser] = useState<any>(null);
  const [selectedSwapUser, setSelectedSwapUser] = useState<any>(null);
  const [chatMessage, setChatMessage] = useState('');
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportData, setReportData] = useState({ subject: '', description: '' });
  const [selectedReportPost, setSelectedReportPost] = useState<any>(null);
  const [chatMessages, setChatMessages] = useState<Array<{ text: string, sender: string, time: string, isSending?: boolean }>>([]);
  const { user } = useSelector((state: RootState) => state.auth);
  const [userEmail, setUserEmail] = useState<string | null>(user?.email || null);
  const [userName, setUserName] = useState<string>(user?.name || '');
  const [authLoading, setAuthLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { items: reduxPosts, loading } = useSelector((state: RootState) => state.posts);
  const currentUserId = user?.id || 0;
  const [users] = useState<User[]>([]);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [currentUserSkills, setCurrentUserSkillsState] = useState<string[]>([]);

  useEffect(() => {
    if (user?.email && !userEmail) {
      setUserEmail(user.email);
      setUserName(user.name || 'You');
    }
  }, [user, userEmail]);

  const [formData, setFormData] = useState<CreateListingForm>({
    title: '',
    description: '',
    location: '',
    isFeatured: false,
    categoryId: ''
  });

  const [backendCategories, setBackendCategories] = useState<{ id: number, name: string }[]>([]);

  // Fetch all users with full info
  // Fetch current user data
  useEffect(() => {
    const fetchMarketplaceData = async () => {
      try {
        setAuthLoading(true);
        const [meRes, catRes] = await Promise.all([
          axios.get("http://localhost:5000/api/v1/auth/getme", { withCredentials: true }),
          axios.get("http://localhost:5000/api/v1/posts/categories", { withCredentials: true })
        ]);

        if (meRes.data?.success || meRes.data?.statusCode === 200 || meRes.data?.message === 'Success' || meRes.data?.data) {
          const fetchedEmail = meRes.data.data?.email;
          const fetchedName = meRes.data.data?.name;
          if (fetchedEmail) {
            setUserEmail(fetchedEmail);
            setUserName(fetchedName || 'You');
          }
          if (meRes.data.data?.skills) {
            setCurrentUserSkillsState(meRes.data.data.skills.map((s: any) => s.skillName));
          }
        }

        if (catRes.data.statusCode === 200) {
          setBackendCategories(catRes.data.data);
        }
      } catch (error) {
        console.log('Error fetching initial data:', error);
      } finally {
        setAuthLoading(false);
      }
    };
    fetchMarketplaceData();
    dispatch(fetchPosts());
  }, [dispatch]);




  const addToast = (type: 'success' | 'error' | 'info', message: string) => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts(prev => [...prev, { id, type, message }]);
    setTimeout(() => removeToast(id), 5000);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await dispatch(fetchPosts());
    setIsRefreshing(false);
    addToast('info', 'Marketplace updated');
  };

  // Poll for updates every 30 seconds - REMOVED to prevent errors
  /*
  useEffect(() => {
    const interval = setInterval(() => {
      dispatch(fetchPosts());
    }, 30000);
    return () => clearInterval(interval);
  }, []);
  */

  // Get current user data
  const getCurrentUser = async () => {
    try {
      setAuthLoading(true);
      const res = await axios.get("http://localhost:5000/api/v1/auth/getme", {
        withCredentials: true,
      });

      if (res.data?.success || res.data?.statusCode === 200 || res.data?.message === 'Success' || res.data?.data) {
        const email = res.data.data?.email;
        const name = res.data.data?.name;
        if (email) {
          setUserEmail(email);
          setUserName(name || 'You');
        }
      }
    } catch (error) {
      console.log('User not logged in');
    } finally {
      setAuthLoading(false);
    }
  };

  // Handle view profile click
  const handleViewProfile = (skill: any) => {
    const user = users.find(u => u.id === skill.userId);
    if (user) {
      setSelectedProfile(user);
      setShowProfileModal(true);
    }
  };

  // Handle chat click
  const handleChatClick = (skill: any) => {
    setSelectedChatUser({
      id: skill.userId,
      name: skill.userName,
      avatar: skill.userAvatar,
      skill: skill.skillTitle
    });
    setShowChatModal(true);
    setChatMessages([]);
  };

  const handleSwapClick = (skill: any) => {
    setSelectedSwapUser({
      name: skill.userName,
      skill: skill.skillTitle,
      userId: skill.userId,
      skillId: skill.id
    });
    setShowSwapModal(true);
  };

  const handleSwapSubmit = (data: any) => {
    console.log('Swap requested:', data);
    // Simulate API call
    setTimeout(() => {
      addToast('success', `Swap request sent to ${selectedSwapUser?.name}!`);
    }, 500);
  };

  const handleReportClick = (skill: any) => {
    setSelectedReportPost(skill);
    setShowReportModal(true);
    setReportData({ subject: '', description: '' });
  };

  const handleReportSubmit = async () => {
    if (!selectedReportPost) return;
    if (!reportData.subject || !reportData.description) {
      addToast('error', 'Please fill in all report fields');
      return;
    }

    try {
      await dispatch(submitComplaint({
        subject: reportData.subject,
        description: reportData.description,
        targetId: selectedReportPost.userId,
        postId: parseInt(selectedReportPost.id)
      })).unwrap();
      
      addToast('success', 'Report submitted successfully');
      setShowReportModal(false);
      setReportData({ subject: '', description: '' });
    } catch (error: any) {
      addToast('error', error || 'Failed to submit report');
    }
  };

  // Send chat message
  const handleSendMessage = async () => {
    if (!chatMessage.trim() || !selectedChatUser?.id || !currentUserId) return;

    const messageText = chatMessage.trim();
    const newMessage = {
      text: messageText,
      sender: userName,
      time: 'Sending...',
      isSending: true
    };

    // Optimistically add message to chat
    setChatMessages(prev => [...prev, newMessage]);
    setChatMessage('');

    try {
      // Send message via API
      await dispatch(sendMessage({
        senderId: currentUserId,
        receiverId: selectedChatUser.id,
        content: messageText
      })).unwrap();

      // Update message status to sent
      setChatMessages(prev =>
        prev.map((msg, idx) =>
          idx === prev.length - 1
            ? { ...msg, time: 'Just now', isSending: false }
            : msg
        )
      );

      addToast('success', `Message sent to ${selectedChatUser.name}`);
    } catch (error: any) {
      console.error('Error sending message:', error);

      // Mark message as failed
      setChatMessages(prev =>
        prev.map((msg, idx) =>
          idx === prev.length - 1
            ? { ...msg, time: 'Failed to send', isSending: false }
            : msg
        )
      );

      addToast('error', 'Failed to send message. Please try again.');
    }
  };

  // Process posts to skills format for cards
  const processPostsToSkills = (posts: any[]) => {
    if (!posts) return [];
    return posts.map(post => {
      // Random category if missing
      const randomCategory = randomCategories[Math.floor(Math.random() * randomCategories.length)];

      return {
        id: post.id,
        userId: post.user?.id || 0,
        userName: post.user?.name || 'Unknown',
        userAvatar: post.user?.profile?.avatarUrl || getAvatarInitials(post.user?.name || 'U'),
        skillTitle: post.title ? (post.title.includes('<->') ? post.title.split('<->')[0].trim() : post.title) : 'Untitled',
        category: post.category?.name || randomCategory,
        rating: 4.5, // Mock rating
        reviews: Math.floor(Math.random() * 50) + 1, // Mock reviews
        location: post.location || post.user?.profile?.location || 'Remote',
        description: post.description,
        tags: generateDefaultTags(post.title || ''),
        isFeatured: post.isFeatured || false,
        isBookmarked: false, // Need to check user bookmarks
        userEmail: post.user?.email,
        userProfile: post.user?.profile,
        userSkills: post.user?.skills || []
      };
    });
  };



  // Helper function to get avatar initials
  const getAvatarInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Helper function to generate default tags
  const generateDefaultTags = (title: string): string[] => {
    const commonTags = ['Professional', 'Expert', 'Service', 'Consulting'];
    const titleWords = title.toLowerCase().split(' ');

    const matchingTags = commonTags.filter(tag =>
      titleWords.some(word => tag.toLowerCase().includes(word))
    );

    return matchingTags.length > 0 ? matchingTags : ['Professional', 'Expert'];
  };

  // Fetch all data on component mount
  // Fetch removed from simple useEffect, now in dispatch effect above

  const handleCreateListingClick = async () => {
    const activeEmail = userEmail || user?.email;
    if (!activeEmail) {
      await getCurrentUser();
    } else if (!userEmail && user?.email) {
      setUserEmail(user.email);
    }
    setShowCreateModal(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;

    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({
        ...prev,
        [name]: checked
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmitListing = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const listingData = {
        title: formData.title,
        description: formData.description,
        location: formData.location,
        isFeatured: formData.isFeatured,
        categoryId: parseInt(formData.categoryId) || undefined // Ensure it's number or undefined
      };

      const activeEmail = userEmail || user?.email;
      if (!activeEmail) {
        alert('Please log in to create a listing');
        setSubmitting(false);
        return;
      }

      await dispatch(createPost(listingData)).unwrap();

      addToast('success', 'Skill listing created successfully!');
      setShowCreateModal(false);

      // Reset form
      setFormData({
        title: '',
        description: '',
        location: '',
        isFeatured: false,
        categoryId: ''
      });
      // Force refresh of posts is handled by thunk usually if we wanted to refetch
      // dispatch(fetchPosts()); // Not needed if slice updates state

    } catch (error: any) {
      console.error('Error creating listing:', error);
      addToast('error', 'Failed to create listing. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const categories = [
    'All',
    ...backendCategories.map(cat => cat.name)
  ];


  // Get current user's skills for suggestions

  // Process users to skills for display
  // Process users to skills for display
  const skills = processPostsToSkills(reduxPosts);
  const featuredSkills = skills.filter((skill) => skill.isFeatured);

  // FIXED FILTER LOGIC
  const filteredSkills = skills.filter((skill) => {
    const matchesSearch = searchQuery === '' ||
      skill.skillTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      skill.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      skill.tags.some((tag: string) => tag.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory = selectedCategory === 'all' ||
      skill.category.toLowerCase() === selectedCategory.toLowerCase();

    return matchesSearch && matchesCategory;
  });


  return (
    <div className="min-h-screen bg-neutral-50 pt-20 pb-12">
      <NotificationToast toasts={toasts} removeToast={removeToast} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Create Listing Button */}
        <div className="flex justify-end mb-6">
          <button
            onClick={handleCreateListingClick}
            disabled={authLoading}
            className="flex items-center space-x-2 bg-success-600 hover:bg-success-700 text-white px-6 py-3 rounded-lg font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="w-5 h-5" />
            <span>
              {authLoading ? 'Loading...' : 'Create Your Listing'}
            </span>
          </button>
        </div>

        <div className="flex justify-between items-center mb-6">
          <h1 className="text-4xl font-bold text-neutral-900">Skill Marketplace</h1>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className={`p-2 rounded-full hover:bg-neutral-200 transition ${isRefreshing ? 'animate-spin' : ''}`}
            title="Refresh Listings"
          >
            <RefreshCw className="w-6 h-6 text-neutral-600" />
          </button>
        </div>

        {/* Create Listing Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-6 border-b border-neutral-200">
                <h2 className="text-2xl font-bold text-neutral-900">Create Skill Listing</h2>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-neutral-400 hover:text-neutral-600 transition"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSubmitListing} className="p-6 space-y-6">
                <div className="mb-4 p-3 bg-primary-50 rounded-lg">
                  <p className="text-sm text-primary-700">
                    <strong>Logged in as:</strong> {userEmail || user?.email || 'Loading...'}
                  </p>
                  {currentUserSkills.length > 0 && (
                    <p className="text-sm text-primary-600 mt-1">
                      <strong>Your top skills:</strong> {currentUserSkills.join(', ')}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Title *
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    required
                    placeholder="e.g., React Frontend Development"
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Category *
                  </label>
                  <select
                    name="categoryId"
                    value={formData.categoryId}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="">Select a category</option>
                    {backendCategories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Description *
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    required
                    rows={4}
                    placeholder="Describe your skills, experience, and what you can offer..."
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Location
                  </label>
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    placeholder="e.g., Islamabad"
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="isFeatured"
                    checked={formData.isFeatured}
                    onChange={handleInputChange}
                    className="w-4 h-4 text-primary-600 border-neutral-300 rounded focus:ring-primary-500"
                  />
                  <label className="ml-2 text-sm font-medium text-neutral-700">
                    Feature this listing
                  </label>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 border border-neutral-300 rounded-lg text-neutral-700 hover:bg-neutral-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting || (!userEmail && !user?.email)}
                    className="px-6 py-2 bg-success-600 text-white rounded-lg hover:bg-success-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? 'Creating...' : 'Create Listing'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Profile View Modal */}
        {showProfileModal && selectedProfile && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-6 border-b border-neutral-200">
                <h2 className="text-2xl font-bold text-neutral-900">{selectedProfile.name}'s Profile</h2>
                <button
                  onClick={() => setShowProfileModal(false)}
                  className="text-neutral-400 hover:text-neutral-600 transition"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="p-6">
                {/* Profile Header */}
                <div className="flex items-start space-x-6 mb-6">
                  {selectedProfile.profile?.avatarUrl ? (
                    <img
                      src={selectedProfile.profile.avatarUrl}
                      alt={selectedProfile.name}
                      className="w-24 h-24 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-24 h-24 bg-gradient-to-br from-primary-600 to-secondary-500 rounded-full flex items-center justify-center text-white font-bold text-2xl">
                      {getAvatarInitials(selectedProfile.name)}
                    </div>
                  )}
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-neutral-900 mb-2">{selectedProfile.name}</h3>
                    <div className="flex items-center space-x-4 text-sm text-neutral-600 mb-3">
                      {selectedProfile.profile?.location && (
                        <div className="flex items-center">
                          <MapPin className="w-4 h-4 mr-1" />
                          {selectedProfile.profile.location}
                        </div>
                      )}
                      <div className="flex items-center">
                        <Mail className="w-4 h-4 mr-1" />
                        {selectedProfile.email}
                      </div>
                    </div>
                    {selectedProfile.profile?.bio && (
                      <p className="text-neutral-700">{selectedProfile.profile.bio}</p>
                    )}
                  </div>
                </div>

                {/* Social Links */}
                {(selectedProfile.profile?.website || selectedProfile.profile?.socialLinks) && (
                  <div className="mb-6">
                    <h4 className="text-lg font-semibold text-neutral-900 mb-3">Links</h4>
                    <div className="flex space-x-4">
                      {selectedProfile.profile?.website && (
                        <a
                          href={selectedProfile.profile.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center space-x-2 text-primary-600 hover:text-primary-700"
                        >
                          <Globe className="w-4 h-4" />
                          <span>Website</span>
                        </a>
                      )}
                      {selectedProfile.profile?.socialLinks && (
                        <a
                          href={selectedProfile.profile.socialLinks}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center space-x-2 text-primary-600 hover:text-primary-700"
                        >
                          <Link className="w-4 h-4" />
                          <span>Social Media</span>
                        </a>
                      )}
                    </div>
                  </div>
                )}

                {/* Skills Section */}
                {selectedProfile.skills && selectedProfile.skills.length > 0 && (
                  <div className="mb-6">
                    <h4 className="text-lg font-semibold text-neutral-900 mb-3">Skills</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedProfile.skills.map((skill) => (
                        <span
                          key={skill.id}
                          className={`px-3 py-1 rounded-full text-xs font-medium ${skill.expertiseLevel === 'EXPERT'
                            ? 'bg-success-100 text-success-800'
                            : skill.expertiseLevel === 'INTERMEDIATE'
                              ? 'bg-warning-100 text-warning-800'
                              : 'bg-primary-100 text-primary-800'
                            }`}
                        >
                          {skill.skillName} ({skill.expertiseLevel})
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Listings Section */}
                {selectedProfile.listings && selectedProfile.listings.length > 0 && (
                  <div className="mb-6">
                    <h4 className="text-lg font-semibold text-neutral-900 mb-3">Listings</h4>
                    <div className="space-y-3">
                      {selectedProfile.listings.map((listing) => (
                        <div key={listing.id} className="border border-neutral-200 rounded-lg p-4">
                          <h5 className="font-semibold text-neutral-900 mb-1">{listing.title}</h5>
                          <p className="text-neutral-600 text-sm mb-2">{listing.description}</p>
                          <div className="flex justify-between items-center text-sm text-neutral-500">
                            <span>{listing.location}</span>
                            {listing.isFeatured && (
                              <span className="bg-warning-100 text-warning-800 px-2 py-1 rounded text-xs">
                                Featured
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Portfolios Section */}
                {selectedProfile.portfolios && selectedProfile.portfolios.length > 0 && (
                  <div>
                    <h4 className="text-lg font-semibold text-neutral-900 mb-3">Portfolio</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {selectedProfile.portfolios.map((portfolio) => (
                        <div key={portfolio.id} className="border border-neutral-200 rounded-lg p-4">
                          <h5 className="font-semibold text-neutral-900 mb-1">{portfolio.title}</h5>
                          <p className="text-neutral-600 text-sm mb-2">{portfolio.description}</p>
                          {portfolio.mediaUrl && (
                            <div className="mt-2">
                              {portfolio.mediaType === 'IMAGE' || portfolio.mediaUrl.match(/\.(jpg|jpeg|png|gif)$/i) ? (
                                <img
                                  src={portfolio.mediaUrl}
                                  alt={portfolio.title}
                                  className="w-full h-32 object-cover rounded"
                                />
                              ) : (
                                <a
                                  href={portfolio.mediaUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-primary-600 hover:text-primary-700 text-sm"
                                >
                                  View Document
                                </a>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Chat Modal */}
        {showChatModal && selectedChatUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full h-[600px] flex flex-col">
              <div className="flex items-center justify-between p-4 border-b border-neutral-200">
                <div className="flex items-center space-x-3">
                  {selectedChatUser.avatar && selectedChatUser.avatar.startsWith('http') ? (
                    <img
                      src={selectedChatUser.avatar}
                      alt={selectedChatUser.name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 bg-gradient-to-br from-primary-600 to-secondary-500 rounded-full flex items-center justify-center text-white font-bold">
                      {typeof selectedChatUser.avatar === 'string' ? selectedChatUser.avatar?.charAt(0)?.toUpperCase() : 'U'}
                    </div>
                  )}
                  <div>
                    <h3 className="font-semibold text-neutral-900">{selectedChatUser.name}</h3>
                    <p className="text-sm text-neutral-500">{selectedChatUser.skill}</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowChatModal(false)}
                  className="text-neutral-400 hover:text-neutral-600 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 p-4 overflow-y-auto space-y-4">
                {chatMessages.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-full text-neutral-400">
                    <MessageSquare className="w-12 h-12 mb-3" />
                    <p className="text-center">
                      Start a conversation with {selectedChatUser.name}
                    </p>
                  </div>
                )}
                {chatMessages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex ${message.sender === userName ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${message.sender === userName
                        ? 'bg-primary-600 text-white'
                        : 'bg-neutral-200 text-neutral-900'
                        }`}
                    >
                      <p className="text-sm">{message.text}</p>
                      <div className={`flex items-center space-x-1 text-xs mt-1 ${message.sender === userName ? 'text-primary-200' : 'text-neutral-500'}`}>
                        <span>{message.time}</span>
                        {message.sender === userName && !message.isSending && message.time !== 'Failed to send' && (
                          <CheckCircle className="w-3 h-3" />
                        )}
                        {message.isSending && (
                          <div className="w-3 h-3 border-2 border-primary-200 border-t-transparent rounded-full animate-spin" />
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-4 border-t border-neutral-200 space-y-3">
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={chatMessage}
                    onChange={(e) => setChatMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Type a message..."
                    className="flex-1 px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!chatMessage.trim()}
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
                <button
                  onClick={() => {
                    setShowChatModal(false);
                    navigate('/messages');
                  }}
                  className="w-full py-2 text-sm text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded-lg transition"
                >
                  View All Conversations →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Report Modal */}
        {showReportModal && selectedReportPost && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                            <AlertOctagon className="w-6 h-6 text-error-500" />
                            Report Post
                        </h3>
                        <button onClick={() => setShowReportModal(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                            <X className="w-5 h-5 text-gray-400" />
                        </button>
                    </div>
                    <p className="text-sm text-gray-600 mb-4">You are reporting the post by <strong>{selectedReportPost.userName}</strong>. Our admin team will review this report.</p>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Reason for reporting</label>
                            <select 
                                value={reportData.subject} 
                                onChange={e => setReportData({...reportData, subject: e.target.value})}
                                className="w-full p-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 bg-gray-50"
                            >
                                <option value="" disabled>Select a reason...</option>
                                <option value="Spam or Misleading">Spam or Misleading</option>
                                <option value="Inappropriate Content">Inappropriate Content</option>
                                <option value="Harassment or Abuse">Harassment or Abuse</option>
                                <option value="Fraudulent Post">Fraudulent Post</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Additional details</label>
                            <textarea 
                                value={reportData.description}
                                onChange={e => setReportData({...reportData, description: e.target.value})}
                                placeholder="Please provide more context to help us investigate..."
                                className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 bg-gray-50 resize-none h-24"
                            />
                        </div>
                        <div className="flex gap-3 pt-2">
                            <button onClick={() => setShowReportModal(false)} className="flex-1 py-2.5 border border-gray-200 rounded-xl font-medium text-gray-600 hover:bg-gray-50 transition-colors">Cancel</button>
                            <button onClick={handleReportSubmit} className="flex-1 py-2.5 bg-error-600 text-white rounded-xl font-bold hover:bg-error-700 transition-colors">Submit Report</button>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* Swap Request Modal */}
        {showSwapModal && selectedSwapUser && (
          <SwapRequestModal
            isOpen={showSwapModal}
            onClose={() => setShowSwapModal(false)}
            recipientName={selectedSwapUser.name}
            recipientSkill={selectedSwapUser.skill}
            skillId={selectedSwapUser.skillId}
            userSkills={currentUserSkills}
            onSubmit={handleSwapSubmit}
          />
        )}

        {/* REST OF THE MARKETPLACE UI */}
        <div className="mb-8">
          <p className="text-neutral-600">Discover talented professionals and collaborate on projects</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 w-5 h-5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search skills, people, or tags..."
                className="w-full pl-10 pr-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center justify-center space-x-2 px-6 py-3 border border-neutral-300 rounded-lg hover:bg-neutral-50 transition"
            >
              <Filter className="w-5 h-5" />
              <span>Filters</span>
            </button>
          </div>

          {showFilters && (
            <div className="mt-4 pt-4 border-t border-neutral-200">
              <h3 className="font-semibold text-neutral-900 mb-3">Category</h3>
              <div className="flex flex-wrap gap-2">
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category === 'All' ? 'all' : category)}
                    className={`px-4 py-2 rounded-lg font-medium transition ${selectedCategory === (category === 'All' ? 'all' : category.toLowerCase())
                      ? 'bg-primary-600 text-white'
                      : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                      }`}
                  >
                    {category}
                  </button>
                ))}
              </div>

              {/* User Skills Quick Filters */}
              {currentUserSkills.length > 0 && (
                <div className="mt-4">
                  <h3 className="font-semibold text-neutral-900 mb-3">Your Skills</h3>
                  <div className="flex flex-wrap gap-2">
                    {currentUserSkills.slice(0, 8).map((skillName) => (
                      <button
                        key={skillName}
                        onClick={() => setSearchQuery(skillName)}
                        className="px-3 py-1 bg-success-100 text-success-700 rounded-full text-sm font-medium hover:bg-success-200 transition"
                      >
                        {skillName}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-neutral-400 animate-spin" />
            </div>
            <h3 className="text-xl font-semibold text-neutral-900 mb-2">Loading skills...</h3>
          </div>
        ) : (
          <>
            {/* ALL SKILLS SECTION - MOVED ABOVE FEATURED */}
            <div className="mb-8">
              <div className="mb-4">
                <h2 className="text-2xl font-bold text-neutral-900">
                  All Skills
                  <span className="ml-2 text-lg font-normal text-neutral-500">
                    ({filteredSkills.length} results)
                  </span>
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredSkills.map((skill) => (
                  <SkillCard
                    key={`${skill.userId}-${skill.id}`}
                    skill={skill}
                    onViewProfile={handleViewProfile}
                    onChatClick={handleChatClick}
                    onSwapClick={handleSwapClick}
                    onReportClick={handleReportClick}
                  />
                ))}
              </div>

              {filteredSkills.length === 0 && (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Search className="w-8 h-8 text-neutral-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-neutral-900 mb-2">No skills found</h3>
                  <p className="text-neutral-600">Try adjusting your search or filters</p>
                </div>
              )}
            </div>

            {/* FEATURED SKILLS SECTION - MOVED BELOW ALL SKILLS */}
            {featuredSkills.length > 0 && (
              <div className="mb-8">
                <div className="flex items-center space-x-2 mb-4">
                  <TrendingUp className="w-6 h-6 text-primary-600" />
                  <h2 className="text-2xl font-bold text-neutral-900">Featured Skills</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {featuredSkills.map((skill) => (
                    <SkillCard
                      key={`${skill.userId}-${skill.id}`}
                      skill={skill}
                      onViewProfile={handleViewProfile}
                      onChatClick={handleChatClick}
                      onSwapClick={handleSwapClick}
                      onReportClick={handleReportClick}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div >
  );
}

// Updated SkillCard component with chat functionality
function SkillCard({ skill, onViewProfile, onChatClick, onSwapClick, onReportClick }: {
  skill: any;
  onViewProfile: (skill: any) => void;
  onChatClick: (skill: any) => void;
  onSwapClick: (skill: any) => void;
  onReportClick: (skill: any) => void;
}) {
  const [isBookmarked, setIsBookmarked] = useState(skill.isBookmarked);

  return (
    <div className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden group">
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            {skill.userAvatar && skill.userAvatar.startsWith('http') ? (
              <img
                src={skill.userAvatar}
                alt={skill.userName}
                className="w-12 h-12 rounded-full object-cover"
              />
            ) : (
              <div className="w-12 h-12 bg-gradient-to-br from-primary-600 to-secondary-500 rounded-full flex items-center justify-center text-white font-bold">
                {skill.userAvatar}
              </div>
            )}
            <div>
              <h3 className="font-semibold text-neutral-900">{skill.userName}</h3>
              <div className="flex items-center space-x-1">
                <Star className="w-4 h-4 text-warning-400 fill-current" />
                <span className="text-sm font-medium text-neutral-700">{skill.rating}</span>
                <span className="text-sm text-neutral-500">({skill.reviews})</span>
              </div>
            </div>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setIsBookmarked(!isBookmarked)}
              className="text-neutral-400 hover:text-primary-600 transition"
            >
              <Bookmark
                className={`w-5 h-5 ${isBookmarked ? 'fill-current text-primary-600' : ''}`}
              />
            </button>
            <button
              onClick={() => onReportClick(skill)}
              className="text-neutral-400 hover:text-error-500 transition"
              title="Report Post"
            >
              <AlertOctagon className="w-5 h-5" />
            </button>
          </div>
        </div>

        <h4 className="text-lg font-bold text-neutral-900 mb-2 group-hover:text-primary-600 transition">
          {skill.skillTitle}
        </h4>

        <p className="text-neutral-600 text-sm mb-4 line-clamp-2">{skill.description}</p>

        <div className="flex items-center text-sm text-neutral-500 mb-4">
          <MapPin className="w-4 h-4 mr-1" />
          {skill.location}
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          {skill.tags.map((tag: string, index: number) => (
            <span
              key={index}
              className="px-3 py-1 bg-primary-50 text-primary-600 rounded-full text-xs font-medium"
            >
              {tag}
            </span>
          ))}
        </div>

        <div className="flex space-x-2">
          <button
            onClick={() => onChatClick(skill)}
            className="flex-1 flex items-center justify-center space-x-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition"
          >
            <MessageSquare className="w-4 h-4" />
            <span>Chat</span>
          </button>
          <button
            onClick={() => onSwapClick(skill)}
            className="flex-1 flex items-center justify-center space-x-2 bg-accent-600 text-white px-4 py-2 rounded-lg hover:bg-accent-700 transition"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Swap</span>
          </button>
          <button
            onClick={() => onViewProfile(skill)}
            className="px-4 py-2 border border-neutral-300 rounded-lg hover:bg-neutral-50 transition"
          >
            View Profile
          </button>
        </div>
      </div>
    </div>
  );
}