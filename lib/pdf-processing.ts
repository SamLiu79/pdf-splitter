import { PDFDocument, PageSizes } from 'pdf-lib';

/**
 * Splits a PDF file based on the provided split positions.
 * @param file The original PDF file.
 * @param splitPositions A map of page number (1-based) to split percentage (0-100).
 * @returns The generated PDF bytes.
 */
export async function splitPDF(file: File, splitPositions: Record<number, number>): Promise<Uint8Array> {
    const fileArrayBuffer = await file.arrayBuffer();
    const pdfDoc = await PDFDocument.load(fileArrayBuffer);
    const newPdfDoc = await PDFDocument.create();

    const pageCount = pdfDoc.getPageCount();

    for (let i = 0; i < pageCount; i++) {
        const pageNum = i + 1;
        const splitPercentage = splitPositions[pageNum] ?? 50;
        const splitRatio = splitPercentage / 100;

        // Load the page
        // Load the page
        const [originalPage] = await newPdfDoc.copyPages(pdfDoc, [i]);

        // Get the effective visible box (CropBox takes precedence over MediaBox)
        const box = originalPage.getCropBox() ?? originalPage.getMediaBox();
        const { x, y, width, height } = box;

        const splitPoint = x + (width * splitRatio);
        console.log(`[Page ${pageNum}] Box: x=${x}, y=${y}, w=${width}, h=${height}`);
        console.log(`[Page ${pageNum}] Split Ratio: ${splitRatio.toFixed(3)} (${splitPercentage}%)`);
        console.log(`[Page ${pageNum}] Split Coordinate: ${splitPoint.toFixed(2)}`);

        // Create left page
        const [leftPage] = await newPdfDoc.copyPages(pdfDoc, [i]);
        // Set MediaBox/CropBox to the left portion
        // NOTE: setMediaBox(x, y, width, height) - width/height are lengths, x/y are origin.
        // So for left page: origin is (x, y), width is width*ratio, height is height.
        leftPage.setMediaBox(x, y, width * splitRatio, height);
        leftPage.setCropBox(x, y, width * splitRatio, height);
        newPdfDoc.addPage(leftPage);

        // Create right page
        const [rightPage] = await newPdfDoc.copyPages(pdfDoc, [i]);
        // For right page: origin is (x + width*ratio, y), width is width*(1-ratio)
        rightPage.setMediaBox(x + (width * splitRatio), y, width - (width * splitRatio), height);
        rightPage.setCropBox(x + (width * splitRatio), y, width - (width * splitRatio), height);
        newPdfDoc.addPage(rightPage);
    }

    const pdfBytes = await newPdfDoc.save();
    return pdfBytes;
}

