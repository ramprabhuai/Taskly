// AI Specialist Personas for TASKLY

export interface Persona {
  id: string;
  name: string;
  emoji: string;
  color: string;
  colorLight: string;
  description: string;
  tone: string;
  keywords: string[];
  tipPrefix: string;
  actions: { label: string; icon: string }[];
}

export const PERSONAS: Record<string, Persona> = {
  financial: {
    id: 'financial',
    name: 'Financial Coach',
    emoji: '💰',
    color: '#10B981',
    colorLight: '#D1FAE5',
    description: 'Money, savings & budget goals',
    tone: 'Practical, encouraging, data-driven. Uses numbers and percentages.',
    keywords: ['save', 'money', 'budget', 'invest', 'salary', 'debt', 'income', 'expense', 'fund', 'financial', 'pay', 'cost', 'price', 'dollar', '$', 'bank'],
    tipPrefix: 'Coach tip',
    actions: [{ label: 'Log deposit', icon: '💵' }, { label: 'Ask coach', icon: '💬' }, { label: 'View plan', icon: '📊' }],
  },
  fitness: {
    id: 'fitness',
    name: 'Fitness Coach',
    emoji: '🏃',
    color: '#F59E0B',
    colorLight: '#FEF3C7',
    description: 'Exercise, health & sports goals',
    tone: 'Energetic, motivating, uses sports metaphors. Celebrates small wins.',
    keywords: ['run', 'exercise', 'workout', 'gym', 'fitness', 'weight', 'muscle', 'cardio', 'stretch', 'sports', 'training', 'marathon', 'walk', 'swim', 'yoga', 'lift', 'health', 'pushup', 'squat'],
    tipPrefix: 'Coach says',
    actions: [{ label: 'Log workout', icon: '🏋️' }, { label: 'Ask coach', icon: '💬' }, { label: 'Training plan', icon: '📋' }],
  },
  study: {
    id: 'study',
    name: 'Study Tutor',
    emoji: '🧠',
    color: '#6366F1',
    colorLight: '#E0E7FF',
    description: 'Learning, school & exam goals',
    tone: 'Patient, clear, explains concepts simply. Uses analogies.',
    keywords: ['study', 'exam', 'test', 'homework', 'class', 'learn', 'read', 'book', 'chapter', 'essay', 'school', 'university', 'grade', 'lecture', 'course', 'tutor', 'math', 'science', 'history', 'research', 'assignment'],
    tipPrefix: 'Tutor tip',
    actions: [{ label: 'Start study', icon: '📖' }, { label: 'Ask tutor', icon: '💬' }, { label: 'Flashcards', icon: '🃏' }],
  },
  career: {
    id: 'career',
    name: 'Career Mentor',
    emoji: '👔',
    color: '#3B82F6',
    colorLight: '#DBEAFE',
    description: 'Job, networking & skill goals',
    tone: 'Professional, strategic, focused on growth. Uses business language.',
    keywords: ['job', 'career', 'resume', 'interview', 'networking', 'skill', 'promotion', 'linkedin', 'portfolio', 'application', 'meeting', 'presentation', 'project', 'client', 'email', 'work', 'office', 'salary'],
    tipPrefix: 'Mentor tip',
    actions: [{ label: 'Track progress', icon: '📈' }, { label: 'Ask mentor', icon: '💬' }, { label: 'Resources', icon: '📚' }],
  },
  life: {
    id: 'life',
    name: 'Life Organizer',
    emoji: '🏠',
    color: '#8B5CF6',
    colorLight: '#EDE9FE',
    description: 'Chores, errands & personal tasks',
    tone: 'Friendly, practical, keeps things simple. Uses checklists.',
    keywords: ['clean', 'organize', 'grocery', 'laundry', 'cook', 'shopping', 'appointment', 'doctor', 'dentist', 'move', 'repair', 'call', 'return', 'pick up', 'errands', 'chores', 'house', 'home'],
    tipPrefix: 'Organizer tip',
    actions: [{ label: 'Checklist', icon: '✅' }, { label: 'Ask help', icon: '💬' }, { label: 'Schedule', icon: '📅' }],
  },
  creative: {
    id: 'creative',
    name: 'Creative Guide',
    emoji: '🎨',
    color: '#EC4899',
    colorLight: '#FCE7F3',
    description: 'Art, writing & creative projects',
    tone: 'Inspiring, imaginative, thinks outside the box. Encourages experimentation.',
    keywords: ['write', 'draw', 'design', 'create', 'art', 'music', 'paint', 'photo', 'video', 'blog', 'podcast', 'creative', 'story', 'novel', 'film', 'animate', 'compose', 'craft'],
    tipPrefix: 'Creative spark',
    actions: [{ label: 'Brainstorm', icon: '💡' }, { label: 'Ask guide', icon: '💬' }, { label: 'Inspiration', icon: '✨' }],
  },
  wellness: {
    id: 'wellness',
    name: 'Wellness Coach',
    emoji: '🧘',
    color: '#14B8A6',
    colorLight: '#CCFBF1',
    description: 'Mental health, habits & self-care',
    tone: 'Calm, empathetic, non-judgmental. Focuses on progress over perfection.',
    keywords: ['meditate', 'sleep', 'relax', 'mindful', 'therapy', 'habit', 'self-care', 'stress', 'anxiety', 'journal', 'breathe', 'mental', 'wellness', 'gratitude', 'morning routine', 'break'],
    tipPrefix: 'Wellness reminder',
    actions: [{ label: 'Log mood', icon: '🌈' }, { label: 'Ask coach', icon: '💬' }, { label: 'Breathe', icon: '🫧' }],
  },
  cooking: {
    id: 'cooking',
    name: 'Cooking Assistant',
    emoji: '🍳',
    color: '#EF4444',
    colorLight: '#FEE2E2',
    description: 'Meal prep, recipes & nutrition',
    tone: 'Warm, enthusiastic about food, practical. Gives clear step-by-step instructions.',
    keywords: ['cook', 'recipe', 'meal', 'food', 'bake', 'dinner', 'lunch', 'breakfast', 'prep', 'ingredient', 'kitchen', 'nutrition', 'diet', 'eat', 'grocery', 'restaurant'],
    tipPrefix: 'Chef tip',
    actions: [{ label: 'View recipe', icon: '📖' }, { label: 'Ask chef', icon: '💬' }, { label: 'Shopping list', icon: '🛒' }],
  },
};

export const PERSONA_LIST = Object.values(PERSONAS);

export function detectPersona(title: string): string {
  const lower = title.toLowerCase();
  let bestMatch = 'life';
  let bestScore = 0;

  for (const [id, persona] of Object.entries(PERSONAS)) {
    let score = 0;
    for (const keyword of persona.keywords) {
      if (lower.includes(keyword)) {
        score += keyword.length; // Longer keywords = more specific
      }
    }
    if (score > bestScore) {
      bestScore = score;
      bestMatch = id;
    }
  }

  return bestMatch;
}
