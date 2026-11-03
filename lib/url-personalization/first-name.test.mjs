// Tests for the first-name lookup (FIRST_NAME_HEAD). IDENTICAL IN EVERY BRAND REPO, like core.ts next to it.
// Run: node --test lib/url-personalization/first-name.test.mjs   (built-in Node test runner, no packages)
import { test } from 'node:test'
import assert from 'node:assert/strict'
import vm from 'node:vm'
import { FIRST_NAME_HEAD, FIRST_NAME_HOSTS, PERSONALIZATION_SCRIPT, hasFirstNameMarker, injectPersonalization } from './core.ts'
import { rewriteTrackingUrls } from '../subid-guarantee/core.ts'

const PAGE = '<html><head><title>t</title></head><body><h1>Hi <span data-fill="first-name">there</span></h1><a href="https://go.gdkn.org/AbCd">Go</a></body></html>'
const PLAIN = '<html><head><title>t</title></head><body><h1>Hi</h1><a href="https://go.gdkn.org/AbCd">Go</a></body></html>'

test('injection: head block only on a page with a first-name marker, and only with the switch on', () => {
  assert.equal(injectPersonalization(PAGE, false), PAGE)
  assert.equal(injectPersonalization(PLAIN, true), PLAIN.replace('</body>', PERSONALIZATION_SCRIPT + '</body>'))
  const on = injectPersonalization(PAGE, true)
  assert.ok(on.startsWith('<html><head>' + FIRST_NAME_HEAD + '<title>'))
  assert.equal(on.split(FIRST_NAME_HEAD).length, 2)
  assert.ok(on.includes(PERSONALIZATION_SCRIPT + '</body>'))
  for (const m of ['data-fill="first-name"', "data-fill='first-name'", 'data-fill = "first-name"', 'data-fill=first-name>']) assert.equal(hasFirstNameMarker(`<span ${m}`), true)
  for (const m of ['data-fill="first-names"', 'data-fill="zip"', 'first-name']) assert.equal(hasFirstNameMarker(`<span ${m}>`), false)
})

test('the head block holds no URL, so the tracking rewriter leaves it alone', () => {
  assert.doesNotMatch(FIRST_NAME_HEAD, /https?:\/\/[A-Za-z0-9]/)
  const cfg = { domain: 'go.gdkn.org', source: 'gk', subIds: [['sub_id1', 'abc']] }
  assert.equal(rewriteTrackingUrls(injectPersonalization(PAGE, true), cfg), injectPersonalization(rewriteTrackingUrls(PAGE, cfg), true))
})

test('hosts: the non-Cloudflare short-link host per brand', () => {
  assert.deepEqual(FIRST_NAME_HOSTS, { 'guidekn.com': 'g.guidekn.com', 'lumzen.co': 'g.lumzen.co', 'fitsyou.net': 'g.fitsyou.net', 'blogcascade.com': 'go.blogcascade.com' })
})

// ---- the head script against a fake DOM, fetch and clock ----

function el(tag, attrs = {}, children = [], text = '') {
  const n = {
    tagName: tag.toUpperCase(), attrs: { ...attrs }, children, text, style: { display: attrs.style === 'display:none' ? 'none' : '' }, parent: null,
    getAttribute: k => (k in n.attrs ? n.attrs[k] : null), hasAttribute: k => k in n.attrs,
    setAttribute: (k, v) => { n.attrs[k] = String(v) }, removeAttribute: k => { delete n.attrs[k] },
    get textContent() { return n.children.length ? n.children.map(c => c.textContent).join('') : n.text },
    set textContent(t) { n.children = []; n.text = String(t) },
    querySelectorAll: sel => all(n).filter(matcher(sel)), querySelector: sel => all(n).find(matcher(sel)) || null,
    closest: sel => { const tags = sel.split(',').map(s => s.trim().toUpperCase()); for (let p = n; p; p = p.parent) if (tags.includes(p.tagName)) return p; return null },
    get nextElementSibling() { return sib(n, 1) }, get previousElementSibling() { return sib(n, -1) },
  }
  for (const c of children) c.parent = n
  return n
}
const all = n => n.children.flatMap(c => [c, ...all(c)])
const matcher = sel => { const m = sel.match(/^\[([\w-]+)(?:="([^"]*)")?\]$/); return n => (m[2] === undefined ? n.hasAttribute(m[1]) : n.getAttribute(m[1]) === m[2]) }
const sib = (n, d) => (n.parent ? n.parent.children[n.parent.children.indexOf(n) + d] ?? null : null)
const visible = n => n.style.display !== 'none' && !n.hasAttribute('hidden')

function page() {
  const greet = el('span', { 'data-fill': 'first-name' }, [], 'there')
  const personal = el('h1', { 'data-personal': '', style: 'display:none' }, [el('span', { 'data-fill': 'first-name' }), el('span', {}, [], ', see plans in '), el('span', { 'data-fill': 'state-name' })])
  const fallback = el('h1', { 'data-default': '' }, [], 'See plans near you')
  const inLink = el('span', { 'data-fill': 'first-name' }, [], 'friend')
  const cta = el('a', { href: 'https://go.gdkn.org/AbCd?sub_id1=tok' }, [el('span', {}, [], 'Claim it, '), inLink])
  const zip = el('span', { 'data-fill': 'zip' }, [], 'your area')
  const body = el('body', {}, [el('p', {}, [el('span', {}, [], 'Hi '), greet]), personal, fallback, cta, zip])
  return { body, greet, personal, fallback, inLink, cta, zip }
}

// Runs FIRST_NAME_HEAD's script. `respond(url)` returns what fetch yields: an object (JSON body), 'error', 'non200',
// 'notjson', or 'never'. The clock only moves when tick(ms) is called.
function run({ search = '?sub_id1=tok-123&zip=70395&st=LA', host = 'www.guidekn.com', respond = () => ({ first_name: 'Maria' }), readyState = 'complete' } = {}) {
  const p = page()
  const root = el('html', {}, [el('head'), p.body])
  const timers = []; let now = 0; const calls = []; const listeners = {}
  const document = {
    documentElement: root, head: root.children[0], readyState,
    querySelectorAll: s => p.body.querySelectorAll(s), querySelector: s => p.body.querySelector(s),
    createElement: t => el(t), addEventListener: (ev, fn) => { (listeners[ev] ||= []).push(fn) },
  }
  root.children[0].appendChild = c => { root.children[0].children.push(c) }
  const fetch = (url, opts) => {
    calls.push({ url, opts })
    const r = respond(url)
    if (r === 'never') return new Promise((_, rej) => opts.signal?.addEventListener('abort', () => rej(new Error('aborted'))))
    if (r === 'error') return Promise.reject(new Error('net'))
    if (r === 'non200') return Promise.resolve({ ok: false, json: async () => ({ first_name: 'Maria' }) })
    if (r === 'notjson') return Promise.resolve({ ok: true, json: async () => { throw new SyntaxError('x') } })
    return Promise.resolve({ ok: true, json: async () => r })
  }
  const ctx = {
    location: { search, hostname: host }, URLSearchParams, document, fetch, AbortController, encodeURIComponent,
    setTimeout: (fn, ms) => { timers.push({ fn, at: now + ms }); return timers.length }, clearTimeout: id => { if (timers[id - 1]) timers[id - 1].fn = () => {} },
  }
  ctx.window = ctx
  const forbidden = ['localStorage', 'sessionStorage', 'dataLayer']
  for (const k of forbidden) Object.defineProperty(ctx, k, { get() { throw new Error(`touched ${k}`) } })
  Object.defineProperty(document, 'cookie', { get() { throw new Error('touched cookie') }, set() { throw new Error('touched cookie') } })
  vm.runInNewContext(FIRST_NAME_HEAD.replace(/^.*?<script>/, '').replace(/<\/script>$/, ''), ctx)
  const tick = ms => { now += ms; for (const t of timers) if (t.at <= now && !t.ran) { t.ran = true; t.fn() } }
  const settle = () => new Promise(r => setTimeout(r, 0))
  return { ...p, root, calls, tick, settle, listeners, search }
}

test('valid name: one GET to the brand host, filled as text, masked for Clarity, block swapped, wait lifted', async () => {
  const r = run()
  assert.equal(r.calls.length, 1)
  assert.equal(r.calls[0].url, 'https:/' + '/g.guidekn.com/api/public/first-name?t=tok-123')
  assert.equal(r.calls[0].opts.credentials, 'omit')
  assert.equal(r.calls[0].opts.cache, 'no-store')
  assert.equal(r.calls[0].opts.referrerPolicy, 'no-referrer')
  assert.ok(r.root.hasAttribute('data-up-fn'))
  await r.settle()
  assert.equal(r.greet.textContent, 'Maria')
  assert.equal(r.greet.getAttribute('data-clarity-mask'), 'true')
  assert.equal(r.personal.textContent, 'Maria, see plans in Louisiana')
  assert.ok(visible(r.personal) && !visible(r.fallback))
  assert.equal(r.root.hasAttribute('data-up-fn'), false)
  assert.equal(r.cta.getAttribute('href'), 'https://go.gdkn.org/AbCd?sub_id1=tok')
})

test('a first-name marker inside a link or button is never filled', async () => {
  const r = run(); await r.settle()
  assert.equal(r.inLink.textContent, 'friend')
  assert.equal(r.inLink.hasAttribute('data-clarity-mask'), false)
})

for (const [label, respond] of [['null', () => ({ first_name: null })], ['network error', () => 'error'], ['non-200', () => 'non200'], ['not JSON', () => 'notjson'],
  ['markup', () => ({ first_name: '<img src=x onerror=alert(1)>' })], ['digits', () => ({ first_name: 'Maria2' })], ['too long', () => ({ first_name: 'A'.repeat(41) })], ['empty', () => ({ first_name: '  ' })], ['number', () => ({ first_name: 42 })]]) {
  test(`no usable name (${label}): fallback and default stay, wait lifted`, async () => {
    const r = run({ respond }); await r.settle()
    assert.equal(r.greet.textContent, 'there')
    assert.ok(!visible(r.personal) && visible(r.fallback))
    assert.equal(r.root.hasAttribute('data-up-fn'), false)
    for (const n of all(r.body)) assert.doesNotMatch(n.textContent, /undefined|null|<img|42/)
  })
}

test('timeout: at 300 ms the default is revealed and a late answer is ignored', async () => {
  const r = run({ respond: () => 'never' })
  r.tick(299); assert.ok(r.root.hasAttribute('data-up-fn'))
  r.tick(1); assert.equal(r.root.hasAttribute('data-up-fn'), false)
  assert.equal(r.greet.textContent, 'there')
  assert.ok(visible(r.fallback))
})

test('no request without sub_id1, on an unknown host, and the page is never hidden then', () => {
  for (const opt of [{ search: '?zip=70395&st=LA' }, { host: 'guidekn-abc.vercel.app' }, { host: 'example.com' }]) {
    const r = run(opt)
    assert.equal(r.calls.length, 0)
    assert.equal(r.root.hasAttribute('data-up-fn'), false)
  }
})

test('sub_id1 is sent unchanged (percent-encoded), and nothing else from the URL', () => {
  const r = run({ search: '?sub_id1=a b&c&zip=70395&st=LA&utm_source=x' })
  assert.equal(r.calls[0].url, 'https:/' + '/g.guidekn.com/api/public/first-name?t=a%20b')
})

test('www and bare domains map to the same host; each brand to its own', () => {
  for (const [host, want] of [['guidekn.com', 'g.guidekn.com'], ['www.lumzen.co', 'g.lumzen.co'], ['fitsyou.net', 'g.fitsyou.net'], ['www.blogcascade.com', 'go.blogcascade.com']]) {
    assert.ok(run({ host }).calls[0].url.startsWith(`https://${want}/api/public/first-name?t=`))
  }
})

test('blocks still parsed after the answer are filled at DOMContentLoaded', async () => {
  const r = run({ readyState: 'loading' }); await r.settle()
  assert.equal(r.listeners.DOMContentLoaded?.length, 1)
})

test('valid name but invalid zip/state: a block needing them stays default, the plain greeting still fills', async () => {
  const r = run({ search: '?sub_id1=tok&zip=1&st=XX' }); await r.settle()
  assert.equal(r.greet.textContent, 'Maria')
  assert.ok(!visible(r.personal) && visible(r.fallback))
})
