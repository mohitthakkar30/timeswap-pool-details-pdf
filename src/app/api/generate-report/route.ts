import { NextRequest, NextResponse } from 'next/server';
import { pools } from '@/types/pools';
import { generatePDF } from '@/lib/pdf';
import { ApiResponse } from '@/types/pools';
import { CONFIG } from '@/config';
import fs from 'fs';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const cronSecret = request.headers.get('x-cron-secret');
    if (cronSecret !== CONFIG.CRON_SECRET) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Fetch data from all pools
    const poolsData: ApiResponse[] = await Promise.all(
      pools.map(async (pool) => {
        const response = await fetch(pool.summary_url);
        if (!response.ok) {
          throw new Error(`Failed to fetch data for pool: ${pool.name}`);
        }
        return response.json();
      })
    );

    // Generate PDF
    const pdfBlob = await generatePDF(poolsData);

    // Save PDF
    const timestamp = new Date().toISOString().split('T')[0];
    const fileName = `${CONFIG.PDF_CONFIG.FILE_PREFIX}-${timestamp}.pdf`;
    const filePath = path.join(process.cwd(), 'public', CONFIG.PDF_CONFIG.DIRECTORY, fileName);

    fs.mkdirSync(path.join(process.cwd(), 'public', CONFIG.PDF_CONFIG.DIRECTORY), { recursive: true });
    const arrayBuffer = await pdfBlob.arrayBuffer();
    fs.writeFileSync(filePath, Buffer.from(arrayBuffer));

    return NextResponse.json({ 
      message: 'Report generated successfully', 
      fileName 
    });
  } catch (error) {
    console.error('Error generating report:', error);
    return NextResponse.json(
      { message: 'Error generating report', error: (error as Error).message },
      { status: 500 }
    );
  }
}