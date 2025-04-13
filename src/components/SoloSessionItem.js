import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatDateForDisplay } from '../utilities/helpers';

const SoloVoiceNoteItem = ({ item, onPress, isLoading, onRetry }) => {
  const isClickable = item.status === 'completed';

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={[
          styles.touchableContainer, 
          isLoading && styles.loadingContainer,
          !isClickable && styles.disabledContainer
        ]}
        onPress={isClickable ? onPress : null}
        disabled={!isClickable}
      >
        <View style={styles.imageContainer}>
          <Image 
            source={item.image ? { uri: item.image } : require('../../assets/images/default-note-image.png')} 
            style={styles.image}
          />
          <View style={styles.typeIndicator}>
            <Text style={styles.typeText}>Solo</Text>
          </View>
        </View>
        <View style={styles.contentContainer}>
          <Text style={styles.title} numberOfLines={2}>
            {isLoading ? 'Processing...' : item.title}
          </Text>
          <Text style={styles.date}>{formatDateForDisplay(item.createdDate)}</Text>
          {item.status === 'error' && <Text style={styles.errorText}>Error occurred</Text>}
        </View>
      </TouchableOpacity>
      {item.status === 'error' && (
        <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
          <Ionicons name="refresh" size={24} color="#FF3B30" />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  touchableContainer: {
    backgroundColor: 'white',
    borderRadius: 10,
    overflow: 'hidden',
    borderColor: '#F9F9F9',
    borderWidth: 1,
  },
  imageContainer: {
    position: 'relative',
    paddingTop: 10,
    paddingLeft: 10,
    paddingRight: 10,
    paddingBottom: 0,
  },
  image: {
    width: '100%',
    height: 125,
    resizeMode: 'cover',
    borderRadius: 10,
  },
  typeIndicator: {
    position: 'absolute',
    top: 20,
    left: 20,
    backgroundColor: '#1B1D21',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 18,
  },
  typeText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 12,
  },
  contentContainer: {
    padding: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#1B1D21',
  },
  date: {
    fontSize: 14,
    color: '#666',
  },
  loadingContainer: {
    opacity: 0.5,
  },
  disabledContainer: {
    opacity: 0.5,
  },
  errorText: {
    color: 'red',
    fontSize: 12,
    marginTop: 4,
  },
  retryButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 5,
    elevation: 3,
  },
});

export default SoloVoiceNoteItem;
