export function generatePdf(firDraft: string) {
  const firId = `VF-${Date.now()}`;
  const generationDate = new Date().toLocaleString('en-IN', {
    dateStyle: 'long',
    timeStyle: 'short',
  });

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>FIR Draft - ${firId}</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Times+New+Roman&display=swap');
        body {
          font-family: 'Times New Roman', Times, serif;
          margin: 0;
          padding: 20px;
          background-color: #fff;
          color: #000;
        }
        .container {
          max-width: 800px;
          margin: 0 auto;
        }
        h1 {
          font-size: 20px;
          font-weight: bold;
          text-align: center;
          text-transform: uppercase;
          border-bottom: 2px solid #000;
          padding-bottom: 10px;
          margin-bottom: 20px;
        }
        pre {
          white-space: pre-wrap;
          word-wrap: break-word;
          font-family: 'Times New Roman', Times, serif;
          font-size: 14px;
          line-height: 1.5;
          text-align: left;
        }
        footer {
          margin-top: 40px;
          padding-top: 10px;
          border-top: 1px solid #ccc;
          text-align: center;
          font-size: 10px;
          color: #555;
          font-style: italic;
        }
        @media print {
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .container { border: none; box-shadow: none; }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>First Information Report (Draft)</h1>
        <pre>${firDraft.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</pre>
        <footer>
          <p>This is a computer-generated draft for review before official submission.</p>
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
      try {
        pdfWindow.print();
      } catch (e) {
        console.error("Print failed", e);
        pdfWindow.close();
        alert("Could not print the PDF. Please check your browser settings.");
      }
    }, 500); // Wait for content to render
  } else {
    alert("Could not open PDF window. Please disable your popup blocker and try again.");
  }
}
