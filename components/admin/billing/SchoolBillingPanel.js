"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CalendarClock,
  CheckCircle2,
  CreditCard,
  ExternalLink,
  ReceiptText,
  RefreshCw,
} from "lucide-react";

import { supabase } from "../../../lib/supabaseClient";
import { getSubscriptionStatus } from "../../../lib/subscriptionStatus";
import EmptyState from "../../ui/EmptyState";
import MetricCard from "../../ui/MetricCard";
import SectionCard from "../../ui/SectionCard";
import StatusBadge from "../../ui/StatusBadge";

function money(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(Number(value || 0));
}

export default function SchoolBillingPanel({
  schoolId,
  compact = false,
}) {
  const [subscription, setSubscription] =
    useState(undefined);
  const [payments, setPayments] = useState([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    load();
  }, [schoolId]);

  async function load() {
    if (!schoolId) return;

    setError("");

    const [subscriptionResult, paymentsResult] =
      await Promise.all([
        supabase
          .from("subscriptions")
          .select("*")
          .eq("school_id", schoolId)
          .maybeSingle(),

        supabase
          .from("subscription_payments")
          .select("*")
          .eq("school_id", schoolId)
          .order("paid_on", {
            ascending: false,
          }),
      ]);

    setSubscription(
      subscriptionResult.data || null,
    );
    setPayments(paymentsResult.data || []);

    const loadError =
      subscriptionResult.error ||
      paymentsResult.error;

    if (loadError) {
      setError(loadError.message);
    }
  }

  async function beginPayment() {
    setBusy(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch(
        "/api/subscription-pay",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            schoolId,
            origin: window.location.origin,
          }),
        },
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error ||
            "The payment session could not be created.",
        );
      }

      const redirectUrl =
        result.redirect_url ||
        result.url ||
        result.checkout_url;

      if (redirectUrl) {
        window.location.href = redirectUrl;
        return;
      }

      setMessage(
        result.message ||
          "The payment request was created.",
      );
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : String(caught),
      );
    }

    setBusy(false);
  }

  async function verifyPayment() {
    setBusy(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch(
        "/api/subscription-pay/status",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            schoolId,
          }),
        },
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error ||
            "Payment status could not be checked.",
        );
      }

      setMessage(
        result.status === "paid"
          ? "Payment received. The subscription has been updated."
          : result.message ||
              "No completed payment was found yet.",
      );

      await load();
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : String(caught),
      );
    }

    setBusy(false);
  }

  const status = useMemo(
    () => getSubscriptionStatus(subscription),
    [subscription],
  );

  const paidPayments = payments.filter(
    (item) =>
      !item.status || item.status === "paid",
  );

  if (subscription === undefined) {
    return (
      <div className="card">
        Loading subscription...
      </div>
    );
  }

  return (
    <div
      className={
        compact
          ? "billing-stack billing-compact"
          : "billing-stack"
      }
    >
      <section className="billing-metric-grid">
        <MetricCard
          icon={CreditCard}
          value={money(
            subscription?.amount || 0,
          )}
          label="Subscription amount"
          note="Current billing amount"
        />

        <MetricCard
          icon={CalendarClock}
          value={
            subscription?.next_due ||
            "Not configured"
          }
          label="Next due date"
          note="Current subscription cycle"
        />

        <MetricCard
          icon={CheckCircle2}
          value={paidPayments.length}
          label="Recorded payments"
          note="Subscription payment history"
        />
      </section>

      <SectionCard
        title="Chalkboard subscription"
        description="Platform subscription billing is separate from learner fees and school finance."
        actions={
          <StatusBadge status={status.code}>
            {status.code.replaceAll("_", " ")}
          </StatusBadge>
        }
      >
        {!subscription?.amount ? (
          <p className="muted">
            The platform operator has not set a
            subscription amount yet.
          </p>
        ) : null}

        {status.due ? (
          <p className="muted">
            The current payment is due on{" "}
            <strong>{status.due}</strong>.
          </p>
        ) : null}

        <div className="billing-actions">
          <button
            onClick={beginPayment}
            disabled={
              busy || !subscription?.amount
            }
          >
            <ExternalLink size={16} />
            {busy
              ? "Opening..."
              : "Pay subscription"}
          </button>

          <button
            className="ghost"
            onClick={verifyPayment}
            disabled={busy}
          >
            <RefreshCw size={16} />
            Check payment status
          </button>
        </div>

        {message ? (
          <p className="success-message">
            {message}
          </p>
        ) : null}

        {error ? (
          <p className="error">{error}</p>
        ) : null}
      </SectionCard>

      {!compact ? (
        <SectionCard
          title="Payment history"
          description="Recorded subscription payments for this school."
        >
          {paidPayments.length ? (
            <div className="subscription-payment-list">
              {paidPayments.map((payment) => (
                <div
                  className="subscription-payment-row"
                  key={payment.id}
                >
                  <div className="document-icon">
                    <ReceiptText size={18} />
                  </div>
                  <div>
                    <strong>
                      {money(payment.amount)}
                    </strong>
                    <span>
                      {payment.paid_on ||
                        payment.created_at?.slice(
                          0,
                          10,
                        ) ||
                        "Date unavailable"}
                      {payment.method
                        ? ` · ${payment.method}`
                        : ""}
                    </span>
                  </div>
                  <StatusBadge
                    status={
                      payment.status || "paid"
                    }
                  />
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              title="No subscription payments"
              description="Completed platform subscription payments will appear here."
              icon={ReceiptText}
            />
          )}
        </SectionCard>
      ) : null}
    </div>
  );
}
