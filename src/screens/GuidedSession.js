import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Image } from 'react-native';
import { Audio } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import {
  AudioSession,
  LiveKitRoom,
  useLocalParticipant,
  registerGlobals,
} from '@livekit/react-native';

registerGlobals();

const GuidedSession = () => {
  const [token, setToken] = useState(null);
  const [url, setUrl] = useState(null);
  const [roomName, setRoomName] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [callDuration, setCallDuration] = useState(0);

  useEffect(() => {
    const start = async () => {
      await AudioSession.startAudioSession();
    };
    start();
    return () => {
      AudioSession.stopAudioSession();
    };
  }, []);

  useEffect(() => {
    let interval;
    if (isConnected) {
      interval = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isConnected]);

  const fetchToken = async () => {
    try {
      const response = await fetch(`http://192.168.1.3:3000/api/token?roomName=${roomName}`);
      const data = await response.json();
      setToken(data.accessToken);
      setUrl(data.url);
      setRoomName(data.roomName);
      setIsConnected(true);
    } catch (error) {
      console.error('Error fetching token:', error);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  

  const handleDisconnect = useCallback(() => {
    setIsConnected(false);
    setToken(null);
    setUrl(null);
    setRoomName('');
    setCallDuration(0);
  }, []);

  if (!isConnected) {
    return (
      <LinearGradient
        colors={['#4c669f', '#3b5998', '#192f6a']}
        style={styles.gradientContainer}
      >
        <Text style={styles.title}>AI Life Coach</Text>
        <TouchableOpacity style={styles.connectButton} onPress={fetchToken}>
          <Text style={styles.connectButtonText}>Connect to Coach</Text>
        </TouchableOpacity>
      </LinearGradient>
    );
  }

  return (
    <LiveKitRoom
      serverUrl={url}
      token={token}
      connect={true}
      options={{
        adaptiveStream: { pixelDensity: 'screen' },
      }}
      audio={true}
      video={false}
    >
      <CallInterface 
        callDuration={callDuration} 
        formatTime={formatTime} 
        onDisconnect={handleDisconnect}
      />
    </LiveKitRoom>
  );
};

const CallInterface = ({ callDuration, formatTime, onDisconnect }) => {
  const { isMicrophoneEnabled, setIsMicrophoneEnabled } = useLocalParticipant();
  const navigation = useNavigation();

  const toggleMicrophone = () => {
    if (setIsMicrophoneEnabled) {
      setIsMicrophoneEnabled(!isMicrophoneEnabled);
    }
  };

  const handleNavigateAway = useCallback(() => {
    // // Navigate to the library screen
    // navigation.navigate('Library');
    // // Alternatively, to go back to the previous screen:
    navigation.goBack();
  }, [navigation]);

  const handleEndCall = async () => {
    try {
      await room.disconnect();
      onDisconnect();
    } catch (error) {
      console.error('Error disconnecting:', error);
    }
  };

  return (
    <LinearGradient
      colors={['#4c669f', '#3b5998', '#192f6a']}
      style={styles.gradientContainer}
    >
      <View style={styles.callContainer}>
        <Image
          source={{ uri: 'https://example.com/path/to/coach-image.jpg' }}
          style={styles.coachImage}
        />
        <Text style={styles.coachName}>Coach Johnson</Text>
        <Text style={styles.callDuration}>{callDuration}</Text>
        <View style={styles.controlsContainer}>
          <TouchableOpacity style={styles.controlButton} onPress={toggleMicrophone}>
            <FontAwesome name={isMicrophoneEnabled ? 'microphone' : 'microphone-slash'} size={24} color="white" />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.controlButton, styles.endCallButton]} onPress={handleNavigateAway}>
            <FontAwesome name="phone" size={24} color="white" />
          </TouchableOpacity>
        </View>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  gradientContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 20,
  },
  connectButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
  },
  connectButtonText: {
    color: 'white',
    fontSize: 18,
  },
  callContainer: {
    alignItems: 'center',
  },
  coachImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 20,
  },
  coachName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 10,
  },
  callDuration: {
    fontSize: 18,
    color: 'white',
    marginBottom: 20,
  },
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
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

export default GuidedSession;