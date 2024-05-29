import { db, storage } from '../../config/firebase.js'; // Import Firebase configuration
import { get, onValue, ref, set } from 'firebase/database'; // Import Firebase Realtime Database functions



  // Function to save the voice note recording to Firebase Storage
  export const saveToFirebaseStorage = async () => {
    if (!alreadySavedToFBS) {
      const uri = route.params.uri; // Get the URI of the audio file
      uploadAudioFile(uri); // Upload the audio file to Firebase Storage
      console.log("Successfully uploaded to Firebase Storage");
      setAlreadySavedToFBS(true); // Update state to indicate audio saved to Firebase Storage
    }
  };


// Function to save the voice note object to Firebase Realtime Database
export const saveToFirebaseDatabase = async (voiceNote) => {
    try {
      // Extract filename from URI to use as key in database
      const databaseURI = voiceNote.uri.split('/').pop();
      const uriKey = databaseURI.replace(/[.#$/[\]]/g, ''); // Clean up the URI to make it a valid key
      
      // Fetch existing voice note data from Firebase to preserve transcription value
      const existingNoteSnapshot = await ref(db, `voiceNotes/${uriKey}`);
      const existingNoteData = (await get(existingNoteSnapshot)).val();
  
      // Preserve existing transcription value if available
      if (existingNoteData && existingNoteData.transcription) {
        voiceNote.transcription = existingNoteData.transcription;
      }
      
      // Save updated voice note data to Firebase
      await set(ref(db, `voiceNotes/${uriKey}`), voiceNote);
      console.log('Data saved to Firebase Realtime Database');
      console.log(route.params.uri)
      saveAudioToFileSystem();
    } catch (error) {
      console.error('Error saving data to Firebase:', error);
    }
  };


    // When the component mounts, fetch the transcription from Firebase Realtime Database
  // useEffect(() => {
  //   const databaseURI = route.params.uri.split('/').pop();
  //   const uriKey = databaseURI.replace(/[.#$/[\]]/g, '');
  //   const transcriptionRef = ref(db, `voiceNotes/${uriKey}/transcription`);

  //   const unsubscribe = onValue(transcriptionRef, (snapshot) => {
  //     const updatedTranscription = snapshot.val();
  //     setTranscription(updatedTranscription || '');
  //   });

  //   return () => {
  //     if (unsubscribe && typeof unsubscribe === 'function') {
  //       unsubscribe();
  //     }
  //     if (sound) {
  //       console.log('Unloading Sound');
  //       sound.unloadAsync(); // Unload audio when component unmounts
  //     }
  //   };
  // }, [route.params.uri, sound]);