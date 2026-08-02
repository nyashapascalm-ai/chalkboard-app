CHALKBOARD PERSONNEL + GOVERNING BOARD 1.0

Adds People -> Personnel records:
- date of birth and calculated age
- national ID and employee number
- position, department and employment dates
- professional registration number, body and expiry
- qualifications, institution, field and graduation year
- previous employment and references
- trade union membership
- restricted police clearance, conviction and suitability records

Adds Governance -> Governing board:
- annual board terms
- start and end dates
- board roles and representing group
- appointment and service dates
- contact details
- qualifications and expertise
- declarations of interest
- active/completed board history

INSTALL
1. Run supabase/20260802_chalkboard_personnel_governance.sql in Supabase.
2. Extract this package into C:\Users\Dell\Downloads\chalkboard-x\chalkboard
3. Run:
   powershell -ExecutionPolicy Bypass -File .\INSTALL_CHALKBOARD_PERSONNEL_GOVERNANCE.ps1
4. Run npm run build

Do not commit app/app/admin/page.before-personnel-governance.js.
