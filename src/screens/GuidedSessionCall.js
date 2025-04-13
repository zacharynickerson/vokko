import React, { useCallback, useEffect, useState, useRef } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Alert, SafeAreaView, Modal, TextInput, FlatList } from 'react-native';
import { Audio } from 'expo-av';
import { FontAwesome } from '@expo/vector-icons';
import {
  AudioSession,
  LiveKitRoom,
  useLocalParticipant,
  useRoomContext,
  registerGlobals,
} from '@livekit/react-native';
import { API_URL, LIVEKIT_WS_URL } from '../../config/config.js';
import { heightPercentageToDP as hp, widthPercentageToDP as wp } from 'react-native-responsive-screen';
import useAuth from '../../hooks/useAuth.js';
import CallLayout from '../components/CallLayout';
import { getDatabase, ref, push, set, remove, onValue, get } from 'firebase/database';  // Ensure onValue is imported
import { db } from '../../config/firebase.js';

registerGlobals();

const GuidedSessionCall = ({ route, navigation }) => {
  const [token, setToken] = useState(null);
  const [url, setUrl] = useState(null);
  const [roomName, setRoomName] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [sessionStartTime, setSessionStartTime] = useState(null);
  const [room, setRoom] = useState(null);  // Add this state
  const [isCancelling, setIsCancelling] = useState(false);
  const { user } = useAuth();
  const [sessionContext, setSessionContext] = useState({}); // Add this state for session context
  const userInputRef = useRef(''); // Reference to store user input
  const [isConnecting, setIsConnecting] = useState(false);  // Add this state
  
  // Get the selected module and guide from route params
  const { module: selectedModule, guide: selectedGuide } = route.params;

  // Add this effect to wait for user authentication
  useEffect(() => {
    let mounted = true;

    const initSession = async () => {
      // Wait for user to be available
      if (!user || !selectedModule || !selectedGuide) {
        return;
      }

      try {
        const sessionId = Date.now().toString();
        const roomName = `${user.uid}_${selectedModule.id}_${selectedGuide.id}_${sessionId}`;
        console.log('Creating room with name:', roomName);

        // Create the URL with all necessary parameters
        const tokenUrl = new URL(`${API_URL}/api/token`);
        tokenUrl.searchParams.append('roomName', roomName);
        tokenUrl.searchParams.append('userId', user.uid);
        tokenUrl.searchParams.append('serverUrl', LIVEKIT_WS_URL);  // Use the LiveKit URL from config

        console.log('Requesting token from:', tokenUrl.toString());

        const response = await fetch(tokenUrl);
        const data = await response.json();
        console.log('Token response:', data);
        
        // Use the URL from the response
        setToken(data.accessToken);
        setUrl(data.url || LIVEKIT_WS_URL);  // Fallback to config URL if not in response
        setRoomName(roomName);
        
        // Only update state if component is still mounted
        if (mounted) {
          setIsConnected(true);
        }
      } catch (error) {
        console.error('Error fetching token:', error);
        if (mounted) {
          Alert.alert(
            'Connection Error',
            'Failed to connect to the session. Please try again.'
          );
        }
      }
    };

    initSession();

    // Cleanup function
    return () => {
      mounted = false;
      AudioSession.stopAudioSession();
    };
  }, [user, selectedModule, selectedGuide]); // Add user to dependency array

  useEffect(() => {
    let interval;
    if (isConnected) {
      interval = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isConnected]);

  useEffect(() => {
    if (isConnected) {
      setSessionStartTime(Date.now());
    }
  }, [isConnected]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatSessionTime = (startTime) => {
    if (!startTime) return '00:00';
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    return formatTime(elapsed);
  };

  // Add this function to handle room connection
  const handleRoomConnected = useCallback(async (newRoom) => {
    if (isConnecting) return;  // Prevent multiple connection attempts
    
    try {
      setIsConnecting(true);
      console.log('Room connected, enabling audio...');
      
      // Enable audio track
      await newRoom.localParticipant.enableAudio();
      
      // Wait a moment for the track to be published
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log('Audio enabled successfully');
      setRoom(newRoom);
      setIsConnected(true);
    } catch (error) {
      console.error('Error enabling audio:', error);
      // Don't show the alert since audio might still work
      console.warn('Microphone permission warning:', error);
    } finally {
      setIsConnecting(false);
    }
  }, [isConnecting]);

  // Add this effect to request audio permissions early
  useEffect(() => {
    const requestAudioPermission = async () => {
      try {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
          staysActiveInBackground: true,
          shouldDuckAndroid: true,
        });
        
        const { status } = await Audio.requestPermissionsAsync();
        if (status !== 'granted') {
          console.warn('Audio permission not granted');
        }
      } catch (error) {
        console.error('Error requesting audio permission:', error);
      }
    };

    requestAudioPermission();
  }, []);

  const handleDisconnect = useCallback(async () => {
    try {
      // Clean up the room connection
      if (room) {
        await room.disconnect();
      }
      
      // Update states
      setIsConnected(false);
      setToken(null);
      setUrl(null);
      setRoomName('');
      setCallDuration(0);
      setRoom(null);  // Clear room state
      
      // Save session data to Firebase
      if (user && selectedModule && selectedGuide) {
        // const sessionData = {
        //   moduleId: selectedModule.id,
        //   guideId: selectedGuide.id,
        //   status: 'completed',
        //   createdDate: new Date().toISOString(),
        //   userId: user.uid
        // };
        
        try {
          const database = getDatabase();
          const sessionRef = ref(database, `guidedSessions/${user.uid}`);
          // const newSessionRef = push(sessionRef);
          // await set(newSessionRef, sessionData);
          
          // Updated navigation path to match your structure
          navigation.navigate('App', {
            screen: 'Library',
            params: { refresh: true }
          });
        } catch (firebaseError) {
          console.error('Firebase error:', firebaseError);
          Alert.alert('Error', 'Failed to save session data.');
        }
      }
    } catch (error) {
      console.error('Error during disconnect:', error);
      Alert.alert('Error', 'Failed to end the session properly.');
    }
  }, [room, navigation, user, selectedModule, selectedGuide]);

  const handleCancel = async () => {
    setIsCancelling(true); // Set this first
    
    try {
      // Clean up first
      if (room) {
        await room.disconnect();
      }
      
      // // Delete the most recently created session from Firebase
      // if (user && selectedModule && selectedGuide) {
      //   const database = getDatabase();
      //   const sessionsRef = ref(database, `guidedSessions/${user.uid}`);
      //   const snapshot = await get(sessionsRef);
      //   if (snapshot.exists()) {
      //     const sessions = snapshot.val();
      //     const sessionKeys = Object.keys(sessions);
      //     const mostRecentSessionKey = sessionKeys[sessionKeys.length - 1]; // Get the last session key
      //     const mostRecentSessionRef = ref(database, `guidedSessions/${user.uid}/${mostRecentSessionKey}`);
      //     await remove(mostRecentSessionRef);
      //     console.log('Deleted the most recently created session:', mostRecentSessionKey);
      //   }
      // }

      // Reset states
      setIsConnected(false);
      setToken(null);
      setUrl(null);
      setRoomName('');
      setCallDuration(0);
      setRoom(null);
      
      // Navigate last
      navigation.reset({
        index: 0,
        routes: [{ name: 'App', params: { screen: 'HomeScreen' } }],
      });
    } catch (error) {
      console.error('Error during cancel operation:', error);
      Alert.alert('Error', 'Failed to cancel the session properly.');
    }
  };

  // Add this early return
  if (isCancelling) {
    return null; // Or a blank screen
  }

  if (!user || !selectedModule || !selectedGuide) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Initializing session...</Text>
      </View>
    );
  }

  // Define the startSession function
  const startSession = () => {
    // Logic to start the session, e.g., sending an initial message or setting up the context
    console.log('Session started');
  };

  return (
    <View style={styles.container}>
      {token && url ? (
        <LiveKitRoom
          serverUrl={url}
          token={token}
          connect={true}
          options={{
            adaptiveStream: { pixelDensity: 'screen' },
            publishDefaults: {
              audio: true,
              video: false
            },
            dynacast: true,  // Add this
            stopMicTrackOnMute: false,  // Add this
          }}
          audio={true}
          video={false}
          onConnected={handleRoomConnected}
          onError={(error) => {
            console.error('LiveKit error:', error);
            // Only show alert for non-microphone errors
            if (!error.toString().includes('microphone')) {
              Alert.alert('Connection Error', 'Failed to connect to the session.');
            }
          }}
        >
          <CallLayout
            isGuidedSession={true}
            guideName={selectedGuide?.name}
            moduleName={selectedModule?.name}
            guidePhoto={selectedGuide?.photoURL}
            sessionTime={formatSessionTime(sessionStartTime)}
            gradientColor={selectedGuide?.gradientColor || '#4A90E2'}
          />
          
          <SafeAreaView style={styles.controlsContainer}>
            <View style={styles.buttonContainer}>
              <CallInterface
                formatTime={formatTime}
                onDisconnect={handleDisconnect}
                onCancel={handleCancel}
                room={room}
                guideName={selectedGuide?.name}
              />
            </View>
          </SafeAreaView>
        </LiveKitRoom>
      ) : (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Connecting to session...</Text>
        </View>
      )}
    </View>
  );
};

const CallInterface = ({ formatTime, onDisconnect, onCancel, room, guideName }) => {
  const handleCancelPress = () => {
    Alert.alert(
      'Cancel Session?',
      'Are you sure you want to cancel this session? This action cannot be undone.',
      [
        {
          text: 'No, Keep Session',
          style: 'cancel',
        },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: onCancel,
        },
      ]
    );
  };

  return (
    <View style={styles.callControls}>
      <TouchableOpacity 
        style={styles.controlButton} 
        onPress={handleCancelPress}
      >
        <FontAwesome name="trash" size={24} color="white" />
      </TouchableOpacity>
      <TouchableOpacity 
        style={[styles.controlButton, styles.endCallButton]} 
        onPress={onDisconnect}
      >
        <FontAwesome name="phone" size={24} color="white" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#191A23',  // Match the background color
  },
  controlsContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: 'white',
    fontSize: wp(4),
  },
  callControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  controlButton: {
    backgroundColor: 'rgba(255,255,255,0.3)',
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 10,
  },
  endCallButton: {
    backgroundColor: '#FF3B30',
  },
});

export default GuidedSessionCall;