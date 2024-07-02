const functions = require("firebase-functions");
const admin = require("firebase-admin");
const { Storage } = require("@google-cloud/storage");
const storage = new Storage();

admin.initializeApp();

exports.updateTranscription = functions.storage.object().onFinalize(async (object) => {
  // Exit if this is not a transcription file
  if (!object.name.startsWith("transcriptions/users/")) {
    return null;
  }

  // Extract userId from the object name
  const pathParts = object.name.split("/");
  const userId = pathParts[2];

  try {
    // Download the transcription text file
    const file = storage.bucket(object.bucket).file(object.name);
    const transcriptionBuffer = await file.download();
    const transcriptionText = transcriptionBuffer.toString("utf8").trim();

    // Parse the transcription text as JSON
    const transcriptionJson = JSON.parse(transcriptionText);
    const transcript = transcriptionJson.results[0].alternatives[0].transcript;

    // Extract the voiceNoteId from the filename
    const filename = pathParts[4];
    const voiceNoteId = filename.split(".m4a.wav_transcription.txt")[0];

    // Get a reference to the specific voice note for the user
    const voiceNoteRef = admin.database().ref(`users/${userId}/voiceNotes/${voiceNoteId}`);

    // Check if the voice note exists
    const snapshot = await voiceNoteRef.once("value");
    if (snapshot.exists()) {
      // Update the transcript for the specified voice note
      await voiceNoteRef.child('transcript').set(transcript);
      console.log("Transcript updated for voiceNote with ID:", voiceNoteId);
    } else {
      console.error("Voice note not found for ID:", voiceNoteId);
    }
  } catch (error) {
    console.error("Error updating transcript:", error);
  }
});