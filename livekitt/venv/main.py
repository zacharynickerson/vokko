import asyncio
import logging
import os
from dotenv import load_dotenv

from livekit.agents import AutoSubscribe, JobContext, WorkerOptions, cli, llm
from livekit.agents.voice_assistant import VoiceAssistant
from livekit.plugins import deepgram, openai, silero


load_dotenv()

livekit_url = os.getenv('LIVEKIT_URL')
livekit_api_key = os.getenv('LIVEKIT_API_KEY')
livekit_secret = os.getenv('LIVEKIT_SECRET')
deepgram_api_key = os.getenv('DEEPGRAM_API_KEY')
openai_api_key = os.getenv('OPENAI_API_KEY')


# print(f"LiveKit URL: {livekit_url}")
# print(f"LiveKit API Key: {livekit_api_key}")
# print(f"Deepgram API Key: {deepgram_api_key}")
# print(f"OpenAI API Key: {openai_api_key}")


# This function is the entrypoint for the agent.
async def entrypoint(ctx: JobContext):
    initial_ctx = llm.ChatContext().append(
        role="system",
        text=(
            "You are a customer service agent for the newly found colony on Mars. act as tho this is a real thing happening and play along with a whimsical attitude"
        ),
    )

    # Connect to the LiveKit room
    # indicating that the agent will only subscribe to audio tracks
    await ctx.connect(auto_subscribe=AutoSubscribe.AUDIO_ONLY)

    # VoiceAssistant is a class that creates a full conversational AI agent.
    # See https://github.com/livekit/agents/tree/main/livekit-agents/livekit/agents/voice_assistant
    # for details on how it works.
    assistant = VoiceAssistant(
        vad=silero.VAD.load(),
        stt=deepgram.STT(),
        llm=openai.LLM(),
        tts=openai.TTS(),
        chat_ctx=initial_ctx,
    )

    # Start the voice assistant with the LiveKit room
    assistant.start(ctx.room)

    await asyncio.sleep(1)
    await assistant.say("Hey, how can I help you today?", allow_interruptions=True)

 # Initialize the worker with the entrypoint

if __name__ == "__main__":
    cli.run_app(WorkerOptions(entrypoint_fnc=entrypoint))