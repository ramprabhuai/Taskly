// Theme & Design Constants for TASKLY
export const COLORS = {
  primary: '#6C3AFF',
  primaryLight: '#8B6AFF',
  primaryDark: '#5025CC',
  accent: '#FF6B6B',
  accentLight: '#FF8A8A',
  success: '#00D68F',
  successLight: '#33E0A8',
  warning: '#FFB020',
  warningLight: '#FFC34D',
  error: '#FF4757',
  
  // Light theme
  light: {
    background: '#F5F3FF',
    surface: '#FFFFFF',
    surfaceElevated: '#FFFFFF',
    text: '#1A1A2E',
    textSecondary: '#6B7280',
    textTertiary: '#9CA3AF',
    border: '#E5E7EB',
    card: 'rgba(255,255,255,0.85)',
    glass: 'rgba(255,255,255,0.6)',
    tabBar: '#FFFFFF',
    notification: '#FFF5F5',
  },
  
  // Dark theme
  dark: {
    background: '#0F0A1F',
    surface: '#1A1530',
    surfaceElevated: '#251E40',
    text: '#FFFFFF',
    textSecondary: '#9CA3AF',
    textTertiary: '#6B7280',
    border: '#2D2550',
    card: 'rgba(37,30,64,0.85)',
    glass: 'rgba(37,30,64,0.6)',
    tabBar: '#1A1530',
    notification: '#251E40',
  }
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const RADIUS = {
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  full: 999,
};

export const SHADOWS = {
  sm: {
    shadowColor: '#6C3AFF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  md: {
    shadowColor: '#6C3AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 4,
  },
  lg: {
    shadowColor: '#6C3AFF',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 24,
    elevation: 8,
  },
};

export const MASCOTS = {
  owl: { emoji: '🦉', name: 'Wise Owl', tone: 'calm, encouraging professor' },
  frog: { emoji: '🐸', name: 'Hype Frog', tone: 'super energetic, fun words' },
  bot: { emoji: '🤖', name: 'Bot Buddy', tone: 'techy, data-driven' },
  star: { emoji: '🌟', name: 'Star Coach', tone: 'sports coach energy' },
};

export const AI_MODELS = {
  claude: { name: 'Claude', color: '#6C3AFF', icon: '🧠', description: 'Best for thinking & planning' },
  gpt4o: { name: 'GPT-4o', color: '#3B82F6', icon: '🤖', description: 'Best for writing & research' },
  gemini: { name: 'Gemini', color: '#00D68F', icon: '⚡', description: 'Best for search & real-time' },
};

export const PRIORITIES = {
  high: { label: 'High', color: '#FF4757', emoji: '🔴' },
  medium: { label: 'Medium', color: '#FFB020', emoji: '🟡' },
  low: { label: 'Low', color: '#00D68F', emoji: '🟢' },
};

export const CATEGORIES = [
  { id: 'school', label: 'School', emoji: '📚' },
  { id: 'work', label: 'Work', emoji: '💼' },
  { id: 'personal', label: 'Personal', emoji: '🏠' },
  { id: 'health', label: 'Health', emoji: '💪' },
  { id: 'creative', label: 'Creative', emoji: '🎨' },
  { id: 'chores', label: 'Chores', emoji: '🧹' },
  { id: 'social', label: 'Social', emoji: '👥' },
  { id: 'general', label: 'General', emoji: '📝' },
];
