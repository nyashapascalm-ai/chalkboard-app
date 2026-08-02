"use client";

export default function MetricCard({
  icon: Icon,
  value,
  label,
  note,
}) {
  return (
    <article className="cb-kpi">
      {Icon ? (
        <div className="cb-kpi-icon">
          <Icon size={21} />
        </div>
      ) : null}

      <div className="cb-kpi-value">{value}</div>
      <div className="cb-kpi-label">{label}</div>
      {note ? (
        <div className="cb-kpi-note">{note}</div>
      ) : null}
    </article>
  );
}
