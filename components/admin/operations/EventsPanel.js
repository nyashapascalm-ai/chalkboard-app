"use client";

import { useEffect, useState } from "react";
import {
  CalendarDays,
  MapPin,
  Plus,
  Users,
} from "lucide-react";

import { supabase } from "../../../lib/supabaseClient";
import EmptyState from "../../ui/EmptyState";
import SectionCard from "../../ui/SectionCard";

function newEvent() {
  return {
    title: "",
    category: "school",
    start_date: new Date()
      .toISOString()
      .slice(0, 10),
    end_date: "",
    venue: "",
    audience: "",
    organiser: "",
    description: "",
  };
}

export default function EventsPanel({ schoolId }) {
  const [events, setEvents] = useState([]);
  const [form, setForm] = useState(newEvent());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    load();
  }, [schoolId]);

  async function load() {
    const { data, error: loadError } =
      await supabase
        .from("school_events")
        .select("*")
        .eq("school_id", schoolId)
        .order("start_date");

    setEvents(data || []);

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

  async function addEvent(event) {
    event.preventDefault();

    if (!form.title.trim() || !form.start_date) {
      setError("Enter an event title and date.");
      return;
    }

    setBusy(true);
    setError("");

    const { error: insertError } = await supabase
      .from("school_events")
      .insert({
        school_id: schoolId,
        title: form.title.trim(),
        category: form.category,
        start_date: form.start_date,
        end_date: form.end_date || null,
        venue: form.venue.trim() || null,
        audience: form.audience.trim() || null,
        organiser:
          form.organiser.trim() || null,
        description:
          form.description.trim() || null,
      });

    if (insertError) {
      setError(insertError.message);
    } else {
      setForm(newEvent());
      await load();
    }

    setBusy(false);
  }

  return (
    <div className="feature-stack">
      <SectionCard
        title="Add event"
        description="Maintain the school calendar for sports, meetings, examinations and community activity."
      >
        <form
          className="operations-form"
          onSubmit={addEvent}
        >
          <div className="form-grid">
            <label>
              Event title
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
              Category
              <select
                value={form.category}
                onChange={(event) =>
                  update(
                    "category",
                    event.target.value,
                  )
                }
              >
                <option value="school">
                  School
                </option>
                <option value="sports">
                  Sports
                </option>
                <option value="academic">
                  Academic
                </option>
                <option value="exam">
                  Examination
                </option>
                <option value="community">
                  Community
                </option>
                <option value="holiday">
                  Holiday
                </option>
              </select>
            </label>

            <label>
              Start date
              <input
                type="date"
                value={form.start_date}
                onChange={(event) =>
                  update(
                    "start_date",
                    event.target.value,
                  )
                }
              />
            </label>

            <label>
              End date
              <input
                type="date"
                value={form.end_date}
                onChange={(event) =>
                  update(
                    "end_date",
                    event.target.value,
                  )
                }
              />
            </label>

            <label>
              Venue
              <input
                value={form.venue}
                onChange={(event) =>
                  update(
                    "venue",
                    event.target.value,
                  )
                }
              />
            </label>

            <label>
              Audience
              <input
                value={form.audience}
                onChange={(event) =>
                  update(
                    "audience",
                    event.target.value,
                  )
                }
              />
            </label>

            <label className="form-span-2">
              Organiser
              <input
                value={form.organiser}
                onChange={(event) =>
                  update(
                    "organiser",
                    event.target.value,
                  )
                }
              />
            </label>

            <label className="form-span-2">
              Description
              <textarea
                value={form.description}
                onChange={(event) =>
                  update(
                    "description",
                    event.target.value,
                  )
                }
              />
            </label>
          </div>

          <div className="form-actions">
            <button type="submit" disabled={busy}>
              <Plus size={17} />
              Save event
            </button>
          </div>
        </form>
      </SectionCard>

      <SectionCard
        title="Events calendar"
        description={`${events.length} event${
          events.length === 1 ? "" : "s"
        } recorded.`}
      >
        {events.length ? (
          <div className="event-grid">
            {events.map((item) => (
              <article
                className="event-card"
                key={item.id}
              >
                <div className="event-date">
                  <CalendarDays size={18} />
                  <strong>{item.start_date}</strong>
                  {item.end_date ? (
                    <span>to {item.end_date}</span>
                  ) : null}
                </div>

                <h3>{item.title}</h3>
                <p>{item.description}</p>

                <div className="event-meta">
                  <span>
                    <MapPin size={14} />
                    {item.venue ||
                      "Venue not set"}
                  </span>
                  <span>
                    <Users size={14} />
                    {item.audience ||
                      "School audience"}
                  </span>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <EmptyState
            title="No events scheduled"
            description="New school calendar events will appear here."
            icon={CalendarDays}
          />
        )}

        {error ? <p className="error">{error}</p> : null}
      </SectionCard>
    </div>
  );
}
