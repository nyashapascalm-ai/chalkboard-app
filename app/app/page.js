"use client";

import {
  Building2,
  Eye,
  EyeOff,
  Landmark,
  ShieldCheck,
} from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";

const portals = {
  school_admin: {
    label: "School Administrator",
    description:
      "Manage learners, teachers, staff, finance, governance, communication and school operations.",
    icon: Building2,
    route: "/app/admin",
  },
  operator: {
    label: "Platform Operator",
    description:
      "Manage connected schools, administrators, subscriptions and platform operations.",
    icon: ShieldCheck,
    route: "/app/operator",
  },
  ministry_official: {
    label: "Ministry Official",
    description:
      "Review aggregated school participation, geographical coverage and education reporting.",
    icon: Landmark,
    route: "/app/ministry",
  },
};

export default function ChalkboardAppLogin() {
  const [portal, setPortal] = useState("school_admin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getSession();

      if (!data.session) {
        setChecking(false);
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role,school_id,status")
        .eq("id", data.session.user.id)
        .maybeSingle();

      if (
        profile?.status === "active" &&
        portals[profile.role]
      ) {
        location.replace(portals[profile.role].route);
        return;
      }

      setChecking(false);
    })();
  }, []);

  async function signIn(event) {
    event.preventDefault();
    if (busy) return;

    setBusy(true);
    setStatus("");

    try {
      const { data, error } =
        await supabase.auth.signInWithPassword({
          email: email.trim().toLowerCase(),
          password,
        });

      if (error || !data.user) {
        throw error || new Error("Sign in failed.");
      }

      const { data: profile, error: profileError } =
        await supabase
          .from("profiles")
          .select("role,school_id,status")
          .eq("id", data.user.id)
          .maybeSingle();

      if (profileError || !profile) {
        await supabase.auth.signOut();
        throw (
          profileError ||
          new Error(
            "No Chalkboard profile is linked to this account.",
          )
        );
      }

      if (profile.status !== "active") {
        await supabase.auth.signOut();
        throw new Error(
          "This Chalkboard account is not active.",
        );
      }

      if (profile.role !== portal) {
        await supabase.auth.signOut();
        throw new Error(
          `These credentials belong to a ${
            portals[profile.role]?.label || profile.role
          } account.`,
        );
      }

      if (
        profile.role === "school_admin" &&
        !profile.school_id
      ) {
        await supabase.auth.signOut();
        throw new Error(
          "Your administrator account has not been assigned to a school. Contact the platform operator.",
        );
      }

      location.assign(portals[profile.role].route);
    } catch (error) {
      setStatus(
        error instanceof Error
          ? error.message
          : "Unable to sign in.",
      );
      setBusy(false);
    }
  }

  if (checking) {
    return (
      <main className="cb-auth-page">
        <p>Checking your Chalkboard session...</p>
      </main>
    );
  }

  const selected = portals[portal];

  return (
    <main className="cb-auth-page">
      <section className="cb-auth-card">
        <img
          src="/brand/chalkboard-logo.png"
          alt="Chalkboard"
          className="cb-auth-logo"
        />

        <div className="cb-auth-heading">
          <p>School Management. Simplified.</p>
          <h1>Sign in to Chalkboard</h1>
        </div>

        <div className="cb-role-grid">
          {Object.entries(portals).map(
            ([value, option]) => {
              const Icon = option.icon;

              return (
                <button
                  type="button"
                  key={value}
                  onClick={() => {
                    setPortal(value);
                    setStatus("");
                  }}
                  className={
                    portal === value
                      ? "cb-role-option active"
                      : "cb-role-option"
                  }
                >
                  <Icon size={21} />
                  <span>
                    <strong>{option.label}</strong>
                    <small>{option.description}</small>
                  </span>
                </button>
              );
            },
          )}
        </div>

        <form
          onSubmit={signIn}
          className="cb-auth-form"
        >
          <label>
            <span>Email address</span>
            <input
              required
              type="email"
              value={email}
              onChange={(event) =>
                setEmail(event.target.value)
              }
              placeholder="you@example.com"
              autoComplete="email"
            />
          </label>

          <label>
            <span>Password</span>
            <div className="cb-password-field">
              <input
                required
                type={show ? "text" : "password"}
                value={password}
                onChange={(event) =>
                  setPassword(event.target.value)
                }
                autoComplete="current-password"
              />

              <button
                type="button"
                onClick={() =>
                  setShow((current) => !current)
                }
                aria-label={
                  show ? "Hide password" : "Show password"
                }
              >
                {show ? (
                  <EyeOff size={19} />
                ) : (
                  <Eye size={19} />
                )}
              </button>
            </div>
          </label>

          {status ? (
            <div className="cb-auth-error">
              {status}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={busy}
            className="cb-auth-submit"
          >
            {busy
              ? "Signing in..."
              : `Sign in as ${selected.label}`}
          </button>
        </form>

        <a href="/" className="cb-back-link">
          Return to Chalkboard website
        </a>
      </section>
    </main>
  );
}
