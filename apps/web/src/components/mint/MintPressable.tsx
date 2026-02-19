import React from "react";
import { Link, type LinkProps } from "react-router-dom";

type MintTone = "default" | "primary" | "soft" | "ghost" | "danger";
type MintSize = "sm" | "md" | "lg";

type MintPressableCommonProps = {
  tone?: MintTone;
  size?: MintSize;
  fullWidth?: boolean;
  className?: string;
  children: React.ReactNode;
};

type MintPressableAsButton = MintPressableCommonProps &
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    to?: undefined;
  };

type MintPressableAsLink = MintPressableCommonProps &
  Omit<LinkProps, "className" | "children"> & {
    to: LinkProps["to"];
    disabled?: boolean;
    children: React.ReactNode;
  };

export type MintPressableProps = MintPressableAsButton | MintPressableAsLink;

function toneClassName(tone: MintTone): string {
  if (tone === "primary") return "mint-ui-pressable--primary";
  if (tone === "soft") return "mint-ui-pressable--soft";
  if (tone === "ghost") return "mint-ui-pressable--ghost";
  if (tone === "danger") return "mint-ui-pressable--danger";
  return "mint-ui-pressable--default";
}

function sizeClassName(size: MintSize): string {
  if (size === "sm") return "mint-ui-pressable--sm";
  if (size === "lg") return "mint-ui-pressable--lg";
  return "mint-ui-pressable--md";
}

function buildClasses(props: MintPressableCommonProps): string {
  return [
    "mint-pressable mint-ui-pressable",
    toneClassName(props.tone ?? "default"),
    sizeClassName(props.size ?? "md"),
    props.fullWidth ? "mint-ui-pressable--full" : "",
    props.className ?? "",
  ].join(" ").trim();
}

export function MintPressable(props: MintPressableProps) {
  const [pressed, setPressed] = React.useState(false);
  const classes = buildClasses(props);
  const pressAttrs = {
    "data-pressed": pressed ? "true" : undefined,
    onPointerDown: () => setPressed(true),
    onPointerUp: () => setPressed(false),
    onPointerCancel: () => setPressed(false),
    onPointerLeave: () => setPressed(false),
    onKeyDown: (event: React.KeyboardEvent) => {
      if (event.key === " " || event.key === "Enter") setPressed(true);
    },
    onKeyUp: () => setPressed(false),
    onBlur: () => setPressed(false),
  } as const;

  if ("to" in props && props.to !== undefined) {
    const {
      to,
      replace,
      state,
      target,
      rel,
      onClick,
      disabled,
      onPointerDown,
      onPointerUp,
      onPointerCancel,
      onPointerLeave,
      onKeyDown,
      onKeyUp,
      onBlur,
      children,
    } = props;
    if (disabled) {
      return (
        <span aria-disabled="true" className={`${classes} mint-ui-pressable--disabled`}>
          {children}
        </span>
      );
    }
    return (
      <Link
        to={to}
        replace={replace}
        state={state}
        target={target}
        rel={rel}
        onClick={onClick}
        className={classes}
        data-pressed={pressAttrs["data-pressed"]}
        onPointerDown={(event) => {
          onPointerDown?.(event);
          pressAttrs.onPointerDown();
        }}
        onPointerUp={(event) => {
          onPointerUp?.(event);
          pressAttrs.onPointerUp();
        }}
        onPointerCancel={(event) => {
          onPointerCancel?.(event);
          pressAttrs.onPointerCancel();
        }}
        onPointerLeave={(event) => {
          onPointerLeave?.(event);
          pressAttrs.onPointerLeave();
        }}
        onKeyDown={(event) => {
          onKeyDown?.(event);
          pressAttrs.onKeyDown(event);
        }}
        onKeyUp={(event) => {
          onKeyUp?.(event);
          pressAttrs.onKeyUp();
        }}
        onBlur={(event) => {
          onBlur?.(event);
          pressAttrs.onBlur();
        }}
      >
        {children}
      </Link>
    );
  }

  const {
    type,
    children,
    tone: _tone,
    size: _size,
    fullWidth: _fullWidth,
    className: _className,
    onPointerDown,
    onPointerUp,
    onPointerCancel,
    onPointerLeave,
    onKeyDown,
    onKeyUp,
    onBlur,
    ...buttonProps
  } = props;
  return (
    <button
      type={type ?? "button"}
      {...buttonProps}
      className={classes}
      data-pressed={pressAttrs["data-pressed"]}
      onPointerDown={(event) => {
        onPointerDown?.(event);
        pressAttrs.onPointerDown();
      }}
      onPointerUp={(event) => {
        onPointerUp?.(event);
        pressAttrs.onPointerUp();
      }}
      onPointerCancel={(event) => {
        onPointerCancel?.(event);
        pressAttrs.onPointerCancel();
      }}
      onPointerLeave={(event) => {
        onPointerLeave?.(event);
        pressAttrs.onPointerLeave();
      }}
      onKeyDown={(event) => {
        onKeyDown?.(event);
        pressAttrs.onKeyDown(event);
      }}
      onKeyUp={(event) => {
        onKeyUp?.(event);
        pressAttrs.onKeyUp();
      }}
      onBlur={(event) => {
        onBlur?.(event);
        pressAttrs.onBlur();
      }}
    >
      {children}
    </button>
  );
}
