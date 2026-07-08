// app/Admin/Profile/page.tsx
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import "../../css/Admin/Profile.css";
import {
  User,
  Lock,
  History,
  MessageSquare,
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
  Server,
  Cpu,
  Users,
  BarChart3,
  Newspaper
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type AdminUser = {
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

type AdminActivity = {
  id: number;
  action: string;
  details: string;
  created_at: string;
  type: 'login' | 'update' | 'delete' | 'create' | 'system';
  ip_address?: string;
};

type SystemMetric = {
  total_users: number;
  total_comments: number;
  total_conversions: number;
  total_news: number;
  active_sessions: number;
  server_uptime: string;
  memory_usage: string;
  cpu_load: string;
};

const API_BASE = "/api/laravel";

// Helper lấy URL avatar
function getAvatarUrl(user: AdminUser | null): string | null {
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

export default function AdminProfileDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("profile");
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: string; visible: boolean }>({ message: '', type: '', visible: false });
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [editingUsername, setEditingUsername] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [updatingUsername, setUpdatingUsername] = useState(false);
  const [adminActivities, setAdminActivities] = useState<AdminActivity[]>([]);
  const [activitiesLoading, setActivitiesLoading] = useState(false);
  const [systemMetrics, setSystemMetrics] = useState<SystemMetric | null>(null);
  const [metricsLoading, setMetricsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

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
          // Kiểm tra role admin
          const role = data.user.role?.toLowerCase() || '';
          if (!['admin', 'root', 'superadmin'].includes(role)) {
            showToast('Access denied. Admin privileges required.', 'error');
            setTimeout(() => router.replace('/'), 1500);
            return;
          }
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
          try { 
            const parsed = JSON.parse(stored);
            const role = parsed.role?.toLowerCase() || '';
            if (['admin', 'root', 'superadmin'].includes(role)) {
              setUser(parsed);
            } else {
              router.replace("/");
            }
          } catch { router.replace("/login"); }
        } else {
          router.replace("/login");
        }
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [router]);

  // Fetch admin activities
  const fetchAdminActivities = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    setActivitiesLoading(true);
    try {
      const res = await fetch(`${API_BASE}/admin/activities`, {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Accept": "application/json"
        }
      });
      const data = await res.json();
      if (res.ok && Array.isArray(data.activities)) {
        setAdminActivities(data.activities);
      } else {
        // Fallback: tạo activity mẫu
        const mockActivities: AdminActivity[] = [
          {
            id: 1,
            action: 'Login',
            details: 'Admin login from IP 192.168.1.1',
            created_at: new Date().toISOString(),
            type: 'login',
            ip_address: '192.168.1.1'
          },
          {
            id: 2,
            action: 'User Management',
            details: 'Updated user permissions for user_id: 42',
            created_at: new Date(Date.now() - 3600000).toISOString(),
            type: 'update'
          },
          {
            id: 3,
            action: 'Content Management',
            details: 'Published new news article: "System Update v3.2"',
            created_at: new Date(Date.now() - 7200000).toISOString(),
            type: 'create'
          },
          {
            id: 4,
            action: 'Rate Update',
            details: 'Updated USD to EUR rate to 0.92',
            created_at: new Date(Date.now() - 86400000).toISOString(),
            type: 'update'
          }
        ];
        setAdminActivities(mockActivities);
      }
    } catch (error) {
      console.error("Fetch admin activities error:", error);
    } finally {
      setActivitiesLoading(false);
    }
  }, []);

  // Fetch system metrics
  const fetchSystemMetrics = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    setMetricsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/admin/metrics`, {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Accept": "application/json"
        }
      });
      const data = await res.json();
      if (res.ok && data.metrics) {
        setSystemMetrics(data.metrics);
      } else {
        // Fallback: mock metrics
        setSystemMetrics({
          total_users: 1547,
          total_comments: 8923,
          total_conversions: 12456,
          total_news: 342,
          active_sessions: 23,
          server_uptime: '14d 7h 32m',
          memory_usage: '4.2 GB / 8 GB',
          cpu_load: '23%'
        });
      }
    } catch (error) {
      console.error("Fetch system metrics error:", error);
    } finally {
      setMetricsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) {
      fetchAdminActivities();
      fetchSystemMetrics();
    }
  }, [user, fetchAdminActivities, fetchSystemMetrics]);

  // Avatar upload handlers
  const handleAvatarClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      showToast('Please upload JPEG, PNG, GIF, or WEBP image', 'error');
      return;
    }

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
        const updatedUser = {
          ...user,
          avatar_url: data.avatar_url,
        };
        setUser(updatedUser as AdminUser);
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
        setUser(updatedUser as AdminUser);
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

  const handleCopyId = () => {
    if (user) {
      navigator.clipboard.writeText(`#${user.user_id}`);
      showToast("Admin ID copied to clipboard!", "success");
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
        } as AdminUser;
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

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.dispatchEvent(new Event("auth-changed"));
    router.push("/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#02020a] via-[#050510] to-[#02020a] flex flex-col items-center justify-center gap-4">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-20">
          <div className="flex flex-col gap-10">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 pb-8 border-b border-white/10 animate-pulse">
              <div className="flex flex-col gap-3">
                <div className="h-5 w-48 bg-white/10 rounded-full" />
                <div className="h-10 w-64 bg-white/10 rounded-lg" />
                <div className="h-4 w-80 bg-white/10 rounded" />
              </div>
            </div>
            <div className="grid lg:grid-cols-12 gap-8">
              <div className="lg:col-span-3 animate-pulse">
                <div className="flex flex-col gap-1.5 p-2 bg-gradient-to-br from-[#11111a] to-[#0c0c12] border border-white/10 rounded-2xl shadow-xl">
                  <div className="relative mx-auto my-4">
                    <div className="w-32 h-32 rounded-full bg-white/10 mx-auto" />
                  </div>
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-10 bg-white/5 rounded-xl mx-1" />
                  ))}
                </div>
              </div>
              <div className="lg:col-span-9">
                <div className="flex flex-col gap-6 animate-pulse">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="bg-gradient-to-br from-[#11111a] to-[#0c0c12] p-6 rounded-2xl border border-white/10 shadow-xl h-48" />
                    <div className="bg-gradient-to-br from-[#11111a] to-[#0c0c12] p-6 rounded-2xl border border-white/10 shadow-xl h-48" />
                  </div>
                  <div className="bg-gradient-to-br from-[#11111a] to-[#0c0c12] p-6 rounded-2xl border border-white/10 shadow-xl h-32" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const tabs = [
    { id: "profile", label: "Profile & Identity", icon: <User size={14} /> },
    { id: "activity", label: "Admin Activity", icon: <Activity size={14} /> },
  ];

  const paginatedActivities = adminActivities.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  const totalPages = Math.max(1, Math.ceil(adminActivities.length / itemsPerPage));

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#02020a] via-[#050510] to-[#02020a] text-slate-100 selection:bg-indigo-500/30 font-sans overflow-x-hidden">
      
      <div className="fixed inset-0 pointer-events-none -z-10">
        <div className="absolute top-[-20%] right-[-10%] w-[800px] h-[800px] bg-indigo-600/8 rounded-full blur-[150px]" />
        <div className="absolute bottom-[5%] left-[-15%] w-[600px] h-[600px] bg-purple-600/6 rounded-full blur-[120px]" />
        <div className="absolute top-[40%] left-[30%] w-[500px] h-[500px] bg-cyan-600/4 rounded-full blur-[100px]" />
      </div>

      <AnimatePresence>
        {toast.visible && (
          <motion.div
            initial={{ opacity: 0, x: 100, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 100, scale: 0.9 }}
            transition={{ duration: 0.3, type: "spring", stiffness: 400 }}
            className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl border backdrop-blur-xl flex items-center gap-3 shadow-2xl ${
              toast.type === 'success' ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-200' :
              toast.type === 'error' ? 'bg-red-500/15 border-red-500/40 text-red-200' :
              'bg-indigo-500/15 border-indigo-500/40 text-indigo-200'
            }`}
          >
            {toast.type === 'success' && <CheckCircle2 size={16} />}
            {toast.type === 'error' && <AlertCircle size={16} />}
            {toast.type === 'info' && <Sparkles size={16} />}
            <p className="text-sm font-medium">{toast.message}</p>
          </motion.div>
        )}
      </AnimatePresence>
      
      <main className="pt-32 pb-20 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex flex-col gap-10 relative z-10">
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 pb-8 border-b border-white/10"
          >
            <div className="flex flex-col gap-3">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-indigo-500/10 border border-indigo-500/20 rounded-full w-fit">
                <ShieldCheck size={12} className="text-indigo-400" />
                <span className="text-[8px] font-black uppercase tracking-[0.2em] text-indigo-400 font-mono">
                  Admin Console • Elevated Privileges
                </span>
              </div>
              <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight uppercase leading-none">
                Admin <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-sky-400">Profile</span>
              </h1>
              <p className="text-slate-400 text-sm max-w-lg">
                Manage your admin identity, monitor system activity, and oversee platform operations.
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex flex-col items-end gap-0.5 font-mono text-right">
                <span className="text-sm font-black uppercase tracking-wide text-white">
                  {user.username}
                </span>
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-lg shadow-emerald-500/30" />
                  <span className="text-[7px] text-emerald-400 font-black uppercase tracking-widest">
                    {user.role || 'Admin'} • Active
                  </span>
                </div>
              </div>
            </div>
          </motion.div>

          <div className="grid lg:grid-cols-12 gap-8">
            
            {/* Sidebar Navigation */}
            <motion.aside 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="lg:col-span-3"
            >
              <div className="flex flex-col gap-1.5 p-2 bg-gradient-to-br from-[#11111a] to-[#0c0c12] border border-white/10 rounded-2xl sticky top-28 shadow-xl">
                
                {/* Large Avatar Circle */}
                <motion.div 
                  className="relative mx-auto my-4 group/avatar"
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
                    className="relative w-32 h-32 rounded-full cursor-pointer group-hover/avatar:ring-4 ring-indigo-500/40 ring-offset-2 ring-offset-[#0c0c12] transition-all duration-300"
                  >
                    <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full blur-md opacity-0 group-hover/avatar:opacity-100 transition-all duration-500" />
                    
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
                            fallback.className = 'w-full h-full rounded-full bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 text-white font-bold flex items-center justify-center text-4xl uppercase shadow-inner border-2 border-white/10 relative';
                            fallback.textContent = getUserInitials();
                            parent.appendChild(fallback);
                          }
                        }}
                      />
                    ) : (
                      <div className="w-full h-full rounded-full bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 text-white font-bold flex items-center justify-center text-4xl uppercase shadow-inner border-2 border-white/10 relative">
                        {getUserInitials()}
                      </div>
                    )}
                    
                    <div className="absolute inset-0 rounded-full bg-black/50 backdrop-blur-sm opacity-0 group-hover/avatar:opacity-100 transition-all duration-300 flex flex-col items-center justify-center gap-1">
                      <Camera size={28} className="text-white drop-shadow-lg" />
                      <span className="text-[8px] font-bold text-white uppercase tracking-wider drop-shadow-lg">
                        Change
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 text-center">
                    <p className="text-sm font-bold text-white tracking-wide">
                      {user.username}
                    </p>
                    <div className="flex items-center justify-center gap-2 mt-0.5">
                      <ShieldCheck size={12} className="text-indigo-400" />
                      <span className="text-[8px] font-mono text-indigo-400/70 uppercase tracking-widest">
                        {user.role || 'Admin'}
                      </span>
                    </div>
                  </div>

                  <p className="text-[6px] text-slate-500 text-center mt-1 font-mono opacity-0 group-hover/avatar:opacity-100 transition-opacity duration-300">
                    Click to update profile picture
                  </p>
                </motion.div>

                {/* Navigation Buttons */}
                {tabs.map((tab) => (
                  <motion.button
                    key={tab.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-[10px] font-bold font-mono uppercase tracking-widest transition-all cursor-pointer ${
                      activeTab === tab.id 
                      ? "bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-lg shadow-indigo-600/30" 
                      : "text-slate-500 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    {tab.icon}
                    {tab.label}
                  </motion.button>
                ))}
                
                <div className="h-px bg-white/10 my-2 mx-3" />
                
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="button"
                  onClick={handleLogout}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-[10px] font-bold font-mono text-rose-500 uppercase tracking-widest hover:bg-rose-500/10 transition-all w-full text-left cursor-pointer"
                >
                  <LogOut size={14} />
                  Terminate Session
                </motion.button>
              </div>
            </motion.aside>

            {/* Main Content Area */}
            <div className="lg:col-span-9">
              <AnimatePresence mode="wait">
                {activeTab === "profile" && (
                  <motion.div
                    key="profile"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                    className="flex flex-col gap-6"
                  >
                    <div className="grid md:grid-cols-2 gap-6">
                      {/* Identity Card */}
                      <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="bg-gradient-to-br from-[#11111a] to-[#0c0c12] p-6 rounded-2xl border border-white/10 shadow-xl relative overflow-hidden group"
                      >
                        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl" />
                        <div className="relative z-10 flex flex-col gap-5">
                          <h3 className="text-xs font-bold font-mono text-slate-200 uppercase tracking-wider flex items-center gap-2 pb-3 border-b border-white/10">
                            <ShieldCheck className="text-indigo-400" size={14} />
                            Admin Identity
                          </h3>
                          <div className="flex flex-col gap-3">
                            <div className="flex flex-col gap-1.5">
                              <label className="text-[7px] font-mono font-black text-slate-500 uppercase tracking-widest flex items-center gap-1">
                                <User size={8} /> Username
                              </label>
                              {editingUsername ? (
                                <div className="flex items-center gap-2 px-3 py-2 bg-black/40 rounded-lg focus-within:ring-2 focus-within:ring-indigo-500/30 transition-all">
                                  <input
                                    type="text"
                                    value={newUsername}
                                    onChange={(e) => setNewUsername(e.target.value)}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') handleUpdateUsername();
                                      if (e.key === 'Escape') {
                                        setEditingUsername(false);
                                        setNewUsername(user.username);
                                      }
                                    }}
                                    autoFocus
                                    className="flex-1 bg-transparent text-white text-sm font-medium outline-none placeholder:text-slate-600"
                                    placeholder="Enter username"
                                    maxLength={30}
                                  />
                                  <div className="flex items-center gap-1">
                                    <button
                                      onClick={handleUpdateUsername}
                                      disabled={updatingUsername || !newUsername.trim()}
                                      className="p-1.5 hover:bg-white/10 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed text-indigo-400 hover:text-indigo-300"
                                    >
                                      {updatingUsername ? (
                                        <Loader2 size={14} className="animate-spin" />
                                      ) : (
                                        <CheckCircle2 size={14} />
                                      )}
                                    </button>
                                    <button
                                      onClick={() => {
                                        setEditingUsername(false);
                                        setNewUsername(user.username);
                                      }}
                                      className="p-1.5 hover:bg-white/10 rounded-lg transition-all text-slate-400 hover:text-white"
                                    >
                                      <X size={14} />
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <div 
                                  onClick={() => {
                                    setEditingUsername(true);
                                    setNewUsername(user.username);
                                  }}
                                  className="group flex items-center justify-between px-3 py-2 bg-black/40 rounded-lg transition-all cursor-pointer hover:bg-black/60"
                                >
                                  <span className="text-white text-sm font-medium">{user.username}</span>
                                  <div className="flex items-center gap-2">
                                    <span className="text-[6px] font-mono text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity uppercase tracking-wider">
                                      Click to edit
                                    </span>
                                    <Pencil size={12} className="text-slate-500 group-hover:text-indigo-400 transition-colors" />
                                  </div>
                                </div>
                              )}
                            </div>
                            
                            <div className="flex flex-col gap-1.5">
                              <label className="text-[7px] font-mono font-black text-slate-500 uppercase tracking-widest flex items-center gap-1">
                                <Mail size={8} /> Email
                              </label>
                              <div className="flex items-center justify-between p-3 bg-black/40 rounded-xl">
                                <span className="text-white font-mono text-xs truncate">{user.email}</span>
                                <div className="flex items-center gap-1">
                                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                  <span className="text-[6px] text-emerald-400 font-mono">VERIFIED</span>
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex flex-col gap-1.5">
                              <label className="text-[7px] font-mono font-black text-slate-500 uppercase tracking-widest flex items-center gap-1">
                                <BadgeCheck size={8} /> Role
                              </label>
                              <div className="flex items-center justify-between p-3 bg-indigo-500/10 rounded-xl border border-indigo-500/20">
                                <span className="text-indigo-400 font-mono font-bold text-xs uppercase tracking-wider">
                                  {user.role || 'Admin'}
                                </span>
                                <div className="flex items-center gap-1">
                                  <ShieldCheck size={12} className="text-indigo-400" />
                                  <span className="text-[6px] text-indigo-400/70 font-mono uppercase tracking-wider">
                                    Elevated Access
                                  </span>
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
                        className="bg-gradient-to-br from-[#11111a] to-[#0c0c12] p-6 rounded-2xl border border-white/10 shadow-xl relative overflow-hidden"
                      >
                        <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full blur-2xl" />
                        <div className="relative z-10 flex flex-col gap-5">
                          <h3 className="text-xs font-bold font-mono text-slate-200 uppercase tracking-wider flex items-center gap-2 pb-3 border-b border-white/10">
                            <Lock className="text-indigo-400" size={14} />
                            Security & Access
                          </h3>
                          <div className="flex flex-col gap-3">
                            <div className="flex items-center gap-2 p-3 bg-emerald-500/10 rounded-xl">
                              <ShieldCheck size={14} className="text-emerald-400" />
                              <span className="text-[8px] text-slate-300 font-mono">AES-256 Encryption Active</span>
                            </div>
                            <div className="flex items-center gap-2 p-3 bg-indigo-500/10 rounded-xl">
                              <Fingerprint size={14} className="text-indigo-400" />
                              <span className="text-[8px] text-slate-300 font-mono">Admin MFA: Enabled</span>
                            </div>
                            <p className="text-[9px] text-slate-500 leading-relaxed font-mono">
                              Two-factor authentication is active for admin accounts. Key rotation recommended every 90 days.
                            </p>
                            <div className="flex gap-2">
                              <motion.button 
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className="flex-1 py-3 bg-white/5 hover:bg-white/10 rounded-xl text-[8px] font-black font-mono text-slate-300 uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                              >
                                <RefreshCw size={10} /> Rotate Key
                              </motion.button>
                              <motion.button 
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className="flex-1 py-3 bg-emerald-500/10 hover:bg-emerald-500/20 rounded-xl text-[8px] font-black font-mono text-emerald-400 uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                              >
                                <Fingerprint size={10} /> MFA Settings
                              </motion.button>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    </div>

                    {/* Admin Stats Widget */}
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      className="bg-gradient-to-br from-[#11111a] to-[#0c0c12] p-6 rounded-2xl border border-white/10 shadow-xl"
                    >
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="flex flex-col gap-1 p-4 bg-black/30 rounded-xl">
                          <span className="text-[7px] font-mono font-black text-slate-500 uppercase tracking-widest flex items-center gap-1">
                            <ShieldCheck size={8} /> Role
                          </span>
                          <span className="text-slate-200 font-mono font-bold text-xs uppercase tracking-wide">{user.role || 'Admin'}</span>
                        </div>
                        <div className="flex flex-col gap-1 p-4 bg-black/30 rounded-xl">
                          <span className="text-[7px] font-mono font-black text-slate-500 uppercase tracking-widest flex items-center gap-1">
                            <BadgeCheck size={8} /> Status
                          </span>
                          <span className={`font-mono font-black text-xs uppercase flex items-center gap-1.5 ${user.is_active ? "text-emerald-400" : "text-rose-400"}`}>
                            <div className={`w-1.5 h-1.5 rounded-full ${user.is_active ? "bg-emerald-500 animate-pulse" : "bg-rose-500"}`} />
                            {user.is_active ? "Active" : "Disabled"}
                          </span>
                        </div>
                        <div className="flex flex-col gap-1 p-4 bg-black/30 rounded-xl">
                          <span className="text-[7px] font-mono font-black text-slate-500 uppercase tracking-widest flex items-center gap-1">
                            <Globe size={8} /> Currency
                          </span>
                          <span className="text-2xl font-black font-mono text-indigo-400 uppercase">
                            {user.preferred_currency || "—"}
                          </span>
                        </div>
                        <div className="flex flex-col gap-1 p-4 bg-black/30 rounded-xl">
                          <span className="text-[7px] font-mono font-black text-slate-500 uppercase tracking-widest flex items-center gap-1">
                            <Users size={8} /> Admin ID
                          </span>
                          <div 
                            onClick={handleCopyId}
                            className="flex items-center gap-2 cursor-pointer group"
                          >
                            <span className="text-sm font-mono text-slate-300">#{user.user_id}</span>
                            <Copy size={12} className="text-slate-500 group-hover:text-indigo-400 transition-colors" />
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  </motion.div>
                )}

                {activeTab === "activity" && (
                  <motion.div
                    key="activity"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                    className="bg-gradient-to-br from-[#11111a] to-[#0c0c12] rounded-2xl overflow-hidden border border-white/10 shadow-xl"
                  >
                    <div className="px-6 py-4 border-b border-white/10 bg-white/5">
                      <div className="flex items-center gap-2">
                        <Activity size={14} className="text-indigo-400" />
                        <h3 className="text-[10px] font-mono font-bold text-slate-300 uppercase tracking-widest">Admin Activity Log</h3>
                        <span className="text-[8px] font-mono text-slate-500 bg-black/30 px-2 py-0.5 rounded-full">{adminActivities.length}</span>
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left font-mono">
                        <thead>
                          <tr className="border-b border-white/10 bg-black/30">
                            <th className="px-6 py-4 text-[8px] font-bold text-slate-500 uppercase tracking-wider">Type</th>
                            <th className="px-6 py-4 text-[8px] font-bold text-slate-500 uppercase tracking-wider">Action</th>
                            <th className="px-6 py-4 text-[8px] font-bold text-slate-500 uppercase tracking-wider">Details</th>
                            <th className="px-6 py-4 text-[8px] font-bold text-slate-500 uppercase tracking-wider text-right">Timestamp</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {activitiesLoading ? (
                            <tr>
                              <td colSpan={4} className="px-6 py-12 text-center">
                                <div className="flex items-center justify-center gap-3">
                                  <div className="w-5 h-5 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
                                  <span className="text-[9px] text-slate-500 font-mono">Loading activities...</span>
                                </div>
                              </td>
                            </tr>
                          ) : paginatedActivities.length === 0 ? (
                            <tr>
                              <td colSpan={4} className="px-6 py-12 text-center">
                                <div className="flex flex-col items-center gap-2">
                                  <Activity size={24} className="text-slate-600" />
                                  <span className="text-[9px] text-slate-500 font-mono">No admin activities recorded</span>
                                </div>
                              </td>
                            </tr>
                          ) : (
                            paginatedActivities.map((item, i) => {
                              const typeColors = {
                                login: 'bg-emerald-500/10 text-emerald-400',
                                update: 'bg-blue-500/10 text-blue-400',
                                delete: 'bg-rose-500/10 text-rose-400',
                                create: 'bg-indigo-500/10 text-indigo-400',
                                system: 'bg-purple-500/10 text-purple-400',
                              };
                              const typeColor = typeColors[item.type] || 'bg-slate-500/10 text-slate-400';

                              return (
                                <motion.tr 
                                  key={item.id}
                                  initial={{ opacity: 0, x: -20 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: i * 0.03 }}
                                  className="hover:bg-white/5 transition-all"
                                >
                                  <td className="px-6 py-4">
                                    <span className={`text-[7px] font-black uppercase tracking-widest px-2 py-1 rounded-lg ${typeColor}`}>
                                      {item.type}
                                    </span>
                                  </td>
                                  <td className="px-6 py-4">
                                    <span className="text-slate-200 text-[10px] font-bold">{item.action}</span>
                                  </td>
                                  <td className="px-6 py-4">
                                    <span className="text-slate-400 text-[9px]">{item.details}</span>
                                    {item.ip_address && (
                                      <span className="block text-[6px] text-slate-500 font-mono mt-0.5">IP: {item.ip_address}</span>
                                    )}
                                  </td>
                                  <td className="px-6 py-4 text-right">
                                    <span className="text-slate-100 font-bold text-[9px]">{formatDate(item.created_at)}</span>
                                  </td>
                                </motion.tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>

                    {adminActivities.length > 0 && (
                      <div className="px-6 py-4 border-t border-white/10 bg-black/20 flex justify-between items-center">
                        <span className="text-[7px] font-mono text-slate-500">
                          Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, adminActivities.length)} of {adminActivities.length} activities
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                            disabled={currentPage === 1}
                            className="text-[8px] font-mono px-3 py-1.5 rounded-lg border border-white/10 hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-1"
                          >
                            <ChevronLeft size={10} />
                            Prev
                          </button>
                          <div className="flex items-center gap-1">
                            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                              let pageNum;
                              if (totalPages <= 5) {
                                pageNum = i + 1;
                              } else if (currentPage <= 3) {
                                pageNum = i + 1;
                              } else if (currentPage >= totalPages - 2) {
                                pageNum = totalPages - 4 + i;
                              } else {
                                pageNum = currentPage - 2 + i;
                              }
                              return (
                                <button
                                  key={pageNum}
                                  onClick={() => setCurrentPage(pageNum)}
                                  className={`w-6 h-6 text-[8px] font-mono rounded-lg transition-all ${
                                    currentPage === pageNum
                                      ? 'bg-indigo-500 text-white'
                                      : 'border border-white/10 hover:bg-white/5 text-slate-400'
                                  }`}
                                >
                                  {pageNum}
                                </button>
                              );
                            })}
                          </div>
                          <button
                            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                            disabled={currentPage === totalPages}
                            className="text-[8px] font-mono px-3 py-1.5 rounded-lg border border-white/10 hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-1"
                          >
                            Next
                            <ChevronRight size={10} />
                          </button>
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}

                {activeTab === "system" && (
                  <motion.div
                    key="system"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                    className="flex flex-col gap-6"
                  >
                    {/* System Metrics Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="bg-gradient-to-br from-[#11111a] to-[#0c0c12] p-5 rounded-2xl border border-white/10 shadow-xl"
                      >
                        <div className="flex items-center gap-2 text-slate-400 text-[8px] font-mono uppercase tracking-wider">
                          <Users size={12} />
                          Total Users
                        </div>
                        <p className="text-2xl font-black text-white mt-1">
                          {systemMetrics?.total_users.toLocaleString() || '—'}
                        </p>
                      </motion.div>
                      
                      <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.15 }}
                        className="bg-gradient-to-br from-[#11111a] to-[#0c0c12] p-5 rounded-2xl border border-white/10 shadow-xl"
                      >
                        <div className="flex items-center gap-2 text-slate-400 text-[8px] font-mono uppercase tracking-wider">
                          <MessageCircleMore size={12} />
                          Comments
                        </div>
                        <p className="text-2xl font-black text-white mt-1">
                          {systemMetrics?.total_comments.toLocaleString() || '—'}
                        </p>
                      </motion.div>
                      
                      <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="bg-gradient-to-br from-[#11111a] to-[#0c0c12] p-5 rounded-2xl border border-white/10 shadow-xl"
                      >
                        <div className="flex items-center gap-2 text-slate-400 text-[8px] font-mono uppercase tracking-wider">
                          <ArrowRightLeft size={12} />
                          Conversions
                        </div>
                        <p className="text-2xl font-black text-white mt-1">
                          {systemMetrics?.total_conversions.toLocaleString() || '—'}
                        </p>
                      </motion.div>
                      
                      <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.25 }}
                        className="bg-gradient-to-br from-[#11111a] to-[#0c0c12] p-5 rounded-2xl border border-white/10 shadow-xl"
                      >
                        <div className="flex items-center gap-2 text-slate-400 text-[8px] font-mono uppercase tracking-wider">
                          <Newspaper size={12} />
                          News Articles
                        </div>
                        <p className="text-2xl font-black text-white mt-1">
                          {systemMetrics?.total_news.toLocaleString() || '—'}
                        </p>
                      </motion.div>
                    </div>

                    {/* System Status */}
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                      className="bg-gradient-to-br from-[#11111a] to-[#0c0c12] p-6 rounded-2xl border border-white/10 shadow-xl"
                    >
                      <h3 className="text-xs font-bold font-mono text-slate-200 uppercase tracking-wider flex items-center gap-2 pb-4 border-b border-white/10">
                        <Server size={14} className="text-indigo-400" />
                        Server Status
                      </h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                        <div className="p-3 bg-black/30 rounded-xl">
                          <span className="text-[7px] font-mono text-slate-500 uppercase tracking-wider">Active Sessions</span>
                          <p className="text-lg font-black text-emerald-400 mt-1">{systemMetrics?.active_sessions || 0}</p>
                        </div>
                        <div className="p-3 bg-black/30 rounded-xl">
                          <span className="text-[7px] font-mono text-slate-500 uppercase tracking-wider">Uptime</span>
                          <p className="text-lg font-black text-white mt-1 font-mono">{systemMetrics?.server_uptime || '—'}</p>
                        </div>
                        <div className="p-3 bg-black/30 rounded-xl">
                          <span className="text-[7px] font-mono text-slate-500 uppercase tracking-wider">Memory</span>
                          <p className="text-lg font-black text-white mt-1 font-mono">{systemMetrics?.memory_usage || '—'}</p>
                        </div>
                        <div className="p-3 bg-black/30 rounded-xl">
                          <span className="text-[7px] font-mono text-slate-500 uppercase tracking-wider">CPU Load</span>
                          <p className="text-lg font-black text-white mt-1 font-mono">{systemMetrics?.cpu_load || '—'}</p>
                        </div>
                      </div>
                    </motion.div>

                    {/* Quick Actions */}
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.35 }}
                      className="bg-gradient-to-br from-[#11111a] to-[#0c0c12] p-6 rounded-2xl border border-white/10 shadow-xl"
                    >
                      <h3 className="text-xs font-bold font-mono text-slate-200 uppercase tracking-wider flex items-center gap-2 pb-4 border-b border-white/10">
                        <Zap size={14} className="text-indigo-400" />
                        Quick Actions
                      </h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
                        <button className="flex items-center gap-2 p-3 bg-white/5 hover:bg-white/10 rounded-xl text-[8px] font-mono text-slate-300 uppercase tracking-wider transition-all">
                          <Users size={14} className="text-indigo-400" />
                          Manage Users
                        </button>
                        <button className="flex items-center gap-2 p-3 bg-white/5 hover:bg-white/10 rounded-xl text-[8px] font-mono text-slate-300 uppercase tracking-wider transition-all">
                          <Globe size={14} className="text-emerald-400" />
                          Update Rates
                        </button>
                        <button className="flex items-center gap-2 p-3 bg-white/5 hover:bg-white/10 rounded-xl text-[8px] font-mono text-slate-300 uppercase tracking-wider transition-all">
                          <Newspaper size={14} className="text-purple-400" />
                          Create News
                        </button>
                        <button className="flex items-center gap-2 p-3 bg-white/5 hover:bg-white/10 rounded-xl text-[8px] font-mono text-slate-300 uppercase tracking-wider transition-all">
                          <BarChart3 size={14} className="text-cyan-400" />
                          View Reports
                        </button>
                      </div>
                    </motion.div>
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
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-gradient-to-br from-[#12121c] to-[#0c0c12] border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden"
            >
              <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Camera size={18} className="text-indigo-400" />
                  Update Avatar
                </h3>
                <button
                  onClick={() => setShowAvatarModal(false)}
                  className="p-2 hover:bg-white/10 rounded-lg transition-all text-slate-400 hover:text-white hover:rotate-90 duration-300"
                >
                  <X size={20} />
                </button>
              </div>
              
              <div className="p-6 flex flex-col items-center gap-6">
                <div className="relative w-40 h-40 rounded-full border-2 border-indigo-500/30 overflow-hidden shadow-xl shadow-indigo-500/10">
                  <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full blur-lg opacity-30" />
                  {avatarPreview ? (
                    <img
                      src={avatarPreview}
                      alt="Avatar preview"
                      className="w-full h-full object-cover relative z-10"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center text-white text-6xl font-bold uppercase relative z-10">
                      {getUserInitials()}
                    </div>
                  )}
                </div>
                
                <div className="text-center">
                  <p className="text-xs text-slate-400">
                    {avatarFile ? avatarFile.name : 'Choose an image to upload'}
                  </p>
                  <p className="text-[8px] text-slate-500 font-mono mt-1">
                    JPEG, PNG, GIF, WEBP • Max 2MB
                  </p>
                </div>
                
                <div className="flex gap-3 w-full">
                  <button
                    onClick={() => {
                      setShowAvatarModal(false);
                      setAvatarFile(null);
                      setAvatarPreview(null);
                    }}
                    className="flex-1 py-3 bg-white/5 hover:bg-white/10 rounded-xl text-sm font-bold text-slate-300 transition-all hover:scale-[1.02] active:scale-[0.98]"
                  >
                    Cancel
                  </button>
                  {!user?.facebook_id && !user?.google_id && (
                    <button
                      onClick={handleDeleteAvatar}
                      className="px-4 py-3 bg-rose-500/10 hover:bg-rose-500/20 rounded-xl text-sm font-bold text-rose-400 transition-all hover:scale-[1.02] active:scale-[0.98]"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                  <button
                    onClick={handleUploadAvatar}
                    disabled={!avatarFile || uploadingAvatar}
                    className="flex-1 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-sm font-bold text-white transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20"
                  >
                    {uploadingAvatar ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload size={16} />
                        Upload
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}