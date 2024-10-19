const admin = require('firebase-admin');
const serviceAccount = require('/Users/zacharynickerson/Desktop/vokko/config/vokko-f8f6a-firebase-adminsdk-8f7lc-a5c3daf9b9.json');

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
    description: 'Confident, articulate, professional, warm',
    backgroundColor: '#4682B4', // Steel Blue
    voice: 'alloy',
    gender: 'female',
  },
  {
    id: '2',
    name: 'Marcus Stone',
    mainPhoto: 'assets/images/Avatar Male 9.png',
    bgPhoto: 'assets/images/bg-Avatar Male 9.png',
    description: 'Bold, friendly, encouraging',
    backgroundColor: '#204E39', // Lime Green
    voice: 'echo',
    gender: 'male',
  },
  {
    id: '3',
    name: 'Vanguarda',
    mainPhoto: 'assets/images/Avatar Female 13.png',
    bgPhoto: 'assets/images/bg-Avatar Female 13.png',
    description: 'Soothing, empathetic, gentle',
    backgroundColor: '#DDA0DD', // Plum
    voice: 'nova',
    gender: 'female',
  },
  {
    id: '4',
    name: 'Dr. Aiden Frost',
    mainPhoto: 'assets/images/Avatar Male 14.png',
    bgPhoto: 'assets/images/bg-Avatar Male 14.png',
    description: 'Analytical, calm, authoritative, precise',
    backgroundColor: '#4169E1', // Royal Blue
    voice: 'onyx',
    gender: 'male',
  },
  {
    id: '5',
    name: 'Zara Malik',
    mainPhoto: 'assets/images/Avatar Female 1.png',
    bgPhoto: 'assets/images/bg-Avatar Female 1.png',
    description: 'Vibrant, creative, inspiring',
    backgroundColor: '#FF69B4', // Hot Pink
    voice: 'shimmer',
    gender: 'female',
  },
  {
    id: '6',
    name: 'Guide Sama',
    mainPhoto: 'assets/images/Avatar Male 2.png',
    bgPhoto: 'assets/images/bg-Avatar Male 2.png',
    description: 'Grounded, wise, patient',
    backgroundColor: '#612125',
    voice: 'fable',
    gender: 'male',
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
