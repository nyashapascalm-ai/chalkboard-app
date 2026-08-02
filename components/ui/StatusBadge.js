"use client";

export default function StatusBadge({
  status,
  children,
}) {
  const value = String(status || "neutral")
    .toLowerCase()
    .replaceAll(" ", "-");

  return (
    <span className={`status-badge status-${value}`}>
      {children || status}
    </span>
  );
}
