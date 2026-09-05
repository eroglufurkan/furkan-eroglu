"use client";

import { useEffect } from "react";
import { PROJECTS } from "@/content/portfolio";
import type { Translate } from "@/game/i18n";
import type { Settings } from "@/game/settings";
import type { RoomTheme } from "@/game/theme";
import type { PanelId } from "@/game/types";
import CollectionPanel from "./CollectionPanel";
import PanelShell from "./PanelShell";
import SettingsPanel from "./SettingsPanel";
import { ContactBody, ProjectBody, SkillsBody } from "./bodies";

const byId = (id: string) => PROJECTS.find((p) => p.id === id)!;

/** Maps an interactable's panel id onto the panel it opens. */
export default function PanelHost({
  panel,
  onClose,
  settings,
  onSettingsChange,
  caught,
  theme,
  t,
}: {
  panel: PanelId | null;
  onClose: () => void;
  settings: Settings;
  onSettingsChange: (next: Settings) => void;
  caught: readonly number[];
  theme: RoomTheme;
  t: Translate;
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

  if (panel === "settings") {
    return (
      <PanelShell
        tag={t("nameServer").toUpperCase()}
        title={t("settingsTitle")}
        subtitle={t("settingsSubtitle")}
        onClose={onClose}
      >
        <SettingsPanel settings={settings} onChange={onSettingsChange} t={t} />
      </PanelShell>
    );
  }

  if (panel === "collection") {
    return (
      <PanelShell
        tag={t("nameCase").toUpperCase()}
        title={t("collectionTitle")}
        subtitle={t("collectionSubtitle")}
        onClose={onClose}
      >
        <CollectionPanel caught={caught} theme={theme} t={t} />
      </PanelShell>
    );
  }

  if (panel === "skills") {
    return (
      <PanelShell
        tag={t("nameWorkbench").toUpperCase()}
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
      <PanelShell
        tag={t("nameDoor").toUpperCase()}
        title="Contact"
        subtitle="How to reach me"
        onClose={onClose}
      >
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
