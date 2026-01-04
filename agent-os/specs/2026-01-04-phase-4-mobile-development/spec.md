# Specification: Phase 4 - Mobile Development with React Native Expo

## Goal

Enable cross-platform mobile app development in Turbocat by adding React Native Expo support with live preview on physical devices via Expo Go and QR codes, utilizing Railway.app for container-based sandboxes running Metro bundler.

## User Stories

- As a developer, I want to select "Mobile" or "Web" from a platform selector in the chat UI so that the AI generates the appropriate code for my target platform
- As a developer, I want to preview my React Native app on my physical device by scanning a QR code so that I can test the actual native experience
- As a developer, I want access to 20+ pre-built mobile components using NativeWind so that I can rapidly build mobile UIs with familiar Tailwind syntax

## Specific Requirements

**Platform Selector in Chat UI**
- Add toggle or dropdown selector in chat interface (next to agent/model selection) with options: "Web" (default) or "Mobile"
- Persist platform selection across messages within the same task conversation
- Visual indication shows currently selected platform (icon or badge)
- Platform context automatically included in AI prompts to determine code generation target
- Selector disabled during task execution to prevent mid-task platform switching
- Clear indication in task details showing which platform was selected for historical tasks

**Railway.app Sandbox Infrastructure**
- Primary solution: Railway.app container orchestration for mobile projects (web projects continue using Vercel Sandbox)
- Automatic Docker container deployment with pre-configured Expo CLI, Metro bundler, and Node.js LTS
- WebSocket support for Metro bundler hot reloading connections
- Automatic port exposure and HTTPS for Metro server public access
- Container lifecycle management: start on mobile task creation, stop after 30 minutes of inactivity
- Environment variables: PROJECT_ID, USER_ID, PORT, REACT_NATIVE_PACKAGER_HOSTNAME=0.0.0.0, EXPO_DEVTOOLS_LISTEN_ADDRESS=0.0.0.0
- Fallback solution: Self-managed Docker containers on Digital Ocean/AWS if Railway proves inadequate during POC
- Cost tracking and budget alerts for Railway usage (target: $100-200/month optimized)

**Metro Bundler Integration**
- Metro bundler runs continuously in Railway container for each active mobile project
- Public URL provided by Railway for Metro server access (e.g., https://mobile-abc123.railway.app)
- WebSocket connections for hot module replacement and live reloading
- Metro bundler status indicator in UI showing running/stopped/error states
- Metro logs accessible in task logs pane for debugging
- Automatic Metro restart on configuration changes or errors
- Health check endpoint for Metro server (polling every 30 seconds)

**QR Code Generation and Expo Go Preview**
- Server-side QR code generation using Railway Metro server URL
- QR code displayed in preview area of task details page (replaces web preview iframe for mobile tasks)
- Instructions for downloading Expo Go app (iOS App Store / Google Play Store links)
- QR code remains valid for duration of container lifetime
- Expo Go connection status indicator (connected/disconnected)
- Error handling for Expo Go connection failures with troubleshooting tips
- Support for both iOS and Android devices via Expo Go

**Mobile Code Generation Templates**
- AI generates React Native code with TypeScript and NativeWind styling
- Default Expo Router file-based navigation (similar to Next.js mental model)
- Alternative: React Navigation library-based routing (user can request)
- Functional components with React hooks (no class components)
- Zustand state management for complex apps (AI suggests based on app complexity)
- AsyncStorage for local data (preferences, tokens), backend for shared data
- Expo SDK module integration with automatic permission declarations in app.json

**Standalone Expo Project Structure**
- Each mobile project creates separate GitHub repository by default
- Expo project initialized with `expo init` equivalent structure
- Standard folders: app/ (Expo Router), components/, lib/, assets/, constants/
- TypeScript configuration matching web TypeScript setup
- NativeWind configuration in tailwind.config.js and babel.config.js
- app.json with proper app name, slug, version, and permission declarations
- Package.json with Expo SDK dependencies and scripts (start, android, ios, web)

**Cross-Platform Monorepo Support (Optional)**
- Only created when user explicitly requests "add mobile to this web app" or "web and mobile together"
- Monorepo structure with pnpm/yarn workspaces: apps/web, apps/mobile, packages/shared
- Shared packages: API clients, TypeScript types, utilities, constants, Tailwind config
- Separate UI components (web uses shadcn/ui, mobile uses NativeWind components)
- Workspace configuration in pnpm-workspace.yaml or package.json workspaces field
- AI automatically detects cross-platform requests and offers monorepo setup

**Database Schema Extensions**
- Add platform enum to tasks table: platform TEXT CHECK(platform IN ('web', 'mobile'))
- Add metro_url TEXT to tasks table for Metro bundler URL
- Add container_id TEXT to tasks table for Railway container ID
- Add mobile platform tag to components table for Component Gallery filtering
- Migration script to add new columns with default values for existing tasks

**Component Gallery Mobile Components**
- 20+ mobile components using NativeWind (Tailwind for React Native)
- Categories: Layout (Screen, Container, Card, Divider, Spacer), Navigation (Header, TabBar, Drawer, BackButton), Input (Button, TextInput, Checkbox, Radio, Switch), Data Display (List, Avatar, Badge, Chip), Feedback (Modal, Loading, Toast)
- Each component stored in database with platform='mobile' tag
- Component previews using React Native Web or Expo Snack embeds
- Component documentation with code examples, props tables, and usage notes
- Mobile components accessible via Component Gallery UI with platform filter dropdown

**AI Prompting and Context**
- Platform context included in system prompt: "Current platform: [Web|Mobile]"
- AI generates React Native code when platform is Mobile
- AI generates Next.js code when platform is Web
- AI suggests Expo SDK modules proactively based on feature requests (e.g., "You want camera? Use expo-camera")
- AI adds required permissions to app.json automatically (camera, location, notifications, etc.)
- AI warns about Expo Go limitations (no custom native code, must use Expo SDK modules only)
- AI detects storage needs and suggests AsyncStorage (local) vs. backend (shared data)

**Authentication and Storage Strategy**
- Mobile-only projects: AI suggests expo-auth-session for OAuth, expo-secure-store for tokens
- Cross-platform projects: AI reuses web auth infrastructure, shares session tokens via secure storage
- Storage decision logic: user-specific + small data = AsyncStorage, shared/server-processed = backend, offline support = AsyncStorage + backend sync
- AI automatically generates appropriate authentication and storage code based on project type

**Expo SDK Awareness**
- AI has comprehensive knowledge of entire Expo SDK catalog (70+ modules)
- Core modules: expo-camera, expo-location, expo-notifications, expo-file-system, expo-image-picker, expo-contacts
- Extended modules: expo-sensors, expo-av (audio/video), react-native-maps, expo-sharing, expo-calendar, expo-haptics
- AI proactively suggests relevant modules based on user requests
- AI automatically adds module dependencies to package.json
- AI includes permission rationale in app.json for App Store/Play Store compliance

**Error Handling and Debugging**
- Metro bundler errors displayed in logs pane with syntax highlighting
- Expo Go connection errors with troubleshooting steps (check network, restart Metro, clear cache)
- Container startup failures with automatic retry (max 3 attempts)
- Railway API errors with fallback to alternative sandbox or error message
- QR code generation failures with manual URL fallback display
- Timeout handling for container startup (max 2 minutes)

**Dependencies on Previous Phases**
- MUST wait for Phase 2 (Design System) completion: Component Gallery database, design tokens, baseline web components
- MUST wait for Phase 3 (Skills & MCP) completion: Skills framework for potential mobile-specific skills, MCP connector infrastructure
- Phase 4 cannot start until BOTH Phase 2 AND Phase 3 are complete
- Design tokens from Phase 2 Tailwind config must be compatible with NativeWind
- Component Gallery UI from Phase 2 must support platform filtering

## Existing Code to Leverage

**Database Schema Pattern (lib/db/schema.ts)**
- Use existing Drizzle ORM patterns for extending tasks table with platform, metro_url, container_id columns
- Follow existing Zod validation patterns for insertTaskSchema and selectTaskSchema
- Use existing foreign key pattern for userId references
- Apply existing timestamp pattern (createdAt, updatedAt) to new columns
- Leverage existing jsonb column pattern for storing mobile-specific metadata

**Task Form Component (components/task-form.tsx)**
- Extend existing agent selector pattern to add platform selector (toggle or dropdown similar to agent selection)
- Reuse Select component from shadcn/ui for platform dropdown
- Apply existing state management pattern (useState for platform selection, persist via cookies or atoms)
- Follow existing form submission pattern to include platform in task creation payload
- Replicate existing options dropdown pattern for mobile-specific settings (if needed)

**Vercel Sandbox Infrastructure (lib/sandbox/creation.ts)**
- Study existing sandbox creation logic to implement parallel Railway container creation
- Replicate environment variable injection pattern for Railway containers
- Apply existing sandbox registry pattern for tracking active Railway containers
- Follow existing health check and status monitoring patterns for Metro bundler
- Use existing cleanup and lifecycle management patterns for container shutdown

**Component Gallery Architecture (from Phase 2 dependencies)**
- Extend Component Gallery database schema to include platform enum field
- Add platform filter to Component Gallery UI (similar to category filter)
- Store mobile components with same structure as web components (code, documentation, preview)
- Leverage existing component preview infrastructure for React Native Web previews
- Apply existing search and filtering logic to support mobile component queries

**Authentication and User Context (lib/auth/)**
- Reuse existing user authentication for mobile project ownership
- Apply existing API key management for Railway API credentials
- Follow existing per-user resource scoping for mobile containers
- Use existing encryption pattern for storing Railway tokens securely
- Leverage existing session management for mobile task tracking

## Out of Scope

- EAS Build integration for generating production iOS/Android builds (deferred to Phase 5)
- App Store and Google Play Store submission automation (deferred to Phase 5)
- CI/CD pipelines for mobile deployments (deferred to Phase 5)
- Development builds with custom native code (Expo Go managed workflow only)
- iOS Simulator or Android Emulator cloud hosting (Expo Go on physical devices only)
- React Native Web as primary preview mechanism (Expo Go is primary, RN Web is fallback for Component Gallery only)
- Universal components that work on both web and mobile (separate component libraries)
- Automatic migration of web projects to mobile (user must explicitly request)
- Monorepo setup by default (standalone projects unless user explicitly requests cross-platform)
- Support for third-party native modules outside Expo SDK (Expo Go limitation)
