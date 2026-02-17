import React from "react";
import { GlassPanel } from "@/components/mint/GlassPanel";
import { MintIcon } from "@/components/mint/icons/MintIcon";
import type { MintPageGuideSpec } from "@/lib/mint_page_guides";

type MintPageGuideProps = {
  spec: MintPageGuideSpec;
  className?: string;
};

export function MintPageGuide({ spec, className }: MintPageGuideProps) {
  return (
    <GlassPanel variant="panel" className={["mint-page-guide", className ?? ""].join(" ").trim()}>
      <div className="mint-page-guide__head">
        <h2 className="mint-page-guide__title">{spec.title}</h2>
        <p className="mint-page-guide__subtitle">{spec.subtitle}</p>
      </div>
      <div className="mint-page-guide__grid">
        {spec.items.map((item) => (
          <GlassPanel key={item.title} variant="card" className="mint-page-guide__item">
            <MintIcon name={item.icon} size={20} />
            <div className="mint-page-guide__item-copy">
              <span className="mint-page-guide__item-title">{item.title}</span>
              <span className="mint-page-guide__item-detail">{item.detail}</span>
            </div>
          </GlassPanel>
        ))}
      </div>
    </GlassPanel>
  );
}

