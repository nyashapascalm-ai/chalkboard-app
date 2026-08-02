"use client";

export default function PortalStatusBadge({
  value,
}) {
  const normalised = String(
    value || "unknown",
  )
    .toLowerCase()
    .replaceAll(" ", "_");

  return (
    <span
      className={`enterprise-status ${normalised}`}
    >
      {String(value || "unknown").replaceAll(
        "_",
        " ",
      )}
    </span>
  );
}
