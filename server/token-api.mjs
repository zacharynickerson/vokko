import express from 'express';
import { AccessToken } from 'livekit-server-sdk';
import dotenv from 'dotenv';
import cors from 'cors';

dotenv.config();

const app = express();

app.use(cors());

app.get('/api/token', async (req, res) => {
  console.log('Received token request');
  const roomName = req.query.roomName || Math.random().toString(36).substring(7);
  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_SECRET;
  const at = new AccessToken(apiKey, apiSecret, { identity: "human_user" });
  at.addGrant({
    room: roomName,
    roomJoin: true,
    canPublish: true,
    canPublishData: true,
    canSubscribe: true,
  });
  const token = await at.toJwt();
  console.log('Sending response:', { accessToken: token, url: process.env.LIVEKIT_URL, roomName });
  res.json({ accessToken: token, url: process.env.LIVEKIT_URL, roomName });
});

app.listen(3000, () => console.log('Token server running on port 3000'));