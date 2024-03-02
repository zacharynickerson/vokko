/* eslint-disable */
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { Storage } = require('@google-cloud/storage');
const storage = new Storage();


// Function Initialization: The Cloud Function initializes the Firebase Admin SDK and creates an instance of the Google Cloud Storage service.
admin.initializeApp();

//Trigger Setup: The Cloud Function is triggered by changes in the Firebase Storage bucket. It listens for finalized objects, meaning objects that have been uploaded and are now considered complete.
exports.updateTranscription = functions.storage.object().onFinalize(async (object) => {
  
  //Object Path Check: Upon triggering, the function checks if the uploaded object is located within the "transcriptions/audio" directory. If not, it exits early.
  if (!object.name.startsWith('transcriptions/audio/')) {
    return null;
  }

  // Extracting URI: It extracts the URI from the object's name by splitting the path and cleaning it using the cleanUri function. This URI likely identifies the audio file associated with the transcription.
  const uri = cleanUri(object.name.split('/')[2]); //IMPORTANT

  // Downloading Transcription Text: The function retrieves the transcription text from the uploaded .txt file associated with the audio. It reads the content of the file as a buffer and converts it to a UTF-8 string.
  const file = storage.bucket(object.bucket).file(object.name);
  const transcriptionBuffer = await file.download();
  const transcriptionText = transcriptionBuffer.toString('utf8').trim();

  try {

    // Parse the transcription text as JSON
    const transcriptionJson = JSON.parse(transcriptionText);

    // Extract the transcript from the JSON
    const transcript = transcriptionJson.results[0].alternatives[0].transcript;

    //THE FOLLLOWING IS IMPORTANT ***
    // Fetching VoiceNote Objects: It queries the Realtime Database to fetch voiceNote objects that match the extracted URI.
    // const snapshot = await admin.database().ref('voiceNotes').orderByChild('uri').equalTo(uri).once('value');
    const snapshot = await admin.database().ref('voiceNotes').orderByKey().equalTo(uri).once('value');


    const voiceNotes = snapshot.val();

    
    // Updating Transcription: For each matching voiceNote object, it updates the transcription attribute with the extracted transcript from the transcription text.
    if (voiceNotes) {
      // Loop through each matching voiceNote object and update its transcription attribute
      Object.keys(voiceNotes).forEach(async (key) => {
        await admin.database().ref(`voiceNotes/${key}/transcription`).set(transcript);
        console.log('Transcription updated for voiceNote with URI:', uri);
      });
    } else {
      console.log('VoiceNote not found for URI:', uri);
    }
  } catch (error) {
    console.error('Error updating transcription:', error);
  }
});

// URI Cleaning Function:The cleanUri function is defined to remove the suffix ".wav_transcription.txt" from the URI, likely to extract the clean URI of the audio file.
function cleanUri(uri) {
  return uri.replace(/\.wav_transcription\.txt$/, '').replace('.', '');
}
