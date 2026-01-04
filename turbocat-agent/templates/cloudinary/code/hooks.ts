/**
 * Cloudinary React Hooks
 *
 * Client-side hooks for image upload with progress tracking.
 *
 * @file templates/cloudinary/code/hooks.ts
 */

'use client'

import { useState, useCallback } from 'react'
import { uploadImageClient, validateImageFile, fileToBase64 } from './client'

export interface UseImageUploadOptions {
  uploadPreset: string
  folder?: string
  maxSizeMB?: number
  allowedTypes?: string[]
  onUploadComplete?: (url: string) => void
  onError?: (error: string) => void
}

/**
 * Hook for uploading images with progress tracking
 *
 * @example
 * ```typescript
 * const { upload, progress, isUploading, imageUrl, error } = useImageUpload({
 *   uploadPreset: 'my_preset',
 *   folder: 'avatars',
 *   onUploadComplete: (url) => console.log('Uploaded:', url),
 * })
 *
 * const handleFileChange = async (file: File) => {
 *   await upload(file)
 * }
 * ```
 */
export function useImageUpload(options: UseImageUploadOptions) {
  const {
    uploadPreset,
    folder,
    maxSizeMB = 10,
    allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
    onUploadComplete,
    onError,
  } = options

  const [isUploading, setIsUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const upload = useCallback(
    async (file: File) => {
      setError(null)
      setProgress(0)

      // Validate file
      const validation = validateImageFile(file, { maxSizeMB, allowedTypes })
      if (!validation.valid) {
        const errorMsg = validation.error || 'Invalid file'
        setError(errorMsg)
        onError?.(errorMsg)
        return null
      }

      // Generate preview
      try {
        const preview = await fileToBase64(file)
        setPreviewUrl(preview)
      } catch (err) {
        console.error('Failed to generate preview:', err)
      }

      setIsUploading(true)

      try {
        const result = await uploadImageClient({
          file,
          uploadPreset,
          folder,
          onProgress: setProgress,
        })

        setImageUrl(result.secure_url)
        setIsUploading(false)
        setProgress(100)
        onUploadComplete?.(result.secure_url)

        return result
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Upload failed'
        setError(errorMsg)
        setIsUploading(false)
        setProgress(0)
        onError?.(errorMsg)
        return null
      }
    },
    [uploadPreset, folder, maxSizeMB, allowedTypes, onUploadComplete, onError]
  )

  const reset = useCallback(() => {
    setIsUploading(false)
    setProgress(0)
    setImageUrl(null)
    setPreviewUrl(null)
    setError(null)
  }, [])

  return {
    upload,
    isUploading,
    progress,
    imageUrl,
    previewUrl,
    error,
    reset,
  }
}

/**
 * Hook for multiple image uploads
 */
export function useMultipleImageUpload(options: UseImageUploadOptions) {
  const [uploads, setUploads] = useState<
    Array<{
      id: string
      file: File
      progress: number
      url: string | null
      error: string | null
      isUploading: boolean
    }>
  >([])

  const uploadMultiple = useCallback(
    async (files: File[]) => {
      const newUploads = files.map((file) => ({
        id: Math.random().toString(36).substring(7),
        file,
        progress: 0,
        url: null,
        error: null,
        isUploading: true,
      }))

      setUploads((prev) => [...prev, ...newUploads])

      // Upload all files in parallel
      await Promise.all(
        newUploads.map(async (upload) => {
          try {
            // Validate file
            const validation = validateImageFile(upload.file, {
              maxSizeMB: options.maxSizeMB,
              allowedTypes: options.allowedTypes,
            })

            if (!validation.valid) {
              throw new Error(validation.error)
            }

            const result = await uploadImageClient({
              file: upload.file,
              uploadPreset: options.uploadPreset,
              folder: options.folder,
              onProgress: (progress) => {
                setUploads((prev) =>
                  prev.map((u) =>
                    u.id === upload.id ? { ...u, progress } : u
                  )
                )
              },
            })

            setUploads((prev) =>
              prev.map((u) =>
                u.id === upload.id
                  ? { ...u, url: result.secure_url, isUploading: false }
                  : u
              )
            )

            options.onUploadComplete?.(result.secure_url)
          } catch (err) {
            const errorMsg = err instanceof Error ? err.message : 'Upload failed'
            setUploads((prev) =>
              prev.map((u) =>
                u.id === upload.id
                  ? { ...u, error: errorMsg, isUploading: false }
                  : u
              )
            )
            options.onError?.(errorMsg)
          }
        })
      )
    },
    [options]
  )

  const removeUpload = useCallback((id: string) => {
    setUploads((prev) => prev.filter((u) => u.id !== id))
  }, [])

  const reset = useCallback(() => {
    setUploads([])
  }, [])

  return {
    uploads,
    uploadMultiple,
    removeUpload,
    reset,
  }
}

/**
 * Hook for drag and drop file upload
 */
export function useDropzone(options: {
  onDrop: (files: File[]) => void
  maxFiles?: number
  accept?: string[]
}) {
  const [isDragActive, setIsDragActive] = useState(false)

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragActive(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragActive(false)
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragActive(false)

      const files = Array.from(e.dataTransfer.files)
      const filteredFiles = options.accept
        ? files.filter((file) => options.accept!.includes(file.type))
        : files

      const limitedFiles = options.maxFiles
        ? filteredFiles.slice(0, options.maxFiles)
        : filteredFiles

      if (limitedFiles.length > 0) {
        options.onDrop(limitedFiles)
      }
    },
    [options]
  )

  return {
    isDragActive,
    dragProps: {
      onDragEnter: handleDragEnter,
      onDragLeave: handleDragLeave,
      onDragOver: handleDragOver,
      onDrop: handleDrop,
    },
  }
}
