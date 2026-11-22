// GURUJI PALMISTRY — default site content
//
// Everything on the Services, Reiki, Courses, Resources, FAQ and About pages comes
// from here. The admin dashboard saves edited copies of these sections to the
// database (see /api/content); this file is the starting point and the fallback.
//
// Prices: a number means the service can be booked and paid online at that price.
// `null` means "price on request" — the Book button opens an enquiry instead.
// Loaded by the browser (window.GURUJI_CONTENT) and by server.js (require).

(function (root) {
  'use strict';

  // -------------------------------------------------------------------------
  // Site-wide settings
  // -------------------------------------------------------------------------
  const settings = {
    brand: 'Guruji Palmistry',
    positioning: 'Guidance · Healing · Devotion · Learning',
    email: 'support@gurujipalmistry.org',
    // Shown on the WhatsApp button and contact page. Edit in Admin → Settings.
    phone: '+91 89776 25078',
    whatsapp: '918977625078',
    address: 'Wellness Centre: 2-4-123/E/84/A, Swaroop Nagar, Srinivasa Colony, Uppal, Hyderabad, Telangana - 500039',
    mapUrl: 'https://maps.app.goo.gl/vGo2MHhgGJyLLxrr9',
    mapEmbedUrl: '',
    registeredAddress: 'GURUJI PALMISTRY, 2-3-123/E, Swaroop Nagar, Ayyappa Swamy Temple Road, Hyderabad, Uppal Bagayath, Uppal, Medchal (Malkajgiri), Telangana',
    registrationNumber: 'SEA/MED/ALO/NR/1439866/2026',
    registrationAct: 'Telangana Shops & Establishments Act, 1988',
    registrationAuthority: 'Government of Telangana — Labour Department (ALO Nacharam)',
    certificatePdf: '/assets/certificate_of_registration_guruji_palmistry.pdf',
    certificateImg: '/assets/certificate_of_registration_guruji_palmistry.jpg',
    verifyGovtUrl: 'https://labour.telangana.gov.in/',
    social: { instagram: '', youtube: '', facebook: '' },
    hero: {
      title: 'Discover Yourself Through Ancient Wisdom',
      subtitle: 'Palmistry, Vedic astrology, Reiki healing and spiritual guidance with Guruji — practical insight for career, relationships, health of mind and the path ahead.'
    }
  };

  // -------------------------------------------------------------------------
  // The four pillars
  // -------------------------------------------------------------------------
  const pillars = [
    { id: 'guidance', title: 'Guidance', text: 'Palmistry & Astrology', icon: 'fa-hand', link: '/services' },
    { id: 'healing', title: 'Healing', text: 'Reiki & Holistic Well-being', icon: 'fa-spa', link: '/reiki-healing' },
    { id: 'devotion', title: 'Devotion', text: 'Japa, Mantra & Puja', icon: 'fa-om', link: '/services/category/puja-rituals' },
    { id: 'learning', title: 'Learning', text: 'Courses & Spiritual Knowledge', icon: 'fa-book-open', link: '/courses' }
  ];

  // -------------------------------------------------------------------------
  // About Guruji (all text editable in Admin → About)
  // -------------------------------------------------------------------------
  const about = {
    name: 'Adiguru Swamiji',
    alsoKnownAs: 'Satish Mokkapati (Mokkapati Satish Kumar)',
    role: 'Spiritual Guide & Founder',
    tagline: 'Beyond Prediction. Towards Self-Discovery.',
    portrait: '/assets/adiguru_swamiji_portrait.jpg',
    intro: 'Adiguru Swamiji is a spiritual seeker whose journey spans over 25 years of corporate leadership and a deeper pursuit of life’s purpose. Guided by an inclination towards spirituality since childhood and transformed by experiences, travels, service, and his meeting with Gopal Baba, he now shares insights from Palmistry, Astrology, and Conscious Living. His endeavour is to help individuals move beyond prediction towards awareness, understanding, and self-discovery.',
    sections: [
      {
        id: 'journey',
        title: 'A Journey from Professional Success to Spiritual Discovery',
        paragraphs: [
          'From an early childhood, Adiguru Swamiji was deeply inclined towards spirituality, drawn to questions about life, human existence, the mysteries of nature, and the deeper meaning behind our experiences. This inner curiosity remained a constant companion, even while his professional life took him through a demanding and rewarding corporate journey.',
          'With over 25 years of experience in multinational companies, spanning leadership, operations, strategy, business transformation, and organizational management, he had the opportunity to work with people from diverse backgrounds and travel to several countries. These experiences allowed him to appreciate different cultures, traditions, philosophies, and ways of life, broadening his understanding of humanity beyond geographical and cultural boundaries.',
          'Yet, somewhere along this journey, the search for meaning began to take precedence over the pursuit of conventional success.',
          'In 2017, he chose to embark on a more personal path of spiritual exploration, self-discovery, and service. This journey led to the beginnings of <strong>Adiguru Gaushala</strong> and <strong>Adiguru Ayurveda</strong>, initiatives born out of a deeper connection to traditional wisdom, nature, compassion, and conscious living. He also serves as a Trustee of <strong>Sri Sankara Vidyabharathi Gowsamrakshana Charitable Trust</strong>, continuing his association with the values of service and Dharma.',
          'A pivotal moment in his life was his meeting with <strong>Gopal Baba</strong>, an encounter that profoundly changed his perspective on life. It brought a deeper understanding of spirituality, the purpose of human existence, the significance of surrender, and the realization that life is not merely about what we accumulate, but about what we discover within ourselves.',
          'Today, Adiguru Swamiji is sought after for his insights into <strong>Palmistry, Astrology, and Conscious Living</strong>. His approach is not merely about predicting events or interpreting signs, but about helping individuals understand themselves better, recognize their inherent strengths, explore life’s possibilities, and approach their journey with greater awareness.',
          'He believes that ancient knowledge is not meant to create fear or dependency, but to awaken understanding; not to dictate one’s destiny, but to help one consciously participate in it.',
          '<strong>His journey continues—with the conviction that the greatest discovery in life is the discovery of one’s own self.</strong>'
        ]
      },
      {
        id: 'approach',
        title: 'Beyond Prediction. Towards Self-Discovery.',
        body: 'Ancient knowledge is not meant to create fear or dependency, but to awaken understanding; not to dictate one’s destiny, but to help one consciously participate in it. The greatest discovery in life is the discovery of one’s own self.'
      }
    ],
    highlights: [
      'Beyond Prediction. Towards Self-Discovery.',
      '25+ Years Corporate Leadership & Global Experience',
      'Founder – Adiguru Gaushala & Adiguru Ayurveda',
      'Trustee, Sri Sankara Vidyabharathi Gowsamrakshana Charitable Trust',
      'Spiritual Guidance & Insights from Gopal Baba',
      'Palmistry, Astrology & Conscious Living',
      'Wellness Centre in Uppal, Hyderabad'
    ]
  };

  // -------------------------------------------------------------------------
  // Service categories
  // -------------------------------------------------------------------------
  const serviceCategories = [
    {
      id: 'palmistry', title: 'Palmistry', tagline: 'Personal insights and guidance through palm analysis',
      image: '/assets/svc/palmistry.webp', icon: 'fa-hand',
      intro: 'Hasta Samudrika Shastra reads the shape of the hand, the fingers, the mounts and the lines to describe temperament, strengths and the themes of different life periods.',
      howItWorks: ['Book the service and complete payment or send an enquiry.', 'Upload clear photos of both palms (we guide you on how to take them).', 'Guruji studies your hands and prepares the reading.', 'You receive the consultation call and a written summary.'],
      requiredInfo: ['Clear photos of both palms (and the side of the hand)', 'Your dominant hand (left / right)', 'Date of birth', 'Specific questions you want addressed']
    },
    {
      id: 'astrology', title: 'Astrology', tagline: 'Horoscope, planetary influences and timing',
      image: '/assets/svc/astrology.svg', icon: 'fa-star-and-crescent',
      intro: 'Vedic astrology (Jyotisha) studies the planetary configuration at the time of birth — the Lagna, the twelve Bhavas, the Grahas, Rashis and Nakshatras — and the Dasha periods that unfold through life.',
      howItWorks: ['Book the service and share your birth details.', 'Guruji casts and studies your chart.', 'Consultation by phone / video (or in person where available).', 'You receive a summary of key findings and suggested practices.'],
      requiredInfo: ['Date of birth', 'Exact time of birth (as accurate as possible)', 'Place of birth (city, state, country)', 'Questions or areas of focus']
    },
    {
      id: 'japa-mantra', title: 'Japa & Mantra', tagline: 'Personal and planetary mantra services',
      image: '/assets/svc/japa.webp', icon: 'fa-om',
      intro: 'Japa is the disciplined repetition of a mantra with Sankalpa (a stated intention). Japa can be performed for an individual graha, the Navagraha, or a chosen deity, on your behalf or with you.',
      howItWorks: ['Send an enquiry with your intention and details.', 'Guruji suggests the mantra, count and number of days.', 'Sankalpa is taken in your name and gotram; japa is performed.', 'You receive confirmation on completion.'],
      requiredInfo: ['Full name', 'Gotram (if known)', 'Nakshatra / Rashi (if known)', 'Purpose of the japa']
    },
    {
      id: 'puja-rituals', title: 'Puja & Graha Shanti', tagline: 'Traditional spiritual rituals and pujas',
      image: '/assets/svc/puja.webp', icon: 'fa-fire',
      intro: 'Pujas, homams and abhishekams performed according to tradition, with Sankalpa in your name. Some can be booked and paid online; others are arranged after a short consultation.',
      howItWorks: ['Choose the puja and date (or send an enquiry).', 'Share names and gotram for the Sankalpa.', 'The ritual is performed on the chosen date and slot.', 'Prasadam can be posted to your address.'],
      requiredInfo: ['Names of the family members for the Sankalpa', 'Gotram', 'Preferred date', 'Postal address if prasadam is required']
    },
    {
      id: 'pitru', title: 'Pitru Services', tagline: 'Rituals and guidance for ancestors',
      image: '/assets/svc/pitru.webp', icon: 'fa-water',
      intro: 'Rituals and guidance to honour one’s ancestors on Amavasya, during Mahalaya Paksha and on other traditional occasions.',
      howItWorks: ['Send an enquiry with the occasion and details.', 'Guruji advises on the appropriate ritual and date.', 'The ritual is performed with Sankalpa in your family’s name.', 'You receive confirmation on completion.'],
      requiredInfo: ['Names of the ancestors (if the ritual requires them)', 'Gotram', 'Occasion / tithi if known', 'Your contact details']
    },
    {
      id: 'muhurta', title: 'Muhurta', tagline: 'Auspicious timing for important beginnings',
      image: '/assets/svc/muhurta.webp', icon: 'fa-clock',
      intro: 'Muhurta selects an auspicious date and time for an important beginning — a marriage, a housewarming, a purchase or the opening of a business — using the Panchanga and the charts of the people involved.',
      howItWorks: ['Send an enquiry with the event and your preferred date range.', 'Share the birth details of the people involved.', 'Guruji studies the Panchanga and the charts.', 'You receive suitable dates and time windows.'],
      requiredInfo: ['Type of event', 'Preferred date range', 'Birth details of the main people involved', 'Place where the event will take place']
    },
    {
      id: 'reiki', title: 'Reiki Healing', tagline: 'Relaxation, balance and complementary wellness',
      image: '/assets/svc/reiki.svg', icon: 'fa-spa', link: '/reiki-healing',
      intro: 'Reiki is a gentle, hands-on (or distance) relaxation practice. It is a complementary wellness practice and is not a substitute for medical diagnosis or treatment.',
      howItWorks: ['Book a session or send an enquiry.', 'A short conversation about what you would like from the session.', 'The Reiki session — in person or at a distance.', 'A few minutes to share how you feel and simple practices for home.'],
      requiredInfo: ['Your name and contact', 'In-person or distance session', 'Anything you would like the practitioner to know']
    },
    {
      id: 'spiritual-guidance', title: 'Spiritual Guidance', tagline: 'Sadhana, mantra and spiritual practices',
      image: '/assets/svc/guidance.svg', icon: 'fa-dharmachakra',
      intro: 'One-to-one guidance on building a steady spiritual practice — choosing a mantra, meditation, daily sadhana and chakra awareness — suited to your life and temperament.',
      howItWorks: ['Send an enquiry describing where you are in your practice.', 'A conversation with Guruji.', 'A simple, practical plan for daily practice.', 'Optional follow-up sessions.'],
      requiredInfo: ['Your current practice (if any)', 'What you hope to develop', 'Date of birth (optional)']
    }
  ];

  // -------------------------------------------------------------------------
  // Services
  // -------------------------------------------------------------------------
  // Short helper so each service only lists what is specific to it.
  const S = (category, slug, title, short, benefits, extra = {}) => Object.assign({
    slug, category, title, short,
    intro: short,
    description: '',
    benefits,
    duration: '',
    price: null,
    bookingType: 'enquiry',
    featured: false,
    published: true
  }, extra);

  const services = [
    // --- Three core consultations ------------------------------------------
    S('palmistry', 'detailed-palm-analysis', 'Detailed Palm Analysis',
      'A complete study of your hands — shape, fingers, mounts, major and minor lines and special marks.',
      ['Health and vitality', 'Wealth and prosperity', 'Education and intelligence', 'Career and profession', 'Marriage and relationships', 'Children and siblings', 'Travel, spiritual inclination and life periods'],
      {
        core: true, featured: true, consultationId: 'palmistry_reading', bookingType: 'consultation', price: 549, duration: '30 minutes', image: '/assets/svc/palmistry.webp',
        description: 'Guruji examines the hand shape, fingers and fingertips, the mounts, the major lines (Life, Head, Heart, Fate, Sun) and minor lines, and special marks such as stars, crosses, islands and triangles. The reading brings these together into a picture of your temperament and the themes of health, wealth, education, career, marriage, children, siblings and life periods.',
        deliverables: ['Consultation call with Guruji', 'Written summary of the palm reading', 'Answers to your specific questions']
      }),
    S('astrology', 'kundali-analysis', 'Comprehensive Kundali Analysis',
      'A complete study of your birth chart — planetary placements, Bhavas, Rashis, Nakshatras, Dasha periods and transits.',
      ['Lagna and the Lagna lord', 'Placement and strength of each Graha', 'All twelve Bhavas (houses)', 'Rashis, Nakshatras and Yogas', 'Mahadasha / Antardasha periods', 'Major transits and life themes'],
      {
        core: true, featured: true, consultationId: 'astrology_correlation', bookingType: 'consultation', price: 549, duration: '30 minutes', image: '/assets/svc/astrology.svg',
        description: 'Your Kundali is cast from your date, time and place of birth. Guruji studies the Lagna and its lord, the placement and strength of the Grahas, the twelve Bhavas, Rashis and Nakshatras, important Yogas, the running Mahadasha and Antardasha, and the major transits — and explains what they indicate for the areas of life you ask about.',
        deliverables: ['Consultation call with Guruji', 'Summary of chart highlights and current Dasha', 'Suggested practices where appropriate']
      }),
    S('astrology', 'astro-palmistry-correlation', 'Astro-Palmistry Correlation',
      'Two Ancient Sciences. One Integrated Perspective.',
      ['See where the chart and the hand agree', 'Understand where they add to each other', 'Notice where they differ — and why', 'A single, combined report'],
      {
        core: true, featured: true, consultationId: 'combined_consultation', bookingType: 'consultation', price: 749, duration: '45 minutes', image: '/assets/svc/astro-palmistry.webp',
        tagline: 'Two Ancient Sciences. One Integrated Perspective.',
        intro: 'Astrology reveals life patterns through planetary configuration at birth, while palmistry reveals them through the physical characteristics of the hand. This report examines where these indications align, complement, or differ.',
        description: 'Astro-Palmistry Correlation combines a Comprehensive Kundali Analysis with a Detailed Palm Analysis and then compares the two, area by area. Where both sciences point the same way, the indication is stronger; where they differ, Guruji explains how to read the difference.',
        reportParts: [
          { title: 'Part 1 — Kundali Analysis', items: ['Lagna and its lord', 'Planetary placements', 'All twelve Bhavas', 'Grahas and their strengths', 'Rashis and Nakshatras', 'Yogas', 'Mahadasha and Antardasha', 'Major transits', 'Life themes'] },
          { title: 'Part 2 — Palm Analysis', items: ['Hand shape', 'Fingers and fingertips', 'Mounts', 'Major lines', 'Minor lines', 'Special marks', 'Hand characteristics', 'Changes and patterns'] },
          { title: 'Part 3 — Correlation', items: ['Area-by-area comparison of the two readings (table below)'] }
        ],
        correlation: [
          ['Personality & temperament', 'Lagna, Moon sign, Lagna lord', 'Hand shape, fingers, thumb'],
          ['Health & vitality', 'Lagna, 6th / 8th Bhava, Sun & Moon', 'Life line, hand texture, nails'],
          ['Education & intelligence', '4th / 5th Bhava, Mercury, Jupiter', 'Head line, Mercury finger'],
          ['Career & profession', '10th Bhava, its lord, Saturn', 'Fate line, Sun line, mounts'],
          ['Wealth & prosperity', '2nd / 11th Bhava, Jupiter, Venus', 'Sun line, Mercury mount, signs'],
          ['Marriage & relationships', '7th Bhava, Venus, Navamsa', 'Heart line, marriage lines'],
          ['Children', '5th Bhava, Jupiter', 'Children lines, Mount of Venus'],
          ['Siblings', '3rd Bhava, Mars', 'Lines near the Mount of Mars'],
          ['Travel & relocation', '3rd / 9th / 12th Bhava, Rahu', 'Travel lines, Mount of Moon'],
          ['Spiritual inclination', '9th / 12th Bhava, Ketu, Jupiter', 'Mystic cross, Jupiter mount'],
          ['Life periods & timing', 'Mahadasha / Antardasha, transits', 'Timing along the major lines']
        ],
        deliverables: ['Kundali analysis', 'Palm analysis', 'Correlation table across eleven areas of life', 'Consultation call with Guruji', 'Written combined report']
      }),

    // --- Palmistry ---------------------------------------------------------
    S('palmistry', 'basic-palm-reading', 'Basic Palm Reading', 'An introductory reading of the major lines and hand shape — a good first look at what your hands say.', ['Overview of the major lines', 'Hand shape and temperament', 'One or two questions answered'], { image: '/assets/services/palmistry_lines.jpg' }),
    S('palmistry', 'palmistry-career-guidance', 'Career Guidance through Palmistry', 'Focused reading of the Fate and Sun lines, the mounts and the fingers for direction in work and career.', ['Natural aptitudes and working style', 'Indications of career changes', 'Timing along the Fate line'], { image: '/assets/services/palmistry_career.jpg' }),
    S('palmistry', 'marriage-relationship-analysis', 'Marriage & Relationship Analysis', 'The Heart line, relationship lines and Mount of Venus read for emotional nature and partnership.', ['Emotional temperament', 'Relationship patterns', 'Indications around marriage'], { image: '/assets/services/palmistry_marriage.jpg' }),
    S('palmistry', 'business-guidance', 'Business Guidance', 'Reading of the hand for enterprise, risk-taking, financial sense and partnership suitability.', ['Entrepreneurial indicators', 'Financial temperament', 'Suitable fields and timing'], { image: '/assets/services/palmistry_business.jpg' }),
    S('palmistry', 'personality-analysis', 'Personality Analysis', 'Hand shape, fingers and thumb read for character, decision-making and natural strengths.', ['Core temperament', 'Strengths to build on', 'Patterns to be aware of'], { image: '/assets/services/palmistry_mounts.jpg' }),
    S('palmistry', 'major-minor-lines', 'Major & Minor Palm Lines', 'A dedicated reading of every major and minor line on both hands, and how they have changed.', ['Life, Head, Heart, Fate and Sun lines', 'Minor lines and their meaning', 'Comparison of left and right hands'], { image: '/assets/services/palmistry_lines_macro.jpg' }),
    S('palmistry', 'mounts-finger-analysis', 'Mounts & Finger Analysis', 'The seven mounts and the length, shape and setting of the fingers and thumb.', ['Planetary mounts and their development', 'Finger proportions and phalanges', 'Thumb — will and logic'], { image: '/assets/services/palmistry_mounts_detail.jpg' }),
    S('palmistry', 'online-palmistry-consultation', 'Online Palmistry Consultation', 'A palm reading from anywhere — share clear photos of your hands and speak with Guruji on a call.', ['No travel required', 'Guidance on taking good palm photos', 'Call at a convenient time'], { image: '/assets/services/palmistry_online_consult.jpg' }),
    S('palmistry', 'life-guidance', 'Life Guidance Reading', 'A broader reading that looks at where you are now and the themes of the coming years.', ['Current life period', 'Areas needing attention', 'Practical suggestions'], { image: '/assets/services/palmistry_life_guidance.jpg' }),

    // --- Astrology ---------------------------------------------------------
    S('astrology', 'horoscope-analysis', 'Horoscope Analysis', 'A general reading of your birth chart and its main indications.', ['Overall chart strengths', 'Key life themes', 'Questions answered'], { image: '/assets/services/astrology_annual.jpg' }),
    S('astrology', 'dasha-analysis', 'Mahadasha & Antardasha Analysis', 'A focused look at your running and upcoming Dasha periods and what they emphasise.', ['Current Mahadasha and Antardasha', 'Upcoming period changes', 'How to use each period well'], { image: '/assets/services/astrology_mahadasha.jpg' }),
    S('astrology', 'marriage-compatibility', 'Marriage Compatibility', 'Chart matching for marriage — Guna Milan and a deeper comparison of the two charts.', ['Ashtakoota Guna Milan', 'Manglik and other considerations', 'Strengths and areas to work on'], { requiredInfo: ['Birth details (date, time, place) of both people'], image: '/assets/services/astrology_marriage.jpg' }),
    S('astrology', 'career-astrology', 'Career Astrology', 'The 10th Bhava, its lord and the Dasha periods read for career direction and timing.', ['Suitable fields', 'Periods of growth and change', 'Practical guidance'], { image: '/assets/services/astrology_career.jpg' }),
    S('astrology', 'business-astrology', 'Business Astrology', 'Astrological guidance for starting or expanding a business, partnerships and timing.', ['Business suitability', 'Partnership indications', 'Favourable periods'], { image: '/assets/services/astrology_business.jpg' }),
    S('astrology', 'prashna-astrology', 'Prashna Astrology', 'Horary astrology — a chart cast for the moment a question is asked, useful when birth time is unknown.', ['Answers to a specific question', 'Works without birth details', 'Quick, focused guidance'], { requiredInfo: ['Your question, clearly worded', 'Your current location'], image: '/assets/services/astrology_prashna.jpg' }),
    S('astrology', 'annual-horoscope', 'Annual Horoscope (Varshaphal)', 'A reading of the year ahead from your birthday chart and transits.', ['Themes for the year', 'Favourable and challenging months', 'Suggested focus'], { image: '/assets/services/astrology_annual.jpg' }),
    S('astrology', 'muhurta-consultation', 'Muhurta Consultation', 'Selection of an auspicious time for an important event, with explanation.', ['Suitable dates and times', 'Reasoning explained', 'Guidance on preparations'], { image: '/assets/svc/muhurta.webp' }),

    // --- Japa & Mantra -----------------------------------------------------
    S('japa-mantra', 'navagraha-japa', 'Navagraha Japa', 'Japa of the nine planetary mantras with Sankalpa in your name.', ['Covers all nine Grahas', 'Performed with Sankalpa', 'Completion confirmed']),
    S('japa-mantra', 'individual-graha-japa', 'Individual Graha Japa', 'Japa of the mantra of a single Graha — for example Shani, Rahu or Guru — as indicated by your chart.', ['Focused on one planet', 'Count set by tradition', 'Suggested from your chart']),
    S('japa-mantra', 'personalized-mantra-japa', 'Personalised Mantra Japa', 'A mantra chosen for your intention and chart, with japa performed on your behalf.', ['Mantra chosen for you', 'Sankalpa in your name', 'Guidance for personal practice']),
    S('japa-mantra', 'sankalpa-japa', 'Sankalpa Japa', 'Japa undertaken with a formal Sankalpa for a stated purpose over a set number of days.', ['Clear intention', 'Fixed count and duration', 'Completion confirmed']),
    S('japa-mantra', 'rudra-mantra', 'Rudra Mantra Japa', 'Japa of Rudra mantras in devotion to Lord Shiva.', ['Traditional Rudra mantras', 'Performed with Sankalpa']),
    S('japa-mantra', 'gayatri-mantra', 'Gayatri Mantra Japa', 'Japa of the Gayatri mantra for clarity and spiritual discipline.', ['Traditional count', 'Performed with Sankalpa']),
    S('japa-mantra', 'mahamrityunjaya-mantra', 'Mahamrityunjaya Mantra Japa', 'Japa of the Mahamrityunjaya mantra, traditionally chanted for protection and well-being.', ['Traditional count', 'Performed with Sankalpa']),
    S('japa-mantra', 'ganapati-mantra', 'Ganapati Mantra Japa', 'Japa of Ganapati mantras, traditionally offered before new beginnings.', ['For new beginnings', 'Performed with Sankalpa']),
    S('japa-mantra', 'lakshmi-mantra', 'Lakshmi Mantra Japa', 'Japa of Lakshmi mantras in devotion to the Goddess of prosperity.', ['Traditional mantras', 'Performed with Sankalpa']),
    S('japa-mantra', 'saraswati-mantra', 'Saraswati Mantra Japa', 'Japa of Saraswati mantras, traditionally offered for learning and studies.', ['For students and learning', 'Performed with Sankalpa']),
    S('japa-mantra', 'hanuman-mantra', 'Hanuman Mantra Japa', 'Japa of Hanuman mantras for courage and steadiness.', ['Traditional mantras', 'Performed with Sankalpa']),
    S('japa-mantra', 'deity-mantra-japa', 'Other Deity Mantra Japa', 'Japa of other traditional deity mantras on request.', ['Mantra of your Ishta Devata', 'Performed with Sankalpa']),

    // --- Puja & Rituals ----------------------------------------------------
    S('puja-rituals', 'ganapathi-homam', 'Ganapathi Homam', 'Fire ritual to Lord Ganapathi to remove obstacles before new ventures.', ['Removal of obstacles', 'For new beginnings', 'Prasadam can be posted'], { bookingType: 'pooja', poojaId: 'ganapathi_homam', price: 3100, duration: '45–60 minutes', image: '/assets/ganapathi_homam_card_1795167334513.jpg', featured: true }),
    S('puja-rituals', 'navagraha-puja', 'Navagraha Shanti Puja', 'Puja to the nine Grahas to pacify challenging planetary periods.', ['All nine planets', 'Graha Shanti', 'Prasadam can be posted'], { bookingType: 'pooja', poojaId: 'navagraha_shanti', price: 5100, duration: '60 minutes', image: '/assets/navagraha_shanti_card_1795167350977.jpg', featured: true }),
    S('puja-rituals', 'shani-shanti', 'Shani Shanti Puja', 'Shani Shanti with Tailabhishekam, traditionally performed during Sade Sati or Shani Dasha.', ['For Shani periods', 'Tailabhishekam'], { bookingType: 'pooja', poojaId: 'shani_shanti', price: 2100, duration: '45 minutes', image: '/assets/shani_shanti_puja_card_1795167348933.jpg' }),
    S('puja-rituals', 'ayushya-homam', 'Ayushya Homam', 'Homam traditionally performed on birthdays for long life and well-being.', ['On birthdays', 'For the family'], { bookingType: 'pooja', poojaId: 'ayushya_homam', price: 3100, duration: '45–60 minutes', image: '/assets/pooja_thumb_ayushya.jpg' }),
    S('puja-rituals', 'santana-prapti', 'Santana Prapti Puja', 'Traditional puja to Bala Gopala offered by couples praying for children.', ['Devotion to Bala Gopala', 'For couples'], { bookingType: 'pooja', poojaId: 'santana_prapti', price: 4100, duration: '45–60 minutes', image: '/assets/santana_prapti_pooja_bal_gopal_1795167365329.jpg' }),
    S('puja-rituals', 'graha-shanti-puja', 'Graha Shanti Puja', 'Puja for a specific Graha indicated in your chart.', ['Focused on one planet', 'Suggested from your chart']),
    S('puja-rituals', 'rudrabhishekam', 'Rudrabhishekam', 'Abhishekam to Lord Shiva with the chanting of Sri Rudram.', ['Sri Rudram chanting', 'Abhishekam with traditional dravyas']),
    S('puja-rituals', 'homam', 'Homam (on request)', 'Other traditional homams arranged on request.', ['Chosen for your purpose', 'Performed by tradition']),
    S('puja-rituals', 'special-sankalpa-puja', 'Special Sankalpa Puja', 'A puja performed with a special Sankalpa for a particular intention.', ['Your intention as Sankalpa', 'Deity chosen with guidance']),
    S('puja-rituals', 'vratham-guidance', 'Vratham Guidance & Coordination', 'Guidance on observing a Vratham — the procedure, dates and what is needed.', ['Correct procedure', 'Dates from the Panchanga', 'Checklist of materials']),
    S('puja-rituals', 'festival-pujas', 'Traditional Festival Pujas', 'Pujas for festivals such as Ganesh Chaturthi, Navaratri, Deepavali and Shivaratri.', ['Festival-specific rituals', 'Performed on the right muhurta']),

    // --- Pitru ---------------------------------------------------------------
    S('pitru', 'pitru-runa-vimochana', 'Pitru Runa Vimochana Puja', 'Puja to honour ancestors and seek their blessings.', ['Honouring ancestors', 'Prasadam can be posted'], { bookingType: 'pooja', poojaId: 'pitru_runa_vimochana', price: 5100, duration: '60 minutes', image: '/assets/pitru_runa_vimochana_puja_1795167355033.jpg' }),
    S('pitru', 'amavasya-ritual-guidance', 'Amavasya Ritual Guidance', 'Guidance on the monthly Amavasya Tarpanam and offerings.', ['Procedure explained', 'Dates from the Panchanga']),
    S('pitru', 'pitru-japa', 'Pitru-related Japa', 'Japa performed for the peace of ancestors.', ['Performed with Sankalpa', 'Completion confirmed']),
    S('pitru', 'mahalaya-paksha', 'Mahalaya Paksha Ritual Guidance', 'Guidance for the fortnight of the ancestors — tithis, Tarpanam and offerings.', ['Choosing the right tithi', 'Tarpanam guidance']),
    S('pitru', 'pitru-shanti', 'Traditional Pitru Shanti Services', 'Traditional rituals for Pitru Shanti, arranged after consultation.', ['Arranged after consultation', 'Performed by tradition']),

    // --- Muhurta -------------------------------------------------------------
    S('muhurta', 'marriage-muhurta', 'Marriage Muhurta', 'An auspicious date and time for the wedding, from both charts and the Panchanga.', ['Suitable wedding dates', 'Lagna for the ceremony']),
    S('muhurta', 'housewarming-muhurta', 'Housewarming (Gruhapravesham) Muhurta', 'An auspicious time to enter a new home.', ['Suitable dates', 'Guidance on the ritual']),
    S('muhurta', 'property-purchase-muhurta', 'Property Purchase Muhurta', 'Timing for registering or purchasing property.', ['Suitable dates and times']),
    S('muhurta', 'vehicle-purchase-muhurta', 'Vehicle Purchase Muhurta', 'An auspicious time to buy or take delivery of a vehicle.', ['Suitable dates and times']),
    S('muhurta', 'business-opening-muhurta', 'Business Opening Muhurta', 'Timing for opening a shop, office or new venture.', ['Suitable dates and times', 'Considering the owner’s chart']),
    S('muhurta', 'naming-ceremony-muhurta', 'Naming Ceremony (Namakaranam) Muhurta', 'An auspicious time for the naming ceremony, and suggested starting syllables.', ['Suitable dates', 'Nakshatra syllables for the name']),

    // --- Reiki -------------------------------------------------------------
    S('reiki', 'reiki-individual-session', 'Reiki Healing — Individual Session', 'A one-to-one Reiki session for relaxation and a sense of balance.', ['Deep relaxation', 'Calm and grounding', 'Time to rest the mind'], { duration: 'About 45–60 minutes', featured: true }),
    S('reiki', 'reiki-extended-session', 'Reiki Healing — Extended Session', 'A longer session that allows more time for relaxation and integration.', ['More time to settle', 'Includes guided breathing'], { duration: 'About 90 minutes' }),
    S('reiki', 'distance-reiki-session', 'Distance Reiki Session', 'A Reiki session offered remotely at an agreed time, while you rest at home.', ['From anywhere', 'Rest in your own space'], { duration: 'About 30–45 minutes' }),
    S('reiki', 'stress-relaxation-session', 'Stress Relaxation Session', 'A session focused on relaxation for busy, stressful periods.', ['Pause and unwind', 'Simple breathing practices for home']),
    S('reiki', 'chakra-balancing-session', 'Chakra Awareness & Balancing Session', 'Reiki with attention to each of the seven chakras, and an introduction to chakra awareness.', ['Introduction to the seven chakras', 'Guided awareness practice']),
    S('reiki', 'reiki-meditation-session', 'Reiki Meditation Session', 'A guided meditation session using Reiki principles.', ['Guided meditation', 'Reiki principles for daily life']),
    S('reiki', 'reiki-package-3', 'Reiki Healing Package — 3 Sessions', 'Three sessions scheduled over a few weeks.', ['Regular rhythm of sessions', 'Space to notice change']),
    S('reiki', 'reiki-package-5', 'Reiki Healing Package — 5 Sessions', 'Five sessions for a longer period of regular practice.', ['Steady, regular support', 'Flexible scheduling']),
    S('reiki', 'reiki-follow-up-session', 'Reiki Follow-up Session', 'A follow-up session for those who have had Reiki with us before.', ['Continue your practice']),
    S('reiki', 'reiki-consultation', 'Reiki Consultation', 'A short conversation to understand Reiki and decide whether it is right for you.', ['Questions answered', 'No obligation']),

    // --- Spiritual guidance ------------------------------------------------
    S('spiritual-guidance', 'mantra-guidance', 'Mantra Guidance', 'Help choosing a mantra and building a daily japa practice.', ['A mantra suited to you', 'Correct pronunciation and method']),
    S('spiritual-guidance', 'meditation-guidance', 'Meditation Guidance', 'Simple, steady meditation practice for daily life.', ['Practical technique', 'Building a routine']),
    S('spiritual-guidance', 'sadhana-guidance', 'Sadhana Guidance', 'Structuring a personal daily spiritual practice.', ['A plan that fits your day', 'Follow-up support']),
    S('spiritual-guidance', 'chakra-practices', 'Chakra Awareness Practices', 'An introduction to the chakras and awareness practices for each.', ['Understanding the seven chakras', 'Daily awareness practices'])
  ];

  // -------------------------------------------------------------------------
  // Courses
  // -------------------------------------------------------------------------
  const C = (track, slug, title, overview, curriculum, outcomes, extra = {}) => Object.assign({
    slug, track, title, overview, curriculum, outcomes,
    duration: 'Announced with the next batch',
    mode: 'Online & offline',
    instructor: 'Guruji',
    price: null,
    certificate: 'Certificate of completion',
    status: 'enquire',           // 'open' | 'enquire' | 'upcoming'
    published: true
  }, extra);

  const courseTracks = [
    { id: 'palmistry', title: 'Palmistry Courses', image: '/assets/svc/course-palmistry.webp', icon: 'fa-hand' },
    { id: 'reiki', title: 'Reiki Courses', image: '/assets/svc/reiki.svg', icon: 'fa-spa', note: 'Course structure depends on the lineage, teacher qualifications, training standards and attunement practice followed.' },
    { id: 'future', title: 'Future Courses', image: '/assets/svc/guidance.svg', icon: 'fa-seedling', note: 'These courses will be introduced progressively. Register your interest to be told when they open.' }
  ];

  const courses = [
    C('palmistry', 'introduction-to-palmistry', 'Introduction to Palmistry', 'A friendly first course: what palmistry is, how to look at a hand, and the meaning of the main lines.', ['History and traditions of Hasta Samudrika Shastra', 'Which hand to read and why', 'Hand shapes at a glance', 'The four major lines', 'Taking good palm photos'], ['Read the major lines on a hand', 'Recognise the basic hand types', 'Know what palmistry can and cannot tell you'], { status: 'open', featured: true, image: '/assets/courses/course_intro_palmistry.jpg' }),
    C('palmistry', 'foundation-course-in-palmistry', 'Foundation Course in Palmistry', 'A structured foundation in the hand, fingers, mounts and lines.', ['Hand shapes and elements', 'Fingers, phalanges and thumb', 'The seven mounts', 'Major lines in depth', 'Introduction to minor lines', 'Practice readings'], ['Give a basic, structured reading', 'Combine shape, mounts and lines', 'Avoid common beginner mistakes'], { featured: true, image: '/assets/courses/course_foundation_palmistry.jpg' }),
    C('palmistry', 'advanced-palmistry', 'Advanced Palmistry', 'For students who have completed the foundation: timing, special marks and synthesis.', ['Timing events on the lines', 'Special marks and their meaning', 'Changes between left and right hands', 'Synthesis of a full reading'], ['Time indications on the major lines', 'Interpret special marks in context'], { image: '/assets/courses/course_advanced_palmistry.jpg' }),
    C('palmistry', 'mounts-of-the-palm', 'Mounts of the Palm', 'A focused module on the planetary mounts and their development.', ['Jupiter, Saturn, Sun, Mercury', 'Mars (upper and lower), Moon, Venus', 'Displaced and combined mounts'], ['Assess mount development', 'Relate mounts to temperament'], { image: '/assets/courses/course_mounts_palm.jpg' }),
    C('palmistry', 'major-and-minor-lines', 'Major & Minor Lines', 'Every line in detail, including the less common minor lines.', ['Life, Head, Heart, Fate, Sun lines', 'Mercury, marriage, travel and other minor lines', 'Breaks, islands, chains and branches'], ['Read each line confidently', 'Understand line quality and marks'], { image: '/assets/courses/course_major_minor_lines.jpg' }),
    C('palmistry', 'hand-shapes-and-finger-analysis', 'Hand Shapes & Finger Analysis', 'What the shape of the hand and the fingers reveal about character.', ['Elemental hand types', 'Finger length, setting and tips', 'The thumb — will and logic'], ['Classify a hand quickly', 'Read personality from shape'], { image: '/assets/courses/course_hand_shapes_fingers.jpg' }),
    C('palmistry', 'signs-symbols-and-markings', 'Signs, Symbols & Markings', 'Stars, crosses, triangles, squares, islands, grilles and other markings.', ['Catalogue of special signs', 'Where they appear and what changes', 'Reading signs in context'], ['Identify the common special marks', 'Interpret them without exaggeration'], { image: '/assets/courses/course_signs_symbols.jpg' }),
    C('palmistry', 'career-analysis-through-palmistry', 'Career Analysis through Palmistry', 'Applying palmistry to questions of work, aptitude and career change.', ['Fate and Sun lines for career', 'Mounts and fingers for aptitude', 'Case studies'], ['Give focused career readings'], { image: '/assets/courses/course_career_palmistry.jpg' }),
    C('palmistry', 'relationship-analysis-through-palmistry', 'Relationship Analysis through Palmistry', 'Applying palmistry to emotional nature and relationships.', ['Heart line and Girdle of Venus', 'Relationship lines', 'Mount of Venus', 'Case studies'], ['Give sensitive, responsible relationship readings'], { image: '/assets/courses/course_relationship_palmistry.jpg' }),
    C('palmistry', 'practical-palm-reading-workshop', 'Practical Palm Reading Workshop', 'Hands-on reading practice with feedback from Guruji.', ['Live reading practice', 'Structuring a consultation', 'Feedback and correction'], ['Read with confidence in front of a client'], { mode: 'Offline workshop (online option on request)', image: '/assets/courses/course_practical_workshop.jpg' }),
    C('palmistry', 'professional-palmistry-practitioner-course', 'Professional Palmistry Practitioner Course', 'An in-depth programme for those who wish to practise palmistry professionally.', ['Complete palmistry syllabus', 'Ethics and responsible guidance', 'Consultation and report writing', 'Supervised practice readings'], ['Conduct full consultations', 'Write clear reading reports', 'Practise ethically'], { image: '/assets/courses/course_professional_practitioner.jpg' }),

    C('reiki', 'reiki-level-1', 'Reiki Level 1 — Beginner', 'Introduction to Reiki, the Reiki principles and self-practice.', ['History and principles of Reiki', 'Attunement (as per the lineage followed)', 'Hand positions for self-practice', 'Daily self-practice routine'], ['Practise Reiki on yourself daily', 'Understand the Reiki principles'], { featured: true, image: '/assets/courses/reiki_level_1_beginner.jpg' }),
    C('reiki', 'reiki-level-2', 'Reiki Level 2 — Practitioner', 'Practising Reiki for others and distance Reiki.', ['Level 2 symbols (as per the lineage)', 'Sessions for others', 'Distance Reiki', 'Practitioner ethics'], ['Give a Reiki session to others', 'Offer distance sessions'], { certificate: 'Certificate on completion (as per lineage)', image: '/assets/courses/reiki_level_2_practitioner.jpg' }),
    C('reiki', 'reiki-level-3', 'Reiki Level 3 — Advanced / Master Level', 'Advanced practice for experienced practitioners.', ['Advanced symbols and practice', 'Deepening personal practice', 'Integrating Reiki with meditation'], ['Deepen and refine your practice'], { image: '/assets/courses/reiki_level_3_master.jpg' }),
    C('reiki', 'reiki-master-teacher-training', 'Reiki Master Teacher Training', 'Training to teach and attune others — a future offering, only if appropriately qualified.', ['Offered only when the teacher holds the required qualification'], ['—'], { status: 'upcoming', image: '/assets/courses/reiki_master_teacher.jpg' }),

    C('future', 'introduction-to-vedic-astrology', 'Introduction to Vedic Astrology', 'The building blocks of Jyotisha: Grahas, Rashis, Bhavas and Nakshatras.', ['Grahas, Rashis and Bhavas', 'Reading a birth chart', 'Introduction to Dashas'], ['Read the basic layout of a chart'], { status: 'upcoming' }),
    C('future', 'basics-of-nakshatras', 'Basics of Nakshatras', 'The 27 Nakshatras, their deities, symbols and qualities.', ['The 27 Nakshatras', 'Padas and lords', 'Nakshatra in daily life'], ['Identify and describe each Nakshatra'], { status: 'upcoming' }),
    C('future', 'navagraha-understanding', 'Navagraha Understanding', 'The nine Grahas — their nature, significations and mantras.', ['Nature of each Graha', 'Significations', 'Traditional mantras'], ['Understand each planet’s role'], { status: 'upcoming' }),
    C('future', 'mantra-and-japa-fundamentals', 'Mantra & Japa Fundamentals', 'How to practise japa correctly — mantra, mala, count and Sankalpa.', ['What a mantra is', 'Using a mala', 'Sankalpa and discipline'], ['Keep a steady japa practice'], { status: 'upcoming' }),
    C('future', 'chakra-awareness-and-meditation', 'Chakra Awareness & Meditation', 'The seven chakras and meditation practices for awareness.', ['The seven chakras', 'Breath and awareness', 'Guided meditations'], ['Practise chakra awareness meditation'], { status: 'upcoming' }),
    C('future', 'sanatana-dharma-and-practical-living', 'Sanatana Dharma & Practical Living', 'Timeless principles of Sanatana Dharma applied to everyday life.', ['Dharma, Karma and daily life', 'Festivals and their meaning', 'Simple daily practices'], ['Apply traditional wisdom to modern life'], { status: 'upcoming' })
  ];

  // -------------------------------------------------------------------------
  // Resources (articles)
  // -------------------------------------------------------------------------
  const resourceCategories = [
    { id: 'palmistry', title: 'Palmistry Articles', image: '/assets/svc/palmistry.webp' },
    { id: 'astrology', title: 'Astrology Articles', image: '/assets/svc/astrology.svg' },
    { id: 'reiki-wellness', title: 'Reiki & Wellness', image: '/assets/svc/reiki.svg' },
    { id: 'mantras-spirituality', title: 'Mantras & Spirituality', image: '/assets/svc/japa.webp' },
    { id: 'puja-ritual', title: 'Puja & Ritual Knowledge', image: '/assets/svc/puja.webp' },
    { id: 'meditation', title: 'Meditation Guides', image: '/assets/svc/guidance.svg' },
    { id: 'sanatana-dharma', title: 'Sanatana Dharma', image: '/assets/svc/muhurta.webp' },
    { id: 'self-development', title: 'Spiritual Self-Development', image: '/assets/svc/guidance.svg' }
  ];
  const resourceTypes = ['Articles & Blogs', 'Palmistry Learning Guides', 'Astrology Guides', 'Graha & Mantra Reference', 'Spiritual Practices', 'Videos', 'Downloadable PDFs'];

  const A = (slug, category, type, title, excerpt, body, extra = {}) => Object.assign({
    slug, category, type, title, excerpt, body, date: '2026-11-01', author: 'Guruji Palmistry', featured: false, published: true, image: '', videoUrl: '', pdfUrl: ''
  }, extra);

  const articles = [
    A('which-hand-is-read-in-palmistry', 'palmistry', 'Palmistry Learning Guides', 'Which Hand Is Read in Palmistry?',
      'Left or right? Why a palmist looks at both hands, and what each one shows.',
      ['A common first question is whether the left or the right hand is read. In practice, a careful palmist studies both.',
       'The dominant hand — the one you write with — is usually taken to show how you are living and developing now. The non-dominant hand is taken to show inborn tendencies. Comparing the two shows how a person has grown into, or away from, their natural patterns.',
       'Traditional Indian practice sometimes reads the right hand for men and the left for women. Many modern practitioners, including Guruji, prefer to read both hands for everyone and then compare them.',
       'When you book a reading, please send clear photos of both palms, taken in good daylight, with the fingers slightly apart.'],
      { featured: true, date: '2026-11-12', image: '/assets/articles/article_which_hand_read.jpg' }),
    A('can-palm-lines-change', 'palmistry', 'Articles & Blogs', 'Can Palm Lines Change Over Time?',
      'Palm lines are not fixed. Here is what tends to change, and what it means for a reading.',
      ['Yes — the finer lines on the hand can change over months and years, and even the major lines can lengthen, fade or develop branches.',
       'This is one reason palmistry is best used as a description of tendencies rather than a fixed prediction. The hand reflects how a person is living; as habits and circumstances change, some lines change with them.',
       'Comparing photos of your hands taken a few years apart can be an interesting exercise. In a follow-up reading Guruji often looks at what has changed since the last consultation.'],
      { date: '2026-11-08', image: '/assets/articles/article_can_lines_change.jpg' }),
    A('the-four-major-lines', 'palmistry', 'Palmistry Learning Guides', 'The Four Major Lines of the Palm',
      'A beginner’s guide to the Life, Head, Heart and Fate lines — where they are and what they describe.',
      ['Life line — curves around the base of the thumb, enclosing the Mount of Venus. It is read for vitality and the general course of life; its length is not a measure of lifespan.',
       'Head line — begins between the thumb and index finger and runs across the palm. It is read for thinking style, concentration and decision-making.',
       'Heart line — runs below the fingers, from the edge of the palm under the little finger towards the index or middle finger. It is read for emotional nature and relationships.',
       'Fate line — runs vertically up the centre of the palm towards the middle finger. It is read for career, responsibility and the direction of life. Not everyone has a clear fate line.',
       'A good reading always considers these lines together with the shape of the hand, the fingers and the mounts.'],
      { featured: true, date: '2026-11-15', image: '/assets/articles/article_four_major_lines.jpg' }),
    A('what-is-mahadasha', 'astrology', 'Astrology Guides', 'What Are Mahadasha and Antardasha?',
      'The Vimshottari Dasha system explained simply — how Vedic astrology divides life into planetary periods.',
      ['Vedic astrology divides life into periods, each ruled by one of the nine Grahas. The most widely used system is the Vimshottari Dasha, a cycle of 120 years.',
       'A Mahadasha is a major period ruled by one planet — for example, Venus rules a 20-year Mahadasha and the Sun a 6-year one. Each Mahadasha is divided into Antardashas (sub-periods) of all nine planets.',
       'Which Mahadasha you are born into depends on the Nakshatra of the Moon at birth. That is why an accurate birth time matters.',
       'During a reading, the running Mahadasha and Antardasha help explain why certain themes become prominent at certain times of life.'],
      { featured: true, date: '2026-11-10', image: '/assets/articles/article_mahadasha_cycles.jpg' }),
    A('is-exact-birth-time-necessary', 'astrology', 'Astrology Guides', 'Is the Exact Birth Time Necessary?',
      'Why birth time matters for a Kundali, and what can be done when it is not known.',
      ['The Lagna (ascendant) changes roughly every two hours, and the Moon’s position and the Dasha balance also depend on the time of birth. An accurate time therefore makes a large difference to a Kundali.',
       'If you only know an approximate time, share the range — Guruji can work with it and will explain which conclusions are less certain.',
       'If the time is not known at all, Prashna (horary) astrology or palmistry can be used instead, or alongside the chart.'],
      { date: '2026-11-05', image: '/assets/articles/article_exact_birth_time.jpg' }),
    A('reiki-complementary-practice', 'reiki-wellness', 'Spiritual Practices', 'Reiki as a Complementary Wellness Practice',
      'What Reiki is, what a session is like, and why it complements — never replaces — medical care.',
      ['Reiki is a Japanese relaxation practice in which the practitioner places their hands lightly on, or just above, the body in a series of positions. Many people find it deeply relaxing.',
       'A session usually takes place lying down and fully clothed, in a quiet room. Distance sessions are also offered, in which you rest at home at an agreed time.',
       'Reiki is a complementary practice. It is not a medical treatment, does not diagnose any condition, and should never be used in place of advice or treatment from a qualified doctor. If you are unwell, please continue to follow your doctor’s advice.'],
      { featured: true, date: '2026-11-14', image: '/assets/articles/article_reiki_complementary.jpg' }),
    A('how-to-begin-japa', 'mantras-spirituality', 'Graha & Mantra Reference', 'How to Begin a Daily Japa Practice',
      'Choosing a mantra, using a mala and keeping a steady daily count.',
      ['Japa is the repetition of a mantra with attention. A simple daily practice is more valuable than an ambitious one that is soon abandoned.',
       'Choose a time and a place — early morning is traditional. Sit comfortably, take a moment to settle, and state your Sankalpa (intention) silently.',
       'A mala has 108 beads plus the guru bead (Meru). Move one bead per repetition and do not cross the Meru; turn the mala around to begin another round.',
       'Begin with one mala a day and stay with it. If you would like a mantra chosen for you, see our Mantra Guidance service, or browse the Mantras & Stotras library.'],
      { date: '2026-11-03', image: '/assets/articles/article_how_begin_japa.jpg' }),
    A('what-is-sankalpa', 'puja-ritual', 'Articles & Blogs', 'What Is Sankalpa?',
      'The formal statement of intention at the start of every puja and japa.',
      ['Sankalpa is the resolve made at the start of a ritual. It states who is performing it (name and gotram), where and when (by the Panchanga), and for what purpose.',
       'When a puja is performed on your behalf, the priest takes the Sankalpa in your name and gotram. This is why we ask for these details when you book.',
       'If you do not know your gotram, tell us — it is traditional to use the Kashyapa gotram in that case, and the priest will guide you.'],
      { date: '2026-11-02', image: '/assets/articles/article_what_is_sankalpa.jpg' }),
    A('a-simple-breath-meditation', 'meditation', 'Spiritual Practices', 'A Simple Ten-Minute Breath Meditation',
      'An easy daily meditation for beginners.',
      ['Sit comfortably with the spine upright. Close your eyes and let the breath be natural.',
       'Bring your attention to the breath at the nostrils. Notice the cool air coming in and the warm air going out.',
       'When the mind wanders — it will — gently bring it back to the breath, without judging yourself.',
       'Start with ten minutes a day. Consistency matters more than length.'],
      { date: '2026-10-28', image: '/assets/articles/article_breath_meditation.jpg' }),
    A('dharma-in-daily-life', 'sanatana-dharma', 'Articles & Blogs', 'Dharma in Daily Life',
      'What dharma means in practical, everyday terms.',
      ['Dharma is often translated as duty or righteousness, but it is better understood as acting in harmony with one’s nature, role and responsibilities.',
       'In daily life this can be as simple as doing one’s work honestly, caring for family and elders, and keeping a small daily practice of prayer or reflection.',
       'The Shastras describe dharma as something that sustains — a life lived in dharma supports both the individual and those around them.'],
      { date: '2026-10-25', image: '/assets/articles/article_dharma_daily_life.jpg' }),
    A('self-awareness-through-palmistry-and-astrology', 'self-development', 'Articles & Blogs', 'Self-Awareness Through Palmistry and Astrology',
      'Using a reading as a mirror for growth rather than a forecast to fear.',
      ['The most useful readings leave you with a clearer picture of your own tendencies — what comes naturally, and where you tend to struggle.',
       'Used this way, palmistry and astrology support self-awareness. They can suggest where to put effort, which periods suit which kinds of action, and which patterns are worth changing.',
       'At Guruji Palmistry our approach is guidance, not fear; awareness, not dependency.'],
      { date: '2026-10-20', image: '/assets/articles/article_self_awareness.jpg' })
  ];

  // -------------------------------------------------------------------------
  // FAQs (by topic)
  // -------------------------------------------------------------------------
  const faqCategories = [
    { id: 'palmistry', title: 'Palmistry FAQs', items: [
      ['What is palmistry?', 'Palmistry (Hasta Samudrika Shastra) is the traditional study of the hand — its shape, fingers, mounts, lines and marks — to understand temperament, strengths and the themes of different life periods.'],
      ['Can palm lines change over time?', 'Yes. The finer lines can change over months and years, and the major lines can lengthen, fade or branch. This is why we treat a reading as a description of tendencies, not a fixed fate.'],
      ['Which hand is read?', 'Both. The dominant hand shows how you are living now and the other hand shows inborn tendencies; comparing them is part of the reading.'],
      ['Does palmistry predict the future?', 'Palmistry describes tendencies and possibilities. It can indicate periods and themes, but your choices and efforts shape the outcome. We never make fear-based predictions.'],
      ['How long is a consultation?', 'A Detailed Palm Analysis consultation is about 30 minutes; the Astro-Palmistry Correlation is about 45 minutes.'],
      ['Can I get a reading online?', 'Yes. Upload clear photos of both palms after booking and the consultation takes place by phone or video call.']
    ]},
    { id: 'astrology', title: 'Astrology FAQs', items: [
      ['What information is required for horoscope analysis?', 'Your date of birth, the exact time of birth, and the place of birth (city, state, country).'],
      ['Is exact birth time necessary?', 'It matters a great deal, because the Lagna changes roughly every two hours. If you only know an approximate time, share the range; if it is unknown, Prashna astrology or palmistry can be used.'],
      ['What is Mahadasha and Antardasha?', 'They are the major and sub-periods of the Vimshottari Dasha system, each ruled by one of the nine Grahas. They help explain why certain themes become prominent at certain times.'],
      ['What is Prashna astrology?', 'Horary astrology — a chart cast for the moment a question is asked. It is useful for a specific question, or when birth details are not available.'],
      ['What are planetary remedies?', 'Traditional practices such as japa, puja, charity (daan) and disciplined conduct associated with a Graha. We suggest remedies only where they are genuinely indicated, and never as a condition of the reading.']
    ]},
    { id: 'japa-mantra', title: 'Japa & Mantra FAQs', items: [
      ['What is Sankalpa?', 'The formal statement of intention made at the start of a japa or puja — who it is for (name and gotram), when, and for what purpose.'],
      ['How do you select a planetary Japa?', 'From your birth chart — usually the Graha whose period is running or which is weak or afflicted. Guruji explains the reasoning.'],
      ['Can Japa be done for another person?', 'Yes. Japa can be performed with Sankalpa in another person’s name and gotram, for example for a family member.'],
      ['How many repetitions are prescribed?', 'It depends on the mantra and the purpose. Traditional counts are often multiples of 108; Guruji advises the count and number of days.']
    ]},
    { id: 'puja', title: 'Puja & Ritual FAQs', items: [
      ['Do I need to attend in person?', 'No. Pujas can be performed on your behalf with Sankalpa in your name. You are welcome to attend where the venue allows.'],
      ['Will I receive confirmation of completion?', 'Yes. You can see the status of your booking on the Track Status page, and we confirm when the puja has been performed.'],
      ['What if I don’t know my gotram?', 'Choose “I don’t know my gotram”. Traditionally the Kashyapa gotram is used in that case.'],
      ['Can prasadam be posted to me?', 'Yes — tick the prasadam option when booking and give your postal address.']
    ]},
    { id: 'reiki', title: 'Reiki FAQs', items: [
      ['What is Reiki?', 'A Japanese relaxation practice in which the practitioner places their hands lightly on, or just above, the body. Many people find it deeply relaxing.'],
      ['What happens during a Reiki session?', 'You lie down or sit, fully clothed, in a quiet space while the practitioner works through a series of hand positions. There is a short conversation before and after.'],
      ['Is Reiki a religion?', 'No. Reiki is not a religion and does not require any belief. People of all faiths practise it.'],
      ['Can Reiki be done remotely?', 'Yes — distance sessions take place at an agreed time while you rest at home.'],
      ['How long is a session?', 'An individual session is about 45–60 minutes; an extended session about 90 minutes.'],
      ['How many sessions might someone choose?', 'Some people have a single session; others prefer a package of 3 or 5 sessions. There is no obligation.'],
      ['Can Reiki replace medical treatment?', 'No. Reiki is a complementary wellness practice. It does not diagnose or treat any medical condition and must never replace advice or treatment from a qualified doctor.']
    ]},
    { id: 'courses', title: 'Courses FAQs', items: [
      ['Do I need prior knowledge?', 'Not for the introductory and foundation courses. Advanced modules assume you have completed the foundation course or have equivalent knowledge.'],
      ['Are courses online or offline?', 'Most courses are offered both online and offline; the course page shows the mode for each.'],
      ['Will study material be provided?', 'Yes, course notes are provided for each module.'],
      ['Will I receive a certificate?', 'A certificate of completion is given where the course page says so.'],
      ['How is practical training conducted?', 'Through supervised practice readings — on hand photos online, or in person at workshops.'],
      ['Is there a support system after the course?', 'Yes — students can bring questions to follow-up sessions.']
    ]},
    { id: 'booking', title: 'Booking & Payment FAQs', items: [
      ['How do I book?', 'Choose a service and press Book Now. Services with a listed price can be paid online; for others, send an enquiry and we will contact you to confirm details and price.'],
      ['Which payment methods are accepted?', 'Online payments are processed securely by Cashfree Payments — UPI, cards, net banking and wallets.'],
      ['Is my booking confirmed immediately?', 'A paid booking is confirmed once the payment gateway confirms the payment. An enquiry is confirmed only after we contact you.'],
      ['How do I check my booking status?', 'Use Track Status in the header with your booking reference and mobile number.'],
      ['Can I cancel or reschedule?', 'Please see our Cancellation & Refund Policy, and contact us as early as possible.']
    ]}
  ];

  // -------------------------------------------------------------------------
  // Testimonials (only real ones should be published — add them in Admin)
  // -------------------------------------------------------------------------
  const testimonials = [];

  // -------------------------------------------------------------------------
  // Policies (please have these reviewed before relying on them)
  // -------------------------------------------------------------------------
  const policies = {
    'privacy-policy': { title: 'Privacy Policy', updated: '2026-11-21', sections: [
      ['Information we collect', 'When you book or enquire we collect your name, mobile number, email address, and the details needed for the service — for example birth details, gotram, palm photos and, if you ask for prasadam, your postal address.'],
      ['How we use it', 'Only to provide the service you asked for, to contact you about it, and to keep records of bookings and payments. We do not sell your information.'],
      ['Payments', 'Online payments are processed by Cashfree Payments. We do not see or store your card or bank details.'],
      ['Storage and security', 'Booking information is stored in a secure database. Access is limited to people who need it to provide your service.'],
      ['Your choices', 'You may ask us to correct or delete your information by writing to us at the email address below.'],
      ['Contact', 'Questions about privacy: support@gurujipalmistry.org']
    ]},
    terms: { title: 'Terms & Conditions', updated: '2026-11-21', sections: [
      ['Nature of services', 'Palmistry, astrology, Reiki and spiritual guidance are offered for self-understanding and spiritual practice. They are not a substitute for professional medical, legal, financial or psychological advice.'],
      ['Reiki', 'Reiki is a complementary wellness practice. It does not diagnose or treat any medical condition. Always follow the advice of a qualified doctor.'],
      ['Bookings', 'A booking is confirmed only after successful payment, or — for enquiries — after we confirm it with you.'],
      ['Information you give', 'Readings depend on the accuracy of the details and photos you provide.'],
      ['Conduct', 'We reserve the right to decline or end a consultation that becomes abusive.'],
      ['Changes', 'We may update these terms; the version on this page applies.']
    ]},
    'cancellation-refund-policy': { title: 'Cancellation & Refund Policy', updated: '2026-11-21', sections: [
      ['Consultations', 'You may reschedule a consultation once, free of charge, by contacting us at least 24 hours before the agreed time. If you cancel before the consultation has started and before any work on your reading, you are eligible for a refund.'],
      ['Pujas and japa', 'Pujas and japa can be cancelled for a refund up to 48 hours before the scheduled date. After the Sankalpa has been taken or the ritual performed, it cannot be refunded.'],
      ['Courses', 'Course fees are refundable before the course begins. After the course has started, please contact us.'],
      ['Failed or duplicate payments', 'If money was deducted but the booking was not confirmed, or you were charged twice, the amount is refunded to the original payment method.'],
      ['How refunds are paid', 'Approved refunds are made to the original payment method through Cashfree Payments, usually within 5–7 working days.'],
      ['Contact', 'To cancel or ask about a refund: support@gurujipalmistry.org, with your booking reference.']
    ]}
  };

  const GURUJI_CONTENT = {
    version: 1,
    settings, pillars, about, serviceCategories, services, courseTracks, courses,
    resourceCategories, resourceTypes, articles, faqCategories, testimonials, policies
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = GURUJI_CONTENT;
  else root.GURUJI_CONTENT = GURUJI_CONTENT;
})(typeof window !== 'undefined' ? window : globalThis);
