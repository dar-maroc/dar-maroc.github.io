/* ============================================================
   DAR MAROC - DONNÉES STATIQUES PAR DÉFAUT (data.js)
   Utilisées quand le CMS Firebase n'est pas encore configuré.
   Le dashboard (/admin) peut les modifier via localStorage.
   ============================================================ */
window.DARMAROC_DATA = (function () {
  'use strict';

  return {
    /* ---------- Catégories ---------- */
    categories: [
      { id: 'immobilier', fr: 'Immobilier', ar: 'عقارات', icon: 'fa-building' },
      { id: 'renovation', fr: 'Rénovation', ar: 'تجديد', icon: 'fa-hammer' },
      { id: 'decoration', fr: 'Décoration', ar: 'ديكور', icon: 'fa-paint-roller' },
      { id: 'demenagement', fr: 'Déménagement', ar: 'نقل أثاث', icon: 'fa-truck' },
      { id: 'nettoyage', fr: 'Nettoyage', ar: 'تنظيف', icon: 'fa-broom' }
    ],

    /* ---------- Services ---------- */
    services: [
      {
        id: 'vente-achat', cat: 'immobilier', fr: 'Vente & Achat', ar: 'بيع وشراء',
        icon: 'fa-home', desc: 'Achat et vente de biens immobiliers à travers le Maroc.',
        descAr: 'شراء وبيع العقارات في جميع أنحاء المغرب.',
        href: 'properties.html?filter=sale',
        img: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?fm=webp&w=600&q=80',
        alt: 'Bien immobilier moderne à vendre', delay: 0
      },
      {
        id: 'location', cat: 'immobilier', fr: 'Location', ar: 'كراء',
        icon: 'fa-key', desc: 'Location de propriétés résidentielles et commerciales.',
        descAr: 'تأجير العقارات السكنية والتجارية.',
        href: 'properties.html?filter=rent',
        img: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?fm=webp&w=600&q=80',
        alt: 'Appartement cosy à louer', delay: 50
      },
      {
        id: 'gestion', cat: 'immobilier', fr: 'Gestion locative', ar: 'إدارة العقارات',
        icon: 'fa-handshake', desc: 'Gestion professionnelle de votre patrimoine immobilier.',
        descAr: 'إدارة احترافية لممتلكاتك العقارية.',
        href: 'services.html',
        img: 'https://images.unsplash.com/photo-1556761175-b413da4baf72?fm=webp&w=600&q=80',
        alt: 'Consultation gestion immobilière', delay: 100
      },
      {
        id: 'renovation-complete', cat: 'renovation', fr: 'Rénovation complète', ar: 'تجديد شامل',
        icon: 'fa-screwdriver-wrench', desc: 'Rénovation complète ou partielle de votre espace.',
        descAr: 'تجديد كامل أو جزئي لمساحتك.',
        href: 'properties.html?filter=renovation',
        img: 'https://images.unsplash.com/photo-1581858726788-75bc0f6a952d?fm=webp&w=600&q=80',
        alt: 'Projet de rénovation en cours', delay: 150
      },
      {
        id: 'decoration-interieure', cat: 'decoration', fr: 'Décoration intérieure', ar: 'ديكور داخلي',
        icon: 'fa-couch', desc: 'Décoration intérieure sur mesure et design d\u2019espace.',
        descAr: 'ديكور داخلي حسب الطلب وتصميم المساحات.',
        href: 'properties.html?filter=decoration',
        img: 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?fm=webp&w=600&q=80',
        alt: 'Design de décoration intérieure', delay: 200
      },
      {
        id: 'peinture', cat: 'renovation', fr: 'Peinture', ar: 'دهان',
        icon: 'fa-paintbrush', desc: 'Peinture intérieure et extérieure de qualité supérieure.',
        descAr: 'دهان داخلي وخارجي بجودة عالية.',
        href: 'services.html',
        img: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?fm=webp&w=600&q=80',
        alt: 'Rouleau de peinture fraîche', delay: 250
      },
      {
        id: 'electricite', cat: 'renovation', fr: 'Électricité', ar: 'كهرباء',
        icon: 'fa-bolt', desc: 'Installation et réparation électrique professionnelle.',
        descAr: 'تركيب وإصلاح كهربائي احترافي.',
        href: 'services.html',
        img: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?fm=webp&w=600&q=80',
        alt: 'Électricien au travail', delay: 300
      },
      {
        id: 'plomberie', cat: 'renovation', fr: 'Plomberie', ar: 'سباكة',
        icon: 'fa-faucet', desc: 'Services de plomberie fiables et efficaces.',
        descAr: 'خدمات سباكة موثوقة وفعالة.',
        href: 'services.html',
        img: 'https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?fm=webp&w=600&q=80',
        alt: 'Plombier réparant un robinet', delay: 350
      },
      {
        id: 'menuiserie', cat: 'decoration', fr: 'Bois & Aluminium', ar: 'النجارة والألمنيوم',
        icon: 'fa-wood', desc: 'Menuiserie bois et aluminium sur mesure.',
        descAr: 'نجارة الخشب والألمنيوم حسب الطلب.',
        href: 'services.html',
        img: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?fm=webp&w=600&q=80',
        alt: 'Atelier menuiserie bois et aluminium', delay: 400
      },
      {
        id: 'nettoyage', cat: 'nettoyage', fr: 'Nettoyage', ar: 'تنظيف',
        icon: 'fa-broom', desc: 'Nettoyage professionnel pour tous types d\u2019espaces.',
        descAr: 'تنظيف احترافي لجميع أنواع المساحات.',
        href: 'services.html',
        img: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?fm=webp&w=600&q=80',
        alt: 'Service de nettoyage professionnel', delay: 450
      },
      {
        id: 'jardinage', cat: 'nettoyage', fr: 'Jardinage', ar: 'البستنة',
        icon: 'fa-seedling', desc: 'Aménagement et entretien de vos espaces verts.',
        descAr: 'تهيئة وصيانة مساحاتك الخضراء.',
        href: 'services.html',
        img: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?fm=webp&w=600&q=80',
        alt: 'Aménagement paysager de jardin', delay: 500
      },
      {
        id: 'demenagement', cat: 'demenagement', fr: 'Déménagement', ar: 'نقل أثاث',
        icon: 'fa-truck-moving', desc: 'Déménagement complet et sécurisé.',
        descAr: 'خدمات نقل أثاث كاملة وآمنة.',
        href: 'services.html',
        img: 'https://images.unsplash.com/photo-1607344645866-009c320b63e0?fm=webp&w=600&q=80',
        alt: 'Cartons et camion de déménagement', delay: 550
      },
      {
        id: 'meubles-decoration', cat: 'decoration', fr: 'Meubles & Décoration', ar: 'الأثاث والديكور',
        icon: 'fa-couch', desc: 'Mobilier et objets de décoration haut de gamme.',
        descAr: 'أثاث وقطع ديكور راقية.',
        href: 'services.html',
        img: 'https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?fm=webp&w=600&q=80',
        alt: 'Meubles et décoration élégants', delay: 600
      }
    ],

    /* ---------- Témoignages / Avis ---------- */
    testimonials: [
      { id: 't1', name: 'Karim H.', city: 'Casablanca', rating: 5, fr: 'DarMaroc a géré la vente de notre appartement à Casablanca en moins d\u2019un mois. Estimation juste, visites bien organisées et suivi notarial impeccable. Je recommande vivement cette équipe professionnelle.', ar: 'أدارت دارالمغرب بيع شقتنا في الدار البيضاء في أقل من شهر. تقدير عادل، زيارات منظمة جيداً ومتابعة عدلية ممتازة. أنصح بهذا الفريق المحترف بشدة.' },
      { id: 't2', name: 'Salma M.', city: 'Rabat', rating: 5, fr: 'La rénovation de notre salon a été réalisée avec un grand sérieux. Travaux finis dans les délais, propreté respectée et un résultat magnifique. Un excellent rapport qualité-prix.', ar: 'تم تجديد صالوننا بجدية كبيرة. انتهت الأشغال في الوقت المحدد، مع احترام النظافة ونتيجة رائعة. جودة ممتازة مقابل السعر.' },
      { id: 't3', name: 'Youssef T.', city: 'Marrakech', rating: 5, fr: 'Équipe disponible et réactive pour notre déménagement. Tous nos meubles sont arrivés sans aucune rayure. Merci pour votre professionnalisme et votre gentillesse.', ar: 'فريق متاح وسريع الاستجابة لنقل أثاثنا. وصلت جميع قطع الأثاث دون أي خدش. شكراً على احترافيتكم ولطفكم.' }
    ],

    /* ---------- FAQ ---------- */
    faq: [
      { id: 'q1', fr: 'Comment demander un devis ?', ar: 'كيف أطلب عرض سعر؟', aFR: 'Utilisez le formulaire de contact, le chatbot ou WhatsApp.', aAR: 'استخدم نموذج الاتصال أو المحادثة أو واتساب.' },
      { id: 'q2', fr: 'Quelles villes couvrez-vous ?', ar: 'ما المدن التي تغطيها؟', aFR: 'Agadir et ses environs principalement.', aAR: 'أكادير وما حولها أساسا.' },
      { id: 'q3', fr: 'Les devis sont-ils gratuits ?', ar: 'هل عروض الأسعار مجانية؟', aFR: 'Oui, tous nos devis sont gratuits et sans engagement.', aAR: 'نعم، جميع عروض الأسعار مجانية ودون التزام.' }
    ],

    /* ---------- Biens immobiliers / locations / projets ---------- */
    properties: [
      { id: 'p1', cat: 'sale', fr: 'Villa de luxe', ar: 'فيلا فاخرة', price: '2 500 000 DH', period: '', city: 'Marrakech', area: '250 m²', beds: '4', baths: '3', img: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600&q=80', alt: 'Villa de luxe Marrakech', href: 'contact.html' },
      { id: 'p2', cat: 'sale', fr: 'Riad traditionnel', ar: 'رياض تقليدي', price: '4 200 000 DH', period: '', city: 'Fès', area: '320 m²', beds: '5', baths: '4', img: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=600&q=80', alt: 'Riad Fès', href: 'contact.html' },
      { id: 'p3', cat: 'sale', fr: 'Villa moderne', ar: 'فيلا عصرية', price: '3 800 000 DH', period: '', city: 'Rabat', area: '300 m²', beds: '5', baths: '3', img: 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=600&q=80', alt: 'Villa moderne Rabat', href: 'contact.html' },
      { id: 'p4', cat: 'sale', fr: 'Villa avec piscine', ar: 'فيلا مع مسبح', price: '5 500 000 DH', period: '', city: 'Marrakech', area: '400 m²', beds: '6', baths: '4', img: 'https://images.unsplash.com/photo-1600566753086-00f18f6bae34?w=600&q=80', alt: 'Villa avec piscine Marrakech', href: 'contact.html' },
      { id: 'p5', cat: 'sale', fr: 'Appartement de luxe', ar: 'شقة فاخرة', price: '1 800 000 DH', period: '', city: 'Casablanca', area: '150 m²', beds: '3', baths: '2', img: 'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=600&q=80', alt: 'Appartement de luxe Casablanca', href: 'contact.html' },
      { id: 'p6', cat: 'sale', fr: 'Villa de standing', ar: 'فيلا راقية', price: '6 200 000 DH', period: '', city: 'Marrakech', area: '500 m²', beds: '6', baths: '5', img: 'https://images.unsplash.com/photo-1600573472591-ee6b68d14c68?w=600&q=80', alt: 'Villa Marrakech', href: 'contact.html' },
      { id: 'p7', cat: 'sale', fr: 'Villa avec jardin', ar: 'فيلا مع حديقة', price: '3 200 000 DH', period: '', city: 'Agadir', area: '280 m²', beds: '4', baths: '3', img: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=600&q=80', alt: 'Villa Agadir', href: 'contact.html' },
      { id: 'p8', cat: 'sale', fr: 'Appartement économique', ar: 'شقة اقتصادية', price: '350 000 DH', period: '', city: 'Agadir', area: '55 m²', beds: '1', baths: '1', img: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600&q=80', alt: 'Appartement Agadir', href: 'contact.html' },
      { id: 'p9', cat: 'rent', fr: 'Appartement meublé', ar: 'شقة مفروشة', price: '8 000 DH', period: 'mois', city: 'Casablanca', area: '120 m²', beds: '3', baths: '2', img: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&q=80', alt: 'Appartement Casablanca', href: 'contact.html' },
      { id: 'p10', cat: 'rent', fr: 'Appartement en location', ar: 'شقة للإيجار', price: '6 500 DH', period: 'mois', city: 'Tanger', area: '90 m²', beds: '2', baths: '1', img: 'https://images.unsplash.com/photo-1600573472550-8090b5e0745e?w=600&q=80', alt: 'Appartement Tanger', href: 'contact.html' },
      { id: 'p11', cat: 'rent', fr: 'Studio meublé', ar: 'استوديو مفروش', price: '3 500 DH', period: 'mois', city: 'Rabat', area: '45 m²', beds: '1', baths: '1', img: 'https://images.unsplash.com/photo-1600585154084-4e5fe7c39198?w=600&q=80', alt: 'Studio meublé Rabat', href: 'contact.html' },
      { id: 'p12', cat: 'rent', fr: 'Appartement en location', ar: 'شقة للإيجار', price: '250 DH', period: 'jour', city: 'Agadir', area: '45 m²', beds: '1', baths: '1', img: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600&q=80', alt: 'Appartement Agadir', href: 'contact.html' },
      { id: 'p13', cat: 'rent', fr: 'Villa meublée', ar: 'فيلا مفروشة', price: '12 000 DH', period: 'mois', city: 'Agadir', area: '200 m²', beds: '4', baths: '3', img: 'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=600&q=80', alt: 'Villa Agadir location', href: 'contact.html' },
      { id: 'p14', cat: 'rent', fr: 'Appartement vue mer', ar: 'شقة بإطلالة بحرية', price: '400 DH', period: 'jour', city: 'Agadir', area: '70 m²', beds: '2', baths: '1', img: 'https://images.unsplash.com/photo-1560185007-cde436f6a4d0?w=600&q=80', alt: 'Appartement Agadir vue mer', href: 'contact.html' },
      { id: 'p15', cat: 'rent', fr: 'Appartement en location', ar: 'شقة للإيجار', price: '350 DH', period: 'jour', city: 'Agadir', area: '80 m²', beds: '2', baths: '1', img: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600&q=80', alt: 'Appartement Agadir', href: 'contact.html' },
      { id: 'p16', cat: 'rent', fr: 'Studio', ar: 'استوديو', price: '200 DH', period: 'jour', city: 'Agadir', area: '35 m²', beds: '1', baths: '1', img: 'https://images.unsplash.com/photo-1513584684374-8ccc748f0c8d?w=600&q=80', alt: 'Studio Agadir', href: 'contact.html' },
      { id: 'p17', cat: 'rent', fr: 'Appartement centre-ville', ar: 'شقة وسط المدينة', price: '450 DH', period: 'jour', city: 'Agadir', area: '90 m²', beds: '3', baths: '2', img: 'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=600&q=80', alt: 'Appartement Agadir centre', href: 'contact.html' },
      { id: 'p18', cat: 'renovation', fr: 'Cuisine Rénovée', ar: 'مطبخ مجدّد', price: 'Cuisine Rénovée', period: '', city: 'Casablanca', area: '25 m²', time: '2 semaines', img: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=600&q=80', alt: 'Rénovation cuisine', href: 'contact.html?subject=R%C3%A9novation' },
      { id: 'p19', cat: 'renovation', fr: 'Salon Rénové', ar: 'صالون مجدّد', price: 'Salon Rénové', period: '', city: 'Rabat', area: '40 m²', time: '3 semaines', img: 'https://images.unsplash.com/photo-1618220179428-22790b461013?w=600&q=80', alt: 'Rénovation salon', href: 'contact.html?subject=R%C3%A9novation' },
      { id: 'p20', cat: 'renovation', fr: 'Appartement Rénové', ar: 'شقة مجدّدة', price: 'Appartement Rénové', period: '', city: 'Marrakech', area: '90 m²', time: '1 mois', img: 'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?w=600&q=80', alt: 'Appartement rénové', href: 'contact.html?subject=R%C3%A9novation' },
      { id: 'p21', cat: 'renovation', fr: 'Salle de Bain Rénovée', ar: 'حمام مجدّد', price: 'Salle de Bain Rénovée', period: '', city: 'Tanger', area: '12 m²', time: '1 semaine', img: 'https://images.unsplash.com/photo-1600585152220-90363fe7e115?w=600&q=80', alt: 'Salle de bain rénovée', href: 'contact.html?subject=R%C3%A9novation' },
      { id: 'p22', cat: 'decoration', fr: 'Salon Moderne', ar: 'صالون عصري', price: 'Salon Moderne', period: '', city: 'Casablanca', area: '45 m²', style: 'Style contemporain', img: 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=600&q=80', alt: 'Décoration salon', href: 'contact.html?subject=D%C3%A9coration' },
      { id: 'p23', cat: 'decoration', fr: 'Chambre Luxury', ar: 'غرفة فاخرة', price: 'Chambre Luxury', period: '', city: 'Rabat', area: '30 m²', style: 'Style luxe', img: 'https://images.unsplash.com/photo-1615571022219-eb45cf7faa36?w=600&q=80', alt: 'Décoration chambre', href: 'contact.html?subject=D%C3%A9coration' },
      { id: 'p24', cat: 'decoration', fr: 'Cuisine Design', ar: 'مطبخ عصري', price: 'Cuisine Design', period: '', city: 'Marrakech', area: '20 m²', style: 'Style moderne', img: 'https://images.unsplash.com/photo-1616486029423-aaa4789e8c9a?w=600&q=80', alt: 'Décoration cuisine', href: 'contact.html?subject=D%C3%A9coration' },
      { id: 'p25', cat: 'decoration', fr: 'Salle à Manger', ar: 'غرفة طعام', price: 'Salle à Manger', period: '', city: 'Agadir', area: '35 m²', style: 'Style traditionnel', img: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=600&q=80', alt: 'Décoration salle à manger', href: 'contact.html?subject=D%C3%A9coration' }
    ]
  };
})();
