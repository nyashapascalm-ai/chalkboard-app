"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowDownCircle,
  ArrowUpCircle,
  Coins,
  Plus,
  Scale,
} from "lucide-react";

import { supabase } from "../../../lib/supabaseClient";
import EmptyState from "../../ui/EmptyState";
import MetricCard from "../../ui/MetricCard";
import SectionCard from "../../ui/SectionCard";

function today() {
  return new Date().toISOString().slice(0, 10);
}

function money(value, currency = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(Number(value || 0));
}

export default function PettyCashPanel({ schoolId }) {
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState({
    transaction_date: today(),
    transaction_type: "expense",
    category: "",
    description: "",
    amount: "",
    currency: "USD",
    reference: "",
    payee: "",
    requested_by: "",
    approved_by: "",
    receipt_reference: "",
    notes: "",
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    load();
  }, [schoolId]);

  async function load() {
    const { data, error: loadError } = await supabase
      .from("petty_cash_transactions")
      .select("*")
      .eq("school_id", schoolId)
      .order("transaction_date", {
        ascending: false,
      })
      .order("created_at", {
        ascending: false,
      });

    setRows(data || []);

    if (loadError) {
      setError(loadError.message);
    }
  }

  function update(key, value) {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  }

  async function saveTransaction(event) {
    event.preventDefault();

    if (!form.description.trim() || !form.amount) {
      setError("Enter a description and amount.");
      return;
    }

    setBusy(true);
    setError("");

    const { error: insertError } = await supabase
      .from("petty_cash_transactions")
      .insert({
        school_id: schoolId,
        ...form,
        amount: Number(form.amount),
        category: form.category.trim() || null,
        reference: form.reference.trim() || null,
        payee: form.payee.trim() || null,
        requested_by:
          form.requested_by.trim() || null,
        approved_by:
          form.approved_by.trim() || null,
        receipt_reference:
          form.receipt_reference.trim() || null,
        notes: form.notes.trim() || null,
      });

    if (insertError) {
      setError(insertError.message);
    } else {
      setForm((current) => ({
        ...current,
        description: "",
        amount: "",
        category: "",
        reference: "",
        payee: "",
        requested_by: "",
        approved_by: "",
        receipt_reference: "",
        notes: "",
      }));
      await load();
    }

    setBusy(false);
  }

  const totals = useMemo(() => {
    const cashIn = rows
      .filter((item) =>
        [
          "opening_balance",
          "cash_in",
          "reimbursement",
          "adjustment",
        ].includes(item.transaction_type),
      )
      .reduce(
        (sum, item) => sum + Number(item.amount || 0),
        0,
      );

    const cashOut = rows
      .filter(
        (item) => item.transaction_type === "expense",
      )
      .reduce(
        (sum, item) => sum + Number(item.amount || 0),
        0,
      );

    return {
      cashIn,
      cashOut,
      balance: cashIn - cashOut,
    };
  }, [rows]);

  return (
    <div className="feature-stack">
      <section className="finance-metric-grid">
        <MetricCard
          icon={ArrowDownCircle}
          value={money(totals.cashIn)}
          label="Cash in"
          note="Float and reimbursements"
        />

        <MetricCard
          icon={ArrowUpCircle}
          value={money(totals.cashOut)}
          label="Cash out"
          note="Petty cash expenditure"
        />

        <MetricCard
          icon={Scale}
          value={money(totals.balance)}
          label="Petty cash balance"
          note="Cash in less cash out"
        />
      </section>

      <SectionCard
        title="Record petty cash transaction"
        description="Capture float, reimbursements, adjustments and small cash expenses."
      >
        <form
          className="finance-form"
          onSubmit={saveTransaction}
        >
          <div className="form-grid">
            <label>
              Date
              <input
                type="date"
                value={form.transaction_date}
                onChange={(event) =>
                  update(
                    "transaction_date",
                    event.target.value,
                  )
                }
              />
            </label>

            <label>
              Transaction type
              <select
                value={form.transaction_type}
                onChange={(event) =>
                  update(
                    "transaction_type",
                    event.target.value,
                  )
                }
              >
                <option value="opening_balance">
                  Opening balance
                </option>
                <option value="cash_in">
                  Cash in
                </option>
                <option value="expense">
                  Expense
                </option>
                <option value="reimbursement">
                  Reimbursement
                </option>
                <option value="adjustment">
                  Adjustment
                </option>
              </select>
            </label>

            {[
              ["category", "Category"],
              ["description", "Description"],
              ["amount", "Amount"],
              ["reference", "Reference"],
              ["payee", "Payee"],
              ["requested_by", "Requested by"],
              ["approved_by", "Approved by"],
              [
                "receipt_reference",
                "Receipt reference",
              ],
            ].map(([key, label]) => (
              <label key={key}>
                {label}
                <input
                  type={
                    key === "amount"
                      ? "number"
                      : "text"
                  }
                  step={
                    key === "amount"
                      ? "0.01"
                      : undefined
                  }
                  value={form[key]}
                  onChange={(event) =>
                    update(key, event.target.value)
                  }
                />
              </label>
            ))}

            <label>
              Currency
              <select
                value={form.currency}
                onChange={(event) =>
                  update(
                    "currency",
                    event.target.value,
                  )
                }
              >
                <option value="USD">USD</option>
                <option value="ZWG">ZWG</option>
                <option value="ZAR">ZAR</option>
              </select>
            </label>

            <label className="form-span-2">
              Notes
              <textarea
                value={form.notes}
                onChange={(event) =>
                  update("notes", event.target.value)
                }
              />
            </label>
          </div>

          {error ? <p className="error">{error}</p> : null}

          <div className="form-actions">
            <button type="submit" disabled={busy}>
              <Plus size={17} />
              {busy
                ? "Saving..."
                : "Record petty cash"}
            </button>
          </div>
        </form>
      </SectionCard>

      <SectionCard
        title="Petty cash register"
        description="Recent movements in the school's petty cash fund."
      >
        {rows.length ? (
          <div className="finance-register">
            {rows.map((item) => (
              <article
                className="finance-row"
                key={item.id}
              >
                <div className="finance-row-icon">
                  <Coins size={18} />
                </div>

                <div className="finance-row-copy">
                  <strong>{item.description}</strong>
                  <span>
                    {item.transaction_date} ·{" "}
                    {String(
                      item.transaction_type || "",
                    ).replaceAll("_", " ")}
                    {item.payee
                      ? ` · ${item.payee}`
                      : ""}
                  </span>
                </div>

                <strong className="finance-amount">
                  {money(item.amount, item.currency)}
                </strong>
              </article>
            ))}
          </div>
        ) : (
          <EmptyState
            title="No petty cash transactions"
            description="Petty cash movements will appear here."
            icon={Coins}
          />
        )}
      </SectionCard>
    </div>
  );
}
