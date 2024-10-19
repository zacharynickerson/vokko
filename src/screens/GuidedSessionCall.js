import React, { useState, useEffect, useCallback } from 'react';
import { View, SafeAreaView, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { useNavigation, useRoute, CommonActions } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import { heightPercentageToDP as hp, widthPercentageToDP as wp } from 'react-native-responsive-screen';
import CallLayout from '../components/CallLayout';
import { Audio } from 'expo-av';
import { AudioSession, LiveKitRoom, useLocalParticipant, useRoomContext } from '@livekit/react-native';
import { API_URL } from '/Users/zacharynickerson/Desktop/vokko/config/config.js';

const images = {
  'Avatar Female 6.png': require('../../assets/images/Avatar Female 6.png'),
  'Avatar Male 9.png': require('../../assets/images/Avatar Male 9.png'),
  'Avatar Female 13.png': require('../../assets/images/Avatar Female 13.png'),
  'Avatar Male 14.png': require('../../assets/images/Avatar Male 14.png'),
  'Avatar Female 1.png': require('../../assets/images/Avatar Female 1.png'),
  'Avatar Male 2.png': require('../../assets/images/Avatar Male 2.png'),
  // Add all other image filenames here
};

const getImageSource = (imageName) => {
  return images[imageName] || require('../../assets/images/user-photo.png');
};

export default function GuidedSessionCall() {
  const navigation = useNavigation();
  const route = useRoute();
  const [sessionTime, setSessionTime] = useState(0);
  const [token, setToken] = useState(null);
  const [url, setUrl] = useState(null);
  const [roomName, setRoomName] = useState('');
  const [isConnected, setIsConnected] = useState(false);

  // Extract guide, module, and userId information from route params
  const { guide, module, userId } = route.params;

  useEffect(() => {
    const setupAudioSession = async () => {
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
    setupAudioSession();
    return () => {
      AudioSession.stopAudioSession();
    };
  }, []);

  useEffect(() => {
    let interval;
    if (isConnected) {
      interval = setInterval(() => {
        setSessionTime((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isConnected]);

  useEffect(() => {
    fetchToken();
  }, []);

  const fetchToken = async () => {
    if (!module || !userId) {
      console.error('No module selected or no authenticated user');
      return;
    }

    try {
      const sessionId = Date.now().toString();
      const roomName = `${userId}_${module.id}_${guide.id}_${sessionId}`;

      const response = await fetch(`${API_URL}/api/token?roomName=${roomName}&userId=${userId}`, {
        timeout: 5000
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setToken(data.accessToken);
      setUrl(data.url);
      setRoomName(roomName);
      setIsConnected(true);
    } catch (error) {
      console.error('Error fetching token:', error);
    }
  };

  const handleCancel = useCallback(async () => {
    setIsConnected(false);
    setToken(null);
    setUrl(null);
    setRoomName('');
    setSessionTime(0);
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [
          { 
            name: 'App',
            state: {
              routes: [{ name: 'Home' }],
              index: 0,
            }
          },
        ],
      })
    );
  }, [navigation]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
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
          }}
          audio={true}
          video={false}
        >
          <CallLayout
            isGuidedSession={true}
            guideName={guide.name}
            moduleName={module.name}
            guidePhoto={getImageSource(guide.mainPhoto)}
            sessionTime={formatTime(sessionTime)}
            gradientColor={guide.backgroundColor}
          />
          <CallControls onCancel={handleCancel} />
        </LiveKitRoom>
      ) : (
        <CallLayout
          isGuidedSession={true}
          guideName={guide.name}
          moduleName={module.name}
          guidePhoto={getImageSource(guide.mainPhoto)}
          sessionTime="00:00"
          gradientColor={guide.backgroundColor}
        />
      )}
    </View>
  );
}

const CallControls = ({ onCancel }) => {
  const { isMicrophoneEnabled, setIsMicrophoneEnabled } = useLocalParticipant();
  const room = useRoomContext();

  useEffect(() => {
    const handleDataReceived = (payload, participant) => {
      try {
        const message = JSON.parse(payload);
        // Handle incoming messages here
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
      onCancel();
    } catch (error) {
      console.error('Error disconnecting:', error);
    }
  }, [room, onCancel]);

  return (
    <SafeAreaView style={styles.controlsContainer}>
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.controlButton}
          onPress={toggleMicrophone}
        >
          <Icon name={isMicrophoneEnabled ? "mic" : "mic-off"} size={30} color="white" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={handleEndCall}
        >
          <Icon name="close" size={30} color="white" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#191A23',
  },
  controlsContainer: {
    position: 'absolute',
    bottom: hp(10),
    left: 0,
    right: 0,
    paddingBottom: hp(5),
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: hp(2),
  },
  controlButton: {
    width: wp(15),
    height: wp(15),
    borderRadius: wp(7.5),
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: wp(4),
  },
  cancelButton: {
    width: wp(15),
    height: wp(15),
    borderRadius: wp(7.5),
    backgroundColor: '#9D3033',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
