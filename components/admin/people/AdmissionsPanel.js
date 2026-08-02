"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  ClipboardList,
  GraduationCap,
  Plus,
  Trash2,
} from "lucide-react";

import { supabase } from "../../../lib/supabaseClient";
import EmptyState from "../../ui/EmptyState";
import SectionCard from "../../ui/SectionCard";
import StatusBadge from "../../ui/StatusBadge";

const EMPTY_FORM = {
  full_name: "",
  guardian_name: "",
  guardian_phone: "",
  class_id: "",
};

export default function AdmissionsPanel({
  schoolId,
  classes,
}) {
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [busy, setBusy] = useState(false);
  const [changing, setChanging] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    load();
  }, [schoolId]);

  async function load() {
    const { data, error: loadError } =
      await supabase
        .from("applicants")
        .select("*")
        .eq("school_id", schoolId)
        .order("created_at", {
          ascending: false,
        });

    setRows(data || []);

    if (loadError) {
      setError(loadError.message);
    }
  }

  function update(key, value) {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function className(classId) {
    return (
      classes.find(
        (item) => item.id === classId,
      )?.name || "Not assigned"
    );
  }

  async function addApplication(event) {
    event.preventDefault();

    if (!form.full_name.trim()) {
      setError("Enter the applicant name.");
      return;
    }

    setBusy(true);
    setError("");

    const { error: insertError } =
      await supabase.from("applicants").insert({
        school_id: schoolId,
        full_name: form.full_name.trim(),
        guardian_name:
          form.guardian_name.trim() || null,
        guardian_phone:
          form.guardian_phone.trim() || null,
        class_id: form.class_id || null,
        status: "pending",
      });

    if (insertError) {
      setError(insertError.message);
    } else {
      setForm(EMPTY_FORM);
      await load();
    }

    setBusy(false);
  }

  async function setStatus(item, status) {
    const key = `status:${item.id}`;
    setChanging(key);
    setError("");

    const { error: updateError } =
      await supabase
        .from("applicants")
        .update({ status })
        .eq("id", item.id)
        .eq("school_id", schoolId);

    if (updateError) {
      setError(updateError.message);
    } else {
      await load();
    }

    setChanging("");
  }

  async function enroll(item) {
    const key = `enroll:${item.id}`;
    setChanging(key);
    setError("");

    const selectedClass = classes.find(
      (entry) => entry.id === item.class_id,
    );

    const { error: studentError } =
      await supabase.from("students").insert({
        school_id: schoolId,
        full_name: item.full_name,
        class_id: item.class_id || null,
        klass: selectedClass?.name || null,
        guardian_name:
          item.guardian_name || null,
        guardian_phone:
          item.guardian_phone || null,
      });

    if (studentError) {
      setError(studentError.message);
      setChanging("");
      return;
    }

    const { error: applicantError } =
      await supabase
        .from("applicants")
        .update({ status: "enrolled" })
        .eq("id", item.id)
        .eq("school_id", schoolId);

    if (applicantError) {
      setError(applicantError.message);
    } else {
      await load();
    }

    setChanging("");
  }

  async function remove(item) {
    if (
      !confirm(
        `Remove the application for ${item.full_name}?`,
      )
    ) {
      return;
    }

    const key = `remove:${item.id}`;
    setChanging(key);
    setError("");

    const { error: removeError } =
      await supabase
        .from("applicants")
        .delete()
        .eq("id", item.id)
        .eq("school_id", schoolId);

    if (removeError) {
      setError(removeError.message);
    } else {
      await load();
    }

    setChanging("");
  }

  const counts = useMemo(() => {
    return rows.reduce(
      (summary, item) => {
        const status = item.status || "pending";
        summary[status] =
          (summary[status] || 0) + 1;
        return summary;
      },
      {},
    );
  }, [rows]);

  return (
    <div className="feature-stack">
      <section className="people-summary-grid">
        <article className="people-summary-card">
          <ClipboardList size={20} />
          <strong>{rows.length}</strong>
          <span>Total applications</span>
        </article>

        <article className="people-summary-card">
          <Plus size={20} />
          <strong>{counts.pending || 0}</strong>
          <span>Pending review</span>
        </article>

        <article className="people-summary-card">
          <CheckCircle2 size={20} />
          <strong>{counts.accepted || 0}</strong>
          <span>Accepted</span>
        </article>

        <article className="people-summary-card">
          <GraduationCap size={20} />
          <strong>{counts.enrolled || 0}</strong>
          <span>Enrolled</span>
        </article>
      </section>

      <SectionCard
        title="New application"
        description="Record a prospective learner and the class they are applying for."
      >
        <form
          className="people-form"
          onSubmit={addApplication}
        >
          <div className="form-grid">
            <label>
              Applicant full name
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
              Class applying for
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
                  Select a class
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
          </div>

          {error ? (
            <p className="error">{error}</p>
          ) : null}

          <div className="form-actions">
            <button
              type="submit"
              disabled={busy}
            >
              <Plus size={17} />
              {busy
                ? "Saving..."
                : "Add application"}
            </button>
          </div>
        </form>
      </SectionCard>

      <SectionCard
        title="Applications"
        description="Review applications, update their status and enrol accepted learners."
      >
        {rows.length ? (
          <div className="admissions-list">
            {rows.map((item) => (
              <article
                className="admission-record"
                key={item.id}
              >
                <div className="admission-main">
                  <strong>{item.full_name}</strong>
                  <span>
                    {className(item.class_id)}
                  </span>
                </div>

                <div className="admission-contact">
                  <strong>
                    {item.guardian_name ||
                      "No guardian recorded"}
                  </strong>
                  <span>
                    {item.guardian_phone ||
                      "No phone recorded"}
                  </span>
                </div>

                <StatusBadge
                  status={item.status || "pending"}
                />

                <select
                  className="compact-select"
                  value={item.status || "pending"}
                  disabled={
                    changing ===
                    `status:${item.id}`
                  }
                  onChange={(event) =>
                    setStatus(
                      item,
                      event.target.value,
                    )
                  }
                >
                  <option value="pending">
                    Pending
                  </option>
                  <option value="accepted">
                    Accepted
                  </option>
                  <option value="enrolled">
                    Enrolled
                  </option>
                  <option value="rejected">
                    Rejected
                  </option>
                </select>

                <div className="admission-actions">
                  {item.status !== "enrolled" ? (
                    <button
                      className="compact-action"
                      disabled={
                        changing ===
                        `enroll:${item.id}`
                      }
                      onClick={() => enroll(item)}
                    >
                      <GraduationCap size={15} />
                      Enrol
                    </button>
                  ) : null}

                  <button
                    className="ghost compact-action"
                    disabled={
                      changing ===
                      `remove:${item.id}`
                    }
                    onClick={() => remove(item)}
                  >
                    <Trash2 size={15} />
                    Remove
                  </button>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <EmptyState
            title="No applications yet"
            description="New learner applications will appear here."
            icon={ClipboardList}
          />
        )}
      </SectionCard>
    </div>
  );
}
