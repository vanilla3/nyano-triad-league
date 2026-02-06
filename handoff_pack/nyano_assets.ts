/**
 * Nyano brand / art assets used across the UI.
 *
 * We ship the mascot image as a local asset (apps/web/public/*) so:
 * - the UI works offline / on private networks
 * - we avoid CORS / remote availability issues
 *
 * NOTE:
 * - We keep the original Arweave URL as a fallback / provenance reference.
 */

export const NYANO_IMAGE_PNG_URL = "/nyano.png";
export const NYANO_IMAGE_WEBP_URL = "/nyano.webp";

/** Original immutable source (reference / fallback) */
export const NYANO_IMAGE_ARWEAVE_URL =
  "https://arweave.net/ZsWmiEdKqybtYuiEPihyZ_ghylStw0oAhbY5sWJ8ci4";

/** Preferred default (if you need a single string) */
export const NYANO_IMAGE_URL = NYANO_IMAGE_WEBP_URL;
