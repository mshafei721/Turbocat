# Technical Design: OAuth Authentication

**Feature:** AUTH-001 - OAuth Authentication
**Last Updated:** 2026-01-12
**Author:** Engineering Team

---

## Architecture Overview

```
┌─────────────┐      ┌──────────────┐      ┌─────────────┐
│   Browser   │─────>│   Frontend   │─────>│   Backend   │
│             │      │  (Next.js)   │      │  (Express)  │
└─────────────┘      └──────────────┘      └─────────────┘
       │                     │                      │
       │                     │                      │
       v                     v                      v
┌─────────────┐      ┌──────────────┐      ┌─────────────┐
│   Google    │      │   Database   │      │  Supabase   │
│   OAuth     │      │  (Postgres)  │      │    Auth     │
└─────────────┘      └──────────────┘      └─────────────┘
       │
       v
┌─────────────┐
│    Apple    │
│  Sign In    │
└─────────────┘
```

---

## Database Schema Changes

### User Model Updates

**Add New Columns:**
```prisma
model User {
  // ... existing fields ...

  // OAuth fields
  authProvider      String?  // "google", "apple", "email"
  authProviderId    String?  // Provider's unique user ID
  oauthAccessToken  String?  // Encrypted OAuth access token
  oauthRefreshToken String?  // Encrypted OAuth refresh token
  oauthTokenExpiry  DateTime? // Token expiration time

  // Add composite unique index for OAuth
  @@unique([authProvider, authProviderId])
}
```

**Migration File:** `prisma/migrations/YYYYMMDD_add_oauth_fields.sql`

---

## Backend Implementation

### 1. Dependencies

**Add to `backend/package.json`:**
```json
{
  "dependencies": {
    "passport": "^0.7.0",
    "passport-google-oauth20": "^2.0.0",
    "passport-apple": "^2.0.2",
    "@simplewebauthn/server": "^9.0.3"
  }
}
```

### 2. Environment Variables

**Add to `.env`:**
```env
# Google OAuth
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_CALLBACK_URL=http://localhost:3001/auth/google/callback

# Apple OAuth
APPLE_CLIENT_ID=com.turbocat.signin
APPLE_TEAM_ID=your-team-id
APPLE_KEY_ID=your-key-id
APPLE_PRIVATE_KEY_PATH=./apple-auth-key.p8
APPLE_CALLBACK_URL=http://localhost:3001/auth/apple/callback

# OAuth Settings
OAUTH_STATE_SECRET=your-random-secret-64-chars
```

### 3. Passport Configuration

**File:** `backend/src/lib/passport.ts`

```typescript
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as AppleStrategy } from 'passport-apple';
import { prisma } from './prisma';
import { encryptToken, decryptToken } from './crypto';

// Google OAuth Strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      callbackURL: process.env.GOOGLE_CALLBACK_URL!,
      scope: ['profile', 'email'],
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value;
        if (!email) {
          return done(new Error('No email from Google'), undefined);
        }

        // Find or create user
        let user = await prisma.user.findFirst({
          where: {
            OR: [
              { authProvider: 'google', authProviderId: profile.id },
              { email, authProvider: null }, // Link existing email users
            ],
          },
        });

        if (!user) {
          // Create new user
          user = await prisma.user.create({
            data: {
              email,
              fullName: profile.displayName,
              avatarUrl: profile.photos?.[0]?.value,
              authProvider: 'google',
              authProviderId: profile.id,
              emailVerified: true,
              emailVerifiedAt: new Date(),
              oauthAccessToken: encryptToken(accessToken),
              oauthRefreshToken: refreshToken ? encryptToken(refreshToken) : null,
              isActive: true,
            },
          });
        } else if (!user.authProvider) {
          // Link OAuth to existing email user
          user = await prisma.user.update({
            where: { id: user.id },
            data: {
              authProvider: 'google',
              authProviderId: profile.id,
              oauthAccessToken: encryptToken(accessToken),
              oauthRefreshToken: refreshToken ? encryptToken(refreshToken) : null,
              emailVerified: true,
              emailVerifiedAt: new Date(),
              avatarUrl: user.avatarUrl || profile.photos?.[0]?.value,
            },
          });
        } else {
          // Update existing OAuth user tokens
          user = await prisma.user.update({
            where: { id: user.id },
            data: {
              oauthAccessToken: encryptToken(accessToken),
              oauthRefreshToken: refreshToken ? encryptToken(refreshToken) : null,
              lastLoginAt: new Date(),
            },
          });
        }

        return done(null, user);
      } catch (error) {
        return done(error as Error, undefined);
      }
    }
  )
);

// Apple OAuth Strategy
passport.use(
  new AppleStrategy(
    {
      clientID: process.env.APPLE_CLIENT_ID!,
      teamID: process.env.APPLE_TEAM_ID!,
      keyID: process.env.APPLE_KEY_ID!,
      privateKeyPath: process.env.APPLE_PRIVATE_KEY_PATH!,
      callbackURL: process.env.APPLE_CALLBACK_URL!,
      scope: ['name', 'email'],
    },
    async (accessToken, refreshToken, idToken, profile, done) => {
      try {
        const email = profile.email;
        if (!email) {
          return done(new Error('No email from Apple'), undefined);
        }

        // Similar logic to Google strategy
        // ... (implement user creation/linking)

        return done(null, user);
      } catch (error) {
        return done(error as Error, undefined);
      }
    }
  )
);
```

### 4. OAuth Routes

**File:** `backend/src/routes/oauth.ts`

```typescript
import { Router } from 'express';
import passport from 'passport';
import { generateJWT, createSession } from '../services/auth.service';
import { createAuditLog } from '../services/audit.service';
import { logger } from '../lib/logger';

const router = Router();

// Google OAuth - Initiate
router.get('/google', (req, res, next) => {
  const state = generateRandomState(); // CSRF protection
  req.session.oauthState = state;

  passport.authenticate('google', {
    state,
    accessType: 'offline',
    prompt: 'consent',
  })(req, res, next);
});

// Google OAuth - Callback
router.get('/google/callback', async (req, res, next) => {
  // Verify state parameter
  if (req.query.state !== req.session.oauthState) {
    return res.redirect(`${process.env.FRONTEND_URL}/login?error=csrf_mismatch`);
  }

  passport.authenticate('google', { session: false }, async (err, user) => {
    if (err || !user) {
      logger.error('[OAuth] Google authentication failed:', err);
      return res.redirect(`${process.env.FRONTEND_URL}/login?error=auth_failed`);
    }

    try {
      // Generate JWT tokens
      const { accessToken, refreshToken } = generateJWT(user);

      // Create session
      await createSession({
        userId: user.id,
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      });

      // Audit log
      await createAuditLog({
        userId: user.id,
        action: 'USER_LOGIN',
        resourceType: 'user',
        resourceId: user.id,
        metadata: { method: 'google-oauth' },
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      });

      // Redirect to frontend with tokens
      const redirectUrl = new URL(`${process.env.FRONTEND_URL}/auth/callback`);
      redirectUrl.searchParams.set('accessToken', accessToken);
      redirectUrl.searchParams.set('refreshToken', refreshToken);

      res.redirect(redirectUrl.toString());
    } catch (error) {
      logger.error('[OAuth] Session creation failed:', error);
      return res.redirect(`${process.env.FRONTEND_URL}/login?error=session_failed`);
    }
  })(req, res, next);
});

// Apple OAuth routes (similar structure)
router.get('/apple', passport.authenticate('apple'));
router.post('/apple/callback', /* similar to Google callback */);

export default router;
```

### 5. Security Utilities

**File:** `backend/src/lib/oauth-security.ts`

```typescript
import crypto from 'crypto';

/**
 * Generate random state for CSRF protection
 */
export function generateRandomState(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Verify OAuth state parameter
 */
export function verifyState(expected: string, actual: string): boolean {
  return crypto.timingSafeEqual(
    Buffer.from(expected),
    Buffer.from(actual)
  );
}

/**
 * Encrypt OAuth tokens before storing
 */
export function encryptToken(token: string): string {
  const cipher = crypto.createCipheriv(
    'aes-256-gcm',
    Buffer.from(process.env.ENCRYPTION_KEY!, 'hex'),
    crypto.randomBytes(16)
  );

  let encrypted = cipher.update(token, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');

  return `${encrypted}:${authTag}`;
}

/**
 * Decrypt OAuth tokens when retrieving
 */
export function decryptToken(encryptedToken: string): string {
  const [encrypted, authTag] = encryptedToken.split(':');

  const decipher = crypto.createDecipheriv(
    'aes-256-gcm',
    Buffer.from(process.env.ENCRYPTION_KEY!, 'hex'),
    crypto.randomBytes(16)
  );

  decipher.setAuthTag(Buffer.from(authTag, 'hex'));

  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}
```

---

## Frontend Implementation

### 1. OAuth Button Component

**File:** `turbocat-agent/components/auth/OAuthButtons.tsx`

```tsx
'use client';

import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { GoogleLogo, AppleLogo, Spinner } from '@phosphor-icons/react';

export function OAuthButtons() {
  const router = useRouter();
  const [loading, setLoading] = useState<'google' | 'apple' | null>(null);

  const handleGoogleLogin = () => {
    setLoading('google');
    window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/auth/google`;
  };

  const handleAppleLogin = () => {
    setLoading('apple');
    window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/auth/apple`;
  };

  return (
    <div className="flex flex-col gap-3 w-full">
      <Button
        variant="outline"
        size="lg"
        onClick={handleGoogleLogin}
        disabled={loading !== null}
        className="w-full justify-start gap-3"
      >
        {loading === 'google' ? (
          <Spinner className="animate-spin" size={20} />
        ) : (
          <GoogleLogo size={20} />
        )}
        Continue with Google
      </Button>

      <Button
        variant="outline"
        size="lg"
        onClick={handleAppleLogin}
        disabled={loading !== null}
        className="w-full justify-start gap-3 bg-black text-white hover:bg-black/90 dark:bg-white dark:text-black"
      >
        {loading === 'apple' ? (
          <Spinner className="animate-spin" size={20} />
        ) : (
          <AppleLogo size={20} weight="fill" />
        )}
        Continue with Apple
      </Button>
    </div>
  );
}
```

### 2. OAuth Callback Handler

**File:** `turbocat-agent/app/auth/callback/page.tsx`

```tsx
'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Spinner } from '@phosphor-icons/react';

export default function OAuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const accessToken = searchParams.get('accessToken');
    const refreshToken = searchParams.get('refreshToken');
    const error = searchParams.get('error');

    if (error) {
      // Handle OAuth error
      const errorMessages: Record<string, string> = {
        csrf_mismatch: 'Security validation failed. Please try again.',
        auth_failed: 'Authentication failed. Please try again.',
        session_failed: 'Failed to create session. Please try again.',
      };

      const message = errorMessages[error] || 'An error occurred during sign in.';
      router.push(`/login?error=${encodeURIComponent(message)}`);
      return;
    }

    if (accessToken && refreshToken) {
      // Store tokens
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);

      // Redirect to dashboard
      router.push('/dashboard');
    } else {
      // Missing tokens
      router.push('/login?error=missing_tokens');
    }
  }, [searchParams, router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4">
      <Spinner className="animate-spin" size={48} />
      <p className="text-muted-foreground">Completing sign in...</p>
    </div>
  );
}
```

### 3. Update Login Page

**File:** `turbocat-agent/app/(auth)/login/page.tsx`

```tsx
import { OAuthButtons } from '@/components/auth/OAuthButtons';
import { LoginForm } from '@/components/auth/LoginForm';

export default function LoginPage() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 min-h-screen">
      {/* Left side - Auth */}
      <div className="flex flex-col items-center justify-center p-8">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold">Welcome back</h1>
            <p className="text-muted-foreground mt-2">
              Continue where you left off
            </p>
          </div>

          {/* OAuth Buttons */}
          <OAuthButtons />

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Or
              </span>
            </div>
          </div>

          {/* Email/Password Form */}
          <LoginForm />

          <p className="text-center text-sm text-muted-foreground">
            New to Vibecode?{' '}
            <a href="/register" className="text-primary hover:underline">
              Create an account
            </a>
          </p>
        </div>
      </div>

      {/* Right side - Hero */}
      <div className="hidden md:flex flex-col items-center justify-center bg-muted p-8">
        {/* Hero content */}
      </div>
    </div>
  );
}
```

---

## API Endpoints

### OAuth Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/auth/google` | Initiate Google OAuth flow |
| GET | `/auth/google/callback` | Handle Google OAuth callback |
| GET | `/auth/apple` | Initiate Apple Sign In flow |
| POST | `/auth/apple/callback` | Handle Apple Sign In callback |

### Request/Response Examples

**Successful OAuth Redirect:**
```
GET /auth/callback?accessToken=eyJ...&refreshToken=eyJ...
```

**OAuth Error Redirect:**
```
GET /login?error=auth_failed
```

---

## Security Considerations

### 1. CSRF Protection
- Generate random state parameter
- Store in session
- Verify on callback

### 2. Token Storage
- Encrypt OAuth tokens at rest (AES-256-GCM)
- Store encryption key in environment variable
- Never expose tokens in logs

### 3. Scope Minimization
- Only request necessary scopes: profile, email
- Don't request offline access unless needed

### 4. HTTPS Requirement
- All OAuth flows MUST use HTTPS in production
- Local development can use HTTP with localhost exception

---

## Testing Strategy

### Unit Tests
- Test OAuth strategy configuration
- Test token encryption/decryption
- Test state generation/verification
- Test user creation/linking logic

### Integration Tests
- Test full OAuth flow with test accounts
- Test error handling (invalid state, missing email, etc.)
- Test account linking scenarios
- Test session creation after OAuth

### Manual Testing Checklist
- [ ] Google OAuth signup (new user)
- [ ] Google OAuth login (existing user)
- [ ] Apple Sign In signup (new user)
- [ ] Apple Sign In login (existing user)
- [ ] Account linking (email user → OAuth)
- [ ] Error handling (cancelled, failed, etc.)
- [ ] Token refresh functionality
- [ ] Logout and re-login

---

## Monitoring & Logging

### Metrics to Track
- OAuth signup conversion rate
- OAuth login success rate
- OAuth provider distribution (Google vs Apple)
- Average OAuth flow completion time
- OAuth error rates by type

### Logging Events
```typescript
// Success
logger.info('[OAuth] User authenticated', {
  userId: user.id,
  provider: 'google',
  isNewUser: true,
});

// Failure
logger.error('[OAuth] Authentication failed', {
  provider: 'google',
  error: err.message,
  stack: err.stack,
});
```

---

## Rollback Plan

### If OAuth Fails in Production
1. **Immediate:** Disable OAuth buttons in frontend (feature flag)
2. **Communication:** Alert users via status page
3. **Fallback:** Email/password remains functional
4. **Investigation:** Review logs for error patterns
5. **Fix:** Deploy hotfix if identified
6. **Re-enable:** Gradually enable OAuth with monitoring

### Feature Flag
```typescript
// environment variable
FEATURE_OAUTH_ENABLED=true

// in component
const oauthEnabled = process.env.NEXT_PUBLIC_FEATURE_OAUTH_ENABLED === 'true';
```

---

## Performance Optimization

### Caching
- Cache OAuth provider public keys (1 hour TTL)
- Cache user profile data from providers

### Connection Pooling
- Reuse HTTP connections to OAuth providers
- Configure keep-alive headers

### Async Processing
- Don't block OAuth callback on non-critical operations
- Create audit logs asynchronously

---

## Documentation

### For Users
- Help article: "How to sign in with Google/Apple"
- FAQ: "What data does Turbocat access from my Google/Apple account?"
- Privacy policy update: OAuth data handling

### For Developers
- API documentation: OAuth endpoints
- Setup guide: Configuring OAuth providers
- Troubleshooting guide: Common OAuth issues

---

## Future Enhancements

### Phase 2 (After Launch)
1. **GitHub OAuth** - For developer users
2. **Microsoft OAuth** - For enterprise users
3. **Account Settings** - Manage linked OAuth providers
4. **OAuth Token Refresh** - Background job to refresh expired tokens
5. **Social Profile Sync** - Auto-update avatar/name from provider

---

**Last Updated:** 2026-01-12
**Status:** Ready for Implementation
**Estimated Effort:** 5-8 developer days
