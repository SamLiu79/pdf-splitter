import assert from 'node:assert/strict';
import { PDFDocument } from 'pdf-lib';
import { splitPDF } from '../lib/pdf-processing.ts';

const sourcePdf = await PDFDocument.create();
sourcePdf.addPage([1000, 500]);
const sourceBytes = await sourcePdf.save();

const sourceFile = new File([sourceBytes], 'source.pdf', { type: 'application/pdf' });
const outputBytes = await splitPDF(sourceFile, { 1: { mode: 3, splitPoints: [25, 70] } });

const outputPdf = await PDFDocument.load(outputBytes);
assert.equal(outputPdf.getPageCount(), 3);

const widths = outputPdf.getPages().map((page) => Math.round(page.getMediaBox().width));
assert.deepEqual(widths, [250, 450, 300]);

console.log('three-way split verification passed');
