/* ============================================================
   DAR MAROC - RENDU DES BIENS (properties.js)
   Affiche les cartes de biens immobiliers, locations,
   rénovations et décorations depuis le CMS (localStorage) ou
   les données statiques par défaut (data.js).
   Le bouton "Voir le bien" ouvre une galerie de photos et/ou
   le lien externe (Facebook / Instagram / TikTok / YouTube).
   ============================================================ */
(function () {
  'use strict';

  var grid = document.getElementById('propertiesGrid');
  if (!grid) return;

  var STORE_KEY = 'darmaroc-admin-data-v1';

  var properties = [];

  function sortNewest(list) {
    return list.slice().sort(function (a, b) {
      var ta = a.createdAt || '', tb = b.createdAt || '';
      if (ta && tb) return ta < tb ? 1 : ta > tb ? -1 : 0;
      if (ta) return -1;
      if (tb) return 1;
      return 0;
    });
  }

  function loadLocalProps() {
    try {
      var raw = localStorage.getItem(STORE_KEY);
      if (raw) {
        var parsed = JSON.parse(raw);
        if (parsed && Array.isArray(parsed.properties) && parsed.properties.length) return parsed.properties;
      }
    } catch (e) {}
    if (window.DARMAROC_DATA && window.DARMAROC_DATA.properties) return window.DARMAROC_DATA.properties;
    return [];
  }

  var AR_PERIOD = { jour: 'يوم', mois: 'شهر', nuit: 'ليلة' };
  var CATS = {
    sale: { badge: 'À vendre', badgeAr: 'للبيع', style: '' },
    rent: { badge: 'À louer', badgeAr: 'للإيجار', style: '' },
    renovation: { badge: 'Rénové', badgeAr: 'مجدّد', style: 'background:#2d8a4e;' },
    decoration: { badge: 'Décoration', badgeAr: 'ديكور', style: 'background:#9b59b6;' }
  };

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function fmtDate(iso) {
    if (!iso) return '';
    var d = new Date(String(iso));
    if (isNaN(d.getTime())) return '';
    try { return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }); } catch (e) { return String(iso); }
  }

  function detail(icon, text) {
    return '<span class="property-detail"><i class="fas ' + esc(icon) + '"></i> ' + esc(text) + '</span>';
  }

  function renderCards() {
    grid.innerHTML = properties.map(function (p, i) {
      var cat = CATS[p.cat] || CATS.sale;
      var badgeStyle = cat.style ? ' style="' + cat.style + '"' : '';
      if (p.badgeColor) badgeStyle = ' style="background:' + esc(p.badgeColor) + ';"';

      var priceHTML = esc(p.price || '');
      if (p.period) {
        var arP = AR_PERIOD[p.period] || p.period;
        priceHTML = esc(p.price || '') + ' / <span data-fr="' + esc(p.period) + '" data-ar="' + esc(arP) + '">' + esc(p.period) + '</span>';
      }

      var details = '';
      if (p.cat === 'sale' || p.cat === 'rent') {
        if (p.area) details += detail('fa-arrows-alt', p.area);
        if (p.beds) details += detail('fa-bed', String(p.beds));
        if (p.baths) details += detail('fa-bath', String(p.baths));
      } else if (p.cat === 'renovation') {
        if (p.area) details += detail('fa-arrows-alt', p.area);
        if (p.time) details += detail('fa-clock', p.time);
      } else if (p.cat === 'decoration') {
        if (p.style) details += detail('fa-palette', p.style);
        if (p.area) details += detail('fa-couch', p.area);
      }

      var isImmo = p.cat === 'sale' || p.cat === 'rent';
      var ctaText = isImmo ? 'Voir le bien' : 'Voir le projet';
      var ctaTextAr = isImmo ? 'عرض العقار' : 'عرض المشروع';

      return '<div class="property-card" data-category="' + esc(p.cat) + '">' +
        '<div class="property-image">' +
        '<img src="' + esc(p.img || '') + '" alt="' + esc(p.alt || p.fr || '') + '" loading="lazy" decoding="async">' +
        '<span class="property-badge"' + badgeStyle + ' data-fr="' + esc(cat.badge) + '" data-ar="' + esc(cat.badgeAr) + '">' + esc(cat.badge) + '</span>' +
        '</div>' +
        '<div class="property-body">' +
        '<div class="property-price">' + priceHTML + '</div>' +
        '<div class="property-city"><i class="fas fa-location-dot"></i> ' + esc(p.city || '') + '</div>' +
        '<div class="property-details">' + details + '</div>' +
        '<button type="button" class="btn btn-outline btn-sm property-cta" data-idx="' + i + '"><span data-fr="' + esc(ctaText) + '" data-ar="' + esc(ctaTextAr) + '">' + esc(ctaText) + '</span> <i class="fas fa-arrow-right"></i></button>' +
        '</div></div>';
    }).join('');
  }

  properties = sortNewest(loadLocalProps());
  renderCards();

  /* Synchronisation Supabase : dès que les données arrivent de la base,
     les cartes sont régénérées (les données ne disparaissent jamais). */
  if (window.DarMarocStore && window.DarMarocStore.hasBackend()) {
    window.DarMarocStore.fetchCollection('properties').then(function (items) {
      if (items && items.length) {
        properties = sortNewest(items);
        renderCards();
      }
    });
  }

  /* ---------- Lightbox galerie + lien externe ---------- */
  var lightbox = document.getElementById('propLightbox');
  var lightboxBox = document.getElementById('propLightboxBox');
  var lightboxImg = document.getElementById('propLightboxImg');
  var lightboxMain = document.getElementById('propLightboxMain');
  var lightboxThumbs = document.getElementById('propLightboxThumbs');
  var lightboxTitle = document.getElementById('propLightboxTitle');
  var lightboxMeta = document.getElementById('propLightboxMeta');
  var lightboxLink = document.getElementById('propLightboxLink');
  var lightboxLinkLabel = document.getElementById('propLightboxLinkLabel');
  var lightboxZoom = document.getElementById('propLightboxZoom');
  var lightboxZoomHint = document.getElementById('propLightboxZoomHint');
  var lightboxVideo = document.getElementById('propLightboxVideo');
  var lightboxPhotoDate = document.getElementById('propLightboxPhotoDate');

  var currentPhotos = [];
  var currentDates = [];
  var currentIndex = 0;
  var fullscreen = false;
  var AUTO_MS = 4000;
  var autoTimer = null;

  function stopAuto() {
    if (autoTimer) { clearInterval(autoTimer); autoTimer = null; }
  }

  function startAuto() {
    stopAuto();
    if (!lightbox || lightbox.hidden || !currentPhotos || currentPhotos.length < 2) return;
    autoTimer = setInterval(function () {
      if (!lightbox || lightbox.hidden) { stopAuto(); return; }
      showPhoto(currentIndex + 1);
    }, AUTO_MS);
  }

  function navTo(k) {
    showPhoto(k);
    stopAuto();
    startAuto();
  }

  function detectPlatform(url) {
    var u = String(url || '');
    if (/facebook\.com|fb\.com/i.test(u)) return 'Facebook';
    if (/instagram\.com/i.test(u)) return 'Instagram';
    if (/tiktok\.com/i.test(u)) return 'TikTok';
    if (/youtube\.com|youtu\.be/i.test(u)) return 'YouTube';
    if (/vimeo\.com/i.test(u)) return 'Vimeo';
    return '';
  }

  function isVideoUrl(url) {
    return /youtube\.com|youtu\.be|vimeo\.com|facebook\.com.*(video|reel)|fb\.watch|instagram\.com\/(reel|p)|tiktok\.com.*video/i.test(String(url || ''));
  }

  function youtubeEmbed(url) {
    var m = String(url || '').match(/(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([A-Za-z0-9_-]{6,})/);
    return m ? 'https://www.youtube.com/embed/' + m[1] : '';
  }

  function vimeoEmbed(url) {
    var m = String(url || '').match(/vimeo\.com\/(?:video\/)?(\d+)/);
    return m ? 'https://player.vimeo.com/video/' + m[1] : '';
  }

  function setVideo(embedUrl) {
    if (!lightboxVideo) return;
    if (embedUrl) {
      lightboxVideo.hidden = false;
      lightboxVideo.innerHTML = '<iframe src="' + esc(embedUrl) + '" title="Vidéo du bien" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen loading="lazy"></iframe>';
    } else {
      lightboxVideo.hidden = true;
      lightboxVideo.innerHTML = '';
    }
  }

  function linkLabel(url) {
    var platform = detectPlatform(url);
    var isVideo = isVideoUrl(url);
    var prefix = isVideo ? '▶ Voir la vidéo' : 'Voir la page';
    if (!platform) return isVideo ? '▶ Voir la vidéo' : 'Voir le lien';
    return prefix + ' (' + platform + ')';
  }

  function showPhoto(i) {
    if (!currentPhotos.length) return;
    currentIndex = (i + currentPhotos.length) % currentPhotos.length;
    lightboxImg.src = currentPhotos[currentIndex];
    if (lightboxPhotoDate) {
      var d = currentDates[currentIndex];
      lightboxPhotoDate.textContent = d ? '📅 Ajoutée le ' + fmtDate(d) : '';
    }
    if (lightboxThumbs) {
      var thumbs = lightboxThumbs.querySelectorAll('img');
      thumbs.forEach(function (t, k) { t.classList.toggle('active', k === currentIndex); });
    }
  }

  function enterNativeFullscreen() {
    var el = document.documentElement;
    try {
      if (el.requestFullscreen) el.requestFullscreen();
      else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
    } catch (e) {}
  }

  function exitNativeFullscreen() {
    try {
      if (document.fullscreenElement || document.webkitFullscreenElement) {
        if (document.exitFullscreen) document.exitFullscreen();
        else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
      }
    } catch (e) {}
  }

  function updateZoomUI() {
    if (lightboxZoom) {
      lightboxZoom.innerHTML = fullscreen ? '<i class="fas fa-compress"></i>' : '<i class="fas fa-expand"></i>';
      lightboxZoom.title = fullscreen ? 'Réduire' : 'Plein écran';
    }
    if (lightboxZoomHint) lightboxZoomHint.style.display = fullscreen ? 'none' : 'flex';
  }

  function toggleFullscreen() {
    fullscreen = !fullscreen;
    if (lightbox) lightbox.classList.toggle('fullscreen', fullscreen);
    updateZoomUI();
    if (fullscreen) { stopAuto(); enterNativeFullscreen(); }
    else {
      if (lightbox && !lightbox.hidden && currentPhotos.length > 1) startAuto();
      exitNativeFullscreen();
    }
  }

  function onFullscreenChange() {
    var nativeOn = !!(document.fullscreenElement || document.webkitFullscreenElement);
    if (nativeOn && !fullscreen) {
      fullscreen = true;
      if (lightbox) lightbox.classList.add('fullscreen');
      updateZoomUI();
    } else if (!nativeOn && fullscreen) {
      fullscreen = false;
      if (lightbox) lightbox.classList.remove('fullscreen');
      updateZoomUI();
    }
  }
  document.addEventListener('fullscreenchange', onFullscreenChange);
  document.addEventListener('webkitfullscreenchange', onFullscreenChange);

  function openProperty(idx) {
    var p = properties[idx];
    if (!p) return;
    if (window.DarMarocSEO && window.DarMarocSEO.update) {
      try { window.DarMarocSEO.update(p); } catch (e) {}
    }
    if (window.DarMarocStats && window.DarMarocStats.track) {
      try { window.DarMarocStats.track('property_view', p.fr || p.ar || 'Annonce', { ville: p.city || '', prix: p.price || '' }); } catch (e) {}
    }
    var videoEmbed = youtubeEmbed(p.link || '') || vimeoEmbed(p.link || '');
    currentPhotos = (p.photos && p.photos.length) ? p.photos.map(function (u) { return typeof u === 'string' ? u : (u && u.url) || ''; }).filter(Boolean) : (p.img ? [p.img] : []);
    currentDates = (p.photoDates && p.photoDates.length) ? p.photoDates.slice() : [];
    if (!currentPhotos.length) {
      if (videoEmbed) {
        setVideo(videoEmbed);
        if (lightboxTitle) lightboxTitle.textContent = p.fr || '';
        if (lightboxMeta) {
          var metaParts = [];
          if (p.price) metaParts.push(p.price);
          if (p.city) metaParts.push(p.city);
          if (p.area) metaParts.push(p.area);
          if (p.beds) metaParts.push(p.beds + ' ch.');
          if (p.baths) metaParts.push(p.baths + ' sdb');
          lightboxMeta.textContent = metaParts.join(' • ');
        }
        if (lightboxMain) lightboxMain.hidden = true;
        if (lightboxThumbs) lightboxThumbs.hidden = true;
        if (lightboxLink) {
          if (p.link) {
            lightboxLink.href = p.link;
            if (lightboxLinkLabel) lightboxLinkLabel.textContent = linkLabel(p.link);
            lightboxLink.hidden = false;
          } else {
            lightboxLink.hidden = true;
          }
        }
        if (fullscreen) toggleFullscreen();
        if (lightbox) lightbox.hidden = false;
        document.body.style.overflow = 'hidden';
        return;
      }
      if (p.link) { window.open(p.link, '_blank', 'noopener'); return; }
      window.location.href = p.href || 'contact.html';
      return;
    }
    if (lightboxTitle) lightboxTitle.textContent = p.fr || '';
    if (lightboxMeta) {
      var parts = [];
      if (p.price) parts.push(p.price);
      if (p.city) parts.push(p.city);
      if (p.area) parts.push(p.area);
      if (p.beds) parts.push(p.beds + ' ch.');
      if (p.baths) parts.push(p.baths + ' sdb');
      lightboxMeta.textContent = parts.join(' • ');
    }
    setVideo(videoEmbed);
    if (lightboxMain) lightboxMain.hidden = false;
    if (lightboxThumbs) lightboxThumbs.hidden = false;
    if (lightboxLink) {
      if (p.link) {
        lightboxLink.href = p.link;
        if (lightboxLinkLabel) lightboxLinkLabel.textContent = linkLabel(p.link);
        lightboxLink.hidden = false;
      } else {
        lightboxLink.hidden = true;
      }
    }
    if (fullscreen) toggleFullscreen();
    showPhoto(0);
    if (lightboxThumbs) {
      lightboxThumbs.innerHTML = currentPhotos.map(function (src, k) {
        var d = currentDates[k] ? fmtDate(currentDates[k]) : '';
        return '<div class="prop-thumb">' +
          '<img src="' + esc(src) + '" alt="Photo ' + (k + 1) + '" data-t="' + k + '" class="' + (k === 0 ? 'active' : '') + '" loading="lazy" decoding="async">' +
          (d ? '<span class="prop-thumb-date">' + esc(d) + '</span>' : '') +
          '</div>';
      }).join('');
    }
    if (lightbox) lightbox.hidden = false;
    document.body.style.overflow = 'hidden';
    startAuto();
  }

  function closeLightbox() {
    stopAuto();
    if (window.DarMarocSEO && window.DarMarocSEO.reset) {
      try { window.DarMarocSEO.reset(); } catch (e) {}
    }
    if (lightbox) lightbox.hidden = true;
    if (lightboxPhotoDate) lightboxPhotoDate.textContent = '';
    if (fullscreen) {
      fullscreen = false;
      exitNativeFullscreen();
      if (lightbox) lightbox.classList.remove('fullscreen');
    }
    if (lightboxZoomHint) lightboxZoomHint.style.display = 'flex';
    setVideo('');
    if (lightboxMain) lightboxMain.hidden = false;
    if (lightboxThumbs) lightboxThumbs.hidden = false;
    document.body.style.overflow = '';
  }

  grid.addEventListener('click', function (e) {
    var btn = e.target.closest('.property-cta');
    if (btn) openProperty(Number(btn.dataset.idx));
  });

  if (lightbox) {
    lightbox.addEventListener('click', function (e) {
      if (e.target === lightbox) closeLightbox();
    });
    document.getElementById('propLightboxClose').addEventListener('click', closeLightbox);
    if (lightboxZoom) lightboxZoom.addEventListener('click', toggleFullscreen);
    if (lightboxMain) lightboxMain.addEventListener('click', toggleFullscreen);
    if (lightboxZoomHint) lightboxZoomHint.addEventListener('click', function (e) { e.stopPropagation(); toggleFullscreen(); });
    document.addEventListener('keydown', function (e) {
      if (lightbox.hidden) return;
      if (e.key === 'Escape') { if (fullscreen) toggleFullscreen(); else closeLightbox(); }
      if (e.key === 'ArrowRight') navTo(currentIndex + 1);
      if (e.key === 'ArrowLeft') navTo(currentIndex - 1);
    });
    document.getElementById('propLightboxNext').addEventListener('click', function () { navTo(currentIndex + 1); });
    document.getElementById('propLightboxPrev').addEventListener('click', function () { navTo(currentIndex - 1); });
    if (lightboxThumbs) {
      lightboxThumbs.addEventListener('click', function (e) {
        var t = e.target.closest('img[data-t]');
        if (t) navTo(Number(t.dataset.t));
      });
    }
    if (lightboxBox) {
      lightboxBox.addEventListener('mouseenter', stopAuto);
      lightboxBox.addEventListener('mouseleave', function () {
        if (!lightbox || lightbox.hidden || fullscreen) return;
        if (currentPhotos.length > 1) startAuto();
      });
    }
  }
})();
