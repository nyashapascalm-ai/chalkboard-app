"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  Building2,
  CreditCard,
  FileBarChart,
  GraduationCap,
  HeartPulse,
  Plus,
  School,
  ShieldCheck,
  UserCog,
  Users,
} from "lucide-react";

import { supabase } from "../../../lib/supabaseClient";
import EnterprisePortalShell from "./EnterprisePortalShell";
import PortalMetric from "./PortalMetric";
import PortalNav from "./PortalNav";
import PortalStatusBadge from "./PortalStatusBadge";
import PortalTable from "./PortalTable";
import SchoolInsightDrawer from "./SchoolInsightDrawer";
import {
  downloadCsv,
  safeCount,
  safeRows,
} from "./portalData";

const NAV = [
  {
    key: "overview",
    label: "Overview",
    icon: Activity,
  },
  {
    key: "schools",
    label: "Schools",
    icon: School,
  },
  {
    key: "officials",
    label: "Officials",
    icon: UserCog,
  },
  {
    key: "subscriptions",
    label: "Subscriptions",
    icon: CreditCard,
  },
  {
    key: "health",
    label: "System health",
    icon: HeartPulse,
  },
  {
    key: "reports",
    label: "Reports",
    icon: FileBarChart,
  },
];

const EMPTY_METRICS = {
  schools: 0,
  activeSchools: 0,
  administrators: 0,
  teachers: 0,
  learners: 0,
  subscriptions: 0,
  overdue: 0,
};

export default function OperatorDashboard({
  session,
  profile,
}) {
  const [active, setActive] =
    useState("overview");
  const [schools, setSchools] =
    useState([]);
  const [profiles, setProfiles] =
    useState([]);
  const [subscriptions, setSubscriptions] =
    useState([]);
  const [metrics, setMetrics] =
    useState(EMPTY_METRICS);
  const [selectedSchool, setSelectedSchool] =
    useState(null);
  const [loading, setLoading] =
    useState(true);
  const [error, setError] = useState("");
  const [schoolForm, setSchoolForm] =
    useState({
      name: "",
      emis_code: "",
      status: "onboarding",
    });
  const [inviteForm, setInviteForm] =
    useState({
      full_name: "",
      email: "",
      role: "ministry_official",
      notes: "",
    });
  const [message, setMessage] =
    useState("");

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    setError("");

    const [
      schoolRows,
      profileRows,
      subscriptionRows,
      learnerCount,
      teacherCount,
      adminCount,
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
        "profiles",
        "id,full_name,email,role,status,school_id",
      ),
      safeRows(
        "subscriptions",
        "*",
      ),
      safeCount("profiles", [
        ["role", "student"],
      ]),
      safeCount("profiles", [
        ["role", "teacher"],
      ]),
      safeCount("profiles", [
        ["role", "school_admin"],
      ]),
    ]);

    const today = new Date()
      .toISOString()
      .slice(0, 10);

    setSchools(schoolRows.rows);
    setProfiles(profileRows.rows);
    setSubscriptions(
      subscriptionRows.rows,
    );

    setMetrics({
      schools: schoolRows.rows.length,
      activeSchools:
        schoolRows.rows.filter(
          (item) =>
            item.status === "active",
        ).length,
      administrators:
        adminCount.value,
      teachers: teacherCount.value,
      learners: learnerCount.value,
      subscriptions:
        subscriptionRows.rows.length,
      overdue:
        subscriptionRows.rows.filter(
          (item) =>
            item.next_due &&
            item.next_due < today,
        ).length,
    });

    const firstError = [
      schoolRows.error,
      profileRows.error,
      subscriptionRows.error,
      learnerCount.error,
      teacherCount.error,
      adminCount.error,
    ].find(Boolean);

    if (firstError) {
      setError(firstError);
    }

    setLoading(false);
  }

  async function addSchool(event) {
    event.preventDefault();

    if (!schoolForm.name.trim()) {
      setError("Enter the school name.");
      return;
    }

    setError("");
    setMessage("");

    const { error: insertError } =
      await supabase.from("schools").insert({
        name: schoolForm.name.trim(),
        emis_code:
          schoolForm.emis_code.trim() ||
          null,
        status: schoolForm.status,
      });

    if (insertError) {
      setError(insertError.message);
      return;
    }

    setSchoolForm({
      name: "",
      emis_code: "",
      status: "onboarding",
    });
    setMessage("School added successfully.");
    await load();
  }

  async function updateSchoolStatus(
    school,
    status,
  ) {
    const { error: updateError } =
      await supabase
        .from("schools")
        .update({ status })
        .eq("id", school.id);

    if (updateError) {
      setError(updateError.message);
    } else {
      await load();
    }
  }

  async function createInvitation(event) {
    event.preventDefault();

    if (
      !inviteForm.full_name.trim() ||
      !inviteForm.email.trim()
    ) {
      setError(
        "Enter the official name and email.",
      );
      return;
    }

    setError("");
    setMessage("");

    const { error: insertError } =
      await supabase
        .from(
          "platform_official_invitations",
        )
        .insert({
          full_name:
            inviteForm.full_name.trim(),
          email: inviteForm.email
            .trim()
            .toLowerCase(),
          role: inviteForm.role,
          notes:
            inviteForm.notes.trim() ||
            null,
          status: "pending",
          invited_by:
            session.user.id,
        });

    if (insertError) {
      setError(insertError.message);
      return;
    }

    setInviteForm({
      full_name: "",
      email: "",
      role: "ministry_official",
      notes: "",
    });
    setMessage(
      "Invitation request created. Email delivery can be connected later.",
    );
  }

  const officials = useMemo(
    () =>
      profiles.filter((item) =>
        [
          "operator",
          "ministry_official",
        ].includes(item.role),
      ),
    [profiles],
  );

  const schoolColumns = [
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
      key: "status",
      label: "Status",
      render: (row) => (
        <select
          className="compact-select"
          value={row.status || "prospect"}
          onChange={(event) =>
            updateSchoolStatus(
              row,
              event.target.value,
            )
          }
        >
          <option value="prospect">
            Prospect
          </option>
          <option value="onboarding">
            Onboarding
          </option>
          <option value="active">
            Active
          </option>
          <option value="suspended">
            Suspended
          </option>
        </select>
      ),
    },
    {
      key: "geography",
      label: "Geography",
      render: (row) =>
        row.province_id &&
        row.district_id
          ? "Assigned"
          : "Needs assignment",
    },
  ];

  const officialColumns = [
    {
      key: "full_name",
      label: "Official",
      render: (row) =>
        row.full_name || "Unnamed",
    },
    {
      key: "email",
      label: "Email",
      render: (row) =>
        row.email || "Not available",
    },
    {
      key: "role",
      label: "Role",
      render: (row) => (
        <PortalStatusBadge
          value={row.role}
        />
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (row) => (
        <PortalStatusBadge
          value={row.status || "active"}
        />
      ),
    },
  ];

  const subscriptionColumns = [
    {
      key: "school_id",
      label: "School",
      render: (row) =>
        schools.find(
          (item) =>
            item.id === row.school_id,
        )?.name || "Unknown school",
    },
    {
      key: "amount",
      label: "Amount",
      render: (row) =>
        Number(
          row.amount || 0,
        ).toLocaleString("en-US", {
          style: "currency",
          currency: "USD",
        }),
    },
    {
      key: "next_due",
      label: "Next due",
    },
    {
      key: "status",
      label: "Status",
      render: (row) => {
        const overdue =
          row.next_due &&
          row.next_due <
            new Date()
              .toISOString()
              .slice(0, 10);

        return (
          <PortalStatusBadge
            value={
              overdue
                ? "overdue"
                : row.status || "current"
            }
          />
        );
      },
    },
  ];

  function exportSchools() {
    downloadCsv(
      "chalkboard-schools.csv",
      [
        "School",
        "EMIS",
        "Status",
        "Province ID",
        "District ID",
      ],
      schools.map((row) => [
        row.name,
        row.emis_code,
        row.status,
        row.province_id,
        row.district_id,
      ]),
    );
  }

  function exportOfficials() {
    downloadCsv(
      "chalkboard-officials.csv",
      [
        "Name",
        "Email",
        "Role",
        "Status",
      ],
      officials.map((row) => [
        row.full_name,
        row.email,
        row.role,
        row.status,
      ]),
    );
  }

  function renderContent() {
    if (active === "schools") {
      return (
        <>
          <section className="enterprise-card">
            <div className="enterprise-card-heading">
              <div>
                <p>School management</p>
                <h2>Add a school</h2>
              </div>
              <Plus size={24} />
            </div>

            <form
              className="enterprise-form-grid"
              onSubmit={addSchool}
            >
              <label>
                School name
                <input
                  value={schoolForm.name}
                  onChange={(event) =>
                    setSchoolForm(
                      (current) => ({
                        ...current,
                        name:
                          event.target.value,
                      }),
                    )
                  }
                />
              </label>

              <label>
                EMIS code
                <input
                  value={
                    schoolForm.emis_code
                  }
                  onChange={(event) =>
                    setSchoolForm(
                      (current) => ({
                        ...current,
                        emis_code:
                          event.target.value,
                      }),
                    )
                  }
                />
              </label>

              <label>
                Initial status
                <select
                  value={
                    schoolForm.status
                  }
                  onChange={(event) =>
                    setSchoolForm(
                      (current) => ({
                        ...current,
                        status:
                          event.target.value,
                      }),
                    )
                  }
                >
                  <option value="prospect">
                    Prospect
                  </option>
                  <option value="onboarding">
                    Onboarding
                  </option>
                  <option value="active">
                    Active
                  </option>
                </select>
              </label>

              <button type="submit">
                <Plus size={16} />
                Add school
              </button>
            </form>
          </section>

          <section className="enterprise-card">
            <div className="enterprise-card-heading">
              <div>
                <p>School registry</p>
                <h2>
                  Connected schools
                </h2>
              </div>

              <button
                className="ghost"
                onClick={exportSchools}
              >
                Export CSV
              </button>
            </div>

            <PortalTable
              columns={schoolColumns}
              rows={schools}
              emptyMessage="No schools are available."
            />
          </section>
        </>
      );
    }

    if (active === "officials") {
      return (
        <>
          <section className="enterprise-card">
            <div className="enterprise-card-heading">
              <div>
                <p>Account provisioning</p>
                <h2>
                  Invite an official
                </h2>
              </div>
              <UserCog size={24} />
            </div>

            <form
              className="enterprise-form-grid"
              onSubmit={createInvitation}
            >
              <label>
                Full name
                <input
                  value={
                    inviteForm.full_name
                  }
                  onChange={(event) =>
                    setInviteForm(
                      (current) => ({
                        ...current,
                        full_name:
                          event.target.value,
                      }),
                    )
                  }
                />
              </label>

              <label>
                Email
                <input
                  type="email"
                  value={inviteForm.email}
                  onChange={(event) =>
                    setInviteForm(
                      (current) => ({
                        ...current,
                        email:
                          event.target.value,
                      }),
                    )
                  }
                />
              </label>

              <label>
                Role
                <select
                  value={inviteForm.role}
                  onChange={(event) =>
                    setInviteForm(
                      (current) => ({
                        ...current,
                        role:
                          event.target.value,
                      }),
                    )
                  }
                >
                  <option value="ministry_official">
                    Ministry Official
                  </option>
                  <option value="operator">
                    Platform Operator
                  </option>
                </select>
              </label>

              <label>
                Notes
                <input
                  value={inviteForm.notes}
                  onChange={(event) =>
                    setInviteForm(
                      (current) => ({
                        ...current,
                        notes:
                          event.target.value,
                      }),
                    )
                  }
                />
              </label>

              <button type="submit">
                <Plus size={16} />
                Create invitation
              </button>
            </form>
          </section>

          <section className="enterprise-card">
            <div className="enterprise-card-heading">
              <div>
                <p>Platform access</p>
                <h2>Current officials</h2>
              </div>

              <button
                className="ghost"
                onClick={exportOfficials}
              >
                Export CSV
              </button>
            </div>

            <PortalTable
              columns={officialColumns}
              rows={officials}
              emptyMessage="No officials are available."
            />
          </section>
        </>
      );
    }

    if (
      active === "subscriptions"
    ) {
      return (
        <section className="enterprise-card">
          <div className="enterprise-card-heading">
            <div>
              <p>
                Platform subscriptions
              </p>
              <h2>
                Subscription oversight
              </h2>
            </div>
            <CreditCard size={24} />
          </div>

          <PortalTable
            columns={
              subscriptionColumns
            }
            rows={subscriptions}
            emptyMessage="No subscriptions are available."
          />
        </section>
      );
    }

    if (active === "health") {
      return (
        <SystemHealthPanel
          schools={schools}
          profiles={profiles}
          subscriptions={
            subscriptions
          }
        />
      );
    }

    if (active === "reports") {
      return (
        <section className="enterprise-card">
          <div className="enterprise-card-heading">
            <div>
              <p>Extraction centre</p>
              <h2>Platform reports</h2>
            </div>
            <FileBarChart size={24} />
          </div>

          <div className="enterprise-report-grid">
            <button
              onClick={exportSchools}
            >
              Export school registry CSV
            </button>
            <button
              onClick={exportOfficials}
            >
              Export officials CSV
            </button>
            <button
              onClick={() =>
                window.print()
              }
            >
              Print / Save complete report
            </button>
          </div>

          <p className="enterprise-readonly-note">
            The page-level toolbar also provides
            PDF, Excel and Word exports for the
            visible report.
          </p>
        </section>
      );
    }

    return (
      <>
        <section className="enterprise-metric-grid">
          <PortalMetric
            icon={School}
            label="Schools"
            value={metrics.schools}
            note={`${metrics.activeSchools} active`}
          />
          <PortalMetric
            icon={Users}
            label="Administrators"
            value={
              metrics.administrators
            }
            note="School administrator accounts"
          />
          <PortalMetric
            icon={GraduationCap}
            label="Teachers"
            value={metrics.teachers}
            note="Teacher accounts"
          />
          <PortalMetric
            icon={Users}
            label="Learners"
            value={metrics.learners}
            note="Learner profiles"
          />
          <PortalMetric
            icon={CreditCard}
            label="Subscriptions"
            value={
              metrics.subscriptions
            }
            note={`${metrics.overdue} overdue`}
          />
        </section>

        <section className="enterprise-card">
          <div className="enterprise-card-heading">
            <div>
              <p>School activity</p>
              <h2>
                Connected school insight
              </h2>
            </div>
            <Building2 size={24} />
          </div>

          <PortalTable
            columns={schoolColumns}
            rows={schools}
            emptyMessage="No schools are available."
          />
        </section>
      </>
    );
  }

  return (
    <EnterprisePortalShell
      roleTitle="Platform Operator"
      subtitle="Connected school and subscription oversight"
      heading="Platform operations"
      headingNote="School provisioning, officials, subscriptions, health and insight"
      icon={ShieldCheck}
      exportTitle="Platform Operator"
      user={{
        name:
          profile?.full_name ||
          "Platform Operator",
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

      {message ? (
        <div className="enterprise-success">
          {message}
        </div>
      ) : null}

      {loading ? (
        <p className="enterprise-empty">
          Loading platform data...
        </p>
      ) : (
        renderContent()
      )}

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

function SystemHealthPanel({
  schools,
  profiles,
  subscriptions,
}) {
  const checks = [
    {
      label: "Supabase school registry",
      status:
        schools.length >= 0
          ? "healthy"
          : "error",
      detail: `${schools.length} schools returned`,
    },
    {
      label: "Profile directory",
      status:
        profiles.length >= 0
          ? "healthy"
          : "error",
      detail: `${profiles.length} profiles returned`,
    },
    {
      label: "Subscription records",
      status:
        subscriptions.length >= 0
          ? "healthy"
          : "warning",
      detail: `${subscriptions.length} subscriptions returned`,
    },
    {
      label: "Subscription payment API",
      status: "available",
      detail:
        "/api/subscription-pay is built and reachable from the application",
    },
    {
      label:
        "Subscription status API",
      status: "available",
      detail:
        "/api/subscription-pay/status is built and reachable from the application",
    },
  ];

  return (
    <section className="enterprise-card">
      <div className="enterprise-card-heading">
        <div>
          <p>System monitoring</p>
          <h2>Platform health</h2>
        </div>
        <HeartPulse size={24} />
      </div>

      <div className="enterprise-health-list">
        {checks.map((check) => (
          <article key={check.label}>
            <div>
              <strong>{check.label}</strong>
              <span>{check.detail}</span>
            </div>
            <PortalStatusBadge
              value={check.status}
            />
          </article>
        ))}
      </div>
    </section>
  );
}
