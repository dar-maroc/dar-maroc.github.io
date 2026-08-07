/* Seed d'annonces réelles (vente + location) à partir des photos du Storage.
   Nécessite d'abord : ALTER TABLE public.annonces
     ADD COLUMN IF NOT EXISTS pays text DEFAULT '';
     ADD COLUMN IF NOT EXISTS categorie text DEFAULT '';
     ADD COLUMN IF NOT EXISTS photo_dates jsonb DEFAULT '[]'::jsonb;
   Exécution : node supabase/seed-real-annonces.js
*/
const fs = require('fs');
const path = require('path');

const URL = 'https://hiicfqjubfqgtsfmsxny.supabase.co';
const ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhpaWNmcWp1YmZxZ3RzZm1zeG55Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU5Mzc4NjgsImV4cCI6MjEwMTUxMzg2OH0.HwuOdJe9hAtUS_ory7mWhb9m0He50s2jEY37NuCSISE';
const BUCKET = 'annonces';
const base = (folder, file) => `${URL}/storage/v1/object/public/${BUCKET}/${folder}/${file}`;
const photos = (folder, files) => files.map(f => base(folder, f));

const catVilla = 'Villa';
const catAppart = 'Appartement';
const catRiad = 'Riad';

const ADS = [
  {
    titre_fr: 'Villa de luxe avec piscine à Agadir',
    description_fr: 'Magnifique villa de luxe avec piscine privée, jardin paysager, grande terrasse avec vue panoramique sur la mer. Idéale pour les séjours haut de gamme ou l\'investissement.',
    type: 'sale',
    pays: 'Maroc',
    categorie: catVilla,
    ville: 'Agadir',
    prix: '3 200 000 DH',
    surface: 480,
    chambres: 6,
    sdb: 5,
    photos: photos('idmsgjil5o8ik92', [
      'msgjj7fj-1000035683.jpg', 'msgjj7jf-1000035684.jpg', 'msgjj7mb-1000035685.jpg',
      'msgjj7o8-1000035686.jpg', 'msgjj7q9-1000035687.jpg', 'msgjj7sa-1000035688.jpg',
      'msgjj7u6-1000035689.jpg', 'msgjj7w7-1000035690.jpg', 'msgjj7y5-1000035691.jpg',
      'msgjj80k-1000035692.jpg', 'msgjj82x-1000035693.jpg', 'msgjj854-1000035694.jpg',
      'msgjj87n-1000035695.jpg', 'msgjj8a0-1000035696.jpg', 'msgjj8bx-1000035697.jpg',
      'msgjj8ga-1000035698.jpg', 'msgjj8ir-1000035699.jpg'
    ]),
    date: '2026-07-28T10:00:00+00:00'
  },
  {
    titre_fr: 'Riad traditionnel rénové à Marrakech',
    description_fr: 'Riad authentique entièrement rénové au cœur de la médina de Marrakech. Patio central, bassin traditionnel et terrasse panoramique sur l\'Atlas. Rare sur le marché.',
    type: 'sale',
    pays: 'Maroc',
    categorie: catRiad,
    ville: 'Marrakech',
    prix: '4 500 000 DH',
    surface: 320,
    chambres: 5,
    sdb: 4,
    photos: photos('idmsgjogxu6hh8j', [
      'msgjrdcy-ChatGPT-Image-28-juil-2026-16-.jpg',
      'msgjrdwd-ChatGPT-Image-28-juil-2026-16-.jpg',
      'msgjre1z-ChatGPT-Image-28-juil-2026-20-.jpg',
      'msgjre46-ChatGPT-Image-28-juil-2026-20-.jpg',
      'msgjre9z-ChatGPT-Image-28-juil-2026-13-.jpg',
      'msgjred7-ChatGPT-Image-28-juil-2026-20-.jpg'
    ]),
    date: '2026-07-29T10:00:00+00:00'
  },
  {
    titre_fr: 'Appartement moderne avec vue mer à Casablanca',
    description_fr: 'Appartement moderne de standing avec vue mer, situé dans une résidence sécurisée à Casablanca. Prestations haut de gamme, cuisine équipée et balcon spacieux.',
    type: 'rent',
    pays: 'Maroc',
    categorie: catAppart,
    ville: 'Casablanca',
    prix: '4 500 DH',
    periode: 'mois',
    surface: 120,
    chambres: 3,
    sdb: 2,
    photos: photos('idmsglzx8c9judu', [
      'msgm2rth-ChatGPT-Image-28-juil-2026-20-.jpg',
      'msgm2sff-ChatGPT-Image-28-juil-2026-20-.jpg',
      'msgm2sjl-ChatGPT-Image-28-juil-2026-16-.jpg'
    ]),
    date: '2026-07-30T10:00:00+00:00'
  },
  {
    titre_fr: 'Appartement lumineux en centre-ville de Rabat',
    description_fr: 'Bel appartement lumineux en plein centre-ville de Rabat, proche de toutes les commodités. Idéal pour famille ou professionnels. Disponible immédiatement.',
    type: 'rent',
    pays: 'Maroc',
    categorie: catAppart,
    ville: 'Rabat',
    prix: '3 800 DH',
    periode: 'mois',
    surface: 95,
    chambres: 2,
    sdb: 2,
    photos: photos('idmsgmyvc9ya719', [
      'msgn0lga-ChatGPT-Image-28-juil-2026-16-.jpg',
      'msgn0liw-ChatGPT-Image-28-juil-2026-20-.jpg',
      'msgn0lp2-ChatGPT-Image-28-juil-2026-20-.jpg',
      'msgn0lrc-ChatGPT-Image-28-juil-2026-16-.jpg',
      'msgn0mcz-ChatGPT-Image-28-juil-2026-13-.jpg'
    ]),
    date: '2026-07-31T10:00:00+00:00'
  },
  {
    titre_fr: 'Villa avec jardin à Tanger',
    description_fr: 'Villa familiale avec jardin et terrasse à Tanger. Quartier calme et résidentiel, à quelques minutes des plages. Idéale pour une location longue durée.',
    type: 'rent',
    pays: 'Maroc',
    categorie: catVilla,
    ville: 'Tanger',
    prix: '8 000 DH',
    periode: 'mois',
    surface: 260,
    chambres: 4,
    sdb: 3,
    photos: photos('idmsgn77dkpclnq', [
      'msgn8i46-ChatGPT-Image-28-juil-2026-16-.jpg',
      'msgn8ia3-ChatGPT-Image-28-juil-2026-13-.jpg',
      'msgn8idj-ChatGPT-Image-28-juil-2026-20-.jpg',
      'msgn8iim-ChatGPT-Image-28-juil-2026-16-.jpg'
    ]),
    date: '2026-08-01T10:00:00+00:00'
  }
];

async function main() {
  const headers = {
    apikey: ANON,
    Authorization: `Bearer ${ANON}`,
    'Content-Type': 'application/json',
    Prefer: 'return=minimal,resolution=merge-duplicates'
  };
  let ok = 0, err = 0;
  for (const ad of ADS) {
    const date = ad.date;
    const photo_dates = ad.photos.map(() => date);
    const body = {
      titre_fr: ad.titre_fr,
      description_fr: ad.description_fr,
      type: ad.type,
      pays: ad.pays,
      categorie: ad.categorie,
      ville: ad.ville,
      prix: ad.prix,
      prix_numeric: Number(String(ad.prix).replace(/[^\d]/g, '')) || null,
      periode: ad.periode || '',
      surface: ad.surface,
      chambres: ad.chambres,
      sdb: ad.sdb,
      photos: ad.photos,
      image_principale: ad.photos[0],
      photo_dates,
      statut: 'publie',
      actif: true,
      date_depot: date,
      href_secours: 'contact.html'
    };
    const res = await fetch(`${URL}/rest/v1/annonces`, { method: 'POST', headers, body: JSON.stringify(body) });
    if (res.ok) { ok++; console.log('OK  ', ad.titre_fr); }
    else { err++; console.error('FAIL', ad.titre_fr, res.status, await res.text()); }
  }
  console.log(`\nInsertés : ${ok} / ${ADS.length} (${err} erreurs).`);
}

main().catch(e => { console.error(e); process.exit(1); });
