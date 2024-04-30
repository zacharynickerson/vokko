import { ActivityIndicator, Image, SafeAreaView, Text, TouchableOpacity, View } from 'react-native';
import React, { useEffect, useState } from 'react';
import { heightPercentageToDP as hp, widthPercentageToDP as wp } from 'react-native-responsive-screen';
import { onValue, ref } from 'firebase/database';
import { useFocusEffect, useNavigation } from '@react-navigation/native';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { FlatList } from 'react-native-gesture-handler';
import { db } from '../../config/firebase';

export default function LibraryScreen() {

  const [voiceNotes, setVoiceNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation();


      useEffect(() => {
        const loadVoiceNotes = () => {
          const voiceNotesRef = ref(db, 'voiceNotes');
          onValue(voiceNotesRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
              const voiceNotesArray = Object.values(data);
              setVoiceNotes(voiceNotesArray);
            }
            setLoading(false);
          });
        };

        loadVoiceNotes();
      }, []);

    // const loadVoiceNotes = async () => {
    //   try {
    //     const savedVoiceNotes = await AsyncStorage.getItem('voiceNotesList');
    //     console.log('Saved voice notes from AsyncStorage:', savedVoiceNotes);
  
    //     if (savedVoiceNotes) {
    //       const parsedNotes = JSON.parse(savedVoiceNotes);
    //       // console.log('Parsed voice notes:', parsedNotes.filter((note) => note && note.uri));
  
    //       // Sort the voiceNotes array based on date in descending order
    //       const sortedNotes = parsedNotes.filter((note) => note && note.uri).sort((a, b) => b.date - a.date);
    //       setVoiceNotes(sortedNotes);
    //     } else {
    //       // If 'voiceNotesList' key is not defined, initialize it to an empty array
    //       await AsyncStorage.setItem('voiceNotesList', JSON.stringify([]));
    //     }
    //   } catch (error) {
    //     console.error('Error loading voice notes:', error);
    //   } finally {
    //     // Set loading to false when the voice notes are loaded
    //     setLoading(false);
    //   }
    // };
  
    // useEffect(() => {
    //   // Load voice notes when the component mounts
    //   loadVoiceNotes();
    // }, []);
  
    // Use useFocusEffect to refresh the voice notes when the screen comes into focus
    // useFocusEffect(
    //   React.useCallback(() => {
    //     loadVoiceNotes();
    //   }, [])
    // );

    

    // Function to clear AsyncStorage
    const clearAsyncStorage = async () => {
      try {
        await AsyncStorage.clear();
        console.log('AsyncStorage cleared successfully.');
      } catch (error) {
        console.error('Error clearing AsyncStorage:', error);
      }
    };

    if (loading) {
      // Render a loading indicator or message
      return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#ffffff" />
        </View>
      );
    }
        
  return (
    <View className="flex-1 space-y-4" style={{ backgroundColor: '#191A23' }}>
        <SafeAreaView className="flex-1 flex mx-5">

            {/* TOP TEXT */}
            <TouchableOpacity onPress={clearAsyncStorage}>
              <Text style={{ fontSize: wp(3.7)}} className="text-gray-400 font-regular mt-2">
                Hello Zachary
              </Text>
            </TouchableOpacity>

            
            {/* <Text>Hello {$user.firstName}</Text> */}
            <View style={{ marginBottom: 10 }}>
              <Text 
                className="text-white font-regular mt-2"
                style={{ 
                fontSize: 18,
                }}
              >
                Voice Notes</Text>
            </View>
            
            {/* LIBRARY */}
            <FlatList
            
              data={voiceNotes.filter(note => note && note.uri).reverse()} // Filter out null or invalid items
              keyExtractor={(item) => item?.uri || ''}
              renderItem={({ item }) => (
                item ? (
                  <TouchableOpacity onPress={() => navigation.navigate('VoiceNoteDetails', { ...item })}>
                    <View style={{ marginBottom: 10 }}>
                    <View className="p-4 rounded-xl space-y-2" style={{ backgroundColor: '#242830' }}>
                    <View className="flex-row items-center space-x-1">
                      <Image source={require("/Users/zacharynickerson/Desktop/vokko/assets/images/noteicon.png")} style={{height: hp(3), width: hp(3)}} className="mr-2"/>
                      <Text style={{fontSize: wp(4.3)}} className="font-bold text-white">{item.noteTitle}</Text>
                      <View className="flex-row items-center space-x-1"></View>
                  </View>
                  <Text style={{fontSize: wp(4)}} className="text-gray-400 font-regular"> 
                  {item.month} {item.date}, {item.year} - Lapa, Lisboa</Text>
                  </View>
                  </View>
                  </TouchableOpacity>
                ) : null
              )}
            />
            </SafeAreaView>
    </View>
  );
}
