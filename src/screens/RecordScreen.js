import { useEffect, useState } from 'react';
import { heightPercentageToDP as hp, widthPercentageToDP as wp } from 'react-native-responsive-screen';
import { ActivityIndicator, Text, View, SafeAreaView, StyleSheet, Pressable } from 'react-native';
import { Audio } from 'expo-av';
import { useNavigation } from '@react-navigation/native';
import { generateUUID, getFileSize, getLocation, getCurrentDate } from '../utilities/helpers';
import { saveVoiceNotesToLocal, getVoiceNotesFromLocal } from '../utilities/voiceNoteLocalStorage';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, withDelay, withSequence } from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/Ionicons'; 
import { auth, saveToFirebaseStorage, saveToFirebaseDatabase, functions, httpsCallable } from '../../config/firebase';
import AudioWaveform from '../components/AudioWaveform'; // Adjust the import path as needed
import axios from 'axios';
import VoiceNoteDetailsSkeleton from '../components/VoiceNoteDetailsSkeleton.js'; // Import the new skeleton component
import { OPENAI_API_KEY} from '@env';
import { voiceNoteSync } from '../utilities/VoiceNoteSync';


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
        staysActiveInBackground: true,
        interruptionModeIOS: 1, // This corresponds to Audio.InterruptionModeIOS.DoNotMix
        shouldDuckAndroid: true,
        interruptionModeAndroid: 1, // This corresponds to Audio.InterruptionModeAndroid.DoNotMix
        playThroughEarpieceAndroid: false
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
      console.log('No active recording to stop');
      return;
    }
  
    setIsLoading(true);
  
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
      });
  
      setRecording(undefined);
      setIsPaused(false);
  
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      
      if (!uri) {
        throw new Error('Failed to get recording URI');
      }
  
      const voiceNoteId = generateUUID();
      const title = `Recording ${voiceNotes.length + 1}`;
      const createdDate = getCurrentDate();
      const size = await getFileSize(uri);
      const location = await getLocation();
      let transcript = '';
      
      try {
        transcript = await transcribeAudio(uri);
      } catch (transcriptError) {
        console.error('Error transcribing audio:', transcriptError);
        // Continue with empty transcript if transcription fails
      }
  
      const voiceNote = {
        voiceNoteId,
        title,
        uri,
        createdDate,
        size,
        location,
        transcript,
        summary: '',
        taskArray: []
      };
  
      const updatedVoiceNotes = [voiceNote, ...voiceNotes];
      setVoiceNotes(updatedVoiceNotes);
      voiceNoteSync.addToSyncQueue(voiceNote);
  
      try {
        const userId = auth.currentUser?.uid;
        if (!userId) {
          throw new Error('User not authenticated');
        }
  
        const downloadUrl = await saveToFirebaseStorage(voiceNote.uri, voiceNoteId);
        await saveToFirebaseDatabase(userId, voiceNote, downloadUrl);
        await saveVoiceNotesToLocal(updatedVoiceNotes);
        
        setIsLoading(false);
        navigation.navigate('VoiceNoteDetails', { voiceNote });
      } catch (saveError) {
        console.error('Error saving data:', saveError);
        // Handle save error (e.g., show an error message to the user)
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Failed to stop recording or process voice note:', error);
      setIsLoading(false);
      // Handle the error (e.g., show an error message to the user)
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
      // Convert the audio file to base64
      const response = await fetch(uri);
      const blob = await response.blob();
      const base64Audio = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result.split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });

      // Call the Firebase Cloud Function
      const transcribeFunction = httpsCallable(functions, 'transcribeAudio');
      const result = await transcribeFunction({ audioBase64: base64Audio });

      return result.data.transcript;
    } catch (error) {
      console.error('Error transcribing audio:', error);
      throw new Error('Failed to transcribe audio');
    }
  }



  return (
    <View className="flex-1" style={{ backgroundColor: '#191A23' }}>
      <SafeAreaView className="flex-1 flex mx-5">
      {isLoading ? (
          <VoiceNoteDetailsSkeleton />
        ) : (
          <>
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
        <View className="flex justify-center items-center mt-10" style={{ height: hp(50) }}>
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
        </>
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
  container: {
    flex: 1,
    backgroundColor: '#191A23',
  },
  content: {
    flex: 1,
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



