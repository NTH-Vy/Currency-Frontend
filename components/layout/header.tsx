"use client";

import {
  Search, Globe, User, TrendingUp, Menu, X, LogOut,
  ArrowRightLeft, LayoutDashboard, Newspaper, Users, Bell,
  ChevronDown, ThumbsUp, MessageSquare, AlertTriangle, ShieldAlert,
  Dot, Circle, CheckCircle2, Clock, Sparkles, ChevronRight
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

export default function Header() {
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isNotifyOpen, setIsNotifyOpen] = useState(false);
  const [isUserOpen, setIsUserOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [tickerItems, setTickerItems] = useState<TickerItem[]>([]);
  const [broadcastNotices, setBroadcastNotices] = useState<BroadcastNotice[]>([]);
  const [userNotifications, setUserNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<NotificationItem | null>(null);
  const [avatarError, setAvatarError] = useState(false);
  const pathname = usePathname();
  const API_BASE = `${BACK_END}/api`;
  
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Translated time strings to English
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

  const getNotifIcon = (type?: string) => {
    switch (type) {
      case 'like':
        return (
          <div className="absolute -bottom-0.5 -right-0.5 bg-blue-500 text-white p-0.5 rounded-full ring-2 ring-[#0f0f1a] shadow-sm">
            <ThumbsUp size={8} fill="currentColor" strokeWidth={2.5} />
          </div>
        );
      case 'reply':
        return (
          <div className="absolute -bottom-0.5 -right-0.5 bg-emerald-500 text-white p-0.5 rounded-full ring-2 ring-[#0f0f1a] shadow-sm">
            <MessageSquare size={8} fill="currentColor" strokeWidth={2.5} />
          </div>
        );
      case 'mention':
        return (
          <div className="absolute -bottom-0.5 -right-0.5 bg-purple-500 text-white font-bold text-[7px] w-3.5 h-3.5 rounded-full ring-2 ring-[#0f0f1a] shadow-sm flex items-center justify-center">
            @
          </div>
        );
      case 'warning':
      case 'report':
        return (
          <div className="absolute -bottom-0.5 -right-0.5 bg-amber-500 text-white p-0.5 rounded-full ring-2 ring-[#0f0f1a] shadow-sm">
            <AlertTriangle size={8} strokeWidth={2.5} />
          </div>
        );
      case 'ban':
        return (
          <div className="absolute -bottom-0.5 -right-0.5 bg-red-500 text-white p-0.5 rounded-full ring-2 ring-[#0f0f1a] shadow-sm">
            <ShieldAlert size={8} strokeWidth={2.5} />
          </div>
        );
      default:
        return (
          <div className="absolute -bottom-0.5 -right-0.5 bg-indigo-500 text-white p-0.5 rounded-full ring-2 ring-[#0f0f1a] shadow-sm">
            <Bell size={8} strokeWidth={2.5} />
          </div>
        );
    }
  };

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
          const notifications = data.notifications.map((notif: ApiNotification) => ({
            id: notif.notification_id,
            title: notif.type === 'like'
              ? `liked your post.`
              : notif.type === 'reply'
              ? `replied to your comment.`
              : notif.type === 'mention'
              ? `mentioned you in a comment.`
              : notif.type === 'report'
              ? `Your comment has been reported.`
              : notif.type === 'warning'
              ? `You received a system warning.`
              : notif.type === 'ban'
              ? `Your account has been suspended.`
              : notif.comment_content?.includes('support ticket') 
                ? `📩 ${notif.comment_content}`
                : 'New notification',
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
            commentId: notif.comment_id || undefined
          }));
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
      read: false,
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
    setAvatarError(false);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.dispatchEvent(new Event("auth-changed"));
    setUser(null);
    setIsUserOpen(false);
    router.push("/login");
  };

  const handleNotificationClick = async (notif: any) => {
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
          setUserNotifications(prev =>
            prev.map(n => n.id === notif.id ? { ...n, read: true } : n)
          );
          setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
          console.error("Error marking notification as read:", error);
        }
      }
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
      setUserNotifications(prev =>
        prev.map(n => ({ ...n, read: true }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
    }
  };

  const navLinks = [
    { name: "Home", href: "/", icon: <LayoutDashboard size={18} /> },
    { name: "Converter", href: "/converter", icon: <ArrowRightLeft size={18} /> },
    { name: "Rates", href: "/rates", icon: <TrendingUp size={18} /> },
    { name: "News", href: "/news", icon: <Newspaper size={18} /> },
  ];

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
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
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
  }, []);

  const Avatar = ({ user, size = 'md', className = '' }: { user: AuthUser | null, size?: 'sm' | 'md' | 'lg', className?: string }) => {
    const [error, setError] = useState(false);
    
    const sizeClass = {
      sm: 'w-8 h-8 text-sm',
      md: 'w-10 h-10 text-base',
      lg: 'w-12 h-12 text-lg'
    }[size] || 'w-10 h-10 text-base';

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
  };

  return (
    <header className="fixed top-0 z-50 w-full transition-all duration-300">
      {/* Ticker Bar */}
      <div className="bg-black text-slate-500 py-2 border-b border-white/10 relative z-20 hidden md:block overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 flex justify-between items-center text-[10px] uppercase tracking-widest font-bold">
          <div className="flex animate-ticker whitespace-nowrap gap-12">
            {[...tickerItems, ...tickerItems].map((item, i) => (
              <div key={i} className="flex items-center gap-3 shrink-0">
                <span className="text-slate-500">{item.pair}</span>
                <span className="text-white font-mono">{item.value}</span>
                <span className={item.positive ? "text-emerald-400" : "text-rose-500"}>
                  {item.change}
                </span>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2 text-slate-400 shrink-0 ml-8 bg-black z-10 pl-4">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
            LIVE MARKET DATA
          </div>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className={`transition-all duration-500 ${
        scrolled 
        ? 'bg-[#0a0a0f]/90 backdrop-blur-xl border-b border-white/10 py-3' 
        : 'bg-transparent border-b border-white/5 py-5'
      }`}>
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="relative flex items-center justify-start gap-12">
            
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3 group shrink-0">
              <div className="relative">
                <div className="absolute inset-0 bg-indigo-600 blur-lg opacity-20 group-hover:opacity-40 transition-opacity" />
                <div className="relative bg-indigo-600 p-2.5 rounded-xl group-hover:scale-105 transition-transform duration-300">
                  <Globe className="text-white" size={22} />
                </div>
              </div>
              <span className="text-xl font-black tracking-tighter text-white uppercase">
                Currency<span className="text-indigo-500">X</span>
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-8">
              {navLinks.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link 
                    key={link.name} 
                    href={link.href}
                    className={`relative text-[13px] font-bold transition-colors uppercase tracking-wider ${
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
            <div className="flex items-center gap-4 ml-auto">
              {/* Search */}
              <div className="relative hidden xl:flex items-center">
                <Search className="absolute left-3 text-slate-500" size={14} />
                <input 
                  type="text" 
                  placeholder="Search assets..." 
                  className="bg-white/5 border border-white/10 rounded-full py-2 pl-10 pr-4 text-xs w-40 focus:outline-none focus:border-indigo-500/50 transition-all focus:w-60 text-white"
                />
              </div>

              {/* Notification Button & Box */}
              <div className="relative">
                <button
                  onClick={() => setIsNotifyOpen(!isNotifyOpen)}
                  className="relative p-2 rounded-xl hover:bg-white/5 transition-all duration-200 group"
                >
                  <Bell size={20} className={`transition-colors duration-200 ${isNotifyOpen ? 'text-indigo-400' : 'text-slate-400 group-hover:text-white'}`} />
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[20px] h-[20px] flex items-center justify-center bg-indigo-500 text-white text-[10px] font-bold rounded-full border-2 border-[#0a0a0f]">
                      {formatNotificationCount(unreadCount)}
                    </span>
                  )}
                </button>

                <AnimatePresence>
                  {isNotifyOpen && (
                    <>
                      <div className="fixed inset-0 z-0" onClick={() => setIsNotifyOpen(false)} />
                      <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.98 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className="absolute right-0 mt-2 w-[380px] bg-[#0f0f1a] border border-white/5 rounded-2xl shadow-2xl shadow-black/70 overflow-hidden z-50"
                      >
                        {/* Header (EN) */}
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
                            <button 
                              onClick={handleMarkAllAsRead}
                              className="text-[11px] text-indigo-400 hover:text-indigo-300 font-normal transition-colors duration-200"
                            >
                              Mark all as read
                            </button>
                            <div className="w-px h-3 bg-white/5" />
                            <button
                              onClick={() => setIsNotifyOpen(false)}
                              className="text-slate-500 hover:text-white transition-colors duration-200"
                            >
                              <X size={15} />
                            </button>
                          </div>
                        </div>

                        {/* Notification List (EN) */}
                        <div className="max-h-[420px] overflow-y-auto scrollbar-thin">
                          {allNotifications.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 px-5">
                              <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-3">
                                <Bell size={22} className="text-slate-600" />
                              </div>
                              <p className="text-xs text-slate-400 font-medium">No notifications yet</p>
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
                                  className={`group flex items-center gap-3 mx-1.5 my-0.5 px-3 py-2 rounded-lg cursor-pointer transition-all duration-150 relative ${
                                    !notif.read 
                                      ? 'bg-indigo-500/[0.03] hover:bg-white/[0.03]' 
                                      : 'hover:bg-white/[0.03]'
                                  }`}
                                >
                                  {/* Left: Slim Avatar */}
                                  <div className="relative flex-shrink-0">
                                    {notif.isBroadcast ? (
                                      <div className="w-9 h-9 rounded-full bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shadow-inner">
                                        <Globe size={15} />
                                      </div>
                                    ) : (() => {
                                      const avatarUrl = getNotificationAvatarUrl(
                                        notif.actorAvatar,
                                        notif.actorFacebookId,
                                        notif.actorGoogleId
                                      );
                                      if (avatarUrl) {
                                        return (
                                          <div className="relative">
                                            <img
                                              src={avatarUrl}
                                              alt={notif.actorUsername || 'User'}
                                              className="w-9 h-9 rounded-full object-cover ring-1 ring-white/5"
                                            />
                                            {getNotifIcon(notif.type)}
                                          </div>
                                        );
                                      }
                                      return (
                                        <div className="relative w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 text-white font-medium flex items-center justify-center uppercase text-xs ring-1 ring-white/5">
                                          {notif.actorUsername ? notif.actorUsername.charAt(0).toUpperCase() : '?'}
                                          {getNotifIcon(notif.type)}
                                        </div>
                                      );
                                    })()}
                                  </div>

                                  {/* Middle: Light Text */}
                                  <div className="flex-1 min-w-0 pr-1">
                                    <p className="text-[11.5px] leading-snug font-light text-slate-300">
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
                                            <span className="block text-[10.5px] text-slate-500 mt-0.5 line-clamp-1 italic bg-white/[0.02] px-1.5 py-0.5 rounded border border-white/5">
                                              "{notif.content}"
                                            </span>
                                          )}
                                        </>
                                      )}
                                    </p>
                                    
                                    {/* Time */}
                                    <span className={`text-[10px] block mt-0.5 ${!notif.read ? 'text-indigo-400/90 font-medium' : 'text-slate-500'}`}>
                                      {notif.time}
                                    </span>
                                  </div>

                                  {/* Right: Unread indicator */}
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

                        {/* Footer (EN) */}
                        <div className="border-t border-white/5 px-4 py-2 bg-[#0c0c16]">
                          <Link
                            href="/notifications"
                            onClick={() => setIsNotifyOpen(false)}
                            className="flex items-center justify-center gap-1 text-[11px] text-slate-400 hover:text-white font-light transition-colors duration-200 group"
                          >
                            <span>See all notifications</span>
                            <span className="group-hover:translate-x-0.5 transition-transform text-[10px]">→</span>
                          </Link>
                        </div>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>

              {/* User Section - ĐÃ CHỈNH SỬA DROPDOWN GIỐNG ADMIN */}
              <div className="flex items-center" ref={userMenuRef}>
                {user ? (
                  <div className="relative hidden sm:block">
                    <button 
                      onClick={() => setIsUserOpen(!isUserOpen)}
                      className={`flex items-center gap-2 pl-1 pr-2 py-1 rounded-full border transition-all duration-200 ${
                        isUserOpen 
                        ? "bg-indigo-600/15 border-indigo-500/60" 
                        : "bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20"
                      }`}
                    >
                      <Avatar user={user} size="sm" />
                      <ChevronDown 
                        size={14} 
                        className={`text-slate-400 transition-transform duration-300 ${
                          isUserOpen ? "rotate-180 text-white" : ""
                        }`} 
                      />
                    </button>
                    
                    <AnimatePresence>
                      {isUserOpen && (
                        <>
                          <div
                            className="fixed inset-0 z-40"
                            onClick={() => setIsUserOpen(false)}
                          />
                          <motion.div
                            initial={{ opacity: 0, scale: 0.96, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.96, y: 10 }}
                            transition={{ duration: 0.15, ease: "easeOut" }}
                            className="absolute right-0 mt-3 w-80 rounded-2xl bg-[#12121c]/95 border border-white/10 shadow-2xl shadow-black/50 p-3 space-y-3 z-50 backdrop-blur-2xl"
                          >
                            {/* Profile summary - Style Admin */}
                            <div className="relative overflow-hidden p-3 rounded-xl bg-gradient-to-br from-indigo-600/15 via-white/[0.02] to-transparent border border-indigo-500/25">
                              <Link
                                href="/User"
                                onClick={() => setIsUserOpen(false)}
                                className="flex items-center gap-3"
                              >
                                <Avatar user={user} size="sm" />
                                <div className="flex flex-col min-w-0">
                                  <span className="text-xs font-black text-white uppercase tracking-tight truncate">
                                    @{user.username}
                                  </span>
                                  <div className="flex items-center gap-1.5 mt-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                    <span className="text-[9px] text-slate-400 font-mono uppercase tracking-wider font-bold">
                                      {user.role || 'USER'} NODE
                                    </span>
                                  </div>
                                </div>
                              </Link>

                              <Link
                                href="/User"
                                onClick={() => setIsUserOpen(false)}
                                className="mt-3 w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-white/[0.06] hover:bg-white/10 text-[11px] font-bold text-slate-200 transition-colors text-center"
                              >
                                <User size={13} />
                                <span>See all user settings</span>
                              </Link>
                            </div>

                            {/* Navigation rows - Style Admin */}
                            <div className="space-y-1">
                              <Link
                                href="/User"
                                onClick={() => setIsUserOpen(false)}
                                className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-white/5 text-slate-300 hover:text-white transition-colors group"
                              >
                                <div className="flex items-center gap-3">
                                  <div className="w-9 h-9 rounded-full bg-white/5 text-slate-300 group-hover:bg-indigo-600/20 group-hover:text-indigo-400 flex items-center justify-center transition-colors">
                                    <LayoutDashboard size={17} />
                                  </div>
                                  <span className="text-xs font-semibold">Dashboard</span>
                                </div>
                                <ChevronRight size={15} className="text-slate-500 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
                              </Link>

                              <Link
                                href="/profile"
                                onClick={() => setIsUserOpen(false)}
                                className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-white/5 text-slate-300 hover:text-white transition-colors group"
                              >
                                <div className="flex items-center gap-3">
                                  <div className="w-9 h-9 rounded-full bg-white/5 text-slate-300 group-hover:bg-emerald-600/20 group-hover:text-emerald-400 flex items-center justify-center transition-colors">
                                    <User size={17} />
                                  </div>
                                  <span className="text-xs font-semibold">Profile Settings</span>
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
                                  <span className="text-xs font-semibold">Log Out</span>
                                </div>
                                <ChevronRight size={15} className="text-slate-500 group-hover:text-rose-400 group-hover:translate-x-0.5 transition-all" />
                              </button>
                            </div>
                          </motion.div>
                        </>
                      )}
                    </AnimatePresence>
                  </div>
                ) : (
                  <Link href="/login" className="hidden sm:block text-xs font-bold bg-indigo-600 text-white px-6 py-3 rounded-xl hover:bg-indigo-500 transition-all active:scale-95 uppercase tracking-wider shadow-lg shadow-indigo-600/20">
                    Open Account
                  </Link>
                )}

                <button 
                  className="lg:hidden p-2 text-white hover:bg-white/5 rounded-xl transition-colors ml-2"
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                >
                  {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 top-0 z-40 lg:hidden"
          >
            <div className="absolute inset-0 bg-[#0a0a0f]/95 backdrop-blur-md" onClick={() => setIsMenuOpen(false)} />
            <motion.div 
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              className="absolute inset-x-0 top-24 bg-[#12121c] border-b border-white/10 shadow-2xl p-6"
            >
              <div className="grid grid-cols-2 gap-4">
                {navLinks.map((link) => (
                  <Link 
                    key={link.name} 
                    href={link.href}
                    onClick={() => setIsMenuOpen(false)}
                    className="flex flex-col gap-3 p-5 rounded-2xl bg-white/5 border border-white/5 hover:border-indigo-500/30 group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                      {link.icon}
                    </div>
                    <span className="font-bold text-white text-sm uppercase tracking-wide">{link.name}</span>
                  </Link>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* NOTIFICATION DETAIL MODAL (EN) */}
      <AnimatePresence>
        {showNotificationModal && selectedNotification && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
              onClick={() => setShowNotificationModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md mx-4 bg-[#0f0f1a] border border-white/5 rounded-2xl shadow-2xl shadow-black/70 z-[70] overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
                <div className="flex items-center gap-3">
                  {selectedNotification.isBroadcast ? (
                    <div className="w-8 h-8 rounded-full bg-indigo-500/10 flex items-center justify-center">
                      <Globe size={16} className="text-indigo-400" />
                    </div>
                  ) : (() => {
                    const avatarUrl = getNotificationAvatarUrl(
                      selectedNotification.actorAvatar,
                      selectedNotification.actorFacebookId,
                      selectedNotification.actorGoogleId
                    );
                    if (avatarUrl) {
                      return (
                        <img
                          src={avatarUrl}
                          alt={selectedNotification.actorUsername || 'User'}
                          className="w-8 h-8 rounded-full object-cover ring-1 ring-white/5"
                        />
                      );
                    }
                    return (
                      <div className="w-8 h-8 rounded-full bg-slate-500/10 flex items-center justify-center">
                        <Bell size={16} className="text-slate-400" />
                      </div>
                    );
                  })()}
                  <div>
                    <h3 className="text-sm font-semibold text-white">Notification Details</h3>
                    <span className="text-[10px] text-slate-500">{selectedNotification.time}</span>
                  </div>
                </div>
                <button
                  onClick={() => setShowNotificationModal(false)}
                  className="p-1.5 hover:bg-white/5 rounded-lg transition-colors text-slate-400 hover:text-white"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Content */}
              <div className="px-6 py-5">
                <div className="mb-4">
                  <p className="text-sm text-slate-300 leading-relaxed">
                    {selectedNotification.actorUsername ? `@${selectedNotification.actorUsername} ` : ''}
                    {selectedNotification.title}
                  </p>
                  {selectedNotification.content && (
                    <p className="text-sm text-slate-400 leading-relaxed mt-2 bg-white/5 p-3 rounded-xl border border-white/5">
                      {selectedNotification.content}
                    </p>
                  )}
                </div>

                {/* Actor info */}
                {selectedNotification.actorUsername && (
                  <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold">
                      {selectedNotification.actorUsername.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-500 uppercase tracking-wider">From user</p>
                      <p className="text-sm text-white font-medium">@{selectedNotification.actorUsername}</p>
                    </div>
                  </div>
                )}

                {/* Tags */}
                <div className="flex items-center gap-2 mt-4">
                  {selectedNotification.isBroadcast && (
                    <span className="px-2 py-1 bg-indigo-500/10 text-indigo-400 text-[10px] font-medium rounded-lg">
                      System
                    </span>
                  )}
                  {selectedNotification.type === 'like' && (
                    <span className="px-2 py-1 bg-rose-500/10 text-rose-400 text-[10px] font-medium rounded-lg">
                      ❤️ Like
                    </span>
                  )}
                  {selectedNotification.type === 'reply' && (
                    <span className="px-2 py-1 bg-emerald-500/10 text-emerald-400 text-[10px] font-medium rounded-lg">
                      💬 Reply
                    </span>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="px-6 py-4 border-t border-white/5 bg-[#0c0c16]">
                <div className="flex gap-2">
                  {selectedNotification.postId && (
                    <button
                      onClick={() => {
                        setShowNotificationModal(false);
                        router.push(`/post/${selectedNotification.postId}`);
                      }}
                      className="flex-1 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-500 transition-all"
                    >
                      View Post
                    </button>
                  )}
                  <button
                    onClick={() => setShowNotificationModal(false)}
                    className={`${selectedNotification.postId ? 'flex-1' : 'w-full'} py-2.5 bg-white/5 text-slate-300 text-sm font-medium rounded-xl hover:bg-white/10 transition-all border border-white/5`}
                  >
                    Close
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </header>
  );
}