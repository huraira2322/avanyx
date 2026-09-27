// Diagnostic: does the brain resolve BOTH phrasings of the supply-chain follow-up?
const brain = require('./brain-out/conversationBrain.cjs');

function show(label, tenant, msg) {
  const r = brain.processMessage({
    message: msg,
    history: [],
    tenantId: tenant,
    userId: 'diag-user',
    conversationId: 'diag-conv',
  });
  console.log('');
  console.log('--- [' + label + '] "' + msg + '"');
  console.log('    isTopicChange    :', r.isTopicChange);
  console.log('    activeTopicLabel :', r.activeTopicLabel);
  console.log('    resolvedMessage  :', r.resolvedMessage);
  console.log('    injection        :', String((r.contextInjection && r.contextInjection.text) || '').replace(/\r?\n/g, ' | ').slice(0, 700));
  return r;
}

const tA = 'diagA-' + Date.now();
show('A1', tA, 'Explain what a supply chain is.');
show('A2', tA, 'What are the biggest risks in one?');

const tB = 'diagB-' + Date.now();
show('B1', tB, 'Explain what a supply chain is.');
show('B2', tB, 'risks in one');

console.log('');
console.log('=== DIAG DONE ===');
