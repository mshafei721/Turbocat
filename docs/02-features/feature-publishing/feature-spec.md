# Feature Specification: Publishing Flow

**Epic:** Publishing Flow
**Feature ID:** PUB-001
**Status:** Planned
**Priority:** P0 (Critical)
**Effort:** XLarge (12-18 days)
**Owner:** TBD

---

## Overview

Implement end-to-end publishing flow that guides users through building and submitting their mobile apps to the Apple App Store. This includes integrating with Apple Developer accounts, Expo build services, app icon generation, and automated submission. This is the **defining feature** that transforms Turbocat from a code generator into a complete app publishing platform.

---

## Business Context

### Problem
- Users can build apps but can't publish them (showstopper)
- Manual app submission is complex and error-prone (15+ steps)
- Expo/Apple Developer setup is confusing for non-technical users
- Competitors (Bubble, Glide) have automated publishing

### Opportunity
- Automated publishing is #1 requested feature (customer surveys)
- **Revenue opportunity:** Premium tier ($49/month) for unlimited publishing
- Reduces time-to-App-Store from 4 hours to 10 minutes
- Increases user success rate from 30% to 80%

### Success Metrics
- **Primary:** 70% of users successfully publish to App Store
- **Secondary:** Time from "Publish" click to App Store submission < 15 minutes
- **Quality:** < 5% failed builds
- **Conversion:** 40% of free users upgrade for publishing

---

## User Stories

### US-009: Initiate Publishing
**As a** user with a completed app
**I want to** click a "Publish" button to start the publishing process
**So that** I can get my app into the App Store

**Acceptance Criteria:**
- [ ] "Publish" button visible in project page header
- [ ] Button disabled until app has been built
- [ ] Clicking button opens publishing modal
- [ ] Modal shows 4-step progress indicator
- [ ] User can cancel at any time
- [ ] State saved if user closes modal

### US-010: Prerequisites Checklist
**As a** user starting to publish
**I want to** see what I need before I begin
**So that** I can gather required accounts and materials

**Acceptance Criteria:**
- [ ] Checklist displayed in modal:
  - [ ] Apple Developer Account ($99/year)
  - [ ] Expo Account (free)
  - [ ] App icon (1024x1024px)
  - [ ] App name and description
- [ ] Each item has "Learn more" link
- [ ] User must check "I have these" to proceed
- [ ] Modal shows estimated time (10-15 minutes)

### US-011: Apple Developer Sign-in
**As a** user ready to publish
**I want to** securely connect my Apple Developer account
**So that** the system can submit my app on my behalf

**Acceptance Criteria:**
- [ ] Form fields: Team ID, Key ID, Issuer ID, Private Key (.p8 file)
- [ ] "Where to find these" help text with screenshots
- [ ] File upload for .p8 key
- [ ] Validation: Key format, Team ID format
- [ ] Test connection before proceeding
- [ ] Secure storage (encrypted at rest)
- [ ] Option to save credentials for future apps

### US-012: Expo Token Setup
**As a** user who doesn't have an Expo account
**I want to** create one or provide my token
**So that** the system can use Expo Build Services

**Acceptance Criteria:**
- [ ] Options: "Sign in with Expo" OR "Paste token"
- [ ] OAuth flow for "Sign in with Expo"
- [ ] Token input field with validation
- [ ] "How to get your token" instructions
- [ ] Test token before proceeding
- [ ] Token stored securely

### US-013: App Icon Confirmation
**As a** user preparing my app for submission
**I want to** confirm my app icon looks correct
**So that** it appears properly in the App Store

**Acceptance Criteria:**
- [ ] Display generated/uploaded app icon
- [ ] Show preview in App Store context (various sizes)
- [ ] Option to upload custom icon
- [ ] Validation: 1024x1024px, PNG, no transparency
- [ ] Auto-generate from text if no icon provided
- [ ] Icon optimization (remove alpha channel)

### US-014: App Details Confirmation
**As a** user finalizing my app submission
**I want to** review and confirm all app metadata
**So that** everything is correct before submission

**Acceptance Criteria:**
- [ ] Display for review:
  - App name
  - Bundle ID (auto-generated)
  - Version (1.0.0)
  - Description
  - Category
  - Age rating
  - Support URL
- [ ] Editable fields
- [ ] Validation for each field
- [ ] "Submit to App Store" button
- [ ] Confirmation dialog before submission

---

## Functional Requirements

### Core Publishing Requirements
1. **FR-001:** System MUST integrate with Apple Developer API
2. **FR-002:** System MUST integrate with Expo Build Services
3. **FR-003:** System MUST securely store Apple Developer credentials
4. **FR-004:** System MUST validate credentials before use
5. **FR-005:** System MUST build iOS app bundle (.ipa)
6. **FR-006:** System MUST submit app to App Store Connect
7. **FR-007:** System MUST track build and submission status
8. **FR-008:** System MUST handle build failures gracefully

### Prerequisites Requirements
9. **FR-009:** System MUST display prerequisites checklist
10. **FR-010:** System MUST provide educational links
11. **FR-011:** System MUST enforce checklist completion

### Credentials Requirements
12. **FR-012:** System MUST accept Apple Developer credentials (Team ID, Key ID, Issuer ID, .p8 file)
13. **FR-013:** System MUST validate .p8 file format
14. **FR-014:** System MUST test Apple credentials before storage
15. **FR-015:** System MUST encrypt credentials at rest (AES-256)
16. **FR-016:** System MUST accept Expo access token
17. **FR-017:** System MUST validate Expo token

### App Icon Requirements
18. **FR-018:** System MUST accept custom app icon upload
19. **FR-019:** System MUST validate icon (1024x1024px PNG)
20. **FR-020:** System MUST remove alpha channel from icon
21. **FR-021:** System MUST generate icon from text if none provided
22. **FR-022:** System MUST show icon preview

### App Metadata Requirements
23. **FR-023:** System MUST auto-generate Bundle ID (com.turbocat.{projectname})
24. **FR-024:** System MUST validate app name (alphanumeric, 1-30 chars)
25. **FR-025:** System MUST validate description (10-4000 chars)
26. **FR-026:** System MUST provide category selector
27. **FR-027:** System MUST provide age rating selector
28. **FR-028:** System MUST validate support URL format

---

## Non-Functional Requirements

### Performance
- **NFR-001:** Expo build MUST complete in < 10 minutes (P95)
- **NFR-002:** Apple credential validation MUST complete in < 5 seconds
- **NFR-003:** App Store submission MUST complete in < 30 seconds

### Security
- **NFR-004:** Credentials MUST be encrypted with AES-256
- **NFR-005:** .p8 file MUST be deleted after use
- **NFR-006:** Credentials MUST NOT be logged
- **NFR-007:** API keys MUST be rotated quarterly

### Reliability
- **NFR-008:** Build failure rate MUST be < 5%
- **NFR-009:** System MUST retry failed builds (max 3 attempts)
- **NFR-010:** System MUST provide clear error messages

### Compliance
- **NFR-011:** System MUST comply with Apple Developer Terms
- **NFR-012:** System MUST comply with Expo Terms of Service
- **NFR-013:** System MUST store user consent for credential usage

---

## User Flow

### Complete Publishing Flow
```
1. User clicks "Publish" button in project header
2. System checks if project has been built
3. Modal opens showing 4-step progress indicator
4. STEP 1: Prerequisites Checklist
   - User reviews checklist
   - User checks "I have these requirements"
   - User clicks "Next"
5. STEP 2: Apple Developer Credentials
   - User enters Team ID, Key ID, Issuer ID
   - User uploads .p8 file
   - System validates credentials (test API call)
   - If valid, proceed; if invalid, show error
   - User clicks "Next"
6. STEP 3: Expo Token Setup
   - User chooses: "Sign in with Expo" or "Paste token"
   - If sign in: OAuth flow completes, token retrieved
   - If paste: User enters token, system validates
   - User clicks "Next"
7. STEP 4: App Details & Icon
   - System shows generated app icon
   - User confirms or uploads custom icon
   - User reviews app metadata (name, description, etc.)
   - User edits if needed
   - User clicks "Submit to App Store"
8. Confirmation Dialog
   - "Are you sure? This will submit to App Store."
   - User confirms
9. Background Process Begins
   - Modal shows: "Building your app... (5-10 minutes)"
   - System queues Expo build job
   - System polls build status every 30 seconds
10. Build Complete
   - Modal shows: "Submitting to App Store..."
   - System submits .ipa to App Store Connect
   - System polls submission status
11. Submission Complete
   - Modal shows: "Success! Your app is now under review."
   - Next steps displayed:
     - "Review typically takes 1-2 days"
     - "We'll email you when it's approved"
     - Link to App Store Connect
12. User closes modal, returns to project
```

### Error Flow
```
1. If Apple credentials invalid:
   - Show error: "Invalid credentials. Check Team ID, Key ID, and .p8 file."
   - Remain on Step 2

2. If Expo build fails:
   - Show error: "Build failed: [error message]"
   - Options: "Retry" | "View logs" | "Contact support"
   - If retry, restart from Step 4

3. If App Store submission fails:
   - Show error: "Submission failed: [error message]"
   - Options: "Retry" | "View logs" | "Contact support"
```

---

## UI/UX Specifications

### Publishing Modal Design
```
┌────────────────────────────────────────────────────────────┐
│  ✕  Publish to App Store                                   │
│                                                             │
│  ●─────○─────○─────○                                       │
│  Prerequisites  Apple  Expo  Review                         │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Before you begin, make sure you have:              │  │
│  │                                                      │  │
│  │  ☐ Apple Developer Account ($99/year)               │  │
│  │     → Learn more                                     │  │
│  │                                                      │  │
│  │  ☐ Expo Account (free)                              │  │
│  │     → Learn more                                     │  │
│  │                                                      │  │
│  │  ☐ App icon (1024x1024px PNG)                       │  │
│  │     → Design tips                                    │  │
│  │                                                      │  │
│  │  ☐ App name and description                         │  │
│  │                                                      │  │
│  │  ☑ I have these requirements                         │  │
│  │                                                      │  │
│  │  ⏱️  Estimated time: 10-15 minutes                   │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  [Cancel]                                      [Next] →     │
└────────────────────────────────────────────────────────────┘
```

### Apple Developer Credentials Step
```
┌────────────────────────────────────────────────────────────┐
│  ✕  Publish to App Store                                   │
│                                                             │
│  ●─────●─────○─────○                                       │
│  Prerequisites  Apple  Expo  Review                         │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Connect your Apple Developer Account                │  │
│  │                                                      │  │
│  │  Team ID:                                            │  │
│  │  [________________]   ⓘ Where to find this           │  │
│  │                                                      │  │
│  │  Key ID:                                             │  │
│  │  [________________]   ⓘ Where to find this           │  │
│  │                                                      │  │
│  │  Issuer ID:                                          │  │
│  │  [________________]   ⓘ Where to find this           │  │
│  │                                                      │  │
│  │  Private Key (.p8 file):                            │  │
│  │  [📎 Upload file...]   AuthKey_ABC123.p8            │  │
│  │                                                      │  │
│  │  ☑ Save credentials for future apps                  │  │
│  │                                                      │  │
│  │  🔒 Your credentials are encrypted and secure        │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  [← Back]                                      [Next] →     │
└────────────────────────────────────────────────────────────┘
```

### App Details Confirmation Step
```
┌────────────────────────────────────────────────────────────┐
│  ✕  Publish to App Store                                   │
│                                                             │
│  ●─────●─────●─────●                                       │
│  Prerequisites  Apple  Expo  Review                         │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Review your app details                             │  │
│  │                                                      │  │
│  │  ┌──────┐                                            │  │
│  │  │ ICON │   Your app icon                            │  │
│  │  └──────┘   [Change]                                 │  │
│  │                                                      │  │
│  │  App Name:                                           │  │
│  │  [Mood Tracker App____________]                      │  │
│  │                                                      │  │
│  │  Bundle ID:                                          │  │
│  │  com.turbocat.moodtracker  (auto-generated)         │  │
│  │                                                      │  │
│  │  Version:                                            │  │
│  │  1.0.0                                               │  │
│  │                                                      │  │
│  │  Description:                                        │  │
│  │  [Track your daily mood and...]                     │  │
│  │                                                      │  │
│  │  Category:  [Health & Fitness ▼]                     │  │
│  │  Age Rating: [4+ ▼]                                  │  │
│  │                                                      │  │
│  │  Support URL:                                        │  │
│  │  [https://turbocat.ai/support]                       │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  [← Back]                     [Submit to App Store] →       │
└────────────────────────────────────────────────────────────┘
```

---

## Technical Approach

### Apple Developer Integration

**App Store Connect API:**
```typescript
// backend/src/services/AppleService.ts

import jwt from 'jsonwebtoken';
import axios from 'axios';

export class AppleService {
  async validateCredentials(
    teamId: string,
    keyId: string,
    issuerId: string,
    privateKey: string
  ): Promise<boolean> {
    try {
      const token = this.generateJWT(keyId, issuerId, privateKey);
      const res = await axios.get('https://api.appstoreconnect.apple.com/v1/apps', {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.status === 200;
    } catch (error) {
      return false;
    }
  }

  async createApp(metadata: AppMetadata, credentials: AppleCredentials) {
    const token = this.generateJWT(
      credentials.keyId,
      credentials.issuerId,
      credentials.privateKey
    );

    const res = await axios.post(
      'https://api.appstoreconnect.apple.com/v1/apps',
      {
        data: {
          type: 'apps',
          attributes: {
            name: metadata.name,
            bundleId: metadata.bundleId,
            primaryLocale: 'en-US',
          },
        },
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return res.data;
  }

  async uploadBuild(ipaPath: string, credentials: AppleCredentials) {
    // Use altool or transporter API
    const command = `xcrun altool --upload-app -f ${ipaPath} -t ios --apiKey ${credentials.keyId} --apiIssuer ${credentials.issuerId}`;
    // Execute command
  }

  private generateJWT(keyId: string, issuerId: string, privateKey: string): string {
    const token = jwt.sign({}, privateKey, {
      algorithm: 'ES256',
      expiresIn: '20m',
      issuer: issuerId,
      header: {
        alg: 'ES256',
        kid: keyId,
        typ: 'JWT',
      },
    });
    return token;
  }
}
```

### Expo Build Integration

```typescript
// backend/src/services/ExpoService.ts

import axios from 'axios';

export class ExpoService {
  private apiUrl = 'https://api.expo.dev/v2';

  async validateToken(token: string): Promise<boolean> {
    try {
      const res = await axios.get(`${this.apiUrl}/auth/loginAsync`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.status === 200;
    } catch (error) {
      return false;
    }
  }

  async startBuild(
    projectId: string,
    platform: 'ios' | 'android',
    token: string
  ): Promise<string> {
    const res = await axios.post(
      `${this.apiUrl}/builds`,
      {
        platform,
        projectId,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return res.data.id; // Build ID
  }

  async getBuildStatus(buildId: string, token: string): Promise<BuildStatus> {
    const res = await axios.get(`${this.apiUrl}/builds/${buildId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    return {
      status: res.data.status, // 'in-progress' | 'finished' | 'errored'
      artifactUrl: res.data.artifacts?.buildUrl,
      error: res.data.error,
    };
  }
}
```

### Publishing Service Orchestration

```typescript
// backend/src/services/PublishingService.ts

export class PublishingService {
  constructor(
    private appleService: AppleService,
    private expoService: ExpoService,
    private prisma: PrismaClient,
    private publishQueue: Queue
  ) {}

  async initiatePublishing(
    userId: string,
    projectId: string,
    publishData: PublishData
  ): Promise<PublishingJob> {
    // Validate project exists
    const project = await this.prisma.workflow.findFirst({
      where: { id: projectId, userId, deletedAt: null },
    });

    if (!project) {
      throw new Error('Project not found');
    }

    // Create publishing record
    const publishing = await this.prisma.publishing.create({
      data: {
        workflowId: projectId,
        status: 'INITIATED',
        appleTeamId: publishData.appleTeamId,
        appleKeyId: publishData.appleKeyId,
        appleIssuerId: publishData.appleIssuerId,
        expoToken: await this.encrypt(publishData.expoToken),
        appName: publishData.appName,
        bundleId: this.generateBundleId(publishData.appName),
        version: '1.0.0',
        description: publishData.description,
        category: publishData.category,
        ageRating: publishData.ageRating,
        iconUrl: publishData.iconUrl,
      },
    });

    // Queue build job
    await this.publishQueue.add('build-and-submit', {
      publishingId: publishing.id,
      projectId,
      userId,
    });

    return publishing;
  }

  async executeBuildAndSubmit(publishingId: string) {
    const publishing = await this.prisma.publishing.findUnique({
      where: { id: publishingId },
      include: { workflow: true },
    });

    if (!publishing) throw new Error('Publishing record not found');

    try {
      // Update status: Building
      await this.updateStatus(publishingId, 'BUILDING');

      // Start Expo build
      const buildId = await this.expoService.startBuild(
        publishing.workflow.id,
        'ios',
        await this.decrypt(publishing.expoToken!)
      );

      await this.prisma.publishing.update({
        where: { id: publishingId },
        data: { expoBuildId: buildId },
      });

      // Poll build status
      const buildStatus = await this.pollBuildStatus(buildId, publishing.expoToken!);

      if (buildStatus.status === 'errored') {
        throw new Error(buildStatus.error || 'Build failed');
      }

      // Download .ipa
      const ipaPath = await this.downloadBuild(buildStatus.artifactUrl!);

      // Update status: Submitting
      await this.updateStatus(publishingId, 'SUBMITTING');

      // Upload to App Store Connect
      await this.appleService.uploadBuild(ipaPath, {
        keyId: publishing.appleKeyId!,
        issuerId: publishing.appleIssuerId!,
        privateKey: await this.decrypt(publishing.applePrivateKey!),
      });

      // Update status: Submitted
      await this.updateStatus(publishingId, 'SUBMITTED');

      // Clean up
      await fs.unlink(ipaPath);
    } catch (error) {
      await this.updateStatus(publishingId, 'FAILED', error.message);
      throw error;
    }
  }

  private generateBundleId(appName: string): string {
    const sanitized = appName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .slice(0, 20);
    return `com.turbocat.${sanitized}`;
  }

  private async pollBuildStatus(
    buildId: string,
    token: string
  ): Promise<BuildStatus> {
    let attempts = 0;
    const maxAttempts = 40; // 20 minutes (30s intervals)

    while (attempts < maxAttempts) {
      const status = await this.expoService.getBuildStatus(buildId, token);

      if (status.status === 'finished' || status.status === 'errored') {
        return status;
      }

      await new Promise((resolve) => setTimeout(resolve, 30000)); // 30s
      attempts++;
    }

    throw new Error('Build timeout');
  }
}
```

---

## Dependencies

### External Services
- **Apple Developer API** - App Store Connect API
- **Expo Build Services** - Cloud build infrastructure
- **Icon Generator** - Custom icon generation service

### Internal Dependencies
- **Workflow Model** - Project data
- **BullMQ Queue** - Async job processing
- **Redis** - Build status caching
- **S3/Cloudflare** - .ipa artifact storage

---

## Rollout Plan

### Phase 1: Apple & Expo Integration (5 days)
- Implement Apple Developer API integration
- Implement Expo Build Service integration
- Credential validation and storage

### Phase 2: Publishing UI (4 days)
- Build publishing modal with 4 steps
- Prerequisites checklist
- Credentials forms
- App details form

### Phase 3: Build Pipeline (5 days)
- Queue system for builds
- Status polling and updates
- Error handling and retries
- Real-time status via WebSocket

### Phase 4: Testing & Polish (4 days)
- End-to-end testing with real accounts
- Error handling refinement
- UI polish and animations

---

## Success Criteria

### Launch Criteria
- [ ] Apple Developer credentials validated
- [ ] Expo builds complete successfully
- [ ] App Store submission functional
- [ ] Error handling comprehensive
- [ ] < 5% build failure rate in staging

### Post-Launch
- [ ] 70% users successfully publish
- [ ] Avg time to submission < 15 minutes
- [ ] < 5% failed builds
- [ ] User satisfaction > 4.5/5

---

## Risks & Mitigation

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Expo build failures | Critical | Medium | Retry logic, detailed error messages, support team |
| Apple API rate limits | High | Low | Request limit increase, queue management |
| Credential security breach | Critical | Very Low | AES-256 encryption, audit logs, rotation |
| Build timeout (>20min) | High | Low | Optimize build config, CDN for dependencies |

---

## References

- UI Reference: `vibe code app publish menu after clicking publish button.png`
- [Apple App Store Connect API](https://developer.apple.com/documentation/appstoreconnectapi)
- [Expo Build API](https://docs.expo.dev/build/eas-json/)

---

**Last Updated:** 2026-01-12
**Status:** Ready for Technical Design
