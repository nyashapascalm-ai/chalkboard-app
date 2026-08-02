CHALKBOARD WEBSITE + PWA REBRAND 1.0

Routes:
/ public marketing website
/app existing login and complete school-management system
/download PWA installation page
/offline offline fallback

Install:
1. Extract into C:\Users\Dell\Downloads\chalkboard-x\chalkboard
2. Replace files.
3. Run: powershell -ExecutionPolicy Bypass -File .\INSTALL_CHALKBOARD_WEBSITE.ps1
4. Run: npm run build
5. Test /, /app, /download, password reset and subscription payment return.
6. Deploy with git add .; git commit -m "Add Chalkboard website and branded PWA experience"; git push
