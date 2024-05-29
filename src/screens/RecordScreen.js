// RecordScreen.js
import { useEffect, useState } from 'react';
import { heightPercentageToDP as hp, widthPercentageToDP as wp } from 'react-native-responsive-screen';

import { Image, ScrollView, Text, View, Button, FlatList, SafeAreaView, StyleSheet, Pressable } from 'react-native';
import { Audio } from 'expo-av';
import { useNavigation } from '@react-navigation/native';
import { generateUUID, getFileSize, getLocation, getCurrentDate } from '../utilities/helpers';
import { saveVoiceNoteToLocal, saveVoiceNotesToLocal, getVoiceNotesFromLocal } from '../utilities/voiceNoteLocalStorage';
import Animated, { interpolate, useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/Ionicons'; 

export default function RecordScreen() {
  const [recording, setRecording] = useState();
  const [isPaused, setIsPaused] = useState(false);
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

  async function startRecording() {
    try {
      // if (permissionResponse.status !== 'granted') {
      //   await requestPermission();
      // }
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

      recording.setOnRecordingStatusUpdate((status) => {
        console.log(status.metering);
        metering.value = status.metering || -100;
      })
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

    await Audio.setAudioModeAsync(
      {
        allowsRecordingIOS: false,
      }
    );

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
      const transcript = '';
      const summary = '';
      const taskArray = [''];

      const voiceNote = {
        voiceNoteId,
        title,
        uri,
        createdDate,
        size,
        location,
        transcript: 'Ensure that you are passing the voiceNote object correctly as a route parameter, and then accessing it correctly within the VoiceNoteDetails component. This should resolve the undefined error youre encountering.',
        summary: 'Ensure that you are passing the voiceNote object correctly',
        taskArray: ['Do this', 'Do That', 'Do this other thing']
      };

      const updatedVoiceNotes = [voiceNote, ...voiceNotes];
      setVoiceNotes(updatedVoiceNotes);

      await saveVoiceNotesToLocal(updatedVoiceNotes);

      navigation.navigate('VoiceNoteDetails', { voiceNote });
    } catch (err) {
      console.error('Failed to stop recording', err);
    }
  }

  async function cancelRecording() {
    if (recording) {
      await recording.stopAndUnloadAsync();
      setRecording(null);
      setIsPaused(false);
    }
  }

  const animatedRecordButton = useAnimatedStyle (() => ({
    width: withTiming(recording ? '60%' : '100%'),
    borderRadius: withTiming(recording ? 5 : 35),
  }));

  const animatedRecordWave = useAnimatedStyle(() => {
    const size = withTiming(
      interpolate(metering.value, [-160, -60, 0], [0, 0, -30]),
      { duration: 100 }
  );

    return {
      top: size,
      bottom: size,
      left: size,
      right: size,
    };
  });

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
          <Image
            className="rounded-full"
            source={recording ? require('../../assets/images/wave-active.png') : require('../../assets/images/wave-inactive.png')}
            resizeMode="contain" // Use 'contain' to fit the image within the container
            style={{ width: '180%', height: '180%' }} // Set width and height to 100% to fill the container
          />
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
            {/* {messages.map((message, index) => (
            <Text
                key={index}
                style={{
                fontSize: 24,
                fontFamily: 'Inter',
                color: 'white',
                textAlign: 'left', // Align text to the left
                fontWeight: '500', // Set font weight to medium
                }}
            > */}
                {/* Apply different styles to the newest 10 characters */}
                {/* {message.content.length > 10 ? (
                <>
                    {message.content.substring(0, message.content.length - 10)}
                    <Text style={{ color: '#63646A' }}>
                    {message.content.substring(message.content.length - 10)}
                    </Text>
                </>
                ) : (
                <Text style={{ color: '#63646A' }}>{message.content}</Text>
                )}
            </Text> */}
            
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
            <Animated.View style={[styles.recordWaves, animatedRecordWave]} />
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
    borderColor: '#FFF',
    padding: 3,

    alignItems: 'center',
    justifyContent: 'center',
    
  },
  recordWaves: {
    backgroundColor: 'red',
    position: 'absolute',
    top: -20,
    left: -20,  
    right: -20,
    bottom: -20,
    borderRadius: 1000,
    opacity: 0.75,
  },
  redCircle: {
    backgroundColor: 'FF0000',
    opacity: 1,
    aspectRatio: 1,
  },
  controlButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'gray',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 90,
  },
  controlButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
})


