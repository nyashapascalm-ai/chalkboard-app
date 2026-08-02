"use client";

import PortalAuthGate from "../../../components/portal/enterprise/PortalAuthGate";
import OperatorDashboard from "../../../components/portal/enterprise/OperatorDashboard";

export default function OperatorPortalPage() {
  return (
    <PortalAuthGate
      requiredRole="operator"
      loadingLabel="Loading Operator portal..."
    >
      {({ session, profile }) => (
        <OperatorDashboard
          session={session}
          profile={profile}
        />
      )}
    </PortalAuthGate>
  );
}
