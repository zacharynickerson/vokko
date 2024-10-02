import { saveToFirebaseStorage, updateVoiceNote, createVoiceNoteDetails } from '../../config/firebase';
import * as BackgroundFetch from 'expo-background-fetch';
import { defineTask } from 'expo-task-manager';

export const BACKGROUND_UPLOAD_TASK = 'BACKGROUND_UPLOAD_TASK';

defineTask(BACKGROUND_UPLOAD_TASK, async ({ data, error }) => {
  if (error) {
    console.error('Background task failed:', error);
    return BackgroundFetch.Result.Failed;
  }
  
  if (data) {
    const { uri, voiceNoteId, userId, voiceNote } = data;
    try {
      console.log('Starting background upload...');
      const downloadUrl = await saveToFirebaseStorage(uri, voiceNoteId);
      console.log('Audio file uploaded, URL:', downloadUrl);

      // Update voice note with download URL
      await updateVoiceNote(userId, voiceNoteId, {
        audioFileUri: downloadUrl, // Updated to match new structure
      });
      
      // Create voice note details (if needed)
      await createVoiceNoteDetails(voiceNoteId, {
        transcript: 'Transcription pending',
        actionItems: [],
      });

      console.log('Voice note updated in database');

      return BackgroundFetch.Result.NewData;
    } catch (error) {
      console.error('Background upload failed:', error);
      return BackgroundFetch.Result.Failed;
    }
  }
  return BackgroundFetch.Result.NoData;
});

export const startBackgroundUpload = async (uri, voiceNoteId, userId, voiceNote) => {
  try {
    await BackgroundFetch.registerTaskAsync(BACKGROUND_UPLOAD_TASK, {
      minimumInterval: 60,
      stopOnTerminate: false,
      startOnBoot: true,
    });

    await BackgroundFetch.scheduleTaskAsync(BACKGROUND_UPLOAD_TASK, {
      minimumInterval: 60,
      data: { uri, voiceNoteId, userId, voiceNote },
    });

    console.log('Background upload scheduled');
  } catch (error) {
    console.error('Failed to schedule background upload:', error);
  }
};