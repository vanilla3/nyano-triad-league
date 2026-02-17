import type { MintIconName } from "@/components/mint/icons/MintIcon";

export type MintGuideItem = {
  icon: MintIconName;
  title: string;
  detail: string;
};

export type MintPageGuideSpec = {
  title: string;
  subtitle: string;
  items: readonly MintGuideItem[];
};

export type MintPageGuideKey = "arena" | "events" | "replay" | "stream";

export const MINT_PAGE_GUIDES: Record<MintPageGuideKey, MintPageGuideSpec> = {
  arena: {
    title: "Start In 1 Minute",
    subtitle: "Pick difficulty, press Play, and learn while playing.",
    items: [
      { icon: "rules", title: "Choose Difficulty", detail: "Select the level that matches your pace." },
      { icon: "arena", title: "Play Now", detail: "Jump into guest match immediately." },
      { icon: "replay", title: "Review Later", detail: "Use Replay to check your decisions." },
    ],
  },
  events: {
    title: "Event Flow",
    subtitle: "Challenge under fixed conditions and compare progress.",
    items: [
      { icon: "events", title: "Pick Event", detail: "Each event has clear rules and AI setup." },
      { icon: "match", title: "Challenge", detail: "Run the same setup to build stable results." },
      { icon: "replay", title: "Compare", detail: "Save replay and inspect differences over time." },
    ],
  },
  replay: {
    title: "Replay In 3 Steps",
    subtitle: "Load transcript, scan highlights, verify outcome.",
    items: [
      { icon: "replay", title: "Load", detail: "Paste transcript or open share link." },
      { icon: "sparkle", title: "Scan", detail: "Jump through tactical highlight markers." },
      { icon: "rules", title: "Verify", detail: "Confirm match result and copy summary." },
    ],
  },
  stream: {
    title: "Stream Operations",
    subtitle: "Run host flow quickly with clear status checks.",
    items: [
      { icon: "events", title: "Select Event", detail: "Fix the event context before sharing links." },
      { icon: "stream", title: "Share Links", detail: "Open Match, Overlay, and Replay broadcast paths." },
      { icon: "match", title: "Control Votes", detail: "Monitor live turn and finalize vote safely." },
    ],
  },
};

