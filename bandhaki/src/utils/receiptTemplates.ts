import type { DetailedLoanEntry, Payment } from '../types';

export type PaperSize = 'a5' | 'thermal';

function formatDate(dateString?: string) {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return 'N/A';
  return date.toLocaleDateString('en-NP', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatDateTime(date: Date) {
  return date.toLocaleString('en-NP', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

function formatCurrency(amount?: number) {
  return new Intl.NumberFormat('en-NP', {
    style: 'currency',
    currency: 'NPR',
    minimumFractionDigits: 2,
  }).format(amount || 0);
}

const a5Styles = `
  @page { size: A5; margin: 5mm; }
  * { box-sizing: border-box; }
  body { font-family: Arial, Helvetica, sans-serif; font-size: 12px; color: #000; margin: 0; padding: 16px; max-width: 148mm; }
  .header { text-align: center; margin-bottom: 12px; border-bottom: 2px solid #000; padding-bottom: 8px; }
  .title { font-size: 20px; font-weight: bold; letter-spacing: 0.5px; }
  .subtitle { font-size: 11px; color: #555; margin-top: 2px; }
  .loan-number { font-size: 13px; font-weight: bold; margin-top: 6px; color: #b45309; }
  .meta { display: flex; justify-content: space-between; font-size: 10px; background: #f3f4f6; padding: 8px; border-radius: 4px; margin-bottom: 12px; }
  .section { border: 1px solid #d1d5db; border-radius: 4px; padding: 10px; margin-bottom: 12px; }
  .section-title { font-size: 12px; font-weight: bold; margin-bottom: 6px; text-transform: uppercase; color: #374151; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 12px; }
  th, td { border: 1px solid #d1d5db; padding: 6px 8px; font-size: 11px; text-align: left; }
  th { background: #f3f4f6; }
  .row { display: flex; justify-content: space-between; padding: 4px 0; font-size: 12px; }
  .row.total { border-top: 1px solid #000; margin-top: 6px; padding-top: 8px; font-weight: bold; font-size: 13px; }
  .footer { margin-top: 20px; display: flex; justify-content: space-between; font-size: 10px; color: #555; }
  .signature { margin-top: 30px; display: flex; justify-content: space-between; }
  .signature div { width: 45%; border-top: 1px solid #000; text-align: center; padding-top: 4px; font-size: 10px; }
`;

const thermalStyles = `
  @page { size: 80mm auto; margin: 0; }
  * { box-sizing: border-box; }
  html, body { width: 80mm; max-width: 80mm; }
  body { font-family: 'Courier New', Courier, monospace; font-size: 10px; color: #000; margin: 0; padding: 4mm; }
  .header { text-align: center; margin-bottom: 8px; border-bottom: 2px dashed #000; padding-bottom: 6px; }
  .title { font-size: 14px; font-weight: bold; letter-spacing: 0.5px; }
  .subtitle { font-size: 9px; color: #333; margin-top: 2px; }
  .loan-number { font-size: 12px; font-weight: bold; margin-top: 4px; }
  .meta { font-size: 9px; margin-bottom: 8px; border-bottom: 1px dashed #666; padding-bottom: 6px; }
  .meta div { margin-bottom: 2px; }
  .section { border-bottom: 1px dashed #666; padding-bottom: 6px; margin-bottom: 8px; }
  .section-title { font-size: 10px; font-weight: bold; margin-bottom: 4px; text-decoration: underline; text-transform: uppercase; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 6px; }
  th, td { padding: 3px 2px; font-size: 9px; text-align: left; border-bottom: 1px dotted #999; }
  .row { display: flex; justify-content: space-between; padding: 2px 0; font-size: 10px; }
  .row.total { border-top: 1px solid #000; margin-top: 4px; padding-top: 6px; font-weight: bold; font-size: 12px; }
  .footer { margin-top: 10px; text-align: center; font-size: 8px; color: #333; border-top: 2px dashed #000; padding-top: 6px; }
  .signature { margin-top: 14px; display: flex; justify-content: space-between; }
  .signature div { width: 45%; border-top: 1px solid #000; text-align: center; padding-top: 3px; font-size: 8px; }
`;

export function generateLoanAgreementHtml(
  loan: DetailedLoanEntry,
  username?: string,
  paperSize: PaperSize = 'a5'
) {
  const totalWeight = (loan.goldItems || []).reduce((sum, item) => sum + (item.weight || 0), 0);
  const printTime = new Date();
  const styles = paperSize === 'thermal' ? thermalStyles : a5Styles;

  const itemsRows = (loan.goldItems || [])
    .map(
      (item) => `
      <tr>
        <td>${item.itemType}</td>
        <td>${item.weight ? `${item.weight} g` : '—'}</td>
        <td>${item.notes || '—'}</td>
      </tr>`
    )
    .join('');

  return `<!doctype html>
  <html>
  <head><meta charset="utf-8" /><style>${styles}</style></head>
  <body>
    <div class="header">
      <div class="title">GOLD LOAN AGREEMENT</div>
      <div class="subtitle">BANDHAKI MANAGEMENT SYSTEM</div>
      <div class="loan-number">Loan #: ${loan.loanNumber}</div>
    </div>

    <div class="meta">
      <div>
        <div><strong>Loan Date:</strong> ${formatDate(loan.loanDate)}</div>
        ${username ? `<div><strong>By:</strong> ${username}</div>` : ''}
      </div>
      <div style="text-align:right">
        <div><strong>Printed:</strong> ${formatDateTime(printTime)}</div>
        <div><strong>Status:</strong> ${(loan.status || 'active').toUpperCase()}</div>
      </div>
    </div>

    <div class="section">
      <div class="section-title">Customer Details</div>
      <div class="row"><span>Name</span><span>${loan.customerName}</span></div>
    </div>

    <div class="section">
      <div class="section-title">Gold Items</div>
      <table>
        <thead><tr><th>Item</th><th>Weight</th><th>Notes</th></tr></thead>
        <tbody>${itemsRows}</tbody>
      </table>
      <div class="row"><span>Total Weight</span><span>${totalWeight} g</span></div>
      <div class="row"><span>Total Valuation</span><span>${formatCurrency(loan.totalValuation)}</span></div>
    </div>

    <div class="section">
      <div class="section-title">Loan Terms</div>
      <div class="row"><span>Principal Amount</span><span>${formatCurrency(loan.principalAmount)}</span></div>
      <div class="row"><span>Interest Rate</span><span>${loan.interestRate}% (${loan.interestType})</span></div>
      <div class="row total"><span>Total Due</span><span>${formatCurrency(loan.totalDue)}</span></div>
    </div>

    <div class="signature">
      <div>Customer Signature</div>
      <div>Authorized Signature</div>
    </div>

    <div class="footer">
      <div>This is a computer generated document.</div>
    </div>
  </body>
  </html>`;
}

export function generatePaymentReceiptHtml(
  loan: DetailedLoanEntry,
  payment: Payment,
  username?: string,
  paperSize: PaperSize = 'a5'
) {
  const printTime = new Date();
  const styles = paperSize === 'thermal' ? thermalStyles : a5Styles;

  return `<!doctype html>
  <html>
  <head><meta charset="utf-8" /><style>${styles}</style></head>
  <body>
    <div class="header">
      <div class="title">PAYMENT RECEIPT</div>
      <div class="subtitle">BANDHAKI MANAGEMENT SYSTEM</div>
      <div class="loan-number">Loan #: ${loan.loanNumber}</div>
    </div>

    <div class="meta">
      <div>
        <div><strong>Payment Date:</strong> ${formatDate(payment.paymentDate)}</div>
        ${username ? `<div><strong>By:</strong> ${username}</div>` : ''}
      </div>
      <div style="text-align:right">
        <div><strong>Printed:</strong> ${formatDateTime(printTime)}</div>
        <div><strong>Method:</strong> ${(payment.paymentMethod || 'N/A').replace('_', ' ').toUpperCase()}</div>
      </div>
    </div>

    <div class="section">
      <div class="section-title">Customer Details</div>
      <div class="row"><span>Name</span><span>${loan.customerName}</span></div>
    </div>

    <div class="section">
      <div class="section-title">Payment Breakdown</div>
      <div class="row"><span>Interest Component</span><span>${formatCurrency(payment.interestComponent)}</span></div>
      ${
        payment.principalComponent
          ? `<div class="row"><span>Principal Component</span><span>${formatCurrency(payment.principalComponent)}</span></div>`
          : ''
      }
      <div class="row total"><span>Total Paid</span><span>${formatCurrency(payment.amount)}</span></div>
      ${payment.notes ? `<div class="row"><span>Notes</span><span>${payment.notes}</span></div>` : ''}
    </div>

    <div class="section">
      <div class="section-title">Loan Status</div>
      <div class="row"><span>Outstanding Principal</span><span>${formatCurrency(loan.outstandingPrincipal)}</span></div>
      <div class="row"><span>Outstanding Interest</span><span>${formatCurrency(loan.outstandingInterest)}</span></div>
    </div>

    <div class="signature">
      <div>Customer Signature</div>
      <div>Authorized Signature</div>
    </div>

    <div class="footer">
      <div>This is a computer generated document.</div>
    </div>
  </body>
  </html>`;
}
