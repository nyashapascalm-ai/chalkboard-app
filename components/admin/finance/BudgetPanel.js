"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ChartNoAxesCombined,
  Plus,
  Send,
  Trash2,
} from "lucide-react";

import { supabase } from "../../../lib/supabaseClient";
import EmptyState from "../../ui/EmptyState";
import MetricCard from "../../ui/MetricCard";
import SectionCard from "../../ui/SectionCard";
import StatusBadge from "../../ui/StatusBadge";

const INCOME_CATEGORIES = [
  "Fees and levies",
  "Grants and donations",
  "Fundraising",
  "Facility income",
  "Other income",
];

const EXPENSE_CATEGORIES = [
  "Staffing",
  "Teaching and learning",
  "Utilities",
  "Maintenance",
  "Administration",
  "Sports and activities",
  "Transport",
  "Technology",
  "Capital expenditure",
  "Finance costs",
  "Contingency",
  "Other expenses",
];

function money(value, currency = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(Number(value || 0));
}

export default function BudgetPanel({
  schoolId,
  settings,
}) {
  const currentYear = new Date().getFullYear();
  const [budgets, setBudgets] = useState([]);
  const [activeBudgetId, setActiveBudgetId] =
    useState("");
  const [lines, setLines] = useState([]);
  const [budgetForm, setBudgetForm] = useState({
    financial_year: currentYear,
    title: `${currentYear} Annual Budget`,
    currency: settings?.currency || "USD",
    start_date: `${currentYear}-01-01`,
    end_date: `${currentYear}-12-31`,
    projected_learner_count: 0,
    notes: "",
  });
  const [lineForm, setLineForm] = useState({
    line_type: "income",
    category: "Fees and levies",
    subcategory: "",
    source_type: "",
    description: "",
    quantity: 1,
    unit_rate: 0,
    periods: 1,
    assumptions: "",
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    load();
  }, [schoolId, activeBudgetId]);

  async function load() {
    const { data: budgetRows, error: budgetError } =
      await supabase
        .from("school_budgets")
        .select("*")
        .eq("school_id", schoolId)
        .order("financial_year", {
          ascending: false,
        })
        .order("version", {
          ascending: false,
        });

    setBudgets(budgetRows || []);

    const selectedId =
      activeBudgetId ||
      budgetRows?.[0]?.id ||
      "";

    if (!activeBudgetId && selectedId) {
      setActiveBudgetId(selectedId);
    }

    if (selectedId) {
      const {
        data: lineRows,
        error: lineError,
      } = await supabase
        .from("school_budget_lines")
        .select("*")
        .eq("budget_id", selectedId)
        .order("sort_order");

      setLines(lineRows || []);
      if (lineError) setError(lineError.message);
    } else {
      setLines([]);
    }

    if (budgetError) setError(budgetError.message);
  }

  const activeBudget = budgets.find(
    (item) => item.id === activeBudgetId,
  );

  async function createBudget(event) {
    event.preventDefault();

    if (
      !budgetForm.title.trim() ||
      !budgetForm.financial_year
    ) {
      setError("Enter a title and financial year.");
      return;
    }

    setBusy(true);
    setError("");

    const sameYear = budgets.filter(
      (item) =>
        Number(item.financial_year) ===
        Number(budgetForm.financial_year),
    );

    const version = sameYear.length
      ? Math.max(
          ...sameYear.map((item) =>
            Number(item.version || 1),
          ),
        ) + 1
      : 1;

    const { data, error: insertError } =
      await supabase
        .from("school_budgets")
        .insert({
          school_id: schoolId,
          financial_year: Number(
            budgetForm.financial_year,
          ),
          version,
          title: budgetForm.title.trim(),
          currency: budgetForm.currency,
          status: "draft",
          start_date:
            budgetForm.start_date || null,
          end_date: budgetForm.end_date || null,
          projected_learner_count: Number(
            budgetForm.projected_learner_count ||
              0,
          ),
          notes:
            budgetForm.notes.trim() || null,
        })
        .select()
        .single();

    if (insertError) {
      setError(insertError.message);
    } else {
      setActiveBudgetId(data.id);
      await load();
    }

    setBusy(false);
  }

  async function addLine(event) {
    event.preventDefault();

    if (
      !activeBudgetId ||
      !lineForm.description.trim()
    ) {
      setError(
        "Select a budget and enter a line description.",
      );
      return;
    }

    setBusy(true);
    setError("");

    const { error: insertError } =
      await supabase
        .from("school_budget_lines")
        .insert({
          budget_id: activeBudgetId,
          school_id: schoolId,
          line_type: lineForm.line_type,
          category: lineForm.category,
          subcategory:
            lineForm.subcategory.trim() || null,
          source_type:
            lineForm.source_type || null,
          description:
            lineForm.description.trim(),
          quantity: Number(
            lineForm.quantity || 0,
          ),
          unit_rate: Number(
            lineForm.unit_rate || 0,
          ),
          periods: Number(
            lineForm.periods || 0,
          ),
          assumptions:
            lineForm.assumptions.trim() || null,
          sort_order: lines.length + 1,
        });

    if (insertError) {
      setError(insertError.message);
    } else {
      setLineForm((current) => ({
        ...current,
        subcategory: "",
        description: "",
        unit_rate: 0,
        assumptions: "",
      }));
      await load();
    }

    setBusy(false);
  }

  async function removeLine(id) {
    const { error: removeError } =
      await supabase
        .from("school_budget_lines")
        .delete()
        .eq("id", id)
        .eq("school_id", schoolId);

    if (removeError) {
      setError(removeError.message);
    } else {
      await load();
    }
  }

  async function changeStatus(status) {
    if (!activeBudgetId) return;

    setBusy(true);
    setError("");

    const update = {
      status,
      updated_at: new Date().toISOString(),
    };

    if (status === "submitted") {
      update.submitted_at =
        new Date().toISOString();
    }

    const { error: updateError } =
      await supabase
        .from("school_budgets")
        .update(update)
        .eq("id", activeBudgetId)
        .eq("school_id", schoolId);

    if (!updateError) {
      await supabase
        .from("school_budget_approvals")
        .insert({
          budget_id: activeBudgetId,
          school_id: schoolId,
          action: status,
        });
    }

    if (updateError) {
      setError(updateError.message);
    } else {
      await load();
    }

    setBusy(false);
  }

  const totals = useMemo(() => {
    const income = lines
      .filter(
        (item) => item.line_type === "income",
      )
      .reduce(
        (sum, item) =>
          sum + Number(item.amount || 0),
        0,
      );

    const expenses = lines
      .filter(
        (item) => item.line_type === "expense",
      )
      .reduce(
        (sum, item) =>
          sum + Number(item.amount || 0),
        0,
      );

    return {
      income,
      expenses,
      surplus: income - expenses,
    };
  }, [lines]);

  const categories =
    lineForm.line_type === "income"
      ? INCOME_CATEGORIES
      : EXPENSE_CATEGORIES;

  return (
    <div className="feature-stack">
      <SectionCard
        title="Create annual budget"
        description="Create a new budget version for a financial year."
      >
        <form
          className="finance-form"
          onSubmit={createBudget}
        >
          <div className="form-grid">
            <label>
              Financial year
              <input
                type="number"
                value={
                  budgetForm.financial_year
                }
                onChange={(event) =>
                  setBudgetForm((current) => ({
                    ...current,
                    financial_year:
                      event.target.value,
                  }))
                }
              />
            </label>

            <label>
              Budget title
              <input
                value={budgetForm.title}
                onChange={(event) =>
                  setBudgetForm((current) => ({
                    ...current,
                    title: event.target.value,
                  }))
                }
              />
            </label>

            <label>
              Projected learners
              <input
                type="number"
                min="0"
                value={
                  budgetForm.projected_learner_count
                }
                onChange={(event) =>
                  setBudgetForm((current) => ({
                    ...current,
                    projected_learner_count:
                      event.target.value,
                  }))
                }
              />
            </label>

            <label>
              Currency
              <select
                value={budgetForm.currency}
                onChange={(event) =>
                  setBudgetForm((current) => ({
                    ...current,
                    currency:
                      event.target.value,
                  }))
                }
              >
                <option value="USD">USD</option>
                <option value="ZWG">ZWG</option>
                <option value="ZAR">ZAR</option>
              </select>
            </label>

            <label>
              Start date
              <input
                type="date"
                value={budgetForm.start_date}
                onChange={(event) =>
                  setBudgetForm((current) => ({
                    ...current,
                    start_date:
                      event.target.value,
                  }))
                }
              />
            </label>

            <label>
              End date
              <input
                type="date"
                value={budgetForm.end_date}
                onChange={(event) =>
                  setBudgetForm((current) => ({
                    ...current,
                    end_date:
                      event.target.value,
                  }))
                }
              />
            </label>

            <label className="form-span-2">
              Assumptions and notes
              <textarea
                value={budgetForm.notes}
                onChange={(event) =>
                  setBudgetForm((current) => ({
                    ...current,
                    notes: event.target.value,
                  }))
                }
              />
            </label>
          </div>

          <div className="form-actions">
            <button type="submit" disabled={busy}>
              <Plus size={17} />
              Create budget version
            </button>
          </div>
        </form>
      </SectionCard>

      {budgets.length ? (
        <SectionCard
          title="Budget version"
          description="Select the budget version to review and update."
        >
          <select
            value={activeBudgetId}
            onChange={(event) =>
              setActiveBudgetId(event.target.value)
            }
          >
            {budgets.map((item) => (
              <option
                key={item.id}
                value={item.id}
              >
                {item.financial_year} - Version{" "}
                {item.version} - {item.title} -{" "}
                {item.status}
              </option>
            ))}
          </select>
        </SectionCard>
      ) : null}

      {activeBudget ? (
        <>
          <section className="finance-metric-grid">
            <MetricCard
              icon={ChartNoAxesCombined}
              value={money(
                totals.income,
                activeBudget.currency,
              )}
              label="Projected income"
              note="All income budget lines"
            />

            <MetricCard
              icon={ChartNoAxesCombined}
              value={money(
                totals.expenses,
                activeBudget.currency,
              )}
              label="Planned expenditure"
              note="All expense budget lines"
            />

            <MetricCard
              icon={ChartNoAxesCombined}
              value={money(
                totals.surplus,
                activeBudget.currency,
              )}
              label="Projected surplus"
              note="Income less expenditure"
            />
          </section>

          <SectionCard
            title={activeBudget.title}
            description={`FY ${activeBudget.financial_year} - Version ${activeBudget.version}`}
            actions={
              <>
                <StatusBadge
                  status={activeBudget.status}
                />
                {activeBudget.status ===
                "draft" ? (
                  <button
                    type="button"
                    onClick={() =>
                      changeStatus("submitted")
                    }
                    disabled={busy}
                  >
                    <Send size={16} />
                    Submit budget
                  </button>
                ) : null}
              </>
            }
          >
            <form
              className="finance-form"
              onSubmit={addLine}
            >
              <div className="form-grid">
                <label>
                  Line type
                  <select
                    value={lineForm.line_type}
                    onChange={(event) =>
                      setLineForm((current) => ({
                        ...current,
                        line_type:
                          event.target.value,
                        category:
                          event.target.value ===
                          "income"
                            ? INCOME_CATEGORIES[0]
                            : EXPENSE_CATEGORIES[0],
                      }))
                    }
                  >
                    <option value="income">
                      Income
                    </option>
                    <option value="expense">
                      Expense
                    </option>
                  </select>
                </label>

                <label>
                  Category
                  <select
                    value={lineForm.category}
                    onChange={(event) =>
                      setLineForm((current) => ({
                        ...current,
                        category:
                          event.target.value,
                      }))
                    }
                  >
                    {categories.map((item) => (
                      <option
                        key={item}
                        value={item}
                      >
                        {item}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  Subcategory
                  <input
                    value={lineForm.subcategory}
                    onChange={(event) =>
                      setLineForm((current) => ({
                        ...current,
                        subcategory:
                          event.target.value,
                      }))
                    }
                  />
                </label>

                <label>
                  Description
                  <input
                    value={lineForm.description}
                    onChange={(event) =>
                      setLineForm((current) => ({
                        ...current,
                        description:
                          event.target.value,
                      }))
                    }
                  />
                </label>

                <label>
                  Quantity
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={lineForm.quantity}
                    onChange={(event) =>
                      setLineForm((current) => ({
                        ...current,
                        quantity:
                          event.target.value,
                      }))
                    }
                  />
                </label>

                <label>
                  Unit rate
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={lineForm.unit_rate}
                    onChange={(event) =>
                      setLineForm((current) => ({
                        ...current,
                        unit_rate:
                          event.target.value,
                      }))
                    }
                  />
                </label>

                <label>
                  Periods
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={lineForm.periods}
                    onChange={(event) =>
                      setLineForm((current) => ({
                        ...current,
                        periods:
                          event.target.value,
                      }))
                    }
                  />
                </label>

                <label>
                  Calculated amount
                  <input
                    readOnly
                    value={money(
                      Number(
                        lineForm.quantity || 0,
                      ) *
                        Number(
                          lineForm.unit_rate || 0,
                        ) *
                        Number(
                          lineForm.periods || 0,
                        ),
                      activeBudget.currency,
                    )}
                  />
                </label>

                <label className="form-span-2">
                  Assumptions
                  <textarea
                    value={lineForm.assumptions}
                    onChange={(event) =>
                      setLineForm((current) => ({
                        ...current,
                        assumptions:
                          event.target.value,
                      }))
                    }
                  />
                </label>
              </div>

              <div className="form-actions">
                <button
                  type="submit"
                  disabled={
                    busy ||
                    !["draft", "rejected"].includes(
                      activeBudget.status,
                    )
                  }
                >
                  <Plus size={17} />
                  Add budget line
                </button>
              </div>
            </form>
          </SectionCard>

          <SectionCard
            title="Budget detail"
            description={`${lines.length} budget line${
              lines.length === 1 ? "" : "s"
            } recorded.`}
          >
            {lines.length ? (
              <table>
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Category</th>
                    <th>Description</th>
                    <th>Calculation</th>
                    <th className="r">
                      Amount
                    </th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {lines.map((item) => (
                    <tr key={item.id}>
                      <td>{item.line_type}</td>
                      <td>
                        {item.category}
                        {item.subcategory
                          ? ` - ${item.subcategory}`
                          : ""}
                      </td>
                      <td>{item.description}</td>
                      <td>
                        {item.quantity} x{" "}
                        {item.unit_rate} x{" "}
                        {item.periods}
                      </td>
                      <td className="r">
                        {money(
                          item.amount,
                          activeBudget.currency,
                        )}
                      </td>
                      <td className="r">
                        {["draft", "rejected"].includes(
                          activeBudget.status,
                        ) ? (
                          <button
                            className="ghost compact-action"
                            onClick={() =>
                              removeLine(item.id)
                            }
                          >
                            <Trash2 size={15} />
                            Remove
                          </button>
                        ) : null}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <EmptyState
                title="No budget lines"
                description="Add projected income and planned expenditure to build this budget."
                icon={ChartNoAxesCombined}
              />
            )}
          </SectionCard>
        </>
      ) : (
        <EmptyState
          title="No annual budget"
          description="Create a budget version to begin."
          icon={ChartNoAxesCombined}
        />
      )}

      {error ? <p className="error">{error}</p> : null}
    </div>
  );
}
