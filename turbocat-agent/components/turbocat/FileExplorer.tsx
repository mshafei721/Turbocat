'use client'

import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  File,
  Folder,
  FolderOpen,
  CaretRight,
  CaretDown,
  Terminal,
  X,
  SidebarSimple,
  FileTs,
  FileJs,
  FileCss,
  FileHtml,
  FileMd,
  FilePy,
  Gear,
  Image,
  Plus,
  Circle,
} from '@phosphor-icons/react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

interface FileTreeNode {
  type: 'file' | 'directory'
  filename?: string
  status?: 'added' | 'modified' | 'deleted' | 'renamed'
  children?: { [key: string]: FileTreeNode }
}

interface FileExplorerProps {
  taskId: string
  isOpen: boolean
  onToggle: () => void
  onFileSelect?: (filename: string) => void
  className?: string
}

// Get appropriate icon for file type
function getFileIcon(filename: string, size: number = 16) {
  const ext = filename.split('.').pop()?.toLowerCase()

  switch (ext) {
    case 'ts':
    case 'tsx':
      return <FileTs size={size} className="text-blue-400" weight="duotone" />
    case 'js':
    case 'jsx':
      return <FileJs size={size} className="text-yellow-400" weight="duotone" />
    case 'css':
    case 'scss':
    case 'less':
      return <FileCss size={size} className="text-pink-400" weight="duotone" />
    case 'html':
      return <FileHtml size={size} className="text-orange-400" weight="duotone" />
    case 'json':
      return <File size={size} className="text-yellow-500" weight="duotone" />
    case 'md':
    case 'mdx':
      return <FileMd size={size} className="text-slate-400" weight="duotone" />
    case 'py':
      return <FilePy size={size} className="text-green-400" weight="duotone" />
    case 'png':
    case 'jpg':
    case 'jpeg':
    case 'gif':
    case 'svg':
    case 'webp':
      return <Image size={size} className="text-purple-400" weight="duotone" />
    case 'env':
    case 'gitignore':
      return <Gear size={size} className="text-slate-500" weight="duotone" />
    default:
      return <File size={size} className="text-slate-400" weight="duotone" />
  }
}

// Get status color for file
function getStatusColor(status?: string): string {
  switch (status) {
    case 'added':
      return 'text-green-400'
    case 'modified':
      return 'text-orange-400'
    case 'deleted':
      return 'text-red-400'
    default:
      return ''
  }
}

// Tree node component
function TreeNode({
  name,
  node,
  path,
  depth,
  onFileSelect,
  selectedFile,
}: {
  name: string
  node: FileTreeNode
  path: string
  depth: number
  onFileSelect?: (filename: string) => void
  selectedFile?: string
}) {
  const [isExpanded, setIsExpanded] = React.useState(depth < 2) // Auto-expand first 2 levels
  const fullPath = path ? `${path}/${name}` : name
  const isDirectory = node.type === 'directory'
  const isSelected = selectedFile === node.filename

  const handleClick = () => {
    if (isDirectory) {
      setIsExpanded(!isExpanded)
    } else if (node.filename && onFileSelect) {
      onFileSelect(node.filename)
    }
  }

  // Sort children: directories first, then files alphabetically
  const sortedChildren = React.useMemo(() => {
    if (!node.children) return []

    const entries = Object.entries(node.children)
    return entries.sort(([aName, aNode], [bName, bNode]) => {
      if (aNode.type !== bNode.type) {
        return aNode.type === 'directory' ? -1 : 1
      }
      return aName.localeCompare(bName)
    })
  }, [node.children])

  return (
    <div>
      <button
        onClick={handleClick}
        className={cn(
          'flex w-full items-center gap-1 rounded px-2 py-1 text-left text-sm hover:bg-slate-800/50',
          isSelected && 'bg-slate-800 text-white',
          !isSelected && 'text-slate-300'
        )}
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
      >
        {isDirectory ? (
          <>
            {isExpanded ? (
              <CaretDown size={12} className="text-slate-500 shrink-0" />
            ) : (
              <CaretRight size={12} className="text-slate-500 shrink-0" />
            )}
            {isExpanded ? (
              <FolderOpen size={16} className="text-amber-400 shrink-0" weight="duotone" />
            ) : (
              <Folder size={16} className="text-amber-400 shrink-0" weight="duotone" />
            )}
          </>
        ) : (
          <>
            <span className="w-3" /> {/* Spacer for alignment */}
            {getFileIcon(name)}
          </>
        )}
        <span className={cn('truncate flex-1', getStatusColor(node.status))}>
          {name}
        </span>
        {node.status === 'added' && (
          <Plus size={10} className="text-green-400 shrink-0" weight="bold" />
        )}
        {node.status === 'modified' && (
          <Circle size={8} className="text-orange-400 shrink-0" weight="fill" />
        )}
      </button>

      <AnimatePresence>
        {isDirectory && isExpanded && node.children && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            {sortedChildren.map(([childName, childNode]) => (
              <TreeNode
                key={childName}
                name={childName}
                node={childNode}
                path={fullPath}
                depth={depth + 1}
                onFileSelect={onFileSelect}
                selectedFile={selectedFile}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export function FileExplorer({
  taskId,
  isOpen,
  onToggle,
  onFileSelect,
  className,
}: FileExplorerProps) {
  const [fileTree, setFileTree] = React.useState<{ [key: string]: FileTreeNode }>({})
  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [selectedFile, setSelectedFile] = React.useState<string | undefined>()
  const [terminalOutput, setTerminalOutput] = React.useState<string[]>([
    '$ Waiting for sandbox...',
  ])

  // Fetch files from sandbox
  React.useEffect(() => {
    async function fetchFiles() {
      if (!taskId) return

      setIsLoading(true)
      setError(null)

      try {
        // Try local files first (from sandbox)
        let response = await fetch(`/api/tasks/${taskId}/files?mode=all-local`)

        if (response.status === 410) {
          // Sandbox not running, try remote files
          response = await fetch(`/api/tasks/${taskId}/files?mode=all`)
        }

        if (!response.ok) {
          if (response.status === 404) {
            setError('Project not found')
          } else {
            throw new Error('Failed to fetch files')
          }
          return
        }

        const data = await response.json()
        if (data.success && data.fileTree) {
          setFileTree(data.fileTree)
          if (data.message) {
            setTerminalOutput(prev => [...prev, `$ ${data.message}`])
          }
        } else if (data.message) {
          setTerminalOutput(prev => [...prev, `$ ${data.message}`])
        }
      } catch (err) {
        console.error('Error fetching files:', err)
        setError('Failed to load files')
      } finally {
        setIsLoading(false)
      }
    }

    if (isOpen) {
      fetchFiles()
    }
  }, [taskId, isOpen])

  const handleFileSelect = (filename: string) => {
    setSelectedFile(filename)
    onFileSelect?.(filename)
  }

  // Sort root level: directories first, then files
  const sortedRootEntries = React.useMemo(() => {
    const entries = Object.entries(fileTree)
    return entries.sort(([aName, aNode], [bName, bNode]) => {
      if (aNode.type !== bNode.type) {
        return aNode.type === 'directory' ? -1 : 1
      }
      return aName.localeCompare(bName)
    })
  }, [fileTree])

  if (!isOpen) {
    return (
      <Button
        variant="ghost"
        size="icon"
        onClick={onToggle}
        className="fixed left-4 top-20 z-50 bg-slate-900 border border-slate-800 hover:bg-slate-800"
      >
        <SidebarSimple size={20} />
      </Button>
    )
  }

  return (
    <motion.div
      initial={{ width: 0, opacity: 0 }}
      animate={{ width: 260, opacity: 1 }}
      exit={{ width: 0, opacity: 0 }}
      transition={{ duration: 0.2 }}
      className={cn(
        'flex h-full flex-col border-r border-slate-800 bg-slate-950',
        className
      )}
    >
      {/* Header */}
      <div className="flex h-10 items-center justify-between border-b border-slate-800 px-3">
        <span className="text-xs font-medium uppercase text-slate-500">
          Explorer
        </span>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-slate-500 hover:text-slate-300"
          onClick={onToggle}
        >
          <X size={14} />
        </Button>
      </div>

      {/* File Tree */}
      <div className="flex-1 overflow-auto">
        <div className="p-2">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              >
                <Folder size={24} className="text-slate-500" />
              </motion.div>
            </div>
          ) : error ? (
            <div className="py-4 text-center text-sm text-slate-500">
              {error}
            </div>
          ) : sortedRootEntries.length === 0 ? (
            <div className="py-4 text-center text-sm text-slate-500">
              No files yet
            </div>
          ) : (
            sortedRootEntries.map(([name, node]) => (
              <TreeNode
                key={name}
                name={name}
                node={node}
                path=""
                depth={0}
                onFileSelect={handleFileSelect}
                selectedFile={selectedFile}
              />
            ))
          )}
        </div>
      </div>

      {/* Terminal Section */}
      <div className="border-t border-slate-800">
        <div className="flex h-8 items-center justify-between border-b border-slate-800 px-3">
          <div className="flex items-center gap-2">
            <Terminal size={14} className="text-slate-500" />
            <span className="text-xs font-medium text-slate-500">Terminal</span>
          </div>
        </div>
        <div className="h-32 overflow-auto bg-slate-900/50 p-2 font-mono text-xs">
          {terminalOutput.map((line, index) => (
            <div
              key={index}
              className={cn(
                'whitespace-pre-wrap',
                line.startsWith('$') ? 'text-green-400' : 'text-slate-400'
              )}
            >
              {line}
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  )
}

export default FileExplorer
