
import { useEffect, useRef, useState } from "react";
import {
  Building2,
  Upload,
  Save,
  ImagePlus,
  CheckCircle2,
} from "lucide-react";

import { useAuth } from "../hooks/useAuth";
import api from "../services/api";

function PageHeader({ title, subtitle }) {
  return (
    <div className="mb-6">
      <h2 className="text-2xl font-semibold text-brand-900">
        {title}
      </h2>
      <p className="text-sm text-slate-600">{subtitle}</p>
    </div>
  );
}

export default function Settings() {
  const { organization } = useAuth();
  const fileRef = useRef(null);

  const [form, setForm] = useState({
    name: "",
    location: "",
  });

  const [logo, setLogo] = useState(null);
  const [preview, setPreview] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    let active = true;

    const loadProfile = async () => {
      try {
        setLoading(true);

        const response = await api.getOrganizationProfile();
        const org = response.data;

        if (!active) return;

        setForm({
          name: org.name || "",
          location: org.location || "",
        });

        setPreview(org.logo_url || "");
      } catch (err) {
        if (active) {
          setError(err.message || "Unable to load profile.");
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    loadProfile();

    return () => {
      active = false;
    };
  }, [organization.id]);

  const chooseLogo = (file) => {
    if (!file) return;

    if (
      !["image/png", "image/jpeg", "image/webp"].includes(file.type)
    ) {
      setError("Please select PNG, JPG or WEBP image.");
      return;
    }

    if (file.size > 3 * 1024 * 1024) {
      setError("Logo size must be 3 MB or less.");
      return;
    }

    setError("");
    setLogo(file);
    setPreview(URL.createObjectURL(file));
  };

  const submit = async (e) => {
    e.preventDefault();

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      if (!form.name.trim()) {
        throw new Error("Organization name is required.");
      }

      const response = await api.updateOrganizationProfile({
        name: form.name,
        location: form.location,
        logo,
      });

      const org = response.data;

      const updated = {
        name: org.name,
        location: org.location,
        logo_url: org.logo_url || "",
      };

      setForm({
        name: updated.name,
        location: updated.location,
      });

      setPreview(updated.logo_url);
      setLogo(null);

      window.dispatchEvent(
        new CustomEvent("organization-settings-updated", {
          detail: {
            organizationId: organization.id,
            profile: updated,
          },
        })
      );

      setSuccess("Organization profile updated successfully.");
    } catch (err) {
      setError(err.message || "Unable to save profile.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Settings"
        subtitle="Manage CodeShape School profile"
      />

      <form onSubmit={submit} className="max-w-3xl space-y-5">
        <section className="card space-y-5 p-5 sm:p-6">

          <div className="flex items-center gap-2">
            <Building2 className="text-brand-700" size={21} />
            <h3 className="text-lg font-semibold text-brand-900">
              Organization Profile
            </h3>
          </div>

          {loading ? (
            <p className="text-sm text-slate-600">
              Loading organization details...
            </p>
          ) : (
            <>
              <div className="grid gap-4 sm:grid-cols-2">

                <label className="block">
                  <span className="mb-1 block text-sm font-medium">
                    Organization Name
                  </span>

                  <input
                    required
                    maxLength={120}
                    className="input w-full"
                    value={form.name}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        name: e.target.value,
                      })
                    }
                    placeholder="Enter organization name"
                  />
                </label>

                <label className="block">
                  <span className="mb-1 block text-sm font-medium">
                    Address
                  </span>

                  <input
                    maxLength={300}
                    className="input w-full"
                    value={form.location}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        location: e.target.value,
                      })
                    }
                    placeholder="Enter complete address"
                  />
                </label>

              </div>

              <div>
                <span className="mb-2 block text-sm font-medium">
                  Organization Logo
                </span>

                <div className="flex flex-wrap items-center gap-4 rounded-xl border border-dashed border-slate-300 p-4">

                  <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-xl bg-slate-100">
                    {preview ? (
                      <img
                        src={preview}
                        alt="Organization logo"
                        className="h-full w-full object-contain"
                      />
                    ) : (
                      <ImagePlus size={30} />
                    )}
                  </div>

                  <div className="space-y-2">
                    <button
                      type="button"
                      onClick={() => fileRef.current?.click()}
                      className="inline-flex items-center gap-2 rounded-lg bg-brand-900 px-4 py-2 text-sm font-medium text-white"
                    >
                      <Upload size={16} />
                      Choose Logo
                    </button>

                    <p className="text-xs text-slate-500">
                      PNG, JPG, WEBP · Maximum 3 MB
                    </p>

                    <input
                      ref={fileRef}
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      className="hidden"
                      onChange={(e) =>
                        chooseLogo(e.target.files?.[0])
                      }
                    />

                    {logo && (
                      <p className="text-xs text-emerald-700">
                        Selected: {logo.name}
                      </p>
                    )}
                  </div>

                </div>
              </div>

              {error && (
                <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                  {error}
                </p>
              )}

              {success && (
                <p className="flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                  <CheckCircle2 size={16} />
                  {success}
                </p>
              )}

              <div className="flex justify-end">
                <button
                  disabled={saving}
                  type="submit"
                  className="inline-flex items-center gap-2 rounded-lg bg-brand-900 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
                >
                  <Save size={16} />
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </>
          )}
        </section>
      </form>
    </>
  );
}
