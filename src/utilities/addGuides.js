const admin = require('firebase-admin');
const serviceAccount = require('../../config/vokko-f8f6a-firebase-adminsdk-8f7lc-a5c3daf9b9.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://vokko-f8f6a-default-rtdb.europe-west1.firebasedatabase.app'
});

const db = admin.database();

const guides = [
  {
    id: '1',
    name: 'Dr. Allison Hart',
    mainPhoto: 'assets/images/Avatar Female 6.png',
    bgPhoto: 'assets/images/bg-Avatar Female 6.png',
    personality: {
      tone: 'professional yet approachable',
      speaking_style: 'articulate and methodical',
      key_traits: ['analytical', 'encouraging', 'detail-oriented']
    },
    expertise: ['productivity', 'goal-setting', 'strategic planning'],
    voice_attributes: {
      base_voice: 'alloy',
      pace: 'measured',
      style: 'professional and warm'
    },
    conversation_techniques: [
      'active listening',
      'probing questions',
      'summarizing key points',
      'action step identification'
    ]
  }
];

async function addGuides() {
  const guidesRef = db.ref('guides');

  try {
    for (const guide of guides) {
      await guidesRef.child(guide.id).set(guide);
    }
    console.log('Guides added successfully');
  } catch (error) {
    console.error('Error adding guides:', error);
  }
}

addGuides().then(() => {
  admin.app().delete();
});
