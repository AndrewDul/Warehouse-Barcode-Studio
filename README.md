# Warehouse Barcode Studio

A privacy-first browser tool for creating printable barcode labels. It runs entirely on the device: label values are never sent to an API, saved in local storage, or written to application logs.

## Included features

- Code 128, Code 39, Code 93 and QR generation with format-aware validation.
- One non-empty text line equals one label; Excel imports every non-empty cell in workbook order.
- Import support for `.xlsx`, `.xls`, `.docx`, `.md` and `.txt`.
- Label queue, individual preview and an active-label selection.
- Single PNG/SVG exports, all-label PDF and ZIP (PNG + SVG) packs.
- Browser printing with Zebra ZD220 4 × 6 in, warehouse, shelf-edge, small-item and custom-size profiles.
- Dark mode plus a warm grey/off-white gradient light mode. The look is inspired by the visual language of the accompanying portfolio, not copied from it.
- Responsive desktop/tablet/mobile layout and focused unit tests for parsing and validation.

## Local development

```bash
npm install
npm run dev
```

## Quality checks

```bash
npm test
npm run build
```

## GitHub Pages

The Vite base URL is intentionally set to `/Warehouse-Barcode-Studio/`, matching the target public repository. The workflow at `.github/workflows/deploy-pages.yml` runs tests, builds `docs/`, then deploys it with GitHub Pages after Pages is set to **GitHub Actions** in repository settings.

For a resilient static fallback, the production build is also committed in `docs/`. GitHub Pages can therefore publish directly from `main` / `docs` if the account cannot run GitHub Actions. The workflow remains in the repository and will resume CI-based deployment once Actions is available.

## Printing note

The application opens the browser’s own print dialog. Select the installed Zebra ZD220 (or another printer), then ensure its physical media matches the selected profile. The app cannot install drivers or configure printer hardware.

## Project reporting

The required continuing project log is in [`raport/raporty.md`](raport/raporty.md). Update it for every material change before committing.
