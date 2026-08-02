"use client";

import { useEffect, useState } from "react";
import {
  CheckCircle2,
  Gavel,
  Plus,
  Users,
} from "lucide-react";

import { supabase } from "../../../lib/supabaseClient";
import EmptyState from "../../ui/EmptyState";
import SectionCard from "../../ui/SectionCard";
import StatusBadge from "../../ui/StatusBadge";

function initialMeeting() {
  return {
    title: "",
    meeting_type: "management",
    meeting_date: new Date()
      .toISOString()
      .slice(0, 10),
    start_time: "",
    venue: "",
    chairperson: "",
    secretary: "",
    attendees: "",
    agenda: "",
    minutes: "",
  };
}

const EMPTY_RESOLUTION = {
  resolution_number: "",
  resolution: "",
  responsible_person: "",
  due_date: "",
};

export default function MeetingsPanel({ schoolId }) {
  const [meetings, setMeetings] = useState([]);
  const [resolutions, setResolutions] = useState([]);
  const [selectedMeeting, setSelectedMeeting] =
    useState("");
  const [form, setForm] = useState(initialMeeting());
  const [resolution, setResolution] =
    useState(EMPTY_RESOLUTION);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    load();
  }, [schoolId]);

  async function load() {
    const [meetingResult, resolutionResult] =
      await Promise.all([
        supabase
          .from("school_meetings")
          .select("*")
          .eq("school_id", schoolId)
          .order("meeting_date", {
            ascending: false,
          }),

        supabase
          .from("meeting_resolutions")
          .select("*")
          .eq("school_id", schoolId)
          .order("created_at", {
            ascending: false,
          }),
      ]);

    setMeetings(meetingResult.data || []);
    setResolutions(resolutionResult.data || []);

    const loadError =
      meetingResult.error ||
      resolutionResult.error;

    if (loadError) {
      setError(loadError.message);
    }
  }

  function updateMeeting(key, value) {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function updateResolution(key, value) {
    setResolution((current) => ({
      ...current,
      [key]: value,
    }));
  }

  async function addMeeting(event) {
    event.preventDefault();

    if (!form.title.trim() || !form.meeting_date) {
      setError("Enter a meeting title and date.");
      return;
    }

    setBusy(true);
    setError("");

    const { error: insertError } = await supabase
      .from("school_meetings")
      .insert({
        school_id: schoolId,
        ...form,
        start_time: form.start_time || null,
        venue: form.venue.trim() || null,
        chairperson:
          form.chairperson.trim() || null,
        secretary: form.secretary.trim() || null,
        attendees: form.attendees.trim() || null,
        agenda: form.agenda.trim() || null,
        minutes: form.minutes.trim() || null,
      });

    if (insertError) {
      setError(insertError.message);
    } else {
      setForm(initialMeeting());
      await load();
    }

    setBusy(false);
  }

  async function addResolution(event) {
    event.preventDefault();

    if (
      !selectedMeeting ||
      !resolution.resolution.trim()
    ) {
      setError(
        "Select a meeting and enter the resolution.",
      );
      return;
    }

    setBusy(true);
    setError("");

    const { error: insertError } = await supabase
      .from("meeting_resolutions")
      .insert({
        school_id: schoolId,
        meeting_id: selectedMeeting,
        resolution_number:
          resolution.resolution_number.trim() ||
          null,
        resolution:
          resolution.resolution.trim(),
        responsible_person:
          resolution.responsible_person.trim() ||
          null,
        due_date: resolution.due_date || null,
        status: "open",
      });

    if (insertError) {
      setError(insertError.message);
    } else {
      setResolution(EMPTY_RESOLUTION);
      await load();
    }

    setBusy(false);
  }

  async function markComplete(item) {
    const { error: updateError } = await supabase
      .from("meeting_resolutions")
      .update({ status: "completed" })
      .eq("id", item.id)
      .eq("school_id", schoolId);

    if (updateError) {
      setError(updateError.message);
    } else {
      await load();
    }
  }

  return (
    <div className="feature-stack">
      <SectionCard
        title="Record meeting"
        description="Store agendas, attendance, minutes and the people responsible for the meeting record."
      >
        <form
          className="governance-form"
          onSubmit={addMeeting}
        >
          <div className="form-grid">
            <label>
              Meeting title
              <input
                value={form.title}
                onChange={(event) =>
                  updateMeeting(
                    "title",
                    event.target.value,
                  )
                }
              />
            </label>

            <label>
              Meeting type
              <select
                value={form.meeting_type}
                onChange={(event) =>
                  updateMeeting(
                    "meeting_type",
                    event.target.value,
                  )
                }
              >
                <option value="management">
                  Management
                </option>
                <option value="board">
                  Governing board
                </option>
                <option value="staff">
                  Staff
                </option>
                <option value="finance">
                  Finance
                </option>
                <option value="disciplinary">
                  Disciplinary
                </option>
                <option value="other">
                  Other
                </option>
              </select>
            </label>

            <label>
              Meeting date
              <input
                type="date"
                value={form.meeting_date}
                onChange={(event) =>
                  updateMeeting(
                    "meeting_date",
                    event.target.value,
                  )
                }
              />
            </label>

            <label>
              Start time
              <input
                type="time"
                value={form.start_time}
                onChange={(event) =>
                  updateMeeting(
                    "start_time",
                    event.target.value,
                  )
                }
              />
            </label>

            {[
              ["venue", "Venue"],
              ["chairperson", "Chairperson"],
              ["secretary", "Secretary"],
              ["attendees", "Attendees"],
            ].map(([key, label]) => (
              <label key={key}>
                {label}
                <input
                  value={form[key]}
                  onChange={(event) =>
                    updateMeeting(
                      key,
                      event.target.value,
                    )
                  }
                />
              </label>
            ))}

            <label className="form-span-2">
              Agenda
              <textarea
                value={form.agenda}
                onChange={(event) =>
                  updateMeeting(
                    "agenda",
                    event.target.value,
                  )
                }
              />
            </label>

            <label className="form-span-2">
              Minutes
              <textarea
                value={form.minutes}
                onChange={(event) =>
                  updateMeeting(
                    "minutes",
                    event.target.value,
                  )
                }
              />
            </label>
          </div>

          <div className="form-actions">
            <button type="submit" disabled={busy}>
              <Plus size={17} />
              Save meeting
            </button>
          </div>
        </form>
      </SectionCard>

      <SectionCard
        title="Record resolution"
        description="Link a resolution to its meeting, responsible person and due date."
      >
        <form
          className="governance-form"
          onSubmit={addResolution}
        >
          <div className="form-grid">
            <label>
              Meeting
              <select
                value={selectedMeeting}
                onChange={(event) =>
                  setSelectedMeeting(
                    event.target.value,
                  )
                }
              >
                <option value="">
                  Select meeting
                </option>
                {meetings.map((item) => (
                  <option
                    key={item.id}
                    value={item.id}
                  >
                    {item.meeting_date} -{" "}
                    {item.title}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Resolution number
              <input
                value={
                  resolution.resolution_number
                }
                onChange={(event) =>
                  updateResolution(
                    "resolution_number",
                    event.target.value,
                  )
                }
              />
            </label>

            <label>
              Responsible person
              <input
                value={
                  resolution.responsible_person
                }
                onChange={(event) =>
                  updateResolution(
                    "responsible_person",
                    event.target.value,
                  )
                }
              />
            </label>

            <label>
              Due date
              <input
                type="date"
                value={resolution.due_date}
                onChange={(event) =>
                  updateResolution(
                    "due_date",
                    event.target.value,
                  )
                }
              />
            </label>

            <label className="form-span-2">
              Resolution
              <textarea
                value={resolution.resolution}
                onChange={(event) =>
                  updateResolution(
                    "resolution",
                    event.target.value,
                  )
                }
              />
            </label>
          </div>

          <div className="form-actions">
            <button type="submit" disabled={busy}>
              <Gavel size={17} />
              Save resolution
            </button>
          </div>
        </form>
      </SectionCard>

      <SectionCard
        title="Meeting records"
        description={`${meetings.length} meeting${
          meetings.length === 1 ? "" : "s"
        } recorded.`}
      >
        {meetings.length ? (
          <div className="meeting-list">
            {meetings.map((meeting) => {
              const linked = resolutions.filter(
                (item) =>
                  item.meeting_id === meeting.id,
              );

              return (
                <article
                  className="meeting-record"
                  key={meeting.id}
                >
                  <header>
                    <div>
                      <h3>{meeting.title}</h3>
                      <p>
                        {meeting.meeting_date} ·{" "}
                        {meeting.meeting_type} ·{" "}
                        {meeting.venue ||
                          "Venue not set"}
                      </p>
                    </div>

                    <span className="meeting-count">
                      <Users size={15} />
                      {linked.length} resolutions
                    </span>
                  </header>

                  {meeting.minutes ? (
                    <p className="meeting-minutes">
                      {meeting.minutes}
                    </p>
                  ) : null}

                  {linked.length ? (
                    <div className="resolution-list">
                      {linked.map((item) => (
                        <div
                          className="resolution-row"
                          key={item.id}
                        >
                          <div>
                            <strong>
                              {item.resolution_number ||
                                "Resolution"}
                            </strong>
                            <p>{item.resolution}</p>
                            <span>
                              Owner:{" "}
                              {item.responsible_person ||
                                "Not assigned"}
                              {" · "}
                              Due:{" "}
                              {item.due_date ||
                                "No due date"}
                            </span>
                          </div>

                          <StatusBadge
                            status={
                              item.status || "open"
                            }
                          />

                          {item.status !==
                          "completed" ? (
                            <button
                              className="ghost compact-action"
                              onClick={() =>
                                markComplete(item)
                              }
                            >
                              <CheckCircle2
                                size={15}
                              />
                              Complete
                            </button>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  ) : null}
                </article>
              );
            })}
          </div>
        ) : (
          <EmptyState
            title="No meetings recorded"
            description="Meeting minutes and resolutions will appear here."
            icon={Gavel}
          />
        )}
      </SectionCard>

      {error ? <p className="error">{error}</p> : null}
    </div>
  );
}
