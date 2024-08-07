const functions = require("firebase-functions");
const admin = require("firebase-admin");
const { Storage } = require("@google-cloud/storage");
const storage = new Storage();
const OpenAI = require("openai");
const axios = require('axios');
const dotenv = require('dotenv');

dotenv.config();

admin.initializeApp();

const openai = new OpenAI({
  apiKey: functions.config().openai.key,
});

exports.processTranscript = functions.database
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

    const prompt = {
      model: "gpt-3.5-turbo-0125",
      messages: [
        { "role": "system", "content": "You are an AI assistant that processes voice note transcripts. Your task is to generate a title, summary, and list of action items based on the given transcript. Please format your response exactly as follows:\n\nTITLE: [A concise and descriptive title for the voice note]\n\nSUMMARY: [A well-structured summary of the voice note's content]\n\nACTION ITEMS:\n- [Action item 1]\n- [Action item 2]\n- [Action item 3]\n...\n\nEnsure that each section starts with its respective header (TITLE:, SUMMARY:, ACTION ITEMS:) and that the action items are presented as a bulleted list." },
        { "role": "user", "content": `Please process the following voice note transcript:\n\n${transcript}` }
      ],
      max_tokens: 3000,
      temperature: 0.7,
    };

    const apiKey = functions.config().openai.key;

    if (!apiKey) {
      console.error('API key is missing. Make sure to set OPENAI_API_KEY in your environment variables.');
      return null;
    }

    try {
      const response = await openai.chat.completions.create(prompt);

      console.log('API response:', response);

      if (response.choices && response.choices.length > 0) {
        const resultText = response.choices[0].message.content.trim();

        // Split the response into sections
        const sections = resultText.split(/\n(?=TITLE:|SUMMARY:|ACTION ITEMS:)/);

        let title = '';
        let summary = '';
        let tasks = [];

        sections.forEach(section => {
          if (section.startsWith('TITLE:')) {
            title = section.replace('TITLE:', '').trim();
          } else if (section.startsWith('SUMMARY:')) {
            summary = section.replace('SUMMARY:', '').trim();
          } else if (section.startsWith('ACTION ITEMS:')) {
            tasks = section.replace('ACTION ITEMS:', '')
              .split('\n')
              .map(task => task.trim().replace(/^-\s*/, ''))
              .filter(task => task.length > 0);
          }
        });

        console.log('Title:', title);
        console.log('Summary:', summary);
        console.log('Tasks:', tasks);

        // Update Firebase with title, summary, and tasks
        await admin.database().ref(`/users/${userId}/voiceNotes/${voiceNoteId}`).update({
          title: title || 'Untitled Note',
          summary: summary || 'No summary available',
          taskArray: tasks.length > 0 ? tasks : ['No tasks identified'],
        });

        console.log(`Voice note processed successfully: ${voiceNoteId}`);
      } else {
        console.error('API returned no choices in the response');
      }
    } catch (error) {
      console.error('Error processing voice note:', error.response ? error.response.data : error.message);
    }

    return null;
  });



// exports.updateTranscription = functions.storage.object().onFinalize(async (object) => {
//   // Exit if this is not a transcription file
//   if (!object.name.startsWith("transcriptions/users/")) {
//     return null;
//   }

//   // Extract userId from the object name
//   const pathParts = object.name.split("/");
//   const userId = pathParts[2];

//   try {
//     // Download the transcription text file
//     const file = storage.bucket(object.bucket).file(object.name);
//     const transcriptionBuffer = await file.download();
//     const transcriptionText = transcriptionBuffer.toString("utf8").trim();

//     // Parse the transcription text as JSON
//     const transcriptionJson = JSON.parse(transcriptionText);
//     const transcript = transcriptionJson.results[0].alternatives[0].transcript;

//     // Extract the voiceNoteId from the filename
//     const filename = pathParts[4];
//     const voiceNoteId = filename.split(".m4a.wav_transcription.txt")[0];

//     // Get a reference to the specific voice note for the user
//     const voiceNoteRef = admin.database().ref(`users/${userId}/voiceNotes/${voiceNoteId}`);

//     // Check if the voice note exists
//     const snapshot = await voiceNoteRef.once("value");
//     if (snapshot.exists()) {
//       // Update the transcript for the specified voice note
//       await voiceNoteRef.child('transcript').set(transcript);
//       console.log("Transcript updated for voiceNote with ID:", voiceNoteId);
//     } else {
//       console.error("Voice note not found for ID:", voiceNoteId);
//     }
//   } catch (error) {
//     console.error("Error updating transcript:", error);
//   }
// });
