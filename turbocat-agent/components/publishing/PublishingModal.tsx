'use client'

import * as React from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { toast } from 'sonner'
import { PrerequisitesStep } from './PrerequisitesStep'
import { AppleCredentialsStep } from './AppleCredentialsStep'
import { ExpoTokenStep } from './ExpoTokenStep'
import { AppDetailsStep } from './AppDetailsStep'
import { BuildingStep } from './BuildingStep'

export interface PublishingFormData {
  // Apple Credentials
  appleTeamId: string
  appleKeyId: string
  appleIssuerId: string
  applePrivateKey: string
  // Expo Token
  expoToken: string
  // App Details
  appName: string
  description: string
  category: string
  ageRating: '4+' | '9+' | '12+' | '17+'
  supportUrl?: string
  iconUrl?: string
}

export interface PublishingModalProps {
  isOpen: boolean
  onClose: () => void
  projectId: string
  projectName?: string
}

interface ValidationErrors {
  [key: string]: string
}

const STEPS = ['Prerequisites', 'Apple Credentials', 'Expo Token', 'App Details', 'Building'] as const
type StepIndex = 0 | 1 | 2 | 3 | 4

export function PublishingModal({ isOpen, onClose, projectId, projectName = 'My App' }: PublishingModalProps) {
  const [currentStep, setCurrentStep] = React.useState<StepIndex>(0)
  const [formData, setFormData] = React.useState<Partial<PublishingFormData>>({
    appName: projectName,
    ageRating: '4+',
  })
  const [validationErrors, setValidationErrors] = React.useState<ValidationErrors>({})
  const [showCloseConfirm, setShowCloseConfirm] = React.useState(false)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [publishingId, setPublishingId] = React.useState<string | null>(null)

  // Check if user has entered data (for close confirmation)
  const hasDataEntered = React.useMemo(() => {
    const { appName, ...rest } = formData
    return Object.keys(rest).length > 0 || appName !== projectName
  }, [formData, projectName])

  // Reset state when modal closes
  React.useEffect(() => {
    if (!isOpen) {
      setCurrentStep(0)
      setFormData({ appName: projectName, ageRating: '4+' })
      setValidationErrors({})
      setPublishingId(null)
    }
  }, [isOpen, projectName])

  // Validation functions
  const validateAppleCredentials = (): boolean => {
    const errors: ValidationErrors = {}

    if (!formData.appleTeamId || formData.appleTeamId.length !== 10 || !/^[A-Z0-9]{10}$/.test(formData.appleTeamId)) {
      errors.appleTeamId = 'Apple Team ID must be 10 alphanumeric characters'
    }

    if (!formData.appleKeyId || formData.appleKeyId.length !== 10 || !/^[A-Z0-9]{10}$/.test(formData.appleKeyId)) {
      errors.appleKeyId = 'Apple Key ID must be 10 alphanumeric characters'
    }

    if (!formData.appleIssuerId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(formData.appleIssuerId)) {
      errors.appleIssuerId = 'Apple Issuer ID must be a valid UUID'
    }

    if (!formData.applePrivateKey || !formData.applePrivateKey.startsWith('-----BEGIN PRIVATE KEY-----')) {
      errors.applePrivateKey = 'Apple Private Key must start with -----BEGIN PRIVATE KEY-----'
    }

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const validateExpoToken = (): boolean => {
    const errors: ValidationErrors = {}

    if (!formData.expoToken || formData.expoToken.trim().length === 0) {
      errors.expoToken = 'Expo token is required'
    }

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const validateAppDetails = (): boolean => {
    const errors: ValidationErrors = {}

    if (!formData.appName || formData.appName.trim().length === 0) {
      errors.appName = 'App name is required'
    } else if (formData.appName.length > 30) {
      errors.appName = 'App name must be 30 characters or less'
    }

    if (!formData.description || formData.description.trim().length < 10) {
      errors.description = 'Description must be at least 10 characters'
    } else if (formData.description.length > 4000) {
      errors.description = 'Description must be 4000 characters or less'
    }

    if (!formData.category || formData.category.trim().length === 0) {
      errors.category = 'Category is required'
    }

    if (formData.supportUrl && !/^https?:\/\/.+\..+/.test(formData.supportUrl)) {
      errors.supportUrl = 'Support URL must be a valid URL'
    }

    if (formData.iconUrl && !/^https?:\/\/.+\..+/.test(formData.iconUrl)) {
      errors.iconUrl = 'Icon URL must be a valid URL'
    }

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  // Step validation
  const validateCurrentStep = (): boolean => {
    setValidationErrors({})

    switch (currentStep) {
      case 0: // Prerequisites - no validation needed
        return true
      case 1: // Apple Credentials
        return validateAppleCredentials()
      case 2: // Expo Token
        return validateExpoToken()
      case 3: // App Details
        return validateAppDetails()
      case 4: // Building - no validation needed
        return true
      default:
        return false
    }
  }

  // Navigation handlers
  const handleNext = () => {
    if (!validateCurrentStep()) {
      return
    }

    if (currentStep === 3) {
      // Last step before building - initiate publishing
      handleInitiatePublishing()
    } else {
      setCurrentStep((prev) => Math.min(prev + 1, 4) as StepIndex)
    }
  }

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => Math.max(prev - 1, 0) as StepIndex)
    }
  }

  const handleClose = () => {
    if (hasDataEntered && currentStep !== 4) {
      setShowCloseConfirm(true)
    } else {
      onClose()
    }
  }

  const handleConfirmClose = () => {
    setShowCloseConfirm(false)
    onClose()
  }

  // Update form data
  const updateFormData = (updates: Partial<PublishingFormData>) => {
    setFormData((prev) => ({ ...prev, ...updates }))
    // Clear validation errors for updated fields
    const updatedFields = Object.keys(updates)
    setValidationErrors((prev) => {
      const newErrors = { ...prev }
      updatedFields.forEach((field) => delete newErrors[field])
      return newErrors
    })
  }

  // API integration
  const handleInitiatePublishing = async () => {
    setIsSubmitting(true)

    try {
      const response = await fetch('/api/v1/publishing/initiate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectId,
          ...formData,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error?.message || 'Failed to initiate publishing')
      }

      setPublishingId(result.data.publishing.id)
      setCurrentStep(4) // Move to building step
      toast.success('Publishing initiated successfully!')
    } catch (error) {
      console.error('Error initiating publishing:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to initiate publishing')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Render current step
  const renderStep = () => {
    const stepProps = {
      formData,
      updateFormData,
      validationErrors,
    }

    switch (currentStep) {
      case 0:
        return <PrerequisitesStep onNext={handleNext} onBack={handleBack} canGoBack={currentStep > 0} />
      case 1:
        return <AppleCredentialsStep {...stepProps} />
      case 2:
        return <ExpoTokenStep {...stepProps} />
      case 3:
        return <AppDetailsStep {...stepProps} />
      case 4:
        return <BuildingStep publishingId={publishingId} projectId={projectId} />
      default:
        return null
    }
  }

  const canGoNext = (): boolean => {
    if (currentStep === 4) return false // Already at last step
    if (isSubmitting) return false
    return true
  }

  const canGoBack = (): boolean => {
    if (currentStep === 0) return false
    if (currentStep === 4) return false // Can't go back during building
    if (isSubmitting) return false
    return true
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] flex flex-col" showCloseButton={currentStep !== 4}>
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>Publish to App Store</DialogTitle>
            <DialogDescription>
              {currentStep < 4
                ? `Step ${currentStep + 1} of ${STEPS.length}: ${STEPS[currentStep]}`
                : 'Building your app...'}
            </DialogDescription>
          </DialogHeader>

          {/* Step indicators */}
          {currentStep < 4 && (
            <div className="flex items-center justify-between gap-2 pb-4 flex-shrink-0">
              {STEPS.slice(0, 4).map((step, index) => (
                <div key={step} className="flex-1 flex items-center">
                  <div
                    className={`h-2 flex-1 rounded-full transition-colors ${
                      index <= currentStep ? 'bg-primary' : 'bg-muted'
                    }`}
                    role="progressbar"
                    aria-valuenow={index <= currentStep ? 100 : 0}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`Step ${index + 1}: ${step}`}
                  />
                  {index < 3 && <div className="w-2" />}
                </div>
              ))}
            </div>
          )}

          {/* Step content */}
          <div className="flex-1 overflow-y-auto min-h-0 py-4">
            {renderStep()}
          </div>

          {/* Footer with navigation */}
          {currentStep < 4 && (
            <DialogFooter className="flex-shrink-0">
              <Button
                variant="outline"
                onClick={handleBack}
                disabled={!canGoBack()}
              >
                Back
              </Button>
              <Button
                onClick={handleNext}
                disabled={!canGoNext() || isSubmitting}
              >
                {isSubmitting ? 'Submitting...' : currentStep === 3 ? 'Start Build' : 'Next'}
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>

      {/* Close confirmation dialog */}
      <AlertDialog open={showCloseConfirm} onOpenChange={setShowCloseConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Discard changes?</AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved changes. Are you sure you want to close? Your progress will be lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Continue Editing</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmClose}>Discard Changes</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
