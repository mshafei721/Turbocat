# Technical Design: Publishing Flow

**Feature:** PUB-001 - Publishing Flow
**Last Updated:** 2026-01-12
**Status:** Design Phase

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                         Frontend                            │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Publishing Modal (4 Steps)                        │   │
│  │  ├─ PrerequisitesStep                              │   │
│  │  ├─ AppleCredentialsStep                           │   │
│  │  ├─ ExpoTokenStep                                  │   │
│  │  └─ AppDetailsStep                                 │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            ↕ HTTP / WebSocket
┌─────────────────────────────────────────────────────────────┐
│                         Backend                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  REST API                                          │   │
│  │  ├─ POST /api/v1/publish/initiate                 │   │
│  │  ├─ GET  /api/v1/publish/:id/status               │   │
│  │  └─ POST /api/v1/publish/:id/retry                │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Publishing Service                                 │   │
│  │  ├─ initiatePublishing()                           │   │
│  │  ├─ executeBuildAndSubmit()                        │   │
│  │  └─ pollBuildStatus()                              │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Apple Service                                      │   │
│  │  ├─ validateCredentials()                          │   │
│  │  ├─ createApp()                                    │   │
│  │  └─ uploadBuild()                                  │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Expo Service                                       │   │
│  │  ├─ validateToken()                                │   │
│  │  ├─ startBuild()                                   │   │
│  │  └─ getBuildStatus()                               │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  BullMQ Queue                                       │   │
│  │  └─ 'build-and-submit' jobs                        │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## Database Schema

### New Model: Publishing

```prisma
model Publishing {
  id                  String   @id @default(uuid())
  workflowId          String
  workflow            Workflow @relation(fields: [workflowId], references: [id])

  // Status tracking
  status              String   // INITIATED, BUILDING, SUBMITTING, SUBMITTED, FAILED
  statusMessage       String?

  // Apple Developer credentials
  appleTeamId         String?
  appleKeyId          String?
  appleIssuerId       String?
  applePrivateKey     String?  @db.Text  // Encrypted .p8 content

  // Expo credentials
  expoToken           String?  @db.Text  // Encrypted
  expoBuildId         String?

  // App metadata
  appName             String
  bundleId            String
  version             String   @default("1.0.0")
  description         String   @db.Text
  category            String
  ageRating           String
  supportUrl          String?
  iconUrl             String?

  // Build artifacts
  ipaUrl              String?
  buildLogs           String?  @db.Text

  // Timestamps
  initiatedAt         DateTime @default(now())
  buildStartedAt      DateTime?
  buildCompletedAt    DateTime?
  submittedAt         DateTime?
  failedAt            DateTime?

  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt

  @@index([workflowId])
  @@index([status])
  @@map("publishing")
}
```

### Migration

```sql
CREATE TABLE "publishing" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "workflowId" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "statusMessage" TEXT,
  "appleTeamId" TEXT,
  "appleKeyId" TEXT,
  "appleIssuerId" TEXT,
  "applePrivateKey" TEXT,
  "expoToken" TEXT,
  "expoBuildId" TEXT,
  "appName" TEXT NOT NULL,
  "bundleId" TEXT NOT NULL,
  "version" TEXT NOT NULL DEFAULT '1.0.0',
  "description" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "ageRating" TEXT NOT NULL,
  "supportUrl" TEXT,
  "iconUrl" TEXT,
  "ipaUrl" TEXT,
  "buildLogs" TEXT,
  "initiatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "buildStartedAt" TIMESTAMP(3),
  "buildCompletedAt" TIMESTAMP(3),
  "submittedAt" TIMESTAMP(3),
  "failedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "publishing_workflowId_fkey"
    FOREIGN KEY ("workflowId")
    REFERENCES "workflows"("id")
    ON DELETE CASCADE
    ON UPDATE CASCADE
);

CREATE INDEX "publishing_workflowId_idx" ON "publishing"("workflowId");
CREATE INDEX "publishing_status_idx" ON "publishing"("status");
```

---

## Backend Implementation

### 1. Publishing Service (Full Implementation)

```typescript
// backend/src/services/PublishingService.ts

import { PrismaClient } from '@prisma/client';
import { Queue } from 'bullmq';
import { AppleService } from './AppleService';
import { ExpoService } from './ExpoService';
import crypto from 'crypto';
import axios from 'axios';
import fs from 'fs/promises';

export interface PublishData {
  appleTeamId: string;
  appleKeyId: string;
  appleIssuerId: string;
  applePrivateKey: string; // .p8 file content
  expoToken: string;
  appName: string;
  description: string;
  category: string;
  ageRating: string;
  supportUrl?: string;
  iconUrl?: string;
}

export class PublishingService {
  constructor(
    private prisma: PrismaClient,
    private appleService: AppleService,
    private expoService: ExpoService,
    private publishQueue: Queue,
    private wsService: WebSocketService
  ) {}

  async initiatePublishing(
    userId: string,
    projectId: string,
    publishData: PublishData
  ) {
    // Validate project ownership
    const project = await this.prisma.workflow.findFirst({
      where: { id: projectId, userId, deletedAt: null },
    });

    if (!project) {
      throw new Error('Project not found');
    }

    // Validate Apple credentials
    const appleValid = await this.appleService.validateCredentials(
      publishData.appleTeamId,
      publishData.appleKeyId,
      publishData.appleIssuerId,
      publishData.applePrivateKey
    );

    if (!appleValid) {
      throw new Error('Invalid Apple Developer credentials');
    }

    // Validate Expo token
    const expoValid = await this.expoService.validateToken(publishData.expoToken);

    if (!expoValid) {
      throw new Error('Invalid Expo token');
    }

    // Encrypt sensitive data
    const encryptedPrivateKey = await this.encrypt(publishData.applePrivateKey);
    const encryptedExpoToken = await this.encrypt(publishData.expoToken);

    // Create publishing record
    const publishing = await this.prisma.publishing.create({
      data: {
        workflowId: projectId,
        status: 'INITIATED',
        appleTeamId: publishData.appleTeamId,
        appleKeyId: publishData.appleKeyId,
        appleIssuerId: publishData.appleIssuerId,
        applePrivateKey: encryptedPrivateKey,
        expoToken: encryptedExpoToken,
        appName: publishData.appName,
        bundleId: this.generateBundleId(publishData.appName),
        description: publishData.description,
        category: publishData.category,
        ageRating: publishData.ageRating,
        supportUrl: publishData.supportUrl,
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

    if (!publishing) {
      throw new Error('Publishing record not found');
    }

    try {
      // Update status: Building
      await this.updateStatus(publishingId, 'BUILDING', 'Starting Expo build...');
      await this.prisma.publishing.update({
        where: { id: publishingId },
        data: { buildStartedAt: new Date() },
      });

      // Start Expo build
      const expoToken = await this.decrypt(publishing.expoToken!);
      const buildId = await this.expoService.startBuild(
        publishing.workflow.id,
        'ios',
        expoToken
      );

      await this.prisma.publishing.update({
        where: { id: publishingId },
        data: { expoBuildId: buildId },
      });

      // Emit status update
      this.wsService.emitPublishingStatus(publishing.workflowId, {
        status: 'BUILDING',
        message: 'Building your app... (5-10 minutes)',
        buildId,
      });

      // Poll build status (async)
      const buildStatus = await this.pollBuildStatus(buildId, expoToken, publishingId);

      if (buildStatus.status === 'errored') {
        throw new Error(buildStatus.error || 'Build failed');
      }

      await this.prisma.publishing.update({
        where: { id: publishingId },
        data: {
          buildCompletedAt: new Date(),
          ipaUrl: buildStatus.artifactUrl,
        },
      });

      // Download .ipa
      const ipaPath = await this.downloadBuild(buildStatus.artifactUrl!);

      // Update status: Submitting
      await this.updateStatus(
        publishingId,
        'SUBMITTING',
        'Submitting to App Store...'
      );

      this.wsService.emitPublishingStatus(publishing.workflowId, {
        status: 'SUBMITTING',
        message: 'Submitting to App Store Connect...',
      });

      // Upload to App Store Connect
      const privateKey = await this.decrypt(publishing.applePrivateKey!);
      await this.appleService.uploadBuild(ipaPath, {
        teamId: publishing.appleTeamId!,
        keyId: publishing.appleKeyId!,
        issuerId: publishing.appleIssuerId!,
        privateKey,
      });

      // Update status: Submitted
      await this.updateStatus(
        publishingId,
        'SUBMITTED',
        'Successfully submitted to App Store!'
      );
      await this.prisma.publishing.update({
        where: { id: publishingId },
        data: { submittedAt: new Date() },
      });

      this.wsService.emitPublishingStatus(publishing.workflowId, {
        status: 'SUBMITTED',
        message: 'Your app is now under review. Review typically takes 1-2 days.',
      });

      // Clean up
      await fs.unlink(ipaPath);
    } catch (error) {
      await this.updateStatus(publishingId, 'FAILED', error.message);
      await this.prisma.publishing.update({
        where: { id: publishingId },
        data: { failedAt: new Date() },
      });

      this.wsService.emitPublishingStatus(publishing.workflowId, {
        status: 'FAILED',
        message: error.message,
        error: error,
      });

      throw error;
    }
  }

  private async pollBuildStatus(
    buildId: string,
    token: string,
    publishingId: string
  ) {
    let attempts = 0;
    const maxAttempts = 40; // 20 minutes

    while (attempts < maxAttempts) {
      const status = await this.expoService.getBuildStatus(buildId, token);

      // Emit progress update
      this.wsService.emitPublishingStatus(publishingId, {
        status: 'BUILDING',
        message: `Building... (${Math.floor((attempts / maxAttempts) * 100)}%)`,
        progress: attempts / maxAttempts,
      });

      if (status.status === 'finished' || status.status === 'errored') {
        return status;
      }

      await new Promise((resolve) => setTimeout(resolve, 30000)); // 30s
      attempts++;
    }

    throw new Error('Build timeout after 20 minutes');
  }

  private async downloadBuild(url: string): Promise<string> {
    const response = await axios.get(url, { responseType: 'arraybuffer' });
    const tempPath = `/tmp/build-${Date.now()}.ipa`;
    await fs.writeFile(tempPath, response.data);
    return tempPath;
  }

  private generateBundleId(appName: string): string {
    const sanitized = appName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .slice(0, 20);
    return `com.turbocat.${sanitized}`;
  }

  private async updateStatus(
    publishingId: string,
    status: string,
    message?: string
  ) {
    await this.prisma.publishing.update({
      where: { id: publishingId },
      data: { status, statusMessage: message },
    });
  }

  private async encrypt(text: string): Promise<string> {
    const algorithm = 'aes-256-gcm';
    const key = Buffer.from(process.env.ENCRYPTION_KEY!, 'hex');
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(algorithm, key, iv);

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();

    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
  }

  private async decrypt(encryptedText: string): Promise<string> {
    const algorithm = 'aes-256-gcm';
    const key = Buffer.from(process.env.ENCRYPTION_KEY!, 'hex');

    const [ivHex, authTagHex, encrypted] = encryptedText.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');

    const decipher = crypto.createDecipheriv(algorithm, key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }
}
```

---

## Frontend Implementation

### Publishing Modal Component

```typescript
// turbocat-agent/components/turbocat/PublishingModal.tsx

'use client';

import { useState, useEffect } from 'react';
import { X } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { PrerequisitesStep } from './publishing/PrerequisitesStep';
import { AppleCredentialsStep } from './publishing/AppleCredentialsStep';
import { ExpoTokenStep } from './publishing/ExpoTokenStep';
import { AppDetailsStep } from './publishing/AppDetailsStep';
import { BuildingStep } from './publishing/BuildingStep';
import { useSocket } from '@/lib/hooks/useSocket';

interface PublishingModalProps {
  projectId: string;
  projectName: string;
  onClose: () => void;
}

export function PublishingModal({
  projectId,
  projectName,
  onClose,
}: PublishingModalProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [publishData, setPublishData] = useState({
    appleTeamId: '',
    appleKeyId: '',
    appleIssuerId: '',
    applePrivateKey: '',
    expoToken: '',
    appName: projectName,
    description: '',
    category: 'Utilities',
    ageRating: '4+',
    supportUrl: '',
    iconUrl: '',
  });
  const [publishing, setPublishing] = useState<any>(null);
  const [building, setBuilding] = useState(false);

  const socket = useSocket();

  useEffect(() => {
    if (socket && publishing) {
      socket.emit('subscribe-publishing', publishing.id);

      socket.on('publishing-status', (data) => {
        console.log('Publishing status:', data);
        // Update UI based on status
      });

      return () => {
        socket.emit('unsubscribe-publishing', publishing.id);
        socket.off('publishing-status');
      };
    }
  }, [socket, publishing]);

  const steps = [
    { title: 'Prerequisites', component: PrerequisitesStep },
    { title: 'Apple', component: AppleCredentialsStep },
    { title: 'Expo', component: ExpoTokenStep },
    { title: 'Review', component: AppDetailsStep },
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    try {
      setBuilding(true);

      const res = await fetch(`/api/v1/publish/initiate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
        body: JSON.stringify({
          projectId,
          ...publishData,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to initiate publishing');
      }

      const data = await res.json();
      setPublishing(data.data);
    } catch (error) {
      console.error('Publishing error:', error);
      alert('Failed to start publishing. Please try again.');
      setBuilding(false);
    }
  };

  if (building) {
    return <BuildingStep publishing={publishing} onClose={onClose} />;
  }

  const CurrentStepComponent = steps[currentStep].component;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-background rounded-lg shadow-lg w-[600px] max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold">Publish to App Store</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X size={24} />
          </button>
        </div>

        {/* Progress indicator */}
        <div className="flex items-center justify-center gap-4 p-6 border-b">
          {steps.map((step, index) => (
            <div key={index} className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  index <= currentStep
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {index + 1}
              </div>
              <span className="text-sm">{step.title}</span>
              {index < steps.length - 1 && (
                <div className="w-12 h-px bg-muted mx-2" />
              )}
            </div>
          ))}
        </div>

        <div className="p-6">
          <CurrentStepComponent
            data={publishData}
            onChange={setPublishData}
          />
        </div>

        <div className="flex justify-between p-6 border-t">
          <Button variant="ghost" onClick={handleBack} disabled={currentStep === 0}>
            ← Back
          </Button>
          {currentStep < steps.length - 1 ? (
            <Button onClick={handleNext}>Next →</Button>
          ) : (
            <Button onClick={handleSubmit}>Submit to App Store →</Button>
          )}
        </div>
      </div>
    </div>
  );
}
```

---

## Security Implementation

### Encryption Utilities

```typescript
// backend/src/utils/encryption.ts

import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const KEY = Buffer.from(process.env.ENCRYPTION_KEY!, 'hex');

export function encrypt(text: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);

  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag();

  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

export function decrypt(encryptedText: string): string {
  const [ivHex, authTagHex, encrypted] = encryptedText.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');

  const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}
```

---

## Performance Optimization

- Cache Apple API tokens (20 minutes)
- Parallel validation of Apple + Expo credentials
- Stream build logs instead of polling
- CDN for .ipa downloads
- Queue prioritization for paid users

---

**Last Updated:** 2026-01-12
**Status:** Ready for Implementation
