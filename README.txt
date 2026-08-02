CHALKBOARD BUDGET + INVOICE FIX 1.0

FIX
---
The shared students table does not contain email and phone columns.
The invoice and receipt learner selector now loads only:
- id
- full_name

Email and phone remain manual recipient fields.

ANNUAL BUDGET
-------------
Adds Finance -> Annual budget.

Features:
- Financial year and version control
- Draft, submitted, approved, rejected, locked and archived statuses
- Projected learner count
- Projected fees:
  learners x fee per learner x school terms
- Projected levies:
  learners x annual levy
- Other income categories
- Full expenditure categories
- Quantity x unit rate x periods calculations
- Projected income
- Planned expenditure
- Surplus or deficit
- Expense allocation percentages
- Submission, approval and lock workflow
- Approval history foundation

DATABASE
--------
Run:
supabase/20260802_chalkboard_budgets.sql

INSTALL
-------
1. Extract into the Chalkboard project.
2. Run the SQL.
3. Run:
   powershell -ExecutionPolicy Bypass -File .\INSTALL_CHALKBOARD_BUDGET_AND_INVOICE_FIX.ps1
4. Run:
   npm run build

BACKUP
------
The installer creates:
app/app/admin/page.before-budget-module.js

Do not commit the backup.
