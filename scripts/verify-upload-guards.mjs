import {
  getSplitOutputFilename,
  MAX_PDF_FILE_SIZE_BYTES,
  validatePdfFile,
} from "../lib/upload-validation.ts";

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

const validPdf = {
  name: "worksheet.pdf",
  type: "application/pdf",
  size: MAX_PDF_FILE_SIZE_BYTES,
};

const oversizedPdf = {
  name: "large.pdf",
  type: "application/pdf",
  size: MAX_PDF_FILE_SIZE_BYTES + 1,
};

const extensionOnlyPdf = {
  name: "scanned.PDF",
  type: "",
  size: 1024,
};

const invalidFile = {
  name: "notes.txt",
  type: "text/plain",
  size: 1024,
};

assert(validatePdfFile(validPdf).valid, "50MB PDFs should be accepted");
assert(validatePdfFile(extensionOnlyPdf).valid, "PDF extension should be accepted when MIME type is unavailable");
assert(validatePdfFile(oversizedPdf).reason === "file-too-large", "PDFs over 50MB should be rejected");
assert(validatePdfFile(invalidFile).reason === "invalid-type", "non-PDF files should be rejected");
assert(getSplitOutputFilename("worksheet.pdf") === "split-worksheet.pdf", "download filename should use split- prefix");

console.log("upload guard verification passed");
