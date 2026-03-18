'use client';

import { useState, useEffect, useRef } from 'react';
import { Bell, X, Check, Trash2, ExternalLink, ShieldAlert, Package, MessageSquare } from 'lucide-react';
import { getMyNotifications, getUnreadNotificationCount, markNotificationAsRead, markAllNotificationsAsRead, deleteNotification } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

interface Notification {
  notification_id: string;
  title: string;
  message: string;
  category: 'order_updates' | 'ticket_responses' | 'security_alerts';
  link_url?: string;
  is_read: boolean;
  created_at: string;
}

export default function NotificationCenter({ colors }: { colors: any }) {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const fetchNotifications = async () => {
    setLoading(true);
    const data = await getMyNotifications(20);
    setNotifications(data);
    const count = await getUnreadNotificationCount();
    setUnreadCount(count);
    setLoading(false);
  };

  useEffect(() => {
    fetchNotifications();
    
    // Listen for updates from other components
    const handleUpdate = () => {
      fetchNotifications();
    };
    window.addEventListener('notifications-updated', handleUpdate);
    
    // Polling for new notifications every 2 minutes
    const interval = setInterval(fetchNotifications, 120000);
    return () => {
      clearInterval(interval);
      window.removeEventListener('notifications-updated', handleUpdate);
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleMarkAsRead = async (id: string) => {
    const res = await markNotificationAsRead(id);
    if (res.success) {
      setNotifications(prev => prev.map(n => n.notification_id === id ? { ...n, is_read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
      window.dispatchEvent(new CustomEvent('notifications-updated'));
    }
  };

  const handleMarkAllRead = async () => {
    const res = await markAllNotificationsAsRead();
    if (res.success) {
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
      window.dispatchEvent(new CustomEvent('notifications-updated'));
    }
  };

  const handleDelete = async (id: string) => {
    const res = await deleteNotification(id);
    if (res.success) {
      setNotifications(prev => prev.filter(n => n.notification_id !== id));
      // Re-fetch count to be sure
      const count = await getUnreadNotificationCount();
      setUnreadCount(count);
      window.dispatchEvent(new CustomEvent('notifications-updated'));
    }
  };

  const handleNotificationClick = (n: Notification) => {
    if (!n.is_read) {
      handleMarkAsRead(n.notification_id);
    }
    if (n.link_url) {
      router.push(n.link_url as any);
      setIsOpen(false);
    }
  };

  const getIcon = (category: string) => {
    switch (category) {
      case 'order_updates': return <Package className="h-5 w-5 text-blue-500" />;
      case 'ticket_responses': return <MessageSquare className="h-5 w-5 text-green-500" />;
      case 'security_alerts': return <ShieldAlert className="h-5 w-5 text-red-500" />;
      default: return <Bell className="h-5 w-5 text-gray-500" />;
    }
  };

  return (
    <div className="relative" ref={containerRef}>
      {/* Bell Icon */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 group transition-all duration-300 hover:scale-110"
        aria-label="Notifications"
        suppressHydrationWarning
      >
        <Bell className="h-[20px] w-[20px] transition-colors" style={{ color: isOpen ? colors.navbar_hover : colors.navbar_text }} />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 h-2.5 w-2.5 bg-red-500 rounded-full border-2 border-white animate-pulse" />
        )}
      </button>

      {/* Popover */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="absolute right-0 mt-3 w-80 sm:w-96 bg-white rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.15)] border border-gray-100 overflow-hidden z-[120]"
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-50 bg-gray-50/50 flex items-center justify-between">
              <h3 className="font-bold text-[#1a2408]">Notifications</h3>
              <div className="flex items-center gap-3">
                {unreadCount > 0 && (
                  <button 
                    onClick={handleMarkAllRead}
                    className="text-[10px] font-bold uppercase tracking-widest text-[#4A5D23] hover:underline"
                  >
                    Mark all read
                  </button>
                )}
                <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* List */}
            <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
              {loading && notifications.length === 0 ? (
                <div className="p-10 text-center space-y-3">
                  <div className="h-8 w-8 border-2 border-[#4A5D23] border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="text-xs text-gray-400">Loading your alerts...</p>
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-10 text-center">
                  <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Bell className="h-8 w-8 text-gray-300" />
                  </div>
                  <p className="text-sm font-medium text-gray-500">No notifications yet</p>
                  <p className="text-xs text-gray-400 mt-1">We'll notify you when something happens.</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {notifications.map((n) => (
                    <div 
                      key={n.notification_id}
                      className={`relative group px-6 py-4 flex gap-4 transition-colors hover:bg-gray-50 cursor-pointer ${!n.is_read ? 'bg-green-50/30' : ''}`}
                      onClick={() => handleNotificationClick(n)}
                    >
                      <div className="mt-1 flex-shrink-0">
                        {getIcon(n.category)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className={`text-sm font-semibold truncate ${!n.is_read ? 'text-[#1a2408]' : 'text-gray-700'}`}>
                            {n.title}
                          </p>
                          {!n.is_read && <span className="h-1.5 w-1.5 bg-red-500 rounded-full flex-shrink-0" title="Unread" />}
                        </div>
                        <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
                          {n.message}
                        </p>
                        <p className="text-[10px] text-gray-400 mt-2 font-medium">
                          {new Date(n.created_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                        </p>
                      </div>
                      
                      {/* Actions */}
                      <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleDelete(n.notification_id); }}
                          className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                          title="Delete"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-3 border-t border-gray-50 bg-gray-50/30 text-center">
              <button 
                onClick={() => { router.push('/account/notifications' as any); setIsOpen(false); }}
                className="text-[11px] font-bold text-[#4A5D23] hover:underline flex items-center justify-center gap-1 mx-auto"
              >
                View all notifications <ExternalLink className="h-3 w-3" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
