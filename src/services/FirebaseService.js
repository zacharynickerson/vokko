// import { db, storage } from '/Users/zacharynickerson/VokkoApp/config/firebase.js'; // Import Firebase configuration
// import { get, onValue, ref, set } from 'firebase/database'; // Import Firebase Realtime Database functions

// // Function to save the voice note object to Firebase Realtime Database
// export const saveToFirebaseDatabase = async (voiceNote) => {
//   try {
//     // Extract filename from URI to use as key in database
//     const databaseURI = voiceNote.uri.split('/').pop();
//     const uriKey = databaseURI.replace(/[.#$/[\]]/g, ''); // Clean up the URI to make it a valid key
    
//     // Fetch existing voice note data from Firebase to preserve transcription value
//     const existingNoteSnapshot = await ref(db, `voiceNotes/${uriKey}`);
//     const existingNoteData = (await get(existingNoteSnapshot)).val();

//     // Preserve existing transcription value if available
//     if (existingNoteData && existingNoteData.transcription) {
//       voiceNote.transcription = existingNoteData.transcription;
//     }
    
//     // Save updated voice note data to Firebase
//     await set(ref(db, `voiceNotes/${uriKey}`), voiceNote);
//     console.log('Data saved to Firebase Realtime Database:', voiceNote);
//   } catch (error) {
//     console.error('Error saving data to Firebase:', error);
//   }
// };

// // Function to save the voice note recording to Firebase Storage
// export const saveToFirebaseStorage = async (uri) => {
//   try {
//     // Upload the audio file to Firebase Storage
//     // Implement uploadAudioFile function from your existing code
//     // For example:
//     // await uploadAudioFile(uri);
//     console.log("Successfully uploaded to Firebase Storage");
//   } catch (error) {
//     console.error('Error uploading to Firebase Storage:', error);
//   }
// };

// // Function to listen for transcription changes in Firebase Realtime Database
// export const listenForTranscriptionChanges = async (uriKey, setTranscription) => {
//   try {
//     const transcriptionRef = ref(db, `voiceNotes/${uriKey}/transcription`);
    
//     // Set up listener for transcription changes
//     const unsubscribe = onValue(transcriptionRef, (snapshot) => {
//       const updatedTranscription = snapshot.val();
//       setTranscription(updatedTranscription || '');
//     });

//     return unsubscribe;
//   } catch (error) {
//     console.error('Error listening for transcription changes:', error);
//   }
// };
