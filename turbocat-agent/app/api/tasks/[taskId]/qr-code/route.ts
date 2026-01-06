/**
 * QR Code Generation API
 * Phase 4: Mobile Development - Task 3.5
 *
 * POST /api/tasks/:taskId/qr-code
 * - Generate QR code from Metro URL
 * - Return SVG or PNG
 * - Cache QR codes
 * - Rate limiting
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { tasks, railwayContainers } from '@/lib/db/schema'
import { eq, and, isNull } from 'drizzle-orm'
import { getServerSession } from '@/lib/session/get-server-session'
import { generateQRCode, getQRCodeCache } from '@/lib/railway'
import { QRCodeOptions } from '@/lib/railway/types'

// Simple rate limiter (in production, use Redis or similar)
const rateLimiter = new Map<string, { count: number; resetAt: number }>()
const RATE_LIMIT_MAX = 10 // requests per window
const RATE_LIMIT_WINDOW = 60 * 1000 // 1 minute

function checkRateLimit(userId: string): { allowed: boolean; remaining: number; resetIn: number } {
  const now = Date.now()
  const userLimit = rateLimiter.get(userId)

  if (!userLimit || now > userLimit.resetAt) {
    // Reset or create new window
    rateLimiter.set(userId, { count: 1, resetAt: now + RATE_LIMIT_WINDOW })
    return { allowed: true, remaining: RATE_LIMIT_MAX - 1, resetIn: RATE_LIMIT_WINDOW }
  }

  if (userLimit.count >= RATE_LIMIT_MAX) {
    return { allowed: false, remaining: 0, resetIn: userLimit.resetAt - now }
  }

  userLimit.count++
  return { allowed: true, remaining: RATE_LIMIT_MAX - userLimit.count, resetIn: userLimit.resetAt - now }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ taskId: string }> },
) {
  try {
    const session = await getServerSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check rate limit
    const rateLimit = checkRateLimit(session.user.id)
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded', resetIn: Math.ceil(rateLimit.resetIn / 1000) },
        {
          status: 429,
          headers: {
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': String(Math.ceil(rateLimit.resetIn / 1000)),
          },
        },
      )
    }

    const { taskId } = await params

    // Parse request body for options
    let options: QRCodeOptions = {}
    try {
      const body = await request.json()
      options = {
        size: body.size,
        format: body.format,
        errorCorrectionLevel: body.errorCorrectionLevel,
        margin: body.margin,
      }
    } catch {
      // No body or invalid JSON - use defaults
    }

    // Fetch task to verify ownership
    const taskResult = await db
      .select()
      .from(tasks)
      .where(and(eq(tasks.id, taskId), eq(tasks.userId, session.user.id), isNull(tasks.deletedAt)))
      .limit(1)

    if (!taskResult || taskResult.length === 0) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    const task = taskResult[0]

    // Check for Metro URL - first check railway container
    let metroUrl: string | null = null

    // Check if there's a Railway container for this task
    const containerResult = await db
      .select()
      .from(railwayContainers)
      .where(eq(railwayContainers.taskId, taskId))
      .limit(1)

    if (containerResult && containerResult.length > 0) {
      metroUrl = containerResult[0].metroUrl
    }

    // Fall back to sandbox URL for Expo projects
    if (!metroUrl && task.sandboxUrl) {
      // Check if it's an Expo project (mobile platform)
      if (task.platform === 'mobile' || task.platform === 'ios' || task.platform === 'android') {
        metroUrl = task.sandboxUrl
      }
    }

    if (!metroUrl) {
      return NextResponse.json(
        { error: 'No Metro bundler URL found for this task' },
        { status: 400 },
      )
    }

    // Check cache first
    const cache = getQRCodeCache()
    const cacheKey = `${taskId}:${options.format || 'svg'}:${options.size || 300}`

    const cachedResult = cache.get(cacheKey)
    if (cachedResult) {
      return NextResponse.json(
        {
          ...cachedResult,
          cached: true,
        },
        {
          headers: {
            'X-RateLimit-Remaining': String(rateLimit.remaining),
            'Cache-Control': 'public, max-age=3600',
          },
        },
      )
    }

    // Generate QR code
    const qrResult = await generateQRCode(metroUrl, options)

    // Cache the result
    cache.set(cacheKey, qrResult, 60 * 60 * 1000) // 1 hour TTL

    return NextResponse.json(
      {
        ...qrResult,
        cached: false,
      },
      {
        headers: {
          'X-RateLimit-Remaining': String(rateLimit.remaining),
          'Cache-Control': 'public, max-age=3600',
        },
      },
    )
  } catch (error) {
    console.error('Error generating QR code:', error)
    return NextResponse.json(
      { error: 'Failed to generate QR code' },
      { status: 500 },
    )
  }
}

// GET method for retrieving cached QR code
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ taskId: string }> },
) {
  try {
    const session = await getServerSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { taskId } = await params

    // Verify task ownership
    const taskResult = await db
      .select()
      .from(tasks)
      .where(and(eq(tasks.id, taskId), eq(tasks.userId, session.user.id), isNull(tasks.deletedAt)))
      .limit(1)

    if (!taskResult || taskResult.length === 0) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    // Check cache for SVG (default format)
    const cache = getQRCodeCache()
    const cacheKey = `${taskId}:svg:300`
    const cachedResult = cache.get(cacheKey)

    if (cachedResult) {
      return NextResponse.json({
        ...cachedResult,
        cached: true,
      })
    }

    // No cached result - client should POST to generate
    return NextResponse.json(
      { error: 'QR code not generated yet. Use POST to generate.' },
      { status: 404 },
    )
  } catch (error) {
    console.error('Error retrieving QR code:', error)
    return NextResponse.json(
      { error: 'Failed to retrieve QR code' },
      { status: 500 },
    )
  }
}
