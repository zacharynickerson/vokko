import React, { useMemo, useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { formatDateForDisplay } from '../utilities/helpers';
import { getStaticMapUrl } from '../config/maps';
import PropTypes from 'prop-types';

// Define threshold (e.g., 4 minutes in milliseconds)
const STUCK_PROCESSING_THRESHOLD_MS = 4 * 60 * 1000; 

// Helper function to strip HTML tags
const stripHtmlTags = (html) => {
  if (!html) return '';
  return html.replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

const SoloVoiceNoteItem = ({ item, onPress, onRetry, onDelete, enableMapClick = false, isDetailView = false }) => {
  const { status, createdDate, title, location, summary, processingStartedAt, errorDetails } = item;

  const isCompleted = status === 'completed';
  const hasError = status === 'error';
  const isProcessing = status === 'processing';
  const isRecording = status === 'recording';

  // Calculate if processing is stuck
  const isStuckProcessing = useMemo(() => {
    if (isProcessing && processingStartedAt) {
      const processingStartTime = new Date(processingStartedAt).getTime();
      return (Date.now() - processingStartTime) > STUCK_PROCESSING_THRESHOLD_MS;
    }
    return false;
  }, [isProcessing, processingStartedAt]);

  const displayTitle = useMemo(() => {
    if (isCompleted) return title || 'Untitled Note';
    if (isProcessing) return 'Processing...';
    if (hasError) return 'Upload Failed';
    if (isRecording) return 'Recording...';
    return 'Unknown Status';
  }, [status, title]);

  // Determine if the item should show actions (Retry/Delete)
  const showActions = hasError || isStuckProcessing;
  // Determine if item is clickable (any non-loading state)
  const isClickable = !isProcessing && !isRecording;
  // Determine loading/disabled appearance
  const isLoadingStyle = isProcessing || isRecording;

  const hasLocation = useMemo(() => {
    return location?.latitude && location?.longitude;
  }, [location]);

  const mapImageUrl = useMemo(() => {
    if (!hasLocation) return null;
    return getStaticMapUrl(location.latitude, location.longitude);
  }, [location, hasLocation]);

  const cleanSummary = useMemo(() => {
    return stripHtmlTags(summary);
  }, [summary]);

  const [mapImageError, setMapImageError] = useState(false);

  useEffect(() => {
    setMapImageError(false);
  }, [location]);

  // Get marker color based on status
  const getMarkerColor = () => {
    if (isCompleted) return '#4CAF50';
    if (hasError) return '#FF4D4F';
    if (isProcessing) return '#FFA500';
    if (isRecording) return '#2196F3';
    return '#FF4D4F';
  };

  // Render the map with or without clickability
  const renderMap = () => {
    if (!hasLocation || mapImageError) {
      return (
        <View style={styles.mapContainer}>
          <Image 
            source={require('../../assets/images/default-note-image.png')} 
            style={styles.mapImage}
            resizeMode="cover"
          />
        </View>
      );
    }

    return (
      <View style={styles.mapContainer}>
        <Image 
          source={{ uri: mapImageUrl }} 
          style={styles.mapImage}
          resizeMode="cover"
          onError={() => setMapImageError(true)}
          onLoad={() => setMapImageError(false)}
        />
        <View style={styles.mapOverlay}>
          <MaterialCommunityIcons 
            name="map-marker" 
            size={24} 
            color={getMarkerColor()} 
          />
        </View>
      </View>
    );
  };

  return (
    <View style={[
      styles.container,
      isDetailView && styles.detailViewContainer
    ]}>
      <TouchableOpacity
        style={[
          styles.touchableContainer,
          isLoadingStyle && styles.loadingContainer,
          hasError && styles.errorContainer,
          !isClickable && !showActions && styles.disabledContainer
        ]}
        onPress={isClickable ? onPress : null}
        disabled={!isClickable}
      >
        <View style={styles.imageContainer}>
          {renderMap()}
        </View>
        <View style={styles.contentContainer}>
          <Text style={styles.title} numberOfLines={2}>{displayTitle}</Text>
          <Text style={styles.date}>{formatDateForDisplay(createdDate)}</Text>
          
          {showActions && <View style={styles.actionsDivider} />}
          
          {showActions && (
            <View style={styles.actionsRowContainer}>
              {hasError && (
                <Text style={[styles.errorText, styles.statusText]}>
                  {errorDetails?.error || 'An error occurred.'}
                </Text>
              )}
              {isStuckProcessing && (
                <Text style={[styles.processingText, styles.statusText]}>
                  Processing seems stuck.
                </Text>
              )}
              
              <TouchableOpacity style={styles.actionButtonInternal} onPress={onRetry}>
                 <Text style={styles.retryTextInternal}>Retry</Text>
              </TouchableOpacity>
              
              {hasError && ( 
                <>
                  <View style={styles.actionSeparator} />
                  <TouchableOpacity style={styles.actionButtonInternal} onPress={onDelete}>
                    <Text style={styles.deleteTextInternal}>Delete</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          )}
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  detailViewContainer: {
    marginBottom: 0,
    paddingHorizontal: 0,
    paddingTop: 0,
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
    height: 100,
    width: '100%',
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
  mapOverlay: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginLeft: -12,
    marginTop: -24,
  },
  addressContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    padding: 4,
  },
  addressText: {
    color: 'white',
    fontSize: 10,
    textAlign: 'center',
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
    marginBottom: 8,
  },
  actionsDivider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginTop: 12,
    marginBottom: 8,
  },
  actionsRowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  statusText: {
    flex: 1,
    marginRight: 8,
  },
  errorText: {
    color: '#FF4D4F',
    fontSize: 12,
  },
  processingText: {
    color: '#FFA500',
    fontSize: 12,
  },
  actionButtonInternal: {
    paddingVertical: 4,
    paddingHorizontal: 4,
  },
  actionSeparator: {
    width: 1,
    height: '60%',
    backgroundColor: '#E0E0E0',
    marginHorizontal: 8,
  },
  retryTextInternal: {
    color: '#4CAF50',
    fontSize: 13,
    fontWeight: 'bold',
  },
  deleteTextInternal: {
    color: '#FF4D4F',
    fontSize: 13,
    fontWeight: 'bold',
  },
  loadingContainer: {
    opacity: 0.7, 
  },
  disabledContainer: {
    opacity: 0.5, 
  },
  errorContainer: {
    backgroundColor: '#FFF1F0',
    borderColor: '#FF4D4F',
    borderWidth: 1,
  },
});

SoloVoiceNoteItem.propTypes = {
  item: PropTypes.shape({
    status: PropTypes.oneOf(['completed', 'error', 'processing', 'recording', 'transcribed']).isRequired,
    createdDate: PropTypes.string.isRequired,
    title: PropTypes.string,
    location: PropTypes.shape({
      latitude: PropTypes.number,
      longitude: PropTypes.number,
      address: PropTypes.string,
      placeName: PropTypes.string,
    }),
    summary: PropTypes.string,
    processingStartedAt: PropTypes.string,
    errorDetails: PropTypes.shape({
      error: PropTypes.string,
    }),
  }).isRequired,
  onPress: PropTypes.func,
  onRetry: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  enableMapClick: PropTypes.bool,
  isDetailView: PropTypes.bool
};

export default SoloVoiceNoteItem;
