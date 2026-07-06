"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import {
  User,
  Lock,
  History,
  MessageSquare,
  MessageCircle,
  ShieldCheck,
  LogOut,
  ArrowRightLeft,
  ExternalLink,
  RefreshCw,
  Loader2,
  Mail,
  BadgeCheck,
  Database,
  Settings,
  Bell,
  CreditCard,
  Fingerprint,
  Globe,
  Zap,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Copy,
  Gift,
  Award,
  Clock,
  Calendar,
  FileText,
  Star,
  TrendingUp,
  Wallet,
  Smartphone,
  Activity,
  ThumbsUp,
  Trash2,
  ChevronLeft,
  ChevronRight,
  MessageCircleMore,
  Reply,
  Quote,
  Camera,
  Upload,
  X,
  Pencil,
  AlertTriangle,
  ShieldAlert
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type AccountUser = {
  user_id: number;
  username: string;
  email: string;
  role: string;
  preferred_currency: string | null;
  is_active: number;
  avatar_url?: string | null;
  facebook_id?: string | null;
  google_id?: string | null;
};

const API_BASE = "/api/laravel";

interface ConversionHistoryItem {
  history_id: number;
  from_currency: string;
  to_currency: string;
  amount_input: number;
  amount_output: number;
  created_at: string;
}

interface UserComment {
  comment_id: number;
  content: string;
  rating: number;
  created_at: string;
  news: {
    news_id: number;
    title: string;
  };
  user: {
    user_id: number;
    username: string;
  };
  replies?: UserComment[];
  parent_comment?: {
    comment_id: number;
    content: string;
    user?: {
      user_id: number;
      username: string;
    };
  };
}

interface ReplyToUser {
  comment_id: number;
  content: string;
  rating: number;
  created_at: string;
  news: {
    news_id: number;
    title: string;
  };
  user: {
    user_id: number;
    username: string;
  };
  parent_comment?: {
    comment_id: number;
    content: string;
  };
}

interface SystemActivityItem {
  id: number;
  type: 'conversion' | 'comment' | 'reply' | 'favorite' | 'like';
  action: string;
  title: string;
  details: string;
  created_at: string;
}

type ActivityItem = {
  id: number;
  type: 'comment' | 'reply';
  content: string;
  rating: number;
  created_at: string;
  news_title: string;
  news_id: number;
  author: string;
  parent_content?: string;
};

// Helper lấy URL avatar
function getAvatarUrl(user: AccountUser | null): string | null {
  if (!user) return null;
  
  if (user.avatar_url) {
    return user.avatar_url;
  }
  
  if (user.facebook_id) {
    return `https://graph.facebook.com/${user.facebook_id}/picture?type=large`;
  }
  
  return null;
}

// Helper lấy chữ cái đầu
function getInitials(username: string): string {
  return username?.charAt(0)?.toUpperCase() || '?';
}

// Skeleton Components
const ProfileSkeleton = () => (
  <div className="flex flex-col gap-4 sm:gap-6 animate-pulse">
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
      {/* Identity Card Skeleton */}
      <div className="bg-gradient-to-br from-[#11111a] to-[#0c0c12] p-4 sm:p-6 rounded-2xl border border-white/10 shadow-xl">
        <div className="flex flex-col gap-4 sm:gap-5">
          <div className="h-4 w-32 bg-white/10 rounded-lg" />
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <div className="h-2 w-16 bg-white/5 rounded" />
              <div className="h-10 bg-white/5 rounded-lg" />
            </div>
            <div className="flex flex-col gap-1.5">
              <div className="h-2 w-20 bg-white/5 rounded" />
              <div className="h-10 bg-white/5 rounded-lg" />
            </div>
            <div className="flex flex-col gap-1.5">
              <div className="h-2 w-16 bg-white/5 rounded" />
              <div className="h-10 bg-white/5 rounded-lg" />
            </div>
          </div>
        </div>
      </div>

      {/* Security Card Skeleton */}
      <div className="bg-gradient-to-br from-[#11111a] to-[#0c0c12] p-4 sm:p-6 rounded-2xl border border-white/10 shadow-xl">
        <div className="flex flex-col gap-4 sm:gap-5">
          <div className="h-4 w-32 bg-white/10 rounded-lg" />
          <div className="flex flex-col gap-3">
            <div className="h-10 bg-white/5 rounded-xl" />
            <div className="h-3 w-48 bg-white/5 rounded" />
            <div className="h-10 bg-white/5 rounded-xl" />
            <div className="h-10 bg-white/5 rounded-xl" />
          </div>
        </div>
      </div>
    </div>

    {/* Stats Widget Skeleton */}
    <div className="bg-gradient-to-br from-[#11111a] to-[#0c0c12] p-4 sm:p-6 rounded-2xl border border-white/10 shadow-xl">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex flex-col gap-2 p-3 sm:p-4 bg-black/30 rounded-xl">
            <div className="h-2 w-20 bg-white/5 rounded" />
            <div className="h-6 w-24 bg-white/10 rounded" />
            <div className="h-2 w-32 bg-white/5 rounded" />
          </div>
        ))}
      </div>
    </div>

    {/* Activity Summary Skeleton */}
    <div className="bg-gradient-to-br from-[#11111a] to-[#0c0c12] p-4 sm:p-6 rounded-2xl border border-white/10 shadow-xl">
      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-white/10">
        <div className="h-3 w-3 bg-white/10 rounded" />
        <div className="h-3 w-32 bg-white/10 rounded" />
      </div>
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center justify-between py-2 border-b border-white/5">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-white/10" />
              <div className="h-2 w-24 bg-white/5 rounded" />
            </div>
            <div className="h-2 w-20 bg-white/5 rounded" />
          </div>
        ))}
      </div>
    </div>
  </div>
);

export default function UserDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("profile");
  const [user, setUser] = useState<AccountUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: string; visible: boolean }>({ message: '', type: '', visible: false });
  const [itemsPerPage] = useState(10);
  const [userComments, setUserComments] = useState<UserComment[]>([]);
  const [repliesToUser, setRepliesToUser] = useState<ReplyToUser[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [activityList, setActivityList] = useState<ActivityItem[]>([]);
  const [activityTotal, setActivityTotal] = useState(0);
  const [activityCurrentPage, setActivityCurrentPage] = useState(1);
  const [activityLoading, setActivityLoading] = useState(false);
  const [systemActivity, setSystemActivity] = useState<SystemActivityItem[]>([]);
  const [systemTotal, setSystemTotal] = useState(0);
  const [systemCurrentPage, setSystemCurrentPage] = useState(1);
  const [systemLoading, setSystemLoading] = useState(false);
  const [conversionHistory, setConversionHistory] = useState<ConversionHistoryItem[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [editingUsername, setEditingUsername] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [updatingUsername, setUpdatingUsername] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [mailboxCurrentPage, setMailboxCurrentPage] = useState(1);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type, visible: true });
    setTimeout(() => setToast(prev => ({ ...prev, visible: false })), 3000);
  };

  // Helper lấy URL avatar
  const getUserAvatarUrl = useCallback(() => {
    return getAvatarUrl(user);
  }, [user]);

  // Helper lấy chữ cái đầu
  const getUserInitials = useCallback(() => {
    return user ? getInitials(user.username) : '?';
  }, [user]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.replace("/login");
      return;
    }

    const loadProfile = async () => {
      try {
        const res = await fetch(`${API_BASE}/user`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (res.ok && data.user) {
          setUser(data.user);
          localStorage.setItem("user", JSON.stringify(data.user));
          window.dispatchEvent(new Event("auth-changed"));
        } else {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          router.replace("/login");
        }
      } catch {
        const stored = localStorage.getItem("user");
        if (stored) {
          try { setUser(JSON.parse(stored)); } catch { router.replace("/login"); }
        } else {
          router.replace("/login");
        }
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.dispatchEvent(new Event("auth-changed"));
    router.push("/login");
  };

  const fetchUserComments = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    setCommentsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/user/comments`, {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Accept": "application/json"
        }
      });
      const data = await res.json();
      if (!res.ok) {
        console.error("Fetch user comments failed:", data);
        setUserComments([]);
        setRepliesToUser([]);
        setActivityList([]);
        return;
      }
      const comments = data.user_comments || [];
      const replies = data.replies_to_user || [];
      setUserComments(comments);
      setRepliesToUser(replies);
      
      const combined: ActivityItem[] = [
        ...comments.map((c: UserComment) => ({
          id: c.comment_id,
          type: 'comment' as const,
          content: c.content,
          rating: c.rating,
          created_at: c.created_at,
          news_title: c.news?.title || 'Unknown News',
          news_id: c.news?.news_id,
          author: c.user?.username || 'You',
          parent_content: c.parent_comment?.content
        })),
        ...replies.map((r: ReplyToUser) => ({
          id: r.comment_id,
          type: 'reply' as const,
          content: r.content,
          rating: r.rating,
          created_at: r.created_at,
          news_title: r.news?.title || 'Unknown News',
          news_id: r.news?.news_id,
          author: r.user?.username || 'Unknown User',
          parent_content: r.parent_comment?.content
        }))
      ];
      
      combined.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setActivityList(combined);
      setActivityTotal(combined.length);
      setActivityCurrentPage(1);
    } catch (error) {
      console.error("Fetch user comments error:", error);
      setUserComments([]);
      setRepliesToUser([]);
      setActivityList([]);
    } finally {
      setCommentsLoading(false);
    }
  }, []);

  const fetchSystemActivity = useCallback(async (page = 1) => {
    const token = localStorage.getItem("token");
    if (!token) return;

    setSystemLoading(true);
    try {
      const res = await fetch(`${API_BASE}/user/activity?page=${page}&per_page=${itemsPerPage}`, {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Accept": "application/json"
        }
      });
      const data = await res.json();

      if (res.ok && Array.isArray(data.activities)) {
        setSystemActivity(data.activities);
        setSystemTotal(data.activities.length);
      } else {
        console.error("Fetch user activity failed:", data);
        setSystemActivity([]);
        setSystemTotal(0);
      }
    } catch (error) {
      console.error("Fetch user activity error:", error);
      setSystemActivity([]);
      setSystemTotal(0);
    } finally {
      setSystemLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user && activeTab === "history") {
      const loadActivity = async () => {
        await fetchSystemActivity(systemCurrentPage);
      };
      loadActivity();
    }
  }, [user, activeTab, systemCurrentPage, fetchSystemActivity]);

  useEffect(() => {
    if (user && activeTab === "comments") {
      const loadComments = async () => {
        await fetchUserComments();
      };
      loadComments();
    }
  }, [user, activeTab, fetchUserComments]);

  const fetchNotifications = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    setNotificationsLoading(true);
    try {
      const BACK_END = process.env.NEXT_PUBLIC_BACK_END || 'http://localhost:8000';
      const API_BASE = `${BACK_END}/api`;
      
      // Fetch user notifications
      const userRes = await fetch(`${API_BASE}/notifications`, {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Accept": "application/json"
        }
      });
      const userData = await userRes.json();
      
      // Fetch broadcast notices
      const broadcastRes = await fetch(`${API_BASE}/broadcast-notices`);
      const broadcastData = await broadcastRes.json();
      
      const allNotifs = [];
      
      if (userData.success && userData.notifications) {
        allNotifs.push(...userData.notifications.map((notif: any) => ({
          ...notif,
          isBroadcast: false,
          category: 'user'
        })));
      }
      
      if (broadcastData.success && broadcastData.notices) {
        allNotifs.push(...broadcastData.notices.map((notice: any) => ({
          ...notice,
          isBroadcast: true,
          category: 'admin'
        })));
      }
      
      // Sort by created_at descending
      allNotifs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setNotifications(allNotifs);
      setMailboxCurrentPage(1);
    } catch (error) {
      console.error("Fetch notifications error:", error);
      setNotifications([]);
    } finally {
      setNotificationsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user && activeTab === "mailbox") {
      fetchNotifications();
    }
  }, [user, activeTab, fetchNotifications]);

  // Avatar upload handlers
  const handleAvatarClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Kiểm tra định dạng file
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      showToast('Please upload JPEG, PNG, GIF, or WEBP image', 'error');
      return;
    }

    // Kiểm tra kích thước file (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      showToast('Image size must be less than 2MB', 'error');
      return;
    }

    setAvatarFile(file);
    const reader = new FileReader();
    reader.onload = (event) => {
      setAvatarPreview(event.target?.result as string);
    };
    reader.readAsDataURL(file);
    setShowAvatarModal(true);
  };

  const handleUploadAvatar = async () => {
    if (!avatarFile) return;

    const token = localStorage.getItem("token");
    if (!token) {
      showToast('Please login first', 'error');
      return;
    }

    setUploadingAvatar(true);
    try {
      const formData = new FormData();
      formData.append('avatar', avatarFile);

      const res = await fetch(`${API_BASE}/user/avatar`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await res.json();
      
      if (res.ok && data.success) {
        // Cập nhật user với avatar mới
        const updatedUser = {
          ...user,
          avatar_url: data.avatar_url,
        };
        setUser(updatedUser as AccountUser);
        localStorage.setItem("user", JSON.stringify(updatedUser));
        window.dispatchEvent(new Event("auth-changed"));
        
        showToast('Avatar updated successfully!', 'success');
        setShowAvatarModal(false);
        setAvatarFile(null);
        setAvatarPreview(null);
      } else {
        showToast(data.error || 'Failed to upload avatar', 'error');
      }
    } catch (error) {
      console.error('Upload avatar error:', error);
      showToast('Failed to upload avatar', 'error');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleDeleteAvatar = async () => {
    // Nếu là avatar từ social (FB/Google), không cho xóa
    if (user?.facebook_id || user?.google_id) {
      showToast('Cannot delete social avatar. Please update your profile picture on Facebook/Google.', 'error');
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const res = await fetch(`${API_BASE}/user/avatar`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });

      if (res.ok) {
        const updatedUser = {
          ...user,
          avatar_url: null,
        };
        setUser(updatedUser as AccountUser);
        localStorage.setItem("user", JSON.stringify(updatedUser));
        window.dispatchEvent(new Event("auth-changed"));
        showToast('Avatar removed', 'success');
        setShowAvatarModal(false);
      } else {
        showToast('Failed to remove avatar', 'error');
      }
    } catch (error) {
      console.error('Delete avatar error:', error);
      showToast('Failed to remove avatar', 'error');
    }
  };

  const handleUpdateUsername = async () => {
    if (!newUsername.trim()) {
      showToast('Username cannot be empty', 'error');
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      showToast('Please login first', 'error');
      return;
    }

    setUpdatingUsername(true);
    try {
      const res = await fetch(`${API_BASE}/user/profile`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ username: newUsername.trim() }),
      });

      const data = await res.json();
      
      if (res.ok && data.user) {
        const updatedUser = {
          ...user,
          username: data.user.username,
        } as AccountUser;
        setUser(updatedUser);
        localStorage.setItem("user", JSON.stringify(updatedUser));
        window.dispatchEvent(new Event("auth-changed"));
        
        showToast('Username updated successfully!', 'success');
        setEditingUsername(false);
      } else {
        showToast(data.errors?.username?.[0] || data.message || 'Failed to update username', 'error');
      }
    } catch (error) {
      console.error('Update username error:', error);
      showToast('Failed to update username', 'error');
    } finally {
      setUpdatingUsername(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false });
  };

  const formatTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return "Just now";
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return `${Math.floor(seconds / 604800)}w ago`;
  };

  const getNotificationTitle = (type: string) => {
    switch (type) {
      case 'like':
        return 'liked your post';
      case 'reply':
        return 'replied to your comment';
      case 'mention':
        return 'mentioned you in a comment';
      case 'report':
        return 'Your comment has been reported';
      case 'warning':
        return 'You received a system warning';
      case 'ban':
        return 'Your account has been suspended';
      default:
        return 'sent you a notification';
    }
  };

  // Paginated activity - luôn hiển thị đúng 10 dòng
  const activityTotalPages = Math.max(1, Math.ceil(activityTotal / itemsPerPage));
  
  const getPaginatedActivity = () => {
    const start = (activityCurrentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const pageItems = activityList.slice(start, end);
    
    // Luôn trả về đúng itemsPerPage phần tử (dù có dữ liệu hay không)
    const result = [];
    for (let i = 0; i < itemsPerPage; i++) {
      if (i < pageItems.length) {
        result.push(pageItems[i]);
      } else {
        result.push(null); // placeholder cho dòng trống
      }
    }
    return result;
  };

  // Paginated mailbox - luôn hiển thị đúng 10 dòng
  const mailboxTotalPages = Math.max(1, Math.ceil(notifications.length / itemsPerPage));
  
  const getPaginatedMailbox = () => {
    const start = (mailboxCurrentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const pageItems = notifications.slice(start, end);
    
    const result = [];
    for (let i = 0; i < itemsPerPage; i++) {
      if (i < pageItems.length) {
        result.push(pageItems[i]);
      } else {
        result.push(null);
      }
    }
    return result;
  };

  // Render pagination buttons
  const renderPaginationButtons = (currentPage: number, totalPages: number, setPage: (page: number) => void) => {
    if (totalPages <= 1) {
      return (
        <button
          onClick={() => setPage(1)}
          className={`w-6 sm:w-7 h-6 sm:h-7 text-[7px] sm:text-[8px] font-mono rounded-lg transition-all ${
            currentPage === 1
              ? 'bg-indigo-500 text-white'
              : 'border border-white/10 hover:bg-white/5 text-slate-400'
          }`}
        >
          1
        </button>
      );
    }
    
    const pages = [];
    const maxVisible = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let endPage = Math.min(totalPages, startPage + maxVisible - 1);
    
    if (endPage - startPage < maxVisible - 1) {
      startPage = Math.max(1, endPage - maxVisible + 1);
    }
    
    if (startPage > 1) {
      pages.push(1);
      if (startPage > 2) pages.push('...');
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    
    if (endPage < totalPages) {
      if (endPage < totalPages - 1) pages.push('...');
      pages.push(totalPages);
    }
    
    return pages.map((page, idx) => {
      if (page === '...') {
        return (
          <span key={`ellipsis-${idx}`} className="w-4 sm:w-5 text-center text-[7px] sm:text-[8px] text-slate-500 font-mono">
            …
          </span>
        );
      }
      const num = page as number;
      return (
        <button
          key={num}
          onClick={() => setPage(num)}
          className={`w-6 sm:w-7 h-6 sm:h-7 text-[7px] sm:text-[8px] font-mono rounded-lg transition-all ${
            currentPage === num
              ? 'bg-indigo-500 text-white'
              : 'border border-white/10 hover:bg-white/5 text-slate-400'
          }`}
        >
          {num}
        </button>
      );
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#02020a] via-[#050510] to-[#02020a] flex flex-col items-center justify-center gap-4">
        <div className="w-full max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 pt-24 sm:pt-28 md:pt-32 pb-16 sm:pb-20">
          <div className="flex flex-col gap-8 sm:gap-10">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 md:gap-6 pb-6 md:pb-8 border-b border-white/10 animate-pulse">
              <div className="flex flex-col gap-2 md:gap-3">
                <div className="h-4 sm:h-5 w-32 sm:w-48 bg-white/10 rounded-full" />
                <div className="h-8 sm:h-10 w-48 sm:w-64 bg-white/10 rounded-lg" />
                <div className="h-3 sm:h-4 w-56 sm:w-80 bg-white/10 rounded" />
              </div>
              <div className="flex items-center gap-4">
                <div className="flex flex-col items-end gap-0.5">
                  <div className="h-3 sm:h-4 w-20 sm:w-24 bg-white/10 rounded" />
                  <div className="h-2 sm:h-3 w-24 sm:w-32 bg-white/10 rounded" />
                </div>
              </div>
            </div>

            <div className="grid lg:grid-cols-12 gap-6 md:gap-8">
              <div className="lg:col-span-3 animate-pulse">
                <div className="flex flex-col gap-1.5 p-2 bg-gradient-to-br from-[#11111a] to-[#0c0c12] border border-white/10 rounded-2xl shadow-xl">
                  <div className="relative mx-auto my-4">
                    <div className="w-24 sm:w-28 md:w-32 h-24 sm:h-28 md:h-32 rounded-full bg-white/10 mx-auto" />
                    <div className="mt-3 text-center">
                      <div className="h-3 sm:h-4 w-20 sm:w-24 bg-white/10 rounded mx-auto" />
                      <div className="h-2 sm:h-3 w-14 sm:w-16 bg-white/5 rounded mx-auto mt-0.5" />
                    </div>
                  </div>
                  {[1, 2].map((i) => (
                    <div key={i} className="h-9 sm:h-10 bg-white/5 rounded-xl mx-1" />
                  ))}
                  <div className="h-px bg-white/10 my-2 mx-3" />
                  <div className="h-9 sm:h-10 bg-white/5 rounded-xl mx-1" />
                </div>
              </div>

              <div className="lg:col-span-9">
                <ProfileSkeleton />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const tabs = [
    { id: "profile", label: "Identity & Security", icon: <User size={14} /> },
    { id: "comments", label: "Intelligence Activity", icon: <MessageSquare size={14} /> },
    { id: "mailbox", label: "Mailbox", icon: <Mail size={14} /> },
  ];

  // Mobile responsive tab labels
  const getTabLabel = (tab: typeof tabs[0]) => {
    if (typeof window !== 'undefined' && window.innerWidth < 640) {
      if (tab.id === "profile") return "Profile";
      if (tab.id === "comments") return "Activity";
      if (tab.id === "mailbox") return "Mail";
    }
    return tab.label;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#02020a] via-[#050510] to-[#02020a] text-slate-100 selection:bg-indigo-500/30 font-sans overflow-x-hidden">
      <Header />
      
      {/* Ambient Background */}
      <div className="fixed inset-0 pointer-events-none -z-10">
        <div className="absolute top-[-20%] right-[-10%] w-[400px] sm:w-[600px] md:w-[800px] h-[400px] sm:h-[600px] md:h-[800px] bg-indigo-600/8 rounded-full blur-[100px] sm:blur-[150px]" />
        <div className="absolute bottom-[5%] left-[-15%] w-[300px] sm:w-[400px] md:w-[600px] h-[300px] sm:h-[400px] md:h-[600px] bg-purple-600/6 rounded-full blur-[80px] sm:blur-[120px]" />
        <div className="absolute top-[40%] left-[30%] w-[300px] sm:w-[400px] md:w-[500px] h-[300px] sm:h-[400px] md:h-[500px] bg-cyan-600/4 rounded-full blur-[80px] sm:blur-[100px]" />
      </div>

      {/* Toast Notification */}
      <AnimatePresence>
        {toast.visible && (
          <motion.div
            initial={{ opacity: 0, x: 100, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 100, scale: 0.9 }}
            transition={{ duration: 0.3, type: "spring", stiffness: 400 }}
            className={`fixed bottom-4 sm:bottom-6 right-3 sm:right-6 z-50 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl border backdrop-blur-xl flex items-center gap-2 sm:gap-3 shadow-2xl max-w-[calc(100vw-2rem)] sm:max-w-md ${
              toast.type === 'success' ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-200' :
              toast.type === 'error' ? 'bg-red-500/15 border-red-500/40 text-red-200' :
              'bg-indigo-500/15 border-indigo-500/40 text-indigo-200'
            }`}
          >
            {toast.type === 'success' && <CheckCircle2 size={16} className="shrink-0" />}
            {toast.type === 'error' && <AlertCircle size={16} className="shrink-0" />}
            {toast.type === 'info' && <Sparkles size={16} className="shrink-0" />}
            <p className="text-xs sm:text-sm font-medium break-words">{toast.message}</p>
          </motion.div>
        )}
      </AnimatePresence>
      
      <main className="pt-24 sm:pt-28 md:pt-32 pb-16 sm:pb-20 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 w-full flex flex-col gap-8 sm:gap-10 relative z-10">
          
          {/* Dashboard Header */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 sm:gap-6 pb-6 sm:pb-8 border-b border-white/10"
          >
            <div className="flex flex-col gap-2 sm:gap-3 w-full sm:w-auto">
              <div className="inline-flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full w-fit">
                <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[6px] sm:text-[7px] md:text-[8px] font-black uppercase tracking-[0.15em] sm:tracking-[0.2em] text-emerald-400 font-mono whitespace-nowrap">
                  Secure Terminal Session Active
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-white tracking-tight uppercase leading-none">
                Control <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-sky-400">Center</span>
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 max-w-lg">
                Manage your identity, review transaction logs, and monitor network activity.
              </p>
            </div>
            
            <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto justify-start sm:justify-end">
              <div className="flex flex-col items-start sm:items-end gap-0.5 font-mono text-left sm:text-right">
                <span className="text-sm sm:text-base font-black uppercase tracking-wide text-white">
                  {user.username}
                </span>
                <div className="flex items-center gap-1.5">
                  <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-lg shadow-emerald-500/30" />
                  <span className="text-[6px] sm:text-[7px] text-emerald-400 font-black uppercase tracking-widest">
                    Remote Node Active
                  </span>
                </div>
              </div>
            </div>
          </motion.div>

          <div className="grid lg:grid-cols-12 gap-4 sm:gap-6 md:gap-8">
            
            {/* Sidebar Navigation */}
            <motion.aside 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="lg:col-span-3"
            >
              <div className="flex flex-col gap-1.5 p-2 bg-gradient-to-br from-[#11111a] to-[#0c0c12] border border-white/10 rounded-2xl sticky top-20 sm:top-24 md:top-28 shadow-xl">
                
                {/* Large Avatar Circle */}
                <motion.div 
                  className="relative mx-auto my-3 sm:my-4 group/avatar"
                  whileHover={{ scale: 1.03 }}
                  transition={{ type: "spring", stiffness: 400, damping: 15 }}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleAvatarChange}
                    accept="image/jpeg,image/png,image/jpg,image/gif,image/webp"
                    className="hidden"
                  />
                  
                  <div 
                    onClick={handleAvatarClick}
                    className="relative w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 lg:w-32 lg:h-32 rounded-full cursor-pointer group-hover/avatar:ring-2 sm:ring-3 md:ring-4 ring-indigo-500/40 ring-offset-2 ring-offset-[#0c0c12] transition-all duration-300"
                  >
                    <div className="absolute -inset-0.5 sm:-inset-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full blur-md opacity-0 group-hover/avatar:opacity-100 transition-all duration-500" />
                    
                    {getUserAvatarUrl() ? (
                      <img
                        src={getUserAvatarUrl() || ''}
                        alt={user.username}
                        className="w-full h-full rounded-full object-cover border-2 border-white/10 group-hover/avatar:border-indigo-400 transition-all duration-300 relative"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          const parent = e.currentTarget.parentElement;
                          if (parent) {
                            const fallback = document.createElement('div');
                            fallback.className = 'w-full h-full rounded-full bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 text-white font-bold flex items-center justify-center text-2xl sm:text-3xl md:text-4xl uppercase shadow-inner border-2 border-white/10 relative';
                            fallback.textContent = getUserInitials();
                            parent.appendChild(fallback);
                          }
                        }}
                      />
                    ) : (
                      <div className="w-full h-full rounded-full bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 text-white font-bold flex items-center justify-center text-2xl sm:text-3xl md:text-4xl uppercase shadow-inner border-2 border-white/10 relative">
                        {getUserInitials()}
                      </div>
                    )}
                    
                    <div className="absolute inset-0 rounded-full bg-black/50 backdrop-blur-sm opacity-0 group-hover/avatar:opacity-100 transition-all duration-300 flex flex-col items-center justify-center gap-0.5 sm:gap-1">
                      <Camera className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 lg:w-7 lg:h-7 text-white drop-shadow-lg" />
                      <span className="text-[6px] sm:text-[7px] md:text-[8px] font-bold text-white uppercase tracking-wider drop-shadow-lg">
                        Change
                      </span>
                    </div>
                  </div>

                  <div className="mt-2 sm:mt-3 text-center">
                    <p className="text-xs sm:text-sm font-bold text-white tracking-wide">
                      {user.username}
                    </p>
                    <div className="flex items-center justify-center gap-1.5 sm:gap-2 mt-0.5">
                      <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-indigo-400" />
                      <span className="text-[7px] sm:text-[8px] font-mono text-indigo-400/70 uppercase tracking-widest">
                        {user.role || 'User'}
                      </span>
                    </div>
                  </div>

                  <p className="text-[5px] sm:text-[6px] text-slate-500 text-center mt-0.5 sm:mt-1 font-mono opacity-0 group-hover/avatar:opacity-100 transition-opacity duration-300">
                    Click to update
                  </p>
                </motion.div>

                {/* Navigation Buttons */}
                {tabs.map((tab) => (
                  <motion.button
                    key={tab.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl text-[8px] sm:text-[9px] md:text-[10px] font-bold font-mono uppercase tracking-widest transition-all cursor-pointer ${
                      activeTab === tab.id 
                      ? "bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-lg shadow-indigo-600/30" 
                      : "text-slate-500 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    <span className="shrink-0">{tab.icon}</span>
                    <span className="truncate">{getTabLabel(tab)}</span>
                  </motion.button>
                ))}
                <div className="h-px bg-white/10 my-2 mx-3" />
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="button"
                  onClick={handleLogout}
                  className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl text-[8px] sm:text-[9px] md:text-[10px] font-bold font-mono text-rose-500 uppercase tracking-widest hover:bg-rose-500/10 transition-all w-full text-left cursor-pointer"
                >
                  <LogOut className="w-3 h-3 sm:w-[14px] sm:h-[14px] shrink-0" />
                  <span className="truncate">Terminate</span>
                </motion.button>
              </div>
            </motion.aside>

            {/* Main Content Area */}
            <div className="lg:col-span-9 min-w-0">
              <AnimatePresence mode="wait">
                {activeTab === "profile" && (
                  <motion.div
                    key="profile"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                    className="flex flex-col gap-4 sm:gap-6"
                  >
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                      {/* Identity Card */}
                      <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="bg-gradient-to-br from-[#11111a] to-[#0c0c12] p-4 sm:p-5 md:p-6 rounded-2xl border border-white/10 shadow-xl relative overflow-hidden group"
                      >
                        <div className="absolute top-0 right-0 w-24 sm:w-32 h-24 sm:h-32 bg-indigo-500/5 rounded-full blur-2xl" />
                        <div className="relative z-10 flex flex-col gap-4 sm:gap-5">
                          <h3 className="text-[10px] sm:text-xs font-bold font-mono text-slate-200 uppercase tracking-wider flex items-center gap-2 pb-2 sm:pb-3 border-b border-white/10">
                            <User className="text-indigo-400 w-3 h-3 sm:w-[14px] sm:h-[14px]" />
                            Identity Matrix
                          </h3>
                          <div className="flex flex-col gap-3">
                            {/* Identity - Username */}
                            <div className="flex flex-col gap-1.5">
                              <label className="text-[6px] sm:text-[7px] font-mono font-black text-slate-500 uppercase tracking-widest flex items-center gap-1">
                                <User className="w-[6px] h-[6px] sm:w-2 sm:h-2" /> Identity
                              </label>
                              {editingUsername ? (
                                <div className="flex items-center gap-2 px-2 sm:px-3 py-2 bg-black/40 rounded-lg focus-within:ring-2 focus-within:ring-indigo-500/30 transition-all">
                                  <input
                                    type="text"
                                    value={newUsername}
                                    onChange={(e) => setNewUsername(e.target.value)}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        handleUpdateUsername();
                                      }
                                      if (e.key === 'Escape') {
                                        setEditingUsername(false);
                                        setNewUsername(user.username);
                                      }
                                    }}
                                    autoFocus
                                    className="flex-1 bg-transparent text-white text-xs sm:text-sm font-medium outline-none placeholder:text-slate-600 min-w-0"
                                    placeholder="Enter username"
                                    maxLength={30}
                                  />
                                  <div className="flex items-center gap-0.5 sm:gap-1 shrink-0">
                                    <button
                                      onClick={handleUpdateUsername}
                                      disabled={updatingUsername || !newUsername.trim()}
                                      className="p-1 sm:p-1.5 hover:bg-white/10 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed text-indigo-400 hover:text-indigo-300"
                                    >
                                      {updatingUsername ? (
                                        <Loader2 className="w-3 h-3 sm:w-[14px] sm:h-[14px] animate-spin" />
                                      ) : (
                                        <CheckCircle2 className="w-3 h-3 sm:w-[14px] sm:h-[14px]" />
                                      )}
                                    </button>
                                    <button
                                      onClick={() => {
                                        setEditingUsername(false);
                                        setNewUsername(user.username);
                                      }}
                                      className="p-1 sm:p-1.5 hover:bg-white/10 rounded-lg transition-all text-slate-400 hover:text-white"
                                    >
                                      <X className="w-3 h-3 sm:w-[14px] sm:h-[14px]" />
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <div 
                                  onClick={() => {
                                    setEditingUsername(true);
                                    setNewUsername(user.username);
                                  }}
                                  className="group flex items-center justify-between px-2 sm:px-3 py-2 bg-black/40 rounded-lg transition-all cursor-pointer hover:bg-black/60"
                                >
                                  <span className="text-white text-xs sm:text-sm font-medium truncate">{user.username}</span>
                                  <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                                    <span className="text-[5px] sm:text-[6px] font-mono text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity uppercase tracking-wider hidden sm:inline">
                                      Click to edit
                                    </span>
                                    <Pencil className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-slate-500 group-hover:text-indigo-400 transition-colors" />
                                  </div>
                                </div>
                              )}
                            </div>
                            
                            {/* Node Endpoint */}
                            <div className="flex flex-col gap-1.5">
                              <label className="text-[6px] sm:text-[7px] font-mono font-black text-slate-500 uppercase tracking-widest flex items-center gap-1">
                                <Mail className="w-[6px] h-[6px] sm:w-2 sm:h-2" /> Node Endpoint
                              </label>
                              <div className="flex items-center justify-between p-2 sm:p-3 bg-black/40 rounded-xl flex-wrap gap-1">
                                <span className="text-white font-mono text-[10px] sm:text-xs truncate max-w-[120px] sm:max-w-[200px]">
                                  {user.facebook_id ? `FB: ${user.facebook_id}` : user.email}
                                </span>
                                <div className="flex items-center gap-1 shrink-0">
                                  <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-emerald-500" />
                                  <span className="text-[5px] sm:text-[6px] text-emerald-400 font-mono">VERIFIED</span>
                                </div>
                              </div>
                            </div>
                            
                            {/* Email */}
                            <div className="flex flex-col gap-1.5">
                              <label className="text-[6px] sm:text-[7px] font-mono font-black text-slate-500 uppercase tracking-widest flex items-center gap-1">
                                <Mail className="w-[6px] h-[6px] sm:w-2 sm:h-2" /> Email Node
                              </label>
                              <div className="flex items-center justify-between p-2 sm:p-3 bg-black/40 rounded-xl flex-wrap gap-1">
                                <span className="text-white font-mono text-[10px] sm:text-xs truncate max-w-[120px] sm:max-w-[200px]">{user.email}</span>
                                <div className="flex items-center gap-1 shrink-0">
                                  <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-emerald-500" />
                                  <span className="text-[5px] sm:text-[6px] text-emerald-400 font-mono">VERIFIED</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>

                      {/* Security Card */}
                      <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.15 }}
                        className="bg-gradient-to-br from-[#11111a] to-[#0c0c12] p-4 sm:p-5 md:p-6 rounded-2xl border border-white/10 shadow-xl relative overflow-hidden"
                      >
                        <div className="absolute top-0 right-0 w-24 sm:w-32 h-24 sm:h-32 bg-purple-500/5 rounded-full blur-2xl" />
                        <div className="relative z-10 flex flex-col gap-4 sm:gap-5">
                          <h3 className="text-[10px] sm:text-xs font-bold font-mono text-slate-200 uppercase tracking-wider flex items-center gap-2 pb-2 sm:pb-3 border-b border-white/10">
                            <Lock className="text-indigo-400 w-3 h-3 sm:w-[14px] sm:h-[14px]" />
                            Terminal Security
                          </h3>
                          <div className="flex flex-col gap-3">
                            <div className="flex items-center gap-2 p-2 sm:p-3 bg-emerald-500/10 rounded-xl">
                              <ShieldCheck className="w-3 h-3 sm:w-[14px] sm:h-[14px] text-emerald-400 shrink-0" />
                              <span className="text-[7px] sm:text-[8px] text-slate-300 font-mono">AES-256 Encryption Active</span>
                            </div>
                            <p className="text-[8px] sm:text-[9px] text-slate-500 leading-relaxed font-mono">
                              Key rotation is highly recommended every 180 cycles for maximum sandbox security.
                            </p>
                            <motion.button 
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              className="w-full py-2.5 sm:py-3 bg-white/5 hover:bg-white/10 rounded-xl text-[7px] sm:text-[8px] font-black font-mono text-slate-300 uppercase tracking-widest transition-all flex items-center justify-center gap-1.5 sm:gap-2"
                            >
                              <RefreshCw className="w-2 h-2 sm:w-2.5 sm:h-2.5" /> Rotate Access Key
                            </motion.button>
                            <motion.button 
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              className="w-full py-2.5 sm:py-3 bg-emerald-500/10 hover:bg-emerald-500/20 rounded-xl text-[7px] sm:text-[8px] font-black font-mono text-emerald-400 uppercase tracking-widest transition-all flex items-center justify-center gap-1.5 sm:gap-2"
                            >
                              <Fingerprint className="w-2 h-2 sm:w-2.5 sm:h-2.5" /> Enable MFA
                            </motion.button>
                          </div>
                        </div>
                      </motion.div>
                    </div>

                    {/* Stats Widget */}
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      className="bg-gradient-to-br from-[#11111a] to-[#0c0c12] p-4 sm:p-5 md:p-6 rounded-2xl border border-white/10 shadow-xl"
                    >
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
                        <div className="flex flex-col gap-1.5 sm:gap-2 p-3 sm:p-4 bg-black/30 rounded-xl">
                          <span className="text-[6px] sm:text-[7px] font-mono font-black text-slate-500 uppercase tracking-widest flex items-center gap-1">
                            <Award className="w-[6px] h-[6px] sm:w-2 sm:h-2" /> Role Tier
                          </span>
                          <span className="text-slate-200 font-mono font-bold text-[10px] sm:text-xs uppercase tracking-wide">{user.role}</span>
                        </div>
                        <div className="flex flex-col gap-1.5 sm:gap-2 p-3 sm:p-4 bg-black/30 rounded-xl">
                          <span className="text-[6px] sm:text-[7px] font-mono font-black text-slate-500 uppercase tracking-widest flex items-center gap-1">
                            <ShieldCheck className="w-[6px] h-[6px] sm:w-2 sm:h-2" /> Account Status
                          </span>
                          <span className={`font-mono font-black text-[10px] sm:text-xs uppercase flex items-center gap-1.5 ${user.is_active ? "text-emerald-400" : "text-rose-400"}`}>
                            <div className={`w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full ${user.is_active ? "bg-emerald-500 animate-pulse" : "bg-rose-500"}`} />
                            {user.is_active ? "Active" : "Disabled"}
                          </span>
                        </div>
                        <div className="flex flex-col gap-1.5 sm:gap-2 p-3 sm:p-4 bg-black/30 rounded-xl sm:col-span-2 lg:col-span-1">
                          <span className="text-[6px] sm:text-[7px] font-mono font-black text-slate-500 uppercase tracking-widest flex items-center gap-1">
                            <Wallet className="w-[6px] h-[6px] sm:w-2 sm:h-2" /> Preferred Currency
                          </span>
                          <span className="text-xl sm:text-2xl font-black font-mono text-indigo-400 uppercase">
                            {user.preferred_currency || "—"}
                          </span>
                          <p className="text-[6px] sm:text-[7px] text-slate-500 font-mono">
                            {user.preferred_currency
                              ? "Default target for terminal conversions"
                              : "No currency preference initialized"}
                          </p>
                        </div>
                      </div>
                    </motion.div>

                    {/* Activity Summary */}
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.25 }}
                      className="bg-gradient-to-br from-[#11111a] to-[#0c0c12] p-4 sm:p-5 md:p-6 rounded-2xl border border-white/10 shadow-xl"
                    >
                      <div className="flex items-center gap-1.5 sm:gap-2 mb-3 sm:mb-4 pb-2 sm:pb-3 border-b border-white/10">
                        <Activity className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-indigo-400 shrink-0" />
                        <h3 className="text-[8px] sm:text-[9px] md:text-[10px] font-mono font-bold text-slate-300 uppercase tracking-widest">Recent Activity</h3>
                      </div>
                      <div className="space-y-2 sm:space-y-3">
                        <div className="flex items-center justify-between py-1.5 sm:py-2 border-b border-white/5 flex-wrap gap-1">
                          <div className="flex items-center gap-1.5 sm:gap-2">
                            <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-emerald-500" />
                            <span className="text-[7px] sm:text-[8px] md:text-[9px] font-mono text-slate-400">Last Login</span>
                          </div>
                          <span className="text-[7px] sm:text-[8px] md:text-[9px] font-mono text-slate-300">Today, 09:42 AM</span>
                        </div>
                        <div className="flex items-center justify-between py-1.5 sm:py-2 border-b border-white/5 flex-wrap gap-1">
                          <div className="flex items-center gap-1.5 sm:gap-2">
                            <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-blue-500" />
                            <span className="text-[7px] sm:text-[8px] md:text-[9px] font-mono text-slate-400">Total Conversions</span>
                          </div>
                          <span className="text-[7px] sm:text-[8px] md:text-[9px] font-mono text-slate-300">24 transactions</span>
                        </div>
                        <div className="flex items-center justify-between py-1.5 sm:py-2 flex-wrap gap-1">
                          <div className="flex items-center gap-1.5 sm:gap-2">
                            <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-purple-500" />
                            <span className="text-[7px] sm:text-[8px] md:text-[9px] font-mono text-slate-400">API Calls (24h)</span>
                          </div>
                          <span className="text-[7px] sm:text-[8px] md:text-[9px] font-mono text-slate-300">143 requests</span>
                        </div>
                      </div>
                    </motion.div>
                  </motion.div>
                )}

                {activeTab === "comments" && (
                  <motion.div
                    key="comments"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                    className="bg-gradient-to-br from-[#11111a] to-[#0c0c12] rounded-2xl overflow-hidden border border-white/10 shadow-xl"
                  >
                    <div className="px-4 sm:px-5 md:px-6 py-3 sm:py-4 border-b border-white/10 bg-white/5">
                      <div className="flex items-center gap-1.5 sm:gap-2">
                        <MessageSquare className="w-3 h-3 sm:w-[14px] sm:h-[14px] text-indigo-400 shrink-0" />
                        <h3 className="text-[8px] sm:text-[9px] md:text-[10px] font-mono font-bold text-slate-300 uppercase tracking-widest">Intelligence Activity Log</h3>
                        <span className="text-[7px] sm:text-[8px] font-mono text-slate-500 bg-black/30 px-1.5 sm:px-2 py-0.5 rounded-full ml-auto sm:ml-0">{activityTotal}</span>
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      <div className="min-w-[700px] sm:min-w-[800px] lg:min-w-full">
                        <table className="w-full text-left font-mono">
                          <thead>
                            <tr className="border-b border-white/10 bg-black/30">
                              <th className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-[7px] sm:text-[8px] font-bold text-slate-500 uppercase tracking-wider">Type</th>
                              <th className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-[7px] sm:text-[8px] font-bold text-slate-500 uppercase tracking-wider hidden sm:table-cell">News Article</th>
                              <th className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-[7px] sm:text-[8px] font-bold text-slate-500 uppercase tracking-wider">Content</th>
                              <th className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-[7px] sm:text-[8px] font-bold text-slate-500 uppercase tracking-wider hidden sm:table-cell">Rating</th>
                              <th className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-[7px] sm:text-[8px] font-bold text-slate-500 uppercase tracking-wider text-right">Timestamp</th>
                              <th className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-[7px] sm:text-[8px] font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {commentsLoading || activityLoading ? (
                              // Skeleton loading - 10 dòng
                              [...Array(10)].map((_, idx) => (
                                <tr key={`skeleton-${idx}`} className="animate-pulse border-b border-white/5">
                                  <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4">
                                    <div className="h-4 sm:h-5 w-12 sm:w-16 bg-white/5 rounded-lg" />
                                  </td>
                                  <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 hidden sm:table-cell">
                                    <div className="flex flex-col gap-1">
                                      <div className="h-2.5 sm:h-3 w-24 sm:w-32 bg-white/5 rounded" />
                                      <div className="h-1.5 sm:h-2 w-16 sm:w-20 bg-white/5 rounded" />
                                    </div>
                                  </td>
                                  <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4">
                                    <div className="flex flex-col gap-1">
                                      <div className="h-2.5 sm:h-3 w-32 sm:w-48 bg-white/5 rounded" />
                                      <div className="h-1.5 sm:h-2 w-24 sm:w-32 bg-white/5 rounded" />
                                    </div>
                                  </td>
                                  <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 hidden sm:table-cell">
                                    <div className="flex gap-0.5">
                                      {[1, 2, 3, 4, 5].map((j) => (
                                        <div key={j} className="h-2 w-2 sm:h-2.5 sm:w-2.5 bg-white/5 rounded" />
                                      ))}
                                    </div>
                                  </td>
                                  <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-right">
                                    <div className="h-1.5 sm:h-2 w-16 sm:w-20 bg-white/5 rounded ml-auto" />
                                  </td>
                                  <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-right">
                                    <div className="flex items-center justify-end gap-2 sm:gap-3">
                                      <div className="h-6 sm:h-8 w-6 sm:w-8 bg-white/5 rounded-lg" />
                                      <div className="h-6 sm:h-8 w-6 sm:w-8 bg-white/5 rounded-lg" />
                                    </div>
                                  </td>
                                </tr>
                              ))
                            ) : (
                              // Luôn hiển thị đúng 10 dòng
                              getPaginatedActivity().map((item, index) => {
                                if (item === null) {
                                  // Dòng trống - KHÔNG có border
                                  return (
                                    <tr key={`empty-${index}`} className="pointer-events-none">
                                      <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 h-[60px] sm:h-[73px] border-none">&nbsp;</td>
                                      <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 h-[60px] sm:h-[73px] border-none hidden sm:table-cell">&nbsp;</td>
                                      <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 h-[60px] sm:h-[73px] border-none">&nbsp;</td>
                                      <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 h-[60px] sm:h-[73px] border-none hidden sm:table-cell">&nbsp;</td>
                                      <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 h-[60px] sm:h-[73px] border-none">&nbsp;</td>
                                      <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 h-[60px] sm:h-[73px] border-none">&nbsp;</td>
                                    </tr>
                                  );
                                }

                                const formattedDate = formatDate(item.created_at);
                                const truncatedContent = item.content.length > 40 
                                  ? item.content.substring(0, 40) + '...' 
                                  : item.content;

                                return (
                                  <motion.tr 
                                    key={`${item.type}-${item.id}`}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: Math.min(index * 0.03, 0.3) }}
                                    className="hover:bg-white/5 transition-all group border-b border-white/5"
                                  >
                                    <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4">
                                      <div className={`flex items-center gap-1 text-[6px] sm:text-[7px] font-black uppercase tracking-widest px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-lg w-fit ${
                                        item.type === 'comment' 
                                          ? 'bg-indigo-500/10 text-indigo-400'
                                          : 'bg-purple-500/10 text-purple-400'
                                      }`}>
                                        {item.type === 'comment' ? (
                                          <MessageSquare className="w-[6px] h-[6px] sm:w-2 sm:h-2" />
                                        ) : (
                                          <Reply className="w-[6px] h-[6px] sm:w-2 sm:h-2" />
                                        )}
                                        {item.type === 'comment' ? 'Comment' : 'Reply'}
                                      </div>
                                    </td>
                                    <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 hidden sm:table-cell">
                                      <div className="flex flex-col gap-0.5 max-w-[150px] md:max-w-[200px]">
                                        <a 
                                          href={`/news/${item.news_id}`}
                                          className="text-slate-200 font-bold text-[8px] sm:text-[9px] hover:text-indigo-400 transition-colors line-clamp-2 truncate"
                                        >
                                          {item.news_title}
                                        </a>
                                        <span className="text-[5px] sm:text-[6px] text-slate-500 font-mono uppercase tracking-wider">
                                          by {item.author}
                                        </span>
                                      </div>
                                    </td>
                                    <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4">
                                      <div className="relative group/tooltip max-w-[120px] sm:max-w-[180px] md:max-w-[280px]">
                                        <p className="text-slate-300 text-[8px] sm:text-[9px] md:text-[10px] leading-relaxed line-clamp-2 font-sans break-words">
                                          &ldquo;{truncatedContent}&rdquo;
                                        </p>
                                        {item.content.length > 40 && (
                                          <div className="absolute bottom-full left-0 mb-2 px-2 sm:px-3 py-1.5 sm:py-2 bg-black/90 backdrop-blur-md rounded-lg border border-white/10 opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all duration-300 z-10 w-56 sm:w-72 md:w-80 pointer-events-none">
                                            <p className="text-slate-300 text-[8px] sm:text-[9px] md:text-[10px] leading-relaxed font-sans">
                                              {item.content}
                                            </p>
                                          </div>
                                        )}
                                      </div>
                                      {item.parent_content && (
                                        <div className="mt-0.5 sm:mt-1 flex items-start gap-0.5 sm:gap-1 text-[5px] sm:text-[6px] text-slate-500">
                                          <Quote className="w-[6px] h-[6px] sm:w-2 sm:h-2 shrink-0 mt-0.5" />
                                          <span className="line-clamp-1">Replying to: &ldquo;{item.parent_content.substring(0, 30)}&rdquo;</span>
                                        </div>
                                      )}
                                    </td>
                                    <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 hidden sm:table-cell">
                                      <div className="flex items-center gap-0.5">
                                        {[...Array(5)].map((_, idx) => (
                                          <Star 
                                            key={idx} 
                                            className={`w-2 h-2 sm:w-2.5 sm:h-2.5 ${idx < item.rating ? "text-yellow-500 fill-yellow-500" : "text-slate-600"}`}
                                          />
                                        ))}
                                      </div>
                                    </td>
                                    <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-right">
                                      <span className="text-slate-100 font-bold text-[7px] sm:text-[8px] md:text-[9px]">{formattedDate}</span>
                                    </td>
                                    <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-right">
                                      <div className="flex items-center justify-end gap-1.5 sm:gap-3">
                                        <a 
                                          href={`/news/${item.news_id}`}
                                          className="p-1 sm:p-2 hover:bg-indigo-500/20 rounded-lg transition-all text-indigo-400 hover:text-white"
                                          title="View thread"
                                        >
                                          <ExternalLink className="w-2.5 h-2.5 sm:w-[14px] sm:h-[14px]" />
                                        </a>
                                        <button
                                          onClick={() => {
                                            if (confirm(`Are you sure you want to delete this ${item.type}?`)) {
                                              fetch(`${API_BASE}/news/${item.news_id}/comment/${item.id}`, {
                                                method: 'DELETE',
                                                headers: {
                                                  'Authorization': `Bearer ${localStorage.getItem('token')}`,
                                                  'Accept': 'application/json'
                                                }
                                              }).then(res => res.json()).then(data => {
                                                if (data.success) {
                                                  showToast(`${item.type} deleted successfully`, 'success');
                                                  fetchUserComments();
                                                } else {
                                                  showToast('Failed to delete', 'error');
                                                }
                                              }).catch(() => showToast('Failed to delete', 'error'));
                                            }
                                          }}
                                          className="p-1 sm:p-2 hover:bg-rose-500/20 rounded-lg transition-all text-rose-400 hover:text-rose-300 opacity-0 group-hover:opacity-100"
                                          title={`Delete this ${item.type}`}
                                        >
                                          <Trash2 className="w-2.5 h-2.5 sm:w-[14px] sm:h-[14px]" />
                                        </button>
                                      </div>
                                    </td>
                                  </motion.tr>
                                );
                              })
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Pagination - Luôn hiển thị */}
                    <div className="px-4 sm:px-5 md:px-6 py-3 sm:py-4 border-t border-white/10 bg-black/20 flex flex-col sm:flex-row justify-between items-center gap-2 sm:gap-0">
                      <span className="text-[6px] sm:text-[7px] font-mono text-slate-500 text-center sm:text-left">
                        {activityTotal > 0 ? (
                          `Showing ${((activityCurrentPage - 1) * itemsPerPage) + 1} to ${Math.min(activityCurrentPage * itemsPerPage, activityTotal)} of ${activityTotal} activities`
                        ) : (
                          `Showing 0 of 0 activities`
                        )}
                      </span>
                      <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap justify-center">
                        <button
                          onClick={() => setActivityCurrentPage(prev => Math.max(1, prev - 1))}
                          disabled={activityCurrentPage === 1}
                          className="text-[7px] sm:text-[8px] font-mono px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg border border-white/10 hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-0.5 sm:gap-1"
                        >
                          <ChevronLeft className="w-2 h-2 sm:w-2.5 sm:h-2.5" />
                          <span className="hidden sm:inline">Prev</span>
                        </button>
                        <div className="flex items-center gap-0.5 sm:gap-1">
                          {renderPaginationButtons(activityCurrentPage, activityTotalPages, setActivityCurrentPage)}
                        </div>
                        <button
                          onClick={() => setActivityCurrentPage(prev => Math.min(activityTotalPages, prev + 1))}
                          disabled={activityCurrentPage === activityTotalPages}
                          className="text-[7px] sm:text-[8px] font-mono px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg border border-white/10 hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-0.5 sm:gap-1"
                        >
                          <span className="hidden sm:inline">Next</span>
                          <ChevronRight className="w-2 h-2 sm:w-2.5 sm:h-2.5" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}

                {activeTab === "mailbox" && (
                  <motion.div
                    key="mailbox"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                    className="bg-gradient-to-br from-[#11111a] to-[#0c0c12] rounded-2xl overflow-hidden border border-white/10 shadow-xl"
                  >
                    <div className="px-4 sm:px-5 md:px-6 py-3 sm:py-4 border-b border-white/10 bg-white/5">
                      <div className="flex items-center gap-1.5 sm:gap-2">
                        <Mail className="w-3 h-3 sm:w-[14px] sm:h-[14px] text-indigo-400 shrink-0" />
                        <h3 className="text-[8px] sm:text-[9px] md:text-[10px] font-mono font-bold text-slate-300 uppercase tracking-widest">Mailbox</h3>
                        <span className="text-[7px] sm:text-[8px] font-mono text-slate-500 bg-black/30 px-1.5 sm:px-2 py-0.5 rounded-full ml-auto sm:ml-0">{notifications.length}</span>
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      <div className="min-w-[700px] sm:min-w-[800px] lg:min-w-full">
                        <table className="w-full text-left font-mono">
                          <thead>
                            <tr className="border-b border-white/10 bg-black/30">
                              <th className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-[7px] sm:text-[8px] font-bold text-slate-500 uppercase tracking-wider">Type</th>
                              <th className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-[7px] sm:text-[8px] font-bold text-slate-500 uppercase tracking-wider hidden sm:table-cell">From</th>
                              <th className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-[7px] sm:text-[8px] font-bold text-slate-500 uppercase tracking-wider">Message</th>
                              <th className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-[7px] sm:text-[8px] font-bold text-slate-500 uppercase tracking-wider text-right">Timestamp</th>
                              <th className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-[7px] sm:text-[8px] font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {notificationsLoading ? (
                              // Skeleton loading - 10 dòng
                              [...Array(10)].map((_, idx) => (
                                <tr key={`skeleton-${idx}`} className="animate-pulse border-b border-white/5">
                                  <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4">
                                    <div className="h-4 sm:h-5 w-12 sm:w-16 bg-white/5 rounded-lg" />
                                  </td>
                                  <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 hidden sm:table-cell">
                                    <div className="flex flex-col gap-1">
                                      <div className="h-2.5 sm:h-3 w-16 sm:w-24 bg-white/5 rounded" />
                                      <div className="h-1.5 sm:h-2 w-12 sm:w-16 bg-white/5 rounded" />
                                    </div>
                                  </td>
                                  <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4">
                                    <div className="flex flex-col gap-1">
                                      <div className="h-2.5 sm:h-3 w-32 sm:w-48 bg-white/5 rounded" />
                                      <div className="h-1.5 sm:h-2 w-24 sm:w-32 bg-white/5 rounded" />
                                    </div>
                                  </td>
                                  <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-right">
                                    <div className="h-1.5 sm:h-2 w-16 sm:w-20 bg-white/5 rounded ml-auto" />
                                  </td>
                                  <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-right">
                                    <div className="h-6 sm:h-8 w-6 sm:w-8 bg-white/5 rounded-lg ml-auto" />
                                  </td>
                                </tr>
                              ))
                            ) : (
                              // Luôn hiển thị đúng 10 dòng
                              getPaginatedMailbox().map((notif, index) => {
                                if (notif === null) {
                                  // Dòng trống - KHÔNG có border
                                  return (
                                    <tr key={`empty-${index}`} className="pointer-events-none">
                                      <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 h-[60px] sm:h-[73px] border-none">&nbsp;</td>
                                      <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 h-[60px] sm:h-[73px] border-none hidden sm:table-cell">&nbsp;</td>
                                      <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 h-[60px] sm:h-[73px] border-none">&nbsp;</td>
                                      <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 h-[60px] sm:h-[73px] border-none">&nbsp;</td>
                                      <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 h-[60px] sm:h-[73px] border-none">&nbsp;</td>
                                    </tr>
                                  );
                                }

                                const isBroadcast = notif.isBroadcast;
                                const isAdmin = isBroadcast || ['warning', 'ban', 'report'].includes(notif.type);
                                const formattedDate = formatDate(notif.created_at);
                                const truncatedContent = notif.content && notif.content.length > 40 
                                  ? notif.content.substring(0, 40) + '...' 
                                  : notif.content || '';
                                
                                const getTypeBadge = () => {
                                  if (isBroadcast) {
                                    return (
                                      <div className="flex items-center gap-1 text-[6px] sm:text-[7px] font-black uppercase tracking-widest px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-lg w-fit bg-indigo-500/10 text-indigo-400">
                                        <Globe className="w-[6px] h-[6px] sm:w-2 sm:h-2" />
                                        Admin
                                      </div>
                                    );
                                  }
                                  
                                  const typeColors: Record<string, { bg: string; text: string; icon: any }> = {
                                    like: { bg: 'bg-rose-500/10', text: 'text-rose-400', icon: <ThumbsUp className="w-[6px] h-[6px] sm:w-2 sm:h-2" /> },
                                    reply: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', icon: <Reply className="w-[6px] h-[6px] sm:w-2 sm:h-2" /> },
                                    mention: { bg: 'bg-purple-500/10', text: 'text-purple-400', icon: <MessageSquare className="w-[6px] h-[6px] sm:w-2 sm:h-2" /> },
                                    warning: { bg: 'bg-amber-500/10', text: 'text-amber-400', icon: <AlertTriangle className="w-[6px] h-[6px] sm:w-2 sm:h-2" /> },
                                    ban: { bg: 'bg-red-500/10', text: 'text-red-400', icon: <ShieldAlert className="w-[6px] h-[6px] sm:w-2 sm:h-2" /> },
                                    report: { bg: 'bg-orange-500/10', text: 'text-orange-400', icon: <AlertTriangle className="w-[6px] h-[6px] sm:w-2 sm:h-2" /> },
                                  };
                                  
                                  const config = typeColors[notif.type] || { bg: 'bg-slate-500/10', text: 'text-slate-400', icon: <Bell className="w-[6px] h-[6px] sm:w-2 sm:h-2" /> };
                                  
                                  return (
                                    <div className={`flex items-center gap-1 text-[6px] sm:text-[7px] font-black uppercase tracking-widest px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-lg w-fit ${config.bg} ${config.text}`}>
                                      {config.icon}
                                      {notif.type}
                                    </div>
                                  );
                                };

                                return (
                                  <motion.tr 
                                    key={isBroadcast ? notif.notice_id : notif.notification_id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: Math.min(index * 0.03, 0.3) }}
                                    className="hover:bg-white/5 transition-all group border-b border-white/5"
                                  >
                                    <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4">
                                      {getTypeBadge()}
                                    </td>
                                    <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 hidden sm:table-cell">
                                      <div className="flex flex-col gap-0.5">
                                        <span className="text-slate-200 font-bold text-[8px] sm:text-[9px]">
                                          {isBroadcast ? 'System Admin' : `@${notif.actor_username || 'User'}`}
                                        </span>
                                        {isAdmin && (
                                          <span className="text-[5px] sm:text-[6px] text-indigo-400 font-mono uppercase tracking-wider">
                                            Official Message
                                          </span>
                                        )}
                                      </div>
                                    </td>
                                    <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4">
                                      <div className="relative group/tooltip max-w-[120px] sm:max-w-[180px] md:max-w-[280px]">
                                        <p className="text-slate-300 text-[8px] sm:text-[9px] md:text-[10px] leading-relaxed line-clamp-2 font-sans break-words">
                                          {isBroadcast ? notif.title : getNotificationTitle(notif.type)}
                                        </p>
                                        {notif.content && notif.content.length > 40 && (
                                          <div className="absolute bottom-full left-0 mb-2 px-2 sm:px-3 py-1.5 sm:py-2 bg-black/90 backdrop-blur-md rounded-lg border border-white/10 opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all duration-300 z-10 w-56 sm:w-72 md:w-80 pointer-events-none">
                                            <p className="text-slate-300 text-[8px] sm:text-[9px] md:text-[10px] leading-relaxed font-sans">
                                              {notif.content}
                                            </p>
                                          </div>
                                        )}
                                        {notif.content && (
                                          <p className="text-slate-400 text-[7px] sm:text-[8px] md:text-[9px] mt-0.5 sm:mt-1 line-clamp-1 italic">
                                            &ldquo;{truncatedContent}&rdquo;
                                          </p>
                                        )}
                                      </div>
                                    </td>
                                    <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-right">
                                      <span className="text-slate-100 font-bold text-[7px] sm:text-[8px] md:text-[9px]">{formattedDate}</span>
                                    </td>
                                    <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-right">
                                      <div className="flex items-center justify-end gap-1.5 sm:gap-3">
                                        {!isAdmin && notif.post_id && (
                                          <a 
                                            href={notif.comment_id 
                                              ? `/news/${notif.post_id}#comment-${notif.comment_id}` 
                                              : `/news/${notif.post_id}`}
                                            className="p-1 sm:p-2 hover:bg-indigo-500/20 rounded-lg transition-all text-indigo-400 hover:text-white"
                                            title="View related content"
                                          >
                                            <ExternalLink className="w-2.5 h-2.5 sm:w-[14px] sm:h-[14px]" />
                                          </a>
                                        )}
                                        {isAdmin && (
                                          <span className="text-[6px] sm:text-[7px] text-slate-500 font-mono uppercase tracking-wider">
                                            Read-only
                                          </span>
                                        )}
                                      </div>
                                    </td>
                                  </motion.tr>
                                );
                              })
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Pagination - Luôn hiển thị */}
                    <div className="px-4 sm:px-5 md:px-6 py-3 sm:py-4 border-t border-white/10 bg-black/20 flex flex-col sm:flex-row justify-between items-center gap-2 sm:gap-0">
                      <span className="text-[6px] sm:text-[7px] font-mono text-slate-500 text-center sm:text-left">
                        {notifications.length > 0 ? (
                          `Showing ${((mailboxCurrentPage - 1) * itemsPerPage) + 1} to ${Math.min(mailboxCurrentPage * itemsPerPage, notifications.length)} of ${notifications.length} messages`
                        ) : (
                          `Showing 0 of 0 messages`
                        )}
                      </span>
                      <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap justify-center">
                        <button
                          onClick={() => setMailboxCurrentPage(prev => Math.max(1, prev - 1))}
                          disabled={mailboxCurrentPage === 1}
                          className="text-[7px] sm:text-[8px] font-mono px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg border border-white/10 hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-0.5 sm:gap-1"
                        >
                          <ChevronLeft className="w-2 h-2 sm:w-2.5 sm:h-2.5" />
                          <span className="hidden sm:inline">Prev</span>
                        </button>
                        <div className="flex items-center gap-0.5 sm:gap-1">
                          {renderPaginationButtons(mailboxCurrentPage, mailboxTotalPages, setMailboxCurrentPage)}
                        </div>
                        <button
                          onClick={() => setMailboxCurrentPage(prev => Math.min(mailboxTotalPages, prev + 1))}
                          disabled={mailboxCurrentPage === mailboxTotalPages}
                          className="text-[7px] sm:text-[8px] font-mono px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg border border-white/10 hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-0.5 sm:gap-1"
                        >
                          <span className="hidden sm:inline">Next</span>
                          <ChevronRight className="w-2 h-2 sm:w-2.5 sm:h-2.5" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </main>

      {/* Avatar Upload Modal */}
      <AnimatePresence>
        {showAvatarModal && (
          <>
            <div
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
              onClick={() => setShowAvatarModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100vw-2rem)] sm:w-full max-w-md bg-gradient-to-br from-[#12121c] to-[#0c0c12] border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden mx-3 sm:mx-0"
            >
              <div className="p-4 sm:p-6 border-b border-white/10 flex justify-between items-center bg-white/5">
                <h3 className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Camera size={14} className="text-indigo-400 sm:w-[18px] sm:h-[18px]" />
                  Update Avatar
                </h3>
                <button
                  onClick={() => setShowAvatarModal(false)}
                  className="p-1.5 sm:p-2 hover:bg-white/10 rounded-lg transition-all text-slate-400 hover:text-white hover:rotate-90 duration-300"
                >
                  <X size={16} className="sm:w-5 sm:h-5" />
                </button>
              </div>
              
              <div className="p-4 sm:p-6 flex flex-col items-center gap-4 sm:gap-6">
                {/* Preview */}
                <div className="relative w-28 h-28 sm:w-36 sm:h-36 md:w-40 md:h-40 rounded-full border-2 border-indigo-500/30 overflow-hidden shadow-xl shadow-indigo-500/10">
                  <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full blur-lg opacity-30" />
                  {avatarPreview ? (
                    <img
                      src={avatarPreview}
                      alt="Avatar preview"
                      className="w-full h-full object-cover relative z-10"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center text-white text-4xl sm:text-5xl md:text-6xl font-bold uppercase relative z-10">
                      {getUserInitials()}
                    </div>
                  )}
                </div>
                
                <div className="text-center">
                  <p className="text-[10px] sm:text-xs text-slate-400 break-all">
                    {avatarFile ? avatarFile.name : 'Choose an image to upload'}
                  </p>
                  <p className="text-[7px] sm:text-[8px] text-slate-500 font-mono mt-1">
                    JPEG, PNG, GIF, WEBP • Max 2MB
                  </p>
                </div>
                
                <div className="flex gap-2 sm:gap-3 w-full">
                  <button
                    onClick={() => {
                      setShowAvatarModal(false);
                      setAvatarFile(null);
                      setAvatarPreview(null);
                    }}
                    className="flex-1 py-2.5 sm:py-3 bg-white/5 hover:bg-white/10 rounded-xl text-xs sm:text-sm font-bold text-slate-300 transition-all hover:scale-[1.02] active:scale-[0.98]"
                  >
                    Cancel
                  </button>
                  {!user?.facebook_id && !user?.google_id && (
                    <button
                      onClick={handleDeleteAvatar}
                      className="px-3 sm:px-4 py-2.5 sm:py-3 bg-rose-500/10 hover:bg-rose-500/20 rounded-xl text-xs sm:text-sm font-bold text-rose-400 transition-all hover:scale-[1.02] active:scale-[0.98]"
                    >
                      <Trash2 size={14} className="sm:w-4 sm:h-4" />
                    </button>
                  )}
                  <button
                    onClick={handleUploadAvatar}
                    disabled={!avatarFile || uploadingAvatar}
                    className="flex-1 py-2.5 sm:py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-xs sm:text-sm font-bold text-white transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-1.5 sm:gap-2 shadow-lg shadow-indigo-500/20"
                  >
                    {uploadingAvatar ? (
                      <>
                        <div className="w-3 h-3 sm:w-4 sm:h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span className="text-[10px] sm:text-sm">Uploading...</span>
                      </>
                    ) : (
                      <>
                        <Upload size={14} className="sm:w-4 sm:h-4" />
                        <span className="text-[10px] sm:text-sm">Upload</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
      <Footer />
    </div>
  );
}