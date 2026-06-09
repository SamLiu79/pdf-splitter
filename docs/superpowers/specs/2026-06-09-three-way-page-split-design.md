# Three-Way Page Split Design

## Goal

Add a per-page toolbar control that lets users choose between the existing two-part page split and a new three-part page split. Two-part splitting remains the default for every page.

## Page Split Model

Each PDF page will store a split configuration:

```ts
type PageSplitConfig = {
  mode: 2 | 3;
  splitPoints: number[];
};
```

- Two-part mode uses one split point, initialized to `[50]`.
- Three-part mode uses two split points, initialized to `[33.3, 66.7]`.
- Switching from two-part to three-part mode initializes the page to `[33.3, 66.7]`.
- Switching from three-part to two-part mode keeps the user's intent by using the midpoint between the two split points.

Split points are percentages across the visible page width.

## Page Toolbar Behavior

Each page toolbar gets a compact `2 / 3` segmented control.

- `2` selects two-part splitting for that page.
- `3` selects three-part splitting for that page.
- The selected mode is local to the page.
- In three-part mode, the page preview shows two draggable split lines.
- Dragging enforces a minimum 10% width for each resulting segment.

The toolbar continues to show page number, zoom controls, split percentages, and page dimensions. In three-part mode, segment width readouts should show all three resulting widths.

## PDF Output

The PDF processing layer will accept per-page split configs instead of a single split percentage per page. For each source page it will build crop intervals from `[0, ...splitPoints, 100]`.

- Two-part pages output two pages.
- Three-part pages output three pages.
- Cropped pages preserve the source page height and crop along the visible page box.

## Validation

Add a focused test for the PDF processing behavior:

- Create or load a simple one-page PDF.
- Split it with `[25, 70]`.
- Verify the output PDF has three pages.
- Verify output widths are 25%, 45%, and 30% of the source page width.

Then run lint and the focused test command. Existing lint issues may need to be cleaned up as part of the implementation because the current baseline has lint failures.
