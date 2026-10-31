import { PDFDocument, StandardFonts, degrees, rgb } from "pdf-lib";

// Stamps every page of a PDF with who downloaded it, so a shared copy points back to its owner.
// The built-in PDF fonts have no Arabic letters, so the stamp uses the phone number and account id.

const ascii = (s: string) => s.replace(/[^\x20-\x7E]/g, "").trim();

export async function stampPdf(bytes: Uint8Array, text: string): Promise<Uint8Array> {
  const mark = ascii(text) || "Hessa";
  const pdf = await PDFDocument.load(bytes, { ignoreEncryption: true });
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  for (const page of pdf.getPages()) {
    const { width, height } = page.getSize();
    const size = Math.max(10, Math.min(width, height) / 32);
    const w = font.widthOfTextAtSize(mark, size);
    // A loose diagonal grid across the page, light enough to read through.
    for (let y = -height; y < height * 1.5; y += size * 9)
      for (let x = -width; x < width * 1.5; x += w + size * 6)
        page.drawText(mark, { x, y, size, font, color: rgb(0.06, 0.3, 0.27), opacity: 0.12, rotate: degrees(30) });
    page.drawText(mark, { x: 24, y: 14, size: 8, font, color: rgb(0.3, 0.3, 0.3), opacity: 0.7 });
  }
  pdf.setProducer("Hessa");
  return pdf.save();
}

/** The sample file the demo serves for every PDF lesson. */
export async function samplePdf(title: string): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.HelveticaBold);
  const body = await pdf.embedFont(StandardFonts.Helvetica);
  const page = pdf.addPage([595, 842]);
  page.drawText("Hessa · sample study material", { x: 56, y: 760, size: 22, font, color: rgb(0.06, 0.3, 0.27) });
  page.drawText(ascii(title) || "Lesson", { x: 56, y: 724, size: 13, font: body, color: rgb(0.2, 0.2, 0.2) });
  const lines = [
    "In the real platform this is the teacher's own PDF.",
    "Every page carries the student's number and account id,",
    "so a copy shared outside Hessa can be traced back.",
  ];
  lines.forEach((l, i) => page.drawText(l, { x: 56, y: 680 - i * 22, size: 12, font: body, color: rgb(0.25, 0.25, 0.25) }));
  return pdf.save();
}
