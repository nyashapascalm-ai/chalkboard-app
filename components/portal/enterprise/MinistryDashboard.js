"use client";

import { useEffect, useState } from "react";
import {
  Building2,
  CalendarCheck2,
  GraduationCap,
  Landmark,
  MapPinned,
  Users,
} from "lucide-react";

import { supabase } from "../../../lib/supabaseClient";
import EnterprisePortalShell from "./EnterprisePortalShell";
import PortalMetric from "./PortalMetric";
import PortalTable from "./PortalTable";

const EMPTY_METRICS = {
  schools: 0,
  learners: 0,
  teachers: 0,
  attendance: 0,
  geography: 0,
};

export default function MinistryDashboard({
  session,
  profile,
}) {
  const [schools, setSchools] = useState([]);
  const [metrics, setMetrics] =
    useState(EMPTY_METRICS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    setError("");

    const [
      schoolsResult,
      learnersResult,
      teachersResult,
      attendanceResult,
    ] = await Promise.all([
      supabase
        .from("schools")
        .select(
          "id,name,emis_code,province_id,district_id",
        )
        .order("name"),

      supabase
        .from("profiles")
        .select("id", {
          count: "exact",
          head: true,
        })
        .eq("role", "student"),

      supabase
        .from("profiles")
        .select("id", {
          count: "exact",
          head: true,
        })
        .eq("role", "teacher"),

      supabase
        .from("attendance")
        .select("student_id", {
          count: "exact",
          head: true,
        }),
    ]);

    const firstError = [
      schoolsResult.error,
      learnersResult.error,
      teachersResult.error,
      attendanceResult.error,
    ].find(Boolean);

    if (firstError) {
      setError(firstError.message);
    }

    const schoolRows = schoolsResult.data || [];

    setSchools(schoolRows);
    setMetrics({
      schools: schoolRows.length,
      learners: learnersResult.count || 0,
      teachers: teachersResult.count || 0,
      attendance: attendanceResult.count || 0,
      geography: schoolRows.filter(
        (row) =>
          row.province_id && row.district_id,
      ).length,
    });
    setLoading(false);
  }

  const columns = [
    {
      key: "name",
      label: "School",
      render: (row) => (
        <strong>{row.name}</strong>
      ),
    },
    {
      key: "emis_code",
      label: "EMIS",
      render: (row) =>
        row.emis_code || "Not set",
    },
    {
      key: "province",
      label: "Province",
      render: (row) =>
        row.province_id
          ? "Assigned"
          : "Not assigned",
    },
    {
      key: "district",
      label: "District",
      render: (row) =>
        row.district_id
          ? "Assigned"
          : "Not assigned",
    },
  ];

  return (
    <EnterprisePortalShell
      roleTitle="Ministry Official"
      subtitle="Read-only education oversight"
      heading="Ministry oversight"
      headingNote="Aggregated school participation and reporting"
      icon={Landmark}
      exportTitle="Ministry Oversight"
      user={{
        name:
          profile?.full_name ||
          "Ministry Official",
        email: session.user.email,
      }}
    >
      {error ? (
        <div className="enterprise-error">
          {error}
        </div>
      ) : null}

      <section className="enterprise-metric-grid">
        <PortalMetric
          icon={Building2}
          label="Schools"
          value={metrics.schools}
          note="Connected institutions"
        />
        <PortalMetric
          icon={Users}
          label="Learners"
          value={metrics.learners}
          note="Learner profiles"
        />
        <PortalMetric
          icon={GraduationCap}
          label="Teachers"
          value={metrics.teachers}
          note="Teacher accounts"
        />
        <PortalMetric
          icon={CalendarCheck2}
          label="Attendance records"
          value={metrics.attendance}
          note="Shared Dari attendance entries"
        />
        <PortalMetric
          icon={MapPinned}
          label="Geography ready"
          value={metrics.geography}
          note="Province and district assigned"
        />
      </section>

      <section className="enterprise-card">
        <div className="enterprise-card-heading">
          <div>
            <p>Reporting readiness</p>
            <h2>School coverage</h2>
          </div>
          <Landmark size={24} />
        </div>

        {loading ? (
          <p className="enterprise-empty">
            Loading school coverage...
          </p>
        ) : (
          <PortalTable
            columns={columns}
            rows={schools}
            emptyMessage="No schools are available."
          />
        )}
      </section>

      <p className="enterprise-readonly-note">
        Ministry access is read-only.
        Individual learner and school records
        cannot be edited from this portal.
      </p>
    </EnterprisePortalShell>
  );
}
