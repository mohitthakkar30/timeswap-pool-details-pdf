import { NextRequest, NextResponse } from 'next/server';
import { pools } from '@/types/pools';
import { jsPDF } from 'jspdf';

export const dynamic = 'force-dynamic';
export const maxDuration = 59;

function formatDate(dateString: string): string {
  try {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'UTC'
    });
  } catch {
    return 'N/A';
  }
}

function formatNumber(num: number | undefined | null): string {
  if (num === undefined || num === null) return '0.00';
  return num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export async function GET(req: NextRequest) {
  try {
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

    const doc = new jsPDF({
      unit: 'mm',
      format: 'a4'
    });

    // Title page
    const timestamp = new Date().toLocaleString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });

    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text("TimeSwap Pool Summaries Report", 20, 20);
    doc.setFontSize(14);
    doc.text(timestamp, 20, 30);
    doc.setFontSize(12);
    doc.text(`Total Pools: ${poolsData.length}`, 20, 40);

    const margin = 15;

    // Process each pool
    poolsData.forEach((result, index) => {
      doc.addPage();
      let yOffset = 20;

      try {
        if (!result.success || !result.data?.pool_info) {
          doc.setFontSize(12);
          doc.setFont("helvetica", "italic");
          doc.setTextColor(255, 0, 0);
          doc.text(`Failed to fetch data for pool: ${result.name}`, margin, yOffset);
          doc.setTextColor(0, 0, 0);
          return;
        }

        const pool_info = result.data.pool_info;

        // Pool Header
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text(`Pool ${index + 1}`, margin, yOffset);
        yOffset += 10;

        doc.setFontSize(12);
        doc.text(pool_info.pool || 'N/A', margin, yOffset);
        yOffset += 10;

        // Basic Pool Information
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        const basicInfo = [
          `Chain: ${pool_info.chain || 'N/A'}`,
          `Strike: ${pool_info.strike?.toFixed(2) || 'N/A'}`,
          `Maturity: ${formatDate(pool_info.maturity)}`,
          `APR: ${pool_info.apr ? (pool_info.apr * 100).toFixed(2) : '0.00'}%`,
          `Volume: $${formatNumber(pool_info.volume)}`,
          `Total Transactions: ${pool_info.total_txn_count || 0}`,
          `Contract Version: ${pool_info.contract_version || 'N/A'}`
        ];

        basicInfo.forEach(line => {
          doc.text(line, margin + 5, yOffset);
          yOffset += 6;
        });

        // Token Information
        // yOffset += 5;
        // doc.setFont("helvetica", "bold");
        // doc.text("Token Information", margin, yOffset);
        // yOffset += 6;
        // doc.setFont("helvetica", "normal");
        // [
        //   `Token 0: ${pool_info.token0?.formatted_name || 'N/A'}`,
        //   `Token 0 Address: ${pool_info.token0?.address || 'N/A'}`,
        //   `Token 1: ${pool_info.token1?.formatted_name || 'N/A'}`,
        //   `Token 1 Address: ${pool_info.token1?.address || 'N/A'}`
        // ].forEach(line => {
        //   doc.text(line, margin + 5, yOffset);
        //   yOffset += 6;
        // });

        // // Contract Information
        // yOffset += 5;
        // doc.setFont("helvetica", "bold");
        // doc.text("Contract Information", margin, yOffset);
        // yOffset += 6;
        // doc.setFont("helvetica", "normal");
        // [
        //   `Option Pair: ${pool_info.option_pair || 'N/A'}`,
        //   `Pool Pair: ${pool_info.pool_pair || 'N/A'}`
        // ].forEach(line => {
        //   doc.text(line, margin + 5, yOffset);
        //   yOffset += 6;
        // });

        // Lending Activity
        if (pool_info.aggregate_lend) {
          yOffset += 5;
          doc.setFont("helvetica", "bold");
          doc.text("Lending Activity", margin, yOffset);
          yOffset += 6;
          doc.setFont("helvetica", "normal");
          
          const lending = pool_info.aggregate_lend.total_amount_lent?.[0] || { token0: 0, token1: 0, usd: 0 };
          [
            `Token 0 Amount: ${formatNumber(lending.token0)}`,
            `Token 1 Amount: ${formatNumber(lending.token1)}`,
            `USD Value: $${formatNumber(lending.usd)}`,
            `Transaction Count: ${pool_info.aggregate_lend.txn_count || 0}`,
            `Unique Lenders: ${pool_info.aggregate_lend.unique_lenders || 0}`
          ].forEach(line => {
            doc.text(line, margin + 5, yOffset);
            yOffset += 6;
          });
        }

        // Borrowing Activity
        if (pool_info.aggregate_borrow) {
          yOffset += 5;
          doc.setFont("helvetica", "bold");
          doc.text("Borrowing Activity", margin, yOffset);
          yOffset += 6;
          doc.setFont("helvetica", "normal");
          
          const borrowing = pool_info.aggregate_borrow.total_amount_borrowed?.[0] || { token0: 0, token1: 0, usd: 0 };
          [
            `Token 0 Amount: ${formatNumber(borrowing.token0)}`,
            `Token 1 Amount: ${formatNumber(borrowing.token1)}`,
            `USD Value: $${formatNumber(borrowing.usd)}`,
            `Transaction Count: ${pool_info.aggregate_borrow.txn_count || 0}`,
            `Unique Borrowers: ${pool_info.aggregate_borrow.unique_borrowers || 0}`
          ].forEach(line => {
            doc.text(line, margin + 5, yOffset);
            yOffset += 6;
          });
        }

        // Liquidity Activity
        if (pool_info.aggregate_liquidity) {
          yOffset += 5;
          doc.setFont("helvetica", "bold");
          doc.text("Liquidity Activity", margin, yOffset);
          yOffset += 6;
          doc.setFont("helvetica", "normal");
          
          const liquidity = pool_info.aggregate_liquidity.total_liquidity_added?.[0] || { token0: 0, token1: 0, usd: 0 };
          [
            `Token 0 Amount: ${formatNumber(liquidity.token0)}`,
            `Token 1 Amount: ${formatNumber(liquidity.token1)}`,
            `USD Value: $${formatNumber(liquidity.usd)}`,
            `Transaction Count: ${pool_info.aggregate_liquidity.txn_count || 0}`,
            `Unique Providers: ${pool_info.aggregate_liquidity.unique_liquidity_providers || 0}`
          ].forEach(line => {
            doc.text(line, margin + 5, yOffset);
            yOffset += 6;
          });
        }

        // Incentives
        // if (pool_info.incentives?.length > 0) {
        //   yOffset += 5;
        //   doc.setFont("helvetica", "bold");
        //   doc.text("Incentives", margin, yOffset);
        //   yOffset += 6;
        //   doc.setFont("helvetica", "normal");

        //   pool_info.incentives.forEach((incentive: any, idx: any) => {
        //     const incentiveInfo = [
        //       `Incentive ${idx + 1}:`,
        //       `Action: ${incentive.user_action || 'N/A'}`,
        //       `Period: ${formatDate(incentive.start_time)} to ${formatDate(incentive.end_time)}`,
        //       `Rewards Distributed: ${formatNumber(incentive.user_rewards?.rewards_distributed)}`,
        //       `Total Rewarded Users: ${incentive.user_rewards?.total_rewarded_users || 0}`
        //     ];
        //     incentiveInfo.forEach(line => {
        //       doc.text(line, margin + 5, yOffset);
        //       yOffset += 6;
        //     });
        //     yOffset += 3;
        //   });
        // }

      } catch (error) {
        console.error('Error processing pool:', error);
        doc.setTextColor(255, 0, 0);
        doc.text(`Error processing pool data: ${(error as Error).message}`, margin, yOffset);
        doc.setTextColor(0, 0, 0);
      }
    });

    const pdfOutput = doc.output('arraybuffer');

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