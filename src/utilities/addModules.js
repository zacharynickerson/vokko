const admin = require('firebase-admin');
const serviceAccount = require('/Users/zacharynickerson/Desktop/vokko/config/vokko-f8f6a-firebase-adminsdk-8f7lc-a5c3daf9b9.json');

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: 'https://vokko-f8f6a-default-rtdb.europe-west1.firebasedatabase.app'
  });
}

const db = admin.database();

// Complete list of modules
const modules = [
  {
    id: '1',
    name: 'Daily Planning',
    category: 'productivity',
    description: 'Strategic planning session to maximize your day',
    expected_outcome: 'A clear, prioritized plan for the day with key actions identified',
    session_approach: {
      style: 'strategic and action-oriented',
      framework: 'SMART goals methodology'
    },
    key_areas: [
      'priorities',
      'potential obstacles',
      'resource needs',
      'success metrics'
    ],
    context_needed: [
      'current goals',
      'energy levels',
      'upcoming commitments'
    ]
  }
];


async function addModules() {
  const modulesRef = db.ref('modules');

  try {
    for (const module of modules) {
      await modulesRef.child(module.id).set(module);
      console.log(`Added module: ${module.name}`);
    }
    console.log('All modules added successfully');
  } catch (error) {
    console.error('Error adding modules:', error);
  } finally {
    admin.app().delete();
  }
}

addModules();
