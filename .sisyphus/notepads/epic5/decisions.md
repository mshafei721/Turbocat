# Epic 5 Technical Decisions

## Session: 2026-01-14

### Decisions to be Made During Implementation

(Will be logged here as technical decisions arise)

---

## Pre-Approved Decisions (from Planning)

1. **Avatar Storage**: S3 or Cloudflare R2 (user preference)
2. **Avatar Size**: 256x256 px (resized server-side)
3. **Max Avatar Size**: 5MB upload limit
4. **Email Verification**: UUID tokens with 24h expiry
5. **Account Deletion**: Soft delete with `deletedAt` timestamp
6. **Password Requirements**: Min 8 chars, no complexity (user choice)
7. **Settings Tabs**: Profile, Security, OAuth, Danger Zone

---

## Expected Decision Points

1. **Avatar Processing**: Sharp vs Jimp vs ImageMagick
2. **S3 vs R2**: Cost, performance, existing infrastructure
3. **Email Service**: SendGrid vs AWS SES vs Resend vs custom SMTP
4. **Token Storage**: Redis vs Database for verification tokens
5. **Soft Delete Cleanup**: Manual vs automated (30-day TTL)
