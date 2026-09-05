/**
 * Single source of truth for every piece of portfolio content.
 *
 * Both the playable room and the plain "View Portfolio" panel read from here,
 * so adding a project means adding one entry below — nothing else changes.
 *
 * >>> FILL THESE IN <<<  (search for TODO)
 */

export const LINKS = {
  email: "erogllu.furkan@gmail.com",
  github: "https://github.com/eroglufurkan",
  linkedin: "https://www.linkedin.com/in/eroglufurkan/",
  cv: "/cv/furkan-eroglu-cv.pdf",
  coopHorrorVideo: "https://youtu.be/7HYhxSa-HcM",
} as const;

export const PROFILE = {
  name: "Furkan Eroğlu",
  role: "Game Developer",
  location: "İzmir, Türkiye",
  english: "B2",
  about: [
    "I build gameplay systems and the software around them.",
    "Most of my game work is in Unreal Engine — multiplayer replication, player and item interaction, and cooperative gameplay. On the software side I ship production web applications with React, TypeScript and Supabase.",
  ],
} as const;

export type ProjectLink = {
  label: string;
  href: string;
  /** Rendered as the primary button in the panel. */
  primary?: boolean;
};

export type Project = {
  id: string;
  /** Small uppercase label above the title, e.g. PROTOTYPE. */
  tag?: string;
  title: string;
  subtitle: string;
  description: string;
  /** Bullet list of what the project actually contains. */
  highlights: readonly string[];
  /** Technology chips. */
  stack: readonly string[];
  links: readonly ProjectLink[];
};

export const PROJECTS: readonly Project[] = [
  {
    id: "moriqa",
    tag: "PRODUCTION SAAS",
    title: "Moriqa",
    subtitle: "Browser-Based AI Image Editor",
    description:
      "A production SaaS that runs AI image editing entirely in the browser. Users upload an image, run model-backed edits on it and get the result back without installing anything. Over 100 people are using it.",
    highlights: [
      "Live, with 100+ people using it",
      "Browser-based editing workflow, no desktop software required",
      "AI model integrations wired to the editor",
      "Authentication, storage and data handled with Supabase",
      "Live and in production",
    ],
    stack: ["React", "TypeScript", "Supabase", "AI APIs", "Production SaaS"],
    links: [{ label: "Open Moriqa", href: "https://moriqa.com", primary: true }],
  },
  {
    id: "coop-horror",
    tag: "PROTOTYPE",
    title: "Co-op Horror Game",
    subtitle: "Unreal Engine · Blueprints · Multiplayer",
    description:
      "A 4-player cooperative horror prototype built in Unreal Engine with Blueprints. Not a released commercial game — it is a prototype focused on gameplay systems and networked co-op.",
    highlights: [
      "4-player co-op horror",
      "Gameplay systems",
      "Multiplayer replication",
      "Player / item interactions",
      "Cooperative mechanics",
    ],
    stack: ["Unreal Engine", "Blueprints", "Multiplayer", "Replication"],
    links: [
      { label: "Watch Gameplay Video", href: LINKS.coopHorrorVideo, primary: true },
    ],
  },
];

export type SkillGroup = {
  title: string;
  items: readonly string[];
};

export const SKILL_GROUPS: readonly SkillGroup[] = [
  {
    title: "Game Development",
    items: [
      "Unreal Engine",
      "Blueprints",
      "Multiplayer",
      "Replication",
      "Gameplay Systems",
    ],
  },
  {
    title: "Programming",
    items: ["TypeScript", "JavaScript", "Python"],
  },
  {
    title: "Software",
    items: ["React", "Next.js", "Supabase", "PostgreSQL", "REST APIs"],
  },
  {
    title: "Tools",
    items: ["Git", "Vercel", "Replicate", "Hugging Face"],
  },
  {
    title: "AI Agents",
    items: ["Claude", "ChatGPT Codex"],
  },
];

export type ContactLink = {
  label: string;
  value: string;
  href: string;
  download?: boolean;
};

export const CONTACT: {
  message: string;
  links: readonly ContactLink[];
} = {
  message: "Interested in working together?",
  links: [
    {
      label: "Email",
      value: LINKS.email,
      href: `mailto:${LINKS.email}`,
    },
    { label: "LinkedIn", value: "Connect on LinkedIn", href: LINKS.linkedin },
    { label: "GitHub", value: "@eroglufurkan", href: LINKS.github },
    { label: "CV", value: "PDF", href: LINKS.cv, download: true },
  ],
};
