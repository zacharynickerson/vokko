import { NextResponse } from 'next/server';
import { generateToken } from '../server/token-api.mjs'; // Adjust the import as needed

export async function GET(request) {
    const roomName = request.nextUrl.searchParams.get('roomName');
    const token = await generateToken(roomName); // Your token generation logic
    return NextResponse.json({ accessToken: token });
}