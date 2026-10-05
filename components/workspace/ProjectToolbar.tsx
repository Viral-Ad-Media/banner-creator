import React, { useEffect, useState } from "react";
import { apiFetch } from "../../services/apiClient";
import { packDraft, unpackDraft } from "../../services/draftStore";
import { Button } from "../ui/Button";
export const ProjectToolbar: React.FC<{
  draft: unknown;
  onLoad: (draft: any) => void;
  onProjectChange: (id: string | undefined) => void;
}> = ({ draft, onLoad, onProjectChange }) => {
  const [projects, setProjects] = useState<any[]>([]);
  const [id, setId] = useState("");
  const [name, setName] = useState("My campaign");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const refresh = async () => {
    const all: any[] = [];
    for (let offset = 0; ; offset += 50) {
      const r = await apiFetch<{ projects: any[] }>(
        `/projects?offset=${offset}`,
      );
      all.push(...r.projects);
      if (r.projects.length < 50) break;
    }
    setProjects(all);
  };
  useEffect(() => {
    void refresh().catch((e) => setMessage(e.message));
  }, []);
  const save = async () => {
    setBusy(true);
    try {
      const r = await apiFetch<{ project: any }>(
        id ? `/projects/${id}` : "/projects",
        {
          method: id ? "PATCH" : "POST",
          body: JSON.stringify({ name, data: packDraft(draft) }),
        },
      );
      setId(r.project.id);
      onProjectChange(r.project.id);
      await refresh();
      setMessage("Project saved to your account.");
    } catch (e) {
      setMessage((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  const load = async (value: string) => {
    if (!value) {
      setId("");
      onProjectChange(undefined);
      setName("My campaign");
      return;
    }
    setBusy(true);
    try {
      const r = await apiFetch<{ project: any }>(`/projects/${value}`);
      const restored = r.project.data?.assets
        ? unpackDraft(r.project.data)
        : r.project.data;
      if (!restored || restored.version !== 1)
        throw new Error(
          "This project has no compatible editable snapshot. Save the current draft as a new project.",
        );
      onLoad(restored);
      setId(value);
      onProjectChange(value);
      setName(r.project.name);
      setMessage("Project loaded.");
    } catch (e) {
      setMessage((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  const remove = async () => {
    if (
      !id ||
      !window.confirm(
        "Delete this saved project? Your current draft remains available.",
      )
    )
      return;
    setBusy(true);
    try {
      await apiFetch(`/projects/${id}`, { method: "DELETE" });
      setId("");
      onProjectChange(undefined);
      await refresh();
      setMessage("Project deleted.");
    } catch (e) {
      setMessage((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <section className="surface-card rounded-2xl p-4 space-y-3">
      <label className="block text-xs text-muted">
        Saved projects
        <select
          className="block mt-2 w-full rounded bg-secondary p-2 text-white"
          value={id}
          onChange={(e) => void load(e.target.value)}
          disabled={busy}
        >
          <option value="">New project</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </label>
      <input
        aria-label="Project name"
        value={name}
        maxLength={120}
        onChange={(e) => setName(e.target.value)}
        className="w-full bg-secondary rounded p-2 text-white"
      />
      <div className="flex gap-2">
        <Button
          type="button"
          onClick={() => void save()}
          disabled={busy || !name.trim()}
          size="sm"
        >
          Save project
        </Button>
        {id && (
          <Button
            type="button"
            variant="ghost"
            onClick={() => void remove()}
            disabled={busy}
            size="sm"
          >
            Delete
          </Button>
        )}
      </div>
      {message && (
        <p role="status" className="text-xs text-muted">
          {message}
        </p>
      )}
    </section>
  );
};
