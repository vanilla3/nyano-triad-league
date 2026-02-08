import React from "react";
import { Link } from "react-router-dom";
import { NyanoAvatar } from "@/components/NyanoAvatar";
import type { ExpressionName } from "@/lib/expression_map";

type Props = {
  /** NyanoAvatar expression to display. @default "calm" */
  expression?: ExpressionName;
  /** Main message title. */
  title: string;
  /** Optional descriptive text below the title. */
  description?: string;
  /** Optional call-to-action link button. */
  action?: { label: string; to: string };
  className?: string;
};

/**
 * EmptyState — friendly placeholder shown when a section has no content.
 *
 * Features a NyanoAvatar with an appropriate expression, a title,
 * optional description, and an optional CTA link button.
 */
export function EmptyState({
  expression = "calm",
  title,
  description,
  action,
  className = "",
}: Props) {
  return (
    <div
      className={[
        "flex flex-col items-center justify-center gap-4 py-12 px-8",
        "bg-surface-50 rounded-2xl border border-surface-200",
        "animate-fade-in",
        className,
      ].join(" ")}
    >
      <NyanoAvatar expression={expression} size={96} className="shadow-soft-sm" />

      <div className="text-center max-w-sm">
        <h3 className="text-lg font-display font-bold text-surface-700">{title}</h3>
        {description && <p className="mt-1 text-sm text-surface-500">{description}</p>}
      </div>

      {action && (
        <Link to={action.to} className="btn btn-primary mt-2">
          {action.label}
        </Link>
      )}
    </div>
  );
}
