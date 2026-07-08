// header.tsx - Bản cập nhật: Thanh điều hướng mảnh & Hiệu ứng lướt mượt mà
"use client";

import {
  Search, Globe, User, TrendingUp, Menu, X, LogOut,
  ArrowRightLeft, LayoutDashboard, Newspaper, Bell,
  ChevronDown, ThumbsUp, MessageSquare, AlertTriangle, ShieldAlert,
  ChevronRight, ShieldCheck
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import "../../app/css/User/header.css";
import { BACK_END } from "@/lib/echo";

interface TickerItem {
  pair: string;
  value: string;
  change: string;
  positive: boolean;
}

interface BroadcastNotice {
  notice_id: number;
  title: string;
  content: string;
  created_at: string;
}

interface NotificationItem {
  id: number;
  title: string;
  content: string;
  time: string;
  read: boolean;
  isBroadcast: boolean;
  type?: 'like' | 'reply' | 'mention' | 'report' | 'warning' | 'ban';
  actorUsername?: string;
  actorAvatar?: string | null;
  actorFacebookId?: string | null;
  actorGoogleId?: string | null;
  postId?: number;
  commentId?: number;
  grouped?: boolean;
  groupedCount?: number;
}

interface ApiNotification {
  notification_id: number;
  type: 'like' | 'reply' | 'mention' | 'report' | 'warning' | 'ban';
  actor_id: number;
  actor_username: string;
  actor_avatar?: string | null;
  actor_facebook_id?: string | null;
  actor_google_id?: string | null;
  post_id: number | null;
  comment_id: number | null;
  comment_content: string | null;
  is_read: number;
  created_at: string;
  grouped?: boolean;
  grouped_count?: number;
}

type AuthUser = {
  user_id?: number;
  username: string;
  email?: string;
  role?: string;
  avatar_url?: string | null;
  facebook_id?: string | null;
  google_id?: string | null;
};

// --- HELPER FUNCTIONS ---

function readStoredUser(): AuthUser | null {
  if (typeof window === "undefined") return null;
  const stored = localStorage.getItem("user");
  if (!stored) return null;
  try {
    const parsed = JSON.parse(stored) as AuthUser;
    return parsed.username ? parsed : null;
  } catch {
    return null;
  }
}

function getAvatarUrl(user: AuthUser | null): string | null {
  if (!user) return null;
  if (user.avatar_url) return user.avatar_url;
  if (user.facebook_id) {
    return `https://graph.facebook.com/${user.facebook_id}/picture?type=large`;
  }
  return null;
}

function getNotificationAvatarUrl(
  avatarUrl?: string | null,
  facebookId?: string | null,
  googleId?: string | null
): string | null {
  if (avatarUrl) return avatarUrl;
  if (facebookId) {
    return `https://graph.facebook.com/${facebookId}/picture?type=large`;
  }
  if (googleId) {
    return `https://lh3.googleusercontent.com/a/${googleId}=s96-c`;
  }
  return null;
}

function getInitials(username: string): string {
  return username?.charAt(0)?.toUpperCase() || '?';
}

const readStoredBroadcastIds = (): number[] => {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem("broadcastReadIds");
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

type AvatarProps = {
  user: AuthUser | null;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
};

function Avatar({ user, size = 'md', className = '' }: AvatarProps) {
  const [error, setError] = useState(false);

  const sizeClass = {
    sm: 'w-7 h-7 sm:w-8 sm:h-8 text-xs sm:text-sm',
    md: 'w-9 h-9 sm:w-10 sm:h-10 text-sm sm:text-base',
    lg: 'w-10 h-10 sm:w-12 sm:h-12 text-base sm:text-lg'
  }[size] || 'w-9 h-9 sm:w-10 sm:h-10 text-sm sm:text-base';

  const avatarUrl = getAvatarUrl(user);

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

// --- MAIN COMPONENT ---

export default function Header() {
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isNotifyOpen, setIsNotifyOpen] = useState(false);
  const [isUserOpen, setIsUserOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [tickerItems, setTickerItems] = useState<TickerItem[]>([]);
  const [broadcastNotices, setBroadcastNotices] = useState<BroadcastNotice[]>([]);
  const [broadcastReadIds, setBroadcastReadIds] = useState<number[]>(() => readStoredBroadcastIds());
  const [userNotifications, setUserNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<NotificationItem | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const pathname = usePathname();
  const API_BASE = `${BACK_END}/api`;
  
  const userMenuRef = useRef<HTMLDivElement>(null);
  const notifyRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return "Just now";
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return `${Math.floor(seconds / 604800)}w ago`;
  };

  const formatNotificationCount = (count: number) => {
    return count > 99 ? "99+" : String(count);
  };

  const storeBroadcastIds = (ids: number[]) => {
    if (typeof window === "undefined") return;
    localStorage.setItem("broadcastReadIds", JSON.stringify(ids));
    setBroadcastReadIds(ids);
  };

  const markVisibleBroadcastsRead = () => {
    const ids = broadcastNotices.map((notice) => notice.notice_id);
    if (ids.length === 0) return;
    const merged = Array.from(new Set([...broadcastReadIds, ...ids]));
    storeBroadcastIds(merged);
  };

  const markVisibleUserNotificationsRead = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    const hasUnread = userNotifications.some((notif) => !notif.read);
    if (!hasUnread) return;

    try {
      await fetch(`${API_BASE}/notifications/mark-all-read`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Accept": "application/json"
        }
      });
      setUserNotifications((prev) => prev.map((notif) => ({ ...notif, read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error("Error marking visible notifications as read:", err);
    }
  };

  const getNotifIcon = (type?: string) => {
    switch (type) {
      case 'like':
        return (
          <div className="absolute -bottom-0.5 -right-0.5 bg-blue-500 text-white p-0.5 rounded-full ring-2 ring-[#0f0f1a] shadow-sm">
            <ThumbsUp size={7} className="sm:w-[8px] sm:h-[8px]" fill="currentColor" strokeWidth={2.5} />
          </div>
        );
      case 'reply':
        return (
          <div className="absolute -bottom-0.5 -right-0.5 bg-emerald-500 text-white p-0.5 rounded-full ring-2 ring-[#0f0f1a] shadow-sm">
            <MessageSquare size={7} className="sm:w-[8px] sm:h-[8px]" fill="currentColor" strokeWidth={2.5} />
          </div>
        );
      case 'mention':
        return (
          <div className="absolute -bottom-0.5 -right-0.5 bg-purple-500 text-white font-bold text-[6px] sm:text-[7px] w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full ring-2 ring-[#0f0f1a] shadow-sm flex items-center justify-center">
            @
          </div>
        );
      case 'warning':
      case 'report':
        return (
          <div className="absolute -bottom-0.5 -right-0.5 bg-amber-500 text-white p-0.5 rounded-full ring-2 ring-[#0f0f1a] shadow-sm">
            <AlertTriangle size={7} className="sm:w-[8px] sm:h-[8px]" strokeWidth={2.5} />
          </div>
        );
      case 'ban':
        return (
          <div className="absolute -bottom-0.5 -right-0.5 bg-red-500 text-white p-0.5 rounded-full ring-2 ring-[#0f0f1a] shadow-sm">
            <ShieldAlert size={7} className="sm:w-[8px] sm:h-[8px]" strokeWidth={2.5} />
          </div>
        );
      default:
        return (
          <div className="absolute -bottom-0.5 -right-0.5 bg-indigo-500 text-white p-0.5 rounded-full ring-2 ring-[#0f0f1a] shadow-sm">
            <Bell size={7} className="sm:w-[8px] sm:h-[8px]" strokeWidth={2.5} />
          </div>
        );
    }
  };

  // Click outside handlers
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserOpen(false);
      }
      if (notifyRef.current && !notifyRef.current.contains(event.target as Node)) {
        setIsNotifyOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Auto-focus search input when opened, close with Escape
  useEffect(() => {
    if (isSearchOpen) {
      searchInputRef.current?.focus();
    }
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setIsSearchOpen(false);
    }
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isSearchOpen]);

  useEffect(() => {
    const fetchBroadcastNotices = async () => {
      try {
        const response = await fetch(`${API_BASE}/broadcast-notices`);
        const data = await response.json();
        if (data.success) {
          setBroadcastNotices(data.notices);
        }
      } catch (error) {
        console.error("Error fetching broadcast notices:", error);
      }
    };

    fetchBroadcastNotices();
    const interval = setInterval(fetchBroadcastNotices, 60000);
    return () => clearInterval(interval);
  }, [API_BASE]);

  useEffect(() => {
    const fetchUnreadCount = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;

      try {
        const response = await fetch(`${API_BASE}/notifications/unread-count`, {
          headers: {
            "Authorization": `Bearer ${token}`,
            "Accept": "application/json"
          }
        });
        const data = await response.json();
        if (data.success) {
          setUnreadCount(data.count || 0);
        }
      } catch (error) {
        console.error("Error fetching unread count:", error);
      }
    };

    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [API_BASE]);

  useEffect(() => {
    const fetchUserNotifications = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;

      try {
        const response = await fetch(`${API_BASE}/notifications`, {
          headers: {
            "Authorization": `Bearer ${token}`,
            "Accept": "application/json"
          }
        });
        const data = await response.json();
        if (data.success) {
          const notifications = data.notifications.map((notif: ApiNotification) => {
            const actorLabel = notif.grouped && notif.grouped_count && notif.grouped_count > 1
              ? `${notif.grouped_count} users`
              : notif.actor_username
              ? `@${notif.actor_username}`
              : 'Someone';

            const title = notif.type === 'like'
              ? `${actorLabel} liked your post.`
              : notif.type === 'reply'
              ? `${actorLabel} replied to your comment.`
              : notif.type === 'mention'
              ? `${actorLabel} mentioned you in a comment.`
              : notif.type === 'report'
              ? `Your comment has been reported.`
              : notif.type === 'warning'
              ? `You received a system warning.`
              : notif.type === 'ban'
              ? `Your account has been suspended.`
              : notif.comment_content?.includes('support ticket')
              ? `📩 ${notif.comment_content}`
              : 'New notification';

            return {
              id: notif.notification_id,
              title,
              content: notif.comment_content || '',
              time: formatTimeAgo(notif.created_at),
              read: notif.is_read === 1,
              isBroadcast: false,
              type: notif.type,
              actorUsername: notif.actor_username,
              actorAvatar: notif.actor_avatar,
              actorFacebookId: notif.actor_facebook_id,
              actorGoogleId: notif.actor_google_id,
              postId: notif.post_id || undefined,
              commentId: notif.comment_id || undefined,
              grouped: notif.grouped || false,
              groupedCount: notif.grouped_count || 1,
            };
          });
          setUserNotifications(notifications);
        }
      } catch (error) {
        console.error("Error fetching user notifications:", error);
      }
    };

    fetchUserNotifications();
    const interval = setInterval(fetchUserNotifications, 30000);
    return () => clearInterval(interval);
  }, [API_BASE]);

  const allNotifications = [
    ...userNotifications,
    ...broadcastNotices.map((notice) => ({
      id: notice.notice_id,
      title: notice.title || "System Notification",
      content: notice.content,
      time: formatTimeAgo(notice.created_at),
      read: broadcastReadIds.includes(notice.notice_id),
      isBroadcast: true,
      type: undefined,
      actorUsername: undefined,
      actorAvatar: undefined,
      actorFacebookId: undefined,
      actorGoogleId: undefined
    })),
  ];

  const syncUser = useCallback(() => {
    setUser(readStoredUser());
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.dispatchEvent(new Event("auth-changed"));
    setUser(null);
    setIsUserOpen(false);
    setIsMenuOpen(false);
    router.push("/login");
  };

  const handleNotificationClick = async (notif: NotificationItem) => {
    if (notif.isBroadcast) {
      const newIds = Array.from(new Set([...broadcastReadIds, notif.id]));
      storeBroadcastIds(newIds);
    }

    if (!notif.isBroadcast && !notif.read) {
      const token = localStorage.getItem("token");
      if (token) {
        try {
          await fetch(`${API_BASE}/notifications/${notif.id}/read`, {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${token}`,
              "Accept": "application/json"
            }
          });
          setUserNotifications((prev) =>
            prev.map((n) => (n.id === notif.id ? { ...n, read: true } : n))
          );
          setUnreadCount((prev) => Math.max(0, prev - 1));
        } catch (error) {
          console.error("Error marking notification as read:", error);
        }
      }
    }

    const isAdminNotification = notif.isBroadcast || ['warning', 'ban', 'report'].includes(notif.type || '');
    
    if (!isAdminNotification && notif.postId) {
      setIsNotifyOpen(false);
      const target = notif.commentId ? `/post/${notif.postId}#comment-${notif.commentId}` : `/post/${notif.postId}`;
      router.push(target);
      return;
    }

    setSelectedNotification(notif);
    setShowNotificationModal(true);
    setIsNotifyOpen(false);
  };

  const handleMarkAllAsRead = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      await fetch(`${API_BASE}/notifications/mark-all-read`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Accept": "application/json"
        }
      });
      setUserNotifications((prev) =>
        prev.map((n) => ({ ...n, read: true }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
    }
  };

  const navLinks = [
    { name: "Home", href: "/", icon: <LayoutDashboard size={14} /> },
    { name: "Converter", href: "/converter", icon: <ArrowRightLeft size={14} /> },
    { name: "Rates", href: "/rates", icon: <TrendingUp size={14} /> },
    { name: "News", href: "/news", icon: <Newspaper size={14} /> },
  ];

  // Khai báo biến thể cho hiệu ứng mở menu mượt mà (Stagger)
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

  useEffect(() => {
    syncUser();
    window.addEventListener("auth-changed", syncUser);
    window.addEventListener("storage", syncUser);
    return () => {
      window.removeEventListener("auth-changed", syncUser);
      window.removeEventListener("storage", syncUser);
    };
  }, [syncUser]);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const fetchTickerData = async () => {
      try {
        const res = await fetch(`${API_BASE}/rates/market-matrix`);
        const data = await res.json();
        if (data.success && data.rates) {
          const items = data.rates.map((rate: any) => ({
            pair: rate.pair,
            value: rate.price,
            change: rate.change,
            positive: rate.trend === 'up'
          }));
          setTickerItems(items);
        }
      } catch (error) {
        setTickerItems([
          { pair: "USD / VND", value: "25,450", change: "+0.02%", positive: true },
          { pair: "EUR / VND", value: "27,120", change: "+0.15%", positive: true },
          { pair: "JPY / VND", value: "165.4", change: "-0.05%", positive: false },
          { pair: "BTC / USD", value: "64,200", change: "+1.2%", positive: true },
        ]);
      }
    };
    fetchTickerData();
    const interval = setInterval(fetchTickerData, 30000);
    return () => clearInterval(interval);
  }, [API_BASE]);

  return (
    <header className="fixed top-0 z-50 w-full transition-all duration-300">
      {/* Ticker Bar */}
      <div className="hidden md:block bg-black text-slate-500 py-2 border-b border-white/10 relative z-20 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex justify-between items-center text-[8px] sm:text-[10px] uppercase tracking-widest font-bold">
          <div className="flex animate-ticker whitespace-nowrap gap-8 sm:gap-12">
            {[...tickerItems, ...tickerItems].map((item, i) => (
              <div key={i} className="flex items-center gap-2 sm:gap-3 shrink-0">
                <span className="text-slate-500">{item.pair}</span>
                <span className="text-white font-mono">{item.value}</span>
                <span className={item.positive ? "text-emerald-400" : "text-rose-500"}>
                  {item.change}
                </span>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2 text-slate-400 shrink-0 ml-4 sm:ml-8 bg-black z-10 pl-3 sm:pl-4">
            <div className="w-1.5 sm:w-2 h-1.5 sm:h-2 rounded-full bg-emerald-500 animate-pulse"></div>
            LIVE
          </div>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className={`transition-all duration-300 relative z-50 ${
        scrolled || isMenuOpen
        ? 'bg-[#0a0a0f] border-b border-white/10 py-2 sm:py-3' 
        : 'bg-transparent border-b border-white/5 py-3 sm:py-5'
      }`}>
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="relative flex items-center justify-between lg:justify-start gap-3 sm:gap-4 lg:gap-12">
            
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 sm:gap-3 group shrink-0">
              <div className="relative">
                <div className="absolute inset-0 bg-indigo-600 blur-lg opacity-20 group-hover:opacity-40 transition-opacity" />
                <div className="relative bg-indigo-600 p-2 sm:p-2.5 rounded-lg sm:rounded-xl group-hover:scale-105 transition-transform duration-300">
                  <Globe className="text-white sm:w-[22px] sm:h-[22px]" size={18} />
                </div>
              </div>
              <span className="text-base sm:text-xl font-black tracking-tighter text-white uppercase">
                Currency<span className="text-indigo-500">X</span>
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-6 xl:gap-8">
              {navLinks.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link 
                    key={link.name} 
                    href={link.href}
                    className={`relative text-[12px] xl:text-[13px] font-bold transition-colors uppercase tracking-wider ${
                      isActive ? 'text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {link.name}
                    {isActive && (
                      <motion.div 
                        layoutId="nav-underline"
                        className="absolute -bottom-2 left-0 right-0 h-0.5 bg-indigo-500"
                      />
                    )}
                  </Link>
                );
              })}
            </nav>

            {/* Actions */}
            <div className="flex items-center gap-1 sm:gap-2 lg:gap-3 xl:gap-4 ml-auto">
              {/* Search Desktop */}
              <div className="relative hidden lg:flex items-center">
                <Search className="absolute left-3 text-slate-500 pointer-events-none" size={14} />
                <input 
                  type="text" 
                  placeholder="Search assets..." 
                  className="bg-white/5 border border-white/10 rounded-full py-2 pl-10 pr-4 text-xs w-32 xl:w-40 focus:outline-none focus:border-indigo-500/50 focus:bg-white/[0.07] transition-all duration-300 focus:w-48 xl:focus:w-64 text-white placeholder:text-slate-500"
                />
              </div>

              {/* Search Toggle Mobile */}
              <button
                onClick={() => setIsSearchOpen((prev) => !prev)}
                className={`lg:hidden relative p-2 rounded-xl transition-all duration-200 group ${
                  isSearchOpen ? 'bg-indigo-500/15 text-indigo-400' : 'hover:bg-white/5 text-slate-400'
                }`}
                aria-label="Search"
              >
                {isSearchOpen ? (
                  <X size={20} className="sm:w-[22px] sm:h-[22px]" />
                ) : (
                  <Search size={20} className="sm:w-[22px] sm:h-[22px] group-hover:text-white transition-colors" />
                )}
              </button>

              {/* Notification Button */}
              <div className="relative" ref={notifyRef}>
                <button
                  onClick={async () => {
                    const nextOpen = !isNotifyOpen;
                    setIsNotifyOpen(nextOpen);
                    if (nextOpen) {
                      markVisibleBroadcastsRead();
                      await markVisibleUserNotificationsRead();
                    }
                  }}
                  className="relative p-2 rounded-xl hover:bg-white/5 transition-all duration-200 group"
                  aria-label="Notifications"
                >
                  <Bell size={20} className={`sm:w-[22px] sm:h-[22px] transition-colors duration-200 ${isNotifyOpen ? 'text-indigo-400' : 'text-slate-400 group-hover:text-white'}`} />
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[20px] sm:min-w-[22px] h-[20px] sm:h-[22px] flex items-center justify-center bg-indigo-500 text-white text-[10px] sm:text-[11px] font-bold rounded-full border-2 border-[#0a0a0f] px-1">
                      {formatNotificationCount(unreadCount)}
                    </span>
                  )}
                </button>

                <AnimatePresence>
                  {isNotifyOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.98 }}
                      transition={{ duration: 0.2, ease: "easeOut" }}
                      className="fixed sm:absolute left-3 right-3 sm:left-auto sm:right-0 top-[64px] sm:top-auto mt-0 sm:mt-2 w-auto sm:w-[340px] md:w-[380px] max-w-[420px] mx-auto sm:mx-0 bg-[#0f0f1a] border border-white/5 rounded-2xl shadow-2xl shadow-black/70 overflow-hidden z-50"
                    >
                      {/* Dropdown Header */}
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
                          <button 
                            onClick={handleMarkAllAsRead}
                            className="text-[9px] sm:text-[11px] text-indigo-400 hover:text-indigo-300 font-normal transition-colors duration-200"
                          >
                            Mark all read
                          </button>
                          <button onClick={() => setIsNotifyOpen(false)} className="text-slate-500 hover:text-white transition-colors duration-200 p-0.5">
                            <X size={14} className="sm:w-[16px] sm:h-[16px]" />
                          </button>
                        </div>
                      </div>

                      {/* Dropdown List */}
                      <div className="max-h-[280px] sm:max-h-[380px] md:max-h-[420px] overflow-y-auto scrollbar-thin">
                        {allNotifications.length === 0 ? (
                          <div className="flex flex-col items-center justify-center py-8 sm:py-12 px-4 sm:px-5">
                            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/5 flex items-center justify-center mb-2 sm:mb-3">
                              <Bell size={18} className="sm:w-[22px] sm:h-[22px] text-slate-600" />
                            </div>
                            <p className="text-[10px] sm:text-xs text-slate-400 font-medium">No notifications yet</p>
                          </div>
                        ) : (
                          <div className="flex flex-col py-1">
                            {allNotifications.map((notif, index) => (
                              <motion.div
                                key={notif.id}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: index * 0.01 }}
                                onClick={() => handleNotificationClick(notif)}
                                className={`group flex items-center gap-2 sm:gap-3 mx-1 sm:mx-1.5 my-0.5 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg cursor-pointer transition-all duration-150 relative ${
                                  !notif.read ? 'bg-indigo-500/[0.03] hover:bg-white/[0.03]' : 'hover:bg-white/[0.03]'
                                }`}
                              >
                                <div className="relative flex-shrink-0">
                                  {notif.isBroadcast ? (
                                    <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-full bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shadow-inner">
                                      <Globe size={12} className="sm:w-[15px] sm:h-[15px]" />
                                    </div>
                                  ) : (() => {
                                    const avatarUrl = getNotificationAvatarUrl(notif.actorAvatar, notif.actorFacebookId, notif.actorGoogleId);
                                    if (avatarUrl) {
                                      return (
                                        <div className="relative">
                                          <img src={avatarUrl} alt={notif.actorUsername || 'User'} className="w-7 h-7 sm:w-9 sm:h-9 rounded-full object-cover ring-1 ring-white/5" />
                                          {getNotifIcon(notif.type)}
                                        </div>
                                      );
                                    }
                                    return (
                                      <div className="relative w-7 h-7 sm:w-9 sm:h-9 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 text-white font-medium flex items-center justify-center uppercase text-[9px] sm:text-xs ring-1 ring-white/5">
                                        {notif.actorUsername ? notif.actorUsername.charAt(0).toUpperCase() : '?'}
                                        {getNotifIcon(notif.type)}
                                      </div>
                                    );
                                  })()}
                                </div>

                                <div className="flex-1 min-w-0 pr-0.5 sm:pr-1">
                                  <p className="text-[10px] sm:text-[11.5px] leading-snug font-light text-slate-300">
                                    {notif.isBroadcast ? (
                                      <>
                                        <span className="font-semibold text-white">{notif.title}</span>{' '}
                                        <span className="text-slate-400">{notif.content}</span>
                                      </>
                                    ) : (
                                      <>
                                        <span className="font-semibold text-white hover:underline mr-0.5">
                                          {notif.actorUsername ? `@${notif.actorUsername}` : 'User'}
                                        </span>
                                        <span className={!notif.read ? 'text-slate-200' : 'text-slate-400'}>
                                          {notif.title}
                                        </span>
                                        {notif.content && notif.type !== 'like' && (
                                          <span className="block text-[9px] sm:text-[10.5px] text-slate-500 mt-0.5 line-clamp-1 italic bg-white/[0.02] px-1.5 py-0.5 rounded border border-white/5">
                                            "{notif.content}"
                                          </span>
                                        )}
                                      </>
                                    )}
                                  </p>
                                  <span className={`text-[8px] sm:text-[10px] block mt-0.5 ${!notif.read ? 'text-indigo-400/90 font-medium' : 'text-slate-500'}`}>
                                    {notif.time}
                                  </span>
                                </div>

                                {!notif.read && (
                                  <div className="flex-shrink-0 flex items-center justify-center pr-0.5">
                                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-sm" />
                                  </div>
                                )}
                              </motion.div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="border-t border-white/5 px-3 sm:px-4 py-1.5 sm:py-2 bg-[#0c0c16]">
                        <Link href="/notifications" onClick={() => setIsNotifyOpen(false)} className="flex items-center justify-center gap-1 text-[9px] sm:text-[11px] text-slate-400 hover:text-white font-light transition-colors duration-200 group">
                          <span>See all notifications</span>
                          <span className="group-hover:translate-x-0.5 transition-transform text-[8px] sm:text-[10px]">→</span>
                        </Link>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* User Section Desktop */}
              <div className="hidden sm:flex items-center" ref={userMenuRef}>
                {user ? (
                  <div className="relative">
                    <button 
                      onClick={() => setIsUserOpen(!isUserOpen)}
                      className={`flex items-center gap-1 sm:gap-2 pl-1 pr-1.5 sm:pr-2 py-0.5 sm:py-1 rounded-full border transition-all duration-200 ${
                        isUserOpen ? "bg-indigo-600/15 border-indigo-500/60" : "bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20"
                      }`}
                    >
                      <Avatar user={user} size="sm" />
                      <ChevronDown size={12} className={`sm:w-[14px] sm:h-[14px] text-slate-400 transition-transform duration-300 ${isUserOpen ? 'rotate-180 text-white' : ''}`} />
                    </button>
                    
                    <AnimatePresence>
                      {isUserOpen && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.96, y: 10 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.96, y: 10 }}
                          transition={{ duration: 0.15, ease: "easeOut" }}
                          className="absolute right-0 mt-2 sm:mt-3 w-64 sm:w-72 md:w-80 rounded-2xl bg-[#12121c]/95 border border-white/10 shadow-2xl shadow-black/50 p-2.5 sm:p-3 space-y-2 sm:space-y-3 z-50 backdrop-blur-2xl"
                        >
                          <div className="relative overflow-hidden p-2.5 sm:p-3 rounded-xl bg-gradient-to-br from-indigo-600/15 via-white/[0.02] to-transparent border border-indigo-500/25">
                            <Link href="/Profile" onClick={() => setIsUserOpen(false)} className="flex items-center gap-2 sm:gap-3">
                              <Avatar user={user} size="sm" />
                              <div className="flex flex-col min-w-0">
                                <span className="text-[10px] sm:text-xs font-black text-white uppercase tracking-tight truncate">@{user.username}</span>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                  <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                                  <span className="text-[7px] sm:text-[9px] text-slate-400 font-mono uppercase tracking-wider font-bold">{user.role || 'USER'} NODE</span>
                                </div>
                              </div>
                            </Link>
                            <Link href="/Profile" onClick={() => setIsUserOpen(false)} className="mt-2 sm:mt-3 w-full flex items-center justify-center gap-1.5 sm:gap-2 py-1.5 sm:py-2 px-2 sm:px-3 rounded-lg bg-white/[0.06] hover:bg-white/10 text-[10px] sm:text-[11px] font-bold text-slate-200 transition-colors text-center">
                              <User size={11} className="sm:w-[13px] sm:h-[13px]" />
                              <span>Profile Settings</span>
                            </Link>
                          </div>

                          <div className="space-y-0.5 sm:space-y-1">
                            <Link href="/Profile" onClick={() => setIsUserOpen(false)} className="w-full flex items-center justify-between p-1.5 sm:p-2 rounded-xl hover:bg-white/5 text-slate-300 hover:text-white transition-colors group">
                              <div className="flex items-center gap-2 sm:gap-3">
                                <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-full bg-white/5 text-slate-300 group-hover:bg-indigo-600/20 group-hover:text-indigo-400 flex items-center justify-center transition-colors">
                                  <LayoutDashboard size={14} className="sm:w-[17px] sm:h-[17px]" />
                                </div>
                                <span className="text-[10px] sm:text-xs font-semibold">Dashboard</span>
                              </div>
                              <ChevronRight size={13} className="sm:w-[15px] sm:h-[15px] text-slate-500 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
                            </Link>
                            <div className="h-px bg-white/[0.06] my-0.5 sm:my-1" />
                            <button onClick={handleLogout} className="w-full flex items-center justify-between p-1.5 sm:p-2 rounded-xl hover:bg-rose-500/10 text-slate-300 hover:text-rose-400 transition-colors group">
                              <div className="flex items-center gap-2 sm:gap-3">
                                <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-full bg-white/5 text-slate-300 group-hover:bg-rose-500/20 group-hover:text-rose-400 flex items-center justify-center transition-colors">
                                  <LogOut size={14} className="sm:w-[17px] sm:h-[17px]" />
                                </div>
                                <span className="text-[10px] sm:text-xs font-semibold">Log Out</span>
                              </div>
                              <ChevronRight size={13} className="sm:w-[15px] sm:h-[15px] text-slate-500 group-hover:text-rose-400 group-hover:translate-x-0.5 transition-all" />
                            </button>
                            {(user.role === 'ADMIN' || user.role === 'ROOT') && (
                              <Link href="/Admin" onClick={() => setIsUserOpen(false)} className="w-full flex items-center justify-between p-1.5 sm:p-2 rounded-xl hover:bg-indigo-500/10 text-slate-300 hover:text-indigo-400 transition-colors group">
                                <div className="flex items-center gap-2 sm:gap-3">
                                  <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-full bg-white/5 text-slate-300 group-hover:bg-indigo-600/20 group-hover:text-indigo-400 flex items-center justify-center transition-colors">
                                    <ShieldCheck size={14} className="sm:w-[17px] sm:h-[17px]" />
                                  </div>
                                  <span className="text-[10px] sm:text-xs font-semibold">Admin Dashboard</span>
                                </div>
                                <ChevronRight size={13} className="sm:w-[15px] sm:h-[15px] text-slate-500 group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all" />
                              </Link>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ) : (
                  <Link href="/login" className="text-[10px] sm:text-xs font-bold bg-indigo-600 text-white px-3 sm:px-6 py-2 sm:py-3 rounded-xl hover:bg-indigo-500 transition-all active:scale-95 uppercase tracking-wider shadow-lg shadow-indigo-600/20">
                    Open Account
                  </Link>
                )}
              </div>

              {/* Hamburger Button / Close Button */}
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

          {/* Expandable Search Bar Mobile */}
          <AnimatePresence>
            {isSearchOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="lg:hidden overflow-hidden"
              >
                <form onSubmit={(e) => { e.preventDefault(); setIsSearchOpen(false); }} className="relative pt-3 pb-1">
                  <Search className="absolute left-4 top-[1.2rem] text-slate-500 pointer-events-none" size={18} />
                  <input
                    ref={searchInputRef} type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search assets, pairs, news..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3.5 pl-12 pr-4 text-sm sm:text-base focus:outline-none focus:border-indigo-500/50 focus:bg-white/[0.07] transition-all text-white placeholder:text-slate-500"
                  />
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Mobile Menu Drawer - Cải tiến: Thiết kế thanh mảnh & Hiệu ứng lướt cực mượt */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-x-0 bottom-0 top-[57px] sm:top-[69px] z-40 lg:hidden"
          >
            {/* Lớp overlay làm mờ */}
            <div className="absolute inset-0 bg-black/50 backdrop-blur-[4px]" onClick={() => setIsMenuOpen(false)} />
            
            <motion.div 
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              transition={{ type: "spring", damping: 28, stiffness: 260 }}
              className="absolute top-0 inset-x-0 bg-[#0a0a0f]/95 backdrop-blur-xl border-b border-white/10 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.8)] p-4 pt-3 space-y-4"
            >
              {/* Navigation Links - Dáng dọc thanh mảnh kết hợp Stagger Animation */}
              <motion.div 
                variants={containerVariants}
                initial="hidden"
                animate="show"
                exit="exit"
                className="flex flex-col gap-1.5"
              >
                {navLinks.map((link) => {
                  const isActive = pathname === link.href;
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
                          isActive 
                            ? 'bg-indigo-600/[0.08] border-indigo-500/20 text-white font-bold' 
                            : 'bg-white/[0.01] border-white/[0.02] text-slate-400 hover:text-slate-200 hover:bg-white/[0.03]'
                        }`}
                      >
                        {/* Icon thu nhỏ siêu mảnh */}
                        <div className={`w-6 h-6 rounded-md flex items-center justify-center transition-all ${
                          isActive ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/10' : 'bg-white/5 text-slate-400'
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

              {/* Bottom Block */}
              <div className="pt-1.5 space-y-3">
                {user ? (
                  <div className="flex items-center justify-between bg-white/[0.01] border border-white/[0.03] p-2.5 rounded-lg">
                    <Link href="/Profile" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-2.5 min-w-0">
                      <Avatar user={user} size="sm" />
                      <div className="flex flex-col min-w-0">
                        <span className="text-[11px] font-bold text-white truncate">@{user.username}</span>
                        <span className="text-[7px] text-indigo-400/80 font-mono tracking-wider uppercase font-bold">
                          {user.role || 'USER'} NODE
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
                ) : (
                  <motion.div whileTap={{ scale: 0.985 }}>
                    <Link 
                      href="/login" 
                      onClick={() => setIsMenuOpen(false)}
                      className="block w-full text-center text-[11px] font-bold bg-indigo-600 text-white py-2.5 rounded-lg uppercase tracking-wider shadow-md hover:bg-indigo-500 transition-all"
                    >
                      Open Account
                    </Link>
                  </motion.div>
                )}

                {/* Footer thông số */}
                <div className="flex items-center justify-between text-[8px] text-slate-500 font-mono tracking-widest uppercase px-0.5">
                  <span>v2.0 • LIVE MATRIX</span>
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

      {/* NOTIFICATION DETAIL MODAL */}
      <AnimatePresence>
        {showNotificationModal && selectedNotification && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]" onClick={() => setShowNotificationModal(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} transition={{ duration: 0.2, ease: "easeOut" }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100%-1.5rem)] sm:w-[calc(100%-2rem)] max-w-md bg-[#0f0f1a] border border-white/5 rounded-2xl shadow-2xl shadow-black/70 z-[70] overflow-hidden"
            >
              <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-white/5">
                <div className="flex items-center gap-2 sm:gap-3">
                  {selectedNotification.isBroadcast ? (
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-indigo-500/10 flex items-center justify-center">
                      <Globe size={14} className="sm:w-[16px] sm:h-[16px] text-indigo-400" />
                    </div>
                  ) : (() => {
                    const avatarUrl = getNotificationAvatarUrl(selectedNotification.actorAvatar, selectedNotification.actorFacebookId, selectedNotification.actorGoogleId);
                    if (avatarUrl) return <img src={avatarUrl} alt={selectedNotification.actorUsername || 'User'} className="w-7 h-7 sm:w-8 sm:h-8 rounded-full object-cover ring-1 ring-white/5" />;
                    return (
                      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-slate-500/10 flex items-center justify-center">
                        <Bell size={14} className="sm:w-[16px] sm:h-[16px] text-slate-400" />
                      </div>
                    );
                  })()}
                  <div>
                    <h3 className="text-xs sm:text-sm font-semibold text-white">Notification Details</h3>
                    <span className="text-[8px] sm:text-[10px] text-slate-500">{selectedNotification.time}</span>
                  </div>
                </div>
                <button onClick={() => setShowNotificationModal(false)} className="p-1 hover:bg-white/5 rounded-lg transition-colors text-slate-400 hover:text-white">
                  <X size={16} className="sm:w-[18px] sm:h-[18px]" />
                </button>
              </div>

              <div className="px-4 sm:px-6 py-4 sm:py-5">
                <div className="mb-3 sm:mb-4">
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    {selectedNotification.actorUsername ? `@${selectedNotification.actorUsername} ` : ''}
                    {selectedNotification.title}
                  </p>
                  {selectedNotification.content && (
                    <p className="text-xs sm:text-sm text-slate-400 leading-relaxed mt-2 bg-white/5 p-2.5 sm:p-3 rounded-xl border border-white/5">
                      {selectedNotification.content}
                    </p>
                  )}
                </div>
                {selectedNotification.actorUsername && (
                  <div className="flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 bg-white/5 rounded-xl">
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-[9px] sm:text-xs font-bold">
                      {selectedNotification.actorUsername.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-[8px] sm:text-[10px] text-slate-500 uppercase tracking-wider">From user</p>
                      <p className="text-xs sm:text-sm text-white font-medium">@{selectedNotification.actorUsername}</p>
                    </div>
                  </div>
                )}
                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mt-3 sm:mt-4">
                  {selectedNotification.isBroadcast && <span className="px-1.5 sm:px-2 py-0.5 sm:py-1 bg-indigo-500/10 text-indigo-400 text-[8px] sm:text-[10px] font-medium rounded-lg">System</span>}
                  {selectedNotification.type === 'like' && <span className="px-1.5 sm:px-2 py-0.5 sm:py-1 bg-rose-500/10 text-rose-400 text-[8px] sm:text-[10px] font-medium rounded-lg">❤️ Like</span>}
                  {selectedNotification.type === 'reply' && <span className="px-1.5 sm:px-2 py-0.5 sm:py-1 bg-emerald-500/10 text-emerald-400 text-[8px] sm:text-[10px] font-medium rounded-lg">💬 Reply</span>}
                </div>
              </div>

              <div className="px-4 sm:px-6 py-3 sm:py-4 border-t border-white/5 bg-[#0c0c16]">
                <div className="flex flex-col sm:flex-row gap-2">
                  {selectedNotification.postId && (
                    <button
                      onClick={() => { setShowNotificationModal(false); router.push(`/post/${selectedNotification.postId}`); }}
                      className="w-full sm:flex-1 py-2 sm:py-2.5 bg-indigo-600 text-white text-xs sm:text-sm font-medium rounded-xl hover:bg-indigo-500 transition-all"
                    >
                      View Post
                    </button>
                  )}
                  <button onClick={() => setShowNotificationModal(false)} className={`w-full py-2 sm:py-2.5 bg-white/5 text-slate-300 text-xs sm:text-sm font-medium rounded-xl hover:bg-white/10 transition-all border border-white/5 ${!selectedNotification.postId ? 'sm:w-full' : 'sm:flex-1'}`}>Close</button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </header>
  );
}