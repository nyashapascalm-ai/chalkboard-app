"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowDownCircle,
  ArrowUpCircle,
  Landmark,
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

export default function BankingPanel({ schoolId }) {
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState({
    transaction_date: today(),
    transaction_type: "deposit",
    description: "",
    amount: "",
    currency: "USD",
    reference: "",
    bank_name: "",
    account_name: "",
    account_number: "",
    notes: "",
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    load();
  }, [schoolId]);

  async function load() {
    const { data, error: loadError } = await supabase
      .from("bank_transactions")
      .select("*")
      .eq("school_id", schoolId)
      .order("transaction_date", {
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

  async function addTransaction(event) {
    event.preventDefault();

    if (!form.description.trim() || !form.amount) {
      setError("Enter a description and amount.");
      return;
    }

    setBusy(true);
    setError("");

    const { error: insertError } = await supabase
      .from("bank_transactions")
      .insert({
        school_id: schoolId,
        transaction_date: form.transaction_date,
        transaction_type: form.transaction_type,
        description: form.description.trim(),
        amount: Number(form.amount),
        currency: form.currency,
        reference: form.reference.trim() || null,
        bank_name: form.bank_name.trim() || null,
        account_name:
          form.account_name.trim() || null,
        account_number:
          form.account_number.trim() || null,
        notes: form.notes.trim() || null,
      });

    if (insertError) {
      setError(insertError.message);
    } else {
      setForm((current) => ({
        ...current,
        description: "",
        amount: "",
        reference: "",
        notes: "",
      }));
      await load();
    }

    setBusy(false);
  }

  const totals = useMemo(() => {
    const incoming = rows
      .filter((item) =>
        [
          "deposit",
          "credit",
          "cash_in",
          "transfer_in",
        ].includes(item.transaction_type),
      )
      .reduce(
        (sum, item) => sum + Number(item.amount || 0),
        0,
      );

    const outgoing = rows
      .filter((item) =>
        [
          "withdrawal",
          "debit",
          "cash_out",
          "transfer_out",
          "payment",
        ].includes(item.transaction_type),
      )
      .reduce(
        (sum, item) => sum + Number(item.amount || 0),
        0,
      );

    return {
      incoming,
      outgoing,
      balance: incoming - outgoing,
    };
  }, [rows]);

  return (
    <div className="feature-stack">
      <section className="finance-metric-grid">
        <MetricCard
          icon={ArrowDownCircle}
          value={money(totals.incoming)}
          label="Bank inflows"
          note="Deposits and credits"
        />

        <MetricCard
          icon={ArrowUpCircle}
          value={money(totals.outgoing)}
          label="Bank outflows"
          note="Withdrawals and payments"
        />

        <MetricCard
          icon={Scale}
          value={money(totals.balance)}
          label="Calculated balance"
          note="Inflows less outflows"
        />
      </section>

      <SectionCard
        title="Record bank transaction"
        description="Capture deposits, withdrawals, transfers and bank payments."
      >
        <form
          className="finance-form"
          onSubmit={addTransaction}
        >
          <div className="form-grid">
            <label>
              Transaction date
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
                <option value="deposit">
                  Deposit
                </option>
                <option value="withdrawal">
                  Withdrawal
                </option>
                <option value="transfer_in">
                  Transfer in
                </option>
                <option value="transfer_out">
                  Transfer out
                </option>
                <option value="payment">
                  Payment
                </option>
              </select>
            </label>

            <label>
              Bank name
              <input
                value={form.bank_name}
                onChange={(event) =>
                  update(
                    "bank_name",
                    event.target.value,
                  )
                }
              />
            </label>

            <label>
              Account name
              <input
                value={form.account_name}
                onChange={(event) =>
                  update(
                    "account_name",
                    event.target.value,
                  )
                }
              />
            </label>

            <label>
              Account number
              <input
                value={form.account_number}
                onChange={(event) =>
                  update(
                    "account_number",
                    event.target.value,
                  )
                }
              />
            </label>

            <label>
              Reference
              <input
                value={form.reference}
                onChange={(event) =>
                  update(
                    "reference",
                    event.target.value,
                  )
                }
              />
            </label>

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

            <label>
              Amount
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.amount}
                onChange={(event) =>
                  update(
                    "amount",
                    event.target.value,
                  )
                }
              />
            </label>

            <label className="form-span-2">
              Description
              <input
                value={form.description}
                onChange={(event) =>
                  update(
                    "description",
                    event.target.value,
                  )
                }
              />
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
                : "Record bank transaction"}
            </button>
          </div>
        </form>
      </SectionCard>

      <SectionCard
        title="Bank transaction register"
        description="The latest transactions recorded against school bank accounts."
      >
        {rows.length ? (
          <div className="finance-register">
            {rows.map((item) => (
              <article
                className="finance-row"
                key={item.id}
              >
                <div className="finance-row-icon">
                  <Landmark size={18} />
                </div>

                <div className="finance-row-copy">
                  <strong>{item.description}</strong>
                  <span>
                    {item.transaction_date} ·{" "}
                    {String(
                      item.transaction_type || "",
                    ).replaceAll("_", " ")}
                    {item.reference
                      ? ` · ${item.reference}`
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
            title="No bank transactions"
            description="Recorded deposits, withdrawals and bank payments will appear here."
            icon={Landmark}
          />
        )}
      </SectionCard>
    </div>
  );
}
