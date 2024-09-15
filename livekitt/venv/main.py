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

SESSION_PROMPTS = {
     "daily_standup": [
        "Let's start with your main goals for today. What would you like to accomplish?",
        "Considering these goals, what potential challenges do you foresee?",
        "Now, let's recall any ongoing goals or habits you're working on. How do they fit into today's plan?",
        "Given what we've discussed, how would you prioritize your tasks for today?",
        "Before we wrap up, is there anything else you'd like to address to ensure a productive day?"
    ],
    "goal_setting": [
        "Let's begin by reviewing your existing goals. Can you tell me about your progress on them?",
        "Now, let's explore any new goals you want to set. What areas of your life would you like to improve?",
        "For each goal, let's make it SMART. Can you make it Specific, Measurable, Achievable, Relevant, and Time-bound?",
        "What potential obstacles do you foresee in achieving these goals, and how might you overcome them?",
        "Let's set up a plan to track your progress. How and when will you review your advancement towards these goals?"
    ],
}

async def get_session_type(assistant):
    await assistant.say("What type of session would you like to have today? Options include Daily Morning Standup or Goal Setting and Review", allow_interruptions=True)
    response = await assistant.listen()
    
    # Simple mapping of user response to session type
    if "daily" in response.lower() or "standup" in response.lower():
        return "daily_standup"
    elif "goal" in response.lower():
        return "goal_setting"
    else:
        return None
    
async def conduct_interactive_session(assistant, session_type):
    questions = SESSION_PROMPTS[session_type]
    
    for question in questions:
        await assistant.say(question, allow_interruptions=True)
        response = await assistant.listen()
        
        # Process the response and generate a follow-up comment
        follow_up = await assistant.llm.complete(
            llm.ChatContext().append(
                role="system",
                text=f"You are an AI life coach named Vokko. The user has just responded to this question: {question}\n"
                     f"Their response was: {response}\n"
                     f"Provide a brief, supportive comment on their response and, if appropriate, ask a follow-up question to dig deeper."
            )
        )
        
        await assistant.say(follow_up, allow_interruptions=True)
        await asyncio.sleep(1)  # Small pause between questions

# This function is the entrypoint for the agent.
async def entrypoint(ctx: JobContext):
    initial_ctx = llm.ChatContext().append(
        role="system",
        text=(
            "You are an AI life coach named Vokko. Your role is to guide users through various personal development sessions. "
            "Approach each conversation with empathy, wisdom, and a focus on helping the user achieve their goals. "
            "Ask one question at a time, listen to the response, and provide supportive feedback before moving to the next question. "
            "Summarize key points and help identify actionable steps throughout the conversation. "
            "End the session by reviewing the main takeaways and next steps."
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
    await assistant.say("Hey, welcome to a new guided session with Vohko.", allow_interruptions=True)

    session_type = await get_session_type(assistant)

    if session_type in SESSION_PROMPTS:
        # Add the session-specific prompt to the chat context
        assistant.chat_ctx.append(
            role="system",
            text=SESSION_PROMPTS[session_type]
        )
        await assistant.say(f"Great, let's begin your {session_type.replace('_', ' ')} session.", allow_interruptions=True)
    else:
        await assistant.say("I'm sorry, I didn't understand the session type. Let's proceed with a general guided session.", allow_interruptions=True)
        # Wrap up the session
        await assistant.say("We've come to the end of our session. Let's quickly review the main points and action steps we've discussed.", allow_interruptions=True)


 # Initialize the worker with the entrypoint
 

if __name__ == "__main__":
    cli.run_app(WorkerOptions(entrypoint_fnc=entrypoint))

# cd livekitt
# cd venv
# python3 main.py dev