"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BadgeDollarSign,
  Banknote,
  CheckCircle2,
  Plus,
  ReceiptText,
} from "lucide-react";

import { supabase } from "../../../lib/supabaseClient";
import EmptyState from "../../ui/EmptyState";
import MetricCard from "../../ui/MetricCard";
import SectionCard from "../../ui/SectionCard";

const TERMS = [
  "Term 1 2026",
  "Term 2 2026",
  "Term 3 2026",
];

function money(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(Number(value || 0));
}

export default function FeesPanel({
  schoolId,
  classes,
}) {
  const [term, setTerm] = useState(TERMS[0]);
  const [classId, setClassId] = useState("");
  const [items, setItems] = useState([]);
  const [students, setStudents] = useState([]);
  const [payments, setPayments] = useState([]);
  const [feeForm, setFeeForm] = useState({
    description: "",
    amount: "",
  });
  const [paymentForm, setPaymentForm] = useState({
    student_id: "",
    amount: "",
    reference: "",
    payment_method: "cash",
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!classId && classes.length) {
      setClassId(classes[0].id);
    }
  }, [classes, classId]);

  useEffect(() => {
    load();
  }, [schoolId, classId, term]);

  async function load() {
    if (!schoolId || !classId) return;

    const [feeResult, studentResult, paymentResult] =
      await Promise.all([
        supabase
          .from("fee_items")
          .select("*")
          .eq("school_id", schoolId)
          .eq("class_id", classId)
          .eq("term", term)
          .order("created_at"),

        supabase
          .from("students")
          .select("id,full_name,class_id")
          .eq("school_id", schoolId)
          .eq("class_id", classId)
          .order("full_name"),

        supabase
          .from("fee_payments")
          .select("*")
          .eq("school_id", schoolId)
          .eq("term", term)
          .order("created_at", {
            ascending: false,
          }),
      ]);

    setItems(feeResult.data || []);
    setStudents(studentResult.data || []);
    setPayments(paymentResult.data || []);

    const loadError =
      feeResult.error ||
      studentResult.error ||
      paymentResult.error;

    if (loadError) setError(loadError.message);
  }

  async function addFeeItem(event) {
    event.preventDefault();

    if (
      !feeForm.description.trim() ||
      !feeForm.amount
    ) {
      setError("Enter the fee description and amount.");
      return;
    }

    setBusy(true);
    setError("");

    const { error: insertError } = await supabase
      .from("fee_items")
      .insert({
        school_id: schoolId,
        class_id: classId,
        term,
        description: feeForm.description.trim(),
        amount: Number(feeForm.amount),
      });

    if (insertError) {
      setError(insertError.message);
    } else {
      setFeeForm({
        description: "",
        amount: "",
      });
      await load();
    }

    setBusy(false);
  }

  async function recordPayment(event) {
    event.preventDefault();

    if (
      !paymentForm.student_id ||
      !paymentForm.amount
    ) {
      setError("Select a learner and enter the payment amount.");
      return;
    }

    setBusy(true);
    setError("");

    const { error: insertError } = await supabase
      .from("fee_payments")
      .insert({
        school_id: schoolId,
        student_id: paymentForm.student_id,
        term,
        amount: Number(paymentForm.amount),
        reference:
          paymentForm.reference.trim() || null,
        payment_method:
          paymentForm.payment_method,
      });

    if (insertError) {
      setError(insertError.message);
    } else {
      setPaymentForm({
        student_id: "",
        amount: "",
        reference: "",
        payment_method: "cash",
      });
      await load();
    }

    setBusy(false);
  }

  const totalDue = useMemo(
    () =>
      items.reduce(
        (sum, item) =>
          sum + Number(item.amount || 0),
        0,
      ) * students.length,
    [items, students],
  );

  const totalPaid = useMemo(
    () =>
      payments
        .filter((item) =>
          students.some(
            (student) =>
              student.id === item.student_id,
          ),
        )
        .reduce(
          (sum, item) =>
            sum + Number(item.amount || 0),
          0,
        ),
    [payments, students],
  );

  if (!classes.length) {
    return (
      <EmptyState
        title="No classes configured"
        description="Create classes before setting school fees."
        icon={BadgeDollarSign}
      />
    );
  }

  return (
    <div className="feature-stack">
      <section className="finance-metric-grid">
        <MetricCard
          icon={BadgeDollarSign}
          value={money(totalDue)}
          label="Expected fees"
          note="Selected class and term"
        />

        <MetricCard
          icon={Banknote}
          value={money(totalPaid)}
          label="Collected"
          note="Payments recorded"
        />

        <MetricCard
          icon={ReceiptText}
          value={money(totalDue - totalPaid)}
          label="Outstanding"
          note="Expected less collected"
        />
      </section>

      <SectionCard
        title="Fee context"
        description="Choose the class and term being managed."
      >
        <div className="form-grid">
          <label>
            Class
            <select
              value={classId}
              onChange={(event) =>
                setClassId(event.target.value)
              }
            >
              {classes.map((item) => (
                <option
                  key={item.id}
                  value={item.id}
                >
                  {item.name}
                </option>
              ))}
            </select>
          </label>

          <label>
            Term
            <select
              value={term}
              onChange={(event) =>
                setTerm(event.target.value)
              }
            >
              {TERMS.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>
        </div>
      </SectionCard>

      <SectionCard
        title="Set class fees"
        description="Add fees and levies applicable to every learner in the selected class."
      >
        <form
          className="finance-form"
          onSubmit={addFeeItem}
        >
          <div className="form-grid">
            <label>
              Fee description
              <input
                value={feeForm.description}
                onChange={(event) =>
                  setFeeForm((current) => ({
                    ...current,
                    description: event.target.value,
                  }))
                }
                placeholder="For example: Tuition fee"
              />
            </label>

            <label>
              Amount
              <input
                type="number"
                min="0"
                step="0.01"
                value={feeForm.amount}
                onChange={(event) =>
                  setFeeForm((current) => ({
                    ...current,
                    amount: event.target.value,
                  }))
                }
              />
            </label>
          </div>

          <div className="form-actions">
            <button type="submit" disabled={busy}>
              <Plus size={17} />
              Add fee item
            </button>
          </div>
        </form>

        {items.length ? (
          <div className="fee-item-list">
            {items.map((item) => (
              <div
                className="fee-item-row"
                key={item.id}
              >
                <span>
                  {item.description ||
                    item.name ||
                    "Fee item"}
                </span>
                <strong>{money(item.amount)}</strong>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            title="No fee items"
            description="Add the first fee or levy for this class and term."
            icon={BadgeDollarSign}
          />
        )}
      </SectionCard>

      <SectionCard
        title="Record fee payment"
        description="Capture a payment received from a learner."
      >
        <form
          className="finance-form"
          onSubmit={recordPayment}
        >
          <div className="form-grid">
            <label>
              Learner
              <select
                value={paymentForm.student_id}
                onChange={(event) =>
                  setPaymentForm((current) => ({
                    ...current,
                    student_id: event.target.value,
                  }))
                }
              >
                <option value="">
                  Select learner
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
              Amount
              <input
                type="number"
                min="0"
                step="0.01"
                value={paymentForm.amount}
                onChange={(event) =>
                  setPaymentForm((current) => ({
                    ...current,
                    amount: event.target.value,
                  }))
                }
              />
            </label>

            <label>
              Payment method
              <select
                value={
                  paymentForm.payment_method
                }
                onChange={(event) =>
                  setPaymentForm((current) => ({
                    ...current,
                    payment_method:
                      event.target.value,
                  }))
                }
              >
                <option value="cash">Cash</option>
                <option value="bank">
                  Bank transfer
                </option>
                <option value="mobile_money">
                  Mobile money
                </option>
                <option value="card">Card</option>
              </select>
            </label>

            <label>
              Reference
              <input
                value={paymentForm.reference}
                onChange={(event) =>
                  setPaymentForm((current) => ({
                    ...current,
                    reference: event.target.value,
                  }))
                }
              />
            </label>
          </div>

          {error ? <p className="error">{error}</p> : null}

          <div className="form-actions">
            <button type="submit" disabled={busy}>
              <CheckCircle2 size={17} />
              Record payment
            </button>
          </div>
        </form>
      </SectionCard>
    </div>
  );
}
