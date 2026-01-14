# Technical Design: Settings & Account Management

**Feature:** SET-001
**Last Updated:** 2026-01-12

---

## Database Schema Updates

```prisma
model User {
  // Existing fields...
  avatarUrl        String?
  emailVerified    Boolean  @default(false)
  emailVerifiedAt  DateTime?

  // New relations
  sessions         Session[]
  oauthAccounts    OAuthAccount[]
}

model Session {
  id          String   @id @default(uuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id])
  token       String   @unique
  ipAddress   String?
  userAgent   String?
  expiresAt   DateTime
  createdAt   DateTime @default(now())

  @@index([userId])
}

model OAuthAccount {
  id          String   @id @default(uuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id])
  provider    String   // "google" | "apple"
  providerId  String
  email       String?
  createdAt   DateTime @default(now())

  @@unique([provider, providerId])
  @@index([userId])
}
```

---

## Backend Implementation

### UserService Updates

```typescript
// backend/src/services/UserService.ts

export class UserService {
  async updateProfile(userId: string, data: {
    name?: string;
    email?: string;
    avatarUrl?: string;
  }) {
    if (data.email) {
      // Check if email already exists
      const existing = await this.prisma.user.findUnique({
        where: { email: data.email },
      });

      if (existing && existing.id !== userId) {
        throw new Error('Email already in use');
      }

      // Mark as unverified, send verification email
      await this.sendVerificationEmail(data.email);
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: {
        ...data,
        emailVerified: data.email ? false : undefined,
      },
    });
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    if (!user || !user.passwordHash) {
      throw new Error('User not found');
    }

    const valid = await bcrypt.compare(currentPassword, user.passwordHash);

    if (!valid) {
      throw new Error('Current password is incorrect');
    }

    const newHash = await bcrypt.hash(newPassword, 12);

    return this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newHash },
    });
  }

  async getSessions(userId: string) {
    return this.prisma.session.findMany({
      where: { userId, expiresAt: { gte: new Date() } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async revokeSession(userId: string, sessionId: string) {
    const session = await this.prisma.session.findUnique({
      where: { id: sessionId },
    });

    if (session?.userId !== userId) {
      throw new Error('Unauthorized');
    }

    return this.prisma.session.delete({ where: { id: sessionId } });
  }

  async getOAuthAccounts(userId: string) {
    return this.prisma.oauthAccount.findMany({
      where: { userId },
    });
  }

  async disconnectOAuth(userId: string, provider: string) {
    // Check if user has password auth
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    if (!user?.passwordHash) {
      throw new Error('Cannot disconnect only authentication method');
    }

    return this.prisma.oauthAccount.deleteMany({
      where: { userId, provider },
    });
  }

  async deleteAccount(userId: string) {
    // Soft delete + anonymize
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        email: `deleted-${userId}@turbocat.ai`,
        name: 'Deleted User',
        passwordHash: null,
        avatarUrl: null,
        deletedAt: new Date(),
      },
    });
  }
}
```

---

## Frontend Implementation

### Settings Page

```typescript
// turbocat-agent/app/(dashboard)/settings/page.tsx

'use client';

import { useState } from 'react';
import { ProfileSection } from '@/components/settings/ProfileSection';
import { SecuritySection } from '@/components/settings/SecuritySection';
import { ConnectionsSection } from '@/components/settings/ConnectionsSection';
import { DangerZone } from '@/components/settings/DangerZone';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('profile');

  return (
    <div className="container max-w-4xl py-8">
      <h1 className="text-3xl font-bold mb-8">Settings</h1>

      <div className="flex gap-8">
        {/* Sidebar */}
        <nav className="w-48 space-y-2">
          {[
            { id: 'profile', label: 'Profile' },
            { id: 'security', label: 'Security' },
            { id: 'connections', label: 'Connections' },
            { id: 'danger', label: 'Danger Zone' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full text-left px-4 py-2 rounded-lg ${
                activeTab === tab.id ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        {/* Content */}
        <div className="flex-1">
          {activeTab === 'profile' && <ProfileSection />}
          {activeTab === 'security' && <SecuritySection />}
          {activeTab === 'connections' && <ConnectionsSection />}
          {activeTab === 'danger' && <DangerZone />}
        </div>
      </div>
    </div>
  );
}
```

---

**Last Updated:** 2026-01-12
