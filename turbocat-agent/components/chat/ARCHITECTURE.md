# Chat Components Architecture

## Component Hierarchy

```
┌─────────────────────────────────────────────────────────────┐
│                     ChatInterface (Parent)                   │
│                                                               │
│  ┌────────────────────────────────────────────────────────┐ │
│  │                     ChatThread                          │ │
│  │  ┌──────────────────────────────────────────────────┐  │ │
│  │  │              ChatMessage (User)                   │  │ │
│  │  │  ┌─────────┐  ┌──────────────────────────────┐  │  │ │
│  │  │  │ Avatar  │  │  Message Content              │  │  │ │
│  │  │  │  User   │  │  - Role Label                 │  │  │ │
│  │  │  │  Icon   │  │  - Text Content               │  │  │ │
│  │  │  └─────────┘  │  - Copy Button                │  │  │ │
│  │  │               │  - Timestamp                   │  │  │ │
│  │  │               └──────────────────────────────────┘  │  │ │
│  │  └──────────────────────────────────────────────────┘  │ │
│  │                                                          │ │
│  │  ┌──────────────────────────────────────────────────┐  │ │
│  │  │            ChatMessage (Assistant)                │  │ │
│  │  │  ┌─────────┐  ┌──────────────────────────────┐  │  │ │
│  │  │  │ Avatar  │  │  Message Content              │  │  │ │
│  │  │  │  Bot    │  │  - StreamingText (if latest)  │  │  │ │
│  │  │  │  Icon   │  │  - ToolCall Components        │  │  │ │
│  │  │  └─────────┘  │    ┌─────────────────────┐   │  │  │ │
│  │  │               │    │  ToolCall           │   │  │  │ │
│  │  │               │    │  - Icon & State     │   │  │  │ │
│  │  │               │    │  - Expandable Args  │   │  │  │ │
│  │  │               │    │  - Result Display   │   │  │  │ │
│  │  │               │    └─────────────────────┘   │  │  │ │
│  │  │               └──────────────────────────────────┘  │  │ │
│  │  └──────────────────────────────────────────────────┘  │ │
│  │                                                          │ │
│  │  ┌──────────────────────────────────────────────────┐  │ │
│  │  │              LoadingDots (if loading)             │  │ │
│  │  │  ●  ●  ●  "AI is thinking..."                    │  │ │
│  │  └──────────────────────────────────────────────────┘  │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                               │
│  ┌────────────────────────────────────────────────────────┐ │
│  │                 ReasoningPanel (Optional)              │ │
│  │  ┌────────────────────────────────────────────────┐   │ │
│  │  │  🧠 AI Reasoning Process (Expandable)          │   │ │
│  │  │  ┌──────────────────────────────────────────┐  │   │ │
│  │  │  │ 💭 Thought: Analyzing request...         │  │   │ │
│  │  │  │ ⚡ Action: Searching files...            │  │   │ │
│  │  │  │ 💡 Observation: Found 3 matches          │  │   │ │
│  │  │  └──────────────────────────────────────────┘  │   │ │
│  │  └────────────────────────────────────────────────┘   │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                               │
│  ┌────────────────────────────────────────────────────────┐ │
│  │                      ChatInput                         │ │
│  │  ┌────┐  ┌─────────────────────────────────┐  ┌────┐ │ │
│  │  │ 📎 │  │  Auto-resizing Textarea         │  │ 📤 │ │ │
│  │  │    │  │  - Placeholder text             │  │ or │ │ │
│  │  │ (opt)│  │  - Character counter          │  │ ⏹️ │ │ │
│  │  └────┘  │  - Enter to submit              │  └────┘ │ │
│  │          └─────────────────────────────────┘         │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│                      useChat Hook                            │
│                  (Vercel AI SDK v5)                          │
│                                                               │
│  State:                                                       │
│  - messages: Message[]                                        │
│  - isLoading: boolean                                         │
│  - input: string                                              │
│                                                               │
│  Actions:                                                     │
│  - handleSubmit(message)                                      │
│  - stop()                                                     │
│  - reload()                                                   │
└───────────────┬─────────────────────────────────────────────┘
                │
                │ Props Flow
                ▼
┌─────────────────────────────────────────────────────────────┐
│                   Chat Components                            │
│                                                               │
│  ChatThread receives:                                         │
│  - messages ───────────────────►  Renders ChatMessage        │
│  - isLoading ──────────────────►  Shows LoadingDots          │
│                                                               │
│  ChatMessage receives:                                        │
│  - message.role ───────────────►  User/Assistant styling     │
│  - message.content ────────────►  Text or StreamingText      │
│  - message.toolInvocations ────►  Renders ToolCall           │
│  - isLatest ───────────────────►  Enables streaming          │
│                                                               │
│  ChatInput callbacks:                                         │
│  - onSubmit(message) ──────────►  handleSubmit()             │
│  - onStop() ───────────────────►  stop()                     │
└─────────────────────────────────────────────────────────────┘
```

## Component Responsibilities

### ChatThread
**Purpose**: Container for message list
**Responsibilities**:
- Render list of messages
- Auto-scroll to bottom
- Show loading indicator
- Animate message entry/exit
- Handle message selection

**State**: None (stateless)
**Props**: `messages`, `isLoading`, `autoScroll`, `onMessageSelect`

### ChatMessage
**Purpose**: Display single message
**Responsibilities**:
- Role-based styling (user/assistant/system)
- Show avatar and metadata
- Copy to clipboard
- Display tool calls
- Stream text if latest message

**State**: `copied` (for copy button feedback)
**Props**: `message`, `isLatest`, `onSelect`

### ChatInput
**Purpose**: User input field
**Responsibilities**:
- Handle text input
- Auto-resize textarea
- Submit on Enter, new line on Shift+Enter
- Character counter
- Show stop button when loading
- Attachment button (optional)

**State**: `input` (controlled input value)
**Props**: `onSubmit`, `onStop`, `isLoading`, `disabled`, `placeholder`, `maxLength`, `allowAttachments`

### StreamingText
**Purpose**: Animate text streaming
**Responsibilities**:
- Character-by-character animation
- Show blinking cursor
- Configurable speed
- Completion callback

**State**: `displayedText`, `currentIndex`, `isComplete`
**Props**: `text`, `speed`, `showCursor`, `onComplete`

### LoadingDots
**Purpose**: Loading indicator
**Responsibilities**:
- Animated dots
- Optional label
- Size and color variants

**State**: None (animation-only)
**Props**: `size`, `color`, `label`

### ToolCall
**Purpose**: Display tool execution
**Responsibilities**:
- Show tool name and state
- Expandable args/results
- State-based icons and colors
- Loading animation

**State**: `isExpanded`
**Props**: `toolCall` (name, state, args, result)

### ReasoningPanel
**Purpose**: Display AI reasoning
**Responsibilities**:
- Show reasoning steps
- Expandable/collapsible
- Step-by-step animation
- Type-based icons

**State**: `isExpanded`
**Props**: `steps`, `title`, `defaultExpanded`

## Integration Points

### With Vercel AI SDK

```typescript
// app/api/chat/route.ts
import { streamText } from 'ai'
import { anthropic } from '@ai-sdk/anthropic'

export async function POST(req: Request) {
  const { messages } = await req.json()

  const result = streamText({
    model: anthropic('claude-sonnet-4-5-20250929'),
    messages,
    tools: {
      searchFiles: tool({
        description: 'Search for files',
        parameters: z.object({ query: z.string() }),
        execute: async ({ query }) => {
          // Implementation
          return { files: [] }
        },
      }),
    },
  })

  return result.toDataStreamResponse()
}
```

### With Next.js App Router

```typescript
// app/chat/page.tsx
'use client'

import { useChat } from 'ai/react'
import { ChatThread, ChatInput } from '@/components/chat'

export default function ChatPage() {
  const chat = useChat({ api: '/api/chat' })

  return (
    <div className="flex flex-col h-screen">
      <ChatThread messages={chat.messages} isLoading={chat.isLoading} />
      <ChatInput
        onSubmit={(msg) => chat.handleSubmit({ content: msg })}
        onStop={chat.stop}
        isLoading={chat.isLoading}
      />
    </div>
  )
}
```

## Styling Architecture

### Theme System
- **CSS Variables** - Defined in `app/globals.css`
- **Tailwind Classes** - Utility-first approach
- **AI Native Tokens** - Custom design tokens

### Responsive Design
- Mobile-first approach
- Breakpoints: sm (640px), md (768px), lg (1024px)
- Touch-friendly tap targets (44px min)

### Dark Mode Support
- Uses `next-themes` for theme switching
- CSS variables auto-adjust via `.dark` class
- All components support both themes

### Animation Strategy
- **Framer Motion** for complex animations
- **CSS Transitions** for simple hover/focus states
- **Reduced Motion** support via `prefers-reduced-motion`

## Performance Optimizations

1. **Lazy Rendering**: Tool calls collapsed by default
2. **Virtual Scrolling Ready**: ChatThread exposes ref for integration
3. **Memo Potential**: Components structured for React.memo
4. **Debounced Input**: Can be added to ChatInput
5. **Efficient Re-renders**: Minimal state in components

## Testing Strategy

### Unit Tests (Vitest)
- Individual component rendering
- Props validation
- Callback invocation
- State management

### Component Tests (Testing Library)
- User interactions
- Keyboard navigation
- Accessibility features

### Integration Tests
- useChat hook integration
- API route mocking
- Streaming simulation

### E2E Tests (Playwright)
- Full chat flow
- Tool execution
- Error handling

## Future Enhancements

### Short-term
1. Markdown rendering with syntax highlighting
2. File attachment support
3. Image preview
4. Message editing and deletion
5. Drag-and-drop file upload

### Medium-term
1. Voice input/output
2. Message reactions
3. Thread branching
4. Message search
5. Export chat history

### Long-term
1. Multi-modal support (images, audio, video)
2. Collaborative chat
3. Chat analytics
4. Custom themes per user
5. Plugin system for custom message types
