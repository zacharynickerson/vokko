import { useEffect, useState } from 'react';
import { heightPercentageToDP as hp, widthPercentageToDP as wp } from 'react-native-responsive-screen';
import { Image, ScrollView, Text, View, SafeAreaView, StyleSheet, Pressable } from 'react-native';
import { Audio } from 'expo-av';
import { useNavigation } from '@react-navigation/native';
import { generateUUID, getFileSize, getLocation, getCurrentDate } from '../utilities/helpers';
import { saveVoiceNotesToLocal, getVoiceNotesFromLocal } from '../utilities/voiceNoteLocalStorage';
import Animated, { interpolate, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/Ionicons'; // Import Ionicons
// import { firebase } from '@react-native-firebase/app';
import { db, storage, auth } from '/Users/zacharynickerson/Desktop/vokko/config/firebase.js'; // Import Firebase configuration
import { get, onValue, ref, set } from 'firebase/database';
import { saveToFirebaseStorage, saveToFirebaseDatabase } from '/Users/zacharynickerson/Desktop/vokko/config/firebase.js';


export default function RecordScreen() {
  const [recording, setRecording] = useState(null);
  const [isPaused, setIsPaused] = useState(false);
  const [permissionResponse, requestPermission] = Audio.usePermissions();
  const [voiceNotes, setVoiceNotes] = useState([]);
  const navigation = useNavigation();
  const metering = useSharedValue(-100);
  const [alreadySavedToFBS, setAlreadySavedToFBS] = useState(false); // State variable to track if audio is already saved to Firebase Storage

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
      recording.setOnRecordingStatusUpdate((status) => {
        // console.log(status.metering);
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
        const userId = auth.currentUser.uid; // Replace with your actual logic to get userId
        const downloadUrl = await saveToFirebaseStorage(voiceNote.uri);
        await saveToFirebaseDatabase(userId, voiceNote, downloadUrl);
        navigation.navigate('VoiceNoteDetails', { voiceNote });
      } catch (err) {
        console.error('Error saving data to Firebase', err);
      }

      await saveVoiceNotesToLocal(updatedVoiceNotes);

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

  const animatedRecordButton = useAnimatedStyle(() => ({
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
              paddingHorizontal: 16,
              flexDirection: 'column-reverse',
            }}
            contentContainerStyle={{
              justifyContent: 'flex-end',
              flexGrow: 1,
            }}
            showsVerticalScrollIndicator={false}
          >
            {/* {<Transcriber />} */}
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
});

/////////////////


// import { useEffect, useState } from 'react';
// import { heightPercentageToDP as hp, widthPercentageToDP as wp } from 'react-native-responsive-screen';
// import { Image, ScrollView, Text, View, SafeAreaView, StyleSheet, Pressable } from 'react-native';
// import { Audio } from 'expo-av';
// import { useNavigation } from '@react-navigation/native';
// import { generateUUID, getFileSize, getLocation, getCurrentDate } from '../utilities/helpers';
// import { saveVoiceNotesToLocal, getVoiceNotesFromLocal } from '../utilities/voiceNoteLocalStorage';
// import Animated, { interpolate, useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
// import Icon from 'react-native-vector-icons/Ionicons'; 
// import Transcriber from '../components/transcriber';

// export default function RecordScreen() {
//   const [recording, setRecording] = useState();
//   const [isPaused, setIsPaused] = useState(false);
//   const [permissionResponse, requestPermission] = Audio.usePermissions();
//   const [voiceNotes, setVoiceNotes] = useState([]);
//   const navigation = useNavigation();
//   const metering = useSharedValue(-100);
//   const [isTranscribing, setIsTranscribing] = useState(false);

//   useEffect(() => {
//     const loadVoiceNotes = async () => {
//       const storedVoiceNotes = await getVoiceNotesFromLocal();
//       setVoiceNotes(storedVoiceNotes);
//     };
//     loadVoiceNotes();
//   }, []);

//   async function startRecording() {
//     try {
//       if (permissionResponse.status !== 'granted') {
//         await requestPermission();
//       }
//       await Audio.requestPermissionsAsync();
//       await Audio.setAudioModeAsync({
//         allowsRecordingIOS: true,
//         playsInSilentModeIOS: true,
//       });

//       const { recording } = await Audio.Recording.createAsync(
//         Audio.RecordingOptionsPresets.HIGH_QUALITY,
//         undefined,
//         1000 / 60,
//       );

//       setRecording(recording);
//       setIsTranscribing(true); // Start transcription

//       recording.setOnRecordingStatusUpdate((status) => {
//         metering.value = status.metering || -100;
//       });
//     } catch (err) {
//       console.error('Failed to start recording', err);
//     }
//   }

//   async function pauseRecording() {
//     if (recording) {
//       await recording.pauseAsync();
//       setIsPaused(true);
//     }
//   }

//   async function resumeRecording() {
//     if (recording) {
//       await recording.startAsync();
//       setIsPaused(false);
//     }
//   }

//   async function stopRecording() {
//     if (!recording) {
//       return;
//     }

//     await Audio.setAudioModeAsync({
//       allowsRecordingIOS: false,
//     });

//     setRecording(undefined);
//     setIsPaused(false);
//     setIsTranscribing(false); // Stop transcription

//     try {
//       await recording.stopAndUnloadAsync();
//       const voiceNoteId = generateUUID();
//       const title = `Recording ${voiceNotes.length + 1}`;
//       const uri = recording.getURI();
//       const createdDate = getCurrentDate();
//       const size = await getFileSize(uri);
//       const location = await getLocation();

//       const voiceNote = {
//         voiceNoteId,
//         title,
//         uri,
//         createdDate,
//         size,
//         location,
//         transcript: '',
//         summary: '',
//         taskArray: ['']
//       };

//       const updatedVoiceNotes = [voiceNote, ...voiceNotes];
//       setVoiceNotes(updatedVoiceNotes);

//       await saveVoiceNotesToLocal(updatedVoiceNotes);

//       navigation.navigate('VoiceNoteDetails', { voiceNote });
//     } catch (err) {
//       console.error('Failed to stop recording', err);
//     }
//   }

//   async function cancelRecording() {
//     if (recording) {
//       await recording.stopAndUnloadAsync();
//       setRecording(null);
//       setIsPaused(false);
//       setIsTranscribing(false); // Stop transcription
//     }
//   }

//   const animatedRecordWave = useAnimatedStyle(() => {
//     const size = withTiming(
//       interpolate(metering.value, [-150, -10, 0], [0, 0, -40]),
//       { duration: 100 }
//     );

//     return {
//       top: size,
//       bottom: size,
//       left: size,
//       right: size,
//     };
//   });
//   return (
//     <View className="flex-1" style={{ backgroundColor: '#191A23' }}>
//       <SafeAreaView className="flex-1 flex mx-5">
//         {/* TOP MESSAGING */}
//         <View className="mt-5" style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', height: hp(6) }}>
//           <View style={{ flex: 1, justifyContent: 'center' }}>
//             <Text style={{ fontSize: wp(4.5), fontWeight: 'bold', color: 'white', textAlign: 'center', height: hp(4) }}>
//               {recording ? 'Recording' : 'Ready to record'}
//             </Text>
//             <Text style={{ fontSize: wp(3.5), color: '#A0AEC0', textAlign: 'center' }}>
//               {recording ? "Go ahead, I'm listening" : 'Ready to record'}
//             </Text>
//           </View>
//         </View>

//         {/* VISUALIZER */}
//         <View className="flex justify-center items-center mt-10" style={{ height: hp(39) }}>
//           <Image
//             className="rounded-full"
//             source={recording ? require('../../assets/images/wave-active.png') : require('../../assets/images/wave-inactive.png')}
//             resizeMode="contain" // Use 'contain' to fit the image within the container
//             style={{ width: '180%', height: '180%' }} // Set width and height to 100% to fill the container
//           /> 
//         </View>

//         {/* LIVE TRANSCRIPTION */}
//         <View className="mt-2" style={{ maxHeight: 86, overflow: 'hidden' }}>
//           <ScrollView
//             style={{
//               height: hp(18),
//               paddingHorizontal: 16,
//               flexDirection: 'column-reverse',
//             }}
//             contentContainerStyle={{
//               justifyContent: 'flex-end',
//               flexGrow: 1,
//             }}
//             showsVerticalScrollIndicator={false}
//           >
//             {<Transcriber />}
//           </ScrollView>
//         </View>

//         {/* RECORD, PAUSE, STOP, CANCEL BUTTONS */}
//         <View className="flex justify-center items-center mt-5" style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }}>
//           {recording && (
//             <Pressable
//               style={[styles.controlButton, { position: 'absolute', left: -80 }]}
//               onPress={cancelRecording}
//             >
//               <Icon name="close" size={30} color="white" />
//             </Pressable>
//           )}
//           <View>
//             <Animated.View style={[styles.recordWaves, animatedRecordWave]} />
//             <Pressable
//               style={styles.recordButton}
//               onPress={recording ? (isPaused ? resumeRecording : pauseRecording) : startRecording}
//             >
//               {recording ? (
//                 isPaused ? (
//                   <Icon name="play" size={30} color="white" />
//                 ) : (
//                   <Icon name="pause" size={30} color="white" />
//                 )
//               ) : (
//                 <Icon name="mic" size={30} color="white" />
//               )}
//             </Pressable>
//           </View>
//           {recording && (
//             <Pressable
//               style={[styles.controlButton, { position: 'absolute', right: -80 }]}
//               onPress={stopRecording}
//             >
//               <Icon name="checkmark" size={30} color="white" />
//             </Pressable>
//           )}
//         </View>
//       </SafeAreaView>
//     </View>
//   );
// }


// const styles = StyleSheet.create({
//   recordButton: {
//     width: 60,
//     height: 60,
//     borderRadius: 60,

//     borderWidth: 3,
//     borderColor: '#4C4D58',
//     padding: 3,

//     alignItems: 'center',
//     justifyContent: 'center',
    
//   },
//   recordWaves: {
//     backgroundColor: '#4C4D58',
//     position: 'absolute',
//     top: -20,
//     left: -20,  
//     right: -20,
//     bottom: -20,
//     borderRadius: 1000,
//     opacity: 0.75,
//   },
//   redCircle: {
//     backgroundColor: 'red',
//     opacity: 1,
//     aspectRatio: 1,
//   },
//   controlButton: {
//     width: 60,
//     height: 60,
//     borderRadius: 30,
//     backgroundColor: '#4C4D58',
//     alignItems: 'center',
//     justifyContent: 'center',
//     marginHorizontal: 90,
//   },
// })



// // RecordScreen.js
// import { useEffect, useState } from 'react';
// import { heightPercentageToDP as hp, widthPercentageToDP as wp } from 'react-native-responsive-screen';

// import { Image, ScrollView, Text, View, Button, FlatList, SafeAreaView, StyleSheet, Pressable, Easing } from 'react-native';
// import { Audio } from 'expo-av';
// import { useNavigation } from '@react-navigation/native';
// import { generateUUID, getFileSize, getLocation, getCurrentDate } from '../utilities/helpers';
// import { saveVoiceNoteToLocal, saveVoiceNotesToLocal, getVoiceNotesFromLocal } from '../utilities/voiceNoteLocalStorage';
// import Animated, { interpolate, useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
// import Icon from 'react-native-vector-icons/Ionicons'; 
// import Svg from 'react-native-svg';
// import Transcriber from '../components/transcriber';


// export default function RecordScreen() {
//   const [recording, setRecording] = useState();
//   const [isPaused, setIsPaused] = useState(false);
//   const [permissionResponse, requestPermission] = Audio.usePermissions();
//   const [voiceNotes, setVoiceNotes] = useState([]);
//   const navigation = useNavigation();
//   const metering = useSharedValue(-100);
//   // const [isRotating, setIsRotating] = useState(new Animated.Value(0));
//   const [isTranscribing, setIsTranscribing] = useState(false); // State to control transcription

//   useEffect(() => {
//     const loadVoiceNotes = async () => {
//       const storedVoiceNotes = await getVoiceNotesFromLocal();
//       setVoiceNotes(storedVoiceNotes);
//     };
//     loadVoiceNotes();
//   }, []);

//   async function startRecording() {
//     try {
//       if (permissionResponse.status !== 'granted') {
//         await requestPermission();
//       }
//       await Audio.requestPermissionsAsync();
//       await Audio.setAudioModeAsync({
//         allowsRecordingIOS: true,
//         playsInSilentModeIOS: true,
//       });

//       const { recording } = await Audio.Recording.createAsync(
//         Audio.RecordingOptionsPresets.HIGH_QUALITY,
//         undefined,
//         1000 / 60,
//       );
 
//       setRecording(recording);
//       setIsTranscribing(true); // Start transcription

//       recording.setOnRecordingStatusUpdate((status) => {
//         // console.log(status.metering);
//         metering.value = status.metering || -100;
//       })
//     } catch (err) {
//       console.error('Failed to start recording', err);
//     }
//   }


//   async function pauseRecording() {
//     if (recording) {
//       await recording.pauseAsync();
//       setIsPaused(true);
//     }
//   }

//   async function resumeRecording() {
//     if (recording) {
//       await recording.startAsync();
//       setIsPaused(false);
//     }
//   }

//   async function stopRecording() {
//     if (!recording) {
//       return;
//     }

//     await Audio.setAudioModeAsync(
//       {
//         allowsRecordingIOS: false,
//       }
//     );

//     setRecording(undefined);
//     setIsPaused(false);
//     setIsTranscribing(false); // Stop transcription

    
//     try {
//       await recording.stopAndUnloadAsync();
//       const voiceNoteId = generateUUID();
//       const title = `Recording ${voiceNotes.length + 1}`;
//       const uri = recording.getURI();
//       const createdDate = getCurrentDate();
//       const size = await getFileSize(uri);
//       const location = await getLocation();
//       const transcript = '';
//       const summary = '';
//       const taskArray = [''];

//       const voiceNote = {
//         voiceNoteId,
//         title,
//         uri,
//         createdDate,
//         size,
//         location,
//         transcript: 'Ensure that you are passing the voiceNote object correctly as a route parameter, and then accessing it correctly within the VoiceNoteDetails component. This should resolve the undefined error youre encountering.',
//         summary: 'Ensure that you are passing the voiceNote object correctly',
//         taskArray: ['Do this', 'Do That', 'Do this other thing']
//       };

//       const updatedVoiceNotes = [voiceNote, ...voiceNotes];
//       setVoiceNotes(updatedVoiceNotes);

//       await saveVoiceNotesToLocal(updatedVoiceNotes);

//       navigation.navigate('VoiceNoteDetails', { voiceNote });
//     } catch (err) {
//       console.error('Failed to stop recording', err);
//     }
//   }

//   async function cancelRecording() {
//     if (recording) {
//       await recording.stopAndUnloadAsync();
//       setRecording(null);
//       setIsPaused(false);
//       setIsTranscribing(false); // Stop transcription
//     }
//   }

//   const animatedRecordButton = useAnimatedStyle (() => ({
//     width: withTiming(recording ? '60%' : '100%'),
//     borderRadius: withTiming(recording ? 5 : 35),
//   }));

//   const animatedRecordWave = useAnimatedStyle(() => {
//     const size = withTiming(
//       interpolate(metering.value, [-150, -10, 0], [0, 0, -40]),
//       { duration: 100 }
//   );

//     return {
//       top: size,
//       bottom: size,
//       left: size,
//       right: size,
//     };
//   });


  // useEffect(() => {
  //   Animated.loop(
  //     Animated.timing(isRotating, {
  //       toValue: 1,
  //       duration: 12000,
  //       easing: Easing.inOut(Easing.ease),
  //       useNativeDriver: true,
  //     }),
  //   ).start();
  // }, [isRotating]);

  // const interpolateRotation = (start, end) => {
  //   return isRotating.interpolate({
  //     inputRange: [0, 1],
  //     outputRange: [start + 'deg', end + 'deg'],
  //   });
  // };






{/* <View>
<Svg height="200" width="200">
<Image
  href={require('/Users/zacharynickerson/Desktop/vokko/assets/images/shadow.png')}
  width="100%"
  height="100%"
/>
<Image
  href={require('/Users/zacharynickerson/Desktop/vokko/assets/images/icon-bg.png')}
  width="100%"
  height="100%"
/>
<Image
  href={require('/Users/zacharynickerson/Desktop/vokko/assets/images/pink-top.png')}
  width="100%"
  height="100%"
  style={{
    transform: [
      { rotate: interpolateRotation(-360, 320) },
      {
        rotateZ: isRotating.interpolate({
          inputRange: [0, 1],
          outputRange: ['60deg', '-270deg'],
        }),
      },
    ],
  }}
/>
<Image
  href={require('/Users/zacharynickerson/Desktop/vokko/assets/images/pink-left.png')}
  width="100%"
  height="100%"
  style={{
    transform: [
      { rotate: interpolateRotation(180, -360) },
      {
        rotateZ: isRotating.interpolate({
          inputRange: [0, 1],
          outputRange: ['300deg', '-220deg'],
        }),
      },
    ],
  }}
/>
<Image
  href={require('/Users/zacharynickerson/Desktop/vokko/assets/images/blue-middle.png')}
  width="100%"
  height="100%"
  style={{
    transform: [
      { rotate: interpolateRotation(420, -360) },
      {
        rotateZ: isRotating.interpolate({
          inputRange: [0, 1],
          outputRange: ['0deg', '-150deg'],
        }),
      },
      { perspective: 75 },
      {
        rotateX: isRotating.interpolate({
          inputRange: [0, 1],
          outputRange: ['75deg', '75deg'],
        }),
      },
    ],
  }}
/>
<Image
  href={require('/Users/zacharynickerson/Desktop/vokko/assets/images/blue-right.png')}
  width="100%"
  height="100%"
  style={{
    transform: [
      { rotate: interpolateRotation(420, -360) },
      {
        rotateZ: isRotating.interpolate({
          inputRange: [0, 1],
          outputRange: ['-50deg', '720deg'],
        }),
      },
      { perspective: 75 },
      {
        rotateX: isRotating.interpolate({
          inputRange: [0, 1],
          outputRange: ['75deg', '75deg'],
        }),
      },
    ],
  }}
/>
<Image
  href={require('/Users/zacharynickerson/Desktop/vokko/assets/images/Intersect.png')}
  width="100%"
  height="100%"
  style={{
    transform: [
      { rotate: interpolateRotation(-420, 30) },
      {
        rotateZ: isRotating.interpolate({
          inputRange: [0, 1],
          outputRange: ['720deg', '0deg'],
        }),
      },
      { perspective: 15 },
    ],
  }}
/>
<Image
  href={require('/Users/zacharynickerson/Desktop/vokko/assets/images/green-left-1.png')}
  width="100%"
  height="100%"
  style={{
    transform: [
      { rotate: interpolateRotation(360, -300) },
      {
        rotateZ: isRotating.interpolate({
          inputRange: [0, 1],
          outputRange: ['-15deg', '300deg'],
        }),
      },
      { perspective: 15 },
    ],
  }}
/>
<Image
  href={require('/Users/zacharynickerson/Desktop/vokko/assets/images/green-left.png')}
  width="100%"
  height="100%"
  style={{
    transform: [
      { rotate: interpolateRotation(-360, 360) },
      {
        rotateZ: isRotating.interpolate({
          inputRange: [0, 1],
          outputRange: ['50deg', '180deg'],
        }),
      },
      { perspective: 75 },
    ],
  }}
/>
<Image
  href={require('/Users/zacharynickerson/Desktop/vokko/assets/images/bottom-pink.png')}
  width="100%"
  height="100%"
  style={{
    transform: [
      { rotate: interpolateRotation(-360, 400) },
      {
        rotateZ: isRotating.interpolate({
          inputRange: [0, 1],
          outputRange: ['230deg', '0deg'],
        }),
      },
      { perspective: 75 },
    ],
    opacity: 0.25,
  }}
/>
<Image
  href={require('/Users/zacharynickerson/Desktop/vokko/assets/images/highlight.png')}
  width="100%"
  height="100%"
  style={{
    transform: [
      { rotate: interpolateRotation(250, 360) },
      {
        rotateZ: isRotating.interpolate({
          inputRange: [0, 1],
          outputRange: ['230deg', '0deg'],
        }),
      },
    ],
  }}
/>
</Svg>
</View> */}





  // Function to save the voice note recording to Firebase Storage
  // const saveToFirebaseStorage = async (voiceNote) => {
  //   // const { uri, voiceNoteId } = voiceNote;
  //   if (!alreadySavedToFBS) {
  //     uploadAudioFile(voiceNote.uri); // Upload the audio file to Firebase Storage
  //     console.log("Successfully uploaded to Firebase Storage");
  //     setAlreadySavedToFBS(true); // Update state to indicate audio saved to Firebase Storage
  //   }
  // };

  // Function to save the voice note object to Firebase Realtime Database
  // const saveToFirebaseDatabase = async (voiceNote) => {
  //   try {
  //         // Upload the audio file to Firebase Storage
  //         const downloadUrl = await saveToFirebaseStorage(voiceNote.uri);
  //         console.log('Successfully uploaded to Firebase Storage:', downloadUrl);
      
  //         // Save the voice note data to Firebase Realtime Database
  //         const user = auth.currentUser;
  //         if (!user) {
  //           throw new Error('User is not authenticated');
  //         }
      
  //         const userId = user.uid;
  //         const voiceNoteData = {
  //           ...voiceNote,
  //           uri: downloadUrl // Replace local URI with Firebase Storage URL
  //         };
      
  //         const databaseRef = ref(db, `voiceNotes/${userId}/${voiceNote.voiceNoteId}`);
  //         await set(databaseRef, voiceNoteData);
      
  //         console.log('Data saved to Firebase Realtime Database');
  //       } catch (error) {
  //         console.error('Error saving data to Firebase:', error);
  //         throw error;
  //       }
  // };



  // const uploadToFirebase = async (voiceNote) => {
  //   const { uri, voiceNoteId } = voiceNote;
  //   const response = await fetch(uri);
  //   const blob = await response.blob();
  //   const storageRef = firebase.storage().ref().child(`voiceNotes/${voiceNoteId}`);
    
  //   try {
  //     await storageRef.put(blob);
  //     const downloadURL = await storageRef.getDownloadURL();

  //     voiceNote.uri = downloadURL;
  //     voiceNote.synced = true;

  //     await firebase.database().ref(`voiceNotes/${voiceNoteId}`).set(voiceNote);
  //     await saveVoiceNotesToLocal(voiceNotes.map(vn => vn.voiceNoteId === voiceNoteId ? voiceNote : vn));

  //   } catch (error) {
  //     console.error('Error uploading to Firebase:', error);
  //     // Handle error uploading
  //   }
  // };