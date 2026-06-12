import assert from "node:assert/strict";
import { PDFDocument, degrees } from "pdf-lib";
import { splitPDF } from "../lib/pdf-processing.ts";

async function splitSingleRotatedPage(rotation, splitPoints = [50]) {
  const sourcePdf = await PDFDocument.create();
  const page = sourcePdf.addPage([120, 240]);
  page.setCropBox(10, 20, 100, 200);
  page.setRotation(degrees(rotation));
  const sourceBytes = await sourcePdf.save();
  const sourceFile = new File([sourceBytes], `rotated-${rotation}.pdf`, {
    type: "application/pdf",
  });

  const outputBytes = await splitPDF(sourceFile, {
    1: {
      mode: splitPoints.length === 2 ? 3 : 2,
      splitPoints,
    },
  });

  return PDFDocument.load(outputBytes);
}

function roundBoxValue(value) {
  return Math.round(value * 1000) / 1000;
}

function pageBox(pdf, index) {
  const page = pdf.getPage(index);
  const box = page.getMediaBox();

  return {
    x: roundBoxValue(box.x),
    y: roundBoxValue(box.y),
    width: roundBoxValue(box.width),
    height: roundBoxValue(box.height),
    rotation: page.getRotation().angle,
  };
}

const rotation0 = await splitSingleRotatedPage(0);
assert.deepEqual(pageBox(rotation0, 0), {
  x: 10,
  y: 20,
  width: 50,
  height: 200,
  rotation: 0,
});
assert.deepEqual(pageBox(rotation0, 1), {
  x: 60,
  y: 20,
  width: 50,
  height: 200,
  rotation: 0,
});

const rotation90 = await splitSingleRotatedPage(90);
assert.deepEqual(pageBox(rotation90, 0), {
  x: 10,
  y: 20,
  width: 100,
  height: 100,
  rotation: 90,
});
assert.deepEqual(pageBox(rotation90, 1), {
  x: 10,
  y: 120,
  width: 100,
  height: 100,
  rotation: 90,
});

const rotation180 = await splitSingleRotatedPage(180);
assert.deepEqual(pageBox(rotation180, 0), {
  x: 60,
  y: 20,
  width: 50,
  height: 200,
  rotation: 180,
});
assert.deepEqual(pageBox(rotation180, 1), {
  x: 10,
  y: 20,
  width: 50,
  height: 200,
  rotation: 180,
});

const rotation270 = await splitSingleRotatedPage(270);
assert.deepEqual(pageBox(rotation270, 0), {
  x: 10,
  y: 120,
  width: 100,
  height: 100,
  rotation: 270,
});
assert.deepEqual(pageBox(rotation270, 1), {
  x: 10,
  y: 20,
  width: 100,
  height: 100,
  rotation: 270,
});

const rotation0ThreeWay = await splitSingleRotatedPage(0, [25, 70]);
assert.deepEqual(
  [pageBox(rotation0ThreeWay, 0), pageBox(rotation0ThreeWay, 1), pageBox(rotation0ThreeWay, 2)],
  [
    { x: 10, y: 20, width: 25, height: 200, rotation: 0 },
    { x: 35, y: 20, width: 45, height: 200, rotation: 0 },
    { x: 80, y: 20, width: 30, height: 200, rotation: 0 },
  ],
);

const rotation90ThreeWay = await splitSingleRotatedPage(90, [25, 70]);
assert.deepEqual(
  [pageBox(rotation90ThreeWay, 0), pageBox(rotation90ThreeWay, 1), pageBox(rotation90ThreeWay, 2)],
  [
    { x: 10, y: 20, width: 100, height: 50, rotation: 90 },
    { x: 10, y: 70, width: 100, height: 90, rotation: 90 },
    { x: 10, y: 160, width: 100, height: 60, rotation: 90 },
  ],
);

const rotation180ThreeWay = await splitSingleRotatedPage(180, [25, 70]);
assert.deepEqual(
  [pageBox(rotation180ThreeWay, 0), pageBox(rotation180ThreeWay, 1), pageBox(rotation180ThreeWay, 2)],
  [
    { x: 85, y: 20, width: 25, height: 200, rotation: 180 },
    { x: 40, y: 20, width: 45, height: 200, rotation: 180 },
    { x: 10, y: 20, width: 30, height: 200, rotation: 180 },
  ],
);

const rotation270ThreeWay = await splitSingleRotatedPage(270, [25, 70]);
assert.deepEqual(
  [pageBox(rotation270ThreeWay, 0), pageBox(rotation270ThreeWay, 1), pageBox(rotation270ThreeWay, 2)],
  [
    { x: 10, y: 170, width: 100, height: 50, rotation: 270 },
    { x: 10, y: 80, width: 100, height: 90, rotation: 270 },
    { x: 10, y: 20, width: 100, height: 60, rotation: 270 },
  ],
);

console.log("rotated page split verification passed");
