import { type NextRequest } from 'next/server'

export async function GET(req: NextRequest): Promise<Response> {
  // Return safe debug info (no secrets)
  return Response.json({
    timestamp: new Date().toISOString(),
    appUrl: process.env.APP_URL ? 'SET' : 'NOT_SET',
    nextPublicAppUrl: process.env.NEXT_PUBLIC_APP_URL ? 'SET' : 'NOT_SET',
    nodeEnv: process.env.NODE_ENV,
    requestOrigin: req.nextUrl.origin,
  })
}
