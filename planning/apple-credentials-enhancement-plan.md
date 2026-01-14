# Plan: Enhance AppleCredentialsStep Component

## Goal
Enhance the AppleCredentialsStep component with comprehensive validation, real-time feedback, help instructions, and improved user experience for Epic 4: Publishing Flow.

## Scope
- Add real-time inline validation with visual indicators (checkmarks/errors)
- Implement character counters for Team ID and Key ID fields
- Add collapsible help section with step-by-step instructions
- Add password visibility toggle for private key field
- Implement security badges and warnings
- Add link buttons to Apple documentation
- Create comprehensive test suite with >80% coverage
- Ensure full accessibility compliance

## Non-goals
- Backend credential validation (marked as optional enhancement for later)
- Modifying the PublishingModal integration (already working correctly)
- Changing the form data flow patterns (already established)

## Impact
Files to modify:
- turbocat-agent/components/publishing/AppleCredentialsStep.tsx

Files to create:
- turbocat-agent/components/publishing/__tests__/AppleCredentialsStep.test.tsx

