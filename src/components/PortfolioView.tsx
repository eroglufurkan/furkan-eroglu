import { PROFILE, PROJECTS } from "@/content/portfolio";
import { AboutBody, ContactBody, ProjectBody, SkillsBody } from "./panels/bodies";
import { Tag } from "./ui";

const SECTIONS = [
  { id: "about", label: "About" },
  { id: "projects", label: "Projects" },
  { id: "skills", label: "Skills" },
  { id: "contact", label: "Contact" },
] as const;

function Section({
  id,
  index,
  title,
  children,
}: {
  id: string;
  index: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24 border-t border-ash-700 py-8">
      <div className="mb-5 flex items-baseline gap-3">
        <span className="font-mono text-[10px] text-ember-dim">
          {String(index).padStart(2, "0")}
        </span>
        <h2 className="text-sm font-medium tracking-[0.22em] text-bone uppercase">
          {title}
        </h2>
      </div>
      {children}
    </section>
  );
}

/**
 * The plain reading version of the same content, for anyone who would rather
 * not play. Server-rendered, so it is also what search engines see.
 */
export default function PortfolioView() {
  return (
    <div className="mx-auto w-full max-w-3xl">
      <header className="py-10">
        <h1 className="text-2xl font-medium tracking-tight text-bone sm:text-3xl">
          {PROFILE.name}
        </h1>
        <p className="mt-2 font-mono text-xs tracking-[0.18em] text-bone-dim uppercase">
          {PROFILE.role}
        </p>
        <p className="mt-1 font-mono text-xs tracking-[0.18em] text-bone-faint uppercase">
          {PROFILE.location}
        </p>
      </header>

      <nav className="sticky top-0 z-20 -mx-4 border-y border-ash-700 bg-void px-4">
        <ul className="flex gap-5 overflow-x-auto py-3">
          {SECTIONS.map((s) => (
            <li key={s.id}>
              <a
                href={`#${s.id}`}
                className="font-mono text-[11px] tracking-[0.18em] text-bone-dim uppercase transition-colors hover:text-bone"
              >
                {s.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <Section id="about" index={1} title="About">
        <AboutBody />
      </Section>

      <Section id="projects" index={2} title="Projects">
        <div className="space-y-6">
          {PROJECTS.map((project) => (
            <article key={project.id} className="border border-ash-700 bg-ash-900/60 p-5">
              <div className="mb-4">
                {project.tag && <Tag>{project.tag}</Tag>}
                <h3 className="mt-2.5 text-lg font-medium text-bone">{project.title}</h3>
                <p className="mt-0.5 font-mono text-[11px] tracking-wide text-bone-dim">
                  {project.subtitle}
                </p>
              </div>
              <ProjectBody project={project} />
            </article>
          ))}
        </div>
      </Section>

      <Section id="skills" index={3} title="Skills">
        <SkillsBody />
      </Section>

      <Section id="contact" index={4} title="Contact">
        <ContactBody />
      </Section>
    </div>
  );
}
