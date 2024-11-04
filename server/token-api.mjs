import express from 'express';
import { AccessToken } from 'livekit-server-sdk';
import dotenv from 'dotenv';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const app = express();

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.get('/test', (req, res) => {
  res.json({ status: 'ok' });
});

app.get('/api/token', async (req, res) => {
  console.log('Received token request with query:', req.query);
  const { roomName, userId, serverUrl } = req.query;
  
  if (!userId || !roomName) {
    return res.status(400).json({ error: 'userId and roomName are required' });
  }

  try {
    const at = new AccessToken(process.env.LIVEKIT_API_KEY, process.env.LIVEKIT_API_SECRET, { 
      identity: userId,
      name: userId,
    });
    
    at.addGrant({
      room: roomName,
      roomJoin: true,
      canPublish: true,
      canPublishData: true,
      canSubscribe: true,
    });

    const token = await at.toJwt();
    
    const wsUrl = 'wss://vokko-br0jpzwx.livekit.cloud';
    console.log('Using WebSocket URL:', wsUrl);
    
    res.json({
      accessToken: token,
      url: wsUrl,
      roomName: roomName
    });
  } catch (error) {
    console.error('Token generation error:', error);
    res.status(500).json({ error: 'Failed to generate token' });
  }
});

app.get('/debug/connection', async (req, res) => {
  const { roomName, userId } = req.query;
  
  try {
    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;
    const wsUrl = process.env.LIVEKIT_URL;
    
    // Generate a test token
    const at = new AccessToken(apiKey, apiSecret, { identity: userId || 'test-user' });
    at.addGrant({
      room: roomName || 'test-room',
      roomJoin: true,
      canPublish: true,
      canPublishData: true,
      canSubscribe: true,
    });

    const token = await at.toJwt();
    
    res.json({
      success: true,
      config: {
        hasApiKey: !!apiKey,
        hasApiSecret: !!apiSecret,
        wsUrl,
        canGenerateToken: !!token,
      },
      testToken: token.substring(0, 20) + '...' // Only show part of the token
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      config: {
        hasApiKey: !!process.env.LIVEKIT_API_KEY,
        hasApiSecret: !!process.env.LIVEKIT_API_SECRET,
        wsUrl: process.env.LIVEKIT_URL
      }
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Token server running on port ${PORT}`);
  console.log('Environment variables loaded:', {
    hasApiKey: !!process.env.LIVEKIT_API_KEY,
    hasApiSecret: !!process.env.LIVEKIT_API_SECRET,
    wsUrl: process.env.LIVEKIT_URL
  });
});
