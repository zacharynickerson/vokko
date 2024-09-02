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

    // Create voice note object
    const voiceNote = {
      voiceNoteId,
      title,
      uri: downloadUrl,
      createdDate,
      size,
      location,
      transcript: 'Transcription pending',
      transcriptionStatus: 'pending',
      summary: '',
      taskArray: []
    };

    // Save voice note to Firebase Database immediately
    await saveToFirebaseDatabase(userId, voiceNote, downloadUrl);
    console.log('Voice note metadata saved to database');

    // Attempt transcription
    try {
      console.log('Calling transcribeAudio function with URL:', downloadUrl);
      const transcribeFunction = httpsCallable(functions, 'transcribeAudio');
      const transcriptionResult = await transcribeFunction({ audioUrl: downloadUrl });
      console.log('Transcription result:', transcriptionResult);
      const transcript = transcriptionResult.data.transcript;

      // Update voice note with transcript
      voiceNote.transcript = transcript;
      voiceNote.transcriptionStatus = 'completed';
      await saveToFirebaseDatabase(userId, voiceNote, downloadUrl);
      console.log('Voice note updated with transcript');
    } catch (transcriptionError) {
      console.error('Transcription failed:', transcriptionError);
      // Update transcription status to 'failed'
      voiceNote.transcriptionStatus = 'failed';
      await saveToFirebaseDatabase(userId, voiceNote, downloadUrl);
      console.log('Voice note updated with failed transcription status');
    }

    const updatedVoiceNotes = [voiceNote, ...voiceNotes];
    await saveVoiceNotesToLocal(updatedVoiceNotes);

    voiceNoteSync.addToSyncQueue(voiceNote);

    return { voiceNote, updatedVoiceNotes };
  } catch (error) {
    console.error('Error processing voice note:', error);
    throw error;
  }
};