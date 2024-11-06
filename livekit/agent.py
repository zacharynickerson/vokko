import logging
import asyncio
import os
from dotenv import load_dotenv
from livekit.agents import (
    AutoSubscribe,
    JobContext,
    JobProcess,
    WorkerOptions,
    cli,
    llm,
    transcription,
)
from livekit.agents.pipeline import VoicePipelineAgent
from livekit.plugins import openai, silero


load_dotenv(dotenv_path=".env.local")
logger = logging.getLogger("voice-agent")


def prewarm(proc: JobProcess):
    proc.userdata["vad"] = silero.VAD.load()


async def entrypoint(ctx: JobContext):
    initial_ctx = llm.ChatContext().append(
        role="system",
        text=(
            "You are an AI guide helping users through guided sessions. "
            "You should provide helpful, concise responses focused on the user's needs. "
            "You are knowledgeable about various topics and can help guide users through their sessions."
        ),
    )

    logger.info(f"connecting to room {ctx.room.name}")
    # Connect with both audio and video capabilities
    await ctx.connect(auto_subscribe=AutoSubscribe.AUDIO_ONLY)

    # Wait for the specific participant (user) to connect
    # The user's ID will be in the format: userId_moduleId_guideId_sessionId
    participant = await ctx.wait_for_participant()
    user_id = participant.identity.split('_')[0]  # Extract the actual user ID
    logger.info(f"starting guided session for participant {user_id}")

    # Create the STT forwarder
    # stt_forwarder = transcription.STTSegmentsForwarder(
    #     room=ctx.room,
    #     participant=participant,
    #     track=None  # This will be set automatically by VoicePipelineAgent
    # )

    # This project is configured to use OpenAI for both STT and TTS plugins
    # Other great providers exist like Cartesia and ElevenLabs
    # Learn more and pick the best one for your app:
    # https://docs.livekit.io/agents/plugins
    assistant = VoicePipelineAgent(
        vad=ctx.proc.userdata["vad"],
        stt=openai.STT(),
        llm=openai.LLM(model="gpt-4o-mini"),
        tts=openai.TTS(),
        chat_ctx=initial_ctx,
    )

    # Set the forwarder after creating the agent
    # assistant.stt_forwarder = stt_forwarder

    assistant.start(ctx.room, participant)

    # The agent should be polite and greet the user when it joins :)
    await assistant.say("Hey, how can I help you today?", allow_interruptions=True)


if __name__ == "__main__":
    # Get port from Heroku environment
    port = int(os.environ.get("PORT", 5000))
    
    # Run the worker with simplified port configuration
    cli.run_app(
        WorkerOptions(
            entrypoint_fnc=entrypoint,
            prewarm_fnc=prewarm,
            port=port,  # Add the port
            host="0.0.0.0",  # Required for Heroku
        ),
    )