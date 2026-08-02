"use client";

import { supabase } from "../../../lib/supabaseClient";

export async function safeCount(
  table,
  filters = [],
) {
  try {
    let query = supabase
      .from(table)
      .select("id", {
        count: "exact",
        head: true,
      });

    filters.forEach(([column, value]) => {
      query = query.eq(column, value);
    });

    const { count, error } = await query;

    return {
      value: count || 0,
      error: error?.message || "",
    };
  } catch (caught) {
    return {
      value: 0,
      error:
        caught instanceof Error
          ? caught.message
          : String(caught),
    };
  }
}

export async function safeRows(
  table,
  columns = "*",
  filters = [],
  order = null,
) {
  try {
    let query = supabase
      .from(table)
      .select(columns);

    filters.forEach(([column, value]) => {
      query = query.eq(column, value);
    });

    if (order) {
      query = query.order(order.column, {
        ascending:
          order.ascending !== false,
      });
    }

    const { data, error } = await query;

    return {
      rows: data || [],
      error: error?.message || "",
    };
  } catch (caught) {
    return {
      rows: [],
      error:
        caught instanceof Error
          ? caught.message
          : String(caught),
    };
  }
}

export function money(value, currency = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(Number(value || 0));
}

export function csvCell(value) {
  const text = String(value ?? "");
  return `"${text.replaceAll('"', '""')}"`;
}

export function downloadCsv(
  filename,
  headers,
  rows,
) {
  const content = [
    headers,
    ...rows,
  ]
    .map((row) =>
      row.map(csvCell).join(","),
    )
    .join("\r\n");

  const blob = new Blob([content], {
    type: "text/csv;charset=utf-8",
  });

  const url = URL.createObjectURL(blob);
  const anchor =
    document.createElement("a");

  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();

  URL.revokeObjectURL(url);
}
