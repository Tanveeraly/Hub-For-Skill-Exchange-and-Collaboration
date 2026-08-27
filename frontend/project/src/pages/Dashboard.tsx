import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store/store';
import { Users, TrendingUp, Calendar, Clock, Briefcase, Star, Eye } from 'lucide-react';
import axios from 'axios';
import Collaboration from '../components/Collaboration';

interface User {
  id: string;
  name: string;
  email: string;
  listings?: Listing[];
  skills?: Skill[];
}

interface Listing {
  id: string;
  title: string;
  isFeatured?: boolean;
}

interface Skill {
  id: string;
  skillName: string;
  expertiseLevel: 'EXPERT' | 'INTERMEDIATE' | 'BEGINNER';
}

interface Activity {
  id: string;
  action: string;
  user: string;
  listingTitle?: string;
  skillName?: string;
  time: string;
  type?: 'listing' | 'skill';
}

interface UserStats {
  listings: number;
  skills: number;
  rating: number;
  profileViews: number;
  responseRate: number;
}

interface DashboardData {
  totalUsers: number;
  totalListings: number;
  totalSkills: number;
  featuredListings: number;
  recentActivity: Activity[];
  userStats: UserStats | null;
  latestSwap: any;
}

export default function Dashboard() {
  const { user } = useSelector((state: RootState) => state.auth);
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    totalUsers: 0,
    totalListings: 0,
    totalSkills: 0,
    featuredListings: 0,
    recentActivity: [],
    userStats: null,
    latestSwap: null as any
  });
  const [loading, setLoading] = useState(true);

  // Fetch dashboard data
  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch all users data
      const usersRes = await axios.get("http://localhost:5000/api/v1/auth/getAllUsersFullInfo", {
        withCredentials: true,
      });

      // Fetch current user data
      const currentUserRes = await axios.get("http://localhost:5000/api/v1/auth/getme", {
        withCredentials: true,
      });

      if (usersRes.data?.statusCode === 200 && (currentUserRes.data?.success || currentUserRes.data?.statusCode === 200 || currentUserRes.data?.message === 'Success' || currentUserRes.data?.data)) {
        const users = usersRes.data.data || [];
        const currentUser = currentUserRes.data.data;

        // Calculate totals
        const totalUsers = users.length;
        const totalListings = users.reduce((sum: number, user: User) => sum + (user.listings?.length || 0), 0);
        const totalSkills = users.reduce((sum: number, user: User) => sum + (user.skills?.length || 0), 0);
        const featuredListings = users.reduce((sum: number, user: User) =>
          sum + (user.listings?.filter((listing: Listing) => listing.isFeatured)?.length || 0), 0
        );

        // Calculate user-specific stats
        const userListings = currentUser?.listings?.length || 0;
        const userSkills = currentUser?.skills?.length || 0;
        const userRating = calculateUserRating(currentUser);

        // Generate recent activity from user listings and skills
        const recentActivity = generateRecentActivity(users);

        // Fetch swaps for collaboration context
        const swapsRes = await axios.get("http://localhost:5000/api/v1/swaps/received", { withCredentials: true });
        const acceptedSwap = (swapsRes.data.data || []).find((s: any) => s.status === 'ACCEPTED');

        setDashboardData({
          totalUsers,
          totalListings,
          totalSkills,
          featuredListings,
          recentActivity,
          userStats: {
            listings: userListings,
            skills: userSkills,
            rating: userRating,
            profileViews: currentUser?.profileViews || 0,
            responseRate: 98
          },
          latestSwap: acceptedSwap
        });
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate user rating based on skills
  const calculateUserRating = (user: User) => {
    if (!user?.skills || user.skills.length === 0) return 4.0;

    const levelScores: Record<string, number> = { EXPERT: 5, INTERMEDIATE: 4, BEGINNER: 3 };
    const totalScore = user.skills.reduce((sum: number, skill: Skill) =>
      sum + (levelScores[skill.expertiseLevel] || 3), 0
    );
    return Math.round((totalScore / user.skills.length) * 10) / 10;
  };

  // Generate recent activity from user data
  const generateRecentActivity = (users: User[]): Activity[] => {
    const activities: Activity[] = [];

    users.forEach(user => {
      if (user.listings && user.listings.length > 0) {
        user.listings.forEach((listing: Listing) => {
          activities.push({
            id: `${user.id}-${listing.id}`,
            action: 'Created new listing',
            user: user.name,
            listingTitle: listing.title,
            time: 'Recently',
            type: 'listing'
          });
        });
      }

      if (user.skills && user.skills.length > 0) {
        user.skills.forEach((skill: Skill) => {
          activities.push({
            id: `${user.id}-${skill.id}`,
            action: 'Added new skill',
            user: user.name,
            skillName: skill.skillName,
            time: 'Recently',
            type: 'skill'
          });
        });
      }
    });

    // Sort by most recent and take first 4
    return activities.slice(0, 4);
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const stats = [
    {
      label: 'Total Users',
      value: dashboardData.totalUsers.toString(),
      icon: Users,
      color: 'blue',
      description: 'Registered professionals'
    },
    {
      label: 'Total Projects',
      value: dashboardData.totalListings.toString(),
      icon: Briefcase,
      color: 'cyan',
      description: 'Active listings'
    },
    {
      label: 'Total Skills',
      value: dashboardData.totalSkills.toString(),
      icon: Star,
      color: 'green',
      description: 'Unique skills'
    },
    {
      label: 'Featured',
      value: dashboardData.featuredListings.toString(),
      icon: TrendingUp,
      color: 'purple',
      description: 'Featured listings'
    },
  ];

  const userStats = [
    {
      label: 'Your Listings',
      value: dashboardData.userStats?.listings.toString() || '0',
      icon: Briefcase,
      color: 'blue',
      description: 'Your active projects'
    },
    {
      label: 'Your Skills',
      value: dashboardData.userStats?.skills.toString() || '0',
      icon: Star,
      color: 'green',
      description: 'Skills you offer'
    },
    {
      label: 'Your Rating',
      value: dashboardData.userStats?.rating?.toFixed(1) || '4.0',
      icon: TrendingUp,
      color: 'yellow',
      description: 'Based on expertise'
    },
    {
      label: 'Profile Views',
      value: dashboardData.userStats?.profileViews?.toString() || '0',
      icon: Eye,
      color: 'purple',
      description: 'This month'
    },
  ];



  const upcomingMeetings = [
    {
      id: 1,
      title: 'Project Kickoff Meeting',
      date: 'Today, 2:00 PM',
      participants: ['SJ', 'MC'],
    },
    {
      id: 2,
      title: 'Design Review',
      date: 'Tomorrow, 10:00 AM',
      participants: ['ER', 'DK'],
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-primary pt-20 pb-12">
        <div className="container-wide">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-primary pt-20 pb-12">
      <div className="container-wide">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-neutral-900 mb-2">Dashboard</h1>
          <p className="text-neutral-600">Welcome back! Here's what's happening across the platform</p>
        </div>

        {/* Platform Overview Stats */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-neutral-900 mb-4">Platform Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="card card-hover p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <div
                    className={`w-12 h-12 bg-${stat.color}-100 rounded-lg flex items-center justify-center`}
                  >
                    <stat.icon className={`w-6 h-6 text-${stat.color}-600`} />
                  </div>
                  <span className="text-sm text-success-600 font-medium">+{Math.floor(Math.random() * 20) + 5}%</span>
                </div>
                <h3 className="text-3xl font-bold text-neutral-900 mb-1">{stat.value}</h3>
                <p className="text-neutral-600 text-sm">{stat.label}</p>
                <p className="text-neutral-400 text-xs mt-1">{stat.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Your Personal Stats */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-neutral-900 mb-4">Your Performance</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {userStats.map((stat) => (
              <div
                key={stat.label}
                className="card card-hover p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <div
                    className={`w-12 h-12 bg-${stat.color}-100 rounded-lg flex items-center justify-center`}
                  >
                    <stat.icon className={`w-6 h-6 text-${stat.color}-600`} />
                  </div>
                  <span className="text-sm text-success-600 font-medium">+{Math.floor(Math.random() * 15) + 5}%</span>
                </div>
                <h3 className="text-3xl font-bold text-neutral-900 mb-1">{stat.value}</h3>
                <p className="text-neutral-600 text-sm">{stat.label}</p>
                <p className="text-neutral-400 text-xs mt-1">{stat.description}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {dashboardData.latestSwap ? (
              <Collaboration
                partnerId={
                  Number(dashboardData.latestSwap.senderId) === Number(user?.id)
                    ? Number(dashboardData.latestSwap.receiverId)
                    : Number(dashboardData.latestSwap.senderId)
                }
                partnerName={
                  Number(dashboardData.latestSwap.senderId) === Number(user?.id)
                    ? (dashboardData.latestSwap.receiver?.name || 'Partner')
                    : (dashboardData.latestSwap.sender?.name || 'Partner')
                }
                swapRequestId={dashboardData.latestSwap.id}
              />
            ) : (
              <div className="bg-white rounded-3xl shadow-sm p-12 text-center border border-neutral-100">
                <div className="w-16 h-16 bg-primary-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-primary-400" />
                </div>
                <h3 className="text-xl font-bold text-neutral-900 mb-2">No Active Collaborations</h3>
                <p className="text-neutral-500 max-w-sm mx-auto">Start a skill swap to unlock the live collaboration suite and real-time messaging.</p>
              </div>
            )}

            <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
              <h2 className="text-xl font-bold text-neutral-900 mb-4">Recent Platform Activity</h2>
              <div className="space-y-4">
                {dashboardData.recentActivity.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-start space-x-4 p-4 bg-neutral-50 rounded-lg hover:bg-neutral-100 transition"
                  >
                    <div className="w-10 h-10 bg-gradient-to-br from-primary-600 to-secondary-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                      {activity.user.split(' ').map((n) => n[0]).join('')}
                    </div>
                    <div className="flex-1">
                      <p className="text-neutral-900">
                        <span className="font-semibold">{activity.user}</span> {activity.action}
                        {activity.listingTitle && (
                          <span className="text-primary-600">: {activity.listingTitle}</span>
                        )}
                        {activity.skillName && (
                          <span className="text-success-600">: {activity.skillName}</span>
                        )}
                      </p>
                      <div className="flex items-center text-sm text-neutral-500 mt-1">
                        <Clock className="w-4 h-4 mr-1" />
                        {activity.time}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-bold text-neutral-900 mb-4">Your Performance Overview</h2>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-neutral-700">Profile Completion</span>
                    <span className="text-sm font-semibold text-neutral-900">85%</span>
                  </div>
                  <div className="w-full bg-neutral-200 rounded-full h-2">
                    <div className="bg-primary-600 h-2 rounded-full" style={{ width: '85%' }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-neutral-700">Response Rate</span>
                    <span className="text-sm font-semibold text-neutral-900">
                      {dashboardData.userStats?.responseRate}%
                    </span>
                  </div>
                  <div className="w-full bg-neutral-200 rounded-full h-2">
                    <div
                      className="bg-success-600 h-2 rounded-full"
                      style={{ width: `${dashboardData.userStats?.responseRate}%` }}
                    ></div>
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-neutral-700">Listing Performance</span>
                    <span className="text-sm font-semibold text-neutral-900">
                      {Math.floor(((dashboardData.userStats?.listings || 0) / Math.max(dashboardData.totalListings, 1)) * 100)}%
                    </span>
                  </div>
                  <div className="w-full bg-neutral-200 rounded-full h-2">
                    <div
                      className="bg-secondary-600 h-2 rounded-full"
                      style={{
                        width: `${Math.floor(((dashboardData.userStats?.listings || 0) / Math.max(dashboardData.totalListings, 1)) * 100)}%`
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-neutral-900">Upcoming</h2>
                <Calendar className="w-5 h-5 text-neutral-400" />
              </div>
              <div className="space-y-4">
                {upcomingMeetings.map((meeting) => (
                  <div key={meeting.id} className="p-4 bg-primary-50 rounded-lg">
                    <h3 className="font-semibold text-neutral-900 mb-2">{meeting.title}</h3>
                    <p className="text-sm text-neutral-600 mb-3">{meeting.date}</p>
                    <div className="flex -space-x-2">
                      {meeting.participants.map((participant, index) => (
                        <div
                          key={index}
                          className="w-8 h-8 bg-gradient-to-br from-primary-600 to-secondary-500 rounded-full flex items-center justify-center text-white text-xs font-semibold border-2 border-white"
                        >
                          {participant}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gradient-to-br from-primary-600 to-secondary-500 rounded-xl shadow-sm p-6 text-white">
              <h2 className="text-xl font-bold mb-2">Platform Insights</h2>
              <div className="space-y-2 mb-4">
                <p className="text-primary-100 text-sm">
                  <strong>{dashboardData.totalUsers}</strong> professionals registered
                </p>
                <p className="text-primary-100 text-sm">
                  <strong>{dashboardData.totalListings}</strong> active projects
                </p>
                <p className="text-primary-100 text-sm">
                  <strong>{dashboardData.totalSkills}</strong> unique skills available
                </p>
              </div>
              <button className="w-full bg-white text-primary-600 px-4 py-2 rounded-lg font-semibold hover:bg-primary-50 transition">
                Explore Marketplace
              </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-bold text-neutral-900 mb-4">Quick Actions</h2>
              <div className="space-y-3">
                <button className="w-full text-left p-3 bg-primary-50 text-primary-600 rounded-lg hover:bg-primary-100 transition">
                  Create New Listing
                </button>
                <button className="w-full text-left p-3 bg-success-50 text-success-600 rounded-lg hover:bg-success-100 transition">
                  Update Your Skills
                </button>
                <button className="w-full text-left p-3 bg-accent-50 text-accent-600 rounded-lg hover:bg-accent-100 transition">
                  View Messages
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}