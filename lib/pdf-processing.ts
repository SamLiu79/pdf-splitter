import { PDFDocument } from 'pdf-lib';

export type SplitMode = 2 | 3;
export type PageSplitConfig = { mode: SplitMode; splitPoints: number[] };

export function normalizeSplitPoints(config: PageSplitConfig | undefined): number[] {
    const mode = config?.mode ?? 2;
    const defaultSplitPoints = mode === 3 ? [33.3, 66.7] : [50];
    const pointCount = mode === 3 ? 2 : 1;
    const splitPoints = [
        ...(config?.splitPoints ?? []),
        ...defaultSplitPoints,
    ];

    return splitPoints
        .slice(0, pointCount)
        .map((point) => Math.min(100, Math.max(0, point)))
        .sort((a, b) => a - b);
}

function normalizeRotation(angle: number): 0 | 90 | 180 | 270 {
    const normalized = ((angle % 360) + 360) % 360;
    return normalized === 90 || normalized === 180 || normalized === 270 ? normalized : 0;
}

function getVisualSplitSegments(
    box: { x: number; y: number; width: number; height: number },
    rotation: 0 | 90 | 180 | 270,
    boundaries: number[]
) {
    const segments = [];

    for (let boundaryIndex = 0; boundaryIndex < boundaries.length - 1; boundaryIndex++) {
        const startPercentage = boundaries[boundaryIndex];
        const endPercentage = boundaries[boundaryIndex + 1];

        if (rotation === 90 || rotation === 270) {
            const segmentStart = rotation === 270 ? 100 - endPercentage : startPercentage;
            const segmentEnd = rotation === 270 ? 100 - startPercentage : endPercentage;
            const segmentY = box.y + (box.height * segmentStart / 100);
            const segmentHeight = box.height * (segmentEnd - segmentStart) / 100;
            segments.push({
                x: box.x,
                y: segmentY,
                width: box.width,
                height: segmentHeight,
            });
        } else {
            const segmentStart = rotation === 180 ? 100 - endPercentage : startPercentage;
            const segmentEnd = rotation === 180 ? 100 - startPercentage : endPercentage;
            const segmentX = box.x + (box.width * segmentStart / 100);
            const segmentWidth = box.width * (segmentEnd - segmentStart) / 100;
            segments.push({
                x: segmentX,
                y: box.y,
                width: segmentWidth,
                height: box.height,
            });
        }
    }

    return segments;
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
        const rotation = normalizeRotation(originalPage.getRotation().angle);
        const segments = getVisualSplitSegments(box, rotation, boundaries);

        for (const segment of segments) {
            const [segmentPage] = await newPdfDoc.copyPages(pdfDoc, [i]);

            segmentPage.setMediaBox(segment.x, segment.y, segment.width, segment.height);
            segmentPage.setCropBox(segment.x, segment.y, segment.width, segment.height);
            newPdfDoc.addPage(segmentPage);
        }
    }

    const pdfBytes = await newPdfDoc.save();
    return pdfBytes;
}
