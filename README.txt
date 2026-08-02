CHALKBOARD CALM BLUE + FIXED SHELL 1.0

PURPOSE
-------
Implements the requested portal behaviour and visual corrections.

1. CALMER CHALKBOARD BLUE
- Removes electric blue as the main visual colour.
- Uses navy #061E50 with restrained blue #286FCE.
- Keeps green only for genuine success statuses.
- Applies calmer buttons, active states and focus rings.

2. LOGIN VISIBILITY
- Gives role cards a restrained navy background.
- Makes role titles white.
- Makes descriptive text light and fully opaque.
- Removes low-contrast grey text over bright blue.

3. SIDEBAR
- Uses the official Chalkboard pictorial mark only.
- Removes duplicated Chalkboard text from the sidebar brand.
- Enlarges the mark.
- Uses white and pale-blue navigation text over navy.
- Provides stronger readable selected states.

4. SCROLLING
- Sidebar and workspace scroll independently.
- Sidebar remains available while a module is open.
- Clicking a sidebar item returns the workspace to the top.
- Prevents opening a new module at the previous module's bottom position.

INSTALL
-------
Extract into:

C:\Users\Dell\Downloads\chalkboard-x\chalkboard

Run:

powershell -ExecutionPolicy Bypass -File .\INSTALL_CHALKBOARD_CALM_FIXED_SHELL.ps1

Then:

Remove-Item .\.next -Recurse -Force -ErrorAction SilentlyContinue
npm run build

BACKUPS
-------
app/globals.before-calm-shell.css
app/layout.before-calm-shell.js
app/app/admin/page.before-calm-shell.js
app/app/page.before-calm-shell.js

Do not commit backup files.
