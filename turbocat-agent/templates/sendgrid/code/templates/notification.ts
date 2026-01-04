/**
 * Notification Email Template
 *
 * Generic notification template for alerts, updates, and important messages.
 *
 * @file templates/sendgrid/code/templates/notification.ts
 */

import { sendEmail } from '../client'

export interface NotificationEmailParams {
  to: string
  title: string
  message: string
  actionUrl?: string
  actionText?: string
  priority?: 'low' | 'medium' | 'high'
  userName?: string
}

/**
 * Generate HTML for notification email
 */
function generateNotificationHtml(params: NotificationEmailParams): string {
  const { title, message, actionUrl, actionText, priority = 'medium', userName } = params

  const priorityColors = {
    low: '#4CAF50',
    medium: '#ff6b35',
    high: '#f44336',
  }

  const priorityColor = priorityColors[priority]

  return `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title}</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">

                <!-- Priority Bar -->
                <tr>
                  <td style="height: 4px; background-color: ${priorityColor};"></td>
                </tr>

                <!-- Content -->
                <tr>
                  <td style="padding: 40px;">
                    ${userName ? `
                      <p style="color: #333; font-size: 16px; line-height: 1.6; margin-top: 0;">
                        Hi ${userName},
                      </p>
                    ` : ''}

                    <h2 style="color: #333; font-size: 24px; font-weight: 600; margin: ${userName ? '20px' : '0'} 0 20px;">
                      ${title}
                    </h2>

                    <div style="color: #333; font-size: 16px; line-height: 1.6;">
                      ${message.split('\n').map(line => `<p style="margin: 10px 0;">${line}</p>`).join('')}
                    </div>

                    ${actionUrl && actionText ? `
                      <div style="text-align: center; margin: 30px 0;">
                        <a href="${actionUrl}"
                           style="display: inline-block; background-color: ${priorityColor}; color: white;
                                  padding: 14px 40px; text-decoration: none; border-radius: 6px;
                                  font-weight: 600; font-size: 16px;">
                          ${actionText}
                        </a>
                      </div>
                    ` : ''}

                    <p style="color: #666; font-size: 14px; line-height: 1.6; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
                      You're receiving this notification because of your account settings.
                      You can manage your notification preferences in your account settings.
                    </p>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="background-color: #f9f9f9; padding: 20px 40px; text-align: center; border-top: 1px solid #e0e0e0;">
                    <p style="color: #999; font-size: 12px; line-height: 1.6; margin: 0;">
                      © ${new Date().getFullYear()} Our App. All rights reserved.
                    </p>
                  </td>
                </tr>
              </table>

              ${actionUrl ? `
                <p style="color: #666; font-size: 12px; line-height: 1.6; margin: 20px 0 0; max-width: 600px;">
                  If the button doesn't work, copy and paste this link into your browser:<br>
                  <a href="${actionUrl}" style="color: ${priorityColor}; word-break: break-all;">${actionUrl}</a>
                </p>
              ` : ''}
            </td>
          </tr>
        </table>
      </body>
    </html>
  `
}

/**
 * Generate plain text version of notification email
 */
function generateNotificationText(params: NotificationEmailParams): string {
  const { title, message, actionUrl, actionText, userName } = params

  let text = ''

  if (userName) {
    text += `Hi ${userName},\n\n`
  }

  text += `${title}\n\n`
  text += `${message}\n\n`

  if (actionUrl && actionText) {
    text += `${actionText}: ${actionUrl}\n\n`
  }

  text += `---\n`
  text += `You're receiving this notification because of your account settings.\n`
  text += `You can manage your notification preferences in your account settings.\n\n`
  text += `© ${new Date().getFullYear()} Our App. All rights reserved.`

  return text
}

/**
 * Send notification email
 *
 * @example
 * ```typescript
 * await sendNotificationEmail({
 *   to: 'user@example.com',
 *   title: 'New Message Received',
 *   message: 'You have received a new message from John Doe.',
 *   actionUrl: 'https://app.example.com/messages/123',
 *   actionText: 'View Message',
 *   priority: 'high',
 *   userName: 'Jane',
 * })
 * ```
 */
export async function sendNotificationEmail(params: NotificationEmailParams) {
  const { to, title, priority = 'medium' } = params

  const priorityPrefix = {
    low: '',
    medium: '',
    high: '[URGENT] ',
  }

  return sendEmail({
    to,
    subject: `${priorityPrefix[priority]}${title}`,
    text: generateNotificationText(params),
    html: generateNotificationHtml(params),
  })
}

/**
 * Send multiple notifications as digest
 */
export async function sendNotificationDigest(params: {
  to: string
  userName?: string
  notifications: Array<{
    title: string
    message: string
    actionUrl?: string
  }>
}) {
  const { to, userName, notifications } = params

  const html = `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Notification Digest</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                <tr>
                  <td style="padding: 40px;">
                    ${userName ? `<p style="color: #333; font-size: 16px; margin-top: 0;">Hi ${userName},</p>` : ''}
                    <h2 style="color: #333; font-size: 24px; margin: 10px 0 20px;">You have ${notifications.length} new notification${notifications.length > 1 ? 's' : ''}</h2>
                    ${notifications.map((notification, index) => `
                      <div style="border-left: 3px solid #ff6b35; padding: 15px; margin: ${index > 0 ? '20px' : '0'} 0; background-color: #f9f9f9;">
                        <h3 style="color: #333; font-size: 18px; margin: 0 0 10px;">${notification.title}</h3>
                        <p style="color: #666; font-size: 14px; margin: 0 0 10px;">${notification.message}</p>
                        ${notification.actionUrl ? `
                          <a href="${notification.actionUrl}" style="color: #ff6b35; text-decoration: none; font-weight: 600;">View →</a>
                        ` : ''}
                      </div>
                    `).join('')}
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `

  const text = `
${userName ? `Hi ${userName},\n\n` : ''}You have ${notifications.length} new notification${notifications.length > 1 ? 's' : ''}

${notifications.map((n, i) => `
${i + 1}. ${n.title}
${n.message}
${n.actionUrl ? `View: ${n.actionUrl}` : ''}
`).join('\n')}
  `.trim()

  return sendEmail({
    to,
    subject: `You have ${notifications.length} new notification${notifications.length > 1 ? 's' : ''}`,
    text,
    html,
  })
}
