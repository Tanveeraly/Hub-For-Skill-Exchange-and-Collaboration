
import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Search, MapPin, Bookmark, MessageSquare, Plus, X, AlertOctagon, ArrowLeftRight } from 'lucide-react';
import { fetchBookmarks, toggleBookmark } from '../store/slices/bookmarksSlice';
import axios from 'axios';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../store/store';
import { fetchPosts, createPost } from '../store/slices/postsSlice';
import { submitComplaint } from '../store/slices/adminSlice';
import NotificationToast, { Toast } from '../components/NotificationToast';
import SwapRequestModal from '../components/SwapRequestModal';
import { API_BASE } from '../config';
import { toast } from '../lib/toast';

interface CreateListingForm {
  title: string;
  description: string;
  location: string;
  isFeatured: boolean;
  categoryId: string;
}

export default function Marketplace() {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  useEffect(() => {
    setSearchQuery(searchParams.get('q') || '');
  }, [searchParams]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showSwapModal, setShowSwapModal] = useState(false);
  const [selectedSwapUser, setSelectedSwapUser] = useState<any>(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportData, setReportData] = useState({ subject: '', description: '' });
  const [selectedReportPost, setSelectedReportPost] = useState<any>(null);
  const { user } = useSelector((state: RootState) => state.auth);
  const [userEmail, setUserEmail] = useState<string | null>(user?.email || null);
  const [, setUserName] = useState<string>(user?.name || '');
  const [authLoading, setAuthLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { items: reduxPosts, loading } = useSelector((state: RootState) => state.posts);
  const currentUserId = Number(user?.id ?? 0);
  const [toasts, setToasts] = useState<Toast[]>([]);
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
          axios.get(`${API_BASE}/auth/getme`, { withCredentials: true }),
          axios.get(`${API_BASE}/posts/categories`, { withCredentials: true })
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
      const res = await axios.get(`${API_BASE}/auth/getme`, {
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



  const handleSwapClick = (skill: any) => {
    setSelectedSwapUser({
      name: skill.userName,
      skill: skill.skillTitle,
      userId: skill.userId,
      skillId: skill.id
    });
    setShowSwapModal(true);
  };

  const handleSwapSubmit = () => {
    toast.success(`Swap request sent to ${selectedSwapUser?.name}. Follow its progress in My swaps.`);
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


  // Process posts to skills format for cards
  const processPostsToSkills = (posts: any[]) => {
    if (!posts) return [];
    return posts.map(post => {
      // Listings made from Home are titled "offered <-> wanted".
      const [offers, wants] = (post.title || 'Untitled').split('<->').map((part: string) => part.trim());
      return {
        id: post.id,
        userId: post.user?.id || 0,
        userName: post.user?.name || 'Community member',
        userAvatar: post.user?.profile?.avatarUrl || getAvatarInitials(post.user?.name || 'U'),
        skillTitle: offers || 'Untitled',
        wants: wants && wants.toLowerCase() !== 'any' ? wants : '',
        category: post.category?.name || 'Other',
        location: post.location || post.user?.profile?.location || 'Online',
        description: post.description,
        tags: [] as string[],
        isFeatured: post.isFeatured || false,
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
        toast.info('Sign in to create a listing.');
        navigate('/login');
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
  const skills = processPostsToSkills(reduxPosts);


  // FIXED FILTER LOGIC
  const filteredSkills = skills.filter((skill) => {
    const matchesSearch = searchQuery === '' ||
      skill.skillTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      skill.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (skill.wants || '').toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = selectedCategory === 'all' ||
      skill.category.toLowerCase() === selectedCategory.toLowerCase();

    return matchesSearch && matchesCategory;
  });


  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);
  const bookmarkItems = useSelector((state: RootState) => state.bookmarks.items) as any[];
  const bookmarkedIds = new Set<number>(bookmarkItems.map((b: any) => Number(b.skillId)));
  const [matchMine, setMatchMine] = useState(false);
  const [showGuide, setShowGuide] = useState(() => {
    try { return localStorage.getItem('hfs.marketGuideDismissed') !== '1'; } catch { return true; }
  });

  useEffect(() => {
    if (isAuthenticated) dispatch(fetchBookmarks());
  }, [isAuthenticated, dispatch]);

  const dismissGuide = () => {
    setShowGuide(false);
    try { localStorage.setItem('hfs.marketGuideDismissed', '1'); } catch { /* ignore */ }
  };

  // Logged-out visitors can browse; anything that needs an account sends them to sign in.
  const requireAccount = (reason: string) => {
    if (isAuthenticated) return true;
    toast.info(`Sign in to ${reason}.`);
    navigate('/login');
    return false;
  };

  const handleBookmark = async (skill: any) => {
    if (!requireAccount('save listings')) return;
    try {
      const res = await dispatch(toggleBookmark(Number(skill.id))).unwrap();
      toast.success(res.bookmarked ? 'Saved. You can find it in your bookmarks.' : 'Removed from your saved listings.');
      dispatch(fetchBookmarks());
    } catch {
      toast.error('Could not update your saved listings. Please try again.');
    }
  };

  const mySkillsLower = currentUserSkills.map((s) => s.toLowerCase());
  const wantsWhatITeach = (skill: any) =>
    !!skill.wants && mySkillsLower.some((mine) => skill.wants.toLowerCase().includes(mine) || mine.includes(skill.wants.toLowerCase()));

  const visibleSkills = filteredSkills
    .filter((skill) => !matchMine || wantsWhatITeach(skill))
    .sort((a, b) => Number(b.isFeatured) - Number(a.isFeatured));

  const hasFilters = searchQuery !== '' || selectedCategory !== 'all' || matchMine;
  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setMatchMine(false);
    if (searchParams.get('q')) navigate('/marketplace', { replace: true });
  };
  const peopleCount = new Set(skills.map((s) => s.userId)).size;

  return (
    <div className="pb-12">
      <NotificationToast toasts={toasts} removeToast={removeToast} />
        {/* Create Listing Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl border border-neutral-200 bg-white shadow-xl">
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

        {/* Report Modal */}
        {showReportModal && selectedReportPost && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-lg">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-bold text-neutral-900 flex items-center gap-2">
                            <AlertOctagon className="w-6 h-6 text-error-500" />
                            Report Post
                        </h3>
                        <button onClick={() => setShowReportModal(false)} className="p-2 hover:bg-neutral-100 rounded-full transition-colors">
                            <X className="w-5 h-5 text-neutral-400" />
                        </button>
                    </div>
                    <p className="text-sm text-neutral-600 mb-4">You are reporting the post by <strong>{selectedReportPost.userName}</strong>. Our admin team will review this report.</p>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-bold text-neutral-700 mb-1">Reason for reporting</label>
                            <select 
                                value={reportData.subject} 
                                onChange={e => setReportData({...reportData, subject: e.target.value})}
                                className="w-full p-2.5 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-primary-500 bg-neutral-50"
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
                            <label className="block text-sm font-bold text-neutral-700 mb-1">Additional details</label>
                            <textarea 
                                value={reportData.description}
                                onChange={e => setReportData({...reportData, description: e.target.value})}
                                placeholder="Please provide more context to help us investigate..."
                                className="w-full p-3 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-primary-500 bg-neutral-50 resize-none h-24"
                            />
                        </div>
                        <div className="flex gap-3 pt-2">
                            <button onClick={() => setShowReportModal(false)} className="flex-1 py-2.5 border border-neutral-200 rounded-xl font-medium text-neutral-600 hover:bg-neutral-50 transition-colors">Cancel</button>
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


      <div className="mx-auto max-w-6xl">
        <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-neutral-900">Find skills</h1>
            <p className="mt-1 text-sm text-neutral-600">
              {skills.length > 0
                ? `${skills.length} skill${skills.length === 1 ? '' : 's'} offered by ${peopleCount} ${peopleCount === 1 ? 'person' : 'people'}.`
                : 'Browse what people teach and offer one of your skills in return.'}
            </p>
          </div>
          <button
            onClick={() => { if (requireAccount('list a skill')) handleCreateListingClick(); }}
            disabled={authLoading}
            className="inline-flex items-center justify-center gap-2 rounded-md bg-primary-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-60"
          >
            <Plus className="h-4 w-4" />
            List a skill you teach
          </button>
        </header>

        {showGuide && (
          <section className="mb-6 rounded-lg border border-neutral-200 bg-white p-4" aria-label="How to start a swap">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-sm font-semibold text-neutral-900">How to start a swap</h2>
                <ol className="mt-2 grid gap-2 text-sm text-neutral-600 sm:grid-cols-3">
                  <li><span className="font-medium text-neutral-900">1.</span> Find a listing for something you want to learn.</li>
                  <li><span className="font-medium text-neutral-900">2.</span> Press <span className="font-medium text-neutral-900">Request swap</span> and choose a skill to offer back.</li>
                  <li><span className="font-medium text-neutral-900">3.</span> Suggest times. Follow the reply in <span className="font-medium text-neutral-900">My swaps</span>.</li>
                </ol>
              </div>
              <button onClick={dismissGuide} className="shrink-0 rounded p-1 text-neutral-400 hover:text-neutral-700" aria-label="Hide this guide">
                <X className="h-4 w-4" />
              </button>
            </div>
          </section>
        )}

        {/* Search and filters are always visible: no hidden "Filters" panel to discover. */}
        <section className="mb-6 space-y-3">
          <label className="flex items-center gap-2 rounded-md border border-neutral-300 bg-white px-3 py-2.5 focus-within:border-primary-500 focus-within:ring-2 focus-within:ring-primary-100">
            <Search className="h-4 w-4 text-neutral-500" aria-hidden />
            <span className="sr-only">Search skills</span>
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by skill or person, e.g. “React” or “Ayesha”"
              className="w-full bg-transparent text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none"
            />
          </label>

          {categories.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-1" role="group" aria-label="Category">
            {categories.map((category) => {
              const value = category === 'All' ? 'all' : category;
              const active = selectedCategory.toLowerCase() === value.toLowerCase();
              return (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(value)}
                  aria-pressed={active}
                  className={`whitespace-nowrap rounded-full border px-3 py-1.5 text-sm ${
                    active ? 'border-primary-600 bg-primary-50 font-medium text-primary-700' : 'border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-50'
                  }`}
                >
                  {category}
                </button>
              );
            })}
          </div>
          )}

          {isAuthenticated && currentUserSkills.length > 0 && (
            <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-neutral-700">
              <input
                type="checkbox"
                checked={matchMine}
                onChange={(e) => setMatchMine(e.target.checked)}
                className="h-4 w-4 rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
              />
              Only show people who want to learn what I teach
              <span className="text-neutral-500">({currentUserSkills.slice(0, 3).join(', ')}{currentUserSkills.length > 3 ? '…' : ''})</span>
            </label>
          )}
        </section>

        {loading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3" aria-busy="true" aria-label="Loading skills">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-56 rounded-lg skeleton" />
            ))}
          </div>
        ) : skills.length === 0 ? (
          <div className="rounded-lg border border-dashed border-neutral-300 bg-white p-10 text-center">
            <h2 className="text-lg font-semibold text-neutral-900">No skills listed yet</h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-neutral-600">Be the first. List something you can teach and others will be able to send you swap requests.</p>
            <button
              onClick={() => { if (requireAccount('list a skill')) handleCreateListingClick(); }}
              className="mt-5 rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
            >
              List a skill you teach
            </button>
          </div>
        ) : (
          <>
            <div className="mb-3 flex items-center justify-between text-sm">
              <p className="text-neutral-600">
                {visibleSkills.length === skills.length ? `Showing all ${skills.length}` : `${visibleSkills.length} of ${skills.length} match`}
              </p>
              {hasFilters && (
                <button onClick={clearFilters} className="font-medium text-primary-700 hover:underline">Clear filters</button>
              )}
            </div>

            {visibleSkills.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {visibleSkills.map((skill) => (
                  <SkillCard
                    key={`${skill.userId}-${skill.id}`}
                    skill={skill}
                    isOwn={isAuthenticated && skill.userId === currentUserId}
                    isBookmarked={bookmarkedIds.has(Number(skill.id))}
                    wantsWhatITeach={isAuthenticated && wantsWhatITeach(skill)}
                    onViewProfile={() => navigate(isAuthenticated && skill.userId === currentUserId ? '/profile' : `/profile/${skill.userId}`)}
                    onChatClick={() => {
                      if (!requireAccount('send messages')) return;
                      const photo = typeof skill.userAvatar === 'string' && skill.userAvatar.startsWith('http') ? skill.userAvatar : undefined;
                      navigate('/messages', { state: { startChatWith: { id: skill.userId, name: skill.userName, avatarUrl: photo } } });
                    }}
                    onSwapClick={() => { if (requireAccount('request a swap')) handleSwapClick(skill); }}
                    onReportClick={() => { if (requireAccount('report a listing')) handleReportClick(skill); }}
                    onBookmark={() => handleBookmark(skill)}
                  />
                ))}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-neutral-300 bg-white p-10 text-center">
                <h2 className="text-lg font-semibold text-neutral-900">
                  {searchQuery ? `No skills match “${searchQuery}”` : 'No skills match these filters'}
                </h2>
                <p className="mt-2 text-sm text-neutral-600">Try a shorter word, another category, or clear the filters.</p>
                <button onClick={clearFilters} className="mt-5 rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-800 hover:bg-neutral-50">
                  Clear filters
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function SkillCard({ skill, isOwn, isBookmarked, wantsWhatITeach, onViewProfile, onChatClick, onSwapClick, onReportClick, onBookmark }: {
  skill: any;
  isOwn: boolean;
  isBookmarked: boolean;
  wantsWhatITeach: boolean;
  onViewProfile: () => void;
  onChatClick: () => void;
  onSwapClick: () => void;
  onReportClick: () => void;
  onBookmark: () => void;
}) {
  const hasPhoto = typeof skill.userAvatar === 'string' && skill.userAvatar.startsWith('http');

  return (
    <article className="flex flex-col rounded-lg border border-neutral-200 bg-white p-4 transition-colors hover:border-neutral-300">
      <div className="flex items-start justify-between gap-3">
        <button onClick={onViewProfile} className="flex min-w-0 items-center gap-3 text-left">
          {hasPhoto ? (
            <img src={skill.userAvatar} alt="" className="h-10 w-10 rounded-full object-cover" />
          ) : (
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-100 text-sm font-semibold text-primary-700">
              {skill.userAvatar || 'U'}
            </span>
          )}
          <span className="min-w-0">
            <span className="block truncate text-sm font-medium text-neutral-900 hover:underline">{isOwn ? 'You' : skill.userName}</span>
            <span className="flex items-center gap-1 truncate text-xs text-neutral-500">
              <MapPin className="h-3 w-3" />
              {skill.location}
            </span>
          </span>
        </button>

        {!isOwn && (
          <div className="flex shrink-0 items-center">
            <button
              onClick={onBookmark}
              className={`rounded p-1.5 hover:bg-neutral-100 ${isBookmarked ? 'text-primary-600' : 'text-neutral-400 hover:text-neutral-700'}`}
              aria-label={isBookmarked ? 'Remove from saved' : 'Save listing'}
              aria-pressed={isBookmarked}
              title={isBookmarked ? 'Saved' : 'Save'}
            >
              <Bookmark className={`h-4 w-4 ${isBookmarked ? 'fill-current' : ''}`} />
            </button>
            <button
              onClick={onReportClick}
              className="rounded p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-error-600"
              aria-label="Report this listing"
              title="Report"
            >
              <AlertOctagon className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      <div className="mt-4 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-neutral-500">{skill.category}</span>
          {skill.isFeatured && <span className="rounded bg-warning-50 px-1.5 py-0.5 text-[11px] font-medium text-warning-700">Featured</span>}
          {wantsWhatITeach && !isOwn && <span className="rounded bg-success-50 px-1.5 py-0.5 text-[11px] font-medium text-success-700">Good match for you</span>}
        </div>
        <h3 className="mt-1 text-base font-semibold text-neutral-900">
          <span className="text-sm font-normal text-neutral-500">Teaches </span>{skill.skillTitle}
        </h3>
        {skill.wants && (
          <p className="mt-1 text-sm text-neutral-700">
            <span className="text-neutral-500">Wants to learn </span>{skill.wants}
          </p>
        )}
        {skill.description && <p className="mt-2 line-clamp-2 text-sm text-neutral-600">{skill.description}</p>}
      </div>

      <div className="mt-4 flex gap-2 border-t border-neutral-100 pt-4">
        {isOwn ? (
          <button onClick={onViewProfile} className="flex-1 rounded-md border border-neutral-300 px-3 py-2 text-sm font-medium text-neutral-800 hover:bg-neutral-50">
            Your listing · view profile
          </button>
        ) : (
          <>
            <button
              onClick={onSwapClick}
              className="flex flex-1 items-center justify-center gap-2 rounded-md bg-primary-600 px-3 py-2 text-sm font-medium text-white hover:bg-primary-700"
            >
              <ArrowLeftRight className="h-4 w-4" />
              Request swap
            </button>
            <button
              onClick={onChatClick}
              className="flex items-center justify-center gap-2 rounded-md border border-neutral-300 px-3 py-2 text-sm font-medium text-neutral-800 hover:bg-neutral-50"
            >
              <MessageSquare className="h-4 w-4" />
              Message
            </button>
          </>
        )}
      </div>
    </article>
  );
}
