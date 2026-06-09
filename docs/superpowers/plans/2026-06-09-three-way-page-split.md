# Three-Way Page Split Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a per-page `2 / 3` split mode control so each PDF page can be split into either two or three independently sized output pages.

**Architecture:** Introduce a shared `PageSplitConfig` data model with `mode` and `splitPoints`. Update PDF processing to crop source pages from an ordered split-point list, then update the editor and page preview to render and drag one or two split lines per page.

**Tech Stack:** Next.js 16, React 19, TypeScript, `react-pdf`, `pdf-lib`, ESLint.

---

## File Map

- Modify `lib/pdf-processing.ts`: define split config types and generate 2 or 3 cropped pages from split intervals.
- Create `scripts/verify-three-way-split.mjs`: focused Node verification for PDF output widths.
- Modify `components/PDFSplitEditor.tsx`: store `PageSplitConfig` per page and pass mode/split-point callbacks.
- Modify `components/PageSplitter.tsx`: add `2 / 3` toolbar control, render multiple split lines, and support dragging each line with spacing limits.
- Modify `lib/translations.ts`: add mode labels and three-segment width labels for every supported language.
- Modify `components/LanguageSelector.tsx`, `components/LanguageContext.tsx`, `components/UploadZone.tsx`: clean existing lint issues that block verification.

## Task 1: PDF Processing Model And Test

**Files:**
- Modify: `lib/pdf-processing.ts`
- Create: `scripts/verify-three-way-split.mjs`

- [ ] **Step 1: Write the failing verification script**

Create `scripts/verify-three-way-split.mjs`:

```js
import assert from "node:assert/strict";
import { PDFDocument } from "pdf-lib";
import { splitPDF } from "../lib/pdf-processing.ts";

const sourcePdf = await PDFDocument.create();
sourcePdf.addPage([1000, 500]);
const sourceBytes = await sourcePdf.save();
const sourceFile = new File([sourceBytes], "source.pdf", { type: "application/pdf" });

const outputBytes = await splitPDF(sourceFile, {
  1: { mode: 3, splitPoints: [25, 70] },
});

const outputPdf = await PDFDocument.load(outputBytes);
assert.equal(outputPdf.getPageCount(), 3);

const widths = outputPdf.getPages().map((page) => page.getMediaBox().width);
assert.deepEqual(widths.map((width) => Math.round(width)), [250, 450, 300]);

console.log("three-way split verification passed");
```

- [ ] **Step 2: Run it to verify RED**

Run:

```bash
/opt/homebrew/opt/node@24/bin/node --experimental-strip-types scripts/verify-three-way-split.mjs
```

Expected: FAIL because `splitPDF` still expects `Record<number, number>` and does not generate three output pages.

- [ ] **Step 3: Implement the split config model**

Update `lib/pdf-processing.ts` to this structure:

```ts
import { PDFDocument } from 'pdf-lib';

export type SplitMode = 2 | 3;

export type PageSplitConfig = {
    mode: SplitMode;
    splitPoints: number[];
};

const MIN_SPLIT_POINT = 0;
const MAX_SPLIT_POINT = 100;

function normalizeSplitPoints(config: PageSplitConfig | undefined): number[] {
    const fallback = config?.mode === 3 ? [33.3, 66.7] : [50];
    const points = config?.splitPoints.length ? config.splitPoints : fallback;
    const requiredPointCount = config?.mode === 3 ? 2 : 1;

    return points
        .slice(0, requiredPointCount)
        .map((point) => Math.max(MIN_SPLIT_POINT, Math.min(MAX_SPLIT_POINT, point)))
        .sort((a, b) => a - b);
}

export async function splitPDF(file: File, splitConfigs: Record<number, PageSplitConfig>): Promise<Uint8Array> {
    const fileArrayBuffer = await file.arrayBuffer();
    const pdfDoc = await PDFDocument.load(fileArrayBuffer);
    const newPdfDoc = await PDFDocument.create();
    const pageCount = pdfDoc.getPageCount();

    for (let i = 0; i < pageCount; i++) {
        const pageNum = i + 1;
        const splitPoints = normalizeSplitPoints(splitConfigs[pageNum]);
        const [templatePage] = await newPdfDoc.copyPages(pdfDoc, [i]);
        const box = templatePage.getCropBox() ?? templatePage.getMediaBox();
        const { x, y, width, height } = box;
        const boundaries = [0, ...splitPoints, 100];

        for (let boundaryIndex = 0; boundaryIndex < boundaries.length - 1; boundaryIndex++) {
            const startRatio = boundaries[boundaryIndex] / 100;
            const endRatio = boundaries[boundaryIndex + 1] / 100;
            const segmentX = x + width * startRatio;
            const segmentWidth = width * (endRatio - startRatio);
            const [segmentPage] = await newPdfDoc.copyPages(pdfDoc, [i]);

            segmentPage.setMediaBox(segmentX, y, segmentWidth, height);
            segmentPage.setCropBox(segmentX, y, segmentWidth, height);
            newPdfDoc.addPage(segmentPage);
        }
    }

    return newPdfDoc.save();
}
```

- [ ] **Step 4: Run it to verify GREEN**

Run:

```bash
/opt/homebrew/opt/node@24/bin/node --experimental-strip-types scripts/verify-three-way-split.mjs
```

Expected: PASS and print `three-way split verification passed`.

- [ ] **Step 5: Commit**

```bash
git add lib/pdf-processing.ts scripts/verify-three-way-split.mjs
git commit -m "feat: support multi-point PDF splitting"
```

## Task 2: Editor State And Page Toolbar

**Files:**
- Modify: `components/PDFSplitEditor.tsx`
- Modify: `components/PageSplitter.tsx`
- Modify: `lib/translations.ts`

- [ ] **Step 1: Update editor state shape**

In `components/PDFSplitEditor.tsx`, import the type:

```ts
import { PageSplitConfig, SplitMode, splitPDF } from "@/lib/pdf-processing";
```

Replace `splitPositions` state with:

```ts
const [splitConfigs, setSplitConfigs] = useState<Record<number, PageSplitConfig>>({});
```

Initialize loaded pages:

```ts
const initialSplits: Record<number, PageSplitConfig> = {};
for (let i = 1; i <= numPages; i++) {
    initialSplits[i] = { mode: 2, splitPoints: [50] };
}
setSplitConfigs(initialSplits);
```

Add callbacks:

```ts
const handleSplitPointsChange = (page: number, splitPoints: number[]) => {
    setSplitConfigs(prev => ({
        ...prev,
        [page]: {
            mode: splitPoints.length === 2 ? 3 : 2,
            splitPoints,
        },
    }));
};

const handleSplitModeChange = (page: number, mode: SplitMode) => {
    setSplitConfigs(prev => {
        const current = prev[page] ?? { mode: 2, splitPoints: [50] };
        const splitPoints = mode === 3
            ? [33.3, 66.7]
            : [current.splitPoints.length === 2
                ? (current.splitPoints[0] + current.splitPoints[1]) / 2
                : current.splitPoints[0] ?? 50];

        return {
            ...prev,
            [page]: { mode, splitPoints },
        };
    });
};
```

Pass `splitConfigs` into `splitPDF` and update `PageSplitter` props:

```tsx
const pageConfig = splitConfigs[index + 1] ?? { mode: 2, splitPoints: [50] };

<PageSplitter
    key={`page_${index + 1}`}
    pageNumber={index + 1}
    width={undefined}
    splitConfig={pageConfig}
    onSplitPointsChange={(points) => handleSplitPointsChange(index + 1, points)}
    onSplitModeChange={(mode) => handleSplitModeChange(index + 1, mode)}
/>
```

- [ ] **Step 2: Update `PageSplitter` props and dragging**

Change the props in `components/PageSplitter.tsx`:

```ts
import { Page } from "react-pdf";
import { PageSplitConfig, SplitMode } from "@/lib/pdf-processing";

interface PageSplitterProps {
    pageNumber: number;
    width?: number;
    splitConfig: PageSplitConfig;
    onSplitPointsChange: (splitPoints: number[]) => void;
    onSplitModeChange: (mode: SplitMode) => void;
}
```

Track the active split line:

```ts
const MIN_SEGMENT_PERCENT = 10;
const [activeSplitIndex, setActiveSplitIndex] = useState<number | null>(null);
```

Update drag start and move:

```ts
const handlePointerStart = (e: React.MouseEvent | React.TouchEvent, splitIndex: number) => {
    e.preventDefault();
    setActiveSplitIndex(splitIndex);
    setIsDragging(true);
};

const handleMove = useCallback(
    (clientX: number) => {
        if (!isDragging || activeSplitIndex === null || !pageContentRef.current) return;

        const rect = pageContentRef.current.getBoundingClientRect();
        const x = clientX - rect.left;
        const percentage = (x / rect.width) * 100;
        const nextPoints = [...splitConfig.splitPoints];
        const lowerBound = activeSplitIndex === 0
            ? MIN_SEGMENT_PERCENT
            : nextPoints[activeSplitIndex - 1] + MIN_SEGMENT_PERCENT;
        const upperBound = activeSplitIndex === nextPoints.length - 1
            ? 100 - MIN_SEGMENT_PERCENT
            : nextPoints[activeSplitIndex + 1] - MIN_SEGMENT_PERCENT;

        nextPoints[activeSplitIndex] = Math.max(lowerBound, Math.min(upperBound, percentage));
        onSplitPointsChange(nextPoints);
    },
    [activeSplitIndex, isDragging, onSplitPointsChange, splitConfig.splitPoints]
);
```

Reset active line in `handleEnd`:

```ts
const handleEnd = useCallback(() => {
    setIsDragging(false);
    setActiveSplitIndex(null);
}, []);
```

Render one line per split point:

```tsx
{splitConfig.splitPoints.map((point, splitIndex) => (
    <div
        key={splitIndex}
        className="absolute top-0 bottom-0 w-0.5 bg-blue-500 hover:bg-blue-600 cursor-col-resize z-10 group transition-colors"
        style={{ left: `${point}%` }}
        onMouseDown={(event) => handlePointerStart(event, splitIndex)}
        onTouchStart={(event) => handlePointerStart(event, splitIndex)}
    >
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-8 bg-white border border-gray-200 rounded shadow-md flex items-center justify-center group-hover:border-blue-500 transition-colors">
            <GripVertical className="w-3 h-3 text-gray-400 group-hover:text-blue-500" />
        </div>
        <div className="absolute inset-y-0 -left-px w-full border-l border-blue-500/0 group-hover:border-blue-500/50" />
    </div>
))}
```

- [ ] **Step 3: Add the segmented mode control**

In the toolbar, add:

```tsx
<div className="flex items-center bg-white border border-gray-200 rounded-md shadow-sm p-0.5">
    {[2, 3].map((mode) => (
        <button
            key={mode}
            type="button"
            onClick={() => onSplitModeChange(mode as SplitMode)}
            className={`h-7 w-7 rounded text-xs font-semibold transition-colors ${
                splitConfig.mode === mode
                    ? "bg-gray-900 text-white"
                    : "text-gray-600 hover:bg-gray-50"
            }`}
            title={mode === 2 ? t.items.twoWaySplit : t.items.threeWaySplit}
        >
            {mode}
        </button>
    ))}
</div>
```

- [ ] **Step 4: Update display strings and segment readouts**

Add these keys to every language in `lib/translations.ts` under `items`:

```ts
twoWaySplit: "2-way split",
threeWaySplit: "3-way split",
segment: "Segment",
```

Use localized equivalents for non-English languages.

In `PageSplitter`, compute segment widths:

```ts
const segmentPercentages = [0, ...splitConfig.splitPoints, 100].slice(0, splitConfig.mode + 1)
    .map((point, index, boundaries) => index === 0 ? 0 : point - boundaries[index - 1])
    .slice(1);
```

Replace the old `L/R` readout with:

```tsx
{pageDimensions && (
    <div className="flex items-center gap-2 text-[10px] sm:text-xs text-gray-500 font-mono flex-wrap justify-end">
        {segmentPercentages.map((percentage, index) => (
            <span key={index}>
                {t.items.segment} {index + 1}: {(pageDimensions.width * percentage / 100).toFixed(0)}
            </span>
        ))}
    </div>
)}
```

- [ ] **Step 5: Commit**

```bash
git add components/PDFSplitEditor.tsx components/PageSplitter.tsx lib/translations.ts
git commit -m "feat: add per-page two and three split modes"
```

## Task 3: Lint Cleanup And Verification

**Files:**
- Modify: `components/LanguageContext.tsx`
- Modify: `components/LanguageSelector.tsx`
- Modify: `components/PDFSplitEditor.tsx`
- Modify: `components/PageSplitter.tsx`
- Modify: `components/UploadZone.tsx`

- [ ] **Step 1: Fix `LanguageContext` initialization lint**

Use lazy state initialization for local storage:

```ts
const [language, setLanguage] = useState<Language>(() => {
    if (typeof window === "undefined") return "zh";

    const savedLang = localStorage.getItem("pdf-split-lang") as Language | null;
    if (savedLang && translations[savedLang]) return savedLang;

    const browserLang = navigator.language.split("-")[0] as Language;
    return translations[browserLang] ? browserLang : "zh";
});

useEffect(() => {
    localStorage.setItem("pdf-split-lang", language);
}, [language]);
```

- [ ] **Step 2: Remove explicit `any` types**

Use concrete types:

```ts
type TranslationKey = keyof typeof translations;
```

For React PDF page load, use:

```ts
const onPageLoadSuccess = (page: { originalWidth: number; originalHeight: number }) => {
    setPageDimensions({ width: page.originalWidth, height: page.originalHeight });
};
```

For Blob creation:

```ts
const blob = new Blob([newPdfBytes], { type: "application/pdf" });
```

- [ ] **Step 3: Remove unused imports**

Remove unused imports from:

```ts
components/PDFSplitEditor.tsx
components/UploadZone.tsx
lib/pdf-processing.ts
```

- [ ] **Step 4: Run full verification**

Run:

```bash
/opt/homebrew/opt/node@24/bin/node --experimental-strip-types scripts/verify-three-way-split.mjs
/opt/homebrew/opt/node@24/bin/npm run lint
```

Expected: verification script passes and ESLint reports no errors.

- [ ] **Step 5: Commit**

```bash
git add components/LanguageContext.tsx components/LanguageSelector.tsx components/PDFSplitEditor.tsx components/PageSplitter.tsx components/UploadZone.tsx lib/pdf-processing.ts scripts/verify-three-way-split.mjs
git commit -m "chore: verify three-way split workflow"
```
