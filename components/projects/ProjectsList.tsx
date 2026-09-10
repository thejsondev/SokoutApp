"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Building2, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { CreateProjectModal } from "@/components/projects/CreateProjectModal";
import { EmptyState } from "@/components/ui/EmptyState";
import { CardSkeleton } from "@/components/ui/skeletons";
import { api } from "@/lib/api";
import type { ApiProject } from "@/lib/types";

export function ProjectsList() {
  const router = useRouter();
  const [projects, setProjects] = useState<ApiProject[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  async function load() {
    try {
      const payload = await api<{ data: ApiProject[] }>("/projects");
      setProjects(payload.data);
    } catch {
      setProjects([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  return (
    <div>
      <div className="mb-2">
        <h1 className="text-2xl font-semibold tracking-tight text-neutral-900 dark:text-white">Projects</h1>
        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
          Gebäude anlegen, QR teilen, Anfragen sehen.
        </p>
      </div>

      <div className="mb-6 flex justify-end">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 rounded-full bg-[#3CB346] px-4 py-2 text-sm font-medium text-white"
        >
          <Plus className="h-4 w-4" />
          Neu
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : projects.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="Noch keine Projekte"
          hint="Lege ein privates Haus oder ein Objekt mit Hausverwaltung an."
        >
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="rounded-full bg-[#3CB346] px-4 py-2 text-sm font-medium text-white"
          >
            Erstes Projekt
          </button>
        </EmptyState>
      ) : (
        <div className="space-y-3">
          {projects.map((project) => {
            const members = project.members?.length ?? 0;
            return (
              <Link
                key={project.id}
                href={`/projects/${project.id}`}
                className="block rounded-[28px] border border-neutral-100 bg-neutral-50 px-5 py-4 dark:border-neutral-800 dark:bg-neutral-900"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium text-neutral-900 dark:text-white">{project.title}</p>
                    <p className="mt-1 text-sm text-neutral-500">{project.address}</p>
                  </div>
                  <span className="shrink-0 rounded-full bg-white px-2.5 py-1 text-[11px] font-medium text-neutral-500 dark:bg-neutral-950 dark:text-neutral-400">
                    {project.hausverwaltung ? "Mit HV" : "Privat"}
                  </span>
                </div>
                <p className="mt-3 text-xs text-neutral-400">
                  {members} {members === 1 ? "Bewohner" : "Bewohner"}
                  {project.hausverwaltung
                    ? ` · ${project.hausverwaltung.first_name} ${project.hausverwaltung.last_name}`
                    : ""}
                </p>
              </Link>
            );
          })}
        </div>
      )}

      <CreateProjectModal
        open={open}
        onClose={() => setOpen(false)}
        onCreated={(project) => {
          void load();
          router.push(`/projects/${project.id}`);
        }}
      />
    </div>
  );
}
