"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Mail,
  Megaphone,
  MessageCircleMore,
  Phone,
  Plus,
  Send,
  Users,
} from "lucide-react";

import { supabase } from "../../../lib/supabaseClient";
import EmptyState from "../../ui/EmptyState";
import MetricCard from "../../ui/MetricCard";
import SectionCard from "../../ui/SectionCard";
import StatusBadge from "../../ui/StatusBadge";

const EMPTY_FORM = {
  title: "",
  body: "",
  audience: "all",
  priority: "normal",
  publish_at: "",
  email_enabled: true,
  sms_enabled: false,
  whatsapp_enabled: false,
};

export default function AnnouncementsPanel({
  schoolId,
  canPost = true,
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
        .from("announcements")
        .select("*")
        .eq("school_id", schoolId)
        .order("created_at", {
          ascending: false,
        });

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

  async function publish(event) {
    event.preventDefault();

    if (
      !form.title.trim() ||
      !form.body.trim()
    ) {
      setError(
        "Enter an announcement title and message.",
      );
      return;
    }

    setBusy(true);
    setError("");

    const scheduled =
      Boolean(form.publish_at);

    const { error: insertError } =
      await supabase
        .from("announcements")
        .insert({
          school_id: schoolId,
          title: form.title.trim(),
          body: form.body.trim(),
          audience: form.audience,
          priority: form.priority,
          publish_at:
            form.publish_at || null,
          status: scheduled
            ? "scheduled"
            : "published",
          delivery_channels: {
            email: form.email_enabled,
            sms: form.sms_enabled,
            whatsapp:
              form.whatsapp_enabled,
          },
        });

    if (insertError) {
      setError(insertError.message);
    } else {
      setForm(EMPTY_FORM);
      await load();
    }

    setBusy(false);
  }

  const counts = useMemo(() => {
    return rows.reduce(
      (summary, item) => {
        const status =
          item.status || "published";
        summary[status] =
          (summary[status] || 0) + 1;
        return summary;
      },
      {},
    );
  }, [rows]);

  return (
    <div className="feature-stack">
      <section className="communications-metric-grid">
        <MetricCard
          icon={Megaphone}
          value={rows.length}
          label="Announcements"
          note="All school announcements"
        />

        <MetricCard
          icon={Send}
          value={counts.published || 0}
          label="Published"
          note="Visible announcements"
        />

        <MetricCard
          icon={Mail}
          value={counts.scheduled || 0}
          label="Scheduled"
          note="Awaiting publication"
        />
      </section>

      {canPost ? (
        <SectionCard
          title="Create announcement"
          description="Publish within Chalkboard now and keep channel preferences ready for later email, SMS and WhatsApp integrations."
        >
          <form
            className="communications-form"
            onSubmit={publish}
          >
            <div className="form-grid">
              <label>
                Title
                <input
                  value={form.title}
                  onChange={(event) =>
                    update(
                      "title",
                      event.target.value,
                    )
                  }
                />
              </label>

              <label>
                Audience
                <select
                  value={form.audience}
                  onChange={(event) =>
                    update(
                      "audience",
                      event.target.value,
                    )
                  }
                >
                  <option value="all">
                    Whole school
                  </option>
                  <option value="staff">
                    Staff
                  </option>
                  <option value="teachers">
                    Teachers
                  </option>
                  <option value="learners">
                    Learners
                  </option>
                  <option value="parents">
                    Parents and guardians
                  </option>
                  <option value="board">
                    Governing board
                  </option>
                </select>
              </label>

              <label>
                Priority
                <select
                  value={form.priority}
                  onChange={(event) =>
                    update(
                      "priority",
                      event.target.value,
                    )
                  }
                >
                  <option value="normal">
                    Normal
                  </option>
                  <option value="important">
                    Important
                  </option>
                  <option value="urgent">
                    Urgent
                  </option>
                </select>
              </label>

              <label>
                Schedule publication
                <input
                  type="datetime-local"
                  value={form.publish_at}
                  onChange={(event) =>
                    update(
                      "publish_at",
                      event.target.value,
                    )
                  }
                />
              </label>

              <label className="form-span-2">
                Message
                <textarea
                  value={form.body}
                  onChange={(event) =>
                    update(
                      "body",
                      event.target.value,
                    )
                  }
                />
              </label>
            </div>

            <fieldset className="channel-fieldset">
              <legend>
                Delivery channels
              </legend>

              <label>
                <input
                  type="checkbox"
                  checked={form.email_enabled}
                  onChange={(event) =>
                    update(
                      "email_enabled",
                      event.target.checked,
                    )
                  }
                />
                <Mail size={16} />
                Email ready
              </label>

              <label>
                <input
                  type="checkbox"
                  checked={form.sms_enabled}
                  onChange={(event) =>
                    update(
                      "sms_enabled",
                      event.target.checked,
                    )
                  }
                />
                <Phone size={16} />
                SMS ready
              </label>

              <label>
                <input
                  type="checkbox"
                  checked={
                    form.whatsapp_enabled
                  }
                  onChange={(event) =>
                    update(
                      "whatsapp_enabled",
                      event.target.checked,
                    )
                  }
                />
                <MessageCircleMore size={16} />
                WhatsApp ready
              </label>
            </fieldset>

            {error ? (
              <p className="error">{error}</p>
            ) : null}

            <div className="form-actions">
              <button
                type="submit"
                disabled={busy}
              >
                <Plus size={17} />
                {busy
                  ? "Saving..."
                  : form.publish_at
                    ? "Schedule announcement"
                    : "Publish announcement"}
              </button>
            </div>
          </form>
        </SectionCard>
      ) : null}

      <SectionCard
        title="Announcement history"
        description="Announcements already published or scheduled for the school."
      >
        {rows.length ? (
          <div className="announcement-list">
            {rows.map((item) => {
              const channels =
                item.delivery_channels || {};

              return (
                <article
                  className="announcement-record"
                  key={item.id}
                >
                  <header>
                    <div>
                      <h3>{item.title}</h3>
                      <p>
                        {item.audience ||
                          "all"}
                        {" · "}
                        {item.priority ||
                          "normal"}
                      </p>
                    </div>

                    <StatusBadge
                      status={
                        item.status ||
                        "published"
                      }
                    />
                  </header>

                  <p className="announcement-body">
                    {item.body ||
                      item.message ||
                      ""}
                  </p>

                  <footer>
                    <span>
                      <Users size={14} />
                      {item.audience ||
                        "Whole school"}
                    </span>

                    {channels.email ? (
                      <span>
                        <Mail size={14} />
                        Email
                      </span>
                    ) : null}

                    {channels.sms ? (
                      <span>
                        <Phone size={14} />
                        SMS
                      </span>
                    ) : null}

                    {channels.whatsapp ? (
                      <span>
                        <MessageCircleMore
                          size={14}
                        />
                        WhatsApp
                      </span>
                    ) : null}
                  </footer>
                </article>
              );
            })}
          </div>
        ) : (
          <EmptyState
            title="No announcements yet"
            description="Published and scheduled announcements will appear here."
            icon={Megaphone}
          />
        )}
      </SectionCard>
    </div>
  );
}
