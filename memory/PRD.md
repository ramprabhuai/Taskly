# TASKLY - Gamified AI-Powered Task Manager

## Product Overview
TASKLY is a gamified, AI-powered task manager mobile app built with Expo (React Native) and FastAPI. Designed for all ages including school kids, every task is a mini adventure with XP, streaks, and badges.

## Tech Stack
- **Frontend**: Expo (React Native) with TypeScript, Expo Router
- **Backend**: FastAPI (Python) with MongoDB (motor)
- **AI**: Emergent LLM Key powering Claude (default), GPT-4o, and Gemini via `emergentintegrations`
- **Auth**: JWT-based + Guest mode (Emergent Google Auth ready)
- **Database**: MongoDB

## P0 Features (Fully Implemented)
- [x] **Auth**: JWT login/register, Guest mode ("Continue as Guest")
- [x] **Onboarding**: 7-step flow (Welcome → Name → Purpose → Mascot → Notifications → First Task → Celebration)
- [x] **Dashboard**: Time-aware greeting, XP progress bar, streak counter, today's tasks, motivational quote, AI shortcut
- [x] **Task CRUD**: Create, read, update, delete tasks with emoji, priority, category, estimated time
- [x] **AI Auto-Suggest**: Types task title → AI suggests emoji, priority, estimated time, category (1s debounce)
- [x] **AI Task Breakdown**: One-click AI generates 3-6 subtasks with time estimates
- [x] **AI Assistant Chat**: Multi-model chat (Claude/GPT-4o/Gemini) with task context awareness
- [x] **AI Model Switcher**: Colored badge showing active model, dropdown to switch mid-conversation
- [x] **XP & Gamification**: XP awarded on task completion, level system, on-time bonus
- [x] **Streaks**: Daily streak tracking with flame icon, streak counter on dashboard
- [x] **Badges**: 9 achievement badges (First Steps, On Fire, Century Club, Task Master, etc.)
- [x] **In-app Notifications**: Duolingo-style notifications for task completion, badge unlocks, streak milestones
- [x] **Dark Mode**: Full dark mode with toggle in dashboard header
- [x] **Mascot System**: 4 mascots (Wise Owl, Hype Frog, Bot Buddy, Star Coach)
- [x] **5-Tab Navigation**: Dashboard, Tasks, + FAB, AI Assistant, Progress
- [x] **Settings**: Profile, mascot change, AI preference, dark mode, logout

## P1 Features (Planned)
- [ ] Focus Timer (Pomodoro + AI)
- [ ] Task Templates Library
- [ ] List/Board/Timeline view switcher
- [ ] Notification settings (Chill/Normal/Intense frequency)
- [ ] Weekly AI Planning Summary

## P2 Features (Planned)
- [ ] Accountability Buddy
- [ ] Voice input for tasks
- [ ] Leaderboard with friends
- [ ] Parent/Teacher view
- [ ] Time Capsule tasks

## API Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/register | Email/password registration |
| POST | /api/auth/login | Email/password login |
| POST | /api/auth/guest | Guest login |
| GET | /api/auth/me | Get current user |
| POST | /api/auth/google-session | Google OAuth session exchange |
| PUT | /api/user/profile | Update profile |
| PUT | /api/user/onboarding | Update onboarding fields |
| GET | /api/tasks | List tasks (filter: all/active/today/completed) |
| POST | /api/tasks | Create task |
| GET | /api/tasks/:id | Get task detail |
| PUT | /api/tasks/:id | Update task |
| DELETE | /api/tasks/:id | Delete task |
| PUT | /api/tasks/:id/subtask/:sid | Toggle subtask |
| POST | /api/ai/suggest | AI auto-suggest for task |
| POST | /api/ai/breakdown | AI task breakdown into subtasks |
| POST | /api/ai/chat | AI chat (multi-model) |
| GET | /api/ai/chat-history | Get chat history |
| GET | /api/dashboard | Dashboard data |
| GET | /api/gamification/stats | XP, streaks, badges, weekly activity |
| GET | /api/notifications | List notifications |
| PUT | /api/notifications/:id/read | Mark notification read |
| POST | /api/notifications/mark-all-read | Mark all read |
| GET | /api/notifications/unread-count | Unread count |

## Design System
- **Primary**: Deep Purple #6C3AFF
- **Accent**: Coral #FF6B6B
- **Success**: Mint #00D68F
- **Warning**: Amber #FFB020
- **Style**: Glassmorphism + Soft Neomorphism
- **Border Radius**: 20px on cards
- **Dark Mode**: Full support

## Business Enhancement Suggestion
**Freemium Model**: Offer free tier with 5 AI assists/day, premium ($4.99/mo) for unlimited AI, custom themes, and family sharing. The gamification hooks (streaks, XP) drive daily retention similar to Duolingo's 55% DAU/MAU ratio.
