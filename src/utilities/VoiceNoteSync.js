// import { Audio } from 'expo-av';
// import * as FileSystem from 'expo-file-system';
// import * as Network from 'expo-network';
// // import { getVoiceNotesFromLocal, saveVoiceNotesToLocal } from '../utilities/voiceNoteLocalStorage';
// import { db, storage, auth } from '../../config/firebase';
// import { get, set, ref as dbRef } from 'firebase/database';
// import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';

// class VoiceNoteSync {
//   constructor() {
//     this.syncQueue = [];
//     this.isSyncing = false;
//   }

//   async syncVoiceNotes() {
//     if (this.isSyncing) return;
//     this.isSyncing = true;

//     try {
//       const networkState = await Network.getNetworkStateAsync();
//       if (!networkState.isConnected) {
//         console.log('No internet connection. Skipping sync.');
//         return;
//       }

//       // const localNotes = await getVoiceNotesFromLocal(); // Commented out
//       // const cloudNotes = await this.getCloudVoiceNotes();

//       console.log('Local notes fetched');
//       console.log('Cloud notes fetched');

//       // Sync local to cloud
//       // for (const localNote of localNotes) {
//       //   if (!cloudNotes.some(note => note && note.voiceNoteId === localNote.voiceNoteId)) {
//       //     console.log(`Uploading local note: ${localNote.voiceNoteId}`);
//       //     await this.uploadVoiceNote(localNote);
//       //   }
//       // }

//       // Sync cloud to local
//       for (const cloudNote of cloudNotes) {
//         if (cloudNote && !localNotes.some(note => note.voiceNoteId === cloudNote.voiceNoteId)) {
//           console.log(`Downloading cloud note: ${cloudNote.voiceNoteId}`);
//           await this.downloadVoiceNote(cloudNote);
//         }
//       }

//       // Update local storage with merged notes
//       // const mergedNotes = await this.mergeNotes(localNotes, cloudNotes); // Commented out
//       // await saveVoiceNotesToLocal(mergedNotes); // Commented out

//       console.log('Sync completed. Merged notes');

//     } catch (error) {
//       console.error('Sync error:', error);
//       throw error;
//     } finally {
//       this.isSyncing = false;
//     }
//   }

//   async getCloudVoiceNotes() {
//     const snapshot = await get(dbRef(db, `voiceNotes/${auth.currentUser.uid}`));
//     const cloudNotes = snapshot.val();
//     if (!cloudNotes) {
//       console.log('No cloud notes found');
//       return [];
//     }
//     return Object.values(cloudNotes).filter(note => note !== null && note !== undefined);
//   }

//   async uploadVoiceNote(note) {
//     // Upload audio file to Firebase Storage
//     const audioRef = storageRef(storage, `voiceNotes/${auth.currentUser.uid}/${note.voiceNoteId}`);
//     const audioBlob = await this.uriToBlob(note.uri);
//     await uploadBytes(audioRef, audioBlob);

//     // Get download URL
//     const cloudUri = await getDownloadURL(audioRef);

//     // Save metadata to Realtime Database
//     const noteRef = dbRef(db, `voiceNotes/${auth.currentUser.uid}/${note.voiceNoteId}`);
//     await set(noteRef, { 
//         type: 'solo', // or 'guided' based on your logic
//         createdDate: note.createdDate,
//         title: note.title,
//         location: note.location,
//         audioFileSize: note.audioFileSize,
//         audioFileUri: cloudUri,
//         moduleId: null, // Only for guided sessions
//         coachId: null   // Only for guided sessions
//     });

//     console.log(`Note uploaded: ${note.voiceNoteId}`);
//     return { ...note, cloudUri, uri: cloudUri };
//   }

//   async downloadVoiceNote(cloudNote) {
//     const cloudUri = cloudNote.cloudUri || cloudNote.uri;
//     if (!cloudUri) {
//       console.error('Cloud URI is missing for note:', cloudNote);
//       return null;
//     }

//     // Download audio file from Firebase Storage
//     const localUri = `${FileSystem.documentDirectory}voiceNotes/${cloudNote.voiceNoteId}.m4a`;
//     try {
//       await FileSystem.downloadAsync(cloudUri, localUri);
//     } catch (error) {
//       console.error('Error downloading file:', error);
//       return null;
//     }

//     console.log(`Note downloaded: ${cloudNote.voiceNoteId}`);
//     return { ...cloudNote, uri: localUri, cloudUri };
//   }

//   async uriToBlob(uri) {
//     const response = await fetch(uri);
//     return await response.blob();
//   }

//   async mergeNotes(localNotes, cloudNotes) {
//     const mergedNotes = [];
//     const processedIds = new Set();

//     for (const localNote of localNotes) {
//       const cloudNote = cloudNotes.find(note => note.voiceNoteId === localNote.voiceNoteId);
//       if (cloudNote) {
//         // Note exists both locally and in the cloud
//         mergedNotes.push({
//           ...localNote,
//           ...cloudNote,
//           uri: localNote.uri,
//           cloudUri: cloudNote.cloudUri || cloudNote.uri
//         });
//       } else {
//         // Note only exists locally
//         const uploadedNote = await this.uploadVoiceNote(localNote);
//         mergedNotes.push(uploadedNote);
//       }
//       processedIds.add(localNote.voiceNoteId);
//     }

//     // Add cloud notes that don't exist locally
//     for (const cloudNote of cloudNotes) {
//       if (!processedIds.has(cloudNote.voiceNoteId)) {
//         const downloadedNote = await this.downloadVoiceNote(cloudNote);
//         if (downloadedNote) {
//           mergedNotes.push(downloadedNote);
//         }
//       }
//     }

//     return mergedNotes;
//   }

//   addToSyncQueue(note) {
//     this.syncQueue.push(note);
//     this.processSyncQueue();
//   }

//   async processSyncQueue() {
//     if (this.isSyncing) return;
//     this.isSyncing = true;

//     try {
//       const networkState = await Network.getNetworkStateAsync();
//       if (!networkState.isConnected) {
//         console.log('No internet connection. Sync queue processing postponed.');
//         return;
//       }

//       while (this.syncQueue.length > 0) {
//         const note = this.syncQueue.shift();
//         await this.uploadVoiceNote(note);
//       }
//     } catch (error) {
//       console.error('Error processing sync queue:', error);
//     } finally {
//       this.isSyncing = false;
//     }
//   }
// }

// export const voiceNoteSync = new VoiceNoteSync();