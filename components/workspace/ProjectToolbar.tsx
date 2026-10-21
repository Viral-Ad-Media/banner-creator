import React, { useEffect, useState } from "react";
import { apiFetch } from "../../services/apiClient";
import { packDraft, unpackDraft } from "../../services/draftStore";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { NativeSelect, NativeSelectOption } from "../ui/native-select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../ui/alert-dialog";
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
  const [confirmDelete, setConfirmDelete] = useState(false);
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
    if (!id) return;
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
    <section className="space-y-3 rounded-xl border border-border bg-card p-4">
      <div className="grid gap-2">
        <Label htmlFor="project-select">Project</Label>
        <NativeSelect
          id="project-select"
          className="w-full"
          value={id}
          onChange={(e) => void load(e.target.value)}
          disabled={busy}
        >
          <NativeSelectOption value="">New project</NativeSelectOption>
          {projects.map((p) => (
            <NativeSelectOption key={p.id} value={p.id}>
              {p.name}
            </NativeSelectOption>
          ))}
        </NativeSelect>
      </div>
      <div className="flex gap-2">
        <Input
          aria-label="Project name"
          value={name}
          maxLength={120}
          onChange={(e) => setName(e.target.value)}
        />
        <Button
          type="button"
          variant="secondary"
          onClick={() => void save()}
          disabled={busy || !name.trim()}
        >
          Save
        </Button>
        {id && (
          <Button
            type="button"
            variant="ghost"
            onClick={() => setConfirmDelete(true)}
            disabled={busy}
          >
            Delete
          </Button>
        )}
      </div>
      {message && (
        <p role="status" className="text-xs text-muted-foreground">
          {message}
        </p>
      )}
      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete "{name}"?</AlertDialogTitle>
            <AlertDialogDescription>
              The saved copy in your account is removed. The draft open on this
              screen stays.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep it</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={() => void remove()}
            >
              Delete project
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
};
