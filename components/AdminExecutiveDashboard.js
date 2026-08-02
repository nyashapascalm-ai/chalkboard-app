"use client";

import { useEffect, useState } from "react";
import {
  Users,
  GraduationCap,
  School,
  Wallet,
  ReceiptText,
  CalendarDays,
  BriefcaseBusiness,
  Landmark,
  Megaphone,
  Package,
  FileWarning,
  TrendingUp,
} from "lucide-react";
import { supabase } from "../lib/supabaseClient";

const empty = {
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

export default function AdminExecutiveDashboard({ schoolId, school }) {
  const [metrics, setMetrics] = useState(empty);
  const [recentAnnouncements, setRecentAnnouncements] = useState([]);
  const [recentEvents, setRecentEvents] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    load();
  }, [schoolId]);

  async function load() {
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
      supabase.from("students").select("id", { count: "exact", head: true }).eq("school_id", schoolId),
      supabase.from("classes").select("id", { count: "exact", head: true }).eq("school_id", schoolId),
      supabase.from("profiles").select("id", { count: "exact", head: true }).eq("school_id", schoolId).eq("role", "teacher"),
      supabase.from("staff").select("id", { count: "exact", head: true }).eq("school_id", schoolId),
      supabase.from("finance_entries").select("type,amount").eq("school_id", schoolId),
      supabase.from("school_invoices").select("balance").eq("school_id", schoolId).neq("status", "void"),
      supabase.from("school_events").select("id,title,start_date,category").eq("school_id", schoolId).gte("start_date", new Date().toISOString().slice(0,10)).order("start_date").limit(5),
      supabase.from("school_meetings").select("id,title,meeting_date").eq("school_id", schoolId).gte("meeting_date", new Date().toISOString().slice(0,10)).order("meeting_date").limit(5),
      supabase.from("announcements").select("id,title,created_at").eq("school_id", schoolId).order("created_at", { ascending: false }).limit(5),
      supabase.from("inventory").select("id", { count: "exact", head: true }).eq("school_id", schoolId),
      supabase.from("hr_leave_requests").select("id", { count: "exact", head: true }).eq("school_id", schoolId).eq("status", "pending"),
    ]);

    const income = (finance.data || [])
      .filter((row) => row.type === "income")
      .reduce((sum, row) => sum + Number(row.amount || 0), 0);

    const expenses = (finance.data || [])
      .filter((row) => row.type === "expense")
      .reduce((sum, row) => sum + Number(row.amount || 0), 0);

    const outstanding = (invoices.data || []).reduce(
      (sum, row) => sum + Number(row.balance || 0),
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
      announcements: announcements.data?.length || 0,
      inventory: inventory.count || 0,
      leave: leave.count || 0,
    });

    setRecentAnnouncements(announcements.data || []);
    setRecentEvents(events.data || []);

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

    if (firstError) setError(firstError.message);
  }

  const cards = [
    [GraduationCap, metrics.learners, "Learners", "Current enrolled learner records"],
    [School, metrics.classes, "Classes and forms", "Configured teaching groups"],
    [Users, metrics.teachers, "Teachers", "Active teacher accounts"],
    [BriefcaseBusiness, metrics.staff, "Other staff", "Current HR records"],
    [Wallet, `$${metrics.income.toFixed(2)}`, "Income", "Recorded school income"],
    [TrendingUp, `$${metrics.expenses.toFixed(2)}`, "Expenses", "Recorded expenditure"],
    [ReceiptText, `$${metrics.outstanding.toFixed(2)}`, "Outstanding invoices", "Open balances requiring attention"],
    [CalendarDays, metrics.events, "Upcoming events", "Future calendar entries"],
    [Landmark, metrics.meetings, "Upcoming meetings", "Scheduled governance meetings"],
    [Megaphone, metrics.announcements, "Recent announcements", "Latest school communications"],
    [Package, metrics.inventory, "Inventory records", "Tracked stock and supplies"],
    [FileWarning, metrics.leave, "Pending leave", "Leave requests awaiting action"],
  ];

  const today = new Date();

  return (
    <div className="cb-executive">
      {error ? <p className="error">{error}</p> : null}

      <section className="cb-executive-hero">
        <div>
          <p style={{ margin: 0, color: "#9fc8ff", fontWeight: 900 }}>
            SCHOOL MANAGEMENT OVERVIEW
          </p>
          <h2>{school?.name || "Your school"}</h2>
          <p>
            A complete operational view across academics, people, finance,
            governance, operations, communications and school administration.
          </p>
        </div>

        <div className="cb-executive-date">
          <span>Today</span>
          <strong>
            {today.toLocaleDateString(undefined, {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })}
          </strong>
          <span>
            {today.toLocaleDateString(undefined, { weekday: "long" })}
          </span>
        </div>
      </section>

      <section className="cb-kpi-grid">
        {cards.map(([Icon, value, label, note]) => (
          <article className="cb-kpi" key={label}>
            <div className="cb-kpi-icon">
              <Icon size={23} strokeWidth={2.2} />
            </div>
            <div className="cb-kpi-value">{value}</div>
            <div className="cb-kpi-label">{label}</div>
            <div className="cb-kpi-note">{note}</div>
          </article>
        ))}
      </section>

      <section className="cb-executive-columns">
        <article className="cb-overview-panel">
          <h3>Upcoming school activity</h3>
          <div className="cb-overview-list">
            {recentEvents.length ? (
              recentEvents.map((event) => (
                <div className="cb-overview-row" key={event.id}>
                  <span>{event.title}</span>
                  <strong>{event.start_date}</strong>
                </div>
              ))
            ) : (
              <div className="cb-overview-row">
                <span>No upcoming events</span>
                <strong>Calendar clear</strong>
              </div>
            )}
          </div>
        </article>

        <article className="cb-overview-panel">
          <h3>Recent communication</h3>
          <div className="cb-overview-list">
            {recentAnnouncements.length ? (
              recentAnnouncements.map((item) => (
                <div className="cb-overview-row" key={item.id}>
                  <span>{item.title}</span>
                  <strong>
                    {String(item.created_at || "").slice(0, 10)}
                  </strong>
                </div>
              ))
            ) : (
              <div className="cb-overview-row">
                <span>No recent announcements</span>
                <strong>Nothing new</strong>
              </div>
            )}
          </div>
        </article>
      </section>
    </div>
  );
}
