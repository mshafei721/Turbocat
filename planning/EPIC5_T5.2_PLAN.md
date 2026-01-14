# Epic 5 - Task 5.2: Avatar Upload with S3/R2 Integration

## Goal
Implement secure avatar upload functionality with automatic image resizing to 256x256px and cloud storage integration (S3/R2).

## Scope
- Create avatar.service.ts with image upload logic
- Add POST /api/v1/users/:id/avatar endpoint
- Implement file validation (type, size)
- Integrate Sharp for image resizing (256x256px, centered crop)
- Integrate AWS SDK v3 for S3/R2 uploads
- Add ownership validation (users can only upload their own avatar)
- Write comprehensive unit tests with mocked dependencies
- Document technical decisions and learnings

## Non-goals
- Filesystem storage (cloud only)
- Multiple image sizes/thumbnails
- Image filters or effects
- Avatar history/versioning
- Batch uploads

## Constraints
- Express 5.x + TypeScript
- Existing auth middleware (requireAuth)
- Existing service patterns (function-based exports)
- User.avatarUrl field already exists in schema
- Maximum file size: 5MB
- Allowed formats: PNG, JPG, JPEG, WEBP

## Assumptions
- AWS S3 or Cloudflare R2 credentials available via environment variables
- S3_BUCKET_NAME, S3_REGION, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY configured
- Sharp library handles all image format conversions
- Multer handles multipart/form-data parsing
- Old avatar URLs are not automatically deleted (manual cleanup)

## Impact
### Files to Create
- backend/src/services/avatar.service.ts
- backend/src/services/__tests__/avatar.service.test.ts
- backend/src/middleware/upload.middleware.ts (optional - may inline in route)

### Files to Modify
- backend/src/routes/users.ts (add avatar upload endpoint)
- backend/.env.example (add S3 configuration variables)
- .sisyphus/notepads/epic5/learnings.md (document decisions)

### Dependencies to Add
- sharp
- multer, @types/multer
- @aws-sdk/client-s3

## Risks
1. File upload vulnerabilities (malicious files, MIME type spoofing)
   - Mitigation: Validate file signature, not just extension
2. Memory exhaustion with large images
   - Mitigation: Enforce 5MB limit, use Sharp streaming
3. S3 credential exposure
   - Mitigation: Environment variables only, never log credentials
4. Unauthorized access to other users' avatar uploads
   - Mitigation: Ownership check in route handler
5. Race conditions (multiple simultaneous uploads)
   - Mitigation: Accept all uploads, last write wins (user.avatarUrl)

## Rollback
- Revert changes to users.ts route file
- Remove avatar.service.ts and tests
- Uninstall dependencies (optional, no harm in keeping)
- No database rollback needed (User.avatarUrl field is optional)

## Test Plan
### Unit Tests (avatar.service.test.ts)
1. uploadAvatar: success with valid PNG
2. uploadAvatar: success with valid JPG
3. uploadAvatar: reject file too large (>5MB)
4. uploadAvatar: reject invalid file type
5. uploadAvatar: resize to 256x256
6. uploadAvatar: handle S3 upload failure
7. uploadAvatar: handle Sharp processing failure

### Integration Tests (optional)
1. POST /api/v1/users/:id/avatar with valid file
2. POST /api/v1/users/:id/avatar without authentication
3. POST /api/v1/users/:id/avatar for another user (forbidden)
4. POST /api/v1/users/:id/avatar with invalid file type

### Manual Testing
```bash
# Upload avatar
curl -X POST http://localhost:3001/api/v1/users/me/avatar \
  -H "Authorization: Bearer $TOKEN" \
  -F "avatar=@test-avatar.png"

# Verify avatarUrl updated
curl http://localhost:3001/api/v1/users/me \
  -H "Authorization: Bearer $TOKEN"
```

## Done Criteria
- [ ] avatar.service.ts created with uploadAvatar function
- [ ] POST /api/v1/users/:id/avatar endpoint functional
- [ ] Images resized to 256x256px automatically
- [ ] Files stored in S3/R2 (not filesystem)
- [ ] Avatar URL stored in User.avatarUrl field
- [ ] File validation (type, size) working
- [ ] Ownership validation working
- [ ] TypeScript compilation passes (npm run typecheck)
- [ ] Unit tests pass (>=80% coverage)
- [ ] Documentation updated in learnings.md

## Security Checklist
- [ ] File type validation (whitelist only)
- [ ] File size validation (5MB limit)
- [ ] MIME type validation (check file signature)
- [ ] Ownership validation (user can only upload their own)
- [ ] No credentials in code or logs
- [ ] S3 bucket not publicly writable
- [ ] Generated filenames prevent path traversal
- [ ] No execution of uploaded files
