# Cloudinary Integration Template

Complete Cloudinary media management for Next.js applications with image upload, transformation, and optimization.

## Quick Start

### 1. Install Dependencies

```bash
npm install cloudinary next-cloudinary
```

### 2. Get Cloudinary Credentials

1. Sign up at [Cloudinary](https://cloudinary.com)
2. Go to [Dashboard](https://cloudinary.com/console)
3. Copy your Cloud Name, API Key, and API Secret

### 3. Create Upload Preset

For client-side uploads, create an unsigned upload preset:

1. Go to Settings → Upload
2. Scroll to "Upload presets"
3. Click "Add upload preset"
4. Set signing mode to "Unsigned"
5. Configure upload settings
6. Save and copy the preset name

### 4. Configure Environment Variables

```bash
cp templates/cloudinary/env/.env.template .env.local
```

Add your credentials:

```env
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your-cloud-name
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=your-preset-name
```

### 5. Copy Template Files

```bash
# Using template loader
npx tsx scripts/load-template.ts cloudinary

# Or manually
cp -r templates/cloudinary/code/* lib/cloudinary/
```

## Usage Examples

### Basic Image Upload Component

```tsx
import { ImageUpload } from '@/lib/cloudinary/components/image-upload'

export function ProfilePhotoUpload() {
  return (
    <ImageUpload
      uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!}
      folder="profiles"
      maxSizeMB={5}
      onUploadComplete={(url) => {
        console.log('Photo uploaded:', url)
        // Save URL to database
      }}
    />
  )
}
```

### Upload Hook

```tsx
import { useImageUpload } from '@/lib/cloudinary/hooks'

export function CustomUpload() {
  const { upload, progress, isUploading, imageUrl, error } = useImageUpload({
    uploadPreset: process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!,
    folder: 'avatars',
    onUploadComplete: (url) => console.log('Uploaded:', url),
  })

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      await upload(file)
    }
  }

  return (
    <div>
      <input
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        disabled={isUploading}
      />
      {isUploading && <p>Uploading... {progress}%</p>}
      {imageUrl && <img src={imageUrl} alt="Uploaded" />}
      {error && <p className="text-red-500">{error}</p>}
    </div>
  )
}
```

### Server-Side Upload (API Route)

```typescript
// app/api/upload/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { uploadImage } from '@/lib/cloudinary/client'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Upload to Cloudinary
    const result = await uploadImage({
      file: buffer,
      folder: 'uploads',
      tags: ['user-upload'],
    })

    return NextResponse.json({
      url: result.secure_url,
      publicId: result.public_id,
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Upload failed' },
      { status: 500 }
    )
  }
}
```

### Image Transformations

```typescript
import { getOptimizedImageUrl } from '@/lib/cloudinary/client'

// Resize and optimize
const url = getOptimizedImageUrl('my-image.jpg', {
  width: 400,
  height: 400,
  crop: 'fill',
  quality: 'auto',
  format: 'auto',
})

// Generate thumbnail
const thumbnail = getOptimizedImageUrl('my-image.jpg', {
  width: 150,
  height: 150,
  crop: 'thumb',
  gravity: 'face',
})

// Apply effects
const grayscale = getOptimizedImageUrl('my-image.jpg', {
  effects: ['grayscale'],
})

// Rounded corners
const rounded = getOptimizedImageUrl('my-image.jpg', {
  radius: 20,
})
```

### Responsive Images

```tsx
import { getResponsiveImageUrls } from '@/lib/cloudinary/client'

export function ResponsiveImage({ publicId }: { publicId: string }) {
  const responsiveUrls = getResponsiveImageUrls(publicId)

  const srcSet = responsiveUrls
    .map((img) => `${img.url} ${img.width}w`)
    .join(', ')

  return (
    <img
      srcSet={srcSet}
      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
      alt="Responsive image"
    />
  )
}
```

### Multiple Upload Hook

```tsx
import { useMultipleImageUpload } from '@/lib/cloudinary/hooks'

export function GalleryUpload() {
  const { uploads, uploadMultiple, removeUpload } = useMultipleImageUpload({
    uploadPreset: process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!,
    folder: 'gallery',
  })

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    uploadMultiple(files)
  }

  return (
    <div>
      <input
        type="file"
        multiple
        accept="image/*"
        onChange={handleFileChange}
      />

      <div className="grid grid-cols-3 gap-4">
        {uploads.map((upload) => (
          <div key={upload.id}>
            {upload.isUploading && (
              <div>Uploading... {upload.progress}%</div>
            )}
            {upload.url && (
              <div>
                <img src={upload.url} alt="Uploaded" />
                <button onClick={() => removeUpload(upload.id)}>
                  Remove
                </button>
              </div>
            )}
            {upload.error && (
              <div className="text-red-500">{upload.error}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
```

### Drag and Drop

```tsx
import { useDropzone } from '@/lib/cloudinary/hooks'
import { useImageUpload } from '@/lib/cloudinary/hooks'

export function DragDropUpload() {
  const { upload, imageUrl } = useImageUpload({
    uploadPreset: process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!,
  })

  const { isDragActive, dragProps } = useDropzone({
    onDrop: (files) => {
      if (files[0]) {
        upload(files[0])
      }
    },
    accept: ['image/jpeg', 'image/png', 'image/webp'],
  })

  return (
    <div
      {...dragProps}
      className={`
        border-2 border-dashed rounded-lg p-8
        ${isDragActive ? 'border-orange-500 bg-orange-50' : 'border-gray-300'}
      `}
    >
      {isDragActive ? (
        <p>Drop the image here...</p>
      ) : (
        <p>Drag and drop an image, or click to select</p>
      )}
      {imageUrl && <img src={imageUrl} alt="Uploaded" />}
    </div>
  )
}
```

## Image Transformation Options

### Resize and Crop

```typescript
// Fill - resize to exact dimensions, crop if needed
getOptimizedImageUrl('image.jpg', {
  width: 300,
  height: 300,
  crop: 'fill',
})

// Fit - resize to fit within dimensions
getOptimizedImageUrl('image.jpg', {
  width: 300,
  height: 300,
  crop: 'fit',
})

// Scale - resize to exact dimensions, distort if needed
getOptimizedImageUrl('image.jpg', {
  width: 300,
  height: 300,
  crop: 'scale',
})

// Thumb - generate thumbnail with face detection
getOptimizedImageUrl('image.jpg', {
  width: 150,
  height: 150,
  crop: 'thumb',
  gravity: 'face',
})
```

### Quality and Format

```typescript
// Automatic quality optimization
getOptimizedImageUrl('image.jpg', {
  quality: 'auto',
})

// Specific quality (1-100)
getOptimizedImageUrl('image.jpg', {
  quality: 80,
})

// Auto format (WebP for supported browsers)
getOptimizedImageUrl('image.jpg', {
  format: 'auto',
})
```

### Effects and Filters

```typescript
// Grayscale
getOptimizedImageUrl('image.jpg', {
  effects: ['grayscale'],
})

// Blur
getOptimizedImageUrl('image.jpg', {
  effects: ['blur:500'],
})

// Sepia
getOptimizedImageUrl('image.jpg', {
  effects: ['sepia'],
})

// Multiple effects
getOptimizedImageUrl('image.jpg', {
  effects: ['grayscale', 'contrast:50'],
})
```

### Overlays and Watermarks

```typescript
// Add text overlay
getOptimizedImageUrl('image.jpg', {
  effects: ['l_text:Arial_40:Watermark', 'g_south_east', 'x_10', 'y_10'],
})
```

## Best Practices

### Image Optimization

1. **Use Auto Format** - Automatically serves WebP/AVIF when supported
2. **Use Auto Quality** - Optimizes quality for best size/quality ratio
3. **Lazy Loading** - Use Next.js Image component with Cloudinary URLs
4. **Responsive Images** - Generate multiple sizes for different viewports
5. **Cache Images** - Cloudinary CDN caches transformed images

### Security

1. **Signed Uploads** - Use signed uploads for sensitive content
2. **Upload Presets** - Limit what can be uploaded
3. **Folder Organization** - Use folders to organize uploads
4. **Access Control** - Set appropriate permissions
5. **Validation** - Always validate file size and type

### Performance

1. **Optimize Transformations** - Cache transformation URLs
2. **Use CDN** - Cloudinary automatically uses CDN
3. **Progressive JPEGs** - Enable progressive loading
4. **Lazy Load** - Load images only when needed

## Production Checklist

- [ ] Create upload presets for different use cases
- [ ] Set up folder structure
- [ ] Configure upload limits
- [ ] Enable automatic backups
- [ ] Set up monitoring
- [ ] Configure allowed formats
- [ ] Test upload and transformation flows
- [ ] Implement error handling
- [ ] Add loading states
- [ ] Optimize image delivery

## Troubleshooting

### Upload Fails

1. **Check upload preset** - Ensure it's set to unsigned for client uploads
2. **Verify credentials** - Check API key and secret
3. **File size limits** - Check Cloudinary plan limits
4. **CORS errors** - Add your domain to allowed origins

### Images Not Loading

1. **Check URL format** - Verify cloud name is correct
2. **Check permissions** - Ensure images are publicly accessible
3. **Verify public_id** - Check the image exists in Cloudinary

### Transformation Not Working

1. **Check transformation syntax** - Review Cloudinary docs
2. **Verify parameters** - Some transformations have limits
3. **Check plan limits** - Advanced transformations require paid plans

## Resources

- [Cloudinary Documentation](https://cloudinary.com/documentation)
- [Cloudinary Dashboard](https://cloudinary.com/console)
- [Image Transformations](https://cloudinary.com/documentation/image_transformations)
- [Upload API](https://cloudinary.com/documentation/image_upload_api_reference)
- [Next.js Integration](https://next.cloudinary.dev)

## Support

For issues or questions:
- Check [Cloudinary Documentation](https://cloudinary.com/documentation)
- Visit [Cloudinary Support](https://support.cloudinary.com)
- Ask in [Cloudinary Community](https://community.cloudinary.com)
