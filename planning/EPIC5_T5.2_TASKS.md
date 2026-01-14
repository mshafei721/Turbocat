# Epic 5 - Task 5.2: Avatar Upload - Task Breakdown

## Phase 1: Setup and Dependencies
### T5.2.1: Install Dependencies
- [ ] Install sharp
- [ ] Install multer and @types/multer
- [ ] Install @aws-sdk/client-s3
- [ ] Verify installations

**Acceptance Criteria:**
- Dependencies added to package.json
- No TypeScript errors after installation
- `npm run typecheck` passes

**Commands:**
```bash
cd backend
npm install sharp multer @types/multer @aws-sdk/client-s3
npm run typecheck
```

---

## Phase 2: Environment Configuration
### T5.2.2: Add S3 Configuration to .env.example
- [ ] Add S3_BUCKET_NAME
- [ ] Add S3_REGION
- [ ] Add S3_ACCESS_KEY_ID
- [ ] Add S3_SECRET_ACCESS_KEY
- [ ] Add S3_ENDPOINT (optional, for Cloudflare R2)
- [ ] Document configuration in comments

**Acceptance Criteria:**
- .env.example updated with S3 variables
- Clear instructions for obtaining credentials
- Notes for both AWS S3 and Cloudflare R2

---

## Phase 3: Service Implementation
### T5.2.3: Create avatar.service.ts
- [ ] Create file with proper header documentation
- [ ] Define types (UploadAvatarInput, UploadAvatarResult)
- [ ] Implement file validation (type, size)
- [ ] Implement MIME type validation (check file signature)
- [ ] Implement image resizing with Sharp (256x256, centered crop)
- [ ] Implement S3 upload with AWS SDK v3
- [ ] Generate unique filename: `avatars/${userId}-${timestamp}.${ext}`
- [ ] Update User.avatarUrl in database
- [ ] Return avatar URL
- [ ] Add comprehensive error handling
- [ ] Add structured logging

**Acceptance Criteria:**
- Function signature: `uploadAvatar(userId: string, file: Express.Multer.File): Promise<{ avatarUrl: string }>`
- Validates file type (PNG, JPG, JPEG, WEBP only)
- Validates file size (max 5MB)
- Resizes to exactly 256x256px
- Uploads to S3/R2 successfully
- Updates database with new URL
- Throws ApiError on validation failure
- Logs important events (upload start, success, failure)

---

## Phase 4: Route Implementation
### T5.2.4: Add Avatar Upload Endpoint to users.ts
- [ ] Import multer and configure with memoryStorage
- [ ] Create multer middleware with file filter and size limit
- [ ] Add POST /api/v1/users/:id/avatar route
- [ ] Add requireAuth middleware
- [ ] Add ownership validation (userId from token === userId from params)
- [ ] Call avatar.service.uploadAvatar
- [ ] Return success response with avatar URL
- [ ] Add OpenAPI documentation comments
- [ ] Handle multer errors (file too large, wrong type)

**Acceptance Criteria:**
- Endpoint: POST /api/v1/users/:id/avatar
- Accepts multipart/form-data with 'avatar' field
- Returns 200 with avatarUrl on success
- Returns 400 on validation error
- Returns 401 without authentication
- Returns 403 if trying to upload for another user
- OpenAPI docs complete

---

## Phase 5: Testing
### T5.2.5: Write Unit Tests for avatar.service.ts
- [ ] Mock @aws-sdk/client-s3
- [ ] Mock sharp
- [ ] Mock Prisma client
- [ ] Test: uploadAvatar success with PNG
- [ ] Test: uploadAvatar success with JPG
- [ ] Test: reject file too large (>5MB)
- [ ] Test: reject invalid file type
- [ ] Test: resize to 256x256
- [ ] Test: handle S3 upload failure
- [ ] Test: handle Sharp processing failure
- [ ] Test: handle database update failure
- [ ] Achieve >=80% coverage

**Acceptance Criteria:**
- File: backend/src/services/__tests__/avatar.service.test.ts
- All tests pass: `npm test avatar.service.test.ts`
- Coverage >= 80%
- Proper mocking of external dependencies

---

## Phase 6: Integration Testing (Optional)
### T5.2.6: Manual Integration Test
- [ ] Start backend server
- [ ] Create test user and get auth token
- [ ] Prepare test images (valid PNG, JPG, oversized, invalid type)
- [ ] Test upload with valid PNG
- [ ] Test upload with valid JPG
- [ ] Test upload without auth (expect 401)
- [ ] Test upload for another user (expect 403)
- [ ] Test upload with invalid file (expect 400)
- [ ] Test upload with oversized file (expect 400)
- [ ] Verify avatarUrl updated in GET /users/me
- [ ] Verify image accessible at returned URL
- [ ] Verify image is 256x256px

**Acceptance Criteria:**
- All manual tests pass
- Avatar URL correctly stored in database
- Image accessible and correctly resized

---

## Phase 7: Documentation
### T5.2.7: Update Documentation
- [ ] Update .sisyphus/notepads/epic5/learnings.md with:
  - Why Sharp over other libraries
  - S3 vs R2 considerations
  - Security decisions (file validation approach)
  - Testing challenges and solutions
  - Performance considerations
- [ ] Document any gotchas or edge cases discovered

**Acceptance Criteria:**
- learnings.md updated with technical decisions
- Clear rationale for key choices
- Useful for future developers

---

## Phase 8: Final Validation
### T5.2.8: End-to-End Validation
- [ ] Run full test suite: `npm test`
- [ ] Run type checking: `npm run typecheck`
- [ ] Run linter: `npm run lint`
- [ ] Build application: `npm run build`
- [ ] Review all files for security issues
- [ ] Verify no credentials in code
- [ ] Verify no console.log statements

**Acceptance Criteria:**
- All tests pass
- No TypeScript errors
- No lint errors
- Build succeeds
- Code review checklist complete
