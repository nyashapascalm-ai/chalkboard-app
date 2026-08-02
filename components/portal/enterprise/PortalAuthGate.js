"use client";

import { useEffect, useState } from "react";

import { supabase } from "../../../lib/supabaseClient";
import PortalLoading from "./PortalLoading";
import PortalMessage from "./PortalMessage";

export default function PortalAuthGate({
  requiredRole,
  loadingLabel,
  children,
}) {
  const [state, setState] = useState({
    loading: true,
    session: null,
    profile: null,
    error: "",
  });

  useEffect(() => {
    let mounted = true;

    async function verify() {
      try {
        const { data: sessionData, error: sessionError } =
          await supabase.auth.getSession();

        if (sessionError) throw sessionError;

        const session = sessionData.session;

        if (!session) {
          window.location.replace("/app");
          return;
        }

        const { data: profile, error: profileError } =
          await supabase
            .from("profiles")
            .select(
              "id,role,status,full_name,school_id",
            )
            .eq("id", session.user.id)
            .maybeSingle();

        if (profileError) throw profileError;

        if (
          profile?.role !== requiredRole ||
          profile?.status !== "active"
        ) {
          window.location.replace("/app");
          return;
        }

        if (mounted) {
          setState({
            loading: false,
            session,
            profile,
            error: "",
          });
        }
      } catch (caught) {
        if (!mounted) return;

        setState({
          loading: false,
          session: null,
          profile: null,
          error:
            caught instanceof Error
              ? caught.message
              : "Unable to verify portal access.",
        });
      }
    }

    verify();

    const { data: subscription } =
      supabase.auth.onAuthStateChange(
        (_event, session) => {
          if (!session) {
            window.location.replace("/app");
          }
        },
      );

    return () => {
      mounted = false;
      subscription.subscription.unsubscribe();
    };
  }, [requiredRole]);

  if (state.loading) {
    return (
      <PortalLoading
        label={loadingLabel || "Loading portal..."}
      />
    );
  }

  if (state.error) {
    return (
      <PortalMessage
        title="Portal unavailable"
        message={state.error}
      />
    );
  }

  return children({
    session: state.session,
    profile: state.profile,
  });
}
