"use client";

import { useEffect } from "react";
import { PROJECTS } from "@/content/portfolio";
import type { PanelId } from "@/game/types";
import PanelShell from "./PanelShell";
import { ContactBody, ProjectBody, SkillsBody } from "./bodies";

const byId = (id: string) => PROJECTS.find((p) => p.id === id)!;

/** Maps an interactable's panel id onto the panel it opens. */
export default function PanelHost({
  panel,
  onClose,
}: {
  panel: PanelId | null;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!panel) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [panel, onClose]);

  if (!panel) return null;

  if (panel === "skills") {
    return (
      <PanelShell
        tag="WORKBENCH"
        title="Skills"
        subtitle="What I actually work with"
        onClose={onClose}
      >
        <SkillsBody />
      </PanelShell>
    );
  }

  if (panel === "contact") {
    return (
      <PanelShell tag="DOOR" title="Contact" subtitle="How to reach me" onClose={onClose}>
        <ContactBody />
      </PanelShell>
    );
  }

  const project = byId(panel === "moriqa" ? "moriqa" : "coop-horror");
  return (
    <PanelShell
      tag={project.tag}
      title={project.title}
      subtitle={project.subtitle}
      onClose={onClose}
    >
      <ProjectBody project={project} />
    </PanelShell>
  );
}
