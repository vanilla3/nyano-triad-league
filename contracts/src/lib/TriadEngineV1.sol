// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../interfaces/INyanoPeace.sol";
import "./TranscriptV1.sol";

/// @notice Core match resolver v1 (ETH-only, deterministic).
/// @dev Supports ONLY the "Core + Tactics" subset (for now):
///      - Triad edge comparisons
///      - Janken tie-breaker (Paper>Rock>Scissors>Paper)
///      - No power tie-break on exact ties (same hand)
///      - Combo (momentum/domination/fever) as next-card bonuses
///      - Warning mark debuff (-1 all edges) for one opponent turn (max 3 uses each)
///
/// It does NOT implement Synergy (Trait effects), Formation bonuses, or Season rule modules yet.
library TriadEngineV1 {
    uint8 internal constant EMPTY = 0;
    uint8 internal constant A = 1;
    uint8 internal constant B = 2;

    uint8 internal constant NONE_U8 = 255;

    // v1 constants (align with TS defaults for the "core+tactics" ruleset)
    uint8 internal constant MAX_WARNING_USES = 3;

    // Combo thresholds
    uint8 internal constant MOMENTUM_AT = 3;   // comboCount==3 => +1 next card
    uint8 internal constant DOMINATION_AT = 4; // comboCount==4 => +2 next card
    uint8 internal constant FEVER_AT = 5;      // comboCount>=5 => ignore warning mark for next card

    struct Cell {
        uint8 owner; // EMPTY/A/B
        uint8 up;
        uint8 right;
        uint8 left;
        uint8 down;
        uint8 hand;  // 0..2
        uint32 power; // atk+matk+agi
    }

    struct Result {
        address winner;   // address(0) for draw
        uint8 tilesA;
        uint8 tilesB;
        uint64 tieScoreA; // sum of power for controlled tiles
        uint64 tieScoreB;
    }

    function resolve(INyanoPeace nyano, TranscriptV1.Data calldata t) internal view returns (Result memory r) {
        Cell[9] memory board;

        // 5-bit masks for used cards (avoid bool[5] arrays)
        uint8 usedMaskA = 0;
        uint8 usedMaskB = 0;

        // warning marks
        uint8 markA = NONE_U8;
        uint8 markB = NONE_U8;
        uint8 usesA = 0;
        uint8 usesB = 0;

        // combo next-card effects
        uint8 nextBonusA = 0;
        uint8 nextBonusB = 0;
        bool ignoreWarningA = false;
        bool ignoreWarningB = false;

        for (uint8 turn = 0; turn < 9; turn++) {
            bool isATurn = (turn & 1) == 0;
            uint8 cur = isATurn ? A : B;

            uint8 m = uint8(t.moves[turn]);
            uint8 cell = m >> 4;
            uint8 cardIndex = m & 0x0f;

            require(cell < 9, "Engine: cell");
            require(cardIndex < 5, "Engine: cardIndex");
            require(board[cell].owner == EMPTY, "Engine: occupied");

            uint8 bit = uint8(1 << cardIndex);
            if (isATurn) {
                require((usedMaskA & bit) == 0, "Engine: card reused A");
                usedMaskA |= bit;
            } else {
                require((usedMaskB & bit) == 0, "Engine: card reused B");
                usedMaskB |= bit;
            }

            // Read token attributes on-demand (keeps stack small; we can optimize later)
            uint256 tokenId = isATurn ? t.deckA[cardIndex] : t.deckB[cardIndex];
            (uint8 eUp, uint8 eRight, uint8 eLeft, uint8 eDown) = nyano.getTriad(tokenId);
            uint8 h = nyano.getJankenHand(tokenId);
            uint32 p = _power(nyano, tokenId);

            // Apply next-card combo bonus
            uint8 bonus = isATurn ? nextBonusA : nextBonusB;
            if (bonus != 0) {
                eUp = _cap10(uint8(eUp + bonus));
                eRight = _cap10(uint8(eRight + bonus));
                eLeft = _cap10(uint8(eLeft + bonus));
                eDown = _cap10(uint8(eDown + bonus));
                if (isATurn) nextBonusA = 0; else nextBonusB = 0;
            }

            // Apply warning mark debuff if stepping on opponent mark (unless ignored)
            uint8 mark = isATurn ? markB : markA;
            bool ignore = isATurn ? ignoreWarningA : ignoreWarningB;

            if (ignore) {
                if (isATurn) ignoreWarningA = false; else ignoreWarningB = false;
            } else if (mark != NONE_U8 && cell == mark) {
                eUp = _dec1(eUp);
                eRight = _dec1(eRight);
                eLeft = _dec1(eLeft);
                eDown = _dec1(eDown);
            }

            // Place card
            board[cell] = Cell({owner: cur, up: eUp, right: eRight, left: eLeft, down: eDown, hand: h, power: p});

            // Combo resolution with BFS queue (flip chain)
            uint8 flipCount = 0;
            uint8[9] memory queue;
            uint8 qh = 0;
            uint8 qt = 0;
            queue[qt++] = cell;

            while (qh < qt) {
                uint8 c = queue[qh++];
                uint8 oc = board[c].owner;

                // Up neighbor
                if (c >= 3) {
                    uint8 n = uint8(c - 3);
                    if (board[n].owner != EMPTY && board[n].owner != oc) {
                        if (_wins(board[c].up, board[n].down, board[c].hand, board[n].hand)) {
                            board[n].owner = oc;
                            queue[qt++] = n;
                            flipCount++;
                        }
                    }
                }
                // Down neighbor
                if (c <= 5) {
                    uint8 n = uint8(c + 3);
                    if (board[n].owner != EMPTY && board[n].owner != oc) {
                        if (_wins(board[c].down, board[n].up, board[c].hand, board[n].hand)) {
                            board[n].owner = oc;
                            queue[qt++] = n;
                            flipCount++;
                        }
                    }
                }
                // Left neighbor
                if ((c % 3) != 0) {
                    uint8 n = uint8(c - 1);
                    if (board[n].owner != EMPTY && board[n].owner != oc) {
                        if (_wins(board[c].left, board[n].right, board[c].hand, board[n].hand)) {
                            board[n].owner = oc;
                            queue[qt++] = n;
                            flipCount++;
                        }
                    }
                }
                // Right neighbor
                if ((c % 3) != 2) {
                    uint8 n = uint8(c + 1);
                    if (board[n].owner != EMPTY && board[n].owner != oc) {
                        if (_wins(board[c].right, board[n].left, board[c].hand, board[n].hand)) {
                            board[n].owner = oc;
                            queue[qt++] = n;
                            flipCount++;
                        }
                    }
                }
            }

            // compute comboCount and set next-card effects for current player
            uint8 comboCount = uint8(1 + flipCount);
            if (comboCount == MOMENTUM_AT) {
                if (isATurn) nextBonusA = 1; else nextBonusB = 1;
            } else if (comboCount == DOMINATION_AT) {
                if (isATurn) nextBonusA = 2; else nextBonusB = 2;
            } else if (comboCount >= FEVER_AT) {
                if (isATurn) ignoreWarningA = true; else ignoreWarningB = true;
            }

            // Expire opponent mark after it had one chance to trigger
            if (isATurn) markB = NONE_U8;
            else markA = NONE_U8;

            // Place warning mark for current player (affects opponent next turn)
            uint8 wm = uint8(t.warningMarks[turn]);
            if (wm != NONE_U8) {
                require(wm < 9, "Engine: wm cell");
                require(board[wm].owner == EMPTY, "Engine: wm occupied");
                if (isATurn) {
                    require(usesA < MAX_WARNING_USES, "Engine: wm uses A");
                    usesA++;
                    markA = wm;
                } else {
                    require(usesB < MAX_WARNING_USES, "Engine: wm uses B");
                    usesB++;
                    markB = wm;
                }
            }

            // Earth boost edges are not supported yet on-chain (must be NONE)
            require(uint8(t.earthBoostEdges[turn]) == NONE_U8, "Engine: earth not supported");
        }

        // Count tiles + tie scores
        uint8 tilesA = 0;
        uint8 tilesB = 0;
        uint64 tieA = 0;
        uint64 tieB = 0;
        for (uint8 i = 0; i < 9; i++) {
            if (board[i].owner == A) {
                tilesA++;
                tieA += board[i].power;
            } else if (board[i].owner == B) {
                tilesB++;
                tieB += board[i].power;
            }
        }

        address winner = address(0);
        if (tilesA > tilesB) winner = t.playerA;
        else if (tilesB > tilesA) winner = t.playerB;
        else if (tieA > tieB) winner = t.playerA;
        else if (tieB > tieA) winner = t.playerB;

        r = Result({winner: winner, tilesA: tilesA, tilesB: tilesB, tieScoreA: tieA, tieScoreB: tieB});
    }

    // ---------- helpers ----------

    function _power(INyanoPeace nyano, uint256 tokenId) private view returns (uint32) {
        (, uint16 atk, uint16 matk, , , uint16 agi) = nyano.getCombatStats(tokenId);
        return uint32(atk) + uint32(matk) + uint32(agi);
    }

    function _cap10(uint8 x) private pure returns (uint8) {
        return x > 10 ? 10 : x;
    }

    function _dec1(uint8 x) private pure returns (uint8) {
        return x == 0 ? 0 : uint8(x - 1);
    }

    function _wins(uint8 aEdge, uint8 bEdge, uint8 aHand, uint8 bHand)
        private
        pure
        returns (bool)
    {
        if (aEdge > bEdge) return true;
        if (aEdge < bEdge) return false;

        // tie -> janken
        if (_jankenWins(aHand, bHand)) return true;
        if (_jankenWins(bHand, aHand)) return false;

        // same hand -> cannot win (no flip)
        return false;
    }

    function _jankenWins(uint8 a, uint8 b) private pure returns (bool) {
        // 0=Rock, 1=Paper, 2=Scissors
        return (a == 0 && b == 2) || (a == 1 && b == 0) || (a == 2 && b == 1);
    }
}
