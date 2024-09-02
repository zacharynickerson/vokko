import { generateUUID, getFileSize, getLocation, getCurrentDate } from './helpers';
import { saveToFirebaseStorage, saveToFirebaseDatabase, functions, httpsCallable } from '../../config/firebase';
import { saveVoiceNotesToLocal } from './voiceNoteLocalStorage';
import { voiceNoteSync } from './VoiceNoteSync';

export const processVoiceNote = async (uri, voiceNotes, userId) => {
  try {
    const voiceNoteId = generateUUID();
    const title = `Recording ${voiceNotes.length + 1}`;
    const createdDate = getCurrentDate();
    const size = await getFileSize(uri);
    const location = await getLocation();
    
    // Upload the file to Firebase Storage
    const downloadUrl = await saveToFirebaseStorage(uri, voiceNoteId);
    console.log('Audio file uploaded, URL:', downloadUrl);

    // Call the Cloud Function for transcription
    console.log('Calling transcribeAudio function with URL:', downloadUrl);
    const transcribeFunction = httpsCallable(functions, 'transcribeAudio');
    const transcriptionResult = await transcribeFunction({ audioUrl: downloadUrl });
    console.log('Transcription result:', transcriptionResult);
    const transcript = transcriptionResult.data.transcript;

    const voiceNote = {
      voiceNoteId,
      title,
      uri: downloadUrl, // Use the Firebase Storage URL
      createdDate,
      size,
      location,
      transcript,
      summary: '',
      taskArray: []
    };

    // Save to Firebase Database
    await saveToFirebaseDatabase(userId, voiceNote, downloadUrl);

    const updatedVoiceNotes = [voiceNote, ...voiceNotes];
    await saveVoiceNotesToLocal(updatedVoiceNotes);

    voiceNoteSync.addToSyncQueue(voiceNote);

    return { voiceNote, updatedVoiceNotes };
  } catch (error) {
    console.error('Error processing voice note:', error);
    if (error.code && error.details) {
      console.error('Firebase Error Code:', error.code);
      console.error('Firebase Error Details:', error.details);
    }
    throw error;
  }
};