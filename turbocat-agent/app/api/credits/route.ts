import { type NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/session/get-server-session'
import { getOrCreateUserCredits, getCreditTransactions } from '@/lib/db/credits'

/**
 * GET /api/credits
 * Get current user's credit balance and transaction history
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id
    const { searchParams } = new URL(req.url)
    const includeTransactions = searchParams.get('transactions') === 'true'
    const limit = parseInt(searchParams.get('limit') || '50', 10)
    const offset = parseInt(searchParams.get('offset') || '0', 10)

    const credits = await getOrCreateUserCredits(userId)

    const response: {
      balance: number
      totalEarned: number
      totalSpent: number
      transactions?: Awaited<ReturnType<typeof getCreditTransactions>>
    } = {
      balance: credits.balance,
      totalEarned: credits.totalEarned,
      totalSpent: credits.totalSpent,
    }

    if (includeTransactions) {
      response.transactions = await getCreditTransactions(userId, limit, offset)
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('[Credits API] Error:', error)
    return NextResponse.json({ error: 'Failed to fetch credits' }, { status: 500 })
  }
}
