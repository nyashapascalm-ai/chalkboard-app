"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CalendarCheck2,
  GraduationCap,
  School,
  Users,
  Wallet,
  X,
} from "lucide-react";

import {
  money,
  safeCount,
  safeRows,
} from "./portalData";
import PortalMetric from "./PortalMetric";

export default function SchoolInsightDrawer({
  school,
  onClose,
}) {
  const [data, setData] = useState({
    classes: 0,
    learners: 0,
    teachers: 0,
    staff: 0,
    attendance: 0,
    income: 0,
    expenses: 0,
  });
  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    load();
  }, [school?.id]);

  async function load() {
    if (!school?.id) return;

    setLoading(true);

    const [
      classes,
      learners,
      teachers,
      staff,
      finance,
    ] = await Promise.all([
      safeCount("classes", [
        ["school_id", school.id],
      ]),
      safeCount("students", [
        ["school_id", school.id],
      ]),
      safeCount("profiles", [
        ["school_id", school.id],
        ["role", "teacher"],
      ]),
      safeCount("staff", [
        ["school_id", school.id],
      ]),
      safeRows(
        "finance_entries",
        "*",
        [["school_id", school.id]],
      ),
    ]);

    const studentRows = await safeRows(
      "students",
      "id",
      [["school_id", school.id]],
    );

    let attendanceCount = 0;

    if (studentRows.rows.length) {
      const ids = studentRows.rows.map(
        (item) => item.id,
      );

      const result = await safeRows(
        "attendance",
        "student_id",
      );

      attendanceCount =
        result.rows.filter((item) =>
          ids.includes(item.student_id),
        ).length;
    }

    const totals = finance.rows.reduce(
      (summary, item) => {
        const kind =
          item.kind ||
          item.type ||
          item.entry_type;

        if (kind === "income") {
          summary.income += Number(
            item.amount || 0,
          );
        }

        if (kind === "expense") {
          summary.expenses += Number(
            item.amount || 0,
          );
        }

        return summary;
      },
      {
        income: 0,
        expenses: 0,
      },
    );

    setData({
      classes: classes.value,
      learners: learners.value,
      teachers: teachers.value,
      staff: staff.value,
      attendance: attendanceCount,
      income: totals.income,
      expenses: totals.expenses,
    });

    setLoading(false);
  }

  const balance = useMemo(
    () => data.income - data.expenses,
    [data],
  );

  return (
    <aside className="school-insight-drawer">
      <header>
        <div>
          <p>School insight</p>
          <h2>{school?.name}</h2>
          <span>
            {school?.emis_code ||
              "No EMIS code"}
            {" · "}
            {school?.status || "active"}
          </span>
        </div>

        <button
          className="ghost"
          onClick={onClose}
        >
          <X size={18} />
        </button>
      </header>

      {loading ? (
        <p className="enterprise-empty">
          Loading school insight...
        </p>
      ) : (
        <>
          <section className="school-insight-grid">
            <PortalMetric
              icon={School}
              label="Classes"
              value={data.classes}
            />
            <PortalMetric
              icon={GraduationCap}
              label="Learners"
              value={data.learners}
            />
            <PortalMetric
              icon={Users}
              label="Teachers"
              value={data.teachers}
            />
            <PortalMetric
              icon={Users}
              label="Other staff"
              value={data.staff}
            />
            <PortalMetric
              icon={CalendarCheck2}
              label="Attendance records"
              value={data.attendance}
            />
            <PortalMetric
              icon={Wallet}
              label="Operating balance"
              value={money(balance)}
            />
          </section>

          <div className="school-insight-finance">
            <span>
              Income
              <strong>
                {money(data.income)}
              </strong>
            </span>
            <span>
              Expenses
              <strong>
                {money(data.expenses)}
              </strong>
            </span>
            <span>
              Balance
              <strong>{money(balance)}</strong>
            </span>
          </div>
        </>
      )}
    </aside>
  );
}
