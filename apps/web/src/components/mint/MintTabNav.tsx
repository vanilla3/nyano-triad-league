import React from "react";
import { NavLink } from "react-router-dom";
import { MintIcon, type MintIconName } from "@/components/mint/icons/MintIcon";

export type MintTabItem = {
  to: string;
  label: string;
  icon?: MintIconName;
  exact?: boolean;
};

type MintTabNavProps = {
  items: readonly MintTabItem[];
  className?: string;
  ariaLabel?: string;
};

export function MintTabNav({
  items,
  className,
  ariaLabel = "Mint navigation tabs",
}: MintTabNavProps) {
  return (
    <nav className={["mint-tab-nav", className ?? ""].join(" ").trim()} aria-label={ariaLabel}>
      {items.map((item) => (
        <NavLink
          key={`${item.label}-${item.to}`}
          to={item.to}
          end={item.exact}
          className={({ isActive }) =>
            [
              "mint-pressable mint-hit mint-tab-nav__item",
              isActive ? "mint-tab-nav__item--active" : "",
            ].join(" ").trim()
          }
        >
          {item.icon ? <MintIcon name={item.icon} size={18} /> : null}
          <span>{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
