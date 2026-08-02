CHALKBOARD ROLE PORTALS 1.0

Adds:
- /app official role-aware login
- /app/admin existing full School Administrator console
- /app/operator live platform metrics and school registry
- /app/ministry read-only aggregated oversight

Also:
- replaces the old green checkmark with the official Chalkboard icon
- removes corrupted non-ASCII navigation characters from the legacy Admin console
- validates account role and status
- blocks School Administrators without a school assignment

Install:
1. Extract into C:\Users\Dell\Downloads\chalkboard-x\chalkboard
2. Run:
   powershell -ExecutionPolicy Bypass -File .\INSTALL_CHALKBOARD_ROLE_PORTALS.ps1
3. Run:
   npm run build

Expected routes:
/
/app
/app/admin
/app/operator
/app/ministry
/download
/offline

Test:
School Admin: admin@chakari.co.zw
Operator: nyashapascalm@gmail.com
Ministry: pascal.nyasha@computefabric.co.uk

Deploy:
git add .
git commit -m "Add Chalkboard role portals and official app branding"
git push

Do not run INSTALL_CHALKBOARD_WEBSITE.ps1 again after this patch.
