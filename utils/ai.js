/* ============================================================
   DAR MAROC - COUCHE IA (utils/ai.js)
   Assistant intelligent pour le site :
   - Appelle l'API Google Gemini (gratuite) si une clé est configurée.
   - Sinon (ou en cas d'erreur / quota), bascule automatiquement sur
     un moteur local qui interroge les vraies annonces (Supabase /
     localStorage) : recherche, biens similaires, recommandations.
   Le visiteur ne voit jamais d'erreur : on retombe toujours sur
   un mode qui fonctionne.
   ============================================================ */
(function () {
  'use strict';

  var cfg = (window.DARMAROC_CONFIG && window.DARMAROC_CONFIG.ai && window.DARMAROC_CONFIG.ai.gemini) || {};
  var KEY = cfg.apiKey || '';
  var MODEL = cfg.model || 'gemini-2.0-flash';

  /* ---------- Gestion du catalogue de biens ---------- */
  var CACHE_PROPS = null;

  function loadProperties() {
    if (CACHE_PROPS) return Promise.resolve(CACHE_PROPS);
    var useStore = window.DarMarocStore && window.DarMarocStore.fetchCollection;
    if (useStore) {
      return window.DarMarocStore.fetchCollection('properties').then(function (items) {
        CACHE_PROPS = items || [];
        return CACHE_PROPS;
      }).catch(function () { return []; });
    }
    var d = window.DARMAROC_DATA;
    CACHE_PROPS = (d && d.properties) ? d.properties : [];
    return Promise.resolve(CACHE_PROPS);
  }

  function refreshProperties() {
    CACHE_PROPS = null;
    return loadProperties();
  }

  function normalize(s) {
    return String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }

  function numOfPrice(p) {
    if (!p) return null;
    var s = String(p.price || '').replace(/[^\d]/g, '');
    return s ? Number(s) : null;
  }

  function similarText(a, b) {
    if (!a || !b) return 0;
    var A = normalize(a), B = normalize(b);
    if (!A || !B) return 0;
    var wordsA = A.split(/\s+/).filter(Boolean);
    var wordsB = B.split(/\s+/).filter(Boolean);
    var hit = 0;
    wordsA.forEach(function (w) {
      if (w.length > 2 && wordsB.indexOf(w) !== -1) hit++;
    });
    return hit / Math.max(wordsA.length, 1);
  }

  function scoreProperty(p, query, lang) {
    var q = normalize(query);
    if (!q) return 0;
    var s = 0;
    var fields = [p.fr, p.ar, p.city, p.ville, p.pays, p.categorie, p.area, p.beds, p.price];
    fields.forEach(function (f) {
      s += similarText(f, query);
    });
    // Ville explicite
    if (p.city && q.indexOf(normalize(p.city)) !== -1) s += 2;
    // Type (vente / location / achat / louer / vendre)
    var words = q.split(/\s+/);
    var cat = String(p.cat || '').toLowerCase();
    var wantsSale = /ven|achat|acheter|buy|sale|شراء|بيع/i.test(query);
    var wantsRent = /lou|location|rent|rental|lease|إيجار|كراء/i.test(query);
    if (cat === 'sale' && wantsSale) s += 3;
    if (cat === 'rent' && wantsRent) s += 3;
    if (cat === 'renovation' && /rénov|renov|تجديد/i.test(query)) s += 3;
    if (cat === 'decoration' && /décoration|decor|ديكور/i.test(query)) s += 3;
    // Budget
    var qn = query.replace(/[^\d]/g, '');
    var pn = numOfPrice(p);
    if (qn && pn) {
      var budget = Number(qn);
      var delta = Math.abs(pn - budget) / budget;
      if (delta <= 0.35) s += 4;
      else if (delta <= 0.7) s += 2;
    }
    return s;
  }

  function searchProperties(query, limit) {
    limit = limit || 3;
    return loadProperties().then(function (list) {
      if (!list.length) return [];
      var scored = list
        .map(function (p) { return { p: p, s: scoreProperty(p, query) }; })
        .sort(function (a, b) { return b.s - a.s; });
      var out = scored.filter(function (x) { return x.s > 0; }).slice(0, limit).map(function (x) { return x.p; });
      return out;
    });
  }

  function formatProperty(p) {
    var parts = [];
    if (p.fr) parts.push(p.fr);
    if (p.price) parts.push(p.price);
    if (p.city || p.ville) parts.push(p.city || p.ville);
    if (p.area) parts.push(p.area);
    if (p.beds) parts.push(p.beds + ' ch.');
    if (p.baths) parts.push(p.baths + ' sdb');
    return parts.join(' • ');
  }

  function propertyUrl(p) {
    return p.href || (p.id ? 'properties.html?bien=' + encodeURIComponent(p.id) : 'properties.html');
  }

  function localAnswer(rawText, properties, lang) {
    var t = String(rawText || '').toLowerCase();
    var intro = lang === 'ar' ? '🏠 دار المغرب تقدم لك أفضل ما لديها.' :
                lang === 'en' ? '🏠 Here are the best properties DarMaroc has for you.' :
                '🏠 Voici les biens DarMaroc les plus adaptés :';

    var suggestions = [];
    properties.slice(0, 3).forEach(function (p) {
      var label = formatProperty(p);
      suggestions.push('• ' + label + '  →  ' + propertyUrl(p));
    });

    if (/merci|thank|شكرا|شكراً/.test(t)) {
      return lang === 'ar' ? 'عفواً! نحن في خدمتك دائمًا 😊' :
             lang === 'en' ? 'You are welcome! We are always here for you 😊' :
             'Avec plaisir ! Nous restons à votre disposition 😊';
    }
    if (/horaire|horaire|horaires|heure|open|open.*hour|ساعات|مواعيد|وقت/.test(t)) {
      return lang === 'ar' ? '🕐 أوقات العمل: الاثنين - السبت، من 9 صباحًا إلى 7 مساءً.\n📍 شارع النرجس، أكادير، المغرب.' :
             lang === 'en' ? '🕐 Opening hours: Monday – Saturday, 9am to 7pm.\n📍 Av. Annarjis, Agadir, Morocco.' :
             '🕐 Nos horaires : Lundi – Samedi, 9h à 19h.\n📍 Av. Annarjis, Agadir, Maroc.';
    }
    if (/prix|budget|tarif|combien|cost|price|how much|سعر|ثمن/.test(t)) {
      if (suggestions.length) {
        return (lang === 'ar' ? 'في حدود ميزانيتك، إليك بعض الخيارات:\n' :
                lang === 'en' ? 'Within your budget, here are some options:\n' :
                'Dans votre budget, voici quelques options :\n') + suggestions.join('\n');
      }
      return lang === 'ar' ? '💰 يمكننا اقتراح عقارات تناسب ميزانيتك. أخبرنا بمدينتك المفضلة!' :
             lang === 'en' ? '💰 We can match properties to your budget. Tell us your preferred city!' :
             '💰 Nous pouvons vous proposer des biens selon votre budget. Dites-nous votre ville préférée !';
    }
    if (/contact|join|tel|appel|whatsapp|email|mail|تواصل|اتصال|هاتف/.test(t)) {
      return lang === 'ar' ? '📲 للتواصل:\n• واتساب: +33 7 72 20 88 85\n• هاتف: 0525 26 14 86\n• بريد: Dar.maroc4@gmail.com' :
             lang === 'en' ? '📲 To reach us:\n• WhatsApp: +33 7 72 20 88 85\n• Phone: 0525 26 14 86\n• Email: Dar.maroc4@gmail.com' :
             '📲 Pour nous joindre :\n• WhatsApp : +33 7 72 20 88 85\n• Téléphone : 0525 26 14 86\n• Email : Dar.maroc4@gmail.com';
    }
    if (suggestions.length) {
      return intro + '\n' + suggestions.join('\n');
    }
    return lang === 'ar' ? 'أعتذر، لم أجد عقارًا يطابق طلبك حاليًا 😊 يمكنك التواصل معنا وسنجده لك.' :
           lang === 'en' ? 'Sorry, no property matches your request right now 😊 Contact us and we will find it for you.' :
           'Désolé, aucun bien ne correspond pour le moment 😊 Contactez-nous et nous le trouverons pour vous.';
  }

  /* ---------- Appel Gemini (retourne null si indisponible) ---------- */
  function geminiAsk(userText, lang, systemHint) {
    if (!KEY) return Promise.resolve(null);
    var body = {
      systemInstruction: {
        parts: [{
          text: systemHint || ('Tu es l\'assistant officiel de DarMaroc, agence immobilière au Maroc (Agadir). Réponds en ' +
            (lang === 'ar' ? 'arabe' : lang === 'en' ? 'anglais' : 'français') + '. Sois chaleureux, concis et professionnel.')
        }]
      },
      contents: [{ parts: [{ text: userText }] }],
      generationConfig: { temperature: 0.6, maxOutputTokens: 300 }
    };
    return fetch('https://generativelanguage.googleapis.com/v1beta/models/' + MODEL + ':generateContent?key=' + encodeURIComponent(KEY), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    }).then(function (res) {
      if (!res.ok) return null;
      return res.json();
    }).then(function (json) {
      if (!json || !json.candidates || !json.candidates.length) return null;
      var text = json.candidates[0].content.parts.map(function (p) { return p.text || ''; }).join('');
      return text || null;
    }).catch(function () { return null; });
  }

  /* ---------- API publique ---------- */

  /* Réponse complète : Gemini enrichie par le contexte des biens.
     Retourne toujours une réponse, même sans clé API. */
  function ask(userText, options) {
    options = options || {};
    var lang = options.lang || 'fr';
    var text = String(userText || '').trim();
    if (!text) return Promise.resolve('...');

    return loadProperties().then(function (props) {
      return searchProperties(text, 3).then(function (found) {
        var context = '';
        if (found.length) {
          context = '\n\nBiens DarMaroc pertinents (à recommander si pertinent) :\n' +
            found.map(function (p) {
              return '- ' + formatProperty(p) + ' [' + (p.cat || '') + '] page ' + propertyUrl(p);
            }).join('\n');
        }
        var systemHint = options.systemHint || ('Tu es l\'assistant officiel de DarMaroc, agence immobilière au Maroc (Agadir). Réponds en ' +
          (lang === 'ar' ? 'arabe' : lang === 'en' ? 'anglais' : 'français') + '. Sois chaleureux, concis et professionnel. Si des biens sont listés dans le contexte, propose-les naturellement au visiteur avec leur lien.');

        // On tente Gemini d'abord, avec repli local
        return geminiAsk(text + context, lang, systemHint).then(function (answer) {
          if (answer) return { text: answer, mode: 'gemini', properties: found };
          return { text: localAnswer(text, found, lang), mode: 'local', properties: found };
        });
      });
    }).catch(function () {
      return { text: localAnswer(text, [], lang), mode: 'local', properties: [] };
    });
  }

  function getProperties() { return loadProperties(); }

  window.DarMarocAI = {
    VERSION: 'v1.0',
    ask: ask,
    search: searchProperties,
    getProperties: getProperties,
    refresh: refreshProperties
  };
})();
