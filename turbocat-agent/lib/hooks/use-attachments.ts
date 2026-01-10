'use client'

import * as React from 'react'

export interface Attachment {
  id: string
  type: 'image' | 'file'
  file: File
  preview?: string
  uploading?: boolean
  error?: string
}

interface UseAttachmentsOptions {
  maxFiles?: number
  maxFileSize?: number
  acceptedTypes?: string[]
  onUpload?: (files: File[]) => Promise<void>
}

export function useAttachments(options: UseAttachmentsOptions = {}) {
  const {
    maxFiles = 5,
    maxFileSize = 10 * 1024 * 1024,
    acceptedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  } = options

  const [attachments, setAttachments] = React.useState<Attachment[]>([])
  const [isDragging, setIsDragging] = React.useState(false)
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  const generateId = () => {
    const timestamp = Date.now()
    const random = Math.random().toString(36).substring(2, 9)
    return 'attachment-' + timestamp + '-' + random
  }

  const validateFile = (file: File): string | null => {
    if (!acceptedTypes.includes(file.type)) {
      return 'File type ' + file.type + ' is not supported'
    }
    if (file.size > maxFileSize) {
      return 'File size exceeds ' + (maxFileSize / 1024 / 1024) + 'MB limit'
    }
    return null
  }

  const addFiles = React.useCallback(
    async (files: FileList | File[]) => {
      const fileArray = Array.from(files)
      const remainingSlots = maxFiles - attachments.length

      if (remainingSlots <= 0) {
        return
      }

      const filesToAdd = fileArray.slice(0, remainingSlots)
      const newAttachments: Attachment[] = []

      for (const file of filesToAdd) {
        const error = validateFile(file)
        const isImage = file.type.startsWith('image/')

        const attachment: Attachment = {
          id: generateId(),
          type: isImage ? 'image' : 'file',
          file,
          error: error || undefined,
        }

        if (isImage && !error) {
          attachment.preview = URL.createObjectURL(file)
        }

        newAttachments.push(attachment)
      }

      setAttachments((prev) => [...prev, ...newAttachments])
    },
    [attachments.length, maxFiles, acceptedTypes, maxFileSize]
  )

  const removeAttachment = React.useCallback((id: string) => {
    setAttachments((prev) => {
      const attachment = prev.find((a) => a.id === id)
      if (attachment?.preview) {
        URL.revokeObjectURL(attachment.preview)
      }
      return prev.filter((a) => a.id !== id)
    })
  }, [])

  const clearAttachments = React.useCallback(() => {
    attachments.forEach((attachment) => {
      if (attachment.preview) {
        URL.revokeObjectURL(attachment.preview)
      }
    })
    setAttachments([])
  }, [attachments])

  const openFilePicker = React.useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  const handleFileInputChange = React.useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = event.target.files
      if (files && files.length > 0) {
        addFiles(files)
      }
      event.target.value = ''
    },
    [addFiles]
  )

  const handleDragEnter = React.useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }, [])

  const handleDragLeave = React.useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }, [])

  const handleDragOver = React.useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleDrop = React.useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragging(false)

      const files = e.dataTransfer.files
      if (files && files.length > 0) {
        addFiles(files)
      }
    },
    [addFiles]
  )

  React.useEffect(() => {
    return () => {
      attachments.forEach((attachment) => {
        if (attachment.preview) {
          URL.revokeObjectURL(attachment.preview)
        }
      })
    }
  }, [])

  return {
    attachments,
    isDragging,
    fileInputRef,
    addFiles,
    removeAttachment,
    clearAttachments,
    openFilePicker,
    handleFileInputChange,
    handleDragEnter,
    handleDragLeave,
    handleDragOver,
    handleDrop,
    hasAttachments: attachments.length > 0,
    canAddMore: attachments.length < maxFiles,
    acceptedTypesString: acceptedTypes.join(','),
  }
}

export default useAttachments
