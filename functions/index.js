const functions = require("firebase-functions");
const admin = require("firebase-admin");
const fs = require('fs');
const FormData = require('form-data');
const axios = require('axios');

admin.initializeApp({
  credential: admin.credential.applicationDefault(),
  databaseURL: functions.config().database.url,
  storageBucket: 'vokko-f8f6a.appspot.com'
});

const { Storage } = require("@google-cloud/storage");
const storage = new Storage();
const OpenAI = require("openai");
const dotenv = require('dotenv');

dotenv.config();


const openai = new OpenAI({
  apiKey: functions.config().openai.key,
});

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

async function transcribeAudioWithRetry(audioBuffer, retries = 0) {
  try {
    console.log('Starting audio transcription process');

    // Prepare the form data for OpenAI API
    const formData = new FormData();
    formData.append('file', audioBuffer, { filename: 'audio.m4a', contentType: 'audio/m4a' });
    formData.append('model', 'whisper-1');

    console.log('Form data prepared, sending request to OpenAI API');

    // Make the request to OpenAI API
    const openaiResponse = await axios.post(
      'https://api.openai.com/v1/audio/transcriptions',
      formData,
      {
        headers: {
          ...formData.getHeaders(),
          'Authorization': `Bearer ${functions.config().openai.key}`,
        },
      }
    );

    console.log('Received response from OpenAI API');

    if (!openaiResponse.data || !openaiResponse.data.text) {
      console.error('Invalid response from OpenAI:', openaiResponse.data);
      throw new Error('Invalid response from OpenAI API');
    }

    console.log('Transcription successful');
    return { transcript: openaiResponse.data.text };

  } catch (error) {
    if (error.response && error.response.status === 429 && retries < MAX_RETRIES) {
      console.warn(`Rate limit hit, retrying in ${RETRY_DELAY_MS}ms...`);
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
      return transcribeAudioWithRetry(audioBuffer, retries + 1);
    }

    console.error('Error transcribing audio:', error);

    if (error.response) {
      console.error('OpenAI API Error Response:', {
        status: error.response.status,
        data: error.response.data,
      });
    } else if (error.request) {
      console.error('No response received from OpenAI API:', error.request);
    } else {
      console.error('Error setting up request:', error.message);
    }

    throw new functions.https.HttpsError('internal', `Error transcribing audio: ${error.message}`);
  }
}

exports.transcribeAudio = functions.https.onCall(async (data, context) => {
  // Check if the user is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated to use this function.');
  }

  const { audioUrl } = data;

  if (!audioUrl) {
    throw new functions.https.HttpsError('invalid-argument', 'Audio URL is required.');
  }

  // Retrieve the OpenAI API key
  const openaiApiKey = functions.config().openai.key;

  if (!openaiApiKey) {
    console.error('OpenAI API key is not configured');
    throw new functions.https.HttpsError('failed-precondition', 'OpenAI API key is not configured');
  }

  try {
    // Download the audio file
    const response = await axios.get(audioUrl, { responseType: 'arraybuffer' });
    const audioBuffer = Buffer.from(response.data);

    return transcribeAudioWithRetry(audioBuffer);
  } catch (error) {
    console.error('Error downloading audio:', error);
    throw new functions.https.HttpsError('internal', `Error downloading audio: ${error.message}`);
  }
});


exports.processTranscript = functions.database
  .ref('/voiceNotes/{userId}/{voiceNoteId}/transcript')
  .onWrite(async (change, context) => {
    const { userId, voiceNoteId } = context.params;
    const transcript = change.after.val();

    if (!transcript) {
      console.error('Transcript is empty or missing');
      return null;
    }

    console.log(`Processing voice note: userId=${userId}, voiceNoteId=${voiceNoteId}, transcript=${transcript}`);

    const prompt = {
      model: "gpt-3.5-turbo-0125",
      messages: [
        { "role": "system", "content": "You are an AI assistant that processes voice note transcripts. Your task is to generate a title and summary based on the given transcript. Please format your response exactly as follows:\n\nTITLE: [A concise and descriptive title for the voice note]\n\nSUMMARY: [A cleaned up version of the original transcript that maintains as much of the original transcript text as possible while cleaning up the grammar and grouping text into logical paragraphs.]\n\nEnsure that each section starts with its respective header (TITLE:, SUMMARY:). Detect the language that is used in the transcript and output all answers within each section using that same language." },
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
        const sections = resultText.split(/\n(?=TITLE:|SUMMARY:)/);

        let title = '';
        let summary = '';

        sections.forEach(section => {
          if (section.startsWith('TITLE:')) {
            title = section.replace('TITLE:', '').trim();
          } else if (section.startsWith('SUMMARY:')) {
            summary = section.replace('SUMMARY:', '').trim();
          }
        });

        console.log('Title:', title);
        console.log('Summary:', summary);

        // Update Firebase with title and summary
        await admin.database().ref(`/voiceNotes/${userId}/${voiceNoteId}`).update({
          title: title || 'Untitled Note',
          summary: summary || 'No summary available',
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

  exports.processVoiceNoteBackground = functions.database
  .ref('/voiceNotes/{userId}/{voiceNoteId}')
  .onUpdate(async (change, context) => {
    const voiceNoteData = change.after.val();
    const { userId, voiceNoteId } = context.params;

    if (voiceNoteData.status !== 'processing') {
      return null;
    }

    try {
      let fullTranscript = '';
      const bucket = admin.storage().bucket();

      for (let i = 0; i < voiceNoteData.totalChunks; i++) {
        const chunkPath = `users/${userId}/voiceNotes/${voiceNoteId}/chunks/${i}.m4a`;
        const transcriptionPath = `users/${userId}/voiceNotes/${voiceNoteId}/transcriptions/${i}.txt`;

        // Download the file to a temporary location
        const tempFilePath = `/tmp/${voiceNoteId}_${i}.m4a`;
        await bucket.file(chunkPath).download({destination: tempFilePath});

        console.log(`Processing chunk ${i}, path: ${tempFilePath}`);

        // Read the file as a buffer
        const audioBuffer = await fs.promises.readFile(tempFilePath);

        // Use the buffer directly with your transcription function
        const { transcript } = await transcribeAudioWithRetry(audioBuffer);
        
        // Save individual chunk transcription
        await bucket.file(transcriptionPath).save(transcript);

        fullTranscript += transcript + ' ';

        // Clean up the temporary file
        await fs.promises.unlink(tempFilePath);
      }

      console.log('Full transcript:', fullTranscript);

      // Update the voice note with the full transcript
      await admin.database().ref(`voiceNotes/${userId}/${voiceNoteId}`).update({
        transcript: fullTranscript,
        status: 'transcribed',
      });

      // Process the transcript for title and summary
      await processTranscriptAndUpdateVoiceNote(userId, voiceNoteId, fullTranscript);

    } catch (error) {
      console.error('Error processing voice note:', error);
      await admin.database().ref(`voiceNotes/${userId}/${voiceNoteId}`).update({
        status: 'error',
        error: error.message,
      });
    }
  });

async function processTranscriptAndUpdateVoiceNote(userId, voiceNoteId, transcript) {
  console.log(`Processing voice note: userId=${userId}, voiceNoteId=${voiceNoteId}, transcript=${transcript}`);

  const prompt = {
    model: "gpt-3.5-turbo-0125",
    messages: [
      { "role": "system", "content": "You are an AI assistant that processes voice note transcripts. Your task is to generate a title and summary based on the given transcript. Please format your response exactly as follows:\n\nTITLE: [A concise and descriptive title for the voice note]\n\nSUMMARY: [A cleaned up version of the original transcript that maintains the speaker's voice and perspective, formats paragraphs, and includes section headers where necessary.]\n\nEnsure that each section starts with its respective header (TITLE:, SUMMARY:). Detect the language that is used in the transcript and output all answers within each section using that same language." },
      { "role": "user", "content": `Please process the following voice note transcript:\n\n${transcript}` }
    ],
    max_tokens: 3000,
    temperature: 0.7,
  };

  try {
    const response = await openai.chat.completions.create(prompt);

    console.log('API response:', response);

    if (response.choices && response.choices.length > 0) {
      const resultText = response.choices[0].message.content.trim();

      // Split the response into sections
      const sections = resultText.split(/\n(?=TITLE:|SUMMARY:)/);

      let title = '';
      let summary = '';

      sections.forEach(section => {
        if (section.startsWith('TITLE:')) {
          title = section.replace('TITLE:', '').trim();
        } else if (section.startsWith('SUMMARY:')) {
          summary = section.replace('SUMMARY:', '').trim();
        }
      });

      console.log('Title:', title);
      console.log('Summary:', summary);

      // Update Firebase with title and summary
      await admin.database().ref(`/voiceNotes/${userId}/${voiceNoteId}`).update({
        title: title || 'Untitled Note',
        summary: summary || 'No summary available',
        status: 'completed',
      });

      console.log(`Voice note processed successfully: ${voiceNoteId}`);
    } else {
      console.error('API returned no choices in the response');
      throw new Error('API returned no choices in the response');
    }
  } catch (error) {
    console.error('Error processing voice note:', error.response ? error.response.data : error.message);
    throw error;
  }
}
