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
import VoiceNoteDetailsSkeleton from '../components/VoiceNoteDetailsSkeleton.js'; // Import the new skeleton component
import { voiceNoteSync } from '../utilities/VoiceNoteSync';
import axios from 'axios';
import { OPENAI_API_KEY} from '@env';
import { processVoiceNote } from '/Users/zacharynickerson/Desktop/vokko/src/utilities/voiceNoteProcessor.js';
import { useAudioRecorder } from '/Users/zacharynickerson/Desktop/vokko/hooks/useAudioRecorder.js';
import { RecordingControls } from '/Users/zacharynickerson/Desktop/vokko/src/components/RecordingControls.js';

export default function RecordScreen() {
  const [isLoading, setIsLoading] = useState(false);
  const [voiceNotes, setVoiceNotes] = useState([]);
  const navigation = useNavigation();
  const { 
    recording, 
    isPaused, 
    metering, 
    startRecording, 
    stopRecording, 
    pauseRecording, 
    resumeRecording 
  } = useAudioRecorder();

  // Animation values
  const recordingTextOpacity = useSharedValue(0);
  const readyTextOpacity = useSharedValue(1);
  const buttonOpacity = useSharedValue(0);
  const buttonScale = useSharedValue(0.5);

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

  const handleStopRecording = async () => {
    setIsLoading(true);
    try {
      const uri = await stopRecording();
      if (uri) {
        const userId = auth.currentUser?.uid;
        if (!userId) throw new Error('User not authenticated');
        
        console.log('Processing voice note with URI:', uri);
        const { voiceNote, updatedVoiceNotes } = await processVoiceNote(uri, voiceNotes, userId);
        setVoiceNotes(updatedVoiceNotes);
        navigation.navigate('VoiceNoteDetails', { voiceNote });
      }
    } catch (error) {
      console.error('Failed to process voice note:', error);
      let errorMessage = 'Failed to process the voice note. Please try again.';
      if (error.code && error.details) {
        errorMessage += ` Error: ${error.code} - ${error.details}`;
      }
      Alert.alert('Error', errorMessage, [{ text: 'OK' }]);
    } finally {
      setIsLoading(false);
    }
  };


  const animatedRecordingTextStyle = useAnimatedStyle(() => ({
    opacity: recordingTextOpacity.value,
    zIndex: 1,
  }));

  const animatedReadyTextStyle = useAnimatedStyle(() => ({
    opacity: readyTextOpacity.value,
  }));

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.content}>
        {isLoading ? (
          <VoiceNoteDetailsSkeleton />
        ) : (
          <>
            <View style={styles.topMessage}>
              <View style={styles.textContainer}>
                <Animated.View style={[styles.textWrapper, animatedRecordingTextStyle]}>
                  <Text style={styles.mainText}>Recording</Text>
                </Animated.View>
                <Animated.View style={[styles.textWrapper, animatedReadyTextStyle]}>
                  <Text style={styles.mainText}>Ready to record</Text>
                </Animated.View>
              </View>
              <Text style={styles.subText}>
                {recording ? "Go ahead, I'm listening" : "What's on your mind?"}
              </Text>
            </View>
            <View style={styles.waveformContainer}>
              <AudioWaveform isRecording={!!recording} isPaused={isPaused} metering={metering} />
            </View>
            <RecordingControls 
              recording={recording}
              isPaused={isPaused}
              onStartRecording={startRecording}
              onStopRecording={handleStopRecording}
              onPauseRecording={pauseRecording}
              onResumeRecording={resumeRecording}
              onCancelRecording={() => {
                if (recording) {
                  stopRecording();
                }
              }}
              buttonOpacity={buttonOpacity}
              buttonScale={buttonScale}
            />
          </>
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#191A23',
  },
  content: {
    flex: 1,
    marginHorizontal: wp(5),
  },
  topMessage: {
    marginTop: hp(2),
    height: hp(6),
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    position: 'relative',
    height: hp(6),
    width: wp(100),
    justifyContent: 'center',
    alignItems: 'center',
  },
  textWrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mainText: {
    fontSize: wp(4.5),
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
  },
  subText: {
    fontSize: wp(3.5),
    color: '#A0AEC0',
    textAlign: 'center',
  },
  waveformContainer: {
    height: hp(50),
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: hp(5),
  },
});
