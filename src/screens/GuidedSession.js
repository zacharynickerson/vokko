import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { Audio } from 'expo-av';
import { FontAwesome } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import {
  AudioSession,
  LiveKitRoom,
  useLocalParticipant,
  useRoomContext,
  RoomProvider,
  registerGlobals,
} from '@livekit/react-native';
import { API_URL } from '/Users/zacharynickerson/Desktop/vokko/config/config.js';
import { heightPercentageToDP as hp, widthPercentageToDP as wp } from 'react-native-responsive-screen';

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
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        interruptionModeIOS: 1,
        shouldDuckAndroid: true,
        interruptionModeAndroid: 1,
        playThroughEarpieceAndroid: false,
      });
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
      const response = await fetch(`${API_URL}/api/token?roomName=${roomName}`, {
        timeout: 5000
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
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

  const handleDisconnect = useCallback(async () => {
    setIsConnected(false);
    setToken(null);
    setUrl(null);
    setRoomName('');
    setCallDuration(0);
  }, [roomName]);

  if (!isConnected) {
    return (
      <View style={styles.gradientContainer}>
        <Text style={styles.title}>AI Life Coach</Text>
        <TouchableOpacity style={styles.connectButton} onPress={fetchToken}>
          <Text style={styles.connectButtonText}>Connect to Coach</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.gradientContainer}>
      {token && url ? (
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
      ) : null}
    </View>
  );
};

const CallInterface = ({ callDuration, formatTime, onDisconnect }) => {
  const { isMicrophoneEnabled, setIsMicrophoneEnabled } = useLocalParticipant();
  const navigation = useNavigation();
  const room = useRoomContext();

  useEffect(() => {
    const handleDataReceived = (payload, participant) => {
      try {
        const message = JSON.parse(payload);
      } catch (error) {
        console.error('Error parsing received data:', error);
      }
    };

    if (room) {
      room.on('dataReceived', handleDataReceived);
    }

    return () => {
      if (room) {
        room.off('dataReceived', handleDataReceived);
      }
    };
  }, [room]);

  const toggleMicrophone = () => {
    if (setIsMicrophoneEnabled) {
      setIsMicrophoneEnabled(!isMicrophoneEnabled);
    }
  };

  const handleEndCall = useCallback(async () => {
    try {
      if (room) {
        await room.disconnect();
      }
      onDisconnect();
    } catch (error) {
      console.error('Error disconnecting:', error);
    }
  }, [room, onDisconnect]);

  return (
    <View style={styles.callContainer}>
      <Text style={styles.coachName}>Coach Johnson</Text>
      <Text style={styles.callDuration}>{formatTime(callDuration)}</Text>
      <View style={styles.controlsContainer}>
        <TouchableOpacity style={styles.controlButton} onPress={toggleMicrophone}>
          <FontAwesome name={isMicrophoneEnabled ? 'microphone' : 'microphone-slash'} size={24} color="white" />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.controlButton, styles.endCallButton]} onPress={handleEndCall}>
          <FontAwesome name="phone" size={24} color="white" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  gradientContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#191A23',
  },
  title: {
    fontSize: wp(5),
    color: '#fff',
    fontWeight: 'bold',
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
    fontSize: wp(4),
  },
  callContainer: {
    alignItems: 'center',
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