from vercel import Vercel
import json
import firebase_admin
from firebase_admin import credentials, db
import os

# Get the current directory of the script
current_dir = os.path.dirname(os.path.abspath(__file__))

# Construct the relative path to the Firebase credentials
cred_path = os.path.join(current_dir, '..', '..', 'config', 'vokko-f8f6a-firebase-adminsdk-8f7lc-a5c3daf9b9.json')

# Initialize Firebase
cred = credentials.Certificate(cred_path)
firebase_admin.initialize_app(cred, {
    'databaseURL': 'https://vokko-f8f6a-default-rtdb.europe-west1.firebasedatabase.app'  # Update with your actual database URL
})

def handler(request):
    if request.method == 'POST':
        data = request.json
        voice_note_id = data.get('roomName')
        transcript = data.get('messages')

        if voice_note_id and transcript:
            # Save to Firebase logic
            try:
                # Create a reference to the conversations node
                ref = db.reference(f'voiceNoteDetails/{voice_note_id}')
                
                # Prepare the conversation data
                conversation_data = {
                    'transcript': transcript,
                    'summary': "",
                    'actionItems': "",
                }
                
                # Save the conversation data
                ref.set(conversation_data)
                
                return json.dumps({"status": "success", "message": "Conversation saved successfully"}), 200
            except Exception as e:
                return json.dumps({"status": "error", "message": str(e)}), 500
        else:
            return json.dumps({"status": "error", "message": "Invalid data"}), 400

    return json.dumps({"status": "error", "message": "Invalid request method"}), 405