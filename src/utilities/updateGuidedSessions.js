const admin = require('firebase-admin');
const serviceAccount = require('/Users/zacharynickerson/Desktop/vokko/config/vokko-f8f6a-firebase-adminsdk-8f7lc-a5c3daf9b9.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://vokko-f8f6a-default-rtdb.europe-west1.firebasedatabase.app'
});


const db = admin.database();

async function updateGuidedSessions() {
  const usersRef = db.ref('guidedSessions');
  
  // Fetch all users
  const usersSnapshot = await usersRef.once('value');
  const usersData = usersSnapshot.val();

  if (!usersData) {
    console.log('No guided sessions found.');
    return;
  }

  // Iterate over each user's guided sessions
  for (const userId in usersData) {
    const sessionsRef = db.ref(`guidedSessions/${userId}`);
    const sessionsSnapshot = await sessionsRef.once('value');
    const sessionsData = sessionsSnapshot.val();

    if (sessionsData) {
      for (const sessionId in sessionsData) {
        const sessionRef = db.ref(`guidedSessions/${userId}/${sessionId}`);
        
        // Update the session to include the type attribute
        await sessionRef.update({ type: 'guided' });
        console.log(`Updated session ${sessionId} for user ${userId} with type 'guided'.`);
      }
    }
  }

  console.log('All guided sessions updated.');
}

updateGuidedSessions().catch(error => {
  console.error('Error updating guided sessions:', error);
});
