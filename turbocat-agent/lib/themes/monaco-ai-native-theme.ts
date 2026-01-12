/**
 * Monaco Editor AI Native Theme Configuration
 *
 * Light mode: Warm, terracotta-based AI Native theme
 * Dark mode: Deep navy with orange accents
 *
 * @file D:/009_Projects_AI/Personal_Projects/Turbocat/turbocat-agent/lib/themes/monaco-ai-native-theme.ts
 */

// Monaco editor types are optional - will be loaded dynamically if monaco-editor is installed
// import type * as monaco from 'monaco-editor'

/**
 * AI Native Light Theme (Warm, Terracotta)
 */
export const monacoAiNativeLightTheme: any = {
  base: 'vs',
  inherit: true,
  rules: [
    // Comments - Muted sage
    { token: 'comment', foreground: '65A30D', fontStyle: 'italic' },
    { token: 'comment.line', foreground: '65A30D', fontStyle: 'italic' },
    { token: 'comment.block', foreground: '65A30D', fontStyle: 'italic' },

    // Keywords - Terracotta
    { token: 'keyword', foreground: 'D97706', fontStyle: 'bold' },
    { token: 'keyword.control', foreground: 'D97706', fontStyle: 'bold' },
    { token: 'keyword.operator', foreground: 'D97706' },

    // Strings - Sage green
    { token: 'string', foreground: '4D7C0F' },
    { token: 'string.quoted', foreground: '4D7C0F' },
    { token: 'string.template', foreground: '4D7C0F' },

    // Numbers - Amber
    { token: 'number', foreground: 'F59E0B' },
    { token: 'number.hex', foreground: 'F59E0B' },
    { token: 'number.binary', foreground: 'F59E0B' },
    { token: 'number.octal', foreground: 'F59E0B' },

    // Functions - Orange
    { token: 'entity.name.function', foreground: 'EA580C' },
    { token: 'support.function', foreground: 'EA580C' },
    { token: 'meta.function-call', foreground: 'EA580C' },

    // Types - Darker amber
    { token: 'entity.name.type', foreground: 'B45309' },
    { token: 'entity.name.class', foreground: 'B45309' },
    { token: 'support.type', foreground: 'B45309' },
    { token: 'support.class', foreground: 'B45309' },

    // Variables - Slate 800
    { token: 'variable', foreground: '1E293B' },
    { token: 'variable.parameter', foreground: '334155' },
    { token: 'variable.other', foreground: '1E293B' },

    // Constants - Terracotta
    { token: 'constant', foreground: 'C2410C' },
    { token: 'constant.language', foreground: 'C2410C' },
    { token: 'constant.numeric', foreground: 'F59E0B' },

    // Tags (HTML/JSX) - Terracotta
    { token: 'entity.name.tag', foreground: 'D97706' },
    { token: 'meta.tag', foreground: 'D97706' },

    // Attributes - Orange
    { token: 'entity.other.attribute-name', foreground: 'EA580C' },

    // Operators - Slate 600
    { token: 'operator', foreground: '475569' },
    { token: 'punctuation', foreground: '475569' },

    // Punctuation - Slate 500
    { token: 'punctuation.definition', foreground: '64748B' },
    { token: 'punctuation.separator', foreground: '64748B' },

    // Invalid/Errors - Red
    { token: 'invalid', foreground: 'DC2626', fontStyle: 'bold' },
    { token: 'invalid.illegal', foreground: 'DC2626', fontStyle: 'bold' },
  ],
  colors: {
    // Editor background - Warm neutral
    'editor.background': '#FAF9F7',
    'editor.foreground': '#1E293B',

    // Lines
    'editor.lineHighlightBackground': '#F5F4F1',
    'editor.lineHighlightBorder': '#ECEAE5',

    // Selection - Terracotta with opacity
    'editor.selectionBackground': '#D9770640',
    'editor.selectionHighlightBackground': '#D9770620',
    'editor.inactiveSelectionBackground': '#D9770620',

    // Cursor - Terracotta
    'editorCursor.foreground': '#D97706',

    // Line numbers
    'editorLineNumber.foreground': '#94A3B8',
    'editorLineNumber.activeForeground': '#D97706',

    // Gutter
    'editorGutter.background': '#FAF9F7',
    'editorGutter.addedBackground': '#65A30D',
    'editorGutter.deletedBackground': '#DC2626',
    'editorGutter.modifiedBackground': '#F59E0B',

    // Scrollbar
    'scrollbarSlider.background': '#CBD5E180',
    'scrollbarSlider.hoverBackground': '#94A3B8A0',
    'scrollbarSlider.activeBackground': '#64748BC0',

    // Indentation guides
    'editorIndentGuide.background': '#E2E8F0',
    'editorIndentGuide.activeBackground': '#CBD5E1',

    // Whitespace
    'editorWhitespace.foreground': '#E2E8F0',

    // Widget (autocomplete, hover)
    'editorWidget.background': '#FFFFFF',
    'editorWidget.border': '#E2E8F0',
    'editorWidget.foreground': '#1E293B',

    // Suggest widget
    'editorSuggestWidget.background': '#FFFFFF',
    'editorSuggestWidget.border': '#E2E8F0',
    'editorSuggestWidget.foreground': '#1E293B',
    'editorSuggestWidget.selectedBackground': '#FEF3C7',
    'editorSuggestWidget.highlightForeground': '#D97706',

    // Hover widget
    'editorHoverWidget.background': '#FFFFFF',
    'editorHoverWidget.border': '#E2E8F0',
    'editorHoverWidget.foreground': '#1E293B',

    // Find/replace
    'editor.findMatchBackground': '#FCD34D80',
    'editor.findMatchHighlightBackground': '#FCD34D40',
    'editor.findRangeHighlightBackground': '#FEF3C720',

    // Diff editor
    'diffEditor.insertedTextBackground': '#65A30D20',
    'diffEditor.removedTextBackground': '#DC262620',

    // Minimap
    'minimap.background': '#FAF9F7',
    'minimap.selectionHighlight': '#D9770640',
    'minimap.findMatchHighlight': '#FCD34D80',

    // Breadcrumbs
    'breadcrumb.foreground': '#64748B',
    'breadcrumb.background': '#FAF9F7',
    'breadcrumb.focusForeground': '#D97706',
    'breadcrumb.activeSelectionForeground': '#D97706',
  },
}

/**
 * AI Native Dark Theme (Deep Navy, Orange)
 */
export const monacoAiNativeDarkTheme: any = {
  base: 'vs-dark',
  inherit: true,
  rules: [
    // Comments - Muted teal
    { token: 'comment', foreground: '5EEAD4', fontStyle: 'italic' },
    { token: 'comment.line', foreground: '5EEAD4', fontStyle: 'italic' },
    { token: 'comment.block', foreground: '5EEAD4', fontStyle: 'italic' },

    // Keywords - Orange
    { token: 'keyword', foreground: 'F97316', fontStyle: 'bold' },
    { token: 'keyword.control', foreground: 'F97316', fontStyle: 'bold' },
    { token: 'keyword.operator', foreground: 'F97316' },

    // Strings - Teal
    { token: 'string', foreground: '14B8A6' },
    { token: 'string.quoted', foreground: '14B8A6' },
    { token: 'string.template', foreground: '14B8A6' },

    // Numbers - Amber
    { token: 'number', foreground: 'FBBF24' },
    { token: 'number.hex', foreground: 'FBBF24' },
    { token: 'number.binary', foreground: 'FBBF24' },
    { token: 'number.octal', foreground: 'FBBF24' },

    // Functions - Light orange
    { token: 'entity.name.function', foreground: 'FB923C' },
    { token: 'support.function', foreground: 'FB923C' },
    { token: 'meta.function-call', foreground: 'FB923C' },

    // Types - Light amber
    { token: 'entity.name.type', foreground: 'FCD34D' },
    { token: 'entity.name.class', foreground: 'FCD34D' },
    { token: 'support.type', foreground: 'FCD34D' },
    { token: 'support.class', foreground: 'FCD34D' },

    // Variables - Light slate
    { token: 'variable', foreground: 'E2E8F0' },
    { token: 'variable.parameter', foreground: 'CBD5E1' },
    { token: 'variable.other', foreground: 'E2E8F0' },

    // Constants - Orange
    { token: 'constant', foreground: 'EA580C' },
    { token: 'constant.language', foreground: 'EA580C' },
    { token: 'constant.numeric', foreground: 'FBBF24' },

    // Tags (HTML/JSX) - Orange
    { token: 'entity.name.tag', foreground: 'F97316' },
    { token: 'meta.tag', foreground: 'F97316' },

    // Attributes - Light orange
    { token: 'entity.other.attribute-name', foreground: 'FB923C' },

    // Operators - Slate
    { token: 'operator', foreground: '94A3B8' },
    { token: 'punctuation', foreground: '94A3B8' },

    // Punctuation - Muted slate
    { token: 'punctuation.definition', foreground: '64748B' },
    { token: 'punctuation.separator', foreground: '64748B' },

    // Invalid/Errors - Red
    { token: 'invalid', foreground: 'EF4444', fontStyle: 'bold' },
    { token: 'invalid.illegal', foreground: 'EF4444', fontStyle: 'bold' },
  ],
  colors: {
    // Editor background - Deep navy
    'editor.background': '#060B14',
    'editor.foreground': '#F8FAFC',

    // Lines
    'editor.lineHighlightBackground': '#0F172A',
    'editor.lineHighlightBorder': '#1E293B',

    // Selection - Orange with opacity
    'editor.selectionBackground': '#F9731640',
    'editor.selectionHighlightBackground': '#F9731620',
    'editor.inactiveSelectionBackground': '#F9731620',

    // Cursor - Orange
    'editorCursor.foreground': '#F97316',

    // Line numbers
    'editorLineNumber.foreground': '#475569',
    'editorLineNumber.activeForeground': '#F97316',

    // Gutter
    'editorGutter.background': '#060B14',
    'editorGutter.addedBackground': '#14B8A6',
    'editorGutter.deletedBackground': '#EF4444',
    'editorGutter.modifiedBackground': '#FBBF24',

    // Scrollbar
    'scrollbarSlider.background': '#1E293B80',
    'scrollbarSlider.hoverBackground': '#334155A0',
    'scrollbarSlider.activeBackground': '#475569C0',

    // Indentation guides
    'editorIndentGuide.background': '#1E293B',
    'editorIndentGuide.activeBackground': '#334155',

    // Whitespace
    'editorWhitespace.foreground': '#1E293B',

    // Widget (autocomplete, hover)
    'editorWidget.background': '#1E293B',
    'editorWidget.border': '#334155',
    'editorWidget.foreground': '#F8FAFC',

    // Suggest widget
    'editorSuggestWidget.background': '#1E293B',
    'editorSuggestWidget.border': '#334155',
    'editorSuggestWidget.foreground': '#F8FAFC',
    'editorSuggestWidget.selectedBackground': '#334155',
    'editorSuggestWidget.highlightForeground': '#F97316',

    // Hover widget
    'editorHoverWidget.background': '#1E293B',
    'editorHoverWidget.border': '#334155',
    'editorHoverWidget.foreground': '#F8FAFC',

    // Find/replace
    'editor.findMatchBackground': '#FBBF2480',
    'editor.findMatchHighlightBackground': '#FBBF2440',
    'editor.findRangeHighlightBackground': '#FDE68A20',

    // Diff editor
    'diffEditor.insertedTextBackground': '#14B8A620',
    'diffEditor.removedTextBackground': '#EF444420',

    // Minimap
    'minimap.background': '#060B14',
    'minimap.selectionHighlight': '#F9731640',
    'minimap.findMatchHighlight': '#FBBF2480',

    // Breadcrumbs
    'breadcrumb.foreground': '#64748B',
    'breadcrumb.background': '#060B14',
    'breadcrumb.focusForeground': '#F97316',
    'breadcrumb.activeSelectionForeground': '#F97316',
  },
}

/**
 * Register Monaco themes
 * @param monaco - Monaco editor instance (dynamically imported)
 */
export function registerMonacoThemes(monaco: any) {
  monaco.editor.defineTheme('ai-native-light', monacoAiNativeLightTheme)
  monaco.editor.defineTheme('ai-native-dark', monacoAiNativeDarkTheme)
}
