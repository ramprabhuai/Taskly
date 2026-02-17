# Auth-Gated App Testing Playbook for TASKLY

## Step 1: Create Test User & Session
```bash
mongosh --eval "
use('test_database');
var userId = 'test-user-' + Date.now();
var sessionToken = 'test_session_' + Date.now();
db.users.insertOne({
  user_id: userId,
  email: 'test.user.' + Date.now() + '@example.com',
  name: 'Test User',
  picture: 'https://via.placeholder.com/150',
  mascot: 'owl',
  xp: 50,
  streak: 3,
  level: 1,
  onboarding_complete: true,
  dark_mode: false,
  ai_preference: 'claude',
  badges: [],
  created_at: new Date()
});
print('User ID: ' + userId);
"
```

## Step 2: Test Backend API
```bash
# Guest login
curl -X POST "https://duolingo-tasks.preview.emergentagent.com/api/auth/guest"

# Test with token from guest login response
TOKEN="your-token-here"
curl -X GET "https://duolingo-tasks.preview.emergentagent.com/api/auth/me" -H "Authorization: Bearer $TOKEN"
curl -X GET "https://duolingo-tasks.preview.emergentagent.com/api/dashboard" -H "Authorization: Bearer $TOKEN"
curl -X POST "https://duolingo-tasks.preview.emergentagent.com/api/tasks" -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" -d '{"title": "Test Task", "priority": "high"}'
```

## Step 3: Browser Testing
```javascript
// Navigate to the app
await page.goto("https://duolingo-tasks.preview.emergentagent.com");
// Click Guest Login
await page.click('[data-testid="guest-login-btn"]');
// Complete onboarding steps...
```
