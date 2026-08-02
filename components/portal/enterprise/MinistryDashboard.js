"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  Building2,
  CalendarCheck2,
  FileBarChart,
  GraduationCap,
  Landmark,
  MapPinned,
  School,
  Users,
  Wallet,
} from "lucide-react";

import EnterprisePortalShell from "./EnterprisePortalShell";
import PortalMetric from "./PortalMetric";
import PortalNav from "./PortalNav";
import PortalTable from "./PortalTable";
import SchoolInsightDrawer from "./SchoolInsightDrawer";
import {
  downloadCsv,
  money,
  safeCount,
  safeRows,
} from "./portalData";

const NAV = [
  {
    key: "overview",
    label: "Overview",
    icon: BarChart3,
  },
  {
    key: "schools",
    label: "Schools",
    icon: School,
  },
  {
    key: "attendance",
    label: "Attendance",
    icon: CalendarCheck2,
  },
  {
    key: "finance",
    label: "Finance",
    icon: Wallet,
  },
  {
    key: "readiness",
    label: "Reporting readiness",
    icon: MapPinned,
  },
  {
    key: "reports",
    label: "Reports",
    icon: FileBarChart,
  },
];

export default function MinistryDashboard({
  session,
  profile,
}) {
  const [active, setActive] =
    useState("overview");
  const [schools, setSchools] =
    useState([]);
  const [students, setStudents] =
    useState([]);
  const [attendance, setAttendance] =
    useState([]);
  const [finance, setFinance] =
    useState([]);
  const [teachers, setTeachers] =
    useState(0);
  const [staff, setStaff] =
    useState(0);
  const [selectedSchool, setSelectedSchool] =
    useState(null);
  const [schoolFilter, setSchoolFilter] =
    useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    setError("");

    const [
      schoolRows,
      studentRows,
      attendanceRows,
      financeRows,
      teacherCount,
      staffCount,
    ] = await Promise.all([
      safeRows(
        "schools",
        "*",
        [],
        {
          column: "name",
          ascending: true,
        },
      ),
      safeRows(
        "students",
        "id,full_name,school_id,class_id",
      ),
      safeRows(
        "attendance",
        "student_id,status,date",
      ),
      safeRows(
        "finance_entries",
        "*",
      ),
      safeCount("profiles", [
        ["role", "teacher"],
      ]),
      safeCount("staff"),
    ]);

    setSchools(schoolRows.rows);
    setStudents(studentRows.rows);
    setAttendance(attendanceRows.rows);
    setFinance(financeRows.rows);
    setTeachers(teacherCount.value);
    setStaff(staffCount.value);

    const firstError = [
      schoolRows.error,
      studentRows.error,
      attendanceRows.error,
      financeRows.error,
      teacherCount.error,
      staffCount.error,
    ].find(Boolean);

    if (firstError) {
      setError(firstError);
    }

    setLoading(false);
  }

  const studentSchool = useMemo(() => {
    const map = {};
    students.forEach((item) => {
      map[item.id] = item.school_id;
    });
    return map;
  }, [students]);

  const attendanceBySchool = useMemo(() => {
    const map = {};

    attendance.forEach((item) => {
      const schoolId =
        studentSchool[item.student_id];

      if (!schoolId) return;

      if (!map[schoolId]) {
        map[schoolId] = {
          present: 0,
          absent: 0,
          late: 0,
          total: 0,
        };
      }

      map[schoolId].total += 1;

      if (
        Object.prototype.hasOwnProperty.call(
          map[schoolId],
          item.status,
        )
      ) {
        map[schoolId][item.status] += 1;
      }
    });

    return map;
  }, [attendance, studentSchool]);

  const financeBySchool = useMemo(() => {
    const map = {};

    finance.forEach((item) => {
      const schoolId = item.school_id;
      if (!schoolId) return;

      if (!map[schoolId]) {
        map[schoolId] = {
          income: 0,
          expenses: 0,
        };
      }

      const kind =
        item.kind ||
        item.type ||
        item.entry_type;

      if (kind === "income") {
        map[schoolId].income += Number(
          item.amount || 0,
        );
      }

      if (kind === "expense") {
        map[schoolId].expenses += Number(
          item.amount || 0,
        );
      }
    });

    return map;
  }, [finance]);

  const schoolRows = useMemo(
    () =>
      schools.map((school) => {
        const learnerCount =
          students.filter(
            (item) =>
              item.school_id === school.id,
          ).length;

        const att =
          attendanceBySchool[school.id] ||
          {
            present: 0,
            absent: 0,
            late: 0,
            total: 0,
          };

        const rate = att.total
          ? Math.round(
              (att.present /
                att.total) *
                100,
            )
          : 0;

        const financeSummary =
          financeBySchool[school.id] ||
          {
            income: 0,
            expenses: 0,
          };

        return {
          ...school,
          learners: learnerCount,
          attendance_rate: rate,
          income:
            financeSummary.income,
          expenses:
            financeSummary.expenses,
          balance:
            financeSummary.income -
            financeSummary.expenses,
        };
      }),
    [
      schools,
      students,
      attendanceBySchool,
      financeBySchool,
    ],
  );

  const filteredSchools = useMemo(() => {
    const query =
      schoolFilter.trim().toLowerCase();

    if (!query) return schoolRows;

    return schoolRows.filter((row) =>
      [
        row.name,
        row.emis_code,
        row.status,
      ].some((value) =>
        String(value || "")
          .toLowerCase()
          .includes(query),
      ),
    );
  }, [schoolRows, schoolFilter]);

  const totals = useMemo(
    () =>
      schoolRows.reduce(
        (summary, row) => ({
          learners:
            summary.learners +
            row.learners,
          attendance:
            summary.attendance +
            row.attendance_rate,
          income:
            summary.income + row.income,
          expenses:
            summary.expenses +
            row.expenses,
          geography:
            summary.geography +
            (row.province_id &&
            row.district_id
              ? 1
              : 0),
        }),
        {
          learners: 0,
          attendance: 0,
          income: 0,
          expenses: 0,
          geography: 0,
        },
      ),
    [schoolRows],
  );

  const nationalAttendance =
    schoolRows.length
      ? Math.round(
          totals.attendance /
            schoolRows.length,
        )
      : 0;

  const columns = [
    {
      key: "name",
      label: "School",
      render: (row) => (
        <button
          className="enterprise-link-button"
          onClick={() =>
            setSelectedSchool(row)
          }
        >
          {row.name}
        </button>
      ),
    },
    {
      key: "emis_code",
      label: "EMIS",
      render: (row) =>
        row.emis_code || "Not set",
    },
    {
      key: "learners",
      label: "Learners",
    },
    {
      key: "attendance_rate",
      label: "Attendance",
      render: (row) =>
        `${row.attendance_rate}%`,
    },
    {
      key: "balance",
      label: "Finance balance",
      render: (row) =>
        money(row.balance),
    },
    {
      key: "geography",
      label: "Geography",
      render: (row) =>
        row.province_id &&
        row.district_id
          ? "Ready"
          : "Incomplete",
    },
  ];

  function exportSchoolData() {
    downloadCsv(
      "ministry-school-data.csv",
      [
        "School",
        "EMIS",
        "Status",
        "Learners",
        "Attendance rate",
        "Income",
        "Expenses",
        "Balance",
        "Province ID",
        "District ID",
      ],
      filteredSchools.map((row) => [
        row.name,
        row.emis_code,
        row.status,
        row.learners,
        `${row.attendance_rate}%`,
        row.income,
        row.expenses,
        row.balance,
        row.province_id,
        row.district_id,
      ]),
    );
  }

  function renderContent() {
    if (active === "schools") {
      return (
        <section className="enterprise-card">
          <div className="enterprise-card-heading">
            <div>
              <p>School intelligence</p>
              <h2>
                School-level data
              </h2>
            </div>
            <button
              className="ghost"
              onClick={exportSchoolData}
            >
              Export CSV
            </button>
          </div>

          <label className="enterprise-search">
            Search schools
            <input
              value={schoolFilter}
              onChange={(event) =>
                setSchoolFilter(
                  event.target.value,
                )
              }
              placeholder="Name, EMIS or status"
            />
          </label>

          <PortalTable
            columns={columns}
            rows={filteredSchools}
            emptyMessage="No schools match the selected filter."
          />
        </section>
      );
    }

    if (active === "attendance") {
      return (
        <section className="enterprise-card">
          <div className="enterprise-card-heading">
            <div>
              <p>Shared Dari data</p>
              <h2>
                Attendance oversight
              </h2>
            </div>
            <CalendarCheck2 size={24} />
          </div>

          <PortalTable
            columns={[
              {
                key: "name",
                label: "School",
              },
              {
                key: "learners",
                label: "Learners",
              },
              {
                key: "attendance_rate",
                label: "Attendance rate",
                render: (row) =>
                  `${row.attendance_rate}%`,
              },
            ]}
            rows={schoolRows}
            emptyMessage="No attendance data is available."
          />
        </section>
      );
    }

    if (active === "finance") {
      return (
        <>
          <section className="enterprise-metric-grid">
            <PortalMetric
              icon={Wallet}
              label="Income"
              value={money(totals.income)}
              note="Across connected schools"
            />
            <PortalMetric
              icon={Wallet}
              label="Expenses"
              value={money(
                totals.expenses,
              )}
              note="Across connected schools"
            />
            <PortalMetric
              icon={Wallet}
              label="Balance"
              value={money(
                totals.income -
                  totals.expenses,
              )}
              note="Income less expenditure"
            />
          </section>

          <section className="enterprise-card">
            <div className="enterprise-card-heading">
              <div>
                <p>
                  Aggregated finance
                </p>
                <h2>
                  School finance insight
                </h2>
              </div>
              <Wallet size={24} />
            </div>

            <PortalTable
              columns={[
                {
                  key: "name",
                  label: "School",
                },
                {
                  key: "income",
                  label: "Income",
                  render: (row) =>
                    money(row.income),
                },
                {
                  key: "expenses",
                  label: "Expenses",
                  render: (row) =>
                    money(row.expenses),
                },
                {
                  key: "balance",
                  label: "Balance",
                  render: (row) =>
                    money(row.balance),
                },
              ]}
              rows={schoolRows}
              emptyMessage="No finance data is available."
            />
          </section>
        </>
      );
    }

    if (active === "readiness") {
      return (
        <section className="enterprise-card">
          <div className="enterprise-card-heading">
            <div>
              <p>
                Data completeness
              </p>
              <h2>
                Reporting readiness
              </h2>
            </div>
            <MapPinned size={24} />
          </div>

          <PortalTable
            columns={[
              {
                key: "name",
                label: "School",
              },
              {
                key: "emis_code",
                label: "EMIS",
                render: (row) =>
                  row.emis_code
                    ? "Ready"
                    : "Missing",
              },
              {
                key: "geography",
                label: "Geography",
                render: (row) =>
                  row.province_id &&
                  row.district_id
                    ? "Ready"
                    : "Incomplete",
              },
              {
                key: "attendance_rate",
                label: "Attendance data",
                render: (row) =>
                  row.attendance_rate > 0
                    ? "Available"
                    : "No records",
              },
              {
                key: "finance",
                label: "Finance data",
                render: (row) =>
                  row.income ||
                  row.expenses
                    ? "Available"
                    : "No records",
              },
            ]}
            rows={schoolRows}
            emptyMessage="No reporting-readiness data is available."
          />
        </section>
      );
    }

    if (active === "reports") {
      return (
        <section className="enterprise-card">
          <div className="enterprise-card-heading">
            <div>
              <p>
                National reporting
              </p>
              <h2>Report extraction</h2>
            </div>
            <FileBarChart size={24} />
          </div>

          <div className="enterprise-report-grid">
            <button
              onClick={exportSchoolData}
            >
              Export school data CSV
            </button>
            <button
              onClick={() =>
                window.print()
              }
            >
              Print / Save national report
            </button>
          </div>

          <p className="enterprise-readonly-note">
            The page-level toolbar provides PDF,
            Excel and Word exports for the
            visible national report.
          </p>
        </section>
      );
    }

    return (
      <>
        <section className="enterprise-metric-grid">
          <PortalMetric
            icon={Building2}
            label="Schools"
            value={schools.length}
            note="Connected institutions"
          />
          <PortalMetric
            icon={Users}
            label="Learners"
            value={totals.learners}
            note="Current learner records"
          />
          <PortalMetric
            icon={GraduationCap}
            label="Teachers"
            value={teachers}
            note="Teacher accounts"
          />
          <PortalMetric
            icon={Users}
            label="Other staff"
            value={staff}
            note="HR directory records"
          />
          <PortalMetric
            icon={CalendarCheck2}
            label="Attendance"
            value={`${nationalAttendance}%`}
            note="Average school rate"
          />
          <PortalMetric
            icon={Wallet}
            label="Finance balance"
            value={money(
              totals.income -
                totals.expenses,
            )}
            note="Across connected schools"
          />
          <PortalMetric
            icon={MapPinned}
            label="Reporting ready"
            value={totals.geography}
            note="Geography assigned"
          />
        </section>

        <section className="enterprise-card">
          <div className="enterprise-card-heading">
            <div>
              <p>National overview</p>
              <h2>
                School performance and readiness
              </h2>
            </div>
            <Landmark size={24} />
          </div>

          <PortalTable
            columns={columns}
            rows={schoolRows}
            emptyMessage="No schools are available."
          />
        </section>
      </>
    );
  }

  return (
    <EnterprisePortalShell
      roleTitle="Ministry Official"
      subtitle="Read-only education oversight"
      heading="Ministry oversight"
      headingNote="School participation, attendance, finance and reporting readiness"
      icon={Landmark}
      exportTitle="Ministry Oversight"
      user={{
        name:
          profile?.full_name ||
          "Ministry Official",
        email: session.user.email,
      }}
      navigation={
        <PortalNav
          items={NAV}
          active={active}
          onChange={setActive}
        />
      }
    >
      {error ? (
        <div className="enterprise-error">
          {error}
        </div>
      ) : null}

      {loading ? (
        <p className="enterprise-empty">
          Loading national data...
        </p>
      ) : (
        renderContent()
      )}

      <p className="enterprise-readonly-note">
        Ministry access is read-only.
        Individual learner, staff, finance and
        school records cannot be edited from
        this portal.
      </p>

      {selectedSchool ? (
        <SchoolInsightDrawer
          school={selectedSchool}
          onClose={() =>
            setSelectedSchool(null)
          }
        />
      ) : null}
    </EnterprisePortalShell>
  );
}
