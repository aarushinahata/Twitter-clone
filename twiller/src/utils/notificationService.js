// Notification service utility functions

export const checkForKeywords = (text, keywords = ['cricket', 'science']) => {
  if (!text || typeof text !== 'string') return false;
  const lowerText = text.toLowerCase();
  return keywords.some(keyword => lowerText.includes(keyword));
};

export const formatNotificationTitle = (tweet) => {
  const name = tweet.name || tweet.username || 'Unknown User';
  return `New Tweet from ${name}`;
};

export const formatNotificationBody = (tweet) => {
  return tweet.post || 'New tweet';
};

export const getNotificationIcon = (tweet) => {
  return tweet.profilephoto || tweet.profilePhoto || '/favicon.png';
};

export const isNotificationSupported = () => {
  return 'Notification' in window;
};

export const getNotificationPermission = () => {
  if (!isNotificationSupported()) return 'unsupported';
  return Notification.permission;
};

export const requestNotificationPermission = async () => {
  if (!isNotificationSupported()) {
    throw new Error('Notifications are not supported in this browser');
  }

  try {
    const permission = await Notification.requestPermission();
    console.log('Notification permission result:', permission);
    return permission;
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    throw error;
  }
};

export const showNotification = (title, options = {}) => {
  if (!isNotificationSupported()) {
    console.warn('Notifications not supported in this browser');
    return false;
  }
  
  if (Notification.permission !== 'granted') {
    console.warn('Notification permission not granted. Current permission:', Notification.permission);
    return false;
  }

  try {
    const notification = new Notification(title, {
      icon: '/favicon.png',
      badge: '/favicon.png',
      requireInteraction: false,
      tag: 'tweet-notification', // Prevents duplicate notifications
      ...options
    });

    console.log('Notification shown successfully:', { title, options });

    // Auto-close after 8 seconds
    setTimeout(() => {
      if (notification.close) {
        notification.close();
        console.log('Notification auto-closed');
      }
    }, 8000);

    return notification;
  } catch (error) {
    console.error('Error showing notification:', error);
    return false;
  }
};

export const createTweetNotification = (tweet) => {
  if (!tweet || !tweet.post) {
    console.warn('Invalid tweet object for notification:', tweet);
    return false;
  }

  if (!checkForKeywords(tweet.post)) {
    console.log('Tweet does not contain keywords:', tweet.post);
    return false;
  }

  console.log('Creating notification for tweet:', tweet.post);
  
  const title = formatNotificationTitle(tweet);
  const body = formatNotificationBody(tweet);
  const icon = getNotificationIcon(tweet);

  return showNotification(title, { body, icon });
};

// Debug function to test notifications
export const testNotification = () => {
  const testTweet = {
    name: "Test User",
    username: "testuser",
    post: "This is a test tweet about cricket and science! 🏏🔬"
  };
  
  console.log('Testing notification with tweet:', testTweet);
  return createTweetNotification(testTweet);
};
