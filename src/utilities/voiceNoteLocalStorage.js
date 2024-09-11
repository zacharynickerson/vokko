import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth } from '../../config/firebase'; // Adjust the import path as needed

const getVoiceNotesKey = (userId) => `voice_notes_${userId}`;

export const saveVoiceNotesToLocal = async (voiceNotes) => {
  try {
    const userId = auth.currentUser?.uid;
    if (!userId) {
      throw new Error('User not authenticated');
    }
    const jsonValue = JSON.stringify(voiceNotes);
    await AsyncStorage.setItem(getVoiceNotesKey(userId), jsonValue);
  } catch (e) {
    console.error('Failed to save voice notes to local storage', e);
  }
};

export const getVoiceNotesFromLocal = async () => {
  try {
    const userId = auth.currentUser?.uid;
    if (!userId) {
      throw new Error('User not authenticated');
    }
    const jsonValue = await AsyncStorage.getItem(getVoiceNotesKey(userId));
    return jsonValue != null ? JSON.parse(jsonValue) : [];
  } catch (e) {
    console.error('Failed to load voice notes from local storage', e);
    return [];
  }
};

export const saveVoiceNoteToLocal = async (voiceNote) => {
  try {
    const userId = auth.currentUser?.uid;
    if (!userId) {
      throw new Error('User not authenticated');
    }
    const existingVoiceNotes = await getVoiceNotesFromLocal();
    existingVoiceNotes.push(voiceNote);
    await saveVoiceNotesToLocal(existingVoiceNotes);
  } catch (error) {
    console.error('Failed to save voice note locally:', error);
  }
};

export const clearLocalVoiceNotes = async () => {
  try {
    const userId = auth.currentUser?.uid;
    if (!userId) {
      throw new Error('User not authenticated');
    }
    await AsyncStorage.removeItem(getVoiceNotesKey(userId));
  } catch (e) {
    console.error('Failed to clear local voice notes', e);
  }
};