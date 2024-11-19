import { jsPDF } from 'jspdf';
import { ApiResponse } from '@/types/api';
import { formatNumber, formatDate } from '@/lib/utils';

export const generatePDF = async (poolsData: ApiResponse[]) => {
  const doc = new jsPDF();
  const timestamp = new Date().toISOString();
  
  // Title
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text(`TimeSwap Pool Summary Report`, 20, 20);
  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.text(`Generated: ${formatDate(timestamp)}`, 20, 30);

  let yOffset = 40;
  
  poolsData.forEach((response, index) => {
    const { pool_info } = response;
    
    if (yOffset > 250) {
      doc.addPage();
      yOffset = 20;
    }

    // Pool Header
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text(`Pool ${index + 1}: ${pool_info.token0.formatted_name} - ${pool_info.token1.formatted_name}`, 20, yOffset);
    yOffset += 10;

    // Pool Details
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    const details = [
      `Chain: ${pool_info.chain}`,
      `Maturity: ${formatDate(pool_info.maturity)}`,
      `APR: ${(pool_info.apr * 100).toFixed(2)}%`,
      `Volume: $${formatNumber(pool_info.volume)}`,
      `Total Transactions: ${pool_info.total_txn_count}`,
    ];

    details.forEach(detail => {
      doc.text(detail, 25, yOffset);
      yOffset += 7;
    });

    // Lending Stats
    yOffset += 5;
    doc.setFont("helvetica", "bold");
    doc.text("Lending Activity:", 20, yOffset);
    yOffset += 7;
    doc.setFont("helvetica", "normal");
    const lendStats = [
      `Total Amount Lent: $${formatNumber(pool_info.aggregate_lend.total_amount_lent?.[0]?.usd || 0)}`,
      `Unique Lenders: ${pool_info.aggregate_lend.unique_lenders}`,
      `Lending Transactions: ${pool_info.aggregate_lend.txn_count}`,
    ];

    lendStats.forEach(stat => {
      doc.text(stat, 25, yOffset);
      yOffset += 7;
    });

    // Borrowing Stats
    yOffset += 5;
    doc.setFont("helvetica", "bold");
    doc.text("Borrowing Activity:", 20, yOffset);
    yOffset += 7;
    doc.setFont("helvetica", "normal");
    const borrowStats = [
      `Total Amount Borrowed: $${formatNumber(pool_info.aggregate_borrow.total_amount_borrowed?.[0]?.usd || 0)}`,
      `Unique Borrowers: ${pool_info.aggregate_borrow.unique_borrowers}`,
      `Borrowing Transactions: ${pool_info.aggregate_borrow.txn_count}`,
    ];

    borrowStats.forEach(stat => {
      doc.text(stat, 25, yOffset);
      yOffset += 7;
    });

    // Incentives Summary
    if (pool_info.incentives.length > 0) {
      yOffset += 5;
      doc.setFont("helvetica", "bold");
      doc.text("Incentives:", 20, yOffset);
      yOffset += 7;
      doc.setFont("helvetica", "normal");

      const totalRewards = pool_info.incentives.reduce(
        (sum, inc) => sum + inc.user_rewards.rewards_distributed,
        0
      );
      
      doc.text(`Total Rewards Distributed: ${formatNumber(totalRewards)}`, 25, yOffset);
      yOffset += 7;
    }

    yOffset += 15; // Space between pools
  });

  return doc.output('blob');
};