import { useEffect, useState } from 'react';
import { heightPercentageToDP as hp, widthPercentageToDP as wp } from 'react-native-responsive-screen';
import { ActivityIndicator, Image, ScrollView, Text, View, SafeAreaView, StyleSheet, Pressable } from 'react-native';
import { Audio } from 'expo-av';
import { useNavigation } from '@react-navigation/native';
import { generateUUID, getFileSize, getLocation, getCurrentDate } from '../utilities/helpers';
import { saveVoiceNotesToLocal, getVoiceNotesFromLocal } from '../utilities/voiceNoteLocalStorage';
import Animated, { interpolate, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/Ionicons'; // Import Ionicons
// import { firebase } from '@react-native-firebase/app';
// import { get, onValue, ref, set } from 'firebase/database';
import { db, storage, auth, get, onValue, ref, set, saveToFirebaseStorage, saveToFirebaseDatabase } from '../../config/firebase';
import Voice from '@react-native-community/voice';
import { dummyMessages } from '../constants';
import AudioWaveform from '../components/AudioWaveform'; // Adjust the import path as needed


export default function RecordScreen() {
  const [recording, setRecording] = useState(null);
  const [isPaused, setIsPaused] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [permissionResponse, requestPermission] = Audio.usePermissions();
  const [voiceNotes, setVoiceNotes] = useState([]);
  const navigation = useNavigation();
  const metering = useSharedValue(-100);
  const [alreadySavedToFBS, setAlreadySavedToFBS] = useState(false); // State variable to track if audio is already saved to Firebase Storage
  

  //TRANSCRIBER
  const [messages, setMessages] = useState(dummyMessages);
  const [transcribing, setTranscribing] = useState(false);
  const [speaking, setSpeaking] = useState(true);
  const [result, setResult] = useState('');

  const speechStartHandler = e =>{
    console.log('speech start handler');
  }

  const speechEndHandler = e =>{
    setTranscribing(false);
    setMessages([]);
    console.log('speech end handler');
    console.log(messages)
  }

  const speechResultsHandler = e =>{
    console.log('voice event: ',e);
    const text = e.value[0];
    setMessages([{ role: 'user', content: text.trim() }]);
    setResult(text)

    // const { value } = e;
    // console.log('Received transcription:', value); // Debugging: Check if transcription is received correctly
    // const newMessage = { content: value };
  }

  const speechErrorHandler =e=>{
    console.log('speech error handler: ',e);
  }

  const startTranscribing = async ()=>{
    setTranscribing(true);
    try {
      await Voice.start('en-GB');
    }catch(error){
      console.log('error: ',error);
    }
  }

  const clear = ()=>{
    setMessages([])
  }

  const stopTranscribing = async ()=>{
    try {
      await Voice.stop();
      setTranscribing(false);
    }catch(error){
      console.log('error: ',error);
    }
  }

  const pauseTranscribing = async () => {
    try {
      await Voice.stop();
      setTranscribing(false);
    } catch (error) {
      console.log('error: ', error);
    }
  };

  const resumeTranscribing = async () => {
    try {
      setTranscribing(true);
      await Voice.start('en-GB');
    } catch (error) {
      console.log('error: ', error);
    }
  };

  const stopSpeaking = ()=>{
    setSpeaking(false)
  }


  useEffect(()=>{
    Voice.onSpeechStart = speechStartHandler;
    Voice.onSpeechEnd = speechEndHandler;
    Voice.onSpeechResults = speechResultsHandler;
    Voice.onSpeechError = speechErrorHandler;  
    setMessages([])

    return ()=>{
      //destroy voice instance
      Voice.destroy().then(Voice.removeAllListeners);
    }
  }, [])


  //END TRANSCRIBER


  useEffect(() => {
    const loadVoiceNotes = async () => {
      const storedVoiceNotes = await getVoiceNotesFromLocal();
      setVoiceNotes(storedVoiceNotes);
    };
    loadVoiceNotes();
  }, []);

  
  

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
        1000 / 60,
      );

      setRecording(recording);
      startTranscribing();
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
      pauseTranscribing();
    }
  }

  async function resumeRecording() {
    if (recording) {
      await recording.startAsync();
      setIsPaused(false);
      resumeTranscribing();
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
    stopTranscribing();
  
    try {
      await recording.stopAndUnloadAsync();
      const voiceNoteId = generateUUID();
      const title = `Recording ${voiceNotes.length + 1}`;
      const uri = recording.getURI();
      const createdDate = getCurrentDate();
      const size = await getFileSize(uri);
      const location = await getLocation();
      const transcript = result;
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
      stopTranscribing();
      setRecording(null);
      setIsPaused(false);
    }
  }

  // useEffect(() => {
  //   const unsubscribe = navigation.addListener('blur', () => {
  //     clearMessages();
  //   });

  //   return unsubscribe;
  // }, [navigation]);

  // const animatedRecordButton = useAnimatedStyle(() => ({
  //   width: withTiming(recording ? '60%' : '100%'),
  //   borderRadius: withTiming(recording ? 5 : 35),
  // }));

  // const animatedRecordWave = useAnimatedStyle(() => {
  //   const size = withTiming(
  //     interpolate(metering.value, [-160, -60, 0], [0, 0, -30]),
  //     { duration: 100 }
  //   );

  //   return {
  //     top: size,
  //     bottom: size,
  //     left: size,
  //     right: size,
  //   };
  // });

  return (
    <View className="flex-1" style={{ backgroundColor: '#191A23' }}>
      <SafeAreaView className="flex-1 flex mx-5">
        {/* TOP MESSAGING */}
        <View className="mt-5" style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', height: hp(6) }}>
          <View style={{ flex: 1, justifyContent: 'center' }}>
            <Text style={{ fontSize: wp(4.5), fontWeight: 'bold', color: 'white', textAlign: 'center', height: hp(4) }}>
              {recording ? 'Recording' : 'Ready to record'}
            </Text>
            <Text style={{ fontSize: wp(3.5), color: '#A0AEC0', textAlign: 'center' }}>
              {recording ? "Go ahead, I'm listening" : 'Ready to record'}
            </Text>
          </View>
        </View>
       {/* VISUALIZER */}
        <View className="flex justify-center items-center mt-10" style={{ height: hp(39) }}>
          <AudioWaveform isRecording={!!recording} />
        </View>

        {/* LIVE TRANSCRIPTION */}
        <View className="mt-2" style={{ maxHeight: 86, overflow: 'hidden' }}>
        <ScrollView
            style={{
            height: hp(18),
            // backgroundColor: 'red',
            paddingHorizontal: 16,
            flexDirection: 'column-reverse', // Reverse the order of children
            }}
            contentContainerStyle={{
            justifyContent: 'flex-end',
            flexGrow: 1,
            }}
            showsVerticalScrollIndicator={false}
        >
            {/* Display live transcription here */}
            {messages.map((message, index) => (
            <Text
                key={index}
                style={{
                fontSize: 24,
                fontFamily: 'Inter',
                color: 'white',
                textAlign: 'left', // Align text to the left
                fontWeight: '500', // Set font weight to medium
                }}
            >
                {/* Apply different styles to the newest 10 characters */}
                {message.content.length > 10 ? (
                <>
                    {message.content.substring(0, message.content.length - 10)}
                    <Text style={{ color: '#63646A' }}>
                    {message.content.substring(message.content.length - 10)}
                    </Text>
                </>
                ) : (
                <Text style={{ color: '#63646A' }}>{message.content}</Text>
                )}
            </Text>
            ))}
        </ScrollView>
        </View>
        {/* RECORD, PAUSE, STOP, CANCEL BUTTONS */}
        <View className="flex justify-center items-center mt-5" style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }}>
          {recording && (
            <Pressable
              style={[styles.controlButton, { position: 'absolute', left: -80 }]}
              onPress={cancelRecording}
            >
              <Icon name="close" size={30} color="white" />
            </Pressable>
          )}
          <View>
            {/* <Animated.View style={[styles.recordWaves, animatedRecordWave]} /> */}
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
            <Pressable
              style={[styles.controlButton, { position: 'absolute', right: -80 }]}
              onPress={stopRecording}
            >
              <Icon name="checkmark" size={30} color="white" />
            </Pressable>
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
  recordWaves: {
    backgroundColor: '#FF000055',
    position: 'absolute',
    top: -20,
    left: -20,
    right: -20,
    bottom: -20,
    borderRadius: 1000,
    opacity: 0.5,
  },
  redCircle: {
    backgroundColor: 'orangered',
    aspectRatio: 1,
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
  controlButtonText: {
    color: 'white',
    fontWeight: 'bold',
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
});
