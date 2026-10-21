// Tests for the site-wide sub_id guarantee. IDENTICAL IN EVERY BRAND REPO, like core.ts next to it.
// Run: node --test lib/subid-guarantee/core.test.mjs   (built-in Node test runner, no packages)
import { test } from 'node:test'
import assert from 'node:assert/strict'
import vm from 'node:vm'
import {
  TRACKER_HOSTS, backstopScript, isPassthroughPath, pickSubIds, resolveTrackingHost, rewriteTrackingUrls,
  routeScriptsThroughPassthrough,
} from './core.ts'

const OWN = { domain: 'sms.blogcascade.com', source: 'blogcascade' }
const SUBS = [['sub_id1', 'test1'], ['sub_id3', 'test3']]
const rw = (text, subIds = SUBS, cfg = OWN) => rewriteTrackingUrls(text, { ...cfg, subIds })

test('every tracker host is swapped to ours, source + sub_ids added to aliases', () => {
  for (const h of TRACKER_HOSTS) {
    assert.equal(rw(`<a href="https://${h}/abc">`), '<a href="https://sms.blogcascade.com/abc?source=blogcascade&sub_id1=test1&sub_id3=test3">')
  }
  assert.equal(rw('<a href="http://GO.FITSYOU.NET/fy1">'), '<a href="https://sms.blogcascade.com/fy1?source=blogcascade&sub_id1=test1&sub_id3=test3">')
})

test('lookalike and unrelated hosts are untouched', () => {
  const t = '<a href="https://go.gdkn.org.evil.com/abc"></a><a href="https://admin.gdkn.org/abc"></a><a href="https://example.com/abc"></a>'
  assert.equal(rw(t), t)
})

test('unquoted attributes and inline scripts are covered', () => {
  assert.equal(rw('<a href=https://go.gdkn.org/fp14599 class=btn>'), '<a href=https://sms.blogcascade.com/fp14599?source=blogcascade&sub_id1=test1&sub_id3=test3 class=btn>')
  assert.equal(rw(`<script>var CONFIG={ADVERTISER_URL:'https://go.gdkn.org/sas42169'};</script>`),
    `<script>var CONFIG={ADVERTISER_URL:'https://sms.blogcascade.com/sas42169?source=blogcascade&sub_id1=test1&sub_id3=test3'};</script>`)
})

test('&amp; queries get &amp; separators', () => {
  assert.equal(rw('<a href="https://go.gdkn.org/lld?utm_campaign=x&amp;ref=1">'),
    '<a href="https://sms.blogcascade.com/lld?utm_campaign=x&amp;ref=1&amp;source=blogcascade&amp;sub_id1=test1&amp;sub_id3=test3">')
})

test('values already on the URL win; existing source is kept', () => {
  assert.equal(rw('<a href="https://go.gdkn.org/a?source=partner&sub_id1=keep">'),
    '<a href="https://sms.blogcascade.com/a?source=partner&sub_id1=keep&sub_id3=test3">')
})

test('a URL being concatenated onto keeps a trailing separator', () => {
  assert.equal(rw(`<script>x='https://go.gdkn.org/a?'+qs; y='https://go.gdkn.org/b?k=v&'+qs</script>`),
    `<script>x='https://sms.blogcascade.com/a?source=blogcascade&sub_id1=test1&sub_id3=test3&'+qs; y='https://sms.blogcascade.com/b?k=v&source=blogcascade&sub_id1=test1&sub_id3=test3&'+qs</script>`)
})

test('the fragment stays last', () => {
  assert.equal(rw('<a href="https://go.gdkn.org/a#top">'), '<a href="https://sms.blogcascade.com/a?source=blogcascade&sub_id1=test1&sub_id3=test3#top">')
})

test('visit-script template and multi-segment paths are host-swapped only', () => {
  const visit = `<template id="keitaro-direct"><script>R_PATH:'https://go.gdkn.org/ZttBSV',P_PATH:'https://go.gdkn.org/e752675/postback';a.src='https://go.gdkn.org/js/k.min.js'</script><noscript><img src='https://go.gdkn.org/ZttBSV'/></noscript></template>`
  assert.equal(rw(visit), visit.replaceAll('go.gdkn.org', 'sms.blogcascade.com'))
  assert.equal(rw('<script src="https://go.gdkn.org/js/k.min.js"></script>'), '<script src="https://sms.blogcascade.com/js/k.min.js"></script>')
})

test('no sub_id in the request: exactly the old behaviour', () => {
  assert.equal(rw('<a href="https://go.gdkn.org/a">', []), '<a href="https://sms.blogcascade.com/a?source=blogcascade">')
  assert.equal(rw('<a href="https://go.gdkn.org/a">', []), rewriteTrackingUrls('<a href="https://go.gdkn.org/a">', OWN))
})

test('no usable tracking domain: text returned unchanged', () => {
  const t = '<a href="https://go.gdkn.org/a">'
  assert.equal(rewriteTrackingUrls(t, { domain: null, source: 'x', subIds: SUBS }), t)
  assert.equal(rewriteTrackingUrls(t, { domain: 'bad host!', source: 'x', subIds: SUBS }), t)
  assert.equal(resolveTrackingHost('https://sms.blogcascade.com/'), 'sms.blogcascade.com')
})

test('pickSubIds: whitelist, first wins, empty and oversized dropped, cap of 30', () => {
  const p = new URLSearchParams('sub_id1=a&sub_id1=b&sub_id3=&utm_source=x&sub_id_4=c&SUB_ID5=d&sub_idXXXXXXXXX=e&sub_id9=' + 'x'.repeat(257))
  assert.deepEqual(pickSubIds(p), [['sub_id1', 'a'], ['sub_id_4', 'c']])
  const many = new URLSearchParams(Array.from({ length: 40 }, (_, i) => `sub_id${i}=v`).join('&'))
  assert.equal(pickSubIds(many).length, 30)
})

test('hostile values cannot leave the string or attribute they are written into', () => {
  const evil = [['sub_id1', `'";</script><script>alert(1)</script>`], ['sub_id2', `a b&c=d#e(f)!*`]]
  const out = rw(`<script>u='https://go.gdkn.org/a'</script><a href="https://go.gdkn.org/a">`, evil)
  assert.match(out, /sub_id1=%27%22%3B%3C%2Fscript%3E%3Cscript%3Ealert%281%29%3C%2Fscript%3E/)
  assert.match(out, /sub_id2=a%20b%26c%3Dd%23e%28f%29%21%2A/)
  assert.equal(out.split('</script>').length, 2)
  assert.doesNotMatch(out, /['"<>()]alert/)
})

test('page .js: tracker rewrite applies and new URL( / url( survive untouched', () => {
  const js = `var ORDER_URL = "https://go.gdkn.org/hrm15170";\nvar u = new URL(location.href);\nel.style.background = "url(img/a.png)";`
  assert.equal(rw(js),
    `var ORDER_URL = "https://sms.blogcascade.com/hrm15170?source=blogcascade&sub_id1=test1&sub_id3=test3";\nvar u = new URL(location.href);\nel.style.background = "url(img/a.png)";`)
})

test('isPassthroughPath: plain .js/.mjs inside the folder only', () => {
  assert.ok(isPassthroughPath(['script.js']))
  assert.ok(isPassthroughPath(['js', 'app-16a6726e.js']))
  assert.ok(isPassthroughPath(['_next', 'static', 'chunks', '0b2cs2n_63d5g.mjs']))
  for (const bad of [[], ['..', 'x.js'], ['.', 'x.js'], ['a%2Fb.js'], ['a\\b.js'], ['x.css'], ['x.js.map'], ['a', '', 'b.js'], ['x'.repeat(301) + '.js']]) {
    assert.equal(isPassthroughPath(bad), false, JSON.stringify(bad))
  }
})

test('routeScriptsThroughPassthrough: own .js only, sub_ids carried, other srcs kept', () => {
  const base = 'https://abc.supabase.co/storage/v1/object/public/landing-pages'
  const html = `<script src="${base}/hmm/script.js"></script><script defer src='${base}/hmm/js/a.js?v=2'></script>` +
    `<script src="${base}/other/x.js"></script><script src="https://cdn.example.com/lib.js"></script><img src="${base}/hmm/a.js">`
  assert.equal(routeScriptsThroughPassthrough(html, { storageBase: base, slug: 'hmm', lpPath: '/bcf/', subIds: [['sub_id1', 'a b']] }),
    `<script src="/bcf/hmm/~js/script.js?sub_id1=a%20b"></script><script defer src='/bcf/hmm/~js/js/a.js?v=2&sub_id1=a%20b'></script>` +
    `<script src="${base}/other/x.js"></script><script src="https://cdn.example.com/lib.js"></script><img src="${base}/hmm/a.js">`)
  assert.equal(routeScriptsThroughPassthrough(`<script src="${base}/hmm/script.js"></script>`, { storageBase: base, slug: 'hmm', lpPath: '/lp/', subIds: [] }),
    '<script src="/lp/hmm/~js/script.js"></script>')
})

// Runs the backstop in a minimal fake DOM and records what it does to each kind of navigation.
function runBackstop(search, { navigationApi = true } = {}) {
  const listeners = {}, navListeners = [], opened = [], assigned = [], navigated = []
  class HTMLFormElement { submit() { this.submitted = true } }
  const location = { href: `https://blogcascade.com/bcf/x${search}`, search, assign: u => assigned.push(u) }
  const win = {
    location, URL, URLSearchParams, HTMLFormElement, encodeURIComponent,
    document: { addEventListener: (t, fn) => { listeners[t] = fn }, createElement: () => ({}) },
    open: (...a) => { opened.push(a); return 'win' },
  }
  win.window = win; win.top = win
  if (navigationApi) win.navigation = { addEventListener: (t, fn) => navListeners.push(fn), navigate: (u, o) => navigated.push([u, o]) }
  vm.runInNewContext(backstopScript('sms.blogcascade.com').replace(/^<script>|<\/script>$/g, ''), win)
  const anchor = href => { const a = { href, getAttribute: () => a.href, setAttribute: (_, v) => { a.href = v }, closest: () => a }; return a }
  const navigate = (url, extra = {}) => {
    let prevented = false
    const e = { cancelable: true, hashChange: false, downloadRequest: null, formData: null, navigationType: 'push', destination: { url }, preventDefault: () => { prevented = true }, ...extra }
    navListeners.forEach(fn => fn(e))
    return prevented
  }
  return { win, listeners, navListeners, opened, assigned, navigated, anchor, navigate, HTMLFormElement }
}

test('backstop: click on a tracker link fills missing sub_ids, nothing else', () => {
  const b = runBackstop('?sub_id1=test1&sub_id3=test3&utm_source=x')
  const a = b.anchor('https://sms.blogcascade.com/sas42169?source=blogcascade&sub_id1=keep')
  b.listeners.click({ target: a })
  assert.equal(a.href, 'https://sms.blogcascade.com/sas42169?source=blogcascade&sub_id1=keep&sub_id3=test3')
  for (const href of ['https://example.com/x', '#q2', 'javascript:void(0)', 'https://sms.blogcascade.com/js/k.min.js', '/bcf/x?step=2']) {
    const n = b.anchor(href); b.listeners.click({ target: n }); assert.equal(n.href, href)
  }
})

test('backstop: window.open and form.submit on tracker URLs are filled', () => {
  const b = runBackstop('?sub_id1=test1')
  b.win.open('https://go.gdkn.org/abc', '_blank')
  b.win.open('https://example.com/x')
  assert.deepEqual(b.opened, [['https://go.gdkn.org/abc?sub_id1=test1', '_blank'], ['https://example.com/x']])
  const f = new b.HTMLFormElement()
  let action = 'https://sms.blogcascade.com/abc?x=1'
  Object.assign(f, { getAttribute: k => (k === 'action' ? action : 'post'), setAttribute: (_, v) => { action = v } })
  f.submit()
  assert.equal(action, 'https://sms.blogcascade.com/abc?x=1&sub_id1=test1')
  assert.ok(f.submitted)
})

test('backstop: script navigation to a tracker is re-issued once with a marker; others untouched', () => {
  const b = runBackstop('?sub_id1=test1&sub_id3=test3')
  assert.equal(b.navigate('https://sms.blogcascade.com/sas42169?source=blogcascade'), true)
  // JSON round-trip: the options object comes from the vm realm, so its prototype differs from ours.
  assert.deepEqual(JSON.parse(JSON.stringify(b.navigated)), [['https://sms.blogcascade.com/sas42169?source=blogcascade&sub_id1=test1&sub_id3=test3', { info: 'subid-backstop', history: 'auto' }]])
  // The re-issued navigation (marker) and an already-complete URL are never cancelled: no loop.
  assert.equal(b.navigate(b.navigated[0][0], { info: 'subid-backstop' }), false)
  assert.equal(b.navigate(b.navigated[0][0]), false)
  // Never cancelled: non-tracker, quiz steps, POST, traverse, reload, hash changes, non-cancelable.
  assert.equal(b.navigate('https://example.com/x'), false)
  assert.equal(b.navigate('https://blogcascade.com/bcf/x?step=2'), false)
  for (const extra of [{ formData: {} }, { navigationType: 'traverse' }, { navigationType: 'reload' }, { hashChange: true }, { cancelable: false }, { downloadRequest: 'f' }]) {
    assert.equal(b.navigate('https://sms.blogcascade.com/abc', extra), false, JSON.stringify(extra))
  }
  assert.equal(b.navigated.length, 1)
})

test('backstop: does nothing without sub_ids, and without the Navigation API only that hook is skipped', () => {
  const none = runBackstop('?utm_source=x')
  assert.equal(none.listeners.click, undefined)
  assert.equal(none.navListeners.length, 0)
  const safari = runBackstop('?sub_id1=t', { navigationApi: false })
  assert.equal(typeof safari.listeners.click, 'function')
  assert.equal(typeof safari.listeners.submit, 'function')
})
