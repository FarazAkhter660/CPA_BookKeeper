import { NextResponse } from 'next/server';
import { getDb } from '@/db';

/**
 * Readiness Check Endpoint
 * Returns whether the application is ready to serve traffic
 */
export async function GET() {
  try {
    // Check database connection
    const db = getDb();
    const receipts = db.getAllReceipts();

    return NextResponse.json({
      status: 'ready',
      timestamp: new Date().toISOString(),
      checks: {
        database: 'connected',
        receipts_loaded: receipts.length,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'not_ready',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 503 }
    );
  }
}
