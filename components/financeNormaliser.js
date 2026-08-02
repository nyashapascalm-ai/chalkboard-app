"use client";

export function normaliseFinanceEntries(rows = []) {
  return rows.map((row) => {
    const rawKind =
      row.type ??
      row.entry_type ??
      row.transaction_type ??
      row.direction ??
      row.kind ??
      row.category_type ??
      "";

    const kind = String(rawKind).toLowerCase();

    let normalizedType = "unknown";

    if (
      kind.includes("income") ||
      kind.includes("credit") ||
      kind.includes("receipt") ||
      kind.includes("revenue")
    ) {
      normalizedType = "income";
    }

    if (
      kind.includes("expense") ||
      kind.includes("debit") ||
      kind.includes("payment") ||
      kind.includes("cost")
    ) {
      normalizedType = "expense";
    }

    return {
      ...row,
      normalized_type: normalizedType,
      normalized_amount: Number(
        row.amount ??
        row.value ??
        row.total ??
        row.total_amount ??
        0
      ),
    };
  });
}

export function financeTotals(rows = []) {
  const normalized = normaliseFinanceEntries(rows);

  const income = normalized
    .filter((row) => row.normalized_type === "income")
    .reduce((sum, row) => sum + row.normalized_amount, 0);

  const expenses = normalized
    .filter((row) => row.normalized_type === "expense")
    .reduce((sum, row) => sum + row.normalized_amount, 0);

  return {
    income,
    expenses,
    balance: income - expenses,
  };
}
