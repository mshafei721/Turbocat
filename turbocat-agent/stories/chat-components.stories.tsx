/**
 * Chat Components Storybook Stories
 *
 * @file D:/009_Projects_AI/Personal_Projects/Turbocat/turbocat-agent/stories/chat-components.stories.tsx
 */

import type { Meta, StoryObj } from '@storybook/react'
import { ChatThread } from '../components/chat/chat-thread'
import { ChatMessage } from '../components/chat/chat-message'
import { ChatInput } from '../components/chat/chat-input'
import { StreamingText } from '../components/chat/streaming-text'
import { LoadingDots } from '../components/chat/loading-dots'
import { ToolCall } from '../components/chat/tool-call'
import { ReasoningPanel } from '../components/chat/reasoning-panel'
import type { Message } from 'ai'

// Mock messages
const mockMessages: Message[] = [
  {
    id: '1',
    role: 'user',
    content: 'Hello! Can you help me with a coding task?',
    createdAt: new Date('2024-01-11T10:00:00'),
  },
  {
    id: '2',
    role: 'assistant',
    content: "Of course! I'd be happy to help you with your coding task. What would you like to work on?",
    createdAt: new Date('2024-01-11T10:00:05'),
  },
  {
    id: '3',
    role: 'user',
    content: 'I need to create a React component that displays a list of users.',
    createdAt: new Date('2024-01-11T10:00:15'),
  },
  {
    id: '4',
    role: 'assistant',
    content:
      'Great! Let me help you create a React component for displaying a list of users. Here\'s a simple example:\n\n```tsx\ninterface User {\n  id: string\n  name: string\n  email: string\n}\n\nfunction UserList({ users }: { users: User[] }) {\n  return (\n    <ul>\n      {users.map(user => (\n        <li key={user.id}>{user.name}</li>\n      ))}\n    </ul>\n  )\n}\n```',
    createdAt: new Date('2024-01-11T10:00:20'),
    toolInvocations: [
      {
        toolCallId: 'tool-1',
        toolName: 'searchFiles',
        state: 'success',
        args: { query: 'React component examples' },
        result: { filesFound: 3, examples: ['UserList.tsx', 'UserCard.tsx'] },
      },
    ],
  },
]

// ChatThread Stories
const ChatThreadMeta: Meta<typeof ChatThread> = {
  title: 'Chat/ChatThread',
  component: ChatThread,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
}

export default ChatThreadMeta

type ChatThreadStory = StoryObj<typeof ChatThread>

export const Default: ChatThreadStory = {
  args: {
    messages: mockMessages,
    isLoading: false,
    autoScroll: true,
  },
}

export const Loading: ChatThreadStory = {
  args: {
    messages: mockMessages,
    isLoading: true,
    autoScroll: true,
  },
}

export const Empty: ChatThreadStory = {
  args: {
    messages: [],
    isLoading: false,
  },
}

// ChatMessage Stories
const ChatMessageMeta: Meta<typeof ChatMessage> = {
  title: 'Chat/ChatMessage',
  component: ChatMessage,
  tags: ['autodocs'],
}

export const UserMessage: StoryObj<typeof ChatMessage> = {
  args: {
    message: mockMessages[0],
    isLatest: false,
  },
}

export const AssistantMessage: StoryObj<typeof ChatMessage> = {
  args: {
    message: mockMessages[1],
    isLatest: false,
  },
}

export const MessageWithToolCall: StoryObj<typeof ChatMessage> = {
  args: {
    message: mockMessages[3],
    isLatest: false,
  },
}

export const StreamingMessage: StoryObj<typeof ChatMessage> = {
  args: {
    message: {
      ...mockMessages[1],
      content: 'This message is being streamed character by character...',
    },
    isLatest: true,
  },
}

// ChatInput Stories
const ChatInputMeta: Meta<typeof ChatInput> = {
  title: 'Chat/ChatInput',
  component: ChatInput,
  tags: ['autodocs'],
}

export const InputDefault: StoryObj<typeof ChatInput> = {
  args: {
    onSubmit: (message) => console.log('Submit:', message),
    isLoading: false,
    placeholder: 'Type your message...',
  },
}

export const InputLoading: StoryObj<typeof ChatInput> = {
  args: {
    onSubmit: (message) => console.log('Submit:', message),
    onStop: () => console.log('Stop'),
    isLoading: true,
  },
}

export const InputWithAttachments: StoryObj<typeof ChatInput> = {
  args: {
    onSubmit: (message) => console.log('Submit:', message),
    allowAttachments: true,
  },
}

export const InputDisabled: StoryObj<typeof ChatInput> = {
  args: {
    onSubmit: (message) => console.log('Submit:', message),
    disabled: true,
  },
}

// StreamingText Stories
const StreamingTextMeta: Meta<typeof StreamingText> = {
  title: 'Chat/StreamingText',
  component: StreamingText,
  tags: ['autodocs'],
}

export const StreamingDefault: StoryObj<typeof StreamingText> = {
  args: {
    text: 'This text will appear character by character as if it is being typed in real-time.',
    speed: 50,
    showCursor: true,
  },
}

export const StreamingFast: StoryObj<typeof StreamingText> = {
  args: {
    text: 'This text streams faster!',
    speed: 100,
    showCursor: true,
  },
}

export const StreamingSlow: StoryObj<typeof StreamingText> = {
  args: {
    text: 'This text streams slowly...',
    speed: 20,
    showCursor: true,
  },
}

export const StreamingNoCursor: StoryObj<typeof StreamingText> = {
  args: {
    text: 'This text streams without a cursor.',
    speed: 50,
    showCursor: false,
  },
}

// LoadingDots Stories
const LoadingDotsMeta: Meta<typeof LoadingDots> = {
  title: 'Chat/LoadingDots',
  component: LoadingDots,
  tags: ['autodocs'],
}

export const DotsSmall: StoryObj<typeof LoadingDots> = {
  args: {
    size: 'sm',
    color: 'primary',
  },
}

export const DotsMedium: StoryObj<typeof LoadingDots> = {
  args: {
    size: 'md',
    color: 'primary',
    label: 'AI is thinking...',
  },
}

export const DotsLarge: StoryObj<typeof LoadingDots> = {
  args: {
    size: 'lg',
    color: 'accent',
    label: 'Processing...',
  },
}

export const DotsWithLabel: StoryObj<typeof LoadingDots> = {
  args: {
    size: 'md',
    color: 'primary',
    label: 'Analyzing your request...',
  },
}

// ToolCall Stories
const ToolCallMeta: Meta<typeof ToolCall> = {
  title: 'Chat/ToolCall',
  component: ToolCall,
  tags: ['autodocs'],
}

export const ToolSuccess: StoryObj<typeof ToolCall> = {
  args: {
    toolCall: {
      toolCallId: 'tool-1',
      toolName: 'searchFiles',
      state: 'success',
      args: { query: 'React components', path: '/src' },
      result: { filesFound: 5, files: ['Button.tsx', 'Input.tsx', 'Card.tsx'] },
    },
  },
}

export const ToolRunning: StoryObj<typeof ToolCall> = {
  args: {
    toolCall: {
      toolCallId: 'tool-2',
      toolName: 'executeCode',
      state: 'running',
      args: { code: 'console.log("Hello World")', language: 'javascript' },
    },
  },
}

export const ToolError: StoryObj<typeof ToolCall> = {
  args: {
    toolCall: {
      toolCallId: 'tool-3',
      toolName: 'readFile',
      state: 'error',
      args: { path: '/invalid/path.txt' },
      result: 'File not found',
    },
  },
}

export const ToolPending: StoryObj<typeof ToolCall> = {
  args: {
    toolCall: {
      toolCallId: 'tool-4',
      toolName: 'analyzeCode',
      state: 'pending',
      args: { filePath: '/src/index.ts' },
    },
  },
}

// ReasoningPanel Stories
const ReasoningPanelMeta: Meta<typeof ReasoningPanel> = {
  title: 'Chat/ReasoningPanel',
  component: ReasoningPanel,
  tags: ['autodocs'],
}

export const ReasoningDefault: StoryObj<typeof ReasoningPanel> = {
  args: {
    steps: [
      { type: 'thought', content: 'User is asking about creating a React component.', timestamp: new Date() },
      { type: 'action', content: 'Searching for relevant examples in the codebase.', timestamp: new Date() },
      {
        type: 'observation',
        content: 'Found 3 similar component examples in /src/components.',
        timestamp: new Date(),
      },
      {
        type: 'thought',
        content: 'I should provide a simple example with TypeScript types.',
        timestamp: new Date(),
      },
      { type: 'action', content: 'Generating component code with best practices.', timestamp: new Date() },
    ],
    title: 'AI Reasoning Process',
    defaultExpanded: true,
  },
}

export const ReasoningCollapsed: StoryObj<typeof ReasoningPanel> = {
  args: {
    steps: [
      { type: 'thought', content: 'Analyzing user request...', timestamp: new Date() },
      { type: 'action', content: 'Searching documentation...', timestamp: new Date() },
      { type: 'observation', content: 'Found relevant information.', timestamp: new Date() },
    ],
    title: 'AI Reasoning',
    defaultExpanded: false,
  },
}

export const ReasoningLongChain: StoryObj<typeof ReasoningPanel> = {
  args: {
    steps: Array.from({ length: 10 }, (_, i) => ({
      type: ['thought', 'action', 'observation'][i % 3] as 'thought' | 'action' | 'observation',
      content: `Step ${i + 1}: Processing information and making decisions...`,
      timestamp: new Date(),
    })),
    title: 'Extended Reasoning Chain',
    defaultExpanded: true,
  },
}
