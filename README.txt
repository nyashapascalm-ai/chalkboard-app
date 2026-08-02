CHALKBOARD PLATFORM EXPORTS + ENCODING FIX 1.0

Fixes broken separator and punctuation text, including:
- Ãƒâ€šÃ‚Â·
- Ã‚Â·
- Â·

Adds a shared export toolbar to:
- School Administrator
- Operator
- Ministry

Buttons:
- Print / Save PDF
- Export Excel
- Export Word

The currently open module is exported. This applies to:
- meetings and minutes
- resolutions
- events
- budgets
- invoices and receipts
- petty cash
- HR and leave
- attendance reports
- teachers and allocations
- fees and arrears
- contractors and payments
- inventory and assets
- Operator school lists
- Ministry reporting

Excel downloads an Excel-compatible CSV.
Word downloads a Word-compatible .doc.
PDF uses the browser print dialog.

INSTALL
-------
Extract into:
C:\Users\Dell\Downloads\chalkboard-x\chalkboard

Run:
powershell -ExecutionPolicy Bypass -File .\INSTALL_CHALKBOARD_PLATFORM_EXPORTS.ps1

Then:
npm run build

Backups use:
.before-platform-export

Do not commit backup files.
