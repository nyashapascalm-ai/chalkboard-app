"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CalendarCheck2,
  Download,
  FileDown,
  GraduationCap,
  School,
  Users,
  Wallet,
} from "lucide-react";

import { supabase } from "../../../lib/supabaseClient";
import { financeTotals } from "../../financeNormaliser";
import EmptyState from "../../ui/EmptyState";
import MetricCard from "../../ui/MetricCard";
import SectionCard from "../../ui/SectionCard";

function isoDate(date) {
  return date.toISOString().slice(0, 10);
}

function money(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(Number(value || 0));
}

function csvCell(value) {
  const text = String(value ?? "");
  return `"${text.replaceAll('"', '""')}"`;
}

function downloadText(filename, content, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();

  URL.revokeObjectURL(url);
}

export default function ReportsPanel({
  schoolId,
  classes,
  school,
  settings,
}) {
  const today = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 29);

  const [tab, setTab] = useState("attendance");
  const [classId, setClassId] = useState("");
  const [from, setFrom] = useState(isoDate(start));
  const [to, setTo] = useState(isoDate(today));
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [summary, setSummary] = useState({
    learners: 0,
    classes: 0,
    teachers: 0,
    staff: 0,
    income: 0,
    expenses: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!classId && classes.length) {
      setClassId(classes[0].id);
    }
  }, [classes, classId]);

  useEffect(() => {
    loadAttendance();
  }, [schoolId, classId, from, to]);

  useEffect(() => {
    loadSummary();
  }, [schoolId]);

  async function loadAttendance() {
    if (!schoolId || !classId) {
      setStudents([]);
      setAttendance([]);
      return;
    }

    setLoading(true);
    setError("");

    const { data: learnerRows, error: learnerError } =
      await supabase
        .from("students")
        .select("id,full_name,class_id")
        .eq("school_id", schoolId)
        .eq("class_id", classId)
        .order("full_name");

    if (learnerError) {
      setError(learnerError.message);
      setLoading(false);
      return;
    }

    const ids = (learnerRows || []).map(
      (item) => item.id,
    );

    let attendanceRows = [];
    let attendanceError = null;

    if (ids.length) {
      const result = await supabase
        .from("attendance")
        .select("student_id,status,date,created_at")
        .in("student_id", ids)
        .gte("date", from)
        .lte("date", to)
        .order("date");

      attendanceRows = result.data || [];
      attendanceError = result.error;
    }

    setStudents(learnerRows || []);
    setAttendance(attendanceRows);

    if (attendanceError) {
      setError(attendanceError.message);
    }

    setLoading(false);
  }

  async function loadSummary() {
    if (!schoolId) return;

    const [
      learners,
      classCount,
      teachers,
      staff,
      finance,
    ] = await Promise.all([
      supabase
        .from("students")
        .select("id", {
          count: "exact",
          head: true,
        })
        .eq("school_id", schoolId),

      supabase
        .from("classes")
        .select("id", {
          count: "exact",
          head: true,
        })
        .eq("school_id", schoolId),

      supabase
        .from("profiles")
        .select("id", {
          count: "exact",
          head: true,
        })
        .eq("school_id", schoolId)
        .eq("role", "teacher"),

      supabase
        .from("staff")
        .select("id", {
          count: "exact",
          head: true,
        })
        .eq("school_id", schoolId),

      supabase
        .from("finance_entries")
        .select("*")
        .eq("school_id", schoolId),
    ]);

    const firstError = [
      learners.error,
      classCount.error,
      teachers.error,
      staff.error,
      finance.error,
    ].find(Boolean);

    if (firstError) {
      setError(firstError.message);
    }

    const totals = financeTotals(finance.data || []);

    setSummary({
      learners: learners.count || 0,
      classes: classCount.count || 0,
      teachers: teachers.count || 0,
      staff: staff.count || 0,
      income: totals.income,
      expenses: totals.expenses,
    });
  }

  const reportRows = useMemo(() => {
    const counts = {};

    students.forEach((student) => {
      counts[student.id] = {
        present: 0,
        absent: 0,
        late: 0,
      };
    });

    attendance.forEach((record) => {
      const target = counts[record.student_id];

      if (
        target &&
        Object.prototype.hasOwnProperty.call(
          target,
          record.status,
        )
      ) {
        target[record.status] += 1;
      }
    });

    return students.map((student) => {
      const values = counts[student.id] || {
        present: 0,
        absent: 0,
        late: 0,
      };
      const total =
        values.present +
        values.absent +
        values.late;

      return {
        ...student,
        ...values,
        total,
        rate: total
          ? Math.round(
              (values.present / total) * 100,
            )
          : 0,
      };
    });
  }, [students, attendance]);

  const totals = useMemo(
    () =>
      reportRows.reduce(
        (result, row) => ({
          present: result.present + row.present,
          absent: result.absent + row.absent,
          late: result.late + row.late,
          total: result.total + row.total,
        }),
        {
          present: 0,
          absent: 0,
          late: 0,
          total: 0,
        },
      ),
    [reportRows],
  );

  const overallRate = totals.total
    ? Math.round(
        (totals.present / totals.total) * 100,
      )
    : 0;

  const selectedClass =
    classes.find((item) => item.id === classId)
      ?.name || "Selected class";

  function exportAttendanceCsv() {
    const rows = [
      [
        "Learner",
        "Class",
        "Present",
        "Absent",
        "Late",
        "Recorded sessions",
        "Attendance rate",
      ],
      ...reportRows.map((row) => [
        row.full_name,
        selectedClass,
        row.present,
        row.absent,
        row.late,
        row.total,
        `${row.rate}%`,
      ]),
    ];

    const csv = rows
      .map((row) =>
        row.map(csvCell).join(","),
      )
      .join("\r\n");

    downloadText(
      `chalkboard-attendance-${selectedClass}-${from}-to-${to}.csv`,
      csv,
      "text/csv;charset=utf-8",
    );
  }

  function printAttendance() {
    const popup = window.open("", "_blank");

    if (!popup) {
      alert(
        "Allow pop-ups to print or save this report as PDF.",
      );
      return;
    }

    const body = reportRows
      .map(
        (row) => `
          <tr>
            <td>${row.full_name}</td>
            <td class="r">${row.present}</td>
            <td class="r">${row.absent}</td>
            <td class="r">${row.late}</td>
            <td class="r">${row.total}</td>
            <td class="r">${row.rate}%</td>
          </tr>
        `,
      )
      .join("");

    popup.document.write(`
      <html>
        <head>
          <title>Attendance report</title>
          <style>
            body{font-family:Segoe UI,Arial,sans-serif;padding:34px;color:#182230}
            header{display:flex;justify-content:space-between;gap:20px;border-bottom:3px solid #1E5EF7;padding-bottom:16px}
            h1{margin:0;color:#061E50}
            .muted{color:#667085;font-size:13px}
            table{width:100%;border-collapse:collapse;margin-top:24px;font-size:13px}
            th,td{padding:9px;border:1px solid #d8dee8;text-align:left}
            th{background:#f4f6f8}
            .r{text-align:right}
            .summary{display:flex;gap:18px;margin-top:18px}
            .summary div{padding:12px;border:1px solid #d8dee8;border-radius:8px}
          </style>
        </head>
        <body>
          <header>
            <div>
              <h1>${school?.name || "School"}</h1>
              <div class="muted">${settings?.address || ""}</div>
            </div>
            <div>
              <strong>Attendance report</strong><br/>
              ${selectedClass}<br/>
              ${from} to ${to}
            </div>
          </header>

          <div class="summary">
            <div>Present: <strong>${totals.present}</strong></div>
            <div>Absent: <strong>${totals.absent}</strong></div>
            <div>Late: <strong>${totals.late}</strong></div>
            <div>Overall rate: <strong>${overallRate}%</strong></div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Learner</th>
                <th class="r">Present</th>
                <th class="r">Absent</th>
                <th class="r">Late</th>
                <th class="r">Sessions</th>
                <th class="r">Rate</th>
              </tr>
            </thead>
            <tbody>${body}</tbody>
          </table>
        </body>
      </html>
    `);

    popup.document.close();
    popup.focus();

    setTimeout(() => popup.print(), 250);
  }

  return (
    <div className="feature-stack">
      <nav className="feature-tabs">
        <button
          type="button"
          className={
            tab === "attendance" ? "active" : ""
          }
          onClick={() => setTab("attendance")}
        >
          Dari attendance
        </button>

        <button
          type="button"
          className={
            tab === "overview" ? "active" : ""
          }
          onClick={() => setTab("overview")}
        >
          School overview
        </button>
      </nav>

      {tab === "attendance" ? (
        <>
          <SectionCard
            title="Dari attendance report"
            description="Read-only attendance reporting pulled from the shared attendance records created in Dari."
            actions={
              <div className="report-actions">
                <button
                  type="button"
                  className="ghost"
                  onClick={exportAttendanceCsv}
                  disabled={!reportRows.length}
                >
                  <Download size={16} />
                  Download CSV
                </button>

                <button
                  type="button"
                  className="ghost"
                  onClick={printAttendance}
                  disabled={!reportRows.length}
                >
                  <FileDown size={16} />
                  Print / PDF
                </button>
              </div>
            }
          >
            {classes.length ? (
              <div className="report-filter-grid">
                <label>
                  Class
                  <select
                    value={classId}
                    onChange={(event) =>
                      setClassId(
                        event.target.value,
                      )
                    }
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
                </label>

                <label>
                  From
                  <input
                    type="date"
                    value={from}
                    onChange={(event) =>
                      setFrom(event.target.value)
                    }
                  />
                </label>

                <label>
                  To
                  <input
                    type="date"
                    value={to}
                    onChange={(event) =>
                      setTo(event.target.value)
                    }
                  />
                </label>
              </div>
            ) : null}

            <div className="attendance-note">
              Chalkboard does not mark attendance.
              Teachers continue marking it in Dari;
              this page only reports the shared data.
            </div>
          </SectionCard>

          <section className="report-metric-grid">
            <MetricCard
              icon={CalendarCheck2}
              value={`${overallRate}%`}
              label="Overall attendance"
              note="Present records as a share of all recorded sessions"
            />

            <MetricCard
              icon={Users}
              value={totals.present}
              label="Present"
              note="Recorded present entries"
            />

            <MetricCard
              icon={Users}
              value={totals.absent}
              label="Absent"
              note="Recorded absent entries"
            />

            <MetricCard
              icon={Users}
              value={totals.late}
              label="Late"
              note="Recorded late entries"
            />
          </section>

          <SectionCard
            title="Learner attendance"
            description={`${reportRows.length} learner${
              reportRows.length === 1
                ? ""
                : "s"
            } in ${selectedClass}.`}
          >
            {loading ? (
              <p className="muted">
                Loading attendance report...
              </p>
            ) : reportRows.length ? (
              <table>
                <thead>
                  <tr>
                    <th>Learner</th>
                    <th className="r">
                      Present
                    </th>
                    <th className="r">
                      Absent
                    </th>
                    <th className="r">Late</th>
                    <th className="r">
                      Sessions
                    </th>
                    <th className="r">Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {reportRows.map((row) => (
                    <tr key={row.id}>
                      <td className="strong">
                        {row.full_name}
                      </td>
                      <td className="r">
                        {row.present}
                      </td>
                      <td className="r">
                        {row.absent}
                      </td>
                      <td className="r">
                        {row.late}
                      </td>
                      <td className="r">
                        {row.total}
                      </td>
                      <td className="r">
                        <strong>
                          {row.rate}%
                        </strong>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <EmptyState
                title="No attendance data"
                description="No shared Dari attendance records were found for the selected class and date range."
                icon={CalendarCheck2}
              />
            )}
          </SectionCard>
        </>
      ) : (
        <>
          <section className="report-metric-grid">
            <MetricCard
              icon={GraduationCap}
              value={summary.learners}
              label="Learners"
              note="Current learner records"
            />

            <MetricCard
              icon={School}
              value={summary.classes}
              label="Classes"
              note="Configured classes and forms"
            />

            <MetricCard
              icon={Users}
              value={summary.teachers}
              label="Teachers"
              note="Teacher accounts"
            />

            <MetricCard
              icon={Users}
              value={summary.staff}
              label="Other staff"
              note="HR directory records"
            />

            <MetricCard
              icon={Wallet}
              value={money(summary.income)}
              label="Income"
              note="General finance income"
            />

            <MetricCard
              icon={Wallet}
              value={money(summary.expenses)}
              label="Expenses"
              note="General finance expenditure"
            />
          </section>

          <SectionCard
            title="School overview"
            description="A read-only summary of the school's current operational records."
          >
            <div className="overview-report-grid">
              <article>
                <span>School</span>
                <strong>
                  {school?.name || "Not available"}
                </strong>
              </article>

              <article>
                <span>Reporting date</span>
                <strong>{isoDate(today)}</strong>
              </article>

              <article>
                <span>Operating balance</span>
                <strong>
                  {money(
                    summary.income -
                      summary.expenses,
                  )}
                </strong>
              </article>

              <article>
                <span>People total</span>
                <strong>
                  {summary.learners +
                    summary.teachers +
                    summary.staff}
                </strong>
              </article>
            </div>
          </SectionCard>
        </>
      )}

      {error ? <p className="error">{error}</p> : null}
    </div>
  );
}
