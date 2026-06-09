import { PDFDocument } from 'pdf-lib';

export type SplitMode = 2 | 3;
export type PageSplitConfig = { mode: SplitMode; splitPoints: number[] };

export function normalizeSplitPoints(config: PageSplitConfig | undefined): number[] {
    const mode = config?.mode ?? 2;
    const defaultSplitPoints = mode === 3 ? [33.3, 66.7] : [50];
    const splitPoints = config?.splitPoints?.length ? config.splitPoints : defaultSplitPoints;
    const pointCount = mode === 3 ? 2 : 1;

    return splitPoints
        .slice(0, pointCount)
        .map((point) => Math.min(100, Math.max(0, point)))
        .sort((a, b) => a - b);
}

/**
 * Splits a PDF file based on the provided page split configs.
 * @param file The original PDF file.
 * @param splitConfigs A map of page number (1-based) to split mode and split points.
 * @returns The generated PDF bytes.
 */
export async function splitPDF(file: File, splitConfigs: Record<number, PageSplitConfig>): Promise<Uint8Array> {
    const fileArrayBuffer = await file.arrayBuffer();
    const pdfDoc = await PDFDocument.load(fileArrayBuffer);
    const newPdfDoc = await PDFDocument.create();

    const pageCount = pdfDoc.getPageCount();

    for (let i = 0; i < pageCount; i++) {
        const pageNum = i + 1;
        const splitPoints = normalizeSplitPoints(splitConfigs[pageNum]);
        const boundaries = [0, ...splitPoints, 100];

        const [originalPage] = await newPdfDoc.copyPages(pdfDoc, [i]);

        // Get the effective visible box (CropBox takes precedence over MediaBox)
        const box = originalPage.getCropBox() ?? originalPage.getMediaBox();
        const { x, y, width, height } = box;

        for (let boundaryIndex = 0; boundaryIndex < boundaries.length - 1; boundaryIndex++) {
            const startPercentage = boundaries[boundaryIndex];
            const endPercentage = boundaries[boundaryIndex + 1];
            const segmentX = x + (width * startPercentage / 100);
            const segmentWidth = width * (endPercentage - startPercentage) / 100;
            const [segmentPage] = await newPdfDoc.copyPages(pdfDoc, [i]);

            segmentPage.setMediaBox(segmentX, y, segmentWidth, height);
            segmentPage.setCropBox(segmentX, y, segmentWidth, height);
            newPdfDoc.addPage(segmentPage);
        }
    }

    const pdfBytes = await newPdfDoc.save();
    return pdfBytes;
}
