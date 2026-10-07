export const APP = {
  name: "VA Relay",
  tagline: "Clear work. Confident handovers.",
  evidenceBucket: "evidence",
  maxUploadBytes: 10 * 1024 * 1024,
} as const;
export const SECTIONS = [
  ["today", "My Day"],
  ["tasks", "All work"],
  ["processes", "Processes & SOPs"],
  ["reviews", "Attention required"],
  ["deadlines", "Deadlines"],
  ["training", "Handovers"],
  ["reports", "Weekly report"],
  ["team", "Team & access"],
  ["notifications", "Notifications"],
  ["activity", "Activity"],
  ["settings", "Settings"],
] as const;
export const STAGES = [
  "not_started",
  "demonstration",
  "guided_run",
  "independent_run",
  "sop_drafted",
  "sop_approved",
  "owned",
] as const;
