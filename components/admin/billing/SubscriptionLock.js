"use client";

import { LockKeyhole, LogOut } from "lucide-react";

import { supabase } from "../../../lib/supabaseClient";
import ChalkMark from "../../brand/ChalkMark";
import SchoolBillingPanel from "./SchoolBillingPanel";

export default function SubscriptionLock({
  schoolId,
  due,
}) {
  return (
    <div className="subscription-lock-page">
      <section className="subscription-lock-card">
        <ChalkMark size={52} />

        <div className="subscription-lock-heading">
          <LockKeyhole size={27} />
          <div>
            <h1>Subscription overdue</h1>
            <p>
              Chalkboard access is paused because
              the subscription due on{" "}
              <strong>{due}</strong> remains
              unpaid after the grace period.
            </p>
          </div>
        </div>

        <SchoolBillingPanel
          schoolId={schoolId}
          compact
        />

        <button
          className="ghost subscription-lock-signout"
          onClick={() => supabase.auth.signOut()}
        >
          <LogOut size={16} />
          Sign out
        </button>
      </section>
    </div>
  );
}
