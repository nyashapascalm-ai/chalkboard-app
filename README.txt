CHALKBOARD WHITE SIDEBAR + COMPACT ICONS 1.0

CHANGES
-------
- Removes the navy/blue sidebar background.
- Makes the sidebar white.
- Uses black/dark navy text.
- Keeps the active item solid #1E5EF7.
- Adds consistent SVG icons to navigation items.
- Removes excessive spacing between items and sections.
- Reduces sidebar width to 248px.
- Keeps the official logo mark visible and larger.
- Preserves sticky sidebar and page scrolling.

INSTALL
-------
Extract into:

C:\Users\Dell\Downloads\chalkboard-x\chalkboard

Run:

powershell -ExecutionPolicy Bypass -File .\INSTALL_CHALKBOARD_WHITE_SIDEBAR.ps1

Then:

Remove-Item .\.next -Recurse -Force -ErrorAction SilentlyContinue
npm run build

BACKUPS
-------
app/globals.before-white-sidebar.css
app/layout.before-white-sidebar.js

Do not commit backup files.
