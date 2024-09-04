// import * as BackgroundFetch from 'expo-background-fetch';
// import { defineTask } from 'expo-task-manager';
import { saveToFirebaseStorage, saveToFirebaseDatabase } from '../../config/firebase';

export const BACKGROUND_UPLOAD_TASK = 'BACKGROUND_UPLOAD_TASK';

defineTask(BACKGROUND_UPLOAD_TASK, async ({ data, error }) => {
  if (error) {
    console.error('Background task failed:', error);
    return BackgroundFetch.Result.Failed;
  }
  
  if (data) {
    const { uri, filename, userId, voiceNote } = data;
    try {
      console.log('Starting background upload...');
      const downloadUrl = await saveToFirebaseStorage(uri, filename);
      console.log('Audio file uploaded, URL:', downloadUrl);

      voiceNote.uri = downloadUrl;
      await saveToFirebaseDatabase(userId, voiceNote);
      console.log('Voice note metadata saved to database');

      return BackgroundFetch.Result.NewData;
    } catch (error) {
      console.error('Background upload failed:', error);
      return BackgroundFetch.Result.Failed;
    }
  }
  return BackgroundFetch.Result.NoData;
});

export const startBackgroundUpload = async (uri, filename, userId, voiceNote) => {
  try {
    await BackgroundFetch.registerTaskAsync(BACKGROUND_UPLOAD_TASK, {
      minimumInterval: 60, // task will run at most once per minute
      stopOnTerminate: false, // android only,
      startOnBoot: true, // android only
    });

    await BackgroundFetch.scheduleTaskAsync(BACKGROUND_UPLOAD_TASK, {
      minimumInterval: 60, // run once immediately
      data: { uri, filename, userId, voiceNote },
    });

    console.log('Background upload scheduled');
  } catch (error) {
    console.error('Failed to schedule background upload:', error);
  }
};