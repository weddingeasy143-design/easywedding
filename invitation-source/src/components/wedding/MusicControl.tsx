// src/components/wedding/MusicControl.tsx
// Floating music on/off button. State persisted in sessionStorage.
"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { isMusicOn, subscribeMusic, toggleMusic } from "@/lib/music";
import { MusicIcon, MusicOffIcon } from "./icons";

export default function MusicControl() {
  const [on, setOn] = useState(false);

  useEffect(() => {
    setOn(isMusicOn());
    return subscribeMusic(setOn);
  }, []);

  return (
    <motion.button
      type="button"
      onClick={() => toggleMusic()}
      aria-label={on ? "Turn music off" : "Turn music on"}
      aria-pressed={on}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.6 }}
      whileTap={{ scale: 0.9 }}
      className={`fixed right-4 top-4 z-[85] flex h-11 w-11 items-center justify-center rounded-full border shadow-lg backdrop-blur-md transition lg:mt-16 ${
        on
          ? "border-gold bg-maroon text-gold-light"
          : "border-gold/60 bg-ivory/85 text-maroon"
      }`}
      style={{ top: "calc(1rem + env(safe-area-inset-top))" }}
    >
      {on ? <MusicIcon size={20} /> : <MusicOffIcon size={20} />}
      {on && (
        <span className="absolute -right-0.5 -top-0.5 flex h-3 w-3" aria-hidden>
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-gold-light opacity-60" />
          <span className="relative inline-flex h-3 w-3 rounded-full bg-gold-light" />
        </span>
      )}
    </motion.button>
  );
}
