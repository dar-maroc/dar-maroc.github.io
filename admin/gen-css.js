const fs = require('fs');
const p = 'C:\\Users\\Merouan\\Documents\\Default Project\\dar-maroc-site\\admin\\css\\admin.css';
let css = fs.readFileSync(p, 'utf8');

const additions = `
/* === 19 SECTIONS ADDITIONAL STYLES === */

/* nav group labels */
.nav-group-label {
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 1.5px;
  color: var(--muted);
  padding: 12px 14px 4px;
  font-weight: 800;
}

/* calendar grid */
.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 2px;
  overflow-x: auto;
}
.calendar-grid .cal-day {
  background: var(--bg-soft);
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 6px;
  font-size: 0.78rem;
  min-height: 60px;
}
.calendar-grid .cal-day .cal-date {
  font-weight: 800;
  color: var(--gold);
  font-size: 0.72rem;
}
.calendar-grid .cal-day .cal-event {
  background: rgba(212,175,55,0.15);
  border-radius: 4px;
  padding: 2px 4px;
  margin-top: 2px;
  font-size: 0.7rem;
  cursor: pointer;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.calendar-grid .cal-day.today {
  border-color: var(--gold);
  background: rgba(212,175,55,0.1);
}
.calendar-grid .cal-day.empty {
  background: transparent;
  border: none;
}
.calendar-grid .cal-header {
  font-weight: 800;
  color: var(--gold);
  text-align: center;
  padding: 4px;
  font-size: 0.85rem;
}

/* status badges */
.status-badge {
  display: inline-block;
  padding: 3px 10px;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 700;
}
.status-badge.confirmed { background: rgba(46,204,113,0.15); color: var(--success); }
.status-badge.pending { background: rgba(74,158,224,0.15); color: var(--blue); }
.status-badge.cancelled { background: rgba(224,82,82,0.15); color: var(--danger); }
.status-badge.completed { background: rgba(155,89,182,0.15); color: var(--purple); }
.status-badge.in-progress { background: rgba(212,175,55,0.15); color: var(--gold); }

/* cleaning/maintenance/access rows */
.cleaning-row td, .maint-row td, .access-row td {
  vertical-align: middle;
}
.priority-high { color: var(--danger); font-weight: 800; }
.priority-medium { color: var(--gold); font-weight: 800; }
.priority-low { color: var(--success); font-weight: 800; }

/* channel rows */
.chan-connected { color: var(--success); }
.chan-disconnected { color: var(--danger); }
.chan-syncing { color: var(--blue); }

/* notification items */
.notif-item {
  background: var(--bg-soft);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 14px 18px;
  margin-bottom: 10px;
  display: flex;
  align-items: center;
  gap: 14px;
}
.notif-item.unread { border-left: 3px solid var(--gold); }
.notif-item .notif-icon { font-size: 1.3rem; width: 36px; text-align: center; }
.notif-item .notif-text { flex: 1; }
.notif-item .notif-time { font-size: 0.75rem; color: var(--muted); }

/* document items */
.doc-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  border-bottom: 1px solid rgba(255,255,255,0.04);
}
.doc-item:hover { background: rgba(255,255,255,0.02); }
.doc-item .doc-icon { font-size: 1.5rem; color: var(--gold); }
.doc-item .doc-info { flex: 1; }
.doc-item .doc-name { font-weight: 600; }
.doc-item .doc-meta { font-size: 0.8rem; color: var(--muted); }

/* automation toggle */
.toggle {
  width: 44px;
  height: 24px;
  background: var(--border);
  border-radius: 12px;
  cursor: pointer;
  position: relative;
  transition: background .2s;
}
.toggle.on { background: var(--success); }
.toggle::after {
  content: '';
  position: absolute;
  width: 18px;
  height: 18px;
  background: #fff;
  border-radius: 50%;
  top: 3px;
  left: 3px;
  transition: left .2s;
}
.toggle.on::after { left: 23px; }

/* AI status */
#aiStatus { min-height: 80px; }
.ai-indicator {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
  border-radius: 10px;
  font-weight: 600;
  font-size: 0.88rem;
}
.ai-indicator.online { background: rgba(46,204,113,0.15); color: var(--success); }
.ai-indicator.offline { background: rgba(224,82,82,0.15); color: var(--danger); }
.ai-indicator.pending { background: rgba(212,175,55,0.15); color: var(--gold); }

/* compliance stats */
.comp-stat { display: flex; align-items: center; gap: 10px; }
.comp-bar {
  flex: 1;
  height: 8px;
  background: var(--bg-soft);
  border-radius: 4px;
  overflow: hidden;
}
.comp-bar-fill {
  height: 100%;
  border-radius: 4px;
  transition: width .3s;
}

/* responsive for calendar */
@media (max-width: 768px) {
  .calendar-grid { grid-template-columns: repeat(2, 1fr); }
}
`;

css += additions;
fs.writeFileSync(p, css);
console.log('CSS updated with new section styles');
