import React from "react";
import { Link, type LinkProps } from "react-router-dom";

type MintTone = "default" | "primary" | "soft" | "ghost";
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
  const classes = buildClasses(props);
  if ("to" in props && props.to !== undefined) {
    const { to, replace, state, target, rel, onClick, disabled, children } = props;
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
      >
        {children}
      </Link>
    );
  }

  const { type, children, tone: _tone, size: _size, fullWidth: _fullWidth, className: _className, ...buttonProps } = props;
  return (
    <button type={type ?? "button"} {...buttonProps} className={classes}>
      {children}
    </button>
  );
}
