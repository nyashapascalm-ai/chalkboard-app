"use client";

export default function PortalMetric({
  icon: Icon,
  label,
  value,
  note,
}) {
  return (
    <article className="enterprise-metric-card">
      <div className="enterprise-metric-icon">
        <Icon size={20} />
      </div>
      <strong>
        {typeof value === "number"
          ? value.toLocaleString("en-GB")
          : value}
      </strong>
      <span>{label}</span>
      {note ? <small>{note}</small> : null}
    </article>
  );
}
