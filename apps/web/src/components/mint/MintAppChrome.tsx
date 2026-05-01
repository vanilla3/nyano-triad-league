import React from "react";
import { Link } from "react-router-dom";
import { GlassPanel } from "@/components/mint/GlassPanel";
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
            <img src="/assets/gen/nyano_ui_cameo_512_v1.webp" alt="" width={34} height={34} />
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
