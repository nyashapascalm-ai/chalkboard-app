"use client";

export default function PortalShell({
  sidebar,
  header,
  children,
}) {
  return (
    <div className="shell">
      {sidebar}
      <main className="main">
        {header}
        {children}
      </main>
    </div>
  );
}
