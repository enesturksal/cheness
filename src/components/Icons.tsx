import type { SVGProps } from 'react';

const base: SVGProps<SVGSVGElement> = {
  width: 18,
  height: 18,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2.2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
};

const big: SVGProps<SVGSVGElement> = { ...base, width: 28, height: 28, strokeWidth: 1.8 };

export const IconPrev = () => (
  <svg {...base}>
    <path d="M15 6l-6 6 6 6" />
  </svg>
);
export const IconNext = () => (
  <svg {...base}>
    <path d="M9 6l6 6-6 6" />
  </svg>
);
export const IconFirst = () => (
  <svg {...base}>
    <path d="M17 6l-6 6 6 6M8 6v12" />
  </svg>
);
export const IconLast = () => (
  <svg {...base}>
    <path d="M7 6l6 6-6 6M16 6v12" />
  </svg>
);
export const IconFlip = () => (
  <svg {...base}>
    <path d="M7 4v16m0 0l-3-3m3 3l3-3M17 20V4m0 0l-3 3m3-3l3 3" />
  </svg>
);
export const IconPlus = () => (
  <svg {...base}>
    <path d="M12 5v14M5 12h14" />
  </svg>
);
export const IconSun = () => (
  <svg {...base}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2m0 16v2M2 12h2m16 0h2M4.9 4.9l1.4 1.4m11.4 11.4l1.4 1.4M4.9 19.1l1.4-1.4m11.4-11.4l1.4-1.4" />
  </svg>
);
export const IconMoon = () => (
  <svg {...base}>
    <path d="M20 14.5A8.5 8.5 0 0 1 9.5 4 8.5 8.5 0 1 0 20 14.5z" />
  </svg>
);
export const IconBack = () => (
  <svg {...base}>
    <path d="M19 12H5m0 0l6-6m-6 6l6 6" />
  </svg>
);
export const IconSearch = () => (
  <svg {...base}>
    <circle cx="11" cy="11" r="7" />
    <path d="M20 20l-3.5-3.5" />
  </svg>
);
export const IconChevron = ({ open }: { open: boolean }) => (
  <svg
    {...base}
    style={{ transform: open ? 'rotate(90deg)' : undefined, transition: 'transform .15s' }}
  >
    <path d="M9 6l6 6-6 6" />
  </svg>
);
export const IconHome = () => (
  <svg {...base}>
    <path d="M3 11l9-8 9 8v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" />
  </svg>
);
export const IconEye = ({ off = false }: { off?: boolean }) => (
  <svg {...base}>
    <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12z" />
    <circle cx="12" cy="12" r="3" />
    {off && <path d="M4 4l16 16" />}
  </svg>
);
export const IconPlay = () => (
  <svg {...big}>
    <path d="M7 4l13 8-13 8z" />
  </svg>
);
export const IconChart = () => (
  <svg {...big}>
    <path d="M4 20V10m6 10V4m6 16v-8m4 8H2" />
  </svg>
);
export const IconUsers = () => (
  <svg {...big}>
    <circle cx="9" cy="8" r="3.5" />
    <path d="M2.5 20a6.5 6.5 0 0 1 13 0M16 4.5a3.5 3.5 0 0 1 0 7M21.5 20a6.5 6.5 0 0 0-4.5-6.2" />
  </svg>
);
export const IconBook = () => (
  <svg {...big}>
    <path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z" />
    <path d="M4 19a2 2 0 0 1 2-2h13M8 7h7" />
  </svg>
);
export const IconHistory = () => (
  <svg {...big}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </svg>
);
export const IconLibrary = () => (
  <svg {...big}>
    <path d="M4 4h4v16H4zM10 4h4v16h-4zM16.5 5.5l3.5-1 4 15-3.5 1z" />
  </svg>
);
