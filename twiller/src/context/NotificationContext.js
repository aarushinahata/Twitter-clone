import React, { createContext, useContext, useState, useEffect } from 'react';
import { useUserAuth } from './UserAuthContext';
import {
  isNotificationSupported,
  getNotificationPermission,
  requestNotificationPermission as requestPermission,
  createTweetNotification,
  testNotification
} from '../utils/notificationService';

const NotificationContext = createContext();

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const { user } = useUserAuth();
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState('default');
  const [isInitialized, setIsInitialized] = useState(false);
  const [lastNotification, setLastNotification] = useState(null);

  useEffect(() => {
    // Check if notifications are supported and get current permission
    if (isNotificationSupported()) {
      const permission = getNotificationPermission();
      setNotificationPermission(permission);
      
      // If permission is already granted, enable notifications by default
      if (permission === 'granted') {
        setNotificationsEnabled(true);
      }
    }
    setIsInitialized(true);
  }, []);

  const requestNotificationPermission = async () => {
    try {
      const permission = await requestPermission();
      setNotificationPermission(permission);
      
      // If permission granted, enable notifications
      if (permission === 'granted') {
        setNotificationsEnabled(true);
      }
      
      return permission;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      throw error;
    }
  };

  const showNotification = (title, options = {}) => {
    if (!isNotificationSupported() || notificationPermission !== 'granted') {
      return false;
    }

    try {
      const notification = new Notification(title, {
        icon: '/favicon.png',
        badge: '/favicon.png',
        requireInteraction: false,
        tag: 'tweet-notification',
        ...options
      });

      // Auto-close after 8 seconds
      setTimeout(() => {
        if (notification.close) {
          notification.close();
        }
      }, 8000);

      // Store last notification for debugging
      setLastNotification({ title, options, timestamp: new Date() });

      return notification;
    } catch (error) {
      console.error('Error showing notification:', error);
      return false;
    }
  };

  const checkAndNotify = (tweet) => {
    if (!notificationsEnabled || !isNotificationSupported() || notificationPermission !== 'granted') {
      return false;
    }

    return createTweetNotification(tweet);
  };

  const canEnableNotifications = () => {
    return isNotificationSupported() && notificationPermission !== 'denied';
  };

  const testNotificationSystem = () => {
    if (!isNotificationSupported() || notificationPermission !== 'granted') {
      console.warn('Cannot test notifications - not supported or permission not granted');
      return false;
    }
    
    return testNotification();
  };

  const value = {
    notificationsEnabled,
    setNotificationsEnabled,
    notificationPermission,
    requestNotificationPermission,
    showNotification,
    checkAndNotify,
    canEnableNotifications,
    isInitialized,
    testNotificationSystem,
    lastNotification
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};
