"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import NodeField from "@/components/background/NodeField";
import HeroCanvas from "@/components/hero/HeroCanvas";
import SideNav from "@/components/nav/SideNav";
import ContactModal from "@/components/contact/ContactModal";
import StatCard from "@/components/ui/StatCard";
import TeamCard from "@/components/ui/TeamCard";
import GlassButton from "@/components/ui/GlassButton";
import { about, footer, hero, sections, team, ventures } from "@/lib/content";
import heroStyles from "@/app/page.module.css";
import { useZScroll } from "./useZScroll";
import styles from "./ZSite.module.css";

const VentureCubes = dynamic(() => import("@/components/ventures/VentureCubes"), {
  ssr: false,
  loading: () => null,
});

/** Distance between planes on the Z track, in CSS px at perspective 1000px. */
const GAP = 1600;
const COUNT = sections.length;

export default function ZSite() {
  const planes = useRef<(HTMLElement | null)[]>([]);
  const bg = useRef<HTMLDivElement>(null);
  const cue = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const [reached, setReached] = useState(0); // furthest stop visited (lazy-mounts heavy scenes)
  const [contactOpen, setContactOpen] = useState(false);
  const reduced = useRef(false);

  useEffect(() => {
    reduced.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  const onFrame = useCallback((p: number) => {
    const camZ = p * GAP;
    planes.current.forEach((el, i) => {
      if (!el) return;
      const d = camZ - i * GAP; // < 0: still ahead in the fog; > 0: flown past
      let o: number;
      let transform: string;
      if (reduced.current) {
        o = Math.max(0, 1 - Math.abs(p - i) * 1.6);
        transform = "none";
      } else {
        // Fog starts just under one plane away, so the hero stays clean at rest.
        o = d <= 0 ? 1 + d / (GAP * 0.92) : 1 - d / 620;
        transform = `translate3d(0,0,${d.toFixed(1)}px)`;
      }
      o = Math.max(0, Math.min(1, o));
      el.style.transform = transform;
      el.style.opacity = o.toFixed(3);
      el.style.visibility = o < 0.01 ? "hidden" : "visible";
      const live = Math.abs(p - i) < 0.3;
      el.style.pointerEvents = live ? "auto" : "none";
      el.inert = !live && o < 0.5;
    });
    // The star field drifts closer as you travel, a little slower than the planes.
    if (bg.current && !reduced.current) {
      bg.current.style.transform = `scale(${(1 + p * 0.06).toFixed(4)})`;
    }
    if (cue.current) cue.current.style.opacity = String(Math.max(0, 1 - p * 4));
  }, []);

  const onStop = useCallback((i: number) => {
    setActive(i);
    setReached((r) => Math.max(r, i));
  }, []);

  const { goTo } = useZScroll({ count: COUNT, paused: contactOpen, onFrame, onStop });

  // Deep links (/#ventures) and in-page anchors.
  useEffect(() => {
    const fromHash = () => {
      const id = window.location.hash.slice(1);
      if (id === "contact-form") return setContactOpen(true);
      const i = sections.findIndex((s) => s.id === id);
      if (i >= 0) goTo(i);
    };
    fromHash();
    window.addEventListener("hashchange", fromHash);
    return () => window.removeEventListener("hashchange", fromHash);
  }, [goTo]);

  const onAnchor = (e: React.MouseEvent<HTMLAnchorElement>) => {
    const href = e.currentTarget.getAttribute("href") ?? "";
    if (!href.startsWith("#")) return;
    e.preventDefault();
    const id = href.slice(1);
    if (id === "contact-form") return setContactOpen(true);
    const i = sections.findIndex((s) => s.id === id);
    if (i >= 0) goTo(i);
  };

  // Tabbing into a plane that's out of view flies the camera there.
  const focusPlane = (i: number) => () => {
    if (i !== active) goTo(i);
  };

  const plane = (i: number) => ({
    ref: (el: HTMLElement | null) => {
      planes.current[i] = el;
    },
    // Not an id: a matching #hash would make the browser scroll the stage itself.
    "data-section": sections[i].id,
    className: styles.plane,
    onFocus: focusPlane(i),
    "aria-label": sections[i].label,
  });

  // The camera moves, the page never does: undo any native scroll (focus,
  // find-in-page, anchors) on the fixed containers.
  const pin = (e: React.UIEvent<HTMLElement>) => {
    const el = e.currentTarget;
    if (el.scrollTop || el.scrollLeft) {
      el.scrollTop = 0;
      el.scrollLeft = 0;
    }
  };

  return (
    <main className={styles.root} onScroll={pin}>
      <div ref={bg} className={styles.bg} aria-hidden="true">
        <NodeField />
      </div>

      <SideNav active={active} onSelect={goTo} onContact={() => setContactOpen(true)} />

      <div className={styles.stage} onScroll={pin}>
        {/* 0 · Hero — unchanged from the original single-screen site */}
        <section {...plane(0)}>
          <h1 className={heroStyles.headline}>
            Building the IP<span className={heroStyles.lower}>s</span> of the future
          </h1>
          <HeroCanvas />
          <div ref={cue} className={styles.cue} aria-hidden="true">
            <span className={styles.mouse} />
            <span>{hero.cue}</span>
          </div>
        </section>

        {/* 1 · About */}
        <section {...plane(1)}>
          <div className={`${styles.frame} ${styles.about}`}>
            <div className={styles.aboutText}>
              <p className={styles.eyebrow}>{about.eyebrow}</p>
              <h2 className={styles.h2}>{about.headline}</h2>
              <p className={styles.body}>{about.body}</p>
            </div>
            <div className={styles.stats}>
              {about.stats.map((s) => (
                <StatCard key={s.label} {...s} play={reached >= 1} />
              ))}
            </div>
          </div>
        </section>

        {/* 2 · Ventures */}
        <section {...plane(2)}>
          <div className={`${styles.frame} ${styles.ventures}`}>
            <div className={styles.center}>
              <p className={styles.eyebrow}>{ventures.eyebrow}</p>
              <h2 className={styles.h2}>{ventures.headline}</h2>
              <p className={styles.sub}>{ventures.sub}</p>
            </div>
            <div className={styles.cubes}>{reached >= 1 && <VentureCubes />}</div>
            <ul className={styles.ventureList}>
              {ventures.items.map((v) => (
                <li key={v.id}>
                  <p className={styles.tag}>{v.tag}</p>
                  <h3 className={styles.vName}>{v.name}</h3>
                  <p className={styles.vLine}>{v.line}</p>
                  <a className={styles.link} href={v.url} target="_blank" rel="noopener noreferrer">
                    {v.domain} <span aria-hidden="true">↗</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* 3 · Team */}
        <section {...plane(3)}>
          <div className={`${styles.frame} ${styles.team}`}>
            <div className={styles.teamHead}>
              <p className={styles.eyebrow}>{team.eyebrow}</p>
              <h2 className={styles.h2}>{team.headline}</h2>
              <p className={styles.body}>{team.body}</p>
            </div>
            <div className={styles.teamRow}>
              {team.people.map((p) => (
                <TeamCard key={p.name} {...p} />
              ))}
            </div>
          </div>
        </section>

        {/* 4 · Footer */}
        <section {...plane(4)}>
          <footer className={`${styles.frame} ${styles.footer}`}>
            <div className={styles.cta}>
              <h2 className={styles.xl}>
                {footer.headline}
                <span className={styles.dim}>{footer.second}</span>
              </h2>
              <GlassButton size="lg" onClick={() => setContactOpen(true)}>
                {footer.button}
              </GlassButton>
            </div>

            <div className={styles.cols}>
              <div>
                <p className={styles.colTitle}>IP Ventures</p>
                <p className={styles.blurb}>
                  {footer.blurb[0]}
                  <br />
                  {footer.blurb[1]}
                </p>
              </div>
              {footer.columns.map((c) => (
                <nav key={c.title} aria-label={c.title}>
                  <p className={styles.colTitle}>{c.title}</p>
                  <ul>
                    {c.links.map((l) => (
                      <li key={l.label}>
                        <a
                          className={styles.colLink}
                          href={l.href}
                          onClick={onAnchor}
                          {...(l.href.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                        >
                          {l.label}
                        </a>
                      </li>
                    ))}
                  </ul>
                </nav>
              ))}
            </div>

            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className={styles.wordmark} src="/brand/ipv-wordmark-white.svg" alt="IP Ventures" />

            <div className={styles.legal}>
              <span>{footer.legal}</span>
              <span className={styles.small}>
                {footer.small.map((l) => (
                  <a key={l.label} href={l.href} onClick={onAnchor}>
                    {l.label}
                  </a>
                ))}
              </span>
            </div>
          </footer>
        </section>
      </div>

      <ContactModal open={contactOpen} onClose={() => setContactOpen(false)} />
    </main>
  );
}
