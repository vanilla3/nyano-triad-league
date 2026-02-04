import React from "react";
import { Link } from "react-router-dom";

import { CopyField } from "@/components/CopyField";
import { useToast } from "@/components/Toast";
import { EVENTS, getEventStatus, type EventV1 } from "@/lib/events";

function origin(): string {
  if (typeof window === "undefined") return "";
  return window.location.origin;
}

function pickDefaultEvent(events: EventV1[]): string {
  const now = Date.now();
  const active = events.find((e) => {
    const st = getEventStatus(e, now);
    return st === "active" || st === "always";
  });
  return (active ?? events[0])?.id ?? "";
}

export function StreamPage() {
  const toast = useToast();
  const [eventId, setEventId] = React.useState<string>(() => pickDefaultEvent(EVENTS));

  const e = React.useMemo(() => EVENTS.find((x) => x.id === eventId) ?? null, [eventId]);

  const matchUrl = e ? `${origin()}/match?event=${encodeURIComponent(e.id)}` : `${origin()}/match`;
  const overlayUrl = `${origin()}/overlay?controls=0`;
  const overlayTransparentUrl = `${origin()}/overlay?controls=0&bg=transparent`;

  const copy = async (label: string, v: string) => {
    await navigator.clipboard.writeText(v);
    toast.success("Copied", label);
  };

  return (
    <div className="space-y-6">
      <div className="card">
        <div className="card-hd">
          <div>
            <div className="text-lg font-semibold">🎥 Nyano Stream Studio</div>
            <div className="text-sm text-slate-600">
              Twitch配信に向けた「導線・見せ方・共有」を整えます。まずはOBS Overlayから。
            </div>
          </div>
        </div>

        <div className="card-bd space-y-4">
          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-white/70 px-4 py-3 shadow-sm">
              <div className="text-xs font-semibold text-slate-800">Step 1 · Feature an Event</div>
              <div className="mt-2 flex flex-col gap-2">
                <label className="text-xs text-slate-600">Event</label>
                <select
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                  value={eventId}
                  onChange={(ev) => setEventId(ev.target.value)}
                >
                  {EVENTS.map((x) => (
                    <option key={x.id} value={x.id}>
                      {x.title}
                    </option>
                  ))}
                </select>

                {e ? <div className="text-xs text-slate-500 mt-2">{e.description}</div> : null}

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <button className="btn btn-sm btn-primary" onClick={() => copy("Challenge link", matchUrl)}>
                    Copy challenge link
                  </button>
                  <a className="btn btn-sm no-underline" href={matchUrl} target="_blank" rel="noreferrer noopener">
                    Open
                  </a>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white/70 px-4 py-3 shadow-sm">
              <div className="text-xs font-semibold text-slate-800">Step 2 · Add OBS Overlay</div>
              <div className="mt-2 space-y-3">
                <CopyField label="Overlay URL (no controls)" value={overlayUrl} href={overlayUrl} />
                <CopyField label="Overlay URL (transparent)" value={overlayTransparentUrl} href={overlayTransparentUrl} />
                <div className="text-xs text-slate-500">
                  OBSのBrowser Sourceに貼るだけで、<span className="font-mono">/match</span>の進行が表示されます。
                </div>
              </div>
            </div>
          </div>

          <div className="callout callout-info">
            <div className="text-xs font-semibold">配信の“最短”の回し方（暫定）</div>
            <div className="mt-1 text-sm text-slate-800">
              視聴者には <span className="font-mono">challenge link</span> を配り、勝ったリプレイURLをチャットに貼ってもらいます。
              <br />
              配信側は <Link to="/replay">Replay</Link> で拾って、解説・採点・ランキング化へ。
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white/70 px-4 py-3 shadow-sm">
            <div className="text-xs font-semibold text-slate-800">Next · Twitch “live match” integration</div>
            <div className="mt-1 text-sm text-slate-700">
              次は「チャット→コマンド→試合進行」をつなぐ段階です。設計はドキュメントにまとめています。
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Link className="btn btn-sm no-underline" to="/match">
                Go to Match
              </Link>
              <button className="btn btn-sm" onClick={() => copy("Spec path", "docs/01_product/Nyano_Triad_League_TWITCH_STREAMING_SPEC_v1_ja.md")}>
                Copy spec path
              </button>
            </div>
          </div>

          <div className="text-xs text-slate-500">
            ※Overlayは運営がいなくても回るよう「ブラウザだけ」で成立する構成にしています（後でTwitch Bot/Serverを足す）。
          </div>
        </div>
      </div>
    </div>
  );
}
