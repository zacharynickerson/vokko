import React from 'react';
import { Modal, View, Image, TouchableOpacity, Text, StyleSheet, Dimensions } from 'react-native';
import PropTypes from 'prop-types';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const MapPreviewModal = ({ visible, onClose, location, mapImageUrl }) => {
  if (!location) {
    console.log('MapPreviewModal: No location data provided');
    return null;
  }

  if (!mapImageUrl) {
    console.log('MapPreviewModal: No map image URL provided');
    return null;
  }

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>×</Text>
          </TouchableOpacity>
          
          <View style={styles.mapContainer}>
            <Image
              source={{ uri: mapImageUrl }}
              style={styles.mapImage}
              resizeMode="contain"
              onError={(error) => console.error('MapPreviewModal: Image loading error:', error.nativeEvent)}
            />
            <View style={styles.markerContainer}>
              <MaterialCommunityIcons name="map-marker" size={40} color="#FF4D4F" />
            </View>
          </View>
          
          <View style={styles.coordinatesContainer}>
            <Text style={styles.coordinatesText}>
              {`${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`}
            </Text>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: screenWidth,
    height: screenHeight * 0.7,
    backgroundColor: '#000',
    borderRadius: 10,
    overflow: 'hidden',
  },
  closeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 1,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  mapContainer: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  mapImage: {
    width: '100%',
    height: '100%',
  },
  markerContainer: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginLeft: -20,
    marginTop: -40,
  },
  coordinatesContainer: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 10,
    borderRadius: 5,
  },
  coordinatesText: {
    color: '#fff',
    fontSize: 14,
    textAlign: 'center',
  },
});

MapPreviewModal.propTypes = {
  visible: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  location: PropTypes.shape({
    latitude: PropTypes.number.isRequired,
    longitude: PropTypes.number.isRequired,
  }),
  mapImageUrl: PropTypes.string.isRequired,
};

export default MapPreviewModal; 