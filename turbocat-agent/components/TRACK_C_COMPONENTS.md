# Track C: Code Display & Data Components

**Status**: ✅ Complete
**Theme**: AI Native (Terracotta #D97706 + Sage Green #65A30D)
**Dependencies**: Monaco Editor, Shiki, TanStack Table, TanStack Virtual

## Components Implemented

### Code Display Components

#### 1. Monaco AI Native Theme (`lib/themes/monaco-ai-native-theme.ts`)

Custom Monaco Editor themes for AI Native design:

**Light Mode Theme:**
- Background: Warm neutral (#FAF9F7)
- Cursor/Selection: Terracotta (#D97706)
- Keywords: Terracotta (bold)
- Strings: Sage green (#4D7C0F)
- Comments: Muted sage (#65A30D, italic)
- Functions: Orange (#EA580C)
- Types: Darker amber (#B45309)

**Dark Mode Theme:**
- Background: Deep navy (#060B14)
- Cursor/Selection: Orange (#F97316)
- Keywords: Orange (bold)
- Strings: Teal (#14B8A6)
- Comments: Muted teal (#5EEAD4, italic)
- Functions: Light orange (#FB923C)
- Types: Light amber (#FCD34D)

**Usage:**
```typescript
import { registerMonacoThemes } from '@/lib/themes/monaco-ai-native-theme'
import * as monaco from 'monaco-editor'

// Register themes
registerMonacoThemes(monaco)

// Use theme
monaco.editor.setTheme('ai-native-light')
// or
monaco.editor.setTheme('ai-native-dark')
```

#### 2. CodeBlock Component (`components/code/code-block.tsx`)

Syntax-highlighted code block using Shiki with copy-to-clipboard functionality.

**Features:**
- Shiki syntax highlighting (GitHub Light/Dark themes)
- Copy-to-clipboard button
- Language badge
- Optional filename display
- Optional line numbers
- Loading state with skeleton
- AI Native themed borders and shadows
- Dark mode support

**Props:**
```typescript
interface CodeBlockProps {
  code: string              // Code to display
  language: string          // Language for syntax highlighting
  filename?: string         // Optional filename to display
  showLineNumbers?: boolean // Show line numbers (default: true)
  className?: string        // Additional CSS classes
}
```

**Usage:**
```tsx
import { CodeBlock } from '@/components/code'

<CodeBlock
  code={`function greet(name: string) {
  console.log(\`Hello, \${name}!\`);
}`}
  language="typescript"
  filename="greet.ts"
  showLineNumbers
/>
```

#### 3. InlineCode Component (`components/code/inline-code.tsx`)

Inline code styling for use within text.

**Features:**
- Amber background (light mode)
- Orange background (dark mode)
- Monospace font
- Border and padding
- Consistent with AI Native theme

**Props:**
```typescript
interface InlineCodeProps {
  children: React.ReactNode
  className?: string
}
```

**Usage:**
```tsx
import { InlineCode } from '@/components/code'

<p>
  Run <InlineCode>npm install</InlineCode> to install dependencies.
</p>
```

### Data Components

#### 4. DataTable Component (`components/data/data-table.tsx`)

Headless table using TanStack Table with full feature set.

**Features:**
- Sorting (column-based)
- Filtering
- Pagination with controls
- Row selection
- Row click handler
- Empty state handling
- Responsive (horizontal scroll)
- AI Native themed headers and hover states
- Dark mode support

**Props:**
```typescript
interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]  // Column definitions
  data: TData[]                        // Table data
  onRowClick?: (row: TData) => void    // Row click handler
  enableSorting?: boolean              // Enable sorting (default: true)
  enableFiltering?: boolean            // Enable filtering (default: true)
  enablePagination?: boolean           // Enable pagination (default: true)
  enableRowSelection?: boolean         // Enable row selection (default: false)
  pageSize?: number                    // Rows per page (default: 10)
  className?: string                   // Additional CSS classes
}
```

**Usage:**
```tsx
import { DataTable } from '@/components/data'
import { ColumnDef } from '@tanstack/react-table'

interface User {
  id: string
  name: string
  email: string
}

const columns: ColumnDef<User>[] = [
  {
    accessorKey: 'name',
    header: 'Name',
    cell: ({ row }) => <span>{row.getValue('name')}</span>,
  },
  {
    accessorKey: 'email',
    header: 'Email',
  },
]

const users: User[] = [
  { id: '1', name: 'Alice', email: 'alice@example.com' },
  { id: '2', name: 'Bob', email: 'bob@example.com' },
]

<DataTable
  columns={columns}
  data={users}
  onRowClick={(user) => console.log(user)}
  enableSorting
  enablePagination
/>
```

#### 5. VirtualList Component (`components/data/virtual-list.tsx`)

Virtualized list using TanStack Virtual for performance with large datasets.

**Features:**
- Variable row heights
- Infinite scroll support
- Loading state
- Overscan for smooth scrolling
- AI Native themed items
- Dark mode support
- VirtualListItem helper component

**Props:**
```typescript
interface VirtualListProps<T> {
  items: T[]                          // List items
  renderItem: (item: T, index: number) => React.ReactNode  // Render function
  estimateSize?: number               // Estimated row height (default: 50)
  overscan?: number                   // Overscan count (default: 5)
  onLoadMore?: () => void             // Infinite scroll handler
  hasMore?: boolean                   // Has more items to load
  isLoading?: boolean                 // Loading state
  className?: string                  // Additional CSS classes
  itemClassName?: string              // Item CSS classes
}
```

**Usage:**
```tsx
import { VirtualList, VirtualListItem } from '@/components/data'

interface Message {
  id: string
  text: string
}

const messages: Message[] = [
  { id: '1', text: 'Hello' },
  { id: '2', text: 'World' },
  // ... 10,000+ items
]

<div className="h-96">
  <VirtualList
    items={messages}
    renderItem={(message) => (
      <VirtualListItem key={message.id}>
        <p>{message.text}</p>
      </VirtualListItem>
    )}
    estimateSize={60}
    onLoadMore={() => loadMore()}
    hasMore={hasMore}
    isLoading={isLoading}
  />
</div>
```

#### 6. EmptyState Component (`components/data/empty-state.tsx`)

Reusable empty state with illustrations and actions.

**Features:**
- Three variants: `no-data`, `no-results`, `error`
- Custom icon, title, description
- Optional CTA button
- AI Native themed
- Responsive
- EmptyStateInline helper for compact use

**Props:**
```typescript
interface EmptyStateProps {
  variant?: 'no-data' | 'no-results' | 'error'
  title?: string
  description?: string
  icon?: React.ReactNode
  action?: {
    label: string
    onClick: () => void
  }
  className?: string
}
```

**Usage:**
```tsx
import { EmptyState, EmptyStateInline } from '@/components/data'

// Full empty state
<EmptyState
  variant="no-data"
  title="No tasks yet"
  description="Create your first task to get started"
  action={{
    label: 'Create Task',
    onClick: () => createTask(),
  }}
/>

// Inline empty state
<EmptyStateInline message="No results found" />
```

## Design System Integration

All components follow the AI Native design system:

### Colors
- **Primary**: `#D97706` (terracotta/amber-600)
- **Accent**: `#65A30D` (sage green/lime-600)
- **Background Light**: `#FAF9F7` (warm-50)
- **Background Dark**: `#060B14` (deep navy)

### Border Radius
- Default: `12px` (rounded-xl)
- Smaller elements: `6px` (rounded-md)
- Larger cards: `16px` (rounded-2xl)

### Shadows
- `shadow-ai-sm`: Subtle elevation
- `shadow-ai-md`: Default cards
- `shadow-ai-lg`: Hover states
- Glow effects for primary/accent colors

### Transitions
- All interactive elements: `transition-ai` (0.2s ease)
- Hover states: `hover:shadow-ai-md` or `hover:shadow-ai-lg`

## TypeScript Support

All components are fully typed with TypeScript:
- Generic types for data tables and lists
- Proper prop interfaces
- Type-safe column definitions
- Inferred types from data

## Accessibility

Components follow WCAG 2.1 AA standards:
- Keyboard navigation support
- Focus visible states
- ARIA attributes where needed
- Screen reader compatible
- Semantic HTML

## Testing

Test files included:
- `code-block.test.tsx` - CodeBlock component tests
- Example files for manual testing

## Files Created

### Code Components
- `lib/themes/monaco-ai-native-theme.ts` - Monaco theme configuration
- `components/code/code-block.tsx` - CodeBlock component
- `components/code/inline-code.tsx` - InlineCode component
- `components/code/index.ts` - Exports
- `components/code/code-examples.tsx` - Usage examples
- `components/code/code-block.test.tsx` - Tests

### Data Components
- `components/data/data-table.tsx` - DataTable component
- `components/data/virtual-list.tsx` - VirtualList component
- `components/data/empty-state.tsx` - EmptyState component
- `components/data/index.ts` - Exports
- `components/data/data-examples.tsx` - Usage examples

### Dependencies Added
- `@tanstack/react-table@^8.20.6`
- `@tanstack/react-virtual@^3.10.9`

## Next Steps

To use these components in your application:

1. **Install dependencies** (if not already done):
   ```bash
   npm install
   ```

2. **Import components**:
   ```tsx
   // Code components
   import { CodeBlock, InlineCode } from '@/components/code'

   // Data components
   import { DataTable, VirtualList, EmptyState } from '@/components/data'

   // Monaco theme
   import { registerMonacoThemes } from '@/lib/themes/monaco-ai-native-theme'
   ```

3. **Use in your pages/components** (see examples above)

4. **Customize** as needed (all components accept `className` prop)

## Notes

- All components use the existing `cn()` utility from `@/lib/utils`
- Dark mode is handled automatically via Tailwind's `dark:` modifier
- Components are responsive by default
- Monaco themes need to be registered before use
- Shiki highlighting happens asynchronously (loading state shown)

## DiffViewer Updates

The existing `FileDiffViewer` component (`components/file-diff-viewer.tsx`) already supports AI Native theme via automatic theme detection and doesn't require updates.
