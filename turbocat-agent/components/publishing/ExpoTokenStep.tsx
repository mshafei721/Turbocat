'use client'

import * as React from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion'
import {
  AlertCircle,
  CheckCircle2,
  XCircle,
  Eye,
  EyeOff,
  ExternalLink,
  Shield,
  HelpCircle,
  Loader2,
} from 'lucide-react'
import type { PublishingFormData } from './PublishingModal'

interface ExpoTokenStepProps {
  formData: Partial<PublishingFormData>
  updateFormData: (updates: Partial<PublishingFormData>) => void
  validationErrors: Record<string, string>
}

export function ExpoTokenStep({ formData, updateFormData, validationErrors }: ExpoTokenStepProps) {
  const [showToken, setShowToken] = React.useState(false)
  const [isVerifying, setIsVerifying] = React.useState(false)
  const [verificationResult, setVerificationResult] = React.useState<{
    success: boolean
    message: string
  } | null>(null)
  const [touched, setTouched] = React.useState(false)

  // Validation logic
  const tokenValid = React.useMemo(() => {
    const token = formData.expoToken
    if (!token || token.length === 0) return false

    // Must be at least 20 characters
    if (token.length < 20) return false

    // Optional: Check for common Expo token patterns
    // Most Expo tokens start with specific prefixes, but we keep this flexible
    return true
  }, [formData.expoToken])

  // Handle blur for trimming and marking as touched
  const handleBlur = () => {
    setTouched(true)

    // Trim whitespace
    if (formData.expoToken && formData.expoToken !== formData.expoToken.trim()) {
      updateFormData({ expoToken: formData.expoToken.trim() })
    }
  }

  // Handle token verification (optional feature)
  const handleVerifyToken = async () => {
    if (!formData.expoToken) return

    setIsVerifying(true)
    setVerificationResult(null)

    try {
      // This would call your backend API to verify the token
      // For now, we'll simulate the verification
      const response = await fetch('/api/v1/publishing/verify-expo-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: formData.expoToken }),
      })

      if (response.ok) {
        setVerificationResult({
          success: true,
          message: 'Token verified successfully!',
        })
      } else {
        const error = await response.json()
        setVerificationResult({
          success: false,
          message: error.message || 'Invalid token. Please check and try again.',
        })
      }
    } catch (error) {
      // Graceful degradation if API is not available
      setVerificationResult({
        success: false,
        message: 'Verification unavailable. You can continue without verification.',
      })
    } finally {
      setIsVerifying(false)
    }
  }

  // Render validation indicator
  const renderValidationIcon = () => {
    const hasValue = formData.expoToken && formData.expoToken.length > 0
    const hasError = !!validationErrors.expoToken

    if (!hasValue) return null

    if (hasError || (!tokenValid && touched)) {
      return <XCircle className="size-5 text-destructive shrink-0" aria-label="Invalid" />
    }

    if (tokenValid) {
      return <CheckCircle2 className="size-5 text-success shrink-0" aria-label="Valid" />
    }

    return null
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold mb-2">Expo Access Token</h3>
        <p className="text-sm text-muted-foreground">
          Provide your Expo access token to enable building your app with Expo Build Services (EAS).
        </p>
      </div>

      {/* Security Alert */}
      <Alert>
        <Shield className="h-4 w-4" />
        <AlertDescription>
          Your token is encrypted with AES-256-GCM before storage and never stored in plain text. We use this token
          only to start builds on your behalf.
        </AlertDescription>
      </Alert>

      {/* Help Section */}
      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="help" className="border border-border rounded-lg bg-muted/30 px-4">
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-2">
              <HelpCircle className="size-4 text-primary" />
              <span className="font-medium">How to Get Your Expo Access Token</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-2 pb-4">
            <div className="space-y-4 text-sm">
              {/* Step-by-step instructions */}
              <div className="space-y-2">
                <h5 className="font-semibold text-foreground">Creating an Access Token</h5>
                <ol className="space-y-1.5 text-muted-foreground list-decimal list-inside pl-2">
                  <li>Log in to https://expo.dev with your Expo account</li>
                  <li>Navigate to Account Settings → Access Tokens</li>
                  <li>Click the "Create Token" button</li>
                  <li>Give it a name (e.g., "Turbocat Publishing")</li>
                  <li>
                    Select the required scopes: "Read" and "Write" permissions for projects and builds
                  </li>
                  <li>
                    <strong>Important:</strong> Copy the token immediately - you can only see it once!
                  </li>
                  <li>Paste the token into the field above</li>
                </ol>
                <div className="space-y-2 mt-3">
                  <a
                    href="https://expo.dev/accounts/[username]/settings/access-tokens"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-primary hover:underline text-sm"
                  >
                    <ExternalLink className="size-3.5" />
                    Go to Expo Access Tokens
                  </a>
                  <br />
                  <a
                    href="https://docs.expo.dev/accounts/programmatic-access/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-primary hover:underline text-sm"
                  >
                    <ExternalLink className="size-3.5" />
                    Read Expo Documentation on Access Tokens
                  </a>
                </div>
              </div>

              {/* Token Types */}
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  <strong>Token Types:</strong>
                  <ul className="mt-1 space-y-1 list-disc list-inside ml-2">
                    <li>
                      <strong>Personal Access Token</strong> - Recommended for individual developers. Tied to your
                      account.
                    </li>
                    <li>
                      <strong>Robot Access Token</strong> - Best for CI/CD and team environments. Not tied to a
                      specific user.
                    </li>
                  </ul>
                  <a
                    href="https://docs.expo.dev/accounts/programmatic-access/#personal-access-tokens-vs-robot-users"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 mt-1.5 text-primary hover:underline"
                  >
                    <ExternalLink className="h-3 w-3" />
                    Learn about token types
                  </a>
                </AlertDescription>
              </Alert>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {/* Token Input Field */}
      <div className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="expoToken">
              Expo Access Token <span className="text-destructive">*</span>
            </Label>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowToken(!showToken)}
              className="h-7 px-2 text-xs"
              aria-label={showToken ? 'Hide token' : 'Show token'}
            >
              {showToken ? (
                <>
                  <EyeOff className="size-3.5 mr-1" />
                  Hide
                </>
              ) : (
                <>
                  <Eye className="size-3.5 mr-1" />
                  Show
                </>
              )}
            </Button>
          </div>
          <div className="relative">
            <Input
              id="expoToken"
              type={showToken ? 'text' : 'password'}
              placeholder="expo_abc123xyz..."
              value={formData.expoToken || ''}
              onChange={(e) => updateFormData({ expoToken: e.target.value })}
              onBlur={handleBlur}
              aria-invalid={!!validationErrors.expoToken}
              aria-describedby={
                validationErrors.expoToken ? 'expoToken-error expoToken-help' : 'expoToken-help'
              }
              className={
                validationErrors.expoToken ? 'pr-10' : tokenValid && formData.expoToken ? 'pr-10' : ''
              }
            />
            {(formData.expoToken?.length ?? 0) > 0 && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {renderValidationIcon()}
              </div>
            )}
          </div>
          {validationErrors.expoToken && (
            <p id="expoToken-error" className="text-sm text-destructive flex items-center gap-1.5">
              <AlertCircle className="size-3.5 shrink-0" />
              {validationErrors.expoToken}
            </p>
          )}
          <div className="space-y-1">
            <p id="expoToken-help" className="text-xs text-muted-foreground">
              Your personal or robot access token from Expo with build permissions
            </p>
            <p className="text-xs text-muted-foreground flex items-center gap-1.5">
              <Shield className="size-3 shrink-0" />
              This token is encrypted before storage
            </p>
          </div>
        </div>

        {/* Optional: Verify Token Button */}
        {formData.expoToken && formData.expoToken.length >= 20 && (
          <div className="space-y-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleVerifyToken}
              disabled={isVerifying || !tokenValid}
              className="w-full sm:w-auto"
            >
              {isVerifying ? (
                <>
                  <Loader2 className="size-4 mr-2 animate-spin" />
                  Verifying...
                </>
              ) : (
                <>Verify Token</>
              )}
            </Button>

            {verificationResult && (
              <Alert variant={verificationResult.success ? 'default' : 'destructive'}>
                {verificationResult.success ? (
                  <CheckCircle2 className="h-4 w-4 text-success" />
                ) : (
                  <AlertCircle className="h-4 w-4" />
                )}
                <AlertDescription className="text-sm">
                  {verificationResult.message}
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}
      </div>

      {/* Security Warning */}
      <div className="p-4 rounded-lg border border-amber-500/20 bg-amber-500/10">
        <div className="flex items-start gap-3">
          <AlertCircle size={20} className="text-amber-400 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-amber-400">Security Warning</p>
            <p className="text-xs text-muted-foreground mt-1">
              Never share your Expo access token with anyone. It provides full access to your Expo account and can
              be used to build and publish apps. You can revoke this token at any time from your Expo account
              settings.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
