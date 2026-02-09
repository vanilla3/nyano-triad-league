import React from "react";

export type ToastKind = "info" | "success" | "warn" | "error";

export type Toast = {
  id: string;
  kind: ToastKind;
  title: string;
  description?: string;
};

export type ToastApi = {
  show: (t: { kind: ToastKind; title: string; description?: string; timeoutMs?: number }) => void;
  info: (title: string, description?: string) => void;
  success: (title: string, description?: string) => void;
  warn: (title: string, description?: string) => void;
  error: (title: string, description?: string) => void;
};

const ToastContext = React.createContext<ToastApi | null>(null);

function genId(): string {
  // good enough for UI toasts
  return Math.random().toString(16).slice(2) + Date.now().toString(16);
}

export function ToastProvider(props: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<Toast[]>([]);

  const remove = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const show = React.useCallback(
    (t: { kind: ToastKind; title: string; description?: string; timeoutMs?: number }) => {
      const id = genId();
      const toast: Toast = { id, kind: t.kind, title: t.title, description: t.description };

      setToasts((prev) => {
        const next = [...prev, toast];
        // keep last 5
        return next.length > 5 ? next.slice(next.length - 5) : next;
      });

      const timeoutMs =
        typeof t.timeoutMs === "number" ? t.timeoutMs : t.kind === "error" ? 5200 : t.kind === "warn" ? 3600 : 2200;

      window.setTimeout(() => remove(id), timeoutMs);
    },
    [remove]
  );

  const api = React.useMemo<ToastApi>(
    () => ({
      show,
      info: (title, description) => show({ kind: "info", title, description }),
      success: (title, description) => show({ kind: "success", title, description }),
      warn: (title, description) => show({ kind: "warn", title, description }),
      error: (title, description) => show({ kind: "error", title, description }),
    }),
    [show]
  );

  return (
    <ToastContext.Provider value={api}>
      {props.children}

      <div className="toast-viewport" aria-live="polite" aria-relevant="additions">
        {toasts.map((t) => (
          <button
            key={t.id}
            className={["toast", `toast-${t.kind}`].join(" ")}
            onClick={() => remove(t.id)}
            title="Click to dismiss"
          >
            <div className="toast-title">
              {t.kind === "success" ? "✨ " : t.kind === "warn" ? "⚠️ " : t.kind === "error" ? "❗ " : "ℹ️ "}
              {t.title}
            </div>
            {t.description ? <div className="toast-desc">{t.description}</div> : null}
          </button>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components -- hook export alongside component is intentional
export function useToast(): ToastApi {
  const ctx = React.useContext(ToastContext);
  // allow usage without provider in tests / isolated renders (no-op)
  if (!ctx) {
    return {
      show: () => {},
      info: () => {},
      success: () => {},
      warn: () => {},
      error: () => {},
    };
  }
  return ctx;
}
