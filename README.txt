CHALKBOARD V2 ERP INTERFACE 1.0

This is a structural visual upgrade, not a small theme adjustment.

INCLUDES
--------
- Strong 306px enterprise sidebar
- Bold typography and navigation hierarchy
- Full-width content canvas
- Navy and blue controls throughout
- Removal of remaining green brand controls
- Larger, authoritative forms and tables
- Stronger cards and shadows
- New executive School Administrator dashboard
- 12 cross-platform KPI cards
- Academics, HR, finance, governance, operations and communication overview
- Upcoming school activity
- Recent communication
- Operator and Ministry shell improvements
- Login improvements
- Responsive layouts

INSTALL
-------
1. Extract into:
   C:\Users\Dell\Downloads\chalkboard-x\chalkboard

2. Run:
   powershell -ExecutionPolicy Bypass -File .\INSTALL_CHALKBOARD_V2_ERP_INTERFACE.ps1

3. Clear cache:
   Remove-Item .\.next -Recurse -Force -ErrorAction SilentlyContinue

4. Build:
   npm run build

BACKUPS
-------
app/globals.before-v2.css
app/app/admin/page.before-v2.js

Do not commit backup files.
