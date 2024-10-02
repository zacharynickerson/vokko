import asyncio
import logging

from livekit.agents import AutoSubscribe, JobContext, WorkerOptions, cli, llm, tts, stt, tokenize
from livekit.agents.voice_assistant import VoiceAssistant
from livekit.plugins import deepgram, openai, silero

import os
from dotenv import load_dotenv
import firebase_admin
from firebase_admin import credentials, firestore, db
import colorlog

# ============================
# Initialize Firebase
# ============================
cred = credentials.Certificate("/Users/zacharynickerson/Desktop/vokko/config/vokko-f8f6a-firebase-adminsdk-8f7lc-a5c3daf9b9.json")
firebase_admin.initialize_app(cred, {
    'databaseURL': 'https://vokko-f8f6a-default-rtdb.europe-west1.firebasedatabase.app'
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
        session_ref = db.reference(f'guidedSessions/{user_id}/{session_id}/conversation/q{question_index + 1}')
        session_ref.set(conversation_entry)
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

async def conduct_interactive_session(assistant, module, user_id, session_id):
    conversation_messages = []

    for idx, question in enumerate(module['questions']):
        await assistant.say(question, allow_interruptions=True)
        conversation_messages.append(("AI", question))

        logger.info("Waiting for user response...")
        response = await wait_for_user_input(assistant)
        
        print(f"User: {response}")
        logger.info(f"User: {response}")
        conversation_messages.append(("User", response))
        
        conversation_entry = {
            'question': question,
            'answer': response,
        }

        conversation_messages.append(conversation_entry)
        logger.info("Saving conversation to Firebase")

        save_conversation_to_firebase(conversation_entry, user_id, session_id, idx)



# =================================
# Entrypoint for the Worker
# =================================
async def entrypoint(ctx: JobContext):
    logger.info(f"New session started with room name: {ctx.room.name}")

    # Extract module_id and coach_id from the room name
    room_name_parts = ctx.room.name.split('_')
    if len(room_name_parts) != 4:
        logger.error(f"Invalid room name format: {ctx.room.name}")
        raise ValueError("Invalid room name format")
    
    user_id, module_id, coach_id, session_id = room_name_parts

    module = get_module(module_id)
    coach = get_coach(coach_id)

    if not module or not coach:
        logger.error(f"Invalid Module ID ({module_id}) or Coach ID ({coach_id})")
        raise ValueError("Invalid Module ID or Coach ID")

    initial_ctx = llm.ChatContext().append(
        role="system",
        text=(
            f"You are a therapist named {coach['name']}. "
            f"Your role is to guide users through the '{module['name']}' module. "
            # "Approach each conversation with empathy, wisdom, and a focus on helping the user achieve their goals. "
            "Ask one question at a time, listen to the response, and provide very short but supportive feedback before moving to the next question. "
            # "if there are no more questions, end the session by saying COWABUNGA!"
            # "End the session by reviewing the main takeaways and next steps."
        ),
    )

    # Connect to the LiveKit room
    await ctx.connect(auto_subscribe=AutoSubscribe.AUDIO_ONLY)

    # VoiceAssistant is a class that creates a full conversational AI agent.
    assistant = VoiceAssistant(
        vad=silero.VAD.load(),
        stt=deepgram.STT(),
        llm=openai.LLM(),
        tts=openai.TTS(voice=coach['voice']),
        chat_ctx=initial_ctx,
    )

    # Start the voice assistant with the LiveKit room
    assistant.start(ctx.room)

    # logger.info(f"Starting the {module['name']} session with {coach['name']}.")
    welcome_message = f"Welcome to your {module['name']} session. I'm {coach['name']}, and I'll be your guide today."
    await assistant.say(welcome_message, allow_interruptions=True)

    await conduct_interactive_session(assistant, module, user_id, session_id)
    goodbye_message = f"Great job doing today's {module['name']} session!"

    # Wrap up the session
    await assistant.say(goodbye_message, allow_interruptions=False)


# ============================
# Main       
# ============================
if __name__ == "__main__":
    cli.run_app(WorkerOptions(entrypoint_fnc=entrypoint))