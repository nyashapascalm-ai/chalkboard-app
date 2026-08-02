"use client";

import {
  AlertTriangle,
  CalendarClock,
  CreditCard,
  X,
} from "lucide-react";

export default function SubscriptionNotice({
  status,
  due,
  modalOpen,
  onDismiss,
  onManage,
}) {
  if (
    !["due_soon", "overdue"].includes(status)
  ) {
    return null;
  }

  const overdue = status === "overdue";

  return (
    <>
      {modalOpen ? (
        <div className="subscription-modal-backdrop">
          <div className="subscription-modal">
            <div
              className={
                overdue
                  ? "subscription-modal-icon overdue"
                  : "subscription-modal-icon"
              }
            >
              {overdue ? (
                <AlertTriangle size={23} />
              ) : (
                <CalendarClock size={23} />
              )}
            </div>

            <button
              className="subscription-modal-close"
              onClick={onDismiss}
              aria-label="Close subscription reminder"
            >
              <X size={17} />
            </button>

            <h2>
              {overdue
                ? "Subscription overdue"
                : "Subscription due soon"}
            </h2>

            <p>
              {overdue
                ? `The subscription was due on ${due}. Pay now to prevent access from being paused.`
                : `The subscription is due on ${due}.`}
            </p>

            <div className="billing-actions">
              <button onClick={onManage}>
                <CreditCard size={16} />
                Manage subscription
              </button>

              <button
                className="ghost"
                onClick={onDismiss}
              >
                Later
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <div
        className={
          overdue
            ? "subscription-banner overdue"
            : "subscription-banner"
        }
      >
        {overdue ? (
          <AlertTriangle size={17} />
        ) : (
          <CalendarClock size={17} />
        )}

        <span>
          {overdue
            ? `Subscription overdue — due ${due}.`
            : `Subscription due on ${due}.`}
        </span>

        <button onClick={onManage}>
          Manage
        </button>
      </div>
    </>
  );
}
