"use client";

import { useEffect, useMemo, useState } from "react";
import {
  FileDown,
  FileText,
  Plus,
  ReceiptText,
} from "lucide-react";

import { supabase } from "../../../lib/supabaseClient";
import EmptyState from "../../ui/EmptyState";
import SectionCard from "../../ui/SectionCard";
import StatusBadge from "../../ui/StatusBadge";

function today() {
  return new Date().toISOString().slice(0, 10);
}

function money(value, currency = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(Number(value || 0));
}

export default function FinanceDocumentsPanel({
  schoolId,
  school,
  settings,
}) {
  const [tab, setTab] = useState("invoices");
  const [students, setStudents] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [receipts, setReceipts] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [invoice, setInvoice] = useState({
    student_id: "",
    invoice_number: "",
    invoice_date: today(),
    due_date: "",
    issued_to: "",
    email: "",
    phone: "",
    description: "",
    amount: "",
    currency: settings?.currency || "USD",
    notes: "",
  });
  const [receipt, setReceipt] = useState({
    student_id: "",
    invoice_id: "",
    receipt_number: "",
    receipt_date: today(),
    received_from: "",
    email: "",
    phone: "",
    amount: "",
    currency: settings?.currency || "USD",
    payment_method: "cash",
    payment_reference: "",
    description: "",
    notes: "",
  });

  useEffect(() => {
    load();
  }, [schoolId]);

  async function load() {
    const [studentResult, invoiceResult, receiptResult] =
      await Promise.all([
        supabase
          .from("students")
          .select("id,full_name")
          .eq("school_id", schoolId)
          .order("full_name"),

        supabase
          .from("school_invoices")
          .select("*")
          .eq("school_id", schoolId)
          .order("invoice_date", {
            ascending: false,
          }),

        supabase
          .from("school_receipts")
          .select("*")
          .eq("school_id", schoolId)
          .order("receipt_date", {
            ascending: false,
          }),
      ]);

    setStudents(studentResult.data || []);
    setInvoices(invoiceResult.data || []);
    setReceipts(receiptResult.data || []);

    const loadError =
      studentResult.error ||
      invoiceResult.error ||
      receiptResult.error;

    if (loadError) setError(loadError.message);
  }

  function nextNumber(prefix, rows) {
    return `${prefix}-${new Date().getFullYear()}-${String(
      rows.length + 1,
    ).padStart(4, "0")}`;
  }

  function selectStudent(id, kind) {
    const student = students.find(
      (item) => item.id === id,
    );

    if (kind === "invoice") {
      setInvoice((current) => ({
        ...current,
        student_id: id,
        issued_to: student?.full_name || "",
      }));
    } else {
      setReceipt((current) => ({
        ...current,
        student_id: id,
        received_from:
          student?.full_name || "",
      }));
    }
  }

  async function createInvoice(event) {
    event.preventDefault();

    if (
      !invoice.issued_to.trim() ||
      !invoice.amount
    ) {
      setError(
        "Enter the recipient and invoice amount.",
      );
      return;
    }

    setBusy(true);
    setError("");

    const amount = Number(invoice.amount);
    const number =
      invoice.invoice_number ||
      nextNumber("INV", invoices);

    const { error: insertError } = await supabase
      .from("school_invoices")
      .insert({
        school_id: schoolId,
        student_id:
          invoice.student_id || null,
        invoice_number: number,
        invoice_date: invoice.invoice_date,
        due_date: invoice.due_date || null,
        issued_to: invoice.issued_to.trim(),
        email: invoice.email.trim() || null,
        phone: invoice.phone.trim() || null,
        description:
          invoice.description.trim() || null,
        line_items: [
          {
            description:
              invoice.description.trim() ||
              "School charges",
            quantity: 1,
            unit_price: amount,
            amount,
          },
        ],
        subtotal: amount,
        total: amount,
        amount_paid: 0,
        balance: amount,
        currency: invoice.currency,
        status: "issued",
        notes: invoice.notes.trim() || null,
      });

    if (insertError) {
      setError(insertError.message);
    } else {
      setInvoice((current) => ({
        ...current,
        student_id: "",
        invoice_number: "",
        issued_to: "",
        email: "",
        phone: "",
        description: "",
        amount: "",
        due_date: "",
        notes: "",
      }));
      await load();
    }

    setBusy(false);
  }

  async function createReceipt(event) {
    event.preventDefault();

    if (
      !receipt.received_from.trim() ||
      !receipt.amount
    ) {
      setError(
        "Enter who paid and the receipt amount.",
      );
      return;
    }

    setBusy(true);
    setError("");

    const amount = Number(receipt.amount);
    const number =
      receipt.receipt_number ||
      nextNumber("RCT", receipts);

    const { error: insertError } = await supabase
      .from("school_receipts")
      .insert({
        school_id: schoolId,
        student_id:
          receipt.student_id || null,
        invoice_id:
          receipt.invoice_id || null,
        receipt_number: number,
        receipt_date: receipt.receipt_date,
        received_from:
          receipt.received_from.trim(),
        email: receipt.email.trim() || null,
        phone: receipt.phone.trim() || null,
        amount,
        currency: receipt.currency,
        payment_method:
          receipt.payment_method,
        payment_reference:
          receipt.payment_reference.trim() ||
          null,
        description:
          receipt.description.trim() || null,
        notes: receipt.notes.trim() || null,
      });

    if (!insertError && receipt.invoice_id) {
      const linked = invoices.find(
        (item) =>
          item.id === receipt.invoice_id,
      );

      if (linked) {
        const paid =
          Number(linked.amount_paid || 0) +
          amount;
        const total = Number(linked.total || 0);

        await supabase
          .from("school_invoices")
          .update({
            amount_paid: paid,
            balance: Math.max(
              total - paid,
              0,
            ),
            status:
              paid >= total
                ? "paid"
                : "part_paid",
          })
          .eq("id", linked.id)
          .eq("school_id", schoolId);
      }
    }

    if (insertError) {
      setError(insertError.message);
    } else {
      setReceipt((current) => ({
        ...current,
        student_id: "",
        invoice_id: "",
        receipt_number: "",
        received_from: "",
        email: "",
        phone: "",
        amount: "",
        payment_reference: "",
        description: "",
        notes: "",
      }));
      await load();
    }

    setBusy(false);
  }

  function printDocument(type, row) {
    const invoiceMode = type === "invoice";
    const number = invoiceMode
      ? row.invoice_number
      : row.receipt_number;
    const date = invoiceMode
      ? row.invoice_date
      : row.receipt_date;
    const person = invoiceMode
      ? row.issued_to
      : row.received_from;
    const amount = invoiceMode
      ? row.total
      : row.amount;

    const popup = window.open("", "_blank");
    if (!popup) {
      alert("Allow pop-ups to print this document.");
      return;
    }

    popup.document.write(`
      <html>
        <head>
          <title>${number}</title>
          <style>
            body{font-family:Arial,sans-serif;padding:38px;color:#182230}
            header{display:flex;justify-content:space-between;border-bottom:2px solid #1E5EF7;padding-bottom:18px}
            h1{margin:0;color:#061E50}
            table{width:100%;border-collapse:collapse;margin-top:24px}
            th,td{padding:11px;border-bottom:1px solid #ddd;text-align:left}
            .total{margin-top:22px;font-size:22px;font-weight:700}
          </style>
        </head>
        <body>
          <header>
            <div>
              <h1>${school?.name || "School"}</h1>
              <div>${settings?.address || ""}</div>
            </div>
            <div>
              <strong>${invoiceMode ? "INVOICE" : "RECEIPT"}</strong><br/>
              ${number}<br/>
              ${date}
            </div>
          </header>
          <p><strong>${invoiceMode ? "Issued to" : "Received from"}:</strong> ${person}</p>
          <table>
            <tr><th>Description</th><th>Amount</th></tr>
            <tr><td>${row.description || "School charges"}</td><td>${money(amount, row.currency)}</td></tr>
          </table>
          <div class="total">${money(amount, row.currency)}</div>
        </body>
      </html>
    `);

    popup.document.close();
    popup.focus();
    setTimeout(() => popup.print(), 250);
  }

  const openInvoices = useMemo(
    () =>
      invoices.filter(
        (item) =>
          !["paid", "void"].includes(
            item.status,
          ),
      ),
    [invoices],
  );

  return (
    <div className="feature-stack">
      <nav className="feature-tabs">
        <button
          type="button"
          className={
            tab === "invoices" ? "active" : ""
          }
          onClick={() => setTab("invoices")}
        >
          Invoices
        </button>

        <button
          type="button"
          className={
            tab === "receipts" ? "active" : ""
          }
          onClick={() => setTab("receipts")}
        >
          Receipts
        </button>
      </nav>

      {tab === "invoices" ? (
        <>
          <SectionCard
            title="Create invoice"
            description="Select a learner or enter the recipient manually."
          >
            <form
              className="finance-form"
              onSubmit={createInvoice}
            >
              <div className="form-grid">
                <label>
                  Learner
                  <select
                    value={invoice.student_id}
                    onChange={(event) =>
                      selectStudent(
                        event.target.value,
                        "invoice",
                      )
                    }
                  >
                    <option value="">
                      Manual recipient
                    </option>
                    {students.map((item) => (
                      <option
                        key={item.id}
                        value={item.id}
                      >
                        {item.full_name}
                      </option>
                    ))}
                  </select>
                </label>

                {[
                  ["invoice_number", "Invoice number"],
                  ["issued_to", "Issued to"],
                  ["email", "Email"],
                  ["phone", "Phone"],
                  ["description", "Description"],
                  ["amount", "Amount"],
                ].map(([key, label]) => (
                  <label key={key}>
                    {label}
                    <input
                      type={
                        key === "amount"
                          ? "number"
                          : key === "email"
                            ? "email"
                            : "text"
                      }
                      value={invoice[key]}
                      onChange={(event) =>
                        setInvoice((current) => ({
                          ...current,
                          [key]:
                            event.target.value,
                        }))
                      }
                    />
                  </label>
                ))}

                <label>
                  Invoice date
                  <input
                    type="date"
                    value={invoice.invoice_date}
                    onChange={(event) =>
                      setInvoice((current) => ({
                        ...current,
                        invoice_date:
                          event.target.value,
                      }))
                    }
                  />
                </label>

                <label>
                  Due date
                  <input
                    type="date"
                    value={invoice.due_date}
                    onChange={(event) =>
                      setInvoice((current) => ({
                        ...current,
                        due_date:
                          event.target.value,
                      }))
                    }
                  />
                </label>
              </div>

              <div className="form-actions">
                <button
                  type="submit"
                  disabled={busy}
                >
                  <Plus size={17} />
                  Issue invoice
                </button>
              </div>
            </form>
          </SectionCard>

          <SectionCard
            title="Invoices"
            description={`${invoices.length} invoice${
              invoices.length === 1
                ? ""
                : "s"
            } recorded.`}
          >
            {invoices.length ? (
              <div className="document-list">
                {invoices.map((item) => (
                  <article
                    className="document-row"
                    key={item.id}
                  >
                    <div className="document-icon">
                      <FileText size={18} />
                    </div>
                    <div>
                      <strong>
                        {item.invoice_number}
                      </strong>
                      <span>
                        {item.issued_to} ·{" "}
                        {item.invoice_date}
                      </span>
                    </div>
                    <StatusBadge
                      status={item.status}
                    />
                    <strong>
                      {money(
                        item.total,
                        item.currency,
                      )}
                    </strong>
                    <button
                      className="ghost compact-action"
                      onClick={() =>
                        printDocument(
                          "invoice",
                          item,
                        )
                      }
                    >
                      <FileDown size={15} />
                      Print / PDF
                    </button>
                  </article>
                ))}
              </div>
            ) : (
              <EmptyState
                title="No invoices"
                description="Issued invoices will appear here."
                icon={FileText}
              />
            )}
          </SectionCard>
        </>
      ) : (
        <>
          <SectionCard
            title="Create receipt"
            description="Record a payment and optionally link it to an open invoice."
          >
            <form
              className="finance-form"
              onSubmit={createReceipt}
            >
              <div className="form-grid">
                <label>
                  Learner
                  <select
                    value={receipt.student_id}
                    onChange={(event) =>
                      selectStudent(
                        event.target.value,
                        "receipt",
                      )
                    }
                  >
                    <option value="">
                      Manual payer
                    </option>
                    {students.map((item) => (
                      <option
                        key={item.id}
                        value={item.id}
                      >
                        {item.full_name}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  Linked invoice
                  <select
                    value={receipt.invoice_id}
                    onChange={(event) =>
                      setReceipt((current) => ({
                        ...current,
                        invoice_id:
                          event.target.value,
                      }))
                    }
                  >
                    <option value="">
                      No linked invoice
                    </option>
                    {openInvoices.map((item) => (
                      <option
                        key={item.id}
                        value={item.id}
                      >
                        {item.invoice_number} -{" "}
                        {item.issued_to}
                      </option>
                    ))}
                  </select>
                </label>

                {[
                  ["receipt_number", "Receipt number"],
                  ["received_from", "Received from"],
                  ["email", "Email"],
                  ["phone", "Phone"],
                  ["amount", "Amount"],
                  [
                    "payment_reference",
                    "Payment reference",
                  ],
                  ["description", "Description"],
                ].map(([key, label]) => (
                  <label key={key}>
                    {label}
                    <input
                      type={
                        key === "amount"
                          ? "number"
                          : key === "email"
                            ? "email"
                            : "text"
                      }
                      value={receipt[key]}
                      onChange={(event) =>
                        setReceipt((current) => ({
                          ...current,
                          [key]:
                            event.target.value,
                        }))
                      }
                    />
                  </label>
                ))}

                <label>
                  Receipt date
                  <input
                    type="date"
                    value={receipt.receipt_date}
                    onChange={(event) =>
                      setReceipt((current) => ({
                        ...current,
                        receipt_date:
                          event.target.value,
                      }))
                    }
                  />
                </label>

                <label>
                  Payment method
                  <select
                    value={
                      receipt.payment_method
                    }
                    onChange={(event) =>
                      setReceipt((current) => ({
                        ...current,
                        payment_method:
                          event.target.value,
                      }))
                    }
                  >
                    <option value="cash">
                      Cash
                    </option>
                    <option value="bank">
                      Bank transfer
                    </option>
                    <option value="mobile_money">
                      Mobile money
                    </option>
                    <option value="card">
                      Card
                    </option>
                  </select>
                </label>
              </div>

              <div className="form-actions">
                <button
                  type="submit"
                  disabled={busy}
                >
                  <Plus size={17} />
                  Issue receipt
                </button>
              </div>
            </form>
          </SectionCard>

          <SectionCard
            title="Receipts"
            description={`${receipts.length} receipt${
              receipts.length === 1
                ? ""
                : "s"
            } recorded.`}
          >
            {receipts.length ? (
              <div className="document-list">
                {receipts.map((item) => (
                  <article
                    className="document-row"
                    key={item.id}
                  >
                    <div className="document-icon">
                      <ReceiptText size={18} />
                    </div>
                    <div>
                      <strong>
                        {item.receipt_number}
                      </strong>
                      <span>
                        {item.received_from} ·{" "}
                        {item.receipt_date}
                      </span>
                    </div>
                    <span>
                      {item.payment_method}
                    </span>
                    <strong>
                      {money(
                        item.amount,
                        item.currency,
                      )}
                    </strong>
                    <button
                      className="ghost compact-action"
                      onClick={() =>
                        printDocument(
                          "receipt",
                          item,
                        )
                      }
                    >
                      <FileDown size={15} />
                      Print / PDF
                    </button>
                  </article>
                ))}
              </div>
            ) : (
              <EmptyState
                title="No receipts"
                description="Issued receipts will appear here."
                icon={ReceiptText}
              />
            )}
          </SectionCard>
        </>
      )}

      {error ? <p className="error">{error}</p> : null}
    </div>
  );
}
