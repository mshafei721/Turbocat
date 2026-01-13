# IMPLEMENTATION TASKS
## Turbocat - 6 Epic Brownfield Implementation

**Total Tasks:** 82 tasks
**Total Effort:** 220 person-days (352-440 hours)
**Timeline:** 40-50 days

---

## EPIC 1: Authentication & OAuth
**Total:** 8 tasks, 16-20 hours, 3-4 days

### T1.1: Prisma Schema Migration for OAuth (2h)
- Add oauth fields to User model
- Create migration
- **AC:** Migration successful, no data loss

### T1.2: OAuth Service Implementation (4h)
- Install Passport.js + strategies
- Create OAuthService with generateAuthUrl, handleCallback, getUserProfile
- **AC:** All 3 providers return user data

### T1.3: OAuth Auth Routes (3h)
- Add GET /api/v1/auth/oauth/:provider
- Add GET /api/v1/auth/oauth/:provider/callback
- **AC:** OAuth flow completes, JWT issued

### T1.4: OAuth Middleware & Security (2h)
- CSRF protection (state parameter)
- Rate limiting (5 attempts/min)
- **AC:** No vulnerabilities

### T1.5: OAuth Button Components (2h)
- Create OAuthButton component
- Provider logos
- **AC:** Buttons redirect correctly

### T1.6: OAuth Callback Page (2h)
- Create /app/(auth)/oauth/callback/page.tsx
- Store JWT tokens
- **AC:** End-to-end flow works

### T1.7: Settings OAuth Connection UI (2h)
- OAuth management in settings
- Disconnect with lockout prevention
- **AC:** Users can manage connections

### T1.8: OAuth Integration Tests (3h)
- Unit + integration tests
- Manual testing with real providers
- **AC:** All flows pass

---

## EPIC 2: Dashboard & Projects
**Total:** 31 tasks, 80-100 hours, 10-15 days

### Phase 1: Core Dashboard (6 tasks, 24h)

### T2.1: Workflow Model Extension (3h)
- Add projectName, platform, selectedModel, previewCode fields
- **AC:** Migration successful

### T2.2: ChatMessage Model Creation (2h)
- New ChatMessage model
- Migrate ExecutionLog to ChatMessage
- **AC:** Table created, data migrated

### T2.3: Project API Wrapper (4h)
- Create /api/v1/projects routes
- Workflow → Project DTO transformation
- **AC:** All endpoints work

### T2.4: Chat History API (3h)
- GET/POST /api/v1/projects/:id/chat
- Trigger execution on message
- **AC:** Messages persist

### T2.5: Dashboard UI Redesign (8h)
- Grid layout with ProjectCard
- Search bar
- **AC:** Matches VibeCode design

### T2.6: Project Search & Filtering (4h)
- Client-side filtering
- Platform/sort filters
- **AC:** <100ms response

### Phase 2: Project Creation (4 tasks, 16h)

### T2.7: New Project Page (6h)
- Large prompt input
- Platform/model selectors
- **AC:** Form validates

### T2.8: Project Creation Service (5h)
- POST /api/v1/projects handler
- BullMQ job queue
- **AC:** Project created, execution queued

### T2.9: Loading & Redirect (2h)
- Progress polling
- Optimistic navigation
- **AC:** Immediate feedback

### T2.10: Suggested Prompts (3h)
- Horizontal chip row
- Pre-fill on click
- **AC:** Suggestions clickable

### Phase 3: Chat Persistence (3 tasks, 16h)

### T2.11: ChatPanel Component (8h)
- User/assistant messages
- Markdown + code highlighting
- **AC:** Messages render correctly

### T2.12: ChatInput Component (4h)
- Auto-resize textarea
- Optimistic rendering
- **AC:** Keyboard shortcuts work

### T2.13: Chat WebSocket Integration (4h)
- Socket.IO server setup
- Real-time events
- **AC:** No polling needed

### Phase 4: Real-Time Preview (6 tasks, 32h)

### T2.14: Preview Service Setup (8h)
- PreviewService with caching
- Code bundling (esbuild)
- **AC:** Bundles generated

### T2.15: Expo Snack Integration (8h)
- Expo Snack API
- Create/update Snack
- **AC:** Mobile preview renders

### T2.16: MobilePreview Component (8h)
- iPhone frame
- Loading/error states
- **AC:** Preview in frame

### T2.17: Device Frame Selector (2h)
- iPhone/Pixel options
- Portrait/landscape toggle
- **AC:** Frame switches

### T2.18: Expo Go QR Code (3h)
- QR code modal
- Expo Go deeplink
- **AC:** Scannable QR

### T2.19: Preview Update WebSocket (3h)
- Emit preview:update events
- Debounced updates
- **AC:** Real-time updates

### Phase 5: Polish (4 tasks, 12h)

### T2.20: Loading States (3h)
- Skeletons, spinners, progress
- **AC:** No blank screens

### T2.21: Error Handling (3h)
- Clear error messages
- Retry mechanisms
- **AC:** Graceful failures

### T2.22: Performance Optimization (3h)
- Bundle minification
- Redis caching
- **AC:** <1s dashboard, <500ms preview

### T2.23: Integration Testing (3h)
- E2E test full flow
- WebSocket reconnection
- **AC:** 90%+ preview accuracy

---

## EPIC 3: Editing & Iteration Tools
**Total:** 7 tasks, 24-32 hours, 3-5 days

### T3.1: Suggestion Service (6h)
- Contextual analysis
- Starter + contextual suggestions
- **AC:** <100ms response

### T3.2: Suggestions API (2h)
- GET /api/v1/projects/:id/suggestions
- Redis caching (5 min TTL)
- **AC:** Fast responses

### T3.3: SuggestedPrompts Component (6h)
- Horizontal chip row
- Dynamic updates
- **AC:** Smooth animations

### T3.4: Testing (2h)
- Starter + contextual tests
- Cache verification
- **AC:** Relevant suggestions

### T3.5: AdvancedToolbar Component (6h)
- 12 icons with tooltips
- Collapsible state
- **AC:** All icons functional

### T3.6: Configuration Panels (8h)
- 12 panels: Image, Audio, API, Payment, Cloud, Haptics, File, Env, Logs, UI, Select, Request
- Form validation
- **AC:** Generate correct prompts

### T3.7: Keyboard Shortcuts (2h)
- Cmd+Shift+<Key> shortcuts
- No conflicts
- **AC:** All shortcuts work

---

## EPIC 4: Publishing Flow
**Total:** 30 tasks, 96-128 hours, 12-18 days

### Phase 1: Apple Developer (10 tasks, 40h)

### T4.1: Apple Service Setup (4h)
- AppleService with JWT generation
- **AC:** JWT valid

### T4.2: Credential Storage (3h)
- AES-256 encryption
- Add fields to User model
- **AC:** Credentials encrypted

### T4.3: Apple API Integration (6h)
- createApp, uploadBuild, submitForReview
- **AC:** All methods work

### T4.4: JWT Generation (2h)
- ES256 algorithm
- 15-min caching
- **AC:** JWT accepted by Apple

### T4.5: App Creation (4h)
- Unique bundle ID generation
- **AC:** Apps created

### T4.6: Build Upload (6h)
- IPA upload via Transporter
- Status polling
- **AC:** Upload successful

### T4.7: Submission (4h)
- Collect metadata
- Submit for review
- **AC:** App in review queue

### T4.8: Status Polling (3h)
- Poll every 30s
- WebSocket updates
- **AC:** Real-time status

### T4.9: Error Handling (4h)
- Comprehensive error messages
- Retry logic
- **AC:** Errors handled

### T4.10: Testing (4h)
- Real Apple account test
- **AC:** App submitted successfully

### Phase 2: Expo Build (8 tasks, 32h)

### T4.11: Expo Service Setup (4h)
- ExpoService with build API
- **AC:** Service initialized

### T4.12: Expo Token Validation (3h)
- Validate Expo access tokens
- **AC:** Valid tokens accepted

### T4.13: Build Triggering (5h)
- Trigger EAS builds
- **AC:** Builds start

### T4.14: Status Polling (3h)
- Poll build status
- **AC:** Status updates

### T4.15: Artifact Download (4h)
- Download IPA from Expo
- **AC:** IPA downloaded

### T4.16: Error Handling (3h)
- Build failure recovery
- **AC:** Errors handled

### T4.17: Webhook Integration (6h)
- Expo webhook endpoint
- **AC:** Real-time notifications

### T4.18: Testing (4h)
- Full Expo build test
- **AC:** IPA generated

### Phase 3: Publishing UI (8 tasks, 32h)

### T4.19: Publishing Modal (6h)
- Multi-step modal
- **AC:** All steps functional

### T4.20: Prerequisites Checklist (4h)
- Required item checks
- **AC:** Validation works

### T4.21: Apple Credentials Form (5h)
- Team ID, Key ID, Private Key inputs
- **AC:** Credentials stored

### T4.22: Expo Token Form (3h)
- Expo access token input
- **AC:** Token validated

### T4.23: App Details Form (6h)
- Name, icon, description inputs
- **AC:** Metadata saved

### T4.24: Icon Upload (3h)
- 1024x1024 PNG upload
- **AC:** Icon uploaded

### T4.25: Progress Tracking (3h)
- Real-time progress bar
- **AC:** Accurate progress

### T4.26: Success/Error States (2h)
- Clear messaging
- **AC:** States display correctly

### Phase 4: Testing (4 tasks, 16h)

### T4.27: End-to-End Testing (6h)
- Full publishing flow
- **AC:** App submitted

### T4.28: Error Handling (4h)
- All error paths tested
- **AC:** Recovery works

### T4.29: UI Polish (3h)
- Visual improvements
- **AC:** Professional UI

### T4.30: Production Validation (3h)
- Real apps published
- **AC:** <5% failure rate

---

## EPIC 5: Settings & Account Management
**Total:** 6 tasks, 16-24 hours, 2-3 days

### T5.1: User Update API (3h)
- PATCH /api/v1/users/:id
- Password change endpoint
- **AC:** Updates work

### T5.2: Avatar Upload (3h)
- S3/R2 integration
- 256x256 resize
- **AC:** Avatars stored

### T5.3: Email Verification (2h)
- Token generation
- Verification endpoint
- **AC:** Verification works

### T5.4: Settings Page (6h)
- 4 tabs: Profile, Security, OAuth, Danger Zone
- **AC:** All sections functional

### T5.5: Account Deletion Flow (2h)
- Confirmation modal
- Soft delete
- **AC:** Deletion works

### T5.6: Settings Testing (4h)
- All settings features tested
- **AC:** No regressions

---

## EPIC 6: Referral & Monetization
**Total:** 8 tasks, 32-40 hours, 4-5 days

### T6.1: Referral Code Generation (4h)
- Unique 8-char codes (nanoid)
- Add referralCode field
- **AC:** All users have codes

### T6.2: Referral Tracking (6h)
- Cookie-based tracking (30-day expiry)
- Signup attribution
- **AC:** Referrals attributed

### T6.3: Reward System (4h)
- 1 free month for referrer
- 20% discount for referee
- **AC:** Rewards applied

### T6.4: Referral API (2h)
- GET /api/v1/users/:id/referrals
- POST /api/v1/referrals/track-click
- **AC:** API returns stats

### T6.5: Referral Page (8h)
- Referral link display
- Copy/share buttons
- Stats display
- **AC:** All features work

### T6.6: Referral Link Handling (2h)
- Parse ?ref= query param
- Set cookie
- **AC:** Links work

### T6.7: Notifications (2h)
- Email notifications
- In-app badges
- **AC:** Notifications sent

### T6.8: Referral Testing (4h)
- Full flow testing
- Abuse prevention testing
- **AC:** All flows secure

---

**Task Summary by Epic:**
- Epic 1 (OAuth): 8 tasks
- Epic 2 (Dashboard): 31 tasks
- Epic 3 (Editing): 7 tasks
- Epic 4 (Publishing): 30 tasks
- Epic 5 (Settings): 6 tasks
- Epic 6 (Referral): 8 tasks
- **Total: 90 tasks** (compressed to 82 in execution)

**Next Step:** Create STATUS.md to track task completion
