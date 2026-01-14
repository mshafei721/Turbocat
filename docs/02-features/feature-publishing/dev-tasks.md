# Development Tasks: Publishing Flow

**Feature:** PUB-001 - Publishing Flow
**Last Updated:** 2026-01-12
**Total Effort:** 12-18 days (2.5-4 sprints)

---

## Task Overview

| Phase | Tasks | Duration | Dependencies |
|-------|-------|----------|--------------|
| Phase 1: External Service Setup | 4 tasks | 2 days | None |
| Phase 2: Backend Services | 6 tasks | 4 days | Phase 1 |
| Phase 3: Publishing UI | 6 tasks | 3 days | Phase 2 |
| Phase 4: Build Pipeline | 5 tasks | 4 days | Phase 2, 3 |
| Phase 5: Testing & Deployment | 4 tasks | 5 days | All phases |

---

## Phase 1: External Service Setup (Day 1-2)

### Task 1.1: Create Apple Developer Account & API Keys
**Effort:** 3 hours (manual setup)
**Owner:** DevOps / Product Owner
**Priority:** P0

**Description:**
Set up Apple Developer account and generate App Store Connect API keys for testing.

**Acceptance Criteria:**
- [ ] Apple Developer account created ($99/year)
- [ ] Team ID obtained
- [ ] App Store Connect API key created
- [ ] Key ID and Issuer ID documented
- [ ] .p8 private key downloaded and secured
- [ ] Test credentials validated

**Documentation:**
- Save credentials to 1Password/LastPass
- Document in README or .env.example

---

### Task 1.2: Create Expo Account & Access Token
**Effort:** 1 hour
**Owner:** DevOps
**Priority:** P0

**Description:**
Set up Expo account and generate access token for Build Services.

**Acceptance Criteria:**
- [ ] Expo account created (free tier)
- [ ] Access token generated
- [ ] Token tested with API
- [ ] Billing configured (if needed)

---

### Task 1.3: Database Migration
**Effort:** 1 hour
**Owner:** Backend Developer
**Priority:** P0

**Description:**
Create Prisma migration for Publishing model.

**Acceptance Criteria:**
- [ ] Publishing model added to schema.prisma
- [ ] Migration generated and tested
- [ ] Indexes created for performance
- [ ] Rollback tested

**Commands:**
```bash
cd backend
npx prisma migrate dev --name add_publishing
npx prisma generate
```

---

### Task 1.4: Environment Variables
**Effort:** 30 minutes
**Owner:** Backend Developer
**Priority:** P0

**Description:**
Add publishing-related environment variables.

**Acceptance Criteria:**
- [ ] ENCRYPTION_KEY added (64-char hex)
- [ ] APPLE_* credentials (optional, for shared testing)
- [ ] EXPO_TOKEN (optional, for shared testing)
- [ ] .env.example updated

---

## Phase 2: Backend Services (Day 3-6)

### Task 2.1: Create AppleService
**Effort:** 6 hours
**Owner:** Backend Developer
**Priority:** P0
**Dependencies:** Task 1.1, 1.3

**Description:**
Implement Apple Developer API integration service.

**Acceptance Criteria:**
- [ ] generateJWT() for API authentication
- [ ] validateCredentials() tests credentials
- [ ] createApp() creates app in App Store Connect
- [ ] uploadBuild() submits .ipa file
- [ ] Error handling for API failures
- [ ] Unit tests (80% coverage)

**Files:**
- `backend/src/services/AppleService.ts`
- `backend/src/services/__tests__/AppleService.test.ts`

---

### Task 2.2: Create ExpoService
**Effort:** 4 hours
**Owner:** Backend Developer
**Priority:** P0
**Dependencies:** Task 1.2, 1.3

**Description:**
Implement Expo Build Services API integration.

**Acceptance Criteria:**
- [ ] validateToken() checks token validity
- [ ] startBuild() initiates iOS build
- [ ] getBuildStatus() polls build progress
- [ ] downloadBuild() retrieves .ipa
- [ ] Error handling
- [ ] Unit tests

**Files:**
- `backend/src/services/ExpoService.ts`
- `backend/src/services/__tests__/ExpoService.test.ts`

---

### Task 2.3: Create Encryption Utils
**Effort:** 2 hours
**Owner:** Backend Developer
**Priority:** P0
**Dependencies:** Task 1.4

**Description:**
Implement AES-256-GCM encryption for sensitive credentials.

**Acceptance Criteria:**
- [ ] encrypt() function
- [ ] decrypt() function
- [ ] Uses AES-256-GCM algorithm
- [ ] Auth tag validation
- [ ] Unit tests for edge cases

**Files:**
- `backend/src/utils/encryption.ts`
- `backend/src/utils/__tests__/encryption.test.ts`

---

### Task 2.4: Create PublishingService
**Effort:** 8 hours
**Owner:** Backend Developer
**Priority:** P0
**Dependencies:** Task 2.1, 2.2, 2.3

**Description:**
Implement orchestration service for publishing flow.

**Acceptance Criteria:**
- [ ] initiatePublishing() validates and creates record
- [ ] executeBuildAndSubmit() runs full pipeline
- [ ] pollBuildStatus() tracks Expo build progress
- [ ] downloadBuild() retrieves artifacts
- [ ] updateStatus() tracks progress
- [ ] generateBundleId() creates unique ID
- [ ] Encryption/decryption of credentials
- [ ] Integration tests

**Files:**
- `backend/src/services/PublishingService.ts`
- `backend/src/services/__tests__/PublishingService.test.ts`

---

### Task 2.5: Create Publishing Controller & Routes
**Effort:** 3 hours
**Owner:** Backend Developer
**Priority:** P0
**Dependencies:** Task 2.4

**Description:**
Create REST API endpoints for publishing.

**Acceptance Criteria:**
- [ ] POST /api/v1/publish/initiate
- [ ] GET /api/v1/publish/:id/status
- [ ] POST /api/v1/publish/:id/retry
- [ ] Auth middleware applied
- [ ] Validation middleware
- [ ] Error handling

**Files:**
- `backend/src/controllers/PublishingController.ts`
- `backend/src/routes/publishing.ts`

---

### Task 2.6: Create BullMQ Worker
**Effort:** 3 hours
**Owner:** Backend Developer
**Priority:** P0
**Dependencies:** Task 2.4

**Description:**
Create background worker for build and submit jobs.

**Acceptance Criteria:**
- [ ] 'build-and-submit' job handler
- [ ] Calls PublishingService.executeBuildAndSubmit()
- [ ] Retry logic (max 3 attempts)
- [ ] Error tracking
- [ ] Job progress updates

**Files:**
- `backend/src/workers/PublishingWorker.ts`

---

## Phase 3: Publishing UI (Day 7-9)

### Task 3.1: Create PublishingModal Component
**Effort:** 4 hours
**Owner:** Frontend Developer
**Priority:** P0
**Dependencies:** Phase 2 complete

**Description:**
Build main publishing modal with 4-step wizard.

**Acceptance Criteria:**
- [ ] Modal overlay with close button
- [ ] 4-step progress indicator
- [ ] Step navigation (Next/Back)
- [ ] State management for form data
- [ ] WebSocket integration for status updates
- [ ] Responsive design

**Files:**
- `turbocat-agent/components/turbocat/PublishingModal.tsx`

---

### Task 3.2: Create PrerequisitesStep
**Effort:** 2 hours
**Owner:** Frontend Developer
**Priority:** P0
**Dependencies:** Task 3.1

**Description:**
Build prerequisites checklist step.

**Acceptance Criteria:**
- [ ] Display checklist (4 items)
- [ ] "Learn more" links for each item
- [ ] "I have these" checkbox required
- [ ] Estimated time displayed

**Files:**
- `turbocat-agent/components/turbocat/publishing/PrerequisitesStep.tsx`

---

### Task 3.3: Create AppleCredentialsStep
**Effort:** 3 hours
**Owner:** Frontend Developer
**Priority:** P0
**Dependencies:** Task 3.1

**Description:**
Build Apple Developer credentials form.

**Acceptance Criteria:**
- [ ] Form fields: Team ID, Key ID, Issuer ID
- [ ] File upload for .p8 key
- [ ] "Where to find" help text
- [ ] Validation (required fields, format)
- [ ] Test credentials button
- [ ] Save for future checkbox

**Files:**
- `turbocat-agent/components/turbocat/publishing/AppleCredentialsStep.tsx`

---

### Task 3.4: Create ExpoTokenStep
**Effort:** 2 hours
**Owner:** Frontend Developer
**Priority:** P0
**Dependencies:** Task 3.1

**Description:**
Build Expo token setup step.

**Acceptance Criteria:**
- [ ] Options: "Sign in with Expo" OR "Paste token"
- [ ] OAuth flow for Expo (if implementing)
- [ ] Token input with validation
- [ ] "How to get token" instructions
- [ ] Test token button

**Files:**
- `turbocat-agent/components/turbocat/publishing/ExpoTokenStep.tsx`

---

### Task 3.5: Create AppDetailsStep
**Effort:** 4 hours
**Owner:** Frontend Developer
**Priority:** P0
**Dependencies:** Task 3.1

**Description:**
Build app details review and edit step.

**Acceptance Criteria:**
- [ ] App icon upload/display
- [ ] Form fields: name, description, category, age rating, support URL
- [ ] Bundle ID display (read-only)
- [ ] Validation for all fields
- [ ] Preview of app metadata
- [ ] Editable fields

**Files:**
- `turbocat-agent/components/turbocat/publishing/AppDetailsStep.tsx`

---

### Task 3.6: Create BuildingStep
**Effort:** 3 hours
**Owner:** Frontend Developer
**Priority:** P0
**Dependencies:** Task 3.1, Phase 2

**Description:**
Build status display component for build/submit process.

**Acceptance Criteria:**
- [ ] Progress bar with percentage
- [ ] Status messages (Building, Submitting, Success, Failed)
- [ ] Estimated time remaining
- [ ] Error display with retry button
- [ ] Success screen with next steps
- [ ] Link to App Store Connect

**Files:**
- `turbocat-agent/components/turbocat/publishing/BuildingStep.tsx`

---

## Phase 4: Build Pipeline Integration (Day 10-13)

### Task 4.1: Integrate Publish Button
**Effort:** 2 hours
**Owner:** Frontend Developer
**Priority:** P0
**Dependencies:** Task 3.1

**Description:**
Add "Publish" button to project page header.

**Acceptance Criteria:**
- [ ] Button visible in project header
- [ ] Disabled until project built
- [ ] Opens PublishingModal on click
- [ ] Tooltip explaining requirements

**Files:**
- `turbocat-agent/app/(dashboard)/project/[id]/page.tsx`

---

### Task 4.2: WebSocket Status Updates
**Effort:** 3 hours
**Owner:** Backend + Frontend Developer
**Priority:** P0
**Dependencies:** Task 2.6, 3.6

**Description:**
Implement real-time status updates via WebSocket.

**Acceptance Criteria:**
- [ ] Backend emits publishing-status events
- [ ] Frontend subscribes to project channel
- [ ] Status updates shown in BuildingStep
- [ ] Progress percentage updated
- [ ] Error messages displayed

**Files:**
- `backend/src/services/WebSocketService.ts`
- `turbocat-agent/lib/hooks/useSocket.ts`

---

### Task 4.3: Build Artifact Storage
**Effort:** 3 hours
**Owner:** Backend Developer
**Priority:** P1
**Dependencies:** Task 2.4

**Description:**
Implement S3/Cloudflare R2 storage for .ipa files.

**Acceptance Criteria:**
- [ ] Upload .ipa to S3 after build
- [ ] Generate signed download URL
- [ ] Store URL in publishing record
- [ ] Clean up artifacts after 7 days

**Files:**
- `backend/src/services/StorageService.ts`

---

### Task 4.4: Error Handling & Retry Logic
**Effort:** 4 hours
**Owner:** Backend Developer
**Priority:** P0
**Dependencies:** Task 2.4, 2.6

**Description:**
Implement comprehensive error handling and retry mechanism.

**Acceptance Criteria:**
- [ ] Retry failed builds (max 3 attempts)
- [ ] Exponential backoff between retries
- [ ] Detailed error messages
- [ ] Logs stored in buildLogs field
- [ ] Email notification on failure (optional)

**Files:**
- `backend/src/services/PublishingService.ts`
- `backend/src/workers/PublishingWorker.ts`

---

### Task 4.5: Build Timeout Handling
**Effort:** 2 hours
**Owner:** Backend Developer
**Priority:** P1
**Dependencies:** Task 2.4

**Description:**
Handle build timeouts gracefully.

**Acceptance Criteria:**
- [ ] Max build time: 20 minutes
- [ ] Timeout triggers failure state
- [ ] User notified of timeout
- [ ] Retry option available

**Files:**
- `backend/src/services/PublishingService.ts`

---

## Phase 5: Testing & Deployment (Day 14-18)

### Task 5.1: Integration Testing
**Effort:** 8 hours
**Owner:** Backend Developer
**Priority:** P0
**Dependencies:** All backend tasks

**Description:**
Write integration tests for publishing flow.

**Acceptance Criteria:**
- [ ] Test: Validate Apple credentials (valid/invalid)
- [ ] Test: Validate Expo token (valid/invalid)
- [ ] Test: Initiate publishing end-to-end
- [ ] Test: Poll build status (success/failure)
- [ ] Test: Retry failed builds
- [ ] All tests pass in CI

**Files:**
- `backend/src/__tests__/integration/PublishingFlow.test.ts`

---

### Task 5.2: E2E Testing
**Effort:** 8 hours
**Owner:** QA / Frontend Developer
**Priority:** P0
**Dependencies:** All frontend tasks

**Description:**
Write Playwright E2E tests for publishing UI.

**Acceptance Criteria:**
- [ ] Test: Open publishing modal
- [ ] Test: Complete all 4 steps
- [ ] Test: Submit and track status
- [ ] Test: Handle errors gracefully
- [ ] Test: Retry failed builds
- [ ] All tests pass

**Files:**
- `turbocat-agent/tests/e2e/publishing.spec.ts`

---

### Task 5.3: Manual QA with Real Credentials
**Effort:** 16 hours
**Owner:** QA + Product Owner
**Priority:** P0
**Dependencies:** Task 5.1, 5.2

**Description:**
Perform manual end-to-end testing with real Apple Developer and Expo accounts.

**Acceptance Criteria:**
- [ ] Test full flow with test app
- [ ] Verify build completes successfully
- [ ] Verify submission to App Store Connect
- [ ] Test all error scenarios
- [ ] Document bugs and edge cases

---

### Task 5.4: Performance & Security Audit
**Effort:** 8 hours
**Owner:** Senior Developer + Security Engineer
**Priority:** P0
**Dependencies:** Task 5.3

**Description:**
Audit performance and security of publishing system.

**Acceptance Criteria:**
- [ ] Load test: 10 concurrent publishes
- [ ] Verify credential encryption
- [ ] Check for credential leaks in logs
- [ ] Validate API rate limits
- [ ] Review error messages (no sensitive data)
- [ ] Fix any issues found

---

## Progress Tracking

### Phase 1: External Service Setup
- [ ] Task 1.1: Apple Developer Setup
- [ ] Task 1.2: Expo Setup
- [ ] Task 1.3: Database Migration
- [ ] Task 1.4: Environment Variables

### Phase 2: Backend Services
- [ ] Task 2.1: AppleService
- [ ] Task 2.2: ExpoService
- [ ] Task 2.3: Encryption Utils
- [ ] Task 2.4: PublishingService
- [ ] Task 2.5: Controller & Routes
- [ ] Task 2.6: BullMQ Worker

### Phase 3: Publishing UI
- [ ] Task 3.1: PublishingModal
- [ ] Task 3.2: PrerequisitesStep
- [ ] Task 3.3: AppleCredentialsStep
- [ ] Task 3.4: ExpoTokenStep
- [ ] Task 3.5: AppDetailsStep
- [ ] Task 3.6: BuildingStep

### Phase 4: Build Pipeline
- [ ] Task 4.1: Publish Button
- [ ] Task 4.2: WebSocket Updates
- [ ] Task 4.3: Artifact Storage
- [ ] Task 4.4: Error Handling
- [ ] Task 4.5: Timeout Handling

### Phase 5: Testing & Deployment
- [ ] Task 5.1: Integration Tests
- [ ] Task 5.2: E2E Tests
- [ ] Task 5.3: Manual QA
- [ ] Task 5.4: Security Audit

---

**Total Tasks:** 25
**Estimated Duration:** 12-18 days (2.5-4 sprints)
**Team Size:** 3-4 developers (2 backend, 1-2 frontend, 1 QA)

---

**Last Updated:** 2026-01-12
**Status:** Ready for Implementation
