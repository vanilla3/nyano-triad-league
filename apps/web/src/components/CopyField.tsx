import React from "react";
import { useToast } from "./Toast";

function shortenMiddle(s: string, head = 10, tail = 8): string {
  if (s.length <= head + tail + 3) return s;
  return s.slice(0, head) + "…" + s.slice(s.length - tail);
}

export function CopyField(props: {
  label: string;
  value: string;
  copyValue?: string;
  href?: string;
  monospace?: boolean;
}) {
  const toast = useToast();
  const [expanded, setExpanded] = React.useState(false);

  const v = props.value ?? "";
  const copyText = props.copyValue ?? v;

  const isLong = v.length > 42;

  const display = expanded ? v : shortenMiddle(v, 14, 10);

  const doCopy = async () => {
    await navigator.clipboard.writeText(copyText);
    toast.success("Copied", props.label);
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white/70 px-4 py-3 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[11px] font-medium text-slate-500">{props.label}</div>
          <div
            className={[
              "mt-1 break-all",
              props.monospace === false ? "text-sm text-slate-800" : "font-mono text-xs text-slate-800",
            ].join(" ")}
            title={v}
          >
            {display}
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {isLong ? (
            <button className="btn btn-sm" onClick={() => setExpanded((x) => !x)}>
              {expanded ? "Fold" : "Expand"}
            </button>
          ) : null}

          <button className="btn btn-sm" onClick={doCopy}>
            Copy
          </button>

          {props.href ? (
            <a className="btn btn-sm no-underline" href={props.href} target="_blank" rel="noreferrer noopener">
              Open
            </a>
          ) : null}
        </div>
      </div>
    </div>
  );
}
