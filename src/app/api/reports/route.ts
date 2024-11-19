import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { CONFIG } from '@/config';

export async function GET() {
  try {
    const reportsDir = path.join(process.cwd(), 'public', CONFIG.PDF_CONFIG.DIRECTORY);
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }

    // Read all files in the reports directory
    const files = fs.readdirSync(reportsDir);

    // Get file details
    const reports = files
      .filter(file => file.endsWith('.pdf'))
      .map(file => {
        const filePath = path.join(reportsDir, file);
        const stats = fs.statSync(filePath);
        
        return {
          name: file,
          createdAt: stats.birthtime,
          url: `/${CONFIG.PDF_CONFIG.DIRECTORY}/${file}`,
        };
      })
      // Sort by creation date, newest first
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json({ reports });
  } catch (error) {
    console.error('Error fetching reports:', error);
    return NextResponse.json(
      { message: 'Error fetching reports', error: (error as Error).message },
      { status: 500 }
    );
  }
}