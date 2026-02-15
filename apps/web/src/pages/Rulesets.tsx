import React from "react";
import { Link, useSearchParams } from "react-router-dom";

import OFFICIAL_RAW from "@root/rulesets/official_onchain_rulesets.json";
import { useToast } from "@/components/Toast";
import { writeClipboardText } from "@/lib/clipboard";
import {
  buildMatchRulesetUrl,
  getRecommendedRulesetKeys,
  getRulesetMeta,
  resolveRulesetKeyById,
} from "@/lib/ruleset_discovery";
import { isValidRulesetKey, type RulesetKey } from "@/lib/ruleset_registry";

type OfficialRuleset = {
  name: string;
  engineId: number;
  rulesetId: `0x${string}`;
  configHash: `0x${string}`;
  uri: string;
};

interface OfficialRulesetsJson {
  rulesets: OfficialRuleset[];
  notes: string[];
}

type RulesetListRow = OfficialRuleset & {
  key: RulesetKey | null;
};

const OFFICIAL = OFFICIAL_RAW as OfficialRulesetsJson;
const RECOMMENDED_KEYS = getRecommendedRulesetKeys();
const RECOMMENDED_INDEX = new Map<RulesetKey, number>(
  RECOMMENDED_KEYS.map((key, index) => [key, index]),
);

function safeLower(value: string): string {
  return value.toLowerCase();
}

function buildRowSearchText(row: RulesetListRow): string {
  const meta = row.key ? getRulesetMeta(row.key) : null;
  return [
    row.name,
    String(row.engineId),
    row.rulesetId,
    row.configHash,
    row.uri,
    row.key ?? "",
    meta?.title ?? "",
    meta?.summary ?? "",
    ...(meta?.tags ?? []),
  ]
    .join(" ")
    .toLowerCase();
}

function sortByRecommendedOrder(a: RulesetListRow, b: RulesetListRow): number {
  if (!a.key || !b.key) return 0;
  const aIndex = RECOMMENDED_INDEX.get(a.key) ?? Number.MAX_SAFE_INTEGER;
  const bIndex = RECOMMENDED_INDEX.get(b.key) ?? Number.MAX_SAFE_INTEGER;
  return aIndex - bIndex;
}

export function RulesetsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const q = searchParams.get("q") ?? "";
  const selectedParam = searchParams.get("rk");
  const selectedRulesetKey: RulesetKey | null =
    selectedParam && isValidRulesetKey(selectedParam) ? selectedParam : null;

  const toast = useToast();

  const rows = React.useMemo<RulesetListRow[]>(
    () =>
      OFFICIAL.rulesets.map((row) => ({
        ...row,
        key: resolveRulesetKeyById(row.rulesetId),
      })),
    [],
  );

  const filtered = React.useMemo(() => {
    const query = safeLower(q.trim());
    if (!query) return rows;
    return rows.filter((row) => buildRowSearchText(row).includes(query));
  }, [rows, q]);

  const featuredRows = React.useMemo(() => {
    const fromFiltered = filtered
      .filter((row) => row.key && getRulesetMeta(row.key).recommended)
      .sort(sortByRecommendedOrder);
    if (fromFiltered.length > 0) return fromFiltered.slice(0, 3);

    return rows
      .filter((row) => row.key && getRulesetMeta(row.key).recommended)
      .sort(sortByRecommendedOrder)
      .slice(0, 3);
  }, [filtered, rows]);

  const selectedSummary = selectedRulesetKey
    ? getRulesetMeta(selectedRulesetKey).summary
    : "Select a ruleset to show a quick summary.";

  const notes = Array.isArray(OFFICIAL.notes) ? OFFICIAL.notes : [];

  const setParam = React.useCallback(
    (key: string, value: string | null) => {
      const next = new URLSearchParams(searchParams);
      if (!value) next.delete(key);
      else next.set(key, value);
      setSearchParams(next, { replace: true });
    },
    [searchParams, setSearchParams],
  );

  const copyWithToast = React.useCallback(
    async (label: string, text: string) => {
      const ok = await writeClipboardText(text);
      if (ok) toast.success("Copied", label);
      else toast.warn("Copy failed", label);
    },
    [toast],
  );

  return (
    <div className="grid gap-6">
      <section className="card">
        <div className="card-hd">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-base font-semibold">Ruleset Registry</div>
              <div className="text-xs text-slate-500">
                Find recommended presets quickly and jump directly into a match.
              </div>
            </div>
            <div
              className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600"
              data-testid="rulesets-selected-summary"
            >
              <div className="font-medium text-slate-900">Selected summary</div>
              <div className="mt-1">{selectedSummary}</div>
            </div>
          </div>
        </div>

        <div className="card-bd grid gap-4">
          <div className="grid gap-2 md:grid-cols-3">
            <div className="grid gap-2 md:col-span-2">
              <div className="text-xs font-medium text-slate-600">Filter</div>
              <input
                className="input"
                value={q}
                onChange={(event) => setParam("q", event.target.value || null)}
                placeholder="name / rulesetId / key"
                aria-label="Ruleset filter"
                data-testid="rulesets-filter-input"
              />
            </div>
            <div className="grid gap-2">
              <div className="text-xs font-medium text-slate-600">Count</div>
              <div className="callout callout-muted text-sm">
                <div className="flex items-center justify-between">
                  <span>shown</span>
                  <span className="font-medium">{filtered.length}</span>
                </div>
                <div className="mt-1 flex items-center justify-between text-xs text-slate-500">
                  <span>total</span>
                  <span>{rows.length}</span>
                </div>
              </div>
            </div>
          </div>

          {notes.length > 0 ? (
            <ul className="list-disc pl-6 text-sm text-slate-700">
              {notes.map((note, index) => (
                <li key={index}>{note}</li>
              ))}
            </ul>
          ) : null}
        </div>
      </section>

      {featuredRows.length > 0 ? (
        <section className="card" data-testid="rulesets-recommended-section">
          <div className="card-hd flex items-center justify-between">
            <div className="text-base font-semibold">おすすめ</div>
            <div className="text-xs text-slate-500">Pick one and start immediately</div>
          </div>
          <div className="card-bd grid gap-3 md:grid-cols-3">
            {featuredRows.map((row) => {
              if (!row.key) return null;
              const meta = getRulesetMeta(row.key);
              const active = selectedRulesetKey === row.key;
              return (
                <article
                  key={row.rulesetId}
                  className={[
                    "rounded-xl border p-3",
                    active
                      ? "border-emerald-300 bg-emerald-50"
                      : "border-slate-200 bg-white",
                  ].join(" ")}
                  data-testid={`rulesets-recommended-card-${row.key}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-sm font-semibold text-slate-900">{meta.title}</div>
                      <div className="mt-1 text-xs text-slate-600">{meta.summary}</div>
                    </div>
                    {active ? (
                      <span className="rounded-full border border-emerald-300 bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                        Selected
                      </span>
                    ) : null}
                  </div>

                  <div className="mt-2 flex flex-wrap gap-1">
                    {meta.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] text-slate-600"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <Link
                      className="btn btn-sm no-underline"
                      to={buildMatchRulesetUrl(row.key)}
                      data-testid={`rulesets-recommended-play-cta-${row.key}`}
                    >
                      このルールで対戦
                    </Link>
                    <button
                      className="btn btn-sm"
                      onClick={() => setParam("rk", row.key)}
                      data-testid={`rulesets-recommended-select-${row.key}`}
                    >
                      Select
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      ) : null}

      <section className="card">
        <div className="card-hd flex items-center justify-between">
          <div className="text-base font-semibold">Ruleset List</div>
          <div className="text-xs text-slate-500" data-testid="rulesets-list-count">{filtered.length} items</div>
        </div>

        <div className="card-bd overflow-x-auto">
          <table className="w-full text-left text-sm" data-testid="rulesets-list-table">
            <thead className="text-xs text-slate-500">
              <tr>
                <th className="py-2 pr-3">name</th>
                <th className="py-2 pr-3">summary</th>
                <th className="py-2 pr-3">rulesetId</th>
                <th className="py-2 pr-3">configHash</th>
                <th className="py-2 pr-3">actions</th>
              </tr>
            </thead>
            <tbody className="align-top">
              {filtered.map((row) => {
                const meta = row.key ? getRulesetMeta(row.key) : null;
                const active = row.key && selectedRulesetKey === row.key;

                return (
                  <tr
                    key={row.rulesetId}
                    className={[
                      "border-t border-slate-100",
                      active ? "bg-emerald-50/50" : "hover:bg-white/60",
                    ].join(" ")}
                  >
                    <td className="py-3 pr-3">
                      <div className="font-medium">{row.name}</div>
                      <div className="mt-1 text-xs text-slate-500">
                        engine #{row.engineId}
                        {row.key ? ` ・ key=${row.key}` : " ・ key=unmapped"}
                      </div>
                    </td>

                    <td className="py-3 pr-3">
                      <div className="text-xs text-slate-700">
                        {meta?.summary ?? "No local summary for this rulesetId."}
                      </div>
                    </td>

                    <td className="py-3 pr-3">
                      <code className="text-xs whitespace-nowrap">{row.rulesetId}</code>
                    </td>

                    <td className="py-3 pr-3">
                      <code className="text-xs whitespace-nowrap">{row.configHash}</code>
                    </td>

                    <td className="py-3 pr-3">
                      <div className="flex flex-wrap items-center gap-2">
                        {row.key ? (
                          <Link
                            className="btn btn-sm no-underline"
                            to={buildMatchRulesetUrl(row.key)}
                            data-testid={`rulesets-list-play-cta-${row.key}`}
                          >
                            このルールで対戦
                          </Link>
                        ) : (
                          <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-[10px] text-slate-500">
                            Match link unavailable
                          </span>
                        )}
                        {row.key ? (
                          <button
                            className="btn btn-sm"
                            onClick={() => setParam("rk", row.key)}
                            data-testid={`rulesets-list-select-${row.key}`}
                          >
                            Select
                          </button>
                        ) : null}
                        <button
                          className="btn btn-sm"
                          onClick={() => copyWithToast("rulesetId", row.rulesetId)}
                        >
                          Copy rulesetId
                        </button>
                        <button
                          className="btn btn-sm"
                          onClick={() => copyWithToast("configHash", row.configHash)}
                        >
                          Copy configHash
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {filtered.length === 0 ? (
            <div className="mt-4 text-sm text-slate-600">No rulesets found.</div>
          ) : null}
        </div>
      </section>
    </div>
  );
}
