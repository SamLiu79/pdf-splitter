# PDF Page Splitter

PDF Page Splitter is a browser-based tool for uploading an A3 PDF, previewing
each page, and exporting the document as split pages. It supports two-way and
three-way page splitting, including draggable split positions per page.

## Development

Install dependencies:

```bash
npm install
```

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

Useful checks:

```bash
npm run lint
npx tsc --noEmit
node --experimental-strip-types scripts/verify-three-way-split.mjs
```

## License

This repository's original source code is licensed under the
[PolyForm Noncommercial License 1.0.0](./LICENSE).

This is a source-available noncommercial license, not an OSI-approved open
source license.

You may use, copy, modify, and distribute this project for noncommercial
purposes under the license terms. Commercial use is not permitted by the public
license.

If you want to use this project or a modified version of it commercially,
contact SamLiu79 for a separate commercial license.

Third-party dependencies remain under their own licenses. See
[THIRD_PARTY_NOTICES.md](./THIRD_PARTY_NOTICES.md).
