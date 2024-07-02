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

  // Extract userId and voiceNoteId from the object name
  const pathParts = object.name.split("/");
  const userId = pathParts[2];
  const voiceNoteId = pathParts[4]; // Assuming voiceNoteId is part of the path

  try {
    // Download the transcription text file
    const file = storage.bucket(object.bucket).file(object.name);
    const transcriptionBuffer = await file.download();
    const transcriptionText = transcriptionBuffer.toString("utf8").trim();

    // Parse the transcription text as JSON
    const transcriptionJson = JSON.parse(transcriptionText);
    const transcript = transcriptionJson.results[0].alternatives[0].transcript;

    // Update the transcript in the specified voice note
    const voiceNoteRef = admin.database().ref(`users/${userId}/voiceNotes/${voiceNoteId}`);
    await voiceNoteRef.child('transcript').set(transcript);
    
    console.log("Transcript updated for voiceNote with ID:", voiceNoteId);
  } catch (error) {
    console.error("Error updating transcript:", error);
  }
});
