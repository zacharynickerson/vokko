import asyncio
import logging
import datetime
import time

from livekit.agents import AutoSubscribe, JobContext, WorkerOptions, cli, llm, tts, stt, tokenize
from livekit.agents.voice_assistant import VoiceAssistant
from livekit.plugins import deepgram, openai, silero

import os
from dotenv import load_dotenv
import firebase_admin
from firebase_admin import credentials, db
import colorlog

# Load environment variables
load_dotenv()

openai_api_key = os.getenv('OPENAI_API_KEY')
if not openai_api_key:
    raise ValueError("OPENAI_API_KEY is not set in the environment variables")

print(f"OpenAI API Key: {openai_api_key[:5]}...{openai_api_key[-5:]}")
print(f"OpenAI API Key length: {len(openai_api_key)}")

from openai import OpenAI
openai_client = OpenAI(api_key=openai_api_key)

# Print environment variables for debugging
print("Environment Variables:")
print(f"FIREBASE_CREDENTIALS_PATH: {os.getenv('FIREBASE_CREDENTIALS_PATH')}")
print(f"FIREBASE_DATABASE_URL: {os.getenv('FIREBASE_DATABASE_URL')}")

# ============================
# Initialize Firebase
# ============================
firebase_credentials_path = os.getenv('FIREBASE_CREDENTIALS_PATH')
if not firebase_credentials_path:
    raise ValueError("FIREBASE_CREDENTIALS_PATH is not set in the environment variables")

if not os.path.exists(firebase_credentials_path):
    raise FileNotFoundError(f"Firebase credentials file not found at {firebase_credentials_path}")

cred = credentials.Certificate(firebase_credentials_path)
firebase_admin.initialize_app(cred, {
    'databaseURL': os.getenv('FIREBASE_DATABASE_URL')
})

db = firebase_admin.db

# ============================
# Firebase Functions
# ============================
def get_module(module_id):
    return db.reference(f'modules/{module_id}').get()

def get_coach(coach_id):
    coach = db.reference(f'coaches/{coach_id}').get()
    if coach and 'voice' in coach:
        openai_voices = ['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer']
        coach['voice'] = coach['voice'] if coach['voice'] in openai_voices else 'alloy'
    return coach

def get_user(user_id):
    """
    Fetches the user data from Firebase Realtime Database.

    Args:
        user_id (str): The ID of the user.

    Returns:
        dict: The user's data if found, else None.
    """
    user = db.reference(f'users/{user_id}').get()
    return user

def save_conversation_to_firebase(conversation_entry, user_id, session_id):
    session_ref = db.reference(f'guidedSessions/{user_id}/{session_id}')
    session_ref.child('transcript').push(conversation_entry)  # Append to the existing transcript

def save_summary_to_firebase(summary, user_id, session_id):
    try:
        session_ref = db.reference(f'guidedSessions/{user_id}/{session_id}')
        session_ref.update({
            'summary': summary,
            'completed_at': {'.sv': 'timestamp'}
        })
        logger.info(f"Summary saved to Firebase: {summary}")
    except Exception as e:
        logger.error(f"Error saving summary to Firebase: {str(e)}")

def get_guide(guide_id):
    guide = db.reference(f'guides/{guide_id}').get()
    if guide:
        # Get voice from voice_attributes or set default
        voice_attributes = guide.get('voice_attributes', {})
        guide['voice'] = voice_attributes.get('base_voice', 'alloy')  # Default to 'alloy' if not specified
    return guide

def create_guided_session(user_id, guide_id, module_id):
    session_id = str(int(time.time() * 1000))  # Generate a unique session ID
    session_ref = db.reference(f'guidedSessions/{user_id}/{session_id}')
    session_ref.set({
        'createdDate': datetime.datetime.utcnow().isoformat(),
        'userId': user_id,
        'guideId': guide_id,
        'moduleId': module_id,
        'status': 'processing',
        'type': 'guided',  # Add the type attribute
    })
    return session_id  # Return the session_id for later use

def update_session_status(user_id, session_id, status):
    try:
        session_ref = db.reference(f'guidedSessions/{user_id}/{session_id}')
        session_ref.update({'status': status})
        logger.info(f"Session {session_id} status updated to {status}")
    except Exception as e:
        logger.error(f"Error updating session status: {str(e)}")

def initiate_processing(user_id, session_id):
    try:
        # You can trigger a Cloud Function here if needed
        # For example, write to a specific path that the Cloud Function listens to
        processing_ref = db.reference(f'guidedSessions/{user_id}/{session_id}/status')
        processing_ref.set('Processing')
        logger.info(f"Initiated processing for session {session_id}")
    except Exception as e:
        logger.error(f"Error initiating processing: {str(e)}")



# ============================
# Load Environment Variables
# ============================
livekit_url = os.getenv('LIVEKIT_URL')
livekit_api_key = os.getenv('LIVEKIT_API_KEY')
livekit_secret = os.getenv('LIVEKIT_API_SECRET')
deepgram_api_key = os.getenv('DEEPGRAM_API_KEY')

# ============================
# Logger Initialization
# ============================
handler = colorlog.StreamHandler()
handler.setFormatter(colorlog.ColoredFormatter(
    '%(log_color)s%(asctime)s - %(name)s - %(levelname)s - %(message)s',  # Corrected 'levellevel' to 'levelname'
    datefmt='%Y-%m-%d %H:%M:%S',
    log_colors={
        'DEBUG': 'cyan',
        'INFO': 'green',
        'WARNING': 'yellow',
        'ERROR': 'red',
        'CRITICAL': 'bold_red',
    }
))
logging.basicConfig(level=logging.INFO, handlers=[handler])
logger = logging.getLogger(__name__)


async def wait_for_user_input(assistant):
    response = ""
    response_received = asyncio.Event()

    def on_user_speech_committed(message):
        nonlocal response
        # Assuming the content is stored in a 'content' attribute
        # If it's different, replace 'content' with the correct attribute name
        response = message.content
        response_received.set()

    assistant.on("user_speech_committed", on_user_speech_committed)
    
    try:
        await response_received.wait()
    finally:
        assistant.off("user_speech_committed", on_user_speech_committed)

    return response

def create_session_prompt(guide, module):
    return {
        "role": "system",
        "content": f"""
You are {guide['name']}
You're leading a session on {module['name']}
At the end of session the user should walk away with {module['expected_outcome']}

Key Guidelines:
1. Don't just ask questions - share brief insights from your background when relevant
2. Help users explore their thoughts while keeping the session focused on {module['name']}

"""
    }

async def conduct_interactive_session(assistant, module, guide, user_id, session_id):

    # Fetch user data
    user = get_user(user_id)
    if not user or 'name' not in user:
        logger.error(f"User data not found for user_id: {user_id}")
        raise ValueError("User data not found")
    
    # Extract first name
    user_first_name = user['name'].split()[0]
    logger.info(f"User's first name: {user_first_name}")
    welcome_message = f"Hey {user_first_name}, Say ola"
    await assistant.say(welcome_message, allow_interruptions=False)

    # Wait for the user's response
    user_response = await wait_for_user_input(assistant)

    # Save the conversation entry
    conversation_entry = {
        'question': welcome_message,
        'answer': user_response,
        'questionNumber': '1'  # Simple question number
    }
    try:
        logger.info(f"Saving conversation entry for session_id: {session_id}")
        save_conversation_to_firebase(conversation_entry, user_id, session_id)
        logger.info(f"Conversation entry saved: {conversation_entry}")
    except Exception as e:
        logger.error(f"Error saving conversation to Firebase: {str(e)}")

    # Define summary, title, and transcript
    summary = "Summary pending"  # Replace with actual summary logic
    title = "Title pending"  # Replace with actual title logic
    transcript = [conversation_entry]  # Collecting the transcript entries

    # End the session
    goodbye_message = "Thank you for saying ola!"
    await assistant.say(goodbye_message, allow_interruptions=False)

    # After the session ends, update the existing session entry
    try:
        logger.info(f"Updating session entry for session_id: {session_id}")
        await db.reference(f'guidedSessions/{user_id}/{session_id}').update({
            'status': 'completed',
            'summary': summary,
            'title': title,
            'transcript': transcript,  # Assuming you have this data
        })
    except Exception as e:
        logger.error(f"Error updating session entry: {str(e)}")


# ============================
# Entrypoint for the Worker
# =================================
async def entrypoint(ctx: JobContext):
    logger.info(f"New session started with room name: {ctx.room.name}")

    # Extract IDs from the room name
    room_name_parts = ctx.room.name.split('_')
    if len(room_name_parts) != 4:
        logger.error(f"Invalid room name format: {ctx.room.name}")
        raise ValueError("Invalid room name format")
    
    # Use the same session_id that was generated in GuidedSessionCall
    user_id, module_id, guide_id, session_id = room_name_parts
    logger.info(f"Using frontend-generated session ID: {session_id}")

    # Retrieve module and guide data
    module = get_module(module_id)
    guide = get_guide(guide_id)

    if not module or not guide:
        logger.error(f"Invalid Module ID ({module_id}) or Guide ID ({guide_id})")
        raise ValueError("Invalid Module ID or Guide ID")

    # Create the initial chat context
    initial_ctx = llm.ChatContext().append(
        role="system",
        text=f"""You are {guide['name']}, a guide who helps people explore and develop their thoughts on {module['name']}.
    
        Your Essence:
        - You're here to help users discover their own insights about {module['name']}

        Core Approach:
        1. Listen more than you speak - let users do 80% of the talking
        2. Keep your responses brief and focused
        3. Ask questions that help users explore their thoughts more deeply
        4. Adapt to the user's energy and engagement level

        Remember: You're having a natural conversation. React to what the user says rather than following a script. Help them explore their thoughts about {module['name']} in whatever direction feels most valuable to them."""
    )
    
    # Create a new guided session
    # session_id = create_guided_session(user_id, guide_id, module_id)
    
    # Connect to LiveKit room
    await ctx.connect(auto_subscribe=AutoSubscribe.AUDIO_ONLY)

    # Create the VoiceAssistant with the guide's voice settings
    assistant = VoiceAssistant(
        vad=silero.VAD.load(),
        stt=deepgram.STT(api_key=deepgram_api_key),
        llm=openai.LLM(api_key=openai_api_key),
        tts=openai.TTS(
            voice=guide.get('voice', 'alloy'),  # Fallback to 'alloy' if voice not specified
            api_key=openai_api_key
        ),
        chat_ctx=initial_ctx,
    )

    # Start the voice assistant with the LiveKit room
    assistant.start(ctx.room)

    # Update session status using the same session_id
    db.reference(f'guidedSessions/{user_id}/{session_id}').update({
        'dateCreated': {'.sv': 'timestamp'},
        'moduleId': module_id,
        'moduleName': module['name'],
        'guideName': guide['name'],
        'guideId': guide_id,
        'status': 'recording'
    })

    # Start the interactive session with the same session_id
    await conduct_interactive_session(assistant, module, guide, user_id, session_id)


# ============================
# Main       
# ============================
if __name__ == "__main__":
    options = WorkerOptions(
        entrypoint_fnc=entrypoint,
    )
    cli.run_app(options)