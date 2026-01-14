/**
 * Email Verification Service
 *
 * This service handles email verification operations including:
 * - Generating secure verification tokens
 * - Verifying email addresses with tokens
 * - Sending verification emails
 *
 * Security Features:
 * - Cryptographically secure tokens (crypto.randomBytes)
 * - Time-based expiry (24 hours)
 * - Single-use tokens (deleted after verification)
 *
 * @module services/email-verification.service
 */

import crypto from 'crypto';
import { prisma, isPrismaAvailable } from '../lib/prisma';
import { logger } from '../lib/logger';
import { ApiError } from '../utils/ApiError';

// =============================================================================
// CONSTANTS
// =============================================================================

/**
 * Verification token expiry duration in milliseconds (24 hours)
 */
const TOKEN_EXPIRY_MS = 24 * 60 * 60 * 1000;

/**
 * Token length in bytes (32 bytes = 64 hex characters)
 */
const TOKEN_BYTES = 32;

// =============================================================================
// TOKEN GENERATION
// =============================================================================

/**
 * Generate a cryptographically secure verification token
 *
 * Uses Node.js crypto.randomBytes for secure random token generation.
 * Tokens are 64 hex characters (32 bytes) for high entropy.
 *
 * @param userId - User ID to generate token for
 * @returns Promise<string> - The generated token (64 hex characters)
 * @throws ApiError if user not found or database unavailable
 */
export const generateVerificationToken = async (userId: string): Promise<string> => {
  if (!isPrismaAvailable() || !prisma) {
    throw ApiError.serviceUnavailable('Database not available');
  }

  // Find user
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user || user.deletedAt) {
    throw ApiError.notFound('User not found');
  }

  // Generate cryptographically secure token
  const token = crypto.randomBytes(TOKEN_BYTES).toString('hex');

  // Calculate expiry (24 hours from now)
  const expiry = new Date(Date.now() + TOKEN_EXPIRY_MS);

  // Store token and expiry in database
  await prisma.user.update({
    where: { id: userId },
    data: {
      verificationToken: token,
      verificationTokenExpiry: expiry,
    },
  });

  logger.info('[Email Verification] Token generated:', {
    userId,
    expiresAt: expiry.toISOString(),
  });

  return token;
};

// =============================================================================
// EMAIL VERIFICATION
// =============================================================================

/**
 * Verify user email with token
 *
 * Validates the token, checks expiry, and marks the email as verified.
 * Token is deleted after successful verification (single-use).
 *
 * @param token - Verification token (64 hex characters)
 * @returns Promise<void>
 * @throws ApiError if token invalid, expired, or database unavailable
 */
export const verifyEmail = async (token: string): Promise<void> => {
  if (!isPrismaAvailable() || !prisma) {
    throw ApiError.serviceUnavailable('Database not available');
  }

  // Find user by token
  const user = await prisma.user.findUnique({
    where: { verificationToken: token },
  });

  if (!user || user.deletedAt) {
    throw ApiError.badRequest('Invalid or expired verification token');
  }

  // Check if token has expired
  if (!user.verificationTokenExpiry || user.verificationTokenExpiry < new Date()) {
    // Clean up expired token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        verificationToken: null,
        verificationTokenExpiry: null,
      },
    });

    throw ApiError.badRequest('Verification token has expired. Please request a new one.');
  }

  // Mark email as verified and delete token (single-use)
  await prisma.user.update({
    where: { id: user.id },
    data: {
      emailVerified: true,
      emailVerifiedAt: new Date(),
      verificationToken: null,
      verificationTokenExpiry: null,
    },
  });

  logger.info('[Email Verification] Email verified:', {
    userId: user.id,
    email: user.email,
  });
};

// =============================================================================
// EMAIL SENDING
// =============================================================================

/**
 * Send verification email to user
 *
 * In development: Logs token to console for testing
 * In production: Would send actual email via email service (Resend, SendGrid, etc.)
 *
 * @param userId - User ID
 * @param email - User email address
 * @param token - Verification token
 * @returns Promise<void>
 */
export const sendVerificationEmail = async (
  userId: string,
  email: string,
  token: string,
): Promise<void> => {
  // Development: Log to console
  if (process.env.NODE_ENV === 'development') {
    const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email?token=${token}`;

    logger.info('[Email Verification] Verification email (DEV MODE):', {
      userId,
      email,
      token,
      verificationUrl,
    });

    /* eslint-disable no-console */
    console.log('\n='.repeat(80));
    console.log('EMAIL VERIFICATION TOKEN (Development Mode)');
    console.log('='.repeat(80));
    console.log(`To: ${email}`);
    console.log(`Token: ${token}`);
    console.log(`Verification URL: ${verificationUrl}`);
    console.log('='.repeat(80) + '\n');
    /* eslint-enable no-console */

    return Promise.resolve();
  }

  // Production: Send actual email
  // TODO: Integrate email service (Resend, SendGrid, etc.)
  // Example:
  // await emailService.send({
  //   to: email,
  //   subject: 'Verify Your Email Address',
  //   template: 'email-verification',
  //   data: { verificationUrl }
  // });

  logger.warn('[Email Verification] Email service not configured. Email not sent:', {
    userId,
    email,
  });

  return Promise.resolve();
};

// =============================================================================
// EXPORTS
// =============================================================================

export default {
  generateVerificationToken,
  verifyEmail,
  sendVerificationEmail,
};
