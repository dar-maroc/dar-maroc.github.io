document.addEventListener('DOMContentLoaded', () => {

  // ===== PRELOADER =====
  const preloader = document.querySelector('.preloader');
  if (preloader) {
    const hasCurtains = preloader.querySelector('.preloader-curtain');

    if (hasCurtains) {
      // Son d'entrée (WebAudio) : joué à l'ouverture, sinon au premier geste
      const AC = window.AudioContext || window.webkitAudioContext;
      let audio = null;
      let soundPlayed = false;

      const scheduleSound = () => {
        if (soundPlayed || !audio) return;
        soundPlayed = true;

        const whoosh = (ctx) => {
          const dur = 0.8;
          const sr = ctx.sampleRate;
          const buf = ctx.createBuffer(1, Math.floor(sr * dur), sr);
          const data = buf.getChannelData(0);
          for (let i = 0; i < data.length; i++) {
            data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
          }
          const src = ctx.createBufferSource();
          src.buffer = buf;
          const bp = ctx.createBiquadFilter();
          bp.type = 'bandpass';
          bp.Q.value = 1.1;
          bp.frequency.setValueAtTime(320, ctx.currentTime);
          bp.frequency.exponentialRampToValueAtTime(3000, ctx.currentTime + dur);
          const g = ctx.createGain();
          g.gain.setValueAtTime(0.0001, ctx.currentTime);
          g.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + 0.15);
          g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur);
          src.connect(bp); bp.connect(g); g.connect(ctx.destination);
          src.start();
        };

        const impact = (ctx) => {
          const t = ctx.currentTime + 0.55;
          const osc = ctx.createOscillator();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(130, t);
          osc.frequency.exponentialRampToValueAtTime(55, t + 0.5);
          const og = ctx.createGain();
          og.gain.setValueAtTime(0.0001, t);
          og.gain.exponentialRampToValueAtTime(0.26, t + 0.03);
          og.gain.exponentialRampToValueAtTime(0.0001, t + 0.55);
          osc.connect(og); og.connect(ctx.destination);
          osc.start(t); osc.stop(t + 0.6);
        };

        try {
          whoosh(audio);
          impact(audio);
        } catch (e) { /* son optionnel */ }
      };

      const tryPlay = () => {
        if (soundPlayed) return;
        if (!audio) { try { audio = new AC(); } catch (e) { return; } }
        const go = () => { try { scheduleSound(); } catch (e) { /* */ } };
        if (audio.state === 'running') go();
        else audio.resume().then(go).catch(() => {});
      };

      const onFirstGesture = () => {
        tryPlay();
        ['pointerdown', 'touchstart', 'keydown', 'scroll'].forEach(ev =>
          document.removeEventListener(ev, onFirstGesture, { passive: true })
        );
      };
      ['pointerdown', 'touchstart', 'keydown', 'scroll'].forEach(ev =>
        document.addEventListener(ev, onFirstGesture, { passive: true })
      );

      setTimeout(() => { preloader.classList.add('curtains'); tryPlay(); }, 1800);
      setTimeout(() => preloader.classList.add('fade'), 3400);
      setTimeout(() => { if (preloader.parentNode) preloader.remove(); }, 4000);
    } else {
      setTimeout(() => { preloader.classList.add('hidden'); }, 1800);
    }
  }

  // ===== AOS =====
  if (typeof AOS !== 'undefined') {
    AOS.init({ duration: 800, once: true, offset: 50, easing: 'ease-out-cubic' });
  }

  // ===== NAVBAR SCROLL =====
  const navbar = document.querySelector('.navbar');
  if (navbar) {
    window.addEventListener('scroll', () => {
      navbar.classList.toggle('scrolled', window.scrollY > 50);
    });
  }

  // ===== MOBILE MENU =====
  const navToggle = document.querySelector('.nav-toggle');
  const navLinks = document.querySelector('.nav-links');
  if (navToggle && navLinks) {
    navToggle.addEventListener('click', () => {
      navToggle.classList.toggle('active');
      navLinks.classList.toggle('active');
      document.body.style.overflow = navLinks.classList.contains('active') ? 'hidden' : '';
    });
    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        navToggle.classList.remove('active');
        navLinks.classList.remove('active');
        document.body.style.overflow = '';
      });
    });
  }

  // ===== SMOOTH SCROLL FOR ANCHOR LINKS =====
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', e => {
      const id = anchor.getAttribute('href');
      if (id === '#') return;
      const target = document.querySelector(id);
      if (target) {
        e.preventDefault();
        const navHeight = navbar ? navbar.offsetHeight : 80;
        window.scrollTo({ top: target.offsetTop - navHeight - 10, behavior: 'smooth' });
      }
    });
  });

  // ===== BACK TO TOP =====
  const backToTop = document.getElementById('backToTop');
  if (backToTop) {
    window.addEventListener('scroll', () => {
      backToTop.classList.toggle('visible', window.scrollY > 500);
    });
    backToTop.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // ===== CONTACT FORM =====
  const contactForm = document.getElementById('contactForm');
  if (contactForm) {
    const params = new URLSearchParams(window.location.search);
    const subjectParam = params.get('subject');
    const subjectSelect = document.getElementById('formSubject');
    if (subjectParam && subjectSelect) {
      const options = subjectSelect.options;
      for (let i = 0; i < options.length; i++) {
        if (options[i].value === subjectParam) {
          options[i].selected = true;
          break;
        }
      }
    }
    const fields = [
      { id: 'formName', error: 'Veuillez entrer votre nom.' },
      { id: 'formPhone', error: 'Veuillez entrer votre téléphone.' },
      { id: 'formEmail', error: 'Veuillez entrer un email valide.' },
      { id: 'formMessage', error: 'Veuillez entrer votre message.' }
    ];

    const validateField = (input) => {
      const errorEl = document.getElementById(input.id + 'Error') || input.parentElement.querySelector('.error-msg');
      if (!errorEl) return true;
      if (input.required && !input.value.trim()) {
        errorEl.textContent = input.dataset.error || 'Ce champ est requis.';
        input.style.borderColor = '#ff4444';
        return false;
      }
      if (input.type === 'email' && input.value.trim()) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!re.test(input.value.trim())) {
          errorEl.textContent = 'Email invalide.';
          input.style.borderColor = '#ff4444';
          return false;
        }
      }
      errorEl.textContent = '';
      input.style.borderColor = '';
      return true;
    };

    contactForm.querySelectorAll('input, textarea').forEach(field => {
      field.addEventListener('blur', () => validateField(field));
      field.addEventListener('input', () => {
        const errorEl = document.getElementById(field.id + 'Error') || field.parentElement.querySelector('.error-msg');
        if (errorEl && errorEl.textContent) {
          validateField(field);
        }
      });
    });

    contactForm.addEventListener('submit', e => {
      e.preventDefault();

      // ===== ANTI-SPAM HONEYPOT =====
      const hp = document.getElementById('formWebsite');
      if (hp && hp.value) {
        window.location.href = 'thank-you.html';
        return;
      }

      let valid = true;
      fields.forEach(f => {
        const input = document.getElementById(f.id);
        if (input) {
          input.dataset.error = f.error;
          if (!validateField(input)) valid = false;
        }
      });
      if (valid) {
        const btn = contactForm.querySelector('button[type="submit"]');
        if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Envoi...'; }
        const fd = new FormData();
        fd.append('access_key', '0cc9c07d-9b5c-4f4f-850a-b79b7506539f');
        fd.append('subject', document.getElementById('formSubject') ? (document.getElementById('formSubject').value || 'Message depuis le site DarMaroc') : 'Message depuis le site DarMaroc');
        fd.append('from_name', 'Site DarMaroc');
        const n = document.getElementById('formName');
        const p = document.getElementById('formPhone');
        const e = document.getElementById('formEmail');
        const m = document.getElementById('formMessage');
        if (n) fd.append('name', n.value);
        if (p) fd.append('phone', p.value);
        if (e) fd.append('email', e.value);
        if (m) fd.append('message', m.value);
        fetch('https://api.web3forms.com/submit', {
          method: 'POST',
          body: fd
        }).then(() => {
          window.location.href = 'thank-you.html';
        }).catch(() => {
          window.location.href = 'thank-you.html';
        });
      }
    });
  }

  // ===== PROPERTY FILTER =====
  const filterBtns = document.querySelectorAll('.properties-filter .filter-btn');
  const propertyCards = document.querySelectorAll('.property-card[data-category]');

  const applyFilter = (filter) => {
    filterBtns.forEach(b => b.classList.remove('active'));
    const activeBtn = Array.from(filterBtns).find(b => b.dataset.filter === filter);
    if (activeBtn) activeBtn.classList.add('active');
    propertyCards.forEach(card => {
      const categories = card.dataset.category;
      if (filter === 'all' || (categories && categories.includes(filter))) {
        card.style.display = '';
        card.style.opacity = '1';
        card.style.transform = 'none';
        card.style.visibility = 'visible';
      } else {
        card.style.display = 'none';
      }
    });
  };

  if (filterBtns.length && propertyCards.length) {
    const filterParam = new URLSearchParams(window.location.search).get('filter');
    if (filterParam) {
      applyFilter(filterParam);
    }

    filterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        applyFilter(btn.dataset.filter);
      });
    });
  }

  // ===== COUNTER ANIMATION =====
  const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      const target = parseInt(el.dataset.target);
      if (!target) return;
      const suffix = el.dataset.suffix || '+';
      const duration = 2000;
      const steps = 60;
      const increment = target / steps;
      let current = 0;
      const timer = setInterval(() => {
        current += increment;
        if (current >= target) { current = target; clearInterval(timer); }
        el.textContent = Math.floor(current) + suffix;
      }, duration / steps);
      counterObserver.unobserve(el);
    });
  }, { threshold: 0.5 });
  document.querySelectorAll('.counter[data-target]').forEach(el => counterObserver.observe(el));

  // ===== ACTIVE NAV LINK =====
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  if (navLinks) {
    navLinks.querySelectorAll('a').forEach(link => {
      const href = link.getAttribute('href');
      if (href === currentPage) link.classList.add('active');
    });
  }

  // ===== HERO PARALLAX =====
  const heroImg = document.querySelector('.hero-banner-img');
  if (heroImg && window.innerWidth > 992) {
    window.addEventListener('scroll', () => {
      const scrollY = window.scrollY;
      const maxScroll = window.innerHeight;
      if (scrollY <= maxScroll) {
        heroImg.style.setProperty('--scroll', scrollY);
      }
    });
  }

  // ===== STAGGER REVEAL =====
  const staggerObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        staggerObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });
  document.querySelectorAll('.stagger-fade').forEach(el => staggerObserver.observe(el));

  // ===== KEYBOARD: ESC =====
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && navLinks && navLinks.classList.contains('active')) {
      navToggle.classList.remove('active');
      navLinks.classList.remove('active');
      document.body.style.overflow = '';
    }
  });

  // ===== LANGUAGE SWITCHER =====
  const switchLanguage = (lang) => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';

    document.querySelectorAll('.lang-switch a').forEach(link => {
      link.classList.toggle('active', link.dataset.lang === lang);
    });

    document.querySelectorAll('[data-fr]').forEach(el => {
      const text = lang === 'ar' ? el.getAttribute('data-ar') : el.getAttribute('data-fr');
      if (!text) return;      if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
        el.setAttribute('placeholder', text);
      } else if (el.tagName === 'META') {
        el.setAttribute('content', text);
      } else if (el.tagName === 'OPTION') {
        el.textContent = text;
      } else {
        if (el.childNodes.length === 1 && el.childNodes[0].nodeType === 3) {
          el.textContent = text;
        }
      }
    });

    localStorage.setItem('darmaroc-lang', lang);
  };

  document.querySelectorAll('.lang-switch a[data-lang]').forEach(link => {
    link.addEventListener('click', e => {
      e.preventDefault();
      switchLanguage(link.dataset.lang);
    });
  });

  const savedLang = localStorage.getItem('darmaroc-lang');
  if (savedLang && savedLang !== 'fr') {
    switchLanguage(savedLang);
  }

  // ===== PROPERTY SHOWCASE CAROUSEL =====
  // Logique extraite dans une fonction réinitialisable : le contenu des
  // slides peut être régénéré par js/showcase.js (données CMS/Supabase),
  // la fonction relit le DOM à chaque appel pour rester synchronisée.
  window.DarMarocShowcaseCtrl = {
    init: function () {
      const showcase = document.querySelector('.property-showcase');
      if (!showcase) return;
      const slider = showcase.querySelector('.showcase-slider');
      const slides = slider.querySelectorAll('.showcase-slide');
      const dotsContainer = showcase.querySelector('.showcase-dots');
      const prevBtn = showcase.querySelector('.showcase-prev');
      const nextBtn = showcase.querySelector('.showcase-next');
      if (!slides.length) return;
      let current = 0;
      let interval;
      if (interval) clearInterval(interval);
      dotsContainer.innerHTML = '';

      slides.forEach((_, i) => {
        const dot = document.createElement('span');
        dot.classList.add('showcase-dot');
        if (i === 0) dot.classList.add('active');
        dot.addEventListener('click', () => goTo(i));
        dotsContainer.appendChild(dot);
      });

      function goTo(index) {
        slides[current].classList.remove('active');
        dotsContainer.children[current].classList.remove('active');
        current = index;
        slides[current].classList.add('active');
        dotsContainer.children[current].classList.add('active');
      }

      function next() { goTo((current + 1) % slides.length); }
      function prev() { goTo((current - 1 + slides.length) % slides.length); }

      function startAuto() { interval = setInterval(next, 4000); }
      function stopAuto() { clearInterval(interval); }

      prevBtn.onclick = () => { stopAuto(); prev(); startAuto(); };
      nextBtn.onclick = () => { stopAuto(); next(); startAuto(); };
      showcase.onmouseenter = stopAuto;
      showcase.onmouseleave = startAuto;

      startAuto();
    }
  };
  window.DarMarocShowcaseCtrl.init();

  // ===== CHATBOT DARMAROC =====
  const chatWidget = document.getElementById('chatbotWidget');
  if (chatWidget) {
    const chatToggle = chatWidget.querySelector('.chatbot-toggle');
    const chatClose = chatWidget.querySelector('.chatbot-close');
    const chatMessages = chatWidget.querySelector('#chatbotMessages');
    const chatOptions = chatWidget.querySelectorAll('.chat-opt');
    const chatInputBar = chatWidget.querySelector('#chatbotInputBar');
    const chatInput = chatWidget.querySelector('#chatbotInput');
    const chatSend = chatWidget.querySelector('#chatbotSend');

    const chatBotText = {
      fr: {
        intro: 'Bonjour 👋 Bienvenue chez DarMaroc !\nChoisissez une option pour commencer :',
        buy_q: 'Très bien ! 🏠 Pour l\'achat, aidez-nous à trouver les meilleurs biens :\n• 📍 Quartier préféré ? (Agadir, Dcheira, Aourir…)\n• 💰 Votre budget ?\n\nÉcrivez votre réponse ci-dessous ✍️',
        buy_ok: 'Merci ! 🙏 Nous avons bien noté vos critères d\'achat.\nUn conseiller vous enverra les biens adaptés 🏡',
        rent_q: 'Parfait ! 🔑 Pour la location, précisez-nous :\n• 📍 Quartier souhaité ?\n• 💰 Budget mensuel ?\n• ⏳ Durée (courte / longue) ?\n\nÉcrivez votre réponse ci-dessous ✍️',
        rent_ok: 'Merci ! 🙏 Vos critères de location sont notés.\nNous vous envoyons les offres correspondantes 📋',
        sell_q: 'Bonne idée ! 💰 L\'estimation est GRATUITE.\nDécrivez votre bien :\n• 📍 Quartier ?\n• 📐 Superficie (m²) ?\n• 🛏️ Pièces ?\n\nÉcrivez votre réponse ci-dessous ✍️',
        sell_ok: 'Merci ! 🙏 Votre bien est noté.\nUn expert vous donnera une estimation sous 24h ⏱️',
        renov_q: 'Au service ! 🛠️ Pour établir votre devis GRATUIT :\n• 🚪 Quelle pièce ? (cuisine, salon, salle de bain…)\n• 🎨 Quels travaux ? (peinture, carrelage, plomberie…)\n\nÉcrivez votre réponse ci-dessous ✍️',
        renov_ok: 'Merci ! 🙏 Votre projet est noté.\nNous vous envoyons un devis gratuit 📝',
        hours: '🕐 Nos horaires : Lundi – Samedi, 9h à 19h.\n📍 Av. Annarjis, Agadir, Maroc.\nEn dehors de ces heures, nous répondons dès l\'ouverture 😊',
        contact: '📲 Besoin d\'un conseiller ?\n• WhatsApp : +33 7 72 20 88 85\n• Appel : 0525 26 14 86\n• Email : Dar.maroc4@gmail.com'
      },
      ar: {
        intro: 'مرحباً 👋 أهلاً بك في دار المغرب!\nاختر خياراً للبدء:',
        buy_q: 'رائع! 🏠 للشراء، ساعدنا في إيجاد أفضل العقارات:\n• 📍 الحي المفضل؟ (أكادير، الدشيرة، أورير...)\n• 💰 ميزانيتك؟\n\nاكتب إجابتك بالأسفل ✍️',
        buy_ok: 'شكراً! 🙏 سجلنا معايير الشراء الخاصة بك.\nسيُرسل لك مستشار العقارات المناسبة 🏡',
        rent_q: 'ممتاز! 🔑 للإيجار، حدد لنا:\n• 📍 الحي المطلوب؟\n• 💰 الميزانية الشهرية؟\n• ⏳ المدة (قصيرة / طويلة)؟\n\nاكتب إجابتك بالأسفل ✍️',
        rent_ok: 'شكراً! 🙏 سجلنا معايير الإيجار الخاصة بك.\nسنرسل لك العروض المناسبة 📋',
        sell_q: 'فكرة جيدة! 💰 التقييم مجاني تماماً.\nصف لنا عقارك:\n• 📍 الحي؟\n• 📐 المساحة (م²)؟\n• 🛏️ الغرف؟\n\nاكتب إجابتك بالأسفل ✍️',
        sell_ok: 'شكراً! 🙏 سجلنا عقارك.\nسيُعطيك خبير تقديراً خلال 24 ساعة ⏱️',
        renov_q: 'في خدمتك! 🛠️ لإعداد دراستك المجانية:\n• 🚪 أي غرفة؟ (مطبخ، صالون، حمام...)\n• 🎨 أي أشغال؟ (دهان، بلاط، سباكة...)\n\nاكتب إجابتك بالأسفل ✍️',
        renov_ok: 'شكراً! 🙏 سجلنا مشروعك.\nسنرسل لك دراسة مجانية 📝',
        hours: '🕐 أوقات العمل: الاثنين – السبت، من 9 إلى 19.\n📍 شارع النرجس، أكادير، المغرب.\nخارج هذه الأوقات نرد بمجرد الافتتاح 😊',
        contact: '📲 بحاجة إلى مستشار؟\n• واتساب: +33 7 72 20 88 85\n• هاتف: 0525 26 14 86\n• بريد: Dar.maroc4@gmail.com'
      },
      en: {
        intro: 'Hello 👋 Welcome to DarMaroc!\nChoose an option to get started:',
        buy_q: 'Great! 🏠 For buying, help us find the best properties:\n• 📍 Preferred area? (Agadir, Dcheira, Aourir...)\n• 💰 Your budget?\n\nWrite your answer below ✍️',
        buy_ok: 'Thank you! 🙏 We have noted your buying criteria.\nAn advisor will send you suitable properties 🏡',
        rent_q: 'Perfect! 🔑 For renting, tell us:\n• 📍 Desired area?\n• 💰 Monthly budget?\n• ⏳ Duration (short / long)?\n\nWrite your answer below ✍️',
        rent_ok: 'Thank you! 🙏 Your rental criteria are noted.\nWe will send you matching offers 📋',
        sell_q: 'Good idea! 💰 The valuation is FREE.\nDescribe your property:\n• 📍 Area?\n• 📐 Size (m²)?\n• 🛏️ Rooms?\n\nWrite your answer below ✍️',
        sell_ok: 'Thank you! 🙏 Your property is noted.\nAn expert will give you a valuation within 24h ⏱️',
        renov_q: 'At your service! 🛠️ For your FREE quote:\n• 🚪 Which room? (kitchen, living room, bathroom...)\n• 🎨 What work? (painting, tiling, plumbing...)\n\nWrite your answer below ✍️',
        renov_ok: 'Thank you! 🙏 Your project is noted.\nWe will send you a free quote 📝',
        hours: '🕐 Our hours: Monday – Saturday, 9am to 7pm.\n📍 Av. Annarjis, Agadir, Morocco.\nOutside these hours, we reply as soon as we open 😊',
        contact: '📲 Need an advisor?\n• WhatsApp: +33 7 72 20 88 85\n• Call: 0525 26 14 86\n• Email: Dar.maroc4@gmail.com'
      }
    };

    const WA_NUMBER = (window.DARMAROC_CONFIG && window.DARMAROC_CONFIG.whatsapp && window.DARMAROC_CONFIG.whatsapp.number) || '33772208885';

    const currentChatLang = () => {
      if (document.documentElement.lang === 'ar') return 'ar';
      if (document.documentElement.lang === 'en') return 'en';
      return 'fr';
    };

    const appendBotMsg = (key, withWaBtn) => {
      const msg = document.createElement('div');
      msg.className = 'chat-msg bot';
      const bubble = document.createElement('div');
      bubble.className = 'chat-bubble';
      bubble.textContent = chatBotText[currentChatLang()][key];
      msg.appendChild(bubble);
      if (withWaBtn) {
        const wa = document.createElement('a');
        wa.className = 'chat-wa-btn';
        wa.href = 'https://wa.me/' + WA_NUMBER;
        wa.target = '_blank';
        wa.rel = 'noopener';
        wa.textContent = currentChatLang() === 'ar' ? '📲 فتح واتساب' : '📲 Ouvrir WhatsApp';
        msg.appendChild(wa);
      }
      chatMessages.appendChild(msg);
      chatMessages.scrollTop = chatMessages.scrollHeight;
    };

    const appendUserMsg = (text) => {
      const msg = document.createElement('div');
      msg.className = 'chat-msg user';
      const bubble = document.createElement('div');
      bubble.className = 'chat-bubble';
      bubble.textContent = text;
      msg.appendChild(bubble);
      chatMessages.appendChild(msg);
      chatMessages.scrollTop = chatMessages.scrollHeight;
    };

    const appendTyping = () => {
      const msg = document.createElement('div');
      msg.className = 'chat-msg bot typing';
      const bubble = document.createElement('div');
      bubble.className = 'chat-bubble';
      for (let i = 0; i < 3; i++) {
        const dot = document.createElement('span');
        bubble.appendChild(dot);
      }
      msg.appendChild(bubble);
      chatMessages.appendChild(msg);
      chatMessages.scrollTop = chatMessages.scrollHeight;
      return msg;
    };

    /* Affichage d'une réponse libre (IA) avec saut de ligne respecté. */
    const appendBotText = (text, withWaBtn) => {
      const msg = document.createElement('div');
      msg.className = 'chat-msg bot';
      const bubble = document.createElement('div');
      bubble.className = 'chat-bubble';
      text.split('\n').forEach((line, i) => {
        if (i > 0) bubble.appendChild(document.createElement('br'));
        const node = line.match(/^https?:\/\/\S+$/) && line.indexOf('→') === -1
          ? (() => { const a = document.createElement('a'); a.href = line; a.target = '_blank'; a.rel = 'noopener'; a.textContent = line; return a; })()
          : document.createTextNode(line);
        bubble.appendChild(node);
      });
      msg.appendChild(bubble);
      if (withWaBtn) {
        const wa = document.createElement('a');
        wa.className = 'chat-wa-btn';
        wa.href = 'https://wa.me/' + WA_NUMBER;
        wa.target = '_blank';
        wa.rel = 'noopener';
        wa.textContent = currentChatLang() === 'ar' ? '📲 فتح واتساب' : '📲 Ouvrir WhatsApp';
        msg.appendChild(wa);
      }
      chatMessages.appendChild(msg);
      chatMessages.scrollTop = chatMessages.scrollHeight;
    };

    const chatTopics = {
      buy: { fr: '🏠 Acheter', ar: '🏠 شراء', en: '🏠 Buy', q: 'buy_q', ok: 'buy_ok', asks: true },
      rent: { fr: '🔑 Louer', ar: '🔑 إيجار', en: '🔑 Rent', q: 'rent_q', ok: 'rent_ok', asks: true },
      sell: { fr: '💰 Vendre / Estimer', ar: '💰 بيع / تقييم', en: '💰 Sell / Estimate', q: 'sell_q', ok: 'sell_ok', asks: true },
      renov: { fr: '🛠️ Rénovation', ar: '🛠️ تجديد', en: '🛠️ Renovation', q: 'renov_q', ok: 'renov_ok', asks: true },
      hours: { fr: '🕐 Horaires', ar: '🕐 الأوقات', en: '🕐 Hours', q: null, ok: null, asks: false },
      contact: { fr: '📲 Nous contacter', ar: '📲 اتصل بنا', en: '📲 Contact us', q: null, ok: null, asks: false, wa: true }
    };

    let chatOpened = false;
    let awaitingInput = false;

    const showInput = () => {
      chatInputBar.classList.add('active');
      chatInput.focus();
    };

    const hideInput = () => {
      chatInputBar.classList.remove('active');
      chatInput.value = '';
    };

    const handleTopic = (topic) => {
      const t = chatTopics[topic];
      appendUserMsg(t[currentChatLang()]);
      if (t.asks) {
        awaitingInput = true;
        appendBotMsg(t.q);
        showInput();
      } else {
        appendBotMsg(topic, t.wa);
      }
    };

    const appendWaSendBtn = (topic, answer) => {
      if (!topic || !chatTopics[topic]) return;
      const lang = currentChatLang();
      const labels = {
        fr: { greet: 'Bonjour DarMaroc 👋', subject: 'Sujet', msg: 'Message', from: '— Envoyé depuis le site DarMaroc', cta: '📲 Envoyer ma demande sur WhatsApp' },
        ar: { greet: 'مرحباً دار المغرب 👋', subject: 'الموضوع', msg: 'الرسالة', from: '— أُرسل من موقع دار المغرب', cta: '📲 إرسال طلبي عبر واتساب' },
        en: { greet: 'Hello DarMaroc 👋', subject: 'Topic', msg: 'Message', from: '— Sent from DarMaroc website', cta: '📲 Send my request on WhatsApp' }
      };
      const lb = labels[lang] || labels.fr;
      const topicLabel = chatTopics[topic][lang] || chatTopics[topic].fr;
      const text = lb.greet + '\n\n' + lb.subject + ' : ' + topicLabel + '\n' + lb.msg + ' : ' + answer + '\n\n' + lb.from;
      const wa = document.createElement('a');
      wa.className = 'chat-wa-btn';
      wa.href = 'https://wa.me/' + WA_NUMBER + '?text=' + encodeURIComponent(text);
      wa.target = '_blank';
      wa.rel = 'noopener';
      wa.textContent = lb.cta;
      const msg = document.createElement('div');
      msg.className = 'chat-msg bot';
      msg.appendChild(wa);
      chatMessages.appendChild(msg);
      chatMessages.scrollTop = chatMessages.scrollHeight;
    };

    const handleSend = () => {
      const value = chatInput.value.trim();
      if (!value) return;
      awaitingInput = false;
      appendUserMsg(value);
      hideInput();
      const typing = appendTyping();
      const topic = currentActiveTopic;

      /* Statistiques : comptabiliser la question posée au chatbot. */
      if (window.DarMarocStats && window.DarMarocStats.track) {
        try { window.DarMarocStats.track('chat', value.slice(0, 120)); } catch (e) {}
      }

      /* Réponse intelligente : IA Gemini si disponible, sinon moteur
         local (recherche de biens). Jamais d'erreur affichée. */
      const ai = window.DarMarocAI;
      const reply = (text) => {
        typing.remove();
        appendBotText(text);
        if (topic && chatTopics[topic]) appendWaSendBtn(topic, value);
      };

      if (ai && typeof ai.ask === 'function') {
        ai.ask(value, { lang: currentChatLang() }).then((res) => {
          reply((res && res.text) || chatBotText[currentChatLang()].intro);
        }).catch(() => {
          reply(chatBotText[currentChatLang()].intro);
        });
      } else {
        setTimeout(() => {
          typing.remove();
          appendBotMsg(topic ? chatTopics[topic].ok : 'hours');
          if (topic) appendWaSendBtn(topic, value);
        }, 800);
      }
    };

    let currentActiveTopic = null;

    chatOptions.forEach(opt => {
      opt.addEventListener('click', () => {
        currentActiveTopic = opt.dataset.topic;
        handleTopic(currentActiveTopic);
      });
    });

    chatSend.addEventListener('click', handleSend);
    chatInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleSend();
      }
    });

    const openChat = () => {
      chatWidget.classList.add('open');
      chatToggle.setAttribute('aria-expanded', 'true');
      if (!chatOpened) {
        appendBotMsg('intro');
        chatOpened = true;
      }
    };

    const closeChat = () => {
      chatWidget.classList.remove('open');
      chatToggle.setAttribute('aria-expanded', 'false');
    };

    chatToggle.addEventListener('click', openChat);
    chatClose.addEventListener('click', closeChat);

    document.querySelectorAll('.lang-switch a[data-lang]').forEach(link => {
      link.addEventListener('click', () => {
        if (chatWidget.classList.contains('open') && chatMessages.children.length > 0) {
          chatMessages.innerHTML = '';
          chatOpened = false;
          hideInput();
          appendBotMsg('intro');
        }
      });
    });
  }

  // ===== HIDE FLOATING BUTTONS NEAR FOOTER =====
  const footerEl = document.querySelector('.footer-bottom');
  if (footerEl) {
    const toggleFab = () => {
      const rect = footerEl.getBoundingClientRect();
      const nearBottom = rect.top <= window.innerHeight * 0.92;
      document.body.classList.toggle('fab-hidden', nearBottom);
    };
    window.addEventListener('scroll', toggleFab, { passive: true });
    toggleFab();
  }

  // ===== PWA SERVICE WORKER =====
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js').catch((err) => {
        console.warn('Service Worker registration failed:', err);
      });
    });
  }

  // ===== PWA : bouton d'installation (non intrusif, ajouté dynamiquement) =====
  let deferredPrompt = null;
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    const installBtn = document.createElement('button');
    installBtn.id = 'pwaInstallBtn';
    installBtn.setAttribute('aria-label', 'Installer DarMaroc');
    installBtn.title = 'Installer l\'application';
    installBtn.innerHTML = '<i class="fas fa-download"></i>';
    installBtn.style.cssText = 'position:fixed;right:18px;bottom:118px;z-index:9999;width:52px;height:52px;border-radius:50%;border:none;background:#D4AF37;color:#0F0F0F;font-size:1.15rem;cursor:pointer;box-shadow:0 6px 18px rgba(0,0,0,.35);display:flex;align-items:center;justify-content:center;transition:transform .2s;';
    installBtn.addEventListener('mouseenter', () => { installBtn.style.transform = 'scale(1.08)'; });
    installBtn.addEventListener('mouseleave', () => { installBtn.style.transform = 'scale(1)'; });
    installBtn.addEventListener('click', async () => {
      if (!deferredPrompt) return;
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      deferredPrompt = null;
      if (outcome === 'accepted') installBtn.remove();
    });
    document.body.appendChild(installBtn);
  });
  window.addEventListener('appinstalled', () => {
    const btn = document.getElementById('pwaInstallBtn');
    if (btn && btn.parentNode) btn.parentNode.removeChild(btn);
  });

  // ===== STATISTIQUES (module optionnel, chargé en douceur) =====
  if (!window.DarMarocStats) {
    const s = document.createElement('script');
    s.src = './utils/stats.js';
    s.async = true;
    document.body.appendChild(s);
  }

});
