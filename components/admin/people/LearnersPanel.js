"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  GraduationCap,
  Plus,
  Save,
  Search,
  Trash2,
  Upload,
  UserRound,
} from "lucide-react";

import { supabase } from "../../../lib/supabaseClient";
import EmptyState from "../../ui/EmptyState";
import SectionCard from "../../ui/SectionCard";

const EMPTY_FORM = {
  full_name: "",
  class_id: "",
  gender: "",
  dob: "",
  guardian_name: "",
  guardian_phone: "",
  address: "",
  notes: "",
};

export default function LearnersPanel({
  schoolId,
  classes,
  isTeacher,
}) {
  const [classId, setClassId] = useState("");
  const [rows, setRows] = useState([]);
  const [editing, setEditing] = useState(null);
  const [quickName, setQuickName] = useState("");
  const [bulk, setBulk] = useState("");
  const [search, setSearch] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!classId && classes.length) {
      setClassId(classes[0].id);
    }
  }, [classes, classId]);

  useEffect(() => {
    load();
  }, [schoolId, classId]);

  async function load() {
    if (!schoolId || !classId) {
      setRows([]);
      return;
    }

    const { data, error: loadError } =
      await supabase
        .from("students")
        .select("*")
        .eq("school_id", schoolId)
        .eq("class_id", classId)
        .order("full_name");

    setRows(data || []);

    if (loadError) {
      setError(loadError.message);
    }
  }

  function className(id) {
    return (
      classes.find((item) => item.id === id)
        ?.name || null
    );
  }

  async function addQuick(event) {
    event.preventDefault();

    if (!quickName.trim() || !classId) {
      setError(
        "Select a class and enter the learner name.",
      );
      return;
    }

    setBusy(true);
    setError("");

    const { error: insertError } =
      await supabase.from("students").insert({
        school_id: schoolId,
        full_name: quickName.trim(),
        class_id: classId,
        klass: className(classId),
      });

    if (insertError) {
      setError(insertError.message);
    } else {
      setQuickName("");
      await load();
    }

    setBusy(false);
  }

  async function addBulk() {
    const names = bulk
      .split("\n")
      .map((value) => value.trim())
      .filter(Boolean);

    if (!names.length || !classId) {
      setError(
        "Select a class and enter at least one learner name.",
      );
      return;
    }

    setBusy(true);
    setError("");

    const { error: insertError } =
      await supabase.from("students").insert(
        names.map((name) => ({
          school_id: schoolId,
          full_name: name,
          class_id: classId,
          klass: className(classId),
        })),
      );

    if (insertError) {
      setError(insertError.message);
    } else {
      setBulk("");
      await load();
    }

    setBusy(false);
  }

  const filteredRows = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return rows;

    return rows.filter((row) =>
      [
        row.full_name,
        row.guardian_name,
        row.guardian_phone,
      ].some((value) =>
        String(value || "")
          .toLowerCase()
          .includes(query),
      ),
    );
  }, [rows, search]);

  if (!classes.length) {
    return (
      <EmptyState
        title={
          isTeacher
            ? "No assigned classes"
            : "No classes configured"
        }
        description={
          isTeacher
            ? "Your learner list will become available after classes are assigned."
            : "Create classes before adding learner records."
        }
        icon={GraduationCap}
      />
    );
  }

  if (editing) {
    return (
      <LearnerRecord
        student={editing}
        classes={classes}
        schoolId={schoolId}
        onBack={() => setEditing(null)}
        onSaved={async () => {
          setEditing(null);
          await load();
        }}
      />
    );
  }

  return (
    <div className="feature-stack">
      <section className="people-summary-grid">
        <article className="people-summary-card">
          <GraduationCap size={20} />
          <strong>{rows.length}</strong>
          <span>Learners in selected class</span>
        </article>

        <article className="people-summary-card">
          <UserRound size={20} />
          <strong>{classes.length}</strong>
          <span>Available classes</span>
        </article>
      </section>

      <SectionCard
        title="Learner register"
        description="Select a class, search its learner list and open individual records."
        actions={
          <select
            value={classId}
            onChange={(event) =>
              setClassId(event.target.value)
            }
            className="compact-select"
          >
            {classes.map((item) => (
              <option
                key={item.id}
                value={item.id}
              >
                {item.name}
              </option>
            ))}
          </select>
        }
      >
        <label className="search-field">
          <Search size={17} />
          <input
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder="Search learners or guardians"
          />
        </label>

        {filteredRows.length ? (
          <div className="learner-list">
            {filteredRows.map((row) => (
              <button
                type="button"
                className="learner-row"
                key={row.id}
                onClick={() => setEditing(row)}
              >
                <div className="management-list-icon">
                  <UserRound size={18} />
                </div>

                <div>
                  <strong>{row.full_name}</strong>
                  <span>
                    {row.guardian_name ||
                      "No guardian recorded"}
                  </span>
                </div>

                <span className="learner-open">
                  Open record
                </span>
              </button>
            ))}
          </div>
        ) : (
          <EmptyState
            title="No learners found"
            description="Add learners below or change the selected class."
            icon={GraduationCap}
          />
        )}
      </SectionCard>

      {!isTeacher ? (
        <>
          <SectionCard
            title="Add a learner"
            description="Create a basic learner record, then open it to complete the full profile."
          >
            <form
              className="inline-create-form"
              onSubmit={addQuick}
            >
              <label>
                Learner full name
                <input
                  value={quickName}
                  onChange={(event) =>
                    setQuickName(event.target.value)
                  }
                  placeholder="For example: Tadiwa Moyo"
                />
              </label>

              <button
                type="submit"
                disabled={busy}
              >
                <Plus size={17} />
                Add learner
              </button>
            </form>
          </SectionCard>

          <SectionCard
            title="Bulk add learners"
            description="Paste one full name per line. Every learner will be added to the selected class."
          >
            <textarea
              value={bulk}
              onChange={(event) =>
                setBulk(event.target.value)
              }
              placeholder={
                "Tadiwa Moyo\nRutendo Sibanda\nTanaka Ncube"
              }
            />

            <div className="form-actions">
              <button
                type="button"
                onClick={addBulk}
                disabled={busy}
              >
                <Upload size={17} />
                Add all (
                {
                  bulk
                    .split("\n")
                    .map((value) =>
                      value.trim(),
                    )
                    .filter(Boolean).length
                }
                )
              </button>
            </div>
          </SectionCard>
        </>
      ) : null}

      {error ? <p className="error">{error}</p> : null}
    </div>
  );
}

function LearnerRecord({
  student,
  classes,
  schoolId,
  onBack,
  onSaved,
}) {
  const [form, setForm] = useState({
    ...EMPTY_FORM,
    full_name: student.full_name || "",
    class_id: student.class_id || "",
    gender: student.gender || "",
    dob: student.dob || "",
    guardian_name:
      student.guardian_name || "",
    guardian_phone:
      student.guardian_phone || "",
    address: student.address || "",
    notes: student.notes || "",
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  function update(key, value) {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function className(id) {
    return (
      classes.find((item) => item.id === id)
        ?.name || null
    );
  }

  async function save(event) {
    event.preventDefault();

    if (!form.full_name.trim()) {
      setError("Learner name is required.");
      return;
    }

    setBusy(true);
    setError("");

    const { error: updateError } =
      await supabase
        .from("students")
        .update({
          full_name: form.full_name.trim(),
          class_id: form.class_id || null,
          klass: className(form.class_id),
          gender: form.gender || null,
          dob: form.dob || null,
          guardian_name:
            form.guardian_name.trim() || null,
          guardian_phone:
            form.guardian_phone.trim() || null,
          address:
            form.address.trim() || null,
          notes: form.notes.trim() || null,
        })
        .eq("id", student.id)
        .eq("school_id", schoolId);

    if (updateError) {
      setError(updateError.message);
    } else {
      await onSaved();
    }

    setBusy(false);
  }

  async function removeLearner() {
    if (
      !confirm(
        `Remove ${student.full_name}? This cannot be undone.`,
      )
    ) {
      return;
    }

    setBusy(true);
    setError("");

    const { error: deleteError } =
      await supabase
        .from("students")
        .delete()
        .eq("id", student.id)
        .eq("school_id", schoolId);

    if (deleteError) {
      setError(deleteError.message);
      setBusy(false);
    } else {
      await onSaved();
    }
  }

  return (
    <div className="feature-stack">
      <button
        className="ghost back-action"
        onClick={onBack}
      >
        <ArrowLeft size={16} />
        Back to learners
      </button>

      <SectionCard
        title={student.full_name}
        description="Maintain the learner's core administrative and guardian information."
      >
        <form
          className="people-form"
          onSubmit={save}
        >
          <div className="form-grid">
            <label>
              Full name
              <input
                value={form.full_name}
                onChange={(event) =>
                  update(
                    "full_name",
                    event.target.value,
                  )
                }
              />
            </label>

            <label>
              Class
              <select
                value={form.class_id}
                onChange={(event) =>
                  update(
                    "class_id",
                    event.target.value,
                  )
                }
              >
                <option value="">
                  No class
                </option>
                {classes.map((item) => (
                  <option
                    key={item.id}
                    value={item.id}
                  >
                    {item.name}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Gender
              <select
                value={form.gender}
                onChange={(event) =>
                  update(
                    "gender",
                    event.target.value,
                  )
                }
              >
                <option value="">
                  Not recorded
                </option>
                <option value="female">
                  Female
                </option>
                <option value="male">
                  Male
                </option>
                <option value="other">
                  Other
                </option>
              </select>
            </label>

            <label>
              Date of birth
              <input
                type="date"
                value={form.dob}
                onChange={(event) =>
                  update(
                    "dob",
                    event.target.value,
                  )
                }
              />
            </label>

            <label>
              Guardian name
              <input
                value={form.guardian_name}
                onChange={(event) =>
                  update(
                    "guardian_name",
                    event.target.value,
                  )
                }
              />
            </label>

            <label>
              Guardian phone
              <input
                value={form.guardian_phone}
                onChange={(event) =>
                  update(
                    "guardian_phone",
                    event.target.value,
                  )
                }
              />
            </label>

            <label className="form-span-2">
              Address
              <input
                value={form.address}
                onChange={(event) =>
                  update(
                    "address",
                    event.target.value,
                  )
                }
              />
            </label>

            <label className="form-span-2">
              Notes
              <textarea
                value={form.notes}
                onChange={(event) =>
                  update(
                    "notes",
                    event.target.value,
                  )
                }
              />
            </label>
          </div>

          {error ? (
            <p className="error">{error}</p>
          ) : null}

          <div className="record-actions">
            <button
              type="submit"
              disabled={busy}
            >
              <Save size={17} />
              {busy ? "Saving..." : "Save record"}
            </button>

            <button
              type="button"
              className="ghost danger-action"
              disabled={busy}
              onClick={removeLearner}
            >
              <Trash2 size={17} />
              Remove learner
            </button>
          </div>
        </form>
      </SectionCard>
    </div>
  );
}
