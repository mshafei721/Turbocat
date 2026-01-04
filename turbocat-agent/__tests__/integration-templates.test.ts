/**
 * Integration Templates Tests
 *
 * Tests for integration templates (Stripe, SendGrid, Cloudinary)
 * that can be loaded into user projects.
 *
 * @file D:/009_Projects_AI/Personal_Projects/Turbocat/turbocat-agent/__tests__/integration-templates.test.ts
 */

import { describe, it, expect, beforeEach } from 'vitest'
import fs from 'fs'
import path from 'path'

const TEMPLATES_DIR = path.join(process.cwd(), 'templates')

describe('Integration Templates', () => {
  /**
   * Test 1: Stripe template generates checkout flow
   *
   * Verify that the Stripe template includes all necessary files
   * for a complete payment integration with checkout functionality.
   */
  describe('Test 1: Stripe Template Checkout Flow', () => {
    const stripeDir = path.join(TEMPLATES_DIR, 'stripe')

    it('should have stripe template directory', () => {
      expect(fs.existsSync(stripeDir)).toBe(true)
      expect(fs.statSync(stripeDir).isDirectory()).toBe(true)
    })

    it('should include stripe.skill.md with payment triggers', () => {
      const skillPath = path.join(stripeDir, 'stripe.skill.md')
      expect(fs.existsSync(skillPath)).toBe(true)

      const content = fs.readFileSync(skillPath, 'utf-8')
      expect(content).toContain('name: stripe')
      expect(content).toContain('triggers:')
      expect(content).toContain('payment')
      expect(content).toContain('stripe')
    })

    it('should include client.ts with Stripe SDK setup', () => {
      const clientPath = path.join(stripeDir, 'code', 'client.ts')
      expect(fs.existsSync(clientPath)).toBe(true)

      const content = fs.readFileSync(clientPath, 'utf-8')
      expect(content).toContain('Stripe')
      expect(content).toContain('STRIPE_SECRET_KEY')
    })

    it('should include hooks.ts with useStripeCheckout hook', () => {
      const hooksPath = path.join(stripeDir, 'code', 'hooks.ts')
      expect(fs.existsSync(hooksPath)).toBe(true)

      const content = fs.readFileSync(hooksPath, 'utf-8')
      expect(content).toContain('useStripeCheckout')
      expect(content).toContain('checkout')
    })

    it('should include checkout-button.tsx component', () => {
      const buttonPath = path.join(stripeDir, 'code', 'components', 'checkout-button.tsx')
      expect(fs.existsSync(buttonPath)).toBe(true)

      const content = fs.readFileSync(buttonPath, 'utf-8')
      expect(content).toContain('CheckoutButton')
      expect(content).toContain('stripe')
    })

    it('should include pricing-card.tsx component', () => {
      const cardPath = path.join(stripeDir, 'code', 'components', 'pricing-card.tsx')
      expect(fs.existsSync(cardPath)).toBe(true)

      const content = fs.readFileSync(cardPath, 'utf-8')
      expect(content).toContain('PricingCard')
      expect(content).toContain('price')
    })

    it('should generate valid checkout flow', () => {
      const hooksPath = path.join(stripeDir, 'code', 'hooks.ts')
      const content = fs.readFileSync(hooksPath, 'utf-8')

      // Check for complete checkout flow
      expect(content).toContain('createCheckout')
      expect(content).toContain('redirectToCheckout')
    })
  })

  /**
   * Test 2: SendGrid template sends test email
   *
   * Verify that the SendGrid template includes email client setup,
   * email templates, and helper functions for sending emails.
   */
  describe('Test 2: SendGrid Template Email Sending', () => {
    const sendgridDir = path.join(TEMPLATES_DIR, 'sendgrid')

    it('should have sendgrid template directory', () => {
      expect(fs.existsSync(sendgridDir)).toBe(true)
      expect(fs.statSync(sendgridDir).isDirectory()).toBe(true)
    })

    it('should include sendgrid.skill.md with email triggers', () => {
      const skillPath = path.join(sendgridDir, 'sendgrid.skill.md')
      expect(fs.existsSync(skillPath)).toBe(true)

      const content = fs.readFileSync(skillPath, 'utf-8')
      expect(content).toContain('name: sendgrid')
      expect(content).toContain('triggers:')
      expect(content).toContain('email')
      expect(content).toContain('send')
    })

    it('should include client.ts with SendGrid setup', () => {
      const clientPath = path.join(sendgridDir, 'code', 'client.ts')
      expect(fs.existsSync(clientPath)).toBe(true)

      const content = fs.readFileSync(clientPath, 'utf-8')
      expect(content).toContain('SendGrid')
      expect(content).toContain('SENDGRID_API_KEY')
    })

    it('should include welcome.ts email template', () => {
      const welcomePath = path.join(sendgridDir, 'code', 'templates', 'welcome.ts')
      expect(fs.existsSync(welcomePath)).toBe(true)

      const content = fs.readFileSync(welcomePath, 'utf-8')
      expect(content).toContain('welcome')
      expect(content).toContain('subject')
      expect(content).toContain('html')
    })

    it('should include notification.ts email template', () => {
      const notificationPath = path.join(sendgridDir, 'code', 'templates', 'notification.ts')
      expect(fs.existsSync(notificationPath)).toBe(true)

      const content = fs.readFileSync(notificationPath, 'utf-8')
      expect(content).toContain('notification')
      expect(content).toContain('subject')
      expect(content).toContain('html')
    })

    it('should have sendEmail function in client', () => {
      const clientPath = path.join(sendgridDir, 'code', 'client.ts')
      const content = fs.readFileSync(clientPath, 'utf-8')

      expect(content).toContain('sendEmail')
      expect(content).toContain('to')
      expect(content).toContain('from')
    })

    it('should support template-based emails', () => {
      const clientPath = path.join(sendgridDir, 'code', 'client.ts')
      const content = fs.readFileSync(clientPath, 'utf-8')

      expect(content).toContain('template')
    })
  })

  /**
   * Test 3: Cloudinary template uploads test image
   *
   * Verify that the Cloudinary template includes image upload functionality,
   * React hooks, and upload components.
   */
  describe('Test 3: Cloudinary Template Image Upload', () => {
    const cloudinaryDir = path.join(TEMPLATES_DIR, 'cloudinary')

    it('should have cloudinary template directory', () => {
      expect(fs.existsSync(cloudinaryDir)).toBe(true)
      expect(fs.statSync(cloudinaryDir).isDirectory()).toBe(true)
    })

    it('should include cloudinary.skill.md with media triggers', () => {
      const skillPath = path.join(cloudinaryDir, 'cloudinary.skill.md')
      expect(fs.existsSync(skillPath)).toBe(true)

      const content = fs.readFileSync(skillPath, 'utf-8')
      expect(content).toContain('name: cloudinary')
      expect(content).toContain('triggers:')
      expect(content).toContain('image')
      expect(content).toContain('upload')
    })

    it('should include client.ts with Cloudinary SDK setup', () => {
      const clientPath = path.join(cloudinaryDir, 'code', 'client.ts')
      expect(fs.existsSync(clientPath)).toBe(true)

      const content = fs.readFileSync(clientPath, 'utf-8')
      expect(content).toContain('cloudinary')
      expect(content).toContain('CLOUDINARY_CLOUD_NAME')
    })

    it('should include hooks.ts with useImageUpload hook', () => {
      const hooksPath = path.join(cloudinaryDir, 'code', 'hooks.ts')
      expect(fs.existsSync(hooksPath)).toBe(true)

      const content = fs.readFileSync(hooksPath, 'utf-8')
      expect(content).toContain('useImageUpload')
      expect(content).toContain('upload')
    })

    it('should include image-upload.tsx component', () => {
      const uploadPath = path.join(cloudinaryDir, 'code', 'components', 'image-upload.tsx')
      expect(fs.existsSync(uploadPath)).toBe(true)

      const content = fs.readFileSync(uploadPath, 'utf-8')
      expect(content).toContain('ImageUpload')
      expect(content).toContain('file')
    })

    it('should support image transformations', () => {
      const clientPath = path.join(cloudinaryDir, 'code', 'client.ts')
      const content = fs.readFileSync(clientPath, 'utf-8')

      expect(content).toContain('transform')
    })

    it('should include upload progress tracking', () => {
      const hooksPath = path.join(cloudinaryDir, 'code', 'hooks.ts')
      const content = fs.readFileSync(hooksPath, 'utf-8')

      expect(content).toContain('progress')
    })
  })

  /**
   * Test 4: Templates include all required files
   *
   * Verify that each template has the complete set of files:
   * skill, code, mcp, env, and docs.
   */
  describe('Test 4: Templates Include All Required Files', () => {
    const templates = ['stripe', 'sendgrid', 'cloudinary']

    templates.forEach((template) => {
      describe(`${template} template`, () => {
        const templateDir = path.join(TEMPLATES_DIR, template)

        it('should have skill definition file', () => {
          const skillPath = path.join(templateDir, `${template}.skill.md`)
          expect(fs.existsSync(skillPath)).toBe(true)
        })

        it('should have code directory with client.ts', () => {
          const codePath = path.join(templateDir, 'code')
          expect(fs.existsSync(codePath)).toBe(true)

          const clientPath = path.join(codePath, 'client.ts')
          expect(fs.existsSync(clientPath)).toBe(true)
        })

        it('should have mcp/config.json', () => {
          const mcpPath = path.join(templateDir, 'mcp', 'config.json')
          expect(fs.existsSync(mcpPath)).toBe(true)

          const content = fs.readFileSync(mcpPath, 'utf-8')
          const config = JSON.parse(content)
          expect(config).toHaveProperty('name')
          expect(config).toHaveProperty('version')
        })

        it('should have env/.env.template', () => {
          const envPath = path.join(templateDir, 'env', '.env.template')
          expect(fs.existsSync(envPath)).toBe(true)

          const content = fs.readFileSync(envPath, 'utf-8')
          expect(content.length).toBeGreaterThan(0)
          expect(content).toContain('=')
        })

        it('should have docs/README.md', () => {
          const docsPath = path.join(templateDir, 'docs', 'README.md')
          expect(fs.existsSync(docsPath)).toBe(true)

          const content = fs.readFileSync(docsPath, 'utf-8')
          expect(content).toContain('#')
          expect(content.length).toBeGreaterThan(100)
        })

        it('should have valid skill frontmatter', () => {
          const skillPath = path.join(templateDir, `${template}.skill.md`)
          const content = fs.readFileSync(skillPath, 'utf-8')

          expect(content).toMatch(/^---/)
          expect(content).toContain('name:')
          expect(content).toContain('slug:')
          expect(content).toContain('version:')
          expect(content).toContain('category:')
          expect(content).toContain('description:')
        })

        it('should have required environment variables documented', () => {
          const envPath = path.join(templateDir, 'env', '.env.template')
          const content = fs.readFileSync(envPath, 'utf-8')

          // Each template should have API keys
          const lines = content.split('\n')
          const hasApiKey = lines.some((line) =>
            line.includes('API_KEY') || line.includes('SECRET')
          )
          expect(hasApiKey).toBe(true)
        })

        it('should have installation instructions in docs', () => {
          const docsPath = path.join(templateDir, 'docs', 'README.md')
          const content = fs.readFileSync(docsPath, 'utf-8')

          expect(
            content.toLowerCase().includes('install') ||
            content.toLowerCase().includes('setup')
          ).toBe(true)
        })
      })
    })
  })
})

/**
 * Template Loader Utility Tests
 */
describe('Template Loader Utility', () => {
  it('should export loadTemplate function', async () => {
    const loaderPath = path.join(process.cwd(), 'lib', 'templates', 'loader.ts')
    expect(fs.existsSync(loaderPath)).toBe(true)

    const content = fs.readFileSync(loaderPath, 'utf-8')
    expect(content).toContain('export')
    expect(content).toContain('loadTemplate')
  })

  it('should validate environment variables', () => {
    const loaderPath = path.join(process.cwd(), 'lib', 'templates', 'loader.ts')
    const content = fs.readFileSync(loaderPath, 'utf-8')

    expect(content).toContain('validateEnv')
  })

  it('should support copying template files', () => {
    const loaderPath = path.join(process.cwd(), 'lib', 'templates', 'loader.ts')
    const content = fs.readFileSync(loaderPath, 'utf-8')

    expect(content).toContain('copy')
  })

  it('should prompt for missing API keys', () => {
    const loaderPath = path.join(process.cwd(), 'lib', 'templates', 'loader.ts')
    const content = fs.readFileSync(loaderPath, 'utf-8')

    expect(content).toContain('prompt') || expect(content).toContain('input')
  })
})
