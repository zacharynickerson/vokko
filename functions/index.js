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
        await bucket.file(chunkPath).download({ destination: tempFilePath });

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
      console.error('Error processing voice note:', error.response ? error.response.data : error.message);
      await admin.database().ref(`/voiceNotes/${userId}/${voiceNoteId}`).update({
        status: 'Error',
        error: error.message,
      });
      return null;
    }
  });

  async function processTranscriptAndUpdateVoiceNote(userId, voiceNoteId, transcript) {
    console.log(`Processing voice note: userId=${userId}, voiceNoteId=${voiceNoteId}, transcript=${transcript}`);
  
    const prompt = {
      model: "gpt-3.5-turbo-0125",
      messages: [
        { 
          "role": "system", 
          "content": "You are an AI assistant that processes voice note transcripts. Your task is to generate a title and a beautifully formatted version of the transcript. The output should maintain the original voice and content, but improve readability with formatting and styling. Use HTML tags for styling, such as <strong>, <em>, and <u>. Format section headers as <h3 style='color: #4FBF67;'>[Header Text]</h3>. Use headers sparingly, only for major topic changes, typically every 2-3 paragraphs. Avoid using terms like 'overview' or 'the speaker'. Wrap paragraphs in <p> tags without extra line breaks between them. Your response should be in the following format:\n\nTITLE: [Generated Title]\n\nFORMATTEDNOTE: [Formatted transcript with HTML styling]"
        },
        { 
          "role": "user", 
          "content": `Please process the following voice note transcript:\n\n${transcript}` 
        }
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
        const sections = resultText.split(/\n(?=TITLE:|FORMATTEDNOTE:)/);
  
        let title = '';
        let summary = '';
  
        sections.forEach(section => {
          if (section.startsWith('TITLE:')) {
            title = section.replace('TITLE:', '').trim();
          } else if (section.startsWith('FORMATTEDNOTE:')) {
            summary = section.replace('FORMATTEDNOTE:', '').trim();
          }
        });
  
        // Remove any remaining newlines between HTML tags
        summary = summary.replace(/>\s+</g, '><');
  
        console.log('Title:', title);
        console.log('Formatted Note:', summary);
  
        // Update Firebase with title and summary
        await admin.database().ref(`/voiceNotes/${userId}/${voiceNoteId}`).update({
          title: title || 'Untitled Note',
          summary: summary || transcript,
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

exports.processGuidedSession = functions.database
  .ref('/guidedSessions/{userId}/{sessionId}/status')
  .onUpdate(async (change, context) => {
    const newStatus = change.after.val();
    const oldStatus = change.before.val();
    const { userId, sessionId } = context.params;

    if (newStatus !== 'Processing' || oldStatus === 'Processing') {
      return null;
    }

    try {
      // Fetch the transcript
      const transcriptSnapshot = await admin.database()
        .ref(`/guidedSessions/${userId}/${sessionId}/transcript`)
        .once('value');
      const transcriptData = transcriptSnapshot.val();
      
      if (!transcriptData) {
        throw new Error('Transcript data is missing.');
      }

      // Concatenate all transcript entries with clear speaker identification
      let fullTranscript = '';
      Object.values(transcriptData).forEach(entry => {
        if (entry.question) {
          fullTranscript += `Question: ${entry.question}\n`;
        }
        if (entry.answer) {
          fullTranscript += `Answer: ${entry.answer}\n`;
        }
      });

      const prompt = {
        model: "gpt-3.5-turbo-0125",
        messages: [
          { 
            "role": "system", 
            "content": 
`You are a transcript formatter. Format this Q&A transcript into a title and summary.

INPUT FORMAT:
The input will be a conversation with "Question:" and "Answer:" lines

OUTPUT FORMAT:
TITLE: [Brief descriptive title based on the actual content]

FORMATTEDNOTE:
[Format the transcript in HTML paragraphs]

RULES:
1. Use ONLY the exact content from the transcript
2. DO NOT invent or add any content
3. Format each line as: <p><strong>Guide:</strong> [question text]</p> or <p><strong>Answer:</strong> [answer text]</p>`
          },
          { 
            "role": "user", 
            "content": fullTranscript 
          }
        ],
        max_tokens: 3000,
        temperature: 0.1
      };

      const response = await openai.chat.completions.create(prompt);

      if (response.choices && response.choices.length > 0) {
        const resultText = response.choices[0].message.content.trim();
        const sections = resultText.split(/\n(?=TITLE:|FORMATTEDNOTE:)/);
        
        let title = '';
        let summary = '';

        sections.forEach(section => {
          if (section.startsWith('TITLE:')) {
            title = section.replace('TITLE:', '').trim();
          } else if (section.startsWith('FORMATTEDNOTE:')) {
            summary = section.replace('FORMATTEDNOTE:', '').trim();
          }
        });

        // Remove any remaining newlines between HTML tags
        summary = summary.replace(/>\s+</g, '><');

        // Update Firebase with title and summary
        await admin.database().ref(`/guidedSessions/${userId}/${sessionId}`).update({
          title: title || 'Untitled Session',
          summary: summary || fullTranscript,
          status: 'Completed',
          completedAt: admin.database.ServerValue.TIMESTAMP
        });

      } else {
        throw new Error('No response from OpenAI API');
      }

      return null;
    } catch (error) {
      console.error(`Error processing session ${sessionId}:`, error);
      // Update status to 'Error' and log the error
      await admin.database().ref(`/guidedSessions/${userId}/${sessionId}`).update({
        status: 'Error',
        error: error.message,
      });
      return null;
    }
  });

