# Technical Design: Editing & Iteration Tools

**Feature:** EDIT-001 - Editing & Iteration Tools
**Last Updated:** 2026-01-12
**Status:** Design Phase

---

## Architecture Overview

```
┌──────────────────────────────────────────────────────────┐
│                      Frontend                            │
│  ┌────────────────────────────────────────────────────┐ │
│  │  Project Edit Page                                 │ │
│  │  ├─ ChatPanel                                      │ │
│  │  │  ├─ PromptInput                                │ │
│  │  │  ├─ SuggestedPrompts                           │ │
│  │  │  └─ AdvancedToolbar                            │ │
│  │  │     ├─ ToolbarIcon (x12)                       │ │
│  │  │     └─ ConfigPanel                             │ │
│  │  │        ├─ ImagePanel                           │ │
│  │  │        ├─ AudioPanel                           │ │
│  │  │        ├─ APIPanel                             │ │
│  │  │        └─ ... (9 more)                         │ │
│  └────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────┘
                            ↕ HTTP
┌──────────────────────────────────────────────────────────┐
│                      Backend                             │
│  ┌────────────────────────────────────────────────────┐ │
│  │  REST API                                          │ │
│  │  └─ GET /api/v1/projects/:id/suggestions          │ │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
│  ┌────────────────────────────────────────────────────┐ │
│  │  SuggestionService                                 │ │
│  │  ├─ getStarterSuggestions()                       │ │
│  │  ├─ getContextualSuggestions()                    │ │
│  │  └─ analyzeProjectState()                         │ │
│  └────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────┘
```

---

## Backend Implementation

### 1. Suggestion Service

```typescript
// backend/src/services/SuggestionService.ts

export interface Suggestion {
  id: string;
  text: string;
  category: 'starter' | 'feature' | 'design' | 'enhancement';
  icon?: string;
  priority: number;
}

export class SuggestionService {
  constructor(private prisma: PrismaClient) {}

  async getSuggestions(userId: string, projectId: string): Promise<Suggestion[]> {
    // Verify ownership
    const project = await this.prisma.workflow.findFirst({
      where: { id: projectId, userId, deletedAt: null },
      include: {
        chatMessages: {
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
      },
    });

    if (!project) {
      throw new Error('Project not found');
    }

    // Initial suggestions for new projects
    if (project.chatMessages.length <= 1) {
      return this.getStarterSuggestions(project.platform);
    }

    // Contextual suggestions based on conversation
    return this.getContextualSuggestions(project);
  }

  private getStarterSuggestions(platform: string): Suggestion[] {
    const starters: Suggestion[] = [
      { id: 's1', text: 'AI Chat', category: 'starter', icon: 'chat', priority: 10 },
      { id: 's2', text: 'Mood Tracker', category: 'starter', icon: 'heart', priority: 9 },
      { id: 's3', text: 'Social app', category: 'starter', icon: 'users', priority: 8 },
      { id: 's4', text: 'Plant Care', category: 'starter', icon: 'leaf', priority: 7 },
      { id: 's5', text: 'Workout Timer', category: 'starter', icon: 'timer', priority: 6 },
    ];

    if (platform === 'mobile') {
      starters.push(
        { id: 's6', text: 'Habit Tracker', category: 'starter', icon: 'check-circle', priority: 5 },
        { id: 's7', text: 'Recipe Book', category: 'starter', icon: 'book', priority: 4 }
      );
    } else if (platform === 'web') {
      starters.push(
        { id: 's8', text: 'Portfolio Site', category: 'starter', icon: 'briefcase', priority: 5 },
        { id: 's9', text: 'Blog Platform', category: 'starter', icon: 'pencil', priority: 4 }
      );
    }

    return starters.sort((a, b) => b.priority - a.priority).slice(0, 6);
  }

  private getContextualSuggestions(project: Workflow): Suggestion[] {
    const state = this.analyzeProjectState(project);
    const suggestions: Suggestion[] = [];

    // Feature suggestions based on missing features
    if (!state.hasDarkMode) {
      suggestions.push({
        id: 'f1',
        text: 'Add dark mode',
        category: 'feature',
        icon: 'moon',
        priority: 10,
      });
    }

    if (!state.hasAuth) {
      suggestions.push({
        id: 'f2',
        text: 'Add authentication',
        category: 'feature',
        icon: 'lock',
        priority: 9,
      });
    }

    if (!state.hasAnimations) {
      suggestions.push({
        id: 'd1',
        text: 'Add animations',
        category: 'design',
        icon: 'sparkle',
        priority: 8,
      });
    }

    // Design improvements
    suggestions.push(
      {
        id: 'd2',
        text: 'Improve color scheme',
        category: 'design',
        icon: 'palette',
        priority: 7,
      },
      {
        id: 'e1',
        text: 'Add loading states',
        category: 'enhancement',
        icon: 'spinner',
        priority: 6,
      },
      {
        id: 'e2',
        text: 'Improve accessibility',
        category: 'enhancement',
        icon: 'accessibility',
        priority: 5,
      }
    );

    if (state.messageCount > 5 && !state.hasNavigation) {
      suggestions.push({
        id: 'f3',
        text: 'Add navigation',
        category: 'feature',
        icon: 'compass',
        priority: 8,
      });
    }

    return suggestions.sort((a, b) => b.priority - a.priority).slice(0, 6);
  }

  private analyzeProjectState(project: Workflow): {
    hasDarkMode: boolean;
    hasAuth: boolean;
    hasAnimations: boolean;
    hasNavigation: boolean;
    messageCount: number;
  } {
    const messages = project.chatMessages.map((m) => m.content.toLowerCase());
    const allText = messages.join(' ');

    return {
      hasDarkMode: /dark\s*mode|theme\s*toggle|light.*dark/.test(allText),
      hasAuth: /auth|login|sign\s*in|register|sign\s*up/.test(allText),
      hasAnimations: /animation|animate|transition|motion/.test(allText),
      hasNavigation: /navigation|nav\s*bar|tab\s*bar|drawer|menu/.test(allText),
      messageCount: messages.length,
    };
  }
}
```

### 2. Suggestion Controller

```typescript
// backend/src/controllers/SuggestionController.ts

export class SuggestionController {
  constructor(private suggestionService: SuggestionService) {}

  async getSuggestions(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.id;
      const { id: projectId } = req.params;

      const suggestions = await this.suggestionService.getSuggestions(
        userId,
        projectId
      );

      return res.json({
        success: true,
        data: { suggestions },
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch suggestions',
      });
    }
  }
}

// Route registration
// backend/src/routes/projects.ts
router.get('/:id/suggestions', auth, suggestionController.getSuggestions);
```

---

## Frontend Implementation

### 1. Suggested Prompts Component

```typescript
// turbocat-agent/components/turbocat/SuggestedPrompts.tsx

'use client';

import { useEffect, useState } from 'react';
import { Sparkle } from '@phosphor-icons/react';

interface Suggestion {
  id: string;
  text: string;
  category: string;
  icon?: string;
}

interface SuggestedPromptsProps {
  projectId: string;
  onSelect: (prompt: string) => void;
}

export function SuggestedPrompts({
  projectId,
  onSelect,
}: SuggestedPromptsProps) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSuggestions();
  }, [projectId]);

  const fetchSuggestions = async () => {
    try {
      const res = await fetch(`/api/v1/projects/${projectId}/suggestions`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        setSuggestions(data.data.suggestions);
      }
    } catch (error) {
      console.error('Failed to fetch suggestions:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || suggestions.length === 0) {
    return null;
  }

  return (
    <div className="flex items-center gap-2 py-2 overflow-x-auto">
      <span className="text-sm text-muted-foreground flex items-center gap-1 shrink-0">
        <Sparkle size={16} />
        Suggested:
      </span>
      <div className="flex gap-2">
        {suggestions.map((suggestion) => (
          <button
            key={suggestion.id}
            onClick={() => onSelect(suggestion.text)}
            className="chip px-4 py-2 rounded-full bg-secondary hover:bg-secondary/80 text-sm font-medium whitespace-nowrap transition-all hover:scale-105"
          >
            {suggestion.text}
          </button>
        ))}
      </div>
    </div>
  );
}
```

### 2. Advanced Toolbar Component

```typescript
// turbocat-agent/components/turbocat/AdvancedToolbar.tsx

'use client';

import { useState, useEffect } from 'react';
import {
  Image,
  Microphone,
  CloudArrowUp,
  CreditCard,
  Cloud,
  Vibrate,
  File,
  Lock,
  FileText,
  Palette,
  CheckSquare,
  Globe,
  CaretDown,
  CaretUp,
} from '@phosphor-icons/react';
import { Tooltip } from '@/components/ui/tooltip';
import { ImagePanel } from './panels/ImagePanel';
import { AudioPanel } from './panels/AudioPanel';
// ... import other panels

interface ToolbarIcon {
  id: string;
  icon: React.ReactNode;
  label: string;
  shortcut: string;
  disabled?: boolean;
  panel: React.ComponentType<PanelProps>;
}

interface PanelProps {
  onInsert: (prompt: string) => void;
  onClose: () => void;
}

export function AdvancedToolbar({
  platform,
  onInsert,
}: {
  platform: string;
  onInsert: (prompt: string) => void;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [activePanel, setActivePanel] = useState<string | null>(null);

  const icons: ToolbarIcon[] = [
    {
      id: 'image',
      icon: <Image size={24} />,
      label: 'Add Image Upload',
      shortcut: 'Cmd+Shift+I',
      panel: ImagePanel,
    },
    {
      id: 'audio',
      icon: <Microphone size={24} />,
      label: 'Add Audio',
      shortcut: 'Cmd+Shift+A',
      panel: AudioPanel,
    },
    {
      id: 'api',
      icon: <CloudArrowUp size={24} />,
      label: 'Add API Integration',
      shortcut: 'Cmd+Shift+P',
      panel: APIPanel,
    },
    {
      id: 'payment',
      icon: <CreditCard size={24} />,
      label: 'Add Payments',
      shortcut: 'Cmd+Shift+$',
      panel: PaymentPanel,
    },
    {
      id: 'cloud',
      icon: <Cloud size={24} />,
      label: 'Add Cloud Storage',
      shortcut: 'Cmd+Shift+C',
      panel: CloudPanel,
    },
    {
      id: 'haptics',
      icon: <Vibrate size={24} />,
      label: 'Add Haptic Feedback',
      shortcut: 'Cmd+Shift+H',
      panel: HapticsPanel,
      disabled: platform === 'web',
    },
    {
      id: 'file',
      icon: <File size={24} />,
      label: 'Add File System',
      shortcut: 'Cmd+Shift+F',
      panel: FilePanel,
    },
    {
      id: 'env',
      icon: <Lock size={24} />,
      label: 'Add Environment Variables',
      shortcut: 'Cmd+Shift+E',
      panel: EnvPanel,
    },
    {
      id: 'logs',
      icon: <FileText size={24} />,
      label: 'Add Console Logs',
      shortcut: 'Cmd+Shift+L',
      panel: LogsPanel,
    },
    {
      id: 'ui',
      icon: <Palette size={24} />,
      label: 'Add UI Component',
      shortcut: 'Cmd+Shift+U',
      panel: UIPanel,
    },
    {
      id: 'select',
      icon: <CheckSquare size={24} />,
      label: 'Add Selection Control',
      shortcut: 'Cmd+Shift+S',
      panel: SelectPanel,
    },
    {
      id: 'request',
      icon: <Globe size={24} />,
      label: 'Add HTTP Request',
      shortcut: 'Cmd+Shift+R',
      panel: RequestPanel,
    },
  ];

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey) {
        const icon = icons.find((i) =>
          i.shortcut.endsWith(e.key.toUpperCase())
        );
        if (icon && !icon.disabled) {
          e.preventDefault();
          setActivePanel(icon.id);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [platform]);

  if (collapsed) {
    return (
      <div className="flex justify-center p-2 border-t">
        <button
          onClick={() => setCollapsed(false)}
          className="text-muted-foreground hover:text-foreground"
        >
          <CaretUp size={20} />
        </button>
      </div>
    );
  }

  const ActivePanelComponent = activePanel
    ? icons.find((i) => i.id === activePanel)?.panel
    : null;

  return (
    <>
      <div className="flex items-center justify-center gap-4 px-4 py-3 border-t bg-background">
        {icons.map((icon) => (
          <Tooltip key={icon.id} content={`${icon.label} (${icon.shortcut})`}>
            <button
              onClick={() => !icon.disabled && setActivePanel(icon.id)}
              disabled={icon.disabled}
              className="p-2 rounded-lg hover:bg-secondary transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              aria-label={icon.label}
            >
              {icon.icon}
            </button>
          </Tooltip>
        ))}
        <button
          onClick={() => setCollapsed(true)}
          className="p-2 text-muted-foreground hover:text-foreground"
          aria-label="Collapse toolbar"
        >
          <CaretDown size={20} />
        </button>
      </div>

      {ActivePanelComponent && (
        <ActivePanelComponent
          onInsert={(prompt) => {
            onInsert(prompt);
            setActivePanel(null);
          }}
          onClose={() => setActivePanel(null)}
        />
      )}
    </>
  );
}
```

### 3. Example Configuration Panel

```typescript
// turbocat-agent/components/turbocat/panels/ImagePanel.tsx

'use client';

import { useState } from 'react';
import { X } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

interface ImagePanelProps {
  onInsert: (prompt: string) => void;
  onClose: () => void;
}

export function ImagePanel({ onInsert, onClose }: ImagePanelProps) {
  const [config, setConfig] = useState({
    source: ['camera', 'gallery'],
    maxSize: 5,
    formats: ['jpg', 'png', 'heic'],
    aspectRatio: '16:9',
  });

  const handleSubmit = () => {
    const sources = config.source.join(' and ');
    const formats = config.formats.map((f) => f.toUpperCase()).join('/');
    const prompt = `Add image upload with ${sources} access, max ${config.maxSize}MB, support ${formats} formats, ${config.aspectRatio} aspect ratio`;
    onInsert(prompt);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-background rounded-lg shadow-lg w-[400px] max-h-[80vh] overflow-y-auto animate-slide-in">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold">Add Image Upload</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X size={20} />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div>
            <Label>Source:</Label>
            <div className="flex gap-4 mt-2">
              <Checkbox
                id="camera"
                label="Camera"
                checked={config.source.includes('camera')}
                onCheckedChange={(checked) => {
                  if (checked) {
                    setConfig({ ...config, source: [...config.source, 'camera'] });
                  } else {
                    setConfig({
                      ...config,
                      source: config.source.filter((s) => s !== 'camera'),
                    });
                  }
                }}
              />
              <Checkbox
                id="gallery"
                label="Gallery"
                checked={config.source.includes('gallery')}
                onCheckedChange={(checked) => {
                  if (checked) {
                    setConfig({ ...config, source: [...config.source, 'gallery'] });
                  } else {
                    setConfig({
                      ...config,
                      source: config.source.filter((s) => s !== 'gallery'),
                    });
                  }
                }}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="maxSize">Max Size (MB):</Label>
            <Input
              id="maxSize"
              type="number"
              value={config.maxSize}
              onChange={(e) =>
                setConfig({ ...config, maxSize: parseInt(e.target.value) })
              }
              min={1}
              max={50}
            />
          </div>

          <div>
            <Label>Formats:</Label>
            <div className="flex gap-4 mt-2">
              {['jpg', 'png', 'heic', 'gif'].map((format) => (
                <Checkbox
                  key={format}
                  id={format}
                  label={format.toUpperCase()}
                  checked={config.formats.includes(format)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setConfig({ ...config, formats: [...config.formats, format] });
                    } else {
                      setConfig({
                        ...config,
                        formats: config.formats.filter((f) => f !== format),
                      });
                    }
                  }}
                />
              ))}
            </div>
          </div>

          <div>
            <Label>Aspect Ratio:</Label>
            <RadioGroup
              value={config.aspectRatio}
              onValueChange={(value) => setConfig({ ...config, aspectRatio: value })}
            >
              {['Free', 'Square', '16:9', '4:3'].map((ratio) => (
                <div key={ratio} className="flex items-center gap-2">
                  <RadioGroupItem value={ratio} id={ratio} />
                  <Label htmlFor={ratio}>{ratio}</Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        </div>

        <div className="flex justify-end gap-2 p-4 border-t">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>Insert</Button>
        </div>
      </div>
    </div>
  );
}
```

---

## Testing Strategy

### Unit Tests
- SuggestionService.getStarterSuggestions()
- SuggestionService.getContextualSuggestions()
- SuggestionService.analyzeProjectState()

### Integration Tests
- GET /api/v1/projects/:id/suggestions endpoint

### E2E Tests
- Click suggested prompt and verify insertion
- Use keyboard shortcut to open panel
- Configure and insert template prompt

---

## Performance Optimization

- Cache suggestions for 5 minutes (reduce API calls)
- Debounce suggestion fetching after AI responses (500ms)
- Lazy load configuration panels (code splitting)
- Preload most-used panels (Image, API)

---

**Last Updated:** 2026-01-12
**Status:** Ready for Implementation
