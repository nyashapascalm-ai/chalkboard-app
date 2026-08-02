"use client";

import { useState } from "react";
import { BookOpen, Plus, Trash2 } from "lucide-react";

import { supabase } from "../../../lib/supabaseClient";
import EmptyState from "../../ui/EmptyState";
import SectionCard from "../../ui/SectionCard";

export default function ClassesPanel({
  schoolId,
  classes,
  onChange,
}) {
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [removingId, setRemovingId] =
    useState("");
  const [error, setError] = useState("");

  async function addClass(event) {
    event.preventDefault();

    const cleanName = name.trim();
    if (!cleanName || busy) return;

    setBusy(true);
    setError("");

    const { error: insertError } =
      await supabase.from("classes").insert({
        school_id: schoolId,
        name: cleanName,
      });

    if (insertError) {
      setError(insertError.message);
    } else {
      setName("");
      await onChange();
    }

    setBusy(false);
  }

  async function removeClass(item) {
    if (
      !confirm(
        `Remove ${item.name}? Learners and teaching allocations may depend on this class.`,
      )
    ) {
      return;
    }

    setRemovingId(item.id);
    setError("");

    const { error: deleteError } =
      await supabase
        .from("classes")
        .delete()
        .eq("id", item.id)
        .eq("school_id", schoolId);

    if (deleteError) {
      setError(deleteError.message);
    } else {
      await onChange();
    }

    setRemovingId("");
  }

  return (
    <div className="feature-stack">
      <SectionCard
        title="Class structure"
        description="Create the classes and forms used by learners, teachers and Dari teaching allocations."
      >
        <form
          className="inline-create-form"
          onSubmit={addClass}
        >
          <label>
            Class or form name
            <input
              value={name}
              onChange={(event) =>
                setName(event.target.value)
              }
              placeholder="For example: Form 3A"
            />
          </label>

          <button type="submit" disabled={busy}>
            <Plus size={17} />
            {busy ? "Adding..." : "Add class"}
          </button>
        </form>

        {error ? (
          <p className="error">{error}</p>
        ) : null}
      </SectionCard>

      <SectionCard
        title="Current classes"
        description={`${classes.length} class${
          classes.length === 1 ? "" : "es"
        } configured.`}
      >
        {classes.length ? (
          <div className="management-list">
            {classes.map((item) => (
              <div
                className="management-list-row"
                key={item.id}
              >
                <div className="management-list-icon">
                  <BookOpen size={18} />
                </div>

                <div className="management-list-copy">
                  <strong>{item.name}</strong>
                  <span>
                    Available for learner and teacher
                    allocation
                  </span>
                </div>

                <button
                  className="ghost compact-action"
                  onClick={() =>
                    removeClass(item)
                  }
                  disabled={removingId === item.id}
                >
                  <Trash2 size={15} />
                  {removingId === item.id
                    ? "Removing..."
                    : "Remove"}
                </button>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            title="No classes configured"
            description="Add the first class or form to begin organising learners and teaching allocations."
            icon={BookOpen}
          />
        )}
      </SectionCard>
    </div>
  );
}
