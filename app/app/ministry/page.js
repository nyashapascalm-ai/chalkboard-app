"use client";

import PortalAuthGate from "../../../components/portal/enterprise/PortalAuthGate";
import MinistryDashboard from "../../../components/portal/enterprise/MinistryDashboard";

export default function MinistryPortalPage() {
  return (
    <PortalAuthGate
      requiredRole="ministry_official"
      loadingLabel="Loading Ministry reporting..."
    >
      {({ session, profile }) => (
        <MinistryDashboard
          session={session}
          profile={profile}
        />
      )}
    </PortalAuthGate>
  );
}
