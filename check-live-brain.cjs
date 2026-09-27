/**
 * LIVE PRODUCTION probe for the broken contextual-reference scenario.
 *
 * Scenario:
 *   Business/Topic : Supply Chain
 *   turn 1         : "Explain what a supply chain is."
 *   turn 2         : "What are the biggest risks in one?"   (variant A)
 *   turn 2         : "risks in one"                          (variant B - user's exact query)
 *
 * Expected: the backend resolves "one" -> "supply chain" and returns a real
 * supply-chain risk analysis. NOT a "what do you mean by 'one'?" clarification.
 *
 * NOTE: mirrors the real frontend (AskAvanyxChat.tsx), which resends the last 8 messages
 * as `history`. The brain keeps state in-memory and Vercel is serverless (turns may land on
 * different instances), so resending history is what preserves continuity in production.
 *
 * Usage:  AVANYX_BASE=<url> node check-live-brain.cjs
 */

const BASE = process.env.AVANYX_BASE || 'https://huraira4545.vercel.app';
const TIMEOUT_MS = Number(process.env.AVANYX_TIMEOUT_MS || 90000);

const TOPIC_RE = /supply\s*chain/i;
const RISK_TERMS = [
  'risk', 'disruption', 'geopolit', 'supplier', 'logistic', 'shortage', 'delay', 'lead time',
  'inventory', 'single-source', 'single source', 'natural disaster', 'cyber', 'tariff',
  'volatil', 'dependency', 'resilien', 'procurement', 'upstream', 'raw material', 'port',
];
const CONFUSION_TERMS = [
  'what do you mean', 'which "one"', 'did you mean', 'got cut off', 'is incomplete',
  'unclear what', 'need more context', 'please clarify', 'clarify what', 'what does "one"',
];
// Markers that prove the model did NOT bind "one" to the active topic.
const AMBIGUITY_MARKERS = [
  'could mean one', 'if you mean', 'if you meant', 'do you mean', 'open-ended',
  'reading "risks in one"', 'mean by "one"', 'one business, one store',
  'which one do you mean', 'clarify',
];

let passed = 0;
let failed = 0;

function ok(name, cond, extra) {
  if (cond) {
    passed++;
    console.log('  PASS ' + name);
  } else {
    failed++;
    console.log('  FAIL ' + name + (extra !== undefined ? ' :: ' + JSON.stringify(extra).slice(0, 500) : ''));
  }
}

function info(label, value) {
  console.log('  ..   ' + label + ': ' + value);
}

function has(text, list) {
  const t = String(text || '').toLowerCase();
  return list.some((w) => t.includes(w));
}

async function ask(message, { tenantId, userId, history = [] }) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(BASE + '/api/ai/ask', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-tenant-id': tenantId,
        'x-user-id': userId,
      },
      body: JSON.stringify({ message, modelId: 'chat', history, businessContext: {} }),
      signal: controller.signal,
    });
    const raw = await res.text();
    let json = {};
    try { json = JSON.parse(raw); } catch { json = { rawHtml: raw.slice(0, 300) }; }
    return { status: res.status, ...json };
  } catch (e) {
    return { status: 0, success: false, error: 'FETCH_ERROR', message: String(e && e.message) };
  } finally {
    clearTimeout(timer);
  }
}

function evaluateVariant(label, tenantId, turn2) {
  return (async () => {
    console.log('');
    console.log('  --- ' + label + ' ---');
    const t = { tenantId, userId: tenantId + '-user' };

    const a1 = await ask('Explain what a supply chain is.', { ...t, history: [] });
    ok('turn1 answered', a1.success === true && String(a1.reply || '').length > 0, a1);
    info('turn1 modelUsed', a1.modelUsed + ' | credits=' + a1.creditsUsed);

    // Turn 2 — contextual follow-up. History mirrors the real frontend payload
    // (AskAvanyxChat.tsx resends the last 8 messages), which is what preserves
    // continuity across Vercel's stateless serverless instances.
    const history = [
      { role: 'user', content: 'Explain what a supply chain is.' },
      { role: 'assistant', content: String(a1.reply || '') },
    ];
    const a2 = await ask(turn2, { ...t, history });
    const reply = String(a2.reply || '');
    console.log('');
    console.log('  >>> ACTUAL PRODUCTION REPLY (turn2 "' + turn2 + '"):');
    console.log('  ' + reply.split('\n').join('\n  ').slice(0, 1600));
    console.log('');

    ok('turn2 HTTP 200 + success', a2.status === 200 && a2.success === true, { status: a2.status, error: a2.error, message: a2.message });
    ok('no API/model/routing error fields', !a2.error, { error: a2.error, message: a2.message });
    ok('modelUsed reported (routing worked)', Boolean(a2.modelUsed), { modelUsed: a2.modelUsed });
    info('turn2 modelUsed', a2.modelUsed + ' | credits=' + a2.creditsUsed);

    ok('reply is non-empty', reply.length > 40, { len: reply.length });
    ok('reply explicitly about "supply chain"', TOPIC_RE.test(reply), { reply: reply.slice(0, 300) });
    ok('reply contains real supply-chain RISK analysis', has(reply, RISK_TERMS), { reply: reply.slice(0, 300) });
    ok('reply is NOT an ambiguity/clarification response', !has(reply, AMBIGUITY_MARKERS), { reply: reply.slice(0, 300) });
    ok('no clarification/confusion about "one"', !has(reply, CONFUSION_TERMS), { reply: reply.slice(0, 300) });
  })();
}

async function main() {
  console.log('==========================================================');
  console.log('AVANYX LIVE PRODUCTION — contextual reference probe');
  console.log('Target   : ' + BASE);
  console.log('Scenario : Supply Chain  ->  "risks in one"');
  console.log('==========================================================');

  console.log('');
  console.log('[0] Health / routing wiring');
  try {
    const h = await fetch(BASE + '/api/ai/providers/health', { signal: AbortSignal.timeout(30000) });
    const hj = await h.json();
    ok('providers health reachable', h.status === 200, { status: h.status });
    info('deepseek.configured', String(hj.deepseek && hj.deepseek.configured));
    info('gemini.configured', String(hj.gemini && hj.gemini.configured));
    info('NORMAL_CHAT routing', JSON.stringify(hj.routing && hj.routing.NORMAL_CHAT));
  } catch (e) {
    ok('providers health reachable', false, String(e.message));
  }

  const stamp = Date.now().toString(36);
  await evaluateVariant('VARIANT A — "What are the biggest risks in one?"', 'liveA-' + stamp, 'What are the biggest risks in one?');
  await evaluateVariant('VARIANT B — "risks in one" (terse, user query)', 'liveB-' + stamp, 'risks in one');

  // Informational only: no-history turn on a cold scope (serverless instance-affinity caveat).
  console.log('');
  console.log('[INFO] Stateless (no history) turn on a brand-new scope — serverless caveat');
  const coldTenant = 'liveCold-' + stamp;
  await ask('Explain what a supply chain is.', { tenantId: coldTenant, userId: coldTenant + '-user', history: [] });
  const cold = await ask('risks in one', { tenantId: coldTenant, userId: coldTenant + '-user', history: [] });
  info('cold-turn2 modelUsed', String(cold.modelUsed) + ' | success=' + String(cold.success));
  info('cold-turn2 reply', String(cold.reply || '').replace(/\s+/g, ' ').slice(0, 220));

  console.log('');
  console.log('==========================================================');
  console.log(passed + ' passed, ' + failed + ' failed');
  console.log(failed === 0 ? 'PRODUCTION CONTEXT TEST PASSED' : 'PRODUCTION CONTEXT TEST FAILED');
  console.log('==========================================================');
  process.exit(failed === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error('PROBE CRASHED: ' + (e && e.stack ? e.stack : e));
  process.exit(2);
});
