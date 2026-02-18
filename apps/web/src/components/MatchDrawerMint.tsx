import React from "react";
import "../mint-theme/mint-theme.css";

export interface MatchDrawerMintProps {
  open: boolean;
  onClose: () => void;
  children?: React.ReactNode;
}

export function MatchDrawerMint({ open, onClose, children }: MatchDrawerMintProps) {
  const drawerRef = React.useRef<HTMLDivElement>(null);
  const returnFocusRef = React.useRef<HTMLElement | null>(null);

  React.useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  React.useEffect(() => {
    if (open) {
      returnFocusRef.current = document.activeElement as HTMLElement;
      const timer = window.setTimeout(() => drawerRef.current?.focus(), 100);
      return () => window.clearTimeout(timer);
    }
    returnFocusRef.current?.focus();
    return undefined;
  }, [open]);

  const handleCloseClick = React.useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    onClose();
  }, [onClose]);
  const handleClosePointerDown = React.useCallback((event: React.PointerEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    onClose();
  }, [onClose]);

  return (
    <>
      <div
        className={[
          "mint-drawer-backdrop",
          open && "mint-drawer-backdrop--open",
        ].filter(Boolean).join(" ")}
        onClick={onClose}
        aria-hidden="true"
      />

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
        onClick={(event) => event.stopPropagation()}
        onPointerDown={(event) => event.stopPropagation()}
      >
        <div className="mint-drawer__header">
          <span className="mint-drawer__title">Details</span>
          <button
            type="button"
            className="mint-drawer__close"
            onPointerDown={handleClosePointerDown}
            onClick={handleCloseClick}
            aria-label="Close drawer"
          >
            ×
          </button>
        </div>

        <div className="mint-drawer__body">
          {children}
        </div>
      </div>
    </>
  );
}

export function DrawerToggleButton({
  onClick,
  className = "",
}: {
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      className={["mint-drawer-toggle", className].filter(Boolean).join(" ")}
      onClick={onClick}
      aria-label="Open match details"
      title="Open details"
    >
      menu
    </button>
  );
}
