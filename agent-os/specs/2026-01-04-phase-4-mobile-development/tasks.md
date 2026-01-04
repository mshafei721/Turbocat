# Phase 4: Mobile Development - Task Breakdown

**Spec Folder:** `agent-os/specs/2026-01-04-phase-4-mobile-development`
**Created:** 2026-01-04
**Status:** Ready for Implementation (after Phase 2 & 3 completion)

---

## Overview

This document breaks down Phase 4 into actionable, testable tasks organized into logical implementation phases. Each task includes acceptance criteria, complexity estimates, and testing requirements.

**Total Estimated Timeline:** 8-12 weeks

**Critical Dependencies:**
- ✅ Phase 2 (Design System) must be complete
- ✅ Phase 3 (Skills & MCP) must be complete
- ✅ Railway.app POC must validate feasibility

---

## Phase 0: Pre-Implementation Validation (BLOCKER)

**Timeline:** 3-5 days
**Must complete before any other tasks**

### Task 0.1: Railway.app Proof of Concept

**Description:** Build and test a minimal Expo application running in Railway.app Docker container with Metro bundler exposed via public URL and QR code working with Expo Go.

**Acceptance Criteria:**
- [ ] Railway account created and Docker container deployed
- [ ] Expo app initialized with default template
- [ ] Metro bundler starts successfully in container
- [ ] Public HTTPS URL accessible from Railway
- [ ] QR code generated from Railway URL
- [ ] Expo Go successfully connects via QR code (iOS and Android tested)
- [ ] Hot reloading works (change code, see update in <5 seconds)
- [ ] Container startup time measured (<2 minutes acceptable)
- [ ] Resource usage logged (RAM, CPU, network)
- [ ] Cost estimate calculated for 10-20 concurrent projects
- [ ] Container cleanup tested (stop/start/delete)
- [ ] Documentation created with findings

**Effort:** `M` (1 week)

**Testing:**
- Manual: Test QR code scanning on iOS and Android physical devices
- Performance: Measure Metro bundler startup time, hot reload latency
- Reliability: Test container restart, error recovery
- Cost: Monitor Railway usage metrics for 48 hours

**Blockers:**
- None (this is the first task)

**Success Metrics:**
- Metro bundler starts in <2 minutes
- Hot reload works in <5 seconds
- Expo Go connects successfully 100% of time
- Estimated cost aligns with $100-200/month for 10-20 projects

**Deliverables:**
- `POC-REPORT.md` with findings, screenshots, metrics
- Railway Docker configuration files
- Cost breakdown spreadsheet
- Go/no-go decision for Railway.app as primary solution

---

### Task 0.2: Railway Infrastructure Planning

**Description:** Based on POC results, plan Railway.app infrastructure including API integration, container lifecycle management, environment configuration, and cost optimization strategies.

**Acceptance Criteria:**
- [ ] Railway API integration plan documented
- [ ] Container lifecycle management strategy defined (start, stop, cleanup)
- [ ] Environment variables configuration documented
- [ ] Cost optimization strategies identified (auto-shutdown, resource limits)
- [ ] Security considerations documented (network isolation, secrets management)
- [ ] Monitoring and logging strategy defined
- [ ] Error handling and fallback scenarios documented
- [ ] Scaling strategy defined (concurrent projects, resource allocation)

**Effort:** `S` (2-3 days)

**Testing:**
- Review: Architecture review with team
- Documentation: Validate completeness of planning docs

**Blockers:**
- Task 0.1 must be complete

**Deliverables:**
- `RAILWAY-ARCHITECTURE.md` with detailed infrastructure plan
- API integration pseudocode/examples
- Cost optimization playbook
- Security checklist

---

## Phase 1: Database & Schema Extensions

**Timeline:** 1 week
**Can start after Phase 2 completion**

### Task 1.1: Extend Tasks Table Schema

**Description:** Add platform, metro_url, and container_id columns to tasks table with proper types, constraints, and indexes.

**Acceptance Criteria:**
- [ ] Migration script created for new columns:
  - `platform TEXT CHECK(platform IN ('web', 'mobile'))` with default 'web'
  - `metro_url TEXT` nullable
  - `container_id TEXT` nullable, unique when not null
- [ ] Indexes added for performance (platform, container_id)
- [ ] Drizzle ORM schema updated in `lib/db/schema.ts`
- [ ] Zod validation schemas updated (insertTaskSchema, selectTaskSchema)
- [ ] TypeScript types updated
- [ ] Migration tested on dev database
- [ ] Rollback migration created and tested
- [ ] Existing tasks migrated with default platform='web'

**Effort:** `S` (2-3 days)

**Testing:**
- Unit: Test Zod schemas validate platform enum correctly
- Integration: Test migration runs without errors
- E2E: Create task with platform='mobile', verify schema validation
- Rollback: Test rollback migration restores original schema

**Blockers:**
- None (database work can start independently)

**SQL Example:**
```sql
ALTER TABLE tasks
ADD COLUMN platform TEXT CHECK(platform IN ('web', 'mobile')) DEFAULT 'web',
ADD COLUMN metro_url TEXT,
ADD COLUMN container_id TEXT UNIQUE;

CREATE INDEX idx_tasks_platform ON tasks(platform);
CREATE INDEX idx_tasks_container_id ON tasks(container_id);
```

---

### Task 1.2: Extend Components Table for Mobile Platform

**Description:** Add platform tag/column to components table to support filtering Component Gallery by web vs mobile components.

**Acceptance Criteria:**
- [ ] Migration script adds platform column to components table
- [ ] Platform enum supports 'web', 'mobile', 'universal' values
- [ ] Default value set to 'web' for existing components
- [ ] Drizzle ORM schema updated
- [ ] Zod validation updated
- [ ] Component API updated to filter by platform
- [ ] Migration tested and rollback created

**Effort:** `XS` (1 day)

**Testing:**
- Unit: Test platform filtering in component queries
- Integration: Test migration on dev database
- E2E: Query components by platform='mobile'

**Blockers:**
- Requires Phase 2 Component Gallery schema to exist

---

### Task 1.3: Create Railway Container Registry Table

**Description:** Create new table to track active Railway containers for lifecycle management, cost monitoring, and cleanup.

**Acceptance Criteria:**
- [ ] Table schema designed with columns:
  - id (primary key)
  - user_id (foreign key to users)
  - task_id (foreign key to tasks)
  - container_id (Railway container ID)
  - metro_url (public HTTPS URL)
  - status (enum: starting, running, stopped, error)
  - created_at, updated_at, last_activity_at
  - resource_usage (jsonb: CPU, RAM, network)
- [ ] Indexes created for queries (user_id, status, last_activity_at)
- [ ] Foreign key constraints configured
- [ ] Drizzle schema and types created
- [ ] Migration script created and tested

**Effort:** `S` (2-3 days)

**Testing:**
- Unit: Test container registry CRUD operations
- Integration: Test foreign key constraints
- E2E: Create container record, query by user

**Blockers:**
- None

**Schema Example:**
```typescript
export const railwayContainers = pgTable('railway_containers', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id),
  taskId: uuid('task_id').notNull().references(() => tasks.id),
  containerId: text('container_id').notNull().unique(),
  metroUrl: text('metro_url').notNull(),
  status: text('status').notNull().default('starting'), // starting, running, stopped, error
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  lastActivityAt: timestamp('last_activity_at').notNull().defaultNow(),
  resourceUsage: jsonb('resource_usage'), // { cpu, ram, network }
});
```

---

## Phase 2: UI Components & Platform Selector

**Timeline:** 2 weeks

### Task 2.1: Platform Selector Component

**Description:** Create platform toggle/dropdown component in chat interface allowing users to select "Web" or "Mobile" before task creation.

**Acceptance Criteria:**
- [ ] Platform selector UI component created (toggle or dropdown)
- [ ] Component uses shadcn/ui Select or ToggleGroup
- [ ] Options: "Web" (default), "Mobile"
- [ ] Visual icons for each platform (monitor icon for web, phone icon for mobile)
- [ ] Selected platform persisted in component state
- [ ] Selector disabled during task execution
- [ ] Accessible (keyboard navigation, screen reader support)
- [ ] Responsive design (works on mobile browsers)

**Effort:** `S` (2-3 days)

**Testing:**
- Unit: Test component renders with correct initial state
- Integration: Test platform selection updates state
- E2E: Select platform, verify selection persisted
- Accessibility: Test keyboard navigation and screen reader

**Blockers:**
- None (UI can be built independently)

**Component Example:**
```typescript
<Select value={platform} onValueChange={setPlatform}>
  <SelectTrigger>
    <SelectValue placeholder="Select platform" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="web">
      <Monitor className="mr-2" /> Web
    </SelectItem>
    <SelectItem value="mobile">
      <Smartphone className="mr-2" /> Mobile
    </SelectItem>
  </SelectContent>
</Select>
```

---

### Task 2.2: Integrate Platform Selector into Task Form

**Description:** Add platform selector to task creation form, persist selection, and pass platform to task creation API.

**Acceptance Criteria:**
- [ ] Platform selector added to task form UI
- [ ] Platform state stored in form (React Hook Form or similar)
- [ ] Platform included in task creation payload
- [ ] Platform validation on frontend (required field)
- [ ] Default platform set to "web"
- [ ] Platform selection persisted in cookies/localStorage for next task
- [ ] Platform displayed in task details/history
- [ ] Error handling for missing platform

**Effort:** `S` (2-3 days)

**Testing:**
- Unit: Test form validation includes platform
- Integration: Test task creation API receives platform
- E2E: Create task with platform='mobile', verify stored in database
- Persistence: Test platform selection remembered on page reload

**Blockers:**
- Task 2.1 must be complete

---

### Task 2.3: QR Code Display Component

**Description:** Create QR code display component for mobile task preview area showing Expo Go QR code and instructions.

**Acceptance Criteria:**
- [ ] QR code component created using library (qrcode.react or similar)
- [ ] Component receives Metro URL as prop
- [ ] QR code renders with proper size (300x300px recommended)
- [ ] Instructions displayed below QR code:
  - "Download Expo Go from App Store (iOS) or Google Play (Android)"
  - "Scan this QR code with Expo Go to preview your app"
  - Links to App Store and Google Play
- [ ] Loading state while QR code generates
- [ ] Error state if Metro URL unavailable
- [ ] Copy URL button for manual entry
- [ ] Responsive design

**Effort:** `S` (2-3 days)

**Testing:**
- Unit: Test QR code renders with valid URL
- Unit: Test error state with invalid URL
- Integration: Test QR code scannable with Expo Go
- E2E: Scan QR code, verify app loads in Expo Go

**Blockers:**
- None (can be built with mock data)

**Component Example:**
```typescript
<QRCodeDisplay metroUrl="https://mobile-abc123.railway.app">
  <QRCode value={metroUrl} size={300} />
  <Instructions>
    Scan this QR code with Expo Go
    <AppStoreLinks />
  </Instructions>
  <CopyButton url={metroUrl} />
</QRCodeDisplay>
```

---

### Task 2.4: Mobile Preview Layout

**Description:** Create preview layout for mobile tasks replacing web iframe with QR code, Metro status, and logs.

**Acceptance Criteria:**
- [ ] Mobile preview layout component created
- [ ] Layout includes:
  - QR code display area (top)
  - Metro bundler status indicator (running/stopped/error)
  - Metro logs pane (bottom, scrollable)
  - Refresh button to regenerate QR code
  - Connection status (Expo Go connected/disconnected)
- [ ] Layout adapts to different screen sizes
- [ ] Logs syntax-highlighted for errors/warnings
- [ ] Auto-scroll to latest log entry
- [ ] Clear logs button

**Effort:** `M` (1 week)

**Testing:**
- Unit: Test layout renders all sections
- Integration: Test Metro status updates in real-time
- E2E: View mobile preview, verify QR code and logs visible
- UX: Test responsive behavior on different screen sizes

**Blockers:**
- Task 2.3 must be complete

---

### Task 2.5: Platform-Specific Preview Routing

**Description:** Implement conditional preview rendering based on task platform (web shows iframe, mobile shows QR code).

**Acceptance Criteria:**
- [ ] Preview component checks task.platform value
- [ ] If platform='web', render existing Vercel Sandbox iframe
- [ ] If platform='mobile', render mobile preview layout with QR code
- [ ] Smooth transition when switching between tasks
- [ ] Loading states for both preview types
- [ ] Error states for both preview types
- [ ] Preview type persists when navigating away and back

**Effort:** `S` (2-3 days)

**Testing:**
- Unit: Test conditional rendering logic
- E2E: Create web task, verify iframe preview
- E2E: Create mobile task, verify QR code preview
- E2E: Switch between web and mobile tasks, verify preview updates

**Blockers:**
- Task 2.4 must be complete
- Task 1.1 (database schema) must be complete

---

## Phase 3: Railway Backend Integration

**Timeline:** 3 weeks

### Task 3.1: Railway API Client Library

**Description:** Create Railway API client library for container lifecycle management (create, start, stop, delete, status).

**Acceptance Criteria:**
- [ ] Railway SDK/API client created in `lib/railway/client.ts`
- [ ] API key management (stored in environment variables)
- [ ] Methods implemented:
  - `createContainer(projectConfig)` → containerId, metroUrl
  - `startContainer(containerId)` → status
  - `stopContainer(containerId)` → status
  - `deleteContainer(containerId)` → success
  - `getContainerStatus(containerId)` → status, resourceUsage
  - `getContainerLogs(containerId)` → logs
- [ ] Error handling for API failures
- [ ] Rate limiting handled
- [ ] Retry logic for transient failures
- [ ] TypeScript types for all responses

**Effort:** `M` (1 week)

**Testing:**
- Unit: Mock Railway API, test client methods
- Integration: Test against Railway sandbox environment
- E2E: Create/start/stop/delete container lifecycle
- Error: Test API error handling, retries

**Blockers:**
- Task 0.1 (Railway POC) must validate API patterns

**Client Example:**
```typescript
export class RailwayClient {
  constructor(private apiKey: string) {}

  async createContainer(config: ContainerConfig): Promise<Container> {
    // POST /services with Docker image, env vars
  }

  async getContainerStatus(containerId: string): Promise<ContainerStatus> {
    // GET /services/:id/status
  }
}
```

---

### Task 3.2: Docker Image for Expo + Metro

**Description:** Create and publish Docker image containing Node.js LTS, Expo CLI, and Metro bundler with proper configuration.

**Acceptance Criteria:**
- [ ] Dockerfile created with:
  - Node.js 20 LTS (Alpine for smaller size)
  - Expo CLI installed globally
  - Metro bundler dependencies
  - Watchman (optional, for better performance)
  - Proper user permissions (non-root)
- [ ] Environment variables configured:
  - REACT_NATIVE_PACKAGER_HOSTNAME=0.0.0.0
  - EXPO_DEVTOOLS_LISTEN_ADDRESS=0.0.0.0
- [ ] Ports exposed: 8081 (Metro), 19000-19002 (Expo)
- [ ] Health check endpoint implemented
- [ ] Image built and tested locally
- [ ] Image published to Docker Hub or Railway registry
- [ ] Image size optimized (<500MB preferred)
- [ ] Documentation for rebuilding/updating image

**Effort:** `M` (1 week)

**Testing:**
- Local: Build image, run container, test Metro starts
- Integration: Deploy to Railway, test QR code works
- Performance: Measure startup time, resource usage
- Size: Verify image size acceptable

**Blockers:**
- Task 0.1 (Railway POC) provides base Dockerfile

**Dockerfile Example:**
```dockerfile
FROM node:20-alpine

RUN npm install -g expo-cli @expo/ngrok

WORKDIR /app

EXPOSE 19000 19001 19002 8081

ENV REACT_NATIVE_PACKAGER_HOSTNAME=0.0.0.0
ENV EXPO_DEVTOOLS_LISTEN_ADDRESS=0.0.0.0

CMD ["npx", "expo", "start", "--tunnel"]
```

---

### Task 3.3: Container Lifecycle Service

**Description:** Implement backend service for managing Railway container lifecycle including creation, monitoring, and cleanup.

**Acceptance Criteria:**
- [ ] Service created in `lib/railway/lifecycle.ts`
- [ ] Methods:
  - `provisionContainer(taskId, userId)` → creates container, stores in DB
  - `monitorContainer(containerId)` → updates status, logs
  - `cleanupInactiveContainers()` → stops containers idle >30 min
  - `handleContainerError(containerId, error)` → retry or mark failed
- [ ] Container registry database updated on each operation
- [ ] Error handling and logging
- [ ] Automatic retry for failed starts (max 3 attempts)
- [ ] Cleanup cron job configured
- [ ] Cost tracking integration (log resource usage)

**Effort:** `L` (2 weeks)

**Testing:**
- Unit: Test each lifecycle method
- Integration: Test container creation → monitoring → cleanup flow
- E2E: Create mobile task, verify container provisioned
- Reliability: Test error recovery, retry logic
- Cleanup: Test inactive container auto-shutdown

**Blockers:**
- Task 3.1 (Railway client) must be complete
- Task 1.3 (container registry table) must be complete

**Service Example:**
```typescript
export class ContainerLifecycleService {
  async provisionContainer(taskId: string, userId: string) {
    // 1. Create container via Railway API
    // 2. Wait for container to start (polling/webhooks)
    // 3. Get Metro URL from Railway
    // 4. Store in railway_containers table
    // 5. Return metro_url for QR code
  }

  async cleanupInactiveContainers() {
    // Find containers with last_activity_at > 30 minutes ago
    // Stop containers via Railway API
    // Update status in database
  }
}
```

---

### Task 3.4: Metro Bundler Health Check & Monitoring

**Description:** Implement health check endpoint polling and Metro bundler status monitoring with WebSocket support detection.

**Acceptance Criteria:**
- [ ] Health check polling implemented (every 30 seconds)
- [ ] Health endpoint: `GET /health` on Metro server
- [ ] Status states tracked: starting, running, stopped, error
- [ ] WebSocket connection detection
- [ ] Metro logs streaming to database/logs table
- [ ] Error detection and classification (syntax, runtime, network)
- [ ] Automatic Metro restart on specific error types
- [ ] Status updates sent to frontend via WebSocket or polling
- [ ] Performance metrics logged (bundle time, request latency)

**Effort:** `M` (1 week)

**Testing:**
- Unit: Test health check logic
- Integration: Test Metro status detection
- E2E: Start Metro, verify status updates in UI
- Error: Trigger Metro errors, verify detection and restart
- Performance: Measure health check overhead

**Blockers:**
- Task 3.3 must be complete

---

### Task 3.5: QR Code Generation Service

**Description:** Implement server-side QR code generation from Metro URL with caching and error handling.

**Acceptance Criteria:**
- [ ] QR code generation library integrated (qrcode or similar)
- [ ] API endpoint: `POST /api/tasks/:taskId/qr-code`
- [ ] Returns SVG or PNG QR code
- [ ] Metro URL validated before generation
- [ ] QR codes cached (same URL = cached QR code)
- [ ] Error handling for invalid URLs
- [ ] QR code size configurable
- [ ] Error correction level set to Medium or High
- [ ] Rate limiting to prevent abuse

**Effort:** `S` (2-3 days)

**Testing:**
- Unit: Test QR code generation with valid/invalid URLs
- Integration: Test API endpoint returns valid QR code
- E2E: Generate QR code, scan with Expo Go, verify app loads
- Performance: Test caching works

**Blockers:**
- Task 3.3 must provide Metro URLs

**API Example:**
```typescript
app.post('/api/tasks/:taskId/qr-code', async (req, res) => {
  const task = await getTask(req.params.taskId);
  if (!task.metro_url) return res.status(400).json({ error: 'No Metro URL' });

  const qrCode = await generateQRCode(task.metro_url);
  res.setHeader('Content-Type', 'image/svg+xml');
  res.send(qrCode);
});
```

---

## Phase 4: AI Code Generation & Context

**Timeline:** 2 weeks

### Task 4.1: Platform Context in AI Prompts

**Description:** Extend AI system prompt to include platform context (web/mobile) and guide code generation accordingly.

**Acceptance Criteria:**
- [ ] System prompt template updated to include platform
- [ ] Template: "Current platform: [Web|Mobile]"
- [ ] Platform context injected from task.platform value
- [ ] AI receives platform in every message
- [ ] Platform context includes framework hints:
  - Web: "Generate Next.js code with TypeScript and Tailwind CSS"
  - Mobile: "Generate React Native code with TypeScript and NativeWind"
- [ ] Testing with sample prompts validates correct code generation

**Effort:** `S` (2-3 days)

**Testing:**
- Unit: Test prompt template with platform='web' and platform='mobile'
- Integration: Test AI receives platform context
- E2E: Create mobile task, verify AI generates React Native code
- E2E: Create web task, verify AI generates Next.js code

**Blockers:**
- None (prompt engineering can be done independently)

**Prompt Example:**
```
System: You are Turbocat AI. Current platform: Mobile.
Generate React Native code with TypeScript and NativeWind.
Use Expo SDK modules for native features.
```

---

### Task 4.2: Mobile Code Generation Templates

**Description:** Create React Native code generation templates for common patterns (screens, components, navigation, state management).

**Acceptance Criteria:**
- [ ] Templates created for:
  - Basic screen with NativeWind styling
  - Functional component with hooks
  - Expo Router file-based navigation
  - React Navigation stack/tab navigator
  - Zustand state management store
  - AsyncStorage persistence
  - API client with fetch/axios
- [ ] Templates include TypeScript types
- [ ] Templates follow Expo best practices
- [ ] Templates use NativeWind for styling
- [ ] Templates documented with usage examples
- [ ] AI skill/knowledge base includes templates

**Effort:** `M` (1 week)

**Testing:**
- Unit: Test each template compiles without errors
- Integration: Test templates work in Expo environment
- E2E: Generate code from template, run in Expo Go
- Quality: Code review templates for best practices

**Blockers:**
- Task 0.1 (Railway POC) provides Expo setup patterns

**Template Example:**
```typescript
// Template: Basic Screen
import { View, Text } from 'react-native';

export default function {{ScreenName}}() {
  return (
    <View className="flex-1 items-center justify-center bg-white">
      <Text className="text-2xl font-bold">{{ScreenName}}</Text>
    </View>
  );
}
```

---

### Task 4.3: Expo SDK Module Detection & Suggestions

**Description:** Implement AI logic to detect feature requests requiring Expo SDK modules and proactively suggest relevant modules.

**Acceptance Criteria:**
- [ ] Keyword detection for common features:
  - "camera" → expo-camera
  - "location" → expo-location
  - "notifications" → expo-notifications
  - "file upload" → expo-file-system, expo-image-picker
  - "contacts" → expo-contacts
  - "maps" → react-native-maps
- [ ] AI suggests Expo SDK module in response
- [ ] AI adds module to package.json dependencies
- [ ] AI adds required permissions to app.json
- [ ] AI warns about Expo Go limitations (no custom native code)
- [ ] Knowledge base with Expo SDK catalog (70+ modules)
- [ ] AI includes permission rationale in app.json

**Effort:** `M` (1 week)

**Testing:**
- Unit: Test keyword detection logic
- Integration: Test AI suggests correct Expo SDK modules
- E2E: Request "camera feature", verify expo-camera suggested
- E2E: Verify permissions added to app.json

**Blockers:**
- Task 4.1 must be complete

**AI Behavior Example:**
```
User: "Add a feature to take photos"
AI: "I'll add a camera feature using expo-camera. This requires camera
permissions, which I'll add to app.json. Here's the code..."

[Generates code with expo-camera]
[Updates app.json with camera permissions]
```

---

### Task 4.4: Mobile-Specific Error Detection & Guidance

**Description:** Implement error detection for common React Native/Expo errors with helpful guidance and auto-fixes.

**Acceptance Criteria:**
- [ ] Error patterns detected:
  - Missing Expo SDK module → suggest installation
  - Permission error → check app.json permissions
  - Metro bundler error → suggest restart or cache clear
  - Platform-specific API used → suggest Platform.select or conditional
  - Custom native module → warn about Expo Go limitation
- [ ] AI provides troubleshooting steps
- [ ] AI offers to auto-fix when possible
- [ ] Error messages displayed in logs pane
- [ ] Common errors documented in help center

**Effort:** `S` (2-3 days)

**Testing:**
- Unit: Test error detection patterns
- Integration: Trigger known errors, verify AI detects
- E2E: Use custom native module, verify warning
- Documentation: Test error messages clear and actionable

**Blockers:**
- Task 3.4 (Metro monitoring) must provide error logs

---

### Task 4.5: Authentication & Storage Strategy Logic

**Description:** Implement AI decision logic for authentication and storage based on project type (mobile-only vs cross-platform).

**Acceptance Criteria:**
- [ ] AI detects project type:
  - Mobile-only: platform='mobile' AND no linked web project
  - Cross-platform: mobile + web projects linked
- [ ] Mobile-only projects:
  - Suggest expo-auth-session for OAuth
  - Suggest expo-secure-store for tokens
  - Suggest AsyncStorage for local data
- [ ] Cross-platform projects:
  - Suggest reusing web auth infrastructure
  - Suggest shared API clients
  - Suggest backend for shared data
- [ ] Storage decision tree:
  - User-specific + small → AsyncStorage
  - Shared/server-processed → Backend
  - Offline support → AsyncStorage + backend sync
- [ ] AI explains recommendations

**Effort:** `M` (1 week)

**Testing:**
- Unit: Test decision tree logic
- Integration: Test AI makes correct recommendations
- E2E: Mobile-only project, verify expo-auth-session suggested
- E2E: Cross-platform project, verify shared auth suggested

**Blockers:**
- Task 4.2 (templates) should include auth patterns

**Decision Tree Example:**
```typescript
if (projectType === 'mobile-only') {
  suggestAuth('expo-auth-session', 'expo-secure-store');
  suggestStorage('AsyncStorage for local, Supabase for shared');
} else if (projectType === 'cross-platform') {
  suggestAuth('Reuse web OAuth, share session tokens');
  suggestStorage('Backend API for all shared data');
}
```

---

## Phase 5: Component Gallery Mobile Components

**Timeline:** 2-3 weeks

### Task 5.1: NativeWind Setup & Configuration

**Description:** Set up NativeWind (Tailwind for React Native) with configuration matching Phase 2 web design tokens.

**Acceptance Criteria:**
- [ ] NativeWind installed in mobile template project
- [ ] tailwind.config.js configured with same design tokens as web
- [ ] babel.config.js configured for NativeWind
- [ ] Color palette matches web (primary, secondary, accent, etc.)
- [ ] Typography scale matches web
- [ ] Spacing scale matches web
- [ ] NativeWind utility classes tested (flex, padding, colors, etc.)
- [ ] Documentation for NativeWind setup
- [ ] Template project includes NativeWind example components

**Effort:** `S` (2-3 days)

**Testing:**
- Unit: Test NativeWind compiles styles correctly
- Integration: Test design tokens match web
- E2E: Build component with NativeWind, verify styling works
- Visual: Compare web and mobile components side-by-side

**Blockers:**
- Requires Phase 2 design tokens to be finalized

**Config Example:**
```javascript
// tailwind.config.js (shared with web)
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#3B82F6', // Same as web
        secondary: '#8B5CF6',
      },
    },
  },
  plugins: [],
};
```

---

### Task 5.2: Mobile Component Templates (Layout & Structure)

**Description:** Create 5 mobile components for layout and structure using NativeWind.

**Components:**
1. Screen (SafeAreaView wrapper)
2. Container
3. Card
4. Divider
5. Spacer

**Acceptance Criteria:**
- [ ] Each component implemented with TypeScript + NativeWind
- [ ] Props interface defined for each component
- [ ] Components follow React Native best practices
- [ ] Components accessible (screen reader support)
- [ ] Components responsive (different screen sizes)
- [ ] Code examples documented
- [ ] Props tables documented
- [ ] Preview screenshots created
- [ ] Components stored in database with platform='mobile'

**Effort:** `M` (1 week)

**Testing:**
- Unit: Test each component renders correctly
- Integration: Test components work together
- E2E: Build screen using all layout components
- Accessibility: Test screen reader support
- Visual: Generate screenshots for documentation

**Blockers:**
- Task 5.1 must be complete
- Task 1.2 (components table schema) must be complete

**Component Example:**
```typescript
// Screen.tsx
import { SafeAreaView } from 'react-native';
import { cn } from '@/lib/utils';

interface ScreenProps {
  children: React.ReactNode;
  className?: string;
}

export function Screen({ children, className }: ScreenProps) {
  return (
    <SafeAreaView className={cn('flex-1 bg-white', className)}>
      {children}
    </SafeAreaView>
  );
}
```

---

### Task 5.3: Mobile Component Templates (Navigation)

**Description:** Create 4 mobile components for navigation using NativeWind.

**Components:**
6. Header/AppBar
7. TabBar (bottom tabs)
8. Drawer (side menu)
9. BackButton

**Acceptance Criteria:**
- [ ] Same as Task 5.2 (TypeScript, NativeWind, documentation, database)
- [ ] Navigation components integrate with React Navigation or Expo Router
- [ ] Gesture support for Drawer (swipe to open/close)
- [ ] Platform-specific styling (iOS vs Android)

**Effort:** `M` (1 week)

**Testing:**
- Same as Task 5.2 plus navigation integration tests

**Blockers:**
- Task 5.2 must be complete

---

### Task 5.4: Mobile Component Templates (Input & Forms)

**Description:** Create 5 mobile components for input and forms using NativeWind.

**Components:**
10. Button
11. Input/TextInput
12. Checkbox
13. Radio
14. Switch/Toggle

**Acceptance Criteria:**
- [ ] Same as Task 5.2 (TypeScript, NativeWind, documentation, database)
- [ ] Form validation support
- [ ] Keyboard handling (TextInput focus, dismiss)
- [ ] Platform-specific keyboard types (email, number, phone)
- [ ] Error states and helper text

**Effort:** `M` (1 week)

**Testing:**
- Same as Task 5.2 plus form validation and keyboard handling tests

**Blockers:**
- Task 5.2 must be complete

---

### Task 5.5: Mobile Component Templates (Data Display)

**Description:** Create 4 mobile components for data display using NativeWind.

**Components:**
15. List/FlatList
16. Avatar
17. Badge
18. Chip/Tag

**Acceptance Criteria:**
- [ ] Same as Task 5.2 (TypeScript, NativeWind, documentation, database)
- [ ] FlatList optimized (virtualization, performance)
- [ ] Image loading states for Avatar
- [ ] Animation support for Badge (pulse, bounce)

**Effort:** `M` (1 week)

**Testing:**
- Same as Task 5.2 plus performance tests for FlatList

**Blockers:**
- Task 5.2 must be complete

---

### Task 5.6: Mobile Component Templates (Feedback)

**Description:** Create 3 mobile components for feedback using NativeWind.

**Components:**
19. Modal/Dialog
20. Loading/Spinner
21. Toast/Snackbar

**Acceptance Criteria:**
- [ ] Same as Task 5.2 (TypeScript, NativeWind, documentation, database)
- [ ] Modal dismissable via gesture (swipe down)
- [ ] Loading spinner animated
- [ ] Toast auto-dismiss after timeout
- [ ] Accessibility announcements for screen readers

**Effort:** `M` (1 week)

**Testing:**
- Same as Task 5.2 plus animation and gesture tests

**Blockers:**
- Task 5.2 must be complete

---

### Task 5.7: Component Gallery UI - Mobile Filter

**Description:** Add platform filter to Component Gallery UI to show web, mobile, or all components.

**Acceptance Criteria:**
- [ ] Platform filter dropdown added to Component Gallery
- [ ] Filter options: "All", "Web", "Mobile", "Universal"
- [ ] Filter persisted in URL query params
- [ ] Filter updates component list dynamically
- [ ] Mobile components displayed with phone icon
- [ ] Preview mechanism for mobile components (React Native Web or Expo Snack)
- [ ] Mobile-specific props tables and documentation visible

**Effort:** `S` (2-3 days)

**Testing:**
- Unit: Test filter logic
- Integration: Test component query by platform
- E2E: Filter by "Mobile", verify only mobile components shown
- UX: Test filter persistence on page reload

**Blockers:**
- Task 5.2-5.6 (mobile components) should have some components ready
- Requires Phase 2 Component Gallery UI

---

### Task 5.8: Mobile Component Previews

**Description:** Implement preview mechanism for mobile components in Component Gallery using React Native Web or Expo Snack embeds.

**Acceptance Criteria:**
- [ ] Preview mechanism selected (React Native Web or Expo Snack)
- [ ] Mobile components render in preview iframe/embed
- [ ] Interactive preview (buttons clickable, inputs functional)
- [ ] Responsive preview (different device sizes)
- [ ] Preview loading states
- [ ] Preview error handling
- [ ] Fallback to code-only view if preview fails

**Effort:** `L` (2 weeks)

**Testing:**
- Unit: Test preview iframe renders
- Integration: Test React Native Web compatibility
- E2E: View mobile component, verify preview works
- Browser: Test preview in Chrome, Safari, Firefox

**Blockers:**
- Task 5.7 must be complete

**Note:** This task has high complexity due to React Native Web setup or Expo Snack integration

---

## Phase 6: Project Structure & Monorepo Support

**Timeline:** 2 weeks

### Task 6.1: Standalone Expo Project Template

**Description:** Create Expo project template with standard folder structure, TypeScript, NativeWind, and Expo Router.

**Acceptance Criteria:**
- [ ] Template repository created with structure:
  - app/ (Expo Router screens)
  - components/
  - lib/
  - assets/
  - constants/
- [ ] TypeScript configuration (tsconfig.json)
- [ ] NativeWind configuration (tailwind.config.js, babel.config.js)
- [ ] app.json with proper metadata (name, slug, version)
- [ ] package.json with Expo SDK dependencies
- [ ] Scripts: start, android, ios, web
- [ ] .gitignore configured for Expo
- [ ] README with setup instructions
- [ ] Template tested in Railway container

**Effort:** `M` (1 week)

**Testing:**
- Integration: Initialize project from template, run in Expo Go
- E2E: Create mobile task, verify project structure matches template
- Quality: Code review template structure

**Blockers:**
- Task 5.1 (NativeWind setup) provides configuration

**Template Structure:**
```
expo-template/
├── app/
│   ├── (tabs)/
│   │   ├── index.tsx
│   │   └── settings.tsx
│   └── _layout.tsx
├── components/
│   └── ui/
├── lib/
│   └── utils.ts
├── assets/
├── constants/
│   └── Colors.ts
├── app.json
├── package.json
├── tsconfig.json
└── tailwind.config.js
```

---

### Task 6.2: Monorepo Template (Optional Cross-Platform)

**Description:** Create monorepo template with web (Next.js) and mobile (Expo) apps plus shared packages for cross-platform projects.

**Acceptance Criteria:**
- [ ] Monorepo structure with pnpm workspaces:
  - apps/web/ (Next.js)
  - apps/mobile/ (Expo)
  - packages/shared/ (API clients, types, utils)
  - packages/config/ (ESLint, TypeScript configs)
- [ ] pnpm-workspace.yaml configured
- [ ] Turbo or Nx for build orchestration (optional)
- [ ] Shared TypeScript types in packages/shared
- [ ] Shared API client in packages/shared
- [ ] Shared utilities in packages/shared
- [ ] Separate UI components (no shared UI)
- [ ] Cross-referencing configured (mobile imports from shared)
- [ ] Scripts for running both apps
- [ ] Documentation for monorepo setup

**Effort:** `L` (2 weeks)

**Testing:**
- Integration: Initialize monorepo, run both apps
- E2E: Modify shared code, verify changes in both apps
- Build: Test workspace builds correctly
- Quality: Code review monorepo structure

**Blockers:**
- Task 6.1 must be complete
- Requires Next.js template from earlier phases

**Monorepo Structure:**
```
monorepo/
├── apps/
│   ├── web/         (Next.js)
│   └── mobile/      (Expo)
├── packages/
│   ├── shared/
│   │   ├── api/
│   │   ├── types/
│   │   └── utils/
│   └── config/
├── pnpm-workspace.yaml
└── package.json
```

---

### Task 6.3: AI Detection for Cross-Platform Requests

**Description:** Implement AI logic to detect when users request cross-platform features and offer monorepo setup.

**Acceptance Criteria:**
- [ ] Keyword detection for cross-platform:
  - "add mobile to this web app"
  - "web and mobile together"
  - "build for both platforms"
  - "cross-platform app"
- [ ] AI asks: "Would you like to create a monorepo with shared code?"
- [ ] If yes, use monorepo template (Task 6.2)
- [ ] If no, create separate standalone projects
- [ ] AI explains benefits of monorepo vs standalone
- [ ] AI generates workspace configuration
- [ ] AI sets up shared packages automatically

**Effort:** `S` (2-3 days)

**Testing:**
- Unit: Test keyword detection
- Integration: Test AI offers monorepo setup
- E2E: Request "add mobile to web app", verify monorepo offered
- E2E: Accept monorepo, verify structure created

**Blockers:**
- Task 6.2 must be complete

**AI Behavior Example:**
```
User: "Add a mobile app for my existing web project"
AI: "I can create a cross-platform monorepo with shared code between
web and mobile. This allows you to share API clients, types, and
utilities. Would you like me to set this up? (Yes/No)"

User: "Yes"
AI: [Creates monorepo structure with apps/web, apps/mobile, packages/shared]
```

---

## Phase 7: Testing & Quality Assurance

**Timeline:** 2 weeks

### Task 7.1: Unit Tests for Railway Integration

**Description:** Write comprehensive unit tests for Railway client, lifecycle service, and container management.

**Acceptance Criteria:**
- [ ] Railway API client tests (mocked API):
  - Test createContainer success/failure
  - Test startContainer, stopContainer, deleteContainer
  - Test getContainerStatus with different states
  - Test error handling and retries
- [ ] Container lifecycle service tests:
  - Test provision flow
  - Test cleanup logic
  - Test error recovery
- [ ] Test coverage >80%
- [ ] Tests run in CI/CD pipeline

**Effort:** `M` (1 week)

**Testing:**
- Run tests: `npm test lib/railway`
- Coverage: `npm run test:coverage`

**Blockers:**
- Tasks 3.1, 3.3 must be complete

---

### Task 7.2: Integration Tests for Mobile Preview Flow

**Description:** Write integration tests for end-to-end mobile task creation, container provisioning, and preview flow.

**Acceptance Criteria:**
- [ ] Test suite covers:
  - Create mobile task → container provisioned
  - Metro bundler starts → QR code generated
  - Expo Go connects → app loads
  - Code change → hot reload in <5 seconds
  - Container cleanup after 30 min idle
- [ ] Tests run against Railway sandbox environment
- [ ] Tests clean up resources after completion
- [ ] Tests documented with setup instructions

**Effort:** `M` (1 week)

**Testing:**
- Run integration tests: `npm run test:integration`
- Manual validation: Scan QR code with Expo Go

**Blockers:**
- Phase 3 tasks (Railway backend) must be complete
- Phase 2 tasks (UI) must be complete

---

### Task 7.3: E2E Tests for Platform-Specific Workflows

**Description:** Write end-to-end tests using Playwright/Cypress for web vs mobile task workflows.

**Acceptance Criteria:**
- [ ] Test scenarios:
  - User creates web task → Vercel Sandbox iframe preview
  - User creates mobile task → QR code preview
  - User switches platform selector → correct preview shown
  - User scans QR code → app loads in Expo Go (manual step documented)
- [ ] Tests run in headless browser
- [ ] Screenshots captured for debugging
- [ ] Tests run in CI/CD pipeline

**Effort:** `M` (1 week)

**Testing:**
- Run E2E tests: `npm run test:e2e`

**Blockers:**
- Phase 2 tasks (UI) must be complete

---

### Task 7.4: Performance Testing

**Description:** Measure and optimize performance for container startup, Metro bundler, QR code generation, and hot reload.

**Acceptance Criteria:**
- [ ] Performance benchmarks:
  - Container startup: <2 minutes (target <1 minute)
  - Metro bundler ready: <30 seconds after container start
  - QR code generation: <1 second
  - Hot reload: <5 seconds
- [ ] Load testing: 10 concurrent mobile tasks
- [ ] Resource usage measured (CPU, RAM, network)
- [ ] Performance optimizations implemented
- [ ] Benchmarks documented

**Effort:** `S` (2-3 days)

**Testing:**
- Run benchmarks: `npm run benchmark`
- Load test: Use Artillery or k6

**Blockers:**
- Phase 3 tasks must be complete

---

### Task 7.5: Security Testing

**Description:** Audit Railway integration, container isolation, and QR code generation for security vulnerabilities.

**Acceptance Criteria:**
- [ ] Security checklist:
  - Railway API keys stored securely (environment variables, secrets manager)
  - Container network isolation validated
  - User code sandboxed properly
  - QR code URLs not guessable
  - Rate limiting on QR code generation
  - Railway containers use non-root user
- [ ] Penetration testing (basic)
- [ ] Vulnerabilities documented and fixed
- [ ] Security audit report created

**Effort:** `S` (2-3 days)

**Testing:**
- Run security audit: `npm audit`
- Manual: Test container escape attempts (ethical hacking)

**Blockers:**
- Phase 3 tasks must be complete

---

## Phase 8: Documentation & Deployment

**Timeline:** 1 week

### Task 8.1: Developer Documentation

**Description:** Write comprehensive documentation for mobile development features, Railway setup, and troubleshooting.

**Acceptance Criteria:**
- [ ] Documentation pages created:
  - "Getting Started with Mobile Development"
  - "Railway.app Setup Guide"
  - "Expo Go Preview Guide"
  - "Mobile Component Gallery"
  - "Cross-Platform Development with Monorepos"
  - "Troubleshooting Mobile Issues"
- [ ] Code examples for common tasks
- [ ] Screenshots and diagrams
- [ ] FAQ section
- [ ] API reference (if applicable)

**Effort:** `M` (1 week)

**Testing:**
- Review: Documentation review with team
- Usability: Test documentation with new user

**Blockers:**
- All implementation tasks should be complete

---

### Task 8.2: User Guides & Tutorials

**Description:** Create tutorial templates and step-by-step guides for building mobile apps with Turbocat.

**Acceptance Criteria:**
- [ ] Tutorials created:
  - "Build a Todo App (Mobile)"
  - "Build a Camera App with Expo SDK"
  - "Build a Cross-Platform Dashboard"
  - "Add Authentication to Mobile App"
- [ ] Step-by-step instructions with screenshots
- [ ] Starter code provided
- [ ] Expected outcomes documented
- [ ] Tutorials tested by new users

**Effort:** `S` (2-3 days)

**Testing:**
- Usability: Test tutorials with 3+ users
- Feedback: Iterate based on user feedback

**Blockers:**
- Task 8.1 must be in progress

---

### Task 8.3: Cost Monitoring Dashboard

**Description:** Create dashboard for monitoring Railway usage, costs, and container lifecycle.

**Acceptance Criteria:**
- [ ] Dashboard shows:
  - Active containers count
  - Total Railway cost (current month)
  - Cost per container
  - Resource usage (CPU, RAM, network)
  - Container status (running, stopped, error)
  - Cleanup statistics (containers stopped)
- [ ] Cost alerts configured (>$200/month)
- [ ] Admin access only
- [ ] Real-time updates

**Effort:** `M` (1 week)

**Testing:**
- Integration: Test dashboard displays Railway metrics
- E2E: Create containers, verify dashboard updates
- Alerts: Test cost alerts trigger

**Blockers:**
- Task 3.3 (lifecycle service) must log cost data

---

### Task 8.4: Production Deployment

**Description:** Deploy Phase 4 mobile features to production with feature flag, monitoring, and rollback plan.

**Acceptance Criteria:**
- [ ] Feature flag created for mobile features (gradual rollout)
- [ ] Production database migrated (tasks, components, containers tables)
- [ ] Railway production account configured
- [ ] Environment variables set (Railway API keys)
- [ ] Monitoring configured (Sentry, Datadog, or similar)
- [ ] Error tracking enabled
- [ ] Rollback plan documented
- [ ] Deployment runbook created
- [ ] Post-deployment validation checklist

**Effort:** `S` (2-3 days)

**Testing:**
- Smoke tests: Create mobile task in production
- Monitoring: Verify logs and metrics flowing
- Rollback: Test rollback procedure in staging

**Blockers:**
- All previous tasks must be complete
- Production environment ready

---

### Task 8.5: Post-Launch Monitoring & Iteration

**Description:** Monitor Phase 4 features after launch, collect user feedback, and plan iterations.

**Acceptance Criteria:**
- [ ] Metrics tracked:
  - Mobile task creation rate
  - QR code scan success rate
  - Container provisioning success rate
  - Metro bundler uptime
  - Average hot reload time
  - User satisfaction (surveys)
- [ ] User feedback collected (interviews, surveys)
- [ ] Bugs triaged and prioritized
- [ ] Iteration plan created for Phase 4.1
- [ ] Cost analysis (actual vs estimated)

**Effort:** `M` (1 week ongoing)

**Testing:**
- Analytics: Review metrics weekly
- User research: Conduct 5+ user interviews

**Blockers:**
- Task 8.4 (production deployment) must be complete

---

## Summary of Task Counts

| Phase | Task Count | Estimated Timeline |
|-------|------------|-------------------|
| **Phase 0: Pre-Implementation** | 2 tasks | 3-5 days |
| **Phase 1: Database & Schema** | 3 tasks | 1 week |
| **Phase 2: UI Components** | 5 tasks | 2 weeks |
| **Phase 3: Railway Backend** | 5 tasks | 3 weeks |
| **Phase 4: AI Code Generation** | 5 tasks | 2 weeks |
| **Phase 5: Component Gallery** | 8 tasks | 2-3 weeks |
| **Phase 6: Project Structure** | 3 tasks | 2 weeks |
| **Phase 7: Testing & QA** | 5 tasks | 2 weeks |
| **Phase 8: Documentation & Deployment** | 5 tasks | 1 week |
| **TOTAL** | **41 tasks** | **8-12 weeks** |

---

## Effort Distribution

| Complexity | Count | Percentage |
|-----------|-------|-----------|
| XS | 1 | 2% |
| S | 15 | 37% |
| M | 19 | 46% |
| L | 5 | 12% |
| XL | 1 | 2% |

---

## Critical Path

These tasks are on the critical path and must be completed in order:

1. **Task 0.1** (Railway POC) → **Task 0.2** (Railway Planning)
2. **Task 1.1** (Database schema) → All UI tasks
3. **Task 3.1** (Railway client) → **Task 3.3** (Lifecycle service) → All backend tasks
4. **Task 4.1** (Platform context) → All AI tasks
5. **Task 5.1** (NativeWind) → All component tasks
6. **All tasks** → **Task 8.4** (Production deployment)

---

## Risk Mitigation

| Risk | Mitigation Task |
|------|----------------|
| Railway POC fails | Task 0.1 validates early, fallback to self-hosted Docker |
| Container costs exceed budget | Task 8.3 cost monitoring, aggressive cleanup in Task 3.3 |
| Metro bundler unreliable | Task 3.4 health checks and auto-restart |
| Poor performance | Task 7.4 performance testing and optimization |
| Security vulnerabilities | Task 7.5 security audit |
| User adoption low | Task 8.5 user feedback and iteration |

---

## Success Criteria for Phase 4 Completion

Phase 4 is considered complete when:

- [ ] Users can select "Mobile" platform and create React Native tasks
- [ ] Railway containers provision automatically for mobile tasks
- [ ] QR codes display and work with Expo Go (iOS and Android)
- [ ] Hot reloading works in <5 seconds
- [ ] AI generates correct React Native code with NativeWind
- [ ] 20+ mobile components available in Component Gallery
- [ ] Cross-platform monorepo setup works when requested
- [ ] All tests passing (unit, integration, E2E)
- [ ] Documentation complete and tested with users
- [ ] Production deployment successful with monitoring
- [ ] Cost within budget ($100-200/month for 10-20 concurrent projects)

---

## Next Steps

1. **Await Phase 2 & 3 Completion** (hard dependency)
2. **Execute Task 0.1** (Railway POC) immediately after dependencies met
3. **Review and approve this task breakdown** with stakeholders
4. **Assign tasks to team members** based on expertise
5. **Set up project tracking** (Jira, Linear, GitHub Projects)
6. **Begin Phase 1** (Database schema) in parallel with Phase 0
7. **Weekly progress reviews** to track against timeline

---

**Tasks Breakdown Complete:** 2026-01-04
**Total Tasks:** 41
**Estimated Timeline:** 8-12 weeks
**Ready for Implementation:** Yes (after Phase 2 & 3 completion)
