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
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { BACK_END } from "@/lib/echo";

// Helper lấy URL avatar - đồng bộ với logic trong User model
const getAvatarUrl = (user: any): string | null => {
  if (!user) return null;
  
  // Nếu có avatar_url từ DB
  if (user.avatar_url) {
    if (user.avatar_url.startsWith('http://') || user.avatar_url.startsWith('https://')) {
      return user.avatar_url;
    }
    // Nếu là đường dẫn local (lưu trong storage)
    if (user.avatar_url.startsWith('avatars/')) {
      return `${BACK_END}/storage/${user.avatar_url}`;
    }
    return user.avatar_url;
  }

  // Nếu có facebook_id -> lấy avatar Facebook
  if (user.facebook_id) {
    return `https://graph.facebook.com/${user.facebook_id}/picture?type=large`;
  }

  // Nếu có google_id -> lấy avatar Google
  if (user.google_id) {
    return `https://lh3.googleusercontent.com/a/${user.google_id}=s96-c`;
  }

  return null;
};

// Helper lấy chữ cái đầu
const getInitials = (username: string): string => {
  return username?.charAt(0)?.toUpperCase() || 'A';
};

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
  const [avatarVersion, setAvatarVersion] = useState(0); // Force re-render khi avatar thay đổi

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || `${BACK_END}/api`;

  // Lấy dữ liệu user từ localStorage
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
        // Tăng version để force re-render avatar
        setAvatarVersion(prev => prev + 1);
      } catch (e) {
        console.error(e);
      }
    }
  };

  // Lấy URL avatar với version để cache busting
  const userAvatarUrl = adminData ? getAvatarUrl(adminData) : null;
  const avatarWithVersion = userAvatarUrl ? `${userAvatarUrl}?v=${avatarVersion}` : null;

  // --- CÁC THAY ĐỔI VỊ TRÍ NẰM Ở ĐÂY ĐỂ TRÁNH LỖI HOISTING ---

  const markAsRead = async (notificationId: number) => {
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
  };

  // Notification Aggregation Logic
  const groupNotifications = useCallback((notifications: any[]) => {
    const groups: Map<string, any[]> = new Map();
    
    notifications.forEach(notification => {
      // Group by type and target (post_id, comment_id, etc.)
      const key = `${notification.type}_${notification.post_id || notification.comment_id || 'general'}`;
      
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(notification);
    });
    
    // Convert groups to aggregated notifications
    const aggregated: any[] = [];
    groups.forEach((groupNotifications, key) => {
      if (groupNotifications.length === 1) {
        aggregated.push({ ...groupNotifications[0], isGrouped: false });
      } else {
        const first = groupNotifications[0];
        const actors = groupNotifications.map(n => n.actor_username).filter(Boolean);
        const uniqueActors = [...new Set(actors)];
        
        aggregated.push({
          ...first,
          isGrouped: true,
          groupCount: groupNotifications.length,
          actor_usernames: uniqueActors,
          notification_ids: groupNotifications.map(n => n.notification_id),
          // Keep the most recent timestamp
          created_at: groupNotifications.sort((a, b) => 
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          )[0].created_at,
          // Mark as read if all in group are read
          is_read: groupNotifications.every(n => n.is_read)
        });
      }
    });
    
    // Sort by created_at descending
    return aggregated.sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }, []);

  // Mark as Read on Scroll Logic
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
              // Handle grouped notifications
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
      {
        threshold: 0.5, // Mark as read when 50% visible
        rootMargin: '-10%'
      }
    );
  }, [API_BASE]); // added dependency safely

  // --- HẾT PHẦN ĐẢO VỊ TRÍ ---

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.getUTCFullYear() +
          "-" +
          String(now.getUTCMonth() + 1).padStart(2, "0") +
          "-" +
          String(now.getUTCDate()).padStart(2, "0") +
          " " +
          String(now.getUTCHours()).padStart(2, "0") +
          ":" +
          String(now.getUTCMinutes()).padStart(2, "0") +
          ":" +
          String(now.getUTCSeconds()).padStart(2, "0") +
          " UTC"
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);

    // Load user data lần đầu
    loadUserData();

    // Lắng nghe sự kiện auth-changed để cập nhật khi có thay đổi
    const handleAuthChange = () => {
      loadUserData();
    };
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

  // Setup intersection observer when dropdown opens
  useEffect(() => {
    if (notificationDropdownOpen) {
      setupIntersectionObserver();
      
      // Observe all notification elements after they render
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
  }, [notificationDropdownOpen, setupIntersectionObserver]);

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
        setGroupedNotifications(groupNotifications(fetchedNotifications));
        // Reset processed set when fetching new notifications
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

  // Smart Redirection & Deep Linking Logic
  const handleNotificationClick = useCallback((notification: any) => {
    // Mark as read first
    if (notification.isGrouped) {
      notification.notification_ids.forEach((id: number) => markAsRead(id));
    } else {
      markAsRead(notification.notification_id);
    }

    // Smart navigation based on notification type
    let targetPath = '/Admin';
    
    switch (notification.type) {
      case 'like':
      case 'post_like':
        if (notification.post_id) {
          targetPath = `/Admin/Posts/${notification.post_id}`;
        }
        break;
      case 'comment':
      case 'post_comment':
        if (notification.post_id) {
          targetPath = `/Admin/Posts/${notification.post_id}#comment-${notification.comment_id}`;
        }
        break;
      case 'reply':
        if (notification.post_id && notification.comment_id) {
          targetPath = `/Admin/Posts/${notification.post_id}#comment-${notification.comment_id}`;
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

    // Close dropdown and navigate
    setNotificationDropdownOpen(false);
    router.push(targetPath);
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    window.dispatchEvent(new Event("auth-changed"));
    router.push("/login");
  };

  const navLinks = [
    { name: "Dashboard", href: "/Admin", icon: <Database size={16} /> },
    { name: "Users", href: "/Admin/Users", icon: <ShieldCheck size={16} /> },
    { name: "Rates", href: "/Admin/Rates", icon: <Globe size={16} /> },
    { name: "News", href: "/Admin/News", icon: <Newspaper size={16} /> },
    { name: "Communities", href: "/Admin/Communities", icon: <ShieldCheck size={16} /> },
    { name: "Reports", href: "/Admin/Reports", icon: <FileText size={16} /> },
    { name: "Settings", href: "/Admin/Setting", icon: <Settings size={16} /> },
  ];

  const isActive = (href: string) => pathname === href;

  return (
    <header className="fixed top-0 z-50 w-full transition-all duration-300 font-sans">
      {/* TICKER BAR - giữ nguyên */}
      <div className="bg-black text-slate-500 py-2 border-b border-white/[0.08] relative z-20 hidden md:block overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 flex justify-between items-center text-[10px] uppercase tracking-[0.2em] font-black">
          <div className="flex animate-ticker whitespace-nowrap gap-12">
            <div className="flex items-center gap-3 shrink-0">
              <Cpu size={12} className="text-indigo-500" />
              <span>
                Status: <span className="text-emerald-400">Stable</span>
              </span>
            </div>
            <div className="flex items-center gap-3 shrink-0 text-slate-400">
              <Clock size={12} className="text-indigo-500" />
              <span className="font-mono tabular-nums">{currentTime}</span>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <Activity size={12} className="text-indigo-400" />
              <span>
                Network: <span className="text-indigo-400">Verified</span>
              </span>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <Cpu size={12} className="text-indigo-500" />
              <span>
                Status: <span className="text-emerald-400">Stable</span>
              </span>
            </div>
            <div className="flex items-center gap-3 shrink-0 text-slate-400">
              <Clock size={12} className="text-indigo-500" />
              <span className="font-mono tabular-nums">{currentTime}</span>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <Activity size={12} className="text-indigo-400" />
              <span>
                Network: <span className="text-indigo-400">Verified</span>
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 text-slate-400 shrink-0 ml-8 bg-black z-10 pl-4 font-mono">
            <div className="relative w-1.5 h-1.5">
              <div className="absolute inset-0 rounded-full bg-emerald-500 animate-ping opacity-60" />
              <div className="absolute inset-0 rounded-full bg-emerald-500" />
            </div>
            CONSOLE_L5_ACTIVE
          </div>
        </div>
      </div>

      {/* MAIN NAV BAR */}
      <div
        className={`relative transition-all duration-500 ${
          scrolled
            ? "bg-[#0a0a0f]/80 backdrop-blur-2xl border-b border-white/10 py-3 shadow-[0_8px_30px_-10px_rgba(0,0,0,0.7)]"
            : "bg-gradient-to-b from-[#0a0a0f]/60 to-transparent border-b border-white/[0.06] py-5"
        }`}
      >
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-indigo-500/40 to-transparent" />

        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="relative flex items-center justify-between">
            {/* Logo */}
            <Link href="/Admin" className="flex items-center gap-3 group">
              <div className="relative">
                <div className="absolute inset-0 bg-indigo-600 blur-lg opacity-25 group-hover:opacity-50 transition-opacity duration-300" />
                <div className="relative bg-gradient-to-br from-indigo-500 to-indigo-700 p-2.5 rounded-xl group-hover:scale-105 group-hover:rotate-3 transition-transform duration-300 shadow-lg shadow-indigo-600/30 ring-1 ring-white/10">
                  <Zap size={20} className="text-white fill-white/30" />
                </div>
              </div>
              <div className="flex flex-col leading-none">
                <span className="text-lg font-black tracking-tighter text-white uppercase">
                  Cortex<span className="text-indigo-500">Command</span>
                </span>
                <span className="text-[8px] font-mono font-bold tracking-[0.3em] text-slate-500 uppercase mt-0.5">
                  Admin Ops
                </span>
              </div>
            </Link>

            {/* Nav Links */}
            <nav className="hidden lg:flex items-center gap-1 p-1 rounded-full bg-white/[0.03] border border-white/[0.06]">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  className={`relative flex items-center gap-1.5 px-3.5 py-2 rounded-full text-[11px] font-black transition-all duration-200 uppercase tracking-[0.12em] ${
                    isActive(link.href)
                      ? "text-white"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  {isActive(link.href) && (
                    <motion.div
                      layoutId="nav-pill"
                      className="absolute inset-0 bg-indigo-600 rounded-full shadow-md shadow-indigo-600/40"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
                    />
                  )}
                  <span className="relative z-10 hidden xl:inline">{link.icon}</span>
                  <span className="relative z-10">{link.name}</span>
                </Link>
              ))}
            </nav>

            {/* Actions */}
            <div className="flex items-center gap-3">
              {/* Notification Box */}
              <div className="relative">
                <button
                  onClick={() => {
                    setNotificationDropdownOpen(!notificationDropdownOpen);
                    if (!notificationDropdownOpen) {
                      fetchNotificationsList();
                    }
                  }}
                  className="relative p-2 rounded-xl hover:bg-white/5 transition-all duration-200 group"
                >
                  <Bell size={20} className={`transition-colors duration-200 ${notificationDropdownOpen ? 'text-indigo-400' : 'text-slate-400 group-hover:text-white'}`} />
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[20px] h-[20px] flex items-center justify-center bg-indigo-500 text-white text-[10px] font-bold rounded-full border-2 border-[#0a0a0f]">
                      {formatNotificationCount(unreadCount)}
                    </span>
                  )}
                </button>

                <AnimatePresence>
                  {notificationDropdownOpen && (
                    <>
                      <div className="fixed inset-0 z-0" onClick={() => setNotificationDropdownOpen(false)} />
                      <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.98 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className="absolute right-0 mt-2 w-[380px] bg-[#0f0f1a] border border-white/5 rounded-2xl shadow-2xl shadow-black/70 overflow-hidden z-50"
                      >
                        <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/5 bg-[#0a0a14]">
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm font-bold text-white tracking-wide">Notifications</h3>
                            {unreadCount > 0 && (
                              <span className="px-2 py-0.5 bg-indigo-500 text-white text-[9px] font-bold rounded">
                                {unreadCount} new
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            {unreadCount > 0 && (
                              <button 
                                onClick={markAllAsRead}
                                className="text-[11px] text-indigo-400 hover:text-indigo-300 font-normal transition-colors duration-200"
                              >
                                Mark all read
                              </button>
                            )}
                            <div className="w-px h-3 bg-white/5" />
                            <button
                              onClick={() => setNotificationDropdownOpen(false)}
                              className="text-slate-500 hover:text-white transition-colors duration-200"
                            >
                              <X size={15} />
                            </button>
                          </div>
                        </div>

                        <div className="max-h-[420px] overflow-y-auto scrollbar-thin flex flex-col py-1">
                          {notifications.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 px-5">
                              <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-3">
                                <Bell size={22} className="text-slate-600" />
                              </div>
                              <p className="text-xs text-slate-400 font-medium">No notifications yet</p>
                            </div>
                          ) : (
                            groupedNotifications.map((notification, index) => {
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
                                  className={`group flex items-center gap-3 mx-1.5 my-0.5 px-3 py-2 rounded-lg cursor-pointer transition-all duration-150 relative ${
                                    !notification.is_read 
                                      ? 'bg-indigo-500/[0.03] hover:bg-white/[0.03]' 
                                      : 'hover:bg-white/[0.03]'
                                    }`}
                                >
                                  <div className="relative flex-shrink-0">
                                    <div className={`relative text-white font-medium flex items-center justify-center uppercase text-xs ring-1 ring-white/5 ${
                                      notification.isGrouped ? 'w-10 h-10 rounded-lg bg-gradient-to-tr from-emerald-500 to-teal-500' : 'w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500'
                                    }`}>
                                      {notification.isGrouped ? (
                                        <span className="text-[10px] font-bold">+{notification.groupCount}</span>
                                      ) : (
                                        (notification.actor_username || 'S').charAt(0).toUpperCase()
                                      )}
                                      <div className="absolute -bottom-0.5 -right-0.5 bg-indigo-500 text-white p-0.5 rounded-full ring-2 ring-[#0f0f1a] shadow-sm">
                                        <Bell size={8} strokeWidth={2.5} />
                                      </div>
                                    </div>
                                  </div>

                                  <div className="flex-1 min-w-0 pr-1">
                                    <p className="text-[11.5px] leading-snug font-light text-slate-300">
                                      {notification.isGrouped ? (
                                        <>
                                          <span className="font-semibold text-white hover:underline mr-1">
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
                                          <span className="font-semibold text-white hover:underline mr-1">
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
                                        <span className="block text-[10.5px] text-slate-500 mt-0.5 line-clamp-1 italic bg-white/[0.02] px-1.5 py-0.5 rounded border border-white/5">
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
                            })
                          )}
                        </div>

                        <div className="border-t border-white/5 px-4 py-2 bg-[#0c0c16]">
                          <Link
                            href="/Admin/Contact"
                            onClick={() => setNotificationDropdownOpen(false)}
                            className="flex items-center justify-center gap-1 text-[11px] text-slate-400 hover:text-white font-light transition-colors duration-200 group"
                          >
                            <span>View Support Center</span>
                            <span className="group-hover:translate-x-0.5 transition-transform text-[10px]">→</span>
                          </Link>
                        </div>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>

              <div className="h-6 w-px bg-white/10 mx-0.5 hidden sm:block" />

              {/* PROFILE BOX */}
              <div className="relative">
                <button
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  className={`flex items-center gap-2 pl-1 pr-2 py-1 rounded-full border transition-all duration-200 ${
                    profileDropdownOpen
                      ? "bg-indigo-600/15 border-indigo-500/60"
                      : "bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20"
                  }`}
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 text-white font-bold flex items-center justify-center text-sm uppercase shadow-inner ring-1 ring-white/15 overflow-hidden">
                    {avatarWithVersion ? (
                      <img
                        src={avatarWithVersion}
                        alt={adminData.username}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          const parent = e.currentTarget.parentElement;
                          if (parent) {
                            const fallback = document.createElement('div');
                            fallback.className = 'w-full h-full bg-gradient-to-tr from-indigo-500 to-purple-500 text-white font-bold flex items-center justify-center text-sm uppercase';
                            fallback.textContent = getInitials(adminData.username);
                            parent.appendChild(fallback);
                          }
                        }}
                      />
                    ) : (
                      getInitials(adminData.username)
                    )}
                  </div>
                  <ChevronDown
                    size={14}
                    className={`text-slate-400 transition-transform duration-300 ${
                      profileDropdownOpen ? "rotate-180 text-white" : ""
                    }`}
                  />
                </button>

                {/* DROPDOWN */}
                <AnimatePresence>
                  {profileDropdownOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setProfileDropdownOpen(false)}
                      />
                      <motion.div
                        initial={{ opacity: 0, scale: 0.96, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.96, y: 10 }}
                        transition={{ duration: 0.15, ease: "easeOut" }}
                        className="absolute right-0 mt-3 w-80 rounded-2xl bg-[#12121c]/95 border border-white/10 shadow-2xl shadow-black/50 p-3 space-y-3 z-50 backdrop-blur-2xl"
                      >
                        {/* Profile summary */}
                        <div className="relative overflow-hidden p-3 rounded-xl bg-gradient-to-br from-indigo-600/15 via-white/[0.02] to-transparent border border-indigo-500/25">
                          <Link
                            href="/Admin/Profile"
                            onClick={() => setProfileDropdownOpen(false)}
                            className="flex items-center gap-3"
                          >
                            <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 text-white font-bold flex items-center justify-center text-base uppercase shrink-0 ring-2 ring-indigo-500/40 overflow-hidden">
                              {avatarWithVersion ? (
                                <img
                                  src={avatarWithVersion}
                                  alt={adminData.username}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                    const parent = e.currentTarget.parentElement;
                                    if (parent) {
                                      const fallback = document.createElement('div');
                                      fallback.className = 'w-full h-full bg-gradient-to-tr from-indigo-500 to-purple-500 text-white font-bold flex items-center justify-center text-base uppercase';
                                      fallback.textContent = getInitials(adminData.username);
                                      parent.appendChild(fallback);
                                    }
                                  }}
                                />
                              ) : (
                                getInitials(adminData.username)
                              )}
                            </div>
                            <div className="flex flex-col min-w-0">
                              <span className="text-xs font-black text-white uppercase tracking-tight truncate">
                                @{adminData.username}
                              </span>
                              <div className="flex items-center gap-1.5 mt-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                <span className="text-[9px] text-slate-400 font-mono uppercase tracking-wider font-bold">
                                  {adminData.role} NODE
                                </span>
                              </div>
                            </div>
                          </Link>

                          <Link
                            href="/Admin/Profile"
                            onClick={() => setProfileDropdownOpen(false)}
                            className="mt-3 w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-white/[0.06] hover:bg-white/10 text-[11px] font-bold text-slate-200 transition-colors text-center"
                          >
                            <UserIcon size={13} />
                            <span>Profile Settings</span>
                          </Link>
                        </div>

                        {/* Navigation rows */}
                        <div className="space-y-1">
                          <Link
                            href="/Admin"
                            onClick={() => setProfileDropdownOpen(false)}
                            className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-white/5 text-slate-300 hover:text-white transition-colors group"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full bg-white/5 text-slate-300 group-hover:bg-indigo-600/20 group-hover:text-indigo-400 flex items-center justify-center transition-colors">
                                <Database size={17} />
                              </div>
                              <span className="text-xs font-semibold">Dashboard console</span>
                            </div>
                            <ChevronRight size={15} className="text-slate-500 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
                          </Link>

                          <Link
                            href="/Admin/Contact"
                            onClick={() => setProfileDropdownOpen(false)}
                            className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-white/5 text-slate-300 hover:text-white transition-colors group"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full bg-white/5 text-slate-300 group-hover:bg-emerald-600/20 group-hover:text-emerald-400 flex items-center justify-center transition-colors">
                                <LifeBuoy size={17} />
                              </div>
                              <span className="text-xs font-semibold">Support Center</span>
                            </div>
                            <ChevronRight size={15} className="text-slate-500 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
                          </Link>

                          <div className="h-px bg-white/[0.06] my-1" />

                          <button
                            onClick={handleLogout}
                            className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-rose-500/10 text-slate-300 hover:text-rose-400 transition-colors group"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full bg-white/5 text-slate-300 group-hover:bg-rose-500/20 group-hover:text-rose-400 flex items-center justify-center transition-colors">
                                <LogOut size={17} />
                              </div>
                              <span className="text-xs font-semibold">Terminate Session</span>
                            </div>
                            <ChevronRight size={15} className="text-slate-500 group-hover:text-rose-400 group-hover:translate-x-0.5 transition-all" />
                          </button>
                        </div>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>

              {/* Mobile Menu Toggle */}
              <button
                className="lg:hidden relative w-9 h-9 flex items-center justify-center rounded-full bg-white/5 border border-white/10 text-white"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
              >
                <AnimatePresence mode="wait" initial={false}>
                  {isMenuOpen ? (
                    <motion.span key="x" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }}>
                      <X size={20} />
                    </motion.span>
                  ) : (
                    <motion.span key="menu" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.15 }}>
                      <Menu size={20} />
                    </motion.span>
                  )}
                </AnimatePresence>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* MOBILE NAV DRAWER */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="lg:hidden overflow-hidden bg-[#0a0a0f]/95 backdrop-blur-2xl border-b border-white/10"
          >
            <nav className="max-w-7xl mx-auto px-6 py-4 flex flex-col gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  onClick={() => setIsMenuOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-black uppercase tracking-[0.12em] transition-colors ${
                    isActive(link.href)
                      ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                      : "text-slate-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  {link.icon}
                  {link.name}
                </Link>
              ))}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx global>{`
        @keyframes ticker {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        .animate-ticker {
          animation: ticker 30s linear infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .animate-ticker {
            animation: none;
          }
        }
        .scrollbar-thin::-webkit-scrollbar {
          width: 2px;
        }
        .scrollbar-thin::-webkit-scrollbar-track {
          background: transparent;
        }
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