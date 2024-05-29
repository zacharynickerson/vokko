import AsyncStorage from '@react-native-async-storage/async-storage';

const VOICE_NOTES_KEY = 'voice_notes';

// Function to save the entire voice notes array to local storage
export const saveVoiceNotesToLocal = async (voiceNotes) => {
  try {
    const jsonValue = JSON.stringify(voiceNotes);
    await AsyncStorage.setItem(VOICE_NOTES_KEY, jsonValue);
  } catch (e) {
    console.error('Failed to save voice notes to local storage', e);
  }
};

// Function to get the entire voice notes array from local storage
export const getVoiceNotesFromLocal = async () => {
  try {
    const jsonValue = await AsyncStorage.getItem(VOICE_NOTES_KEY);
    return jsonValue != null ? JSON.parse(jsonValue) : [];
  } catch (e) {
    console.error('Failed to load voice notes from local storage', e);
    return [];
  }
};

// Function to save a single voice note to the existing array in local storage
export const saveVoiceNoteToLocal = async (voiceNote) => {
  try {
    const existingVoiceNotes = await getVoiceNotesFromLocal();
    existingVoiceNotes.push(voiceNote);
    await saveVoiceNotesToLocal(existingVoiceNotes);
  } catch (error) {
    console.error('Failed to save voice note locally:', error);
  }
};
