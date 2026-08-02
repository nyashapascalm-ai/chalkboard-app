CHALKBOARD CLARITY + FINANCE FIX 1.0

FIXES
-----
1. SIDEBAR
- Plain white list style
- No blue blocks around normal or active items
- Active item uses a soft grey background
- Dark text and icons
- Tight spacing similar to the supplied ChatGPT reference

2. LOGIN
- Larger headings
- Larger fields
- Stronger labels
- White role cards
- Dark navy titles
- Fully readable descriptions
- Clear blue sign-in button

3. FINANCE ERROR
Removes the dashboard query:

select("type,amount")

and replaces it with:

select("*")

Finance records are then normalised from any of these possible fields:

type
entry_type
transaction_type
direction
kind
category_type

Amounts are read from:

amount
value
total
total_amount

This prevents:

column finance_entries.type does not exist

INSTALL
-------
Extract into:

C:\Users\Dell\Downloads\chalkboard-x\chalkboard

Run:

powershell -ExecutionPolicy Bypass -File .\INSTALL_CHALKBOARD_CLARITY_FINANCE_FIX.ps1

Then:

Remove-Item .\.next -Recurse -Force -ErrorAction SilentlyContinue
npm run build

BACKUPS
-------
app/globals.before-clarity-fix.css
components/AdminExecutiveDashboard.before-finance-fix.js

Do not commit backup files.
