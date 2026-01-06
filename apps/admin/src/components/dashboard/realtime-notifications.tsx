// Real-time Notifications Component
'use client';

import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Bell, X, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { dashboardApi } from '@/lib/api';

interface Notification {
  id: string;
  type: 'business_pending' | 'review_pending' | 'package_expiring' | 'info';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  actionUrl?: string;
}

export function RealtimeNotifications() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const queryClient = useQueryClient();

  // Poll for new notifications every 30 seconds
  const { data: pendingBusinesses } = useQuery({
    queryKey: ['pending-businesses-count'],
    queryFn: () => dashboardApi.getPendingBusinessesCount().then(res => res.data),
    refetchInterval: 30000, // 30 seconds
  });

  const { data: pendingReviews } = useQuery({
    queryKey: ['pending-reviews-count'],
    queryFn: () => dashboardApi.getPendingReviewsCount().then(res => res.data),
    refetchInterval: 30000,
  });

  // Generate notifications from data
  useEffect(() => {
    const newNotifications: Notification[] = [];

    if (pendingBusinesses && pendingBusinesses.count > 0) {
      newNotifications.push({
        id: 'business-pending',
        type: 'business_pending',
        title: 'أنشطة بانتظار الموافقة',
        message: `لديك ${pendingBusinesses.count} نشاط تجاري بانتظار المراجعة`,
        timestamp: new Date(),
        read: false,
        actionUrl: '/businesses?status=pending',
      });
    }

    if (pendingReviews && pendingReviews.count > 0) {
      newNotifications.push({
        id: 'review-pending',
        type: 'review_pending',
        title: 'تقييمات بانتظار الموافقة',
        message: `لديك ${pendingReviews.count} تقييم بانتظار المراجعة`,
        timestamp: new Date(),
        read: false,
        actionUrl: '/reviews?status=pending',
      });
    }

    setNotifications(newNotifications);

    // Show browser notification if new items detected
    if (newNotifications.length > 0 && document.hidden) {
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('الصفحات الخضراء - إشعار جديد', {
          body: newNotifications[0].message,
          icon: '/logo.png',
          badge: '/logo.png',
        });
      }
    }
  }, [pendingBusinesses, pendingReviews]);

  // Request notification permission
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'business_pending':
        return <Clock className="w-5 h-5 text-amber-500" />;
      case 'review_pending':
        return <AlertCircle className="w-5 h-5 text-blue-500" />;
      case 'package_expiring':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      default:
        return <CheckCircle className="w-5 h-5 text-green-500" />;
    }
  };

  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 bg-white border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
        aria-label="الإشعارات"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -left-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-white animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Notifications Panel */}
          <div className="absolute left-0 mt-2 w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-[500px] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="font-bold text-gray-900">الإشعارات</h3>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-xs text-primary-600 hover:text-primary-700"
                  >
                    تحديد الكل كمقروء
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <X className="w-4 h-4 text-gray-500" />
                </button>
              </div>
            </div>

            {/* Notifications List */}
            <div className="flex-1 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <Bell className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                  <p>لا توجد إشعارات جديدة</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer ${
                        !notification.read ? 'bg-primary-50/30' : ''
                      }`}
                      onClick={() => {
                        markAsRead(notification.id);
                        if (notification.actionUrl) {
                          window.location.href = notification.actionUrl;
                        }
                      }}
                    >
                      <div className="flex items-start gap-3">
                        <div className="shrink-0 mt-0.5">
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="font-medium text-gray-900 text-sm">
                              {notification.title}
                            </h4>
                            {!notification.read && (
                              <span className="w-2 h-2 bg-primary-500 rounded-full shrink-0 mt-1" />
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            {notification.message}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            {notification.timestamp.toLocaleString('ar-SY', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
