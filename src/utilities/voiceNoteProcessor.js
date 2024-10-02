import { generateUUID, getFileSize, getLocation, getCurrentDate } from './helpers';
// import { saveVoiceNotesToLocal } from './voiceNoteLocalStorage';
import { startBackgroundUpload } from './backgroundUpload';
import { createVoiceNote } from '../../config/firebase'; // Import the new Firebase function


export const processVoiceNote = async (uri, voiceNotes, userId) => {
  try {
    console.log('Processing voice note...');
    const voiceNoteId = generateUUID();
    const title = `Recording ${voiceNotes.length + 1}`;
    const createdDate = getCurrentDate();
    const location = await getLocation();


    const voiceNote = {
      voiceNoteId,
      type: 'solo', // or 'guided' based on your logic
      title,
      location,
      audioFileSize: await getFileSize(uri),
      audioFileUri: uri,
      createdDate,
      transcriptionStatus: 'pending',
      summary: '',
    };


   // Create voice note in Firebase
   await createVoiceNote(userId, voiceNote);

   // Start background upload
   await startBackgroundUpload(uri, voiceNoteId, userId, voiceNote);

   const updatedVoiceNotes = [voiceNote, ...voiceNotes];
  //  await saveVoiceNotesToLocal(updatedVoiceNotes);

   console.log('Voice note processed and queued for upload');
   return { voiceNote, updatedVoiceNotes };
 } catch (error) {
   console.error('Error processing voice note:', error);
   throw error;
 }
};