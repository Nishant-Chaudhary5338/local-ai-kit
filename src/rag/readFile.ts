// Extract plain text from an uploaded file, entirely in-browser. PDFs are parsed
// with pdf.js (dynamically imported so it stays out of the initial bundle);
// everything else is read as text. Nothing is uploaded.

export async function readFileText(file: File): Promise<string> {
  const isPdf =
    file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
  return isPdf ? readPdf(file) : file.text();
}

async function readPdf(file: File): Promise<string> {
  const pdfjs = await import("pdfjs-dist");
  const workerUrl = (
    await import("pdfjs-dist/build/pdf.worker.min.mjs?url")
  ).default;
  pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;

  const data = await file.arrayBuffer();
  const doc = await pdfjs.getDocument({ data }).promise;
  const pages: string[] = [];
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    const text = content.items
      .map((item) => ("str" in item ? item.str : ""))
      .join(" ");
    pages.push(text);
  }
  return pages.join("\n\n");
}
