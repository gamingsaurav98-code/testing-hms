/**
 * Real-time notification hook for HMS
 * Provides synchronized updates across Admin, Staff, and Student portals
 */

import { useState, useEffect, useCallback } from 'react';

export type NotificationType = 'info' | 'success' | 'warning' | 'error';

export interface HMSNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  entityType: 'student' | 'staff' | 'complaint' | 'financial' | 'checkin' | 'checkout';
  entityId?: string;
  timestamp: string;
  read: boolean;
  actionUrl?: string;
}

export interface NotificationUpdate {
  entityType: 'student' | 'staff' | 'complaint' | 'financial' | 'checkin' | 'checkout';
  entityId?: string;
  action: 'created' | 'updated' | 'deleted' | 'status_changed';
  data: unknown;
  timestamp: string;
  userRole: 'admin' | 'staff' | 'student';
  triggeredBy: string;
}

export const useRealtimeNotifications = (userRole: 'admin' | 'staff' | 'student') => {
  const [notifications, setNotifications] = useState<HMSNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Add a new notification
  const addNotification = useCallback((notification: Omit<HMSNotification, 'id' | 'timestamp' | 'read'>) => {
    const newNotification: HMSNotification = {
      ...notification,
      id: `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      read: false,
    };

    setNotifications(prev => [newNotification, ...prev.slice(0, 49)]); // Keep last 50 notifications
    setUnreadCount(prev => prev + 1);

    // Auto-remove info notifications after 5 seconds
    if (notification.type === 'info') {
      setTimeout(() => {
        removeNotification(newNotification.id);
      }, 5000);
    }

    return newNotification.id;
  }, []);

  // Remove a notification
  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => {
      const notification = prev.find(n => n.id === id);
      if (notification && !notification.read) {
        setUnreadCount(count => Math.max(0, count - 1));
      }
      return prev.filter(n => n.id !== id);
    });
  }, []);

  // Mark notification as read
  const markAsRead = useCallback((id: string) => {
    setNotifications(prev => 
      prev.map(notification => {
        if (notification.id === id && !notification.read) {
          setUnreadCount(count => Math.max(0, count - 1));
          return { ...notification, read: true };
        }
        return notification;
      })
    );
  }, []);

  // Mark all notifications as read
  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  }, []);

  // Clear all notifications
  const clearAll = useCallback(() => {
    setNotifications([]);
    setUnreadCount(0);
  }, []);

  // Process notification updates from the system
  const processUpdate = useCallback((update: NotificationUpdate) => {
    let notification: Omit<HMSNotification, 'id' | 'timestamp' | 'read'> | null = null;

    // Generate notifications based on entity type and user role
    switch (update.entityType) {
      case 'complaint':
        if (userRole === 'admin') {
          notification = {
            type: 'info',
            title: 'New Complaint',
            message: `A new complaint has been ${update.action}`,
            entityType: 'complaint',
            entityId: update.entityId,
            actionUrl: `/admin/complain/${update.entityId}`
          };
        } else if (userRole === 'student' && (update.data as { student_id?: string })?.student_id) {
          notification = {
            type: update.action === 'status_changed' ? 'success' : 'info',
            title: 'Complaint Update',
            message: `Your complaint has been ${update.action === 'status_changed' ? 'updated' : update.action}`,
            entityType: 'complaint',
            entityId: update.entityId,
            actionUrl: `/student/complain/${update.entityId}`
          };
        } else if (userRole === 'staff' && (update.data as { staff_id?: string })?.staff_id) {
          notification = {
            type: update.action === 'status_changed' ? 'success' : 'info',
            title: 'Complaint Update',
            message: `Your complaint has been ${update.action === 'status_changed' ? 'updated' : update.action}`,
            entityType: 'complaint',
            entityId: update.entityId,
            actionUrl: `/staff/complain/${update.entityId}`
          };
        }
        break;

      case 'checkin':
      case 'checkout':
        if (userRole === 'admin') {
          notification = {
            type: 'info',
            title: `${update.entityType === 'checkin' ? 'Check-in' : 'Check-out'} Alert`,
            message: `A ${update.entityType === 'checkin' ? 'check-in' : 'check-out'} request requires attention`,
            entityType: update.entityType,
            entityId: update.entityId,
            actionUrl: `/admin/${update.entityType.includes('student') ? 'student' : 'staff'}-checkin-checkout`
          };
        } else if (userRole === 'student' || userRole === 'staff') {
          notification = {
            type: update.action === 'status_changed' ? 'success' : 'info',
            title: `${update.entityType === 'checkin' ? 'Check-in' : 'Check-out'} Update`,
            message: `Your ${update.entityType === 'checkin' ? 'check-in' : 'check-out'} has been ${update.action === 'status_changed' ? 'processed' : update.action}`,
            entityType: update.entityType,
            entityId: update.entityId,
            actionUrl: `/${userRole}/checkin-checkout`
          };
        }
        break;

      case 'financial':
        if (userRole === 'admin') {
          notification = {
            type: 'info',
            title: 'Financial Update',
            message: `A financial record has been ${update.action}`,
            entityType: 'financial',
            entityId: update.entityId,
            actionUrl: '/admin/income'
          };
        } else if ((userRole === 'student' || userRole === 'staff') && update.action === 'created') {
          notification = {
            type: 'success',
            title: 'Payment Processed',
            message: 'A new payment has been recorded to your account',
            entityType: 'financial',
            entityId: update.entityId,
            actionUrl: `/${userRole}/payment-history`
          };
        }
        break;

      case 'student':
        if (userRole === 'admin') {
          notification = {
            type: 'info',
            title: 'Student Update',
            message: `A student record has been ${update.action}`,
            entityType: 'student',
            entityId: update.entityId,
            actionUrl: '/admin/student'
          };
        }
        break;

      case 'staff':
        if (userRole === 'admin') {
          notification = {
            type: 'info',
            title: 'Staff Update',
            message: `A staff record has been ${update.action}`,
            entityType: 'staff',
            entityId: update.entityId,
            actionUrl: '/admin/staff'
          };
        }
        break;
    }

    if (notification) {
      addNotification(notification);
    }
  }, [userRole, addNotification]);

  // Listen for HMS data invalidation events
  useEffect(() => {
    const handleDataInvalidation = (event: CustomEvent) => {
      const update: NotificationUpdate = {
        entityType: event.detail.entityType,
        entityId: event.detail.entityId,
        action: 'updated',
        data: event.detail.data || {},
        timestamp: event.detail.timestamp,
        userRole: userRole,
        triggeredBy: 'system'
      };

      processUpdate(update);
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('hms-data-invalidated', handleDataInvalidation as EventListener);
      
      return () => {
        window.removeEventListener('hms-data-invalidated', handleDataInvalidation as EventListener);
      };
    }
  }, [processUpdate, userRole]);

  // Simulate real-time updates (in a real implementation, this would be WebSocket or SSE)
  useEffect(() => {
    // Add a welcome notification for new sessions
    const hasWelcomeNotification = sessionStorage.getItem('hms-welcome-shown');
    if (!hasWelcomeNotification) {
      addNotification({
        type: 'success',
        title: 'Welcome to HMS',
        message: `Welcome to the ${userRole === 'admin' ? 'Admin' : userRole === 'staff' ? 'Staff' : 'Student'} Portal`,
        entityType: 'student' // Default entity type
      });
      sessionStorage.setItem('hms-welcome-shown', 'true');
    }
  }, [userRole, addNotification]);

  return {
    notifications,
    unreadCount,
    addNotification,
    removeNotification,
    markAsRead,
    markAllAsRead,
    clearAll,
    processUpdate
  };
};

export default useRealtimeNotifications;
