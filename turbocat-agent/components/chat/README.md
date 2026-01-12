# Chat Components

AI-powered chat components built with Vercel AI SDK v5, React 19, and Framer Motion. Styled with AI Native theme (terracotta primary, sage green accent, 12px border radius).

## Components

### ChatThread
Displays a scrollable list of messages in a conversation thread.

```tsx
import { ChatThread } from '@/components/chat'

<ChatThread
  messages={messages}
  isLoading={isLoading}
  autoScroll={true}
  onMessageSelect={(messageId) => console.log(messageId)}
/>
```

**Props:**
- `messages: Message[]` - Array of messages from AI SDK
- `isLoading?: boolean` - Shows loading indicator
- `autoScroll?: boolean` - Auto-scroll to bottom on new messages
- `onMessageSelect?: (messageId: string) => void` - Callback when message is clicked
- `className?: string` - Additional CSS classes

### ChatMessage
Displays a single message with role-based styling (user, assistant, system).

```tsx
import { ChatMessage } from '@/components/chat'

<ChatMessage
  message={message}
  isLatest={true}
  onSelect={() => handleSelect(message.id)}
/>
```

**Props:**
- `message: Message` - Message object from AI SDK
- `isLatest?: boolean` - If true, enables streaming text animation
- `onSelect?: () => void` - Callback when message is clicked
- `className?: string` - Additional CSS classes

**Features:**
- Role-based avatars and colors
- Copy to clipboard button
- Tool call display
- Timestamp display
- Streaming text animation for latest assistant message

### ChatInput
Input field with submit button for sending messages.

```tsx
import { ChatInput } from '@/components/chat'

<ChatInput
  onSubmit={(message) => handleSend(message)}
  onStop={() => handleStop()}
  isLoading={isGenerating}
  placeholder="Ask me anything..."
  allowAttachments={true}
/>
```

**Props:**
- `onSubmit: (message: string) => void` - Callback when message is submitted
- `onStop?: () => void` - Callback when stop button is clicked
- `isLoading?: boolean` - Disables input and shows stop button
- `disabled?: boolean` - Disables input
- `placeholder?: string` - Input placeholder text
- `maxLength?: number` - Maximum character count (default: 4000)
- `allowAttachments?: boolean` - Shows attachment button
- `className?: string` - Additional CSS classes

**Features:**
- Auto-resizing textarea
- Character counter
- Enter to submit, Shift+Enter for new line
- Loading state with stop button
- AI Native theme styling with glow effects

### StreamingText
Animates text as it streams in character by character.

```tsx
import { StreamingText } from '@/components/chat'

<StreamingText
  text={aiResponse}
  speed={50}
  showCursor={true}
  onComplete={() => console.log('Done streaming')}
/>
```

**Props:**
- `text: string` - Text to display
- `speed?: number` - Characters per second (default: 50)
- `showCursor?: boolean` - Show blinking cursor during streaming
- `onComplete?: () => void` - Callback when streaming completes
- `className?: string` - Additional CSS classes

### LoadingDots
Animated loading indicator for AI thinking states.

```tsx
import { LoadingDots } from '@/components/chat'

<LoadingDots
  size="md"
  color="primary"
  label="AI is thinking..."
/>
```

**Props:**
- `size?: 'sm' | 'md' | 'lg'` - Dot size
- `color?: 'primary' | 'accent' | 'muted'` - Dot color
- `label?: string` - Optional text label
- `className?: string` - Additional CSS classes

### ToolCall
Displays tool execution information and results.

```tsx
import { ToolCall } from '@/components/chat'

<ToolCall
  toolCall={{
    toolCallId: '123',
    toolName: 'searchFiles',
    state: 'success',
    args: { query: 'example' },
    result: { files: [...] }
  }}
/>
```

**Props:**
- `toolCall: object` - Tool invocation object
  - `toolCallId?: string` - Unique identifier
  - `toolName: string` - Name of the tool
  - `state?: 'pending' | 'running' | 'success' | 'error'` - Execution state
  - `args?: Record<string, unknown>` - Tool arguments
  - `result?: unknown` - Tool execution result
- `className?: string` - Additional CSS classes

**Features:**
- Expandable/collapsible
- State-based icons and colors
- JSON formatting for args and results
- Loading animation for running state

### ReasoningPanel
Collapsible panel to display AI reasoning and thought process.

```tsx
import { ReasoningPanel } from '@/components/chat'

<ReasoningPanel
  steps={[
    { type: 'thought', content: 'I need to search for relevant files...' },
    { type: 'action', content: 'Executing searchFiles tool' },
    { type: 'observation', content: 'Found 3 matching files' }
  ]}
  title="AI Reasoning"
  defaultExpanded={false}
/>
```

**Props:**
- `steps: ReasoningStep[]` - Array of reasoning steps
  - `type: 'thought' | 'observation' | 'action'`
  - `content: string`
  - `timestamp?: Date`
- `title?: string` - Panel title (default: 'AI Reasoning')
- `defaultExpanded?: boolean` - Initial expanded state
- `className?: string` - Additional CSS classes

**Features:**
- Expandable/collapsible
- Step-by-step animation
- Type-based icons and colors
- Scrollable for long reasoning chains

## Theme

All components use the **AI Native** design system:

- **Primary Color**: `#D97706` (terracotta/amber-600)
- **Accent Color**: `#65A30D` (sage green/lime-600)
- **Border Radius**: 12px (default)
- **Shadows**: `shadow-ai-sm`, `shadow-ai-md`, `shadow-ai-lg`
- **Transitions**: `transition-ai` (200ms ease)
- **Glow Effects**: `glow-primary`, `glow-accent`

## Integration with AI SDK

These components work seamlessly with Vercel AI SDK v5 hooks:

```tsx
'use client'

import { useChat } from 'ai/react'
import { ChatThread, ChatInput } from '@/components/chat'

export function ChatInterface() {
  const { messages, input, handleInputChange, handleSubmit, isLoading, stop } = useChat({
    api: '/api/chat',
  })

  return (
    <div className="flex flex-col h-full">
      <ChatThread
        messages={messages}
        isLoading={isLoading}
      />
      <ChatInput
        onSubmit={(message) => handleSubmit({ content: message })}
        onStop={stop}
        isLoading={isLoading}
      />
    </div>
  )
}
```

## Accessibility

All components include:
- Keyboard navigation support
- ARIA labels and roles
- Focus indicators
- Screen reader friendly
- Reduced motion support

## Dependencies

- `ai` (v5.0.51) - Vercel AI SDK
- `framer-motion` (v12.24.10) - Animations
- `lucide-react` (v0.544.0) - Icons
- React 19.2.1
- Next.js 16.0.10
- Tailwind CSS 4.1.13

## Future Enhancements

- File attachment support
- Voice input
- Markdown rendering
- Code syntax highlighting
- Image preview
- Message editing
- Message reactions
