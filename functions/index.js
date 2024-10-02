const functions = require("firebase-functions");
const admin = require("firebase-admin");
const { Storage } = require("@google-cloud/storage");
const storage = new Storage();
const OpenAI = require("openai");
const axios = require('axios');
const dotenv = require('dotenv');
const FormData = require('form-data');

dotenv.config();

admin.initializeApp();

const openai = new OpenAI({
  apiKey: functions.config().openai.key,
});

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

async function transcribeAudioWithRetry(audioUrl, retries = 0) {
  try {
    console.log('Starting audio transcription process for URL:', audioUrl);

    // Download the audio file
    const audioResponse = await axios.get(audioUrl, { responseType: 'arraybuffer' });
    const audioBuffer = Buffer.from(audioResponse.data);
    console.log('Audio buffer size:', audioBuffer.length);

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
      return transcribeAudioWithRetry(audioUrl, retries + 1);
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

  return transcribeAudioWithRetry(audioUrl);
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
        { "role": "system", "content": "You are an AI assistant that processes voice note transcripts. Your task is to generate a title, summary, and list of action items based on the given transcript. Please format your response exactly as follows:\n\nTITLE: [A concise and descriptive title for the voice note]\n\nSUMMARY: [A cleaned up version of the original transcript that maintains as much of the original transcript text as possible while cleaning up the grammar, grouping text into logical paragraphs, and assigning plain text section headers when appropriate.]\n\nACTION ITEMS:\n- [Action item 1]\n- [Action item 2]\n- [Action item 3]\n...\n\nEnsure that each section starts with its respective header (TITLE:, SUMMARY:, ACTION ITEMS:) and that the action items are presented as a bulleted list. Detect the language that is used in the transcript and output all answers within each section using that same language" },
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
        await admin.database().ref(`/voiceNotes/${userId}/${voiceNoteId}`).update({
          title: title || 'Untitled Note',
          summary: summary || 'No summary available',
          actionItems: tasks.length > 0 ? tasks : ['No tasks identified'],
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