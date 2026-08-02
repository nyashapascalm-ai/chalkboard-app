"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Banknote,
  BriefcaseBusiness,
  Plus,
  Scale,
} from "lucide-react";

import { supabase } from "../../../lib/supabaseClient";
import EmptyState from "../../ui/EmptyState";
import MetricCard from "../../ui/MetricCard";
import SectionCard from "../../ui/SectionCard";

function money(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(Number(value || 0));
}

const EMPTY_CONTRACTOR = {
  contractor_name: "",
  company_name: "",
  service_type: "",
  phone: "",
  email: "",
  contract_reference: "",
  contract_start: "",
  contract_end: "",
  contract_value: "",
  payment_terms: "",
  notes: "",
};

function newPayment() {
  return {
    contractor_id: "",
    payment_date: new Date()
      .toISOString()
      .slice(0, 10),
    amount: "",
    payment_method: "bank",
    reference: "",
    description: "",
    approved_by: "",
  };
}

export default function ContractorsPanel({
  schoolId,
}) {
  const [contractors, setContractors] =
    useState([]);
  const [payments, setPayments] = useState([]);
  const [form, setForm] =
    useState(EMPTY_CONTRACTOR);
  const [payment, setPayment] =
    useState(newPayment());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    load();
  }, [schoolId]);

  async function load() {
    const [contractorResult, paymentResult] =
      await Promise.all([
        supabase
          .from("school_contractors")
          .select("*")
          .eq("school_id", schoolId)
          .order("contractor_name"),

        supabase
          .from("contractor_payments")
          .select("*")
          .eq("school_id", schoolId)
          .order("payment_date", {
            ascending: false,
          }),
      ]);

    setContractors(contractorResult.data || []);
    setPayments(paymentResult.data || []);

    const loadError =
      contractorResult.error ||
      paymentResult.error;

    if (loadError) setError(loadError.message);
  }

  async function addContractor(event) {
    event.preventDefault();

    if (
      !form.contractor_name.trim() ||
      !form.service_type.trim()
    ) {
      setError(
        "Enter the contractor name and service type.",
      );
      return;
    }

    setBusy(true);
    setError("");

    const { error: insertError } = await supabase
      .from("school_contractors")
      .insert({
        school_id: schoolId,
        ...form,
        contractor_name:
          form.contractor_name.trim(),
        service_type: form.service_type.trim(),
        company_name:
          form.company_name.trim() || null,
        phone: form.phone.trim() || null,
        email: form.email.trim() || null,
        contract_reference:
          form.contract_reference.trim() || null,
        contract_start:
          form.contract_start || null,
        contract_end: form.contract_end || null,
        contract_value: form.contract_value
          ? Number(form.contract_value)
          : null,
        payment_terms:
          form.payment_terms.trim() || null,
        notes: form.notes.trim() || null,
      });

    if (insertError) {
      setError(insertError.message);
    } else {
      setForm(EMPTY_CONTRACTOR);
      await load();
    }

    setBusy(false);
  }

  async function addPayment(event) {
    event.preventDefault();

    if (
      !payment.contractor_id ||
      !payment.amount
    ) {
      setError(
        "Select a contractor and enter the payment amount.",
      );
      return;
    }

    setBusy(true);
    setError("");

    const { error: insertError } = await supabase
      .from("contractor_payments")
      .insert({
        school_id: schoolId,
        contractor_id:
          payment.contractor_id,
        payment_date: payment.payment_date,
        amount: Number(payment.amount),
        payment_method:
          payment.payment_method,
        reference:
          payment.reference.trim() || null,
        description:
          payment.description.trim() || null,
        approved_by:
          payment.approved_by.trim() || null,
      });

    if (insertError) {
      setError(insertError.message);
    } else {
      setPayment(newPayment());
      await load();
    }

    setBusy(false);
  }

  const totalContracted = useMemo(
    () =>
      contractors.reduce(
        (sum, item) =>
          sum +
          Number(item.contract_value || 0),
        0,
      ),
    [contractors],
  );

  const totalPaid = useMemo(
    () =>
      payments.reduce(
        (sum, item) =>
          sum + Number(item.amount || 0),
        0,
      ),
    [payments],
  );

  return (
    <div className="feature-stack">
      <section className="finance-metric-grid">
        <MetricCard
          icon={BriefcaseBusiness}
          value={contractors.length}
          label="Contractors"
          note="Current contractor records"
        />

        <MetricCard
          icon={Banknote}
          value={money(totalPaid)}
          label="Contractor payments"
          note="Payments recorded"
        />

        <MetricCard
          icon={Scale}
          value={money(
            totalContracted - totalPaid,
          )}
          label="Contract balance"
          note="Contract value less payments"
        />
      </section>

      <SectionCard
        title="Add contractor"
        description="Register an individual or company contracted to provide services to the school."
      >
        <form
          className="operations-form"
          onSubmit={addContractor}
        >
          <div className="form-grid">
            {[
              [
                "contractor_name",
                "Contractor name",
              ],
              ["company_name", "Company name"],
              ["service_type", "Service type"],
              ["phone", "Phone"],
              ["email", "Email"],
              [
                "contract_reference",
                "Contract reference",
              ],
              [
                "contract_start",
                "Contract start",
              ],
              ["contract_end", "Contract end"],
              [
                "contract_value",
                "Contract value",
              ],
              [
                "payment_terms",
                "Payment terms",
              ],
            ].map(([key, label]) => (
              <label key={key}>
                {label}
                <input
                  type={
                    key.includes("date") ||
                    key.includes("start") ||
                    key.includes("end")
                      ? "date"
                      : key === "contract_value"
                        ? "number"
                        : key === "email"
                          ? "email"
                          : "text"
                  }
                  step={
                    key === "contract_value"
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

            <label className="form-span-2">
              Notes
              <textarea
                value={form.notes}
                onChange={(event) =>
                  setForm((current) => ({
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
              Add contractor
            </button>
          </div>
        </form>
      </SectionCard>

      <SectionCard
        title="Record contractor payment"
        description="Capture payments made against a contractor record."
      >
        <form
          className="operations-form"
          onSubmit={addPayment}
        >
          <div className="form-grid">
            <label>
              Contractor
              <select
                value={payment.contractor_id}
                onChange={(event) =>
                  setPayment((current) => ({
                    ...current,
                    contractor_id:
                      event.target.value,
                  }))
                }
              >
                <option value="">
                  Select contractor
                </option>
                {contractors.map((item) => (
                  <option
                    key={item.id}
                    value={item.id}
                  >
                    {item.contractor_name}
                  </option>
                ))}
              </select>
            </label>

            {[
              ["payment_date", "Payment date"],
              ["amount", "Amount"],
              ["reference", "Reference"],
              ["description", "Description"],
              ["approved_by", "Approved by"],
            ].map(([key, label]) => (
              <label key={key}>
                {label}
                <input
                  type={
                    key === "payment_date"
                      ? "date"
                      : key === "amount"
                        ? "number"
                        : "text"
                  }
                  step={
                    key === "amount"
                      ? "0.01"
                      : undefined
                  }
                  value={payment[key]}
                  onChange={(event) =>
                    setPayment((current) => ({
                      ...current,
                      [key]:
                        event.target.value,
                    }))
                  }
                />
              </label>
            ))}

            <label>
              Payment method
              <select
                value={payment.payment_method}
                onChange={(event) =>
                  setPayment((current) => ({
                    ...current,
                    payment_method:
                      event.target.value,
                  }))
                }
              >
                <option value="bank">Bank</option>
                <option value="cash">Cash</option>
                <option value="mobile_money">
                  Mobile money
                </option>
                <option value="card">Card</option>
              </select>
            </label>
          </div>

          <div className="form-actions">
            <button type="submit" disabled={busy}>
              <Plus size={17} />
              Record payment
            </button>
          </div>
        </form>
      </SectionCard>

      <SectionCard
        title="Contractors"
        description="Contract values, payments and outstanding balances."
      >
        {contractors.length ? (
          <div className="contractor-list">
            {contractors.map((item) => {
              const paid = payments
                .filter(
                  (paymentRow) =>
                    paymentRow.contractor_id ===
                    item.id,
                )
                .reduce(
                  (sum, paymentRow) =>
                    sum +
                    Number(
                      paymentRow.amount || 0,
                    ),
                  0,
                );

              const value =
                item.contract_value == null
                  ? null
                  : Number(item.contract_value);

              return (
                <article
                  className="contractor-record"
                  key={item.id}
                >
                  <header>
                    <div>
                      <h3>
                        {item.contractor_name}
                      </h3>
                      <p>
                        {item.company_name ||
                          "Independent contractor"}
                        {" · "}
                        {item.service_type}
                      </p>
                    </div>
                  </header>

                  <div className="contractor-finance">
                    <span>
                      Contract value
                      <strong>
                        {value == null
                          ? "Not set"
                          : money(value)}
                      </strong>
                    </span>
                    <span>
                      Paid
                      <strong>{money(paid)}</strong>
                    </span>
                    <span>
                      Balance
                      <strong>
                        {value == null
                          ? "Not available"
                          : money(value - paid)}
                      </strong>
                    </span>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <EmptyState
            title="No contractors"
            description="Contractor and payment records will appear here."
            icon={BriefcaseBusiness}
          />
        )}

        {error ? <p className="error">{error}</p> : null}
      </SectionCard>
    </div>
  );
}
