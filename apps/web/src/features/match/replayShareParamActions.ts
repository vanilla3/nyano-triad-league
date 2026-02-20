import { decodeReplaySharePayload, stripReplayShareParams } from "@/lib/replay_share_params";

export function resolveReplayRetryPayload(searchParams: URLSearchParams) {
  return decodeReplaySharePayload(searchParams);
}

export function resolveReplayClearShareParamsMutation(searchParams: URLSearchParams): URLSearchParams | null {
  const next = stripReplayShareParams(searchParams);
  if (next.toString() === searchParams.toString()) return null;
  return next;
}
