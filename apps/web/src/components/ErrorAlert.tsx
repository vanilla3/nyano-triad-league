import React from "react";
import { Link } from "react-router-dom";

function looksLikeRpcError(message: string): boolean {
  const m = message.toLowerCase();
  return (
    m.includes("failed to fetch") ||
    m.includes("http request failed") ||
    m.includes("rpc接続") ||
    m.includes("cors") ||
    m.includes("429") ||
    m.includes("rate limit") ||
    m.includes("timeout")
  );
}

function looksLikeUnmintedError(message: string): boolean {
  const m = message.toLowerCase();
  return m.includes("not minted") || m.includes("unminted") || m.includes("exists=false") || m.includes("notminted");
}

type ErrorAlertProps = {
  error: string | null | undefined;
  className?: string;
};

export function ErrorAlert({ error, className = "" }: ErrorAlertProps) {
  if (!error) return null;

  if (looksLikeRpcError(error)) return <RpcErrorAlert error={error} className={className} />;
  if (looksLikeUnmintedError(error)) return <UnmintedTokenAlert error={error} className={className} />;
  return <GenericErrorAlert error={error} className={className} />;
}

export function RpcErrorAlert({ error, className = "" }: ErrorAlertProps) {
  return (
    <div className={`rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 ${className}`}>
      <div className="font-medium">RPC接続に失敗しました</div>
      <div className="mt-1 text-xs text-red-600">{error}</div>
      <div className="mt-2 flex flex-wrap gap-2">
        <Link to="/nyano" className="btn btn-sm no-underline">
          RPC設定
        </Link>
        <span className="text-xs text-red-500">
          RPC設定を確認するか、時間を置いて再試行してください。公開RPCは混雑で失敗する場合があります。
        </span>
      </div>
    </div>
  );
}

export function UnmintedTokenAlert({ error, className = "" }: ErrorAlertProps) {
  return (
    <div className={`rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 ${className}`}>
      <div className="font-medium">トークンが未ミントです</div>
      <div className="mt-1 text-xs text-amber-600">{error}</div>
      <div className="mt-2 text-xs text-amber-500">
        この tokenId はオンチェーン上に存在しません。デモ対戦にはカードインデックス（高速読み込み）を使うか、tokenId を確認してください。
      </div>
    </div>
  );
}

export function GenericErrorAlert({ error, className = "" }: ErrorAlertProps) {
  return (
    <div className={`rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 ${className}`}>
      <div className="font-medium">エラー</div>
      <div className="mt-1 text-xs text-red-600">{error}</div>
    </div>
  );
}
