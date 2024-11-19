import { NextRequest, NextResponse } from 'next/server';
import { pools } from '@/types/pools';
import { jsPDF } from 'jspdf';

export const dynamic = 'force-dynamic';
export const maxDuration = 59; // Set maximum duration to 5 minutes

export async function GET(req: NextRequest) {
  try {
    // Fetch data for all pools with error handling
    const poolsData = await Promise.all(
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
      if (yOffset > 250) {
        doc.addPage();
        yOffset = 20;
      }

      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text(`Pool ${index + 1}: ${result.name}`, 20, yOffset);
      yOffset += 10;

      if (!result.success) {
        doc.setFontSize(10);
        doc.setFont("helvetica", "italic");
        doc.setTextColor(255, 0, 0);
        doc.text(`Failed to fetch data: ${result.error}`, 25, yOffset);
        doc.setTextColor(0, 0, 0);
        yOffset += 10;
      } else {
        const pool_info = result.data.pool_info;
        
        try {
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

          if (pool_info?.aggregate_lend) {
            yOffset += 5;
            doc.setFont("helvetica", "bold");
            doc.text("Lending Activity:", 20, yOffset);
            yOffset += 7;
            doc.setFont("helvetica", "normal");

            const lendingAmount = pool_info.aggregate_lend.total_amount_lent?.[0]?.usd || 0;
            [
              `Total Lent: $${lendingAmount.toLocaleString()}`,
              `Unique Lenders: ${pool_info.aggregate_lend.unique_lenders || 0}`,
              `Transactions: ${pool_info.aggregate_lend.txn_count || 0}`,
            ].forEach(stat => {
              doc.text(stat, 25, yOffset);
              yOffset += 7;
            });
          }

          if (pool_info?.aggregate_borrow) {
            yOffset += 5;
            doc.setFont("helvetica", "bold");
            doc.text("Borrowing Activity:", 20, yOffset);
            yOffset += 7;
            doc.setFont("helvetica", "normal");

            const borrowingAmount = pool_info.aggregate_borrow.total_amount_borrowed?.[0]?.usd || 0;
            [
              `Total Borrowed: $${borrowingAmount.toLocaleString()}`,
              `Unique Borrowers: ${pool_info.aggregate_borrow.unique_borrowers || 0}`,
              `Transactions: ${pool_info.aggregate_borrow.txn_count || 0}`,
            ].forEach(stat => {
              doc.text(stat, 25, yOffset);
              yOffset += 7;
            });
          }
        } catch (error) {
          doc.setFontSize(10);
          doc.setFont("helvetica", "italic");
          doc.setTextColor(255, 0, 0);
          doc.text(`Error processing data: ${(error as Error).message}`, 25, yOffset);
          doc.setTextColor(0, 0, 0);
          yOffset += 10;
        }
      }

      yOffset += 15;
    });

    // Convert PDF to binary data
    const pdfOutput = doc.output('arraybuffer');

    // Return PDF with proper headers
    return new NextResponse(pdfOutput, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="timeswap-report-${new Date().toISOString().split('T')[0]}.pdf"`,
        'Content-Length': pdfOutput.byteLength.toString(),
      },
    });

  } catch (error) {
    console.error('Error generating report:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to generate report',
        error: (error as Error).message,
      },
      { status: 500 }
    );
  }
}