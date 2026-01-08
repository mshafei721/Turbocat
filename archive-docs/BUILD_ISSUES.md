# Build Issues - Turbocat Project

**Last Updated:** 2026-01-05
**Status:** ⚠️ BLOCKED - Production build failing

---

## Current Issue: Turbopack + Native Modules on Windows

### Severity: HIGH (Blocks production deployment)

### Description
Production build fails when using `next build --turbopack` due to incompatibility with Tailwind CSS v4 native Node.js modules on Windows.

### Error Details

**Command:** `npm run build` (executes `next build --turbopack`)

**Failure Point:** PostCSS processing of `app/globals.css`

**Error Message:**
```
Error: Turbopack build failed with 7 errors:
./node_modules/.pnpm/lightningcss@1.30.1/node_modules/lightningcss/node/index.js
non-ecmascript placeable asset
asset is not placeable in ESM chunks, so it doesn't have a module id

Error: Cannot find module 'unknown'
```

**Affected Modules:**
- `lightningcss@1.30.1` (native binary for CSS optimization)
- `@tailwindcss/oxide@4.1.14` (native Rust module for Tailwind)

**Root Cause:**
Turbopack on Windows cannot properly load native Node.js modules that require platform-specific binaries. The modules are looking for `../pkg` or platform-specific variants like `lightningcss-win32-x64-msvc` but failing to resolve them.

---

## Environment Details

**Platform:** Windows (win32)
**Node Version:** [Determined by environment]
**Package Manager:** pnpm 10.12.1
**Next.js Version:** 16.0.10
**Turbopack:** Enabled by default for build
**Tailwind CSS:** v4.1.13 (using native Rust modules)

---

## What Works

✅ **Development Server:** `npm run dev` (uses `--webpack` flag)
- Server starts successfully on http://localhost:3000
- All pages render correctly
- All 6 agents functional
- No console errors
- Turbocat branding displays correctly

✅ **Testing:** `npm test`
- All unit tests pass
- All integration tests pass
- Logo component tests: 4/4 passing
- API key retrieval tests: 7/7 passing
- Branding integration tests: 6/6 passing

✅ **Type Checking:** `npm run type-check`
- No TypeScript errors

✅ **Linting:** `npm run lint`
- No ESLint errors

---

## Attempted Solutions

### 1. Clean Build Cache
```bash
rm -rf .next
npm run build
```
**Result:** ❌ Same error

### 2. Reinstall Dependencies
```bash
pnpm install --force
```
**Result:** ❌ Same error

### 3. Install shiki Explicitly
```bash
pnpm install shiki
```
**Result:** ❌ Resolved shiki warnings but native module errors persist

### 4. Build with Default (Turbopack)
```bash
npx next build
```
**Result:** ❌ Next.js 16 defaults to Turbopack, same errors

---

## Potential Solutions

### Option 1: Switch to Webpack Build (Recommended Short-Term)

**Rationale:** Dev server works with webpack, production build should too

**Implementation:**
1. Update `package.json`:
   ```json
   "scripts": {
     "build": "next build --webpack"
   }
   ```

2. Test locally:
   ```bash
   npm run build
   ```

3. If successful, proceed with deployment

**Pros:**
- Quick fix
- Known to work (dev server uses webpack successfully)
- Low risk

**Cons:**
- Slower build times vs. Turbopack
- Not using latest Next.js build optimization

---

### Option 2: Deploy and Let Vercel Handle It

**Rationale:** Vercel's build environment is Linux-based and may handle native modules correctly

**Implementation:**
1. Commit all changes
2. Push to Vercel (preview deployment first)
3. Let Vercel's build system attempt the build
4. Monitor build logs

**Pros:**
- No local code changes needed
- Vercel's Linux environment may not have the same issue
- Turbopack benefits if successful

**Cons:**
- Uncertain if it will work
- Consumes Vercel build minutes
- May waste time if it fails

---

### Option 3: Downgrade Tailwind CSS to v3

**Rationale:** Tailwind CSS v3 doesn't use native Rust modules

**Implementation:**
1. Update `package.json`:
   ```json
   "devDependencies": {
     "tailwindcss": "^3.4.0",
     "@tailwindcss/postcss": "remove this line"
   }
   ```

2. Update `postcss.config.mjs` to v3 syntax
3. Update `tailwind.config.js` to v3 format
4. Test thoroughly

**Pros:**
- Likely to resolve build issues
- Proven stable

**Cons:**
- Large refactor required
- Lose Tailwind v4 features
- Risk of breaking existing styles

---

### Option 4: Wait for Next.js/Turbopack Fix

**Rationale:** This is a known issue that may be fixed in upcoming Next.js releases

**Implementation:**
1. Monitor Next.js GitHub issues
2. Test with Next.js canary builds
3. Deploy once fixed

**Pros:**
- No code changes
- Proper long-term solution

**Cons:**
- Blocks deployment indefinitely
- No ETA on fix

---

## Recommendation

**Immediate Action:** Option 1 (Switch to Webpack)

**Reasoning:**
1. Dev server proves webpack works with current code
2. Lowest risk approach
3. Can be implemented in < 5 minutes
4. Can revert to Turbopack later when issue is resolved

**Follow-Up:**
- Monitor Next.js issues for Turbopack + native modules on Windows
- Test future Next.js versions
- Re-enable Turbopack when stable

---

## Impact Assessment

### Build Failure Impact
- ⚠️ **Production Deployment:** BLOCKED (cannot create production build locally)
- ✅ **Development:** No impact (dev server works)
- ✅ **Testing:** No impact (all tests pass)
- ✅ **Functionality:** No impact (all features work in dev)

### Vercel Deployment Impact
- ❓ **Unknown:** Vercel builds on Linux, may succeed despite local failure
- 💡 **Recommendation:** Test with preview deployment first

---

## Historical Build Data

### Previous Successful Builds

**Task Group 2.4:** ✅ Build succeeded
- Date: During branding transformation
- Command: `npm run build`
- Note: Build was working at this point

**Task Group 6.5:** ✅ Build succeeded
- Date: During branding transformation
- Command: `npm run build`
- Duration: 38.5s
- Routes: 33 generated successfully

**Current Status:** ❌ Build failing
- First failure: Task Group 12.1 (Pre-deployment verification)
- Possible cause: pnpm lock state or environment change

---

## Action Items

- [ ] Decision: Choose solution approach (recommend Option 1)
- [ ] Implementation: Apply chosen solution
- [ ] Testing: Verify build succeeds locally
- [ ] Deployment: Test on Vercel preview environment
- [ ] Documentation: Update build notes in README
- [ ] Monitoring: Track Next.js/Turbopack issues for permanent fix

---

## Related Issues

- Next.js GitHub: [Search for Turbopack + native modules](https://github.com/vercel/next.js/issues)
- Tailwind CSS v4: [Native module discussions](https://github.com/tailwindlabs/tailwindcss/discussions)

---

## Version History

| Date | Version | Changes | Author |
|------|---------|---------|--------|
| 2026-01-05 | 1.0 | Documented Turbopack build failure | Claude (DevOps Engineer) |
