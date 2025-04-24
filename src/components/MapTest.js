import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { getStaticMapUrl } from '../config/maps';

const MapTest = () => {
  // Test coordinates (San Francisco)
  const latitude = 37.7749;
  const longitude = -122.4194;
  
  const mapUrl = getStaticMapUrl(latitude, longitude);
  
  useEffect(() => {
    console.log('MapTest - Generated URL:', mapUrl);
  }, [mapUrl]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Map Test</Text>
      <Text style={styles.coordinates}>
        Lat: {latitude}, Long: {longitude}
      </Text>
      <Text style={styles.url} numberOfLines={2}>{mapUrl}</Text>
      
      <View style={styles.mapContainer}>
        <Image 
          source={{ uri: mapUrl }} 
          style={styles.mapImage}
          resizeMode="cover"
          onError={(e) => {
            console.error('Map image loading error:', e.nativeEvent.error);
            console.error('Failed URL:', mapUrl);
          }}
          onLoad={() => console.log('Map image loaded successfully')}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  coordinates: {
    fontSize: 14,
    color: '#333',
    marginBottom: 5,
  },
  url: {
    fontSize: 12,
    color: '#666',
    marginBottom: 20,
  },
  mapContainer: {
    height: 200,
    width: '100%',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    overflow: 'hidden',
  },
  mapImage: {
    width: '100%',
    height: '100%',
  },
});

export default MapTest; 