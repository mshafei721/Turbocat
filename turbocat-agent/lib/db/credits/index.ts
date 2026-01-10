import 'server-only'

import { db } from '../client'
import {
  credits,
  creditTransactions,
  referrals,
  referralCodes,
  promoCodes,
  promoCodeRedemptions,
  type InsertCredit,
  type InsertCreditTransaction,
  type InsertReferral,
  type InsertReferralCode,
  type InsertPromoCodeRedemption,
} from '../schema'
import { eq, and, desc, sql } from 'drizzle-orm'
import { nanoid } from 'nanoid'

// ============================================================================
// Credits Operations
// ============================================================================

/**
 * Get or create user credits record
 */
export async function getOrCreateUserCredits(userId: string) {
  const existing = await db.select().from(credits).where(eq(credits.userId, userId)).limit(1)

  if (existing.length > 0) {
    return existing[0]
  }

  // Create new credits record with 0 balance
  const newCredits: InsertCredit = {
    id: nanoid(),
    userId,
    balance: 0,
    totalEarned: 0,
    totalSpent: 0,
  }

  await db.insert(credits).values(newCredits)
  return { ...newCredits, createdAt: new Date(), updatedAt: new Date() }
}

/**
 * Get user credit balance
 */
export async function getUserCreditBalance(userId: string): Promise<number> {
  const userCredits = await getOrCreateUserCredits(userId)
  return userCredits.balance
}

/**
 * Add credits to user balance
 */
export async function addCredits(
  userId: string,
  amount: number,
  type: InsertCreditTransaction['type'],
  description?: string,
  referenceId?: string,
  referenceType?: InsertCreditTransaction['referenceType'],
): Promise<{ newBalance: number; transactionId: string }> {
  const userCredits = await getOrCreateUserCredits(userId)
  const newBalance = userCredits.balance + amount

  // Update credits
  await db
    .update(credits)
    .set({
      balance: newBalance,
      totalEarned: userCredits.totalEarned + amount,
      updatedAt: new Date(),
    })
    .where(eq(credits.userId, userId))

  // Record transaction
  const transactionId = nanoid()
  const transaction: InsertCreditTransaction = {
    id: transactionId,
    userId,
    amount,
    type,
    description,
    referenceId,
    referenceType,
    balanceAfter: newBalance,
  }

  await db.insert(creditTransactions).values(transaction)

  return { newBalance, transactionId }
}

/**
 * Deduct credits from user balance
 */
export async function deductCredits(
  userId: string,
  amount: number,
  type: InsertCreditTransaction['type'],
  description?: string,
  referenceId?: string,
  referenceType?: InsertCreditTransaction['referenceType'],
): Promise<{ success: boolean; newBalance: number; transactionId?: string; error?: string }> {
  const userCredits = await getOrCreateUserCredits(userId)

  if (userCredits.balance < amount) {
    return {
      success: false,
      newBalance: userCredits.balance,
      error: 'Insufficient credits',
    }
  }

  const newBalance = userCredits.balance - amount

  // Update credits
  await db
    .update(credits)
    .set({
      balance: newBalance,
      totalSpent: userCredits.totalSpent + amount,
      updatedAt: new Date(),
    })
    .where(eq(credits.userId, userId))

  // Record transaction (negative amount)
  const transactionId = nanoid()
  const transaction: InsertCreditTransaction = {
    id: transactionId,
    userId,
    amount: -amount,
    type,
    description,
    referenceId,
    referenceType,
    balanceAfter: newBalance,
  }

  await db.insert(creditTransactions).values(transaction)

  return { success: true, newBalance, transactionId }
}

/**
 * Get user's credit transaction history
 */
export async function getCreditTransactions(userId: string, limit = 50, offset = 0) {
  return db
    .select()
    .from(creditTransactions)
    .where(eq(creditTransactions.userId, userId))
    .orderBy(desc(creditTransactions.createdAt))
    .limit(limit)
    .offset(offset)
}

// ============================================================================
// Referral Operations
// ============================================================================

/**
 * Get or create user's referral code
 */
export async function getOrCreateReferralCode(userId: string): Promise<string> {
  const existing = await db.select().from(referralCodes).where(eq(referralCodes.userId, userId)).limit(1)

  if (existing.length > 0) {
    return existing[0].code
  }

  // Generate unique referral code
  const code = `TC${nanoid(8).toUpperCase()}`

  const newReferralCode: InsertReferralCode = {
    id: nanoid(),
    userId,
    code,
    totalReferrals: 0,
    totalCreditsEarned: 0,
  }

  await db.insert(referralCodes).values(newReferralCode)
  return code
}

/**
 * Get referral code info
 */
export async function getReferralCodeByCode(code: string) {
  const result = await db.select().from(referralCodes).where(eq(referralCodes.code, code)).limit(1)
  return result[0] || null
}

/**
 * Process a referral signup
 */
export async function processReferralSignup(
  refereeId: string,
  referralCode: string,
  referrerCredits = 100,
  refereeCredits = 50,
): Promise<{ success: boolean; error?: string }> {
  // Find the referral code
  const codeRecord = await getReferralCodeByCode(referralCode)
  if (!codeRecord) {
    return { success: false, error: 'Invalid referral code' }
  }

  // Check if referee already has a referral record
  const existingReferral = await db.select().from(referrals).where(eq(referrals.refereeId, refereeId)).limit(1)

  if (existingReferral.length > 0) {
    return { success: false, error: 'User already has a referral' }
  }

  // Prevent self-referral
  if (codeRecord.userId === refereeId) {
    return { success: false, error: 'Cannot use your own referral code' }
  }

  // Create referral record
  const referral: InsertReferral = {
    id: nanoid(),
    referrerId: codeRecord.userId,
    refereeId,
    referralCode,
    status: 'completed',
    creditsEarned: referrerCredits,
    completedAt: new Date(),
  }

  await db.insert(referrals).values(referral)

  // Update referral code stats
  await db
    .update(referralCodes)
    .set({
      totalReferrals: codeRecord.totalReferrals + 1,
      totalCreditsEarned: codeRecord.totalCreditsEarned + referrerCredits,
    })
    .where(eq(referralCodes.id, codeRecord.id))

  // Award credits to referrer
  await addCredits(codeRecord.userId, referrerCredits, 'referral_bonus', `Referral bonus for inviting a friend`, referral.id, 'referral')

  // Award credits to referee
  await addCredits(refereeId, refereeCredits, 'referral_bonus', `Welcome bonus from referral`, referral.id, 'referral')

  return { success: true }
}

/**
 * Get user's referral stats
 */
export async function getUserReferralStats(userId: string) {
  const codeRecord = await db.select().from(referralCodes).where(eq(referralCodes.userId, userId)).limit(1)

  const referralList = await db
    .select()
    .from(referrals)
    .where(eq(referrals.referrerId, userId))
    .orderBy(desc(referrals.createdAt))

  return {
    code: codeRecord[0]?.code || null,
    totalReferrals: codeRecord[0]?.totalReferrals || 0,
    totalCreditsEarned: codeRecord[0]?.totalCreditsEarned || 0,
    referrals: referralList,
  }
}

// ============================================================================
// Promo Code Operations
// ============================================================================

/**
 * Validate and get promo code
 */
export async function validatePromoCode(code: string) {
  const promo = await db.select().from(promoCodes).where(eq(promoCodes.code, code.toUpperCase())).limit(1)

  if (promo.length === 0) {
    return { valid: false, error: 'Invalid promo code' }
  }

  const promoCode = promo[0]

  if (!promoCode.isActive) {
    return { valid: false, error: 'Promo code is no longer active' }
  }

  if (promoCode.startsAt && promoCode.startsAt > new Date()) {
    return { valid: false, error: 'Promo code is not yet active' }
  }

  if (promoCode.expiresAt && promoCode.expiresAt < new Date()) {
    return { valid: false, error: 'Promo code has expired' }
  }

  if (promoCode.maxUses && promoCode.currentUses >= promoCode.maxUses) {
    return { valid: false, error: 'Promo code has reached maximum uses' }
  }

  return { valid: true, promoCode }
}

/**
 * Redeem a promo code
 */
export async function redeemPromoCode(
  userId: string,
  code: string,
): Promise<{ success: boolean; creditsAwarded?: number; error?: string }> {
  const validation = await validatePromoCode(code)
  if (!validation.valid || !validation.promoCode) {
    return { success: false, error: validation.error }
  }

  const promoCode = validation.promoCode

  // Check if user already redeemed this code
  const existingRedemption = await db
    .select()
    .from(promoCodeRedemptions)
    .where(and(eq(promoCodeRedemptions.userId, userId), eq(promoCodeRedemptions.promoCodeId, promoCode.id)))
    .limit(1)

  if (existingRedemption.length > 0) {
    return { success: false, error: 'You have already redeemed this promo code' }
  }

  // Create redemption record
  const redemption: InsertPromoCodeRedemption = {
    id: nanoid(),
    userId,
    promoCodeId: promoCode.id,
    creditsAwarded: promoCode.creditsReward,
  }

  await db.insert(promoCodeRedemptions).values(redemption)

  // Update promo code usage count
  await db
    .update(promoCodes)
    .set({
      currentUses: promoCode.currentUses + 1,
      updatedAt: new Date(),
    })
    .where(eq(promoCodes.id, promoCode.id))

  // Award credits to user
  await addCredits(userId, promoCode.creditsReward, 'promo_code', `Promo code: ${code}`, promoCode.id, 'promo_code')

  return { success: true, creditsAwarded: promoCode.creditsReward }
}

/**
 * Get user's promo code redemption history
 */
export async function getUserPromoRedemptions(userId: string) {
  return db
    .select({
      redemption: promoCodeRedemptions,
      promoCode: promoCodes,
    })
    .from(promoCodeRedemptions)
    .innerJoin(promoCodes, eq(promoCodeRedemptions.promoCodeId, promoCodes.id))
    .where(eq(promoCodeRedemptions.userId, userId))
    .orderBy(desc(promoCodeRedemptions.redeemedAt))
}
