import { useEffect, useState } from 'react';
import { heightPercentageToDP as hp, widthPercentageToDP as wp } from 'react-native-responsive-screen';
import { ActivityIndicator, Text, View, SafeAreaView, StyleSheet, Pressable } from 'react-native';
import { Audio } from 'expo-av';
import { useNavigation } from '@react-navigation/native';
import { generateUUID, getFileSize, getLocation, getCurrentDate } from '../utilities/helpers';
import { saveVoiceNotesToLocal, getVoiceNotesFromLocal } from '../utilities/voiceNoteLocalStorage';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/Ionicons'; 
import { auth, saveToFirebaseStorage, saveToFirebaseDatabase } from '../../config/firebase';
import AudioWaveform from '../components/AudioWaveform'; // Adjust the import path as needed
import * as FileSystem from 'expo-file-system';
import axios from 'axios';


export default function RecordScreen() {
  const [recording, setRecording] = useState(null);
  const [isPaused, setIsPaused] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [permissionResponse, requestPermission] = Audio.usePermissions();
  const [voiceNotes, setVoiceNotes] = useState([]);
  const navigation = useNavigation();
  const metering = useSharedValue(-100);  

  useEffect(() => {
    const loadVoiceNotes = async () => {
      const storedVoiceNotes = await getVoiceNotesFromLocal();
      setVoiceNotes(storedVoiceNotes);
    };
    loadVoiceNotes();
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
    try {
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY,
        undefined,
      );

      setRecording(recording);
      recording.setOnRecordingStatusUpdate((status) => {
        metering.value = status.metering || -100;
      });
    } catch (err) {
    console.error('Failed to start recording', err);
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

  async function stopRecording() {
    if (!recording) {
      return;
    }
  
    setIsLoading(true); // Start loading
  
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
    });
  
    setRecording(undefined);
    setIsPaused(false);
  
    try {
      await recording.stopAndUnloadAsync();
      const voiceNoteId = generateUUID();
      const title = `Recording ${voiceNotes.length + 1}`;
      const uri = recording.getURI();
      const createdDate = getCurrentDate();
      const size = await getFileSize(uri);
      const location = await getLocation();
      const transcript = await transcribeAudio(uri);
      const summary = '';
      const taskArray = [];
  
      const voiceNote = {
        voiceNoteId,
        title,
        uri,
        createdDate,
        size,
        location,
        transcript,
        summary,
        taskArray
      };
  
      const updatedVoiceNotes = [voiceNote, ...voiceNotes];
      setVoiceNotes(updatedVoiceNotes);
  
      try {
        const userId = auth.currentUser.uid;
        const downloadUrl = await saveToFirebaseStorage(voiceNote.uri, voiceNoteId);
        await saveToFirebaseDatabase(userId, voiceNote, downloadUrl);
        await saveVoiceNotesToLocal(updatedVoiceNotes);
        setIsLoading(false); // Stop loading
        navigation.navigate('VoiceNoteDetails', { voiceNote });
      } catch (err) {
        console.error('Error saving data to Firebase', err);
        setIsLoading(false); // Stop loading even if there's an error
      }
    } catch (err) {
      console.error('Failed to stop recording', err);
      setIsLoading(false); // Stop loading if there's an error
    }
  }


  async function cancelRecording() {
    if (recording) {
      await recording.stopAndUnloadAsync();
      setRecording(null);
      setIsPaused(false);
    }
  }

  async function transcribeAudio(uri) {
    try {
      const audioContent = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
      
      const formData = new FormData();
      formData.append('file', {
        uri: uri,
        type: 'audio/m4a', // Adjust this if your audio format is different
        name: 'audio.m4a'
      });
      formData.append('model', 'whisper-1');

    
      const apiKey = functions.config().openai.key;

      const response = await axios.post(
        'https://api.openai.com/v1/audio/transcriptions',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': apiKey, // Replace with your actual API key
          },
        }
      );

      return response.data.text;
    } catch (error) {
      console.error('Error transcribing audio:', error);
      return 'Error transcribing audio';
    }
  }

  async function transcribeAudio(uri) {
    try {
      const formData = new FormData();
      formData.append('file', {
        uri: uri,
        type: 'audio/m4a', // Adjust this if your audio format is different
        name: 'audio.m4a'
      });
      formData.append('model', 'whisper-1');

      const apiKey = functions.config().openai.key;

  
      const response = await axios.post(
        'https://api.openai.com/v1/audio/transcriptions',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': apiKey, // Use environment variable or secure storage
          },
          timeout: 60000, // Increased timeout for larger files
          maxContentLength: Infinity, // Allow for large file uploads
          maxBodyLength: Infinity,
        }
      );
  
      return response.data.text;
    } catch (error) {
      console.error('Error transcribing audio:', error);
      if (axios.isAxiosError(error)) {
        console.error('Axios error:', error.response?.data || error.message);
      }
      throw new Error('Failed to transcribe audio');
    }
  }


  return (
    <View className="flex-1" style={{ backgroundColor: '#191A23' }}>
      <SafeAreaView className="flex-1 flex mx-5">
       {/* TOP MESSAGING */}
       <View className="mt-5" style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', height: hp(6) }}>
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            {/* Container for positioning */}
            <View style={{ position: 'relative', height: hp(6), width: wp(100), justifyContent: 'center', alignItems: 'center' }}>
              <Animated.View style={[styles.textContainer, animatedRecordingTextStyle]}>
                <Text style={{ fontSize: wp(4.5), fontWeight: 'bold', color: 'white', textAlign: 'center' }}>
                  Recording
                </Text>
              </Animated.View>
              <Animated.View style={[styles.textContainer, animatedReadyTextStyle]}>
                <Text style={{ fontSize: wp(4.5), fontWeight: 'bold', color: 'white', textAlign: 'center' }}>
                  Ready to record
                </Text>
              </Animated.View>
            </View>
            <Text style={{ fontSize: wp(3.5), color: '#A0AEC0', textAlign: 'center' }}>
                {recording ? "Go ahead, I'm listening" : "What's on your mind?"}
              </Text>
          </View>
        </View>
       {/* VISUALIZER */}
        <View className="flex justify-center items-center mt-10" style={{ height: hp(39) }}>
          <AudioWaveform isRecording={!!recording} isPaused={isPaused} metering={metering.value} />
        </View>
        {/* RECORD, PAUSE, STOP, CANCEL BUTTONS */}
        <View className="flex justify-center items-center mt-5" style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }}>
          {recording && (
            <Animated.View style={[styles.controlButton, { position: 'absolute', left: -80 }, animatedButtonStyle]}>
              <Pressable onPress={cancelRecording}>
                <Icon name="close" size={30} color="white" />
              </Pressable>
            </Animated.View>
          )}
          <View>
            <Pressable
              style={styles.recordButton}
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
          </View>
          {recording && (
            <Animated.View style={[styles.controlButton, { position: 'absolute', right: -80 }, animatedButtonStyle]}>
              <Pressable onPress={stopRecording}>
                <Icon name="checkmark" size={30} color="white" />
              </Pressable>
            </Animated.View>
          )}
        </View>
        {isLoading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#ffffff" />
            <Text style={styles.loadingText}>Processing your recording...</Text>
          </View>
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  recordButton: {
    width: 60,
    height: 60,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: 'gray',
    padding: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'gray',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 100,
  },
  loadingOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  loadingText: {
    color: '#ffffff',
    marginTop: 10,
    fontSize: 16,
  },
  textContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordingText: {
    fontSize: wp(4.5),
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    lineHeight: wp(6), // Adjust this line height to match the container height
  },
  readyText: {
    fontSize: wp(4.5),
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    lineHeight: wp(6), // Adjust this line height to match the container height
  },
});