"use client";

export default function PortalLoading({
  label = "Loading portal...",
}) {
  return (
    <main className="enterprise-portal-loading">
      <img
        src="/icon-192.png"
        alt="Chalkboard"
      />
      <p>{label}</p>
    </main>
  );
}
