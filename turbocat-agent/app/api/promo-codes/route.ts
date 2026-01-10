import { type NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/session/get-server-session'
import { validatePromoCode, redeemPromoCode, getUserPromoRedemptions } from '@/lib/db/credits'

/**
 * GET /api/promo-codes
 * Get current user's promo code redemption history
 */
export async function GET() {
  try {
    const session = await getServerSession()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id
    const redemptions = await getUserPromoRedemptions(userId)

    return NextResponse.json({ redemptions })
  } catch (error) {
    console.error('[Promo Codes API] Error:', error)
    return NextResponse.json({ error: 'Failed to fetch promo code history' }, { status: 500 })
  }
}

/**
 * POST /api/promo-codes
 * Redeem a promo code
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
      return NextResponse.json({ error: 'Promo code is required' }, { status: 400 })
    }

    const result = await redeemPromoCode(userId, code)

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      creditsAwarded: result.creditsAwarded,
      message: `Successfully redeemed ${result.creditsAwarded} credits!`,
    })
  } catch (error) {
    console.error('[Promo Codes API] Error:', error)
    return NextResponse.json({ error: 'Failed to redeem promo code' }, { status: 500 })
  }
}
