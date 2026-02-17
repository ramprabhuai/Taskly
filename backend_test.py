#!/usr/bin/env python3
"""
Backend Test Suite for TASKLY AI Personas Feature (Phase 1)
Tests the persona system endpoints and functionality.
"""

import asyncio
import aiohttp
import json
import os
from datetime import datetime

# Get backend URL from environment
BACKEND_URL = os.environ.get('EXPO_PUBLIC_BACKEND_URL', 'http://localhost:8001')
API_BASE = f"{BACKEND_URL}/api"

class TasklyTester:
    def __init__(self):
        self.session = None
        self.auth_token = None
        self.user_data = None
        self.test_results = []
        
    async def setup(self):
        """Initialize HTTP session"""
        self.session = aiohttp.ClientSession()
        
    async def cleanup(self):
        """Close HTTP session"""
        if self.session:
            await self.session.close()
            
    def log_test(self, test_name: str, success: bool, details: str = ""):
        """Log test result"""
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}")
        if details:
            print(f"   {details}")
        self.test_results.append({
            "test": test_name,
            "success": success,
            "details": details,
            "timestamp": datetime.now().isoformat()
        })
        
    async def create_guest_user(self):
        """Create a guest user for testing"""
        try:
            async with self.session.post(f"{API_BASE}/auth/guest") as resp:
                if resp.status == 200:
                    data = await resp.json()
                    self.auth_token = data.get("token")
                    self.user_data = data.get("user")
                    self.log_test("Guest User Creation", True, f"User ID: {self.user_data.get('user_id')}")
                    return True
                else:
                    error_text = await resp.text()
                    self.log_test("Guest User Creation", False, f"Status: {resp.status}, Error: {error_text}")
                    return False
        except Exception as e:
            self.log_test("Guest User Creation", False, f"Exception: {str(e)}")
            return False
            
    def get_auth_headers(self):
        """Get authorization headers"""
        return {"Authorization": f"Bearer {self.auth_token}"} if self.auth_token else {}
        
    async def test_get_personas(self):
        """Test GET /api/ai/personas endpoint"""
        try:
            headers = self.get_auth_headers()
            async with self.session.get(f"{API_BASE}/ai/personas", headers=headers) as resp:
                if resp.status == 200:
                    personas = await resp.json()
                    if isinstance(personas, list) and len(personas) == 8:
                        # Check if all required fields are present
                        required_fields = ["id", "name", "emoji", "color", "description"]
                        all_valid = True
                        for persona in personas:
                            for field in required_fields:
                                if field not in persona:
                                    all_valid = False
                                    break
                        
                        if all_valid:
                            self.log_test("Get All Personas", True, f"Found {len(personas)} personas with all required fields")
                            return True
                        else:
                            self.log_test("Get All Personas", False, "Missing required fields in persona data")
                            return False
                    else:
                        self.log_test("Get All Personas", False, f"Expected 8 personas, got {len(personas) if isinstance(personas, list) else 'non-list'}")
                        return False
                else:
                    error_text = await resp.text()
                    self.log_test("Get All Personas", False, f"Status: {resp.status}, Error: {error_text}")
                    return False
        except Exception as e:
            self.log_test("Get All Personas", False, f"Exception: {str(e)}")
            return False
            
    async def test_task_creation_with_persona(self):
        """Test POST /api/tasks with persona auto-detection"""
        test_cases = [
            {
                "title": "Save $500 for vacation",
                "expected_persona": "financial",
                "expected_name": "Financial Coach",
                "expected_emoji": "💰"
            },
            {
                "title": "Run 5K three times a week",
                "expected_persona": "fitness", 
                "expected_name": "Fitness Coach",
                "expected_emoji": "🏃"
            },
            {
                "title": "Study for math exam",
                "expected_persona": "study",
                "expected_name": "Study Tutor", 
                "expected_emoji": "🧠"
            }
        ]
        
        all_passed = True
        created_tasks = []
        
        for test_case in test_cases:
            try:
                headers = self.get_auth_headers()
                task_data = {
                    "title": test_case["title"],
                    "description": "",
                    "emoji": "📝",
                    "priority": "medium",
                    "category": "general",
                    "tags": [],
                    "subtasks": []
                }
                
                async with self.session.post(f"{API_BASE}/tasks", 
                                           headers=headers, 
                                           json=task_data) as resp:
                    if resp.status == 200:
                        task = await resp.json()
                        created_tasks.append(task.get("task_id"))
                        
                        # Check persona assignment
                        persona_id = task.get("persona_id")
                        persona_name = task.get("persona_name")
                        persona_emoji = task.get("persona_emoji")
                        persona_color = task.get("persona_color")
                        
                        if (persona_id == test_case["expected_persona"] and
                            persona_name == test_case["expected_name"] and
                            persona_emoji == test_case["expected_emoji"] and
                            persona_color):
                            self.log_test(f"Task Creation - {test_case['title'][:20]}...", True, 
                                        f"Persona: {persona_id} ({persona_name} {persona_emoji})")
                        else:
                            self.log_test(f"Task Creation - {test_case['title'][:20]}...", False,
                                        f"Expected {test_case['expected_persona']}, got {persona_id}")
                            all_passed = False
                    else:
                        error_text = await resp.text()
                        self.log_test(f"Task Creation - {test_case['title'][:20]}...", False,
                                    f"Status: {resp.status}, Error: {error_text}")
                        all_passed = False
                        
            except Exception as e:
                self.log_test(f"Task Creation - {test_case['title'][:20]}...", False, f"Exception: {str(e)}")
                all_passed = False
                
        return all_passed, created_tasks
        
    async def test_persona_chat(self, task_id: str):
        """Test POST /api/ai/persona-chat endpoint"""
        try:
            headers = self.get_auth_headers()
            chat_data = {
                "message": "How should I approach this task?",
                "task_id": task_id,
                "persona_id": "financial",
                "session_id": None
            }
            
            async with self.session.post(f"{API_BASE}/ai/persona-chat",
                                       headers=headers,
                                       json=chat_data) as resp:
                if resp.status == 200:
                    response = await resp.json()
                    
                    # Check required response fields
                    required_fields = ["response", "session_id", "persona_id", "persona_name", "persona_emoji"]
                    missing_fields = [field for field in required_fields if field not in response]
                    
                    if not missing_fields:
                        response_text = response.get("response", "")
                        if len(response_text) > 10:  # Basic check for meaningful response
                            self.log_test("Persona Chat", True, 
                                        f"Got {len(response_text)} char response from {response.get('persona_name')}")
                            return True
                        else:
                            self.log_test("Persona Chat", False, "Response too short or empty")
                            return False
                    else:
                        self.log_test("Persona Chat", False, f"Missing fields: {missing_fields}")
                        return False
                else:
                    error_text = await resp.text()
                    self.log_test("Persona Chat", False, f"Status: {resp.status}, Error: {error_text}")
                    return False
                    
        except Exception as e:
            self.log_test("Persona Chat", False, f"Exception: {str(e)}")
            return False
            
    async def test_task_retrieval(self, task_id: str):
        """Test GET /api/tasks/{task_id} to verify persona data persistence"""
        try:
            headers = self.get_auth_headers()
            async with self.session.get(f"{API_BASE}/tasks/{task_id}", headers=headers) as resp:
                if resp.status == 200:
                    task = await resp.json()
                    
                    # Check if persona fields are persisted
                    persona_fields = ["persona_id", "persona_name", "persona_emoji", "persona_color"]
                    missing_fields = [field for field in persona_fields if field not in task]
                    
                    if not missing_fields:
                        self.log_test("Task Retrieval with Persona Data", True,
                                    f"Task has persona: {task.get('persona_name')} {task.get('persona_emoji')}")
                        return True
                    else:
                        self.log_test("Task Retrieval with Persona Data", False,
                                    f"Missing persona fields: {missing_fields}")
                        return False
                else:
                    error_text = await resp.text()
                    self.log_test("Task Retrieval with Persona Data", False,
                                f"Status: {resp.status}, Error: {error_text}")
                    return False
                    
        except Exception as e:
            self.log_test("Task Retrieval with Persona Data", False, f"Exception: {str(e)}")
            return False
            
    async def run_all_tests(self):
        """Run all backend tests"""
        print("🚀 Starting TASKLY AI Personas Backend Tests")
        print(f"📡 Backend URL: {API_BASE}")
        print("=" * 60)
        
        # Setup
        await self.setup()
        
        try:
            # 1. Create guest user for authentication
            if not await self.create_guest_user():
                print("❌ Cannot proceed without authentication")
                return
                
            # 2. Test get all personas
            await self.test_get_personas()
            
            # 3. Test task creation with persona assignment
            task_creation_success, created_tasks = await self.test_task_creation_with_persona()
            
            # 4. Test persona chat (if we have a task)
            if created_tasks:
                await self.test_persona_chat(created_tasks[0])
                
                # 5. Test task retrieval with persona data
                await self.test_task_retrieval(created_tasks[0])
            else:
                self.log_test("Persona Chat", False, "No tasks created to test with")
                self.log_test("Task Retrieval with Persona Data", False, "No tasks created to test with")
                
        finally:
            await self.cleanup()
            
        # Print summary
        print("\n" + "=" * 60)
        print("📊 TEST SUMMARY")
        print("=" * 60)
        
        passed = sum(1 for result in self.test_results if result["success"])
        total = len(self.test_results)
        
        for result in self.test_results:
            status = "✅" if result["success"] else "❌"
            print(f"{status} {result['test']}")
            if result["details"] and not result["success"]:
                print(f"   └─ {result['details']}")
                
        print(f"\n🎯 Results: {passed}/{total} tests passed")
        
        if passed == total:
            print("🎉 All tests passed! AI Personas feature is working correctly.")
        else:
            print(f"⚠️  {total - passed} test(s) failed. Check the details above.")
            
        return passed == total

async def main():
    """Main test runner"""
    tester = TasklyTester()
    success = await tester.run_all_tests()
    return success

if __name__ == "__main__":
    asyncio.run(main())