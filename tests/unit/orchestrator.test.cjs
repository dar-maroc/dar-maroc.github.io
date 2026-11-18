// ============================================================
// TESTS UNITAIRES — ORCHESTRATEUR (utils/ai-orchestrator.js)
// MOCKS uniquement — aucun appel réseau.
// ============================================================

let passed = 0;
let failed = 0;

function assert(cond, msg) {
  if (cond) { passed++; console.log('  OK  ', msg); }
  else { failed++; console.log('  ECHEC', msg); }
}

global.window = global.window || {};
global.DARMAROC_CONFIG = {
  ai: { gemini: { apiKey: '', model: 'gemini-2.0-flash' } },
  providers: {
    primary: { name: 'supabase-edge', model: 'gemini-2.0-flash', capability: 'text', endpoint: '/functions/v1/ai-generate' },
    fallback: { name: 'supabase-edge', model: 'gemini-2.0-flash-lite', capability: 'text', endpoint: '/functions/v1/ai-generate' },
    local: { name: 'local', model: 'local-keyword', capability: 'text', endpoint: null }
  }
};

require('../../utils/ai-orchestrator.js');
require('./../../ai/agents/agent-1-manager.js');
require('./../../ai/agents/agent-2-market-research.js');
require('./../../ai/agents/agent-3-trend-intelligence.js');
require('./../../ai/agents/agent-4-audience-intelligence.js');
require('./../../ai/agents/agent-5-content-creator.js');
require('./../../ai/agents/agent-6-social-media-manager.js');
require('./../../ai/agents/agent-7-seo-traffic.js');
require('./../../ai/agents/agent-8-business-development.js');
require('./../../ai/agents/agent-9-performance-analyst.js');

console.log('\n=== TESTS ORCHESTRATEUR (mocks uniquement) ===\n');

var orch = window.DarMarocAIOrchestrator;

var initResult = orch.init({ supabase: null });
assert(initResult.supabase === false, 'Orchestrateur initialise (supabase non configuré)');
assert(Object.keys(initResult.agents).length === 9, '9 agents enregistrés');

// Vérifier chaque agent
var expectedAgents = [
  '1', '2', '3', '4', '5', '6', '7', '8', '9'
];
expectedAgents.forEach(function (id) {
  var a = orch.getAgentInfo(id);
  assert(a !== null, 'Agent ' + id + ' présent (' + a.name + ')');
  assert(Array.isArray(a.permissions), 'Agent ' + id + ' a des permissions');
  assert(a.permissions.length > 0, 'Agent ' + id + ' a au moins une permission');
});

// Test création de mission pour chaque agent
console.log('\n-- Création de missions --');
var agentConfigs = [
  { id: '1', title: 'Coordination', priority: 1, payload: { action: 'coordinate', targetAgents: ['2','3','4'] } },
  { id: '2', title: 'Étude marché', priority: 2, payload: { scope: 'maroc', focus: 'immobilier' } },
  { id: '3', title: 'Veille tendances', priority: 2, payload: { platforms: ['instagram','tiktok'] } },
  { id: '4', title: 'Segmentation', priority: 3, payload: { segment: 'diaspora' } },
  { id: '5', title: 'Création contenu', priority: 3, payload: { contentType: 'social_post', language: 'fr', topic: 'Villa Agadir' } },
  { id: '6', title: 'Calendrier', priority: 4, payload: { action: 'calendar', platforms: ['facebook','instagram'] } },
  { id: '7', title: 'Audit SEO', priority: 4, payload: { action: 'audit' } },
  { id: '8', title: 'Recherche partenaires', priority: 5, payload: { action: 'research', sector: 'immobilier' } },
  { id: '9', title: 'Analyse performances', priority: 5, payload: { action: 'analyze', statsSource: 'localStorage' } }
];

var createdMissions = [];
agentConfigs.forEach(function (c) {
  var m = orch.createMission({ title: c.title, agentId: c.id, priority: c.priority, payload: c.payload });
  createdMissions.push(m);
  assert(m.status === 'running' || m.status === 'queued', 'Mission agent ' + c.id + ' créée (statut: ' + m.status + ')');
  assert(m.idempotencyKey && m.idempotencyKey.length > 0, 'Mission agent ' + c.id + ' a une clé d\'idempotence');
  assert(m.validationId === null || m.validationId !== undefined, 'Mission agent ' + c.id + ' a un champ validationId');
});

// Test idempotence
console.log('\n-- Idempotence --');
var dup = orch.createMission({ title: 'Doublon', agentId: '2', priority: 5, payload: { idempotencyKey: createdMissions[1].idempotencyKey } });
assert(dup.id === createdMissions[1].id, 'Doublon détecté -> même id retourné');

// Test attente traitement puis statut awaiting_approval
setTimeout(function () {
  var allMissions = orch.getAllMissions();
  assert(allMissions.length >= 9, 'Missions présentes après traitement');

  // Vérifier qu'aucune mission n'est exécutée sans approbation
  var autoExecuted = allMissions.filter(function (m) { return m.status === 'executed' && !m.validationId; });
  assert(autoExecuted.length === 0, 'Aucune mission exécutée sans validation humaine');

  // Vérifier que toutes les missions sont en awaiting_approval (après traitement des agents)
  var allAwaiting = allMissions.every(function (m) {
    return ['awaiting_approval', 'approved', 'rejected', 'failed'].includes(m.status);
  });
  assert(allAwaiting, 'Toutes les missions ont un statut post-traitement valide');

  // Test validation humaine
  console.log('\n-- Validation humaine --');
  var validations = orch.getValidations();
  var pending = validations.filter(function (v) { return v.status === 'pending'; });
  assert(pending.length > 0, 'Validations en attente présentes');

  var firstPending = pending[0];
  var r1 = orch.decideValidation(firstPending.id, 'approved', 'admin-test', 'Test approbation');
  assert(r1.validation.status === 'approved', 'Validation approuvée');

  var missionAfterApproval = orch.getMission(firstPending.missionId);
  assert(missionAfterApproval.status === 'approved', 'Mission passe en approved');

  // Test refus
  var pending2 = validations.filter(function (v) { return v.status === 'pending'; });
  if (pending2.length > 0) {
    var r2 = orch.decideValidation(pending2[0].id, 'rejected', 'admin-test', 'Test refus');
    assert(r2.validation.status === 'rejected', 'Validation refusée');
  }

  // Test validation inexistante
  try {
    orch.decideValidation('inexistant', 'approved', 'admin-test');
    assert(false, 'Doit lever une erreur pour validation inexistante');
  } catch (e) {
    assert(true, 'Erreur levée pour validation inexistante');
  }

  // Test exécution mission approuvée
  console.log('\n-- Exécution --');
  var approvedMissions = allMissions.filter(function (m) { return m.status === 'approved'; });
  if (approvedMissions.length > 0) {
    var execResult = orch.executeApprovedMission(approvedMissions[0].id);
    assert(execResult.mission.status === 'executed', 'Mission exécutée après approbation');
  }

  // Test journaux d'activité
  console.log('\n-- Journaux --');
  var logs = orch.getAgentLogs(null, 10);
  assert(logs.length > 0, 'Journaux d\'activité présents');

  // Test permissions
  console.log('\n-- Permissions --');
  assert(orch.hasPermission('1', 'read_all') === true, 'Agent 1 read_all');
  assert(orch.hasPermission('5', 'draft_content') === true, 'Agent 5 draft_content');
  assert(orch.hasPermission('8', 'research_partners') === true, 'Agent 8 research_partners');
  assert(orch.hasPermission('9', 'publish_external') === false, 'Agent 9 pas publish_external');
  assert(orch.hasPermission('99', 'any') === false, 'Agent inconnu');

  // --- Résumé ---
  console.log('\n=== RESULTAT ORCHESTRATEUR ===');
  console.log('OK  ' + passed + ' réussis');
  console.log('ECHEC ' + failed + ' échecs');
  if (failed === 0) console.log('TOUS LES TESTS ORCHESTRATEUR SONT PASSES');
  else process.exit(1);
}, 1500);
