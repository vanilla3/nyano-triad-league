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
      <div className="font-medium">RPC connection failed</div>
      <div className="mt-1 text-xs text-red-600">{error}</div>
      <div className="mt-2 flex flex-wrap gap-2">
        <Link to="/nyano" className="btn btn-sm no-underline">
          RPC Settings
        </Link>
        <span className="text-xs text-red-500">
          Check your RPC settings or try again later. Public RPCs may be rate-limited.
        </span>
      </div>
    </div>
  );
}

export function UnmintedTokenAlert({ error, className = "" }: ErrorAlertProps) {
  return (
    <div className={`rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 ${className}`}>
      <div className="font-medium">Token not minted</div>
      <div className="mt-1 text-xs text-amber-600">{error}</div>
      <div className="mt-2 text-xs text-amber-500">
        This tokenId does not exist on-chain. Try using the Game Index (Fast mode) for demo play, or check the tokenId.
      </div>
    </div>
  );
}

export function GenericErrorAlert({ error, className = "" }: ErrorAlertProps) {
  return (
    <div className={`rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 ${className}`}>
      <div className="font-medium">Error</div>
      <div className="mt-1 text-xs text-red-600">{error}</div>
    </div>
  );
}
