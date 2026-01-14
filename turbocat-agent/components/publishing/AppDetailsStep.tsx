'use client'

import * as React from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion'
import {
  AlertCircle,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Info,
  Loader2,
  ImageIcon,
} from 'lucide-react'
import type { PublishingFormData } from './PublishingModal'

interface AppDetailsStepProps {
  formData: Partial<PublishingFormData>
  updateFormData: (updates: Partial<PublishingFormData>) => void
  validationErrors: Record<string, string>
}

const APP_CATEGORIES = [
  'Business',
  'Developer Tools',
  'Education',
  'Entertainment',
  'Finance',
  'Games',
  'Health & Fitness',
  'Lifestyle',
  'Medical',
  'Music',
  'News',
  'Photo & Video',
  'Productivity',
  'Reference',
  'Shopping',
  'Social Networking',
  'Sports',
  'Travel',
  'Utilities',
  'Weather',
]

const AGE_RATINGS: Array<{ value: '4+' | '9+' | '12+' | '17+'; label: string; description: string }> = [
  { value: '4+', label: '4+', description: 'No objectionable content' },
  { value: '9+', label: '9+', description: 'Mild or infrequent mature themes' },
  { value: '12+', label: '12+', description: 'Moderate mature themes and content' },
  { value: '17+', label: '17+', description: 'Frequent or intense mature content' },
]

interface FieldValidationState {
  appName: boolean
  description: boolean
  category: boolean
  supportUrl: boolean
  iconUrl: boolean
}

export function AppDetailsStep({ formData, updateFormData, validationErrors }: AppDetailsStepProps) {
  const [touched, setTouched] = React.useState<Record<string, boolean>>({})
  const [iconLoading, setIconLoading] = React.useState(false)
  const [iconError, setIconError] = React.useState<string | null>(null)
  const [iconPreviewUrl, setIconPreviewUrl] = React.useState<string | null>(null)

  // Calculate field validity states
  const fieldValidity: FieldValidationState = React.useMemo(() => {
    const appNameValid = !!(
      formData.appName &&
      formData.appName.length >= 1 &&
      formData.appName.length <= 30
    )

    const descriptionValid = !!(
      formData.description &&
      formData.description.length >= 10 &&
      formData.description.length <= 4000
    )

    const categoryValid = !!(formData.category && formData.category.trim().length > 0)

    const supportUrlValid =
      !formData.supportUrl ||
      formData.supportUrl.trim().length === 0 ||
      /^https?:\/\/.+\..+/.test(formData.supportUrl)

    const iconUrlValid =
      !formData.iconUrl ||
      formData.iconUrl.trim().length === 0 ||
      /^https?:\/\/.+\..+/.test(formData.iconUrl)

    return {
      appName: appNameValid,
      description: descriptionValid,
      category: categoryValid,
      supportUrl: supportUrlValid,
      iconUrl: iconUrlValid,
    }
  }, [formData])

  // Generate bundle ID from app name
  const bundleId = React.useMemo(() => {
    if (!formData.appName || formData.appName.trim().length === 0) {
      return 'com.turbocat.myapp'
    }

    // Sanitize app name: lowercase, remove special chars, replace spaces with empty string
    const sanitized = formData.appName
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '')
      .trim()

    return `com.turbocat.${sanitized || 'myapp'}`
  }, [formData.appName])

  // Load icon preview when URL changes
  React.useEffect(() => {
    if (!formData.iconUrl || !fieldValidity.iconUrl) {
      setIconPreviewUrl(null)
      setIconError(null)
      return
    }

    setIconLoading(true)
    setIconError(null)

    const img = new Image()
    img.onload = () => {
      setIconPreviewUrl(formData.iconUrl!)
      setIconLoading(false)
    }
    img.onerror = () => {
      setIconError('Failed to load image. Please check the URL.')
      setIconPreviewUrl(null)
      setIconLoading(false)
    }
    img.src = formData.iconUrl
  }, [formData.iconUrl, fieldValidity.iconUrl])

  // Handle field blur for marking as touched
  const handleBlur = (field: keyof PublishingFormData) => {
    setTouched((prev) => ({ ...prev, [field]: true }))

    // Trim whitespace from text fields
    if (field === 'appName' || field === 'supportUrl' || field === 'iconUrl') {
      const value = formData[field]
      if (typeof value === 'string' && value !== value.trim()) {
        updateFormData({ [field]: value.trim() })
      }
    }
  }

  // Render validation indicator
  const renderValidationIcon = (field: keyof FieldValidationState) => {
    const value = formData[field as keyof PublishingFormData]
    const hasValue = typeof value === 'string' && value.length > 0
    const isValid = fieldValidity[field]
    const hasError = !!validationErrors[field]

    if (!hasValue && field !== 'category') return null

    if (hasError || (!isValid && touched[field])) {
      return <XCircle className="size-5 text-destructive shrink-0" aria-label="Invalid" />
    }

    if (isValid) {
      return <CheckCircle2 className="size-5 text-success shrink-0" aria-label="Valid" />
    }

    return null
  }

  // Calculate character counter color
  const getCharCounterColor = (current: number, min: number, max: number): string => {
    if (current < min) return 'text-muted-foreground'
    if (current > max) return 'text-destructive font-medium'
    return 'text-success font-medium'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold mb-2">App Details</h3>
        <p className="text-sm text-muted-foreground">
          Provide information about your app that will be displayed on the App Store.
        </p>
      </div>

      {/* App Store Guidelines Section */}
      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="guidelines" className="border border-border rounded-lg bg-muted/30 px-4">
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-2">
              <Info className="size-4 text-primary" />
              <span className="font-medium">App Store Guidelines & Requirements</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-2 pb-4">
            <div className="space-y-4 text-sm">
              {/* Key Requirements */}
              <div className="space-y-2">
                <h5 className="font-semibold text-foreground">Key Requirements</h5>
                <ul className="space-y-1.5 text-muted-foreground list-disc list-inside pl-2">
                  <li>App name must be unique and accurately represent your app</li>
                  <li>Description should clearly explain what your app does</li>
                  <li>App icon must be 1024x1024 PNG with no transparency</li>
                  <li>Content must comply with App Store Review Guidelines</li>
                  <li>Age rating must accurately reflect your app's content</li>
                </ul>
              </div>

              {/* Age Rating Descriptions */}
              <div className="space-y-2">
                <h5 className="font-semibold text-foreground">Age Rating Guide</h5>
                <div className="space-y-1.5 text-muted-foreground">
                  {AGE_RATINGS.map((rating) => (
                    <div key={rating.value} className="flex items-start gap-2">
                      <span className="font-medium text-foreground min-w-[2.5rem]">{rating.label}:</span>
                      <span>{rating.description}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Helpful Links */}
              <div className="space-y-2">
                <h5 className="font-semibold text-foreground">Helpful Resources</h5>
                <div className="flex flex-col gap-1.5">
                  <a
                    href="https://developer.apple.com/app-store/review/guidelines/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-primary hover:underline text-sm"
                  >
                    <ExternalLink className="size-3.5" />
                    App Store Review Guidelines
                  </a>
                  <a
                    href="https://developer.apple.com/design/human-interface-guidelines/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-primary hover:underline text-sm"
                  >
                    <ExternalLink className="size-3.5" />
                    Human Interface Guidelines
                  </a>
                  <a
                    href="https://developer.apple.com/design/human-interface-guidelines/app-icons"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-primary hover:underline text-sm"
                  >
                    <ExternalLink className="size-3.5" />
                    App Icon Specifications
                  </a>
                </div>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {/* Form Fields */}
      <div className="space-y-4">
        {/* App Name and Category - Two Column on Desktop */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* App Name */}
          <div className="space-y-2">
            <Label htmlFor="appName">
              App Name <span className="text-destructive">*</span>
            </Label>
            <div className="relative">
              <Input
                id="appName"
                placeholder="My Awesome App"
                value={formData.appName || ''}
                onChange={(e) => updateFormData({ appName: e.target.value })}
                onBlur={() => handleBlur('appName')}
                maxLength={30}
                aria-invalid={!!validationErrors.appName}
                aria-describedby={
                  validationErrors.appName ? 'appName-error appName-help' : 'appName-help'
                }
                className={validationErrors.appName ? 'pr-10' : fieldValidity.appName ? 'pr-10' : ''}
              />
              {(formData.appName?.length ?? 0) > 0 && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  {renderValidationIcon('appName')}
                </div>
              )}
            </div>
            {validationErrors.appName && (
              <p id="appName-error" className="text-sm text-destructive flex items-center gap-1.5">
                <AlertCircle className="size-3.5 shrink-0" />
                {validationErrors.appName}
              </p>
            )}
            <div className="flex items-center justify-between">
              <p id="appName-help" className="text-xs text-muted-foreground">
                Your app's display name on the App Store
              </p>
              <p
                className={`text-xs ${getCharCounterColor(
                  formData.appName?.length ?? 0,
                  1,
                  30
                )}`}
              >
                {formData.appName?.length ?? 0}/30
              </p>
            </div>
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label htmlFor="category">
              Category <span className="text-destructive">*</span>
            </Label>
            <Select
              value={formData.category || ''}
              onValueChange={(value) => {
                updateFormData({ category: value })
                setTouched((prev) => ({ ...prev, category: true }))
              }}
            >
              <SelectTrigger
                id="category"
                aria-invalid={!!validationErrors.category}
                aria-describedby={validationErrors.category ? 'category-error category-help' : 'category-help'}
              >
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {APP_CATEGORIES.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {validationErrors.category && (
              <p id="category-error" className="text-sm text-destructive flex items-center gap-1.5">
                <AlertCircle className="size-3.5 shrink-0" />
                {validationErrors.category}
              </p>
            )}
            <p id="category-help" className="text-xs text-muted-foreground">
              Primary category for App Store placement
            </p>
          </div>
        </div>

        {/* Description - Full Width */}
        <div className="space-y-2">
          <Label htmlFor="description">
            App Description <span className="text-destructive">*</span>
          </Label>
          <Textarea
            id="description"
            placeholder="Describe what your app does..."
            value={formData.description || ''}
            onChange={(e) => updateFormData({ description: e.target.value })}
            onBlur={() => handleBlur('description')}
            rows={5}
            maxLength={4000}
            aria-invalid={!!validationErrors.description}
            aria-describedby={
              validationErrors.description ? 'description-error description-help' : 'description-help'
            }
          />
          {validationErrors.description && (
            <p id="description-error" className="text-sm text-destructive flex items-center gap-1.5">
              <AlertCircle className="size-3.5 shrink-0" />
              {validationErrors.description}
            </p>
          )}
          <div className="flex items-center justify-between">
            <p id="description-help" className="text-xs text-muted-foreground">
              Tell users what makes your app special
            </p>
            <p
              className={`text-xs ${getCharCounterColor(
                formData.description?.length ?? 0,
                10,
                4000
              )}`}
            >
              {formData.description?.length ?? 0}/4000 (min 10)
            </p>
          </div>
        </div>

        {/* Age Rating */}
        <div className="space-y-2">
          <Label htmlFor="ageRating">
            Age Rating <span className="text-destructive">*</span>
          </Label>
          <Select
            value={formData.ageRating || '4+'}
            onValueChange={(value) => updateFormData({ ageRating: value as '4+' | '9+' | '12+' | '17+' })}
          >
            <SelectTrigger
              id="ageRating"
              aria-describedby="ageRating-help"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {AGE_RATINGS.map((rating) => (
                <SelectItem key={rating.value} value={rating.value}>
                  <div className="flex flex-col items-start">
                    <span className="font-medium">{rating.label}</span>
                    <span className="text-xs text-muted-foreground">{rating.description}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p id="ageRating-help" className="text-xs text-muted-foreground">
            Content suitability rating
          </p>
        </div>

        {/* Support URL - Optional */}
        <div className="space-y-2">
          <Label htmlFor="supportUrl">
            Support URL <span className="text-muted-foreground text-xs">(Optional)</span>
          </Label>
          <div className="relative">
            <Input
              id="supportUrl"
              type="url"
              placeholder="https://example.com/support"
              value={formData.supportUrl || ''}
              onChange={(e) => updateFormData({ supportUrl: e.target.value })}
              onBlur={() => handleBlur('supportUrl')}
              aria-invalid={!!validationErrors.supportUrl}
              aria-describedby={
                validationErrors.supportUrl ? 'supportUrl-error supportUrl-help' : 'supportUrl-help'
              }
              className={
                validationErrors.supportUrl ? 'pr-10' : fieldValidity.supportUrl && formData.supportUrl ? 'pr-10' : ''
              }
            />
            {(formData.supportUrl?.length ?? 0) > 0 && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {renderValidationIcon('supportUrl')}
              </div>
            )}
          </div>
          {validationErrors.supportUrl && (
            <p id="supportUrl-error" className="text-sm text-destructive flex items-center gap-1.5">
              <AlertCircle className="size-3.5 shrink-0" />
              {validationErrors.supportUrl}
            </p>
          )}
          <p id="supportUrl-help" className="text-xs text-muted-foreground">
            Where users can get help with your app
          </p>
        </div>

        {/* App Icon URL - Optional */}
        <div className="space-y-2">
          <Label htmlFor="iconUrl">
            App Icon URL <span className="text-muted-foreground text-xs">(Optional)</span>
          </Label>
          <div className="relative">
            <Input
              id="iconUrl"
              type="url"
              placeholder="https://example.com/icon.png"
              value={formData.iconUrl || ''}
              onChange={(e) => updateFormData({ iconUrl: e.target.value })}
              onBlur={() => handleBlur('iconUrl')}
              aria-invalid={!!validationErrors.iconUrl}
              aria-describedby={
                validationErrors.iconUrl ? 'iconUrl-error iconUrl-help' : 'iconUrl-help'
              }
              className={
                validationErrors.iconUrl ? 'pr-10' : fieldValidity.iconUrl && formData.iconUrl ? 'pr-10' : ''
              }
            />
            {(formData.iconUrl?.length ?? 0) > 0 && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {renderValidationIcon('iconUrl')}
              </div>
            )}
          </div>
          {validationErrors.iconUrl && (
            <p id="iconUrl-error" className="text-sm text-destructive flex items-center gap-1.5">
              <AlertCircle className="size-3.5 shrink-0" />
              {validationErrors.iconUrl}
            </p>
          )}
          <p id="iconUrl-help" className="text-xs text-muted-foreground">
            1024x1024 PNG (required for App Store)
          </p>
          <p className="text-xs text-muted-foreground italic">
            Note: File upload coming in next version
          </p>

          {/* Icon Preview */}
          {formData.iconUrl && (
            <div className="mt-2 p-3 border border-border rounded-lg bg-muted/30">
              <p className="text-xs font-medium text-muted-foreground mb-2">Preview</p>
              <div className="flex items-center gap-3">
                {iconLoading && (
                  <div className="size-16 flex items-center justify-center border border-border rounded-lg bg-muted">
                    <Loader2 className="size-6 animate-spin text-muted-foreground" />
                  </div>
                )}
                {iconPreviewUrl && !iconLoading && (
                  <img
                    src={iconPreviewUrl}
                    alt="App icon preview"
                    className="size-16 rounded-lg border border-border object-cover"
                  />
                )}
                {iconError && !iconLoading && (
                  <div className="size-16 flex items-center justify-center border border-destructive/50 rounded-lg bg-destructive/10">
                    <ImageIcon className="size-6 text-destructive" />
                  </div>
                )}
                {iconError && (
                  <p className="text-xs text-destructive flex items-center gap-1.5">
                    <AlertCircle className="size-3.5 shrink-0" />
                    {iconError}
                  </p>
                )}
                {iconPreviewUrl && !iconLoading && (
                  <p className="text-xs text-success flex items-center gap-1.5">
                    <CheckCircle2 className="size-3.5 shrink-0" />
                    Icon loaded successfully
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Bundle ID Preview */}
        <div className="space-y-2">
          <Label htmlFor="bundleId">Bundle ID (Auto-generated)</Label>
          <Input
            id="bundleId"
            value={bundleId}
            readOnly
            disabled
            className="bg-muted/50 font-mono text-sm"
            aria-describedby="bundleId-help"
          />
          <p id="bundleId-help" className="text-xs text-muted-foreground">
            Auto-generated based on app name
          </p>
        </div>
      </div>

      {/* Final Info Alert */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription className="text-xs">
          After submitting, you can review and modify these details in your App Store Connect account before
          publishing your app.
        </AlertDescription>
      </Alert>
    </div>
  )
}
