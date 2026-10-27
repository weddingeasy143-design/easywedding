// src/components/wedding/icons.tsx
// Refined line icons (inline SVG) — never emoji.
import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function base({ size = 22, ...props }: IconProps) {
  return {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.7,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
    ...props,
  };
}

export const HomeIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M3 10.5 12 3l9 7.5" />
    <path d="M5 9.5V21h14V9.5" />
    <path d="M9.5 21v-6h5v6" />
  </svg>
);

export const BookIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5z" />
    <path d="M4 20.5A2.5 2.5 0 0 1 6.5 18H20" />
    <path d="M9 8h7M9 11.5h5" />
  </svg>
);

export const CalendarIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <rect x="3.5" y="5" width="17" height="16" rx="2.5" />
    <path d="M3.5 9.5h17M8 3v4M16 3v4" />
  </svg>
);

export const CalendarPlusIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <rect x="3.5" y="5" width="17" height="16" rx="2.5" />
    <path d="M3.5 9.5h17M8 3v4M16 3v4M12 12.5v6M9 15.5h6" />
  </svg>
);

export const GalleryIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <rect x="3.5" y="4.5" width="17" height="15" rx="2.5" />
    <circle cx="9" cy="10" r="1.6" />
    <path d="M4.5 17.5l4.5-4.5 3.5 3.5 2.5-2.5 4.5 4.5" />
  </svg>
);

export const RsvpIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <rect x="3" y="5.5" width="18" height="13" rx="2.5" />
    <path d="m4.5 7.5 7.5 6 7.5-6" />
  </svg>
);

export const MusicIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M9 18.5V5.5L20 3.5v13" />
    <circle cx="6.5" cy="18.5" r="2.5" />
    <circle cx="17.5" cy="16.5" r="2.5" />
  </svg>
);

export const MusicOffIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M9 18.5V5.5L20 3.5v13" />
    <circle cx="6.5" cy="18.5" r="2.5" />
    <circle cx="17.5" cy="16.5" r="2.5" />
    <path d="M3 3l18 18" />
  </svg>
);

export const PinIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M12 21.5s7-6.2 7-11.5a7 7 0 1 0-14 0c0 5.3 7 11.5 7 11.5z" />
    <circle cx="12" cy="10" r="2.6" />
  </svg>
);

export const DirectionsIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="m12 3 8 18-8-4.5L4 21z" />
  </svg>
);

export const PhoneIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M5 4h4l1.5 4.5L8 10a12 12 0 0 0 6 6l1.5-2.5L20 15v4a1.5 1.5 0 0 1-1.5 1.5C10 20.5 3.5 14 3.5 5.5A1.5 1.5 0 0 1 5 4z" />
  </svg>
);

export const ShareIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <circle cx="6" cy="12" r="2.6" />
    <circle cx="17.5" cy="5.5" r="2.6" />
    <circle cx="17.5" cy="18.5" r="2.6" />
    <path d="m8.4 10.8 6.8-4M8.4 13.2l6.8 4" />
  </svg>
);

export const CopyIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <rect x="8.5" y="8.5" width="12" height="12" rx="2.5" />
    <path d="M15.5 5.5v-1a2 2 0 0 0-2-2h-9a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h1" />
  </svg>
);

export const CheckIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="m4.5 12.5 5 5L19.5 7" />
  </svg>
);

export const ChevronDownIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="m6 9 6 6 6-6" />
  </svg>
);

export const ChevronLeftIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="m14.5 6-6 6 6 6" />
  </svg>
);

export const ChevronRightIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="m9.5 6 6 6-6 6" />
  </svg>
);

export const CloseIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M6 6l12 12M18 6 6 18" />
  </svg>
);

export const PlayIcon = (p: IconProps) => (
  <svg {...base(p)} fill="currentColor" stroke="none">
    <path d="M8 5.5v13l11-6.5z" />
  </svg>
);

export const ClockIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 7.5V12l3.5 2" />
  </svg>
);

export const GiftIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <rect x="4" y="9.5" width="16" height="4" rx="1" />
    <path d="M6 13.5V20h12v-6.5M12 9.5V20M12 9.5S12 5 9.5 5 7 7.5 8 8.5 12 9.5 12 9.5zm0 0s0-4.5 2.5-4.5S17 7.5 16 8.5 12 9.5 12 9.5z" />
  </svg>
);

export const HeartIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M12 20.5S3.5 15.5 3.5 9.5A4.5 4.5 0 0 1 8 5c1.8 0 3.2 1 4 2.4A4.6 4.6 0 0 1 16 5a4.5 4.5 0 0 1 4.5 4.5c0 6-8.5 11-8.5 11z" />
  </svg>
);

export const UsersIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <circle cx="9" cy="8.5" r="3.5" />
    <path d="M3.5 20a5.5 5.5 0 0 1 11 0" />
    <path d="M16 5.6a3.5 3.5 0 0 1 0 5.8M17.5 14.7a5.5 5.5 0 0 1 3 5.3" />
  </svg>
);

export const LampIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M9 3h6l1.5 5h-9z" />
    <path d="M12 8v4M8.5 15.5c1-1.8 6-1.8 7 0" />
    <path d="M12 12c-2.5 0-4 1.5-4 3.5h8c0-2-1.5-3.5-4-3.5z" />
    <path d="M10 19.5h4" />
  </svg>
);

export const RingsIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <circle cx="9" cy="14" r="5.5" />
    <circle cx="15" cy="14" r="5.5" />
    <path d="M9 8.5 7.5 4h3L9 8.5zM15 8.5 13.5 4h3L15 8.5z" />
    <path d="m6.8 12.2 1.2 1.2M17.2 12.2l-1.2 1.2" />
  </svg>
);

export const CheersIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M7 3.5h4v6a2.5 2.5 0 0 1-5 0v-6h1z" transform="translate(0 0)" />
    <path d="M4.5 3.5h9M7 12v8.5M17 3.5h4v6a2.5 2.5 0 0 1-5 0v-6h1z" />
    <path d="M14.5 3.5h9M17 12v8.5" />
    <path d="m10.5 5.5 2 1.5M20.5 5.5l-2 1.5" />
  </svg>
);

export const HennaIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M7 11V6.5a1.5 1.5 0 0 1 3 0V10M10 10V4.5a1.5 1.5 0 0 1 3 0V10M13 10V6.5a1.5 1.5 0 0 1 3 0v5" />
    <path d="M7 11c-1.5 1-2.5 3-2.5 5.5 0 3 2.5 5 6 5 4 0 7-2.5 7-6.5V11" />
    <circle cx="11.5" cy="16.5" r="1.4" />
    <path d="M11.5 13.5v-1M14.5 17.5l.8-.8" />
  </svg>
);

export const SparkleIcon = (p: IconProps) => (
  <svg {...base(p)} fill="currentColor" stroke="none">
    <path d="M12 2c.7 4.8 2.4 7.7 4.5 9.5 2.4 2 5.5 3 5.5 3s-3.1 1-5.5 3c-2.1 1.8-3.8 4.7-4.5 9.5-.7-4.8-2.4-7.7-4.5-9.5-2.4-2-5.5-3-5.5-3s3.1-1 5.5-3c2.1-1.8 3.8-4.7 4.5-9.5z" />
  </svg>
);

export const WhatsAppIcon = (p: IconProps) => (
  <svg
    width={p.size ?? 22}
    height={p.size ?? 22}
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden
  >
    <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2c-1.5 0-3-.4-4.3-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.6-6.1c-.3-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1-.2.3-.6.8-.8 1-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4 0-.5.1-.7l.4-.5c.1-.2.1-.4 0-.5l-.8-1.9c-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.5.2-.7.5-.2.3-.9.9-.9 2.2s.9 2.5 1.1 2.7c.1.2 1.8 2.9 4.5 3.9.6.3 1.1.4 1.5.6.6.2 1.2.2 1.6.1.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.2-1.2-.1-.1-.3-.2-.5-.2z" />
  </svg>
);
