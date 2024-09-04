import { generateUUID, getFileSize, getLocation, getCurrentDate } from './helpers';
import { saveVoiceNotesToLocal } from './voiceNoteLocalStorage';
import { compressAudio } from './audioCompression';
import { startBackgroundUpload } from './backgroundUpload';

export const processVoiceNote = async (uri, voiceNotes, userId) => {
  try {
    console.log('Processing voice note...');
    const voiceNoteId = generateUUID();
    const title = `Recording ${voiceNotes.length + 1}`;
    const createdDate = getCurrentDate();
    const location = await getLocation();

    // Compress the audio
    const compressedUri = await compressAudio(uri);
    const size = await getFileSize(compressedUri);

    const voiceNote = {
      voiceNoteId,
      title,
      uri: compressedUri, // Use the compressed URI for now
      createdDate,
      size,
      location,
      transcript: 'Transcription pending',
      transcriptionStatus: 'pending',
      summary: '',
      taskArray: []
    };

    // Start background upload
    await startBackgroundUpload(compressedUri, `${voiceNoteId}.m4a`, userId, voiceNote);

    const updatedVoiceNotes = [voiceNote, ...voiceNotes];
    await saveVoiceNotesToLocal(updatedVoiceNotes);

    console.log('Voice note processed and queued for upload');
    return { voiceNote, updatedVoiceNotes };
  } catch (error) {
    console.error('Error processing voice note:', error);
    throw error;
  }
};