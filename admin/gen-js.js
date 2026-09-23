const fs = require('fs');
const p = 'C:\\Users\\Merouan\\Documents\\Default Project\\dar-maroc-site\\admin\\js\\dashboard.js';
let js = fs.readFileSync(p, 'utf8');

// Remove the closing })(); to append new code
const closeParen = '\n})();';
js = js.replace(closeParen, '');

const additions = `
  /* ---------- Nouvelles sections 19 vues ---------- */

  /* CALENDRIER */
  function renderCalendar() {
    var grid = document.getElementById('calendarGrid');
    if (!grid) return;
    var now = new Date();
    var month = now.getMonth(), year = now.getFullYear();
    var firstDay = new Date(year, month, 1).getDay();
    var daysInMonth = new Date(year, month + 1, 0).getDate();
    var html = '<div class="cal-header" colspan="7">' + now.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }) + '</div>';
    ['Dim','Lun','Mar','Mer','Jeu','Ven','Sam'].forEach(function(d) { html += '<div class="cal-header">' + d + '</div>'; });
    for (var i = 0; i < firstDay; i++) html += '<div class="cal-day empty"></div>';
    for (var d = 1; d <= daysInMonth; d++) {
      var isToday = d === now.getDate() && month === now.getMonth() && year === now.getFullYear();
      html += '<div class="cal-day' + (isToday ? ' today' : '') + '"><div class="cal-date">' + d + '</div></div>';
    }
    grid.innerHTML = html;
  }

  /* RESERVATIONS */
  var reservations = [
    { id: 'res1', traveler: 'Ahmed Benali', property: 'Villa Casablanca', dates: '2026-01-15 - 2026-01-22', status: 'confirmed', amount: '4,500 DH' },
    { id: 'res2', traveler: 'Fatima El Mansouri', property: 'Appartement Rabat', dates: '2026-02-01 - 2026-02-07', status: 'pending', amount: '2,800 DH' }
  ];
  function renderReservations() {
    var body = document.getElementById('resBody');
    if (!body) return;
    body.innerHTML = reservations.map(function(r) {
      return '<tr><td>' + esc(r.traveler) + '</td><td>' + esc(r.property) + '</td><td>' + r.dates + '</td><td><span class="status-badge ' + r.status + '">' + r.status + '</span></td><td>' + r.amount + '</td>' +
        '<td><div class="row-actions"><button class="btn-icon" data-edit="reservation"><i class="fas fa-pen"></i></button><button class="btn-icon danger"><i class="fas fa-trash"></i></button></div></td></tr>';
    }).join('') || '<tr><td colspan="6" class="muted">Aucune reservation.</td></tr>';
  }

  /* VOYAGEURS */
  var travelers = [
    { name: 'Ahmed Benali', email: 'ahmed@email.com', phone: '+212 661 234 567', country: 'Maroc', lastVisit: '2025-12-15' },
    { name: 'Sophie Martin', email: 'sophie@email.fr', phone: '+33 6 12 34 56 78', country: 'France', lastVisit: '2025-11-20' }
  ];
  function renderTravelers() {
    var body = document.getElementById('travelerBody');
    if (!body) return;
    body.innerHTML = travelers.map(function(t) {
      return '<tr><td>' + esc(t.name) + '</td><td>' + esc(t.email) + '</td><td>' + esc(t.phone) + '</td><td>' + esc(t.country) + '</td><td>' + t.lastVisit + '</td>' +
        '<td><div class="row-actions"><button class="btn-icon" data-edit="traveler"><i class="fas fa-pen"></i></button><button class="btn-icon danger"><i class="fas fa-trash"></i></button></div></td></tr>';
    }).join('') || '<tr><td colspan="6" class="muted">Aucun voyageur.</td></tr>';
  }

  /* REVENUS */
  function renderRevenue() {
    var total = document.getElementById('revTotal');
    var thisMonth = document.getElementById('revThisMonth');
    var paid = document.getElementById('revPaid');
    var pending = document.getElementById('revPending');
    var body = document.getElementById('revBody');
    if (total) total.textContent = '12,450';
    if (thisMonth) thisMonth.textContent = '5,200';
    if (paid) paid.textContent = '9,800';
    if (pending) pending.textContent = '2,650';
    if (body) {
      var revs = [
        { client: 'Ahmed Benali', amount: '4,500 DH', date: '2026-01-10', pay: 'paid' },
        { client: 'Fatima El Mansouri', amount: '2,800 DH', date: '2026-01-12', pay: 'pending' }
      ];
      body.innerHTML = revs.map(function(r) {
        return '<tr><td>' + esc(r.client) + '</td><td>' + r.amount + '</td><td>' + r.date + '</td><td><span class="status-badge ' + r.pay + '">' + r.pay + '</span></td><td><button class="btn-icon"><i class="fas fa-file-invoice"></i></button></td></tr>';
      }).join('') || '<tr><td colspan="6" class="muted">Aucun revenu.</td></tr>';
    }
  }

  /* MENAGE */
  var cleanings = [
    { property: 'Villa Casablanca', date: '2026-01-14', type: 'Complet', duration: '3h', status: 'confirmed' },
    { property: 'Appartement Rabat', date: '2026-01-16', type: 'Partiel', duration: '1h30', status: 'pending' }
  ];
  function renderCleanings() {
    var body = document.getElementById('cleanBody');
    if (!body) return;
    body.innerHTML = cleanings.map(function(c) {
      return '<tr><td>' + esc(c.property) + '</td><td>' + c.date + '</td><td>' + c.type + '</td><td>' + c.duration + '</td><td><span class="status-badge ' + c.status + '">' + c.status + '</span></td>' +
        '<td><div class="row-actions"><button class="btn-icon"><i class="fas fa-pen"></i></button><button class="btn-icon danger"><i class="fas fa-trash"></i></button></div></td></tr>';
    }).join('') || '<tr><td colspan="6" class="muted">Aucun menage.</td></tr>';
  }

  /* MAINTENANCE */
  var maintenances = [
    { property: 'Villa Marrakech', issue: 'Fuite eau cuisine', priority: 'high', date: '2026-01-10', status: 'in-progress' },
    { property: 'Riad Fes', issue: 'Climatisation', priority: 'medium', date: '2026-01-12', status: 'pending' }
  ];
  function renderMaintenances() {
    var body = document.getElementById('maintBody');
    if (!body) return;
    body.innerHTML = maintenances.map(function(m) {
      return '<tr><td>' + esc(m.property) + '</td><td>' + esc(m.issue) + '</td><td class="priority-' + m.priority + '">' + m.priority + '</td><td>' + m.date + '</td><td><span class="status-badge ' + m.status + '">' + m.status + '</span></td>' +
        '<td><div class="row-actions"><button class="btn-icon"><i class="fas fa-pen"></i></button><button class="btn-icon danger"><i class="fas fa-trash"></i></button></div></td></tr>';
    }).join('') || '<tr><td colspan="6" class="muted">Aucune maintenance.</td></tr>';
  }

  /* ACCES */
  var accesses = [
    { property: 'Villa Casablanca', type: 'Code', code: '7429', date: '2026-01-01', status: 'active' },
    { property: 'Appartement Rabat', type: 'Clé', code: '—', date: '2026-01-05', status: 'active' }
  ];
  function renderAccesses() {
    var body = document.getElementById('accessBody');
    if (!body) return;
    body.innerHTML = accesses.map(function(a) {
      return '<tr><td>' + esc(a.property) + '</td><td>' + a.type + '</td><td>' + a.code + '</td><td>' + a.date + '</td><td><span class="status-badge ' + a.status + '">' + a.status + '</span></td>' +
        '<td><div class="row-actions"><button class="btn-icon"><i class="fas fa-pen"></i></button><button class="btn-icon danger"><i class="fas fa-trash"></i></button></div></td></tr>';
    }).join('') || '<tr><td colspan="6" class="muted">Aucun acces.</td></tr>';
  }

  /* CONFORMITÉ */
  function renderCompliance() {
    var ok = document.getElementById('compOk');
    var pending = document.getElementById('compPending');
    var warn = document.getElementById('compWarn');
    var docs = document.getElementById('compDocs');
    var body = document.getElementById('compBody');
    if (ok) ok.textContent = '3';
    if (pending) pending.textContent = '1';
    if (warn) warn.textContent = '1';
    if (docs) docs.textContent = '8';
    if (body) {
      body.innerHTML = '<tr><td>Villa Casablanca</td><td><span class="status-badge confirmed">OK</span></td><td><span class="status-badge confirmed">OK</span></td><td>2026-03-01</td><td>2026-03-01</td><td><span class="status-badge confirmed">Conforme</span></td></tr>' +
        '<tr><td>Appartement Rabat</td><td><span class="status-badge pending">En attente</span></td><td><span class="status-badge confirmed">OK</span></td><td>2025-12-15</td><td>2025-12-15</td><td><span class="status-badge pending">A revoir</span></td></tr>' +
        '<tr><td>Riad Fes</td><td><span class="status-badge confirmed">OK</span></td><td><span class="status-badge pending">En attente</span></td><td>2026-01-20</td><td>2026-02-20</td><td><span class="status-badge in-progress">Warning</span></td></tr>';
    }
  }

  /* CANAUX */
  var channels = [
    { platform: 'WhatsApp Business', type: 'Messaging', id: '+212 522 261 486', connected: true, sync: 'synced' },
    { platform: 'Booking.com', type: 'OTA', id: 'darmaroc-bk', connected: true, sync: 'synced' },
    { platform: 'Airbnb', type: 'OTA', id: 'darmaroc-ab', connected: false, sync: 'none' }
  ];
  function renderChannels() {
    var body = document.getElementById('chanBody');
    if (!body) return;
    body.innerHTML = channels.map(function(c) {
      var connClass = c.connected ? 'chan-connected' : 'chan-disconnected';
      var connLabel = c.connected ? 'Oui' : 'Non';
      return '<tr><td>' + esc(c.platform) + '</td><td>' + esc(c.type) + '</td><td>' + esc(c.id) + '</td><td class="' + connClass + '">' + connLabel + '</td><td>' + c.sync + '</td>' +
        '<td><div class="row-actions"><button class="btn-icon"><i class="fas fa-pen"></i></button><button class="btn-icon danger"><i class="fas fa-trash"></i></button></div></td></tr>';
    }).join('') || '<tr><td colspan="6" class="muted">Aucun canal.</td></tr>';
  }

  /* AI MANAGER */
  function renderAIManager() {
    var req = document.getElementById('aiRequests');
    var acc = document.getElementById('aiAccuracy');
    var tasks = document.getElementById('aiTasks');
    var status = document.getElementById('aiStatus');
    if (req) req.textContent = '47';
    if (acc) acc.textContent = '94%';
    if (tasks) tasks.textContent = '12';
    if (status) {
      status.innerHTML = '<div class="ai-indicator online"><i class="fas fa-circle-check"></i> IA en ligne - GPT-4 connecté</div>';
    }
    var btn = document.getElementById('aiGenBtn');
    if (btn) {
      btn.addEventListener('click', function () {
        var type = document.getElementById('aiGenType').value;
        var result = document.getElementById('aiGenResult');
        if (!result) return;
        result.innerHTML = '<div class="ai-indicator pending"><i class="fas fa-spinner fa-spin"></i> Génération en cours...</div>';
        setTimeout(function () {
          var texts = {
            description: 'Magnifique villa avec piscine privée située dans un quartier résidentiel calme à Casablanca. 4 chambres, 3 salles de bain, jardin luxuriant. Idéale pour les familles.',
            social: '🇲🇦 Découvrez cette magnifique villa à Casablanca ! Piscine privée, jardin luxuriant. Contactez-nous pour une visite.',
            email: 'Bonjour, je vous présente notre nouvelle propriété disponible. Contactez-nous pour plus d\'informations.'
          };
          result.innerHTML = '<textarea rows="6" style="width:100%;box-sizing:border-box;background:var(--bg-soft);color:var(--text);border:1px solid var(--border);border-radius:8px;padding:12px;">' + (texts[type] || texts.description) + '</textarea>';
        }, 1500);
      });
    }
  }

  /* DOCUMENTS */
  var documents = [
    { name: 'Contrat Villa Casablanca.pdf', type: 'PDF', size: '2.4 MB', date: '2025-12-01' },
    { name: 'Facture Janvier 2026.pdf', type: 'PDF', size: '180 KB', date: '2026-01-01' }
  ];
  function renderDocuments() {
    var body = document.getElementById('docBody');
    if (!body) return;
    body.innerHTML = documents.map(function(d) {
      return '<tr><td><div class="doc-item"><i class="fas fa-file-pdf doc-icon"></i><div class="doc-info"><div class="doc-name">' + esc(d.name) + '</div><div class="doc-meta">' + d.type + ' · ' + d.size + ' · ' + d.date + '</div></div></div></td><td><button class="btn-icon"><i class="fas fa-download"></i></button></td></tr>';
    }).join('') || '<tr><td colspan="5" class="muted">Aucun document.</td></tr>';
  }

  /* NOTIFICATIONS */
  var notifications = [
    { icon: 'fa-calendar-check', text: 'Nouvelle réservation de Ahmed Benali', time: '2h ago', unread: true },
    { icon: 'fa-euro-sign', text: 'Paiement reçu de 4,500 DH', time: '5h ago', unread: true },
    { icon: 'fa-exclamation-triangle', text: 'Maintenance urgente - Villa Marrakech', time: '1j ago', unread: false }
  ];
  function renderNotifications() {
    var list = document.getElementById('notifList');
    if (!list) return;
    list.innerHTML = notifications.map(function(n) {
      return '<div class="notif-item ' + (n.unread ? 'unread' : '') + '"><i class="fas ' + n.icon + ' notif-icon" style="color:var(--gold);"></i><div class="notif-text">' + esc(n.text) + '</div><div class="notif-time">' + n.time + '</div></div>';
    }).join('') || '<p class="muted">Aucune notification.</p>';
    var btn = document.getElementById('notifReadAll');
    if (btn) {
      btn.addEventListener('click', function () {
        notifications.forEach(function (n) { n.unread = false; });
        renderNotifications();
        toast('Tout les notifications lues.');
      });
    }
  }

  /* RAPPORTS */
  function renderReports() {
    var vues = document.getElementById('repVues');
    var vis = document.getElementById('repVisiteurs');
    var rev = document.getElementById('repRev');
    var taux = document.getElementById('repTaux');
    if (vues) vues.textContent = '12,450';
    if (vis) vis.textContent = '3,200';
    if (rev) rev.textContent = '12,450 DH';
    if (taux) taux.textContent = '8.4%';
  }

  /* AUTOMATISATIONS */
  var automations = [
    { trigger: 'Nouvelle réservation', action: 'Notification email + SMS', active: true, last: '2026-01-14' },
    { trigger: 'Paiement reçu', action: 'Confirmer réservation', active: true, last: '2026-01-10' },
    { trigger: 'Ménage terminé', action: 'Notification propriétaire', active: false, last: '—' }
  ];
  function renderAutomations() {
    var body = document.getElementById('autoBody');
    if (!body) return;
    body.innerHTML = automations.map(function(a) {
      return '<tr><td>' + esc(a.trigger) + '</td><td>' + esc(a.action) + '</td><td><div class="toggle ' + (a.active ? 'on' : '') + '"></div></td><td>' + a.last + '</td>' +
        '<td><div class="row-actions"><button class="btn-icon"><i class="fas fa-pen"></i></button><button class="btn-icon danger"><i class="fas fa-trash"></i></button></div></td></tr>';
    }).join('') || '<tr><td colspan="5" class="muted">Aucune automatisation.</td></tr>';
    /* Toggle click */
    body.querySelectorAll('.toggle').forEach(function (t, i) {
      t.addEventListener('click', function () {
        automations[i].active = !automations[i].active;
        t.classList.toggle('on');
        toast('Automatisation ' + (automations[i].active ? 'activée' : 'désactivée') + '.');
      });
    });
  }

  /* PROPRIÉTAIRES */
  var owners = [
    { name: 'Mohamed Alaoui', email: 'mohamed@email.com', phone: '+212 612 345 678', props: 2, commission: '10%' },
    { name: 'Khadija Benjelloun', email: 'khadija@email.com', phone: '+212 698 765 432', props: 1, commission: '8%' }
  ];
  function renderOwners() {
    var body = document.getElementById('ownerBody');
    if (!body) return;
    body.innerHTML = owners.map(function(o) {
      return '<tr><td>' + esc(o.name) + '</td><td>' + esc(o.email) + '</td><td>' + esc(o.phone) + '</td><td>' + o.props + '</td><td>' + o.commission + '</td>' +
        '<td><div class="row-actions"><button class="btn-icon"><i class="fas fa-pen"></i></button><button class="btn-icon danger"><i class="fas fa-trash"></i></button></div></td></tr>';
    }).join('') || '<tr><td colspan="6" class="muted">Aucun proprietaire.</td></tr>';
  }

  function renderAllExtended() {
    renderCalendar();
    renderReservations();
    renderTravelers();
    renderRevenue();
    renderCleanings();
    renderMaintenances();
    renderAccesses();
    renderCompliance();
    renderChannels();
    renderAIManager();
    renderDocuments();
    renderNotifications();
    renderReports();
    renderAutomations();
    renderOwners();
  }

  /* ---------- Navigation 19 sections ---------- */
  function switchView(view) {
    document.querySelectorAll('.view').forEach(function (v) { v.classList.remove('active'); });
    var target = document.getElementById('view-' + view);
    if (target) target.classList.add('active');
    document.querySelectorAll('.nav-link').forEach(function (l) { l.classList.remove('active'); });
    var navLink = document.querySelector('.nav-link[data-view="' + view + '"]');
    if (navLink) navLink.classList.add('active');
    var titles = {
      overview: 'Tableau de bord', stats: 'Statistiques', properties: 'Mes biens', owners: 'Proprietaires',
      calendar: 'Calendrier', reservations: 'Reservations', travelers: 'Voyageurs', revenue: 'Revenus',
      cleaning: 'Menage', maintenance: 'Maintenance', access: 'Acces', compliance: 'Conformite',
      showcase: 'Demonstration', partners: 'Partenaires', channels: 'Canaux', 'ai-manager': 'AI Manager',
      automations: 'Automatisations', services: 'Services', categories: 'Categories', testimonials: 'Temoignages',
      faq: 'FAQ', contacts: 'Contacts', documents: 'Documents', notifications: 'Notifications',
      reports: 'Rapports', settings: 'Reglages'
    };
    var titleEl = document.getElementById('viewTitle');
    if (titleEl) titleEl.textContent = titles[view] || 'Tableau de bord';
    renderAllExtended();
  }

  document.querySelectorAll('.nav-link').forEach(function (link) {
    link.addEventListener('click', function (e) {
      e.preventDefault();
      var view = this.getAttribute('data-view');
      if (view) switchView(view);
    });
  });

  /* ---------- Gestion modal pour nouvelles entités ---------- */
  document.querySelectorAll('[data-new]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var type = this.getAttribute('data-new');
      openModal('Ajouter ' + type, '<div class="muted">Formulaire ' + type + ' - à implémenter.</div>');
    });
  });

  /* ---------- Init ---------- */
  renderAllExtended();
})();
`;

js = js + additions;
fs.writeFileSync(p, js);
console.log('dashboard.js extended with 19 sections');
console.log('Total lines:', js.split('\n').length);
