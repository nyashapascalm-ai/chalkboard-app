"use client";

import { Inbox } from "lucide-react";

export default function EmptyState({
  title = "Nothing here yet",
  description,
  action,
  icon: Icon = Inbox,
}) {
  return (
    <div className="empty-state">
      <div className="empty-state-icon">
        <Icon size={24} />
      </div>
      <h3>{title}</h3>
      {description ? <p>{description}</p> : null}
      {action ? (
        <div className="empty-state-action">
          {action}
        </div>
      ) : null}
    </div>
  );
}
