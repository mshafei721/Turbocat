/**
 * SendGrid Email Client
 *
 * Server-side SendGrid SDK setup and email utilities.
 * NEVER expose this client or API key to the browser.
 *
 * @file templates/sendgrid/code/client.ts
 */

import sendgrid from '@sendgrid/mail'

if (!process.env.SENDGRID_API_KEY) {
  throw new Error('SENDGRID_API_KEY is not set in environment variables')
}

// Initialize SendGrid client
sendgrid.setApiKey(process.env.SENDGRID_API_KEY)

/**
 * Default sender email address
 * Must be verified in SendGrid dashboard
 */
const DEFAULT_FROM = process.env.SENDGRID_FROM_EMAIL || 'noreply@example.com'

export interface SendEmailParams {
  to: string | string[]
  subject: string
  text?: string
  html?: string
  from?: string
  replyTo?: string
  attachments?: Array<{
    content: string
    filename: string
    type?: string
    disposition?: 'attachment' | 'inline'
  }>
  templateId?: string
  dynamicTemplateData?: Record<string, any>
}

/**
 * Send an email using SendGrid
 *
 * @example
 * ```typescript
 * await sendEmail({
 *   to: 'user@example.com',
 *   subject: 'Welcome!',
 *   html: '<p>Welcome to our app!</p>',
 * })
 * ```
 */
export async function sendEmail(params: SendEmailParams) {
  const {
    to,
    subject,
    text,
    html,
    from = DEFAULT_FROM,
    replyTo,
    attachments,
    templateId,
    dynamicTemplateData,
  } = params

  try {
    const msg: sendgrid.MailDataRequired = {
      to,
      from,
      subject,
      text,
      html,
      replyTo,
      attachments,
      templateId,
      dynamicTemplateData,
    }

    const response = await sendgrid.send(msg)

    console.log('Email sent successfully:', {
      to,
      subject,
      statusCode: response[0].statusCode,
    })

    return {
      success: true,
      messageId: response[0].headers['x-message-id'],
      statusCode: response[0].statusCode,
    }
  } catch (error) {
    console.error('Failed to send email:', error)

    if (error && typeof error === 'object' && 'response' in error) {
      const sgError = error as { response: { body: any } }
      console.error('SendGrid error details:', sgError.response?.body)
    }

    throw new Error(
      `Failed to send email: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`
    )
  }
}

/**
 * Send bulk emails to multiple recipients
 * Each recipient gets a personalized email (not a mass CC)
 */
export async function sendBulkEmail(params: {
  to: string[]
  subject: string
  text?: string
  html?: string
  from?: string
}) {
  const { to, subject, text, html, from = DEFAULT_FROM } = params

  try {
    const messages = to.map((recipient) => ({
      to: recipient,
      from,
      subject,
      text,
      html,
    }))

    const response = await sendgrid.send(messages)

    console.log(`Bulk email sent to ${to.length} recipients`)

    return {
      success: true,
      count: to.length,
      responses: response,
    }
  } catch (error) {
    console.error('Failed to send bulk email:', error)
    throw new Error(
      `Failed to send bulk email: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`
    )
  }
}

/**
 * Send email using SendGrid template
 * Templates are created and managed in SendGrid dashboard
 */
export async function sendTemplateEmail(params: {
  to: string | string[]
  templateId: string
  dynamicTemplateData: Record<string, any>
  from?: string
  subject?: string
}) {
  const { to, templateId, dynamicTemplateData, from = DEFAULT_FROM, subject } = params

  return sendEmail({
    to,
    subject: subject || '', // Subject comes from template if not provided
    from,
    templateId,
    dynamicTemplateData,
  })
}

/**
 * Send email with attachment
 */
export async function sendEmailWithAttachment(params: {
  to: string
  subject: string
  text?: string
  html?: string
  attachment: {
    content: string // Base64 encoded
    filename: string
    type?: string
  }
  from?: string
}) {
  const { to, subject, text, html, attachment, from } = params

  return sendEmail({
    to,
    subject,
    text,
    html,
    from,
    attachments: [
      {
        content: attachment.content,
        filename: attachment.filename,
        type: attachment.type || 'application/octet-stream',
        disposition: 'attachment',
      },
    ],
  })
}

/**
 * Validate email address format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Validate multiple email addresses
 */
export function validateEmails(emails: string[]): {
  valid: string[]
  invalid: string[]
} {
  const valid: string[] = []
  const invalid: string[] = []

  emails.forEach((email) => {
    if (isValidEmail(email)) {
      valid.push(email)
    } else {
      invalid.push(email)
    }
  })

  return { valid, invalid }
}

/**
 * Schedule email for later delivery
 * Note: SendGrid supports scheduled sends
 */
export async function scheduleEmail(
  params: SendEmailParams,
  sendAt: Date
) {
  const sendAtTimestamp = Math.floor(sendAt.getTime() / 1000)

  const msg: any = {
    ...params,
    from: params.from || DEFAULT_FROM,
    sendAt: sendAtTimestamp,
  }

  try {
    const response = await sendgrid.send(msg)
    console.log('Email scheduled successfully for:', sendAt)
    return {
      success: true,
      scheduledFor: sendAt,
      messageId: response[0].headers['x-message-id'],
    }
  } catch (error) {
    console.error('Failed to schedule email:', error)
    throw new Error(
      `Failed to schedule email: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`
    )
  }
}

/**
 * Send password reset email
 * Convenience function for common use case
 */
export async function sendPasswordResetEmail(params: {
  to: string
  resetUrl: string
  userName?: string
}) {
  const { to, resetUrl, userName } = params

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2>Password Reset Request</h2>
          ${userName ? `<p>Hi ${userName},</p>` : '<p>Hi,</p>'}
          <p>We received a request to reset your password. Click the button below to create a new password:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}"
               style="background-color: #ff6b35; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Reset Password
            </a>
          </div>
          <p>If you didn't request this, you can safely ignore this email.</p>
          <p>This link will expire in 1 hour.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          <p style="font-size: 12px; color: #666;">
            If the button doesn't work, copy and paste this link into your browser:<br>
            <a href="${resetUrl}">${resetUrl}</a>
          </p>
        </div>
      </body>
    </html>
  `

  return sendEmail({
    to,
    subject: 'Reset Your Password',
    html,
  })
}

/**
 * Send email verification email
 */
export async function sendVerificationEmail(params: {
  to: string
  verificationUrl: string
  userName?: string
}) {
  const { to, verificationUrl, userName } = params

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2>Verify Your Email Address</h2>
          ${userName ? `<p>Hi ${userName},</p>` : '<p>Hi,</p>'}
          <p>Thanks for signing up! Please verify your email address by clicking the button below:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}"
               style="background-color: #ff6b35; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Verify Email
            </a>
          </div>
          <p>This link will expire in 24 hours.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          <p style="font-size: 12px; color: #666;">
            If the button doesn't work, copy and paste this link into your browser:<br>
            <a href="${verificationUrl}">${verificationUrl}</a>
          </p>
        </div>
      </body>
    </html>
  `

  return sendEmail({
    to,
    subject: 'Verify Your Email Address',
    html,
  })
}
