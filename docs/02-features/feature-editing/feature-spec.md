# Feature Specification: Editing & Iteration Tools

**Epic:** Editing & Iteration
**Feature ID:** EDIT-001
**Status:** Planned
**Priority:** P2 (Medium)
**Effort:** Medium (3-5 days)
**Owner:** TBD

---

## Overview

Implement contextual suggested prompts and an advanced toolbar to accelerate user iteration on their apps. These features reduce the cognitive load of "what to say next" and provide quick access to common functionality like adding images, audio, APIs, payments, and more.

---

## Business Context

### Problem
- Users get "stuck" after initial app generation (40% abandon after first prompt)
- Users don't know what features are possible
- Advanced users want faster access to specific features
- Typing long prompts for common tasks is inefficient
- Discovery of capabilities is poor

### Opportunity
- Suggested prompts increase iteration rate by 3x (Replit data)
- Feature discovery improves retention by 25%
- Advanced toolbar reduces iteration time by 50% for power users
- Contextual suggestions improve user confidence

### Success Metrics
- **Primary:** Average iterations per project increases from 2 to 8+
- **Secondary:** Time between iterations < 30 seconds
- **Engagement:** 60%+ of users click suggested prompts at least once
- **Advanced:** 20%+ of users use advanced toolbar

---

## User Stories

### US-007: Suggested Prompts
**As a** user unsure what to say next
**I want to** see suggested prompts I can tap
**So that** I can quickly iterate on my app

**Acceptance Criteria:**
- [ ] Bottom of screen shows horizontal scrollable chips
- [ ] Initial suggestions: "AI Chat", "Mood Tracker", "Social app", "Plant Care", "Workout Timer"
- [ ] Contextual suggestions after first iteration: "Add dark mode", "Add animations", "Improve design", "Add authentication"
- [ ] Tapping a chip inserts text into prompt input
- [ ] Suggestions update based on project state
- [ ] User can still type custom prompts
- [ ] Scroll indicator shows more chips available
- [ ] Smooth horizontal scroll animation

### US-008: Advanced Toolbar
**As a** power user
**I want to** access advanced features via a toolbar
**So that** I can add specific functionality quickly

**Acceptance Criteria:**
- [ ] Bottom toolbar with icons: Image, Audio, API, Payment, Cloud, Haptics, File, Env Var, Logs, UI, Select, Request
- [ ] Clicking icon opens relevant configuration panel or inserts template
- [ ] Tooltip on hover explains each icon
- [ ] Icons disabled if feature not applicable to current project (e.g., Haptics for web)
- [ ] Toolbar collapsible to maximize screen space
- [ ] Keyboard shortcuts for each icon (e.g., Cmd+Shift+I for Image)
- [ ] Configuration panels slide in from right
- [ ] Templates inserted at cursor position in chat input

---

## Functional Requirements

### Suggested Prompts Requirements
1. **FR-001:** System MUST display suggested prompts below chat input
2. **FR-002:** System MUST provide initial suggestions for new projects
3. **FR-003:** System MUST provide contextual suggestions based on project state
4. **FR-004:** System MUST update suggestions after each AI response
5. **FR-005:** System MUST insert prompt text on chip click
6. **FR-006:** System MUST support horizontal scrolling of suggestions
7. **FR-007:** System MUST highlight selected/clicked suggestions
8. **FR-008:** System MUST allow dismissing suggestions

### Advanced Toolbar Requirements
9. **FR-009:** System MUST display toolbar icons for 12 features
10. **FR-010:** System MUST show tooltip on hover for each icon
11. **FR-011:** System MUST disable inapplicable features (platform-specific)
12. **FR-012:** System MUST open configuration panel on icon click
13. **FR-013:** System MUST insert template code on panel submit
14. **FR-014:** System MUST support keyboard shortcuts for all icons
15. **FR-015:** System MUST allow collapsing/expanding toolbar
16. **FR-016:** System MUST preserve toolbar state across sessions

### Configuration Panel Requirements
17. **FR-017:** System MUST provide configuration for: Image Upload, Audio Recording, API Integration, Payment Processing, Cloud Storage, Haptic Feedback, File System Access, Environment Variables, Console Logs, UI Components, Selection Controls, HTTP Requests
18. **FR-018:** System MUST validate configuration inputs
19. **FR-019:** System MUST generate prompt from configuration
20. **FR-020:** System MUST close panel after submission

---

## Non-Functional Requirements

### Performance
- **NFR-001:** Suggestions MUST update in < 100ms after AI response
- **NFR-002:** Toolbar icons MUST render in < 50ms
- **NFR-003:** Configuration panels MUST open in < 200ms

### Usability
- **NFR-004:** Suggested prompts MUST be readable (min 14px font)
- **NFR-005:** Toolbar icons MUST have consistent size (24px)
- **NFR-006:** Tooltips MUST appear within 500ms hover
- **NFR-007:** Keyboard shortcuts MUST not conflict with browser defaults

### Accessibility
- **NFR-008:** Toolbar MUST be keyboard navigable
- **NFR-009:** All icons MUST have aria-labels
- **NFR-010:** Configuration panels MUST support screen readers

---

## User Flow

### Suggested Prompts Flow
```
1. User creates new project
2. System displays initial suggestions:
   ["AI Chat", "Mood Tracker", "Social app", "Plant Care", "Workout Timer"]
3. User clicks "Mood Tracker"
4. Input field fills with "Create a mood tracker app with daily journaling"
5. User sends prompt
6. AI generates app
7. System updates suggestions to contextual:
   ["Add dark mode", "Add animations", "Improve color scheme", "Add authentication"]
8. User clicks "Add dark mode"
9. Input fills with "Add dark mode with toggle button"
10. User sends, AI implements
```

### Advanced Toolbar Flow
```
1. User wants to add image upload feature
2. User clicks Image icon in toolbar
3. Configuration panel slides in from right:
   - Select: [Camera | Gallery | Both]
   - Max size: [5MB]
   - Formats: [JPG, PNG, HEIC]
   - Aspect ratio: [Free | Square | 16:9]
   - [Cancel] [Insert]
4. User configures options
5. User clicks "Insert"
6. System generates prompt: "Add image upload with camera and gallery access, max 5MB, support JPG/PNG/HEIC formats"
7. Prompt inserted in chat input
8. User reviews and sends
9. AI implements feature
```

---

## UI/UX Specifications

### Suggested Prompts Design
```
┌─────────────────────────────────────────────────────────────┐
│  Chat messages...                                           │
│                                                             │
│  ┌────────────────────────────────────────────────────┐   │
│  │ Type your message...                              │   │
│  └────────────────────────────────────────────────────┘   │
│                                                             │
│  Suggested:                                                 │
│  ┌─────────┐ ┌──────────┐ ┌─────────┐ ┌──────────┐ →     │
│  │ AI Chat │ │ Mood     │ │ Social  │ │ Plant    │       │
│  │         │ │ Tracker  │ │ app     │ │ Care     │       │
│  └─────────┘ └──────────┘ └─────────┘ └──────────┘       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Chip Specifications:**
- Background: Light gray (light mode), Dark gray (dark mode)
- Hover: Slight scale (1.05x) and shadow
- Active: Primary color background
- Font: 14px medium weight
- Padding: 8px 16px
- Border radius: 20px (pill shape)
- Gap between chips: 8px

### Advanced Toolbar Design
```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  [Type message...                                   ]       │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 🖼️  🔊  🔌  💳  ☁️  📳  📁  🔐  📊  🎨  ☑️  📡  [▼]│   │
│  │ Img Aud API Pay Cld Hap Fil Env Log  UI  Sel Req      │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

**Toolbar Specifications:**
- Height: 56px
- Background: Surface color with top border
- Icons: 24x24px, Phosphor Icons
- Spacing: 16px between icons
- Collapse button: Right end, toggle up/down
- Tooltip: Dark background, 12px font, appears above icon

### Configuration Panel Design (Example: Image)
```
┌───────────────────────────────────────┐
│  ✕  Add Image Upload                  │
│                                       │
│  Source:                              │
│  ☑ Camera  ☑ Gallery                 │
│                                       │
│  Max Size:                            │
│  [5        ] MB  ▼                    │
│                                       │
│  Formats:                             │
│  ☑ JPG  ☑ PNG  ☑ HEIC  ☐ GIF        │
│                                       │
│  Aspect Ratio:                        │
│  ○ Free  ○ Square  ● 16:9  ○ 4:3     │
│                                       │
│  [Cancel]              [Insert] →     │
└───────────────────────────────────────┘
```

**Panel Specifications:**
- Width: 320px
- Slide animation: 300ms ease-out
- Background: Surface color with shadow
- Padding: 24px
- Close button: Top right
- Form elements: Standard UI components
- Submit button: Primary color, full width

---

## Technical Approach

### Suggested Prompts Implementation

**Frontend Component:**
```typescript
// components/turbocat/SuggestedPrompts.tsx
interface Suggestion {
  id: string;
  text: string;
  category: 'starter' | 'feature' | 'design' | 'enhancement';
  context?: string[];
}

export function SuggestedPrompts({
  projectId,
  platform,
  onSelect,
}: {
  projectId: string;
  platform: string;
  onSelect: (prompt: string) => void;
}) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);

  useEffect(() => {
    fetchSuggestions();
  }, [projectId]);

  const fetchSuggestions = async () => {
    const res = await fetch(`/api/v1/projects/${projectId}/suggestions`);
    const data = await res.json();
    setSuggestions(data.suggestions);
  };

  return (
    <div className="flex gap-2 overflow-x-auto py-2">
      <span className="text-sm text-muted-foreground">Suggested:</span>
      {suggestions.map((s) => (
        <button
          key={s.id}
          onClick={() => onSelect(s.text)}
          className="chip"
        >
          {s.text}
        </button>
      ))}
    </div>
  );
}
```

**Backend API:**
```typescript
// backend/src/services/SuggestionService.ts
export class SuggestionService {
  async getSuggestions(projectId: string): Promise<Suggestion[]> {
    const project = await prisma.workflow.findUnique({
      where: { id: projectId },
      include: { chatMessages: { orderBy: { createdAt: 'desc' }, take: 10 } },
    });

    if (!project) throw new Error('Project not found');

    // Initial suggestions for new projects
    if (project.chatMessages.length <= 1) {
      return this.getStarterSuggestions(project.platform);
    }

    // Contextual suggestions based on conversation
    return this.getContextualSuggestions(project);
  }

  private getStarterSuggestions(platform: string): Suggestion[] {
    const common = [
      { id: '1', text: 'AI Chat', category: 'starter' },
      { id: '2', text: 'Mood Tracker', category: 'starter' },
      { id: '3', text: 'Social app', category: 'starter' },
      { id: '4', text: 'Plant Care', category: 'starter' },
      { id: '5', text: 'Workout Timer', category: 'starter' },
    ];

    if (platform === 'mobile') {
      common.push({ id: '6', text: 'Habit Tracker', category: 'starter' });
    }

    return common;
  }

  private getContextualSuggestions(project: Workflow): Suggestion[] {
    // Analyze chat history to determine context
    const messages = project.chatMessages.map((m) => m.content.toLowerCase());
    const hasAuth = messages.some((m) => m.includes('auth') || m.includes('login'));
    const hasDarkMode = messages.some((m) => m.includes('dark mode'));

    const suggestions: Suggestion[] = [];

    if (!hasDarkMode) {
      suggestions.push({ id: '10', text: 'Add dark mode', category: 'feature' });
    }

    if (!hasAuth) {
      suggestions.push({ id: '11', text: 'Add authentication', category: 'feature' });
    }

    suggestions.push(
      { id: '12', text: 'Add animations', category: 'design' },
      { id: '13', text: 'Improve color scheme', category: 'design' },
      { id: '14', text: 'Add loading states', category: 'enhancement' }
    );

    return suggestions.slice(0, 6); // Limit to 6 suggestions
  }
}
```

### Advanced Toolbar Implementation

**Toolbar Component:**
```typescript
// components/turbocat/AdvancedToolbar.tsx
interface ToolbarIcon {
  id: string;
  icon: React.ReactNode;
  label: string;
  shortcut: string;
  disabled?: boolean;
  panel: React.ComponentType<any>;
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
    { id: 'image', icon: <Image />, label: 'Add Image Upload', shortcut: 'Cmd+Shift+I', panel: ImagePanel },
    { id: 'audio', icon: <Microphone />, label: 'Add Audio', shortcut: 'Cmd+Shift+A', panel: AudioPanel },
    { id: 'api', icon: <CloudArrowUp />, label: 'Add API Integration', shortcut: 'Cmd+Shift+P', panel: APIPanel },
    { id: 'payment', icon: <CreditCard />, label: 'Add Payments', shortcut: 'Cmd+Shift+$', panel: PaymentPanel },
    { id: 'cloud', icon: <Cloud />, label: 'Add Cloud Storage', shortcut: 'Cmd+Shift+C', panel: CloudPanel },
    { id: 'haptics', icon: <Vibrate />, label: 'Add Haptic Feedback', shortcut: 'Cmd+Shift+H', panel: HapticsPanel, disabled: platform === 'web' },
    { id: 'file', icon: <File />, label: 'Add File System', shortcut: 'Cmd+Shift+F', panel: FilePanel },
    { id: 'env', icon: <Lock />, label: 'Add Environment Variables', shortcut: 'Cmd+Shift+E', panel: EnvPanel },
    { id: 'logs', icon: <FileText />, label: 'Add Console Logs', shortcut: 'Cmd+Shift+L', panel: LogsPanel },
    { id: 'ui', icon: <Palette />, label: 'Add UI Component', shortcut: 'Cmd+Shift+U', panel: UIPanel },
    { id: 'select', icon: <CheckSquare />, label: 'Add Selection Control', shortcut: 'Cmd+Shift+S', panel: SelectPanel },
    { id: 'request', icon: <Globe />, label: 'Add HTTP Request', shortcut: 'Cmd+Shift+R', panel: RequestPanel },
  ];

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey && e.shiftKey) {
        const icon = icons.find((i) => i.shortcut.endsWith(e.key.toUpperCase()));
        if (icon && !icon.disabled) {
          e.preventDefault();
          setActivePanel(icon.id);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (collapsed) {
    return (
      <button onClick={() => setCollapsed(false)} className="toolbar-expand">
        <CaretUp />
      </button>
    );
  }

  return (
    <>
      <div className="toolbar">
        {icons.map((icon) => (
          <Tooltip key={icon.id} content={`${icon.label} (${icon.shortcut})`}>
            <button
              onClick={() => setActivePanel(icon.id)}
              disabled={icon.disabled}
              className="toolbar-icon"
            >
              {icon.icon}
            </button>
          </Tooltip>
        ))}
        <button onClick={() => setCollapsed(true)} className="toolbar-collapse">
          <CaretDown />
        </button>
      </div>

      {activePanel && (
        <ConfigPanel
          icon={icons.find((i) => i.id === activePanel)!}
          onClose={() => setActivePanel(null)}
          onInsert={(prompt) => {
            onInsert(prompt);
            setActivePanel(null);
          }}
        />
      )}
    </>
  );
}
```

**Configuration Panels:**
```typescript
// components/turbocat/panels/ImagePanel.tsx
export function ImagePanel({ onInsert, onClose }) {
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
    <div className="config-panel">
      <div className="panel-header">
        <h3>Add Image Upload</h3>
        <button onClick={onClose}><X /></button>
      </div>

      <div className="panel-body">
        <label>Source:</label>
        <Checkbox label="Camera" checked={config.source.includes('camera')} onChange={...} />
        <Checkbox label="Gallery" checked={config.source.includes('gallery')} onChange={...} />

        <label>Max Size:</label>
        <Input type="number" value={config.maxSize} onChange={...} /> MB

        <label>Formats:</label>
        <Checkbox label="JPG" checked={config.formats.includes('jpg')} onChange={...} />
        <Checkbox label="PNG" checked={config.formats.includes('png')} onChange={...} />
        <Checkbox label="HEIC" checked={config.formats.includes('heic')} onChange={...} />

        <label>Aspect Ratio:</label>
        <RadioGroup value={config.aspectRatio} onChange={...} options={['Free', 'Square', '16:9', '4:3']} />
      </div>

      <div className="panel-footer">
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
        <Button onClick={handleSubmit}>Insert</Button>
      </div>
    </div>
  );
}
```

---

## Dependencies

### External Libraries
- **Phosphor Icons** - Already installed (toolbar icons)
- **Framer Motion** - Already installed (panel animations)

### Internal Dependencies
- **ChatPanel Component** - Integration point for prompt insertion
- **Project Context** - Access to project platform, state

---

## Rollout Plan

### Phase 1: Suggested Prompts (2 days)
- Day 1: Backend suggestion service + API
- Day 2: Frontend suggested prompts component + integration

### Phase 2: Advanced Toolbar (3 days)
- Day 3: Toolbar component with icons
- Day 4: Configuration panels (6 panels)
- Day 5: Configuration panels (6 panels) + keyboard shortcuts

---

## Success Criteria

### Launch Criteria
- [ ] Suggested prompts display on all projects
- [ ] Clicking suggestion inserts text correctly
- [ ] Suggestions update contextually after AI responses
- [ ] Toolbar displays all 12 icons
- [ ] All configuration panels functional
- [ ] Keyboard shortcuts work
- [ ] Tooltips display correctly

### Post-Launch (Within 1 Week)
- [ ] 60%+ users click suggested prompt at least once
- [ ] Average iterations per project increases to 8+
- [ ] 20%+ users use advanced toolbar
- [ ] < 1% error rate on prompt insertion

---

## Risks & Mitigation

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Suggestions not relevant | Medium | Medium | Improve context analysis algorithm |
| Toolbar icons overwhelming | Low | Medium | Add collapse feature, progressive disclosure |
| Configuration panels complex | Medium | Low | User testing, simplify forms |
| Keyboard shortcut conflicts | Low | Low | Use non-standard combinations, allow customization |

---

## Open Questions

1. **Suggestion Algorithm:** Use rule-based or ML model for contextual suggestions?
   - **Recommendation:** Rule-based initially, ML later if needed

2. **Toolbar Customization:** Allow users to reorder or hide icons?
   - **Recommendation:** Phase 2 feature, not MVP

3. **Panel Templates:** Pre-fill panels with smart defaults?
   - **Recommendation:** Yes, based on project analysis

---

## References

- UI Reference: `vibe code app new project screen.png`
- [Replit Bounties](https://replit.com/bounties) - Suggested prompts inspiration
- [Linear](https://linear.app) - Keyboard shortcut patterns

---

**Last Updated:** 2026-01-12
**Status:** Ready for Technical Design
