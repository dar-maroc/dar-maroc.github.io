const fs = require('fs');
const p = 'C:\\Users\\Merouan\\Documents\\Default Project\\dar-maroc-site\\admin\\dashboard.html';
let html = fs.readFileSync(p, 'utf8');

// Replace sidebar nav
const newNav = `<nav class="sidebar-nav">
      <div class="nav-group-label">Principal</div>
      <a href="#" class="nav-link active" data-view="overview"><i class="fas fa-gauge-high"></i> Tableau de bord</a>
      <a href="#" class="nav-link" data-view="stats"><i class="fas fa-chart-line"></i> Statistiques</a>
      <div class="nav-group-label">Gestion</div>
      <a href="#" class="nav-link" data-view="properties"><i class="fas fa-house"></i> Mes biens</a>
      <a href="#" class="nav-link" data-view="owners"><i class="fas fa-user-group"></i> Proprietaires</a>
      <a href="#" class="nav-link" data-view="calendar"><i class="fas fa-calendar"></i> Calendrier</a>
      <a href="#" class="nav-link" data-view="reservations"><i class="fas fa-calendar-check"></i> Reservations</a>
      <a href="#" class="nav-link" data-view="travelers"><i class="fas fa-passport"></i> Voyageurs</a>
      <a href="#" class="nav-link" data-view="revenue"><i class="fas fa-euro-sign"></i> Revenus</a>
      <div class="nav-group-label">Operations</div>
      <a href="#" class="nav-link" data-view="cleaning"><i class="fas fa-broom"></i> Menage</a>
      <a href="#" class="nav-link" data-view="maintenance"><i class="fas fa-wrench"></i> Maintenance</a>
      <a href="#" class="nav-link" data-view="access"><i class="fas fa-key"></i> Acces</a>
      <a href="#" class="nav-link" data-view="compliance"><i class="fas fa-shield-halved"></i> Conformite</a>
      <div class="nav-group-label">Marketing & IA</div>
      <a href="#" class="nav-link" data-view="showcase"><i class="fas fa-video"></i> Demonstration</a>
      <a href="#" class="nav-link" data-view="partners"><i class="fas fa-handshake"></i> Partenaires</a>
      <a href="#" class="nav-link" data-view="channels"><i class="fas fa-comments"></i> Canaux</a>
      <a href="#" class="nav-link" data-view="ai-manager"><i class="fas fa-robot"></i> AI Manager</a>
      <a href="#" class="nav-link" data-view="automations"><i class="fas fa-gears"></i> Automatisations</a>
      <div class="nav-group-label">Contenu & Systeme</div>
      <a href="#" class="nav-link" data-view="services"><i class="fas fa-wrench"></i> Services</a>
      <a href="#" class="nav-link" data-view="categories"><i class="fas fa-layer-group"></i> Categories</a>
      <a href="#" class="nav-link" data-view="testimonials"><i class="fas fa-star"></i> Temoignages</a>
      <a href="#" class="nav-link" data-view="faq"><i class="fas fa-circle-question"></i> FAQ</a>
      <a href="#" class="nav-link" data-view="contacts"><i class="fas fa-address-book"></i> Contacts</a>
      <a href="#" class="nav-link" data-view="documents"><i class="fas fa-folder"></i> Documents</a>
      <a href="#" class="nav-link" data-view="notifications"><i class="fas fa-bell"></i> Notifications</a>
      <a href="#" class="nav-link" data-view="reports"><i class="fas fa-file-lines"></i> Rapports</a>
      <a href="#" class="nav-link" data-view="users"><i class="fas fa-users"></i> Utilisateurs</a>
      <a href="#" class="nav-link" data-view="settings"><i class="fas fa-gear"></i> Reglages</a>
    </nav>`;
const oldNavMatch = html.match(/<nav class="sidebar-nav">[\s\S]*?<\/nav>/);
if (oldNavMatch) {
  html = html.replace(oldNavMatch[0], newNav);
}

// Update viewTitle default text
html = html.replace('<h2 id="viewTitle">Aperçu</h2>', '<h2 id="viewTitle">Tableau de bord</h2>');

fs.writeFileSync(p, html);
console.log('dashboard.html: sidebar updated');
