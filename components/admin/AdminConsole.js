"use client";

import { useEffect, useMemo, useState } from "react";

import { supabase } from "../../lib/supabaseClient";
import { installChalkboardApp } from "../../lib/installApp";
import { getSubscriptionStatus } from "../../lib/subscriptionStatus";

import ExportToolbar from "../ExportToolbar";
import AdminSidebar from "../portal/AdminSidebar";
import PageHeader from "../ui/PageHeader";

import AdminDashboard from "./dashboard/AdminDashboard";
import ClassesPanel from "./school-setup/ClassesPanel";
import SubjectsPanel from "./school-setup/SubjectsPanel";
import SchoolProfilePanel from "./school-setup/SchoolProfilePanel";

import TeachersPanel from "./people/TeachersPanel";
import AdmissionsPanel from "./people/AdmissionsPanel";
import LearnersPanel from "./people/LearnersPanel";
import HumanResourcesPanel from "./people/HumanResourcesPanel";
import PersonnelPanel from "./people/PersonnelPanel";

import FinancePanel from "./finance/FinancePanel";
import BankingPanel from "./finance/BankingPanel";
import PettyCashPanel from "./finance/PettyCashPanel";
import FeesPanel from "./finance/FeesPanel";
import ArrearsPanel from "./finance/ArrearsPanel";
import FinanceDocumentsPanel from "./finance/FinanceDocumentsPanel";
import BudgetPanel from "./finance/BudgetPanel";

import GovernanceBoardPanel from "./governance/GovernanceBoardPanel";
import MeetingsPanel from "./governance/MeetingsPanel";

import EventsPanel from "./operations/EventsPanel";
import ContractorsPanel from "./operations/ContractorsPanel";
import InventoryPanel from "./operations/InventoryPanel";
import AssetsPanel from "./operations/AssetsPanel";

import CommunicationCentre from "./communications/CommunicationCentre";
import ReportsPanel from "./reporting/ReportsPanel";

import SchoolBillingPanel from "./billing/SchoolBillingPanel";
import SubscriptionLock from "./billing/SubscriptionLock";
import SubscriptionNotice from "./billing/SubscriptionNotice";

const GROUPS = [
  {
    key: "setup",
    label: "School setup",
    items: [
      ["school", "School profile"],
      ["classes", "Classes and forms"],
      ["subjects", "Subjects"],
    ],
  },
  {
    key: "people",
    label: "People",
    items: [
      ["students", "Learners"],
      ["teachers", "Teachers and allocations"],
      ["staff", "Human Resources"],
      ["personnel", "Personnel records"],
      ["admissions", "Admissions"],
    ],
  },
  {
    key: "reporting",
    label: "Reporting",
    items: [
      ["reports", "Attendance reports"],
    ],
  },
  {
    key: "money",
    label: "Finance",
    items: [
      ["fees", "Fees"],
      ["documents", "Invoices and receipts"],
      ["arrears", "Arrears"],
      ["finance", "Income and expenses"],
      ["budget", "Annual budget"],
      ["pettycash", "Petty cash"],
      ["banking", "Banking"],
    ],
  },
  {
    key: "governance",
    label: "Governance",
    items: [
      ["board", "Governing board"],
      ["meetings", "Meetings and resolutions"],
      ["events", "Events calendar"],
    ],
  },
  {
    key: "operations",
    label: "Operations",
    items: [
      ["contractors", "Contractors and payments"],
      ["inventory", "Inventory"],
      ["assets", "Assets"],
    ],
  },
  {
    key: "communication",
    label: "Communication",
    items: [
      ["communications", "Communications"],
    ],
  },
  {
    key: "account",
    label: "Account",
    items: [
      ["mybilling", "Subscription"],
    ],
  },
];

const TITLES = {
  dashboard: "Dashboard",
  school: "School profile",
  classes: "Classes and forms",
  subjects: "Subjects",
  students: "Learners",
  teachers: "Teachers and allocations",
  staff: "Human Resources",
  personnel: "Personnel records",
  admissions: "Admissions",
  reports: "Attendance reports",
  fees: "Fees",
  documents: "Invoices and receipts",
  arrears: "Arrears",
  finance: "Income and expenses",
  budget: "Annual budget",
  pettycash: "Petty cash",
  banking: "Banking",
  board: "Governing board",
  meetings: "Meetings and resolutions",
  events: "Events calendar",
  contractors: "Contractors and payments",
  inventory: "Inventory",
  assets: "Assets",
  communications: "Communications",
  mybilling: "Subscription",
};

function groupFor(nav) {
  return (
    GROUPS.find((group) =>
      group.items.some(
        ([key]) => key === nav,
      ),
    )?.key || null
  );
}

export default function AdminConsole({
  session,
  role,
  initialSchoolId,
}) {
  const operator = role === "operator";
  const [schools, setSchools] = useState([]);
  const [schoolId, setSchoolId] = useState(
    initialSchoolId,
  );
  const [nav, setNav] = useState("dashboard");
  const [openGroup, setOpenGroup] = useState(
    groupFor("dashboard"),
  );
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [school, setSchool] = useState(null);
  const [settings, setSettings] = useState(null);
  const [subscription, setSubscription] =
    useState(undefined);
  const [subscriptionModalOpen, setSubscriptionModalOpen] =
    useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    async function loadSchools() {
      if (!operator) return;

      const { data, error } = await supabase
        .from("schools")
        .select("id,name")
        .order("name");

      if (error) {
        setLoadError(error.message);
        return;
      }

      setSchools(data || []);

      if (!schoolId && data?.length) {
        setSchoolId(data[0].id);
      }
    }

    loadSchools();
  }, [operator]);

  useEffect(() => {
    loadWorkspace();
  }, [schoolId]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: "auto",
      });
    }
  }, [nav]);

  useEffect(() => {
    async function verifyReturnPayment() {
      if (
        typeof window === "undefined" ||
        !schoolId ||
        operator
      ) {
        return;
      }

      const url = new URL(
        window.location.href,
      );

      if (
        url.searchParams.get("subpay") !== "1"
      ) {
        return;
      }

      try {
        const response = await fetch(
          "/api/subscription-pay/status",
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              schoolId,
            }),
          },
        );

        const result = await response.json();

        if (result.status === "paid") {
          await loadSubscription();
          window.alert(
            "Payment received. The subscription has been updated.",
          );
        }
      } catch {
        // The billing page still allows a manual
        // status refresh if verification fails.
      }

      url.searchParams.delete("subpay");

      window.history.replaceState(
        {},
        "",
        url.toString(),
      );
    }

    verifyReturnPayment();
  }, [schoolId, operator]);

  async function loadWorkspace() {
    if (!schoolId) {
      setClasses([]);
      setSubjects([]);
      setSchool(null);
      setSettings(null);
      setSubscription(null);
      return;
    }

    setLoadError("");

    const [
      classResult,
      subjectResult,
      schoolResult,
      settingsResult,
      subscriptionResult,
    ] = await Promise.all([
      supabase
        .from("classes")
        .select("*")
        .eq("school_id", schoolId)
        .order("name"),

      supabase
        .from("subjects")
        .select("*")
        .eq("school_id", schoolId)
        .order("name"),

      supabase
        .from("schools")
        .select("id,name")
        .eq("id", schoolId)
        .single(),

      supabase
        .from("school_settings")
        .select("*")
        .eq("school_id", schoolId)
        .maybeSingle(),

      supabase
        .from("subscriptions")
        .select("*")
        .eq("school_id", schoolId)
        .maybeSingle(),
    ]);

    setClasses(classResult.data || []);
    setSubjects(subjectResult.data || []);
    setSchool(schoolResult.data || null);
    setSettings(settingsResult.data || null);
    setSubscription(
      subscriptionResult.data || null,
    );

    const firstError = [
      classResult.error,
      subjectResult.error,
      schoolResult.error,
      settingsResult.error,
      subscriptionResult.error,
    ].find(Boolean);

    if (firstError) {
      setLoadError(firstError.message);
    }
  }

  async function loadClasses() {
    if (!schoolId) return;

    const { data, error } = await supabase
      .from("classes")
      .select("*")
      .eq("school_id", schoolId)
      .order("name");

    if (error) {
      setLoadError(error.message);
    } else {
      setClasses(data || []);
    }
  }

  async function loadSubjects() {
    if (!schoolId) return;

    const { data, error } = await supabase
      .from("subjects")
      .select("*")
      .eq("school_id", schoolId)
      .order("name");

    if (error) {
      setLoadError(error.message);
    } else {
      setSubjects(data || []);
    }
  }

  async function loadSchoolMeta() {
    if (!schoolId) return;

    const [schoolResult, settingsResult] =
      await Promise.all([
        supabase
          .from("schools")
          .select("id,name")
          .eq("id", schoolId)
          .single(),

        supabase
          .from("school_settings")
          .select("*")
          .eq("school_id", schoolId)
          .maybeSingle(),
      ]);

    setSchool(schoolResult.data || null);
    setSettings(settingsResult.data || null);

    const error =
      schoolResult.error ||
      settingsResult.error;

    if (error) {
      setLoadError(error.message);
    }
  }

  async function loadSubscription() {
    if (!schoolId) return;

    const { data, error } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("school_id", schoolId)
      .maybeSingle();

    if (error) {
      setLoadError(error.message);
    } else {
      setSubscription(data || null);
    }
  }

  function navigate(key) {
    setNav(key);

    const group = groupFor(key);
    if (group) setOpenGroup(group);
  }

  const subscriptionStatus = useMemo(
    () => getSubscriptionStatus(subscription),
    [subscription],
  );

  if (
    !operator &&
    subscriptionStatus.code === "locked"
  ) {
    return (
      <SubscriptionLock
        schoolId={schoolId}
        due={subscriptionStatus.due}
      />
    );
  }

  const panelContext = {
    schoolId,
    school,
    settings,
    classes,
    subjects,
    session,
    operator,
    loadClasses,
    loadSubjects,
    loadSchoolMeta,
    loadSubscription,
  };

  const PANEL_REGISTRY = {
    dashboard: () => (
      <AdminDashboard
        schoolId={schoolId}
        school={school}
      />
    ),

    school: () => (
      <SchoolProfilePanel
        schoolId={schoolId}
        school={school}
        settings={settings}
        onChange={loadSchoolMeta}
      />
    ),

    classes: () => (
      <ClassesPanel
        schoolId={schoolId}
        classes={classes}
        onChange={loadClasses}
      />
    ),

    subjects: () => (
      <SubjectsPanel
        schoolId={schoolId}
        subjects={subjects}
        onChange={loadSubjects}
      />
    ),

    students: () => (
      <LearnersPanel
        schoolId={schoolId}
        classes={classes}
        isTeacher={false}
      />
    ),

    teachers: () => (
      <TeachersPanel
        schoolId={schoolId}
        classes={classes}
        subjects={subjects}
      />
    ),

    staff: () => (
      <HumanResourcesPanel
        schoolId={schoolId}
      />
    ),

    personnel: () => (
      <PersonnelPanel schoolId={schoolId} />
    ),

    admissions: () => (
      <AdmissionsPanel
        schoolId={schoolId}
        classes={classes}
      />
    ),

    reports: () => (
      <ReportsPanel
        schoolId={schoolId}
        classes={classes}
        school={school}
        settings={settings}
      />
    ),

    fees: () => (
      <FeesPanel
        schoolId={schoolId}
        classes={classes}
        school={school}
        settings={settings}
      />
    ),

    documents: () => (
      <FinanceDocumentsPanel
        schoolId={schoolId}
        school={school}
        settings={settings}
      />
    ),

    arrears: () => (
      <ArrearsPanel
        schoolId={schoolId}
        classes={classes}
        school={school}
        settings={settings}
      />
    ),

    finance: () => (
      <FinancePanel schoolId={schoolId} />
    ),

    budget: () => (
      <BudgetPanel
        schoolId={schoolId}
        settings={settings}
      />
    ),

    pettycash: () => (
      <PettyCashPanel
        schoolId={schoolId}
      />
    ),

    banking: () => (
      <BankingPanel schoolId={schoolId} />
    ),

    board: () => (
      <GovernanceBoardPanel
        schoolId={schoolId}
      />
    ),

    meetings: () => (
      <MeetingsPanel schoolId={schoolId} />
    ),

    events: () => (
      <EventsPanel schoolId={schoolId} />
    ),

    contractors: () => (
      <ContractorsPanel
        schoolId={schoolId}
      />
    ),

    inventory: () => (
      <InventoryPanel
        schoolId={schoolId}
        school={school}
        settings={settings}
      />
    ),

    assets: () => (
      <AssetsPanel
        schoolId={schoolId}
        school={school}
        settings={settings}
      />
    ),

    communications: () => (
      <CommunicationCentre
        schoolId={schoolId}
      />
    ),

    mybilling: () => (
      <SchoolBillingPanel
        schoolId={schoolId}
      />
    ),
  };

  const renderPanel =
    PANEL_REGISTRY[nav] ||
    PANEL_REGISTRY.dashboard;

  return (
    <div className="shell">
      <SubscriptionNotice
        status={subscriptionStatus.code}
        due={subscriptionStatus.due}
        modalOpen={
          !operator &&
          subscriptionModalOpen
        }
        onDismiss={() =>
          setSubscriptionModalOpen(false)
        }
        onManage={() => {
          setSubscriptionModalOpen(false);
          navigate("mybilling");
        }}
      />

      <AdminSidebar
        nav={nav}
        groups={GROUPS}
        openGroup={openGroup}
        onToggleGroup={setOpenGroup}
        onNavigate={navigate}
        email={session.user.email}
        isTeacher={false}
        onInstall={installChalkboardApp}
        onSignOut={() =>
          supabase.auth.signOut()
        }
      />

      <main className="main">
        <PageHeader
          title={TITLES[nav] || "Dashboard"}
          actions={
            <ExportToolbar
              title={
                TITLES[nav] || "Chalkboard"
              }
              scopeSelector=".main"
            />
          }
          selector={
            operator ? (
              <select
                value={schoolId || ""}
                onChange={(event) =>
                  setSchoolId(
                    event.target.value,
                  )
                }
                className="workspace-school-select"
              >
                {schools.map((item) => (
                  <option
                    key={item.id}
                    value={item.id}
                  >
                    {item.name}
                  </option>
                ))}
              </select>
            ) : null
          }
        />

        {loadError ? (
          <p className="error">
            {loadError}
          </p>
        ) : null}

        {!schoolId ? (
          <div className="card">
            No school selected.
          </div>
        ) : (
          renderPanel(panelContext)
        )}
      </main>
    </div>
  );
}
