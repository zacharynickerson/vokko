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
      model: "gpt-3.5-turbo-0125", // Update with your model version
      messages: [
        { "role": "system", "content": `Given a transcript of a voice note: ${transcript}, summarize its content into a well-structured text. Each section should succinctly capture the main points discussed in the voice note. Identify any actionable items mentioned in the transcript and populate them into a bulleted list. Output the summary with section header 'Summary:' and the tasks with section header 'Action Items:'. Also, provide a concise and descriptive title for the voice note based on its content.`},
        { "role": "user", "content": "After you record a voice note, we will generate a summary of its content for you. This summary will be a clearer and more organized version of what you said, maintaining your original style. We'll also identify any tasks or action items mentioned in your note, listing them separately for easy reference. Additionally, we'll provide a concise title for your voice note." }
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

        // Regular expressions to find and split summary, tasks, and title
        const summaryRegex = /^Summary:\s*/;
        const tasksRegex = /^Action Items:\s*/;
        const titleRegex = /^Title:\s*/;

        // Split based on section headers
        let summary = '';
        let tasks = [];
        let title = '';

        const summaryMatch = resultText.match(/Summary:\s*(.*?)(?=\nAction Items:|\nTitle:|\n$)/is);
        const tasksMatch = resultText.match(/Action Items:\s*(.*?)(?=\nTitle:|\n$)/is);
        const titleMatch = resultText.match(/Title:\s*(.*)/is);

        if (summaryMatch) {
          summary = summaryMatch[1].trim();
        }

        if (tasksMatch) {
          tasks = tasksMatch[1].split('\n').map(task => task.trim()).filter(task => task.length > 0);
        }

        if (titleMatch) {
          title = titleMatch[1].trim();
        }

        console.log('Title:', title);
        console.log('Summary:', summary);
        console.log('Tasks:', tasks);

        // Update Firebase with title, summary, and tasks
        await admin.database().ref(`/users/${userId}/voiceNotes/${voiceNoteId}`).update({
          title: title,
          summary: summary,
          taskArray: tasks,
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
