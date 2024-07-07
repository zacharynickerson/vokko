const functions = require("firebase-functions");
const admin = require("firebase-admin");
const { Storage } = require("@google-cloud/storage");
const storage = new Storage();
const OpenAI = require("openai");
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
        { "role": "system", "content": `Given a transcript of a voice note: ${transcript}, summarize its content into a well-structured text. Each section should succinctly capture the main points discussed in the voice note. Identify any actionable items mentioned in the transcript and populate them into a bulleted list. Output the summary with section header 'Summary:' and the tasks with section header 'Action Items:'.`},
        { "role": "user", "content": "After you record a voice note, we will generate a summary of its content for you. This summary will be a clearer and more organized version of what you said, maintaining your original style. We'll also identify any tasks or action items mentioned in your note, listing them separately for easy reference." }
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

        // Regular expressions to find and split summary and tasks
        const summaryRegex = /^Summary:\s*/;
        const tasksRegex = /^Action Items:\s*/;

        // Split based on section headers
        let summary = '';
        let tasks = [];

        const sections = resultText.split(/\n(?=Summary:|Action Items:)/);

        if (sections.length > 0) {
          summary = sections[0].replace(summaryRegex, '').trim();

          if (sections.length > 1) {
            tasks = sections.slice(1).map(section => section.replace(tasksRegex, '').trim());
          }
        }

        console.log('Summary:', summary);
        console.log('Tasks:', tasks);

        // Update Firebase with summary and tasks
        await admin.database().ref(`/users/${userId}/voiceNotes/${voiceNoteId}`).update({
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


  // exports.processTranscript = functions.database
  // .ref('/users/{userId}/voiceNotes/{voiceNoteId}/transcript')
  // .onWrite(async (change, context) => {
  //   const userId = context.params.userId;
  //   const voiceNoteId = context.params.voiceNoteId;
  //   const transcript = change.after.val();

  //   if (!transcript) {
  //     console.error('Transcript is empty or missing');
  //     return null;
  //   }

  //   console.log(`Processing voice note: userId=${userId}, voiceNoteId=${voiceNoteId}, transcript=${transcript}`);

  //   // const prompt = `Summarize the following transcript and extract action items: ${transcript}`;
  //   const prompt = {
  //     model: "gpt-3.5-turbo",
  //     messages: [
  //       { "role": "system", "content": "Given a transcript of a voice note, summarize its content into a well-structured text with section headers and emojis. Each section should succinctly capture the main points discussed in the voice note, using emojis that correspond to the topics covered. Additionally, identify any actionable items mentioned in the transcript and populate them into a task array. Output the summary as a structured text format that includes headers and emojis for each section, along with the list of tasks in JSON format." },
  //       { "role": "user", "content": "After you record a voice note, we will generate a summary of its content for you. This summary will be a clearer and more organized version of what you said, maintaining your original style. We'll also identify any tasks or action items mentioned in your note, listing them separately for easy reference. You'll receive both the summary and the list of tasks in a structured JSON format." }
  //     ],
  //     max_tokens: 3000,
  //     temperature: 0.7,
  //   };

  //   const apiKey = functions.config().openai.key;

  //   if (!apiKey) {
  //     console.error('API key is missing. Make sure to set OPENAI_API_KEY in your environment variables.');
  //     return null;
  //   }


    
  //   try {
  //     const response = await openai.chat.completions.create(prompt);

  //     console.log('API response:', response);

  //   if (response.choices && response.choices.length > 0) {
  // //       const metadata = response.data.data.metadata;

  // //       const resultText = response.choices[0].message.content.trim();

  // //       // Remove section headers if present
  // //       const summaryStartIndex = resultText.indexOf('Summary:');
  // //       const tasksStartIndex = resultText.indexOf('Action items:');

  //     if (response.data.choices && response.data.choices.length > 0) {
  //       const resultText = response.data.choices[0].message.content.trim();

  //       // Parse the resultText into JSON format
  //       const { summary, taskArray } = JSON.parse(resultText);

  //       if (summary && taskArray) {
  //         const summaryText = summary.trim();
  //         const tasks = taskArray.map(task => task.trim());

  //         await admin.database().ref(`/users/${userId}/voiceNotes/${voiceNoteId}`).update({
  //           summary: summaryText,
  //           taskArray: tasks,
  //         });

  //         console.log(`Voice note processed successfully: ${voiceNoteId}`);
  //       } else {
  //         console.error('Invalid JSON structure from OpenAI:', resultText);
  //       }
  //     } else {
  //       console.error('API returned no choices in the response');
  //     }
  //   } catch (error) {
  //     console.error('Error processing voice note:', error.response ? error.response.data : error.message);
  //   }

  //   return null;
  // });