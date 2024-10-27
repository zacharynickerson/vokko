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

const modules = [
  {
    id: '1',
    name: 'Daily Mission Planning',
    category: 'productivity',
    description: 'Strategic planning session to maximize your day',
    expertise_required: ['productivity', 'goal-setting'],
    session_approach: {
      style: 'strategic and action-oriented',
      framework: 'SMART goals methodology',
      depth: 'tactical with strategic overview'
    },
    base_questions: [
      "What's the one thing that would make today a success?",
      "What are your top 3 priorities for today?",
      "What potential obstacles might you face?"
    ],
    follow_up_prompts: {
      priority_deep_dive: [
        "Tell me more about why this is important",
        "How does this align with your bigger goals?",
        "What resources do you need to accomplish this?"
      ],
      obstacle_handling: [
        "What's your plan to overcome this?",
        "How have you handled similar challenges before?",
        "What support might you need?"
      ]
    },
    closing_framework: {
      type: 'action_plan',
      elements: ['key priorities', 'potential blockers', 'success metrics']
    }
  },
  {
    id: '2',
    name: 'Idea Exploration',
    category: 'creativity',
    description: 'Deep dive into new ideas and opportunities',
    expertise_required: ['creativity', 'innovation'],
    session_approach: {
      style: 'exploratory and imaginative',
      framework: 'Design Thinking principles',
      depth: 'conceptual with practical applications'
    },
    base_questions: [
      "What's the core idea you want to explore today?",
      "What inspired this idea?",
      "What impact do you hope this idea could have?"
    ],
    follow_up_prompts: {
      idea_development: [
        "How might this idea evolve or grow?",
        "What unique perspective does this bring?",
        "What would make this idea even better?"
      ],
      implementation: [
        "What would be your first step?",
        "What resources would you need?",
        "Who could help bring this to life?"
      ]
    },
    closing_framework: {
      type: 'idea_blueprint',
      elements: ['core concept', 'next steps', 'potential impact']
    }
  },
  {
    id: '3',
    name: 'Emotional Check-In',
    category: 'wellbeing',
    description: 'Mindful exploration of current emotional state',
    expertise_required: ['emotional_intelligence', 'mindfulness'],
    session_approach: {
      style: 'gentle and introspective',
      framework: 'Emotional Awareness Practice',
      depth: 'personal with practical insights'
    },
    base_questions: [
      "How are you feeling in this moment?",
      "What's contributing to these feelings?",
      "What would help you feel more balanced?"
    ],
    follow_up_prompts: {
      emotion_exploration: [
        "Where do you feel this in your body?",
        "When did you start feeling this way?",
        "What does this emotion need?"
      ],
      action_planning: [
        "What small step could you take now?",
        "What has helped in similar situations?",
        "Who or what could support you?"
      ]
    },
    closing_framework: {
      type: 'emotional_insight',
      elements: ['emotional awareness', 'triggers', 'coping strategies']
    }
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
