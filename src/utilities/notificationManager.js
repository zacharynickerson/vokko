import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    priority: Notifications.AndroidNotificationPriority.MAX,
  }),
});

export const setupNotifications = async () => {
  try {
    // Check if physical device
    if (!Device.isDevice) {
      throw new Error('Notifications require physical device');
    }

    // Request permission
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      throw new Error('Failed to get notification permission');
    }

    // Set up Android channel
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#4FBF67',
        sound: true,
      });

      // Additional channel for call notifications
      await Notifications.setNotificationChannelAsync('calls', {
        name: 'Incoming Calls',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#4FBF67',
        sound: true,
        enableVibrate: true,
        showBadge: true,
      });
    }

    return true;
  } catch (error) {
    console.error('Error setting up notifications:', error);
    return false;
  }
};

export const scheduleCallNotification = async ({ sessionId, moduleName, guideName, scheduledFor }) => {
  try {
    console.log('Scheduling Notification with data:', { sessionId, moduleName, guideName, scheduledFor });
    
    const triggerDate = new Date(scheduledFor);
    console.log('Trigger Date:', triggerDate);
    
    if (triggerDate <= new Date()) {
      throw new Error('Scheduled time must be in the future.');
    }
    
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: `Upcoming Session: ${moduleName}`,
        body: `Your session with ${guideName} is about to start.`,
        data: { sessionId },
        sound: true,
        channelId: 'default',
      },
      trigger: triggerDate,
    });
    
    console.log('Scheduled Notification ID:', notificationId);
    return notificationId;
  } catch (error) {
    console.error('Error scheduling notification:', error);
    throw error;
  }
};

export const cancelScheduledNotification = async (notificationId) => {
  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  } catch (error) {
    console.error('Error canceling notification:', error);
    throw error;
  }
};