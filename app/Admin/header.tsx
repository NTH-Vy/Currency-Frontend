// header.tsx - Admin Header không có Search
"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  Bell,
  Menu,
  X,
  User as UserIcon,
  LogOut,
  Database,
  Globe,
  Newspaper,
  ShieldCheck,
  ChevronDown,
  ChevronRight,
  Clock,
  Zap,
  Activity,
  Cpu,
  FileText,
  Settings,
  LifeBuoy,
  LayoutDashboard,
  TrendingUp,
  Home,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { BACK_END } from "@/lib/echo";

// Helper lấy URL avatar
const getAvatarUrl = (user: any): string | null => {
  if (!user) return null;
  
  if (user.avatar_url) {
    if (user.avatar_url.startsWith('http://') || user.avatar_url.startsWith('https://')) {
      return user.avatar_url;
    }
    if (user.avatar_url.startsWith('avatars/')) {
      return `${BACK_END}/storage/${user.avatar_url}`;
    }
    return user.avatar_url;
  }

  if (user.facebook_id) {
    return `https://graph.facebook.com/${user.facebook_id}/picture?type=large`;
  }

  if (user.google_id) {
    return `https://lh3.googleusercontent.com/a/${user.google_id}=s96-c`;
  }

  return null;
};

const getInitials = (username: string): string => {
  return username?.charAt(0)?.toUpperCase() || 'A';
};

// Component Avatar
function Avatar({ user, size = 'md', className = '' }: { user: any; size?: 'sm' | 'md' | 'lg'; className?: string }) {
  const [error, setError] = useState(false);
  const avatarUrl = user ? getAvatarUrl(user) : null;

  const sizeClass = {
    sm: 'w-7 h-7 sm:w-8 sm:h-8 text-xs sm:text-sm',
    md: 'w-9 h-9 sm:w-10 sm:h-10 text-sm sm:text-base',
    lg: 'w-10 h-10 sm:w-12 sm:h-12 text-base sm:text-lg'
  }[size] || 'w-9 h-9 sm:w-10 sm:h-10 text-sm sm:text-base';

  if (avatarUrl && !error) {
    return (
      <img
        src={avatarUrl}
        alt={user?.username || 'User'}
        className={`${sizeClass} rounded-full object-cover ring-2 ring-indigo-500/50 ${className}`}
        onError={() => setError(true)}
      />
    );
  }

  return (
    <div className={`${sizeClass} rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 text-white font-bold flex items-center justify-center uppercase shadow-inner ring-2 ring-indigo-500/50 ${className}`}>
      {user?.username ? getInitials(user.username) : '?'}
    </div>
  );
}

export default function AdminHeader() {
  const router = useRouter();
  const pathname = usePathname();

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [notificationDropdownOpen, setNotificationDropdownOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState("");
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [groupedNotifications, setGroupedNotifications] = useState<any[]>([]);
  
  const notificationRefs = useRef<Map<number, HTMLElement>>(new Map());
  const observerRef = useRef<IntersectionObserver | null>(null);
  const processedNotifications = useRef<Set<number>>(new Set());
  
  const [adminData, setAdminData] = useState({
    username: "ADMIN_OPERATOR",
    role: "ROOT",
    avatar_url: null as string | null,
    facebook_id: null as string | null,
    google_id: null as string | null,
  });
  const [avatarVersion, setAvatarVersion] = useState(0);

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || `${BACK_END}/api`;

  const loadUserData = () => {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        setAdminData({
          username: user.username || "ADMIN_OPERATOR",
          role: user.role || "ADMIN",
          avatar_url: user.avatar_url || null,
          facebook_id: user.facebook_id || null,
          google_id: user.google_id || null,
        });
        setAvatarVersion(prev => prev + 1);
      } catch (e) {
        console.error(e);
      }
    }
  };

  // --- LOGIC XỬ LÝ NOTIFICATION ---

  const markAsRead = useCallback(async (notificationId: number) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      await fetch(`${API_BASE}/notifications/${notificationId}/read`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Accept": "application/json"
        }
      });

      setNotifications(prev => prev.map(n => n.notification_id === notificationId ? { ...n, is_read: 1 } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  }, [API_BASE]);

  const groupNotifications = useCallback((notificationsList: any[]) => {
    const groups: Map<string, any[]> = new Map();
    
    notificationsList.forEach(notification => {
      const key = `${notification.type}_${notification.post_id || notification.comment_id || 'general'}`;
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(notification);
    });
    
    const aggregated: any[] = [];
    groups.forEach((groupItems) => {
      if (groupItems.length === 1) {
        aggregated.push({ ...groupItems[0], isGrouped: false });
      } else {
        const first = groupItems[0];
        const actors = groupItems.map(n => n.actor_username).filter(Boolean);
        const uniqueActors = [...new Set(actors)];
        
        aggregated.push({
          ...first,
          isGrouped: true,
          groupCount: groupItems.length,
          actor_usernames: uniqueActors,
          notification_ids: groupItems.map(n => n.notification_id),
          created_at: groupItems.sort((a, b) => 
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          )[0].created_at,
          is_read: groupItems.every(n => n.is_read)
        });
      }
    });
    
    return aggregated.sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }, []);

  useEffect(() => {
    setGroupedNotifications(groupNotifications(notifications));
  }, [notifications, groupNotifications]);

  const setupIntersectionObserver = useCallback(() => {
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const notificationId = parseInt(entry.target.getAttribute('data-notification-id') || '0');
            const notificationIds = entry.target.getAttribute('data-notification-ids');
            
            if (notificationIds) {
              const ids = JSON.parse(notificationIds);
              ids.forEach((id: number) => {
                if (!processedNotifications.current.has(id)) {
                  processedNotifications.current.add(id);
                  markAsRead(id);
                }
              });
            } else if (notificationId && !processedNotifications.current.has(notificationId)) {
              processedNotifications.current.add(notificationId);
              markAsRead(notificationId);
            }
          }
        });
      },
      { threshold: 0.5, rootMargin: '-10%' }
    );
  }, [markAsRead]);

  // --- CÁC EFFECT ---

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.getUTCFullYear() + "-" +
        String(now.getUTCMonth() + 1).padStart(2, "0") + "-" +
        String(now.getUTCDate()).padStart(2, "0") + " " +
        String(now.getUTCHours()).padStart(2, "0") + ":" +
        String(now.getUTCMinutes()).padStart(2, "0") + ":" +
        String(now.getUTCSeconds()).padStart(2, "0") + " UTC"
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);

    loadUserData();

    const handleAuthChange = () => loadUserData();
    window.addEventListener("auth-changed", handleAuthChange);

    return () => {
      clearInterval(interval);
      window.removeEventListener("auth-changed", handleAuthChange);
    };
  }, []);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;

        const res = await fetch(`${API_BASE}/notifications/unread-count`, {
          headers: {
            "Authorization": `Bearer ${token}`,
            "Accept": "application/json"
          }
        });

        const data = await res.json();
        if (data.success !== undefined) {
          setUnreadCount(data.count || 0);
        }
      } catch (error) {
        console.error("Error fetching notifications:", error);
      }
    };

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [API_BASE]);

  useEffect(() => {
    if (notificationDropdownOpen) {
      setupIntersectionObserver();
      
      const timeout = setTimeout(() => {
        notificationRefs.current.forEach((element) => {
          observerRef.current?.observe(element);
        });
      }, 100);

      return () => {
        clearTimeout(timeout);
        observerRef.current?.disconnect();
      };
    }
  }, [notificationDropdownOpen, setupIntersectionObserver, groupedNotifications]);

  const fetchNotificationsList = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const res = await fetch(`${API_BASE}/notifications`, {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Accept": "application/json"
        }
      });

      const data = await res.json();
      if (data.success !== undefined) {
        const fetchedNotifications = data.notifications || [];
        setNotifications(fetchedNotifications);
        processedNotifications.current = new Set();
      }
    } catch (error) {
      console.error("Error fetching notifications list:", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      await fetch(`${API_BASE}/notifications/mark-all-read`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Accept": "application/json"
        }
      });

      setNotifications(prev => prev.map(n => ({ ...n, is_read: 1 })));
      setUnreadCount(0);
    } catch (error) {
      console.error("Error marking all as read:", error);
    }
  };

  const formatNotificationCount = (count: number) => {
    return count > 99 ? "99+" : String(count);
  };

  const handleNotificationClick = useCallback((notification: any) => {
    if (notification.isGrouped) {
      notification.notification_ids.forEach((id: number) => markAsRead(id));
    } else {
      markAsRead(notification.notification_id);
    }

    let targetPath = '/Admin';
    
    switch (notification.type) {
      case 'like':
      case 'post_like':
        if (notification.post_id) targetPath = `/Admin/Posts/${notification.post_id}`;
        break;
      case 'comment':
      case 'post_comment':
      case 'reply':
        if (notification.post_id && notification.comment_id) {
          targetPath = `/Admin/Posts/${notification.post_id}#comment-${notification.comment_id}`;
        } else if (notification.post_id) {
          targetPath = `/Admin/Posts/${notification.post_id}`;
        }
        break;
      case 'mention':
        if (notification.post_id) {
          targetPath = `/Admin/Posts/${notification.post_id}`;
        } else if (notification.comment_id) {
          targetPath = `/Admin/Posts?comment=${notification.comment_id}`;
        }
        break;
      case 'system':
      case 'alert':
        targetPath = '/Admin/Contact';
        break;
      default:
        targetPath = '/Admin';
    }

    setNotificationDropdownOpen(false);
    router.push(targetPath);
  }, [router, markAsRead]);

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    window.dispatchEvent(new Event("auth-changed"));
    router.push("/login");
  };

  // Navigation links cho Admin
  const navLinks = [
    { name: "Dashboard", href: "/Admin", icon: <LayoutDashboard size={14} /> },
    { name: "Users", href: "/Admin/Users", icon: <ShieldCheck size={14} /> },
    { name: "Rates", href: "/Admin/Rates", icon: <TrendingUp size={14} /> },
    { name: "News", href: "/Admin/News", icon: <Newspaper size={14} /> },
    { name: "Communities", href: "/Admin/Communities", icon: <ShieldCheck size={14} /> },
    { name: "Reports", href: "/Admin/Reports", icon: <FileText size={14} /> },
    { name: "Settings", href: "/Admin/Setting", icon: <Settings size={14} /> },
  ];

  const isActive = (href: string) => pathname === href;

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.04,
        delayChildren: 0.05
      }
    },
    exit: {
      opacity: 0,
      transition: {
        staggerChildren: 0.03,
        staggerDirection: -1
      }
    }
  };

  const itemVariants = {
    hidden: { y: -12, opacity: 0 },
    show: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 300, damping: 24 } },
    exit: { y: -8, opacity: 0, transition: { duration: 0.15 } }
  };

  return (
    <header className="fixed top-0 z-50 w-full transition-all duration-300">
      {/* TICKER BAR */}
      <div className="hidden md:block bg-black text-slate-500 py-2 border-b border-white/10 relative z-20 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex justify-between items-center text-[8px] sm:text-[10px] uppercase tracking-widest font-bold">
          <div className="flex animate-ticker whitespace-nowrap gap-8 sm:gap-12">
            {[1, 2, 3].map((i) => (
              <React.Fragment key={i}>
                <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                  <Cpu size={10} className="sm:w-[12px] sm:h-[12px] text-indigo-500" />
                  <span>Status: <span className="text-emerald-400">Stable</span></span>
                </div>
                <div className="flex items-center gap-2 sm:gap-3 shrink-0 text-slate-400">
                  <Clock size={10} className="sm:w-[12px] sm:h-[12px] text-indigo-500" />
                  <span className="font-mono tabular-nums text-[8px] sm:text-[10px]">{currentTime}</span>
                </div>
                <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                  <Activity size={10} className="sm:w-[12px] sm:h-[12px] text-indigo-400" />
                  <span>Network: <span className="text-indigo-400">Verified</span></span>
                </div>
              </React.Fragment>
            ))}
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2 text-slate-400 shrink-0 ml-4 sm:ml-8 bg-black z-10 pl-3 sm:pl-4">
            <div className="relative w-1.5 sm:w-2 h-1.5 sm:h-2">
              <div className="absolute inset-0 rounded-full bg-emerald-500 animate-ping opacity-60" />
              <div className="absolute inset-0 rounded-full bg-emerald-500" />
            </div>
            CONSOLE_L5_ACTIVE
          </div>
        </div>
      </div>

      {/* MAIN NAV BAR */}
      <div className={`transition-all duration-300 relative z-50 ${
        scrolled || isMenuOpen
        ? 'bg-[#0a0a0f] border-b border-white/10 py-2 sm:py-3' 
        : 'bg-transparent border-b border-white/5 py-3 sm:py-5'
      }`}>
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="relative flex items-center justify-between lg:justify-start gap-3 sm:gap-4">
            
            {/* Logo */}
            <Link href="/Admin" className="flex items-center gap-2 sm:gap-3 group shrink-0">
              <div className="relative">
                <div className="absolute inset-0 bg-indigo-600 blur-lg opacity-20 group-hover:opacity-40 transition-opacity" />
                <div className="relative bg-indigo-600 p-2 sm:p-2.5 rounded-lg sm:rounded-xl group-hover:scale-105 transition-transform duration-300">
                  <Zap size={18} className="text-white sm:w-[22px] sm:h-[22px]" />
                </div>
              </div>
              <span className="text-base sm:text-xl font-black tracking-tighter text-white uppercase">
                Cortex<span className="text-indigo-500">Command</span>
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-6 xl:gap-8 ml-4">
              {navLinks.map((link) => {
                const active = isActive(link.href);
                return (
                  <Link 
                    key={link.name} 
                    href={link.href}
                    className={`relative text-[12px] xl:text-[13px] font-bold transition-colors uppercase tracking-wider whitespace-nowrap ${
                      active ? 'text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {link.name}
                    {active && (
                      <motion.div 
                        layoutId="nav-underline-admin"
                        className="absolute -bottom-2 left-0 right-0 h-0.5 bg-indigo-500"
                      />
                    )}
                  </Link>
                );
              })}
            </nav>

            {/* Actions - Không có Search */}
            <div className="flex items-center gap-1 sm:gap-2 lg:gap-3 ml-auto">
              {/* Notification Button */}
              <div className="relative">
                <button
                  onClick={() => {
                    setNotificationDropdownOpen(!notificationDropdownOpen);
                    if (!notificationDropdownOpen) {
                      fetchNotificationsList();
                    }
                  }}
                  className="relative p-2 rounded-xl hover:bg-white/5 transition-all duration-200 group"
                  aria-label="Notifications"
                >
                  <Bell size={20} className={`sm:w-[22px] sm:h-[22px] transition-colors duration-200 ${notificationDropdownOpen ? 'text-indigo-400' : 'text-slate-400 group-hover:text-white'}`} />
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[20px] sm:min-w-[22px] h-[20px] sm:h-[22px] flex items-center justify-center bg-indigo-500 text-white text-[10px] sm:text-[11px] font-bold rounded-full border-2 border-[#0a0a0f] px-1">
                      {formatNotificationCount(unreadCount)}
                    </span>
                  )}
                </button>

                <AnimatePresence>
                  {notificationDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.98 }}
                      transition={{ duration: 0.2, ease: "easeOut" }}
                      className="fixed sm:absolute left-3 right-3 sm:left-auto sm:right-0 top-[64px] sm:top-auto mt-0 sm:mt-2 w-auto sm:w-[340px] md:w-[380px] max-w-[420px] mx-auto sm:mx-0 bg-[#0f0f1a] border border-white/5 rounded-2xl shadow-2xl shadow-black/70 overflow-hidden z-50"
                    >
                      <div className="flex flex-wrap items-center justify-between px-3 sm:px-5 py-2.5 sm:py-3.5 border-b border-white/5 bg-[#0a0a14] gap-1">
                        <div className="flex items-center gap-1.5 sm:gap-2">
                          <h3 className="text-xs sm:text-sm font-bold text-white tracking-wide">Notifications</h3>
                          {unreadCount > 0 && (
                            <span className="px-1.5 sm:px-2 py-0.5 bg-indigo-500 text-white text-[7px] sm:text-[9px] font-bold rounded">
                              {unreadCount} new
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1 sm:gap-2">
                          {unreadCount > 0 && (
                            <button 
                              onClick={markAllAsRead}
                              className="text-[9px] sm:text-[11px] text-indigo-400 hover:text-indigo-300 font-normal transition-colors duration-200"
                            >
                              Mark all read
                            </button>
                          )}
                          <button onClick={() => setNotificationDropdownOpen(false)} className="text-slate-500 hover:text-white transition-colors duration-200 p-0.5">
                            <X size={14} className="sm:w-[16px] sm:h-[16px]" />
                          </button>
                        </div>
                      </div>

                      <div className="max-h-[280px] sm:max-h-[380px] md:max-h-[420px] overflow-y-auto scrollbar-thin">
                        {groupedNotifications.length === 0 ? (
                          <div className="flex flex-col items-center justify-center py-8 sm:py-12 px-4 sm:px-5">
                            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/5 flex items-center justify-center mb-2 sm:mb-3">
                              <Bell size={18} className="sm:w-[22px] sm:h-[22px] text-slate-600" />
                            </div>
                            <p className="text-[10px] sm:text-xs text-slate-400 font-medium">No notifications yet</p>
                          </div>
                        ) : (
                          <div className="flex flex-col py-1">
                            {groupedNotifications.map((notification, index) => {
                              const notificationId = notification.isGrouped 
                                ? notification.notification_ids[0] 
                                : notification.notification_id;
                              
                              return (
                                <motion.div
                                  key={notificationId}
                                  ref={(el) => {
                                    if (el) {
                                      notificationRefs.current.set(notificationId, el);
                                      el.setAttribute('data-notification-id', String(notificationId));
                                      if (notification.isGrouped) {
                                        el.setAttribute('data-notification-ids', JSON.stringify(notification.notification_ids));
                                      }
                                    }
                                  }}
                                  initial={{ opacity: 0 }}
                                  animate={{ opacity: 1 }}
                                  transition={{ delay: index * 0.01 }}
                                  onClick={() => handleNotificationClick(notification)}
                                  className={`group flex items-center gap-2 sm:gap-3 mx-1 sm:mx-1.5 my-0.5 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg cursor-pointer transition-all duration-150 relative ${
                                    !notification.is_read 
                                      ? 'bg-indigo-500/[0.03] hover:bg-white/[0.03]' 
                                      : 'hover:bg-white/[0.03]'
                                  }`}
                                >
                                  <div className="relative flex-shrink-0">
                                    <div className={`relative text-white font-medium flex items-center justify-center uppercase text-[9px] sm:text-xs ring-1 ring-white/5 ${
                                      notification.isGrouped ? 'w-7 h-7 sm:w-9 sm:h-9 rounded-lg bg-gradient-to-tr from-emerald-500 to-teal-500' : 'w-7 h-7 sm:w-9 sm:h-9 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500'
                                    }`}>
                                      {notification.isGrouped ? (
                                        <span className="text-[8px] sm:text-[10px] font-bold">+{notification.groupCount}</span>
                                      ) : (
                                        (notification.actor_username || 'S').charAt(0).toUpperCase()
                                      )}
                                      <div className="absolute -bottom-0.5 -right-0.5 bg-indigo-500 text-white p-0.5 rounded-full ring-2 ring-[#0f0f1a] shadow-sm">
                                        <Bell size={7} className="sm:w-[8px] sm:h-[8px]" strokeWidth={2.5} />
                                      </div>
                                    </div>
                                  </div>

                                  <div className="flex-1 min-w-0 pr-0.5 sm:pr-1">
                                    <p className="text-[10px] sm:text-[11.5px] leading-snug font-light text-slate-300">
                                      {notification.isGrouped ? (
                                        <>
                                          <span className="font-semibold text-white hover:underline mr-0.5">
                                            {notification.actor_usernames.slice(0, 2).map((u: string) => `@${u}`).join(', ')}
                                            {notification.actor_usernames.length > 2 && ` +${notification.actor_usernames.length - 2} others`}
                                          </span>
                                          <span className={!notification.is_read ? 'text-slate-200' : 'text-slate-400'}>
                                            {notification.type === 'like' || notification.type === 'post_like' 
                                              ? ' liked your post' 
                                              : notification.type === 'comment' || notification.type === 'post_comment'
                                              ? ' commented on your post'
                                              : ' sent a network operational message'
                                            }
                                          </span>
                                        </>
                                      ) : (
                                        <>
                                          <span className="font-semibold text-white hover:underline mr-0.5">
                                            {notification.actor_username ? `@${notification.actor_username}` : 'System'}
                                          </span>
                                          <span className={!notification.is_read ? 'text-slate-200' : 'text-slate-400'}>
                                            {notification.type === 'like' || notification.type === 'post_like' 
                                              ? ' liked your post' 
                                              : notification.type === 'comment' || notification.type === 'post_comment'
                                              ? ' commented on your post'
                                              : ' sent a network operational message'
                                            }
                                          </span>
                                        </>
                                      )}
                                      {notification.comment_content && (
                                        <span className="block text-[8px] sm:text-[10.5px] text-slate-500 mt-0.5 line-clamp-1 italic bg-white/[0.02] px-1.5 py-0.5 rounded border border-white/5">
                                          "{notification.comment_content}"
                                        </span>
                                      )}
                                    </p>
                                  </div>

                                  {!notification.is_read && (
                                    <div className="flex-shrink-0 flex items-center justify-center pr-0.5">
                                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-sm" />
                                    </div>
                                  )}
                                </motion.div>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      <div className="border-t border-white/5 px-3 sm:px-4 py-1.5 sm:py-2 bg-[#0c0c16]">
                        <Link
                          href="/Admin/Contact"
                          onClick={() => setNotificationDropdownOpen(false)}
                          className="flex items-center justify-center gap-1 text-[9px] sm:text-[11px] text-slate-400 hover:text-white font-light transition-colors duration-200 group"
                        >
                          <span>View Support Center</span>
                          <span className="group-hover:translate-x-0.5 transition-transform text-[8px] sm:text-[10px]">→</span>
                        </Link>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* User Section Desktop */}
              <div className="hidden sm:flex items-center">
                <div className="relative">
                  <button 
                    onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                    className={`flex items-center gap-1 sm:gap-2 pl-1 pr-1.5 sm:pr-2 py-0.5 sm:py-1 rounded-full border transition-all duration-200 ${
                      profileDropdownOpen ? "bg-indigo-600/15 border-indigo-500/60" : "bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20"
                    }`}
                  >
                    <Avatar user={adminData} size="sm" />
                    <ChevronDown size={12} className={`sm:w-[14px] sm:h-[14px] text-slate-400 transition-transform duration-300 ${profileDropdownOpen ? 'rotate-180 text-white' : ''}`} />
                  </button>
                  
                  <AnimatePresence>
                    {profileDropdownOpen && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.96, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.96, y: 10 }}
                        transition={{ duration: 0.15, ease: "easeOut" }}
                        className="absolute right-0 mt-2 sm:mt-3 w-64 sm:w-72 md:w-80 rounded-2xl bg-[#12121c]/95 border border-white/10 shadow-2xl shadow-black/50 p-2.5 sm:p-3 space-y-2 sm:space-y-3 z-50 backdrop-blur-2xl"
                      >
                        <div className="relative overflow-hidden p-2.5 sm:p-3 rounded-xl bg-gradient-to-br from-indigo-600/15 via-white/[0.02] to-transparent border border-indigo-500/25">
                          <Link href="/Admin/Profile" onClick={() => setProfileDropdownOpen(false)} className="flex items-center gap-2 sm:gap-3">
                            <Avatar user={adminData} size="sm" />
                            <div className="flex flex-col min-w-0">
                              <span className="text-[10px] sm:text-xs font-black text-white uppercase tracking-tight truncate">@{adminData.username}</span>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                                <span className="text-[7px] sm:text-[9px] text-slate-400 font-mono uppercase tracking-wider font-bold">{adminData.role} NODE</span>
                              </div>
                            </div>
                          </Link>
                          <Link href="/Admin/Profile" onClick={() => setProfileDropdownOpen(false)} className="mt-2 sm:mt-3 w-full flex items-center justify-center gap-1.5 sm:gap-2 py-1.5 sm:py-2 px-2 sm:px-3 rounded-lg bg-white/[0.06] hover:bg-white/10 text-[10px] sm:text-[11px] font-bold text-slate-200 transition-colors text-center">
                            <UserIcon size={11} className="sm:w-[13px] sm:h-[13px]" />
                            <span>Profile Settings</span>
                          </Link>
                        </div>

                        <div className="space-y-0.5 sm:space-y-1">
                          <Link href="/Admin" onClick={() => setProfileDropdownOpen(false)} className="w-full flex items-center justify-between p-1.5 sm:p-2 rounded-xl hover:bg-white/5 text-slate-300 hover:text-white transition-colors group">
                            <div className="flex items-center gap-2 sm:gap-3">
                              <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-full bg-white/5 text-slate-300 group-hover:bg-indigo-600/20 group-hover:text-indigo-400 flex items-center justify-center transition-colors">
                                <LayoutDashboard size={14} className="sm:w-[17px] sm:h-[17px]" />
                              </div>
                              <span className="text-[10px] sm:text-xs font-semibold">Dashboard Console</span>
                            </div>
                            <ChevronRight size={13} className="sm:w-[15px] sm:h-[15px] text-slate-500 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
                          </Link>

                          <Link href="/Admin/Contact" onClick={() => setProfileDropdownOpen(false)} className="w-full flex items-center justify-between p-1.5 sm:p-2 rounded-xl hover:bg-white/5 text-slate-300 hover:text-white transition-colors group">
                            <div className="flex items-center gap-2 sm:gap-3">
                              <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-full bg-white/5 text-slate-300 group-hover:bg-emerald-600/20 group-hover:text-emerald-400 flex items-center justify-center transition-colors">
                                <LifeBuoy size={14} className="sm:w-[17px] sm:h-[17px]" />
                              </div>
                              <span className="text-[10px] sm:text-xs font-semibold">Support Center</span>
                            </div>
                            <ChevronRight size={13} className="sm:w-[15px] sm:h-[15px] text-slate-500 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
                          </Link>

                          <div className="h-px bg-white/[0.06] my-0.5 sm:my-1" />

                          <Link href="/" onClick={() => setProfileDropdownOpen(false)} className="w-full flex items-center justify-between p-1.5 sm:p-2 rounded-xl hover:bg-indigo-500/10 text-slate-300 hover:text-indigo-400 transition-colors group">
                            <div className="flex items-center gap-2 sm:gap-3">
                              <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-full bg-white/5 text-slate-300 group-hover:bg-indigo-600/20 group-hover:text-indigo-400 flex items-center justify-center transition-colors">
                                <Home size={14} className="sm:w-[17px] sm:h-[17px]" />
                              </div>
                              <span className="text-[10px] sm:text-xs font-semibold">Home</span>
                            </div>
                            <ChevronRight size={13} className="sm:w-[15px] sm:h-[15px] text-slate-500 group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all" />
                          </Link>

                          <button onClick={handleLogout} className="w-full flex items-center justify-between p-1.5 sm:p-2 rounded-xl hover:bg-rose-500/10 text-slate-300 hover:text-rose-400 transition-colors group">
                            <div className="flex items-center gap-2 sm:gap-3">
                              <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-full bg-white/5 text-slate-300 group-hover:bg-rose-500/20 group-hover:text-rose-400 flex items-center justify-center transition-colors">
                                <LogOut size={14} className="sm:w-[17px] sm:h-[17px]" />
                              </div>
                              <span className="text-[10px] sm:text-xs font-semibold">Terminate Session</span>
                            </div>
                            <ChevronRight size={13} className="sm:w-[15px] sm:h-[15px] text-slate-500 group-hover:text-rose-400 group-hover:translate-x-0.5 transition-all" />
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Hamburger Button */}
              <button 
                className="lg:hidden relative p-2.5 rounded-xl text-white hover:bg-white/5 transition-all duration-300 group"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
              >
                <div className="relative w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center">
                  {isMenuOpen ? (
                    <X size={22} className="sm:w-[26px] sm:h-[26px] text-indigo-400" />
                  ) : (
                    <Menu size={22} className="sm:w-[26px] sm:h-[26px] group-hover:text-indigo-400 transition-colors" />
                  )}
                </div>
                {unreadCount > 0 && !isMenuOpen && (
                  <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-indigo-500 rounded-full ring-2 ring-[#0a0a0f] animate-pulse" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-x-0 bottom-0 top-[57px] sm:top-[69px] z-40 lg:hidden"
          >
            <div className="absolute inset-0 bg-black/50 backdrop-blur-[4px]" onClick={() => setIsMenuOpen(false)} />
            
            <motion.div 
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              transition={{ type: "spring", damping: 28, stiffness: 260 }}
              className="absolute top-0 inset-x-0 bg-[#0a0a0f]/95 backdrop-blur-xl border-b border-white/10 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.8)] p-4 pt-3 space-y-4"
            >
              <motion.div 
                variants={containerVariants}
                initial="hidden"
                animate="show"
                exit="exit"
                className="flex flex-col gap-1.5"
              >
                {navLinks.map((link) => {
                  const active = isActive(link.href);
                  return (
                    <motion.div 
                      key={link.name} 
                      variants={itemVariants}
                      whileHover={{ x: 4 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Link 
                        href={link.href}
                        onClick={() => setIsMenuOpen(false)}
                        className={`flex items-center gap-3.5 px-3 py-2 rounded-lg transition-all duration-200 border w-full ${
                          active 
                            ? 'bg-indigo-600/[0.08] border-indigo-500/20 text-white font-bold' 
                            : 'bg-white/[0.01] border-white/[0.02] text-slate-400 hover:text-slate-200 hover:bg-white/[0.03]'
                        }`}
                      >
                        <div className={`w-6 h-6 rounded-md flex items-center justify-center transition-all ${
                          active ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/10' : 'bg-white/5 text-slate-400'
                        }`}>
                          {link.icon}
                        </div>
                        <span className="text-[11px] uppercase tracking-wider font-medium">
                          {link.name}
                        </span>
                      </Link>
                    </motion.div>
                  );
                })}
              </motion.div>

              <div className="pt-1.5 space-y-3">
                <div className="flex items-center justify-between bg-white/[0.01] border border-white/[0.03] p-2.5 rounded-lg">
                  <Link href="/Admin/Profile" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-2.5 min-w-0">
                    <Avatar user={adminData} size="sm" />
                    <div className="flex flex-col min-w-0">
                      <span className="text-[11px] font-bold text-white truncate">@{adminData.username}</span>
                      <span className="text-[7px] text-indigo-400/80 font-mono tracking-wider uppercase font-bold">
                        {adminData.role} NODE
                      </span>
                    </div>
                  </Link>
                  <button 
                    onClick={() => { handleLogout(); setIsMenuOpen(false); }}
                    className="p-2 rounded-md bg-rose-500/5 hover:bg-rose-500/10 text-rose-400/90 transition-colors"
                    title="Log Out"
                  >
                    <LogOut size={12} />
                  </button>
                </div>

                <div className="flex items-center justify-between text-[8px] text-slate-500 font-mono tracking-widest uppercase px-0.5">
                  <span>ADMIN v2.0</span>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-emerald-400/90 font-bold">Connected</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx global>{`
        @keyframes ticker {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-ticker {
          animation: ticker 30s linear infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .animate-ticker { animation: none; }
        }
        .scrollbar-thin::-webkit-scrollbar { width: 2px; }
        .scrollbar-thin::-webkit-scrollbar-track { background: transparent; }
        .scrollbar-thin::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 10px;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.15);
        }
      `}</style>
    </header>
  );
}