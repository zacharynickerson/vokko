import uuid from 'react-native-uuid';
import * as FileSystem from 'expo-file-system';
import * as Location from 'expo-location';

export const generateUUID = () => {
    return uuid.v4();
};

export const getFileSize = async (uri) => {
  const fileInfo = await FileSystem.getInfoAsync(uri);
  return fileInfo.size;
};

export const getLocation = async () => {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      throw new Error('Location permission not granted');
    }
  
    let location = await Location.getCurrentPositionAsync({});
    const { latitude, longitude } = location.coords;
  
    try {
      const response = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=AIzaSyCIamHe2AVao_SfZPn6qZpn2YuOuk97bHU`);
      const data = await response.json();


      if (data.results && data.results.length > 0) {
        const addressComponents = data.results[0].address_components;
        let city = '';
        let country = '';
        for (let component of addressComponents) {
          if (component.types.includes('locality')) {
            city = component.long_name;
          } else if (component.types.includes('country')) {
            country = component.long_name;
          }
        }
        return `${city}, ${country}`;
      } else {
        console.warn('No address found in the geocoding response');
        return 'Unknown location';
      }
    } catch (error) {
      console.error('Failed to get location:', error);
      return 'Location not available';
    }
  };

  export const getCurrentDate = () => {
    return new Date().toISOString();
  };
  
  // If you still want to display the date in a human-readable format in your UI:
  export const formatDateForDisplay = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    }).replace(',', ' •');
  };