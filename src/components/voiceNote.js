import { Alert, Button, Image, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import React, { startTransition, useEffect, useRef, useState } from 'react'
import {heightPercentageToDP as hp, widthPercentageToDP as wp} from 'react-native-responsive-screen';

import { ArrowLeftIcon } from 'react-native-heroicons/solid';
import { Audio } from 'expo-av';
import Features from '/Users/zacharynickerson/VokkoApp/src/components/features.js';
import { FlatList } from 'react-native-gesture-handler';
import MemoListItem from "../components/memoListItem.js"
import { StatusBar } from 'expo-status-bar';
import Voice from '@react-native-voice/voice';
import { apiCall } from '../api/openAI.js';
import { useNavigation } from '@react-navigation/native';

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

export default function voiceNote() {
    return (
        <View className="flex-1" style={{ backgroundColor: '#191A23' }}>
            <SafeAreaView className="flex-1 flex mx-5">
                    <View className="space-y-2 flex-1">
                        <Text style={{fontSize: wp(3.5)}} className="font-regular text-gray-400">Well Spoken!</Text>
                        <View className="p-4 rounded-xl space-y-2 mb-1" style={{ backgroundColor: '#242830' }}>
                            {getRecordingLines()}
                            <FlatList data={memos} renderItem={({ item }) => <MemoListItem uri={item} />}/>                      
                            <StatusBar style="auto" />
                        </View>
                        <Text style={{fontSize: wp(5)}} className="text-white font-semibold ml-1 mb-1">Summary</Text>
                        <View
                            style={{height: hp(45), backgroundColor: '#242830'}}
                            className="bg-neutral-200 rounded-3xl p-4"
                        >
                        <ScrollView
                            ref={ScrollViewRef}
                            bounces={false}
                            className="space-y-4"
                            showsVerticalScrollIndicator={false}
                        >
                        {
                            messages.map((message, index)=>{
                                if(message.role=='assistant'){
                                    if(message.content.includes('https')){
                                        return(<View>{}</View>)
                                    }else{
                                        return(<View>{}</View>)
                                    }}else{
                                        //user input
                                        return (
                                            <View key={index} className="flex-row justify-left">
                                                <View 
                                                    style={{width: wp(80) }}
                                                    className="rounded-xl p-4 rounded-tr-none" 
                                                >
                                                    <Text 
                                                    className="text-white font-bold" 
                                                    style={{fontSize: wp(3.8)}}>
                                                    {message.content}
                                                    </Text>
                                                </View>
                                            </View>
                                            )
                                        }
                                    })
                                }
                            </ScrollView>
                        </View>  
                    </View>
            </SafeAreaView>
        </View>
    )
}