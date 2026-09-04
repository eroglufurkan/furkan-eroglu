import {
  CONTACT,
  PROFILE,
  SKILL_GROUPS,
  type Project,
} from "@/content/portfolio";
import { ActionLink, Chip, Eyebrow } from "@/components/ui";

/**
 * Panel bodies live apart from the modal shell so the plain portfolio view can
 * render exactly the same content without any game chrome.
 */

export function AboutBody() {
  return (
    <div className="space-y-5">
      <div className="space-y-3">
        {PROFILE.about.map((line) => (
          <p key={line} className="text-sm leading-relaxed text-bone-dim">
            {line}
          </p>
        ))}
      </div>

      <dl className="grid grid-cols-1 gap-px overflow-hidden border border-ash-700 bg-ash-700 sm:grid-cols-3">
        {[
          ["Role", PROFILE.role],
          ["Location", PROFILE.location],
          ["English", PROFILE.english],
        ].map(([k, v]) => (
          <div key={k} className="bg-ash-900 px-3 py-2.5">
            <dt className="font-mono text-[10px] tracking-[0.18em] text-bone-faint uppercase">
              {k}
            </dt>
            <dd className="mt-1 text-[13px] text-bone">{v}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

export function ProjectBody({ project }: { project: Project }) {
  return (
    <div className="space-y-5">
      <p className="text-sm leading-relaxed text-bone-dim">{project.description}</p>

      <div>
        <Eyebrow>What is in it</Eyebrow>
        <ul className="mt-2.5 space-y-1.5">
          {project.highlights.map((h) => (
            <li key={h} className="flex gap-2.5 text-[13px] text-bone">
              <span aria-hidden className="mt-[7px] h-1 w-1 shrink-0 bg-ember" />
              <span className="leading-relaxed">{h}</span>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <Eyebrow>Built with</Eyebrow>
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {project.stack.map((s) => (
            <Chip key={s}>{s}</Chip>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-2 border-t border-ash-700 pt-4">
        {project.links.map((l) => (
          <ActionLink
            key={l.label}
            href={l.href}
            variant={l.primary ? "primary" : "ghost"}
          >
            {l.label}
          </ActionLink>
        ))}
      </div>
    </div>
  );
}

export function SkillsBody() {
  return (
    <div className="grid gap-5 sm:grid-cols-2">
      {SKILL_GROUPS.map((group) => (
        <div key={group.title}>
          <Eyebrow>{group.title}</Eyebrow>
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {group.items.map((item) => (
              <Chip key={item}>{item}</Chip>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function ContactBody() {
  return (
    <div className="space-y-5">
      <p className="text-[15px] leading-relaxed text-bone">{CONTACT.message}</p>

      <ul className="divide-y divide-ash-700 border-y border-ash-700">
        {CONTACT.links.map((link) => (
          <li key={link.label} className="flex items-center justify-between gap-4 py-3">
            <div className="min-w-0">
              <p className="font-mono text-[10px] tracking-[0.18em] text-bone-faint uppercase">
                {link.label}
              </p>
              <p className="truncate text-[13px] text-bone-dim">{link.value}</p>
            </div>
            <ActionLink href={link.href} download={link.download}>
              {link.download ? "Download" : "Open"}
            </ActionLink>
          </li>
        ))}
      </ul>
    </div>
  );
}
