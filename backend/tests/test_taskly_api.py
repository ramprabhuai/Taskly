"""
Comprehensive Backend API Tests for TASKLY
Tests: Auth (guest/register/login), Tasks CRUD, AI features, Dashboard, Gamification, Notifications
"""
import pytest
import requests
import os
import time

BASE_URL = os.environ.get('EXPO_PUBLIC_BACKEND_URL', 'https://duolingo-tasks.preview.emergentagent.com').rstrip('/')

@pytest.fixture
def api_client():
    """Shared requests session"""
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session

@pytest.fixture
def guest_user(api_client):
    """Create a guest user and return token + user data"""
    response = api_client.post(f"{BASE_URL}/api/auth/guest")
    assert response.status_code == 200
    data = response.json()
    assert "token" in data
    assert "user" in data
    api_client.headers.update({"Authorization": f"Bearer {data['token']}"})
    return data

@pytest.fixture
def test_user(api_client):
    """Create a test user with registration"""
    email = f"test_{int(time.time())}@taskly.test"
    payload = {
        "email": email,
        "password": "TestPass123!",
        "name": "Test User"
    }
    response = api_client.post(f"{BASE_URL}/api/auth/register", json=payload)
    if response.status_code == 200:
        data = response.json()
        api_client.headers.update({"Authorization": f"Bearer {data['token']}"})
        return data
    pytest.skip("Registration failed")

class TestHealthCheck:
    """Basic health check"""
    
    def test_root_endpoint(self, api_client):
        response = api_client.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data

class TestAuthentication:
    """Test authentication flows"""
    
    def test_guest_login_creates_user(self, api_client):
        """Guest login should create a user with guest_ prefix"""
        response = api_client.post(f"{BASE_URL}/api/auth/guest")
        assert response.status_code == 200
        
        data = response.json()
        assert "token" in data
        assert "user" in data
        
        user = data["user"]
        assert user["user_id"].startswith("guest_")
        assert user["email"].endswith("@guest.taskly")
        assert user["name"] == "Explorer"
        assert user["xp"] == 0
        assert user["streak"] == 0
        assert user["level"] == 1
        assert user["onboarding_complete"] == False
        assert "is_guest" in user
        
        # Verify token works
        api_client.headers.update({"Authorization": f"Bearer {data['token']}"})
        me_response = api_client.get(f"{BASE_URL}/api/auth/me")
        assert me_response.status_code == 200
    
    def test_register_creates_user(self, api_client):
        """Register should create a new user"""
        email = f"test_reg_{int(time.time())}@taskly.test"
        payload = {
            "email": email,
            "password": "SecurePass123!",
            "name": "Registration Test"
        }
        response = api_client.post(f"{BASE_URL}/api/auth/register", json=payload)
        assert response.status_code == 200
        
        data = response.json()
        assert "token" in data
        assert data["user"]["email"] == email
        assert data["user"]["name"] == "Registration Test"
    
    def test_login_with_credentials(self, api_client):
        """Login should work with correct credentials"""
        # First register
        email = f"test_login_{int(time.time())}@taskly.test"
        payload = {
            "email": email,
            "password": "LoginPass123!",
            "name": "Login Test"
        }
        reg_response = api_client.post(f"{BASE_URL}/api/auth/register", json=payload)
        assert reg_response.status_code == 200
        
        # Now login
        login_payload = {
            "email": email,
            "password": "LoginPass123!"
        }
        login_response = api_client.post(f"{BASE_URL}/api/auth/login", json=login_payload)
        assert login_response.status_code == 200
        
        data = login_response.json()
        assert "token" in data
        assert data["user"]["email"] == email
    
    def test_get_me_requires_auth(self, api_client):
        """GET /auth/me should require authentication"""
        response = api_client.get(f"{BASE_URL}/api/auth/me")
        assert response.status_code == 401

class TestOnboarding:
    """Test onboarding flow"""
    
    def test_update_onboarding_name(self, guest_user, api_client):
        """Should update user name during onboarding"""
        payload = {"name": "Updated Name"}
        response = api_client.put(f"{BASE_URL}/api/user/onboarding", json=payload)
        assert response.status_code == 200
        
        data = response.json()
        assert data["name"] == "Updated Name"
    
    def test_update_onboarding_full_flow(self, guest_user, api_client):
        """Should update all onboarding fields"""
        updates = {
            "name": "Onboarding Complete User",
            "purpose": "school",
            "mascot": "frog",
            "notification_style": "intense",
            "onboarding_complete": True
        }
        response = api_client.put(f"{BASE_URL}/api/user/onboarding", json=updates)
        assert response.status_code == 200
        
        data = response.json()
        assert data["name"] == "Onboarding Complete User"
        assert data["purpose"] == "school"
        assert data["mascot"] == "frog"
        assert data["notification_style"] == "intense"
        assert data["onboarding_complete"] == True

class TestTasksCRUD:
    """Test task CRUD operations"""
    
    def test_create_task_basic(self, guest_user, api_client):
        """Should create a basic task"""
        payload = {
            "title": "TEST_Basic Task",
            "emoji": "📝",
            "priority": "medium"
        }
        response = api_client.post(f"{BASE_URL}/api/tasks", json=payload)
        assert response.status_code == 200
        
        task = response.json()
        assert task["title"] == "TEST_Basic Task"
        assert task["emoji"] == "📝"
        assert task["priority"] == "medium"
        assert task["completed"] == False
        assert "task_id" in task
        
        # Verify persistence with GET
        get_response = api_client.get(f"{BASE_URL}/api/tasks/{task['task_id']}")
        assert get_response.status_code == 200
        get_task = get_response.json()
        assert get_task["title"] == "TEST_Basic Task"
    
    def test_create_task_with_subtasks(self, guest_user, api_client):
        """Should create task with subtasks"""
        payload = {
            "title": "TEST_Task with Subtasks",
            "emoji": "📚",
            "priority": "high",
            "subtasks": [
                {"title": "Subtask 1", "estimated_time": 15},
                {"title": "Subtask 2", "estimated_time": 20}
            ]
        }
        response = api_client.post(f"{BASE_URL}/api/tasks", json=payload)
        assert response.status_code == 200
        
        task = response.json()
        assert len(task["subtasks"]) == 2
        assert task["subtasks"][0]["title"] == "Subtask 1"
        assert "subtask_id" in task["subtasks"][0]
    
    def test_get_all_tasks(self, guest_user, api_client):
        """Should get all user tasks"""
        # Create a task first
        api_client.post(f"{BASE_URL}/api/tasks", json={"title": "TEST_Get All Task", "emoji": "📋"})
        
        response = api_client.get(f"{BASE_URL}/api/tasks")
        assert response.status_code == 200
        
        tasks = response.json()
        assert isinstance(tasks, list)
        assert len(tasks) >= 1
    
    def test_get_tasks_with_filter(self, guest_user, api_client):
        """Should filter tasks by status"""
        response = api_client.get(f"{BASE_URL}/api/tasks?filter=active")
        assert response.status_code == 200
        
        tasks = response.json()
        assert isinstance(tasks, list)
    
    def test_update_task(self, guest_user, api_client):
        """Should update task fields"""
        # Create task
        create_resp = api_client.post(f"{BASE_URL}/api/tasks", json={
            "title": "TEST_Original Title",
            "priority": "low"
        })
        task = create_resp.json()
        
        # Update task
        update_payload = {
            "title": "TEST_Updated Title",
            "priority": "high"
        }
        update_resp = api_client.put(f"{BASE_URL}/api/tasks/{task['task_id']}", json=update_payload)
        assert update_resp.status_code == 200
        
        updated_task = update_resp.json()
        assert updated_task["title"] == "TEST_Updated Title"
        assert updated_task["priority"] == "high"
    
    def test_complete_task_awards_xp(self, guest_user, api_client):
        """Completing a task should award XP and update streak"""
        # Get initial user data
        initial_me = api_client.get(f"{BASE_URL}/api/auth/me").json()
        initial_xp = initial_me["xp"]
        
        # Create and complete task
        create_resp = api_client.post(f"{BASE_URL}/api/tasks", json={
            "title": "TEST_Task to Complete",
            "priority": "high"
        })
        task = create_resp.json()
        
        # Complete it
        complete_resp = api_client.put(f"{BASE_URL}/api/tasks/{task['task_id']}", json={"completed": True})
        assert complete_resp.status_code == 200
        
        completed_task = complete_resp.json()
        assert completed_task["completed"] == True
        assert completed_task["xp_earned"] > 0
        
        # Verify XP was awarded
        updated_me = api_client.get(f"{BASE_URL}/api/auth/me").json()
        assert updated_me["xp"] > initial_xp
    
    def test_toggle_subtask(self, guest_user, api_client):
        """Should toggle subtask completion"""
        # Create task with subtask
        create_resp = api_client.post(f"{BASE_URL}/api/tasks", json={
            "title": "TEST_Task with Subtask Toggle",
            "subtasks": [{"title": "Subtask to toggle", "estimated_time": 10}]
        })
        task = create_resp.json()
        subtask_id = task["subtasks"][0]["subtask_id"]
        
        # Toggle subtask
        toggle_resp = api_client.put(f"{BASE_URL}/api/tasks/{task['task_id']}/subtask/{subtask_id}")
        assert toggle_resp.status_code == 200
        
        result = toggle_resp.json()
        assert result["subtasks"][0]["completed"] == True
    
    def test_delete_task(self, guest_user, api_client):
        """Should delete a task"""
        # Create task
        create_resp = api_client.post(f"{BASE_URL}/api/tasks", json={"title": "TEST_Task to Delete"})
        task = create_resp.json()
        
        # Delete it
        delete_resp = api_client.delete(f"{BASE_URL}/api/tasks/{task['task_id']}")
        assert delete_resp.status_code == 200
        
        # Verify it's gone
        get_resp = api_client.get(f"{BASE_URL}/api/tasks/{task['task_id']}")
        assert get_resp.status_code == 404

class TestAIFeatures:
    """Test AI integration"""
    
    def test_ai_suggest_task(self, guest_user, api_client):
        """AI suggest should return task metadata"""
        payload = {"title": "Write an essay about climate change"}
        response = api_client.post(f"{BASE_URL}/api/ai/suggest", json=payload)
        assert response.status_code == 200
        
        suggestion = response.json()
        assert "emoji" in suggestion
        assert "priority" in suggestion
        assert "estimated_time" in suggestion
        assert "category" in suggestion
        assert suggestion["priority"] in ["high", "medium", "low"]
    
    def test_ai_breakdown_task(self, guest_user, api_client):
        """AI breakdown should return subtasks"""
        payload = {"title": "Complete math homework"}
        response = api_client.post(f"{BASE_URL}/api/ai/breakdown", json=payload)
        assert response.status_code == 200
        
        result = response.json()
        assert "subtasks" in result
        assert isinstance(result["subtasks"], list)
        assert len(result["subtasks"]) >= 3
        if len(result["subtasks"]) > 0:
            assert "title" in result["subtasks"][0]
            assert "estimated_time" in result["subtasks"][0]
    
    def test_ai_chat_basic(self, guest_user, api_client):
        """AI chat should respond to messages"""
        payload = {
            "message": "Hello, help me plan my day",
            "ai_model": "claude"
        }
        response = api_client.post(f"{BASE_URL}/api/ai/chat", json=payload)
        assert response.status_code == 200
        
        data = response.json()
        assert "response" in data
        assert "session_id" in data
        assert "ai_model" in data
        assert len(data["response"]) > 0
    
    def test_ai_chat_model_switcher(self, guest_user, api_client):
        """Should support different AI models"""
        models = ["claude", "gpt4o", "gemini"]
        
        for model in models:
            payload = {
                "message": "Hi",
                "ai_model": model
            }
            response = api_client.post(f"{BASE_URL}/api/ai/chat", json=payload)
            assert response.status_code == 200
            
            data = response.json()
            assert data["ai_model"] == model

class TestDashboard:
    """Test dashboard endpoint"""
    
    def test_dashboard_loads(self, guest_user, api_client):
        """Dashboard should return all required data"""
        response = api_client.get(f"{BASE_URL}/api/dashboard")
        assert response.status_code == 200
        
        dashboard = response.json()
        assert "greeting" in dashboard
        assert "name" in dashboard
        assert "xp" in dashboard
        assert "level" in dashboard
        assert "streak" in dashboard
        assert "today_tasks" in dashboard
        assert "completed_today" in dashboard
        assert "quote" in dashboard
        assert "unread_notifications" in dashboard
        
        assert dashboard["greeting"] in ["Good Morning", "Good Afternoon", "Good Evening"]
        assert isinstance(dashboard["today_tasks"], list)

class TestGamification:
    """Test gamification features"""
    
    def test_get_gamification_stats(self, guest_user, api_client):
        """Should return comprehensive gamification stats"""
        response = api_client.get(f"{BASE_URL}/api/gamification/stats")
        assert response.status_code == 200
        
        stats = response.json()
        assert "xp" in stats
        assert "level" in stats
        assert "streak" in stats
        assert "badges" in stats
        assert "completed_today" in stats
        assert "total_completed" in stats
        assert "week_activity" in stats
        assert "all_badges" in stats
        
        # Week activity should have 7 days
        assert len(stats["week_activity"]) == 7
        for day in stats["week_activity"]:
            assert "date" in day
            assert "day" in day
            assert "count" in day
    
    def test_badge_unlocking(self, guest_user, api_client):
        """Completing first task should unlock 'First Steps' badge"""
        # Create and complete a task
        create_resp = api_client.post(f"{BASE_URL}/api/tasks", json={
            "title": "TEST_First Task for Badge",
            "priority": "medium"
        })
        task = create_resp.json()
        
        api_client.put(f"{BASE_URL}/api/tasks/{task['task_id']}", json={"completed": True})
        
        # Check gamification stats for badges
        stats_resp = api_client.get(f"{BASE_URL}/api/gamification/stats")
        stats = stats_resp.json()
        
        badge_types = [b["badge_type"] for b in stats["badges"]]
        assert "first_task" in badge_types

class TestNotifications:
    """Test notification system"""
    
    def test_get_notifications(self, guest_user, api_client):
        """Should get user notifications"""
        response = api_client.get(f"{BASE_URL}/api/notifications")
        assert response.status_code == 200
        
        notifications = response.json()
        assert isinstance(notifications, list)
    
    def test_unread_count(self, guest_user, api_client):
        """Should get unread notification count"""
        response = api_client.get(f"{BASE_URL}/api/notifications/unread-count")
        assert response.status_code == 200
        
        data = response.json()
        assert "count" in data
        assert isinstance(data["count"], int)
    
    def test_mark_notification_read(self, guest_user, api_client):
        """Should mark individual notification as read"""
        # Complete a task to trigger notification
        create_resp = api_client.post(f"{BASE_URL}/api/tasks", json={"title": "TEST_Notif Task"})
        task = create_resp.json()
        api_client.put(f"{BASE_URL}/api/tasks/{task['task_id']}", json={"completed": True})
        
        # Get notifications
        notifs_resp = api_client.get(f"{BASE_URL}/api/notifications")
        notifs = notifs_resp.json()
        
        if len(notifs) > 0:
            notif_id = notifs[0]["notification_id"]
            mark_resp = api_client.put(f"{BASE_URL}/api/notifications/{notif_id}/read")
            assert mark_resp.status_code == 200
    
    def test_mark_all_read(self, guest_user, api_client):
        """Should mark all notifications as read"""
        response = api_client.post(f"{BASE_URL}/api/notifications/mark-all-read")
        assert response.status_code == 200
        
        # Verify count is 0
        count_resp = api_client.get(f"{BASE_URL}/api/notifications/unread-count")
        assert count_resp.json()["count"] == 0

class TestUserProfile:
    """Test user profile updates"""
    
    def test_update_profile(self, guest_user, api_client):
        """Should update user profile fields"""
        updates = {
            "name": "Updated Profile Name",
            "mascot": "star",
            "dark_mode": True,
            "ai_preference": "gpt4o"
        }
        response = api_client.put(f"{BASE_URL}/api/user/profile", json=updates)
        assert response.status_code == 200
        
        updated_user = response.json()
        assert updated_user["name"] == "Updated Profile Name"
        assert updated_user["mascot"] == "star"
        assert updated_user["dark_mode"] == True
        assert updated_user["ai_preference"] == "gpt4o"
