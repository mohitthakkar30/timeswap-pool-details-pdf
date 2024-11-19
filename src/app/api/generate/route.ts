// src/app/api/generate/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { pools } from '@/types/pools';
import { jsPDF } from 'jspdf';
import fs from 'fs';
import path from 'path';

interface PoolResult {
  success: boolean;
  data?: any;
  error?: string;
  name: string;
}

export async function GET(req: NextRequest) {
  try {
    // Create reports directory if it doesn't exist
    const reportsDir = path.join(process.cwd(), 'public', 'reports');
    console.log('Reports directory:', reportsDir);
    
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
      console.log('Created reports directory');
    }

    // Fetch data for all pools with error handling
    const poolsData: PoolResult[] = await Promise.all(
      pools.map(async (pool) => {
        try {
          const response = await fetch(pool.summary_url);
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          const data = await response.json();
          return {
            success: true,
            data,
            name: pool.name
          };
        } catch (error) {
          console.error(`Failed to fetch data for pool ${pool.name}:`, error);
          return {
            success: false,
            error: (error as Error).message,
            name: pool.name
          };
        }
      })
    );

    // Create PDF
    const doc = new jsPDF();
    const timestamp = new Date().toISOString();

    // Add title
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text(`TimeSwap Pool Summary Report`, 20, 20);
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text(`Generated: ${new Date().toLocaleString()}`, 20, 30);

    let yOffset = 40;

    // Add data for each pool
    poolsData.forEach((result, index) => {
      // Add new page if not enough space
      if (yOffset > 250) {
        doc.addPage();
        yOffset = 20;
      }

      // Pool Header
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text(`Pool ${index + 1}: ${result.name}`, 20, yOffset);
      yOffset += 10;

      // If pool data fetch failed
      if (!result.success) {
        doc.setFontSize(10);
        doc.setFont("helvetica", "italic");
        doc.setTextColor(255, 0, 0); // Red color for error
        doc.text(`Failed to fetch data: ${result.error}`, 25, yOffset);
        doc.setTextColor(0, 0, 0); // Reset to black
        yOffset += 10;
      } else {
        const pool_info = result.data.pool_info;
        
        try {
          // Pool Details
          doc.setFontSize(10);
          doc.setFont("helvetica", "normal");
          const details = [
            `Chain: ${pool_info?.chain || 'N/A'}`,
            `Tokens: ${pool_info?.token0?.formatted_name || 'N/A'} - ${pool_info?.token1?.formatted_name || 'N/A'}`,
            `APR: ${pool_info?.apr ? (pool_info.apr * 100).toFixed(2) + '%' : 'N/A'}`,
            `Volume: ${pool_info?.volume ? '$' + pool_info.volume.toLocaleString() : 'N/A'}`,
            `Total Transactions: ${pool_info?.total_txn_count || 'N/A'}`,
          ];

          details.forEach(detail => {
            doc.text(detail, 25, yOffset);
            yOffset += 7;
          });

          // Lending Stats
          if (pool_info?.aggregate_lend) {
            yOffset += 5;
            doc.setFont("helvetica", "bold");
            doc.text("Lending Activity:", 20, yOffset);
            yOffset += 7;
            doc.setFont("helvetica", "normal");

            const lendingAmount = pool_info.aggregate_lend.total_amount_lent?.[0]?.usd || 0;
            const lendStats = [
              `Total Lent: $${lendingAmount.toLocaleString()}`,
              `Unique Lenders: ${pool_info.aggregate_lend.unique_lenders || 0}`,
              `Transactions: ${pool_info.aggregate_lend.txn_count || 0}`,
            ];

            lendStats.forEach(stat => {
              doc.text(stat, 25, yOffset);
              yOffset += 7;
            });
          }

          // Borrowing Stats
          if (pool_info?.aggregate_borrow) {
            yOffset += 5;
            doc.setFont("helvetica", "bold");
            doc.text("Borrowing Activity:", 20, yOffset);
            yOffset += 7;
            doc.setFont("helvetica", "normal");

            const borrowingAmount = pool_info.aggregate_borrow.total_amount_borrowed?.[0]?.usd || 0;
            const borrowStats = [
              `Total Borrowed: $${borrowingAmount.toLocaleString()}`,
              `Unique Borrowers: ${pool_info.aggregate_borrow.unique_borrowers || 0}`,
              `Transactions: ${pool_info.aggregate_borrow.txn_count || 0}`,
            ];

            borrowStats.forEach(stat => {
              doc.text(stat, 25, yOffset);
              yOffset += 7;
            });
          }
        } catch (error) {
          console.error(`Error processing pool data for ${result.name}:`, error);
          doc.setFontSize(10);
          doc.setFont("helvetica", "italic");
          doc.setTextColor(255, 0, 0);
          doc.text(`Error processing data: ${(error as Error).message}`, 25, yOffset);
          doc.setTextColor(0, 0, 0);
          yOffset += 10;
        }
      }

      // Add space between pools
      yOffset += 15;
    });

    // Save PDF with timestamp
    const currentDate = new Date().toISOString().split('T')[0];
    const currentTime = new Date().toTimeString().split(' ')[0].replace(/:/g, '-');
    const fileName = `timeswap-report-${currentDate}-${currentTime}.pdf`;
    const filePath = path.join(reportsDir, fileName);

    // Save the PDF
    const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
    fs.writeFileSync(filePath, pdfBuffer);
    
    console.log('PDF saved to:', filePath);
    
    // Verify file exists
    if (fs.existsSync(filePath)) {
      console.log('File successfully created');
    } else {
      console.log('File creation failed');
    }

    // Return success response with file URL
    return NextResponse.json({
      success: true,
      message: 'Report generated successfully',
      file: `/reports/${fileName}`,
      timestamp: new Date().toISOString(),
      filePath: filePath, // For debugging
      poolResults: poolsData.map(result => ({
        name: result.name,
        success: result.success,
        error: result.error
      }))
    });

  } catch (error) {
    console.error('Error generating report:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to generate report',
        error: (error as Error).message,
        stack: (error as Error).stack // For debugging
      },
      { status: 500 }
    );
  }
}