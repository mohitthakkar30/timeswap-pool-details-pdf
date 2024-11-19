import { NextRequest, NextResponse } from 'next/server';
import { CONFIG } from '@/config';

export async function POST(request: NextRequest) {
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

    return NextResponse.json({ message: 'Cron job completed successfully' });
  } catch (error) {
    console.error('Error in cron job:', error);
    return NextResponse.json(
      { message: 'Error in cron job' },
      { status: 500 }
    );
  }
}