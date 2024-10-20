import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { formatDateForDisplay } from '../utilities/helpers';

const SoloVoiceNoteItem = ({ item, onPress, isLoading }) => {
  const isClickable = item.status === 'completed' || item.status === 'error';

  return (
    <TouchableOpacity 
      style={[
        styles.container, 
        isLoading && styles.loadingContainer,
        !isClickable && styles.disabledContainer
      ]}
      onPress={isClickable ? onPress : null}
      disabled={!isClickable}
    >
      <View style={styles.imageContainer}>
        <Image 
          source={item.image ? { uri: item.image } : require('/Users/zacharynickerson/Desktop/vokko/assets/images/default-note-image.png')} 
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
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 16,
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
    top: 20, // Changed from 30 to 20 to match GuidedSessionItem
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
});

export default SoloVoiceNoteItem;
