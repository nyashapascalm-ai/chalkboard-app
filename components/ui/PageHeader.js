"use client";

export default function PageHeader({
  title,
  actions,
  selector,
}) {
  return (
    <header className="portal-page-header">
      <div>
        <p className="portal-page-eyebrow">
          Chalkboard School Management
        </p>
        <h1>{title}</h1>
      </div>

      <div className="portal-page-actions">
        {actions}
        {selector}
      </div>
    </header>
  );
}
