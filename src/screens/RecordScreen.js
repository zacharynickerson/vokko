import * as FileSystem from 'expo-file-system';

import { Alert, Image, SafeAreaView, ScrollView, Text, TouchableOpacity, View } from 'react-native'
import React, { startTransition, useEffect, useRef, useState } from 'react'
import {heightPercentageToDP as hp, widthPercentageToDP as wp} from 'react-native-responsive-screen';

import { Audio } from 'expo-av';
import { Entypo } from "@expo/vector-icons"
import Voice from '@react-native-voice/voice';
import { apiCall } from '../api/openAI.js';
import { useNavigation } from '@react-navigation/native';

export default function HomeScreen() {

    //Recording variables
    const [recording, setRecording] = React.useState();
    const [recordings, setRecordings] = React.useState([]);
    const [permissionResponse, requestPermission] = Audio.usePermissions();
    const [memos, setMemos] = React.useState("");
    const [message, setMessage] = React.useState("");
    const date = new Date().getDate();
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const d = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
    ];
    const month = d[currentMonth];
    const year = new Date().getFullYear();

    //Format Date
    const formatMillis = (millis) => {
      const minutes = Math.floor(millis / (1000 * 60));
      const seconds = Math.floor((millis % (1000 * 60)) / 1000);
  
      return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    };

      
    //Transcription  variables
        const [transcription, setTranscription] = useState(false);
        const [speaking, setSpeaking] = useState(false);
        const [messages, setMessages] = useState([] );
        
        const [result, setResult] = useState('');
        const [loading, setLoading] = useState(false);
        const ScrollViewRef = useRef(); 
        const navigation = useNavigation(); 
    
        const speechStartHandler = e=>{
            console.log('speech start handler');
        }
        const speechEndHandler = e=>{
            setTranscription(false);
            console.log('speech end handler');
        }
        const speechResultsHandler = e => {
            console.log('voice event: ', e);
            const text = e.value[0];
        
            // Update messages array with the latest transcription
            setMessages([{ role: 'user', content: text.trim() }]);
        
            setResult(text);
          };
        const speechErrorHandler = e=>{
            console.log('speech error handler', e);
        }
        
        //STARTS
        const startTranscription = async () => {
          setTranscription(true);
          try {
            await Voice.start('en-GB'); // en-US
        
            // Navigate to VoiceNoteDetails with necessary parameters
            navigation.navigate('VoiceNoteDetails', {
              uri: recording.getURI(),
              messages: messages,
              recordings: [...recordings],
              memos: memos,
              date: date,
              month: month,
              year: year,
              duration: formatMillis(recording),
            });
          } catch (error) {
            console.log('error: ', error);
          }
        };

        async function startRecording() {
            if (!permissionResponse) {
                return;
            }
            
            try {
              if (permissionResponse.status !== 'granted') {
                console.log('Requesting permission..');
                await requestPermission();
              }
              await Audio.setAudioModeAsync({
                allowsRecordingIOS: true,
                playsInSilentModeIOS: true,
              });
        
              console.log('Starting recording..');
          
              // Adjust options to specify WAV format
              const recordingOptions = {
                  android: {
                      extension: '.wav',
                      outputFormat: Audio.RECORDING_OPTION_ANDROID_OUTPUT_FORMAT_PCM,
                      audioEncoder: Audio.RECORDING_OPTION_ANDROID_AUDIO_ENCODER_PCM,
                  },
                  ios: {
                      extension: '.wav',
                      outputFormat: Audio.RECORDING_OPTION_IOS_OUTPUT_FORMAT_LINEARPCM,
                      audioQuality: Audio.RECORDING_OPTION_IOS_AUDIO_QUALITY_HIGH,
                      sampleRate: 44100,
                      numberOfChannels: 1,
                      bitRate: 128000,
                      linearPCMBitDepth: 16,
                      linearPCMIsBigEndian: false,
                      linearPCMIsFloat: false,
                  },
              };
              // const { recording } = await Audio.Recording.createAsync( Audio.RecordingOptionsPresets.HIGH_QUALITY);
              const { recording } = await Audio.Recording.createAsync(recordingOptions);

              
              setRecording(recording);
              console.log('Recording started');
            } catch (err) {
              console.error('Failed to start recording', err);
            }
          }

        const stopTranscription = async () => {
            try {
              await Voice.stop();
              setTranscription(false);
              // getOpenAIResponse();
          
              // Save audio file to FileSystem
              const recordingURI = recording.getURI();
              // const audioFileName = `recording_${Date.now()}.m4a`;
              const audioFileName = `recording_${Date.now()}.wav`;
              const audioFilePath = `${FileSystem.documentDirectory}${audioFileName}`;
              await FileSystem.moveAsync({
                from: recordingURI,
                to: audioFilePath,
              });
          
              // Update the recordings array with the saved audio file details
              const updatedRecordings = [...recordings];
              updatedRecordings.push({
                file: audioFilePath,
                duration: formatMillis(recording),
                date: date,
                month: month,
                year: year,
                messages: messages,
              });
              setRecordings(updatedRecordings);
          
              // Navigate to VoiceNote screen with recording URI and transcription messages
              navigation.navigate('VoiceNoteDetails', {
                uri: audioFilePath,
                messages: messages,
                recordings: updatedRecordings,
                memos: memos,
                date: date,
                month: month,
                year: year,
                duration: formatMillis(recording),
              });
            } catch (error) {
              console.log('error: ', error);
            }
          };
          
          async function stopRecording() {
            try {
              if (!recording) {
                return;
              }
          
              console.log('Stopping recording..');
              setRecording(undefined);
              await recording.stopAndUnloadAsync();
              await Audio.setAudioModeAsync({
                allowsRecordingIOS: false,
              });
          
              // Create a loaded sound and update the recordings array
              const { sound, status } = await recording.createNewLoadedSoundAsync();
              console.log('Loaded Sound:', sound);
              console.log('Status:', status);
              const updatedRecordings = [...recordings];
              updatedRecordings.push({
                sound: sound,
                duration: formatMillis(status.durationMillis),
                file: recording.getURI(),
                date: date,
                month: month,
                year: year,
              });
          
              setRecordings(updatedRecordings);
          
              // Save the audio URI to memos
              const uri = recording.getURI();
              console.log('Recording stopped and stored at', uri);
          
              if (uri) {
                setMemos((existingMemos) => [uri, ...existingMemos]);
              }
            } catch (error) {
              console.error('Error stopping recording', error);
            }
          }

          
        const updateScrollView = ()=>{
            setTimeout(()=>{
                ScrollViewRef?.current?.scrollToEnd({animated: true})
            },200)
        }

        const clear = ()=>{
            setMessages([])
        }
        const stopSpeaking = ()=>{
            setSpeaking(true);
        }

        useEffect(()=>{
            //voice handler events
            Voice.onSpeechStart = speechStartHandler;
            Voice.onSpeechEnd = speechEndHandler;
            Voice.onSpeechResults = speechResultsHandler;
            Voice.onSpeechError = speechErrorHandler;

            return ()=>{
                // destroy the voice instance
                Voice.destroy().then(Voice.removeAllListeners);
            }
        },[])

 return (
        <View className="flex-1" style={{ backgroundColor: '#191A23' }}>
            <SafeAreaView className="flex-1 flex mx-5">
            
            {/* TOP MESSAGING */}
            <View className="mt-5" style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', height: hp(6)}}>
                {
                    transcription? (
                        <View style={{ flex: 1, justifyContent: 'center' }}>
                            <Text style={{ fontSize: wp(4.5), fontWeight: 'bold', color: 'white', textAlign: 'center', height: hp(4)}}>Recording</Text>
                            <Text style={{ fontSize: wp(3.5), color: '#A0AEC0', textAlign: 'center' }}>Go a head, I'm listening</Text>
                        </View>
                    ): (
                        <View style={{ flex: 1, justifyContent: 'center' }}>
                            <Text style={{ fontSize: wp(4.5), fontWeight: 'bold', color: 'white', textAlign: 'center', height: hp(4)}}>Recording</Text>
                            <Text style={{ fontSize: wp(3.5), color: '#A0AEC0', textAlign: 'center' }}>Ready to record</Text>
                        </View>
                    )
                }
            </View>

            {/* VISUALIZER */}
            <View className="flex justify-center items-center mt-10" style={{ height: hp(39) }}> 
            {
                transcription? (
                    <Image 
                        className="rounded-full"
                        source={require('/Users/zacharynickerson/VokkoApp/assets/images/wave-active.png')}
                        resizeMode="contain" // Use 'contain' to fit the image within the container
                        style={{ width: '180%', height: '180%' }} // Set width and height to 100% to fill the container
                    />
                ): (
                    <Image 
                        className="rounded-full"
                        source={require('/Users/zacharynickerson/VokkoApp/assets/images/wave-inactive.png')}
                        resizeMode="contain" // Use 'contain' to fit the image within the container
                        style={{ width: '180%', height: '180%' }} // Set width and height to 100% to fill the container
                    />                     
                )
                }    
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
   
            {/* RECORD BUTTON */}
            <View className="flex justify-center items-center mt-5" >
                {
                loading? (
                    <Image
                      source={require('/Users/zacharynickerson/VokkoApp/assets/images//Record-Button-Loading.png')}
                      style={{width: hp(16), height: hp(16)}}
                    />
                ): 
                transcription? (    
                    <TouchableOpacity onPress={() => {
                        stopTranscription();
                        stopRecording();
                    }}> 
                    <Image 
                        className="rounded-full"
                        source={require('/Users/zacharynickerson/VokkoApp/assets/images/voiceLoading.gif')}
                        style={{width: hp(16), height: hp(16)}}
                    />
                    </TouchableOpacity>
                    ) : (
                    <TouchableOpacity onPress={() => {
                            startTranscription();
                            startRecording();
                        }}>
                        <Image 
                            className="rounded-full"
                            source={require('/Users/zacharynickerson/VokkoApp/assets/images/Record-Button.png')}
                            style={{width: hp(16), height: hp(16)}}
                        />
                    </TouchableOpacity>                                    
                    )
                }{
                messages.length>0 && (
                    <TouchableOpacity
                        onPress={clear}
                        style={{
                        position: 'absolute',
                        right: 10,
                        backgroundColor: 'transparent',
                        padding: 2,
                        borderRadius: 44,
                        borderWidth: 2,
                        borderColor: '#4C4D58',
                        width: 55,
                        height: 55,
                        justifyContent: 'center',
                        alignItems: 'center',
                        }}
                    >
                    <Entypo name="cross" size={30} color="white"/>
                    </TouchableOpacity>
                  )
                }{
                speaking && (
                    <TouchableOpacity
                    onPress={stopSpeaking}
                    className="bg-red-400 rounded-3xl p-2 absolute left-10">
                        <Text className="text-white font-semibold">Stop</Text>
                    </TouchableOpacity>
                )
              }
            </View>
        </SafeAreaView>
    </View>
)}