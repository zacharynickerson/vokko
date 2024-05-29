import React, { useRef, useState, useEffect } from "react";
import { Text, View, ScrollView } from "react-native";
import Voice from '@react-native-voice/voice';

const Transcriber = ({ onStart, onStop }) => {
  const [messages, setMessages] = useState([]);

  const speechResultsHandler = (e) => {
    console.log('Voice event: ', e);
    const text = e.value[0];
    setMessages([{ role: 'user', content: text.trim() }]);
  };

  const startTranscription = async () => {
    console.log('Starting transcription...');
    onStart && onStart(); // Invoke onStart prop
    try {
      await Voice.start('en-GB');
    } catch (error) {
      console.log('Error starting transcription: ', error);
    }
  };

  const stopTranscription = async () => {
    console.log('Stopping transcription...');
    onStop && onStop(); // Invoke onStop prop
    try {
      await Voice.stop();
    } catch (error) {
      console.log('Error stopping transcription: ', error);
    }
  };

  useEffect(() => {
    Voice.onSpeechResults = speechResultsHandler;

    return () => {
      Voice.destroy().then(Voice.removeAllListeners);
    };
  }, []);

  return (
    <View className="mt-2" style={{ maxHeight: 86, overflow: 'hidden' }}>
      <ScrollView
        style={{
          height: 100,
          paddingHorizontal: 16,
          flexDirection: 'column-reverse',
        }}
        contentContainerStyle={{
          justifyContent: 'flex-end',
          flexGrow: 1,
        }}
        showsVerticalScrollIndicator={false}
      >
        {messages.map((message, index) => (
          <Text
            key={index}
            style={{
              fontSize: 24,
              fontFamily: 'Inter',
              color: 'white',
              textAlign: 'left',
              fontWeight: '500',
            }}
          >
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
  );
};

export default Transcriber;
