/**
 * Image Upload Component
 *
 * Drag-and-drop image upload component with progress tracking.
 *
 * @file templates/cloudinary/code/components/image-upload.tsx
 */

'use client'

import { useImageUpload, useDropzone } from '../hooks'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Upload, X, CheckCircle, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useRef } from 'react'

export interface ImageUploadProps {
  uploadPreset: string
  folder?: string
  maxSizeMB?: number
  allowedTypes?: string[]
  onUploadComplete?: (url: string) => void
  onError?: (error: string) => void
  className?: string
  showPreview?: boolean
}

/**
 * Image Upload Component
 *
 * Drag-and-drop or click to upload images to Cloudinary.
 *
 * @example
 * ```tsx
 * <ImageUpload
 *   uploadPreset="my_preset"
 *   folder="avatars"
 *   maxSizeMB={5}
 *   onUploadComplete={(url) => console.log('Uploaded:', url)}
 * />
 * ```
 */
export function ImageUpload({
  uploadPreset,
  folder,
  maxSizeMB = 10,
  allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  onUploadComplete,
  onError,
  className,
  showPreview = true,
}: ImageUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const {
    upload,
    isUploading,
    progress,
    imageUrl,
    previewUrl,
    error,
    reset,
  } = useImageUpload({
    uploadPreset,
    folder,
    maxSizeMB,
    allowedTypes,
    onUploadComplete,
    onError,
  })

  const { isDragActive, dragProps } = useDropzone({
    onDrop: (files) => {
      if (files[0]) {
        upload(files[0])
      }
    },
    maxFiles: 1,
    accept: allowedTypes,
  })

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      upload(file)
    }
  }

  const handleClick = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className={className}>
      <input
        ref={fileInputRef}
        type="file"
        accept={allowedTypes.join(',')}
        onChange={handleFileSelect}
        className="hidden"
      />

      <Card
        {...dragProps}
        className={cn(
          'cursor-pointer transition-colors',
          isDragActive && 'border-orange-500 bg-orange-50',
          error && 'border-red-500',
          imageUrl && 'border-green-500'
        )}
        onClick={!isUploading ? handleClick : undefined}
      >
        <CardContent className="p-6">
          {!imageUrl && !isUploading && (
            <div className="flex flex-col items-center justify-center text-center">
              <Upload className="h-12 w-12 text-gray-400 mb-4" />
              <p className="text-sm font-medium mb-1">
                {isDragActive
                  ? 'Drop image here'
                  : 'Click to upload or drag and drop'}
              </p>
              <p className="text-xs text-gray-500">
                {allowedTypes.map((t) => t.split('/')[1].toUpperCase()).join(', ')}{' '}
                up to {maxSizeMB}MB
              </p>
            </div>
          )}

          {isUploading && (
            <div className="space-y-4">
              {showPreview && previewUrl && (
                <div className="relative w-full h-48 rounded-lg overflow-hidden">
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center">
                    <div className="text-white text-sm font-medium">
                      Uploading... {progress}%
                    </div>
                  </div>
                </div>
              )}
              <Progress value={progress} className="w-full" />
            </div>
          )}

          {imageUrl && !isUploading && (
            <div className="space-y-4">
              {showPreview && (
                <div className="relative w-full h-48 rounded-lg overflow-hidden">
                  <img
                    src={imageUrl}
                    alt="Uploaded"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="h-5 w-5" />
                  <span className="text-sm font-medium">Upload successful</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    reset()
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              <span className="text-sm">{error}</span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

/**
 * Simple Image Upload (no UI library dependency)
 */
export function SimpleImageUpload({
  uploadPreset,
  folder,
  maxSizeMB = 10,
  allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  onUploadComplete,
  onError,
  className = '',
}: ImageUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const {
    upload,
    isUploading,
    progress,
    imageUrl,
    previewUrl,
    error,
    reset,
  } = useImageUpload({
    uploadPreset,
    folder,
    maxSizeMB,
    allowedTypes,
    onUploadComplete,
    onError,
  })

  const { isDragActive, dragProps } = useDropzone({
    onDrop: (files) => {
      if (files[0]) {
        upload(files[0])
      }
    },
    maxFiles: 1,
    accept: allowedTypes,
  })

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      upload(file)
    }
  }

  const handleClick = () => {
    if (!isUploading) {
      fileInputRef.current?.click()
    }
  }

  return (
    <div className={className}>
      <input
        ref={fileInputRef}
        type="file"
        accept={allowedTypes.join(',')}
        onChange={handleFileSelect}
        className="hidden"
      />

      <div
        {...dragProps}
        onClick={handleClick}
        className={`
          border-2 border-dashed rounded-lg p-6 cursor-pointer
          transition-colors
          ${isDragActive ? 'border-orange-500 bg-orange-50' : 'border-gray-300'}
          ${error ? 'border-red-500' : ''}
          ${imageUrl ? 'border-green-500' : ''}
        `}
      >
        {!imageUrl && !isUploading && (
          <div className="flex flex-col items-center justify-center text-center">
            <svg
              className="h-12 w-12 text-gray-400 mb-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
            <p className="text-sm font-medium mb-1">
              {isDragActive
                ? 'Drop image here'
                : 'Click to upload or drag and drop'}
            </p>
            <p className="text-xs text-gray-500">
              Max size: {maxSizeMB}MB
            </p>
          </div>
        )}

        {isUploading && (
          <div className="space-y-4">
            {previewUrl && (
              <div className="relative w-full h-48 rounded-lg overflow-hidden">
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center">
                  <div className="text-white text-sm font-medium">
                    Uploading... {progress}%
                  </div>
                </div>
              </div>
            )}
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div
                className="bg-orange-500 h-2.5 rounded-full transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {imageUrl && !isUploading && (
          <div className="space-y-4">
            <div className="relative w-full h-48 rounded-lg overflow-hidden">
              <img
                src={imageUrl}
                alt="Uploaded"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-green-600">
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span className="text-sm font-medium">Upload successful</span>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  reset()
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 text-red-600">
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span className="text-sm">{error}</span>
          </div>
        )}
      </div>
    </div>
  )
}
