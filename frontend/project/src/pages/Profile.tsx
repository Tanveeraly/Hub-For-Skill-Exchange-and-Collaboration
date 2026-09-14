import { useState, useEffect } from "react";
import {
  Camera,
  Upload,
  X,
  Plus,
  Edit2,
  Save,
  Globe,
  MapPin,
  Briefcase,
  Mail,
  Award,
  FileText,
  Video,
  Image,
  Download,
  Layout,
  ExternalLink,
  Github as GithubIcon,
  Twitter as TwitterIcon,
  Linkedin as LinkedinIcon,
  Lock,
  Eye as EyeIcon,
} from "lucide-react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import SkillModal from "../components/SkillModal";
import { useDispatch } from "react-redux";
import { AppDispatch } from "../store/store";
import { updatePostVisibility } from "../store/slices/postsSlice";
import Tabs from "../components/ui/Tabs";

interface PortfolioItem {
  id: string;
  title: string;
  description: string;
  mediaType: "image" | "document" | "video";
  url: string;
  createdAt: string;
}

interface UserProfile {
  id: number;
  name: string;
  email: string;
  isVerified: boolean;
  bio?: string;
  location?: string;
  website?: string;
  socialLink?: string;
  avatrurl?: string;
  coverimageUrl?: string;
  skills?: string[];
}

interface UserSkill {
  id: number;
  skillName: string;
  expertiseLevel: "Beginner" | "Intermediate" | "Advanced" | "Expert";
  userId: number;
  createdAt: string;
}

// Helper function to normalize expertise level case from backend
const normalizeExpertiseLevel = (level: string): "Beginner" | "Intermediate" | "Advanced" | "Expert" => {
  const normalized = level.charAt(0).toUpperCase() + level.slice(1).toLowerCase();
  return normalized as "Beginner" | "Intermediate" | "Advanced" | "Expert";
};

export default function Profile() {
  const dispatch = useDispatch<AppDispatch>();
  const [isEditing, setIsEditing] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [activeTab, setActiveTab] = useState<"about" | "skills" | "portfolio" | "listings">("about");
  const [isSkillModalOpen, setIsSkillModalOpen] = useState(false);
  const [profileVisibility, setProfileVisibility] = useState<'PUBLIC' | 'PRIVATE'>('PUBLIC');

  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState("");
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState("");
  const [portfolioFile, setPortfolioFile] = useState<File | null>(null);

  const [profile, setProfile] = useState<UserProfile>({
    id: 0,
    name: "",
    email: "",
    isVerified: false,
    bio: "",
    location: "",
    website: "",
    socialLink: "",
    avatrurl: "",
    coverimageUrl: "",
    skills: [],
  });

  const [portfolioItems, setPortfolioItems] = useState<PortfolioItem[]>([]);
  const [userSkills, setUserSkills] = useState<UserSkill[]>([]);
  const [userListings, setUserListings] = useState<any[]>([]); // Added listings state

  const handleAddSkills = async (skills: { name: string, level: string }[]) => {
    try {
      setLoading(true);
      setError("");

      const response = await axios.post(
        `http://localhost:5000/api/v1/auth/addMultipleUserSkills/${profile.email}`,
        {
          skills: skills.map(skill => ({
            skillName: skill.name,
            expertiseLevel: skill.level
          }))
        },
        {
          headers: { "Content-Type": "application/json" },
          withCredentials: true,
        }
      );

      if (response.data.statusCode === 201 || response.data.message.includes("skills added successfully")) {
        const addedSkills = response.data.data;
        setUserSkills(prev => [
          ...prev,
          ...addedSkills.map((s: any) => ({
            ...s,
            expertiseLevel: normalizeExpertiseLevel(s.expertiseLevel)
          }))
        ]);
        setSuccess(`${addedSkills.length} skills added successfully!`);
      }
    } catch (err: any) {
      console.error("Skill add error:", err);
      setError(err.response?.data?.message || "Failed to add skills");
    } finally {
      setLoading(false);
    }
  };

  const [portfolioData, setPortfolioData] = useState({
    title: "",
    description: "",
    mediaType: "image" as "image" | "document" | "video",
  });

  const [validationErrors, setValidationErrors] = useState({
    bio: "",
    website: "",
    location: "",
    socialLink: "",
    portfolioTitle: "",
    portfolioDescription: "",
    skillName: "",
  });

  // Predefined skills list for autocomplete/suggestions
  // No longer using manual skill arrays as SkillModal handles it

  const handleRemoveSkill = async (skillId: number) => {
    try {
      setLoading(true);
      setError("");

      await axios.delete(
        `http://localhost:5000/api/v1/auth/removeUserSkill/${skillId}`,
        { withCredentials: true }
      );

      setUserSkills(prev => prev.filter(skill => skill.id !== skillId));
      setSuccess("Skill removed successfully!");
    } catch (err: any) {
      console.error("Skill remove error:", err);
      setError(err.response?.data?.message || "Failed to remove skill");
    } finally {
      setLoading(false);
    }
  };

  const getExpertiseColor = (level: string) => {
    switch (level) {
      case "Beginner":
        return "bg-success-50 text-success-700 border-success-100";
      case "Intermediate":
        return "bg-sky-50 text-sky-700 border-sky-100";
      case "Advanced":
        return "bg-primary-50 text-primary-700 border-indigo-100";
      case "Expert":
        return "bg-rose-50 text-rose-700 border-rose-100";
      default:
        return "bg-neutral-50 text-neutral-700 border-neutral-100";
    }
  };

  // ---------------------- FETCH PROFILE ----------------------
  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await axios.get("http://localhost:5000/api/v1/auth/getme", {
        withCredentials: true,
      });

      if (response.data.statusCode === 200 || response.data.message === "User fetched successfully") {
        const data = response.data.data;

        setProfile({
          id: data.id,
          name: data.name,
          email: data.email,
          isVerified: data.isVerified,
          bio: data.profile?.bio || "",
          location: data.profile?.location || "",
          website: data.profile?.website || "",
          socialLink: data.profile?.socialLinks || "",
          avatrurl: data.profile?.avatarUrl || "",
          coverimageUrl: data.profile?.coverimageUrl || "",
          skills: data.skills || [],
        });
        setProfileVisibility(data.profile?.profileVisibility || 'PUBLIC');

        await fetchPortfolioItems(data.email);
        await fetchUserSkills(data.email);
        await fetchUserListings(); // Fetch listings
      }
    } catch (err: any) {
      console.error("Profile fetch error:", err);
      setError(err.response?.data?.message || "Failed to fetch profile");
    } finally {
      setLoading(false);
    }
  };

  const fetchUserSkills = async (email: string) => {
    try {
      console.log("Fetching user skills for:", email);
      const response = await axios.get(
        `http://localhost:5000/api/v1/auth/getUserSkills/${email}`,
        { withCredentials: true }
      );

      console.log("Skills API Response:", response.data);

      if (response.data.statusCode === 200 || response.data.message === "User skills fetched successfully") {
        // Normalize the expertise levels to match frontend expectations (Beginner, not BEGINNER)
        const skillsData = (response.data.data || []).map((skill: any) => ({
          ...skill,
          expertiseLevel: normalizeExpertiseLevel(skill.expertiseLevel)
        }));
        console.log("Normalized skills data:", skillsData);
        setUserSkills(skillsData);
      }
    } catch (err) {
      console.error("Skills fetch error:", err);
      // Don't show error to user as skills might not exist yet
    }
  };

  const fetchPortfolioItems = async (email: string) => {
    try {
      console.log("Fetching portfolio items for:", email);
      const response = await axios.get(
        `http://localhost:5000/api/v1/auth/getUserPortfolios/${email}`,
        { withCredentials: true }
      );

      console.log("Portfolio API Response:", response.data);

      if (response.data.statusCode === 200 || response.data.message === "Portfolio fetched successfully") {
        const portfolioData = response.data.data || [];

        // Map the API response to match our frontend interface
        const formattedPortfolio = portfolioData.map((item: any) => ({
          id: item.id.toString(),
          title: item.title,
          description: item.description,
          mediaType: getMediaTypeFromUrl(item.mediaUrl) || "image",
          url: item.mediaUrl,
          createdAt: item.createdAt
        }));

        console.log("Formatted portfolio items:", formattedPortfolio);
        setPortfolioItems(formattedPortfolio);
      }
    } catch (err: any) {
      console.error("Portfolio fetch error:", err);
      console.log("Portfolio error details:", err.response?.data);
    }
  };

  const fetchUserListings = async () => {
    try {
      const response = await axios.get("http://localhost:5000/api/v1/posts/my-posts", {
        withCredentials: true
      });
      if (response.data.statusCode === 200 || response.data.success) {
        setUserListings(response.data.data);
      }
    } catch (err) {
      console.error("Error fetching user listings:", err);
    }
  };

  // Helper function to determine media type from URL
  const getMediaTypeFromUrl = (url: string): "image" | "document" | "video" => {
    if (!url) return "image";

    const extension = url.split('.').pop()?.toLowerCase();
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'];
    const videoExtensions = ['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm'];
    const documentExtensions = ['pdf', 'doc', 'docx', 'txt', 'ppt', 'pptx'];

    if (imageExtensions.includes(extension || '')) return "image";
    if (videoExtensions.includes(extension || '')) return "video";
    if (documentExtensions.includes(extension || '')) return "document";

    return "image"; // default to image
  };

  // ---------------------- VALIDATIONS ----------------------
  const validateURL = (url: string) => {
    if (!url) return true;
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const validateSocialLink = (link: string) => {
    if (!link) return true;
    const socialPatterns = [
      /^https?:\/\/(www\.)?(linkedin\.com|github\.com|twitter\.com|x\.com)/i,
    ];
    return socialPatterns.some((pattern) => pattern.test(link));
  };

  const handleProfileChange = (field: string, value: string) => {
    setProfile({ ...profile, [field]: value });
    setValidationErrors({ ...validationErrors, [field]: "" });

    if (field === "website" && value && !validateURL(value)) {
      setValidationErrors({ ...validationErrors, website: "Invalid URL format" });
    }

    if (field === "socialLink" && value && !validateSocialLink(value)) {
      setValidationErrors({
        ...validationErrors,
        socialLink: "Enter a valid LinkedIn, GitHub, or Twitter URL",
      });
    }

    if (field === "bio" && value.length > 500) {
      setValidationErrors({ ...validationErrors, bio: "Bio must be under 500 characters" });
    }
  };

  // ---------------------- AVATAR & COVER ----------------------
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setError(""); // Clear previous errors
      setSuccess(""); // Clear previous success messages
      if (file.size > 5 * 1024 * 1024) {
        setError("Avatar image must be less than 5MB");
        return;
      }
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setError(""); // Clear previous errors
      setSuccess(""); // Clear previous success messages
      if (file.size > 10 * 1024 * 1024) {
        setError("Cover image must be less than 10MB");
        return;
      }
      setCoverFile(file);
      setCoverPreview(URL.createObjectURL(file));
    }
  };

  // ---------------------- UPDATE PROFILE ----------------------
  const handleProfileUpdate = async () => {
    try {
      const hasErrors = Object.values(validationErrors).some((err) => err !== "");
      if (hasErrors) {
        setError("Please fix validation errors before saving.");
        return;
      }

      setLoading(true);
      setError("");
      setSuccess("");

      const formData = new FormData();
      if (avatarFile) formData.append("avatrurl", avatarFile);
      if (coverFile) formData.append("coverimageurl", coverFile);
      formData.append("bio", profile.bio || "");
      formData.append("website", profile.website || "");
      formData.append("location", profile.location || "");
      formData.append("socialLink", profile.socialLink || "");
      formData.append("profileVisibility", profileVisibility);

      await axios.post(
        `http://localhost:5000/api/v1/auth/update-profile/${profile.email}`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
          withCredentials: true,
        }
      );

      setSuccess("Profile updated successfully!");
      setIsEditing(false);
      setAvatarFile(null);
      setAvatarPreview("");
      await fetchUserProfile();
    } catch (err: any) {
      console.error("Profile update error:", err);
      setError(err.response?.data?.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  // ---------------------- PORTFOLIO ----------------------
  const handlePortfolioFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 50 * 1024 * 1024) {
        setError("File must be less than 50MB");
        return;
      }
      setPortfolioFile(file);
    }
  };

  const handlePortfolioUpload = async () => {
    setValidationErrors({
      ...validationErrors,
      portfolioTitle: "",
      portfolioDescription: "",
    });

    if (!portfolioData.title.trim()) {
      setValidationErrors(prev => ({ ...prev, portfolioTitle: "Title is required" }));
      return;
    }
    if (!portfolioData.description.trim()) {
      setValidationErrors(prev => ({ ...prev, portfolioDescription: "Description is required" }));
      return;
    }
    if (!portfolioFile) {
      setError("Please select a file.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setSuccess("");

      const formData = new FormData();
      formData.append("file", portfolioFile);
      formData.append("title", portfolioData.title);
      formData.append("description", portfolioData.description);

      console.log("Uploading portfolio item:", {
        title: portfolioData.title,
        description: portfolioData.description,
        file: portfolioFile.name
      });

      const response = await axios.post(
        `http://localhost:5000/api/v1/auth/addPortfolio/${profile.email}`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
          withCredentials: true,
        }
      );

      console.log("Portfolio upload response:", response.data);

      if (response.data.statusCode === 200 || response.data.message === "Portfolio added successfully") {
        const newItem = response.data.data;
        // Format the new item to match our interface
        const formattedItem = {
          id: newItem.id.toString(),
          title: newItem.title,
          description: newItem.description,
          mediaType: getMediaTypeFromUrl(newItem.mediaUrl) || "image",
          url: newItem.mediaUrl,
          createdAt: newItem.createdAt
        };

        setPortfolioItems(prev => [...prev, formattedItem]);
        setSuccess("Portfolio item added successfully!");
        setShowUploadModal(false);
        setPortfolioData({ title: "", description: "", mediaType: "image" });
        setPortfolioFile(null);
      }
    } catch (err: any) {
      console.error("Portfolio upload error:", err);
      setError(err.response?.data?.message || "Failed to upload portfolio item");
    } finally {
      setLoading(false);
    }
  };

  // ---------------------- HELPERS ----------------------
  // getSocialIcon removed as it is not used in the new layout

  const getInitials = (name: string) =>
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

  const getMediaIcon = (mediaType: string) => {
    switch (mediaType) {
      case "image":
        return <Image className="w-5 h-5 text-primary-500" />;
      case "video":
        return <Video className="w-5 h-5 text-success-500" />;
      case "document":
        return <FileText className="w-5 h-5 text-orange-500" />;
      default:
        return <FileText className="w-5 h-5 text-neutral-500" />;
    }
  };

  const getMediaTypeColor = (mediaType: string) => {
    switch (mediaType) {
      case "image":
        return "bg-primary-50 text-primary-700 border-primary-200";
      case "video":
        return "bg-success-50 text-success-700 border-success-200";
      case "document":
        return "bg-orange-50 text-orange-700 border-orange-200";
      default:
        return "bg-neutral-50 text-neutral-700 border-neutral-200";
    }
  };

  const PortfolioItemCard = ({ item }: { item: PortfolioItem }) => (
    <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden hover:shadow-lg transition-all duration-300 group">
      <div className="relative aspect-video bg-neutral-100 overflow-hidden">
        {item.mediaType === "image" ? (
          <img
            src={item.url}
            alt={item.title}
            className="w-full h-full object-contain p-2 bg-white"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-neutral-50 to-neutral-100">
            <div className="text-center p-4">
              <div className={`p-4 rounded-full ${getMediaTypeColor(item.mediaType)} mb-3 mx-auto`}>
                {getMediaIcon(item.mediaType)}
              </div>
              <span className="text-sm font-medium text-neutral-700 capitalize">
                {item.mediaType} File
              </span>
            </div>
          </div>
        )}

        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-300 flex items-center justify-center">
          <button
            onClick={() => window.open(item.url, "_blank")}
            className="opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300 bg-white text-neutral-700 px-4 py-2 rounded-lg shadow-lg flex items-center space-x-2 font-medium"
          >
            <Download className="w-4 h-4" />
            <span>View</span>
          </button>
        </div>
      </div>

      <div className="p-4">
        <h3 className="font-bold text-neutral-900 text-lg mb-2 line-clamp-2 group-hover:text-primary-600 transition-colors">
          {item.title}
        </h3>
        <p className="text-neutral-600 text-sm mb-3 line-clamp-2 leading-relaxed">
          {item.description}
        </p>
        <div className="flex items-center justify-between">
          <span
            className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-medium border ${getMediaTypeColor(item.mediaType)}`}
          >
            {getMediaIcon(item.mediaType)}
            <span className="capitalize">{item.mediaType}</span>
          </span>
          <span className="text-xs text-neutral-500">
            {new Date(item.createdAt).toLocaleDateString()}
          </span>
        </div>
      </div>
    </div>
  );

  const handleCancelEdit = () => {
    setIsEditing(false);
    setAvatarFile(null);
    setCoverFile(null);
    setAvatarPreview("");
    setCoverPreview("");
    fetchUserProfile();
  };

  // ---------------------- LOADING ----------------------
  if (loading && !profile.email) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 pt-20 pb-12 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-neutral-600">Loading your profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* GLOBAL FEEDBACK */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-6 bg-rose-50 border border-rose-100 p-4 rounded-2xl flex items-center justify-between text-rose-800"
            >
              <div className="flex items-center space-x-3">
                <X className="w-5 h-5 text-rose-500" />
                <span className="font-bold text-sm">{error}</span>
              </div>
              <button onClick={() => setError("")}><X className="w-4 h-4" /></button>
            </motion.div>
          )}
          {success && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-6 bg-success-50 border border-success-100 p-4 rounded-2xl flex items-center justify-between text-success-800"
            >
              <div className="flex items-center space-x-3">
                <Plus className="w-5 h-5 text-success-500" />
                <span className="font-bold text-sm">{success}</span>
              </div>
              <button onClick={() => setSuccess("")}><X className="w-4 h-4" /></button>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex flex-col lg:flex-row gap-8">

          {/* LEFT SIDEBAR: Personal Branding */}
          <div className="lg:w-1/3 space-y-8">
            {/* Identity Card */}
            <div className="group relative overflow-hidden rounded-xl border border-neutral-200 bg-white p-8 shadow-sm">
              {/* Cover Image Banner */}
              <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-r from-primary-100 to-primary-100 overflow-hidden">
                {(coverPreview || profile.coverimageUrl) && (
                  <img src={coverPreview || profile.coverimageUrl} className="w-full h-full object-cover opacity-60" />
                )}
                {isEditing && (
                  <button
                    onClick={() => document.getElementById("coverUpload")?.click()}
                    className="absolute top-4 right-4 bg-white/80 backdrop-blur-sm p-2 rounded-xl text-neutral-600 hover:text-primary-600 shadow-sm transition-all opacity-0 group-hover:opacity-100"
                  >
                    <Camera className="w-4 h-4" />
                  </button>
                )}
                <input type="file" id="coverUpload" accept="image/*" className="hidden" onChange={handleCoverChange} />
              </div>

              <div className="relative flex flex-col items-center text-center mt-12">
                {/* Avatar */}
                <div className="relative mb-6">
                  <div className="flex h-32 w-32 items-center justify-center overflow-hidden rounded-full border-4 border-white bg-primary-50 shadow-lg">
                    {avatarPreview || profile.avatrurl ? (
                      <img src={avatarPreview || profile.avatrurl} alt={profile.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-4xl font-black text-primary-600">{getInitials(profile.name)}</span>
                    )}
                  </div>
                  {isEditing && (
                    <button onClick={() => document.getElementById("avatarUpload")?.click()}                     className="absolute -bottom-2 -right-2 rounded-full border-4 border-white bg-primary-600 p-3 text-white shadow-lg transition-all hover:bg-primary-700">
                      <Camera className="w-5 h-5" />
                    </button>
                  )}
                  <input type="file" id="avatarUpload" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                </div>

                <h1 className="text-2xl font-black text-neutral-900 mb-1 flex items-center gap-2">
                  {profile.name}
                  {profileVisibility === 'PRIVATE' && (
                    <span title="Profile hidden from others" className="inline-flex items-center gap-1 bg-rose-100 text-rose-600 text-[10px] font-black px-2 py-0.5 rounded-full border border-rose-200">
                      <Lock className="w-2.5 h-2.5" />Only Me
                    </span>
                  )}
                </h1>
                <p className="text-primary-600 font-bold text-sm mb-4">Verified Professional</p>

                <div className="flex items-center space-x-2 bg-neutral-50 px-4 py-2 rounded-2xl mb-6">
                  <MapPin className="w-4 h-4 text-neutral-400" />
                  <span className="text-sm font-bold text-neutral-600">{profile.location || "Earth"}</span>
                </div>

                <div className="w-full flex gap-3">
                  <button
                    onClick={() => { if (isEditing) handleProfileUpdate(); else setIsEditing(true); }}
                    className="flex-1 rounded-lg bg-primary-600 py-3 text-sm font-semibold text-white transition-all hover:bg-primary-700 flex items-center justify-center space-x-2"
                  >
                    {isEditing ? <Save className="w-4 h-4" /> : <Edit2 className="w-4 h-4" />}
                    <span>{isEditing ? "Save" : "Edit Profile"}</span>
                  </button>
                  {isEditing && (
                    <button onClick={handleCancelEdit} className="rounded-lg bg-neutral-100 p-3 text-neutral-400 transition-all hover:text-error-500">
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>

                {/* Profile Privacy Toggle — shown only in edit mode */}
                {isEditing && (
                  <div className="w-full mt-3">
                    <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-2 text-center">Profile Visibility</p>
                    <div className="flex items-center bg-neutral-100 rounded-full p-1 gap-1 w-full">
                      <button
                        type="button"
                        onClick={() => setProfileVisibility('PUBLIC')}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-full text-xs font-black transition-all ${
                          profileVisibility === 'PUBLIC'
                            ? 'bg-white shadow text-primary-700'
                            : 'text-neutral-500 hover:text-neutral-700'
                        }`}
                      >
                        <Globe className="w-3.5 h-3.5" />
                        Public
                      </button>
                      <button
                        type="button"
                        onClick={() => setProfileVisibility('PRIVATE')}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-full text-xs font-black transition-all ${
                          profileVisibility === 'PRIVATE'
                            ? 'bg-white shadow text-rose-600'
                            : 'text-neutral-500 hover:text-neutral-700'
                        }`}
                      >
                        <Lock className="w-3.5 h-3.5" />
                        Only Me
                      </button>
                    </div>
                    {profileVisibility === 'PRIVATE' && (
                      <p className="text-[10px] text-rose-500 font-bold text-center mt-2">Your profile is hidden from other users</p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* About & Contact */}
            <div className="rounded-xl border border-neutral-200 bg-white p-8 shadow-sm">
              <h3 className="text-xs font-black text-neutral-400 uppercase tracking-widest mb-6 px-2 text-center lg:text-left">Biography</h3>
              {isEditing ? (
                <textarea
                  value={profile.bio}
                  onChange={(e) => handleProfileChange("bio", e.target.value)}
                  className="w-full p-4 bg-neutral-50 border-2 border-neutral-100 rounded-2xl focus:border-primary-500 transition-all outline-none resize-none text-sm font-medium"
                  rows={4}
                  placeholder="Share your journey..."
                />
              ) : (
                <p className="text-neutral-600 text-sm leading-relaxed font-medium">
                  {profile.bio || "No professional summary provided yet."}
                </p>
              )}

              <div className="mt-8 pt-8 border-t border-neutral-50 space-y-4">
                <div className="flex items-center space-x-4 text-neutral-600 bg-neutral-50/50 p-3 rounded-2xl">
                  <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center">
                    <Mail className="w-4 h-4 text-primary-600" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-neutral-400 uppercase">Email</p>
                    <p className="text-sm font-bold">{profile.email}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-4 text-neutral-600 bg-neutral-50/50 p-3 rounded-2xl">
                  <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center">
                    <Globe className="w-4 h-4 text-success-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-[10px] font-black text-neutral-400 uppercase">Website</p>
                    {isEditing ? (
                      <input
                        type="text"
                        value={profile.website}
                        onChange={(e) => handleProfileChange("website", e.target.value)}
                        className="bg-transparent border-none p-0 focus:ring-0 text-sm font-bold w-full"
                        placeholder="Link..."
                      />
                    ) : (
                      <a href={profile.website} target="_blank" className="text-sm font-bold truncate block max-w-[150px]">{profile.website || "Not provided"}</a>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Social Pulse */}
            <div className="flex justify-center lg:justify-start gap-4 px-2">
              <a href="#" className="w-12 h-12 bg-white rounded-2xl shadow-md border border-neutral-100 flex items-center justify-center text-neutral-400 hover:text-primary-600 hover:scale-110 transition-all">
                <LinkedinIcon className="w-5 h-5" />
              </a>
              <a href="#" className="w-12 h-12 bg-white rounded-2xl shadow-md border border-neutral-100 flex items-center justify-center text-neutral-400 hover:text-neutral-900 hover:scale-110 transition-all">
                <GithubIcon className="w-5 h-5" />
              </a>
              <a href="#" className="w-12 h-12 bg-white rounded-2xl shadow-md border border-neutral-100 flex items-center justify-center text-neutral-400 hover:text-primary-400 hover:scale-110 transition-all">
                <TwitterIcon className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* RIGHT CONTENT: Dynamic Activity */}
          <div className="lg:w-2/3 space-y-8">
            {/* Tabs Header */}
            <div className="sticky top-20 z-10 rounded-xl border border-neutral-200 bg-white px-4 pt-2 shadow-sm">
              <Tabs
                active={activeTab}
                onChange={(value) => setActiveTab(value as typeof activeTab)}
                items={[
                  { value: 'about', label: 'About' },
                  { value: 'skills', label: 'Skills' },
                  { value: 'portfolio', label: 'Portfolio' },
                  { value: 'listings', label: 'Listings' },
                ]}
              />
            </div>

            {/* TAB CONTENT */}
            <div className="min-h-[500px]">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  {activeTab === 'about' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="bg-gradient-to-br from-primary-600 to-primary-700 rounded-[32px] p-8 text-white shadow-2xl">
                        <h4 className="text-lg font-black mb-2">Professional Progress</h4>
                        <p className="text-primary-100 text-sm mb-6">You are in the top 10% of contributors this month.</p>
                        <div className="space-y-4">
                          <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                            <div className="h-full bg-white w-3/4" />
                          </div>
                          <p className="text-xs font-bold opacity-80">Profile Strength: 75%</p>
                        </div>
                      </div>

                      <div className="bg-white rounded-[32px] p-8 border border-neutral-100 shadow-xl shadow-primary-900/5">
                        <h4 className="text-lg font-black text-neutral-900 mb-4">Quick Stats</h4>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="p-4 bg-neutral-50 rounded-2xl">
                            <p className="text-2xl font-black text-neutral-900">{userSkills.length}</p>
                            <p className="text-[10px] font-black text-neutral-400 uppercase">Specialties</p>
                          </div>
                          <div className="p-4 bg-neutral-50 rounded-2xl">
                            <p className="text-2xl font-black text-neutral-900">{portfolioItems.length}</p>
                            <p className="text-[10px] font-black text-neutral-400 uppercase">Projects</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'skills' && (
                    <div className="bg-white rounded-[32px] p-10 border border-neutral-100 shadow-xl shadow-primary-900/5">
                      <div className="flex items-center justify-between mb-10">
                        <div>
                          <h3 className="text-2xl font-black text-neutral-900">Area of Expertise</h3>
                          <p className="text-sm text-neutral-500 font-medium">Verify your skills to stand out in the community.</p>
                        </div>
                        <button
                          onClick={() => setIsSkillModalOpen(true)}
                          className="bg-primary-600 text-white px-8 py-3 rounded-2xl font-black text-sm shadow-lg shadow-primary-200 hover:bg-primary-700 transition-all flex items-center space-x-2"
                        >
                          <Plus className="w-5 h-5" />
                          <span>Add New</span>
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {userSkills.map((skill) => (
                          <div key={skill.id} className="group bg-neutral-50 p-6 rounded-[24px] flex items-center justify-between hover:bg-white hover:shadow-xl hover:shadow-primary-900/5 transition-all border border-transparent hover:border-primary-100">
                            <div className="flex items-center space-x-4">
                              <div className={`p-4 rounded-2xl border-2 ${getExpertiseColor(skill.expertiseLevel)}`}>
                                <Award className="w-6 h-6" />
                              </div>
                              <div>
                                <h4 className="font-black text-neutral-900">{skill.skillName}</h4>
                                <span className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">{skill.expertiseLevel}</span>
                              </div>
                            </div>
                            <button onClick={() => handleRemoveSkill(skill.id)} className="opacity-0 group-hover:opacity-100 p-2 text-neutral-400 hover:text-error-500 transition-all">
                              <X className="w-5 h-5" />
                            </button>
                          </div>
                        ))}
                      </div>

                      {userSkills.length === 0 && (
                        <div className="text-center py-20 bg-neutral-50 rounded-[32px] border-2 border-dashed border-neutral-200">
                          <Award className="w-16 h-16 text-neutral-200 mx-auto mb-4" />
                          <p className="text-neutral-400 font-black">Ready to showcase your talents?</p>
                        </div>
                      )}
                    </div>
                  )}

                  {activeTab === 'portfolio' && (
                    <div className="space-y-8">
                      <div className="flex items-center justify-between px-2">
                        <h3 className="text-2xl font-black text-neutral-900">Showcase</h3>
                        <button
                          onClick={() => setShowUploadModal(true)}
                          className="bg-neutral-900 text-white px-6 py-3 rounded-2xl font-black text-sm hover:bg-neutral-800 transition-all flex items-center space-x-2"
                        >
                          <Upload className="w-4 h-4" />
                          <span>Upload Work</span>
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {portfolioItems.map((item) => (
                          <PortfolioItemCard key={item.id} item={item} />
                        ))}
                      </div>

                      {portfolioItems.length === 0 && (
                        <div className="text-center py-32 bg-white rounded-[32px] border border-neutral-100 shadow-xl shadow-primary-900/5">
                          <Briefcase className="w-16 h-16 text-neutral-100 mx-auto mb-4" />
                          <p className="text-neutral-400 font-black">Your portfolio is currently a blank canvas.</p>
                        </div>
                      )}
                    </div>
                  )}

                  {activeTab === 'listings' && (
                    <div className="bg-white rounded-[32px] p-10 border border-neutral-100 shadow-xl shadow-primary-900/5">
                      <h3 className="text-2xl font-black text-neutral-900 mb-10 text-center lg:text-left">Swap Listings</h3>
                      <div className="grid grid-cols-1 gap-6">
                        {userListings.map((listing) => (
                          <div key={listing.id} className="bg-neutral-50 p-8 rounded-[28px] border border-neutral-100 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:shadow-xl hover:shadow-primary-900/5 transition-all">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h4 className="text-xl font-black text-neutral-900">{listing.title}</h4>
                                {listing.visibility === 'PRIVATE' ? (
                                  <span className="inline-flex items-center gap-1 bg-rose-100 text-rose-600 text-[10px] font-black px-2 py-0.5 rounded-full border border-rose-200">
                                    <Lock className="w-2.5 h-2.5" />Only Me
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 bg-primary-50 text-primary-600 text-[10px] font-black px-2 py-0.5 rounded-full border border-primary-100">
                                    <Globe className="w-2.5 h-2.5" />Public
                                  </span>
                                )}
                              </div>
                              <p className="text-neutral-500 text-sm font-medium line-clamp-2">{listing.description}</p>
                            </div>
                            <div className="flex items-center gap-3 flex-wrap">
                              <span className="bg-white px-4 py-2 rounded-xl text-xs font-black text-neutral-600 border border-neutral-100 flex items-center space-x-2">
                                <MapPin className="w-3 h-3" />
                                <span>{listing.location || "Remote"}</span>
                              </span>
                              {/* Visibility Toggle */}
                              <div className="flex items-center bg-neutral-100 rounded-full p-1 gap-1">
                                <button
                                  type="button"
                                  title="Make Public"
                                  onClick={async () => {
                                    try {
                                      await dispatch(updatePostVisibility({ postId: listing.id, visibility: 'PUBLIC' })).unwrap();
                                      setUserListings(prev => prev.map(l => l.id === listing.id ? { ...l, visibility: 'PUBLIC' } : l));
                                      setSuccess('Post set to Public');
                                    } catch { setError('Failed to update visibility'); }
                                  }}
                                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black transition-all ${
                                    listing.visibility !== 'PRIVATE'
                                      ? 'bg-white shadow text-primary-700'
                                      : 'text-neutral-400 hover:text-neutral-600'
                                  }`}
                                >
                                  <Globe className="w-3 h-3" />
                                  Public
                                </button>
                                <button
                                  type="button"
                                  title="Only Me"
                                  onClick={async () => {
                                    try {
                                      await dispatch(updatePostVisibility({ postId: listing.id, visibility: 'PRIVATE' })).unwrap();
                                      setUserListings(prev => prev.map(l => l.id === listing.id ? { ...l, visibility: 'PRIVATE' } : l));
                                      setSuccess('Post set to Only Me');
                                    } catch { setError('Failed to update visibility'); }
                                  }}
                                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black transition-all ${
                                    listing.visibility === 'PRIVATE'
                                      ? 'bg-white shadow text-rose-600'
                                      : 'text-neutral-400 hover:text-neutral-600'
                                  }`}
                                >
                                  <Lock className="w-3 h-3" />
                                  Only Me
                                </button>
                              </div>
                              <button className="p-3 bg-white text-neutral-400 rounded-xl hover:text-primary-600 hover:shadow-md transition-all">
                                <ExternalLink className="w-5 h-5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                      {userListings.length === 0 && (
                        <div className="text-center py-20 bg-neutral-50 rounded-[32px]">
                          <p className="text-neutral-400 font-black">No active exchange offers found.</p>
                        </div>
                      )}
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      {/* MODALS */}
      <SkillModal
        isOpen={isSkillModalOpen}
        onClose={() => setIsSkillModalOpen(false)}
        onAdd={handleAddSkills}
        existingSkills={userSkills.map(s => s.skillName)}
      />

      {/* PORTFOLIO UPLOAD MODAL */}
      {showUploadModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-[32px] p-10 w-full max-w-2xl relative shadow-2xl max-h-[90vh] overflow-y-auto">
            <button onClick={() => setShowUploadModal(false)} className="absolute top-8 right-8 text-neutral-400 hover:text-neutral-600">
              <X className="w-6 h-6" />
            </button>
            <div className="text-center mb-10">
              <div className="w-16 h-16 bg-neutral-900 text-white rounded-[20px] flex items-center justify-center mx-auto mb-6 shadow-xl shadow-gray-200">
                <Upload className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-black text-neutral-900">Feature a Project</h3>
              <p className="text-neutral-500 font-medium mt-1">Share your best work with the community</p>
            </div>
            <div className="space-y-6">
              <input value={portfolioData.title} onChange={(e) => setPortfolioData({ ...portfolioData, title: e.target.value })} type="text" placeholder="Project Title" className="w-full p-4 bg-neutral-50 border-2 border-neutral-100 rounded-2xl outline-none focus:border-primary-500 transition-all font-bold" />
              <textarea value={portfolioData.description} onChange={(e) => setPortfolioData({ ...portfolioData, description: e.target.value })} placeholder="Project Description" className="w-full p-4 bg-neutral-50 border-2 border-neutral-100 rounded-2xl outline-none focus:border-primary-500 transition-all font-medium h-32 resize-none" />
              <div className="border-2 border-dashed border-neutral-200 rounded-[28px] p-10 text-center bg-neutral-50 hover:border-primary-500 transition-all cursor-pointer relative">
                <input type="file" id="portfolioFile" accept="image/*,video/*,.pdf" onChange={handlePortfolioFileChange} className="absolute inset-0 opacity-0 cursor-pointer" />
                <Upload className="w-10 h-10 text-neutral-300 mx-auto mb-4" />
                <p className="text-sm font-black text-neutral-500">{portfolioFile ? portfolioFile.name : "Select Media File"}</p>
                <p className="text-[10px] font-black text-neutral-400 mt-1 uppercase">Images, Video or PDF (Max 50MB)</p>
              </div>
              <button onClick={handlePortfolioUpload} disabled={loading} className="w-full py-5 bg-primary-600 text-white rounded-2xl font-black text-lg shadow-xl shadow-primary-200 hover:bg-primary-700 disabled:opacity-50 transition-all">
                {loading ? "Publishing..." : "Publish Project"}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}