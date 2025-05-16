import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, SafeAreaView, Pressable, StyleSheet, Alert } from 'react-native';
import { Audio } from 'expo-av';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import { auth, saveToFirebaseStorage, createVoiceNote, updateVoiceNote, functions, httpsCallable } from '../../config/firebase';
import * as Location from 'expo-location';

import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { heightPercentageToDP as hp, widthPercentageToDP as wp } from 'react-native-responsive-screen';
import CallLayout from '../components/CallLayout';
import { generateUUID, getFileSize, getLocation, getCurrentDate } from '../utilities/helpers';
import * as FileSystem from 'expo-file-system';
import { increment } from 'firebase/database'; // Import increment from Firebase client SDK
import { ref as dbRef, remove } from 'firebase/database';
import { db } from '../../config/firebase'; // Ensure this path is correct
import { CommonActions } from '@react-navigation/native'; // Ensure this is imported
import { ref, get } from 'firebase/database';

const CHUNK_DURATION = 60000; // 1 minute chunks
const MAX_RECORDING_DURATION = 1200000; // 20 minutes

export default function SoloSessionCall() {
  const [recording, setRecording] = useState(null);
  const [isPaused, setIsPaused] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [location, setLocation] = useState(null);
  const navigation = useNavigation();
  const [userProfile, setUserProfile] = useState(null);
  const [userPhoto, setUserPhoto] = useState(null);

  const [permissionResponse, requestPermission] = Audio.usePermissions();
  const [voiceNotes, setVoiceNotes] = useState([]);
  const metering = useSharedValue(-100);  
  const [sessionTime, setSessionTime] = useState('00:00');

  const recordingRef = useRef(null);
  const timerRef = useRef(null);
  const voiceNoteIdRef = useRef(null);
  const chunkCountRef = useRef(0);
  const locationUpdateTimeoutRef = useRef(null);
  const lastLocationRef = useRef(null);
  const mapUrlCacheRef = useRef(new Map());

  // Memoize location update to prevent unnecessary re-renders
  const updateLocation = useCallback(async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const newLocation = await Location.getCurrentPositionAsync({});
        
        // Only update if location has changed significantly (more than 10 meters)
        if (!lastLocationRef.current || 
            calculateDistance(
              lastLocationRef.current.coords.latitude,
              lastLocationRef.current.coords.longitude,
              newLocation.coords.latitude,
              newLocation.coords.longitude
            ) > 10) {
          lastLocationRef.current = newLocation;
          setLocation(newLocation);
        }
      }
    } catch (error) {
      console.error('Error getting location:', error);
    }
  }, []);

  // Helper function to calculate distance between coordinates in meters
  function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = lat1 * Math.PI/180;
    const φ2 = lat2 * Math.PI/180;
    const Δφ = (lat2-lat1) * Math.PI/180;
    const Δλ = (lon2-lon1) * Math.PI/180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c;
  }

  // Cache map URLs to prevent unnecessary regeneration
  function getMapUrl(latitude, longitude) {
    const key = `${latitude},${longitude}`;
    if (mapUrlCacheRef.current.has(key)) {
      return mapUrlCacheRef.current.get(key);
    }
    
    const url = `https://api.mapbox.com/styles/v1/mapbox/dark-v11/static/${longitude},${latitude},14/400x200?access_token=${process.env.MAPBOX_TOKEN}`;
    mapUrlCacheRef.current.set(key, url);
    return url;
  }

  // Update location periodically while recording
  useEffect(() => {
    if (recording) {
      // Initial location update
      updateLocation();

      // Set up periodic updates (every 10 seconds instead of 5)
      locationUpdateTimeoutRef.current = setInterval(updateLocation, 10000);

      return () => {
        if (locationUpdateTimeoutRef.current) {
          clearInterval(locationUpdateTimeoutRef.current);
          locationUpdateTimeoutRef.current = null;
        }
      };
    }
  }, [recording, updateLocation]);

  // Fetch user profile data including photo URL
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        if (auth.currentUser) {
          const userRef = ref(db, `users/${auth.currentUser.uid}`);
          const snapshot = await get(userRef);
          
          if (snapshot.exists()) {
            const userData = snapshot.val();
            setUserProfile(userData);
            
            // Set the user's photo URL if available
            if (userData.photoURL) {
              setUserPhoto(userData.photoURL);
            }
          }
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
      }
    };
    
    fetchUserProfile();
  }, []);

  useEffect(() => {
    // const loadVoiceNotes = async () => {
    //   const storedVoiceNotes = await getVoiceNotesFromLocal();
    //   setVoiceNotes(storedVoiceNotes);
    // };
    // loadVoiceNotes();

    // Cleanup function to reset audio mode when component unmounts
    return async () => {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
      });
    };
  }, []);

  useEffect(() => {
    if (recording) {
      recordingTextOpacity.value = withTiming(1, { duration: 300 });
      readyTextOpacity.value = withTiming(0, { duration: 300 });
      buttonOpacity.value = withTiming(1, { duration: 300 });
      buttonScale.value = withTiming(1, { duration: 300 });
    } else {
      recordingTextOpacity.value = withTiming(0, { duration: 300 });
      readyTextOpacity.value = withTiming(1, { duration: 300 });
      buttonOpacity.value = withTiming(0, { duration: 300 });
      buttonScale.value = withTiming(0.5, { duration: 300 });
    }
  }, [recording]);

  useEffect(() => {
    let interval;
    if (recording) {
      let seconds = 0;
      interval = setInterval(() => {
        seconds++;
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        setSessionTime(`${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [recording]);

  // Animation values
  const recordingTextOpacity = useSharedValue(0);
  const readyTextOpacity = useSharedValue(1);
  const buttonOpacity = useSharedValue(0);
  const buttonScale = useSharedValue(0.5);

  const animatedRecordingTextStyle = useAnimatedStyle(() => {
    return {
      opacity: recordingTextOpacity.value,
      zIndex: 1, // Ensure recording text is above the subtext
    };
  });

  const animatedReadyTextStyle = useAnimatedStyle(() => {
    return {
      opacity: readyTextOpacity.value,
    };
  });

  const animatedButtonStyle = useAnimatedStyle(() => {
    return {
      opacity: buttonOpacity.value,
      transform: [{ scale: buttonScale.value }],
    };
  });

  async function startRecording() {
    if (recordingRef.current) {
      console.log('Recording already in progress');
      return;
    }

    try {
    // Check for audio recording permission
    const { status } = await Audio.requestPermissionsAsync();
    if (status !== 'granted') {
        Alert.alert('Permission required', 'You need to grant permission to use audio recording.');
        return;
    }

      console.log('Starting recording...');

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false
      });

      console.log('Creating new recording');
      const { recording: newRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      
      recordingRef.current = newRecording;
      setRecording(newRecording);
      
      // Create voice note entry in Firebase
      voiceNoteIdRef.current = await createVoiceNote(auth.currentUser.uid, {
        status: 'recording',
        totalDuration: 0,
        totalChunks: 0,
        location: location ? {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude
        } : null
      });
      
      startChunkUpload();
    } catch (err) {
      console.error('Failed to start recording', err);
      Alert.alert('Error', 'Failed to start recording. Please try again.');
    }
  }

  function startChunkUpload() {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    timerRef.current = setInterval(async () => {
      if (recordingRef.current && !isPaused) {
        await processChunk();
      }
    }, CHUNK_DURATION);
  }

  async function processChunk() {
    if (!recordingRef.current) return;

    try {
      const uri = recordingRef.current.getURI();
      const status = await recordingRef.current.getStatusAsync();
      
      // Only process if we have actual audio data
      if (status.durationMillis > 0) {
      await recordingRef.current.stopAndUnloadAsync();

      const base64Data = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
      await uploadChunk(base64Data, status.durationMillis);

      if (status.durationMillis >= MAX_RECORDING_DURATION) {
        await stopRecording();
          return;
        }

        // Start new recording segment
        const newRecording = new Audio.Recording();
        await newRecording.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
        await newRecording.startAsync();
        recordingRef.current = newRecording;
      }
    } catch (error) {
      console.error('Error processing chunk:', error);
      // If there's an error, try to recover by starting a new recording segment
      try {
        const newRecording = new Audio.Recording();
        await newRecording.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
        await newRecording.startAsync();
        recordingRef.current = newRecording;
      } catch (recoveryError) {
        console.error('Failed to recover from chunk processing error:', recoveryError);
        await stopRecording();
      }
    }
  }

  async function uploadChunk(base64Data, duration) {
    try {
      console.log('Starting chunk upload. Data length:', base64Data.length);
      const chunkFileName = `${chunkCountRef.current}.m4a`;
      console.log('Chunk file name:', chunkFileName);
      
      const downloadUrl = await saveToFirebaseStorage(base64Data, `users/${auth.currentUser.uid}/voiceNotes/${voiceNoteIdRef.current}/chunks/${chunkFileName}`);
      console.log('Chunk uploaded successfully. Download URL:', downloadUrl);
      
      // Update the voice note with the new chunk info
      const updates = {
        [`chunks/${chunkCountRef.current}`]: {
          duration: duration,
          url: downloadUrl
        },
        totalChunks: chunkCountRef.current + 1,
        totalDuration: increment(duration)
      };
      
      await updateVoiceNote(auth.currentUser.uid, voiceNoteIdRef.current, updates);
      console.log('Voice note updated with new chunk info');
      
      chunkCountRef.current += 1;
    } catch (error) {
      console.error('Error uploading chunk:', error);
      if (error.message) {
        console.error('Error message:', error.message);
      }
    }
  }

  async function stopRecording() {
    try {
      console.log('Stopping recording...');
      
      // Clear all timers
      if (timerRef.current) {
      clearInterval(timerRef.current);
        timerRef.current = null;
      }
      
      if (locationUpdateTimeoutRef.current) {
        clearInterval(locationUpdateTimeoutRef.current);
        locationUpdateTimeoutRef.current = null;
      }

      // Process final chunk if recording exists
      if (recordingRef.current) {
        await processChunk();
        recordingRef.current = null;
      }

      // Update states
      setRecording(null);
      setIsPaused(false);
      
      // Update Firebase status
      if (voiceNoteIdRef.current) {
      await updateVoiceNote(auth.currentUser.uid, voiceNoteIdRef.current, {
        status: 'processing',
        processingStartedAt: new Date().toISOString(), 
      });
      }

      // Reset audio mode
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
      });

      // Navigate to library
      navigation.navigate('Library', { screen: 'LibraryScreen' });
    } catch (error) {
      console.error('Error stopping recording:', error);
      
      // Update Firebase with error status
      if (voiceNoteIdRef.current) {
      await updateVoiceNote(auth.currentUser.uid, voiceNoteIdRef.current, {
        status: 'error',
        errorDetails: {
          error: `Recording stop error: ${error.message}`,
          timestamp: new Date().toISOString()
        }
      });
      }

      // Navigate to library to show error
      navigation.navigate('Library', { 
        screen: 'LibraryScreen', 
        params: { refresh: true } 
      });
    }
  }

  async function pauseRecording() {
    if (recording) {
      await recording.pauseAsync();
      setIsPaused(true);
    }
  }

  async function resumeRecording() {
    if (recording) {
      await recording.startAsync();
      setIsPaused(false);
    }
  }

  async function cancelRecording() {
    Alert.alert(
      "Cancel Recording",
      "Are you sure you want to cancel the recording? This action cannot be undone.",
      [
        {
          text: "No",
          style: "cancel"
        },
        {
          text: "Yes",
          onPress: async () => {
            try {
              // Clear all timers
              if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
              }
              
              if (locationUpdateTimeoutRef.current) {
                clearInterval(locationUpdateTimeoutRef.current);
                locationUpdateTimeoutRef.current = null;
              }

              // Stop and unload recording
            if (recordingRef.current) {
              await recordingRef.current.stopAndUnloadAsync();
              recordingRef.current = null;
              }

              // Reset states
              setRecording(null);
              setIsPaused(false);

              // Delete from Firebase
              if (voiceNoteIdRef.current) {
              const voiceNoteDbRef = dbRef(db, `voiceNotes/${auth.currentUser.uid}/${voiceNoteIdRef.current}`);
              await remove(voiceNoteDbRef);
            }

              // Reset audio mode
            await Audio.setAudioModeAsync({
              allowsRecordingIOS: false,
              playsInSilentModeIOS: true,
              staysActiveInBackground: false,
            });

            console.log('Attempting to navigate to Home');
            navigation.navigate('Home');
            console.log('Navigation dispatched');
            } catch (error) {
              console.error('Error canceling recording:', error);
              Alert.alert('Error', 'Failed to cancel recording properly.');
            }
          }
        }
      ],
      { cancelable: false }
    );
  }

  // Add this function to compress the audio
  async function compressAudioFile(uri) {
    console.log('Starting audio compression...');
    try {
      const info = await FileSystem.getInfoAsync(uri);
      console.log('Original file size:', info.size);

      const outputUri = `${FileSystem.cacheDirectory}compressed_audio.m4a`;

      const options = {
        android: {
          extension: '.m4a',
          outputFormat: Audio.RECORDING_OPTION_ANDROID_OUTPUT_FORMAT_MPEG_4,
          audioEncoder: Audio.RECORDING_OPTION_ANDROID_AUDIO_ENCODER_AAC,
          sampleRate: 44100,
          numberOfChannels: 2,
          bitRate: 128000,
        },
        ios: {
          extension: '.m4a',
          outputFormat: Audio.RECORDING_OPTION_IOS_OUTPUT_FORMAT_MPEG4AAC,
          audioQuality: Audio.RECORDING_OPTION_IOS_AUDIO_QUALITY_MEDIUM,
          sampleRate: 44100,
          numberOfChannels: 2,
          bitRate: 128000,
          linearPCMBitDepth: 16,
          linearPCMIsBigEndian: false,
          linearPCMIsFloat: false,
        },
      };

      const { sound, status } = await Audio.Sound.createAsync(
        { uri: uri },
        { volume: 1.0, progressUpdateIntervalMillis: 1000 }
      );

      await Audio.enableAudioExperienceIOSAsync();

      const recording = new Audio.Recording();
      await recording.prepareToRecordAsync(options);
      await recording.startAsync();

      await sound.playAsync();

      sound.setOnPlaybackStatusUpdate(async (playbackStatus) => {
        if (playbackStatus.didJustFinish) {
          await recording.stopAndUnloadAsync();
          await sound.unloadAsync();

          const compressedInfo = await FileSystem.getInfoAsync(outputUri);
          console.log('Compressed file size:', compressedInfo.size);

          if (compressedInfo.size > info.size) {
            console.log('Compressed file is larger, using original file');
            return uri;
          }

          console.log('Audio compression completed');
          return outputUri;
        }
      });

      return new Promise((resolve) => {
        const checkCompressionStatus = setInterval(async () => {
          const recordingStatus = await recording.getStatusAsync();
          if (!recordingStatus.isRecording) {
            clearInterval(checkCompressionStatus);
            resolve(outputUri);
          }
        }, 1000);
      });

    } catch (error) {
      console.error('Error compressing audio:', error);
      return uri; // Return the original URI if compression fails
    }
  }

  return (
    <View style={styles.container}>
      <CallLayout
        isGuidedSession={false}
        userFirstName={userProfile?.name?.split(' ')[0] || "User"}
        userLastName={userProfile?.name?.split(' ').slice(1).join(' ') || ""}
        userProfilePhoto={userPhoto || require('../../assets/images/user-photo.png')}
        sessionTime={sessionTime}
        location={location?.coords}
      />
      
      <SafeAreaView style={styles.controlsContainer}>
            <View style={styles.buttonContainer}>
              {recording && (
                <Animated.View style={[styles.controlButton, { left: wp(10) }, animatedButtonStyle]}>
                  <Pressable onPress={cancelRecording}>
                    <Icon name="close" size={30} color="white" />
                  </Pressable>
                </Animated.View>
              )}
              <Pressable
                style={[
                  styles.recordButton,
                  { backgroundColor: recording ? '#FF3B30' : '#4CAF50' }
                ]}
                onPress={recording ? (isPaused ? resumeRecording : pauseRecording) : startRecording}
              >
                {recording ? (
                  isPaused ? (
                    <Icon name="play" size={30} color="white" />
                  ) : (
                    <Icon name="pause" size={30} color="white" />
                  )
                ) : (
                  <Icon name="mic" size={30} color="white" />
                )}
              </Pressable>
              {recording && (
                <Animated.View style={[styles.controlButton, { right: wp(10) }, animatedButtonStyle]}>
                  <Pressable onPress={stopRecording}>
                    <Icon name="checkmark" size={30} color="white" />
                  </Pressable>
                </Animated.View>
              )}
            </View>
      </SafeAreaView>
    </View> 
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#191A23',
  },
  controlsContainer: {
    position: 'absolute',
    bottom: hp(10), // Increased this value to move the buttons up
    left: 0,
    right: 0,
    paddingBottom: hp(5),
  },
  waveformContainer: {
    height: hp(20),
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: hp(2),
  },
  recordButton: {
    width: wp(15),
    height: wp(15),
    borderRadius: wp(7.5),
    backgroundColor: '#9D3033',
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlButton: {
    position: 'absolute',
    width: wp(12),
    height: wp(12),
    borderRadius: wp(6),
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
