# SendGrid Integration Template

Complete SendGrid email integration for Next.js applications with pre-built email templates and transactional email support.

## Quick Start

### 1. Install Dependencies

```bash
npm install @sendgrid/mail
```

### 2. Get SendGrid API Key

1. Go to [SendGrid Dashboard](https://app.sendgrid.com)
2. Navigate to Settings → API Keys
3. Click "Create API Key"
4. Give it a name and select "Full Access" (or limited permissions)
5. Copy the API key (you won't be able to see it again)

### 3. Verify Sender Email

**Important:** SendGrid requires sender email verification.

1. Go to Settings → Sender Authentication
2. Click "Verify a Single Sender"
3. Fill in your details
4. Check your email for verification link
5. Click the verification link

### 4. Configure Environment Variables

```bash
cp templates/sendgrid/env/.env.template .env.local
```

Add your SendGrid credentials:

```env
SENDGRID_API_KEY=SG.your-api-key-here
SENDGRID_FROM_EMAIL=verified@yourdomain.com
```

### 5. Copy Template Files

```bash
# Using template loader
npx tsx scripts/load-template.ts sendgrid

# Or manually
cp -r templates/sendgrid/code/* lib/sendgrid/
```

## Usage Examples

### Send Basic Email

```typescript
import { sendEmail } from '@/lib/sendgrid/client'

await sendEmail({
  to: 'user@example.com',
  subject: 'Hello from SendGrid',
  text: 'This is a plain text email',
  html: '<p>This is an <strong>HTML</strong> email</p>',
})
```

### Send Welcome Email

```typescript
import { sendWelcomeEmail } from '@/lib/sendgrid/templates/welcome'

await sendWelcomeEmail({
  to: 'newuser@example.com',
  name: 'John Doe',
  loginUrl: 'https://app.example.com/login',
  companyName: 'Acme Inc',
})
```

### Send Notification Email

```typescript
import { sendNotificationEmail } from '@/lib/sendgrid/templates/notification'

await sendNotificationEmail({
  to: 'user@example.com',
  title: 'New Message',
  message: 'You have received a new message from Jane.',
  actionUrl: 'https://app.example.com/messages/123',
  actionText: 'View Message',
  priority: 'high',
  userName: 'John',
})
```

### Send Bulk Emails

```typescript
import { sendBulkEmail } from '@/lib/sendgrid/client'

await sendBulkEmail({
  to: [
    'user1@example.com',
    'user2@example.com',
    'user3@example.com',
  ],
  subject: 'Important Announcement',
  html: '<p>This is sent to multiple recipients</p>',
})
```

### Send Password Reset Email

```typescript
import { sendPasswordResetEmail } from '@/lib/sendgrid/client'

await sendPasswordResetEmail({
  to: 'user@example.com',
  resetUrl: 'https://app.example.com/reset?token=abc123',
  userName: 'John Doe',
})
```

### Send Email with Attachment

```typescript
import { sendEmailWithAttachment } from '@/lib/sendgrid/client'
import fs from 'fs'

const fileContent = fs.readFileSync('invoice.pdf')
const base64Content = fileContent.toString('base64')

await sendEmailWithAttachment({
  to: 'user@example.com',
  subject: 'Your Invoice',
  html: '<p>Please find your invoice attached.</p>',
  attachment: {
    content: base64Content,
    filename: 'invoice.pdf',
    type: 'application/pdf',
  },
})
```

### Send Scheduled Email

```typescript
import { scheduleEmail } from '@/lib/sendgrid/client'

const sendDate = new Date()
sendDate.setHours(sendDate.getHours() + 2) // Send in 2 hours

await scheduleEmail(
  {
    to: 'user@example.com',
    subject: 'Scheduled Email',
    html: '<p>This email was scheduled</p>',
  },
  sendDate
)
```

## API Routes

Create API routes for sending emails from your frontend:

### `/app/api/email/send/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { sendEmail } from '@/lib/sendgrid/client'

export async function POST(request: NextRequest) {
  try {
    const { to, subject, message } = await request.json()

    await sendEmail({
      to,
      subject,
      html: message,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to send email' },
      { status: 500 }
    )
  }
}
```

### `/app/api/email/welcome/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { sendWelcomeEmail } from '@/lib/sendgrid/templates/welcome'

export async function POST(request: NextRequest) {
  try {
    const { to, name } = await request.json()

    await sendWelcomeEmail({
      to,
      name,
      loginUrl: `${process.env.NEXT_PUBLIC_URL}/login`,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to send welcome email' },
      { status: 500 }
    )
  }
}
```

## Email Templates

### Creating Custom Templates

Follow this pattern to create custom email templates:

```typescript
// lib/sendgrid/templates/custom.ts
import { sendEmail } from '../client'

export interface CustomEmailParams {
  to: string
  // ... your custom params
}

function generateCustomHtml(params: CustomEmailParams): string {
  return `
    <!DOCTYPE html>
    <html>
      <body>
        <!-- Your custom HTML -->
      </body>
    </html>
  `
}

export async function sendCustomEmail(params: CustomEmailParams) {
  return sendEmail({
    to: params.to,
    subject: 'Your Subject',
    html: generateCustomHtml(params),
  })
}
```

### Email Template Best Practices

1. **Use inline CSS** - Email clients don't support external stylesheets
2. **Use tables for layout** - More reliable than divs in email
3. **Keep width under 600px** - Optimal for most email clients
4. **Include plain text version** - For accessibility and spam filters
5. **Test in multiple clients** - Use tools like Litmus or Email on Acid
6. **Add unsubscribe link** - Required by law in many jurisdictions

## Testing

### Test Email Delivery

```typescript
import { sendEmail } from '@/lib/sendgrid/client'

// Send to yourself for testing
await sendEmail({
  to: 'your-email@example.com',
  subject: 'Test Email',
  html: '<p>Testing SendGrid integration</p>',
})
```

### Email Validation

```typescript
import { isValidEmail, validateEmails } from '@/lib/sendgrid/client'

// Validate single email
if (isValidEmail('user@example.com')) {
  // Send email
}

// Validate multiple emails
const { valid, invalid } = validateEmails([
  'user1@example.com',
  'invalid-email',
  'user2@example.com',
])

console.log('Valid:', valid)   // ['user1@example.com', 'user2@example.com']
console.log('Invalid:', invalid) // ['invalid-email']
```

## Monitoring

### Check Email Activity

1. Go to [SendGrid Dashboard](https://app.sendgrid.com)
2. Navigate to Activity
3. View sent, delivered, bounced, and opened emails

### Handle Bounces and Spam Reports

```typescript
// Set up webhook to receive bounce/spam notifications
// app/api/sendgrid/webhook/route.ts

export async function POST(request: Request) {
  const events = await request.json()

  for (const event of events) {
    switch (event.event) {
      case 'bounce':
        // Handle bounce
        console.log('Email bounced:', event.email)
        break
      case 'spamreport':
        // Handle spam report
        console.log('Spam report:', event.email)
        break
    }
  }

  return new Response('OK', { status: 200 })
}
```

## Best Practices

### Rate Limiting

Implement rate limiting to prevent abuse:

```typescript
// Simple in-memory rate limiter (use Redis in production)
const emailRateLimiter = new Map<string, number>()

export async function sendEmailWithRateLimit(
  to: string,
  params: any
) {
  const now = Date.now()
  const lastSent = emailRateLimiter.get(to) || 0

  // Allow one email per minute
  if (now - lastSent < 60000) {
    throw new Error('Rate limit exceeded')
  }

  emailRateLimiter.set(to, now)
  return sendEmail({ to, ...params })
}
```

### Error Handling

```typescript
try {
  await sendEmail({
    to: 'user@example.com',
    subject: 'Test',
    html: '<p>Test</p>',
  })
} catch (error) {
  if (error.response) {
    console.error('SendGrid error:', error.response.body)
  }
  // Implement retry logic or fallback
}
```

### Unsubscribe Links

Always include unsubscribe links:

```html
<p style="font-size: 12px; color: #999;">
  Don't want to receive these emails?
  <a href="https://app.example.com/unsubscribe?email=${email}">
    Unsubscribe
  </a>
</p>
```

## Production Checklist

- [ ] Verify sender email address
- [ ] Set up domain authentication (SPF, DKIM, DMARC)
- [ ] Configure IP whitelisting if needed
- [ ] Set up email event webhooks
- [ ] Implement rate limiting
- [ ] Add unsubscribe functionality
- [ ] Test all email templates
- [ ] Set up monitoring and alerts
- [ ] Review SendGrid compliance requirements
- [ ] Configure bounce and spam handling

## Troubleshooting

### Emails Not Delivering

1. **Check SendGrid Activity** - See if email was accepted
2. **Verify sender email** - Must be verified in SendGrid
3. **Check spam folder** - Emails might be marked as spam
4. **Review domain authentication** - SPF/DKIM not set up
5. **Check API key permissions** - Ensure key has send permissions

### Invalid API Key Error

- Verify API key is correct
- Check key hasn't been deleted
- Ensure key has proper permissions
- Restart your development server

### Rate Limit Exceeded

- SendGrid has sending limits based on your plan
- Check your plan limits in dashboard
- Implement proper rate limiting
- Consider upgrading plan if needed

## Resources

- [SendGrid Documentation](https://docs.sendgrid.com)
- [SendGrid Dashboard](https://app.sendgrid.com)
- [Email Best Practices](https://sendgrid.com/resource/email-best-practices/)
- [API Reference](https://docs.sendgrid.com/api-reference)
- [Deliverability Guide](https://sendgrid.com/resource/email-deliverability-guide/)

## Support

For issues or questions:
- Check [SendGrid Documentation](https://docs.sendgrid.com)
- Visit [SendGrid Support](https://support.sendgrid.com)
- Ask in [SendGrid Community](https://community.sendgrid.com)
