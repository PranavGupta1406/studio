import { jsPDF } from "jspdf";

export function generatePdf(firDraft: string) {
  const firId = `VF-${Date.now()}`;
  const generationDate = new Date().toLocaleString('en-IN', {
    dateStyle: 'long',
    timeStyle: 'short',
  });

  const doc = new jsPDF();

  // Set font to a serif font like Times New Roman
  doc.setFont("times", "normal");

  // Title
  doc.setFontSize(18);
  doc.text("First Information Report (Draft)", doc.internal.pageSize.getWidth() / 2, 20, { align: 'center' });

  // FIR ID and Date
  doc.setFontSize(12);
  doc.text(`FIR ID: ${firId}`, 20, 40);
  doc.text(`Date & Time: ${generationDate}`, 20, 48);

  // Separator line
  doc.setDrawColor(0);
  doc.line(20, 55, doc.internal.pageSize.getWidth() - 20, 55);

  // FIR Content
  doc.setFontSize(12);
  const splitText = doc.splitTextToSize(firDraft, doc.internal.pageSize.getWidth() - 40);
  doc.text(splitText, 20, 65);

  // Footer
  const pageHeight = doc.internal.pageSize.getHeight();
  doc.setFontSize(8);
  doc.setTextColor(150);
  doc.text("This is a computer-generated draft for review before official submission.", doc.internal.pageSize.getWidth() / 2, pageHeight - 10, { align: 'center' });


  // Open PDF in a new tab
  doc.output('dataurlnewwindow');
}
