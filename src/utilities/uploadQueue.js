// import { saveToFirebaseStorage, saveToFirebaseDatabase } from '../../config/firebase';

// class UploadQueue {
//   constructor() {
//     this.queue = [];
//     this.isUploading = false;
//   }

//   addToQueue(item) {
//     this.queue.push(item);
//     this.processQueue();
//   }

//   async processQueue() {
//     if (this.isUploading || this.queue.length === 0) return;

//     this.isUploading = true;
//     const item = this.queue.shift();

//     try {
//       console.log('Starting upload for:', item.filename);
//       const downloadUrl = await saveToFirebaseStorage(item.uri, item.filename);
//       console.log('Audio file uploaded, URL:', downloadUrl);

//       // Update the voiceNote object with the new URL
//       const updatedVoiceNote = {
//         type: 'solo', // or 'guided' based on your logic
//         createdDate: new Date().toISOString(), // Updated to match new structure
//         title: item.voiceNote.title,
//         location: item.voiceNote.location,
//         audioFileSize: item.voiceNote.audioFileSize, // Ensure this is set correctly
//         audioFileUri: downloadUrl, // Updated to match new structure
//         moduleId: null, // Only for guided sessions
//         coachId: null   // Only for guided sessions
//       };

//       await saveToFirebaseDatabase(item.userId, updatedVoiceNote);
//       console.log('Voice note metadata saved to database');
//     } catch (error) {
//       console.error('Upload failed:', error);
//       // Optionally, add the item back to the queue for retry
//       this.queue.unshift(item);
//     }

//     this.isUploading = false;
//     this.processQueue(); // Process next item in queue
//   }
// }

// export const uploadQueue = new UploadQueue();

// export const startUpload = (uri, filename, userId, voiceNote) => {
//   uploadQueue.addToQueue({ uri, filename, userId, voiceNote });
// };