# Publishing Modal Implementation Plan - Task 3.1

## Goal
Create the PublishingModal component for Epic 4: Publishing Flow with a 4-step wizard interface that allows users to publish their mobile apps to the Apple App Store.

## Scope
- Main PublishingModal component with step navigation
- 5 stub step components (PrerequisitesStep, AppleCredentialsStep, ExpoTokenStep, AppDetailsStep, BuildingStep)
- Form state management and validation
- API integration with backend publishing endpoints
- Comprehensive test coverage (>80%)
- Export configuration

## Non-goals
- Full implementation of individual step components (subsequent tasks)
- Apple/Expo service implementation (already done in Phase 2)
- Publishing service business logic (already done in backend)
- UI polish and animations (can be added later)

## Constraints
- Must use existing AI Native design system components
- Must follow Next.js + React + TypeScript patterns
- Must integrate with existing backend API at `/api/v1/publishing/*`
- Must be mobile-first responsive
- Must meet accessibility standards (ARIA labels, keyboard navigation)

## Assumptions
- Backend API routes are functional and tested
- User is authenticated before opening modal
- projectId is available from parent component
- Environment variables for API endpoints are configured

## Risks
1. **Form state complexity**: Managing multi-step form state
   - Mitigation: Use React state with clear data structure
2. **Validation complexity**: Multiple validation rules across steps
   - Mitigation: Create reusable validation functions
3. **API error handling**: Network errors, validation errors, business logic errors
   - Mitigation: Structured error handling with user-friendly messages
4. **Mobile responsiveness**: Complex form on small screens
   - Mitigation: Mobile-first design, tested on multiple viewports

## Rollback
- If issues arise, the modal can be disabled via feature flag
- No database changes in this task
- Component is isolated and can be removed without affecting other features
- All changes are in new files, no modifications to existing components

## Impact
Files to create:
- `turbocat-agent/components/publishing/PublishingModal.tsx`
- `turbocat-agent/components/publishing/PrerequisitesStep.tsx`
- `turbocat-agent/components/publishing/AppleCredentialsStep.tsx`
- `turbocat-agent/components/publishing/ExpoTokenStep.tsx`
- `turbocat-agent/components/publishing/AppDetailsStep.tsx`
- `turbocat-agent/components/publishing/BuildingStep.tsx`
- `turbocat-agent/components/publishing/index.ts`
- `turbocat-agent/components/publishing/__tests__/PublishingModal.test.tsx`

Dependencies:
- @radix-ui/react-dialog (already installed)
- sonner for toast notifications (already installed)
- zod for validation (already installed)
- react-hook-form (already installed)
