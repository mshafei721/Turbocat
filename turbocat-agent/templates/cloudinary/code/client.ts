/**
 * Cloudinary Client
 *
 * Server-side and client-side Cloudinary utilities for image upload and transformation.
 *
 * @file templates/cloudinary/code/client.ts
 */

import { v2 as cloudinary } from 'cloudinary'

// Server-side configuration
if (typeof window === 'undefined') {
  if (!process.env.CLOUDINARY_CLOUD_NAME) {
    throw new Error('CLOUDINARY_CLOUD_NAME is not set')
  }
  if (!process.env.CLOUDINARY_API_KEY) {
    throw new Error('CLOUDINARY_API_KEY is not set')
  }
  if (!process.env.CLOUDINARY_API_SECRET) {
    throw new Error('CLOUDINARY_API_SECRET is not set')
  }

  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  })
}

export interface UploadResult {
  public_id: string
  secure_url: string
  url: string
  format: string
  width: number
  height: number
  bytes: number
  created_at: string
}

export interface TransformationOptions {
  width?: number
  height?: number
  crop?: 'fill' | 'fit' | 'scale' | 'crop' | 'thumb' | 'limit' | 'pad'
  quality?: 'auto' | number
  format?: 'auto' | 'jpg' | 'png' | 'webp' | 'avif'
  gravity?: 'auto' | 'face' | 'center' | 'north' | 'south' | 'east' | 'west'
  effects?: string[]
  radius?: number | 'max'
  angle?: number
  background?: string
}

/**
 * Upload image to Cloudinary (server-side only)
 *
 * @example
 * ```typescript
 * const result = await uploadImage({
 *   file: imageBuffer,
 *   folder: 'avatars',
 *   publicId: 'user-123',
 * })
 * ```
 */
export async function uploadImage(params: {
  file: Buffer | string
  folder?: string
  publicId?: string
  transformation?: TransformationOptions
  tags?: string[]
}): Promise<UploadResult> {
  if (typeof window !== 'undefined') {
    throw new Error('uploadImage can only be called server-side')
  }

  const { file, folder, publicId, transformation, tags } = params

  try {
    const result = await cloudinary.uploader.upload(
      typeof file === 'string' ? file : `data:image/png;base64,${file.toString('base64')}`,
      {
        folder,
        public_id: publicId,
        transformation,
        tags,
        resource_type: 'auto',
      }
    )

    return {
      public_id: result.public_id,
      secure_url: result.secure_url,
      url: result.url,
      format: result.format,
      width: result.width,
      height: result.height,
      bytes: result.bytes,
      created_at: result.created_at,
    }
  } catch (error) {
    console.error('Cloudinary upload error:', error)
    throw new Error(
      `Failed to upload image: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}

/**
 * Delete image from Cloudinary (server-side only)
 */
export async function deleteImage(publicId: string): Promise<void> {
  if (typeof window !== 'undefined') {
    throw new Error('deleteImage can only be called server-side')
  }

  try {
    await cloudinary.uploader.destroy(publicId)
  } catch (error) {
    console.error('Cloudinary delete error:', error)
    throw new Error(
      `Failed to delete image: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}

/**
 * Get optimized image URL with transformations
 * Works both client-side and server-side
 *
 * @example
 * ```typescript
 * const url = getOptimizedImageUrl('my-image.jpg', {
 *   width: 400,
 *   height: 400,
 *   crop: 'fill',
 *   quality: 'auto',
 *   format: 'auto',
 * })
 * ```
 */
export function getOptimizedImageUrl(
  publicIdOrUrl: string,
  options: TransformationOptions = {}
): string {
  const cloudName =
    process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ||
    process.env.CLOUDINARY_CLOUD_NAME

  if (!cloudName) {
    throw new Error('CLOUDINARY_CLOUD_NAME is not set')
  }

  const {
    width,
    height,
    crop = 'fill',
    quality = 'auto',
    format = 'auto',
    gravity,
    effects = [],
    radius,
    angle,
    background,
  } = options

  // Build transformation string
  const transformations: string[] = []

  if (width) transformations.push(`w_${width}`)
  if (height) transformations.push(`h_${height}`)
  if (crop) transformations.push(`c_${crop}`)
  if (quality) transformations.push(`q_${quality}`)
  if (format) transformations.push(`f_${format}`)
  if (gravity) transformations.push(`g_${gravity}`)
  if (radius) transformations.push(`r_${radius}`)
  if (angle) transformations.push(`a_${angle}`)
  if (background) transformations.push(`b_${background}`)
  if (effects.length > 0) transformations.push(`e_${effects.join(':')}`)

  const transformStr = transformations.join(',')

  // If it's already a full URL, extract public_id
  if (publicIdOrUrl.includes('cloudinary.com')) {
    return publicIdOrUrl // Already transformed URL
  }

  // Build Cloudinary URL
  return `https://res.cloudinary.com/${cloudName}/image/upload/${transformStr}/${publicIdOrUrl}`
}

/**
 * Get upload signature for client-side signed uploads (server-side only)
 */
export function getUploadSignature(params: {
  folder?: string
  tags?: string[]
  timestamp: number
}): { signature: string; timestamp: number } {
  if (typeof window !== 'undefined') {
    throw new Error('getUploadSignature can only be called server-side')
  }

  const { folder, tags, timestamp } = params

  const paramsToSign: any = { timestamp }
  if (folder) paramsToSign.folder = folder
  if (tags) paramsToSign.tags = tags.join(',')

  const signature = cloudinary.utils.api_sign_request(
    paramsToSign,
    process.env.CLOUDINARY_API_SECRET!
  )

  return { signature, timestamp }
}

/**
 * Client-side upload to Cloudinary using unsigned upload preset
 *
 * @example
 * ```typescript
 * const result = await uploadImageClient({
 *   file: imageFile,
 *   uploadPreset: 'my_preset',
 * })
 * ```
 */
export async function uploadImageClient(params: {
  file: File
  uploadPreset: string
  folder?: string
  onProgress?: (progress: number) => void
}): Promise<UploadResult> {
  const { file, uploadPreset, folder, onProgress } = params

  const cloudName =
    process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ||
    process.env.CLOUDINARY_CLOUD_NAME

  if (!cloudName) {
    throw new Error('CLOUDINARY_CLOUD_NAME is not set')
  }

  const formData = new FormData()
  formData.append('file', file)
  formData.append('upload_preset', uploadPreset)
  if (folder) formData.append('folder', folder)

  try {
    const xhr = new XMLHttpRequest()

    return new Promise((resolve, reject) => {
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable && onProgress) {
          const progress = Math.round((event.loaded / event.total) * 100)
          onProgress(progress)
        }
      })

      xhr.addEventListener('load', () => {
        if (xhr.status === 200) {
          const result = JSON.parse(xhr.responseText)
          resolve({
            public_id: result.public_id,
            secure_url: result.secure_url,
            url: result.url,
            format: result.format,
            width: result.width,
            height: result.height,
            bytes: result.bytes,
            created_at: result.created_at,
          })
        } else {
          reject(new Error(`Upload failed with status ${xhr.status}`))
        }
      })

      xhr.addEventListener('error', () => {
        reject(new Error('Upload failed'))
      })

      xhr.open('POST', `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`)
      xhr.send(formData)
    })
  } catch (error) {
    console.error('Cloudinary client upload error:', error)
    throw new Error(
      `Failed to upload image: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}

/**
 * Generate a thumbnail URL
 */
export function getThumbnailUrl(
  publicId: string,
  size: number = 150
): string {
  return getOptimizedImageUrl(publicId, {
    width: size,
    height: size,
    crop: 'thumb',
    gravity: 'face',
    quality: 'auto',
    format: 'auto',
  })
}

/**
 * Generate responsive image URLs
 */
export function getResponsiveImageUrls(
  publicId: string,
  sizes: number[] = [320, 640, 768, 1024, 1280, 1536]
): Array<{ width: number; url: string }> {
  return sizes.map((width) => ({
    width,
    url: getOptimizedImageUrl(publicId, {
      width,
      quality: 'auto',
      format: 'auto',
    }),
  }))
}

/**
 * Validate image file
 */
export function validateImageFile(
  file: File,
  options: {
    maxSizeMB?: number
    allowedTypes?: string[]
  } = {}
): { valid: boolean; error?: string } {
  const { maxSizeMB = 10, allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'] } = options

  // Check file type
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `File type not allowed. Allowed types: ${allowedTypes.join(', ')}`,
    }
  }

  // Check file size
  const maxSizeBytes = maxSizeMB * 1024 * 1024
  if (file.size > maxSizeBytes) {
    return {
      valid: false,
      error: `File size exceeds ${maxSizeMB}MB limit`,
    }
  }

  return { valid: true }
}

/**
 * Convert file to base64 (for preview)
 */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}
