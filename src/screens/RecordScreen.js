import { Alert, Button, Image, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import React, { startTransition, useEffect, useRef, useState } from 'react'
import {heightPercentageToDP as hp, widthPercentageToDP as wp} from 'react-native-responsive-screen';

import { ArrowLeftIcon } from 'react-native-heroicons/solid';
import { Audio } from 'expo-av';
import { Entypo } from "@expo/vector-icons"
import Features from '/Users/zacharynickerson/VokkoApp/src/components/features.js';
import { FlatList } from 'react-native-gesture-handler';
import MemoListItem from "../components/memoListItem.js"
import { StatusBar } from 'expo-status-bar';
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
    const month = new Date().getMonth() + 1;
    const d = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
    ];
    const year = new Date().getFullYear();
    
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
        const startTranscription = async ()=>{
            setTranscription(true);
            try{
                await Voice.start('en-GB'); // en-US
            }catch(error){
                console.log('error: ',error);
            }
        }

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
              const { recording } = await Audio.Recording.createAsync( Audio.RecordingOptionsPresets.HIGH_QUALITY
              );
              setRecording(recording);
              console.log('Recording started');
            } catch (err) {
              console.error('Failed to start recording', err);
            }
          }

          //STOPS
        const stopTranscription = async ()=>{
            try{
                await Voice.stop();
                setTranscription(true);
                //fetch response
                fetchResponse();
            }catch(error){
                console.log('error: ',error);
            }
        }

        async function stopRecording() {
            if (!recording) {3
                return;
            }
            
            console.log('Stopping recording..');
            setRecording(undefined);
            await recording.stopAndUnloadAsync();
            await Audio.setAudioModeAsync({
                allowsRecordingIOS: false,
            });
            
            const { sound, status } = await recording.createNewLoadedSoundAsync();
            const updatedRecordings = [...recordings];
            updatedRecordings.push({
                sound: sound,
                duration: getDurationFormatted(status.durationMillis),
                file: recording.getURI(),
            });
        
            setRecordings(updatedRecordings);
            
            const uri = recording.getURI();
            console.log('Recording stopped and stored at', uri);
        
            if (uri) {
                setMemos((existingMemos) => [uri, ...existingMemos]);
            }
        }

        function getRecordingLines() {
            return recordings.map((recordingLine, index) => {
              return (
                <View key={index} className="p-4 rounded-xl space-y-2" style={[ { backgroundColor: '#242830' }]}>
                    <View className="flex-row items-center space-x-1">
                        <Image source={require("/Users/zacharynickerson/VokkoApp/assets/images/noteicon.png")} style={{height: hp(3), width: hp(3)}} className="mr-2"/>
                        <Text style={[{ fontSize: wp(4) }]} className="font-bold text-white">Recording {index + 1} ({recordingLine.duration})  
                            <View>
                                <Text style={{fontSize: wp(3.7)}} className="text-gray-400 font-regular mt-2">{d[month - 1]} {date}, {year} - Lapa, Lisboa</Text>
                            </View>
                        </Text>
                    </View>
                  {/* <Button style={StyleSheet.button} onPress={() => Sharing.shareAsync(recordingLine.file)} title="Share"></Button> */}
                </View>
              );
            });
          }

        function getDurationFormatted(millis) {
            const minutes = millis / 1000 / 60;
            const minutesDisplay = Math.floor(minutes);
            const seconds = Math.round((minutes - minutesDisplay) * 60);
            const secondsDisplay = seconds < 10 ? `0${seconds}` : seconds;
            return `${minutesDisplay}:${secondsDisplay}`;
          }  


        const fetchResponse = ()=>{
            if(result.trim().length>0){
                let newMessages = [...messages];
                newMessages.push({role: 'user', content: result.trim()});
                setMessages([...newMessages]);
                updateScrollView();
                setLoading(true);
                apiCall(result.trim(), newMessages).then(res=>{
                    // console.log('got api data ',res);
                    setLoading(false);
                    if(res.success){
                        setMessages([...res.data]);
                        updateScrollView();
                        setResult('');
                    }else{
                        Alert.alert('Error', res.msg);
                    }
                })
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




       


        // OLD CODE

        // import { Alert, Button, Image, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
        // import React, { startTransition, useEffect, useRef, useState } from 'react'
        // import {heightPercentageToDP as hp, widthPercentageToDP as wp} from 'react-native-responsive-screen';
        
        // import { ArrowLeftIcon } from 'react-native-heroicons/solid';
        // import { Audio } from 'expo-av';
        // import Features from '/Users/zacharynickerson/VokkoApp/src/components/features.js';
        // import { FlatList } from 'react-native-gesture-handler';
        // import MemoListItem from "../components/memoListItem.js"
        // import { StatusBar } from 'expo-status-bar';
        // import Voice from '@react-native-voice/voice';
        // import { apiCall } from '../api/openAI.js';
        // import { useNavigation } from '@react-navigation/native';
        
        // export default function HomeScreen() {
        //     //Recording variables
        //     const [recording, setRecording] = React.useState();
        //     const [recordings, setRecordings] = React.useState([]);
        //     const [permissionResponse, requestPermission] = Audio.usePermissions();
        //     const [memos, setMemos] = React.useState("");
        //     const [message, setMessage] = React.useState("");
        //     const date = new Date().getDate();
        //     const month = new Date().getMonth() + 1;
        //     const d = ["January", "February", "March", "April", "May", "June",
        //     "July", "August", "September", "October", "November", "December"
        //     ];
        //     const year = new Date().getFullYear();
            
        //     //Transcription  variables
        //         const [transcription, setTranscription] = useState(false);
        //         const [speaking, setSpeaking] = useState(false);
        //         const [messages, setMessages] = useState([] );
                
                
        //         const [result, setResult] = useState('');
        //         const [loading, setLoading] = useState(false);
        //         const ScrollViewRef = useRef(); 
        //         const navigation = useNavigation(); 
            
        //         const speechStartHandler = e=>{
        //             console.log('speech start handler');
        //         }
        //         const speechEndHandler = e=>{
        //             setTranscription(false);
        //             console.log('speech end handler');
        //         }
        //         const speechResultsHandler = e=>{
        //             console.log('voice event: ',e);
        //             const text = e.value[0];
        //             setResult(text); 
        //         }
        //         const speechErrorHandler = e=>{
        //             console.log('speech error handler', e);
        //         }
                
        //         //STARTS
        //         const startTranscription = async ()=>{
        //             setTranscription(true);
        //             try{
        //                 await Voice.start('en-GB'); // en-US
        //             }catch(error){
        //                 console.log('error: ',error);
        //             }
        //         }
        
        //         // async function startRecording() {
        //         //     try {
        //         //       const permission = await Audio.requestPermissionsAsync();
                
        //         //       if (permission.status === "granted") {
        //         //         await Audio.setAudioModeAsync({
        //         //           allowsRecordingIOS: true,
        //         //           playsInSilentModeIOS: true
        //         //         });
                        
        //         //         const { recording } = await Audio.Recording.createAsync(
        //         //           Audio.RECORDING_OPTIONS_PRESET_HIGH_QUALITY
        //         //         );
                
        //         //         setRecording(recording);
        //         //         setTranscription(true);
        //         //       } else {
        //         //         setMessage("Please grant permission to app to access microphone");
        //         //       }
        //         //     } catch (err) {
        //         //       console.error('Failed to start recording', err);
        //         //     }
        //         //   }
        
        //         async function startRecording() {
        //             if (!permissionResponse) {
        //                 return;
        //             }
                    
        //             try {
        //               if (permissionResponse.status !== 'granted') {
        //                 console.log('Requesting permission..');
        //                 await requestPermission();
        //               }
        //               await Audio.setAudioModeAsync({
        //                 allowsRecordingIOS: true,
        //                 playsInSilentModeIOS: true,
        //               });
                
        //               console.log('Starting recording..');
        //               const { recording } = await Audio.Recording.createAsync( Audio.RecordingOptionsPresets.HIGH_QUALITY
        //               );
        //               setRecording(recording);
        //               console.log('Recording started');
        //             } catch (err) {
        //               console.error('Failed to start recording', err);
        //             }
        //           }
        
        
        //           //STOPS
        //         const stopTranscription = async ()=>{
        //             try{
        //                 await Voice.stop();
        //                 setTranscription(true);
        //                 //fetch response
        //                 fetchResponse();
        //             }catch(error){
        //                 console.log('error: ',error);
        //             }
        //         }
        
        
        //         async function stopRecording() {
        //             if (!recording) {
        //                 return;
        //             }
                    
        //             console.log('Stopping recording..');
        //             setRecording(undefined);
        //             await recording.stopAndUnloadAsync();
        //             await Audio.setAudioModeAsync({
        //                 allowsRecordingIOS: false,
        //             });
                    
        //             const { sound, status } = await recording.createNewLoadedSoundAsync();
        //             const updatedRecordings = [...recordings];
        //             updatedRecordings.push({
        //                 sound: sound,
        //                 duration: getDurationFormatted(status.durationMillis),
        //                 file: recording.getURI(),
        //             });
                
        //             setRecordings(updatedRecordings);
                    
        //             const uri = recording.getURI();
        //             console.log('Recording stopped and stored at', uri);
                
        //             if (uri) {
        //                 setMemos((existingMemos) => [uri, ...existingMemos]);
        //             }
        //         }
        
        
        
        
        //         function getRecordingLines() {
        //             return recordings.map((recordingLine, index) => {
        //               return (
        //                 <View key={index} className="p-4 rounded-xl space-y-2" style={[ { backgroundColor: '#242830' }]}>
        //                     <View className="flex-row items-center space-x-1">
        //                         <Image source={require("/Users/zacharynickerson/VokkoApp/assets/images/noteicon.png")} style={{height: hp(3), width: hp(3)}} className="mr-2"/>
        //                         <Text style={[{ fontSize: wp(4) }]} className="font-bold text-white">Recording {index + 1} ({recordingLine.duration})  
        //                             <View>
        //                                 <Text style={{fontSize: wp(3.7)}} className="text-gray-400 font-regular mt-2">{d[month - 1]} {date}, {year} - Lapa, Lisboa</Text>
        //                             </View>
        //                         </Text>
        //                     </View>
        //                   {/* <Button style={StyleSheet.button} onPress={() => Sharing.shareAsync(recordingLine.file)} title="Share"></Button> */}
        //                 </View>
        //               );
        //             });
        //           }
        
        //         function getDurationFormatted(millis) {
        //             const minutes = millis / 1000 / 60;
        //             const minutesDisplay = Math.floor(minutes);
        //             const seconds = Math.round((minutes - minutesDisplay) * 60);
        //             const secondsDisplay = seconds < 10 ? `0${seconds}` : seconds;
        //             return `${minutesDisplay}:${secondsDisplay}`;
        //           }  
        
        
        //         const fetchResponse = ()=>{
        //             if(result.trim().length>0){
        //                 let newMessages = [...messages];
        //                 newMessages.push({role: 'user', content: result.trim()});
        //                 setMessages([...newMessages]);
        //                 updateScrollView();
        //                 setLoading(true);
        //                 apiCall(result.trim(), newMessages).then(res=>{
        //                     // console.log('got api data ',res);
        //                     setLoading(false);
        //                     if(res.success){
        //                         setMessages([...res.data]);
        //                         updateScrollView();
        //                         setResult('');
        //                     }else{
        //                         Alert.alert('Error', res.msg);
        //                     }
        //                 })
        //             }
        //         }
        
        //         const updateScrollView = ()=>{
        //             setTimeout(()=>{
        //                 ScrollViewRef?.current?.scrollToEnd({animated: true})
        //             },200)
        //         }
        
        //         const clear = ()=>{
        //             setMessages([])
        //         }
        //         const stopSpeaking = ()=>{
        //             setSpeaking(true);
        //         }
        
        //         useEffect(()=>{
        //             //voice handler events
        //             Voice.onSpeechStart = speechStartHandler;
        //             Voice.onSpeechEnd = speechEndHandler;
        //             Voice.onSpeechResults = speechResultsHandler;
        //             Voice.onSpeechError = speechErrorHandler;
        
        //             return ()=>{
        //                 // destroy the voice instance
        //                 Voice.destroy().then(Voice.removeAllListeners);
        //             }
        //         },[])
        
        //         // console.log('result: ',result);
        
        // //     return (
        // //         <View className="flex-1" style={{ backgroundColor: '#191A23' }}>
        // //             <SafeAreaView className="flex-1 flex mx-5">
        // //                 {/* {bot icon} */}
        // //                 <View className="flex-row justify-center" style={{height: hp(6)}}>
        // //                     {/* <Image source={require('/Users/zacharynickerson/VokkoApp/assets/images/bot.png')} style={{height: hp(15), width: hp(15)}}/> */}
        // //                 </View>
        
        // //                 {/* {feature || messages} */}
        // //                 {
        // //                     messages.length>0? (
                                
        // //                         <View className="space-y-2 flex-1">
        // //                             <Text style={{fontSize: wp(3.5)}} className="font-regular text-gray-400">Well Spoken!</Text>
                                    
        // //                             <View className="p-4 rounded-xl space-y-2 mb-1" style={{ backgroundColor: '#242830' }}>
        // //                             {getRecordingLines()}
        // //                             <FlatList data={memos} renderItem={({ item }) => <MemoListItem uri={item} />}/>
                                      
        // //                                 <StatusBar style="auto" />
        // //                             </View>
                                    
        // //                             <Text style={{fontSize: wp(5)}} className="text-white font-semibold ml-1 mb-1">
        // //                                 Summary
        // //                             </Text>
        // //                             <View
        // //                                 style={{height: hp(45), backgroundColor: '#242830'}}
        // //                                 className="bg-neutral-200 rounded-3xl p-4"
        // //                             >
        // //                                 <ScrollView
        // //                                     ref={ScrollViewRef}
        // //                                     bounces={false}
        // //                                     className="space-y-4"
        // //                                     showsVerticalScrollIndicator={false}
        
        // //                                 >
        // //                                     {
        // //                                         messages.map((message, index)=>{
        // //                                             if(message.role=='assistant'){
        // //                                                 if(message.content.includes('https')){
        // //                                                     /// its an ai image
        // //                                                     return(
        // //                                                     <View>
        // //                                                         {/* <View className="p-2 flex rounded-2xl bg-emerald-100 rounded-tl">
        // //                                                             <Image
        // //                                                                 source={{uri: message.content}}
        // //                                                                 className="rounded-2xl"
        // //                                                             i    resizeMode="contain"
        // //                                                                 style={{height: wp(60), width: wp(60)}}
        // //                                                             /> 
        // //                                                         </View> */}
        // //                                                     </View>
        // //                                                     )
        // //                                                 }else{
        // //                                                     // text response
        // //                                                     return(
        // //                                                         <View>
        // //                                                             {/* key={index}
        // //                                                             style={{width: wp(70)}}
        // //                                                             className="bg-emerald-100 rounded-xl p-2 rounded-tl-none">
        // //                                                                 <Text>
        // //                                                                     {message.content}
        // //                                                                 </Text> */}
        // //                                                         </View>
                                                                
        // //                                                     )
        // //                                                 }
        // //                                                 }else{
        // //                                                     //user input
        // //                                                     return (
        // //                                                         <View key={index} className="flex-row justify-left">
        // //                                                             <View 
        // //                                                                 style={{width: wp(80) }}
        // //                                                                 className="rounded-xl p-4 rounded-tr-none" 
        // //                                                             >
        // //                                                                     <Text className="text-white font-bold" style={{fontSize: wp(3.8)}}>
        // //                                                                         {message.content}
        // //                                                                     </Text>
        // //                                                             </View>
        // //                                                         </View>
        // //                                                     )
        // //                                                 }
        // //                                             })
        // //                                         }
        // //                                 </ScrollView>
        // //                             </View>
                                    
        // //                         </View>
        // //                     ): (
        // //                         <Features />
        // //                     )
        // //                 }
        // //                 {/*recording, clear, and stop buttons*/}
        // //                 <View className="flex justify-center items-center mt-16" >
        // //                     {
          
        // //                         loading? (
        // //                             <Image
        // //                                 source={require('/Users/zacharynickerson/VokkoApp/assets/images/pablita-loading.gif')}
        // //                                 style={{width: hp(10), height: hp(10)}}
        // //                             />
        // //                             ):
                                    
        // //                             transcription? (
                                    
        // //                             <TouchableOpacity onPress={() => {
        // //                                 stopTranscription();
        // //                                 stopRecording();
        // //                             }}> 
        // //                                 <Image 
        // //                                     className="rounded-full"
        // //                                     source={require('/Users/zacharynickerson/VokkoApp/assets/images/voiceLoading.gif')}
        // //                                     style={{width: hp(16), height: hp(16)}}
        // //                                 />
        // //                             </TouchableOpacity>
        // //                             ) : (
        // //                                 <TouchableOpacity onPress={() => {
        // //                                     startTranscription();
        // //                                     startRecording();
        // //                                 }}>
        // //                                     <Image 
        // //                                         className="rounded-full"
        // //                                         source={require('/Users/zacharynickerson/VokkoApp/assets/images/Record-Button.png')}
        // //                                         style={{width: hp(16), height: hp(16)}}
        // //                                     />
        // //                                  </TouchableOpacity>                                    
        // //                             )
        // //                     }
        
        // //                     {
        // //                         messages.length>0 && (
        // //                             <TouchableOpacity
        // //                                 onPress={clear}
        // //                                 className="bg-neutral-400 rounded-3xl p-2 absolute right-10">
        // //                                     <Text className="text-white font-semibold">Clear</Text>
        // //                             </TouchableOpacity>
        // //                         )
        // //                     }
        
        // //                     {
        // //                         speaking && (
        // //                             <TouchableOpacity
        // //                             onPress={stopSpeaking}
        // //                             className="bg-red-400 rounded-3xl p-2 absolute left-10">
        // //                                 <Text className="text-white font-semibold">Stop</Text>
        // //                             </TouchableOpacity>
        // //                         )
        // //                     }
        
        // //                 </View>
        // //             </SafeAreaView>
        // //         </View>
        // //     )
        // // }
        




        //------------------------------------------------



        // console.log('result: ',result);

//     return (
//         <View className="flex-1" style={{ backgroundColor: '#191A23' }}>
//             <SafeAreaView className="flex-1 flex mx-5">
//                 {/* {bot icon} */}
//                 <View className="flex-row justify-center" style={{height: hp(6)}}>
//                     {/* <Image source={require('/Users/zacharynickerson/VokkoApp/assets/images/bot.png')} style={{height: hp(15), width: hp(15)}}/> */}
//                 </View>

//                 {/* {feature || messages} */}
//                 {
//                     messages.length>0? (
                        
//                         <View className="space-y-2 flex-1">
//                             <Text style={{fontSize: wp(3.5)}} className="font-regular text-gray-400">Well Spoken!</Text>
                            
//                             <View className="p-4 rounded-xl space-y-2 mb-1" style={{ backgroundColor: '#242830' }}>
//                             {getRecordingLines()}
//                             <FlatList data={memos} renderItem={({ item }) => <MemoListItem uri={item} />}/>
                              
//                                 <StatusBar style="auto" />
//                             </View>
                            
//                             <Text style={{fontSize: wp(5)}} className="text-white font-semibold ml-1 mb-1">
//                                 Summary
//                             </Text>
//                             <View
//                                 style={{height: hp(45), backgroundColor: '#242830'}}
//                                 className="bg-neutral-200 rounded-3xl p-4"
//                             >
//                                 <ScrollView
//                                     ref={ScrollViewRef}
//                                     bounces={false}
//                                     className="space-y-4"
//                                     showsVerticalScrollIndicator={false}

//                                 >
//                                     {
//                                         messages.map((message, index)=>{
//                                             if(message.role=='assistant'){
//                                                 if(message.content.includes('https')){
//                                                     /// its an ai image
//                                                     return(
//                                                     <View>
//                                                         {/* <View className="p-2 flex rounded-2xl bg-emerald-100 rounded-tl">
//                                                             <Image
//                                                                 source={{uri: message.content}}
//                                                                 className="rounded-2xl"
//                                                             i    resizeMode="contain"
//                                                                 style={{height: wp(60), width: wp(60)}}
//                                                             /> 
//                                                         </View> */}
//                                                     </View>
//                                                     )
//                                                 }else{
//                                                     // text response
//                                                     return(
//                                                         <View>
//                                                             {/* key={index}
//                                                             style={{width: wp(70)}}
//                                                             className="bg-emerald-100 rounded-xl p-2 rounded-tl-none">
//                                                                 <Text>
//                                                                     {message.content}
//                                                                 </Text> */}
//                                                         </View>
                                                        
//                                                     )
//                                                 }
//                                                 }else{
//                                                     //user input
//                                                     return (
//                                                         <View key={index} className="flex-row justify-left">
//                                                             <View 
//                                                                 style={{width: wp(80) }}
//                                                                 className="rounded-xl p-4 rounded-tr-none" 
//                                                             >
//                                                                     <Text className="text-white font-bold" style={{fontSize: wp(3.8)}}>
//                                                                         {message.content}
//                                                                     </Text>
//                                                             </View>
//                                                         </View>
//                                                     )
//                                                 }
//                                             })
//                                         }
//                                 </ScrollView>
//                             </View>
                            
//                         </View>
//                     ): (
//                         <Features />
//                     )
//                 }
//                 {/*recording, clear, and stop buttons*/}
//                 <View className="flex justify-center items-center mt-16" >
//                     {
  
//                         loading? (
//                             <Image
//                                 source={require('/Users/zacharynickerson/VokkoApp/assets/images/pablita-loading.gif')}
//                                 style={{width: hp(10), height: hp(10)}}
//                             />
//                             ):
                            
//                             transcription? (
                            
//                             <TouchableOpacity onPress={() => {
//                                 stopTranscription();
//                                 stopRecording();
//                             }}> 
//                                 <Image 
//                                     className="rounded-full"
//                                     source={require('/Users/zacharynickerson/VokkoApp/assets/images/voiceLoading.gif')}
//                                     style={{width: hp(16), height: hp(16)}}
//                                 />
//                             </TouchableOpacity>
//                             ) : (
//                                 <TouchableOpacity onPress={() => {
//                                     startTranscription();
//                                     startRecording();
//                                 }}>
//                                     <Image 
//                                         className="rounded-full"
//                                         source={require('/Users/zacharynickerson/VokkoApp/assets/images/Record-Button.png')}
//                                         style={{width: hp(16), height: hp(16)}}
//                                     />
//                                  </TouchableOpacity>                                    
//                             )
//                     }

//                     {
//                         messages.length>0 && (
//                             <TouchableOpacity
//                                 onPress={clear}
//                                 className="bg-neutral-400 rounded-3xl p-2 absolute right-10">
//                                     <Text className="text-white font-semibold">Clear</Text>
//                             </TouchableOpacity>
//                         )
//                     }

//                     {
//                         speaking && (
//                             <TouchableOpacity
//                             onPress={stopSpeaking}
//                             className="bg-red-400 rounded-3xl p-2 absolute left-10">
//                                 <Text className="text-white font-semibold">Stop</Text>
//                             </TouchableOpacity>
//                         )
//                     }

//                 </View>
//             </SafeAreaView>
//         </View>
//     )
// }