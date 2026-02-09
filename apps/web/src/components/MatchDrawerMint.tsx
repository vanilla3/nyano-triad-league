import React from "react";
import "../mint-theme/mint-theme.css";

/* ═══════════════════════════════════════════════════════════════════════════
   MatchDrawerMint — Slide-out Drawer (NIN-UX-040, F-1)

   Right-slide drawer (desktop) / bottom sheet (mobile) for advanced info:
   - TurnLog, AI analysis, flipTrace details, share buttons
   - Frosted glass + backdrop blur
   - ESC key / backdrop click to close
   ═══════════════════════════════════════════════════════════════════════════ */

export interface MatchDrawerMintProps {
  open: boolean;
  onClose: () => void;
  children?: React.ReactNode;
}

export function MatchDrawerMint({ open, onClose, children }: MatchDrawerMintProps) {
  const drawerRef = React.useRef<HTMLDivElement>(null);

  // ESC key handler
  React.useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  // Focus trap: return focus on close
  const returnFocusRef = React.useRef<HTMLElement | null>(null);
  React.useEffect(() => {
    if (open) {
      returnFocusRef.current = document.activeElement as HTMLElement;
      // Focus drawer for keyboard accessibility
      setTimeout(() => drawerRef.current?.focus(), 100);
    } else {
      returnFocusRef.current?.focus();
    }
  }, [open]);

  return (
    <>
      {/* Backdrop */}
      <div
        className={[
          "mint-drawer-backdrop",
          open && "mint-drawer-backdrop--open",
        ].filter(Boolean).join(" ")}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer panel */}
      <div
        ref={drawerRef}
        className={[
          "mint-drawer",
          open && "mint-drawer--open",
        ].filter(Boolean).join(" ")}
        role="dialog"
        aria-modal="true"
        aria-label="Match details"
        tabIndex={-1}
      >
        {/* Header */}
        <div className="mint-drawer__header">
          <span className="mint-drawer__title">詳細情報</span>
          <button
            className="mint-drawer__close"
            onClick={onClose}
            aria-label="Close drawer"
          >
            ✕
          </button>
        </div>

        {/* Scrollable content */}
        <div className="mint-drawer__body">
          {children}
        </div>
      </div>
    </>
  );
}

/* ── Drawer Toggle Button ── */

export function DrawerToggleButton({
  onClick,
  className = "",
}: {
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      className={["mint-drawer-toggle", className].filter(Boolean).join(" ")}
      onClick={onClick}
      aria-label="Open match details"
      title="詳細情報を開く"
    >
      ☰
    </button>
  );
}
