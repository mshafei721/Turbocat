'use client'

import * as React from 'react'
import { useEditor, EditorContent, Editor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import {
  Bold,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  Code as CodeIcon,
  Eye,
  Edit,
} from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

/**
 * RichTextEditor - AI Native Rich Text Editor with Markdown Support
 *
 * Features:
 * - Tiptap editor with starter kit
 * - Toolbar: bold, italic, link, lists, code
 * - Markdown shortcuts (e.g., **bold**, *italic*, - list)
 * - Preview toggle
 * - AI Native warm neutral styling
 * - Dark mode support
 * - WCAG AA compliant
 *
 * Usage:
 * const [content, setContent] = useState('')
 * <RichTextEditor value={content} onChange={setContent} />
 */

interface ToolbarButtonProps {
  onClick: () => void
  isActive?: boolean
  disabled?: boolean
  icon: React.ReactNode
  label: string
}

function ToolbarButton({ onClick, isActive, disabled, icon, label }: ToolbarButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={cn(
        'inline-flex items-center justify-center rounded-lg p-2 text-sm font-medium transition-colors',
        'hover:bg-accent hover:text-accent-foreground',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        'disabled:pointer-events-none disabled:opacity-50',
        isActive && 'bg-primary/10 text-primary',
      )}
    >
      {icon}
    </button>
  )
}

interface RichTextEditorProps {
  value?: string
  onChange?: (value: string) => void
  placeholder?: string
  className?: string
  minHeight?: number
  maxHeight?: number
  editable?: boolean
}

export function RichTextEditor({
  value = '',
  onChange,
  placeholder = 'Start typing...',
  className,
  minHeight = 200,
  maxHeight = 500,
  editable = true,
}: RichTextEditorProps) {
  const [isPreview, setIsPreview] = React.useState(false)

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
    ],
    content: value,
    editable: editable && !isPreview,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML()
      onChange?.(html)
    },
    editorProps: {
      attributes: {
        class: cn(
          'prose prose-sm sm:prose-base max-w-none',
          'focus:outline-none',
          'p-4',
          'dark:prose-invert',
        ),
      },
    },
  })

  // Update content when value prop changes
  React.useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value)
    }
  }, [editor, value])

  if (!editor) {
    return null
  }

  const toggleBold = () => editor.chain().focus().toggleBold().run()
  const toggleItalic = () => editor.chain().focus().toggleItalic().run()
  const toggleCode = () => editor.chain().focus().toggleCode().run()
  const toggleBulletList = () => editor.chain().focus().toggleBulletList().run()
  const toggleOrderedList = () => editor.chain().focus().toggleOrderedList().run()

  // Link extension not installed in StarterKit
  // TODO: Add @tiptap/extension-link to enable link functionality
  // const setLink = () => {
  //   const url = window.prompt('Enter URL:')
  //   if (url) {
  //     editor.chain().focus().setLink({ href: url }).run()
  //   }
  // }

  return (
    <div className={cn('w-full overflow-hidden rounded-xl border border-input bg-background', className)}>
      {/* Toolbar */}
      <div className="flex items-center justify-between border-b border-input bg-muted/30 px-2 py-1.5">
        <div className="flex items-center gap-1">
          <ToolbarButton
            onClick={toggleBold}
            isActive={editor.isActive('bold')}
            icon={<Bold className="h-4 w-4" />}
            label="Bold (⌘B)"
            disabled={isPreview}
          />
          <ToolbarButton
            onClick={toggleItalic}
            isActive={editor.isActive('italic')}
            icon={<Italic className="h-4 w-4" />}
            label="Italic (⌘I)"
            disabled={isPreview}
          />
          <ToolbarButton
            onClick={toggleCode}
            isActive={editor.isActive('code')}
            icon={<CodeIcon className="h-4 w-4" />}
            label="Code (⌘E)"
            disabled={isPreview}
          />

          <div className="mx-1 h-5 w-px bg-border" />

          <ToolbarButton
            onClick={toggleBulletList}
            isActive={editor.isActive('bulletList')}
            icon={<List className="h-4 w-4" />}
            label="Bullet List"
            disabled={isPreview}
          />
          <ToolbarButton
            onClick={toggleOrderedList}
            isActive={editor.isActive('orderedList')}
            icon={<ListOrdered className="h-4 w-4" />}
            label="Numbered List"
            disabled={isPreview}
          />

          <div className="mx-1 h-5 w-px bg-border" />

          {/* Link button disabled - Link extension not installed
          <ToolbarButton
            onClick={setLink}
            isActive={editor.isActive('link')}
            icon={<LinkIcon className="h-4 w-4" />}
            label="Link"
            disabled={isPreview}
          />
          */}
        </div>

        {/* Preview Toggle */}
        <button
          type="button"
          onClick={() => setIsPreview(!isPreview)}
          className={cn(
            'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors',
            'hover:bg-accent hover:text-accent-foreground',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            isPreview && 'bg-primary/10 text-primary',
          )}
          aria-pressed={isPreview}
        >
          {isPreview ? (
            <>
              <Edit className="h-3.5 w-3.5" />
              <span>Edit</span>
            </>
          ) : (
            <>
              <Eye className="h-3.5 w-3.5" />
              <span>Preview</span>
            </>
          )}
        </button>
      </div>

      {/* Editor */}
      <div
        className={cn('overflow-y-auto bg-warm-50 dark:bg-slate-900', 'transition-colors')}
        style={{
          minHeight: `${minHeight}px`,
          maxHeight: `${maxHeight}px`,
        }}
      >
        <EditorContent
          editor={editor}
          className={cn(
            'h-full',
            !value && !isPreview && 'before:pointer-events-none before:absolute before:text-muted-foreground',
          )}
          placeholder={placeholder}
        />
      </div>

      {/* Footer with shortcuts */}
      <div className="border-t border-input bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
        <span>
          Supports Markdown shortcuts: **bold**, *italic*, - list, 1. numbered, ` code
        </span>
      </div>
    </div>
  )
}
