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
      const response = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=AIzaSyDztJfU8dgYeW5BlJ8UxGwU3xGbz9-XrrU`);
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
        throw new Error('No address found');
      }
    } catch (error) {
      console.error('Failed to get location:', error);
      return null;
    }
  };
  

// export const getLocation = async () => {
//     let { status } = await Location.requestForegroundPermissionsAsync();
//     if (status !== 'granted') {
//       throw new Error('Location permission not granted');
//     }
  
//     let location = await Location.getCurrentPositionAsync({});
//     return {
//       latitude: location.coords.latitude,
//       longitude: location.coords.longitude,
//     };
//   };

// export const formatMillis = (millis) => {
//     const minutes = Math.floor(millis / (1000 * 60));
//     const seconds = Math.floor((millis % (1000 * 60)) / 1000);
//     return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
// };


// export const getDurationMillis = async (uri) => {
//     try {
//       const status = await uri.getStatusAsync();
//       return status.durationMillis;
//     } catch (error) {
//       console.error('Failed to get recording duration', error);
//       throw error;
//     }
// };

export const getCurrentDate = () => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date().toLocaleDateString(undefined, options);
  };