"use client";

import { useState } from "react";
import { CheckCircle2, KeyRound } from "lucide-react";

import { supabase } from "../../lib/supabaseClient";
import ChalkMark from "../brand/ChalkMark";

export default function PasswordRecovery({
  onDone,
}) {
  const [password, setPassword] =
    useState("");
  const [confirmPassword, setConfirmPassword] =
    useState("");
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  async function save(event) {
    event.preventDefault();

    if (password.length < 8) {
      setError(
        "Use a password with at least 8 characters.",
      );
      return;
    }

    if (password !== confirmPassword) {
      setError("The passwords do not match.");
      return;
    }

    setBusy(true);
    setError("");

    const { error: updateError } =
      await supabase.auth.updateUser({
        password,
      });

    if (updateError) {
      setError(updateError.message);
    } else {
      setSaved(true);
    }

    setBusy(false);
  }

  return (
    <div className="center">
      <div className="card recovery-card">
        <ChalkMark size={50} />

        {saved ? (
          <>
            <CheckCircle2
              className="recovery-success"
              size={30}
            />
            <h1>Password updated</h1>
            <p className="muted">
              Your new password is ready to use.
            </p>
            <button onClick={onDone}>
              Continue to Chalkboard
            </button>
          </>
        ) : (
          <>
            <KeyRound
              className="recovery-icon"
              size={28}
            />
            <h1>Set a new password</h1>
            <p className="muted">
              Choose a secure password for your
              Chalkboard account.
            </p>

            <form onSubmit={save}>
              <label>
                New password
                <input
                  type="password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(event) =>
                    setPassword(
                      event.target.value,
                    )
                  }
                />
              </label>

              <label>
                Confirm password
                <input
                  type="password"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(event) =>
                    setConfirmPassword(
                      event.target.value,
                    )
                  }
                />
              </label>

              {error ? (
                <p className="error">{error}</p>
              ) : null}

              <button
                type="submit"
                disabled={busy}
              >
                {busy
                  ? "Updating..."
                  : "Update password"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
