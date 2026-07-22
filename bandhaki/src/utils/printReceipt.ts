import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import type { PaperSize } from './receiptTemplates';

// Page dimensions in points (72 PPI) matching the @page CSS in receiptTemplates.
const PAGE_SIZES: Record<PaperSize, { width: number; height: number }> = {
  a5: { width: 420, height: 595 }, // 148mm x 210mm
  thermal: { width: 227, height: 842 }, // 80mm wide, generous roll length
};

// Opens the native print dialog (AirPrint on iOS, print services on Android/web) for the given HTML.
export async function printReceipt(html: string, paperSize: PaperSize = 'a5') {
  const { width, height } = PAGE_SIZES[paperSize];
  await Print.printAsync({ html, width, height });
}

// Renders the HTML to a PDF file and opens the share sheet so it can be saved, sent, or AirDropped.
export async function shareReceiptAsPdf(html: string, paperSize: PaperSize = 'a5') {
  const { width, height } = PAGE_SIZES[paperSize];
  const { uri } = await Print.printToFileAsync({ html, base64: false, width, height });
  const canShare = await Sharing.isAvailableAsync();
  if (canShare) {
    await Sharing.shareAsync(uri, { mimeType: 'application/pdf', UTI: 'com.adobe.pdf' });
  } else {
    await Print.printAsync({ uri });
  }
}
