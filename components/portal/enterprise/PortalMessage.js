"use client";

import { AlertCircle, LogOut } from "lucide-react";

import { supabase } from "../../../lib/supabaseClient";

export default function PortalMessage({
  title,
  message,
}) {
  return (
    <main className="enterprise-portal-loading">
      <div className="enterprise-message-card">
        <AlertCircle size={30} />
        <h1>{title}</h1>
        <p>{message}</p>
        <button
          onClick={() => supabase.auth.signOut()}
        >
          <LogOut size={16} />
          Sign out
        </button>
      </div>
    </main>
  );
}
