const fs = require('fs');
const p = 'C:\\Users\\Merouan\\Documents\\Default Project\\dar-maroc-site\\admin\\dashboard.html';
let html = fs.readFileSync(p, 'utf8');

// All new view sections
const newSections = `
      <!-- CALENDRIER -->
      <section id="view-calendar" class="view">
        <div class="view-head">
          <h3>Calendrier - Planning des interventions</h3>
          <button class="btn-add" data-new="calendar-event"><i class="fas fa-plus"></i> Ajouter</button>
        </div>
        <div class="card">
          <div class="calendar-grid" id="calendarGrid"></div>
        </div>
        <p class="muted">Planifiez les visites, ménages, maintenance et accès. Glissez-déposez pour réorganiser.</p>
      </section>

      <!-- RESERVATIONS -->
      <section id="view-reservations" class="view">
        <div class="view-head">
          <h3>Gérer les réservations</h3>
          <button class="btn-add" data-new="reservation"><i class="fas fa-plus"></i> Nouvelle réservation</button>
        </div>
        <div class="table-wrap">
          <table class="dash-table"><thead><tr><th>Voyageur</th><th>Bien</th><th>Dates</th><th>Statut</th><th>Montant</th><th>Actions</th></tr></thead><tbody id="resBody"></tbody></table>
        </div>
      </section>

      <!-- VOYAGEURS -->
      <section id="view-travelers" class="view">
        <div class="view-head">
          <h3>Voyageurs & visiteurs</h3>
          <button class="btn-add" data-new="traveler"><i class="fas fa-plus"></i> Ajouter</button>
        </div>
        <div class="table-wrap">
          <table class="dash-table"><thead><tr><th>Nom</th><th>Email</th><th>Téléphone</th><th>Pays</th><th>Dernière visite</th><th>Actions</th></tr></thead><tbody id="travelerBody"></tbody></table>
        </div>
      </section>

      <!-- REVENUS -->
      <section id="view-revenue" class="view">
        <div class="view-head"><h3>Revenus & paiements</h3></div>
        <div class="stat-grid">
          <div class="stat-card"><div class="stat-icon green"><i class="fas fa-euro-sign"></i></div><div><strong id="revTotal">0</strong><span>Total DH</span></div></div>
          <div class="stat-card"><div class="stat-icon blue"><i class="fas fa-calendar-check"></i></div><div><strong id="revThisMonth">0</strong><span>Ce mois</span></div></div>
          <div class="stat-card"><div class="stat-icon gold"><i class="fas fa-coins"></i></div><div><strong id="revPaid">0</strong><span>Payés</span></div></div>
          <div class="stat-card"><div class="stat-icon purple"><i class="fas fa-clock"></i></div><div><strong id="revPending">0</strong><span>En attente</span></div></div>
        </div>
        <div class="table-wrap">
          <table class="dash-table"><thead><tr><th>Reservation</th><th>Client</th><th>Montant</th><th>Date</th><th>Paiement</th><th>Actions</th></tr></thead><tbody id="revBody"></tbody></table>
        </div>
      </section>

      <!-- MENAGE -->
      <section id="view-cleaning" class="view">
        <div class="view-head"><h3>Planification du ménage</h3><button class="btn-add" data-new="cleaning"><i class="fas fa-plus"></i> Ajouter</button></div>
        <div class="table-wrap">
          <table class="dash-table"><thead><tr><th>Bien</th><th>Date</th><th>Type</th><th>Durée</th><th>Status</th><th>Actions</th></tr></thead><tbody id="cleanBody"></tbody></table>
        </div>
      </section>

      <!-- MAINTENANCE -->
      <section id="view-maintenance" class="view">
        <div class="view-head"><h3>Maintenance & réparations</h3><button class="btn-add" data-new="maintenance"><i class="fas fa-plus"></i> Ajouter</button></div>
        <div class="table-wrap">
          <table class="dash-table"><thead><tr><th>Bien</th><th>Problème</th><th>Priorité</th><th>Date</th><th>Status</th><th>Actions</th></tr></thead><tbody id="maintBody"></tbody></table>
        </div>
      </section>

      <!-- ACCÈS -->
      <section id="view-access" class="view">
        <div class="view-head"><h3>Gestion des accès & équipements</h3><button class="btn-add" data-new="access"><i class="fas fa-plus"></i> Ajouter</button></div>
        <div class="table-wrap">
          <table class="dash-table"><thead><tr><th>Bien</th><th>Type d'accès</th><th>Code/Clé</th><th>Date</th><th>Status</th><th>Actions</th></tr></thead><tbody id="accessBody"></tbody></table>
        </div>
      </section>

      <!-- CONFORMITÉ -->
      <section id="view-compliance" class="view">
        <div class="view-head"><h3>Conformité & documents légaux</h3></div>
        <div class="stat-grid">
          <div class="stat-card"><div class="stat-icon green"><i class="fas fa-check-circle"></i></div><div><strong id="compOk">0</strong><span>Conformes</span></div></div>
          <div class="stat-card"><div class="stat-icon blue"><i class="fas fa-clock"></i></div><div><strong id="compPending">0</strong><span>En attente</span></div></div>
          <div class="stat-card"><div class="stat-icon purple"><i class="fas fa-exclamation-triangle"></i></div><div><strong id="compWarn">0</strong><span>Warnings</span></div></div>
          <div class="stat-card"><div class="stat-icon gold"><i class="fas fa-file-contract"></i></div><div><strong id="compDocs">0</strong><span>Documents</span></div></div>
        </div>
        <div class="table-wrap">
          <table class="dash-table"><thead><tr><th>Bien</th><th>Licence</th><th>Assurance</th><th>Contrôle</th><th>Prochain</th><th>Status</th></tr></thead><tbody id="compBody"></tbody></table>
        </div>
      </section>

      <!-- CANAUX -->
      <section id="view-channels" class="view">
        <div class="view-head"><h3>Canaux & connexions</h3><button class="btn-add" data-new="channel"><i class="fas fa-plus"></i> Ajouter</button></div>
        <div class="table-wrap">
          <table class="dash-table"><thead><tr><th>Plateforme</th><th>Type</th><th>Identifiant</th><th>Connecté</th><th>Sync</th><th>Actions</th></tr></thead><tbody id="chanBody"></tbody></table>
        </div>
      </section>

      <!-- AI MANAGER -->
      <section id="view-ai-manager" class="view">
        <div class="view-head"><h3>AI Manager - Gestion intelligente</h3></div>
        <div class="stat-grid">
          <div class="stat-card"><div class="stat-icon green"><i class="fas fa-robot"></i></div><div><strong id="aiRequests">0</strong><span>Requêtes/jour</span></div></div>
          <div class="stat-card"><div class="stat-icon blue"><i class="fas fa-brain"></i></div><div><strong id="aiAccuracy">0%</strong><span>Précision</span></div></div>
          <div class="stat-card"><div class="stat-icon gold"><i class="fas fa-trophy"></i></div><div><strong id="aiTasks">0</strong><span>Tâches auto</span></div></div>
        </div>
        <div class="card"><h3>Statut IA</h3><div id="aiStatus"><p class="muted">IA non connectée. Configurez la clé API dans les réglages.</p></div></div>
        <div class="card">
          <h3>Générer du contenu</h3>
          <div class="field"><label>Type</label><select id="aiGenType"><option value="description">Description bien</option><option value="social">Post réseaux</option><option value="email">Email</option></select></div>
          <button class="btn-save" id="aiGenBtn"><i class="fas fa-wand-magic-sparkles"></i> Générer</button>
          <div id="aiGenResult" class="muted" style="margin-top:12px;"></div>
        </div>
      </section>

      <!-- DOCUMENTS -->
      <section id="view-documents" class="view">
        <div class="view-head"><h3>Documents & fichiers</h3><button class="btn-add" data-new="document"><i class="fas fa-plus"></i> Ajouter</button></div>
        <div class="table-wrap">
          <table class="dash-table"><thead><tr><th>Nom</th><th>Type</th><th>Taille</th><th>Date</th><th>Actions</th></tr></thead><tbody id="docBody"></tbody></table>
        </div>
      </section>

      <!-- NOTIFICATIONS -->
      <section id="view-notifications" class="view">
        <div class="view-head"><h3>Notifications</h3><button class="btn-add" id="notifReadAll"><i class="fas fa-check-double"></i> Tout lire</button></div>
        <div id="notifList"></div>
      </section>

      <!-- RAPPORTS -->
      <section id="view-reports" class="view">
        <div class="view-head"><h3>Rapports & analytics</h3></div>
        <div class="stat-grid">
          <div class="stat-card"><div class="stat-icon green"><i class="fas fa-chart-bar"></i></div><div><strong id="repVues">0</strong><span>Vues totales</span></div></div>
          <div class="stat-card"><div class="stat-icon blue"><i class="fas fa-users"></i></div><div><strong id="repVisiteurs">0</strong><span>Visiteurs</span></div></div>
          <div class="stat-card"><div class="stat-icon gold"><i class="fas fa-euro-sign"></i></div><div><strong id="repRev">0</strong><span>Revenu</span></div></div>
          <div class="stat-card"><div class="stat-icon purple"><i class="fas fa-arrow-up"></i></div><div><strong id="repTaux">0%</strong><span>Taux conversion</span></div></div>
        </div>
        <div class="card"><h3>Rapport disponible</h3><p class="muted">Générez des rapports PDF ou Excel depuis les données collectées.</p></div>
      </section>

      <!-- AUTOMATISATIONS -->
      <section id="view-automations" class="view">
        <div class="view-head"><h3>Automatisations</h3><button class="btn-add" data-new="automation"><i class="fas fa-plus"></i> Créer</button></div>
        <div class="table-wrap">
          <table class="dash-table"><thead><tr><th>Trigger</th><th>Action</th><th>Actif</th><th>Dernier exécution</th><th>Actions</th></tr></thead><tbody id="autoBody"></tbody></table>
        </div>
      </section>

      <!-- PROPRIÉTAIRES -->
      <section id="view-owners" class="view">
        <div class="view-head"><h3>Gérer les propriétaires</h3><button class="btn-add" data-new="owner"><i class="fas fa-plus"></i> Ajouter</button></div>
        <div class="table-wrap">
          <table class="dash-table"><thead><tr><th>Nom</th><th>Email</th><th>Téléphone</th><th>Biens</th><th>Commission</th><th>Actions</th></tr></thead><tbody id="ownerBody"></tbody></table>
        </div>
      </section>

      <!-- SERVICES (existant, gardé) -->
`;

// Insert before closing </div> of .dash-content
const closeDiv = '</div>\n  </main>';
html = html.replace(closeDiv, newSections + closeDiv);

fs.writeFileSync(p, html);
console.log('Added all view sections');
