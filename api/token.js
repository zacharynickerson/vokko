import express from 'express';
import { AccessToken } from 'livekit-server-sdk';
import dotenv from 'dotenv';
import cors from 'cors';

dotenv.config();

const app = express();

app.use(cors());

app.get('/api/token', async (req, res) => {
  console.log('Received token request');
  const { roomName, userId } = req.query;
  
  if (!userId || !roomName) {
    return res.status(400).json({ error: 'userId and roomName are required' });
  }

  console.log('Room Name:', roomName); // Add this log

  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_SECRET;

  const at = new AccessToken(apiKey, apiSecret, { identity: userId });
  
  at.addGrant({
    room: roomName,
    roomJoin: true,
    canPublish: true,
    canPublishData: true,
    canSubscribe: true,
  });

  try {
    const token = await at.toJwt();
    console.log('Sending response:', { accessToken: token, url: process.env.LIVEKIT_URL, roomName });
    res.json({ accessToken: token, url: process.env.LIVEKIT_URL, roomName });
  } catch (error) {
    console.error('Error generating token:', error);
    res.status(500).json({ error: 'Failed to generate token' });
  }
});

app.listen(3000, () => console.log('Token server running on port 3000'));