"""
Test 7 Critical Bug Fixes for TASKLY
Bug 1: AI chat immediate load (tested via frontend)
Bug 2: Developer Tools endpoints
Bug 3: AI auto-suggest
Bug 4: Confetti animation (tested via frontend)
Bug 5: FAB button (tested via frontend)
Bug 6: Badge unlock popup (tested via frontend)
Bug 7: AI breakdown subtasks
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
def auth_user(api_client):
    """Create authenticated user"""
    response = api_client.post(f"{BASE_URL}/api/auth/guest")
    assert response.status_code == 200
    data = response.json()
    api_client.headers.update({"Authorization": f"Bearer {data['token']}"})
    return data

class TestBug2DevTools:
    """Bug 2: Developer Tools endpoints"""
    
    def test_dev_simulate_day(self, auth_user, api_client):
        """POST /api/dev/simulate-day should advance streak by 1"""
        # Get initial user data
        me = api_client.get(f"{BASE_URL}/api/auth/me").json()
        initial_streak = me.get("streak", 0)
        
        # Simulate next day
        response = api_client.post(f"{BASE_URL}/api/dev/simulate-day")
        assert response.status_code == 200
        
        data = response.json()
        assert "message" in data
        assert "streak" in data
        assert data["streak"] == initial_streak + 1
        
        # Verify user was updated
        updated_me = api_client.get(f"{BASE_URL}/api/auth/me").json()
        assert updated_me["streak"] == initial_streak + 1
    
    def test_dev_reset_streak(self, auth_user, api_client):
        """POST /api/dev/reset-streak should set streak to 0"""
        # First simulate a day to have some streak
        api_client.post(f"{BASE_URL}/api/dev/simulate-day")
        
        # Reset streak
        response = api_client.post(f"{BASE_URL}/api/dev/reset-streak")
        assert response.status_code == 200
        
        data = response.json()
        assert "message" in data
        assert data["streak"] == 0
        
        # Verify
        me = api_client.get(f"{BASE_URL}/api/auth/me").json()
        assert me["streak"] == 0
    
    def test_dev_add_xp(self, auth_user, api_client):
        """POST /api/dev/add-xp should add 50 XP by default"""
        # Get initial XP
        me = api_client.get(f"{BASE_URL}/api/auth/me").json()
        initial_xp = me.get("xp", 0)
        initial_level = me.get("level", 1)
        
        # Add XP
        response = api_client.post(f"{BASE_URL}/api/dev/add-xp", json={"xp": 50})
        assert response.status_code == 200
        
        data = response.json()
        assert "message" in data
        assert "xp" in data
        assert "level" in data
        assert data["xp"] == initial_xp + 50
        
        # Verify level calculation (every 100 XP = 1 level)
        expected_level = max(1, (initial_xp + 50) // 100 + 1)
        assert data["level"] == expected_level
    
    def test_dev_trigger_badge(self, auth_user, api_client):
        """POST /api/dev/trigger-badge should unlock a specific badge"""
        badge_to_trigger = {
            "badge_type": "first_task"
        }
        
        response = api_client.post(f"{BASE_URL}/api/dev/trigger-badge", json=badge_to_trigger)
        assert response.status_code == 200
        
        data = response.json()
        assert "message" in data
        assert "badge" in data
        assert data["badge"]["badge_type"] == "first_task"
        assert data["badge"]["name"] == "First Steps"
        assert "icon" in data["badge"]
        
        # Verify badge was added to user
        stats = api_client.get(f"{BASE_URL}/api/gamification/stats").json()
        badge_types = [b["badge_type"] for b in stats["badges"]]
        assert "first_task" in badge_types

class TestBug3AIAutoSuggest:
    """Bug 3: AI auto-suggest task metadata"""
    
    def test_ai_suggest_with_short_title(self, auth_user, api_client):
        """AI suggest should work with typical task title"""
        payload = {"title": "Buy groceries"}
        response = api_client.post(f"{BASE_URL}/api/ai/suggest", json=payload)
        assert response.status_code == 200
        
        suggestion = response.json()
        # Check all required fields
        assert "emoji" in suggestion
        assert "priority" in suggestion
        assert "estimated_time" in suggestion
        assert "category" in suggestion
        assert "tags" in suggestion
        
        # Validate values
        assert suggestion["priority"] in ["high", "medium", "low"]
        assert isinstance(suggestion["estimated_time"], int)
        assert suggestion["estimated_time"] > 0
        assert len(suggestion["emoji"]) > 0
        assert isinstance(suggestion["tags"], list)
    
    def test_ai_suggest_with_complex_title(self, auth_user, api_client):
        """AI suggest should handle complex task descriptions"""
        payload = {"title": "Prepare presentation for Monday's team meeting about Q1 results"}
        response = api_client.post(f"{BASE_URL}/api/ai/suggest", json=payload)
        assert response.status_code == 200
        
        suggestion = response.json()
        assert suggestion["priority"] in ["high", "medium", "low"]
        # Work-related task should likely be work/school category
        assert suggestion["category"] in ["work", "school", "personal", "general", "chores", "creative", "social", "health"]

class TestBug7AIBreakdown:
    """Bug 7: AI task breakdown into subtasks"""
    
    def test_ai_breakdown_generates_subtasks(self, auth_user, api_client):
        """AI breakdown should return 3-6 subtasks with time estimates"""
        payload = {"title": "Clean my room"}
        response = api_client.post(f"{BASE_URL}/api/ai/breakdown", json=payload)
        assert response.status_code == 200
        
        result = response.json()
        assert "subtasks" in result
        assert isinstance(result["subtasks"], list)
        assert len(result["subtasks"]) >= 3
        assert len(result["subtasks"]) <= 6
        
        # Verify each subtask has required fields
        for subtask in result["subtasks"]:
            assert "title" in subtask
            assert "estimated_time" in subtask
            assert isinstance(subtask["title"], str)
            assert len(subtask["title"]) > 0
            assert isinstance(subtask["estimated_time"], int)
            assert subtask["estimated_time"] > 0
    
    def test_ai_breakdown_with_homework(self, auth_user, api_client):
        """AI breakdown for homework task"""
        payload = {"title": "Write essay on climate change"}
        response = api_client.post(f"{BASE_URL}/api/ai/breakdown", json=payload)
        assert response.status_code == 200
        
        result = response.json()
        subtasks = result["subtasks"]
        assert len(subtasks) >= 3
        
        # Check if subtasks make sense (they should be task-related)
        all_titles = " ".join([st["title"].lower() for st in subtasks])
        # Essay tasks should mention research, outline, write, etc.
        # Just verify we got meaningful text back
        assert len(all_titles) > 20

class TestBackendIntegration:
    """Test that backend endpoints work together"""
    
    def test_complete_dev_workflow(self, auth_user, api_client):
        """Test full dev tools workflow: add XP → trigger badge → simulate day"""
        # Step 1: Add XP
        xp_resp = api_client.post(f"{BASE_URL}/api/dev/add-xp", json={"xp": 100})
        assert xp_resp.status_code == 200
        
        # Step 2: Trigger badge
        badge_resp = api_client.post(f"{BASE_URL}/api/dev/trigger-badge", json={"badge_type": "xp_100"})
        assert badge_resp.status_code == 200
        
        # Step 3: Simulate 3 days
        for i in range(3):
            day_resp = api_client.post(f"{BASE_URL}/api/dev/simulate-day")
            assert day_resp.status_code == 200
        
        # Verify final state
        me = api_client.get(f"{BASE_URL}/api/auth/me").json()
        assert me["streak"] >= 3
        assert me["xp"] >= 100
        
        stats = api_client.get(f"{BASE_URL}/api/gamification/stats").json()
        badge_types = [b["badge_type"] for b in stats["badges"]]
        assert "xp_100" in badge_types
