import { type NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/session/get-server-session'
import { getCreditTransactions } from '@/lib/db/credits'

/**
 * GET /api/credits/transactions
 * Get current user's credit transaction history
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id
    const { searchParams } = new URL(req.url)
    const limit = parseInt(searchParams.get('limit') || '50', 10)
    const offset = parseInt(searchParams.get('offset') || '0', 10)

    const transactions = await getCreditTransactions(userId, limit, offset)

    return NextResponse.json({ transactions })
  } catch (error) {
    console.error('[Credits Transactions API] Error:', error)
    return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 })
  }
}
