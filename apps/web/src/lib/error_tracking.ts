import { errorMessage } from "./errorMessage";

const STORAGE_KEY = "nytl.error_tracking.events_v1";
const DEFAULT_MAX_EVENTS = 50;
const MAX_ALLOWED_EVENTS = 500;

export type ErrorTrackingSink = "local" | "console" | "remote";

export interface ErrorTrackingConfig {
  sinks: ErrorTrackingSink[];
  endpoint?: string;
  release?: string;
  maxEvents: number;
}

export interface RuntimeErrorEventV1 {
  version: 1;
  kind: "error" | "unhandledrejection";
  message: string;
  stack?: string;
  source?: string;
  line?: number;
  column?: number;
  route: string;
  userAgent: string;
  atIso: string;
  release?: string;
}

export interface RuntimeErrorEventInput {
  kind: "error" | "unhandledrejection";
  message: string;
  stack?: string;
  source?: string;
  line?: number;
  column?: number;
  route?: string;
  userAgent?: string;
  atMs?: number;
}

interface TrackOptions {
  config?: Partial<ErrorTrackingConfig>;
  storage?: Pick<Storage, "getItem" | "setItem" | "removeItem"> | null;
  logger?: Pick<Console, "error">;
  sendRemote?: (endpoint: string, payload: RuntimeErrorEventV1) => void;
}

let installedCleanup: (() => void) | null = null;

function getStorage(): Pick<Storage, "getItem" | "setItem" | "removeItem"> | null {
  try {
    if (typeof localStorage !== "undefined") return localStorage;
  } catch {
    // ignore
  }
  return null;
}

function envValue(key: string): string | undefined {
  const env = (import.meta as unknown as { env?: Record<string, unknown> }).env;
  const raw = env?.[key];
  return typeof raw === "string" ? raw : undefined;
}

function clampMaxEvents(value: number): number {
  if (!Number.isFinite(value)) return DEFAULT_MAX_EVENTS;
  const n = Math.floor(value);
  if (n < 1) return 1;
  if (n > MAX_ALLOWED_EVENTS) return MAX_ALLOWED_EVENTS;
  return n;
}

function defaultRoute(): string {
  if (typeof window === "undefined") return "unknown";
  try {
    return `${window.location.pathname}${window.location.search}${window.location.hash}`;
  } catch {
    return "unknown";
  }
}

function defaultUserAgent(): string {
  if (typeof navigator === "undefined") return "unknown";
  return navigator.userAgent || "unknown";
}

function parseStoredEvents(raw: string | null): RuntimeErrorEventV1[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const out: RuntimeErrorEventV1[] = [];
    for (const item of parsed) {
      if (typeof item !== "object" || item === null) continue;
      const x = item as Partial<RuntimeErrorEventV1>;
      if (
        x.version !== 1 ||
        (x.kind !== "error" && x.kind !== "unhandledrejection") ||
        typeof x.message !== "string" ||
        typeof x.route !== "string" ||
        typeof x.userAgent !== "string" ||
        typeof x.atIso !== "string"
      ) {
        continue;
      }
      out.push({
        version: 1,
        kind: x.kind,
        message: x.message,
        stack: typeof x.stack === "string" ? x.stack : undefined,
        source: typeof x.source === "string" ? x.source : undefined,
        line: typeof x.line === "number" && Number.isFinite(x.line) ? x.line : undefined,
        column: typeof x.column === "number" && Number.isFinite(x.column) ? x.column : undefined,
        route: x.route,
        userAgent: x.userAgent,
        atIso: x.atIso,
        release: typeof x.release === "string" ? x.release : undefined,
      });
    }
    return out;
  } catch {
    return [];
  }
}

export function parseErrorTrackingSinks(raw: string | undefined): ErrorTrackingSink[] {
  const mode = (raw ?? "local").trim().toLowerCase();
  if (mode === "" || mode === "local") return ["local"];
  if (mode === "off" || mode === "none" || mode === "0") return [];

  const parts = mode.split(/[,+\s]+/).filter(Boolean);
  const sinks = new Set<ErrorTrackingSink>();
  for (const part of parts) {
    if (part === "all") {
      sinks.add("local");
      sinks.add("console");
      sinks.add("remote");
      continue;
    }
    if (part === "local" || part === "storage") {
      sinks.add("local");
      continue;
    }
    if (part === "console") {
      sinks.add("console");
      continue;
    }
    if (part === "remote" || part === "sentry") {
      sinks.add("remote");
      continue;
    }
  }

  if (sinks.size === 0) return ["local"];
  return Array.from(sinks);
}

export function resolveErrorTrackingConfig(overrides: Partial<ErrorTrackingConfig> = {}): ErrorTrackingConfig {
  const maxFromEnv = Number(envValue("VITE_ERROR_TRACKING_MAX_EVENTS"));
  const maxEvents = clampMaxEvents(
    overrides.maxEvents ?? (Number.isFinite(maxFromEnv) ? maxFromEnv : DEFAULT_MAX_EVENTS),
  );

  const sinks =
    overrides.sinks ??
    parseErrorTrackingSinks(envValue("VITE_ERROR_TRACKING_MODE"));

  return {
    sinks,
    endpoint: overrides.endpoint ?? envValue("VITE_ERROR_TRACKING_ENDPOINT"),
    release: overrides.release ?? envValue("VITE_APP_RELEASE"),
    maxEvents,
  };
}

export function readRuntimeErrorEvents(
  limit: number = DEFAULT_MAX_EVENTS,
  storage: Pick<Storage, "getItem"> | null = getStorage(),
): RuntimeErrorEventV1[] {
  if (!storage) return [];
  const events = parseStoredEvents(storage.getItem(STORAGE_KEY));
  const clipped = clampMaxEvents(limit);
  return events.slice(-clipped);
}

export function clearRuntimeErrorEvents(
  storage: Pick<Storage, "removeItem"> | null = getStorage(),
): void {
  if (!storage) return;
  storage.removeItem(STORAGE_KEY);
}

export function buildRuntimeErrorEventV1(
  input: RuntimeErrorEventInput,
  config: Partial<ErrorTrackingConfig> = {},
): RuntimeErrorEventV1 {
  return {
    version: 1,
    kind: input.kind,
    message: input.message,
    stack: input.stack,
    source: input.source,
    line: typeof input.line === "number" && Number.isFinite(input.line) ? input.line : undefined,
    column: typeof input.column === "number" && Number.isFinite(input.column) ? input.column : undefined,
    route: input.route ?? defaultRoute(),
    userAgent: input.userAgent ?? defaultUserAgent(),
    atIso: new Date(input.atMs ?? Date.now()).toISOString(),
    release: config.release,
  };
}

function writeStoredEvents(
  events: RuntimeErrorEventV1[],
  maxEvents: number,
  storage: Pick<Storage, "setItem">,
): void {
  const clipped = events.slice(-clampMaxEvents(maxEvents));
  storage.setItem(STORAGE_KEY, JSON.stringify(clipped));
}

function sendRemoteEvent(endpoint: string, payload: RuntimeErrorEventV1): void {
  const body = JSON.stringify(payload);
  try {
    if (typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
      const blob = new Blob([body], { type: "application/json" });
      navigator.sendBeacon(endpoint, blob);
      return;
    }
  } catch {
    // ignore and fallback to fetch
  }

  try {
    if (typeof fetch === "function") {
      void fetch(endpoint, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body,
        keepalive: true,
      }).catch(() => undefined);
    }
  } catch {
    // ignore
  }
}

export function trackRuntimeErrorEvent(
  input: RuntimeErrorEventInput,
  options: TrackOptions = {},
): RuntimeErrorEventV1 {
  const config = resolveErrorTrackingConfig(options.config);
  const event = buildRuntimeErrorEventV1(input, config);
  const storage = options.storage ?? getStorage();
  const logger = options.logger ?? console;
  const remoteSender = options.sendRemote ?? sendRemoteEvent;

  if (config.sinks.includes("local") && storage) {
    const existing = readRuntimeErrorEvents(config.maxEvents, storage);
    existing.push(event);
    writeStoredEvents(existing, config.maxEvents, storage);
  }

  if (config.sinks.includes("console") && typeof logger?.error === "function") {
    logger.error(`[nytl-error] ${event.kind}: ${event.message}`, event);
  }

  if (config.sinks.includes("remote") && config.endpoint) {
    remoteSender(config.endpoint, event);
  }

  return event;
}

export function installGlobalErrorTracking(overrides: Partial<ErrorTrackingConfig> = {}): () => void {
  if (typeof window === "undefined") return () => undefined;
  if (installedCleanup) return installedCleanup;

  const config = resolveErrorTrackingConfig(overrides);
  if (config.sinks.length === 0) return () => undefined;

  const onError = (event: ErrorEvent) => {
    const message = event.message || errorMessage(event.error);
    trackRuntimeErrorEvent(
      {
        kind: "error",
        message,
        stack: event.error instanceof Error ? event.error.stack : undefined,
        source: event.filename || undefined,
        line: event.lineno || undefined,
        column: event.colno || undefined,
      },
      { config },
    );
  };

  const onUnhandledRejection = (event: PromiseRejectionEvent) => {
    const reason = event.reason;
    trackRuntimeErrorEvent(
      {
        kind: "unhandledrejection",
        message: errorMessage(reason),
        stack: reason instanceof Error ? reason.stack : undefined,
      },
      { config },
    );
  };

  window.addEventListener("error", onError);
  window.addEventListener("unhandledrejection", onUnhandledRejection);

  installedCleanup = () => {
    window.removeEventListener("error", onError);
    window.removeEventListener("unhandledrejection", onUnhandledRejection);
    installedCleanup = null;
  };

  return installedCleanup;
}
