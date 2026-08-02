"use client";

import { useState } from "react";
import { BookMarked, Plus, Trash2 } from "lucide-react";

import { supabase } from "../../../lib/supabaseClient";
import EmptyState from "../../ui/EmptyState";
import SectionCard from "../../ui/SectionCard";

export default function SubjectsPanel({
  schoolId,
  subjects,
  onChange,
}) {
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [removingId, setRemovingId] =
    useState("");
  const [error, setError] = useState("");

  async function addSubject(event) {
    event.preventDefault();

    const cleanName = name.trim();
    if (!cleanName || busy) return;

    setBusy(true);
    setError("");

    const { error: insertError } =
      await supabase.from("subjects").insert({
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

  async function removeSubject(item) {
    if (
      !confirm(
        `Remove ${item.name}? Teacher allocations and Dari academic records may depend on this subject.`,
      )
    ) {
      return;
    }

    setRemovingId(item.id);
    setError("");

    const { error: deleteError } =
      await supabase
        .from("subjects")
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
        title="Subject catalogue"
        description="Define the subjects used for teaching allocations and shared Dari academic workflows."
      >
        <form
          className="inline-create-form"
          onSubmit={addSubject}
        >
          <label>
            Subject name
            <input
              value={name}
              onChange={(event) =>
                setName(event.target.value)
              }
              placeholder="For example: Mathematics"
            />
          </label>

          <button type="submit" disabled={busy}>
            <Plus size={17} />
            {busy ? "Adding..." : "Add subject"}
          </button>
        </form>

        {error ? (
          <p className="error">{error}</p>
        ) : null}
      </SectionCard>

      <SectionCard
        title="Current subjects"
        description={`${subjects.length} subject${
          subjects.length === 1 ? "" : "s"
        } configured.`}
      >
        {subjects.length ? (
          <div className="management-list">
            {subjects.map((item) => (
              <div
                className="management-list-row"
                key={item.id}
              >
                <div className="management-list-icon">
                  <BookMarked size={18} />
                </div>

                <div className="management-list-copy">
                  <strong>{item.name}</strong>
                  <span>
                    Available for teacher and Dari
                    allocation
                  </span>
                </div>

                <button
                  className="ghost compact-action"
                  onClick={() =>
                    removeSubject(item)
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
            title="No subjects configured"
            description="Add the first subject to make it available for teacher allocations."
            icon={BookMarked}
          />
        )}
      </SectionCard>
    </div>
  );
}
