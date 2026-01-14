'use client'

import * as React from 'react'
import { CheckCircle2, AlertCircle, ExternalLink, Clock, Apple, Zap } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'

export interface PrerequisitesStepProps {
  onNext: () => void
  onBack?: () => void
  canGoBack?: boolean
}

interface Prerequisite {
  id: string
  title: string
  icon: React.ComponentType<{ className?: string }>
  description: string
  steps: string[]
  links: Array<{ label: string; url: string }>
  cost?: string
  tooltip?: string
}

const prerequisites: Prerequisite[] = [
  {
    id: 'apple-account',
    title: 'Apple Developer Account',
    icon: Apple,
    description: 'An active Apple Developer Program membership is required to publish apps to the App Store.',
    cost: '$99/year',
    tooltip: 'This is an annual subscription that must remain active to keep your apps on the App Store',
    steps: [
      'Visit the Apple Developer Program enrollment page',
      'Sign in with your Apple ID (or create one if needed)',
      'Complete the enrollment form with your entity information',
      'Pay the annual membership fee ($99 USD)',
      'Wait for approval (typically 24-48 hours)',
      'Access App Store Connect with your Developer credentials',
    ],
    links: [
      { label: 'Join Apple Developer Program', url: 'https://developer.apple.com/programs/' },
      { label: 'Enrollment Support', url: 'https://developer.apple.com/support/enrollment/' },
    ],
  },
  {
    id: 'app-store-api',
    title: 'App Store Connect API Key',
    icon: CheckCircle2,
    description: 'API credentials are required for automated build submission and management.',
    tooltip: 'These credentials allow secure, automated access to App Store Connect without your Apple ID password',
    steps: [
      'Sign in to App Store Connect',
      'Navigate to Users and Access > Keys',
      'Click the "+" button to generate a new API key',
      'Provide a name for your key (e.g., "Turbocat Build Key")',
      'Select "Admin" or "App Manager" access level',
      'Download the private key file (.p8) immediately (you cannot download it again)',
      'Note your Issuer ID (appears at the top of the page)',
      'Note your Key ID (appears in the key table)',
      'Find your Team ID in Membership Details',
    ],
    links: [
      { label: 'Create API Keys', url: 'https://appstoreconnect.apple.com/access/api' },
      {
        label: 'API Key Documentation',
        url: 'https://developer.apple.com/help/account/manage-your-team/create-api-keys-for-app-store-connect-api',
      },
    ],
  },
  {
    id: 'expo-account',
    title: 'Expo Account',
    icon: Zap,
    description: 'Expo Build Services (EAS) will build your iOS app in the cloud.',
    cost: 'Free tier available',
    tooltip: 'Expo provides cloud build services that compile your React Native app for iOS',
    steps: [
      'Visit the Expo signup page',
      'Create an account with your email',
      'Verify your email address',
      'Optionally upgrade to a paid plan for additional build capacity',
    ],
    links: [
      { label: 'Sign up for Expo', url: 'https://expo.dev/signup' },
      { label: 'Expo Build Services', url: 'https://docs.expo.dev/build/introduction/' },
      { label: 'EAS Pricing', url: 'https://expo.dev/pricing' },
    ],
  },
  {
    id: 'expo-token',
    title: 'Expo Access Token',
    icon: CheckCircle2,
    description: 'A personal access token allows Turbocat to trigger builds on your behalf.',
    tooltip: 'This token authenticates build requests without requiring your Expo password',
    steps: [
      'Sign in to your Expo account',
      'Navigate to Account Settings > Access Tokens',
      'Click "Create Token"',
      'Give it a descriptive name (e.g., "Turbocat Publishing")',
      'Select the required scopes (at minimum: "Build" and "Publish")',
      'Copy the token immediately (it will not be shown again)',
      'Store the token securely',
    ],
    links: [
      { label: 'Manage Access Tokens', url: 'https://expo.dev/accounts/[username]/settings/access-tokens' },
      { label: 'Token Documentation', url: 'https://docs.expo.dev/accounts/programmatic-access/' },
    ],
  },
]

export function PrerequisitesStep({ onNext, onBack, canGoBack = false }: PrerequisitesStepProps) {
  const [completed, setCompleted] = React.useState(false)
  const [reviewedItems, setReviewedItems] = React.useState<Set<string>>(new Set())

  const handleItemClick = (id: string) => {
    setReviewedItems((prev) => {
      const next = new Set(prev)
      next.add(id)
      return next
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <h3 className="text-lg font-semibold">Before You Begin</h3>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock className="size-3.5" />
            <span>Setup takes ~15 minutes</span>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          Make sure you have the following requirements ready. This will ensure a smooth publishing process.
        </p>
      </div>

      {/* Prerequisites Accordion */}
      <Accordion type="multiple" className="w-full space-y-3">
        {prerequisites.map((prereq, index) => {
          const Icon = prereq.icon
          const isReviewed = reviewedItems.has(prereq.id)

          return (
            <AccordionItem
              key={prereq.id}
              value={prereq.id}
              className="border border-border rounded-lg bg-muted/30 px-4 transition-colors hover:bg-muted/50"
            >
              <AccordionTrigger
                className="hover:no-underline"
                onClick={() => handleItemClick(prereq.id)}
                aria-label={`View details for ${prereq.title}`}
              >
                <div className="flex items-start gap-3 flex-1 pr-2">
                  <div className="flex items-center justify-center size-8 rounded-lg bg-background border border-border shrink-0 mt-0.5">
                    <Icon className="size-4 text-primary" />
                  </div>
                  <div className="flex-1 text-left">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-base">{prereq.title}</h4>
                      {prereq.cost && (
                        <span className="text-xs font-medium text-amber-600 dark:text-amber-500 bg-amber-50 dark:bg-amber-950/30 px-2 py-0.5 rounded-md border border-amber-200 dark:border-amber-900">
                          {prereq.cost}
                        </span>
                      )}
                      {isReviewed && (
                        <CheckCircle2 className="size-3.5 text-success ml-auto" aria-label="Reviewed" />
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground font-normal">
                      {prereq.description}
                      {prereq.tooltip && (
                        <span className="block text-xs mt-1 text-muted-foreground/80 italic">
                          {prereq.tooltip}
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              </AccordionTrigger>

              <AccordionContent className="pt-2">
                <div className="pl-11 space-y-4">
                  {/* Steps */}
                  <div>
                    <h5 className="text-sm font-medium mb-2">Step-by-step guide:</h5>
                    <ol className="space-y-2 text-sm text-muted-foreground">
                      {prereq.steps.map((step, idx) => (
                        <li key={idx} className="flex gap-2">
                          <span className="font-medium text-foreground shrink-0">{idx + 1}.</span>
                          <span>{step}</span>
                        </li>
                      ))}
                    </ol>
                  </div>

                  {/* Links */}
                  {prereq.links.length > 0 && (
                    <div>
                      <h5 className="text-sm font-medium mb-2">Helpful links:</h5>
                      <ul className="space-y-2">
                        {prereq.links.map((link, idx) => (
                          <li key={idx}>
                            <a
                              href={link.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline transition-colors"
                            >
                              <ExternalLink className="size-3.5" />
                              {link.label}
                            </a>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
          )
        })}
      </Accordion>

      {/* Time Estimate Alert */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          The publishing process typically takes 15-30 minutes. Make sure you have a stable internet connection and all
          required credentials ready.
        </AlertDescription>
      </Alert>

      {/* Completion Checkbox */}
      <div className="pt-4 border-t border-border">
        <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/30 border border-border">
          <Checkbox
            id="prerequisites-complete"
            checked={completed}
            onCheckedChange={(checked) => setCompleted(checked === true)}
            aria-label="I have completed these prerequisites"
          />
          <div className="flex-1">
            <Label htmlFor="prerequisites-complete" className="cursor-pointer font-medium">
              I have completed these prerequisites
            </Label>
            <p className="text-xs text-muted-foreground mt-1">
              Check this box to confirm you have all required accounts, credentials, and information ready.
            </p>
          </div>
        </div>
      </div>

      {/* Additional Resources */}
      <div className="pt-4 border-t border-border">
        <h4 className="font-medium mb-3 flex items-center gap-2">
          <ExternalLink className="size-4" />
          Additional Resources
        </h4>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li>
            <a
              href="https://developer.apple.com/app-store/review/guidelines/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline inline-flex items-center gap-1.5"
            >
              <ExternalLink className="size-3.5" />
              App Store Review Guidelines
            </a>
          </li>
          <li>
            <a
              href="https://docs.expo.dev/submit/ios/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline inline-flex items-center gap-1.5"
            >
              <ExternalLink className="size-3.5" />
              Expo iOS Submission Guide
            </a>
          </li>
          <li>
            <a
              href="https://developer.apple.com/design/human-interface-guidelines/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline inline-flex items-center gap-1.5"
            >
              <ExternalLink className="size-3.5" />
              Apple Human Interface Guidelines
            </a>
          </li>
        </ul>
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between pt-4 border-t border-border">
        {canGoBack ? (
          <Button variant="outline" onClick={onBack} type="button">
            Back
          </Button>
        ) : (
          <div />
        )}
        <Button onClick={onNext} disabled={!completed} type="button" aria-label="Continue to next step">
          Continue
        </Button>
      </div>
    </div>
  )
}
