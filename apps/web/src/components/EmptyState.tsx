import React from "react";
import { Link } from "react-router-dom";
import { NyanoAvatar } from "@/components/NyanoAvatar";
import type { ExpressionName } from "@/lib/expression_map";

type EmptyStateVariant = "empty" | "error" | "loading";

type Props = {
  /** Visual variant. @default "empty" */
  variant?: EmptyStateVariant;
  /** NyanoAvatar expression to display. @default derived from variant */
  expression?: ExpressionName;
  /** Main message title. */
  title: string;
  /** Optional descriptive text below the title. */
  description?: string;
  /** Optional call-to-action link button. */
  action?: { label: string; to: string };
  /** Optional retry callback (used with error variant). */
  onRetry?: () => void;
  className?: string;
};

const VARIANT_DEFAULTS: Record<EmptyStateVariant, { expression: ExpressionName; borderClass: string }> = {
  empty: { expression: "calm", borderClass: "border-surface-200" },
  error: { expression: "sadTears", borderClass: "border-red-300" },
  loading: { expression: "calm", borderClass: "border-surface-200" },
};

/**
 * EmptyState — friendly placeholder shown when a section has no content,
 * encounters an error, or is loading.
 *
 * Features a NyanoAvatar with an appropriate expression, a title,
 * optional description, and an optional CTA link button or retry action.
 */
export function EmptyState({
  variant = "empty",
  expression,
  title,
  description,
  action,
  onRetry,
  className = "",
}: Props) {
  const defaults = VARIANT_DEFAULTS[variant];
  const expr = expression ?? defaults.expression;

  return (
    <div
      className={[
        "flex flex-col items-center justify-center gap-4 py-12 px-8",
        "bg-surface-50 rounded-2xl border",
        defaults.borderClass,
        "animate-fade-in",
        className,
      ].join(" ")}
    >
      {variant === "loading" ? (
        <div className="relative">
          <NyanoAvatar expression={expr} size={96} className="shadow-soft-sm opacity-60" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-surface-200 border-t-nyano-400" />
          </div>
        </div>
      ) : (
        <NyanoAvatar expression={expr} size={96} className="shadow-soft-sm" />
      )}

      <div className="text-center max-w-sm">
        <h3 className={[
          "text-lg font-display font-bold",
          variant === "error" ? "text-red-700" : "text-surface-700",
        ].join(" ")}>{title}</h3>
        {description && <p className="mt-1 text-sm text-surface-500">{description}</p>}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {action && (
          <Link to={action.to} className="btn btn-primary mt-2">
            {action.label}
          </Link>
        )}
        {onRetry && (
          <button className="btn mt-2" onClick={onRetry}>
            Retry
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * React ErrorBoundary using EmptyState for error display.
 */
type ErrorBoundaryProps = {
  children: React.ReactNode;
  fallbackTitle?: string;
};

type ErrorBoundaryState = {
  hasError: boolean;
  error: Error | null;
};

export class AppErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  override render() {
    if (this.state.hasError) {
      return (
        <EmptyState
          variant="error"
          title={this.props.fallbackTitle ?? "Something went wrong"}
          description={this.state.error?.message}
          onRetry={() => this.setState({ hasError: false, error: null })}
        />
      );
    }
    return this.props.children;
  }
}
