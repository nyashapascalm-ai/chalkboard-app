"use client";

import { Download, LogOut } from "lucide-react";

import ExportToolbar from "../../ExportToolbar";
import { installChalkboardApp } from "../../../lib/installApp";
import { supabase } from "../../../lib/supabaseClient";

export default function EnterprisePortalShell({
  roleTitle,
  subtitle,
  heading,
  headingNote,
  icon: RoleIcon,
  user,
  exportTitle,
  navigation,
  children,
}) {
  async function signOut() {
    await supabase.auth.signOut();
    window.location.assign("/app");
  }

  return (
    <main className="enterprise-portal">
      <aside className="enterprise-sidebar">
        <div className="enterprise-brand">
          <img
            src="/chalkboard-sidebar-mark.png"
            alt="Chalkboard"
          />
        </div>

        <div className="enterprise-role">
          <RoleIcon size={20} />
          <div>
            <strong>{roleTitle}</strong>
            <span>{subtitle}</span>
          </div>
        </div>

        {navigation}

        <div className="enterprise-user">
          <strong>{user?.name}</strong>
          <span>{user?.email}</span>
        </div>

        <div className="enterprise-sidebar-actions">
          <button
            onClick={installChalkboardApp}
            className="ghost"
          >
            <Download size={16} />
            Download app
          </button>

          <button
            onClick={signOut}
            className="ghost"
          >
            <LogOut size={16} />
            Sign out
          </button>
        </div>
      </aside>

      <section className="enterprise-main">
        <header className="enterprise-header">
          <div>
            <p>Chalkboard</p>
            <h1>{heading}</h1>
            <span>{headingNote}</span>
          </div>

          <ExportToolbar
            title={exportTitle || heading}
            scopeSelector=".enterprise-main"
          />
        </header>

        {children}
      </section>
    </main>
  );
}
