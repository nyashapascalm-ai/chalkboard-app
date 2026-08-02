"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BookOpen,
  Check,
  GraduationCap,
  Plus,
  UserRoundPlus,
  Users,
} from "lucide-react";

import { supabase } from "../../../lib/supabaseClient";
import EmptyState from "../../ui/EmptyState";
import SectionCard from "../../ui/SectionCard";
import StatusBadge from "../../ui/StatusBadge";

export default function TeachersPanel({
  schoolId,
  classes,
  subjects,
}) {
  const [teachers, setTeachers] = useState([]);
  const [classAssignments, setClassAssignments] =
    useState([]);
  const [subjectAssignments, setSubjectAssignments] =
    useState([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pickedClasses, setPickedClasses] =
    useState([]);
  const [pickedSubjects, setPickedSubjects] =
    useState([]);
  const [createdLogin, setCreatedLogin] =
    useState(null);
  const [busy, setBusy] = useState(false);
  const [changing, setChanging] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    load();
  }, [schoolId]);

  async function load() {
    if (!schoolId) return;

    setError("");

    const [
      teachersResult,
      classAssignmentsResult,
      subjectAssignmentsResult,
    ] = await Promise.all([
      supabase
        .from("profiles")
        .select("id,full_name,email,status")
        .eq("role", "teacher")
        .eq("school_id", schoolId)
        .order("full_name"),

      supabase
        .from("teacher_class_assignments")
        .select("id,teacher_id,class_id")
        .eq("school_id", schoolId),

      supabase
        .from("teacher_subject_assignments")
        .select("id,teacher_id,subject_id")
        .eq("school_id", schoolId),
    ]);

    const loadError =
      teachersResult.error ||
      classAssignmentsResult.error ||
      subjectAssignmentsResult.error;

    if (loadError) {
      setError(loadError.message);
    }

    setTeachers(teachersResult.data || []);
    setClassAssignments(
      classAssignmentsResult.data || [],
    );
    setSubjectAssignments(
      subjectAssignmentsResult.data || [],
    );
  }

  function togglePicked(list, setter, id) {
    setter(
      list.includes(id)
        ? list.filter((item) => item !== id)
        : [...list, id],
    );
  }

  async function createTeacher(event) {
    event.preventDefault();

    if (!email.trim()) {
      setError("Enter a teacher email address.");
      return;
    }

    setBusy(true);
    setError("");
    setCreatedLogin(null);

    try {
      const response = await fetch("/api/teacher", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          schoolId,
          email: email.trim().toLowerCase(),
          fullName: name.trim(),
          classIds: [],
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error ||
            "The teacher account could not be created.",
        );
      }

      let teacherId =
        result.id ||
        result.userId ||
        result.teacherId ||
        null;

      if (!teacherId) {
        const { data: profile, error: profileError } =
          await supabase
            .from("profiles")
            .select("id")
            .eq("school_id", schoolId)
            .eq("role", "teacher")
            .eq(
              "email",
              email.trim().toLowerCase(),
            )
            .maybeSingle();

        if (profileError) throw profileError;
        teacherId = profile?.id || null;
      }

      if (!teacherId) {
        throw new Error(
          "The teacher was created, but the profile could not be found for allocation.",
        );
      }

      await saveInitialAllocations(teacherId);

      setCreatedLogin(result);
      setName("");
      setEmail("");
      setPickedClasses([]);
      setPickedSubjects([]);
      await load();
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : String(caught),
      );
    }

    setBusy(false);
  }

  async function saveInitialAllocations(teacherId) {
    if (pickedClasses.length) {
      const { error: classError } =
        await supabase
          .from("teacher_class_assignments")
          .upsert(
            pickedClasses.map((classId) => ({
              school_id: schoolId,
              teacher_id: teacherId,
              class_id: classId,
            })),
            {
              onConflict: "teacher_id,class_id",
            },
          );

      if (classError) throw classError;
    }

    if (pickedSubjects.length) {
      const { error: subjectError } =
        await supabase
          .from("teacher_subject_assignments")
          .upsert(
            pickedSubjects.map((subjectId) => ({
              school_id: schoolId,
              teacher_id: teacherId,
              subject_id: subjectId,
            })),
            {
              onConflict:
                "teacher_id,subject_id",
            },
          );

      if (subjectError) throw subjectError;
    }
  }

  async function toggleAssignment(
    type,
    teacherId,
    targetId,
  ) {
    const table =
      type === "class"
        ? "teacher_class_assignments"
        : "teacher_subject_assignments";

    const targetColumn =
      type === "class"
        ? "class_id"
        : "subject_id";

    const rows =
      type === "class"
        ? classAssignments
        : subjectAssignments;

    const key = `${type}:${teacherId}:${targetId}`;
    setChanging(key);
    setError("");

    const existing = rows.find(
      (row) =>
        row.teacher_id === teacherId &&
        row[targetColumn] === targetId,
    );

    let operation;

    if (existing) {
      operation = supabase
        .from(table)
        .delete()
        .eq("id", existing.id)
        .eq("school_id", schoolId);
    } else {
      operation = supabase.from(table).insert({
        school_id: schoolId,
        teacher_id: teacherId,
        [targetColumn]: targetId,
      });
    }

    const { error: changeError } =
      await operation;

    if (changeError) {
      setError(changeError.message);
    } else {
      await load();
    }

    setChanging("");
  }

  function isAssigned(
    rows,
    teacherId,
    column,
    targetId,
  ) {
    return rows.some(
      (row) =>
        row.teacher_id === teacherId &&
        row[column] === targetId,
    );
  }

  const activeTeachers = useMemo(
    () =>
      teachers.filter(
        (teacher) =>
          (teacher.status || "active") === "active",
      ).length,
    [teachers],
  );

  return (
    <div className="feature-stack">
      <section className="people-summary-grid">
        <article className="people-summary-card">
          <Users size={20} />
          <strong>{teachers.length}</strong>
          <span>Total teachers</span>
        </article>

        <article className="people-summary-card">
          <Check size={20} />
          <strong>{activeTeachers}</strong>
          <span>Active accounts</span>
        </article>

        <article className="people-summary-card">
          <BookOpen size={20} />
          <strong>{classAssignments.length}</strong>
          <span>Class allocations</span>
        </article>

        <article className="people-summary-card">
          <GraduationCap size={20} />
          <strong>
            {subjectAssignments.length}
          </strong>
          <span>Subject allocations</span>
        </article>
      </section>

      {createdLogin ? (
        <SectionCard
          title="Teacher login created"
          description="Send these credentials securely. The password is shown only in this confirmation."
        >
          <div className="credential-panel">
            <div>
              <span>Email</span>
              <strong>{createdLogin.email}</strong>
            </div>

            {createdLogin.password ? (
              <div>
                <span>
                  Temporary password
                </span>
                <strong className="credential-code">
                  {createdLogin.password}
                </strong>
              </div>
            ) : null}
          </div>
        </SectionCard>
      ) : null}

      <SectionCard
        title="Add a teacher"
        description="Create the teacher account, then allocate the classes and subjects that Dari should make available."
      >
        <form
          className="people-form"
          onSubmit={createTeacher}
        >
          <div className="form-grid">
            <label>
              Full name
              <input
                value={name}
                onChange={(event) =>
                  setName(event.target.value)
                }
              />
            </label>

            <label>
              Email address
              <input
                required
                type="email"
                value={email}
                onChange={(event) =>
                  setEmail(event.target.value)
                }
              />
            </label>
          </div>

          <fieldset className="assignment-fieldset">
            <legend>Initial classes</legend>

            <div className="assignment-chips">
              {classes.map((item) => {
                const selected =
                  pickedClasses.includes(item.id);

                return (
                  <button
                    type="button"
                    key={item.id}
                    className={
                      selected
                        ? "assignment-chip selected"
                        : "assignment-chip"
                    }
                    onClick={() =>
                      togglePicked(
                        pickedClasses,
                        setPickedClasses,
                        item.id,
                      )
                    }
                  >
                    {selected ? (
                      <Check size={14} />
                    ) : (
                      <Plus size={14} />
                    )}
                    {item.name}
                  </button>
                );
              })}
            </div>
          </fieldset>

          <fieldset className="assignment-fieldset">
            <legend>Initial subjects</legend>

            <div className="assignment-chips">
              {subjects.map((item) => {
                const selected =
                  pickedSubjects.includes(item.id);

                return (
                  <button
                    type="button"
                    key={item.id}
                    className={
                      selected
                        ? "assignment-chip selected"
                        : "assignment-chip"
                    }
                    onClick={() =>
                      togglePicked(
                        pickedSubjects,
                        setPickedSubjects,
                        item.id,
                      )
                    }
                  >
                    {selected ? (
                      <Check size={14} />
                    ) : (
                      <Plus size={14} />
                    )}
                    {item.name}
                  </button>
                );
              })}
            </div>
          </fieldset>

          {error ? (
            <p className="error">{error}</p>
          ) : null}

          <div className="form-actions">
            <button
              type="submit"
              disabled={busy}
            >
              <UserRoundPlus size={17} />
              {busy
                ? "Creating..."
                : "Create teacher and allocations"}
            </button>
          </div>
        </form>
      </SectionCard>

      <SectionCard
        title="Teachers and allocations"
        description="Changes made here are written to the shared assignment tables used by Dari."
      >
        {teachers.length ? (
          <div className="teacher-list">
            {teachers.map((teacher) => (
              <article
                className="teacher-record"
                key={teacher.id}
              >
                <header>
                  <div>
                    <h3>
                      {teacher.full_name ||
                        teacher.email ||
                        "Teacher"}
                    </h3>
                    <p>
                      {teacher.email ||
                        "No email stored"}
                    </p>
                  </div>

                  <StatusBadge
                    status={
                      teacher.status || "active"
                    }
                  />
                </header>

                <div className="teacher-allocation-section">
                  <strong>
                    Assigned classes
                  </strong>

                  <div className="assignment-chips">
                    {classes.map((item) => {
                      const selected =
                        isAssigned(
                          classAssignments,
                          teacher.id,
                          "class_id",
                          item.id,
                        );

                      const key = `class:${teacher.id}:${item.id}`;

                      return (
                        <button
                          type="button"
                          key={item.id}
                          disabled={
                            changing === key
                          }
                          className={
                            selected
                              ? "assignment-chip selected"
                              : "assignment-chip"
                          }
                          onClick={() =>
                            toggleAssignment(
                              "class",
                              teacher.id,
                              item.id,
                            )
                          }
                        >
                          {selected ? (
                            <Check size={14} />
                          ) : (
                            <Plus size={14} />
                          )}
                          {item.name}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="teacher-allocation-section">
                  <strong>
                    Assigned subjects
                  </strong>

                  <div className="assignment-chips">
                    {subjects.map((item) => {
                      const selected =
                        isAssigned(
                          subjectAssignments,
                          teacher.id,
                          "subject_id",
                          item.id,
                        );

                      const key = `subject:${teacher.id}:${item.id}`;

                      return (
                        <button
                          type="button"
                          key={item.id}
                          disabled={
                            changing === key
                          }
                          className={
                            selected
                              ? "assignment-chip selected"
                              : "assignment-chip"
                          }
                          onClick={() =>
                            toggleAssignment(
                              "subject",
                              teacher.id,
                              item.id,
                            )
                          }
                        >
                          {selected ? (
                            <Check size={14} />
                          ) : (
                            <Plus size={14} />
                          )}
                          {item.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <EmptyState
            title="No teachers yet"
            description="Create the first teacher account and allocate their classes and subjects."
            icon={Users}
          />
        )}
      </SectionCard>
    </div>
  );
}
