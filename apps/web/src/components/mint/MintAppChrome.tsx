import React from "react";
import { Link } from "react-router-dom";
import { GlassPanel } from "@/components/mint/GlassPanel";
import { MintIcon } from "@/components/mint/icons/MintIcon";
import { MintTabNav, type MintTabItem } from "@/components/mint/MintTabNav";
import { MintTitleText } from "@/components/mint/MintTypography";

type MintAppChromeProps = {
  tabs: readonly MintTabItem[];
};

export function MintAppChrome({ tabs }: MintAppChromeProps) {
  return (
    <header className="mint-app-chrome">
      <GlassPanel variant="panel" className="mint-app-chrome__brand">
        <Link to={tabs[0]?.to ?? "/"} className="mint-app-chrome__brand-link">
          <span className="mint-app-chrome__logo-mark" aria-hidden="true">
            <MintIcon name="sparkle" size={18} />
          </span>
          <MintTitleText as="h1" className="mint-app-chrome__logo-text">
            Nyano Triad League
          </MintTitleText>
        </Link>
      </GlassPanel>
      <MintTabNav items={tabs} className="mint-app-chrome__tabs" />
    </header>
  );
}
