"use client";

import {
  BookOpen,
  Boxes,
  Building2,
  CalendarDays,
  ChartNoAxesCombined,
  ClipboardList,
  Download,
  FileText,
  Gavel,
  GraduationCap,
  Landmark,
  LayoutDashboard,
  LogOut,
  Megaphone,
  Package,
  ReceiptText,
  School,
  Settings,
  Users,
  Wallet,
  Wrench,
} from "lucide-react";

const ICONS = {
  dashboard: LayoutDashboard,
  school: School,
  classes: BookOpen,
  subjects: BookOpen,
  students: GraduationCap,
  teachers: Users,
  staff: Users,
  personnel: ClipboardList,
  admissions: GraduationCap,
  reports: FileText,
  fees: ReceiptText,
  documents: ReceiptText,
  arrears: Wallet,
  finance: Wallet,
  budget: ChartNoAxesCombined,
  pettycash: Wallet,
  banking: Landmark,
  board: Landmark,
  meetings: Gavel,
  events: CalendarDays,
  contractors: Wrench,
  inventory: Package,
  assets: Boxes,
  communications: Megaphone,
  mybilling: ReceiptText,
};

const GROUP_ICONS = {
  setup: Building2,
  people: Users,
  reporting: FileText,
  money: Wallet,
  governance: Landmark,
  operations: Settings,
  communication: Megaphone,
  account: ReceiptText,
};

export default function AdminSidebar({
  nav,
  groups,
  openGroup,
  onToggleGroup,
  onNavigate,
  email,
  isTeacher,
  onInstall,
  onSignOut,
}) {
  return (
    <aside className="sidebar">
      <div className="side-brand">
        <img
          src="/chalkboard-sidebar-mark.png"
          alt="Chalkboard"
        />
      </div>

      <nav className="side-nav">
        <button
          className={
            "side-item" +
            (nav === "dashboard" ? " active" : "")
          }
          onClick={() => onNavigate("dashboard")}
        >
          <LayoutDashboard size={17} />
          Dashboard
        </button>

        {groups.map((group) => {
          const GroupIcon =
            GROUP_ICONS[group.key] || Settings;
          const isOpen = openGroup === group.key;

          return (
            <div key={group.key}>
              <button
                className="side-group"
                onClick={() =>
                  onToggleGroup(
                    isOpen ? null : group.key,
                  )
                }
                aria-expanded={isOpen}
              >
                <GroupIcon size={15} />
                <span style={{ flex: 1 }}>
                  {group.label}
                </span>
                <span aria-hidden="true">
                  {isOpen ? "−" : "+"}
                </span>
              </button>

              {isOpen
                ? group.items.map((item) => {
                    const [key, label] = item;
                    const Icon = ICONS[key] || FileText;

                    return (
                      <button
                        key={key}
                        className={
                          "side-item sub-item" +
                          (nav === key
                            ? " active"
                            : "")
                        }
                        onClick={() =>
                          onNavigate(key)
                        }
                      >
                        <Icon size={16} />
                        {label}
                      </button>
                    );
                  })
                : null}
            </div>
          );
        })}
      </nav>

      <div className="sidebar-account">
        <strong>{email}</strong>
        {isTeacher ? <span>Teacher</span> : null}
      </div>

      <button
        className="side-item"
        onClick={onInstall}
      >
        <Download size={16} />
        Download app
      </button>

      <button
        className="side-item sidebar-signout"
        onClick={onSignOut}
      >
        <LogOut size={16} />
        Sign out
      </button>
    </aside>
  );
}
