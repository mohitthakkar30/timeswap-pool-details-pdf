import { NextResponse } from 'next/server';
import { CONFIG } from '@/config';

export async function POST() {
  try {
    const response = await fetch(`${CONFIG.BASE_URL}/api/generate-report`, {
      method: 'POST',
      headers: {
        'x-cron-secret': CONFIG.CRON_SECRET,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to generate report');
    }

    return NextResponse.json({ message: 'Report generation triggered successfully' });
  } catch (error) {
    console.error('Error triggering report:', error);
    return NextResponse.json(
      { message: 'Error triggering report', error: (error as Error).message },
      { status: 500 }
    );
  }
}