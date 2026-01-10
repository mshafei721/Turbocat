import { type NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/session/get-server-session'
import { validatePromoCode } from '@/lib/db/credits'

/**
 * POST /api/promo-codes/validate
 * Validate a promo code without redeeming it
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { code } = body

    if (!code || typeof code !== 'string') {
      return NextResponse.json({ error: 'Promo code is required' }, { status: 400 })
    }

    const result = await validatePromoCode(code)

    if (!result.valid) {
      return NextResponse.json({ valid: false, error: result.error }, { status: 200 })
    }

    return NextResponse.json({
      valid: true,
      creditsReward: result.promoCode?.creditsReward,
      description: result.promoCode?.description,
    })
  } catch (error) {
    console.error('[Promo Codes Validate API] Error:', error)
    return NextResponse.json({ error: 'Failed to validate promo code' }, { status: 500 })
  }
}
