import asyncio
import logging
import os
from dotenv import load_dotenv
from livekit.agents import AutoSubscribe, JobContext, WorkerOptions, cli, llm, stt
from livekit.agents.voice_assistant import VoiceAssistant
from livekit.plugins import deepgram, openai, silero
from livekit import rtc
from datetime import datetime
import firebase_admin
from firebase_admin import firestore
from firebase_admin import db  # Ensure you have initialized Firebase Admin SDK

# ============================
# Load Environment Variables
# ============================
load_dotenv()

livekit_url = os.getenv('LIVEKIT_URL')
livekit_api_key = os.getenv('LIVEKIT_API_KEY')
livekit_secret = os.getenv('LIVEKIT_SECRET')
deepgram_api_key = os.getenv('DEEPGRAM_API_KEY')
openai_api_key = os.getenv('OPENAI_API_KEY')

# ============================
# Logger Initialization
# ============================
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)  # Add this line to initialize the logger

# ============================
# Session Prompts
# ============================
SESSION_PROMPTS = {
    "daily_standup": [
        "What will you do today?",
        "Anything else?"
        # "Given what we've discussed, how would you prioritize your tasks for today?",
        # "Before we wrap up, is there anything else you'd like to address to ensure a productive day?"
    ],
    "goal_setting": [
        "Let's begin by reviewing your existing goals. Can you tell me about your progress on them?",
        "What potential obstacles do you foresee in achieving these goals, and how might you overcome them?",
        "Before we wrap up, is there anything else you'd like to address to ensure a productive day?"
    ],
}

# ============================
# Function to Conduct Interactive Session
# ============================
async def conduct_interactive_session(assistant, session_type):
    global conversation_messages
    questions = SESSION_PROMPTS[session_type]
    
    for question in questions:
        # AI asks a question
        print(f"AI: {question}")
        logger.info(f"AI: {question}")
        await assistant.say(question, allow_interruptions=True)
        conversation_messages.append(("AI", question))
        
        # Wait for user response
        print("Waiting for user response...")
        logger.info("Waiting for user response...")
        response = await assistant.listen()
        print(f"User: {response}")
        logger.info(f"User: {response}")
        conversation_messages.append(("User", response))
        
        # Save conversation to Firebase
        save_conversation_to_firebase(session_type, question, response)  # <-- Called here

        # Generate AI follow-up
        print("Generating AI follow-up...")
        logger.info("Generating AI follow-up...")
        follow_up = await assistant.llm.complete(
            llm.ChatContext().append(
                role="system",
                text=f"You are an AI life coach named Vokko. The user has just responded to this question: {question}\n"
                     f"Their response was: {response}\n"
                     f"Provide a brief, supportive comment on their response and, if appropriate, ask a follow-up question to dig deeper."
            )
        )
        
        print(f"AI: {follow_up}")
        logger.info(f"AI: {follow_up}")
        await assistant.say(follow_up, allow_interruptions=True)
        conversation_messages.append(("AI", follow_up))
        
        await asyncio.sleep(1)

def save_conversation_to_firebase(session_type, question, response):
    # Save to Firebase logic
    try:
        ref = db.reference(f'conversations/{session_type}')
        conversation_data = {
            'question': question,
            'response': response,
            'timestamp': firebase_admin.firestore.SERVER_TIMESTAMP  # Use server timestamp
        }
        ref.push(conversation_data)  # Use push to create a unique key for each message
    except Exception as e:
        logger.error(f"Error saving conversation to Firebase: {str(e)}")

# ============================
# Entry Point for the Agent
# ============================
async def entrypoint(ctx: JobContext):
    global conversation_messages, session_type

    initial_ctx = llm.ChatContext().append(
        role="system",
        text=(
            "You are an AI life coach named Vohko. Your role is to guide users through various personal development sessions. "
            "Approach each conversation with empathy, wisdom, and a focus on helping the user achieve their goals. "
            "Ask one question at a time, listen to the response, and provide very short but supportive feedback before moving to the next question. "
            "End the session by reviewing the main takeaways and next steps."
        ),
    )

    # Connect to the LiveKit room
    await ctx.connect(auto_subscribe=AutoSubscribe.AUDIO_ONLY)

    # VoiceAssistant is a class that creates a full conversational AI agent.
    assistant = VoiceAssistant(
        vad=silero.VAD.load(),
        stt=deepgram.STT(),
        llm=openai.LLM(),
        tts=openai.TTS(),
        chat_ctx=initial_ctx,
    )

    # Start the voice assistant with the LiveKit room
    assistant.start(ctx.room)

    logger.info("Starting the guided session.")
    await assistant.say("Hey, welcome to a new guided session with Vohko.", allow_interruptions=True)
    conversation_messages.append(("AI", "Hey, welcome to a new guided session with Vohko."))
    logger.info("AI: Hey, welcome to a new guided session with Vohko.")

    session_type = await get_session_type(assistant)
    logger.info(f"Session type selected: {session_type}")

    if session_type in SESSION_PROMPTS:
        await conduct_interactive_session(assistant, session_type)
    else:
        await assistant.say("I'm sorry, I didn't understand the session type. Let's proceed with a general guided session.", allow_interruptions=True)
        conversation_messages.append(("AI", "I'm sorry, I didn't understand the session type. Let's proceed with a general guided session."))
        logger.info("AI: I'm sorry, I didn't understand the session type. Let's proceed with a general guided session.")

    # Wrap up the session
    await assistant.say("We've come to the end of our session. Let's quickly review the main points and action steps we've discussed.", allow_interruptions=True)
    conversation_messages.append(("AI", "We've come to the end of our session. Let's quickly review the main points and action steps we've discussed."))
    logger.info("AI: We've come to the end of our session. Let's quickly review the main points and action steps we've discussed.")


# ============================
# Function to Get Session Type
# ============================
async def get_session_type(assistant: VoiceAssistant):
    await assistant.say("What type of session would you like to have today? Options include Daily Morning Standup or Goal Setting and Review", allow_interruptions=True)
    conversation_messages.append(("AI", "What type of session would you like to have today? Options include Daily Morning Standup or Goal Setting and Review"))
    
    user_input = await wait_for_user_input(assistant)
    logger.info(f"Human: {conversation_messages}")

    conversation_messages.append(("User", user_input))
    
    if "daily" in user_input.lower() or "standup" in user_input.lower():
        return "daily_standup"
    elif "goal" in user_input.lower():
        return "goal_setting"
    else:
        return None

# ============================
# Function to Wait for User Input
# ============================
async def wait_for_user_input(assistant: VoiceAssistant):
    while True:
        await asyncio.sleep(0.1)  # Small delay to prevent busy waiting
        if assistant._human_input and assistant._human_input._events:
            for event in assistant._human_input._events:
                if isinstance(event, stt.SpeechEvent) and event.is_final:
                    assistant._human_input._events.clear()  # Clear the events after processing
                    return event.alternatives[0].text
    return ""

# ============================
# Function to Handle End Call
# ============================

async def handle_end_call(assistant: VoiceAssistant):
    await assistant.room.disconnect()  # Ensure the room disconnects gracefully

# ============================
# Initialize the Worker with the Entry Point
# ============================
if __name__ == "__main__":
    cli.run_app(WorkerOptions(entrypoint_fnc=entrypoint))

# ============================
# Command to Run the Application
# ============================
# cd livekitt
# cd venv
# python3 main.py dev