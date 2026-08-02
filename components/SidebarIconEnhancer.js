"use client";

import { useEffect } from "react";

const icons = {
  dashboard: '<svg viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>',
  school: '<svg viewBox="0 0 24 24" fill="none"><path d="M3 21h18M5 21V9l7-4 7 4v12M9 21v-6h6v6M8 11h.01M12 11h.01M16 11h.01"/></svg>',
  book: '<svg viewBox="0 0 24 24" fill="none"><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H11v17H6.5A2.5 2.5 0 0 0 4 22V5.5ZM20 5.5A2.5 2.5 0 0 0 17.5 3H13v17h4.5A2.5 2.5 0 0 1 20 22V5.5Z"/></svg>',
  users: '<svg viewBox="0 0 24 24" fill="none"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
  userplus: '<svg viewBox="0 0 24 24" fill="none"><path d="M15 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M8 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM19 8v6M22 11h-6"/></svg>',
  briefcase: '<svg viewBox="0 0 24 24" fill="none"><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 12h18M10 12v2h4v-2"/></svg>',
  wallet: '<svg viewBox="0 0 24 24" fill="none"><path d="M20 7V5a2 2 0 0 0-2-2H5a3 3 0 0 0 0 6h16v10a2 2 0 0 1-2 2H5a3 3 0 0 1-3-3V6"/><path d="M16 13h.01"/></svg>',
  calendar: '<svg viewBox="0 0 24 24" fill="none"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/></svg>',
  bell: '<svg viewBox="0 0 24 24" fill="none"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/></svg>',
  file: '<svg viewBox="0 0 24 24" fill="none"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6M8 13h8M8 17h8"/></svg>',
  settings: '<svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.83 2.83-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 .6 1.7 1.7 0 0 0-.4 1.1V21H9.6v-.1A1.7 1.7 0 0 0 9 19.4a1.7 1.7 0 0 0-1.88.34l-.06.06-2.83-2.83.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-.6-1 1.7 1.7 0 0 0-1.1-.4H3V9.6h.1A1.7 1.7 0 0 0 4.6 9a1.7 1.7 0 0 0-.34-1.88l-.06-.06 2.83-2.83.06.06A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-.6 1.7 1.7 0 0 0 .4-1.1V3h4v.1A1.7 1.7 0 0 0 15 4.6a1.7 1.7 0 0 0 1.88-.34l.06-.06 2.83 2.83-.06.06A1.7 1.7 0 0 0 19.4 9c.4.3.8.5 1.3.6h.1v4h-.1a1.7 1.7 0 0 0-1.3.4Z"/></svg>',
  megaphone: '<svg viewBox="0 0 24 24" fill="none"><path d="m3 11 18-5v12L3 13v-2Z"/><path d="M7 14v5a2 2 0 0 0 2 2h1l-1-6"/></svg>',
  box: '<svg viewBox="0 0 24 24" fill="none"><path d="m21 8-9-5-9 5 9 5 9-5Z"/><path d="m3 8 9 5v9M21 8l-9 5M3 16l9 6 9-6"/></svg>',
  download: '<svg viewBox="0 0 24 24" fill="none"><path d="M12 3v12M7 10l5 5 5-5M5 21h14"/></svg>',
  logout: '<svg viewBox="0 0 24 24" fill="none"><path d="M10 17l5-5-5-5M15 12H3M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/></svg>',
  circle: '<svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="8"/></svg>'
};

const rules = [
  [/dashboard/i, "dashboard"],
  [/notification/i, "bell"],
  [/school profile/i, "school"],
  [/class|form|subject/i, "book"],
  [/calendar|event/i, "calendar"],
  [/learner|student|teacher/i, "users"],
  [/admission/i, "userplus"],
  [/human resources|staff|personnel|operator|ministry/i, "briefcase"],
  [/finance|income|expense|fee|arrear|budget|cash|invoice|receipt/i, "wallet"],
  [/announcement|communication/i, "megaphone"],
  [/inventory|asset|contractor/i, "box"],
  [/setting|setup/i, "settings"],
  [/report|document|policy|meeting|governance|board/i, "file"],
  [/download|export/i, "download"],
  [/sign out|logout/i, "logout"],
];

function iconName(label) {
  const match = rules.find(([pattern]) => pattern.test(label));
  return match ? match[1] : "circle";
}

function enhanceNavigation() {
  document
    .querySelectorAll(".side-item, .cb-portal-nav-item")
    .forEach((item) => {
      if (item.querySelector(".chalk-nav-icon")) return;

      const label = String(item.textContent || "").trim();
      if (!label) return;

      const oldIcon = item.querySelector(".si");
      if (oldIcon) oldIcon.style.display = "none";

      const holder = document.createElement("span");
      holder.className = "chalk-nav-icon";
      holder.setAttribute("aria-hidden", "true");
      holder.innerHTML = icons[iconName(label)];
      item.prepend(holder);
    });
}

export default function SidebarIconEnhancer() {
  useEffect(() => {
    enhanceNavigation();

    const observer = new MutationObserver(enhanceNavigation);
    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    return () => observer.disconnect();
  }, []);

  return null;
}
