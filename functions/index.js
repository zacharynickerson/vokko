/* eslint-disable */
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { Storage } = require('@google-cloud/storage');
const storage = new Storage();

admin.initializeApp();

exports.updateTranscription = functions.storage.object().onFinalize(async (object) => {
  // Check if the object is created in the transcriptions/audio directory
  if (!object.name.startsWith('transcriptions/audio/')) {
    return null;
  }

  // Extract the URI from the object name and clean it
  const uri = cleanUri(object.name.split('/')[2]);

  // Get the transcription text from the .txt file
  const file = storage.bucket(object.bucket).file(object.name);
  const transcriptionBuffer = await file.download();
  const transcriptionText = transcriptionBuffer.toString('utf8').trim();

  try {

    // Parse the transcription text as JSON
    const transcriptionJson = JSON.parse(transcriptionText);

    // Extract the transcript from the JSON
    const transcript = transcriptionJson.results[0].alternatives[0].transcript;

    // Retrieve the corresponding voiceNote object from the Realtime Database
    const snapshot = await admin.database().ref('voiceNotes').orderByChild('uri').equalTo(uri).once('value');
    const voiceNotes = snapshot.val();

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

// Function to clean the URI by removing special characters
function cleanUri(uri) {
  return uri.replace(/\.wav_transcription\.txt$/, ''); // Remove the suffix ".wav_transcription.txt"
}
