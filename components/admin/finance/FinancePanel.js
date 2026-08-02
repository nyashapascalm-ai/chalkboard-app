"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowDownCircle,
  ArrowUpCircle,
  Plus,
  Scale,
  Trash2,
  Wallet,
} from "lucide-react";

import { supabase } from "../../../lib/supabaseClient";
import EmptyState from "../../ui/EmptyState";
import MetricCard from "../../ui/MetricCard";
import SectionCard from "../../ui/SectionCard";

function today() {
  return new Date().toISOString().slice(0, 10);
}

function money(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(Number(value || 0));
}

export default function FinancePanel({ schoolId }) {
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState({
    date: today(),
    kind: "income",
    category: "",
    description: "",
    amount: "",
  });
  const [busy, setBusy] = useState(false);
  const [removingId, setRemovingId] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    load();
  }, [schoolId]);

  async function load() {
    if (!schoolId) return;

    const { data, error: loadError } = await supabase
      .from("finance_entries")
      .select("*")
      .eq("school_id", schoolId)
      .order("date", { ascending: false });

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

  async function addEntry(event) {
    event.preventDefault();

    if (!form.amount || Number(form.amount) <= 0) {
      setError("Enter an amount greater than zero.");
      return;
    }

    setBusy(true);
    setError("");

    const { error: insertError } = await supabase
      .from("finance_entries")
      .insert({
        school_id: schoolId,
        date: form.date,
        kind: form.kind,
        category: form.category.trim() || null,
        description: form.description.trim() || null,
        amount: Number(form.amount),
      });

    if (insertError) {
      setError(insertError.message);
    } else {
      setForm((current) => ({
        ...current,
        category: "",
        description: "",
        amount: "",
      }));
      await load();
    }

    setBusy(false);
  }

  async function removeEntry(item) {
    if (
      !confirm(
        `Remove this ${item.kind || "finance"} entry?`,
      )
    ) {
      return;
    }

    setRemovingId(item.id);
    setError("");

    const { error: removeError } = await supabase
      .from("finance_entries")
      .delete()
      .eq("id", item.id)
      .eq("school_id", schoolId);

    if (removeError) {
      setError(removeError.message);
    } else {
      await load();
    }

    setRemovingId("");
  }

  const totals = useMemo(() => {
    const income = rows
      .filter((item) => item.kind === "income")
      .reduce(
        (sum, item) => sum + Number(item.amount || 0),
        0,
      );

    const expenses = rows
      .filter((item) => item.kind === "expense")
      .reduce(
        (sum, item) => sum + Number(item.amount || 0),
        0,
      );

    return {
      income,
      expenses,
      balance: income - expenses,
    };
  }, [rows]);

  return (
    <div className="feature-stack">
      <section className="finance-metric-grid">
        <MetricCard
          icon={ArrowDownCircle}
          value={money(totals.income)}
          label="Income"
          note="Recorded income entries"
        />

        <MetricCard
          icon={ArrowUpCircle}
          value={money(totals.expenses)}
          label="Expenses"
          note="Recorded expenditure"
        />

        <MetricCard
          icon={Scale}
          value={money(totals.balance)}
          label="Operating balance"
          note="Income less expenses"
        />
      </section>

      <SectionCard
        title="Record income or expense"
        description="Maintain the school's general income and expenditure register."
      >
        <form
          className="finance-form"
          onSubmit={addEntry}
        >
          <div className="form-grid">
            <label>
              Date
              <input
                type="date"
                value={form.date}
                onChange={(event) =>
                  update("date", event.target.value)
                }
              />
            </label>

            <label>
              Entry type
              <select
                value={form.kind}
                onChange={(event) =>
                  update("kind", event.target.value)
                }
              >
                <option value="income">Income</option>
                <option value="expense">
                  Expense
                </option>
              </select>
            </label>

            <label>
              Category
              <input
                value={form.category}
                onChange={(event) =>
                  update(
                    "category",
                    event.target.value,
                  )
                }
                placeholder="For example: Fees or utilities"
              />
            </label>

            <label>
              Amount
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.amount}
                onChange={(event) =>
                  update("amount", event.target.value)
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
          </div>

          {error ? <p className="error">{error}</p> : null}

          <div className="form-actions">
            <button type="submit" disabled={busy}>
              <Plus size={17} />
              {busy ? "Saving..." : "Record entry"}
            </button>
          </div>
        </form>
      </SectionCard>

      <SectionCard
        title="Finance register"
        description={`${rows.length} general finance entr${
          rows.length === 1 ? "y" : "ies"
        } recorded.`}
      >
        {rows.length ? (
          <div className="finance-register">
            {rows.map((item) => (
              <article
                className="finance-row"
                key={item.id}
              >
                <div
                  className={
                    item.kind === "income"
                      ? "finance-row-icon income"
                      : "finance-row-icon expense"
                  }
                >
                  {item.kind === "income" ? (
                    <ArrowDownCircle size={18} />
                  ) : (
                    <ArrowUpCircle size={18} />
                  )}
                </div>

                <div className="finance-row-copy">
                  <strong>
                    {item.description ||
                      item.category ||
                      "Finance entry"}
                  </strong>
                  <span>
                    {item.date}
                    {item.category
                      ? ` · ${item.category}`
                      : ""}
                  </span>
                </div>

                <strong
                  className={
                    item.kind === "income"
                      ? "finance-amount income"
                      : "finance-amount expense"
                  }
                >
                  {item.kind === "income" ? "+" : "-"}
                  {money(item.amount)}
                </strong>

                <button
                  className="ghost compact-action"
                  disabled={removingId === item.id}
                  onClick={() => removeEntry(item)}
                >
                  <Trash2 size={15} />
                  Remove
                </button>
              </article>
            ))}
          </div>
        ) : (
          <EmptyState
            title="No finance entries"
            description="Income and expenditure entries will appear here."
            icon={Wallet}
          />
        )}
      </SectionCard>
    </div>
  );
}
