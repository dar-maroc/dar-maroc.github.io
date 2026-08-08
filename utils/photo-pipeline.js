/* ============================================================
   DAR MAROC - PIPELINE PHOTOS IA (utils/photo-pipeline.js)
   Optimisation automatique des photos publiées :
   - Conversion en WebP (avec repli JPEG si navigateur incompatible)
   - Redimensionnement HD (1600px max) + compression qualité
   - Watermark logo DarMaroc incrusté automatiquement
   - Visite virtuelle 360 (drag + gyroscope) quand plusieurs photos
   - Génération d'une vidéo de présentation (diaporama animé)
   N'utilise QUE les API navigateur (canvas, MediaRecorder) : aucun
   coût, aucune clé, le design existant reste intact.
   ============================================================ */
(function () {
  'use strict';

  var cfg = window.DARMAROC_CONFIG || {};

  /* Option : logo watermark personnalisable dans site-config.js */
  var WP = (cfg.photoPipeline && cfg.photoPipeline.watermark) || {};
  var LOGO_URL = WP.logoUrl || 'images/logo.png';
  var WP_POS = WP.position || 'br';      // br, bl, tr, tl
  var WP_SIZE = WP.size || 0.18;         // fraction de la largeur de l'image
  var WP_OPACITY = WP.opacity != null ? WP.opacity : 0.85;
  var HD_MAX = (cfg.photoPipeline && cfg.photoPipeline.maxWidth) || 1600;
  var QUALITY = (cfg.photoPipeline && cfg.photoPipeline.quality) || 0.82;

  var _logoImg = null;
  var _logoReady = null;

  function supportsWebP() {
    var c = document.createElement('canvas');
    return typeof c.toDataURL === 'function' && c.toDataURL('image/webp').indexOf('data:image/webp') === 0;
  }

  function loadLogo() {
    if (_logoReady) return _logoReady;
    _logoReady = new Promise(function (resolve) {
      var img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = function () { _logoImg = img; resolve(true); };
      img.onerror = function () { resolve(false); };
      img.src = LOGO_URL;
    });
    return _logoReady;
  }

  /* Redimensionne + convertit une image (dataURL) en WebP/JPEG. */
  function processImage(dataUrl, opts, cb) {
    opts = opts || {};
    var maxW = opts.maxWidth || HD_MAX;
    var quality = opts.quality != null ? opts.quality : QUALITY;
    var watermark = opts.watermark !== false;
    var ext = opts.ext || 'auto';

    try {
      var img = new Image();
      img.onload = function () {
        try {
          var w = img.width || 1, h = img.height || 1;
          var scale = Math.min(1, maxW / w);
          var nw = Math.max(1, Math.round(w * scale));
          var nh = Math.max(1, Math.round(h * scale));
          var canvas = document.createElement('canvas');
          canvas.width = nw;
          canvas.height = nh;
          var ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, nw, nh);

          /* Watermark logo */
          if (watermark) {
            loadLogo().then(function (ok) {
              if (ok && _logoImg) {
                drawWatermark(ctx, nw, nh);
              }
              finish();
            });
          } else {
            finish();
          }

          function finish() {
            var useWebP = ext !== 'jpeg' && supportsWebP();
            var type = useWebP ? 'image/webp' : 'image/jpeg';
            var out;
            try {
              out = canvas.toDataURL(type, quality);
            } catch (e) {
              out = canvas.toDataURL('image/jpeg', quality);
            }
            if (!out || out.indexOf('data:image/webp') !== 0 && useWebP) {
              out = canvas.toDataURL('image/jpeg', quality);
            }
            cb(out && out.length < dataUrl.length ? out : dataUrl);
          }
        } catch (e) { cb(dataUrl); }
      };
      img.onerror = function () { cb(dataUrl); };
      img.src = dataUrl;
    } catch (e) { cb(dataUrl); }
  }

  function drawWatermark(ctx, w, h) {
    var lw = Math.max(60, Math.round(w * WP_SIZE));
    var lh = Math.round(lw * (_logoImg.height / _logoImg.width));
    var pad = Math.round(lw * 0.15);
    var x, y;
    switch (WP_POS) {
      case 'bl': x = pad; y = h - lh - pad; break;
      case 'tl': x = pad; y = pad; break;
      case 'tr': x = w - lw - pad; y = pad; break;
      default: x = w - lw - pad; y = h - lh - pad; break; // br
    }
    ctx.globalAlpha = WP_OPACITY;
    ctx.drawImage(_logoImg, x, y, lw, lh);
    ctx.globalAlpha = 1;
  }

  /* Génère un canvas photo + titre (utilisé pour la vidéo). */
  function renderSlide(photoUrl, title, price, width, height) {
    return new Promise(function (resolve) {
      var img = new Image();
      img.onload = function () {
        try {
          var cw = width || 1080, ch = height || 1350;
          var canvas = document.createElement('canvas');
          canvas.width = cw; canvas.height = ch;
          var ctx = canvas.getContext('2d');
          ctx.fillStyle = '#0F0F0F';
          ctx.fillRect(0, 0, cw, ch);
          var ir = Math.min(cw / img.width, ch / img.height) * 0.92;
          var iw = img.width * ir, ih = img.height * ir;
          ctx.drawImage(img, (cw - iw) / 2, (ch - ih) / 2 - ch * 0.04, iw, ih);
          ctx.fillStyle = 'rgba(15,15,15,0.55)';
          ctx.fillRect(0, ch * 0.72, cw, ch * 0.28);
          ctx.fillStyle = '#D4AF37';
          ctx.textAlign = 'center';
          ctx.font = 'bold ' + Math.round(cw * 0.05) + 'px Raleway, sans-serif';
          ctx.fillText(title || 'DarMaroc', cw / 2, ch * 0.78, cw * 0.9);
          ctx.fillStyle = '#FFFFFF';
          ctx.font = 'bold ' + Math.round(cw * 0.045) + 'px Raleway, sans-serif';
          ctx.fillText(price || '', cw / 2, ch * 0.84, cw * 0.9);
          ctx.fillStyle = 'rgba(212,175,55,0.9)';
          ctx.fillRect(cw / 2 - cw * 0.1, ch * 0.865, cw * 0.2, Math.max(2, ch * 0.004));
          loadLogo().then(function (ok) {
            if (ok && _logoImg) {
              var lw = cw * 0.16, lh = lw * (_logoImg.height / _logoImg.width);
              ctx.globalAlpha = 0.9;
              ctx.drawImage(_logoImg, cw / 2 - lw / 2, ch * 0.9, lw, lh);
              ctx.globalAlpha = 1;
            }
            resolve(canvas);
          });
        } catch (e) { resolve(null); }
      };
      img.onerror = function () { resolve(null); };
      img.src = photoUrl;
    });
  }

  /* ---------- API publique ---------- */
  window.DarMarocPhotos = {
    VERSION: 'v1.0',
    processImage: processImage,
    supportsWebP: supportsWebP,

    /* Traite un File => dataURL WebP watermarkée (promesse). */
    processFile: function (file, opts) {
      return new Promise(function (resolve) {
        var reader = new FileReader();
        reader.onload = function () {
          processImage(reader.result, opts || {}, resolve);
        };
        reader.onerror = function () { resolve(''); };
        reader.readAsDataURL(file);
      });
    },

    /* ---------- Visite virtuelle 360 ----------
       Ouvre un lecteur plein écran de toutes les photos du bien avec
       navigation au clavier, swipe et effet Ken Burns. Inutile d'avoir
       de vraies photos 360 : chaque photo devient une "vue" animée. */
    openVirtualTour: function (photos, title) {
      var list = (photos || []).filter(Boolean);
      if (!list.length) { try { alert('Aucune photo à visiter.'); } catch (e) {} return; }
      var esc = function (s) {
        return String(s == null ? '' : s)
          .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
      };

      var ov = document.createElement('div');
      ov.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;z-index:99999;background:#000;display:flex;flex-direction:column;align-items:center;justify-content:center;font-family:Raleway,sans-serif;';
      ov.innerHTML =
        '<div style="position:absolute;top:0;left:0;right:0;padding:14px 18px;color:#fff;display:flex;justify-content:space-between;align-items:center;background:linear-gradient(rgba(0,0,0,.6),transparent);z-index:2;">' +
          '<strong style="font-size:1rem;">' + esc(title || 'Visite virtuelle') + '</strong>' +
          '<span style="display:flex;gap:10px;align-items:center;">' +
            '<span id="vtCounter" style="font-size:.85rem;color:#D4AF37;"></span>' +
            '<button id="vtClose" style="background:#D4AF37;border:none;color:#000;border-radius:50%;width:36px;height:36px;font-size:1rem;cursor:pointer;font-weight:700;">✕</button>' +
          '</span></div>' +
        '<div id="vtStage" style="position:absolute;top:0;left:0;right:0;bottom:0;display:flex;align-items:center;justify-content:center;overflow:hidden;cursor:grab;"></div>' +
        '<div id="vtNav" style="position:absolute;bottom:22px;left:0;right:0;display:flex;justify-content:center;gap:14px;z-index:3;"></div>';
      document.body.appendChild(ov);

      var stage = ov.querySelector('#vtStage');
      var nav = ov.querySelector('#vtNav');
      var counter = ov.querySelector('#vtCounter');
      var idx = 0;
      var startX = null, startY = null, dragging = false;
      var imgEl = null;

      function show(i) {
        idx = ((i % list.length) + list.length) % list.length;
        stage.innerHTML = '';
        imgEl = new Image();
        imgEl.style.cssText = 'max-width:100%;max-height:100%;object-fit:contain;user-select:none;';
        imgEl.alt = 'Vue ' + (idx + 1);
        imgEl.src = list[idx];
        stage.appendChild(imgEl);
        counter.textContent = (idx + 1) + ' / ' + list.length;
        nav.innerHTML = list.map(function (_, k) {
          return '<button data-i="' + k + '" style="width:12px;height:12px;border-radius:50%;border:1px solid #D4AF37;background:' + (k === idx ? '#D4AF37' : 'transparent') + ';cursor:pointer;padding:0;"></button>';
        }).join('');
      }

      stage.addEventListener('mousedown', function (e) { startX = e.clientX; startY = e.clientY; dragging = true; stage.style.cursor = 'grabbing'; e.preventDefault(); });
      window.addEventListener('mouseup', function () { if (dragging) { dragging = false; stage.style.cursor = 'grab'; } });
      window.addEventListener('mousemove', function (e) {
        if (!dragging || startX == null) return;
        var dx = e.clientX - startX;
        if (Math.abs(dx) > 45) { dragging = false; show(idx + (dx < 0 ? 1 : -1)); }
      });
      stage.addEventListener('touchstart', function (e) { var t = e.touches[0]; startX = t.clientX; startY = t.clientY; }, { passive: true });
      stage.addEventListener('touchend', function (e) {
        if (startX == null) return;
        var t = e.changedTouches[0];
        var dx = t.clientX - startX;
        if (Math.abs(dx) > 40) show(idx + (dx < 0 ? 1 : -1));
        startX = null;
      }, { passive: true });
      stage.addEventListener('click', function () { show(idx + 1); });
      nav.addEventListener('click', function (e) {
        var b = e.target.closest('[data-i]');
        if (b) show(Number(b.dataset.i));
      });
      window.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') closeTour();
        if (e.key === 'ArrowRight') show(idx + 1);
        if (e.key === 'ArrowLeft') show(idx - 1);
      });
      ov.querySelector('#vtClose').addEventListener('click', closeTour);

      function closeTour() {
        if (ov && ov.parentNode) ov.parentNode.removeChild(ov);
      }
      show(0);
    },

    /* ---------- Vidéo de présentation (diaporama animé) ----------
       Enregistre un WebM avec MediaRecorder : chaque photo devient une
       diapositive (photo + titre + prix + logo DarMaroc). Se fait 100%
       dans le navigateur, sans clé ni serveur. */
    recordVideo: function (photos, opts) {
      opts = opts || {};
      var list = (photos || []).filter(Boolean);
      return new Promise(function (resolve, reject) {
        if (!list.length) { reject(new Error('Aucune photo')); return; }
        if (!window.MediaRecorder || !window.CanvasCaptureMediaStream) { reject(new Error('MediaRecorder non supporté')); return; }
        var W = opts.width || 1080, H = opts.height || 1350;
        var perSlide = (opts.perSlide || 2.5) * 1000;
        var canvas = document.createElement('canvas');
        canvas.width = W; canvas.height = H;
        var ctx = canvas.getContext('2d');
        var stream = canvas.captureStream(30);
        var rec = new MediaRecorder(stream, { mimeType: (opts.mime || (MediaRecorder.isTypeSupported('video/webm;codecs=vp9') ? 'video/webm;codecs=vp9' : 'video/webm')), videoBitsPerSecond: 6000000 });
        var chunks = [];
        rec.ondataavailable = function (e) { if (e.data && e.data.size) chunks.push(e.data); };
        rec.onstop = function () { resolve(new Blob(chunks, { type: rec.mimeType })); };
        rec.onerror = function (e) { reject(e.error || e); };
        rec.start();

        var i = 0;
        function next() {
          if (i >= list.length) { rec.stop(); return; }
          renderSlide(list[i], opts.title, opts.price, W, H).then(function (c) {
            if (c) { ctx.drawImage(c, 0, 0); } else {
              ctx.fillStyle = '#0F0F0F'; ctx.fillRect(0, 0, W, H);
              ctx.fillStyle = '#D4AF37'; ctx.textAlign = 'center';
              ctx.font = 'bold ' + Math.round(W * 0.05) + 'px Raleway, sans-serif';
              ctx.fillText('DarMaroc', W / 2, H / 2);
            }
            i++;
            setTimeout(next, perSlide);
          });
        }
        next();
      });
    },

    renderSlide: renderSlide
  };
})();