CHALKBOARD WEBSITE RESIZE PATCH
===============================

REPLACES
--------
app/page.module.css

CHANGES
-------
- Header reduced to 68px
- Header logo reduced to 158px
- Navigation and sign-in button reduced
- Hero reduced to approximately 535px
- Hero heading reduced to a maximum of 60px
- Hero paragraph reduced to 17px
- Action buttons moved above the fold
- Dashboard illustration reduced
- Feature cards reduced
- Section spacing tightened
- CTA logo and spacing reduced
- Footer logo reduced to 150px
- Mobile layout tightened

INSTALL
-------
Extract into:

C:\Users\Dell\Downloads\chalkboard-x\chalkboard

Choose Replace files in the destination.

BUILD
-----
npm run build

DEPLOY
------
git add app/page.module.css
git commit -m "Resize Chalkboard marketing website"
git push
