export const MAX_PDF_FILE_SIZE_BYTES = 50 * 1024 * 1024;

export type FileValidationReason = "invalid-type" | "file-too-large";

export type FileValidationResult =
    | { valid: true }
    | { valid: false; reason: FileValidationReason };

type FileLike = {
    name: string;
    type: string;
    size: number;
};

export function validatePdfFile(file: FileLike): FileValidationResult {
    const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");

    if (!isPdf) {
        return { valid: false, reason: "invalid-type" };
    }

    if (file.size > MAX_PDF_FILE_SIZE_BYTES) {
        return { valid: false, reason: "file-too-large" };
    }

    return { valid: true };
}

export function getSplitOutputFilename(filename: string): string {
    return `split-${filename}`;
}
