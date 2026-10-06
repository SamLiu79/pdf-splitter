import assert from 'node:assert/strict';
import { PDFDocument } from '@cantoo/pdf-lib';
import { PdfPasswordError, splitPDF } from '../lib/pdf-processing.ts';

const splitConfigs = { 1: { mode: 2, splitPoints: [50] } };

async function createSourceBytes(securityOptions) {
  const sourcePdf = await PDFDocument.create();
  sourcePdf.addPage([1000, 500]);
  if (securityOptions) {
    sourcePdf.encrypt(securityOptions);
  }
  return sourcePdf.save();
}

function toFile(bytes) {
  return new File([bytes], 'source.pdf', { type: 'application/pdf' });
}

async function assertSplitSucceeds(bytes, password, label) {
  const outputBytes = await splitPDF(toFile(bytes), splitConfigs, password);
  const outputPdf = await PDFDocument.load(outputBytes);
  assert.equal(outputPdf.getPageCount(), 2, `${label}: page count`);
  assert.equal(outputPdf.isEncrypted, false, `${label}: output must not be encrypted`);
}

async function assertPasswordError(bytes, password, label) {
  await assert.rejects(
    splitPDF(toFile(bytes), splitConfigs, password),
    PdfPasswordError,
    `${label}: expected PdfPasswordError`,
  );
}

const plainBytes = await createSourceBytes();
await assertSplitSucceeds(plainBytes, undefined, 'plain, default password');
await assertSplitSucceeds(plainBytes, 'unused', 'plain, extra password');

for (const algorithm of ['AES-256', 'AES-128', 'RC4-128']) {
  const ownerOnlyBytes = await createSourceBytes({
    userPassword: '',
    ownerPassword: 'owner-secret',
    algorithm,
    allowWeakCryptography: true,
    permissions: { modifying: false, copying: false },
  });
  await assertSplitSucceeds(ownerOnlyBytes, undefined, `${algorithm} owner-only, default password`);
  await assertSplitSucceeds(ownerOnlyBytes, 'owner-secret', `${algorithm} owner-only, owner password`);

  const userBytes = await createSourceBytes({
    userPassword: 'user-secret',
    ownerPassword: 'owner-secret',
    algorithm,
    allowWeakCryptography: true,
  });
  await assertPasswordError(userBytes, undefined, `${algorithm} user password, no password`);
  await assertPasswordError(userBytes, 'wrong', `${algorithm} user password, wrong password`);
  await assertSplitSucceeds(userBytes, 'user-secret', `${algorithm} user password, user password`);
  await assertSplitSucceeds(userBytes, 'owner-secret', `${algorithm} user password, owner password`);
}

await assert.rejects(
  splitPDF(toFile(new TextEncoder().encode('not a pdf')), splitConfigs),
  (error) => !(error instanceof PdfPasswordError),
  'invalid file: must not ask for a password',
);

console.log('Encrypted PDF split verification passed.');
