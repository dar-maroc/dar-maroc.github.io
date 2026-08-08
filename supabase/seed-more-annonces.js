/* Seed de 13 annonces supplémentaires (6 vente + 7 location) avec de VRAIES photos
   libres de droits (Unsplash, URLs vérifiées HTTP 200). Aucune photo du PC.
   Exécution : node supabase/seed-more-annonces.js
*/
const URL = 'https://hiicfqjubfqgtsfmsxny.supabase.co';
const ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhpaWNmcWp1YmZxZ3RzZm1zeG55Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU5Mzc4NjgsImV4cCI6MjEwMTUxMzg2OH0.HwuOdJe9hAtUS_ory7mWhb9m0He50s2jEY37NuCSISE';

// Résidentiel (appartements / villas) — vérifiées
const RES = [
  'photo-1522708323590-d24dbb6b0267',
  'photo-1493809842364-78817add7ffb',
  'photo-1502672260266-1c1ef2d93688',
  'photo-1560448204-e02f11c3d0e2',
  'photo-1484154218962-a197022b5858',
  'photo-1600585154340-be6161a56a0c',
  'photo-1600596542815-ffad4c1539a9'
];
// Commercial / bureaux / magasins — vérifiées
const COM = [
  'photo-1497366216548-37526070297c',
  'photo-1497366811353-6870744d04b2',
  'photo-1524758631624-e2822e304c36',
  'photo-1441986300917-64674bd600d8',
  'photo-1441984904996-e0b6ba687e04',
  'photo-1486406146926-c627a92ad1ab',
  'photo-1488459716781-31db52582fe9',
  'photo-1460317442991-0ec209397118',
  'photo-1567401893414-76b7b1e5a7a5'
];
const U = (ids) => ids.map(id => `https://images.unsplash.com/${id}?w=800&q=80`);

const ADS = [
  // ---------- VENTE (6) ----------
  { titre: 'Appartement de luxe à Casablanca', desc: 'Appartement de prestige dans un quartier huppé de Casablanca : salon spacieux, cuisine équipée, balcon et résidence sécurisée avec piscine et parking.', type: 'sale', ville: 'Casablanca', cat: 'Appartement', prix: '1 850 000 DH', surface: 145, chambres: 3, sdb: 2, photos: U([RES[0], RES[1], RES[2]]), date: '2026-07-20T10:00:00+00:00' },
  { titre: 'Appartement moderne à Rabat', desc: 'Appartement contemporain, lumineux et fonctionnel au cœur de Rabat. Idéal pour un investissement locatif ou une résidence principale.', type: 'sale', ville: 'Rabat', cat: 'Appartement', prix: '1 350 000 DH', surface: 115, chambres: 3, sdb: 2, photos: U([RES[3], RES[5], RES[0]]), date: '2026-07-21T10:00:00+00:00' },
  { titre: 'Villa avec piscine à Marrakech', desc: 'Villa de standing avec piscine privée, jardin et grand salon ouvert dans un quartier résidentiel calme de Marrakech.', type: 'sale', ville: 'Marrakech', cat: 'Villa', prix: '3 750 000 DH', surface: 380, chambres: 5, sdb: 4, photos: U([RES[4], RES[6], RES[0]]), date: '2026-07-22T10:00:00+00:00' },
  { titre: 'Riad rénové à Fès', desc: 'Riad authentique entièrement rénové au cœur de la médina de Fès, avec patio et fontaine. Idéal pour projet hôtelier ou résidence.', type: 'sale', ville: 'Fès', cat: 'Riad', prix: '2 900 000 DH', surface: 260, chambres: 4, sdb: 3, photos: U([RES[1], RES[3], RES[4]]), date: '2026-07-23T10:00:00+00:00' },
  { titre: 'Local commercial à Casablanca', desc: 'Local commercial de 80 m² sur avenue passante à Casablanca, vitrine sur rue, idéal pour commerce, boutique ou showroom. Fort passage.', type: 'sale', ville: 'Casablanca', cat: 'Local Commercial', prix: '2 400 000 DH', surface: 80, chambres: null, sdb: 1, photos: U([COM[3], COM[4], COM[5]]), date: '2026-07-24T10:00:00+00:00' },
  { titre: 'Bureaux de standing à Casablanca', desc: 'Plateau de bureaux moderne et lumineux de 120 m² dans un immeuble de standing, à proximité des grandes artères de la ville.', type: 'sale', ville: 'Casablanca', cat: 'Bureau', prix: '2 750 000 DH', surface: 120, chambres: null, sdb: 2, photos: U([COM[0], COM[1], COM[2]]), date: '2026-07-25T10:00:00+00:00' },
  // ---------- LOCATION (7) ----------
  { titre: 'Appartement meublé à Casablanca', desc: 'Appartement entièrement meublé et équipé, prêt à vivre, dans un quartier vivant de Casablanca. Disponible pour longue durée.', type: 'rent', ville: 'Casablanca', cat: 'Appartement', prix: '6 500 DH', periode: 'mois', surface: 110, chambres: 2, sdb: 2, photos: U([RES[2], RES[3], RES[5]]), date: '2026-07-26T10:00:00+00:00' },
  { titre: 'Studio équipé à Rabat', desc: 'Studio moderne et lumineux, entièrement équipé, idéal pour étudiant ou jeune actif. Proche université et transports.', type: 'rent', ville: 'Rabat', cat: 'Studio', prix: '3 200 DH', periode: 'mois', surface: 45, chambres: 1, sdb: 1, photos: U([RES[1], RES[2]]), date: '2026-07-27T10:00:00+00:00' },
  { titre: 'Appartement vue mer à Tanger', desc: 'Bel appartement avec vue dégagée sur la mer, proche de la corniche de Tanger. Calme, lumineux et proche des commodités.', type: 'rent', ville: 'Tanger', cat: 'Appartement', prix: '5 500 DH', periode: 'mois', surface: 95, chambres: 2, sdb: 1, photos: U([RES[0], RES[3], RES[5]]), date: '2026-07-28T10:00:00+00:00' },
  { titre: 'Local commercial à Marrakech', desc: 'Local commercial en plein centre de Marrakech, grande vitrine et forte affluence touristique. Idéal pour boutique, café ou artisanat.', type: 'rent', ville: 'Marrakech', cat: 'Local Commercial', prix: '9 000 DH', periode: 'mois', surface: 60, chambres: null, sdb: 1, photos: U([COM[6], COM[8], COM[4]]), date: '2026-07-29T10:00:00+00:00' },
  { titre: 'Boutique en centre-ville d\'Agadir', desc: 'Boutique au rez-de-chaussée d\'un immeuble moderne en plein centre-ville d\'Agadir. Idéale pour commerce de détail ou service.', type: 'rent', ville: 'Agadir', cat: 'Local Commercial', prix: '5 000 DH', periode: 'mois', surface: 40, chambres: null, sdb: 1, photos: U([COM[3], COM[8], COM[7]]), date: '2026-07-30T10:00:00+00:00' },
  { titre: 'Bureau à louer à Rabat', desc: 'Bureau privé au sein d\'un espace de coworking moderne à Rabat. Meublé, internet haut débit et salles de réunion inclus.', type: 'rent', ville: 'Rabat', cat: 'Bureau', prix: '2 800 DH', periode: 'mois', surface: 25, chambres: null, sdb: 1, photos: U([COM[1], COM[2], COM[0]]), date: '2026-07-31T10:00:00+00:00' },
  { titre: 'Villa de vacances à Agadir', desc: 'Villa de vacances lumineuse à quelques minutes de la plage d\'Agadir. Jardin, terrasse et parking privé. Parfaite pour les familles.', type: 'rent', ville: 'Agadir', cat: 'Villa', prix: '600 DH', periode: 'jour', surface: 140, chambres: 3, sdb: 2, photos: U([RES[4], RES[6], RES[1]]), date: '2026-08-02T10:00:00+00:00' }
];

async function main() {
  const headers = { apikey: ANON, Authorization: `Bearer ${ANON}`, 'Content-Type': 'application/json', Prefer: 'return=minimal,resolution=merge-duplicates' };
  let ok = 0, err = 0;
  for (const ad of ADS) {
    const body = {
      titre_fr: ad.titre,
      description_fr: ad.desc,
      type: ad.type,
      pays: 'Maroc',
      categorie: ad.cat,
      ville: ad.ville,
      prix: ad.prix,
      prix_numeric: Number(String(ad.prix).replace(/[^\d]/g, '')) || null,
      periode: ad.periode || '',
      surface: ad.surface,
      chambres: ad.chambres,
      sdb: ad.sdb,
      photos: ad.photos,
      image_principale: ad.photos[0],
      photo_dates: ad.photos.map(() => ad.date),
      statut: 'publie',
      actif: true,
      date_depot: ad.date,
      href_secours: 'contact.html'
    };
    const res = await fetch(`${URL}/rest/v1/annonces`, { method: 'POST', headers, body: JSON.stringify(body) });
    if (res.ok) { ok++; console.log('OK  ', ad.type.padEnd(4), ad.titre); }
    else { err++; console.error('FAIL', ad.titre, res.status, await res.text()); }
  }
  console.log(`\nInsertés : ${ok} / ${ADS.length} (${err} erreurs).`);
}

main().catch(e => { console.error(e); process.exit(1); });
