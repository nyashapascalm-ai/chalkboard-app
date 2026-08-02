"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BriefcaseBusiness,
  CalendarOff,
  Check,
  Clock3,
  Plus,
  UserRound,
} from "lucide-react";

import { supabase } from "../../../lib/supabaseClient";
import EmptyState from "../../ui/EmptyState";
import SectionCard from "../../ui/SectionCard";
import StatusBadge from "../../ui/StatusBadge";

const EMPTY_STAFF = {
  full_name: "",
  employee_number: "",
  position: "",
  department: "",
  employment_type: "permanent",
  phone: "",
  email: "",
  start_date: "",
};

const EMPTY_LEAVE = {
  staff_id: "",
  leave_type: "annual",
  start_date: "",
  end_date: "",
  reason: "",
};

function newAbsence() {
  return {
    staff_id: "",
    absence_date: new Date()
      .toISOString()
      .slice(0, 10),
    status: "absent",
    notes: "",
  };
}

export default function HumanResourcesPanel({
  schoolId,
}) {
  const [tab, setTab] = useState("directory");
  const [staff, setStaff] = useState([]);
  const [leave, setLeave] = useState([]);
  const [absences, setAbsences] = useState([]);
  const [staffForm, setStaffForm] =
    useState(EMPTY_STAFF);
  const [leaveForm, setLeaveForm] =
    useState(EMPTY_LEAVE);
  const [absenceForm, setAbsenceForm] =
    useState(newAbsence());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    load();
  }, [schoolId]);

  async function load() {
    const [
      staffResult,
      leaveResult,
      absenceResult,
    ] = await Promise.all([
      supabase
        .from("staff")
        .select("*")
        .eq("school_id", schoolId)
        .order("full_name"),

      supabase
        .from("hr_leave_requests")
        .select("*")
        .eq("school_id", schoolId)
        .order("created_at", {
          ascending: false,
        }),

      supabase
        .from("hr_staff_absences")
        .select("*")
        .eq("school_id", schoolId)
        .order("absence_date", {
          ascending: false,
        })
        .limit(100),
    ]);

    setStaff(staffResult.data || []);
    setLeave(leaveResult.data || []);
    setAbsences(absenceResult.data || []);

    const loadError =
      staffResult.error ||
      leaveResult.error ||
      absenceResult.error;

    if (loadError) {
      setError(loadError.message);
    }
  }

  function updateStaff(key, value) {
    setStaffForm((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function updateLeave(key, value) {
    setLeaveForm((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function updateAbsence(key, value) {
    setAbsenceForm((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function staffName(id) {
    return (
      staff.find((item) => item.id === id)
        ?.full_name || "Unknown staff member"
    );
  }

  async function addStaff(event) {
    event.preventDefault();

    if (!staffForm.full_name.trim()) {
      setError("Enter the staff member name.");
      return;
    }

    setBusy(true);
    setError("");

    const { error: insertError } =
      await supabase.from("staff").insert({
        school_id: schoolId,
        full_name:
          staffForm.full_name.trim(),
        employee_number:
          staffForm.employee_number.trim() ||
          null,
        position:
          staffForm.position.trim() || null,
        department:
          staffForm.department.trim() || null,
        employment_type:
          staffForm.employment_type || null,
        phone:
          staffForm.phone.trim() || null,
        email:
          staffForm.email.trim() || null,
        start_date:
          staffForm.start_date || null,
        status: "active",
      });

    if (insertError) {
      setError(insertError.message);
    } else {
      setStaffForm(EMPTY_STAFF);
      await load();
    }

    setBusy(false);
  }

  async function addLeave(event) {
    event.preventDefault();

    if (
      !leaveForm.staff_id ||
      !leaveForm.start_date ||
      !leaveForm.end_date
    ) {
      setError(
        "Select a staff member and enter the leave dates.",
      );
      return;
    }

    setBusy(true);
    setError("");

    const { error: insertError } =
      await supabase
        .from("hr_leave_requests")
        .insert({
          school_id: schoolId,
          staff_id: leaveForm.staff_id,
          leave_type:
            leaveForm.leave_type,
          start_date:
            leaveForm.start_date,
          end_date: leaveForm.end_date,
          reason:
            leaveForm.reason.trim() || null,
          status: "pending",
        });

    if (insertError) {
      setError(insertError.message);
    } else {
      setLeaveForm(EMPTY_LEAVE);
      await load();
    }

    setBusy(false);
  }

  async function updateLeaveStatus(
    item,
    status,
  ) {
    setBusy(true);
    setError("");

    const { error: updateError } =
      await supabase
        .from("hr_leave_requests")
        .update({ status })
        .eq("id", item.id)
        .eq("school_id", schoolId);

    if (updateError) {
      setError(updateError.message);
    } else {
      await load();
    }

    setBusy(false);
  }

  async function addAbsence(event) {
    event.preventDefault();

    if (
      !absenceForm.staff_id ||
      !absenceForm.absence_date
    ) {
      setError(
        "Select a staff member and absence date.",
      );
      return;
    }

    setBusy(true);
    setError("");

    const { error: insertError } =
      await supabase
        .from("hr_staff_absences")
        .insert({
          school_id: schoolId,
          staff_id: absenceForm.staff_id,
          absence_date:
            absenceForm.absence_date,
          status:
            absenceForm.status || "absent",
          notes:
            absenceForm.notes.trim() || null,
        });

    if (insertError) {
      setError(insertError.message);
    } else {
      setAbsenceForm(newAbsence());
      await load();
    }

    setBusy(false);
  }

  const activeStaff = useMemo(
    () =>
      staff.filter(
        (item) =>
          (item.status || "active") === "active",
      ).length,
    [staff],
  );

  const pendingLeave = leave.filter(
    (item) =>
      (item.status || "pending") === "pending",
  ).length;

  return (
    <div className="feature-stack">
      <section className="people-summary-grid">
        <article className="people-summary-card">
          <BriefcaseBusiness size={20} />
          <strong>{staff.length}</strong>
          <span>Total staff</span>
        </article>

        <article className="people-summary-card">
          <Check size={20} />
          <strong>{activeStaff}</strong>
          <span>Active staff</span>
        </article>

        <article className="people-summary-card">
          <Clock3 size={20} />
          <strong>{pendingLeave}</strong>
          <span>Pending leave</span>
        </article>

        <article className="people-summary-card">
          <CalendarOff size={20} />
          <strong>{absences.length}</strong>
          <span>Recent absence records</span>
        </article>
      </section>

      <nav className="feature-tabs">
        {[
          ["directory", "Staff directory"],
          ["leave", "Leave requests"],
          ["absences", "Absences"],
        ].map(([value, label]) => (
          <button
            type="button"
            key={value}
            className={
              tab === value ? "active" : ""
            }
            onClick={() => setTab(value)}
          >
            {label}
          </button>
        ))}
      </nav>

      {tab === "directory" ? (
        <>
          <SectionCard
            title="Add staff member"
            description="Create the core HR directory record. Detailed qualifications and vetting remain under Personnel records."
          >
            <form
              className="people-form"
              onSubmit={addStaff}
            >
              <div className="form-grid">
                <label>
                  Full name
                  <input
                    value={
                      staffForm.full_name
                    }
                    onChange={(event) =>
                      updateStaff(
                        "full_name",
                        event.target.value,
                      )
                    }
                  />
                </label>

                <label>
                  Employee number
                  <input
                    value={
                      staffForm.employee_number
                    }
                    onChange={(event) =>
                      updateStaff(
                        "employee_number",
                        event.target.value,
                      )
                    }
                  />
                </label>

                <label>
                  Position
                  <input
                    value={
                      staffForm.position
                    }
                    onChange={(event) =>
                      updateStaff(
                        "position",
                        event.target.value,
                      )
                    }
                  />
                </label>

                <label>
                  Department
                  <input
                    value={
                      staffForm.department
                    }
                    onChange={(event) =>
                      updateStaff(
                        "department",
                        event.target.value,
                      )
                    }
                  />
                </label>

                <label>
                  Employment type
                  <select
                    value={
                      staffForm.employment_type
                    }
                    onChange={(event) =>
                      updateStaff(
                        "employment_type",
                        event.target.value,
                      )
                    }
                  >
                    <option value="permanent">
                      Permanent
                    </option>
                    <option value="contract">
                      Contract
                    </option>
                    <option value="temporary">
                      Temporary
                    </option>
                    <option value="part_time">
                      Part-time
                    </option>
                  </select>
                </label>

                <label>
                  Start date
                  <input
                    type="date"
                    value={
                      staffForm.start_date
                    }
                    onChange={(event) =>
                      updateStaff(
                        "start_date",
                        event.target.value,
                      )
                    }
                  />
                </label>

                <label>
                  Phone
                  <input
                    value={staffForm.phone}
                    onChange={(event) =>
                      updateStaff(
                        "phone",
                        event.target.value,
                      )
                    }
                  />
                </label>

                <label>
                  Email
                  <input
                    type="email"
                    value={staffForm.email}
                    onChange={(event) =>
                      updateStaff(
                        "email",
                        event.target.value,
                      )
                    }
                  />
                </label>
              </div>

              <div className="form-actions">
                <button
                  type="submit"
                  disabled={busy}
                >
                  <Plus size={17} />
                  Add staff member
                </button>
              </div>
            </form>
          </SectionCard>

          <SectionCard
            title="Staff directory"
            description="Current non-teaching and support staff records."
          >
            {staff.length ? (
              <div className="management-list">
                {staff.map((item) => (
                  <div
                    className="management-list-row"
                    key={item.id}
                  >
                    <div className="management-list-icon">
                      <UserRound size={18} />
                    </div>

                    <div className="management-list-copy">
                      <strong>
                        {item.full_name}
                      </strong>
                      <span>
                        {[
                          item.position,
                          item.department,
                          item.employee_number,
                        ]
                          .filter(Boolean)
                          .join(" · ") ||
                          "No role details recorded"}
                      </span>
                    </div>

                    <StatusBadge
                      status={
                        item.status || "active"
                      }
                    />
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                title="No staff records"
                description="Add the first staff member to begin the HR directory."
                icon={BriefcaseBusiness}
              />
            )}
          </SectionCard>
        </>
      ) : null}

      {tab === "leave" ? (
        <>
          <SectionCard
            title="Record leave request"
            description="Capture planned leave for a staff member and review approval status."
          >
            <form
              className="people-form"
              onSubmit={addLeave}
            >
              <div className="form-grid">
                <label>
                  Staff member
                  <select
                    value={
                      leaveForm.staff_id
                    }
                    onChange={(event) =>
                      updateLeave(
                        "staff_id",
                        event.target.value,
                      )
                    }
                  >
                    <option value="">
                      Select staff
                    </option>
                    {staff.map((item) => (
                      <option
                        key={item.id}
                        value={item.id}
                      >
                        {item.full_name}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  Leave type
                  <select
                    value={
                      leaveForm.leave_type
                    }
                    onChange={(event) =>
                      updateLeave(
                        "leave_type",
                        event.target.value,
                      )
                    }
                  >
                    <option value="annual">
                      Annual
                    </option>
                    <option value="sick">
                      Sick
                    </option>
                    <option value="maternity">
                      Maternity
                    </option>
                    <option value="paternity">
                      Paternity
                    </option>
                    <option value="compassionate">
                      Compassionate
                    </option>
                    <option value="study">
                      Study
                    </option>
                    <option value="unpaid">
                      Unpaid
                    </option>
                  </select>
                </label>

                <label>
                  Start date
                  <input
                    type="date"
                    value={
                      leaveForm.start_date
                    }
                    onChange={(event) =>
                      updateLeave(
                        "start_date",
                        event.target.value,
                      )
                    }
                  />
                </label>

                <label>
                  End date
                  <input
                    type="date"
                    value={
                      leaveForm.end_date
                    }
                    onChange={(event) =>
                      updateLeave(
                        "end_date",
                        event.target.value,
                      )
                    }
                  />
                </label>

                <label className="form-span-2">
                  Reason
                  <textarea
                    value={
                      leaveForm.reason
                    }
                    onChange={(event) =>
                      updateLeave(
                        "reason",
                        event.target.value,
                      )
                    }
                  />
                </label>
              </div>

              <div className="form-actions">
                <button
                  type="submit"
                  disabled={busy}
                >
                  <Plus size={17} />
                  Save leave request
                </button>
              </div>
            </form>
          </SectionCard>

          <SectionCard
            title="Leave requests"
            description="Approve or reject pending requests."
          >
            {leave.length ? (
              <div className="hr-record-list">
                {leave.map((item) => (
                  <article
                    className="hr-record"
                    key={item.id}
                  >
                    <div>
                      <strong>
                        {staffName(item.staff_id)}
                      </strong>
                      <span>
                        {item.leave_type} ·{" "}
                        {item.start_date} to{" "}
                        {item.end_date}
                      </span>
                    </div>

                    <StatusBadge
                      status={
                        item.status || "pending"
                      }
                    />

                    {(item.status || "pending") ===
                    "pending" ? (
                      <div className="hr-record-actions">
                        <button
                          className="compact-action"
                          disabled={busy}
                          onClick={() =>
                            updateLeaveStatus(
                              item,
                              "approved",
                            )
                          }
                        >
                          Approve
                        </button>

                        <button
                          className="ghost compact-action"
                          disabled={busy}
                          onClick={() =>
                            updateLeaveStatus(
                              item,
                              "rejected",
                            )
                          }
                        >
                          Reject
                        </button>
                      </div>
                    ) : null}
                  </article>
                ))}
              </div>
            ) : (
              <EmptyState
                title="No leave requests"
                description="Recorded leave requests will appear here."
                icon={Clock3}
              />
            )}
          </SectionCard>
        </>
      ) : null}

      {tab === "absences" ? (
        <>
          <SectionCard
            title="Record staff absence"
            description="Capture unplanned absence, lateness or another attendance exception."
          >
            <form
              className="people-form"
              onSubmit={addAbsence}
            >
              <div className="form-grid">
                <label>
                  Staff member
                  <select
                    value={
                      absenceForm.staff_id
                    }
                    onChange={(event) =>
                      updateAbsence(
                        "staff_id",
                        event.target.value,
                      )
                    }
                  >
                    <option value="">
                      Select staff
                    </option>
                    {staff.map((item) => (
                      <option
                        key={item.id}
                        value={item.id}
                      >
                        {item.full_name}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  Date
                  <input
                    type="date"
                    value={
                      absenceForm.absence_date
                    }
                    onChange={(event) =>
                      updateAbsence(
                        "absence_date",
                        event.target.value,
                      )
                    }
                  />
                </label>

                <label>
                  Status
                  <select
                    value={
                      absenceForm.status
                    }
                    onChange={(event) =>
                      updateAbsence(
                        "status",
                        event.target.value,
                      )
                    }
                  >
                    <option value="absent">
                      Absent
                    </option>
                    <option value="late">
                      Late
                    </option>
                    <option value="authorised_absence">
                      Authorised absence
                    </option>
                    <option value="sick">
                      Sick
                    </option>
                  </select>
                </label>

                <label>
                  Notes
                  <input
                    value={
                      absenceForm.notes
                    }
                    onChange={(event) =>
                      updateAbsence(
                        "notes",
                        event.target.value,
                      )
                    }
                  />
                </label>
              </div>

              <div className="form-actions">
                <button
                  type="submit"
                  disabled={busy}
                >
                  <Plus size={17} />
                  Record absence
                </button>
              </div>
            </form>
          </SectionCard>

          <SectionCard
            title="Recent staff absences"
            description="The latest recorded staff attendance exceptions."
          >
            {absences.length ? (
              <div className="hr-record-list">
                {absences.map((item) => (
                  <article
                    className="hr-record"
                    key={item.id}
                  >
                    <div>
                      <strong>
                        {staffName(item.staff_id)}
                      </strong>
                      <span>
                        {item.absence_date}
                        {item.notes
                          ? ` · ${item.notes}`
                          : ""}
                      </span>
                    </div>

                    <StatusBadge
                      status={
                        item.status || "absent"
                      }
                    />
                  </article>
                ))}
              </div>
            ) : (
              <EmptyState
                title="No staff absences"
                description="Recorded absences and lateness will appear here."
                icon={CalendarOff}
              />
            )}
          </SectionCard>
        </>
      ) : null}

      {error ? <p className="error">{error}</p> : null}
    </div>
  );
}
