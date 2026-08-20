// Semantic radii from the design handoff (design_handoff_go_ride/README.md "Driver app",
// confirmed against Driver App.dc.html's :root --r:12px / --r-lg:16px / --r-pill:999px).
// Values in px. Mirrored by tailwind.config.js, which generates rounded-control /
// rounded-card / rounded-pill; used directly by RN APIs that cannot take a className.
export const radii = {
  control: 12,
  card: 16,
  pill: 999,
} as const;
