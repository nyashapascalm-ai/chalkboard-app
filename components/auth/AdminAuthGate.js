"use client";

import { useEffect, useState } from "react";
import { ExternalLink, LogOut } from "lucide-react";

import { supabase } from "../../lib/supabaseClient";
import AdminConsole from "../admin/AdminConsole";
import ChalkMark from "../brand/ChalkMark";
import PasswordRecovery from "./PasswordRecovery";

export default function AdminAuthGate() {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(undefined);
  const [checking, setChecking] = useState(true);
  const [recovery, setRecovery] = useState(false);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session || null);
      setChecking(false);
    });

    const { data: subscription } =
      supabase.auth.onAuthStateChange(
        (event, nextSession) => {
          setSession(nextSession || null);

          if (event === "PASSWORD_RECOVERY") {
            setRecovery(true);
          }

          if (!nextSession) {
            setProfile(undefined);
          }
        },
      );

    return () => {
      mounted = false;
      subscription.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    async function loadProfile() {
      if (!session?.user?.id) {
        setProfile(null);
        return;
      }

      setProfile(undefined);

      const { data, error } = await supabase
        .from("profiles")
        .select(
          "id,role,school_id,status,full_name,email",
        )
        .eq("id", session.user.id)
        .maybeSingle();

      if (error) {
        setProfile({
          error: error.message,
        });
        return;
      }

      setProfile(data || null);
    }

    loadProfile();
  }, [session?.user?.id]);

  useEffect(() => {
    if (!session && !checking) {
      window.location.replace("/app");
    }
  }, [session, checking]);

  useEffect(() => {
    if (!profile?.role) return;

    if (profile.role === "ministry_official") {
      window.location.replace("/app/ministry");
    }
  }, [profile?.role]);

  if (checking || (session && profile === undefined)) {
    return (
      <div className="center muted">
        Loading Chalkboard...
      </div>
    );
  }

  if (recovery && session) {
    return (
      <PasswordRecovery
        onDone={() => setRecovery(false)}
      />
    );
  }

  if (!session) {
    return (
      <div className="center muted">
        Opening Chalkboard sign in...
      </div>
    );
  }

  if (profile?.error) {
    return (
      <AccessMessage
        title="Profile unavailable"
        message={profile.error}
      />
    );
  }

  if (
    profile?.status &&
    profile.status !== "active"
  ) {
    return (
      <AccessMessage
        title="Account unavailable"
        message="This account is not active. Contact the platform operator."
      />
    );
  }

  if (
    profile?.role === "school_admin" ||
    profile?.role === "operator"
  ) {
    return (
      <AdminConsole
        session={session}
        role={profile.role}
        initialSchoolId={
          profile.school_id || null
        }
      />
    );
  }

  if (profile?.role === "teacher") {
    return (
      <AccessMessage
        title="Teaching tools are in Dari"
        message="Teacher attendance, marks, report cards, timetables and class teaching workflows are managed in Dari rather than Chalkboard."
        action={
          <button
            onClick={() =>
              supabase.auth.signOut()
            }
          >
            <LogOut size={16} />
            Sign out
          </button>
        }
      />
    );
  }

  return (
    <AccessMessage
      title="No Chalkboard access"
      message="This account is not assigned to the School Administrator or Operator role."
    />
  );
}

function AccessMessage({
  title,
  message,
  action,
}) {
  return (
    <div className="center">
      <div
        className="card access-message-card"
      >
        <ChalkMark size={50} />
        <h1>{title}</h1>
        <p className="muted">{message}</p>

        {action || (
          <div className="access-message-actions">
            <button
              className="ghost"
              onClick={() =>
                window.location.replace("/app")
              }
            >
              <ExternalLink size={16} />
              Return to sign in
            </button>

            <button
              onClick={() =>
                supabase.auth.signOut()
              }
            >
              <LogOut size={16} />
              Sign out
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
