import React from "react";

export type MintIconName =
  | "arena"
  | "decks"
  | "replay"
  | "stream"
  | "match"
  | "playground"
  | "events"
  | "settings"
  | "rules"
  | "save"
  | "sparkle"
  | "start";

type MintIconProps = {
  name: MintIconName;
  size?: number;
  className?: string;
  title?: string;
};

function iconPath(name: MintIconName): React.ReactNode {
  switch (name) {
    case "arena":
    case "match":
      return (
        <>
          <path d="M8 4L3.5 8.5M16 4l4.5 4.5M9 5.5l6 13M15 5.5l-6 13" />
          <path d="M2.8 9.2L5.2 6.8M18.8 6.8l2.4 2.4M7.2 18.5h2.6M14.2 18.5h2.6" />
        </>
      );
    case "decks":
      return (
        <>
          <rect x="4" y="7" width="11" height="13" rx="2.5" />
          <rect x="9" y="4" width="11" height="13" rx="2.5" />
        </>
      );
    case "replay":
      return (
        <>
          <rect x="3" y="5" width="18" height="14" rx="3" />
          <path d="M10 10.2l5 2.8-5 2.8z" />
        </>
      );
    case "stream":
      return (
        <>
          <rect x="3" y="4.5" width="18" height="13.5" rx="3" />
          <path d="M12 18v2.5M8 21h8M8 2.8l4 2.4 4-2.4" />
        </>
      );
    case "playground":
      return (
        <>
          <path d="M6.5 20.5h11M8 20.5V9l4-4 4 4v11.5" />
          <path d="M9.8 13.5h4.4M9.8 16.5h4.4" />
        </>
      );
    case "events":
      return (
        <>
          <path d="M12 3l2.2 4.5L19 8.2l-3.6 3.4.9 4.9-4.3-2.2-4.3 2.2.9-4.9L5 8.2l4.8-.7z" />
        </>
      );
    case "settings":
      return (
        <>
          <circle cx="12" cy="12" r="3.2" />
          <path d="M12 2.8v2.6M12 18.6v2.6M21.2 12h-2.6M5.4 12H2.8M18.3 5.7l-1.8 1.8M7.5 16.5l-1.8 1.8M18.3 18.3l-1.8-1.8M7.5 7.5L5.7 5.7" />
        </>
      );
    case "rules":
      return (
        <>
          <path d="M6 4.5h9a3 3 0 013 3v12H9a3 3 0 01-3-3z" />
          <path d="M9 7.2h7M9 10.2h7M9 13.2h5" />
        </>
      );
    case "save":
      return (
        <>
          <path d="M5 3.8h11l3 3v13.4H5z" />
          <path d="M8 3.8v5h7v-5M8 20.2v-6.2h8v6.2" />
        </>
      );
    case "start":
      return (
        <>
          <circle cx="12" cy="12" r="8.5" />
          <path d="M11 8.5l4.8 3.5L11 15.5z" />
        </>
      );
    case "sparkle":
      return (
        <>
          <path d="M12 4.5l1.7 4.1L18 10.3l-4.3 1.7L12 16.1l-1.7-4.1L6 10.3l4.3-1.7z" />
        </>
      );
    default:
      return null;
  }
}

export function MintIcon({ name, size = 22, className, title }: MintIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={["mint-icon", className ?? ""].join(" ").trim()}
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      role={title ? "img" : "presentation"}
      aria-hidden={title ? undefined : true}
    >
      {title ? <title>{title}</title> : null}
      {iconPath(name)}
    </svg>
  );
}
