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
from firebase_admin import credentials, firestore, db
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

def save_conversation_to_firebase(conversation_entry, user_id, session_id, question_index):
    try:
        # Update the path to save conversation within the session object
        session_ref = db.reference(f'guidedSessions/{user_id}/{session_id}')
        
        # Update the conversation field using update() to maintain other session data
        session_ref.update({
            f'conversation/q{question_index + 1}': conversation_entry
        })
        
        logger.info(f"Conversation entry saved to Firebase: {conversation_entry}")
    except Exception as e:
        logger.error(f"Error saving conversation to Firebase: {str(e)}")

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
    try:
        # Create a new session with all attributes including empty conversation
        session_data = {
            'userId': user_id,
            'guideId': guide_id,
            'moduleId': module_id,
            'createdDate': datetime.datetime.now().isoformat(),
            'status': 'processing',
            'conversation': {},  # Initialize empty conversation object
            'sessionId': str(int(time.time() * 1000))  # Unix timestamp as session ID
        }
        
        # Save the complete session object
        session_ref = db.reference(f'guidedSessions/{user_id}/{session_data["sessionId"]}')
        session_ref.set(session_data)
        
        return session_data['sessionId']
    except Exception as e:
        logger.error(f"Error creating guided session: {str(e)}")
        raise



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
You are {guide['name']}, embodying these key characteristics:
- Speaking style: {guide['personality']['speaking_style']}
- Tone: {guide['personality']['tone']}
- Expertise: {', '.join(guide['expertise'])}

You're leading a session on {module['name']} using your unique approach:
- Session style: {module['session_approach']['style']}
- Framework: {module['session_approach']['framework']}

Key Guidelines:
1. Stay in character consistently, using your defined speaking style and tone
2. Use the base questions as a framework, but:
   - Adapt follow-up questions based on user responses
   - Dive deeper when users show interest or need clarity
   - Use your expertise to guide users toward insights
3. Don't just ask questions - share brief insights from your background when relevant
4. Help users explore their thoughts while keeping the session focused on {module['name']}

Remember: You're not just asking questions - you're guiding a discovery process using your unique personality and expertise in {module['session_approach']['framework']}.
"""
    }

async def conduct_interactive_session(assistant, module, guide, user_id, session_id):
    base_questions = module.get('base_questions', [])
    follow_up_prompts = module.get('follow_up_prompts', {})
    
    # Simple welcome, then pause
    welcome_message = f"Welcome. Let's begin."
    await assistant.say(welcome_message, allow_interruptions=False)
    await asyncio.sleep(1)  # Brief pause before first question
    
    for idx, question in enumerate(base_questions):
        # Ask one question clearly and wait
        await assistant.say(question, allow_interruptions=False)
        
        # Wait for complete user response
        response = await wait_for_user_input(assistant)
        
        # Save the response
        conversation_entry = {
            'question': question,
            'answer': response,
            'questionNumber': idx + 1
        }
        save_conversation_to_firebase(conversation_entry, user_id, session_id, idx)
        
        # Brief acknowledgment or follow-up if needed
        if needs_deeper_exploration(response):
            # Wait a moment before follow-up to avoid interrupting
            await asyncio.sleep(1)
            follow_up = select_focused_follow_up(response)
            if follow_up:
                await assistant.say(follow_up, allow_interruptions=False)
                follow_up_response = await wait_for_user_input(assistant)
                
                # Save follow-up response
                follow_up_entry = {
                    'question': follow_up,
                    'answer': follow_up_response,
                    'questionNumber': f"{idx + 1}.1"
                }
                save_conversation_to_firebase(follow_up_entry, user_id, session_id, f"{idx}_followup")
        
        # Add a pause between questions
        if idx < len(base_questions) - 1:
            await asyncio.sleep(1.5)

def select_focused_follow_up(response):
    # Simplified to return a single reflective prompt
    return "Can you tell me more about that?"

def needs_deeper_exploration(response):
    # Simplified logic for when to ask follow-up
    words = response.split()
    return len(words) < 10  # Only follow up on very brief responses

# =================================
# Entrypoint for the Worker
# =================================
async def entrypoint(ctx: JobContext):
    logger.info(f"New session started with room name: {ctx.room.name}")

    # Extract module_id and guide_id from the room name
    room_name_parts = ctx.room.name.split('_')
    if len(room_name_parts) != 4:
        logger.error(f"Invalid room name format: {ctx.room.name}")
        raise ValueError("Invalid room name format")
    
    user_id, module_id, guide_id, session_id = room_name_parts
    logger.info(f"Extracted IDs - User: {user_id}, Module: {module_id}, Guide: {guide_id}, Session: {session_id}")

    module = get_module(module_id)
    guide = get_guide(guide_id)

    logger.info(f"Retrieved module: {module}")
    logger.info(f"Retrieved guide: {guide}")

    if not module or not guide:
        logger.error(f"Invalid Module ID ({module_id}) or Guide ID ({guide_id})")
        raise ValueError("Invalid Module ID or Guide ID")

    # Update the system prompt to emphasize minimal, focused guidance
    initial_ctx = llm.ChatContext().append(
        role="system",
        text=(
            f"You are {guide['name']}, a guide who primarily listens and facilitates self-discovery. "
            f"Key characteristics:\n"
            f"- Speaking style: {guide['personality']['speaking_style']}\n"
            f"- Tone: {guide['personality']['tone']}\n"
            f"- Key traits: {', '.join(guide['personality']['key_traits'])}\n\n"
            f"Session Guidelines:\n"
            "1. Let the user do 80-90% of the talking\n"
            "2. Keep your responses brief and focused (1-2 sentences)\n"
            "3. Only interject to:\n"
            "   - Ask the next question\n"
            "   - Help user dig deeper into their idea\n"
            "   - Guide them back to their goal if they drift\n"
            "   - Acknowledge and build upon their insights\n"
            "4. Avoid explaining concepts or giving lectures\n"
            "5. Use questions to help users discover their own answers\n\n"
            f"You're facilitating a session on {module['name']}. "
            "Remember: your role is to listen and guide, not to teach or dominate the conversation."
        ),
    )

    # Connect to the LiveKit room
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

    # logger.info(f"Starting the {module['name']} session with {guide['name']}.")
    welcome_message = f"Welcome to your {module['name']} session. Let's begin with your first thought:"
    await assistant.say(welcome_message, allow_interruptions=True)

    await conduct_interactive_session(assistant, module, guide, user_id, session_id)
    goodbye_message = f"Great job doing today's {module['name']} session!"

    # Wrap up the session
    await assistant.say(goodbye_message, allow_interruptions=False)


# ============================
# Main       
# ============================
if __name__ == "__main__":
    options = WorkerOptions(
        entrypoint_fnc=entrypoint,
    )
    cli.run_app(options)



# Reference to the 'modules' node in the database
# ref = db.reference('modules')

# Auto-generate a new module with push() - this will create a unique key
# new_module_ref = ref.push()

# Set the new module data for "Zane, the Focused Achiever"
# new_module_ref.set({
#     'coachId': '-O83wlfCWno8uScxMm5C',
#     'description': 'A compassionate guide for exploring emotions and fostering healing',
#     'name': 'Emotional Healing and Self-Reflection',
#     'questions': [
#         'What emotions are you feeling right now, and why do you think that is?',
#         'What do you wish you could change about this experience?',
#         'What’s something you’ve been holding onto that you need to let go of?'
#         'What’s one thing you can do to nurture yourself during this time?'
#     ]
# })






