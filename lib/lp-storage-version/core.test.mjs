// Tests for the stored-file version key. IDENTICAL IN EVERY BRAND REPO, like core.ts next to it.
// Run: node --test lib/lp-storage-version/core.test.mjs   (built-in Node test runner, no packages)
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { etagOf, startEntryEtag, storageEtag, versionedUrl } from './core.ts'

const FILE = 'https://x.supabase.co/storage/v1/object/public/landing-pages/sas/index.html'

test('etagOf: quoted, weak and bare ETags; exact name only; odd values rejected', () => {
  const objs = [{ name: 'index.html', metadata: { eTag: '"9e100dff8f707cc3f8eb0b2d018a5945"' } }, { name: 'index.html.bak', metadata: { eTag: '"aaaaaaaaaa"' } }]
  assert.equal(etagOf(objs, 'index.html'), '9e100dff8f707cc3f8eb0b2d018a5945')
  assert.equal(etagOf([{ name: 'a.js', metadata: { eTag: 'W/"abcdef12-3"' } }], 'a.js'), 'abcdef12-3')
  assert.equal(etagOf([{ name: 'a.js', metadata: { eTag: 'abcdef1234' } }], 'a.js'), 'abcdef1234')
  assert.equal(etagOf(objs, 'missing.html'), null)
  for (const eTag of ['"x"', '"has space here"', '"a&b=c<d>"', 42, null, undefined]) assert.equal(etagOf([{ name: 'a', metadata: { eTag } }], 'a'), null)
  assert.equal(etagOf([{ name: 'a', metadata: null }], 'a'), null)
  assert.equal(etagOf(null, 'a'), null)
})

test('versionedUrl: adds v= only with an etag', () => {
  assert.equal(versionedUrl(FILE, 'abc12345'), FILE + '?v=abc12345')
  assert.equal(versionedUrl(FILE + '?a=1', 'abc12345'), FILE + '?a=1&v=abc12345')
  assert.equal(versionedUrl(FILE, null), FILE)
})

const fake = (folders, calls = [], fail = false) => ({
  storage: { from: bucket => ({ list: async (dir, opts) => {
    calls.push({ bucket, dir, search: opts.search })
    if (fail) throw new Error('boom')
    return folders[dir] ? { data: folders[dir].filter(o => !opts.search || o.name.includes(opts.search)), error: null } : { data: null, error: { message: 'no' } }
  } }) },
})
const tag = (name, e) => ({ name, metadata: { eTag: `"${e}"` } })

test('storageEtag: lists the file\'s own folder in the landing-pages bucket', async () => {
  const calls = []
  const c = fake({ 'sas/js': [tag('app.js', 'aaaaaaaa1'), tag('app.js.map', 'bbbbbbbb2')] }, calls)
  assert.equal(await storageEtag(c, 'sas', 'js/app.js'), 'aaaaaaaa1')
  assert.deepEqual(calls, [{ bucket: 'landing-pages', dir: 'sas/js', search: 'app.js' }])
})

test('startEntryEtag: top folder listed up front; subfolder entries and misses get a targeted lookup', async () => {
  const calls = []
  const c = fake({ sas: [tag('index.html', 'cccccccc3')], 'sas/v2': [tag('index.html', 'dddddddd4')] }, calls)
  const look = startEntryEtag(c, 'sas')
  assert.deepEqual(calls, [{ bucket: 'landing-pages', dir: 'sas', search: undefined }])
  assert.equal(await look('index.html'), 'cccccccc3')
  assert.equal(calls.length, 1)
  assert.equal(await look('v2/index.html'), 'dddddddd4')
  assert.equal(await look('gone.html'), null)
})

test('any failure is null, never a throw', async () => {
  assert.equal(await storageEtag(fake({}, [], true), 'sas', 'index.html'), null)
  assert.equal(await startEntryEtag(fake({}, [], true), 'sas')('index.html'), null)
  assert.equal(await storageEtag(fake({}), 'sas', 'index.html'), null)
})
