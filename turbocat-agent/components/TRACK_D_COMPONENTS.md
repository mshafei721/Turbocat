# Track D: Navigation, Forms & Rich Text Components

This document describes the AI Native components added in Track D.

## Table of Contents

- [Command Palette](#command-palette)
- [Form Components](#form-components)
- [Rich Text Editor](#rich-text-editor)
- [Additional UI Components](#additional-ui-components)

---

## Command Palette

**Location:** `components/navigation/command-palette.tsx`

A keyboard-driven command interface for quick navigation and actions.

### Features

- **Keyboard Shortcut:** Cmd+K / Ctrl+K to open
- **Recent Commands:** Tracks and displays recent actions
- **Theme Switching:** Quick theme toggle (light/dark/system)
- **Navigation:** Jump to key pages
- **AI Native Styling:** Warm terracotta accents
- **Dark Mode Support:** Full dark theme support
- **Accessibility:** WCAG AA compliant, keyboard navigable

### Usage

```tsx
import { CommandPalette } from '@/components/navigation'

export default function Layout() {
  return (
    <>
      <header>
        <CommandPalette />
      </header>
      {/* rest of layout */}
    </>
  )
}
```

### Keyboard Shortcuts

- `⌘K` / `Ctrl+K` - Toggle command palette
- `⌘H` - Go to Home (from palette)
- `⌘T` - Go to Tasks
- `⌘P` - Go to Projects
- `⌘,` - Go to Settings

---

## Form Components

### FormField

**Location:** `components/forms/form-field.tsx`

Composable form field wrapper integrating React Hook Form.

#### Features

- React Hook Form integration
- Accessible error messages
- Required indicator
- AI Native inline validation
- Dark mode support

#### Usage

```tsx
import { FormField } from '@/components/forms'
import { useForm } from 'react-hook-form'
import { Input } from '@/components/ui/input'

function MyForm() {
  const form = useForm()

  return (
    <FormField
      control={form.control}
      name="email"
      label="Email"
      required
      render={({ field }) => <Input {...field} type="email" />}
    />
  )
}
```

### FormLabel

**Location:** `components/forms/form-label.tsx`

Enhanced label with required indicator.

#### Features

- Required asterisk
- Accessible attributes
- AI Native styling
- Dark mode support

#### Usage

```tsx
import { FormLabel } from '@/components/forms'

<FormLabel htmlFor="email" required>
  Email Address
</FormLabel>
```

### FormMessage

**Location:** `components/forms/form-message.tsx`

Error message component with icon and animations.

#### Features

- Accessible error announcements (aria-live)
- Icon indicator
- Smooth animations
- Variants: error, warning, info
- Dark mode support

#### Usage

```tsx
import { FormMessage } from '@/components/forms'

<FormMessage>{error.message}</FormMessage>
```

---

## Rich Text Editor

**Location:** `components/forms/rich-text-editor.tsx`

AI Native rich text editor powered by Tiptap.

### Features

- **Toolbar:** Bold, Italic, Link, Bullet List, Numbered List, Code
- **Markdown Shortcuts:** `**bold**`, `*italic*`, `- list`, `1. numbered`, `` `code` ``
- **Preview Toggle:** Switch between edit and preview modes
- **AI Native Styling:** Warm neutral editor background
- **Dark Mode Support:** Full dark theme
- **Keyboard Accessible:** All toolbar actions have shortcuts
- **Configurable:** Min/max height, placeholder

### Usage

```tsx
import { RichTextEditor } from '@/components/forms'
import { useState } from 'react'

function MyEditor() {
  const [content, setContent] = useState('')

  return (
    <RichTextEditor
      value={content}
      onChange={setContent}
      placeholder="Start typing..."
      minHeight={200}
      maxHeight={500}
    />
  )
}
```

### Keyboard Shortcuts

- `⌘B` / `Ctrl+B` - Bold
- `⌘I` / `Ctrl+I` - Italic
- `⌘E` / `Ctrl+E` - Inline code

### Markdown Renderer

**Location:** `components/forms/markdown-renderer.tsx`

Renders markdown content using the Streamdown library.

#### Usage

```tsx
import { MarkdownRenderer } from '@/components/forms'

<MarkdownRenderer content="# Hello\n\nThis is **bold**" />
```

---

## Additional UI Components

### Sheet

**Location:** `components/ui/sheet.tsx`

Side drawer/sheet component for overlays.

#### Usage

```tsx
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'

<Sheet>
  <SheetTrigger>Open Sheet</SheetTrigger>
  <SheetContent side="right">
    <SheetHeader>
      <SheetTitle>Sheet Title</SheetTitle>
    </SheetHeader>
    <p>Sheet content goes here</p>
  </SheetContent>
</Sheet>
```

### Skeleton

**Location:** `components/ui/skeleton.tsx`

Loading skeleton component with shimmer animation.

#### Usage

```tsx
import { Skeleton } from '@/components/ui/skeleton'

<Skeleton className="h-12 w-full" />
```

### Separator

**Location:** `components/ui/separator.tsx`

Visual divider for content sections.

#### Usage

```tsx
import { Separator } from '@/components/ui/separator'

<Separator orientation="horizontal" />
```

### ScrollArea

**Location:** `components/ui/scroll-area.tsx`

Styled scrollable container.

#### Usage

```tsx
import { ScrollArea } from '@/components/ui/scroll-area'

<ScrollArea className="h-[400px]">
  {/* Long content */}
</ScrollArea>
```

### Popover

**Location:** `components/ui/popover.tsx`

Floating popover component.

#### Usage

```tsx
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover'

<Popover>
  <PopoverTrigger>Open Popover</PopoverTrigger>
  <PopoverContent>Popover content</PopoverContent>
</Popover>
```

### Breadcrumb

**Location:** `components/ui/breadcrumb.tsx`

Navigation breadcrumb component.

#### Features

- Semantic HTML nav structure
- Accessible ARIA labels
- Customizable separators
- AI Native styling
- Dark mode support

#### Usage

```tsx
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'

<Breadcrumb>
  <BreadcrumbList>
    <BreadcrumbItem>
      <BreadcrumbLink href="/">Home</BreadcrumbLink>
    </BreadcrumbItem>
    <BreadcrumbSeparator />
    <BreadcrumbItem>
      <BreadcrumbPage>Settings</BreadcrumbPage>
    </BreadcrumbItem>
  </BreadcrumbList>
</Breadcrumb>
```

### Slider

**Location:** `components/ui/slider.tsx`

Range slider component.

#### Features

- Accessible keyboard navigation
- AI Native terracotta accent
- Dark mode support
- Smooth animations

#### Usage

```tsx
import { Slider } from '@/components/ui/slider'

<Slider defaultValue={[50]} max={100} step={1} onValueChange={(values) => console.log(values[0])} />
```

### Calendar

**Location:** `components/ui/calendar.tsx`

Date picker calendar.

#### Features

- React Day Picker integration
- AI Native terracotta accent
- Keyboard navigation
- Dark mode support
- Accessible ARIA labels

#### Usage

```tsx
import { Calendar } from '@/components/ui/calendar'
import { useState } from 'react'

function MyCalendar() {
  const [date, setDate] = useState<Date | undefined>()

  return <Calendar mode="single" selected={date} onSelect={setDate} />
}
```

### DatePicker

**Location:** `components/ui/date-picker.tsx`

Date picker with popover.

#### Features

- Calendar popover
- AI Native styling
- Keyboard accessible
- Dark mode support
- Date formatting (via date-fns)

#### Usage

```tsx
import { DatePicker } from '@/components/ui/date-picker'
import { useState } from 'react'

function MyDatePicker() {
  const [date, setDate] = useState<Date>()

  return <DatePicker date={date} onDateChange={setDate} placeholder="Pick a date" />
}
```

---

## Complete Example

See `components/forms/example-usage.tsx` for a full working example that demonstrates:

- Form with React Hook Form + Zod validation
- All form components (FormField, FormLabel, FormMessage)
- RichTextEditor with validation
- DatePicker integration
- Slider component
- MarkdownRenderer for preview

---

## Dependencies Added

### NPM Packages

```json
{
  "cmdk": "^1.0.4",
  "react-hook-form": "^7.53.2",
  "@hookform/resolvers": "^3.9.1",
  "@tiptap/react": "^2.10.5",
  "@tiptap/starter-kit": "^2.10.5",
  "@radix-ui/react-scroll-area": "^1.2.2",
  "@radix-ui/react-separator": "^1.2.1",
  "@radix-ui/react-popover": "^1.1.25",
  "@radix-ui/react-slider": "^1.2.3",
  "react-day-picker": "^9.4.4",
  "date-fns": "^4.1.0"
}
```

---

## AI Native Theme

All components use the AI Native design system:

- **Primary Color:** `#D97706` (terracotta/amber-600) in light mode
- **Primary Color:** `#F97316` (orange-500) in dark mode
- **Accent Color:** `#65A30D` (sage green/lime-600) in light mode
- **Accent Color:** `#14B8A6` (teal-600) in dark mode
- **Warm Backgrounds:** `#FAF9F7` (warm-50) for light mode surfaces
- **Border Radius:** 12px default
- **Transitions:** 200ms ease
- **Shadows:** Soft, subtle depth

---

## Accessibility

All components follow WCAG AA standards:

- **Keyboard Navigation:** All interactive elements are keyboard accessible
- **ARIA Labels:** Proper labeling for screen readers
- **Focus Indicators:** Clear focus states with ring-2
- **Color Contrast:** Meets 4.5:1 minimum ratio
- **Error Announcements:** aria-live regions for form errors
- **Semantic HTML:** Proper heading hierarchy and structure

---

## Performance

- **Code Splitting:** Components can be lazy loaded
- **Memoization:** Form components use React.memo where appropriate
- **Lightweight:** Minimal bundle impact with tree-shaking
- **Optimized Animations:** Uses CSS transforms and GPU acceleration

---

## Testing Checklist

- [ ] CommandPalette opens with Cmd+K
- [ ] Recent commands persist in localStorage
- [ ] Theme switching works
- [ ] FormField displays errors correctly
- [ ] Required indicator shows on labels
- [ ] RichTextEditor toolbar buttons work
- [ ] Markdown shortcuts work in editor
- [ ] Preview toggle works
- [ ] DatePicker calendar opens
- [ ] Slider value updates
- [ ] All components render in dark mode
- [ ] Keyboard navigation works throughout
- [ ] Screen reader announces errors

---

## Future Enhancements

- [ ] Add more Tiptap extensions (tables, mentions, emoji)
- [ ] Add drag-and-drop file upload to RichTextEditor
- [ ] Add command palette fuzzy search
- [ ] Add command palette plugins system
- [ ] Add more date picker presets (this week, last month, etc.)
- [ ] Add slider marks and range mode
- [ ] Add form auto-save functionality

---

## File Structure

```
components/
├── navigation/
│   ├── command-palette.tsx
│   └── index.ts
├── forms/
│   ├── form-field.tsx
│   ├── form-label.tsx
│   ├── form-message.tsx
│   ├── rich-text-editor.tsx
│   ├── markdown-renderer.tsx
│   ├── example-usage.tsx
│   └── index.ts
└── ui/
    ├── command.tsx
    ├── sheet.tsx
    ├── skeleton.tsx
    ├── separator.tsx
    ├── scroll-area.tsx
    ├── popover.tsx
    ├── breadcrumb.tsx
    ├── slider.tsx
    ├── calendar.tsx
    └── date-picker.tsx
```
