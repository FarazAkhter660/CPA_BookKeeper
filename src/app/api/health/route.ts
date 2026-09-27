import { NextResponse } from 'next/server';

/**
 * Health Check Endpoint
 * Returns whether the application is alive
 */
export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
}
