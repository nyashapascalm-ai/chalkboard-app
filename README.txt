CHALKBOARD SCROLL + SOLID BLUE FIX 1.0

FIXES
-----
- Restores vertical scrolling on the public website.
- Restores vertical scrolling on the login page.
- Removes html/body overflow locking.
- Keeps the desktop sidebar sticky and independently readable.
- Allows the portal workspace to use normal document scrolling.
- Uses solid #1E5EF7 across the platform.
- Removes branded gradients.
- Overrides legacy green primary buttons.
- Retains navy login role cards with readable white/light text.

INSTALL
-------
Extract into:

C:\Users\Dell\Downloads\chalkboard-x\chalkboard

Run:

powershell -ExecutionPolicy Bypass -File .\INSTALL_CHALKBOARD_SCROLL_SOLID_BLUE_FIX.ps1

Then:

Remove-Item .\.next -Recurse -Force -ErrorAction SilentlyContinue
npm run build

BACKUP
------
app/globals.before-scroll-solid-blue.css

Do not commit the backup.
