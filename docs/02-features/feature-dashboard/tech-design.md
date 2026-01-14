# Technical Design: Dashboard & Project Management

**Feature:** DASH-001 - Dashboard & Project Management
**Last Updated:** 2026-01-12
**Status:** Design Phase

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                         Frontend                            │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Dashboard Page                                     │   │
│  │  ├─ ProjectGrid                                     │   │
│  │  │  ├─ ProjectCard (x N)                           │   │
│  │  │  └─ EmptyState                                   │   │
│  │  └─ ProjectSearch                                   │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  New Project Page                                   │   │
│  │  └─ NewProjectForm                                  │   │
│  │     ├─ PromptInput                                  │   │
│  │     ├─ PlatformSelector                             │   │
│  │     └─ ModelSelector                                │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Project Edit Page (Split Layout)                  │   │
│  │  ├─ ChatPanel                                       │   │
│  │  │  ├─ ChatMessage (x N)                           │   │
│  │  │  └─ PromptInput                                  │   │
│  │  └─ MobilePreview                                   │   │
│  │     ├─ DeviceFrame                                  │   │
│  │     ├─ PreviewRenderer                              │   │
│  │     └─ PreviewControls                              │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            ↕ HTTP / WebSocket
┌─────────────────────────────────────────────────────────────┐
│                         Backend                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  REST API (Express)                                 │   │
│  │  ├─ /api/v1/projects (CRUD)                        │   │
│  │  ├─ /api/v1/projects/:id/chat                      │   │
│  │  └─ /api/v1/projects/:id/preview                   │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  WebSocket Server (Socket.io)                      │   │
│  │  └─ /api/v1/projects/:id/preview/stream            │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Preview Service                                    │   │
│  │  ├─ Bundler (Metro / Vite)                         │   │
│  │  ├─ Cache (Redis)                                   │   │
│  │  └─ Error Handler                                   │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Database (PostgreSQL via Prisma)                  │   │
│  │  ├─ Workflow (projects)                             │   │
│  │  ├─ ChatMessage                                     │   │
│  │  └─ ExecutionLog (legacy)                           │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## Database Schema Changes

### New Model: ChatMessage

```prisma
model ChatMessage {
  id          String   @id @default(uuid())
  workflowId  String
  workflow    Workflow @relation(fields: [workflowId], references: [id], onDelete: Cascade)

  role        String   // "user" | "assistant"
  content     String   @db.Text

  // Metadata for rich AI responses
  metadata    Json?    // { codeChanges: [], designDecisions: [], colorPalette: {} }

  // For tracking response quality
  regenerated Boolean  @default(false)

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([workflowId, createdAt])
  @@map("chat_messages")
}
```

### Updated Model: Workflow (Project)

```prisma
model Workflow {
  // Existing fields...
  id          String   @id @default(uuid())
  userId      String
  name        String
  description String?

  // New project-specific fields
  projectName        String   // User-friendly name
  projectDescription String?  // Natural language description
  platform           String   // "mobile" | "web"
  selectedModel      String   @default("claude-opus-4.5")

  // Preview metadata
  thumbnailUrl       String?
  previewCode        String?  @db.Text
  previewError       String?  @db.Text
  previewUpdatedAt   DateTime?

  // Relations
  chatMessages       ChatMessage[]

  // Existing fields...
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  deletedAt   DateTime?

  @@index([userId, deletedAt, updatedAt])
}
```

### Migration Script

```typescript
// prisma/migrations/YYYYMMDDHHMMSS_add_project_features/migration.sql

-- Create ChatMessage table
CREATE TABLE "chat_messages" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "workflowId" TEXT NOT NULL,
  "role" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "metadata" JSONB,
  "regenerated" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "chat_messages_workflowId_fkey"
    FOREIGN KEY ("workflowId")
    REFERENCES "workflows"("id")
    ON DELETE CASCADE
    ON UPDATE CASCADE
);

CREATE INDEX "chat_messages_workflowId_createdAt_idx"
  ON "chat_messages"("workflowId", "createdAt");

-- Add new columns to Workflow
ALTER TABLE "workflows" ADD COLUMN "projectName" TEXT;
ALTER TABLE "workflows" ADD COLUMN "projectDescription" TEXT;
ALTER TABLE "workflows" ADD COLUMN "platform" TEXT DEFAULT 'mobile';
ALTER TABLE "workflows" ADD COLUMN "selectedModel" TEXT DEFAULT 'claude-opus-4.5';
ALTER TABLE "workflows" ADD COLUMN "thumbnailUrl" TEXT;
ALTER TABLE "workflows" ADD COLUMN "previewCode" TEXT;
ALTER TABLE "workflows" ADD COLUMN "previewError" TEXT;
ALTER TABLE "workflows" ADD COLUMN "previewUpdatedAt" TIMESTAMP(3);

-- Backfill projectName from name for existing workflows
UPDATE "workflows" SET "projectName" = "name" WHERE "projectName" IS NULL;

-- Make projectName required
ALTER TABLE "workflows" ALTER COLUMN "projectName" SET NOT NULL;

-- Create index for efficient dashboard queries
CREATE INDEX "workflows_userId_deletedAt_updatedAt_idx"
  ON "workflows"("userId", "deletedAt", "updatedAt");
```

---

## Backend Implementation

### 1. Project Controller

```typescript
// backend/src/controllers/ProjectController.ts

import { Request, Response } from 'express';
import { ProjectService } from '../services/ProjectService';
import { AuthRequest } from '../middleware/auth';

export class ProjectController {
  constructor(private projectService: ProjectService) {}

  // GET /api/v1/projects
  async listProjects(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.id;
      const { search, platform, sortBy = 'updatedAt', order = 'desc' } = req.query;

      const projects = await this.projectService.listProjects(userId, {
        search: search as string,
        platform: platform as string,
        sortBy: sortBy as string,
        order: order as 'asc' | 'desc',
      });

      return res.json({
        success: true,
        data: projects,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch projects',
      });
    }
  }

  // POST /api/v1/projects
  async createProject(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.id;
      const { projectName, projectDescription, platform, selectedModel } = req.body;

      // Validation
      if (!projectName || projectName.length < 3) {
        return res.status(400).json({
          success: false,
          error: 'Project name must be at least 3 characters',
        });
      }

      if (!projectDescription || projectDescription.length < 10) {
        return res.status(400).json({
          success: false,
          error: 'Project description must be at least 10 characters',
        });
      }

      if (!['mobile', 'web'].includes(platform)) {
        return res.status(400).json({
          success: false,
          error: 'Platform must be "mobile" or "web"',
        });
      }

      const project = await this.projectService.createProject(userId, {
        projectName,
        projectDescription,
        platform,
        selectedModel: selectedModel || 'claude-opus-4.5',
      });

      return res.status(201).json({
        success: true,
        data: project,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: 'Failed to create project',
      });
    }
  }

  // GET /api/v1/projects/:id
  async getProject(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.id;
      const { id } = req.params;

      const project = await this.projectService.getProject(userId, id);

      if (!project) {
        return res.status(404).json({
          success: false,
          error: 'Project not found',
        });
      }

      return res.json({
        success: true,
        data: project,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch project',
      });
    }
  }

  // GET /api/v1/projects/:id/chat
  async getChatHistory(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.id;
      const { id } = req.params;
      const { limit = 50, offset = 0 } = req.query;

      const messages = await this.projectService.getChatHistory(
        userId,
        id,
        parseInt(limit as string),
        parseInt(offset as string)
      );

      return res.json({
        success: true,
        data: messages,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch chat history',
      });
    }
  }

  // POST /api/v1/projects/:id/chat
  async sendChatMessage(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.id;
      const { id } = req.params;
      const { message } = req.body;

      if (!message || message.length < 1) {
        return res.status(400).json({
          success: false,
          error: 'Message cannot be empty',
        });
      }

      const result = await this.projectService.sendChatMessage(userId, id, message);

      return res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: 'Failed to send message',
      });
    }
  }

  // GET /api/v1/projects/:id/preview
  async getPreview(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.id;
      const { id } = req.params;

      const preview = await this.projectService.getPreview(userId, id);

      if (!preview) {
        return res.status(404).json({
          success: false,
          error: 'Preview not available',
        });
      }

      return res.json({
        success: true,
        data: preview,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch preview',
      });
    }
  }
}
```

### 2. Project Service

```typescript
// backend/src/services/ProjectService.ts

import { PrismaClient } from '@prisma/client';
import { WorkflowService } from './WorkflowService';
import { PreviewService } from './PreviewService';
import { Queue } from 'bullmq';

export interface ProjectListOptions {
  search?: string;
  platform?: string;
  sortBy: string;
  order: 'asc' | 'desc';
}

export interface CreateProjectData {
  projectName: string;
  projectDescription: string;
  platform: string;
  selectedModel: string;
}

export class ProjectService {
  constructor(
    private prisma: PrismaClient,
    private workflowService: WorkflowService,
    private previewService: PreviewService,
    private executionQueue: Queue
  ) {}

  async listProjects(userId: string, options: ProjectListOptions) {
    const { search, platform, sortBy, order } = options;

    const where: any = {
      userId,
      deletedAt: null,
    };

    if (search) {
      where.OR = [
        { projectName: { contains: search, mode: 'insensitive' } },
        { projectDescription: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (platform) {
      where.platform = platform;
    }

    const projects = await this.prisma.workflow.findMany({
      where,
      select: {
        id: true,
        projectName: true,
        projectDescription: true,
        platform: true,
        thumbnailUrl: true,
        updatedAt: true,
        createdAt: true,
      },
      orderBy: {
        [sortBy]: order,
      },
    });

    return projects.map((p) => ({
      ...p,
      relativeTime: this.getRelativeTime(p.updatedAt),
    }));
  }

  async createProject(userId: string, data: CreateProjectData) {
    // Create workflow record
    const workflow = await this.workflowService.createWorkflow({
      userId,
      name: `${data.projectName} Workflow`,
      projectName: data.projectName,
      projectDescription: data.projectDescription,
      platform: data.platform,
      selectedModel: data.selectedModel,
      type: 'WORKFLOW',
    });

    // Create initial chat message from user
    await this.prisma.chatMessage.create({
      data: {
        workflowId: workflow.id,
        role: 'user',
        content: data.projectDescription,
      },
    });

    // Queue workflow execution (AI will start generating)
    await this.executionQueue.add('execute-workflow', {
      workflowId: workflow.id,
      userId,
      initialPrompt: data.projectDescription,
      platform: data.platform,
      model: data.selectedModel,
    });

    return workflow;
  }

  async getProject(userId: string, projectId: string) {
    const project = await this.prisma.workflow.findFirst({
      where: {
        id: projectId,
        userId,
        deletedAt: null,
      },
      include: {
        chatMessages: {
          orderBy: {
            createdAt: 'asc',
          },
          take: 50,
        },
      },
    });

    return project;
  }

  async getChatHistory(
    userId: string,
    projectId: string,
    limit: number = 50,
    offset: number = 0
  ) {
    // Verify ownership
    const project = await this.prisma.workflow.findFirst({
      where: { id: projectId, userId, deletedAt: null },
    });

    if (!project) {
      throw new Error('Project not found');
    }

    const messages = await this.prisma.chatMessage.findMany({
      where: { workflowId: projectId },
      orderBy: { createdAt: 'asc' },
      skip: offset,
      take: limit,
    });

    return messages;
  }

  async sendChatMessage(userId: string, projectId: string, message: string) {
    // Verify ownership
    const project = await this.prisma.workflow.findFirst({
      where: { id: projectId, userId, deletedAt: null },
    });

    if (!project) {
      throw new Error('Project not found');
    }

    // Save user message
    const userMessage = await this.prisma.chatMessage.create({
      data: {
        workflowId: projectId,
        role: 'user',
        content: message,
      },
    });

    // Queue new execution for AI response
    await this.executionQueue.add('execute-workflow', {
      workflowId: projectId,
      userId,
      message,
      platform: project.platform,
      model: project.selectedModel,
    });

    return { message: userMessage };
  }

  async getPreview(userId: string, projectId: string) {
    const project = await this.prisma.workflow.findFirst({
      where: { id: projectId, userId, deletedAt: null },
      select: {
        previewCode: true,
        previewError: true,
        previewUpdatedAt: true,
      },
    });

    if (!project) {
      throw new Error('Project not found');
    }

    return {
      code: project.previewCode,
      error: project.previewError,
      updatedAt: project.previewUpdatedAt,
    };
  }

  private getRelativeTime(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
    return `${Math.floor(diffDays / 30)}mo ago`;
  }
}
```

### 3. Preview Service

```typescript
// backend/src/services/PreviewService.ts

import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';
import { bundleCode } from '../utils/bundler';

export class PreviewService {
  constructor(
    private prisma: PrismaClient,
    private redis: Redis
  ) {}

  async generatePreview(workflowId: string, code: string, platform: string) {
    try {
      // Bundle code for preview
      const bundled = await bundleCode(code, platform);

      // Cache in Redis (1 hour TTL)
      await this.redis.setex(
        `preview:${workflowId}`,
        3600,
        JSON.stringify(bundled)
      );

      // Update workflow
      await this.prisma.workflow.update({
        where: { id: workflowId },
        data: {
          previewCode: bundled.code,
          previewError: null,
          previewUpdatedAt: new Date(),
        },
      });

      return bundled;
    } catch (error) {
      // Save error
      await this.prisma.workflow.update({
        where: { id: workflowId },
        data: {
          previewError: error.message,
          previewUpdatedAt: new Date(),
        },
      });

      throw error;
    }
  }

  async getCachedPreview(workflowId: string) {
    const cached = await this.redis.get(`preview:${workflowId}`);
    return cached ? JSON.parse(cached) : null;
  }
}
```

### 4. WebSocket Server

```typescript
// backend/src/services/WebSocketService.ts

import { Server } from 'socket.io';
import { Server as HttpServer } from 'http';
import jwt from 'jsonwebtoken';

export class WebSocketService {
  private io: Server;

  constructor(httpServer: HttpServer) {
    this.io = new Server(httpServer, {
      cors: {
        origin: process.env.FRONTEND_URL,
        credentials: true,
      },
      path: '/api/v1/ws',
    });

    this.setupMiddleware();
    this.setupHandlers();
  }

  private setupMiddleware() {
    this.io.use((socket, next) => {
      const token = socket.handshake.auth.token;

      if (!token) {
        return next(new Error('Authentication required'));
      }

      try {
        const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET!);
        socket.data.userId = (decoded as any).userId;
        next();
      } catch (error) {
        next(new Error('Invalid token'));
      }
    });
  }

  private setupHandlers() {
    this.io.on('connection', (socket) => {
      console.log(`User connected: ${socket.data.userId}`);

      socket.on('subscribe-project', (projectId: string) => {
        socket.join(`project:${projectId}`);
      });

      socket.on('unsubscribe-project', (projectId: string) => {
        socket.leave(`project:${projectId}`);
      });

      socket.on('disconnect', () => {
        console.log(`User disconnected: ${socket.data.userId}`);
      });
    });
  }

  // Emit preview update to all subscribers
  emitPreviewUpdate(projectId: string, data: any) {
    this.io.to(`project:${projectId}`).emit('preview-update', data);
  }

  // Emit chat message to all subscribers
  emitChatMessage(projectId: string, message: any) {
    this.io.to(`project:${projectId}`).emit('chat-message', message);
  }
}
```

---

## Frontend Implementation

### 1. Dashboard Page

```typescript
// turbocat-agent/app/(dashboard)/page.tsx

'use client';

import { useEffect, useState } from 'react';
import { useAtom } from 'jotai';
import { projectsAtom } from '@/lib/atoms';
import { ProjectGrid } from '@/components/turbocat/ProjectGrid';
import { ProjectSearch } from '@/components/turbocat/ProjectSearch';
import { Button } from '@/components/ui/button';
import { Plus } from '@phosphor-icons/react';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const router = useRouter();
  const [projects, setProjects] = useAtom(projectsAtom);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const res = await fetch('/api/v1/projects', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        setProjects(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredProjects = projects.filter((p) =>
    p.projectName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <aside className="w-64 border-r bg-background p-4">
        <Button
          onClick={() => router.push('/new')}
          className="w-full mb-6"
          size="lg"
        >
          <Plus size={20} className="mr-2" />
          New app
        </Button>

        <nav className="space-y-2">
          <a href="/dashboard" className="block px-4 py-2 rounded-lg bg-primary/10">
            Projects
          </a>
          <a href="/settings" className="block px-4 py-2 rounded-lg hover:bg-muted">
            Settings
          </a>
          <a href="/help" className="block px-4 py-2 rounded-lg hover:bg-muted">
            Help
          </a>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-auto">
        <ProjectSearch
          value={searchQuery}
          onChange={setSearchQuery}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
        />

        <ProjectGrid
          projects={filteredProjects}
          viewMode={viewMode}
          loading={loading}
        />
      </main>
    </div>
  );
}
```

### 2. Project Grid Component

```typescript
// turbocat-agent/components/turbocat/ProjectGrid.tsx

'use client';

import { ProjectCard } from './ProjectCard';
import { Skeleton } from '@/components/ui/skeleton';

interface Project {
  id: string;
  projectName: string;
  projectDescription: string;
  platform: string;
  thumbnailUrl?: string;
  relativeTime: string;
}

interface ProjectGridProps {
  projects: Project[];
  viewMode: 'grid' | 'list';
  loading: boolean;
}

export function ProjectGrid({ projects, viewMode, loading }: ProjectGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mt-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-64 rounded-lg" />
        ))}
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <p className="text-muted-foreground text-lg mb-4">
          No projects yet
        </p>
        <a href="/new" className="text-primary hover:underline">
          Create your first app →
        </a>
      </div>
    );
  }

  const gridClass = viewMode === 'grid'
    ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
    : 'flex flex-col gap-4';

  return (
    <div className={`${gridClass} mt-6`}>
      {projects.map((project) => (
        <ProjectCard key={project.id} project={project} viewMode={viewMode} />
      ))}
    </div>
  );
}
```

### 3. Mobile Preview Component

```typescript
// turbocat-agent/components/turbocat/MobilePreview.tsx

'use client';

import { useEffect, useState } from 'react';
import { DeviceFrameset } from 'react-device-frameset';
import 'react-device-frameset/styles/marvel-devices.min.css';
import { useSocket } from '@/lib/hooks/useSocket';
import { Button } from '@/components/ui/button';
import { ArrowClockwise, DeviceMobile } from '@phosphor-icons/react';

interface MobilePreviewProps {
  projectId: string;
  platform: string;
}

export function MobilePreview({ projectId, platform }: MobilePreviewProps) {
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [device, setDevice] = useState('iPhone 15 Pro');
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');

  const socket = useSocket();

  useEffect(() => {
    loadPreview();

    // Subscribe to real-time updates
    if (socket) {
      socket.emit('subscribe-project', projectId);

      socket.on('preview-update', (data) => {
        setPreviewUrl(data.url);
        setLoading(false);
        setError(null);
      });

      return () => {
        socket.emit('unsubscribe-project', projectId);
        socket.off('preview-update');
      };
    }
  }, [projectId, socket]);

  const loadPreview = async () => {
    try {
      const res = await fetch(`/api/v1/projects/${projectId}/preview`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        if (data.data.code) {
          // Convert code to preview URL (Expo Snack or iframe)
          setPreviewUrl(data.data.code);
        }
        if (data.data.error) {
          setError(data.data.error);
        }
      }
    } catch (err) {
      setError('Failed to load preview');
    } finally {
      setLoading(false);
    }
  };

  const refreshPreview = () => {
    setLoading(true);
    loadPreview();
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b">
        <select
          value={device}
          onChange={(e) => setDevice(e.target.value)}
          className="px-3 py-2 border rounded-lg"
        >
          <option>iPhone 15 Pro</option>
          <option>iPhone SE</option>
          <option>Pixel 7</option>
        </select>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              setOrientation(orientation === 'portrait' ? 'landscape' : 'portrait')
            }
          >
            <ArrowClockwise size={16} />
          </Button>
          <Button variant="outline" size="sm" onClick={refreshPreview}>
            Refresh
          </Button>
          <Button variant="outline" size="sm">
            <DeviceMobile size={16} className="mr-2" />
            Open on mobile
          </Button>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-8 bg-muted/20">
        {loading ? (
          <div className="text-center">
            <p className="text-muted-foreground">Building your app...</p>
          </div>
        ) : error ? (
          <div className="text-center">
            <p className="text-destructive">{error}</p>
            <Button onClick={refreshPreview} className="mt-4">
              Retry
            </Button>
          </div>
        ) : (
          <DeviceFrameset device={device} orientation={orientation}>
            <iframe
              src={previewUrl}
              className="w-full h-full"
              title="App Preview"
            />
          </DeviceFrameset>
        )}
      </div>

      <div className="p-4 border-t bg-background">
        <p className="text-xs text-muted-foreground">
          Console: {error || 'No errors'}
        </p>
      </div>
    </div>
  );
}
```

### 4. Chat Panel Component

```typescript
// turbocat-agent/components/turbocat/ChatPanel.tsx

'use client';

import { useEffect, useState, useRef } from 'react';
import { ChatMessage } from './ChatMessage';
import { PromptInput } from './PromptInput';
import { useSocket } from '@/lib/hooks/useSocket';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  metadata?: any;
  createdAt: string;
}

interface ChatPanelProps {
  projectId: string;
}

export function ChatPanel({ projectId }: ChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const socket = useSocket();

  useEffect(() => {
    loadChatHistory();

    if (socket) {
      socket.emit('subscribe-project', projectId);

      socket.on('chat-message', (message: Message) => {
        setMessages((prev) => [...prev, message]);
      });

      return () => {
        socket.emit('unsubscribe-project', projectId);
        socket.off('chat-message');
      };
    }
  }, [projectId, socket]);

  useEffect(() => {
    // Auto-scroll to bottom
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadChatHistory = async () => {
    try {
      const res = await fetch(`/api/v1/projects/${projectId}/chat`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        setMessages(data.data);
      }
    } catch (error) {
      console.error('Failed to load chat:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (content: string) => {
    // Optimistic update
    const tempMessage: Message = {
      id: `temp-${Date.now()}`,
      role: 'user',
      content,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempMessage]);

    try {
      const res = await fetch(`/api/v1/projects/${projectId}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
        body: JSON.stringify({ message: content }),
      });

      if (!res.ok) {
        throw new Error('Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      // Remove temp message on error
      setMessages((prev) => prev.filter((m) => m.id !== tempMessage.id));
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {loading ? (
          <p className="text-muted-foreground">Loading chat...</p>
        ) : messages.length === 0 ? (
          <p className="text-muted-foreground">No messages yet. Start chatting!</p>
        ) : (
          messages.map((message) => (
            <ChatMessage key={message.id} message={message} />
          ))
        )}
        <div ref={scrollRef} />
      </div>

      <div className="border-t p-4">
        <PromptInput onSend={sendMessage} />
      </div>
    </div>
  );
}
```

---

## Testing Strategy

### Unit Tests
- `ProjectService.listProjects()` - Filtering, sorting
- `ProjectService.createProject()` - Validation, workflow creation
- `PreviewService.generatePreview()` - Bundling, caching
- `WebSocketService` - Connection, authentication

### Integration Tests
- End-to-end project creation flow
- Chat message persistence and retrieval
- Preview generation and caching
- Real-time updates via WebSocket

### E2E Tests (Playwright)
```typescript
test('User can create and view project', async ({ page }) => {
  // Login
  await page.goto('/login');
  await page.fill('[name="email"]', 'test@example.com');
  await page.fill('[name="password"]', 'password123');
  await page.click('button[type="submit"]');

  // Navigate to dashboard
  await expect(page).toHaveURL('/dashboard');

  // Click "New app"
  await page.click('text=New app');
  await expect(page).toHaveURL('/new');

  // Create project
  await page.fill('textarea[placeholder*="Describe"]', 'A simple to-do list app');
  await page.click('text=Mobile');
  await page.click('button:has-text("Generate")');

  // Wait for navigation to project page
  await expect(page).toHaveURL(/\/project\/[a-z0-9-]+/);

  // Verify preview loads
  await expect(page.locator('iframe[title="App Preview"]')).toBeVisible();

  // Verify chat shows initial message
  await expect(page.locator('text=A simple to-do list app')).toBeVisible();
});
```

---

## Performance Optimization

### Backend
- Cache project list in Redis (5 min TTL)
- Cache preview bundles in Redis (1 hour TTL)
- Use database indexes for userId + updatedAt queries
- Implement pagination for chat history (50 messages per page)

### Frontend
- Lazy load project thumbnails (IntersectionObserver)
- Debounce search input (300ms)
- Use React.memo for ProjectCard components
- Implement virtual scrolling for large chat histories
- Use SWR for data fetching with revalidation

### Preview Rendering
- Pre-bundle common dependencies (React, React Native)
- Use CDN for static assets
- Implement progressive loading (render shell first, then content)
- Cache compiled bundles server-side

---

## Security Considerations

1. **Authorization:** Verify project ownership on all API calls
2. **WebSocket Auth:** Validate JWT token on connection
3. **Input Sanitization:** Sanitize user prompts before AI processing
4. **Rate Limiting:** Limit project creation to 10/hour per user
5. **Code Execution:** Run preview bundler in sandboxed environment

---

## Rollback Plan

If issues arise post-deployment:

1. **Database Rollback:** Revert migration (drop ChatMessage table, remove Workflow columns)
2. **API Rollback:** Deploy previous backend version
3. **Frontend Rollback:** Revert to previous commit, redeploy to Vercel
4. **Data Migration:** Export ChatMessage data to ExecutionLog format if needed

---

**Last Updated:** 2026-01-12
**Status:** Ready for Implementation
