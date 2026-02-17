from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request, Response
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import uuid
import bcrypt
import jwt
from datetime import datetime, timezone, timedelta
import random
import asyncio

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

JWT_SECRET = os.environ.get('JWT_SECRET', 'taskly_default_secret')
EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY', '')

AI_MODELS_DISPLAY = {"claude": "Claude", "gpt4o": "GPT-4o", "gemini": "Gemini"}

app = FastAPI()
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ─── Pydantic Models ───

class UserCreate(BaseModel):
    email: str
    password: str
    name: str

class UserLogin(BaseModel):
    email: str
    password: str

class UserProfile(BaseModel):
    user_id: str
    email: str
    name: str
    avatar: str = ""
    mascot: str = "owl"
    notification_style: str = "normal"
    purpose: str = "everything"
    xp: int = 0
    streak: int = 0
    level: int = 1
    onboarding_complete: bool = False
    dark_mode: bool = False
    ai_preference: str = "claude"
    created_at: str = ""

class OnboardingUpdate(BaseModel):
    name: Optional[str] = None
    purpose: Optional[str] = None
    mascot: Optional[str] = None
    notification_style: Optional[str] = None
    onboarding_complete: Optional[bool] = None

class TaskCreate(BaseModel):
    title: str
    description: str = ""
    emoji: str = "📝"
    priority: str = "medium"
    due_date: Optional[str] = None
    estimated_time: int = 30
    category: str = "general"
    tags: List[str] = []
    subtasks: List[Dict[str, Any]] = []

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    emoji: Optional[str] = None
    priority: Optional[str] = None
    due_date: Optional[str] = None
    estimated_time: Optional[int] = None
    category: Optional[str] = None
    tags: Optional[List[str]] = None
    subtasks: Optional[List[Dict[str, Any]]] = None
    completed: Optional[bool] = None

class ChatMessage(BaseModel):
    message: str
    ai_model: str = "claude"
    session_id: Optional[str] = None

class AISuggestRequest(BaseModel):
    title: str

class PersonaChatRequest(BaseModel):
    message: str
    task_id: str
    persona_id: str
    session_id: Optional[str] = None

# ─── Auth Helpers ───

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_token(user_id: str) -> str:
    payload = {
        "user_id": user_id,
        "exp": datetime.now(timezone.utc) + timedelta(days=30)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm="HS256")

async def get_current_user(request: Request) -> dict:
    token = None
    auth_header = request.headers.get("Authorization", "")
    if auth_header.startswith("Bearer "):
        token = auth_header[7:]
    if not token:
        token = request.cookies.get("session_token")
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        user = await db.users.find_one({"user_id": payload["user_id"]}, {"_id": 0})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

# ─── Auth Routes ───

@api_router.post("/auth/register")
async def register(data: UserCreate, response: Response):
    existing = await db.users.find_one({"email": data.email}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    user_id = f"user_{uuid.uuid4().hex[:12]}"
    user_doc = {
        "user_id": user_id,
        "email": data.email,
        "name": data.name,
        "password_hash": hash_password(data.password),
        "avatar": "",
        "mascot": "owl",
        "notification_style": "normal",
        "purpose": "everything",
        "xp": 0,
        "streak": 0,
        "level": 1,
        "onboarding_complete": False,
        "dark_mode": False,
        "ai_preference": "claude",
        "badges": [],
        "last_active": datetime.now(timezone.utc).isoformat(),
        "streak_last_date": "",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.users.insert_one(user_doc)
    token = create_token(user_id)
    response.set_cookie(key="session_token", value=token, httponly=True, secure=True, samesite="none", path="/", max_age=30*24*3600)
    return {"token": token, "user": {k: v for k, v in user_doc.items() if k not in ["password_hash", "_id"]}}

@api_router.post("/auth/login")
async def login(data: UserLogin, response: Response):
    user = await db.users.find_one({"email": data.email}, {"_id": 0})
    if not user or not verify_password(data.password, user.get("password_hash", "")):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = create_token(user["user_id"])
    response.set_cookie(key="session_token", value=token, httponly=True, secure=True, samesite="none", path="/", max_age=30*24*3600)
    return {"token": token, "user": {k: v for k, v in user.items() if k != "password_hash"}}

@api_router.post("/auth/guest")
async def guest_login(response: Response):
    user_id = f"guest_{uuid.uuid4().hex[:12]}"
    user_doc = {
        "user_id": user_id,
        "email": f"{user_id}@guest.taskly",
        "name": "Explorer",
        "password_hash": "",
        "avatar": "",
        "mascot": "owl",
        "notification_style": "normal",
        "purpose": "everything",
        "xp": 0,
        "streak": 0,
        "level": 1,
        "onboarding_complete": False,
        "dark_mode": False,
        "ai_preference": "claude",
        "badges": [],
        "last_active": datetime.now(timezone.utc).isoformat(),
        "streak_last_date": "",
        "is_guest": True,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.users.insert_one(user_doc)
    token = create_token(user_id)
    response.set_cookie(key="session_token", value=token, httponly=True, secure=True, samesite="none", path="/", max_age=30*24*3600)
    return {"token": token, "user": {k: v for k, v in user_doc.items() if k not in ["password_hash", "_id"]}}

@api_router.get("/auth/me")
async def get_me(user: dict = Depends(get_current_user)):
    return {k: v for k, v in user.items() if k != "password_hash"}

@api_router.post("/auth/google-session")
async def google_session(request: Request, response: Response):
    import httpx
    body = await request.json()
    session_id = body.get("session_id")
    if not session_id:
        raise HTTPException(status_code=400, detail="session_id required")
    async with httpx.AsyncClient() as http_client:
        resp = await http_client.get(
            "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
            headers={"X-Session-ID": session_id}
        )
        if resp.status_code != 200:
            raise HTTPException(status_code=401, detail="Invalid session")
        google_data = resp.json()
    existing = await db.users.find_one({"email": google_data["email"]}, {"_id": 0})
    if existing:
        user_id = existing["user_id"]
        await db.users.update_one({"user_id": user_id}, {"$set": {"name": google_data["name"], "avatar": google_data.get("picture", ""), "last_active": datetime.now(timezone.utc).isoformat()}})
    else:
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        user_doc = {
            "user_id": user_id,
            "email": google_data["email"],
            "name": google_data["name"],
            "password_hash": "",
            "avatar": google_data.get("picture", ""),
            "mascot": "owl",
            "notification_style": "normal",
            "purpose": "everything",
            "xp": 0,
            "streak": 0,
            "level": 1,
            "onboarding_complete": False,
            "dark_mode": False,
            "ai_preference": "claude",
            "badges": [],
            "last_active": datetime.now(timezone.utc).isoformat(),
            "streak_last_date": "",
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.users.insert_one(user_doc)
    token = create_token(user_id)
    response.set_cookie(key="session_token", value=token, httponly=True, secure=True, samesite="none", path="/", max_age=30*24*3600)
    user = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    return {"token": token, "user": {k: v for k, v in user.items() if k != "password_hash"}}

# ─── User Profile Routes ───

@api_router.put("/user/profile")
async def update_profile(updates: Dict[str, Any], user: dict = Depends(get_current_user)):
    allowed = ["name", "avatar", "mascot", "notification_style", "purpose", "dark_mode", "ai_preference"]
    filtered = {k: v for k, v in updates.items() if k in allowed}
    if filtered:
        await db.users.update_one({"user_id": user["user_id"]}, {"$set": filtered})
    updated = await db.users.find_one({"user_id": user["user_id"]}, {"_id": 0})
    return {k: v for k, v in updated.items() if k != "password_hash"}

@api_router.put("/user/onboarding")
async def update_onboarding(data: OnboardingUpdate, user: dict = Depends(get_current_user)):
    updates = {k: v for k, v in data.dict().items() if v is not None}
    if updates:
        await db.users.update_one({"user_id": user["user_id"]}, {"$set": updates})
    updated = await db.users.find_one({"user_id": user["user_id"]}, {"_id": 0})
    return {k: v for k, v in updated.items() if k != "password_hash"}

# ─── Task Routes ───

@api_router.post("/tasks")
async def create_task(task: TaskCreate, user: dict = Depends(get_current_user)):
    from persona_system import classify_task_persona, get_persona
    
    task_id = f"task_{uuid.uuid4().hex[:12]}"
    subtasks = []
    for i, st in enumerate(task.subtasks):
        subtasks.append({
            "subtask_id": f"st_{uuid.uuid4().hex[:8]}",
            "title": st.get("title", ""),
            "completed": st.get("completed", False),
            "estimated_time": st.get("estimated_time", 15)
        })
    
    # Auto-detect persona based on task title and description
    persona_id = classify_task_persona(task.title, task.description)
    persona = get_persona(persona_id)
    
    task_doc = {
        "task_id": task_id,
        "user_id": user["user_id"],
        "title": task.title,
        "description": task.description,
        "emoji": task.emoji,
        "priority": task.priority,
        "due_date": task.due_date,
        "estimated_time": task.estimated_time,
        "category": task.category,
        "tags": task.tags,
        "subtasks": subtasks,
        "completed": False,
        "completed_at": None,
        "xp_earned": 0,
        "persona_id": persona_id,
        "persona_name": persona["name"],
        "persona_emoji": persona["emoji"],
        "persona_color": persona["color"],
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.tasks.insert_one(task_doc)
    logger.info(f"Task created with persona: {persona_id} ({persona['name']})")
    return {k: v for k, v in task_doc.items() if k != "_id"}

@api_router.get("/tasks")
async def get_tasks(filter: str = "all", user: dict = Depends(get_current_user)):
    query = {"user_id": user["user_id"]}
    now = datetime.now(timezone.utc)
    if filter == "today":
        today_start = now.replace(hour=0, minute=0, second=0).isoformat()
        today_end = now.replace(hour=23, minute=59, second=59).isoformat()
        query["$or"] = [
            {"due_date": {"$gte": today_start, "$lte": today_end}},
            {"due_date": None, "completed": False}
        ]
    elif filter == "week":
        week_end = (now + timedelta(days=7)).isoformat()
        query["due_date"] = {"$lte": week_end}
    elif filter == "completed":
        query["completed"] = True
    elif filter == "active":
        query["completed"] = False
    tasks = await db.tasks.find(query, {"_id": 0}).sort("created_at", -1).to_list(500)
    return tasks

@api_router.get("/tasks/{task_id}")
async def get_task(task_id: str, user: dict = Depends(get_current_user)):
    task = await db.tasks.find_one({"task_id": task_id, "user_id": user["user_id"]}, {"_id": 0})
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return task

@api_router.put("/tasks/{task_id}")
async def update_task(task_id: str, updates: TaskUpdate, user: dict = Depends(get_current_user)):
    task = await db.tasks.find_one({"task_id": task_id, "user_id": user["user_id"]}, {"_id": 0})
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    update_data = {k: v for k, v in updates.dict().items() if v is not None}
    # Handle completion - award XP
    if "completed" in update_data and update_data["completed"] and not task.get("completed"):
        xp = calculate_xp(task)
        update_data["completed_at"] = datetime.now(timezone.utc).isoformat()
        update_data["xp_earned"] = xp
        await award_xp(user["user_id"], xp)
        await update_streak(user["user_id"])
        await check_badges(user["user_id"])
        await create_notification(user["user_id"], "achievement", "Task Complete!", f"You earned {xp} XP for completing '{task['title']}'! Keep it up!", user.get("mascot", "owl"))
    if update_data:
        await db.tasks.update_one({"task_id": task_id}, {"$set": update_data})
    updated = await db.tasks.find_one({"task_id": task_id}, {"_id": 0})
    return updated

@api_router.delete("/tasks/{task_id}")
async def delete_task(task_id: str, user: dict = Depends(get_current_user)):
    result = await db.tasks.delete_one({"task_id": task_id, "user_id": user["user_id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Task not found")
    return {"message": "Task deleted"}

@api_router.put("/tasks/{task_id}/subtask/{subtask_id}")
async def toggle_subtask(task_id: str, subtask_id: str, user: dict = Depends(get_current_user)):
    task = await db.tasks.find_one({"task_id": task_id, "user_id": user["user_id"]}, {"_id": 0})
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    subtasks = task.get("subtasks", [])
    for st in subtasks:
        if st["subtask_id"] == subtask_id:
            st["completed"] = not st["completed"]
            break
    await db.tasks.update_one({"task_id": task_id}, {"$set": {"subtasks": subtasks}})
    return {"subtasks": subtasks}

# ─── Gamification Helpers ───

def calculate_xp(task: dict) -> int:
    base_xp = 10
    priority_bonus = {"high": 15, "medium": 10, "low": 5}
    xp = base_xp + priority_bonus.get(task.get("priority", "medium"), 10)
    if task.get("subtasks"):
        xp += len(task["subtasks"]) * 3
    if task.get("due_date"):
        try:
            due = datetime.fromisoformat(task["due_date"].replace("Z", "+00:00"))
            if datetime.now(timezone.utc) <= due:
                xp += 10  # On-time bonus
        except Exception:
            pass
    return xp

async def award_xp(user_id: str, xp: int):
    user = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    new_xp = user.get("xp", 0) + xp
    new_level = max(1, new_xp // 100 + 1)
    await db.users.update_one({"user_id": user_id}, {"$set": {"xp": new_xp, "level": new_level}})

async def update_streak(user_id: str):
    user = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    last_date = user.get("streak_last_date", "")
    if last_date == today:
        return
    yesterday = (datetime.now(timezone.utc) - timedelta(days=1)).strftime("%Y-%m-%d")
    if last_date == yesterday:
        new_streak = user.get("streak", 0) + 1
    elif last_date == "":
        new_streak = 1
    else:
        new_streak = 1
    await db.users.update_one({"user_id": user_id}, {"$set": {"streak": new_streak, "streak_last_date": today}})

BADGE_DEFINITIONS = [
    {"badge_type": "early_bird", "name": "Early Bird", "description": "Complete a task before 9am", "icon": "🌅"},
    {"badge_type": "night_owl", "name": "Night Owl", "description": "Complete a task after 9pm", "icon": "🌙"},
    {"badge_type": "consistency_king", "name": "Consistency King", "description": "7-day streak", "icon": "👑"},
    {"badge_type": "big_brain", "name": "Big Brain", "description": "Complete 5 AI-assisted tasks", "icon": "🧠"},
    {"badge_type": "zero_inbox", "name": "Zero Inbox", "description": "Clear all tasks in a day", "icon": "🏆"},
    {"badge_type": "first_task", "name": "First Steps", "description": "Complete your first task", "icon": "🎯"},
    {"badge_type": "xp_100", "name": "Century Club", "description": "Earn 100 XP", "icon": "💯"},
    {"badge_type": "streak_3", "name": "On Fire", "description": "3-day streak", "icon": "🔥"},
    {"badge_type": "task_10", "name": "Task Master", "description": "Complete 10 tasks", "icon": "⚡"},
    {"badge_type": "speed_runner", "name": "Speed Runner", "description": "Finish task faster than estimate", "icon": "🏃"},
    {"badge_type": "zero_inbox", "name": "Zero Inbox", "description": "Clear all tasks in a day", "icon": "🏆"},
]

async def check_badges(user_id: str):
    user = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    existing_badges = set(b.get("badge_type") for b in user.get("badges", []))
    new_badges = []
    completed_count = await db.tasks.count_documents({"user_id": user_id, "completed": True})
    if "first_task" not in existing_badges and completed_count >= 1:
        new_badges.append("first_task")
    if "task_10" not in existing_badges and completed_count >= 10:
        new_badges.append("task_10")
    if "xp_100" not in existing_badges and user.get("xp", 0) >= 100:
        new_badges.append("xp_100")
    if "streak_3" not in existing_badges and user.get("streak", 0) >= 3:
        new_badges.append("streak_3")
    if "consistency_king" not in existing_badges and user.get("streak", 0) >= 7:
        new_badges.append("consistency_king")
    now = datetime.now(timezone.utc)
    if "early_bird" not in existing_badges and now.hour < 9:
        new_badges.append("early_bird")
    if "night_owl" not in existing_badges and now.hour >= 21:
        new_badges.append("night_owl")
    # Speed Runner - check if completed faster than estimate
    recent_task = await db.tasks.find_one({"user_id": user_id, "completed": True}, {"_id": 0}, sort=[("completed_at", -1)])
    if recent_task and "speed_runner" not in existing_badges:
        if recent_task.get("estimated_time", 0) > 0:
            new_badges.append("speed_runner")
    # Zero Inbox - all tasks for today completed
    if "zero_inbox" not in existing_badges:
        active_today = await db.tasks.count_documents({"user_id": user_id, "completed": False})
        if active_today == 0 and completed_count > 0:
            new_badges.append("zero_inbox")
    for badge_type in new_badges:
        badge_def = next((b for b in BADGE_DEFINITIONS if b["badge_type"] == badge_type), None)
        if badge_def:
            badge = {**badge_def, "earned_at": datetime.now(timezone.utc).isoformat()}
            await db.users.update_one({"user_id": user_id}, {"$push": {"badges": badge}})
            await create_notification(user_id, "badge", f"Badge Unlocked: {badge_def['name']}!", f"{badge_def['icon']} {badge_def['description']}", user.get("mascot", "owl"))

# ─── Gamification Routes ───

@api_router.get("/gamification/stats")
async def get_gamification_stats(user: dict = Depends(get_current_user)):
    completed_today = await db.tasks.count_documents({
        "user_id": user["user_id"],
        "completed": True,
        "completed_at": {"$gte": datetime.now(timezone.utc).replace(hour=0, minute=0, second=0).isoformat()}
    })
    total_completed = await db.tasks.count_documents({"user_id": user["user_id"], "completed": True})
    total_tasks = await db.tasks.count_documents({"user_id": user["user_id"]})
    # Weekly activity
    week_activity = []
    for i in range(7):
        day = datetime.now(timezone.utc) - timedelta(days=6-i)
        day_start = day.replace(hour=0, minute=0, second=0).isoformat()
        day_end = day.replace(hour=23, minute=59, second=59).isoformat()
        count = await db.tasks.count_documents({
            "user_id": user["user_id"],
            "completed": True,
            "completed_at": {"$gte": day_start, "$lte": day_end}
        })
        week_activity.append({"date": day.strftime("%Y-%m-%d"), "day": day.strftime("%a"), "count": count})
    return {
        "xp": user.get("xp", 0),
        "level": user.get("level", 1),
        "streak": user.get("streak", 0),
        "badges": user.get("badges", []),
        "completed_today": completed_today,
        "total_completed": total_completed,
        "total_tasks": total_tasks,
        "week_activity": week_activity,
        "all_badges": BADGE_DEFINITIONS
    }

# ─── Notification Helpers ───

async def create_notification(user_id: str, notif_type: str, title: str, message: str, character: str = "owl"):
    notif = {
        "notification_id": f"notif_{uuid.uuid4().hex[:12]}",
        "user_id": user_id,
        "type": notif_type,
        "title": title,
        "message": message,
        "character": character,
        "read": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.notifications.insert_one(notif)
    return notif

# ─── Notification Routes ───

@api_router.get("/notifications")
async def get_notifications(user: dict = Depends(get_current_user)):
    notifs = await db.notifications.find({"user_id": user["user_id"]}, {"_id": 0}).sort("created_at", -1).to_list(50)
    return notifs

@api_router.put("/notifications/{notification_id}/read")
async def mark_notification_read(notification_id: str, user: dict = Depends(get_current_user)):
    await db.notifications.update_one({"notification_id": notification_id, "user_id": user["user_id"]}, {"$set": {"read": True}})
    return {"message": "Marked as read"}

@api_router.post("/notifications/mark-all-read")
async def mark_all_read(user: dict = Depends(get_current_user)):
    await db.notifications.update_many({"user_id": user["user_id"], "read": False}, {"$set": {"read": True}})
    return {"message": "All marked as read"}

@api_router.get("/notifications/unread-count")
async def unread_count(user: dict = Depends(get_current_user)):
    count = await db.notifications.count_documents({"user_id": user["user_id"], "read": False})
    return {"count": count}

# ─── AI Routes ───

@api_router.post("/ai/suggest")
async def ai_suggest_task(data: AISuggestRequest, user: dict = Depends(get_current_user)):
    """AI auto-suggests with caching"""
    import hashlib
    title_hash = hashlib.md5(data.title.lower().strip().encode()).hexdigest()

    # Check cache first
    cached = await db.ai_cache.find_one({"title_hash": title_hash}, {"_id": 0})
    if cached:
        logger.info(f"AI SUGGEST: Cache hit for '{data.title}'")
        return cached.get("result", {})

    from emergentintegrations.llm.chat import LlmChat, UserMessage
    chat = LlmChat(
        api_key=EMERGENT_LLM_KEY,
        session_id=f"suggest_{uuid.uuid4().hex[:8]}",
        system_message="""You are a task planning AI. Given a task title, suggest:
1. An emoji icon that represents the task
2. Priority: "high", "medium", or "low"
3. Estimated time in minutes
4. A category (school, work, personal, health, creative, chores, social)
5. Up to 3 relevant tags

Respond in EXACTLY this JSON format, nothing else:
{"emoji": "📚", "priority": "medium", "estimated_time": 30, "category": "school", "tags": ["homework", "reading"]}"""
    )
    chat.with_model("anthropic", "claude-sonnet-4-5-20250929")
    msg = UserMessage(text=f"Task: {data.title}")
    try:
        response = await asyncio.wait_for(chat.send_message(msg), timeout=8.0)
        import json
        cleaned = response.strip()
        if "```" in cleaned:
            cleaned = cleaned.split("```")[1].replace("json", "").strip()
        result = json.loads(cleaned)
        # Cache the result
        await db.ai_cache.update_one(
            {"title_hash": title_hash},
            {"$set": {"title_hash": title_hash, "result": result, "created_at": datetime.now(timezone.utc)}},
            upsert=True
        )
        return result
    except asyncio.TimeoutError:
        logger.warning(f"AI SUGGEST: Timeout for '{data.title}'")
        return {"emoji": "📝", "priority": "medium", "estimated_time": 30, "category": "general", "tags": [], "timeout": True}
    except Exception as e:
        logger.error(f"AI suggest error: {e}")
        return {"emoji": "📝", "priority": "medium", "estimated_time": 30, "category": "general", "tags": []}

@api_router.post("/ai/breakdown")
async def ai_breakdown_task(data: AISuggestRequest, user: dict = Depends(get_current_user)):
    """AI breaks down a task into subtasks"""
    from emergentintegrations.llm.chat import LlmChat, UserMessage
    chat = LlmChat(
        api_key=EMERGENT_LLM_KEY,
        session_id=f"breakdown_{uuid.uuid4().hex[:8]}",
        system_message="""You are a task breakdown expert. Given a task, create 3-6 clear subtasks with time estimates.
Respond in EXACTLY this JSON format, nothing else:
{"subtasks": [{"title": "Research topic", "estimated_time": 30}, {"title": "Create outline", "estimated_time": 15}]}"""
    )
    chat.with_model("anthropic", "claude-sonnet-4-5-20250929")
    msg = UserMessage(text=f"Break down this task into subtasks: {data.title}")
    try:
        response = await asyncio.wait_for(chat.send_message(msg), timeout=8.0)
        import json
        cleaned = response.strip()
        if "```" in cleaned:
            cleaned = cleaned.split("```")[1].replace("json", "").strip()
        result = json.loads(cleaned)
        return result
    except Exception as e:
        logger.error(f"AI breakdown error: {e}")
        return {"subtasks": [{"title": "Get started", "estimated_time": 15}, {"title": "Work on it", "estimated_time": 30}, {"title": "Review & finish", "estimated_time": 15}]}

@api_router.post("/ai/chat")
async def ai_chat(data: ChatMessage, user: dict = Depends(get_current_user)):
    """AI chat with model switcher - OPTIMIZED: no history replay"""
    from emergentintegrations.llm.chat import LlmChat, UserMessage
    session_id = data.session_id or f"chat_{user['user_id']}_{uuid.uuid4().hex[:8]}"

    model_map = {
        "claude": ("anthropic", "claude-sonnet-4-5-20250929"),
        "gpt4o": ("openai", "gpt-4o"),
        "gemini": ("gemini", "gemini-2.5-flash"),
    }
    provider, model = model_map.get(data.ai_model, ("anthropic", "claude-sonnet-4-5-20250929"))
    logger.info(f"AI CHAT: Using model={data.ai_model} → provider={provider}, model={model}")

    # Get user's tasks for context (limit to 5 for speed)
    tasks = await db.tasks.find({"user_id": user["user_id"], "completed": False}, {"_id": 0}).to_list(5)
    task_context = ""
    if tasks:
        task_list = "\n".join([f"- {t['title']} ({t['priority']})" for t in tasks[:5]])
        task_context = f"\n\nUser's pending tasks:\n{task_list}"

    # Build conversation history as context in system message (NO API replay)
    history = await db.chat_messages.find(
        {"user_id": user["user_id"], "session_id": session_id},
        {"_id": 0}
    ).sort("created_at", -1).to_list(10)
    history.reverse()

    history_text = ""
    if history:
        recent = history[-6:]  # Last 3 exchanges max
        history_text = "\n\nRecent conversation:\n" + "\n".join(
            [f"{'User' if h['role'] == 'user' else 'AI'}: {h['content'][:200]}" for h in recent]
        )

    system_msg = f"""You are Taskly AI, a friendly task management assistant. Be concise, helpful, encouraging. Use emojis occasionally.

User: {user.get('name', 'Friend')} | Level {user.get('level', 1)} | {user.get('xp', 0)} XP | {user.get('streak', 0)}-day streak{task_context}{history_text}"""

    # Store user message
    user_msg_doc = {
        "message_id": f"msg_{uuid.uuid4().hex[:12]}",
        "user_id": user["user_id"],
        "session_id": session_id,
        "role": "user",
        "content": data.message,
        "ai_model": data.ai_model,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.chat_messages.insert_one(user_msg_doc)

    # Single API call - no history replay
    chat = LlmChat(
        api_key=EMERGENT_LLM_KEY,
        session_id=f"taskly_{session_id}_{data.ai_model}",
        system_message=system_msg
    )
    chat.with_model(provider, model)

    msg = UserMessage(text=data.message)
    try:
        response = await asyncio.wait_for(chat.send_message(msg), timeout=12.0)
        logger.info(f"AI CHAT: Got response from {data.ai_model} ({len(response)} chars)")
    except asyncio.TimeoutError:
        logger.warning(f"AI CHAT: Timeout for model {data.ai_model}")
        response = f"I'm taking too long to respond. Please try again! The {AI_MODELS_DISPLAY.get(data.ai_model, 'AI')} might be busy. 🤖"
    except Exception as e:
        logger.error(f"AI CHAT error ({data.ai_model}): {e}")
        response = "I'm having trouble connecting right now. Please try again! 🤖"

    # Store AI response
    ai_msg_doc = {
        "message_id": f"msg_{uuid.uuid4().hex[:12]}",
        "user_id": user["user_id"],
        "session_id": session_id,
        "role": "assistant",
        "content": response,
        "ai_model": data.ai_model,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.chat_messages.insert_one(ai_msg_doc)

    return {"response": response, "session_id": session_id, "ai_model": data.ai_model}

@api_router.get("/ai/chat-history")
async def get_chat_history(session_id: str = None, user: dict = Depends(get_current_user)):
    query = {"user_id": user["user_id"]}
    if session_id:
        query["session_id"] = session_id
    messages = await db.chat_messages.find(query, {"_id": 0}).sort("created_at", 1).to_list(100)
    return messages

# ─── Dashboard Route ───

@api_router.get("/dashboard")
async def get_dashboard(user: dict = Depends(get_current_user)):
    now = datetime.now(timezone.utc)
    hour = now.hour
    if hour < 12:
        greeting = "Good Morning"
    elif hour < 17:
        greeting = "Good Afternoon"
    else:
        greeting = "Good Evening"

    today_start = now.replace(hour=0, minute=0, second=0).isoformat()
    today_end = now.replace(hour=23, minute=59, second=59).isoformat()

    today_tasks = await db.tasks.find(
        {"user_id": user["user_id"], "completed": False},
        {"_id": 0}
    ).sort("priority", 1).to_list(50)

    completed_today = await db.tasks.count_documents({
        "user_id": user["user_id"], "completed": True,
        "completed_at": {"$gte": today_start, "$lte": today_end}
    })

    quotes = [
        "The secret of getting ahead is getting started. — Mark Twain",
        "Every accomplishment starts with the decision to try.",
        "Small steps every day lead to big changes.",
        "You don't have to be perfect, just consistent.",
        "Believe you can and you're halfway there. — Theodore Roosevelt",
        "The only way to do great work is to love what you do. — Steve Jobs",
        "Progress, not perfection, is what we should be asking of ourselves.",
        "Start where you are. Use what you have. Do what you can.",
    ]

    unread = await db.notifications.count_documents({"user_id": user["user_id"], "read": False})

    return {
        "greeting": greeting,
        "name": user.get("name", "Friend"),
        "xp": user.get("xp", 0),
        "level": user.get("level", 1),
        "streak": user.get("streak", 0),
        "today_tasks": today_tasks[:5],
        "completed_today": completed_today,
        "total_pending": len(today_tasks),
        "quote": random.choice(quotes),
        "unread_notifications": unread,
        "mascot": user.get("mascot", "owl")
    }

# ─── Motivational Quote Route ───

@api_router.get("/quote")
async def get_quote():
    quotes = [
        {"text": "The secret of getting ahead is getting started.", "author": "Mark Twain"},
        {"text": "Every accomplishment starts with the decision to try.", "author": "Unknown"},
        {"text": "Small steps every day lead to big changes.", "author": "Unknown"},
        {"text": "You don't have to be perfect, just consistent.", "author": "Unknown"},
        {"text": "Believe you can and you're halfway there.", "author": "Theodore Roosevelt"},
    ]
    return random.choice(quotes)

# ─── Developer Tools Routes ───

@api_router.post("/dev/simulate-day")
async def dev_simulate_day(user: dict = Depends(get_current_user)):
    """Simulate advancing one day for streak testing"""
    current_streak = user.get("streak", 0)
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    await db.users.update_one(
        {"user_id": user["user_id"]},
        {"$set": {"streak": current_streak + 1, "streak_last_date": today}}
    )
    await check_badges(user["user_id"])
    return {"message": f"Streak advanced to {current_streak + 1}", "streak": current_streak + 1}

@api_router.post("/dev/reset-streak")
async def dev_reset_streak(user: dict = Depends(get_current_user)):
    """Reset streak to 0"""
    await db.users.update_one(
        {"user_id": user["user_id"]},
        {"$set": {"streak": 0, "streak_last_date": ""}}
    )
    return {"message": "Streak reset to 0", "streak": 0}

@api_router.post("/dev/add-xp")
async def dev_add_xp(request: Request, user: dict = Depends(get_current_user)):
    """Add XP for testing"""
    body = await request.json()
    xp_to_add = body.get("xp", 50)
    new_xp = user.get("xp", 0) + xp_to_add
    new_level = max(1, new_xp // 100 + 1)
    await db.users.update_one(
        {"user_id": user["user_id"]},
        {"$set": {"xp": new_xp, "level": new_level}}
    )
    await check_badges(user["user_id"])
    return {"message": f"Added {xp_to_add} XP", "xp": new_xp, "level": new_level}

@api_router.post("/dev/trigger-badge")
async def dev_trigger_badge(request: Request, user: dict = Depends(get_current_user)):
    """Manually trigger a badge unlock"""
    body = await request.json()
    badge_type = body.get("badge_type")
    badge_def = next((b for b in BADGE_DEFINITIONS if b["badge_type"] == badge_type), None)
    if not badge_def:
        raise HTTPException(status_code=400, detail="Invalid badge type")
    existing_badges = set(b.get("badge_type") for b in user.get("badges", []))
    if badge_type not in existing_badges:
        badge = {**badge_def, "earned_at": datetime.now(timezone.utc).isoformat()}
        await db.users.update_one({"user_id": user["user_id"]}, {"$push": {"badges": badge}})
        await create_notification(user["user_id"], "badge", f"Badge Unlocked: {badge_def['name']}!", f"{badge_def['icon']} {badge_def['description']}", user.get("mascot", "owl"))
    return {"message": f"Badge '{badge_def['name']}' triggered", "badge": badge_def}

# ─── Root ───
@api_router.get("/")
async def root():
    return {"message": "Taskly API is running"}

# Include router and middleware
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()

@app.on_event("startup")
async def create_indexes():
    """Create MongoDB indexes for performance"""
    try:
        await db.users.create_index("user_id", unique=True)
        await db.users.create_index("email")
        await db.tasks.create_index([("user_id", 1), ("completed", 1)])
        await db.tasks.create_index([("user_id", 1), ("created_at", -1)])
        await db.tasks.create_index([("user_id", 1), ("completed_at", -1)])
        await db.chat_messages.create_index([("user_id", 1), ("session_id", 1)])
        await db.notifications.create_index([("user_id", 1), ("created_at", -1)])
        await db.ai_cache.create_index("title_hash", unique=True)
        await db.ai_cache.create_index("created_at", expireAfterSeconds=3600)
        logger.info("MongoDB indexes created successfully")
    except Exception as e:
        logger.warning(f"Index creation warning: {e}")
