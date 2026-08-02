"use client";

import { useEffect, useState } from "react";
import {
  BriefcaseBusiness,
  CalendarDays,
  FileWarning,
  GraduationCap,
  Landmark,
  Megaphone,
  Package,
  ReceiptText,
  School,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";

import { supabase } from "../../../lib/supabaseClient";
import { financeTotals } from "../../financeNormaliser";
import EmptyState from "../../ui/EmptyState";
import MetricCard from "../../ui/MetricCard";
import SectionCard from "../../ui/SectionCard";

const EMPTY_METRICS = {
  learners: 0,
  classes: 0,
  teachers: 0,
  staff: 0,
  income: 0,
  expenses: 0,
  outstanding: 0,
  events: 0,
  meetings: 0,
  announcements: 0,
  inventory: 0,
  leave: 0,
};

function currency(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(Number(value || 0));
}

export default function AdminDashboard({
  schoolId,
  school,
}) {
  const [metrics, setMetrics] =
    useState(EMPTY_METRICS);
  const [recentAnnouncements, setRecentAnnouncements] =
    useState([]);
  const [recentEvents, setRecentEvents] =
    useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadDashboard();
  }, [schoolId]);

  async function loadDashboard() {
    if (!schoolId) {
      setMetrics(EMPTY_METRICS);
      setRecentAnnouncements([]);
      setRecentEvents([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    const today = new Date()
      .toISOString()
      .slice(0, 10);

    const [
      learners,
      classes,
      teachers,
      staff,
      finance,
      invoices,
      events,
      meetings,
      announcements,
      inventory,
      leave,
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

      supabase
        .from("school_invoices")
        .select("balance")
        .eq("school_id", schoolId)
        .neq("status", "void"),

      supabase
        .from("school_events")
        .select(
          "id,title,start_date,category",
        )
        .eq("school_id", schoolId)
        .gte("start_date", today)
        .order("start_date")
        .limit(5),

      supabase
        .from("school_meetings")
        .select("id,title,meeting_date")
        .eq("school_id", schoolId)
        .gte("meeting_date", today)
        .order("meeting_date")
        .limit(5),

      supabase
        .from("announcements")
        .select("id,title,created_at")
        .eq("school_id", schoolId)
        .order("created_at", {
          ascending: false,
        })
        .limit(5),

      supabase
        .from("inventory")
        .select("id", {
          count: "exact",
          head: true,
        })
        .eq("school_id", schoolId),

      supabase
        .from("hr_leave_requests")
        .select("id", {
          count: "exact",
          head: true,
        })
        .eq("school_id", schoolId)
        .eq("status", "pending"),
    ]);

    const firstError = [
      learners.error,
      classes.error,
      teachers.error,
      staff.error,
      finance.error,
      invoices.error,
      events.error,
      meetings.error,
      announcements.error,
      inventory.error,
      leave.error,
    ].find(Boolean);

    if (firstError) {
      setError(firstError.message);
    }

    const { income, expenses } =
      financeTotals(finance.data || []);

    const outstanding =
      (invoices.data || []).reduce(
        (sum, row) =>
          sum + Number(row.balance || 0),
        0,
      );

    setMetrics({
      learners: learners.count || 0,
      classes: classes.count || 0,
      teachers: teachers.count || 0,
      staff: staff.count || 0,
      income,
      expenses,
      outstanding,
      events: events.data?.length || 0,
      meetings: meetings.data?.length || 0,
      announcements:
        announcements.data?.length || 0,
      inventory: inventory.count || 0,
      leave: leave.count || 0,
    });

    setRecentAnnouncements(
      announcements.data || [],
    );
    setRecentEvents(events.data || []);
    setLoading(false);
  }

  const cards = [
    {
      icon: GraduationCap,
      value: metrics.learners,
      label: "Learners",
      note: "Current learner records",
    },
    {
      icon: School,
      value: metrics.classes,
      label: "Classes and forms",
      note: "Configured teaching groups",
    },
    {
      icon: Users,
      value: metrics.teachers,
      label: "Teachers",
      note: "Teacher accounts",
    },
    {
      icon: BriefcaseBusiness,
      value: metrics.staff,
      label: "Other staff",
      note: "Current HR records",
    },
    {
      icon: Wallet,
      value: currency(metrics.income),
      label: "Income",
      note: "Recorded school income",
    },
    {
      icon: TrendingUp,
      value: currency(metrics.expenses),
      label: "Expenses",
      note: "Recorded expenditure",
    },
    {
      icon: ReceiptText,
      value: currency(metrics.outstanding),
      label: "Outstanding invoices",
      note: "Open balances",
    },
    {
      icon: CalendarDays,
      value: metrics.events,
      label: "Upcoming events",
      note: "Future calendar entries",
    },
    {
      icon: Landmark,
      value: metrics.meetings,
      label: "Upcoming meetings",
      note: "Governance meetings",
    },
    {
      icon: Megaphone,
      value: metrics.announcements,
      label: "Recent announcements",
      note: "Latest communications",
    },
    {
      icon: Package,
      value: metrics.inventory,
      label: "Inventory records",
      note: "Tracked stock and supplies",
    },
    {
      icon: FileWarning,
      value: metrics.leave,
      label: "Pending leave",
      note: "Requests awaiting action",
    },
  ];

  const today = new Date();

  return (
    <div className="cb-executive">
      {error ? (
        <p className="error">{error}</p>
      ) : null}

      <section className="cb-executive-hero">
        <div>
          <p>School management overview</p>
          <h2>
            {school?.name || "Your school"}
          </h2>
          <p>
            A complete operational view across
            academics, people, finance,
            governance, operations and
            communication.
          </p>
        </div>

        <div className="cb-executive-date">
          <span>Today</span>
          <strong>
            {today.toLocaleDateString(
              undefined,
              {
                day: "2-digit",
                month: "short",
                year: "numeric",
              },
            )}
          </strong>
          <span>
            {today.toLocaleDateString(
              undefined,
              {
                weekday: "long",
              },
            )}
          </span>
        </div>
      </section>

      {loading ? (
        <div className="card">
          Loading dashboard...
        </div>
      ) : (
        <section className="cb-kpi-grid">
          {cards.map((card) => (
            <MetricCard
              key={card.label}
              {...card}
            />
          ))}
        </section>
      )}

      <section className="cb-executive-columns">
        <SectionCard
          title="Upcoming school activity"
          description="Scheduled events and school calendar activity."
        >
          {recentEvents.length ? (
            <div className="cb-overview-list">
              {recentEvents.map((event) => (
                <div
                  className="cb-overview-row"
                  key={event.id}
                >
                  <span>{event.title}</span>
                  <strong>
                    {event.start_date}
                  </strong>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              title="No upcoming events"
              description="Events added to the school calendar will appear here."
              icon={CalendarDays}
            />
          )}
        </SectionCard>

        <SectionCard
          title="Recent communication"
          description="The latest announcements published by the school."
        >
          {recentAnnouncements.length ? (
            <div className="cb-overview-list">
              {recentAnnouncements.map(
                (announcement) => (
                  <div
                    className="cb-overview-row"
                    key={announcement.id}
                  >
                    <span>
                      {announcement.title}
                    </span>
                    <strong>
                      {String(
                        announcement.created_at ||
                          "",
                      ).slice(0, 10)}
                    </strong>
                  </div>
                ),
              )}
            </div>
          ) : (
            <EmptyState
              title="No recent announcements"
              description="New school communications will appear here."
              icon={Megaphone}
            />
          )}
        </SectionCard>
      </section>
    </div>
  );
}
