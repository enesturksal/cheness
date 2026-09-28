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
