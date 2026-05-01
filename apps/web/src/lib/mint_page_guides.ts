import type { MintIconName } from "@/components/mint/icons/MintIcon";

export type MintGuideItem = {
  icon: MintIconName;
  title: string;
  detail: string;
};

export type MintPageGuideSpec = {
  title: string;
  subtitle: string;
  items: readonly MintGuideItem[];
};

export type MintPageGuideKey = "arena" | "events" | "replay" | "stream";

export const MINT_PAGE_GUIDES: Record<MintPageGuideKey, MintPageGuideSpec> = {
  arena: {
    title: "アリーナの遊び方",
    subtitle: "強さを選んで、Nyano AIとの一戦にすぐ入れます。",
    items: [
      { icon: "rules", title: "強さを選ぶ", detail: "はじめてから真剣勝負まで、今の気分で選べます。" },
      { icon: "arena", title: "すぐ遊ぶ", detail: "ゲスト対戦でそのまま盤面へジャンプします。" },
      { icon: "replay", title: "あとで見る", detail: "リプレイで勝ち筋と分岐を振り返れます。" },
    ],
  },
  events: {
    title: "イベントの進め方",
    subtitle: "固定ルールの挑戦を重ねて、足跡とリプレイを残します。",
    items: [
      { icon: "events", title: "挑戦を選ぶ", detail: "イベントごとに相手とルールが決まっています。" },
      { icon: "match", title: "挑む", detail: "同じ条件で何度でもスコア更新を狙えます。" },
      { icon: "replay", title: "比べる", detail: "保存した足跡から勝ち筋を見つけます。" },
    ],
  },
  replay: {
    title: "リプレイの見方",
    subtitle: "対戦ログを読み込み、見どころを追い、結果を確認します。",
    items: [
      { icon: "replay", title: "読み込む", detail: "対戦ログを貼るか、共有リンクを開きます。" },
      { icon: "sparkle", title: "見どころへ飛ぶ", detail: "大きな反転や連鎖のマーカーをたどれます。" },
      { icon: "rules", title: "結果を確認", detail: "勝敗、ルール、対戦IDを確認できます。" },
    ],
  },
  stream: {
    title: "配信卓の流れ",
    subtitle: "イベントを選び、視聴者投票とオーバーレイをつなぎます。",
    items: [
      { icon: "events", title: "お題を決める", detail: "配信で扱うイベントを先に固定します。" },
      { icon: "stream", title: "画面をつなぐ", detail: "Match、Overlay、Replay のURLを用意します。" },
      { icon: "match", title: "投票を進める", detail: "ターンと投票結果を見ながら一手を確定します。" },
    ],
  },
};
