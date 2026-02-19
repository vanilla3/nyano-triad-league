import React from "react";
import { MatchDrawerMint, DrawerToggleButton } from "@/components/MatchDrawerMint";

export function MatchMintDrawerShell(input: {
  open: boolean;
  onOpen: () => void;
  onClose: () => void;
  children: React.ReactNode;
}): React.ReactElement {
  const {
    open,
    onOpen,
    onClose,
    children,
  } = input;

  return (
    <>
      {!open && <DrawerToggleButton onClick={onOpen} />}
      <MatchDrawerMint open={open} onClose={onClose}>
        {children}
      </MatchDrawerMint>
    </>
  );
}
