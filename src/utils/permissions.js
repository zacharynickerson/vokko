import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import { Audio } from 'expo-av';

export const requestPermissions = async () => {
  try {
    // Request microphone permission
    const { status: audioStatus } = await Audio.requestPermissionsAsync();
    
    // Request location permission
    const { status: locationStatus } = await Location.requestForegroundPermissionsAsync();
    
    // Request notification permission
    const { status: notificationStatus } = await Notifications.requestPermissionsAsync({
      ios: {
        allowAlert: true,
        allowBadge: true,
        allowSound: true,
        allowAnnouncements: true,
      },
    });

    return {
      audio: audioStatus === 'granted',
      location: locationStatus === 'granted',
      notifications: notificationStatus === 'granted',
    };
  } catch (error) {
    console.error('Error requesting permissions:', error);
    return {
      audio: false,
      location: false,
      notifications: false,
    };
  }
};

export const checkPermissions = async () => {
  try {
    // Check microphone permission
    const { status: audioStatus } = await Audio.getPermissionsAsync();
    
    // Check location permission
    const { status: locationStatus } = await Location.getForegroundPermissionsAsync();
    
    // Check notification permission
    const { status: notificationStatus } = await Notifications.getPermissionsAsync();

    return {
      audio: audioStatus === 'granted',
      location: locationStatus === 'granted',
      notifications: notificationStatus === 'granted',
    };
  } catch (error) {
    console.error('Error checking permissions:', error);
    return {
      audio: false,
      location: false,
      notifications: false,
    };
  }
}; 