/**
 * Welcome Email Template
 *
 * Professional welcome email template for new user onboarding.
 *
 * @file templates/sendgrid/code/templates/welcome.ts
 */

import { sendEmail } from '../client'

export interface WelcomeEmailParams {
  to: string
  name: string
  loginUrl?: string
  companyName?: string
}

/**
 * Generate HTML for welcome email
 */
function generateWelcomeHtml(params: WelcomeEmailParams): string {
  const { name, loginUrl, companyName = 'Our App' } = params

  return `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to ${companyName}</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">

                <!-- Header -->
                <tr>
                  <td style="background: linear-gradient(135deg, #ff6b35 0%, #ff8c42 100%); padding: 40px 40px 30px; text-align: center;">
                    <h1 style="color: white; margin: 0; font-size: 32px; font-weight: 600;">
                      Welcome to ${companyName}!
                    </h1>
                  </td>
                </tr>

                <!-- Content -->
                <tr>
                  <td style="padding: 40px;">
                    <p style="color: #333; font-size: 16px; line-height: 1.6; margin-top: 0;">
                      Hi ${name},
                    </p>

                    <p style="color: #333; font-size: 16px; line-height: 1.6;">
                      We're thrilled to have you on board! Your account has been successfully created,
                      and you're now part of our growing community.
                    </p>

                    <p style="color: #333; font-size: 16px; line-height: 1.6;">
                      Here's what you can do next:
                    </p>

                    <ul style="color: #333; font-size: 16px; line-height: 1.8; padding-left: 20px;">
                      <li>Complete your profile</li>
                      <li>Explore our features</li>
                      <li>Connect with other users</li>
                      <li>Start your first project</li>
                    </ul>

                    ${loginUrl ? `
                      <div style="text-align: center; margin: 30px 0;">
                        <a href="${loginUrl}"
                           style="display: inline-block; background-color: #ff6b35; color: white;
                                  padding: 14px 40px; text-decoration: none; border-radius: 6px;
                                  font-weight: 600; font-size: 16px;">
                          Get Started
                        </a>
                      </div>
                    ` : ''}

                    <p style="color: #333; font-size: 16px; line-height: 1.6;">
                      If you have any questions or need help getting started, don't hesitate to reach out.
                      We're here to help!
                    </p>

                    <p style="color: #333; font-size: 16px; line-height: 1.6; margin-bottom: 0;">
                      Best regards,<br>
                      <strong>The ${companyName} Team</strong>
                    </p>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="background-color: #f9f9f9; padding: 30px 40px; text-align: center; border-top: 1px solid #e0e0e0;">
                    <p style="color: #666; font-size: 14px; line-height: 1.6; margin: 0;">
                      This email was sent to <a href="mailto:${params.to}" style="color: #ff6b35; text-decoration: none;">${params.to}</a>
                    </p>
                    <p style="color: #999; font-size: 12px; line-height: 1.6; margin: 10px 0 0;">
                      © ${new Date().getFullYear()} ${companyName}. All rights reserved.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `
}

/**
 * Generate plain text version of welcome email
 */
function generateWelcomeText(params: WelcomeEmailParams): string {
  const { name, loginUrl, companyName = 'Our App' } = params

  return `
Welcome to ${companyName}!

Hi ${name},

We're thrilled to have you on board! Your account has been successfully created, and you're now part of our growing community.

Here's what you can do next:
- Complete your profile
- Explore our features
- Connect with other users
- Start your first project

${loginUrl ? `Get started: ${loginUrl}\n` : ''}

If you have any questions or need help getting started, don't hesitate to reach out. We're here to help!

Best regards,
The ${companyName} Team

---
This email was sent to ${params.to}
© ${new Date().getFullYear()} ${companyName}. All rights reserved.
  `.trim()
}

/**
 * Send welcome email to new user
 *
 * @example
 * ```typescript
 * await sendWelcomeEmail({
 *   to: 'user@example.com',
 *   name: 'John Doe',
 *   loginUrl: 'https://app.example.com/login',
 *   companyName: 'Acme Inc',
 * })
 * ```
 */
export async function sendWelcomeEmail(params: WelcomeEmailParams) {
  const { to, name, companyName = 'Our App' } = params

  return sendEmail({
    to,
    subject: `Welcome to ${companyName}! 🎉`,
    text: generateWelcomeText(params),
    html: generateWelcomeHtml(params),
  })
}
