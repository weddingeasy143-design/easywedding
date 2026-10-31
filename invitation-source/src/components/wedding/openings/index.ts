import * as ivoryArch from "./ivory-arch";
import * as royalPrestige from "./royal-prestige";
import * as garden from "./garden";
import * as haldi from "./haldi";
import * as mehndi from "./mehndi";
import * as sangeet from "./sangeet";
import * as reception from "./reception";
import * as midnightNoor from "./midnight-noor";
import * as blushMehraab from "./blush-mehraab";
import * as emeraldDarbar from "./emerald-darbar";

/* Per-design opening acts (owner's rule): every design except Premium
   Original opens with its OWN Tap-to-Reveal screen (beat 0) and its OWN
   name-reveal curtain (beat 2). Premium Original is absent on purpose —
   it keeps the shared SurpriseAwaits + BeatCurtain exactly as they are.
   From the Open Invitation cover (beat 3) onward every design, these
   included, uses the one shared RoyalOpening. */
export const OPENING_ACTS: Record<string, { Reveal: any; Curtain: any }> = {
  "ivory-arch": ivoryArch,
  "royal-prestige": royalPrestige,
  garden: garden,
  haldi: haldi,
  mehndi: mehndi,
  sangeet: sangeet,
  reception: reception,
  "midnight-noor": midnightNoor,
  "blush-mehraab": blushMehraab,
  "emerald-darbar": emeraldDarbar,
};
