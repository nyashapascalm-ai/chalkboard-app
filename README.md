# Chalkboard — school management (attendance module)

Separate app, shares the ConnectHub Supabase database, so the school/operator logins
you already generate work here too.

## One-time setup
1. In Supabase → SQL Editor, run `chalkboard-attendance.sql` (creates students + attendance).
2. Extract this folder somewhere, e.g. Downloads\chalkboard.
3. Copy `.env.local.example` to `.env.local` and paste the SAME two values you use in
   ConnectHub:
     NEXT_PUBLIC_SUPABASE_URL=...
     NEXT_PUBLIC_SUPABASE_ANON_KEY=...
4. In that folder:  npm install
5. Run it on its own port (so it won't clash with ConnectHub on 3000):
     npm run dev -- -p 3001
6. Open http://localhost:3001 and sign in with an operator or school login.

## What it does
- Operator: pick any school from the dropdown.
- School (head/teacher): lands on their own school automatically.
- Students tab: add / list / remove students (name + class).
- Attendance tab: pick a date, mark each student Present / Absent / Late, Save.
  Saving again for the same date updates it.
