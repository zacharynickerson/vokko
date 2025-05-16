import { Linking } from 'react-native';
import { ref, get } from 'firebase/database';
import { db } from '../../config/firebase';

export const sendToAI = async (noteText, aiService) => {
  try {
    // Get user's connected integrations
    const userRef = ref(db, `users/${auth.currentUser.uid}/integrations`);
    const snapshot = await get(userRef);
    const integrations = snapshot.val() || {};

    // Check if the requested AI service is connected
    if (!integrations[aiService]?.connected) {
      throw new Error(`${aiService} is not connected`);
    }

    // Encode the note text for URL
    const encodedText = encodeURIComponent(noteText);

    // Open the appropriate URL based on the AI service
    if (aiService === 'chatgpt') {
      await Linking.openURL(`https://chat.openai.com/?text=${encodedText}`);
    } else if (aiService === 'claude') {
      await Linking.openURL(`https://claude.ai/?text=${encodedText}`);
    }

    return true;
  } catch (error) {
    console.error(`Error sending to ${aiService}:`, error);
    throw error;
  }
};

export const isIntegrationConnected = async (integrationId) => {
  try {
    const userRef = ref(db, `users/${auth.currentUser.uid}/integrations/${integrationId}`);
    const snapshot = await get(userRef);
    return snapshot.exists() && snapshot.val().connected;
  } catch (error) {
    console.error('Error checking integration status:', error);
    return false;
  }
}; 