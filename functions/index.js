/* global process */
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const fs = require('fs');
const FormData = require('form-data');
const axios = require('axios');
const https = require('https');

// Import v2 function types
const { HttpsError, onCall } = require("firebase-functions/v2/https");
const { onValueUpdated } = require("firebase-functions/v2/database"); 

// Initialize Admin SDK
if (!admin.apps.length) {
  admin.initializeApp(); 
}

// Other Service Initializations
const { Storage } = require("@google-cloud/storage");
const storage = new Storage();
const OpenAI = require("openai");
const dotenv = require('dotenv');
dotenv.config(); 

let openaiClient = null;

// Function to get the API key from Remote Config
async function getApiKeyFromRemoteConfig() {
  try {
    const template = await admin.remoteConfig().getTemplate();
    const apiKey = template.parameters.openai_api_key?.defaultValue?.value;
    if (!apiKey) {
      console.error('OpenAI API key not found in Remote Config parameter "openai_api_key".');
      throw new Error('OpenAI API key not configured in Remote Config.');
    }
    console.log('Successfully fetched API Key from Remote Config.');
    return apiKey;
  } catch (error) {
    console.error('Error fetching API Key from Remote Config:', error);
    throw new Error('Failed to fetch API key from Remote Config.');
  }
}

async function getOpenAIClient() {
  if (!openaiClient) {
    const apiKey = await getApiKeyFromRemoteConfig(); // Fetch from Remote Config
    openaiClient = new OpenAI({
      apiKey: apiKey,
    });
  }
  return openaiClient;
}

const db = admin.database();

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

// --- Helper Functions --- 

async function transcribeAudioWithRetry(audioBuffer, retries = 0) {
  try {
    console.log('Starting audio transcription process');

    // Fetch API key from Remote Config for this attempt
    const apiKey = await getApiKeyFromRemoteConfig(); 
    const envApiKey = process.env.OPENAI_KEY; // Keep checking env for comparison/debugging if needed
    
    console.log('API Key Verification:');
    console.log('- Remote Config key length:', apiKey?.length);
    console.log('- Remote Config key prefix:', apiKey?.substring(0, 7));
    console.log('- Environment key length (for debug):', envApiKey?.length);
    console.log('- Environment key prefix (for debug):', envApiKey?.substring(0, 7));
    
    // Check for hidden characters in Remote Config key
    if (apiKey) {
      console.log('- Raw buffer length (Remote Config):', Buffer.from(apiKey).length);
      console.log('- Contains newlines (Remote Config):', apiKey.includes('\n'));
      console.log('- Contains spaces (Remote Config):', apiKey.includes(' '));
      console.log('- Stringified version (Remote Config):', JSON.stringify(apiKey));
    }
    
    // Create a temporary file
    const tempFilePath = `/tmp/temp_audio_${Date.now()}.m4a`;
    await fs.promises.writeFile(tempFilePath, audioBuffer);
    
    // Create form data
    const formData = new FormData();
    formData.append('file', fs.createReadStream(tempFilePath), {
      filename: 'audio.m4a',
      contentType: 'audio/m4a'
    });
    formData.append('model', 'whisper-1');
    
    // Get form data headers
    const formHeaders = formData.getHeaders();
    
    // Log complete request details
    console.log('\nRequest Details:');
    console.log('URL:', 'https://api.openai.com/v1/audio/transcriptions');
    console.log('Method:', 'POST');
    console.log('Headers:', {
      'Authorization': `Bearer ${apiKey.substring(0, 7)}...`, // Use Remote Config key
      ...formHeaders
    });
    console.log('Form Data Fields:', {
      'file': {
        filename: 'audio.m4a',
        contentType: 'audio/m4a'
      },
      'model': 'whisper-1'
    });
    
    // Make request with explicit headers
    const response = await axios.post('https://api.openai.com/v1/audio/transcriptions', formData, {
      headers: {
        'Authorization': `Bearer ${apiKey}`, // Use Remote Config key
        ...formHeaders
      },
      maxContentLength: Infinity,
      maxBodyLength: Infinity
    });
    
    // Clean up temp file
    await fs.promises.unlink(tempFilePath);
    
    // Log response details
    console.log('\nResponse Details:');
    console.log('Status:', response.status);
    console.log('Status Text:', response.statusText);
    console.log('Headers:', response.headers);
    console.log('Data:', response.data);
    
    if (!response.data || !response.data.text) {
      console.error('Invalid response from OpenAI:', response.data);
      throw new Error('Invalid response from OpenAI API');
    }
    
    console.log('Transcription successful');
    return { transcript: response.data.text };
    
  } catch (error) {
    console.error('\nError Details:');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    
    if (error.response) {
      console.error('OpenAI API Error Response:', {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data,
        headers: error.response.headers
      });
    } else if (error.request) {
      console.error('No response received from OpenAI API');
      console.error('Request details:', error.request);
    } else {
      console.error('Error setting up request:', error.message);
    }
    
    if (error.response && error.response.status === 429 && retries < MAX_RETRIES) {
      console.warn(`Rate limit hit, retrying in ${RETRY_DELAY_MS}ms...`);
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
      return transcribeAudioWithRetry(audioBuffer, retries + 1);
    }
    
    throw new functions.https.HttpsError('internal', `Error transcribing audio: ${error.message}`);
  }
}

async function processTranscriptAndUpdateVoiceNote(userId, voiceNoteId, transcript) {
  const tempOpenai = await getOpenAIClient(); // Ensure client uses Remote Config key
  functions.logger.info(`Processing voice note: userId=${userId}, voiceNoteId=${voiceNoteId}`);
  // Use the exact previous prompt that requested HTML formatting
  const prompt = {
    model: "gpt-3.5-turbo-0125",
    messages: [
      {
        role: "system",
        content: "You are an AI assistant that processes voice note transcripts. Your task is to generate a title, a concise card summary, and a beautifully formatted version of the transcript. The output should maintain the original voice and content, but improve readability with formatting and styling. Use HTML tags for styling, such as <strong>, <em>, and <u>. Format section headers as <h3 style='color: #4FBF67;'>[Header Text]</h3>. Use headers sparingly, only for major topic changes, typically every 2-3 paragraphs. Avoid using terms like 'overview' or 'the speaker'. Wrap paragraphs in <p> tags without extra line breaks between them. Your response should be in the following format:\n\nTITLE: [Generated Title]\n\nCARDSUMMARY: [A single concise paragraph summarizing the key points, max 200 characters]\n\nFORMATTEDNOTE: [Formatted transcript with HTML styling]"
      },
      {
        role: "user",
        content: `Please process the following voice note transcript:\n\n${transcript}`
      }
    ],
    max_tokens: 3000,
    temperature: 0.7
  };
  try {
    const response = await tempOpenai.chat.completions.create(prompt);
    if (response.choices && response.choices.length > 0) {
      const resultText = response.choices[0].message.content.trim();
      const sections = resultText.split(/\n(?=TITLE:|CARDSUMMARY:|FORMATTEDNOTE:)/);
      let title = '';
      let cardSummary = '';
      let summary = '';
      sections.forEach(section => {
        if (section.startsWith('TITLE:')) {
          title = section.replace('TITLE:', '').trim();
        }
        else if (section.startsWith('CARDSUMMARY:')) {
          cardSummary = section.replace('CARDSUMMARY:', '').trim();
        }
        else if (section.startsWith('FORMATTEDNOTE:')) {
          summary = section.replace('FORMATTEDNOTE:', '').trim(); 
        }
      });
      // Restore the HTML whitespace cleanup
      summary = summary.replace(/>\s+</g, '><'); 
      await db.ref(`/voiceNotes/${userId}/${voiceNoteId}`).update({ 
        title: title || 'Untitled Note', 
        summary: summary || transcript, 
        cardSummary: cardSummary || title || 'Untitled Note',
        status: 'completed' 
      });
      functions.logger.info(`Voice note processed successfully: ${voiceNoteId}`);
    } else { throw new Error('API returned no choices'); }
  } catch (error) { functions.logger.error('Error processing voice note transcript:', {userId, voiceNoteId, error }); throw error; }
}

// --- Callable Functions (v2) --- 

exports.transcribeAudio = onCall(async (request) => {
  // Skip auth check in emulator
  if (process.env.FUNCTIONS_EMULATOR !== 'true' && !request.auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated.');
  }
  const { audioUrl } = request.data;
  if (!audioUrl) {
    throw new HttpsError('invalid-argument', 'Audio URL is required.');
  }
  try {
    const response = await axios.get(audioUrl, { responseType: 'arraybuffer' });
    const audioBuffer = Buffer.from(response.data);
    return await transcribeAudioWithRetry(audioBuffer); 
  } catch (error) {
    functions.logger.error('Error downloading audio in transcribeAudio:', { error: error.message });
    if (error instanceof HttpsError) throw error;
    throw new HttpsError('internal', `Error downloading audio: ${error.message}`);
  }
});

exports.retryVoiceNoteProcessing = onCall(async (request) => {
  // Skip auth check in emulator
  if (process.env.FUNCTIONS_EMULATOR !== 'true' && !request.auth) {
    throw new HttpsError("unauthenticated", "User must be authenticated.");
  }
  const userId = request.auth?.uid || 'test-user-123'; // Use test user ID in emulator
  const { voiceNoteId } = request.data;
  if (!voiceNoteId) {
    throw new HttpsError("invalid-argument", "The function must be called with a voiceNoteId.");
  }
  functions.logger.info(`Retry requested for voiceNoteId: ${voiceNoteId} by userId: ${userId}`);
  const voiceNoteRef = db.ref(`/voiceNotes/${userId}/${voiceNoteId}`);
  try {
    const snapshot = await voiceNoteRef.once("value");
    if (!snapshot.exists()) {
      throw new HttpsError("not-found", "Voice note not found.");
    }
    const voiceNoteData = snapshot.val();
    if (voiceNoteData.status !== 'processing' && voiceNoteData.status !== 'error' && voiceNoteData.status !== 'Error') {
       throw new HttpsError("failed-precondition", `Retry not allowed for status: ${voiceNoteData.status}`);
    }
    await voiceNoteRef.update({
      status: 'processing',
      processingStartedAt: admin.database.ServerValue.TIMESTAMP, 
      lastRetryAttempt: admin.database.ServerValue.TIMESTAMP, 
      error: null, 
      errorDetails: null 
    });
    return { success: true, message: 'Reprocessing initiated successfully.' };
  } catch (error) {
    functions.logger.error("Error during retryVoiceNoteProcessing", { userId, voiceNoteId, error });
    if (error instanceof HttpsError) throw error;
    throw new HttpsError("internal", "An unexpected error occurred.", error.message);
  }
});

// --- Database Triggers (v2 syntax, but helpers use functions.config()) --- 
exports.processVoiceNoteBackground = onValueUpdated({ 
  ref: "/voiceNotes/{userId}/{voiceNoteId}",
  instance: "vokko-f8f6a-default-rtdb",
  region: "europe-west1",
  timeoutSeconds: 540,
  memory: "1GiB",
  minInstances: 0,
  maxInstances: 10
}, async (event) => {
  const snapshot = event.data.after;
  const voiceNoteData = snapshot.val();
  const beforeData = event.data.before.val(); 
  const { userId, voiceNoteId } = event.params;
  if (!voiceNoteData || voiceNoteData.status !== 'processing' || (beforeData?.status === 'processing' && voiceNoteData.processingStartedAt === beforeData?.processingStartedAt)) { 
    functions.logger.info('Not processing or status did not change to processing/retry needed.', { userId, voiceNoteId, status: voiceNoteData?.status });
    return null;
  }
  functions.logger.info('Processing voice note background task triggered.', { userId, voiceNoteId });
  try {
    let fullTranscript = '';
    const bucket = admin.storage().bucket();
    if (voiceNoteData.totalChunks === undefined || voiceNoteData.totalChunks <= 0) {
        await db.ref(`voiceNotes/${userId}/${voiceNoteId}`).update({ 
          status: 'Error', 
          error: 'No audio chunks found.',
          errorDetails: 'The voice note was uploaded but no audio chunks were found to process.'
        });
        return null;
    }
    for (let i = 0; i < voiceNoteData.totalChunks; i++) {
      const chunkPath = `users/${userId}/voiceNotes/${voiceNoteId}/chunks/${i}.m4a`;
      const transcriptionPath = `users/${userId}/voiceNotes/${voiceNoteId}/transcriptions/${i}.txt`;
      const tempFilePath = `/tmp/${voiceNoteId}_${i}.m4a`;
      try {
          await bucket.file(chunkPath).download({ destination: tempFilePath });
          const audioBuffer = await fs.promises.readFile(tempFilePath);
          const { transcript } = await transcribeAudioWithRetry(audioBuffer); 
          await bucket.file(transcriptionPath).save(transcript);
          fullTranscript += transcript + ' ';
      } catch (chunkError) {
          functions.logger.error(`Error processing chunk ${i}`, { userId, voiceNoteId, error: chunkError });
          await db.ref(`voiceNotes/${userId}/${voiceNoteId}`).update({ 
            status: 'Error', 
            error: `Failed to process chunk ${i}`,
            errorDetails: chunkError.message
          });
          return null;
      } finally {
          try { if (fs.existsSync(tempFilePath)) { await fs.promises.unlink(tempFilePath); } } catch (cleanupError) { functions.logger.error('Error cleaning temp file', { error: cleanupError }); }
      }
    }
    functions.logger.info('Transcription complete, updating DB.', { userId, voiceNoteId });
    await db.ref(`voiceNotes/${userId}/${voiceNoteId}`).update({
      transcript: fullTranscript.trim(),
      status: 'transcribed',
    });
    await processTranscriptAndUpdateVoiceNote(userId, voiceNoteId, fullTranscript.trim());
  } catch (error) {
    functions.logger.error('Error processing voice note background task:', { userId, voiceNoteId, error });
    try {
        await db.ref(`/voiceNotes/${userId}/${voiceNoteId}`).update({ 
          status: 'Error', 
          error: 'Transcription failed',
          errorDetails: error.message 
        });
    } catch (dbError) { 
        functions.logger.error('Failed to update DB error status', { error: dbError }); 
    }
    return null;
  }
});

exports.processGuidedSession = onValueUpdated({
    ref: "/guidedSessions/{userId}/{sessionId}/status",
    instance: "vokko-f8f6a-default-rtdb",
    region: "europe-west1"
  }, async (event) => {
    const newStatus = event.data.after.val();
    const oldStatus = event.data.before.val();
    const { userId, sessionId } = event.params;
    if (newStatus !== 'Processing' || oldStatus === 'Processing') {
      return null;
    }
    functions.logger.info('Processing guided session', { userId, sessionId });
    try {
      const transcriptSnapshot = await db.ref(`/guidedSessions/${userId}/${sessionId}/transcript`).once('value');
      const transcriptData = transcriptSnapshot.val();
      if (!transcriptData) { throw new Error('Transcript data missing.'); }
      let fullTranscript = '';
      Object.values(transcriptData).forEach(entry => {
        if (entry.question) fullTranscript += `Question: ${entry.question}\n`;
        if (entry.answer) fullTranscript += `Answer: ${entry.answer}\n`;
      });
      // Use the exact previous prompt for guided sessions
      const prompt = {
        model: "gpt-3.5-turbo-0125",
        messages: [
          {
            role: "system",
            content: "You are a transcript formatter. Format this Q&A transcript into a title and summary.\n\nINPUT FORMAT:\nThe input will be a conversation with \"Question:\" and \"Answer:\" lines\n\nOUTPUT FORMAT:\nTITLE: [Brief descriptive title based on the actual content]\n\nFORMATTEDNOTE:\n[Format the transcript in HTML paragraphs]\n\nRULES:\n1. Use ONLY the exact content from the transcript\n2. DO NOT invent or add any content\n3. Format each line as: <p><strong>Guide:</strong> [question text]</p> or <p><strong>Answer:</strong> [answer text]</p>"
          },
          {
            role: "user",
            content: fullTranscript
          }
        ],
        max_tokens: 3000,
        temperature: 0.1 // Note: Temperature was 0.1 in the old code
      };

      // Get OpenAI client which uses Remote Config key
      const tempOpenai = await getOpenAIClient();

      const response = await tempOpenai.chat.completions.create(prompt);
      if (response.choices && response.choices.length > 0) {
        let title = 'Guided Session';
        let summary = fullTranscript;
        const resultText = response.choices[0].message.content.trim();
        const sections = resultText.split(/\n(?=TITLE:|FORMATTEDNOTE:)/);
        sections.forEach(section => {
          if (section.startsWith('TITLE:')) { title = section.replace('TITLE:', '').trim() || title; }
          else if (section.startsWith('FORMATTEDNOTE:')) { summary = section.replace('FORMATTEDNOTE:', '').trim() || summary; }
        });
        // Restore the HTML whitespace cleanup for guided sessions
        summary = summary.replace(/>\s+</g, '><');
        await db.ref(`/guidedSessions/${userId}/${sessionId}`).update({ title, summary, status: 'Completed', completedAt: admin.database.ServerValue.TIMESTAMP });
      } else { throw new Error('No response from OpenAI'); }
      return null;
    } catch (error) {
      functions.logger.error(`Error processing guided session ${sessionId}:`, { userId, error });
      try { await db.ref(`/guidedSessions/${userId}/${sessionId}`).update({ status: 'Error', error: error.message }); } catch (dbError) { functions.logger.error('Failed to update guided session error status', { error: dbError }); }
      return null;
    }
  });
