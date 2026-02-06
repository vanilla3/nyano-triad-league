import React from "react";

export function Disclosure(props: { title: React.ReactNode; children: React.ReactNode; defaultOpen?: boolean }) {
  return (
    <details className="disclosure" open={Boolean(props.defaultOpen)}>
      <summary className="disclosure-summary">{props.title}</summary>
      <div className="disclosure-body">{props.children}</div>
    </details>
  );
}
