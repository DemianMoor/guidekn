// Version key for the stored landing-page files a brand site fetches at serve time (the entry HTML and the page's own JS).
//
// IDENTICAL IN EVERY BRAND REPO (gdkn_code, lz_code, fy_code, casc_code): copy the whole lib/lp-storage-version/ folder,
// never edit one copy alone. No imports, so core.test.mjs runs it under plain `node --test`.
//
// Stored files carry cache-control: max-age=86400 and the Supabase Storage CDN honours it; Smart CDN's
// invalidate-on-overwrite measurably does not happen (2026-11-03: GuideKin sas served stale 20+ min after a save). So the
// fetch address carries the file's ETag, read from the Storage LIST API (a database read, current the moment a write lands,
// whoever wrote it): a save gives a new ETag, so a new address and a CDN miss; an unchanged file keeps its address and stays
// cached. The bytes fetched are the stored file either way, so the served page is unchanged.
//
// Any failure (LIST error, file not listed, odd ETag) gives `null`, and the caller fetches the plain address exactly as before.

export type ListedObject = { name: string; metadata?: { eTag?: unknown } | null }
type ListResult = { data: ListedObject[] | null; error: unknown }
// The slice of a supabase-js client this needs.
export type StorageLister = { storage: { from(bucket: string): { list(dir: string, opts: { limit: number; search?: string }): Promise<ListResult> } } }

const BUCKET = 'landing-pages'
const ETAG = /^(?:W\/)?"?([A-Za-z0-9-]{8,64})"?$/

// `"9e10…"` / `W/"9e10…"` → `9e10…`; null for anything else, so nothing odd ever reaches a URL.
export function etagOf(objects: ListedObject[] | null | undefined, name: string): string | null {
  const raw = objects?.find(o => o.name === name)?.metadata?.eTag
  const m = typeof raw === 'string' ? raw.match(ETAG) : null
  return m ? m[1] : null
}

export function versionedUrl(url: string, etag: string | null): string {
  return etag ? `${url}${url.includes('?') ? '&' : '?'}v=${etag}` : url
}

const split = (path: string) => {
  const at = path.lastIndexOf('/')
  return { dir: path.slice(0, at), name: path.slice(at + 1) }
}

async function list(client: StorageLister, dir: string, search?: string): Promise<ListedObject[] | null> {
  try {
    const { data, error } = await client.storage.from(BUCKET).list(dir, { limit: 1000, ...(search ? { search } : {}) })
    return error ? null : data
  } catch {
    return null
  }
}

// ETag of `<slug>/<file>` (file may sit in a subfolder).
export async function storageEtag(client: StorageLister, slug: string, file: string): Promise<string | null> {
  const { dir, name } = split(`${slug}/${file}`)
  return etagOf(await list(client, dir, name), name)
}

// For the page route, where the entry file's name only arrives with the landing_pages row: starts listing the page's top
// folder now, so it runs alongside that query, and returns the lookup to call once the name is known.
export function startEntryEtag(client: StorageLister, slug: string): (file: string) => Promise<string | null> {
  const top = list(client, slug)
  return async file => (file.includes('/') ? storageEtag(client, slug, file) : etagOf(await top, file) ?? storageEtag(client, slug, file))
}
