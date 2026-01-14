# Publishing API Routes - Test Guide

## Prerequisites

1. Backend server running: `cd backend && npm run dev`
2. Valid JWT token from login
3. Valid project/workflow ID
4. Apple Developer credentials (Team ID, Key ID, Issuer ID, Private Key)
5. Expo access token

## Environment Setup

Set the following in `backend/.env`:
```env
# Publishing service dependencies
EXPO_API_URL=https://expo.dev/api/v2
APPLE_API_URL=https://api.appstoreconnect.apple.com

# Encryption (required for storing credentials)
ENCRYPTION_KEY=your-32-character-encryption-key

# Redis (required for background jobs)
REDIS_URL=redis://localhost:6379
```

## Test Endpoints

### 1. POST /api/v1/publishing/initiate

**Purpose**: Start the app publishing process

**Request**:
```bash
curl -X POST http://localhost:3001/api/v1/publishing/initiate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "projectId": "your-project-uuid",
    "appleTeamId": "ABC123XYZ",
    "appleKeyId": "KEY123ABC",
    "appleIssuerId": "issuer-uuid",
    "applePrivateKey": "-----BEGIN PRIVATE KEY-----\nYOUR_KEY_HERE\n-----END PRIVATE KEY-----",
    "expoToken": "your-expo-access-token",
    "appName": "My Test App",
    "description": "This is a test app for publishing API validation",
    "category": "Productivity",
    "ageRating": "4+",
    "supportUrl": "https://example.com/support",
    "iconUrl": "https://example.com/icon.png"
  }'
```

**Expected Response (201 Created)**:
```json
{
  "success": true,
  "data": {
    "publishing": {
      "id": "publishing-uuid",
      "workflowId": "project-uuid",
      "status": "INITIATED",
      "appleTeamId": "ABC123XYZ",
      "appName": "My Test App",
      "bundleId": "com.turbocat.mytestapp",
      "version": "1.0.0",
      "createdAt": "2026-01-13T...",
      ...
    }
  },
  "meta": {
    "timestamp": "2026-01-13T...",
    "requestId": "..."
  }
}
```

**Validation Tests**:
```bash
# Test 1: Missing required field (should return 400)
curl -X POST http://localhost:3001/api/v1/publishing/initiate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "projectId": "your-project-uuid",
    "appleTeamId": "ABC123XYZ"
  }'
# Expected: 400 Bad Request with validation errors

# Test 2: Invalid UUID format (should return 400)
curl -X POST http://localhost:3001/api/v1/publishing/initiate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "projectId": "not-a-uuid",
    "appleTeamId": "ABC123XYZ",
    "appleKeyId": "KEY123ABC",
    "appleIssuerId": "issuer-uuid",
    "applePrivateKey": "key",
    "expoToken": "token",
    "appName": "Test",
    "description": "Test app description that is long enough",
    "category": "Productivity",
    "ageRating": "4+"
  }'
# Expected: 400 Bad Request - Invalid project ID format

# Test 3: App name too long (should return 400)
curl -X POST http://localhost:3001/api/v1/publishing/initiate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "projectId": "valid-uuid",
    "appleTeamId": "ABC123XYZ",
    "appleKeyId": "KEY123ABC",
    "appleIssuerId": "issuer-uuid",
    "applePrivateKey": "key",
    "expoToken": "token",
    "appName": "This app name is way too long and exceeds the maximum",
    "description": "Test app description",
    "category": "Productivity",
    "ageRating": "4+"
  }'
# Expected: 400 Bad Request - App name too long (max 30 chars)

# Test 4: Invalid age rating (should return 400)
curl -X POST http://localhost:3001/api/v1/publishing/initiate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "projectId": "valid-uuid",
    "appleTeamId": "ABC123XYZ",
    "appleKeyId": "KEY123ABC",
    "appleIssuerId": "issuer-uuid",
    "applePrivateKey": "key",
    "expoToken": "token",
    "appName": "Test App",
    "description": "Test app description that is long enough",
    "category": "Productivity",
    "ageRating": "18+"
  }'
# Expected: 400 Bad Request - Invalid age rating

# Test 5: No authentication (should return 401)
curl -X POST http://localhost:3001/api/v1/publishing/initiate \
  -H "Content-Type: application/json" \
  -d '{
    "projectId": "valid-uuid",
    "appleTeamId": "ABC123XYZ",
    "appleKeyId": "KEY123ABC",
    "appleIssuerId": "issuer-uuid",
    "applePrivateKey": "key",
    "expoToken": "token",
    "appName": "Test",
    "description": "Test app description",
    "category": "Productivity",
    "ageRating": "4+"
  }'
# Expected: 401 Unauthorized
```

---

### 2. GET /api/v1/publishing/:id/status

**Purpose**: Get publishing status for a specific publishing record

**Request**:
```bash
curl -X GET http://localhost:3001/api/v1/publishing/PUBLISHING_ID/status \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Expected Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "publishing": {
      "id": "publishing-uuid",
      "workflowId": "project-uuid",
      "status": "BUILDING",
      "statusMessage": "Expo build in progress...",
      "expoBuildId": "build-uuid",
      "appName": "My Test App",
      "bundleId": "com.turbocat.mytestapp",
      "version": "1.0.0",
      "createdAt": "2026-01-13T...",
      "workflow": {
        "id": "project-uuid",
        "projectName": "My Project"
      }
    }
  },
  "meta": {
    "timestamp": "2026-01-13T...",
    "requestId": "..."
  }
}
```

**Validation Tests**:
```bash
# Test 1: Non-existent publishing ID (should return 404)
curl -X GET http://localhost:3001/api/v1/publishing/00000000-0000-0000-0000-000000000000/status \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
# Expected: 404 Not Found

# Test 2: No authentication (should return 401)
curl -X GET http://localhost:3001/api/v1/publishing/PUBLISHING_ID/status
# Expected: 401 Unauthorized

# Test 3: Invalid ID format (should return 400 or 404)
curl -X GET http://localhost:3001/api/v1/publishing/not-a-uuid/status \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
# Expected: 400 or 404
```

---

### 3. POST /api/v1/publishing/:id/retry

**Purpose**: Retry a failed publishing attempt

**Request**:
```bash
curl -X POST http://localhost:3001/api/v1/publishing/PUBLISHING_ID/retry \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Expected Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "result": {
      "success": true,
      "message": "Publishing retry started"
    }
  },
  "meta": {
    "timestamp": "2026-01-13T...",
    "requestId": "..."
  }
}
```

**Validation Tests**:
```bash
# Test 1: Retry publishing with status != FAILED (should return 400)
# First initiate a new publishing, then try to retry it immediately
curl -X POST http://localhost:3001/api/v1/publishing/INITIATED_PUBLISHING_ID/retry \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
# Expected: 400 Bad Request - Can only retry failed publishing attempts

# Test 2: Non-existent publishing ID (should return 404)
curl -X POST http://localhost:3001/api/v1/publishing/00000000-0000-0000-0000-000000000000/retry \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
# Expected: 404 Not Found

# Test 3: No authentication (should return 401)
curl -X POST http://localhost:3001/api/v1/publishing/PUBLISHING_ID/retry
# Expected: 401 Unauthorized

# Test 4: Valid retry (requires failed publishing record)
# First, create a publishing that fails, then retry it
curl -X POST http://localhost:3001/api/v1/publishing/FAILED_PUBLISHING_ID/retry \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
# Expected: 200 OK - Publishing retry started
```

---

## Integration Testing Flow

**Full End-to-End Test**:

```bash
# Step 1: Login and get JWT token
TOKEN=$(curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }' | jq -r '.data.token')

echo "Token: $TOKEN"

# Step 2: Create a test project (if needed)
PROJECT_ID=$(curl -X POST http://localhost:3001/api/v1/projects \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "Publishing Test App",
    "description": "Test app for publishing API",
    "platform": "mobile"
  }' | jq -r '.data.project.id')

echo "Project ID: $PROJECT_ID"

# Step 3: Initiate publishing
PUBLISHING_ID=$(curl -X POST http://localhost:3001/api/v1/publishing/initiate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{
    \"projectId\": \"$PROJECT_ID\",
    \"appleTeamId\": \"TEST123\",
    \"appleKeyId\": \"KEY123\",
    \"appleIssuerId\": \"issuer-uuid\",
    \"applePrivateKey\": \"-----BEGIN PRIVATE KEY-----\\nKEY\\n-----END PRIVATE KEY-----\",
    \"expoToken\": \"test-token\",
    \"appName\": \"Publishing Test\",
    \"description\": \"This is a test app for the publishing flow validation\",
    \"category\": \"Productivity\",
    \"ageRating\": \"4+\"
  }" | jq -r '.data.publishing.id')

echo "Publishing ID: $PUBLISHING_ID"

# Step 4: Check status (poll every 5 seconds)
for i in {1..5}; do
  echo "Checking status (attempt $i)..."
  curl -X GET "http://localhost:3001/api/v1/publishing/$PUBLISHING_ID/status" \
    -H "Authorization: Bearer $TOKEN" | jq '.data.publishing.status'
  sleep 5
done

# Step 5: If failed, retry
curl -X POST "http://localhost:3001/api/v1/publishing/$PUBLISHING_ID/retry" \
  -H "Authorization: Bearer $TOKEN" | jq '.'
```

---

## Success Criteria Checklist

- [ ] POST /initiate endpoint returns 201 with publishing record
- [ ] POST /initiate validates required fields (returns 400 for missing fields)
- [ ] POST /initiate validates UUID format (returns 400 for invalid format)
- [ ] POST /initiate validates app name length (returns 400 for >30 chars)
- [ ] POST /initiate validates age rating enum (returns 400 for invalid values)
- [ ] POST /initiate requires authentication (returns 401 without token)
- [ ] GET /:id/status returns 200 with publishing record
- [ ] GET /:id/status returns 404 for non-existent IDs
- [ ] GET /:id/status requires authentication (returns 401 without token)
- [ ] POST /:id/retry returns 200 for FAILED publishing
- [ ] POST /:id/retry returns 400 for non-FAILED publishing
- [ ] POST /:id/retry returns 404 for non-existent IDs
- [ ] POST /:id/retry requires authentication (returns 401 without token)
- [ ] All endpoints return proper requestId in meta
- [ ] All endpoints return proper timestamps in meta
- [ ] All validation errors include field details
- [ ] Background job is queued after initiate (check Redis)
- [ ] Credentials are encrypted in database (check Publishing table)

---

## Database Verification

After initiating publishing, verify database records:

```sql
-- Check publishing record exists
SELECT id, status, "appName", "bundleId", "workflowId", "createdAt"
FROM "Publishing"
WHERE id = 'YOUR_PUBLISHING_ID';

-- Check credentials are encrypted (should see JSON with iv, encryptedData, tag)
SELECT "applePrivateKey", "expoToken"
FROM "Publishing"
WHERE id = 'YOUR_PUBLISHING_ID';

-- Check workflow relation
SELECT p.id, p.status, w."projectName"
FROM "Publishing" p
JOIN "Workflow" w ON p."workflowId" = w.id
WHERE p.id = 'YOUR_PUBLISHING_ID';
```

---

## Redis Queue Verification

Check that background jobs are queued:

```bash
# Connect to Redis CLI
redis-cli

# Check queue
LLEN bull:publishing:waiting
LRANGE bull:publishing:waiting 0 -1

# Check active jobs
LLEN bull:publishing:active
LRANGE bull:publishing:active 0 -1

# Check completed jobs
ZRANGE bull:publishing:completed 0 -1 WITHSCORES
```

---

## Common Issues & Troubleshooting

### Issue 1: "Publishing service is not available"
**Cause**: Redis not running or connection failed
**Solution**: Start Redis: `redis-server` or `brew services start redis`

### Issue 2: "Invalid Apple Developer credentials"
**Cause**: Apple service validation failed
**Solution**: Verify credentials, check Apple API key is active

### Issue 3: "Project not found"
**Cause**: Invalid projectId or project doesn't belong to user
**Solution**: Use valid project ID from /api/v1/projects

### Issue 4: TypeScript compilation errors
**Cause**: Missing dependencies or type mismatches
**Solution**: Run `npm install` and `npx tsc --noEmit`

### Issue 5: 500 Internal Server Error
**Cause**: Service exception not caught properly
**Solution**: Check backend logs for stack traces

---

## Performance Benchmarks

Expected response times (P95):
- POST /initiate: <500ms (includes encryption + DB write)
- GET /status: <100ms (simple DB read)
- POST /retry: <200ms (DB update + queue job)

---

## Next Steps

After manual testing passes:
1. Add unit tests for route handlers
2. Add integration tests with mocked services
3. Add E2E tests with real database
4. Document API in OpenAPI/Swagger spec
5. Update frontend to call these endpoints
