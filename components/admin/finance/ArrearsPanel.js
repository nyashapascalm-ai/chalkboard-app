"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  BadgeDollarSign,
  CheckCircle2,
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

export default function ArrearsPanel({
  schoolId,
  classes,
}) {
  const [term, setTerm] = useState(TERMS[0]);
  const [classFilter, setClassFilter] =
    useState("all");
  const [students, setStudents] = useState([]);
  const [items, setItems] = useState([]);
  const [payments, setPayments] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    load();
  }, [schoolId, term]);

  async function load() {
    const [studentResult, feeResult, paymentResult] =
      await Promise.all([
        supabase
          .from("students")
          .select("id,full_name,class_id")
          .eq("school_id", schoolId),

        supabase
          .from("fee_items")
          .select("class_id,amount")
          .eq("school_id", schoolId)
          .eq("term", term),

        supabase
          .from("fee_payments")
          .select("student_id,amount")
          .eq("school_id", schoolId)
          .eq("term", term),
      ]);

    setStudents(studentResult.data || []);
    setItems(feeResult.data || []);
    setPayments(paymentResult.data || []);

    const loadError =
      studentResult.error ||
      feeResult.error ||
      paymentResult.error;

    if (loadError) setError(loadError.message);
  }

  const rows = useMemo(() => {
    const dueByClass = {};
    const paidByStudent = {};

    items.forEach((item) => {
      dueByClass[item.class_id] =
        (dueByClass[item.class_id] || 0) +
        Number(item.amount || 0);
    });

    payments.forEach((item) => {
      paidByStudent[item.student_id] =
        (paidByStudent[item.student_id] || 0) +
        Number(item.amount || 0);
    });

    return students
      .map((student) => {
        const due =
          dueByClass[student.class_id] || 0;
        const paid =
          paidByStudent[student.id] || 0;

        return {
          ...student,
          due,
          paid,
          balance: due - paid,
          class_name:
            classes.find(
              (item) =>
                item.id === student.class_id,
            )?.name || "Not assigned",
        };
      })
      .filter(
        (item) =>
          item.balance > 0 &&
          (classFilter === "all" ||
            item.class_id === classFilter),
      )
      .sort(
        (first, second) =>
          second.balance - first.balance,
      );
  }, [
    students,
    items,
    payments,
    classes,
    classFilter,
  ]);

  const totalOwed = rows.reduce(
    (sum, row) => sum + row.balance,
    0,
  );

  return (
    <div className="feature-stack">
      <section className="finance-metric-grid">
        <MetricCard
          icon={AlertTriangle}
          value={rows.length}
          label="Learners owing"
          note="Selected filters"
        />

        <MetricCard
          icon={BadgeDollarSign}
          value={money(totalOwed)}
          label="Total arrears"
          note="Outstanding fee balance"
        />

        <MetricCard
          icon={CheckCircle2}
          value={
            students.length - rows.length
          }
          label="No outstanding balance"
          note="Learners outside arrears list"
        />
      </section>

      <SectionCard
        title="Arrears filters"
        description="Review outstanding balances by term and class."
      >
        <div className="form-grid">
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

          <label>
            Class
            <select
              value={classFilter}
              onChange={(event) =>
                setClassFilter(event.target.value)
              }
            >
              <option value="all">
                All classes
              </option>
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
        </div>
      </SectionCard>

      <SectionCard
        title="Fee arrears"
        description={`${rows.length} learner${
          rows.length === 1 ? "" : "s"
        } with an outstanding balance.`}
      >
        {rows.length ? (
          <table>
            <thead>
              <tr>
                <th>Learner</th>
                <th>Class</th>
                <th className="r">Due</th>
                <th className="r">Paid</th>
                <th className="r">
                  Balance
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td className="strong">
                    {row.full_name}
                  </td>
                  <td>{row.class_name}</td>
                  <td className="r">
                    {money(row.due)}
                  </td>
                  <td className="r">
                    {money(row.paid)}
                  </td>
                  <td className="r arrears-amount">
                    {money(row.balance)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <EmptyState
            title="No arrears"
            description="Everyone is paid up for the selected term and class."
            icon={CheckCircle2}
          />
        )}

        {error ? <p className="error">{error}</p> : null}
      </SectionCard>
    </div>
  );
}
