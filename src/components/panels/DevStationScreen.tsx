"use client";

import { useEffect, useRef, useState } from "react";
import type { Project } from "@/content/portfolio";

/**
 * The dev station does not open a panel. It takes over the whole viewport and
 * pretends to be the monitor itself: the screen switches on, the footage plays
 * inside it, and the project notes sit alongside like a build readout.
 *
 * Its colours are hard-coded rather than themed on purpose. A monitor is its
 * own light source, so it looks the same whether the room lights are on or off.
 */
export default function DevStationScreen({
  project,
  onClose,
}: {
  project: Project;
  onClose: () => void;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const [playing, setPlaying] = useState(false);
  const video = project.video;

  useEffect(() => {
    closeRef.current?.focus();
  }, []);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={project.title}
      className="fixed inset-0 z-50 bg-[#04070b] text-[#c7dced]"
    >
      <div className="animate-crt-on flex h-full w-full flex-col">
        <header className="flex shrink-0 items-center justify-between gap-4 border-b border-[#16283a] px-5 py-3 md:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <span
              aria-hidden
              className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#5cc8ea] shadow-[0_0_8px_#5cc8ea]"
            />
            <p className="font-mono text-[10px] tracking-[0.28em] text-[#5cc8ea]">
              DEV STATION 01
            </p>
            {project.tag && (
              <>
                <span aria-hidden className="hidden h-3 w-px bg-[#1d3548] sm:block" />
                <p className="hidden font-mono text-[10px] tracking-[0.22em] text-[#e8a250] sm:block">
                  {project.tag}
                </p>
              </>
            )}
          </div>

          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-sm border border-[#25415a] px-2.5 py-1 font-mono text-[10px] tracking-[0.2em] text-[#7d99ad] transition-colors hover:border-[#5cc8ea] hover:text-[#c7dced]"
          >
            ESC
          </button>
        </header>

        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-5 py-6 md:px-8 md:py-8">
          {/* Centred when the screen is tall, top-aligned once it overflows. */}
          <div className="mx-auto my-auto w-full max-w-6xl">
            <h2 className="text-2xl font-medium tracking-tight text-[#e9f4fb] md:text-3xl">
              {project.title}
            </h2>
            <p className="mt-1.5 font-mono text-[11px] tracking-[0.14em] text-[#7d99ad]">
              {project.subtitle}
            </p>

            <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] lg:gap-10">
              <div>
                {video && (
                  <VideoFrame
                    youtubeId={video.youtubeId}
                    title={video.title}
                    playing={playing}
                    onPlay={() => setPlaying(true)}
                  />
                )}

                <p className="mt-5 text-sm leading-relaxed text-[#a8c2d4]">
                  {project.description}
                </p>
              </div>

              <div className="space-y-7">
                <section>
                  <Label>Build notes</Label>
                  <ol className="mt-3 space-y-3">
                    {project.highlights.map((h, i) => (
                      <li key={h} className="flex gap-3">
                        <span
                          aria-hidden
                          className="mt-[3px] shrink-0 font-mono text-[10px] tracking-widest text-[#3f6d8c]"
                        >
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        <span className="text-[13px] leading-relaxed text-[#bcd4e4]">
                          {h}
                        </span>
                      </li>
                    ))}
                  </ol>
                </section>

                <section>
                  <Label>Built with</Label>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {project.stack.map((s) => (
                      <span
                        key={s}
                        className="border border-[#1d3548] bg-[#0a131c] px-2 py-1 font-mono text-[11px] tracking-wide text-[#8fb0c6]"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </section>

                {project.links.length > 0 && (
                  <section className="border-t border-[#16283a] pt-5">
                    <div className="flex flex-wrap gap-2">
                      {project.links.map((l) => (
                        <a
                          key={l.label}
                          href={l.href}
                          target="_blank"
                          rel="noreferrer noopener"
                          className="inline-flex items-center gap-2 rounded-sm border border-[#25415a] px-3.5 py-2 font-mono text-xs tracking-wide text-[#bcd4e4] transition-colors hover:border-[#5cc8ea] hover:text-[#e9f4fb]"
                        >
                          {l.label}
                          <span aria-hidden>→</span>
                        </a>
                      ))}
                    </div>
                  </section>
                )}
              </div>
            </div>
          </div>
        </div>

        <footer className="flex shrink-0 flex-wrap items-center justify-between gap-x-6 gap-y-1 border-t border-[#16283a] px-5 pt-2.5 pb-[calc(0.625rem+env(safe-area-inset-bottom))] font-mono text-[10px] tracking-[0.18em] text-[#5c86a0] md:px-8">
          <span>ESC · CLOSE</span>
          <span>SIGNAL · {playing ? "LIVE" : "STANDBY"}</span>
        </footer>
      </div>

      {/* Scanlines and the curve of the glass, over everything. They pull back
          while footage is playing so the recording stays legible. */}
      <div
        aria-hidden
        className={`crt-overlay pointer-events-none absolute inset-0 transition-opacity duration-500 ${
          playing ? "opacity-30" : "opacity-100"
        }`}
      />
    </div>
  );
}

function Label({ children }: { children: string }) {
  return (
    <p className="font-mono text-[10px] tracking-[0.22em] text-[#4f7691] uppercase">
      {children}
    </p>
  );
}

/**
 * The player only reaches YouTube once someone asks for it, so opening the
 * screen costs no third-party request.
 */
function VideoFrame({
  youtubeId,
  title,
  playing,
  onPlay,
}: {
  youtubeId: string;
  title: string;
  playing: boolean;
  onPlay: () => void;
}) {
  return (
    <div className="relative aspect-video w-full overflow-hidden border border-[#1d3548] bg-[#070d14]">
      {playing ? (
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${youtubeId}?autoplay=1&rel=0&modestbranding=1&playsinline=1`}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="absolute inset-0 h-full w-full"
        />
      ) : (
        <button
          type="button"
          onClick={onPlay}
          className="group absolute inset-0 flex flex-col items-center justify-center gap-4 transition-colors hover:bg-[#5cc8ea]/[0.04]"
        >
          <span
            aria-hidden
            className="absolute inset-0 opacity-40"
            style={{
              backgroundImage:
                "linear-gradient(to right, #12212e 1px, transparent 1px), linear-gradient(to bottom, #12212e 1px, transparent 1px)",
              backgroundSize: "34px 34px",
            }}
          />
          <span className="relative flex h-14 w-14 items-center justify-center rounded-full border border-[#2d5a76] transition-colors group-hover:border-[#5cc8ea]">
            <span
              aria-hidden
              className="ml-1 h-0 w-0 border-y-[9px] border-l-[15px] border-y-transparent border-l-[#7fb6d4] transition-colors group-hover:border-l-[#5cc8ea]"
            />
          </span>
          <span className="relative text-center">
            <span className="block font-mono text-[11px] tracking-[0.22em] text-[#8fb0c6] uppercase">
              {title}
            </span>
            <span className="mt-1.5 block font-mono text-[10px] tracking-[0.16em] text-[#456982] uppercase">
              Plays here · hosted on YouTube
            </span>
          </span>
        </button>
      )}
    </div>
  );
}
