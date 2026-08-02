"use client";

import { useEffect, useState } from "react";
import {
  Building2,
  ImagePlus,
  Save,
} from "lucide-react";

import { supabase } from "../../../lib/supabaseClient";
import SectionCard from "../../ui/SectionCard";

const EMPTY_FORM = {
  name: "",
  address: "",
  phone: "",
  email: "",
  color: "#1E5EF7",
  logo: "",
  level: "secondary",
};

export default function SchoolProfilePanel({
  schoolId,
  school,
  settings,
  onChange,
}) {
  const [form, setForm] =
    useState(EMPTY_FORM);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setForm({
      name: school?.name || "",
      address: settings?.address || "",
      phone: settings?.phone || "",
      email: settings?.email || "",
      color:
        settings?.color || "#1E5EF7",
      logo: settings?.logo || "",
      level:
        settings?.level || "secondary",
    });
  }, [school, settings]);

  function update(key, value) {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
    setSaved(false);
  }

  function loadLogo(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 300000) {
      setError(
        "Logo too large. Use an image smaller than 300 KB.",
      );
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      update(
        "logo",
        String(reader.result || ""),
      );
      setError("");
    };

    reader.onerror = () => {
      setError("The logo could not be read.");
    };

    reader.readAsDataURL(file);
  }

  async function saveProfile(event) {
    event.preventDefault();

    if (!form.name.trim()) {
      setError("Enter the school name.");
      return;
    }

    setBusy(true);
    setSaved(false);
    setError("");

    const { error: schoolError } =
      await supabase
        .from("schools")
        .update({
          name: form.name.trim(),
        })
        .eq("id", schoolId);

    if (schoolError) {
      setError(schoolError.message);
      setBusy(false);
      return;
    }

    const { error: settingsError } =
      await supabase
        .from("school_settings")
        .upsert(
          {
            school_id: schoolId,
            address:
              form.address.trim() || null,
            phone:
              form.phone.trim() || null,
            email:
              form.email.trim() || null,
            color:
              form.color || "#1E5EF7",
            logo: form.logo || null,
            level:
              form.level || "secondary",
          },
          {
            onConflict: "school_id",
          },
        );

    if (settingsError) {
      setError(settingsError.message);
    } else {
      setSaved(true);
      await onChange();
    }

    setBusy(false);
  }

  return (
    <form
      className="feature-stack"
      onSubmit={saveProfile}
    >
      <SectionCard
        title="School identity"
        description="Maintain the school information used across Chalkboard documents, reports and administration."
      >
        <div className="profile-layout">
          <div className="school-logo-editor">
            <div className="school-logo-preview">
              {form.logo ? (
                <img
                  src={form.logo}
                  alt="School logo preview"
                />
              ) : (
                <Building2 size={34} />
              )}
            </div>

            <label className="file-action">
              <ImagePlus size={17} />
              Upload school logo
              <input
                type="file"
                accept="image/*"
                onChange={loadLogo}
              />
            </label>

            <span>
              PNG or JPG, no larger than
              300 KB.
            </span>
          </div>

          <div className="form-grid">
            <label className="form-span-2">
              School name
              <input
                value={form.name}
                onChange={(event) =>
                  update(
                    "name",
                    event.target.value,
                  )
                }
              />
            </label>

            <label>
              Education level
              <select
                value={form.level}
                onChange={(event) =>
                  update(
                    "level",
                    event.target.value,
                  )
                }
              >
                <option value="primary">
                  Primary
                </option>
                <option value="secondary">
                  Secondary
                </option>
                <option value="combined">
                  Combined
                </option>
              </select>
            </label>

            <label>
              Document accent colour
              <input
                type="color"
                value={form.color}
                onChange={(event) =>
                  update(
                    "color",
                    event.target.value,
                  )
                }
              />
            </label>
          </div>
        </div>
      </SectionCard>

      <SectionCard
        title="Contact information"
        description="These details may appear on school documents and communication."
      >
        <div className="form-grid">
          <label className="form-span-2">
            Address
            <input
              value={form.address}
              onChange={(event) =>
                update(
                  "address",
                  event.target.value,
                )
              }
              placeholder="School physical or postal address"
            />
          </label>

          <label>
            Phone number
            <input
              value={form.phone}
              onChange={(event) =>
                update(
                  "phone",
                  event.target.value,
                )
              }
              placeholder="+263 ..."
            />
          </label>

          <label>
            School email
            <input
              type="email"
              value={form.email}
              onChange={(event) =>
                update(
                  "email",
                  event.target.value,
                )
              }
              placeholder="school@example.com"
            />
          </label>
        </div>

        {error ? (
          <p className="error">{error}</p>
        ) : null}

        <div className="form-actions">
          <button type="submit" disabled={busy}>
            <Save size={17} />
            {busy
              ? "Saving..."
              : saved
                ? "Saved"
                : "Save school profile"}
          </button>
        </div>
      </SectionCard>
    </form>
  );
}
