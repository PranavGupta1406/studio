import type { Seriousness } from '@/components/seriousness-badge';

export function generatePdf(firDraft: string, score: number, seriousness: Seriousness | null) {
  const firId = `VF-${Date.now()}`;
  const generationDate = new Date().toLocaleString('en-IN', {
    dateStyle: 'long',
    timeStyle: 'short',
  });

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF--ag">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>FIR Draft - ${firId}</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap');
        body {
          font-family: 'Inter', sans-serif;
          margin: 0;
          padding: 0;
          background-color: #fff;
          color: #111;
        }
        .container {
          max-width: 800px;
          margin: 2rem auto;
          padding: 2rem;
          border: 1px solid #ccc;
          border-radius: 8px;
        }
        h1 {
          font-size: 24px;
          font-weight: 700;
          color: #2c3e50;
          border-bottom: 2px solid #2c3e50;
          padding-bottom: 10px;
          margin-bottom: 20px;
        }
        .meta-info {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin-bottom: 20px;
          padding: 15px;
          background-color: #f0f2f5;
          border-radius: 4px;
        }
        .meta-item {
          font-size: 14px;
        }
        .meta-label {
          font-weight: 700;
          display: block;
          margin-bottom: 4px;
        }
        pre {
          white-space: pre-wrap;
          word-wrap: break-word;
          font-family: 'Inter', sans-serif;
          font-size: 15px;
          line-height: 1.6;
          padding: 20px;
          background-color: #f9f9f9;
          border-radius: 4px;
          border: 1px solid #eee;
        }
        footer {
          margin-top: 30px;
          text-align: center;
          font-size: 12px;
          color: #777;
        }
        @media print {
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .container { border: none; box-shadow: none; }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>First Information Report (FIR) - Draft</h1>
        <div class="meta-info">
          <div class="meta-item">
            <span class="meta-label">FIR ID:</span>
            <span>${firId}</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">Date & Time Generated:</span>
            <span>${generationDate}</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">Completeness Score:</span>
            <span>${score} / 100</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">Seriousness Level:</span>
            <span>${seriousness || 'N/A'}</span>
          </div>
        </div>
        <pre>${firDraft.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</pre>
        <footer>
          <p><strong>Disclaimer:</strong> This is an AI-generated draft for review purposes only. It should be verified by a legal professional before submission.</p>
        </footer>
      </div>
    </body>
    </html>
  `;

  const pdfWindow = window.open("", "_blank");
  if (pdfWindow) {
    pdfWindow.document.open();
    pdfWindow.document.write(htmlContent);
    pdfWindow.document.close();
    setTimeout(() => {
      pdfWindow.print();
    }, 500); // Wait for content to render
  } else {
    alert("Could not open PDF window. Please disable your popup blocker and try again.");
  }
}
