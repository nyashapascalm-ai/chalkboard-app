CHALKBOARD COMMUNICATIONS CENTRE 1.0

Adds Communication -> Communications.

Features:
- Draft, queue and schedule announcements
- Normal, important, urgent and emergency priority
- In-app, email, SMS and WhatsApp channels
- Teachers, staff, learners, classes, governing board, custom groups and manual recipients
- Recipient snapshots
- Per-recipient, per-channel delivery queue
- Message templates
- Reusable recipient groups
- Delivery history and retry preparation
- Non-secret provider settings
- Quiet hours and emergency override
- Provider message IDs, webhook events, read receipts and failure fields

Current behaviour:
- In-app deliveries are recorded immediately as delivered.
- Email, SMS and WhatsApp are stored as pending_provider until a server-side provider adapter is connected.
- API keys and secrets are deliberately excluded from browser and database configuration fields.

Install:
1. Run supabase/20260802_chalkboard_communications.sql in Supabase SQL Editor.
2. Extract into C:\Users\Dell\Downloads\chalkboard-x\chalkboard
3. Run:
   powershell -ExecutionPolicy Bypass -File .\INSTALL_CHALKBOARD_COMMUNICATIONS_CENTRE.ps1
4. Run npm run build

Backup:
app/app/admin/page.before-communications-centre.js
Do not commit the backup.
