# Phase 4: Mobile Development - Clarifying Questions

**Spec Folder:** `agent-os/specs/2026-01-04-phase-4-mobile-development`
**Created:** 2026-01-04
**Status:** Gathering Requirements

---

## Context Summary

Phase 4 adds React Native Expo mobile development capabilities to the Turbocat platform, enabling cross-platform development alongside the existing Next.js web features. This phase includes:

1. Expo Sandbox Environment (configure Vercel Sandbox for React Native)
2. Mobile Preview Infrastructure (live preview via Expo Go or web-based)
3. React Native Component Gallery (extending existing component gallery)
4. Mobile-Aware AI Prompting (detect mobile requests, generate React Native code)
5. Cross-Platform Code Sharing (web + mobile in same project)
6. Device Preview Testing (QR codes for Expo Go)

---

## CRITICAL: Research Findings & Constraints

### Vercel Sandbox Environment Capabilities

**Finding:** The Vercel Sandbox documentation does NOT explicitly mention support for React Native or Expo projects.

**What we know:**
- Vercel Sandbox runs on Amazon Linux 2023 with Node.js runtime
- Supports npm, yarn, pnpm, bun package managers
- Designed for AI code execution, backend logic, and developer experimentation
- No documented mobile framework support

**CRITICAL DECISION REQUIRED:**
1. **Can Vercel Sandbox run Expo projects at all?**
   - Does it support the Expo CLI and Metro bundler?
   - Are there runtime limitations that would prevent Expo execution?
   - Has anyone tested React Native/Expo in Vercel Sandbox before?

2. **If Vercel Sandbox CANNOT support Expo:**
   - Should we use an alternative sandbox environment (Docker containers, AWS Lambda, etc.)?
   - Should we limit mobile development to code generation only (no live preview)?
   - Should Phase 4 be postponed until a suitable execution environment is confirmed?

---

## Category 1: Technical Architecture & Integration

### 1.1 Sandbox Environment Configuration

**Q1:** Do we need to verify Vercel Sandbox can run Expo projects before proceeding?
- Have you tested or confirmed Expo CLI works in Vercel Sandbox?
- Should we create a proof-of-concept to validate technical feasibility?
- What's the fallback plan if Vercel Sandbox doesn't support Expo?

**Q2:** What Expo workflow should we support?
- **Expo Go** (managed workflow, limited to Expo SDK modules)?
- **Development Builds** (custom native code, requires EAS Build)?
- **Both**?

**Q3:** What Node.js version and dependencies should be installed?
- Expo requires specific Node.js LTS versions - should we pin to a version?
- Should we pre-install Expo CLI globally in the sandbox environment?
- What other system dependencies are needed (Watchman, Metro bundler, etc.)?

### 1.2 Mobile Preview Infrastructure

**Q4:** What preview mechanism should we implement?
- **Option A:** Expo Snack-style web preview (React Native Web)?
- **Option B:** Expo Go via QR codes (requires running metro bundler)?
- **Option C:** Web-based device emulator (like Appetize.io)?
- **Option D:** Multiple preview options?

**Q5:** How should the preview infrastructure integrate with existing Turbocat platform?
- Should mobile preview be a separate iframe/window from web preview?
- Should users toggle between web and mobile previews in the same interface?
- Should both previews be visible simultaneously?

**Q6:** What are the preview server requirements?
- Does Expo Metro bundler need to be publicly accessible (tunneling/ngrok)?
- Should we use Expo's built-in tunnel service or implement our own?
- What ports need to be exposed from the sandbox?

**Q7:** How do we handle preview URLs and QR codes?
- Should QR codes be generated server-side or client-side?
- Should preview URLs be persistent or ephemeral?
- How long should preview sessions remain active?

### 1.3 React Native Web Fallback

**Q8:** Should we implement React Native Web as a fallback preview mechanism?
- This would allow browser-based preview without Expo Go
- Limitation: Not all React Native components work on web
- Would this be sufficient for MVP or should we prioritize native preview?

**Q9:** What components are web-compatible vs. native-only?
- Should we document which components work in web preview?
- Should the AI warn users when generating native-only components?
- Should we have separate component categories (universal vs. native-specific)?

### 1.4 Dependencies on Previous Phases

**Q10:** Which Phase 2 (Design System) components must be complete?
- Does Component Gallery database need mobile component support first?
- Should we wait for Storybook integration to extend it to React Native?
- Can we start Phase 4 in parallel with Phase 2 completion?

**Q11:** Which Phase 3 (Skills & MCP) features are required?
- Should mobile development have its own skill (`mobile-dev` or `expo-setup`)?
- Do we need MCP integrations for mobile-specific services (App Store Connect, Google Play)?
- Can Phase 4 begin before Phase 3 completes?

---

## Category 2: User Workflows & Experience

### 2.1 Project Initialization

**Q12:** How do users create mobile projects?
- **Option A:** Separate "Create Mobile App" flow?
- **Option B:** "Create Full-Stack App (Web + Mobile)" hybrid flow?
- **Option C:** Start with web, add mobile later?
- **Option D:** AI detects intent from natural language ("build a mobile app")?

**Q13:** What project structure should we generate?
- Monorepo with separate web and mobile folders?
- Expo Router for file-based routing (similar to Next.js)?
- Shared components and utilities between web/mobile?

### 2.2 Development Workflow

**Q14:** How do users switch between web and mobile development?
- Is it a toggle in the UI ("Preview: Web | Mobile")?
- Does the AI context automatically understand which platform is active?
- Can users work on both simultaneously?

**Q15:** How does the AI know to generate React Native code vs. Next.js code?
- Should users explicitly specify "create a mobile screen" vs. "create a web page"?
- Should the AI infer from context (if project has Expo, assume mobile)?
- Should there be a platform selector in the task creation UI?

**Q16:** What happens when users request features incompatible with mobile?
- Example: "Add server-side rendering" (Next.js only)
- Should the AI suggest alternatives or warn about incompatibility?
- Should we maintain a compatibility matrix?

### 2.3 Testing & Preview

**Q17:** How do users test on physical devices?
- QR code scanning with Expo Go (requires mobile preview infrastructure)?
- Web preview only (React Native Web limitations)?
- Both options available?

**Q18:** Should we support iOS Simulator and Android Emulator?
- These require macOS and significant resources
- Likely not feasible in Vercel Sandbox
- Should we document external testing options?

**Q19:** What debugging tools should be available?
- React DevTools for React Native?
- Metro bundler logs visible in UI?
- Error overlays in preview?

---

## Category 3: Component Gallery Extension

### 3.1 React Native Component Library

**Q20:** What React Native component library should we use?
- **NativeWind** (Tailwind CSS for React Native) - matches web stack?
- **React Native Paper** (Material Design)?
- **shadcn-ui for React Native** (if it exists)?
- **Custom design system** matching Phase 2 web components?

**Q21:** How many mobile components should be in the initial gallery?
- Same 20+ as web (roadmap item 11)?
- Smaller subset for MVP?
- Which categories are most important (navigation, forms, cards, etc.)?

### 3.2 Cross-Platform Design System

**Q22:** How should we handle design tokens across web and mobile?
- Shared Tailwind config that works with NativeWind?
- Separate but parallel design systems?
- Web-first with mobile adaptations?

**Q23:** Should components be universal (work on web AND mobile)?
- Example: `<Button>` component that renders on both platforms?
- Or separate `<WebButton>` and `<MobileButton>`?
- What about components that don't translate (e.g., `<Video>` has different APIs)?

### 3.3 Component Gallery UI

**Q24:** Should the Component Gallery UI show web and mobile components separately?
- Tabs: "Web Components | Mobile Components | Universal Components"?
- Filters: "Platform: All | Web | Mobile"?
- Side-by-side previews of the same component on different platforms?

**Q25:** How do we demonstrate mobile components in the gallery?
- Embed Expo Snack previews?
- Static screenshots with code snippets?
- Live React Native Web preview?

---

## Category 4: AI Prompting & Code Generation

### 4.1 Mobile-Aware Detection

**Q26:** What keywords/phrases should trigger mobile code generation?
- "build a mobile app"
- "create a screen" (mobile) vs. "create a page" (web)?
- "add to iOS/Android"
- "make it work on phones"

**Q27:** Should the AI ask for clarification if intent is ambiguous?
- Example: "Create a dashboard" → "For web, mobile, or both?"
- Or should it default to cross-platform?

**Q28:** How should the AI handle cross-platform requests?
- "Build an app for web and mobile"
- Generate both Next.js and Expo code in one task?
- Create separate tasks for each platform?

### 4.2 Code Generation Patterns

**Q29:** What React Native patterns should the AI follow?
- Functional components with hooks (matching web patterns)?
- React Navigation vs. Expo Router?
- Expo SDK modules (Camera, Location, etc.) - how much should AI know?

**Q30:** Should the AI generate platform-specific code?
- `Platform.OS === 'ios'` vs. `Platform.OS === 'android'`?
- Or generate universal code only?

**Q31:** How should the AI handle native modules and dependencies?
- Warn if user requests features requiring custom native code?
- Suggest Expo SDK alternatives?
- Document unsupported features?

### 4.3 Code Sharing & Monorepo

**Q32:** What shared code patterns should the AI use?
- Shared API client (fetch/axios for both web and mobile)?
- Shared utilities and helpers?
- Shared TypeScript types and interfaces?

**Q33:** Should the AI structure projects as monorepos by default?
- `/apps/web` and `/apps/mobile` with `/packages/shared`?
- Or separate repositories?
- What about shared component libraries?

---

## Category 5: Mobile-Specific Considerations

### 5.1 Navigation & Routing

**Q34:** What navigation library should we support?
- **Expo Router** (file-based, similar to Next.js) - easier for AI?
- **React Navigation** (library-based, more flexible)?
- Both?

**Q35:** How should the AI generate navigation patterns?
- Tab navigation vs. stack navigation vs. drawer navigation?
- Should the AI suggest navigation patterns based on app type?

### 5.2 State Management

**Q36:** What state management should mobile apps use?
- React Context (simple, built-in)?
- Redux Toolkit (complex, web-compatible)?
- Zustand (lightweight, works on both platforms)?
- Should it match web state management choices?

### 5.3 Data Persistence & Storage

**Q37:** What storage solutions should the AI generate?
- AsyncStorage (simple key-value)?
- SQLite (relational database)?
- Realm (object database)?
- Should it integrate with existing backend (Neon PostgreSQL)?

**Q38:** How should mobile apps handle authentication?
- OAuth flows (GitHub, Vercel) on mobile?
- Token storage in secure storage?
- Should it reuse web authentication infrastructure?

### 5.4 Expo SDK Features

**Q39:** What Expo SDK modules should the AI be aware of?
- Camera, Location, Notifications, File System, etc.
- Should we create a skill or MCP integration for Expo SDK knowledge?
- Should the AI suggest relevant SDK modules based on user requests?

**Q40:** How do we handle permissions and privacy?
- Camera/location permissions require app.json configuration
- Should the AI automatically add permission declarations?
- Should it warn users about App Store/Play Store requirements?

---

## Category 6: Deployment & Distribution

### 6.1 Build & Deployment

**Q41:** Should Phase 4 include app deployment features?
- **EAS Build** (Expo Application Services) for generating iOS/Android builds?
- **EAS Submit** for App Store/Play Store submission?
- Or is deployment out of scope for Phase 4 (maybe Phase 5)?

**Q42:** How should users get their apps on devices for testing?
- Expo Go only (development)?
- Development builds (requires EAS Build)?
- APK/IPA generation for distribution?

### 6.2 CI/CD Integration

**Q43:** Should mobile projects have CI/CD configured?
- GitHub Actions for EAS Build?
- Automated testing before builds?
- Out of scope for Phase 4?

---

## Category 7: Success Metrics & MVP Scope

### 7.1 Minimum Viable Product (MVP)

**Q44:** What is the MINIMUM functionality for Phase 4 to be considered complete?
- Code generation only (no preview)?
- Web preview only (React Native Web)?
- Full Expo Go preview with QR codes?

**Q45:** Which features can be deferred to Phase 5?
- Advanced navigation patterns?
- Expo SDK integrations?
- EAS Build/deployment?
- Component gallery UI enhancements?

### 7.2 User Testing

**Q46:** How will we validate Phase 4 is working?
- User creates a mobile app with AI in < 30 minutes?
- Preview works on physical device?
- Code quality matches web output?

**Q47:** What are the acceptance criteria for each feature?
| Feature | Acceptance Criteria |
|---------|---------------------|
| Expo Sandbox | Expo CLI runs successfully, metro bundler starts |
| Mobile Preview | Users can view app via Expo Go OR web preview |
| Component Gallery | At least 10 mobile components available |
| AI Prompting | AI correctly detects mobile intent 90%+ of time |
| Cross-Platform | Shared code works on both web and mobile |
| Device Testing | QR code generation works, app loads in Expo Go |

---

## Category 8: Effort & Timeline Estimates

### 8.1 Feature Complexity

**Q48:** Do the roadmap effort estimates seem accurate?
| Feature | Roadmap Estimate | Your Assessment |
|---------|------------------|-----------------|
| Expo Sandbox Environment | L (2 weeks) | ? |
| Mobile Preview Infrastructure | XL (3+ weeks) | ? |
| React Native Component Gallery | L (2 weeks) | ? |
| Mobile-Aware AI Prompting | M (1 week) | ? |
| Cross-Platform Code Sharing | L (2 weeks) | ? |
| Device Preview Testing | M (1 week) | ? |

**Q49:** What are the HIGHEST RISK features (most likely to be difficult or fail)?
1. Mobile Preview Infrastructure (unfamiliar technology, complex setup)?
2. Expo Sandbox Environment (may not be possible in Vercel Sandbox)?
3. Cross-Platform Code Sharing (architectural complexity)?

**Q50:** Should we build a proof-of-concept first?
- Test Expo in Vercel Sandbox before full implementation?
- Validate preview mechanisms work end-to-end?
- Estimated POC timeline?

---

## Category 9: Documentation & Learning Resources

**Q51:** What documentation should we provide for users?
- "Getting Started with Mobile Development in Turbocat"
- "Web vs. Mobile: When to Use Each"
- "Cross-Platform Development Guide"
- Expo SDK API reference?

**Q52:** Should we create tutorial templates?
- "Build a Todo App (Mobile)"
- "Build a Camera App"
- "Build a Cross-Platform Dashboard"

---

## Category 10: Visual Assets & Design

**Q53:** Do you have any visual assets to share?
- Mobile preview UI mockups?
- Component Gallery designs for mobile?
- QR code generation UI designs?
- Platform toggle/selector designs?

**Q54:** Should we create architecture diagrams before implementation?
- Expo Sandbox execution flow
- Mobile preview infrastructure
- Cross-platform code sharing structure
- AI detection and routing logic

---

## Next Steps

After answering these questions, we will:
1. Document all decisions in `requirements.md`
2. Create architecture diagrams (ASCII or visual)
3. Run `/write-spec` to generate detailed specification
4. Validate technical feasibility with proof-of-concept (if needed)
5. Create task breakdown for implementation

---

**Questions Total:** 54 clarifying questions across 10 categories

**Most Critical Questions (Answer First):**
1. **Q1:** Can Vercel Sandbox run Expo projects? (Technical feasibility)
2. **Q4:** What preview mechanism? (Core architecture decision)
3. **Q20:** What React Native component library? (Design system alignment)
4. **Q44:** What is the MVP? (Scope definition)
5. **Q50:** Should we build a POC first? (Risk mitigation)

---

*Clarifying questions generated: 2026-01-04*
