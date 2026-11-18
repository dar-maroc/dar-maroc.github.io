// ============================================================
// TEST RUNNER — DAR MAROC AI
// Lance tous les tests unitaires.
// ============================================================

const fs = require('fs');
const path = require('path');

const testDir = path.join(__dirname, 'unit');
const files = fs.readdirSync(testDir).filter(f => f.endsWith('.test.cjs')).sort();

console.log('========================================');
console.log('  DAR MAROC AI — TESTS UNITAIRES');
console.log('========================================');
console.log('Fichiers de tests trouvés:', files.length);
console.log('');

let totalPassed = 0;
let totalFailed = 0;
let totalTests = 0;

(async () => {
  for (const file of files) {
    const filePath = path.join(testDir, file);
    console.log('--- ' + file + ' ---');

    // Chaque fichier de test gère son propre comptage via console
    // On l'exécute dans un contexte isolé
    try {
      require(filePath);
    } catch (e) {
      console.log('  ERREUR lors de l\'execution de ' + file + ':', e.message);
      totalFailed++;
    }
    console.log('');
  }

  console.log('========================================');
  console.log('  FIN DES TESTS UNITAIRES');
  console.log('========================================');
})();
