import { type NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/session/get-server-session'
import { getOrCreateReferralCode, getUserReferralStats, processReferralSignup } from '@/lib/db/credits'

/**
 * GET /api/referrals
 * Get current user's referral code and stats
 */
export async function GET() {
  try {
    const session = await getServerSession()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id

    // Ensure user has a referral code
    await getOrCreateReferralCode(userId)

    // Get full stats
    const stats = await getUserReferralStats(userId)

    return NextResponse.json(stats)
  } catch (error) {
    console.error('[Referrals API] Error:', error)
    return NextResponse.json({ error: 'Failed to fetch referral info' }, { status: 500 })
  }
}

/**
 * POST /api/referrals
 * Apply a referral code to current user's account
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id
    const body = await req.json()
    const { code } = body

    if (!code || typeof code !== 'string') {
      return NextResponse.json({ error: 'Referral code is required' }, { status: 400 })
    }

    const result = await processReferralSignup(userId, code.toUpperCase())

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({ success: true, message: 'Referral code applied successfully' })
  } catch (error) {
    console.error('[Referrals API] Error:', error)
    return NextResponse.json({ error: 'Failed to apply referral code' }, { status: 500 })
  }
}
