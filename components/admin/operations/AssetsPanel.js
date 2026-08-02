"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Boxes,
  CircleDollarSign,
  Plus,
  Trash2,
} from "lucide-react";

import { supabase } from "../../../lib/supabaseClient";
import EmptyState from "../../ui/EmptyState";
import MetricCard from "../../ui/MetricCard";
import SectionCard from "../../ui/SectionCard";

const EMPTY_FORM = {
  name: "",
  category: "",
  serial: "",
  value: "",
  acquired: "",
  location: "",
  condition: "good",
};

function money(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(Number(value || 0));
}

export default function AssetsPanel({ schoolId }) {
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
        .from("assets")
        .select("*")
        .eq("school_id", schoolId)
        .order("name");

    setRows(data || []);

    if (loadError) setError(loadError.message);
  }

  async function addAsset(event) {
    event.preventDefault();

    if (!form.name.trim()) {
      setError("Enter an asset name.");
      return;
    }

    setBusy(true);
    setError("");

    const { error: insertError } = await supabase
      .from("assets")
      .insert({
        school_id: schoolId,
        name: form.name.trim(),
        category:
          form.category.trim() || null,
        serial: form.serial.trim() || null,
        value: form.value
          ? Number(form.value)
          : null,
        acquired: form.acquired || null,
        location:
          form.location.trim() || null,
        condition: form.condition || null,
        status: "in_use",
      });

    if (insertError) {
      setError(insertError.message);
    } else {
      setForm(EMPTY_FORM);
      await load();
    }

    setBusy(false);
  }

  async function setStatus(item, status) {
    const { error: updateError } = await supabase
      .from("assets")
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
      .from("assets")
      .delete()
      .eq("id", item.id)
      .eq("school_id", schoolId);

    if (deleteError) {
      setError(deleteError.message);
    } else {
      await load();
    }
  }

  const activeValue = useMemo(
    () =>
      rows
        .filter(
          (item) =>
            (item.status || "in_use") ===
            "in_use",
        )
        .reduce(
          (sum, item) =>
            sum + Number(item.value || 0),
          0,
        ),
    [rows],
  );

  return (
    <div className="feature-stack">
      <section className="finance-metric-grid">
        <MetricCard
          icon={Boxes}
          value={rows.length}
          label="Assets"
          note="Registered assets"
        />

        <MetricCard
          icon={CircleDollarSign}
          value={money(activeValue)}
          label="Value in use"
          note="Active asset value"
        />
      </section>

      <SectionCard
        title="Add asset"
        description="Maintain the school's fixed and durable asset register."
      >
        <form
          className="operations-form"
          onSubmit={addAsset}
        >
          <div className="form-grid">
            {[
              ["name", "Asset name"],
              ["category", "Category"],
              ["serial", "Serial number"],
              ["value", "Value"],
              ["acquired", "Acquired date"],
              ["location", "Location"],
            ].map(([key, label]) => (
              <label key={key}>
                {label}
                <input
                  type={
                    key === "value"
                      ? "number"
                      : key === "acquired"
                        ? "date"
                        : "text"
                  }
                  step={
                    key === "value"
                      ? "0.01"
                      : undefined
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

            <label>
              Condition
              <select
                value={form.condition}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    condition:
                      event.target.value,
                  }))
                }
              >
                <option value="good">Good</option>
                <option value="fair">Fair</option>
                <option value="poor">Poor</option>
                <option value="damaged">
                  Damaged
                </option>
              </select>
            </label>
          </div>

          <div className="form-actions">
            <button type="submit" disabled={busy}>
              <Plus size={17} />
              Add asset
            </button>
          </div>
        </form>
      </SectionCard>

      <SectionCard
        title="Asset register"
        description={`${rows.length} asset${
          rows.length === 1 ? "" : "s"
        } recorded.`}
      >
        {rows.length ? (
          <table>
            <thead>
              <tr>
                <th>Asset</th>
                <th>Category</th>
                <th>Serial</th>
                <th className="r">Value</th>
                <th>Acquired</th>
                <th>Location</th>
                <th>Condition</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {rows.map((item) => (
                <tr key={item.id}>
                  <td className="strong">
                    {item.name}
                  </td>
                  <td>{item.category || ""}</td>
                  <td>{item.serial || ""}</td>
                  <td className="r">
                    {item.value == null
                      ? ""
                      : money(item.value)}
                  </td>
                  <td>{item.acquired || ""}</td>
                  <td>{item.location || ""}</td>
                  <td>{item.condition || ""}</td>
                  <td>
                    <select
                      className="compact-select"
                      value={
                        item.status || "in_use"
                      }
                      onChange={(event) =>
                        setStatus(
                          item,
                          event.target.value,
                        )
                      }
                    >
                      <option value="in_use">
                        In use
                      </option>
                      <option value="sold">
                        Sold
                      </option>
                      <option value="defunct">
                        Defunct
                      </option>
                      <option value="disposed">
                        Disposed
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
              ))}
            </tbody>
          </table>
        ) : (
          <EmptyState
            title="No assets registered"
            description="Fixed and durable assets will appear here."
            icon={Boxes}
          />
        )}

        {error ? <p className="error">{error}</p> : null}
      </SectionCard>
    </div>
  );
}
