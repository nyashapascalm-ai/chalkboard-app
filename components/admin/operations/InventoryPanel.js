"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Minus,
  Package,
  Plus,
  Trash2,
} from "lucide-react";

import { supabase } from "../../../lib/supabaseClient";
import EmptyState from "../../ui/EmptyState";
import MetricCard from "../../ui/MetricCard";
import SectionCard from "../../ui/SectionCard";
import StatusBadge from "../../ui/StatusBadge";

const EMPTY_FORM = {
  name: "",
  category: "",
  quantity: "",
  unit: "",
  reorder_level: "",
};

export default function InventoryPanel({
  schoolId,
}) {
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    load();
  }, [schoolId]);

  async function load() {
    const { data, error: loadError } =
      await supabase
        .from("inventory")
        .select("*")
        .eq("school_id", schoolId)
        .order("name");

    setRows(data || []);

    if (loadError) setError(loadError.message);
  }

  async function addItem(event) {
    event.preventDefault();

    if (!form.name.trim()) {
      setError("Enter an inventory item name.");
      return;
    }

    setBusy(true);
    setError("");

    const { error: insertError } = await supabase
      .from("inventory")
      .insert({
        school_id: schoolId,
        name: form.name.trim(),
        category:
          form.category.trim() || null,
        quantity: Number(form.quantity || 0),
        unit: form.unit.trim() || null,
        reorder_level: form.reorder_level
          ? Number(form.reorder_level)
          : null,
        status: "active",
      });

    if (insertError) {
      setError(insertError.message);
    } else {
      setForm(EMPTY_FORM);
      await load();
    }

    setBusy(false);
  }

  async function adjust(item, change) {
    const quantity = Math.max(
      0,
      Number(item.quantity || 0) + change,
    );

    const { error: updateError } = await supabase
      .from("inventory")
      .update({ quantity })
      .eq("id", item.id)
      .eq("school_id", schoolId);

    if (updateError) {
      setError(updateError.message);
    } else {
      await load();
    }
  }

  async function setStatus(item, status) {
    const { error: updateError } = await supabase
      .from("inventory")
      .update({ status })
      .eq("id", item.id)
      .eq("school_id", schoolId);

    if (updateError) {
      setError(updateError.message);
    } else {
      await load();
    }
  }

  async function remove(item) {
    if (!confirm(`Remove ${item.name}?`)) return;

    const { error: deleteError } = await supabase
      .from("inventory")
      .delete()
      .eq("id", item.id)
      .eq("school_id", schoolId);

    if (deleteError) {
      setError(deleteError.message);
    } else {
      await load();
    }
  }

  const lowStock = useMemo(
    () =>
      rows.filter(
        (item) =>
          item.status === "active" &&
          item.reorder_level != null &&
          Number(item.quantity || 0) <=
            Number(item.reorder_level),
      ).length,
    [rows],
  );

  return (
    <div className="feature-stack">
      <section className="finance-metric-grid">
        <MetricCard
          icon={Package}
          value={rows.length}
          label="Inventory records"
          note="Tracked stock items"
        />
        <MetricCard
          icon={AlertTriangle}
          value={lowStock}
          label="Low stock"
          note="At or below reorder level"
        />
      </section>

      <SectionCard
        title="Add inventory item"
        description="Track consumables, supplies and other quantity-based stock."
      >
        <form
          className="operations-form"
          onSubmit={addItem}
        >
          <div className="form-grid">
            {[
              ["name", "Item name"],
              ["category", "Category"],
              ["quantity", "Quantity"],
              ["unit", "Unit"],
              [
                "reorder_level",
                "Reorder level",
              ],
            ].map(([key, label]) => (
              <label key={key}>
                {label}
                <input
                  type={
                    ["quantity", "reorder_level"].includes(
                      key,
                    )
                      ? "number"
                      : "text"
                  }
                  value={form[key]}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      [key]:
                        event.target.value,
                    }))
                  }
                />
              </label>
            ))}
          </div>

          <div className="form-actions">
            <button type="submit" disabled={busy}>
              <Plus size={17} />
              Add item
            </button>
          </div>
        </form>
      </SectionCard>

      <SectionCard
        title="Inventory register"
        description={`${rows.length} item${
          rows.length === 1 ? "" : "s"
        } tracked.`}
      >
        {rows.length ? (
          <table>
            <thead>
              <tr>
                <th>Item</th>
                <th>Category</th>
                <th className="r">Quantity</th>
                <th>Unit</th>
                <th>Adjust</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {rows.map((item) => {
                const low =
                  item.reorder_level != null &&
                  Number(item.quantity || 0) <=
                    Number(item.reorder_level);

                return (
                  <tr key={item.id}>
                    <td className="strong">
                      {item.name}
                      {low ? (
                        <span className="low-stock-label">
                          low
                        </span>
                      ) : null}
                    </td>
                    <td>{item.category || ""}</td>
                    <td className="r">
                      {item.quantity}
                    </td>
                    <td>{item.unit || ""}</td>
                    <td>
                      <div className="quantity-actions">
                        <button
                          className="ghost compact-action"
                          onClick={() =>
                            adjust(item, -1)
                          }
                        >
                          <Minus size={14} />
                        </button>
                        <button
                          className="ghost compact-action"
                          onClick={() =>
                            adjust(item, 1)
                          }
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                    </td>
                    <td>
                      <select
                        className="compact-select"
                        value={
                          item.status || "active"
                        }
                        onChange={(event) =>
                          setStatus(
                            item,
                            event.target.value,
                          )
                        }
                      >
                        <option value="active">
                          Active
                        </option>
                        <option value="discontinued">
                          Discontinued
                        </option>
                        <option value="written_off">
                          Written off
                        </option>
                      </select>
                    </td>
                    <td>
                      <button
                        className="ghost compact-action"
                        onClick={() => remove(item)}
                      >
                        <Trash2 size={14} />
                        Remove
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <EmptyState
            title="No inventory records"
            description="Stock and supply records will appear here."
            icon={Package}
          />
        )}

        {error ? <p className="error">{error}</p> : null}
      </SectionCard>
    </div>
  );
}
