import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { scheduleSession } from '/Users/zacharynickerson/Desktop/vokko/config/firebase.js';
import { scheduleCallNotification } from '../utilities/notificationManager';


const TestSessionButton = () => {
  const handleCreateTestSession = async () => {
    const sessionData = {
      guideId: '1',
      guideName: 'Dr. Allison Hart',
      guidePhoto: 'assets/images/Avatar Female 6.png',
      moduleId: '1',
      moduleName: 'Daily Planning',
      userId: 'DNwu82ReOLgYuXL7rbb3uHmVuGN2',
      // Other necessary session data...
    };

    try {
      const sessionId = await scheduleSession(sessionData.userId, sessionData);
      console.log('Test session created with ID:', sessionId);
    } catch (error) {
      console.error('Error creating test session:', error);
    }
  };

  return (
    <TouchableOpacity style={styles.button} onPress={handleCreateTestSession}>
      <Text style={styles.buttonText}>Create Test Session</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#4CAF50',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    margin: 20,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default TestSessionButton; 