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
  Mail,
  FileText,
  Video,
  Image,
  Download,
  ExternalLink,
  Lock,
} from "lucide-react";
import axios from "axios";
import { motion } from "framer-motion";
import SkillModal from "../components/SkillModal";
import { useDispatch } from "react-redux";
import { AppDispatch } from "../store/store";
import { updatePostVisibility } from "../store/slices/postsSlice";
import { API_BASE } from '../config';
import { useNavigate } from 'react-router-dom';
import { toast } from '../lib/toast';

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
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
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
        `${API_BASE}/auth/addMultipleUserSkills/${profile.email}`,
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
        `${API_BASE}/auth/removeUserSkill/${skillId}`,
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


  // ---------------------- FETCH PROFILE ----------------------
  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await axios.get(`${API_BASE}/auth/getme`, {
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
        `${API_BASE}/auth/getUserSkills/${email}`,
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
        `${API_BASE}/auth/getUserPortfolios/${email}`,
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
      const response = await axios.get(`${API_BASE}/posts/my-posts`, {
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
        `${API_BASE}/auth/update-profile/${profile.email}`,
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
        `${API_BASE}/auth/addPortfolio/${profile.email}`,
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
        return <FileText className="w-5 h-5 text-warning-500" />;
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
        return "bg-warning-50 text-warning-700 border-warning-200";
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
          <div className="w-full h-full flex items-center justify-center bg-neutral-50">
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

        <div className="absolute inset-0">
          <button
            onClick={() => window.open(item.url, "_blank")}
            className="absolute bottom-2 right-2 flex items-center space-x-2 rounded-md border border-neutral-200 bg-white px-3 py-1.5 text-sm font-medium text-neutral-800 hover:bg-neutral-50"
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

  // Show feedback as toasts so it is visible wherever the user is on the page.
  useEffect(() => {
    if (success) { toast.success(success); setSuccess(""); }
  }, [success]);
  useEffect(() => {
    if (error) { toast.error(error); setError(""); }
  }, [error]);

  const checklist = [
    { done: !!(profile.avatrurl || avatarPreview), label: "Add a profile photo", action: () => { setIsEditing(true); } },
    { done: !!profile.bio, label: "Write a short bio", action: () => setIsEditing(true) },
    { done: !!profile.location, label: "Add your location", action: () => setIsEditing(true) },
    { done: userSkills.length > 0, label: "Add a skill you can teach", action: () => setIsSkillModalOpen(true) },
    { done: userListings.length > 0, label: "Create a listing so people can request a swap", action: () => navigate("/marketplace") },
  ];
  const remaining = checklist.filter((c) => !c.done);
  const hasErrors = !!(validationErrors.bio || validationErrors.website || validationErrors.socialLink);

  const setListingVisibility = async (listingId: number, visibility: "PUBLIC" | "PRIVATE") => {
    try {
      await dispatch(updatePostVisibility({ postId: listingId, visibility })).unwrap();
      setUserListings((prev) => prev.map((l) => (l.id === listingId ? { ...l, visibility } : l)));
      setSuccess(visibility === "PUBLIC" ? "Listing is now visible to everyone." : "Listing is now hidden from others.");
    } catch {
      setError("Could not change who can see this listing.");
    }
  };

  // ---------------------- LOADING ----------------------
  if (loading && !profile.email) {
    return (
      <div className="mx-auto max-w-4xl space-y-4" aria-busy="true" aria-label="Loading your profile">
        <div className="h-48 rounded-lg skeleton" />
        <div className="h-32 rounded-lg skeleton" />
      </div>
    );
  }

  const fieldClass = (err?: string) =>
    `w-full rounded-md border bg-white px-3 py-2 text-sm text-neutral-900 focus:outline-none focus:ring-2 ${
      err ? "border-error-500 focus:ring-error-100" : "border-neutral-300 focus:border-primary-500 focus:ring-primary-100"
    }`;

  return (
    <div className="pb-12">
      <div className="mx-auto max-w-4xl space-y-6">
        {/* ---------- Header ---------- */}
        <section className="overflow-hidden rounded-lg border border-neutral-200 bg-white">
          <div className="relative h-32 bg-neutral-100">
            {(coverPreview || profile.coverimageUrl) && (
              <img src={coverPreview || profile.coverimageUrl} alt="" className="h-full w-full object-cover" />
            )}
            {isEditing && (
              <button
                onClick={() => document.getElementById("coverUpload")?.click()}
                className="absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-md bg-white px-3 py-1.5 text-xs font-medium text-neutral-800 shadow-sm hover:bg-neutral-50"
              >
                <Camera className="h-3.5 w-3.5" /> Change cover
              </button>
            )}
            <input type="file" id="coverUpload" accept="image/*" className="hidden" onChange={handleCoverChange} />
          </div>

          <div className="px-6 pb-6">
            <div className="-mt-12 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div className="flex items-end gap-4">
                <div className="relative">
                  {avatarPreview || profile.avatrurl ? (
                    <img src={avatarPreview || profile.avatrurl} alt="" className="h-24 w-24 rounded-full border-4 border-white object-cover" />
                  ) : (
                    <span className="flex h-24 w-24 items-center justify-center rounded-full border-4 border-white bg-primary-100 text-2xl font-semibold text-primary-700">
                      {getInitials(profile.name || "U")}
                    </span>
                  )}
                  {isEditing && (
                    <button
                      onClick={() => document.getElementById("avatarUpload")?.click()}
                      className="absolute bottom-0 right-0 rounded-full border-2 border-white bg-neutral-900 p-1.5 text-white hover:bg-neutral-700"
                      aria-label="Change profile photo"
                    >
                      <Camera className="h-4 w-4" />
                    </button>
                  )}
                  <input type="file" id="avatarUpload" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                </div>
                <div className="pb-1">
                  <h1 className="flex flex-wrap items-center gap-2 text-xl font-semibold text-neutral-900">
                    {profile.name}
                    {profileVisibility === "PRIVATE" && (
                      <span className="inline-flex items-center gap-1 rounded bg-neutral-100 px-1.5 py-0.5 text-xs font-medium text-neutral-600">
                        <Lock className="h-3 w-3" /> Hidden
                      </span>
                    )}
                  </h1>
                  <p className="mt-0.5 flex flex-wrap items-center gap-x-3 text-sm text-neutral-500">
                    {profile.location ? (
                      <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{profile.location}</span>
                    ) : (
                      <span>No location yet</span>
                    )}
                    <span className="inline-flex items-center gap-1"><Mail className="h-3.5 w-3.5" />{profile.email}</span>
                  </p>
                </div>
              </div>

              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="inline-flex items-center justify-center gap-2 rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-800 hover:bg-neutral-50"
                >
                  <Edit2 className="h-4 w-4" /> Edit profile
                </button>
              )}
            </div>

            {/* ---------- View / edit details ---------- */}
            {isEditing ? (
              <form
                className="mt-6 space-y-4 border-t border-neutral-100 pt-6"
                onSubmit={(e) => { e.preventDefault(); if (!hasErrors) handleProfileUpdate(); }}
                noValidate
              >
                <div>
                  <label htmlFor="bio" className="mb-1.5 block text-sm font-medium text-neutral-700">Bio</label>
                  <textarea
                    id="bio"
                    rows={4}
                    value={profile.bio}
                    onChange={(e) => handleProfileChange("bio", e.target.value)}
                    placeholder="A few lines about what you do and what you'd like to learn."
                    className={fieldClass(validationErrors.bio)}
                  />
                  <p className={`mt-1 text-xs ${validationErrors.bio ? "text-error-700" : "text-neutral-500"}`}>
                    {validationErrors.bio || `${(profile.bio || "").length}/500 characters`}
                  </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="location" className="mb-1.5 block text-sm font-medium text-neutral-700">Location</label>
                    <input id="location" value={profile.location} onChange={(e) => handleProfileChange("location", e.target.value)} placeholder="e.g. Lahore, or Online" className={fieldClass()} />
                  </div>
                  <div>
                    <label htmlFor="website" className="mb-1.5 block text-sm font-medium text-neutral-700">Website</label>
                    <input id="website" type="url" value={profile.website} onChange={(e) => handleProfileChange("website", e.target.value)} placeholder="https://" className={fieldClass(validationErrors.website)} />
                    {validationErrors.website && <p className="mt-1 text-xs text-error-700">Enter a full address starting with https://</p>}
                  </div>
                </div>

                <div>
                  <label htmlFor="social" className="mb-1.5 block text-sm font-medium text-neutral-700">LinkedIn, GitHub or X profile</label>
                  <input id="social" type="url" value={profile.socialLink || ""} onChange={(e) => handleProfileChange("socialLink", e.target.value)} placeholder="https://linkedin.com/in/…" className={fieldClass(validationErrors.socialLink)} />
                  {validationErrors.socialLink && <p className="mt-1 text-xs text-error-700">{validationErrors.socialLink}</p>}
                </div>

                <fieldset>
                  <legend className="mb-1.5 text-sm font-medium text-neutral-700">Who can see your profile</legend>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {([
                      { value: "PUBLIC", title: "Everyone", body: "People can find you and send swap requests." },
                      { value: "PRIVATE", title: "Only me", body: "You won't appear in search or on other people's screens." },
                    ] as const).map((opt) => (
                      <label key={opt.value} className={`flex cursor-pointer gap-3 rounded-md border p-3 ${profileVisibility === opt.value ? "border-primary-600 bg-primary-50" : "border-neutral-300"}`}>
                        <input type="radio" name="visibility" checked={profileVisibility === opt.value} onChange={() => setProfileVisibility(opt.value)} className="mt-0.5" />
                        <span>
                          <span className="block text-sm font-medium text-neutral-900">{opt.title}</span>
                          <span className="block text-xs text-neutral-600">{opt.body}</span>
                        </span>
                      </label>
                    ))}
                  </div>
                </fieldset>

                <div className="flex justify-end gap-2 pt-2">
                  <button type="button" onClick={handleCancelEdit} className="rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-800 hover:bg-neutral-50">
                    Cancel
                  </button>
                  <button type="submit" disabled={hasErrors || loading} className="inline-flex items-center gap-2 rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-60">
                    <Save className="h-4 w-4" /> {loading ? "Saving…" : "Save changes"}
                  </button>
                </div>
              </form>
            ) : (
              <div className="mt-5 space-y-3">
                {profile.bio ? (
                  <p className="max-w-2xl whitespace-pre-line text-sm leading-relaxed text-neutral-700">{profile.bio}</p>
                ) : (
                  <p className="text-sm text-neutral-500">You haven't written a bio yet.</p>
                )}
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
                  {profile.website && (
                    <a href={profile.website} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-primary-700 hover:underline">
                      <Globe className="h-3.5 w-3.5" />{profile.website.replace(/^https?:\/\//, "")}
                    </a>
                  )}
                  {profile.socialLink && (
                    <a href={profile.socialLink} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-primary-700 hover:underline">
                      <ExternalLink className="h-3.5 w-3.5" />{profile.socialLink.replace(/^https?:\/\/(www\.)?/, "")}
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* ---------- Finish your profile ---------- */}
        {remaining.length > 0 && !isEditing && (
          <section className="rounded-lg border border-neutral-200 bg-white p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-neutral-900">Finish your profile</h2>
              <span className="text-sm text-neutral-500">{checklist.length - remaining.length} of {checklist.length} done</span>
            </div>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-neutral-100">
              <div className="h-full rounded-full bg-primary-600" style={{ width: `${((checklist.length - remaining.length) / checklist.length) * 100}%` }} />
            </div>
            <ul className="mt-4 space-y-2">
              {checklist.map((c) => (
                <li key={c.label} className="flex items-center justify-between gap-3 text-sm">
                  <span className={c.done ? "text-neutral-400 line-through" : "text-neutral-800"}>{c.label}</span>
                  {!c.done && (
                    <button onClick={c.action} className="shrink-0 font-medium text-primary-700 hover:underline">Do it</button>
                  )}
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* ---------- Skills ---------- */}
        <section className="rounded-lg border border-neutral-200 bg-white p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-semibold text-neutral-900">Skills I can teach</h2>
              <p className="mt-0.5 text-sm text-neutral-500">These help people decide whether to swap with you.</p>
            </div>
            <button onClick={() => setIsSkillModalOpen(true)} className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-neutral-300 px-3 py-1.5 text-sm font-medium text-neutral-800 hover:bg-neutral-50">
              <Plus className="h-4 w-4" /> Add skill
            </button>
          </div>
          {userSkills.length > 0 ? (
            <ul className="mt-4 flex flex-wrap gap-2">
              {userSkills.map((skill) => (
                <li key={skill.id} className="inline-flex items-center gap-1.5 rounded-md border border-neutral-200 py-1 pl-3 pr-1 text-sm">
                  <span className="font-medium text-neutral-900">{skill.skillName}</span>
                  <span className="text-neutral-500">{skill.expertiseLevel}</span>
                  <button onClick={() => handleRemoveSkill(skill.id)} className="rounded p-1 text-neutral-400 hover:bg-neutral-100 hover:text-error-600" aria-label={`Remove ${skill.skillName}`}>
                    <X className="h-3.5 w-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 rounded-md border border-dashed border-neutral-300 p-4 text-sm text-neutral-600">
              No skills yet. Add at least one so people know what you can teach.
            </p>
          )}
        </section>

        {/* ---------- Listings ---------- */}
        <section className="rounded-lg border border-neutral-200 bg-white p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-semibold text-neutral-900">My listings</h2>
              <p className="mt-0.5 text-sm text-neutral-500">Listings appear in Find skills, where people send you swap requests.</p>
            </div>
            <button onClick={() => navigate("/marketplace")} className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-neutral-300 px-3 py-1.5 text-sm font-medium text-neutral-800 hover:bg-neutral-50">
              <Plus className="h-4 w-4" /> New listing
            </button>
          </div>
          {userListings.length > 0 ? (
            <ul className="mt-4 divide-y divide-neutral-100">
              {userListings.map((listing) => {
                const [offers, wants] = String(listing.title || "").split("<->").map((x: string) => x.trim());
                return (
                  <li key={listing.id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <p className="font-medium text-neutral-900">Teaches {offers}</p>
                      {wants && <p className="text-sm text-neutral-600">Wants to learn {wants}</p>}
                      {listing.description && <p className="mt-1 line-clamp-2 text-sm text-neutral-500">{listing.description}</p>}
                    </div>
                    <label className="flex shrink-0 items-center gap-2 text-sm text-neutral-600">
                      Visible to
                      <select
                        value={listing.visibility === "PRIVATE" ? "PRIVATE" : "PUBLIC"}
                        onChange={(e) => setListingVisibility(listing.id, e.target.value as "PUBLIC" | "PRIVATE")}
                        className="rounded-md border border-neutral-300 bg-white px-2 py-1.5 text-sm text-neutral-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
                      >
                        <option value="PUBLIC">Everyone</option>
                        <option value="PRIVATE">Only me</option>
                      </select>
                    </label>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="mt-4 rounded-md border border-dashed border-neutral-300 p-4 text-sm text-neutral-600">
              You have no listings. Create one in Find skills so others can send you swap requests.
            </p>
          )}
        </section>

        {/* ---------- Portfolio ---------- */}
        <section className="rounded-lg border border-neutral-200 bg-white p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-semibold text-neutral-900">Portfolio</h2>
              <p className="mt-0.5 text-sm text-neutral-500">Examples of your work: images, videos or PDFs.</p>
            </div>
            <button onClick={() => setShowUploadModal(true)} className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-neutral-300 px-3 py-1.5 text-sm font-medium text-neutral-800 hover:bg-neutral-50">
              <Upload className="h-4 w-4" /> Add work
            </button>
          </div>
          {portfolioItems.length > 0 ? (
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {portfolioItems.map((item) => (
                <PortfolioItemCard key={item.id} item={item} />
              ))}
            </div>
          ) : (
            <p className="mt-4 rounded-md border border-dashed border-neutral-300 p-4 text-sm text-neutral-600">
              Nothing here yet. Adding one or two examples makes people more likely to accept your swap requests.
            </p>
          )}
        </section>
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
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-xl p-10 w-full max-w-2xl relative shadow-lg max-h-[90vh] overflow-y-auto">
            <button onClick={() => setShowUploadModal(false)} className="absolute top-8 right-8 text-neutral-400 hover:text-neutral-600">
              <X className="w-6 h-6" />
            </button>
            <div className="text-center mb-10">
              <div className="w-16 h-16 bg-neutral-900 text-white rounded-[20px] flex items-center justify-center mx-auto mb-6 shadow-xl shadow-neutral-200">
                <Upload className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-bold text-neutral-900">Feature a Project</h3>
              <p className="text-neutral-500 font-medium mt-1">Share your best work with the community</p>
            </div>
            <div className="space-y-6">
              <input value={portfolioData.title} onChange={(e) => setPortfolioData({ ...portfolioData, title: e.target.value })} type="text" placeholder="Project Title" className="w-full p-4 bg-neutral-50 border-2 border-neutral-100 rounded-xl outline-none focus:border-primary-500 transition-all font-bold" />
              <textarea value={portfolioData.description} onChange={(e) => setPortfolioData({ ...portfolioData, description: e.target.value })} placeholder="Project Description" className="w-full p-4 bg-neutral-50 border-2 border-neutral-100 rounded-xl outline-none focus:border-primary-500 transition-all font-medium h-32 resize-none" />
              <div className="border-2 border-dashed border-neutral-200 rounded-xl p-10 text-center bg-neutral-50 hover:border-primary-500 transition-all cursor-pointer relative">
                <input type="file" id="portfolioFile" accept="image/*,video/*,.pdf" onChange={handlePortfolioFileChange} className="absolute inset-0 opacity-0 cursor-pointer" />
                <Upload className="w-10 h-10 text-neutral-300 mx-auto mb-4" />
                <p className="text-sm font-bold text-neutral-500">{portfolioFile ? portfolioFile.name : "Select Media File"}</p>
                <p className="text-[10px] font-bold text-neutral-400 mt-1 uppercase">Images, Video or PDF (Max 50MB)</p>
              </div>
              <button onClick={handlePortfolioUpload} disabled={loading} className="w-full py-5 bg-primary-600 text-white rounded-xl font-bold text-lg shadow-xl hover:bg-primary-700 disabled:opacity-50 transition-all">
                {loading ? "Publishing..." : "Publish Project"}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}