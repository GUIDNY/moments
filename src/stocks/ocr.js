/**
 * A screenshot of a broker's holdings screen, read into text in the browser.
 * Tesseract (WebAssembly) with Hebrew and English, loaded only when a
 * screenshot is actually given — a few megabytes nobody else should pay
 * for. No key, nothing uploaded: the photograph never leaves the phone.
 *
 * The result is rough text, which is why `importer.js` is forgiving: a name
 * and a number per line is all it needs, and the sheet lets the user fix
 * the rest.
 */
export async function readScreenshot(file, onProgress) {
  const { createWorker } = await import('tesseract.js');
  // the worker, the engine and the two languages are served by this origin
  // (`public/ocr`): no CDN in the way of a phone, and cached like the rest
  const worker = await createWorker('heb+eng', 1, {
    workerPath: '/ocr/worker.min.js',
    corePath: '/ocr/core',
    langPath: '/ocr/lang',
    logger: (m) => {
      if (m.status === 'recognizing text' && onProgress) onProgress(Math.round((m.progress || 0) * 100));
    },
  });
  try {
    // a table: keep the gaps between columns, so a line splits into cells.
    // The default page layout (psm 3) keeps the columns apart; the "block"
    // modes glued the last two together. Hebrew with English, because the
    // Hebrew model alone misreads digits and the digits matter more.
    await worker.setParameters({ preserve_interword_spaces: '1' });
    const { data } = await worker.recognize(file);
    return data.text || '';
  } finally {
    await worker.terminate();
  }
}

/** An Excel export (Meitav's "ייצוא לאקסל") as tab-separated lines. */
export async function readSpreadsheet(file) {
  const XLSX = await import('xlsx');
  const book = XLSX.read(await file.arrayBuffer(), { type: 'array' });
  const sheet = book.Sheets[book.SheetNames[0]];
  return XLSX.utils.sheet_to_csv(sheet, { FS: '\t', blankrows: false });
}
