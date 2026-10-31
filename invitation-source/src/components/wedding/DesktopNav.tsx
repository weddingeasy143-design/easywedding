// src/components/wedding/DesktopNav.tsx
// Sticky top navigation for desktop (lg+). BottomNav stays for mobile.
"use client";

import { useEffect, useState } from "react";
import { ORDERED_COUPLE } from "@/content/wedding";
import {
  BookIcon,
  CalendarIcon,
  GalleryIcon,
  HeartIcon,
  HomeIcon,
  RsvpIcon,
} from "./icons";

const ITEMS = [
  { href: "#home", label: "Home", Icon: HomeIcon },
  { href: "#story", label: "Story", Icon: BookIcon },
  { href: "#events", label: "Events", Icon: CalendarIcon },
  { href: "#gallery", label: "Gallery", Icon: GalleryIcon },
  { href: "#rsvp", label: "RSVP", Icon: RsvpIcon },
];

export default function DesktopNav() {
  const [active, setActive] = useState("#home");

  useEffect(() => {
    const onHash = () => setActive(window.location.hash || "#home");
    window.addEventListener("hashchange", onHash);

    // scroll-spy: highlight the section currently in view
    const sections = ITEMS.map((i) =>
      document.querySelector(i.href)
    ).filter(Boolean) as Element[];
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActive(`#${entry.target.id}`);
          }
        }
      },
      { rootMargin: "-40% 0px -55% 0px", threshold: 0 }
    );
    sections.forEach((s) => observer.observe(s));
    return () => {
      window.removeEventListener("hashchange", onHash);
      observer.disconnect();
    };
  }, []);

  return (
    <header className="fixed inset-x-0 top-0 z-[80] hidden border-b border-gold/50 bg-ivory/95 shadow-[0_8px_30px_-12px_rgba(109,16,37,0.35)] backdrop-blur-md lg:block">
      <nav
        aria-label="Invitation sections"
        className="mx-auto flex h-16 max-w-7xl items-center justify-between px-8"
      >
        <a
          href="#home"
          onClick={() => setActive("#home")}
          className="flex items-center gap-2 font-script text-3xl text-maroon"
          aria-label="Back to top"
        >
          {ORDERED_COUPLE[0].name[0]}
          <HeartIcon size={18} className="shrink-0" />
          {ORDERED_COUPLE[1].name[0]}
        </a>
        <ul className="flex items-center gap-8">
          {ITEMS.map(({ href, label, Icon }) => {
            const isActive = active === href;
            return (
              <li key={href}>
                <a
                  href={href}
                  onClick={() => setActive(href)}
                  aria-current={isActive ? "true" : undefined}
                  className={`relative flex items-center gap-1.5 py-2 text-[13px] font-semibold uppercase tracking-[0.16em] transition-colors ${
                    isActive
                      ? "text-maroon"
                      : "text-bark-soft/80 hover:text-maroon"
                  }`}
                >
                  <Icon size={17} />
                  {label}
                  <span
                    className={`absolute inset-x-0 -bottom-0.5 h-0.5 rounded-full bg-gold transition-opacity ${
                      isActive ? "opacity-100" : "opacity-0"
                    }`}
                    aria-hidden
                  />
                </a>
              </li>
            );
          })}
        </ul>
        <a href="#rsvp" onClick={() => setActive("#rsvp")} className="btn-royal !px-6 !py-2.5">
          RSVP Now
        </a>
      </nav>
    </header>
  );
}
