"use client";

import { useEffect, useState } from "react";
import {
  Building2,
  CreditCard,
  GraduationCap,
  School,
  ShieldCheck,
  Users,
} from "lucide-react";

import { supabase } from "../../../lib/supabaseClient";
import EnterprisePortalShell from "./EnterprisePortalShell";
import PortalMetric from "./PortalMetric";
import PortalTable from "./PortalTable";

const EMPTY_METRICS = {
  schools: 0,
  administrators: 0,
  teachers: 0,
  learners: 0,
  subscriptions: 0,
};

export default function OperatorDashboard({
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
      adminsResult,
      teachersResult,
      learnersResult,
      subscriptionsResult,
    ] = await Promise.all([
      supabase
        .from("schools")
        .select(
          "id,name,emis_code,status,province_id,district_id",
        )
        .order("name"),

      supabase
        .from("profiles")
        .select("id", {
          count: "exact",
          head: true,
        })
        .eq("role", "school_admin"),

      supabase
        .from("profiles")
        .select("id", {
          count: "exact",
          head: true,
        })
        .eq("role", "teacher"),

      supabase
        .from("profiles")
        .select("id", {
          count: "exact",
          head: true,
        })
        .eq("role", "student"),

      supabase
        .from("subscriptions")
        .select("school_id", {
          count: "exact",
          head: true,
        }),
    ]);

    const firstError = [
      schoolsResult.error,
      adminsResult.error,
      teachersResult.error,
      learnersResult.error,
      subscriptionsResult.error,
    ].find(Boolean);

    if (firstError) {
      setError(firstError.message);
    }

    const schoolRows = schoolsResult.data || [];

    setSchools(schoolRows);
    setMetrics({
      schools: schoolRows.length,
      administrators: adminsResult.count || 0,
      teachers: teachersResult.count || 0,
      learners: learnersResult.count || 0,
      subscriptions:
        subscriptionsResult.count || 0,
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
      key: "status",
      label: "Status",
      render: (row) =>
        row.status || "Active",
    },
    {
      key: "geography",
      label: "Geography",
      render: (row) =>
        row.province_id && row.district_id
          ? "Assigned"
          : "Needs assignment",
    },
  ];

  return (
    <EnterprisePortalShell
      roleTitle="Platform Operator"
      subtitle="Connected school and subscription oversight"
      heading="Platform operations"
      headingNote="Connected schools, users and subscription coverage"
      icon={ShieldCheck}
      exportTitle="Platform Operator"
      user={{
        name:
          profile?.full_name ||
          "Platform Operator",
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
          icon={School}
          label="Schools"
          value={metrics.schools}
          note="Connected institutions"
        />
        <PortalMetric
          icon={Users}
          label="Administrators"
          value={metrics.administrators}
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
          value={metrics.subscriptions}
          note="Subscription records"
        />
      </section>

      <section className="enterprise-card">
        <div className="enterprise-card-heading">
          <div>
            <p>School registry</p>
            <h2>Connected schools</h2>
          </div>
          <Building2 size={24} />
        </div>

        {loading ? (
          <p className="enterprise-empty">
            Loading school registry...
          </p>
        ) : (
          <PortalTable
            columns={columns}
            rows={schools}
            emptyMessage="No schools are available."
          />
        )}
      </section>
    </EnterprisePortalShell>
  );
}
