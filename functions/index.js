const functions = require("firebase-functions");
const admin = require("firebase-admin");
const { Storage } = require("@google-cloud/storage");
const storage = new Storage();
const axios = require('axios');
const dotenv = require('dotenv');

dotenv.config();

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

exports.processVoiceNote = functions.database
  .ref('/users/{userId}/voiceNotes/{voiceNoteId}/transcript')
  .onWrite(async (change, context) => {
    const userId = context.params.userId;
    const voiceNoteId = context.params.voiceNoteId;
    const transcript = change.after.val();

    if (!transcript) {
      console.error('Transcript is empty or missing');
      return null;
    }

    console.log(`Processing voice note: userId=${userId}, voiceNoteId=${voiceNoteId}, transcript=${transcript}`);


    // Prepare the API request payload
    const prompt = `Summarize the following transcript and extract action items: ${transcript}\nSummary:\nAction Items:`;
    const apiUrl = 'https://us-central1-aiplatform.googleapis.com'; // Replace with actual Gemini API endpoint
    const apiKey = process.env.GEMINI_API_KEY; // Ensure you have set this in your .env file

    try {
      const response = await axios.post(apiUrl, {
        prompt: prompt,
        model: 'gemini-pro', // Model can be different based on your configuration
        temperature: 0.7,
        max_tokens: 150,
        n: 1,
        stop: null,
      }, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('Gemini API response:', response.data);

      if (response.data.choices && response.data.choices.length > 0) {
      const resultText = response.data.choices[0].text.trim();
      const [summary, ...tasks] = resultText.split('\n').map(line => line.trim()).filter(line => line);

        await admin.database().ref(`/users/${userId}/voiceNotes/${voiceNoteId}`).update({
          summary: summary,
          taskArray: tasks,
        });

        console.log(`Voice note processed successfully: ${voiceNoteId}`);
      } else {
        console.error('Gemini API returned no choices in the response');
      }
    } catch (error) {
      console.error('Error processing voice note:', error.response ? error.response.data : error.message);
    }

    return null;
  });