'use client'

import * as React from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion'
import { Button } from '@/components/ui/button'
import { AlertCircle, CheckCircle2, XCircle, Eye, EyeOff, ExternalLink, Shield, HelpCircle } from 'lucide-react'
import type { PublishingFormData } from './PublishingModal'

interface AppleCredentialsStepProps {
  formData: Partial<PublishingFormData>
  updateFormData: (updates: Partial<PublishingFormData>) => void
  validationErrors: Record<string, string>
}

interface FieldState {
  appleTeamId: boolean
  appleKeyId: boolean
  appleIssuerId: boolean
  applePrivateKey: boolean
}

export function AppleCredentialsStep({ formData, updateFormData, validationErrors }: AppleCredentialsStepProps) {
  const [showPrivateKey, setShowPrivateKey] = React.useState(false)
  const [touched, setTouched] = React.useState<Record<string, boolean>>({})

  // Calculate field validity states
  const fieldValidity: FieldState = React.useMemo(() => {
    const teamIdValid = !!(
      formData.appleTeamId &&
      formData.appleTeamId.length === 10 &&
      /^[A-Z0-9]{10}$/.test(formData.appleTeamId)
    )

    const keyIdValid = !!(
      formData.appleKeyId &&
      formData.appleKeyId.length === 10 &&
      /^[A-Z0-9]{10}$/.test(formData.appleKeyId)
    )

    const issuerIdValid = !!(
      formData.appleIssuerId &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(formData.appleIssuerId)
    )

    const privateKeyValid = !!(
      formData.applePrivateKey &&
      formData.applePrivateKey.includes('-----BEGIN PRIVATE KEY-----')
    )

    return {
      appleTeamId: teamIdValid,
      appleKeyId: keyIdValid,
      appleIssuerId: issuerIdValid,
      applePrivateKey: privateKeyValid,
    }
  }, [formData])

  // Handle field blur for trimming and marking as touched
  const handleBlur = (field: keyof PublishingFormData) => {
    setTouched((prev) => ({ ...prev, [field]: true }))

    // Trim whitespace from text fields (but not private key newlines)
    if (field === 'appleTeamId' || field === 'appleKeyId' || field === 'appleIssuerId') {
      const value = formData[field]
      if (typeof value === 'string' && value !== value.trim()) {
        updateFormData({ [field]: value.trim() })
      }
    }
  }

  // Render validation indicator
  const renderValidationIcon = (field: keyof FieldState) => {
    const value = formData[field as keyof PublishingFormData]
    const hasValue = typeof value === 'string' && value.length > 0
    const isValid = fieldValidity[field]
    const hasError = !!validationErrors[field]

    if (!hasValue) return null

    if (hasError || (!isValid && touched[field])) {
      return <XCircle className="size-5 text-destructive shrink-0" aria-label="Invalid" />
    }

    if (isValid) {
      return <CheckCircle2 className="size-5 text-success shrink-0" aria-label="Valid" />
    }

    return null
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold mb-2">Apple Developer Credentials</h3>
        <p className="text-sm text-muted-foreground">
          Enter your App Store Connect API credentials. These will be encrypted and stored securely.
        </p>
      </div>

      {/* Security Alert */}
      <Alert>
        <Shield className="h-4 w-4" />
        <AlertDescription>
          Your credentials are encrypted using AES-256 encryption and never stored in plain text. We use these
          credentials only to submit your app to the App Store on your behalf.
        </AlertDescription>
      </Alert>

      {/* Help Section */}
      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="help" className="border border-border rounded-lg bg-muted/30 px-4">
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-2">
              <HelpCircle className="size-4 text-primary" />
              <span className="font-medium">Where do I find these credentials?</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-2 pb-4">
            <div className="space-y-4 text-sm">
              {/* Team ID */}
              <div className="space-y-2">
                <h5 className="font-semibold text-foreground">Apple Team ID</h5>
                <ol className="space-y-1.5 text-muted-foreground list-decimal list-inside pl-2">
                  <li>Sign in to your Apple Developer account</li>
                  <li>Navigate to Membership Details</li>
                  <li>Find your 10-character Team ID</li>
                </ol>
                <a
                  href="https://developer.apple.com/account/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-primary hover:underline text-sm"
                >
                  <ExternalLink className="size-3.5" />
                  Go to Apple Developer Account
                </a>
              </div>

              {/* API Key */}
              <div className="space-y-2">
                <h5 className="font-semibold text-foreground">Key ID, Issuer ID, and Private Key</h5>
                <ol className="space-y-1.5 text-muted-foreground list-decimal list-inside pl-2">
                  <li>Sign in to App Store Connect</li>
                  <li>Navigate to Users and Access → Keys</li>
                  <li>Click the "+" button to generate a new API key</li>
                  <li>Give it a name (e.g., "Turbocat Build Key")</li>
                  <li>Select "Admin" or "App Manager" access level</li>
                  <li>Download the private key file (.p8) - you can only download it once!</li>
                  <li>Copy the Issuer ID from the top of the page</li>
                  <li>Copy the Key ID from the key table</li>
                </ol>
                <a
                  href="https://appstoreconnect.apple.com/access/api"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-primary hover:underline text-sm"
                >
                  <ExternalLink className="size-3.5" />
                  Go to App Store Connect API Keys
                </a>
              </div>

              {/* Warning */}
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  Never share your private key or API credentials. Keep your .p8 file secure and never commit it to
                  version control.
                </AlertDescription>
              </Alert>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {/* Form Fields */}
      <div className="space-y-4">
        {/* Apple Team ID */}
        <div className="space-y-2">
          <Label htmlFor="appleTeamId">
            Apple Team ID <span className="text-destructive">*</span>
          </Label>
          <div className="relative">
            <Input
              id="appleTeamId"
              placeholder="ABC123XYZ"
              value={formData.appleTeamId || ''}
              onChange={(e) => updateFormData({ appleTeamId: e.target.value.toUpperCase() })}
              onBlur={() => handleBlur('appleTeamId')}
              maxLength={10}
              aria-invalid={!!validationErrors.appleTeamId}
              aria-describedby={
                validationErrors.appleTeamId ? 'appleTeamId-error appleTeamId-help' : 'appleTeamId-help'
              }
              className={validationErrors.appleTeamId ? 'pr-10' : fieldValidity.appleTeamId ? 'pr-10' : ''}
            />
            {(formData.appleTeamId?.length ?? 0) > 0 && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {renderValidationIcon('appleTeamId')}
              </div>
            )}
          </div>
          {validationErrors.appleTeamId && (
            <p id="appleTeamId-error" className="text-sm text-destructive flex items-center gap-1.5">
              <AlertCircle className="size-3.5 shrink-0" />
              {validationErrors.appleTeamId}
            </p>
          )}
          <div className="flex items-center justify-between">
            <p id="appleTeamId-help" className="text-xs text-muted-foreground">
              Your 10-character Apple Developer Team ID
            </p>
            <p
              className={`text-xs ${
                (formData.appleTeamId?.length ?? 0) === 10
                  ? 'text-success font-medium'
                  : 'text-muted-foreground'
              }`}
            >
              {formData.appleTeamId?.length ?? 0}/10
            </p>
          </div>
        </div>

        {/* Apple Key ID */}
        <div className="space-y-2">
          <Label htmlFor="appleKeyId">
            Key ID <span className="text-destructive">*</span>
          </Label>
          <div className="relative">
            <Input
              id="appleKeyId"
              placeholder="KEY123ABC"
              value={formData.appleKeyId || ''}
              onChange={(e) => updateFormData({ appleKeyId: e.target.value.toUpperCase() })}
              onBlur={() => handleBlur('appleKeyId')}
              maxLength={10}
              aria-invalid={!!validationErrors.appleKeyId}
              aria-describedby={
                validationErrors.appleKeyId ? 'appleKeyId-error appleKeyId-help' : 'appleKeyId-help'
              }
              className={validationErrors.appleKeyId ? 'pr-10' : fieldValidity.appleKeyId ? 'pr-10' : ''}
            />
            {(formData.appleKeyId?.length ?? 0) > 0 && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {renderValidationIcon('appleKeyId')}
              </div>
            )}
          </div>
          {validationErrors.appleKeyId && (
            <p id="appleKeyId-error" className="text-sm text-destructive flex items-center gap-1.5">
              <AlertCircle className="size-3.5 shrink-0" />
              {validationErrors.appleKeyId}
            </p>
          )}
          <div className="flex items-center justify-between">
            <p id="appleKeyId-help" className="text-xs text-muted-foreground">
              Your App Store Connect API Key ID
            </p>
            <p
              className={`text-xs ${
                (formData.appleKeyId?.length ?? 0) === 10 ? 'text-success font-medium' : 'text-muted-foreground'
              }`}
            >
              {formData.appleKeyId?.length ?? 0}/10
            </p>
          </div>
        </div>

        {/* Apple Issuer ID */}
        <div className="space-y-2">
          <Label htmlFor="appleIssuerId">
            Issuer ID <span className="text-destructive">*</span>
          </Label>
          <div className="relative">
            <Input
              id="appleIssuerId"
              placeholder="12345678-1234-1234-1234-123456789012"
              value={formData.appleIssuerId || ''}
              onChange={(e) => updateFormData({ appleIssuerId: e.target.value.toLowerCase() })}
              onBlur={() => handleBlur('appleIssuerId')}
              aria-invalid={!!validationErrors.appleIssuerId}
              aria-describedby={
                validationErrors.appleIssuerId ? 'appleIssuerId-error appleIssuerId-help' : 'appleIssuerId-help'
              }
              className={validationErrors.appleIssuerId ? 'pr-10' : fieldValidity.appleIssuerId ? 'pr-10' : ''}
            />
            {(formData.appleIssuerId?.length ?? 0) > 0 && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {renderValidationIcon('appleIssuerId')}
              </div>
            )}
          </div>
          {validationErrors.appleIssuerId && (
            <p id="appleIssuerId-error" className="text-sm text-destructive flex items-center gap-1.5">
              <AlertCircle className="size-3.5 shrink-0" />
              {validationErrors.appleIssuerId}
            </p>
          )}
          <p id="appleIssuerId-help" className="text-xs text-muted-foreground">
            Your App Store Connect API Issuer ID (UUID format with hyphens)
          </p>
        </div>

        {/* Apple Private Key */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="applePrivateKey">
              Private Key (.p8) <span className="text-destructive">*</span>
            </Label>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowPrivateKey(!showPrivateKey)}
              className="h-7 px-2 text-xs"
              aria-label={showPrivateKey ? 'Hide private key' : 'Show private key'}
            >
              {showPrivateKey ? (
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
            <Textarea
              id="applePrivateKey"
              placeholder="-----BEGIN PRIVATE KEY-----&#10;MIGTAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBHkw...&#10;-----END PRIVATE KEY-----"
              value={formData.applePrivateKey || ''}
              onChange={(e) => updateFormData({ applePrivateKey: e.target.value })}
              onBlur={() => handleBlur('applePrivateKey')}
              rows={8}
              className={`font-mono text-xs ${showPrivateKey ? '' : 'text-security-disc'} ${
                validationErrors.applePrivateKey ? 'pr-10' : fieldValidity.applePrivateKey ? 'pr-10' : ''
              }`}
              style={showPrivateKey ? {} : ({ WebkitTextSecurity: 'disc' } as React.CSSProperties)}
              aria-invalid={!!validationErrors.applePrivateKey}
              aria-describedby={
                validationErrors.applePrivateKey
                  ? 'applePrivateKey-error applePrivateKey-help'
                  : 'applePrivateKey-help'
              }
            />
            {(formData.applePrivateKey?.length ?? 0) > 0 && (
              <div className="absolute right-3 top-3">{renderValidationIcon('applePrivateKey')}</div>
            )}
          </div>
          {validationErrors.applePrivateKey && (
            <p id="applePrivateKey-error" className="text-sm text-destructive flex items-center gap-1.5">
              <AlertCircle className="size-3.5 shrink-0" />
              {validationErrors.applePrivateKey}
            </p>
          )}
          <div className="space-y-1">
            <p id="applePrivateKey-help" className="text-xs text-muted-foreground">
              Paste the entire contents of your .p8 private key file, including the BEGIN and END lines
            </p>
            <p className="text-xs text-muted-foreground flex items-center gap-1.5">
              <Shield className="size-3 shrink-0" />
              This key is encrypted before storage and never logged
            </p>
          </div>
        </div>
      </div>

      {/* Additional Security Notice */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription className="text-xs">
          <strong>Security Best Practices:</strong> Never share these credentials with anyone. They provide full access
          to your App Store Connect account. You can revoke API keys at any time from App Store Connect.
        </AlertDescription>
      </Alert>
    </div>
  )
}
