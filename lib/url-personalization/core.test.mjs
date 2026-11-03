// Tests for URL personalization. IDENTICAL IN EVERY BRAND REPO, like core.ts next to it.
// Run: node --test lib/url-personalization/core.test.mjs   (built-in Node test runner, no packages)
import { test } from 'node:test'
import assert from 'node:assert/strict'
import vm from 'node:vm'
import { PERSONALIZATION_SCRIPT, US_STATES, injectPersonalization, personalizationEnabled } from './core.ts'
import { rewriteTrackingUrls } from '../subid-guarantee/core.ts'

const PAGE = '<html><head><title>t</title></head><body><a href="https://go.gdkn.org/AbCd?x=1">Go</a></body></html>'

test('switch off returns the input itself, byte for byte', () => {
  for (const html of [PAGE, '', 'no body at all', '<BODY></BODY>']) assert.equal(injectPersonalization(html, false), html)
})

test('switch on adds the script once, just before </body>', () => {
  const out = injectPersonalization(PAGE, true)
  assert.equal(out, PAGE.replace('</body>', PERSONALIZATION_SCRIPT + '</body>'))
  assert.equal(out.split(PERSONALIZATION_SCRIPT).length, 2)
  assert.equal(injectPersonalization('<p>x</p></BODY >', true), '<p>x</p>' + PERSONALIZATION_SCRIPT + '</BODY >')
  assert.equal(injectPersonalization('<p>x</p>', true), '<p>x</p>' + PERSONALIZATION_SCRIPT)
})

test('only an explicit true turns it on', () => {
  assert.equal(personalizationEnabled(true), true)
  assert.equal(personalizationEnabled('true'), true)
  for (const raw of [false, 'false', '', null, undefined, 'TRUE', 1, '1', 'on', {}]) assert.equal(personalizationEnabled(raw), false)
})

test('the script holds no URL, so the tracking rewriter leaves it alone', () => {
  assert.doesNotMatch(PERSONALIZATION_SCRIPT, /https?:|\/\//)
  const cfg = { domain: 'go.gdkn.org', source: 'gk', subIds: [['sub_id1', 'a']] }
  const on = injectPersonalization(PAGE, true)
  assert.equal(rewriteTrackingUrls(on, cfg), injectPersonalization(rewriteTrackingUrls(PAGE, cfg), true))
})

test('50 states + DC', () => {
  assert.equal(Object.keys(US_STATES).length, 51)
  assert.equal(US_STATES.DC, 'District of Columbia')
  assert.equal(US_STATES.PR, undefined)
})

// ---- the client script, run against a minimal fake DOM ----

function el(attrs = {}, children = [], text = '') {
  const node = {
    attrs: { ...attrs }, children, text, style: { display: attrs.style === 'display:none' ? 'none' : '' }, parent: null,
    getAttribute: k => (k in node.attrs ? node.attrs[k] : null),
    hasAttribute: k => k in node.attrs,
    removeAttribute: k => { delete node.attrs[k] },
    get textContent() { return node.children.length ? node.children.map(c => c.textContent).join('') : node.text },
    set textContent(t) { node.children = []; node.text = String(t) },
    querySelectorAll: sel => descendants(node).filter(match(sel)),
    get nextElementSibling() { return sibling(node, 1) },
    get previousElementSibling() { return sibling(node, -1) },
  }
  for (const c of children) c.parent = node
  return node
}
const descendants = n => n.children.flatMap(c => [c, ...descendants(c)])
const match = sel => n => n.hasAttribute(sel.slice(1, -1))
const sibling = (n, d) => (n.parent ? n.parent.children[n.parent.children.indexOf(n) + d] ?? null : null)
const visible = n => n.style.display !== 'none' && !n.hasAttribute('hidden')

function run(search, body) {
  const doc = el({}, [body])
  const ctx = { location: { search }, URLSearchParams, document: doc }
  vm.runInNewContext(PERSONALIZATION_SCRIPT.replace(/^<script>|<\/script>$/g, ''), ctx)
}

function page() {
  const zip = el({ 'data-fill': 'zip' }, [], 'your area')
  const name = el({ 'data-fill': 'state-name' }, [], 'your state')
  const code = el({ 'data-fill': 'state' }, [], 'US')
  const personal = el({ 'data-personal': '', style: 'display:none' }, [el({}, [], 'Deals in '), el({ 'data-fill': 'zip' }, [], ''), el({}, [], ', '), el({ 'data-fill': 'state-name' }, [], '')])
  const fallback = el({ 'data-default': '' }, [], 'Deals near you')
  const cta = el({ href: 'https://go.gdkn.org/AbCd?sub_id1=x' }, [], 'Claim')
  const body = el({}, [zip, name, code, personal, fallback, cta])
  return { body, zip, name, code, personal, fallback, cta }
}

test('valid zip + state: fills every marker and swaps in the personal version', () => {
  const p = page()
  run('?zip=90210&st=ca&sub_id1=x', p.body)
  assert.equal(p.zip.textContent, '90210')
  assert.equal(p.code.textContent, 'CA')
  assert.equal(p.name.textContent, 'California')
  assert.equal(p.personal.textContent, 'Deals in 90210, California')
  assert.ok(visible(p.personal))
  assert.ok(!visible(p.fallback))
  assert.deepEqual(p.cta.attrs, { href: 'https://go.gdkn.org/AbCd?sub_id1=x' })
})

for (const [label, search] of [
  ['no params', ''],
  ['zip too short', '?zip=9021&st=CA'],
  ['zip with letters', '?zip=9021a&st=CA'],
  ['unknown state', '?zip=90210&st=XX'],
  ['territory', '?zip=00901&st=PR'],
  ['markup in values', '?zip=<b>1</b>&st=<script>'],
  ['empty values', '?zip=&st='],
]) {
  test(`invalid (${label}): fallbacks stay, personal version stays hidden`, () => {
    const p = page()
    run(search, p.body)
    if (!/st=(CA|ca)/.test(search)) {
      assert.equal(p.name.textContent, 'your state')
      assert.equal(p.code.textContent, 'US')
    }
    if (!/zip=\d{5}(&|$)/.test(search)) assert.equal(p.zip.textContent, 'your area')
    assert.ok(!visible(p.personal))
    assert.ok(visible(p.fallback))
    for (const n of descendants(p.body)) assert.doesNotMatch(n.textContent, /undefined|null|<|\{/)
  })
}

test('valid zip, invalid state: zip fills, a block needing both stays default', () => {
  const p = page()
  run('?zip=10001&st=ZZ', p.body)
  assert.equal(p.zip.textContent, '10001')
  assert.equal(p.name.textContent, 'your state')
  assert.ok(!visible(p.personal))
  assert.ok(visible(p.fallback))
})

test('first value wins when a param repeats', () => {
  const p = page()
  run('?zip=10001&zip=99999&st=NY&st=CA', p.body)
  assert.equal(p.zip.textContent, '10001')
  assert.equal(p.name.textContent, 'New York')
})

test('a page with no markers is left alone', () => {
  const cta = el({ href: 'https://go.gdkn.org/AbCd' }, [], 'Claim')
  const body = el({}, [el({}, [], 'Headline'), cta])
  run('?zip=90210&st=CA', body)
  assert.equal(body.textContent, 'HeadlineClaim')
  assert.deepEqual(cta.attrs, { href: 'https://go.gdkn.org/AbCd' })
})

test('a personal block authored with the hidden attribute is revealed too', () => {
  const personal = el({ 'data-personal': '', hidden: '' }, [el({ 'data-fill': 'zip' }, [], '')])
  const fallback = el({ 'data-default': '' }, [], 'near you')
  run('?zip=30301', el({}, [fallback, personal]))
  assert.ok(visible(personal))
  assert.ok(!visible(fallback))
})
