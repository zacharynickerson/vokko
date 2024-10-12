import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, FlatList } from 'react-native';
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
import { getModules, getModuleWithCoach } from '/Users/zacharynickerson/Desktop/vokko/config/firebase.js';
import useAuth from '/Users/zacharynickerson/Desktop/vokko/hooks/useAuth.js';

registerGlobals();

const GuidedSession = () => {
  const [token, setToken] = useState(null);
  const [url, setUrl] = useState(null);
  const [roomName, setRoomName] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [modules, setModules] = useState([]);
  const [selectedModule, setSelectedModule] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    const fetchModules = async () => {
      try {
        const fetchedModules = await getModules();
        setModules(Object.values(fetchedModules || {}));
      } catch (error) {
        console.error('Error fetching modules:', error);
      }
    };

    fetchModules();
  }, []);

  const handleModuleSelect = (module) => {
    setSelectedModule(prevSelected => 
      prevSelected && prevSelected.id === module.id ? null : module
    );
  };

  const ModuleItem = ({ module, onSelect, isSelected }) => (
    <TouchableOpacity
      style={[styles.item, isSelected && styles.selectedItem]}
      onPress={() => onSelect(module)}
    >
      <Text style={styles.itemText}>{module.name}</Text>
      <Text style={styles.itemSubText}>{module.description}</Text>
    </TouchableOpacity>
  );

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
    if (!selectedModule || !user) {
      console.error('No module selected or no authenticated user');
      return;
    }
  
    try {
      console.log('Selected module:', selectedModule);
      const moduleWithCoach = await getModuleWithCoach(selectedModule.id);
      console.log('Module with coach:', moduleWithCoach);
  
      if (!moduleWithCoach || !moduleWithCoach.coach) {
        throw new Error('Module or coach not found');
      }
  
      const sessionId = Date.now().toString(); // Generate a unique session ID
      const roomName = `${user.uid}_${selectedModule.id}_${moduleWithCoach.coach.id}_${sessionId}`;
  
      const response = await fetch(`${API_URL}/api/token?roomName=${roomName}&userId=${user.uid}`, {
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
        <View style={styles.centeredContent}>
          <Text style={styles.title}>AI Life Coach</Text>
          
          <Text style={styles.sectionTitle}>Select a Module:</Text>
          <FlatList
            style={styles.moduleList}
            data={modules}
            renderItem={({ item }) => (
              <ModuleItem
                module={item}
                onSelect={handleModuleSelect}
                isSelected={selectedModule && selectedModule.id === item.id}
              />
            )}
            keyExtractor={(item, index) => {
              if (item.id) {
                return item.id.toString();
              }
              return index.toString();
            }}
          />

          <TouchableOpacity
            style={[
              styles.connectButton, 
              (!selectedModule || !user) && styles.disabledButton
            ]}
            onPress={fetchToken}
            disabled={!selectedModule || !user}
          >
            <Text style={styles.connectButtonText}>
              {user ? 'Start Session' : 'Please log in to start a session'}
            </Text>
          </TouchableOpacity>
        </View>
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
      <View style={styles.callContent}>
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
    </View>
  );
};

const styles = StyleSheet.create({
  item: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    padding: 15,
    marginVertical: 5,
    borderRadius: 5,
    width: '90%',
    alignSelf: 'center',
  },
  selectedItem: {
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  itemText: {
    color: '#fff',
    fontSize: wp(4),
    fontWeight: 'bold',
  },
  itemSubText: {
    color: '#ddd',
    fontSize: wp(3),
    marginTop: 5,
  },
  disabledButton: {
    opacity: 0.5,
  },
  gradientContainer: {
    flex: 1,
    backgroundColor: '#191A23',
  },
  centeredContent: {
    flex: 1,
    width: '90%',
    alignSelf: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  title: {
    fontSize: wp(6),
    color: '#fff',
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: wp(5),
    color: '#fff',
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  moduleList: {
    maxHeight: hp(40), // Limit the height of the list
    marginBottom: 20,
  },
  connectButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
    alignSelf: 'center',
  },
  connectButtonText: {
    color: 'white',
    fontSize: wp(4),
  },
  callContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  callContent: {
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 20,
    borderRadius: 10,
  },
  coachName: {
    fontSize: wp(6),
    fontWeight: 'bold',
    color: 'white',
    marginBottom: hp(2),
  },
  callDuration: {
    fontSize: wp(5),
    color: 'white',
    marginBottom: hp(4),
  },
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  controlButton: {
    backgroundColor: 'rgba(255,255,255,0.3)',
    width: wp(15),
    height: wp(15),
    borderRadius: wp(7.5),
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: wp(2),
  },
  endCallButton: {
    backgroundColor: '#FF3B30',
  },
});

export default GuidedSession;