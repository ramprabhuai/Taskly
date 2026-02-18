import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator, Modal, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../src/context/ThemeContext';
import { api } from '../src/utils/api';
import { COLORS, SPACING, RADIUS, SHADOWS, PRIORITIES, CATEGORIES } from '../src/utils/constants';
import { detectPersona, PERSONAS } from '../src/utils/personas';
import DateTimePicker from '@react-native-community/datetimepicker';

// ═══════════════════════════════════════════════════════════════════════════
// INTERACTIVE AI GUIDANCE SYSTEM - Persona-Specific Question Flows
// ═══════════════════════════════════════════════════════════════════════════

interface QuestionOption {
  id: string;
  label: string;
  icon: string;
}

interface Question {
  id: string;
  text: string;
  options: QuestionOption[];
}

interface SubtaskTemplate {
  title: string;
  time: number;
}

interface GuidanceFlow {
  questions: Question[];
  generateSubtasks: (answers: Record<string, string>) => SubtaskTemplate[];
  getTip: (answers: Record<string, string>) => string;
}

// ─── FITNESS COACH FLOW ─────────────────────────────────────────────────────
const FITNESS_FLOW: GuidanceFlow = {
  questions: [
    {
      id: 'workout_type',
      text: "What's your workout focus today?",
      options: [
        { id: 'weights', label: 'Weights', icon: '💪' },
        { id: 'cardio', label: 'Cardio', icon: '🏃' },
        { id: 'flexibility', label: 'Flexibility', icon: '🧘' },
        { id: 'both', label: 'Full Body', icon: '⚡' },
      ],
    },
    {
      id: 'fitness_level',
      text: "What's your fitness level?",
      options: [
        { id: 'beginner', label: 'Beginner', icon: '🌱' },
        { id: 'intermediate', label: 'Intermediate', icon: '💪' },
        { id: 'advanced', label: 'Advanced', icon: '🔥' },
      ],
    },
    {
      id: 'time_available',
      text: 'How much time do you have?',
      options: [
        { id: '15min', label: '15 min', icon: '⏱️' },
        { id: '30min', label: '30 min', icon: '⏰' },
        { id: '45min', label: '45 min', icon: '🕐' },
        { id: '60min', label: '60+ min', icon: '💯' },
      ],
    },
  ],
  generateSubtasks: (answers) => {
    const type = answers.workout_type || 'cardio';
    const level = answers.fitness_level || 'beginner';
    const time = answers.time_available || '30min';
    
    if (type === 'cardio') {
      if (time === '15min') {
        return [
          { title: '2-min warmup (light jogging)', time: 2 },
          { title: '10-min HIIT (30s sprint, 30s rest)', time: 10 },
          { title: '3-min cooldown walk', time: 3 },
        ];
      }
      return [
        { title: '5-min warmup (jogging in place)', time: 5 },
        { title: '20-min treadmill intervals (2min fast, 1min slow)', time: 20 },
        { title: '15-min cycling (moderate intensity)', time: 15 },
        { title: '10-min jump rope (30sec on, 30sec off)', time: 10 },
        { title: '5-min cooldown walk', time: 5 },
        { title: 'Stretch major muscle groups', time: 5 },
      ];
    }
    
    if (type === 'weights') {
      const reps = level === 'beginner' ? '8' : level === 'intermediate' ? '10' : '12';
      const sets = level === 'beginner' ? '2' : '3';
      return [
        { title: '5-min dynamic warmup', time: 5 },
        { title: `Squats - ${sets} sets of ${reps} reps`, time: 10 },
        { title: `Bench press - ${sets} sets of ${reps} reps`, time: 10 },
        { title: `Deadlifts - ${sets} sets of ${reps} reps`, time: 12 },
        { title: `Overhead press - ${sets} sets of ${reps} reps`, time: 8 },
        { title: 'Core work (planks, crunches)', time: 8 },
        { title: 'Cool down and stretch', time: 7 },
      ];
    }
    
    if (type === 'flexibility') {
      return [
        { title: '5-min gentle warmup', time: 5 },
        { title: 'Sun salutations (5 rounds)', time: 8 },
        { title: 'Hip opener stretches', time: 8 },
        { title: 'Hamstring and quad stretches', time: 8 },
        { title: 'Shoulder and back stretches', time: 8 },
        { title: '5-min relaxation (savasana)', time: 5 },
      ];
    }
    
    // Full body (both)
    return [
      { title: '5-min cardio warmup', time: 5 },
      { title: 'Circuit 1: Squats + Push-ups + Rows', time: 12 },
      { title: 'Circuit 2: Lunges + Shoulder press + Planks', time: 12 },
      { title: '10-min treadmill intervals', time: 10 },
      { title: 'Core finisher (3 exercises)', time: 8 },
      { title: 'Full body stretch', time: 8 },
    ];
  },
  getTip: (answers) => {
    const type = answers.workout_type;
    const level = answers.fitness_level;
    
    if (type === 'cardio') {
      return "💡 Start slow - build cardiovascular endurance gradually over 4-6 weeks. Listen to your body!";
    }
    if (type === 'weights') {
      if (level === 'beginner') {
        return "💡 Proper form > heavy weights. Start with lighter weights to master technique before adding weight.";
      }
      return "💡 Progressive overload is key. Increase weight by 5% when you can complete all sets with good form.";
    }
    if (type === 'flexibility') {
      return "💡 Never bounce in stretches. Hold each position for 20-30 seconds and breathe deeply.";
    }
    return "💡 Full body workouts are efficient! Rest 48 hours between sessions for muscle recovery.";
  },
};

// ─── FINANCIAL COACH FLOW ───────────────────────────────────────────────────
const FINANCIAL_FLOW: GuidanceFlow = {
  questions: [
    {
      id: 'goal_type',
      text: "What's this savings goal for?",
      options: [
        { id: 'vacation', label: 'Vacation', icon: '🏖️' },
        { id: 'car', label: 'Car', icon: '🚗' },
        { id: 'emergency', label: 'Emergency Fund', icon: '🏠' },
        { id: 'education', label: 'Education', icon: '📚' },
      ],
    },
    {
      id: 'timeline',
      text: 'When do you need it by?',
      options: [
        { id: '3months', label: '3 months', icon: '📅' },
        { id: '6months', label: '6 months', icon: '📆' },
        { id: '1year', label: '1 year', icon: '🗓️' },
        { id: '2years', label: '2+ years', icon: '⏳' },
      ],
    },
  ],
  generateSubtasks: (answers) => {
    const goal = answers.goal_type || 'vacation';
    const timeline = answers.timeline || '6months';
    
    const months = timeline === '3months' ? 3 : timeline === '6months' ? 6 : timeline === '1year' ? 12 : 24;
    
    return [
      { title: 'Review current monthly expenses', time: 30 },
      { title: 'Identify 3 expenses to reduce', time: 20 },
      { title: `Calculate weekly savings target`, time: 10 },
      { title: 'Set up automatic savings transfer', time: 15 },
      { title: 'Open high-yield savings account', time: 20 },
      { title: 'Track spending for 2 weeks', time: 15 },
      { title: 'Review progress monthly', time: 10 },
    ];
  },
  getTip: (answers) => {
    const timeline = answers.timeline;
    if (timeline === '3months') {
      return "💡 Short timeline = aggressive saving. Cut discretionary spending by 30% for 3 months.";
    }
    return "💡 Pay yourself first - transfer savings BEFORE spending on anything else each payday.";
  },
};

// ─── STUDY TUTOR FLOW ───────────────────────────────────────────────────────
const STUDY_FLOW: GuidanceFlow = {
  questions: [
    {
      id: 'exam_timeline',
      text: "When's the exam or deadline?",
      options: [
        { id: 'this_week', label: 'This week', icon: '🔥' },
        { id: 'next_week', label: 'Next week', icon: '📅' },
        { id: '2weeks', label: '2 weeks', icon: '📆' },
        { id: '1month', label: '1 month', icon: '🗓️' },
      ],
    },
    {
      id: 'material_amount',
      text: 'How much material to cover?',
      options: [
        { id: 'light', label: '1-3 chapters', icon: '📖' },
        { id: 'medium', label: '4-6 chapters', icon: '📚' },
        { id: 'heavy', label: '7-10 chapters', icon: '📚📚' },
        { id: 'massive', label: '10+ chapters', icon: '🏔️' },
      ],
    },
    {
      id: 'study_style',
      text: 'How do you learn best?',
      options: [
        { id: 'reading', label: 'Reading', icon: '📖' },
        { id: 'practice', label: 'Practice problems', icon: '✏️' },
        { id: 'visual', label: 'Visual/Videos', icon: '🎥' },
        { id: 'mixed', label: 'Mix of all', icon: '🎯' },
      ],
    },
  ],
  generateSubtasks: (answers) => {
    const timeline = answers.exam_timeline || '2weeks';
    const amount = answers.material_amount || 'medium';
    const style = answers.study_style || 'mixed';
    
    const chapters = amount === 'light' ? 3 : amount === 'medium' ? 5 : amount === 'heavy' ? 8 : 12;
    
    if (timeline === 'this_week') {
      return [
        { title: 'Quick review of all key concepts', time: 60 },
        { title: 'Focus on weak areas (identify top 3)', time: 30 },
        { title: 'Practice test #1', time: 45 },
        { title: 'Review mistakes and rework problems', time: 30 },
        { title: 'Practice test #2', time: 45 },
        { title: 'Final review of formulas/key points', time: 30 },
      ];
    }
    
    const tasks: SubtaskTemplate[] = [];
    for (let i = 1; i <= Math.min(chapters, 5); i++) {
      tasks.push({ title: `Chapter ${i} - Read and take notes`, time: 45 });
      if (style === 'practice' || style === 'mixed') {
        tasks.push({ title: `Chapter ${i} - Practice problems`, time: 30 });
      }
    }
    tasks.push({ title: 'Comprehensive review session', time: 60 });
    tasks.push({ title: 'Practice exam', time: 60 });
    
    return tasks.slice(0, 8);
  },
  getTip: (answers) => {
    const style = answers.study_style;
    const timeline = answers.exam_timeline;
    
    if (timeline === 'this_week') {
      return "💡 Crunch time! Focus on past exams and high-frequency topics. Sleep well before the test.";
    }
    if (style === 'practice') {
      return "💡 Active recall beats re-reading. Test yourself without notes after each chapter!";
    }
    return "💡 Use spaced repetition: Review Day 1, then Day 3, then Day 7. It's scientifically proven!";
  },
};

// ─── CAREER MENTOR FLOW ─────────────────────────────────────────────────────
const CAREER_FLOW: GuidanceFlow = {
  questions: [
    {
      id: 'goal_type',
      text: "What's your career goal?",
      options: [
        { id: 'new_job', label: 'Find new job', icon: '🔍' },
        { id: 'promotion', label: 'Get promoted', icon: '📈' },
        { id: 'skill', label: 'Learn new skill', icon: '🎯' },
        { id: 'network', label: 'Build network', icon: '🤝' },
      ],
    },
    {
      id: 'timeline',
      text: "What's your timeline?",
      options: [
        { id: 'urgent', label: 'ASAP', icon: '🔥' },
        { id: '1month', label: '1 month', icon: '📅' },
        { id: '3months', label: '3 months', icon: '📆' },
        { id: '6months', label: '6+ months', icon: '🗓️' },
      ],
    },
  ],
  generateSubtasks: (answers) => {
    const goal = answers.goal_type || 'new_job';
    
    if (goal === 'new_job') {
      return [
        { title: 'Update resume with recent achievements', time: 60 },
        { title: 'Optimize LinkedIn profile', time: 45 },
        { title: 'Research 10 target companies', time: 30 },
        { title: 'Apply to 5 positions', time: 45 },
        { title: 'Prepare STAR stories for interviews', time: 60 },
        { title: 'Practice mock interview', time: 30 },
      ];
    }
    if (goal === 'promotion') {
      return [
        { title: 'Document recent wins and impact', time: 30 },
        { title: 'Schedule 1:1 with manager', time: 15 },
        { title: 'Ask for specific feedback', time: 30 },
        { title: 'Identify skill gaps to address', time: 20 },
        { title: 'Take on a stretch project', time: 60 },
        { title: 'Build relationships with leadership', time: 30 },
      ];
    }
    if (goal === 'network') {
      return [
        { title: 'Connect with 5 people on LinkedIn', time: 20 },
        { title: 'Attend 1 industry event/webinar', time: 60 },
        { title: 'Schedule 2 coffee chats', time: 15 },
        { title: 'Join relevant online communities', time: 20 },
        { title: 'Share valuable content weekly', time: 30 },
      ];
    }
    // skill
    return [
      { title: 'Define specific skill to learn', time: 15 },
      { title: 'Find top 3 learning resources', time: 30 },
      { title: 'Block 1 hour daily for learning', time: 10 },
      { title: 'Build a practice project', time: 120 },
      { title: 'Get feedback from expert', time: 30 },
    ];
  },
  getTip: (answers) => {
    const goal = answers.goal_type;
    if (goal === 'new_job') {
      return "💡 Apply to jobs you're 70% qualified for. You'll learn the other 30% on the job!";
    }
    if (goal === 'promotion') {
      return "💡 Don't just work hard - make sure your work is visible to decision-makers.";
    }
    return "💡 Your network is your net worth. One genuine connection > 100 LinkedIn adds.";
  },
};

// ─── LIFE ORGANIZER FLOW ────────────────────────────────────────────────────
const LIFE_FLOW: GuidanceFlow = {
  questions: [
    {
      id: 'task_type',
      text: 'What kind of task is this?',
      options: [
        { id: 'cleaning', label: 'Cleaning', icon: '🧹' },
        { id: 'errands', label: 'Errands', icon: '🛒' },
        { id: 'organizing', label: 'Organizing', icon: '📦' },
        { id: 'maintenance', label: 'Home repair', icon: '🔧' },
      ],
    },
    {
      id: 'time_available',
      text: 'How much time do you have?',
      options: [
        { id: '15min', label: '15 min', icon: '⚡' },
        { id: '30min', label: '30 min', icon: '⏱️' },
        { id: '1hour', label: '1 hour', icon: '⏰' },
        { id: 'halfday', label: 'Half day', icon: '☀️' },
      ],
    },
  ],
  generateSubtasks: (answers) => {
    const type = answers.task_type || 'cleaning';
    const time = answers.time_available || '30min';
    
    if (type === 'cleaning') {
      if (time === '15min') {
        return [
          { title: 'Quick declutter - toss/put away 10 items', time: 5 },
          { title: 'Wipe down surfaces', time: 5 },
          { title: 'Take out trash', time: 3 },
          { title: 'Quick vacuum high-traffic area', time: 5 },
        ];
      }
      return [
        { title: 'Declutter and put things away', time: 10 },
        { title: 'Dust all surfaces', time: 10 },
        { title: 'Vacuum/sweep floors', time: 15 },
        { title: 'Mop hard floors', time: 10 },
        { title: 'Clean bathroom surfaces', time: 15 },
        { title: 'Take out all trash and recycling', time: 5 },
      ];
    }
    if (type === 'organizing') {
      return [
        { title: 'Empty the space completely', time: 15 },
        { title: 'Sort into: Keep, Donate, Trash', time: 20 },
        { title: 'Clean the empty space', time: 10 },
        { title: 'Group similar items together', time: 15 },
        { title: 'Add labels/containers as needed', time: 15 },
        { title: 'Put everything back organized', time: 15 },
      ];
    }
    return [
      { title: 'Make a list of what to buy/do', time: 10 },
      { title: 'Plan efficient route', time: 5 },
      { title: 'Gather bags, lists, payment', time: 5 },
      { title: 'Complete errands', time: 60 },
      { title: 'Put everything away at home', time: 15 },
    ];
  },
  getTip: (answers) => {
    const type = answers.task_type;
    if (type === 'cleaning') {
      return "💡 The 15-minute rule: Set a timer for 15 min and just start. You'll often keep going!";
    }
    if (type === 'organizing') {
      return "💡 Everything needs a home. If you can't assign it a spot, you probably don't need it.";
    }
    return "💡 Batch your errands! Group stops by location to save time and gas.";
  },
};

// ─── CREATIVE GUIDE FLOW ────────────────────────────────────────────────────
const CREATIVE_FLOW: GuidanceFlow = {
  questions: [
    {
      id: 'project_type',
      text: 'What type of creative project?',
      options: [
        { id: 'writing', label: 'Writing', icon: '✍️' },
        { id: 'visual', label: 'Visual Art', icon: '🎨' },
        { id: 'music', label: 'Music', icon: '🎵' },
        { id: 'video', label: 'Video/Photo', icon: '📹' },
      ],
    },
    {
      id: 'stage',
      text: 'Where are you in the process?',
      options: [
        { id: 'idea', label: 'Just an idea', icon: '💭' },
        { id: 'started', label: 'Already started', icon: '🚧' },
        { id: 'stuck', label: "Stuck/blocked", icon: '😫' },
        { id: 'finishing', label: 'Almost done', icon: '🏁' },
      ],
    },
  ],
  generateSubtasks: (answers) => {
    const type = answers.project_type || 'writing';
    const stage = answers.stage || 'idea';
    
    if (stage === 'idea') {
      return [
        { title: 'Free-write/sketch for 15 min (no judgment)', time: 15 },
        { title: 'Research inspiration and references', time: 30 },
        { title: 'Create rough outline/sketch', time: 20 },
        { title: 'Define the core message/feeling', time: 15 },
        { title: 'Set first draft deadline', time: 5 },
      ];
    }
    if (stage === 'stuck') {
      return [
        { title: 'Take a 20-min walk (no phone)', time: 20 },
        { title: 'Work on a different section', time: 30 },
        { title: 'Set a timer: 25 min work, 5 min break', time: 30 },
        { title: 'Share WIP with a friend for feedback', time: 15 },
        { title: 'Lower the bar: aim for "good enough"', time: 30 },
      ];
    }
    if (stage === 'finishing') {
      return [
        { title: 'Review and polish details', time: 30 },
        { title: 'Get feedback from 2 people', time: 15 },
        { title: 'Make final revisions', time: 45 },
        { title: 'Prepare for sharing/publishing', time: 20 },
        { title: 'Celebrate and share!', time: 10 },
      ];
    }
    return [
      { title: 'Review what you have so far', time: 15 },
      { title: 'Identify the next small step', time: 10 },
      { title: 'Work in 25-min focused blocks', time: 50 },
      { title: 'Take breaks between blocks', time: 10 },
      { title: 'Save and backup your work', time: 5 },
    ];
  },
  getTip: (answers) => {
    const stage = answers.stage;
    if (stage === 'idea') {
      return "💡 Ship over perfection. A finished imperfect piece beats an unfinished masterpiece.";
    }
    if (stage === 'stuck') {
      return "💡 Creative blocks are normal. Change your environment or work on a different part.";
    }
    return "💡 Daily practice beats occasional bursts. Even 15 minutes a day adds up!";
  },
};

// ─── WELLNESS COACH FLOW ────────────────────────────────────────────────────
const WELLNESS_FLOW: GuidanceFlow = {
  questions: [
    {
      id: 'goal_type',
      text: "What's your wellness focus?",
      options: [
        { id: 'sleep', label: 'Better sleep', icon: '😴' },
        { id: 'stress', label: 'Reduce stress', icon: '🧘' },
        { id: 'habit', label: 'Build habit', icon: '✨' },
        { id: 'mindfulness', label: 'Mindfulness', icon: '🌸' },
      ],
    },
    {
      id: 'current_state',
      text: 'How are you feeling today?',
      options: [
        { id: 'good', label: 'Pretty good', icon: '😊' },
        { id: 'okay', label: 'Okay', icon: '😐' },
        { id: 'stressed', label: 'Stressed', icon: '😰' },
        { id: 'tired', label: 'Exhausted', icon: '😩' },
      ],
    },
  ],
  generateSubtasks: (answers) => {
    const goal = answers.goal_type || 'mindfulness';
    const state = answers.current_state || 'okay';
    
    if (goal === 'sleep') {
      return [
        { title: 'Set consistent bedtime (same time daily)', time: 5 },
        { title: 'No screens 1 hour before bed', time: 5 },
        { title: 'Create relaxing pre-bed routine', time: 20 },
        { title: 'Make bedroom dark and cool', time: 10 },
        { title: '10-min relaxation before sleep', time: 10 },
      ];
    }
    if (goal === 'stress') {
      return [
        { title: '5-min deep breathing exercise', time: 5 },
        { title: 'Write down 3 worries (get them out)', time: 10 },
        { title: '15-min walk outside', time: 15 },
        { title: 'Talk to someone supportive', time: 15 },
        { title: 'Do one small thing that brings joy', time: 15 },
      ];
    }
    if (goal === 'habit') {
      return [
        { title: 'Define the habit clearly (tiny version)', time: 10 },
        { title: 'Attach to existing routine (habit stack)', time: 5 },
        { title: 'Prepare environment for success', time: 15 },
        { title: 'Do the habit for just 2 minutes', time: 2 },
        { title: 'Track and celebrate small wins', time: 5 },
      ];
    }
    return [
      { title: '3-min breathing exercise', time: 3 },
      { title: '5-min body scan meditation', time: 5 },
      { title: 'Write 3 things you\'re grateful for', time: 5 },
      { title: '10-min mindful walk', time: 10 },
      { title: 'End-of-day reflection (2 min)', time: 2 },
    ];
  },
  getTip: (answers) => {
    const goal = answers.goal_type;
    const state = answers.current_state;
    
    if (state === 'stressed' || state === 'tired') {
      return "💡 It's okay to not be okay. Start with just one tiny step. Self-compassion is key.";
    }
    if (goal === 'sleep') {
      return "💡 Consistency matters more than duration. Same bedtime every night trains your brain.";
    }
    if (goal === 'habit') {
      return "💡 Start smaller than you think. A 2-minute habit done daily beats 30 minutes done once.";
    }
    return "💡 Progress, not perfection. Every moment of mindfulness counts, even just one breath.";
  },
};

// ─── COOKING ASSISTANT FLOW ─────────────────────────────────────────────────
const COOKING_FLOW: GuidanceFlow = {
  questions: [
    {
      id: 'meal_type',
      text: 'What meal are you planning?',
      options: [
        { id: 'breakfast', label: 'Breakfast', icon: '🍳' },
        { id: 'lunch', label: 'Lunch', icon: '🥗' },
        { id: 'dinner', label: 'Dinner', icon: '🍽️' },
        { id: 'snack', label: 'Snack/Dessert', icon: '🍪' },
      ],
    },
    {
      id: 'time_available',
      text: 'How much time to cook?',
      options: [
        { id: 'quick', label: '15 min', icon: '⚡' },
        { id: 'medium', label: '30 min', icon: '⏱️' },
        { id: 'leisurely', label: '1 hour', icon: '⏰' },
        { id: 'project', label: '2+ hours', icon: '👨‍🍳' },
      ],
    },
  ],
  generateSubtasks: (answers) => {
    const meal = answers.meal_type || 'dinner';
    const time = answers.time_available || 'medium';
    
    return [
      { title: 'Check pantry - list missing ingredients', time: 10 },
      { title: 'Grocery shop (if needed)', time: 30 },
      { title: 'Mise en place - prep all ingredients', time: 15 },
      { title: 'Follow recipe / cook the meal', time: time === 'quick' ? 15 : time === 'medium' ? 30 : 60 },
      { title: 'Plate and serve', time: 5 },
      { title: 'Clean up kitchen', time: 15 },
    ];
  },
  getTip: (answers) => {
    const time = answers.time_available;
    if (time === 'quick') {
      return "💡 Prep on weekends! Pre-cut veggies and cooked grains make weeknight cooking a breeze.";
    }
    return "💡 Mise en place (everything in its place) - prep all ingredients before turning on the stove.";
  },
};

// Map persona ID to flow
const PERSONA_FLOWS: Record<string, GuidanceFlow> = {
  fitness: FITNESS_FLOW,
  financial: FINANCIAL_FLOW,
  study: STUDY_FLOW,
  career: CAREER_FLOW,
  life: LIFE_FLOW,
  creative: CREATIVE_FLOW,
  wellness: WELLNESS_FLOW,
  cooking: COOKING_FLOW,
};

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

// Date helpers
const getDateShortcut = (shortcut: string): Date => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  switch (shortcut) {
    case 'today': return today;
    case 'tomorrow': return new Date(today.getTime() + 24 * 60 * 60 * 1000);
    case 'this_weekend': {
      const daysUntilSaturday = (6 - today.getDay() + 7) % 7 || 7;
      return new Date(today.getTime() + daysUntilSaturday * 24 * 60 * 60 * 1000);
    }
    case 'next_week': return new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    default: return today;
  }
};

const formatDate = (date: Date | null): string => {
  if (!date) return '';
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
  const dateOnly = new Date(date);
  dateOnly.setHours(0, 0, 0, 0);
  
  if (dateOnly.getTime() === today.getTime()) return 'Today';
  if (dateOnly.getTime() === tomorrow.getTime()) return 'Tomorrow';
  
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${dayNames[date.getDay()]}, ${monthNames[date.getMonth()]} ${date.getDate()}`;
};

export default function AddTaskScreen() {
  const { isDark } = useTheme();
  const router = useRouter();
  const scrollRef = useRef<ScrollView>(null);
  
  // Task state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [emoji, setEmoji] = useState('📝');
  const [priority, setPriority] = useState('medium');
  const [category, setCategory] = useState('general');
  const [estimatedTime, setEstimatedTime] = useState(30);
  const [subtasks, setSubtasks] = useState<{ subtask_id: string; title: string; estimated_time: number; completed: boolean }[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Due Date state
  const [dueDate, setDueDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [tempDate, setTempDate] = useState(new Date());
  
  // AI Guidance state
  const [detectedPersonaId, setDetectedPersonaId] = useState<string | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [showSubtasks, setShowSubtasks] = useState(false);
  const [aiTip, setAiTip] = useState<string | null>(null);
  const [guidanceComplete, setGuidanceComplete] = useState(false);
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  
  // Detect persona when title changes
  useEffect(() => {
    if (title.trim().length >= 3) {
      const personaId = detectPersona(title);
      if (personaId !== detectedPersonaId) {
        setDetectedPersonaId(personaId);
        // Reset guidance state when persona changes
        setCurrentQuestionIndex(0);
        setAnswers({});
        setShowSubtasks(false);
        setAiTip(null);
        setGuidanceComplete(false);
        setSubtasks([]);
        // Animate in
        fadeAnim.setValue(0);
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }).start();
      }
    } else {
      setDetectedPersonaId(null);
      setCurrentQuestionIndex(0);
      setAnswers({});
      setShowSubtasks(false);
      setGuidanceComplete(false);
    }
  }, [title]);
  
  // Handle option selection
  const handleOptionSelect = (questionId: string, optionId: string) => {
    const newAnswers = { ...answers, [questionId]: optionId };
    setAnswers(newAnswers);
    
    const flow = detectedPersonaId ? PERSONA_FLOWS[detectedPersonaId] : null;
    if (!flow) return;
    
    // Move to next question or generate subtasks
    if (currentQuestionIndex < flow.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      // Scroll to show new question
      setTimeout(() => scrollRef.current?.scrollTo({ y: 200, animated: true }), 100);
    } else {
      // All questions answered - generate subtasks
      generateSubtasksFromAnswers(newAnswers);
    }
  };
  
  // Generate subtasks from answers
  const generateSubtasksFromAnswers = (finalAnswers: Record<string, string>) => {
    const flow = detectedPersonaId ? PERSONA_FLOWS[detectedPersonaId] : null;
    if (!flow) return;
    
    const templates = flow.generateSubtasks(finalAnswers);
    const newSubtasks = templates.map((t, i) => ({
      subtask_id: `st_${Date.now()}_${i}`,
      title: t.title,
      estimated_time: t.time,
      completed: false,
    }));
    
    setSubtasks(newSubtasks);
    setAiTip(flow.getTip(finalAnswers));
    setShowSubtasks(true);
    setGuidanceComplete(true);
    
    // Update emoji and category based on persona
    const persona = detectedPersonaId ? PERSONAS[detectedPersonaId] : null;
    if (persona) {
      setEmoji(persona.emoji);
      // Map persona to category
      const categoryMap: Record<string, string> = {
        fitness: 'health',
        financial: 'work',
        study: 'school',
        career: 'work',
        life: 'chores',
        creative: 'creative',
        wellness: 'personal',
        cooking: 'chores',
      };
      setCategory(categoryMap[detectedPersonaId!] || 'general');
    }
    
    // Calculate total estimated time
    const totalTime = newSubtasks.reduce((sum, st) => sum + st.estimated_time, 0);
    setEstimatedTime(totalTime);
    
    // Scroll to show subtasks
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  };
  
  // Skip guidance and use defaults
  const handleSkipGuidance = () => {
    const flow = detectedPersonaId ? PERSONA_FLOWS[detectedPersonaId] : null;
    if (!flow) return;
    
    // Generate with empty answers (smart defaults)
    generateSubtasksFromAnswers({});
  };
  
  // Save task
  const handleSave = async () => {
    if (!title.trim()) return;
    setLoading(true);
    try {
      await api.createTask({
        title,
        description,
        emoji,
        priority,
        category,
        estimated_time: estimatedTime,
        tags: [],
        subtasks: subtasks.map(s => ({ 
          subtask_id: s.subtask_id,
          title: s.title, 
          estimated_time: s.estimated_time, 
          completed: false 
        })),
        due_date: dueDate ? dueDate.toISOString() : null,
        reminder_time: null,
      });
      router.back();
    } catch (e) {
      console.log('Create task error:', e);
    } finally {
      setLoading(false);
    }
  };
  
  // Date picker handlers
  const onDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
      if (event.type === 'set' && selectedDate) {
        setDueDate(selectedDate);
      }
    } else {
      setTempDate(selectedDate || tempDate);
    }
  };
  
  const confirmDatePicker = () => {
    setDueDate(tempDate);
    setShowDatePicker(false);
  };
  
  const themeColors = isDark ? COLORS.dark : COLORS.light;
  const persona = detectedPersonaId ? PERSONAS[detectedPersonaId] : null;
  const flow = detectedPersonaId ? PERSONA_FLOWS[detectedPersonaId] : null;
  const currentQuestion = flow?.questions[currentQuestionIndex];

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: themeColors.background }]} testID="add-task-screen">
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
        <View style={styles.header}>
          <TouchableOpacity testID="close-add-task" onPress={() => router.back()} style={styles.closeBtn}>
            <Text style={[styles.closeText, { color: themeColors.textSecondary }]}>✕</Text>
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: themeColors.text }]}>New Task</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView 
          ref={scrollRef}
          contentContainerStyle={styles.scroll} 
          keyboardShouldPersistTaps="handled" 
          showsVerticalScrollIndicator={false}
        >
          {/* Title Input */}
          <View style={styles.titleRow}>
            <Text style={styles.emojiDisplay}>{emoji}</Text>
            <TextInput
              testID="task-title-input"
              style={[styles.titleInput, { color: themeColors.text }]}
              placeholder="What do you need to do?"
              placeholderTextColor={themeColors.textTertiary}
              value={title}
              onChangeText={setTitle}
              autoFocus
            />
          </View>

          {/* ═══════════════════════════════════════════════════════════════ */}
          {/* INTERACTIVE AI GUIDANCE SECTION */}
          {/* ═══════════════════════════════════════════════════════════════ */}
          
          {persona && !guidanceComplete && (
            <Animated.View style={[styles.guidanceSection, { opacity: fadeAnim }]}>
              {/* Persona Detection Card */}
              <View style={[styles.personaCard, { backgroundColor: persona.color + '15', borderColor: persona.color }]}>
                <View style={[styles.personaIconBig, { backgroundColor: persona.color + '25' }]}>
                  <Text style={styles.personaEmojiBig}>{persona.emoji}</Text>
                </View>
                <View style={styles.personaCardInfo}>
                  <Text style={[styles.personaCardName, { color: persona.color }]}>{persona.name}</Text>
                  <Text style={[styles.personaCardDesc, { color: themeColors.textSecondary }]}>
                    Let me help you plan this!
                  </Text>
                </View>
              </View>

              {/* Current Question */}
              {currentQuestion && (
                <View style={[styles.questionCard, { backgroundColor: themeColors.surface }]} testID="ai-question-card">
                  <Text style={[styles.questionText, { color: themeColors.text }]}>
                    {currentQuestion.text}
                  </Text>
                  <View style={styles.optionsGrid}>
                    {currentQuestion.options.map((option) => (
                      <TouchableOpacity
                        key={option.id}
                        testID={`option-${option.id}`}
                        style={[
                          styles.optionBtn,
                          { backgroundColor: persona.color + '10', borderColor: persona.color + '30' },
                          answers[currentQuestion.id] === option.id && { backgroundColor: persona.color, borderColor: persona.color }
                        ]}
                        onPress={() => handleOptionSelect(currentQuestion.id, option.id)}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.optionIcon}>{option.icon}</Text>
                        <Text style={[
                          styles.optionLabel,
                          { color: persona.color },
                          answers[currentQuestion.id] === option.id && { color: '#FFF' }
                        ]}>
                          {option.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  
                  {/* Skip button */}
                  <TouchableOpacity style={styles.skipBtn} onPress={handleSkipGuidance}>
                    <Text style={[styles.skipBtnText, { color: themeColors.textTertiary }]}>
                      Skip → Use smart defaults
                    </Text>
                  </TouchableOpacity>
                  
                  {/* Progress dots */}
                  {flow && flow.questions.length > 1 && (
                    <View style={styles.progressDots}>
                      {flow.questions.map((_, i) => (
                        <View 
                          key={i} 
                          style={[
                            styles.dot,
                            { backgroundColor: i <= currentQuestionIndex ? persona.color : themeColors.border }
                          ]} 
                        />
                      ))}
                    </View>
                  )}
                </View>
              )}
            </Animated.View>
          )}

          {/* ═══════════════════════════════════════════════════════════════ */}
          {/* GENERATED SUBTASKS & TIP */}
          {/* ═══════════════════════════════════════════════════════════════ */}
          
          {showSubtasks && subtasks.length > 0 && (
            <View style={styles.resultsSection}>
              {/* AI Tip Card */}
              {aiTip && (
                <View style={[styles.tipCard, { backgroundColor: (persona?.color || COLORS.primary) + '15' }]}>
                  <Text style={[styles.tipText, { color: persona?.color || COLORS.primary }]}>
                    {aiTip}
                  </Text>
                </View>
              )}
              
              {/* Generated Subtasks */}
              <View style={[styles.subtasksCard, { backgroundColor: themeColors.surface }]}>
                <View style={styles.subtasksHeader}>
                  <Text style={[styles.subtasksTitle, { color: themeColors.text }]}>
                    Your plan ({subtasks.length} steps)
                  </Text>
                  <Text style={[styles.subtasksTime, { color: persona?.color || COLORS.primary }]}>
                    ~{estimatedTime} min
                  </Text>
                </View>
                {subtasks.map((st, index) => (
                  <View key={st.subtask_id} style={styles.subtaskRow}>
                    <View style={[styles.subtaskNum, { backgroundColor: (persona?.color || COLORS.primary) + '20' }]}>
                      <Text style={[styles.subtaskNumText, { color: persona?.color || COLORS.primary }]}>
                        {index + 1}
                      </Text>
                    </View>
                    <Text style={[styles.subtaskText, { color: themeColors.text }]} numberOfLines={2}>
                      {st.title}
                    </Text>
                    <Text style={[styles.subtaskTimeText, { color: themeColors.textTertiary }]}>
                      {st.estimated_time}m
                    </Text>
                    <TouchableOpacity 
                      style={styles.removeSubtaskBtn}
                      onPress={() => setSubtasks(subtasks.filter((_, i) => i !== index))}
                    >
                      <Text style={styles.removeSubtaskText}>✕</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* ═══════════════════════════════════════════════════════════════ */}
          {/* DUE DATE SECTION */}
          {/* ═══════════════════════════════════════════════════════════════ */}
          
          <View style={[styles.dateSection, { backgroundColor: themeColors.surface }]}>
            <View style={styles.dateSectionHeader}>
              <Text style={styles.dateSectionIcon}>📅</Text>
              <Text style={[styles.dateSectionTitle, { color: themeColors.text }]}>Due Date</Text>
              {dueDate && (
                <TouchableOpacity onPress={() => setDueDate(null)} style={styles.clearBtn}>
                  <Text style={styles.clearBtnText}>✕</Text>
                </TouchableOpacity>
              )}
            </View>
            
            {dueDate ? (
              <TouchableOpacity 
                style={[styles.dateDisplay, { backgroundColor: COLORS.primary + '15', borderColor: COLORS.primary + '40' }]}
                onPress={() => { setTempDate(dueDate); setShowDatePicker(true); }}
              >
                <Text style={[styles.dateDisplayText, { color: COLORS.primary }]}>{formatDate(dueDate)}</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.dateShortcuts}>
                {[
                  { id: 'today', label: 'Today', color: '#FF6B6B' },
                  { id: 'tomorrow', label: 'Tomorrow', color: '#FFB020' },
                  { id: 'this_weekend', label: 'Weekend', color: COLORS.primary },
                  { id: 'next_week', label: 'Next Week', color: '#9CA3AF' },
                ].map((d) => (
                  <TouchableOpacity
                    key={d.id}
                    style={[styles.dateShortcutBtn, { backgroundColor: d.color + '15' }]}
                    onPress={() => setDueDate(getDateShortcut(d.id))}
                  >
                    <Text style={[styles.dateShortcutText, { color: d.color }]}>{d.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Priority */}
          <Text style={[styles.sectionLabel, { color: themeColors.text }]}>Priority</Text>
          <View style={styles.priorityRow}>
            {Object.entries(PRIORITIES).map(([key, p]) => (
              <TouchableOpacity
                key={key}
                style={[styles.priorityChip, priority === key && { backgroundColor: p.color + '20', borderColor: p.color }]}
                onPress={() => setPriority(key)}
              >
                <Text style={styles.priorityEmoji}>{p.emoji}</Text>
                <Text style={[styles.priorityLabel, priority === key && { color: p.color }]}>{p.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={{ height: 120 }} />
        </ScrollView>

        {/* Save Button */}
        <View style={[styles.footer, { backgroundColor: themeColors.background }]}>
          <TouchableOpacity
            testID="save-task-btn"
            style={[styles.saveBtn, (!title.trim() || loading) && styles.saveBtnDisabled]}
            onPress={handleSave}
            disabled={!title.trim() || loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.saveBtnText}>
                {subtasks.length > 0 ? `Create Task (${subtasks.length} steps) ✨` : 'Create Task ✨'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* Date Picker Modal (iOS) */}
      {Platform.OS === 'ios' ? (
        <Modal visible={showDatePicker} transparent animationType="slide">
          <View style={styles.pickerModal}>
            <View style={[styles.pickerContainer, { backgroundColor: themeColors.surface }]}>
              <View style={styles.pickerHeader}>
                <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                  <Text style={[styles.pickerCancel, { color: themeColors.textSecondary }]}>Cancel</Text>
                </TouchableOpacity>
                <Text style={[styles.pickerTitle, { color: themeColors.text }]}>Select Date</Text>
                <TouchableOpacity onPress={confirmDatePicker}>
                  <Text style={[styles.pickerDone, { color: COLORS.primary }]}>Done</Text>
                </TouchableOpacity>
              </View>
              <DateTimePicker
                value={tempDate}
                mode="date"
                display="spinner"
                onChange={onDateChange}
                minimumDate={new Date()}
                textColor={isDark ? '#FFFFFF' : '#000000'}
              />
            </View>
          </View>
        </Modal>
      ) : (
        showDatePicker && (
          <DateTimePicker
            value={tempDate}
            mode="date"
            display="default"
            onChange={onDateChange}
            minimumDate={new Date()}
          />
        )
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  flex: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm },
  closeBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  closeText: { fontSize: 22 },
  headerTitle: { fontSize: 18, fontWeight: '800' },
  scroll: { padding: SPACING.md },
  
  // Title input
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: SPACING.md },
  emojiDisplay: { fontSize: 36 },
  titleInput: { flex: 1, fontSize: 22, fontWeight: '700', paddingVertical: 8 },
  
  // Guidance Section
  guidanceSection: { marginBottom: SPACING.md },
  
  // Persona Card
  personaCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    borderWidth: 2,
    marginBottom: SPACING.md,
    gap: 12,
  },
  personaIconBig: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  personaEmojiBig: { fontSize: 26 },
  personaCardInfo: { flex: 1 },
  personaCardName: { fontSize: 17, fontWeight: '800' },
  personaCardDesc: { fontSize: 13, marginTop: 2 },
  
  // Question Card
  questionCard: {
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  questionText: { fontSize: 17, fontWeight: '700', marginBottom: SPACING.md, textAlign: 'center' },
  optionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center' },
  optionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    gap: 8,
    minWidth: '45%',
    justifyContent: 'center',
  },
  optionIcon: { fontSize: 20 },
  optionLabel: { fontSize: 15, fontWeight: '700' },
  skipBtn: { marginTop: SPACING.md, alignItems: 'center', paddingVertical: 8 },
  skipBtnText: { fontSize: 13, fontWeight: '600' },
  progressDots: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: SPACING.sm },
  dot: { width: 8, height: 8, borderRadius: 4 },
  
  // Results Section
  resultsSection: { marginBottom: SPACING.md },
  
  // Tip Card
  tipCard: {
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  tipText: { fontSize: 14, fontWeight: '600', lineHeight: 20 },
  
  // Subtasks Card
  subtasksCard: {
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  subtasksHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.sm },
  subtasksTitle: { fontSize: 16, fontWeight: '800' },
  subtasksTime: { fontSize: 14, fontWeight: '700' },
  subtaskRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, gap: 10 },
  subtaskNum: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  subtaskNumText: { fontSize: 13, fontWeight: '800' },
  subtaskText: { flex: 1, fontSize: 14, fontWeight: '600' },
  subtaskTimeText: { fontSize: 12, fontWeight: '600' },
  removeSubtaskBtn: { padding: 4 },
  removeSubtaskText: { fontSize: 14, color: '#FF4757' },
  
  // Date Section
  dateSection: {
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  dateSectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.sm, gap: 8 },
  dateSectionIcon: { fontSize: 20 },
  dateSectionTitle: { fontSize: 16, fontWeight: '800', flex: 1 },
  clearBtn: { width: 24, height: 24, borderRadius: 12, backgroundColor: 'rgba(255,71,87,0.15)', alignItems: 'center', justifyContent: 'center' },
  clearBtnText: { fontSize: 12, color: '#FF4757', fontWeight: '700' },
  dateShortcuts: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  dateShortcutBtn: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: RADIUS.md },
  dateShortcutText: { fontSize: 14, fontWeight: '700' },
  dateDisplay: { paddingHorizontal: 16, paddingVertical: 12, borderRadius: RADIUS.md, borderWidth: 1.5 },
  dateDisplayText: { fontSize: 18, fontWeight: '800' },
  
  // Priority
  sectionLabel: { fontSize: 15, fontWeight: '800', marginBottom: SPACING.sm, marginTop: SPACING.sm },
  priorityRow: { flexDirection: 'row', gap: 10, marginBottom: SPACING.sm },
  priorityChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 10, borderRadius: RADIUS.md, borderWidth: 1.5, borderColor: 'rgba(0,0,0,0.1)', gap: 6 },
  priorityEmoji: { fontSize: 14 },
  priorityLabel: { fontSize: 14, fontWeight: '700', color: '#666' },
  
  // Footer
  footer: { padding: SPACING.md, paddingBottom: SPACING.lg },
  saveBtn: { 
    backgroundColor: '#6C3AFF', 
    borderRadius: RADIUS.lg, 
    padding: SPACING.md + 2, 
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  saveBtnDisabled: { opacity: 0.5 },
  saveBtnText: { color: '#FFF', fontSize: 18, fontWeight: '800' },
  
  // Picker Modal
  pickerModal: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  pickerContainer: { borderTopLeftRadius: RADIUS.xl, borderTopRightRadius: RADIUS.xl, paddingBottom: 34 },
  pickerHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: SPACING.md, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.1)' },
  pickerTitle: { fontSize: 17, fontWeight: '700' },
  pickerCancel: { fontSize: 16, fontWeight: '600' },
  pickerDone: { fontSize: 16, fontWeight: '700' },
});
