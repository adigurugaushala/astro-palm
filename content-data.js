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
      title: 'Ancient Wisdom. Personal Guidance. Inner Clarity.',
      subtitle: "Discover the wisdom of Palmistry, Vedic Astrology and Reiki through personal consultations, spiritual practices and traditional knowledge. Guidance to understand yourself better, navigate life's challenges and move forward with greater clarity."
    }
  };

  // -------------------------------------------------------------------------
  // The four pillars
  // -------------------------------------------------------------------------
  const pillars = [
    { id: 'guidance', title: 'Guidance', text: 'Palmistry & Vedic Astrology consultations for career, life & relationships.', icon: 'fa-hand', link: '/services' },
    { id: 'healing', title: 'Healing', text: 'In-person & remote Reiki healing for deep rest, vitality & inner balance.', icon: 'fa-spa', link: '/reiki-healing' },
    { id: 'conscious-living', title: 'Conscious Living', text: 'Spiritual growth, sacred Japa mantras, Graha Shanti & traditional Pujas.', icon: 'fa-om', link: '/services/category/puja-rituals' },
    { id: 'learning', title: 'Learning', text: 'Comprehensive Palmistry & spiritual courses under Guruji’s personal mentorship.', icon: 'fa-book-open', link: '/courses' }
  ];

  // -------------------------------------------------------------------------
  // About Guruji (all text editable in Admin → About)
  // -------------------------------------------------------------------------
  const about = {
    name: 'Adiguru Swamiji',
    alsoKnownAs: '',
    role: '',
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
      id: 'japa-mantra', title: 'Japa & Mantra', tagline: 'Traditional Japa and Mantra observances by experienced Purohits',
      image: '/assets/svc/japa.webp', icon: 'fa-om',
      intro: 'Guruji Palmistry facilitates traditional Japa and Mantra observances by engaging experienced Purohits/Brahmins to undertake the prescribed prayers and rituals on behalf of devotees.',
      purohitBanner: {
        eyebrow: 'Traditional Japa & Mantra Observances',
        title: 'Japa Performed by Experienced Purohits',
        paragraphs: [
          'Guruji Palmistry facilitates traditional Japa and Mantra observances by engaging experienced Purohits/Brahmins to undertake the prescribed prayers and rituals on behalf of devotees.',
          'The seeker is required to provide the relevant Gothra, names and Tithi details, along with the Sankalpa or purpose for which the Japa is intended. Based on these details, the appropriate Mantra and prescribed observance are arranged.',
          'The Japa is conducted with reverence to tradition, adherence to the prescribed count and a sincere devotional intention.'
        ],
        highlight: 'You provide the Sankalpa. We arrange the Japa. The Mantra becomes an offering.'
      },
      howItWorks: ['Send an enquiry with your intention and details.', 'Guruji suggests the mantra, count and number of days.', 'Sankalpa is taken in your name and gotram; japa is performed.', 'You receive confirmation on completion.'],
      requiredInfo: ['Full name', 'Gotram (if known)', 'Nakshatra / Rashi (if known)', 'Purpose of the japa']
    },
    {
      id: 'puja-rituals', title: 'Puja & Graha Shanti', tagline: 'Traditional worship, sacred rituals and Graha Shanti observances',
      image: '/assets/svc/puja.webp', icon: 'fa-fire',
      intro: 'Traditional worship, sacred rituals and Graha Shanti observances performed by experienced Purohits on your behalf, with Sankalpa in your name, guided by faith, tradition and devotion.',
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
    // --- Four core consultations (the fourth, Reiki Healing, is further down) --
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
        core: true, featured: true, consultationId: 'astrology_correlation', bookingType: 'consultation', price: 549, duration: '30 minutes', image: '/assets/services/astrology_annual.jpg',
        tagline: 'Your Chart. Your Journey. Your Understanding.',
        intro: 'A Kundali is more than a chart of planetary positions at the time of birth. It is a framework through which Vedic Astrology interprets an individual’s personality, tendencies, life themes, strengths, challenges and important periods in life.',
        description: 'At Guruji Palmistry, we go beyond isolated planetary interpretations. We examine the Kundali as a whole, bringing together the Lagna, Bhavas, planetary placements, combinations, Dashas and transits to understand how different aspects of life may connect and unfold. Our approach is to understand the individual behind the chart—not merely interpret individual planets or make isolated predictions.',
        deliverables: ['Full Kundali chart casting & evaluation', 'Comprehensive analysis across all life dimensions', 'Mahadasha, Antardasha & transit timeline assessment', 'Consultation call with Guruji', 'Summary of key life themes and guidance'],
        sections: [
          {
            id: 'why',
            eyebrow: 'Why a Comprehensive Kundali Analysis?',
            title: 'A Framework for Understanding Your Journey',
            paragraphs: [
              'A Kundali is more than a chart of planetary positions at the time of birth. It is a framework through which Vedic Astrology interprets an individual’s personality, tendencies, life themes, strengths, challenges and important periods in life.',
              'At Guruji Palmistry, we go beyond isolated planetary interpretations. We examine the Kundali as a whole, bringing together the Lagna, Bhavas, planetary placements, combinations, Dashas and transits to understand how different aspects of life may connect and unfold.',
              'Our approach is to understand the individual behind the chart—not merely interpret individual planets or make isolated predictions.'
            ]
          },
          {
            id: 'what',
            eyebrow: 'Detailed Analysis',
            title: 'What Do We Analyse?',
            stepsCols: 3,
            steps: [
              { num: '01', title: 'Lagna & Personality', text: 'Ascendant, Lagna Lord, personality, temperament, individuality, approach to life and inherent tendencies.' },
              { num: '02', title: 'Grahas & Influences', text: 'Planetary placements, strengths, weaknesses, interactions, aspects and influences within the Kundali.' },
              { num: '03', title: 'Bhavas, Rashis & Nakshatras', text: 'The twelve houses, zodiac signs, Nakshatras and their significance across different areas of life.' },
              { num: '04', title: 'Yogas & Combinations', text: 'Significant combinations, Yogas and planetary relationships that may influence the overall interpretation.' },
              { num: '05', title: 'Dasha & Life Periods', text: 'Mahadasha, Antardasha and relevant planetary periods to understand changing life themes and phases.' },
              { num: '06', title: 'Transits & Timing', text: 'Relevant planetary transits and their relationship to the natal chart and ongoing Dasha periods.' }
            ]
          },
          {
            id: 'holistic',
            eyebrow: 'Life Dimensions',
            title: 'A Holistic View of Your Life',
            paragraphs: [
              'Our analysis explores various dimensions of life, including Personality & Mind, Career & Profession, Business & Wealth, Marriage & Relationships, Family & Children, Property & Assets, Health & Well-being, Spirituality & Life Purpose, strengths, challenges, opportunities and significant life phases.'
            ],
            chipsTitle: 'Life Areas Examined Across the Chart',
            chips: ['Personality & Mind', 'Career & Profession', 'Business & Wealth', 'Marriage & Relationships', 'Family & Children', 'Property & Assets', 'Health & Well-being', 'Spirituality & Life Purpose', 'Strengths & Opportunities', 'Life Phases']
          },
          {
            id: 'how',
            eyebrow: 'Our Methodology',
            title: 'How Do We Conduct the Analysis?',
            stepsCols: 3,
            steps: [
              { num: '01', title: 'Casting & Establishing the Kundali', text: 'We begin with your date, exact time and place of birth to establish the birth chart and its foundational elements.' },
              { num: '02', title: 'Understanding the Chart as a Whole', text: 'We examine the Lagna, Bhavas, Grahas, Rashis, Nakshatras, planetary strengths and significant combinations to understand the overall chart dynamics.' },
              { num: '03', title: 'Life-Area Analysis', text: 'We interpret the chart across personality, career, wealth, relationships, family, property, health, spirituality and other relevant life aspects.' },
              { num: '04', title: 'Dasha & Timeline Assessment', text: 'We examine Mahadasha, Antardasha and relevant transits to understand the timing and progression of significant life themes and phases.' },
              { num: '05', title: 'Strengths, Challenges & Guidance', text: 'We identify supportive factors, challenging patterns, opportunities and areas for awareness, with practical perspectives and traditional guidance where appropriate.' },
              { num: '06', title: 'Comprehensive Summary', text: 'We bring the findings together into an overall assessment, highlighting key life themes, significant periods, strengths, challenges and the broader direction of the chart.' }
            ]
          },
          {
            id: 'conclusion',
            eyebrow: 'Perspective',
            title: 'Your Chart. Your Journey. Your Understanding.',
            paragraphs: [
              'Every Kundali is unique, and every life unfolds differently. Our aim is to study the chart in its entirety, understand the interrelationships between planetary influences and life themes, and provide a structured perspective that helps you reflect on your journey with greater awareness.'
            ],
            highlight: 'Not just predictions about your life, but an understanding of the patterns, possibilities and periods that shape your journey.'
          }
        ]
      }),
    S('astrology', 'astro-palmistry-correlation', 'Astro-Palmistry Correlation',
      'Two Ancient Sciences. One Integrated Perspective.',
      ['See where the chart and the hand agree', 'Understand where they add to each other', 'Notice where they differ — and why', 'A single, combined report'],
      {
        core: true, featured: true, consultationId: 'combined_consultation', bookingType: 'consultation', price: 10, duration: '45 minutes', image: '/assets/svc/astro-palmistry.webp',
        tagline: 'Two Ancient Sciences. One Integrated Perspective.',
        intro: 'Astrology reveals life patterns through planetary configuration at birth, while palmistry reveals them through the physical characteristics of the hand. This report examines where these indications align, complement, or differ.',
        description: 'Astro-Palmistry Correlation combines a Comprehensive Kundali Analysis with a Detailed Palm Analysis and then compares the two, area by area. Where both sciences point the same way, the indication is stronger; where they differ, Guruji explains how to read the difference.',
        sections: [
          {
            id: 'why',
            eyebrow: 'Section 1 — WHY',
            title: 'Why Correlate Astrology & Palmistry?',
            paragraphs: [
              'Astrology offers a perspective through planetary configurations at birth, while Palmistry offers insights through the characteristics, lines, mounts and markings of the hand.',
              'When studied independently, each provides its own interpretation. When examined together, they offer an opportunity to explore life patterns through two complementary disciplines.',
              'At Guruji Palmistry, correlation is about looking beyond a single perspective—identifying where both systems reinforce each other, where one adds context to the other, and where their indications differ.'
            ]
          },
          {
            id: 'what',
            eyebrow: 'Section 2 — WHAT',
            title: 'What Do We Analyse?',
            subtitle: 'Our integrated report brings together two comprehensive studies:',
            columns: [
              {
                title: 'Comprehensive Kundali Analysis',
                items: [
                  'Lagna, Grahas and planetary placements',
                  'Bhavas, Rashis and Nakshatras',
                  'Planetary strengths, Yogas and combinations',
                  'Mahadasha, Antardasha and transits',
                  'Major life themes and tendencies'
                ]
              },
              {
                title: 'Detailed Palm Analysis',
                items: [
                  'Shape and structure of the hand',
                  'Fingers and fingertips',
                  'Mounts',
                  'Major and minor lines',
                  'Special marks, signs and formations'
                ]
              }
            ],
            chipsTitle: 'Life aspects covered in the correlation',
            chips: [
              'Health & Vitality', 'Wealth', 'Education', 'Career', 'Business', 'Marriage', 'Relationships', 'Children', 'Siblings', 'Travel', 'Personality', 'Spiritual Inclination', 'Life Direction'
            ]
          },
          {
            id: 'how',
            eyebrow: 'Section 3 — HOW',
            title: 'How Do We Correlate?',
            stepsCols: 2,
            steps: [
              { num: '01', title: 'Independent Analysis', text: 'We first study the Kundali and the palm independently to understand the indications presented by each discipline.' },
              { num: '02', title: 'Area-by-Area Comparison', text: 'We compare both analyses across individual aspects of life, examining how planetary indications relate to palm features and markings.' },
              { num: '03', title: 'Convergence & Divergence', text: 'We identify where the two systems align, complement one another, or offer different perspectives, without forcing them to agree.' },
              { num: '04', title: 'Integrated Interpretation', text: 'The findings are synthesized into a unified report, bringing together both perspectives to offer a more comprehensive understanding of the individual’s life themes and tendencies.' }
            ]
          },
          {
            id: 'closing',
            eyebrow: 'Section 4 — Closing statement',
            title: 'Two Sciences. One Integrated Perspective.',
            paragraphs: [
              'Astrology reveals through the planetary map of birth. Palmistry reveals through the map of the hand. Our Astro-Palmistry Correlation brings both together to explore the patterns of life with greater depth, context and perspective.'
            ],
            highlight: 'Not two separate readings, but one integrated study.'
          }
        ],
        deliverables: ['Kundali analysis', 'Palm analysis', 'Correlation across thirteen areas of life', 'Consultation call with Guruji', 'Written combined report']
      }),

    // --- Palmistry ---------------------------------------------------------
    S('palmistry', 'basic-palm-reading', 'Basic Palm Reading', 'An introductory reading of the major lines and hand shape — a good first look at what your hands say.', ['Overview of the major lines', 'Hand shape and temperament', 'One or two questions answered'], { image: '/assets/services/palmistry_lines.jpg' }),
    S('palmistry', 'palmistry-career-guidance', 'Career Guidance through Palmistry', 'Focused reading of the Fate and Sun lines, the mounts and the fingers for direction in work and career.', ['Natural aptitudes and working style', 'Indications of career changes', 'Timing along the Fate line'], { image: '/assets/services/palmistry_career.jpg' }),
    S('palmistry', 'marriage-relationship-analysis', 'Marriage & Relationship Analysis', 'The Heart line, relationship lines and Mount of Venus read for emotional nature and partnership.', ['Emotional temperament', 'Relationship patterns', 'Indications around marriage'], { image: '/assets/services/palmistry_marriage.jpg' }),
    S('palmistry', 'business-guidance', 'Business Guidance', 'Reading of the hand for enterprise, risk-taking, financial sense and partnership suitability.', ['Entrepreneurial indicators', 'Financial temperament', 'Suitable fields and timing'], { image: '/assets/services/palmistry_business.jpg' }),
    S('palmistry', 'personality-analysis', 'Personality Analysis', 'Hand shape, fingers and thumb read for character, decision-making and natural strengths.', ['Core temperament', 'Strengths to build on', 'Patterns to be aware of'], { image: '/assets/services/palmistry_mounts.jpg' }),
    S('palmistry', 'major-minor-lines', 'Major & Minor Palm Lines', 'A dedicated reading of every major and minor line on both hands, and how they have changed.', ['Life, Head, Heart, Fate and Sun lines', 'Minor lines and their meaning', 'Comparison of left and right hands'], { image: '/assets/articles/article_four_major_lines.jpg' }),
    S('palmistry', 'mounts-finger-analysis', 'Mounts & Finger Analysis', 'The seven mounts and the length, shape and setting of the fingers and thumb.', ['Planetary mounts and their development', 'Finger proportions and phalanges', 'Thumb — will and logic'], { image: '/assets/courses/course_hand_shapes_fingers.jpg' }),
    S('palmistry', 'online-palmistry-consultation', 'Online Palmistry Consultation', 'A palm reading from anywhere — share clear photos of your hands and speak with Guruji on a call.', ['No travel required', 'Guidance on taking good palm photos', 'Call at a convenient time'], { image: '/assets/services/palmistry_online_consult.jpg' }),
    S('palmistry', 'life-guidance', 'Life Guidance Reading', 'A broader reading that looks at where you are now and the themes of the coming years.', ['Current life period', 'Areas needing attention', 'Practical suggestions'], { image: '/assets/services/palmistry_life_guidance.jpg' }),

    // --- Astrology ---------------------------------------------------------
    S('astrology', 'horoscope-analysis', 'Horoscope Analysis', 'A general reading of your birth chart and its main indications.', ['Overall chart strengths', 'Key life themes', 'Questions answered'], { image: '/assets/articles/article_exact_birth_time.jpg' }),
    S('astrology', 'dasha-analysis', 'Mahadasha & Antardasha Analysis', 'A focused look at your running and upcoming Dasha periods and what they emphasise.', ['Current Mahadasha and Antardasha', 'Upcoming period changes', 'How to use each period well'], { image: '/assets/services/astrology_mahadasha.jpg' }),
    S('astrology', 'marriage-compatibility', 'Marriage Compatibility', 'Chart matching for marriage — Guna Milan and a deeper comparison of the two charts.', ['Ashtakoota Guna Milan', 'Manglik and other considerations', 'Strengths and areas to work on'], { requiredInfo: ['Birth details (date, time, place) of both people'], image: '/assets/services/astrology_marriage.jpg' }),
    S('astrology', 'career-astrology', 'Career Astrology', 'The 10th Bhava, its lord and the Dasha periods read for career direction and timing.', ['Suitable fields', 'Periods of growth and change', 'Practical guidance'], { image: '/assets/services/astrology_career.jpg' }),
    S('astrology', 'business-astrology', 'Business Astrology', 'Astrological guidance for starting or expanding a business, partnerships and timing.', ['Business suitability', 'Partnership indications', 'Favourable periods'], { image: '/assets/services/astrology_business.jpg' }),
    S('astrology', 'prashna-astrology', 'Prashna Astrology', 'Hora astrology — a chart cast for the moment a question is asked, useful when birth time is unknown.', ['Answers to a specific question', 'Works without birth details', 'Quick, focused guidance'], { requiredInfo: ['Your question, clearly worded', 'Your current location'], image: '/assets/services/astrology_prashna.jpg' }),
    S('astrology', 'annual-horoscope', 'Annual Horoscope (Varshaphal)', 'A reading of the year ahead from your birthday chart and transits.', ['Themes for the year', 'Favourable and challenging months', 'Suggested focus'], { image: '/assets/articles/article_mahadasha_cycles.jpg' }),
    S('astrology', 'muhurta-consultation', 'Muhurta Consultation', 'Selection of an auspicious time for an important event, with explanation.', ['Suitable dates and times', 'Reasoning explained', 'Guidance on preparations'], { image: '/assets/temple_hero_gopuram.jpg' }),

    // --- Japa & Mantra -----------------------------------------------------
    S('japa-mantra', 'navagraha-japa', 'Navagraha Japa', 'Japa of the nine planetary mantras with Sankalpa in your name.', ['Covers all nine Grahas', 'Performed with Sankalpa', 'Completion confirmed'], { image: '/assets/pooja_thumb_navagraha.jpg' }),
    S('japa-mantra', 'individual-graha-japa', 'Individual Graha Japa', 'Japa of the mantra of a single Graha — for example Shani, Rahu or Guru — as indicated by your chart.', ['Focused on one planet', 'Count set by tradition', 'Suggested from your chart'], { image: '/assets/services/puja_graha_shanti.jpg' }),
    S('japa-mantra', 'personalized-mantra-japa', 'Personalised Mantra Japa', 'A mantra chosen for your intention and chart, with japa performed on your behalf.', ['Mantra chosen for you', 'Sankalpa in your name', 'Guidance for personal practice'], { image: '/assets/articles/article_how_begin_japa.jpg' }),
    S('japa-mantra', 'sankalpa-japa', 'Sankalpa Japa', 'Japa undertaken with a formal Sankalpa for a stated purpose over a set number of days.', ['Clear intention', 'Fixed count and duration', 'Completion confirmed'], { image: '/assets/articles/article_what_is_sankalpa.jpg' }),
    S('japa-mantra', 'rudra-mantra', 'Rudra Mantra Japa', 'Japa of Rudra mantras in devotion to Lord Shiva.', ['Traditional Rudra mantras', 'Performed with Sankalpa'], { image: '/assets/services/puja_rudrabhishekam.jpg' }),
    S('japa-mantra', 'gayatri-mantra', 'Gayatri Mantra Japa', 'Japa of the Gayatri mantra for clarity and spiritual discipline.', ['Traditional count', 'Performed with Sankalpa'], { image: '/assets/services/spiritual_mantra_guidance.jpg' }),
    S('japa-mantra', 'mahamrityunjaya-mantra', 'Mahamrityunjaya Mantra Japa', 'Japa of the Mahamrityunjaya mantra, traditionally chanted for protection and well-being.', ['Traditional count', 'Performed with Sankalpa'], { image: '/assets/shani_shanti_puja_card_1795167348933.jpg' }),
    S('japa-mantra', 'ganapati-mantra', 'Ganapati Mantra Japa', 'Japa of Ganapati mantras, traditionally offered before new beginnings.', ['For new beginnings', 'Performed with Sankalpa'], { image: '/assets/pooja_thumb_ganapathi.jpg' }),
    S('japa-mantra', 'lakshmi-mantra', 'Lakshmi Mantra Japa', 'Japa of Lakshmi mantras in devotion to the Goddess of prosperity.', ['Traditional mantras', 'Performed with Sankalpa'], { image: '/assets/pooja_hero_kalash.jpg' }),
    S('japa-mantra', 'saraswati-mantra', 'Saraswati Mantra Japa', 'Japa of Saraswati mantras, traditionally offered for learning and studies.', ['For students and learning', 'Performed with Sankalpa'], { image: '/assets/courses/palmistry_science_course.jpg' }),
    S('japa-mantra', 'hanuman-mantra', 'Hanuman Mantra Japa', 'Japa of Hanuman mantras for courage and steadiness.', ['Traditional mantras', 'Performed with Sankalpa'], { image: '/assets/navagraha_shanti_card_1795167350977.jpg' }),
    S('japa-mantra', 'deity-mantra-japa', 'Other Deity Mantra Japa', 'Japa of other traditional deity mantras on request.', ['Mantra of your Ishta Devata', 'Performed with Sankalpa'], { image: '/assets/temple_hero_gopuram.jpg' }),

    // --- Puja & Rituals ----------------------------------------------------
    S('puja-rituals', 'ganapathi-homam', 'Ganapathi Homam', 'Fire ritual to Lord Ganapathi to remove obstacles before new ventures.', ['Removal of obstacles', 'For new beginnings', 'Prasadam can be posted'], { bookingType: 'pooja', poojaId: 'ganapathi_homam', price: 3100, duration: '45–60 minutes', image: '/assets/ganapathi_homam_card_1795167334513.jpg', featured: true }),
    S('puja-rituals', 'navagraha-puja', 'Navagraha Shanti Puja', 'Puja to the nine Grahas to pacify challenging planetary periods.', ['All nine planets', 'Graha Shanti', 'Prasadam can be posted'], { bookingType: 'pooja', poojaId: 'navagraha_shanti', price: 5100, duration: '60 minutes', image: '/assets/navagraha_shanti_card_1795167350977.jpg', featured: true }),
    S('puja-rituals', 'shani-shanti', 'Shani Shanti Puja', 'Shani Shanti with Tailabhishekam, traditionally performed during Sade Sati or Shani Dasha.', ['For Shani periods', 'Tailabhishekam'], { bookingType: 'pooja', poojaId: 'shani_shanti', price: 2100, duration: '45 minutes', image: '/assets/shani_shanti_puja_card_1795167348933.jpg' }),
    S('puja-rituals', 'ayushya-homam', 'Ayushya Homam', 'Homam traditionally performed on birthdays for long life and well-being.', ['On birthdays', 'For the family'], { bookingType: 'pooja', poojaId: 'ayushya_homam', price: 3100, duration: '45–60 minutes', image: '/assets/pooja_thumb_ayushya.jpg' }),
    S('puja-rituals', 'santana-prapti', 'Santana Prapti Puja', 'Traditional puja to Bala Gopala offered by couples praying for children.', ['Devotion to Bala Gopala', 'For couples'], { bookingType: 'pooja', poojaId: 'santana_prapti', price: 4100, duration: '45–60 minutes', image: '/assets/santana_prapti_pooja_bal_gopal_1795167365329.jpg' }),
    S('puja-rituals', 'graha-shanti-puja', 'Graha Shanti Puja', 'Puja for a specific Graha indicated in your chart.', ['Focused on one planet', 'Suggested from your chart'], { image: '/assets/services/puja_graha_shanti.jpg' }),
    S('puja-rituals', 'rudrabhishekam', 'Rudrabhishekam', 'Abhishekam to Lord Shiva with the chanting of Sri Rudram.', ['Sri Rudram chanting', 'Abhishekam with traditional dravyas'], { image: '/assets/services/puja_rudrabhishekam.jpg' }),
    S('puja-rituals', 'homam', 'Homam (on request)', 'Other traditional homams arranged on request.', ['Chosen for your purpose', 'Performed by tradition'], { image: '/assets/services/puja_homam_sacred_fire.jpg' }),
    S('puja-rituals', 'special-sankalpa-puja', 'Special Sankalpa Puja', 'A puja performed with a special Sankalpa for a particular intention.', ['Your intention as Sankalpa', 'Deity chosen with guidance'], { image: '/assets/services/puja_special_sankalpa.jpg' }),
    S('puja-rituals', 'vratham-guidance', 'Vratham Guidance & Coordination', 'Guidance on observing a Vratham — the procedure, dates and what is needed.', ['Correct procedure', 'Dates from the Panchanga', 'Checklist of materials'], { image: '/assets/services/puja_vratham_kalasha.jpg' }),
    S('puja-rituals', 'festival-pujas', 'Traditional Festival Pujas', 'Pujas for festivals such as Ganesh Chaturthi, Navaratri, Deepavali and Shivaratri.', ['Festival-specific rituals', 'Performed on the right muhurta'], { image: '/assets/services/puja_festival_celebration.jpg' }),

    // --- Pitru ---------------------------------------------------------------
    S('pitru', 'pitru-runa-vimochana', 'Pitru Runa Vimochana Puja', 'Puja to honour ancestors and seek their blessings.', ['Honouring ancestors', 'Prasadam can be posted'], { bookingType: 'pooja', poojaId: 'pitru_runa_vimochana', price: 5100, duration: '60 minutes', image: '/assets/pitru_runa_vimochana_puja_1795167355033.jpg' }),
    S('pitru', 'amavasya-ritual-guidance', 'Amavasya Ritual Guidance', 'Guidance on the monthly Amavasya Tarpanam and offerings.', ['Procedure explained', 'Dates from the Panchanga'], { image: '/assets/services/pitru_amavasya_tarpana.jpg' }),
    S('pitru', 'pitru-japa', 'Pitru-related Japa', 'Japa performed for the peace of ancestors.', ['Performed with Sankalpa', 'Completion confirmed'], { image: '/assets/services/pitru_japa_shanti.jpg' }),
    S('pitru', 'mahalaya-paksha', 'Mahalaya Paksha Ritual Guidance', 'Guidance for the fortnight of the ancestors — tithis, Tarpanam and offerings.', ['Choosing the right tithi', 'Tarpanam guidance'], { image: '/assets/services/pitru_mahalaya_paksha.jpg' }),
    S('pitru', 'pitru-shanti', 'Traditional Pitru Shanti Services', 'Traditional rituals for Pitru Shanti, arranged after consultation.', ['Arranged after consultation', 'Performed by tradition'], { image: '/assets/services/pitru_shanti_seva.jpg' }),

    // --- Muhurta -------------------------------------------------------------
    S('muhurta', 'marriage-muhurta', 'Marriage Muhurta', 'An auspicious date and time for the wedding, from both charts and the Panchanga.', ['Suitable wedding dates', 'Lagna for the ceremony'], { image: '/assets/services/muhurta_marriage.jpg' }),
    S('muhurta', 'housewarming-muhurta', 'Housewarming (Gruhapravesham) Muhurta', 'An auspicious time to enter a new home.', ['Suitable dates', 'Guidance on the ritual'], { image: '/assets/services/muhurta_housewarming.jpg' }),
    S('muhurta', 'property-purchase-muhurta', 'Property Purchase Muhurta', 'Timing for registering or purchasing property.', ['Suitable dates and times'], { image: '/assets/services/muhurta_property_purchase.jpg' }),
    S('muhurta', 'vehicle-purchase-muhurta', 'Vehicle Purchase Muhurta', 'An auspicious time to buy or take delivery of a vehicle.', ['Suitable dates and times'], { image: '/assets/services/muhurta_vehicle_purchase.jpg' }),
    S('muhurta', 'business-opening-muhurta', 'Business Opening Muhurta', 'Timing for opening a shop, office or new venture.', ['Suitable dates and times', 'Considering the owner’s chart'], { image: '/assets/services/muhurta_business_opening.jpg' }),
    S('muhurta', 'naming-ceremony-muhurta', 'Naming Ceremony (Namakaranam) Muhurta', 'An auspicious time for the naming ceremony, and suggested starting syllables.', ['Suitable dates', 'Nakshatra syllables for the name'], { image: '/assets/services/muhurta_naming_ceremony.jpg' }),

    // --- Reiki -------------------------------------------------------------
    S('reiki', 'reiki-individual-session', 'Reiki Healing Session (In-Person at Adiguru Wellness Centre)', 'A one-to-one in-person Reiki session at Adiguru Wellness Centre for deep relaxation, vitality and inner balance.', ['Deep relaxation & stress relief', 'Calm and grounding', 'Time to rest the mind and body', 'Personalised in-person care at Adiguru Wellness Centre'], { core: true, duration: 'About 45–60 minutes', featured: true, image: '/assets/courses/reiki_level_1_beginner.jpg' }),
    S('reiki', 'distance-reiki-session', 'Distance Reiki Session (Online / Remote)', 'A gentle Reiki session offered remotely at an agreed time, while you rest comfortably in your own space.', ['Convenient remote session from anywhere', 'Rest in your personal sacred space', 'Subtle energy balancing and calm'], { duration: 'About 30–45 minutes', featured: true, image: '/assets/courses/reiki_level_2_practitioner.jpg' }),
    S('reiki', 'reiki-extended-session', 'Reiki Healing — Extended Session', 'A longer session that allows more time for relaxation and integration.', ['More time to settle', 'Includes guided breathing'], { duration: 'About 90 minutes', published: false }),
    S('reiki', 'stress-relaxation-session', 'Stress Relaxation Session', 'A session focused on relaxation for busy, stressful periods.', ['Pause and unwind', 'Simple breathing practices for home'], { published: false }),
    S('reiki', 'chakra-balancing-session', 'Chakra Awareness & Balancing Session', 'Reiki with attention to each of the seven chakras, and an introduction to chakra awareness.', ['Introduction to the seven chakras', 'Guided awareness practice'], { published: false }),
    S('reiki', 'reiki-meditation-session', 'Reiki Meditation Session', 'A guided meditation session using Reiki principles.', ['Guided meditation', 'Reiki principles for daily life'], { published: false }),
    S('reiki', 'reiki-package-3', 'Reiki Healing Package — 3 Sessions', 'Three sessions scheduled over a few weeks.', ['Regular rhythm of sessions', 'Space to notice change'], { published: false }),
    S('reiki', 'reiki-package-5', 'Reiki Healing Package — 5 Sessions', 'Five sessions for a longer period of regular practice.', ['Steady, regular support', 'Flexible scheduling'], { published: false }),
    S('reiki', 'reiki-follow-up-session', 'Reiki Follow-up Session', 'A follow-up session for those who have had Reiki with us before.', ['Continue your practice'], { published: false }),
    S('reiki', 'reiki-consultation', 'Reiki Consultation', 'A short conversation to understand Reiki and decide whether it is right for you.', ['Questions answered', 'No obligation'], { published: false }),

    // --- Spiritual guidance ------------------------------------------------
    S('spiritual-guidance', 'mantra-guidance', 'Mantra Guidance', 'Help choosing a mantra and building a daily japa practice.', ['A mantra suited to you', 'Correct pronunciation and method'], { image: '/assets/services/spiritual_mantra_guidance.jpg' }),
    S('spiritual-guidance', 'meditation-guidance', 'Meditation Guidance', 'Simple, steady meditation practice for daily life.', ['Practical technique', 'Building a routine'], { image: '/assets/services/spiritual_meditation_dhyana.jpg' }),
    S('spiritual-guidance', 'sadhana-guidance', 'Sadhana Guidance', 'Structuring a personal daily spiritual practice.', ['A plan that fits your day', 'Follow-up support'], { image: '/assets/services/spiritual_daily_sadhana.jpg' }),
    S('spiritual-guidance', 'chakra-practices', 'Chakra Awareness Practices', 'An introduction to the chakras and awareness practices for each.', ['Understanding the seven chakras', 'Daily awareness practices'], { image: '/assets/services/spiritual_chakra_practices.jpg' })
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
    C('palmistry', 'palmistry-science-of-palm-reading', 'PALMISTRY – THE SCIENCE OF PALM READING',
      'A comprehensive, foundational-to-advanced mastery course in Hasta Samudrika Shastra. Learn to read palm lines, mounts, hand shapes, signs and timing under the personal guidance of Guruji.',
      ['Foundations of Hasta Samudrika Shastra', 'Hand shapes, textures and elemental classifications', 'Mounts of the palm & planetary energy dynamics', 'The Major Lines: Life, Head, Heart, Fate & Sun in depth', 'Minor lines, rings, girdles and special markings', 'Timing of life events & age determination on lines', 'Correlation with Vedic Astrology & remedial indications', 'Practical consultation ethics, reading structure & case studies'],
      ['Read any palm systematically with confidence and accuracy', 'Understand character, aptitudes, career and life periods', 'Provide ethical, empowering guidance without fear-based predictions', 'Certificate of Completion upon practical evaluation'],
      {
        featured: true,
        status: 'enquire',
        mode: 'Online & offline',
        duration: '12 Weeks Structured Programme',
        price: null,
        image: '/assets/courses/palmistry_science_course.jpg',
        certificate: 'Certificate on Completion',
        instructor: 'Adiguru Swamiji'
      }
    ),
    C('palmistry', 'introduction-to-palmistry', 'Introduction to Palmistry', 'A friendly first course: what palmistry is, how to look at a hand, and the meaning of the main lines.', ['History and traditions of Hasta Samudrika Shastra', 'Which hand to read and why', 'Hand shapes at a glance', 'The four major lines', 'Taking good palm photos'], ['Read the major lines on a hand', 'Recognise the basic hand types', 'Know what palmistry can and cannot tell you'], { status: 'open', featured: false, image: '/assets/courses/course_intro_palmistry.jpg' }),
    C('palmistry', 'foundation-course-in-palmistry', 'Foundation Course in Palmistry', 'A structured foundation in the hand, fingers, mounts and lines.', ['Hand shapes and elements', 'Fingers, phalanges and thumb', 'The seven mounts', 'Major lines in depth', 'Introduction to minor lines', 'Practice readings'], ['Give a basic, structured reading', 'Combine shape, mounts and lines', 'Avoid common beginner mistakes'], { featured: false, published: false, image: '/assets/courses/course_foundation_palmistry.jpg' }),
    C('palmistry', 'advanced-palmistry', 'Advanced Palmistry', 'For students who have completed the foundation: timing, special marks and synthesis.', ['Timing events on the lines', 'Special marks and their meaning', 'Changes between left and right hands', 'Synthesis of a full reading'], ['Time indications on the major lines', 'Interpret special marks in context'], { published: false, image: '/assets/courses/course_advanced_palmistry.jpg' }),
    C('palmistry', 'mounts-of-the-palm', 'Mounts of the Palm', 'A focused module on the planetary mounts and their development.', ['Jupiter, Saturn, Sun, Mercury', 'Mars (upper and lower), Moon, Venus', 'Displaced and combined mounts'], ['Assess mount development', 'Relate mounts to temperament'], { published: false, image: '/assets/courses/course_mounts_palm.jpg' }),
    C('palmistry', 'major-and-minor-lines', 'Major & Minor Lines', 'Every line in detail, including the less common minor lines.', ['Life, Head, Heart, Fate, Sun lines', 'Mercury, marriage, travel and other minor lines', 'Breaks, islands, chains and branches'], ['Read each line confidently', 'Understand line quality and marks'], { published: false, image: '/assets/courses/course_major_minor_lines.jpg' }),
    C('palmistry', 'hand-shapes-and-finger-analysis', 'Hand Shapes & Finger Analysis', 'What the shape of the hand and the fingers reveal about character.', ['Elemental hand types', 'Finger length, setting and tips', 'The thumb — will and logic'], ['Classify a hand quickly', 'Read personality from shape'], { published: false, image: '/assets/courses/course_hand_shapes_fingers.jpg' }),
    C('palmistry', 'signs-symbols-and-markings', 'Signs, Symbols & Markings', 'Stars, crosses, triangles, squares, islands, grilles and other markings.', ['Catalogue of special signs', 'Where they appear and what changes', 'Reading signs in context'], ['Identify the common special marks', 'Interpret them without exaggeration'], { published: false, image: '/assets/courses/course_signs_symbols.jpg' }),
    C('palmistry', 'career-analysis-through-palmistry', 'Career Analysis through Palmistry', 'Applying palmistry to questions of work, aptitude and career change.', ['Fate and Sun lines for career', 'Mounts and fingers for aptitude', 'Case studies'], ['Give focused career readings'], { published: false, image: '/assets/courses/course_career_palmistry.jpg' }),
    C('palmistry', 'relationship-analysis-through-palmistry', 'Relationship Analysis through Palmistry', 'Applying palmistry to emotional nature and relationships.', ['Heart line and Girdle of Venus', 'Relationship lines', 'Mount of Venus', 'Case studies'], ['Give sensitive, responsible relationship readings'], { published: false, image: '/assets/courses/course_relationship_palmistry.jpg' }),
    C('palmistry', 'practical-palm-reading-workshop', 'Practical Palm Reading Workshop', 'Hands-on reading practice with feedback from Guruji.', ['Live reading practice', 'Structuring a consultation', 'Feedback and correction'], ['Read with confidence in front of a client'], { mode: 'Offline workshop (online option on request)', published: false, image: '/assets/courses/course_practical_workshop.jpg' }),
    C('palmistry', 'professional-palmistry-practitioner-course', 'Professional Palmistry Practitioner Course', 'An in-depth programme for those who wish to practise palmistry professionally.', ['Complete palmistry syllabus', 'Ethics and responsible guidance', 'Consultation and report writing', 'Supervised practice readings'], ['Conduct full consultations', 'Write clear reading reports', 'Practise ethically'], { published: false, image: '/assets/courses/course_professional_practitioner.jpg' }),

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
        'If the time is not known at all, Prashna (Hora) astrology or palmistry can be used instead, or alongside the chart.'],
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
    {
      id: 'palmistry', title: 'Palmistry FAQs', items: [
        ['What is palmistry?', 'Palmistry (Hasta Samudrika Shastra) is the traditional study of the hand — its shape, fingers, mounts, lines and marks — to understand temperament, strengths and the themes of different life periods.'],
        ['Can palm lines change over time?', 'Yes. The finer lines can change over months and years, and the major lines can lengthen, fade or branch. This is why we treat a reading as a description of tendencies, not a fixed fate.'],
        ['Which hand is read?', 'Both. The dominant hand shows how you are living now and the other hand shows inborn tendencies; comparing them is part of the reading.'],
        ['Does palmistry predict the future?', 'Palmistry describes tendencies and possibilities. It can indicate periods and themes, but your choices and efforts shape the outcome. We never make fear-based predictions.'],
        ['How long is a consultation?', 'A Detailed Palm Analysis consultation is about 30 minutes; the Astro-Palmistry Correlation is about 45 minutes.'],
        ['Can I get a reading online?', 'Yes. Upload clear photos of both palms after booking and the consultation takes place by phone or video call.']
      ]
    },
    {
      id: 'astrology', title: 'Astrology FAQs', items: [
        ['What information is required for horoscope analysis?', 'Your date of birth, the exact time of birth, and the place of birth (city, state, country).'],
        ['Is exact birth time necessary?', 'It matters a great deal, because the Lagna changes roughly every two hours. If you only know an approximate time, share the range; if it is unknown, Prashna astrology or palmistry can be used.'],
        ['What is Mahadasha and Antardasha?', 'They are the major and sub-periods of the Vimshottari Dasha system, each ruled by one of the nine Grahas. They help explain why certain themes become prominent at certain times.'],
        ['What is Prashna astrology?', 'Hora astrology — a chart cast for the moment a question is asked. It is useful for a specific question, or when birth details are not available.'],
        ['What are planetary remedies?', 'Traditional practices such as japa, puja, charity (daan) and disciplined conduct associated with a Graha. We suggest remedies only where they are genuinely indicated, and never as a condition of the reading.']
      ]
    },
    {
      id: 'japa-mantra', title: 'Japa & Mantra FAQs', items: [
        ['What is Sankalpa?', 'The formal statement of intention made at the start of a japa or puja — who it is for (name and gotram), when, and for what purpose.'],
        ['How do you select a planetary Japa?', 'From your birth chart — usually the Graha whose period is running or which is weak or afflicted. Guruji explains the reasoning.'],
        ['Can Japa be done for another person?', 'Yes. Japa can be performed with Sankalpa in another person’s name and gotram, for example for a family member.'],
        ['How many repetitions are prescribed?', 'It depends on the mantra and the purpose. Traditional counts are often multiples of 108; Guruji advises the count and number of days.']
      ]
    },
    {
      id: 'puja', title: 'Puja & Ritual FAQs', items: [
        ['Do I need to attend in person?', 'No. Pujas can be performed on your behalf with Sankalpa in your name. You are welcome to attend where the venue allows.'],
        ['Will I receive confirmation of completion?', 'Yes. You can see the status of your booking on the Track Status page, and we confirm when the puja has been performed.'],
        ['What if I don’t know my gotram?', 'Choose “I don’t know my gotram”. Traditionally the Kashyapa gotram is used in that case.'],
        ['Can prasadam be posted to me?', 'Yes — tick the prasadam option when booking and give your postal address.']
      ]
    },
    {
      id: 'reiki', title: 'Reiki FAQs', items: [
        ['What is Reiki?', 'A Japanese relaxation practice in which the practitioner places their hands lightly on, or just above, the body. Many people find it deeply relaxing.'],
        ['What happens during a Reiki session?', 'You lie down or sit, fully clothed, in a quiet space while the practitioner works through a series of hand positions. There is a short conversation before and after.'],
        ['Is Reiki a religion?', 'No. Reiki is not a religion and does not require any belief. People of all faiths practise it.'],
        ['Can Reiki be done remotely?', 'Yes — distance sessions take place at an agreed time while you rest at home.'],
        ['How long is a session?', 'An individual session is about 45–60 minutes; an extended session about 90 minutes.'],
        ['How many sessions might someone choose?', 'Some people have a single session; others prefer a package of 3 or 5 sessions. There is no obligation.'],
        ['Can Reiki replace medical treatment?', 'No. Reiki is a complementary wellness practice. It does not diagnose or treat any medical condition and must never replace advice or treatment from a qualified doctor.']
      ]
    },
    {
      id: 'courses', title: 'Courses FAQs', items: [
        ['Do I need prior knowledge?', 'Not for the introductory and foundation courses. Advanced modules assume you have completed the foundation course or have equivalent knowledge.'],
        ['Are courses online or offline?', 'Most courses are offered both online and offline; the course page shows the mode for each.'],
        ['Will study material be provided?', 'Yes, course notes are provided for each module.'],
        ['Will I receive a certificate?', 'A certificate of completion is given where the course page says so.'],
        ['How is practical training conducted?', 'Through supervised practice readings — on hand photos online, or in person at workshops.'],
        ['Is there a support system after the course?', 'Yes — students can bring questions to follow-up sessions.']
      ]
    },
    {
      id: 'booking', title: 'Booking & Payment FAQs', items: [
        ['How do I book?', 'Choose a service and press Book Now. Services with a listed price can be paid online; for others, send an enquiry and we will contact you to confirm details and price.'],
        ['Which payment methods are accepted?', 'Online payments are processed securely by Cashfree Payments — UPI, cards, net banking and wallets.'],
        ['Is my booking confirmed immediately?', 'A paid booking is confirmed once the payment gateway confirms the payment. An enquiry is confirmed only after we contact you.'],
        ['How do I check my booking status?', 'Use Track Status in the header with your booking reference and mobile number.'],
        ['Can I cancel or reschedule?', 'Please see our Cancellation & Refund Policy, and contact us as early as possible.']
      ]
    }
  ];

  // -------------------------------------------------------------------------
  // Testimonials (only real ones should be published — add them in Admin)
  // -------------------------------------------------------------------------
  const testimonials = [];

  // -------------------------------------------------------------------------
  // Policies (Legal Disclaimers, Terms, DPDP Act 2023 Privacy, Consents & Grievance)
  // -------------------------------------------------------------------------
  const POLICY_VERSIONS = {
    disclaimer: '1.0',
    terms: '1.0',
    privacy: '1.0',
    refund: '1.0',
    consentPolicy: '1.0',
    grievance: '1.0'
  };

  const policies = {
    disclaimer: {
      title: 'Disclaimer & Legal Notice',
      version: '1.0',
      updated: '2026-11-22',
      badge: 'Legally Binding & Regulatory Disclosure',
      sections: [
        [
          '1. Nature of Services',
          'Guruji Palmistry provides Palmistry (Hasta Samudrika Shastra), Vedic Astrology (Jyotishya Shastra), Kundali Analysis, Astro-Palmistry Correlation, Reiki Healing, Spiritual Guidance, Japa, Mantras, Poojas, Homams and related spiritual and Vedic services. All services, consultations, materials and communications are rooted in ancient Indian philosophical, scriptural, traditional and spiritual sciences.'
        ],
        [
          '2. Palmistry and Astrology Interpretations',
          'Interpretations provided through Palmistry, Kundali analysis and Astro-Palmistry are subjective, interpretive evaluations based on traditional Vedic systems, planetary configurations, line patterns, mounts and classical astrological texts. They represent prospective tendencies and spiritual indications rather than definitive, predetermined or unchangeable prophecies.'
        ],
        [
          '3. No Guaranteed Predictions or Outcomes',
          'No prediction, spiritual reading, ritual, pooja, japa, mantra, remedial measure or consultation guarantees any specific outcome, worldly result, financial gain, career promotion, marriage success, health recovery, child birth or resolution of disputes. Human free will, personal effort (Purushartha), past karmas (Prarabdha) and divine will (Daiva) govern individual life trajectories.'
        ],
        [
          '4. Personal Responsibility',
          'All decisions, actions, life choices, business commitments, relationship choices, financial investments and medical steps taken by the client before, during or following any consultation or reading remain exclusively and entirely the personal responsibility of the client. Guruji Palmistry and Adiguru Swamiji disclaim all responsibility for personal choices made by devotees.'
        ],
        [
          '5. No Substitute for Professional Advice',
          'None of the services, readings, reports, conversations or materials provided by Guruji Palmistry constitute medical, psychological, psychiatric, legal, financial, accounting or real estate advice. Seekers must always consult licensed, certified medical doctors for health conditions, licensed attorneys for legal matters, and accredited financial advisors for financial decisions.'
        ],
        [
          '6. Reiki and Spiritual Practices',
          'Reiki is a traditional, complementary energy balancing and relaxation modality. It does not diagnose, treat, prevent or cure physical illness, mental illness or medical diseases. It is not an alternative to standard medical care. Always follow the guidance and treatment plans prescribed by your licensed healthcare providers.'
        ],
        [
          '7. Poojas, Japas, Homams and Rituals',
          'All Poojas, Japas, Homams, Shanti rituals and Pitru sevas are conducted in accordance with traditional Vedic Shastras by ordained Vedic purohits with sacred sankalpa. They are acts of devotion, prayer and spiritual alignment. No supernatural, miraculous or guaranteed material outcomes are promised or implied.'
        ],
        [
          '8. Educational Content and Courses',
          'Courses, study modules, books, audio tracks, mantras and educational resources offered by Guruji Palmistry are designed solely for personal enrichment, spiritual learning and academic study of Hasta Samudrika and Vedic traditions. They do not constitute accredited professional qualifications or guarantees of employment, income or commercial practice.'
        ],
        [
          '9. Testimonials and Individual Experiences',
          'Testimonials, reviews, case examples, feedback and stories shared on Guruji Palmistry represent individual experiences of specific seekers and seekers. They do not represent typical or guaranteed outcomes for any other person.'
        ],
        [
          '10. Voluntary Participation',
          'All interactions, bookings, participation in rituals, sharing of birth details, palm photographs and attendance in consultations are undertaken voluntarily by the seeker of their own free will and volition, without any coercion, fear-mongering or duress.'
        ],
        [
          '11. Limitation of Liability',
          'To the fullest extent permitted by applicable Indian laws, Guruji Palmistry, Adiguru Swamiji, trustees, purohits, staff, associates and affiliates shall not be liable for any direct, indirect, incidental, exemplary, special or consequential damages arising from the use of, or inability to use, our services, website, predictions, rituals or educational content.'
        ],
        [
          '12. Updates to the Disclaimer',
          'Guruji Palmistry reserves the right to modify, amend or update this Disclaimer at any time. Updates become effective immediately upon posting to this website. Continued use of our website or services signifies your acceptance of the updated terms.'
        ],
        [
          '13. Contact Information & Grievance Redressal',
          'For inquiries, legal notices, clarifications or grievances regarding this Disclaimer or our services, please contact: Grievance Officer, Guruji Palmistry, Heritage Centre: 2-4-123/E/84/A, Swaroop Nagar, Srinivasa Colony, Uppal, Hyderabad, Telangana - 500039, India. Email: support@gurujipalmistry.org. WhatsApp: +91 89776 25078. Registered Establishment Reg No: SEA/MED/ALO/NR/1439866/2026.'
        ]
      ]
    },
    'privacy-policy': {
      title: 'Privacy Policy (DPDP Act 2023 Compliant)',
      version: '1.0',
      updated: '2026-11-22',
      badge: 'DPDP Act 2023 & IT Rules 2011 Compliance',
      sections: [
        [
          '1. Commitment to Privacy & Statutory Compliance',
          'Guruji Palmistry ("we", "us", "our") is deeply committed to protecting the privacy and personal data of our seekers, seekers and website visitors ("Data Principals"). This Privacy Policy complies with India\'s Digital Personal Data Protection Act, 2023 (DPDP Act 2023), the Information Technology Act, 2000, and the Information Technology (Reasonable Security Practices and Procedures and Sensitive Personal Data or Information) Rules, 2011.'
        ],
        [
          '2. Categories of Personal Data Collected',
          'When you interact with our platform, register an account, book a consultation, request a pooja seva or register interest in a course, we collect the following categories of data:\n• Identity & Contact Data: Full name, mobile number (+91 or international country code), and email address.\n• Astrological & Vedic Data: Date of birth, exact time of birth, place of birth (city/state/country), geographic coordinates (latitude and longitude computed solely for planetary chart calculation), Gotram, Nakshatram, and handedness.\n• Palm Photographs: Images of your palms uploaded voluntarily solely for Hasta Samudrika analysis.\n• Ritual / Sankalpa Data: Family members\' names, gotras, and specific prayer intentions for Poojas and Japas.\n• Delivery Address: Postal mailing address (only when physical sacred Prasadam delivery is requested).\n• Technical & Consent Audit Data: IP address, device user-agent, timestamp of consent, and document versions accepted.'
        ],
        [
          '3. Lawful Purpose of Data Processing',
          'Your personal data is processed strictly for legitimate spiritual and administrative purposes:\n• To compute astrological charts (Kundali), planetary dashas, and analyze palm images for your booked reading.\n• To perform sacred Sankalpa Poojas, Japas and Homams with ordained Vedic purohits.\n• To communicate appointment confirmations, room joining links, and deliver PDF consultation reports.\n• To maintain secure seeker portal accounts and booking history tracking.\n• To comply with applicable statutory laws, tax regulations and audit requirements in India.\nWe NEVER sell, trade, rent or monetize your personal data to any third-party advertisers or marketing brokers.'
        ],
        [
          '4. Payment Security & Financial Data',
          'All digital payments on Guruji Palmistry are processed directly through Cashfree Payments India Private Limited, a RBI-authorized, PCI-DSS Level 1 compliant payment aggregator. Guruji Palmistry never sees, collects, or stores your credit card numbers, debit card details, CVV codes, UPI PINs, or internet banking login credentials.'
        ],
        [
          '5. Data Principal Rights under DPDP Act 2023',
          'Under the Digital Personal Data Protection Act, 2023, you have the following enforceable rights:\n• Right to Access: You may request a summary of personal data being processed about you and the processing activities undertaken.\n• Right to Correction and Erasure: You may request correction of inaccurate data or complete erasure of your personal data when no longer necessary for service delivery.\n• Right of Grievance Redressal: You have the right to accessible grievance redressal regarding any data privacy concern.\n• Right to Nominate: You have the right to nominate an individual to exercise your rights in the event of death or incapacity.\nTo exercise any of these rights, write to our designated Grievance Officer at support@gurujipalmistry.org.'
        ],
        [
          '6. Data Storage, Retention & Security Safeguards',
          'Seeker information is stored in secure, encrypted cloud databases protected by role-based access control, firewall layers, and 256-bit SSL encryption in transit. Personal data is retained only for as long as necessary to fulfill the services requested or meet legal compliance periods, after which it is securely purged or anonymized.'
        ],
        [
          '7. Grievance Redressal Officer Contact Details',
          'In compliance with Section 11 of the DPDP Act 2023 and Rule 5(9) of the IT Rules 2011, the details of our Data Protection and Grievance Officer are:\nDesignation: Data Protection & Grievance Officer\nOrganisation: Guruji Palmistry (Adiguru Gaushala & Sri Sankara Vidyabharathi Gowsamrakshana Charitable Trust)\nAddress: 2-4-123/E/84/A, Swaroop Nagar, Srinivasa Colony, Uppal, Hyderabad, Telangana - 500039, India\nEmail: support@gurujipalmistry.org\nPhone / WhatsApp: +91 89776 25078\nHours: Monday to Saturday, 10:00 AM to 6:00 PM IST\nResolution Timeline: Acknowledgement within 24 hours, resolution within 15 calendar days.'
        ]
      ]
    },
    terms: {
      title: 'Terms & Conditions',
      version: '1.0',
      updated: '2026-11-22',
      badge: 'Service Agreement & Client Code of Conduct',
      sections: [
        [
          '1. Scope of Agreement & Acceptance',
          'These Terms & Conditions constitute a legally binding agreement between you ("Seeker" or "User") and Guruji Palmistry. By accessing our website, creating a seeker account, booking a consultation, ordering a pooja or enrolling in a course, you unconditionally agree to these Terms and our incorporated Disclaimer and Privacy Policy.'
        ],
        [
          '2. Eligibility & Age Verification',
          'You must be at least 18 years of age to book paid consultations, poojas or create an account. Bookings for minors (such as child horoscope or naming ceremony analysis) must be initiated and authorized by a parent or legal guardian.'
        ],
        [
          '3. Accuracy of Information Provided',
          'Astrological computations, palm analyses and pooja sankalpas depend strictly on the precision of data provided. You represent and warrant that the date of birth, time of birth, birth city, gotram and palm images you submit are accurate and authentic to the best of your knowledge.'
        ],
        [
          '4. Booking Slots & Slot Preservation',
          'Consultation slots selected on the website are held temporarily for a 10-minute reservation window while you complete registration or sign-in. Bookings are confirmed upon successful confirmation from Cashfree Payments. If payment is not completed within the reservation window, the slot is released to other seekers.'
        ],
        [
          '5. Client Conduct & Decorum',
          'Consultations with Adiguru Swamiji are sacred, spiritual interactions conducted in mutual respect. We maintain zero tolerance for abusive, threatening, obscene, profane, defamatory or disruptive language. Guruji Palmistry reserves the right to terminate any session immediately without refund if client conduct becomes disrespectful.'
        ],
        [
          '6. Intellectual Property & Study Materials',
          'All course content, palmistry diagrams, lesson modules, written analysis reports, mantras, audio recordings and articles provided by Guruji Palmistry are protected intellectual property. They are for your personal spiritual learning only and may not be reproduced, broadcast, sold, or distributed without prior written consent.'
        ],
        [
          '7. Governing Law & Exclusive Jurisdiction',
          'These Terms and any dispute arising out of or related to our services shall be governed exclusively by the laws of India. The competent civil courts situated at Hyderabad, Telangana, India shall have exclusive jurisdiction over all legal proceedings.'
        ]
      ]
    },
    'cancellation-refund-policy': {
      title: 'Cancellation & Refund Policy',
      version: '1.0',
      updated: '2026-11-22',
      badge: 'Fair, Transparent & Seeker-Centric Policy',
      sections: [
        [
          '1. Consultation Rescheduling & Cancellation',
          '• Rescheduling: You may reschedule your consultation appointment once, free of charge, by contacting us at least 24 hours prior to your scheduled time slot.\n• Cancellation: If you cancel your consultation at least 24 hours prior to the appointment and before preparation of your astrological chart/reading has commenced, you are eligible for a 100% refund of the consultation fee.'
        ],
        [
          '2. Poojas, Japas, Homams & Sevas',
          '• Sacred rituals and poojas can be cancelled with a full refund up to 48 hours prior to the scheduled ritual date, allowing us to notify the assigned Vedic purohits.\n• Once the sacred Vedic Sankalpa has been solemnized or the ritual has commenced, pooja bookings become non-refundable as sacred offerings and priest dakshinas are irreversibly committed.'
        ],
        [
          '3. Courses & Structured Study Programs',
          'Course registration fees are refundable upon written request before the batch commencement date or release of course materials. Once structured lessons or live batch classes have begun, fees are non-refundable.'
        ],
        [
          '4. Digital Reports & Horoscope Documents',
          'Comprehensive Kundali reports and written palmistry analysis documents prepared specifically for you are personalized intellectual work. Once a digital report has been generated and delivered to your portal or email, it is non-refundable.'
        ],
        [
          '5. Payment Gateway Failures & Duplicate Deductions',
          'If funds were debited from your bank account or UPI app but your booking did not confirm, or if a technical glitch caused duplicate debits, the payment aggregator (Cashfree) will automatically reconcile and refund the amount to your original payment source within 3–5 business days.'
        ],
        [
          '6. Refund Processing Timeline',
          'Approved refunds are initiated through Cashfree Payments to the original payment method (Bank Account / UPI / Card / Wallet). The refunded amount typically reflects in your statement within 5 to 7 working days, subject to your bank\'s processing schedule.'
        ],
        [
          '7. Contact for Cancellations & Refund Requests',
          'To request a cancellation, reschedule or refund, email support@gurujipalmistry.org with your Booking Reference (e.g., GURUJI-PLM-XXXXX) and registered mobile number, or message our temple desk on WhatsApp at +91 89776 25078.'
        ]
      ]
    },
    'consent-policy': {
      title: 'Customer Consent & Acknowledgement Policy',
      version: '1.0',
      updated: '2026-11-22',
      badge: 'Informed Consent, Digital Audit & Seeker Rights',
      sections: [
        [
          '1. Principle of Mandatory Informed Consent',
          'At Guruji Palmistry, customer consent is fundamental to ethical spiritual practice. Before any seeker account is created, consultation booked, or payment processed, clients are presented with a clear, mandatory legal consent checkbox that must be affirmatively checked by the user. Pre-ticked boxes are strictly prohibited.'
        ],
        [
          '2. Exact Consent Statement',
          'Every registering seeker actively agrees to the following statutory statement:\n"I understand and agree that Guruji Palmistry provides Palmistry, Astrology, Kundali Analysis, Astro-Palmistry, Reiki, Spiritual Guidance, Poojas, Rituals and related services based on traditional, spiritual and interpretive practices. I understand that these services do not guarantee any particular prediction, result or outcome and are not substitutes for medical, psychological, financial, legal or other professional advice. I acknowledge that my decisions and actions remain my responsibility. I have read and agree to the Disclaimer, Terms & Conditions and Privacy Policy."'
        ],
        [
          '3. Service-Specific Acknowledgements',
          'In addition to general registration consent, seekers acknowledge the specific nature of individual modalities:\n• Palmistry & Astrology: Interpretive Vedic readings with no guaranteed future predictions.\n• Reiki Healing: Complementary relaxation modality that does not diagnose or replace medical healthcare.\n• Poojas & Homams: Sacred spiritual rituals performed with Vedic sankalpa without material outcome guarantees.\n• Courses: Educational spiritual learning with no commercial employment promises.'
        ],
        [
          '4. Digital Consent Audit Trail',
          'To ensure full legal compliance with the Information Technology Act 2000 and the DPDP Act 2023, Guruji Palmistry maintains an immutable digital consent audit record for every registered user. This record captures:\n• Unique Consent ID and Customer Reference\n• Full Name, Registered Mobile and Verified Email\n• Affirmative consent status for Disclaimer, Terms and Privacy Policy\n• Service-specific acknowledgements granted\n• Exact policy document versions accepted (e.g. v1.0)\n• Client IP address and browser User-Agent header\n• Precise server timestamp in UTC/IST'
        ],
        [
          '5. Right to Withdraw Consent',
          'Data Principals retain the right to withdraw their consent at any time by writing to support@gurujipalmistry.org. Withdrawal of consent does not affect the lawfulness of processing based on consent before its withdrawal. Upon withdrawal, account access is closed and data is handled in accordance with our deletion policy.'
        ]
      ]
    },
    grievance: {
      title: 'Grievance Redressal Policy & Procedure',
      version: '1.0',
      updated: '2026-11-22',
      badge: 'Time-Bound Grievance Mechanism & Escalation Matrix',
      sections: [
        [
          '1. Objective & Redressal Commitment',
          'Guruji Palmistry is dedicated to maintaining the highest ethical standards in spiritual consultation, pooja services and seeker communication. We believe every seeker deserves attentive, empathetic and transparent resolution of any grievances regarding appointments, payments, reports or data privacy.'
        ],
        [
          '2. Designated Grievance Officer',
          'In accordance with the Digital Personal Data Protection Act, 2023 and the Information Technology (Intermediary Guidelines and Digital Media Ethics Code) Rules, 2021, our designated Grievance Redressal Officer is:\n• Officer: Grievance Officer, Guruji Palmistry\n• Registered Entity: Guruji Palmistry (Adiguru Gaushala / Sri Sankara Vidyabharathi Gowsamrakshana Charitable Trust)\n• Physical Address: 2-4-123/E/84/A, Swaroop Nagar, Srinivasa Colony, Uppal, Hyderabad, Telangana - 500039, India\n• Official Email: support@gurujipalmistry.org\n• Official WhatsApp / Helpline: +91 89776 25078\n• Working Hours: Monday through Saturday, 10:00 AM – 6:00 PM IST (excluding national holidays)'
        ],
        [
          '3. How to Submit a Grievance',
          'You may submit your grievance via email to support@gurujipalmistry.org with the subject line "Grievance - [Your Booking ID or Registered Mobile]". Please provide:\n1. Your Full Name and Registered Email/Phone\n2. Order ID / Booking Reference (if applicable)\n3. Clear, chronological description of your concern\n4. Supporting documents, payment receipts or screenshots'
        ],
        [
          '4. Time-Bound Resolution SLA (Service Level Agreement)',
          '• Acknowledgment: We will formally acknowledge receipt of your grievance within 24 hours of submission and provide a unique ticket reference.\n• Investigation & Review: Our management team and Grievance Officer will investigate the facts and review consultation logs or payment gateway reports.\n• Resolution: We commit to providing a comprehensive written resolution or corrective action within 15 calendar days from the date of receipt, in accordance with DPDP Act mandates.'
        ]
      ]
    }
  };

  const GURUJI_CONTENT = {
    version: 1,
    settings, pillars, about, serviceCategories, services, courseTracks, courses,
    resourceCategories, resourceTypes, articles, faqCategories, testimonials, policies,
    policyVersions: POLICY_VERSIONS
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = GURUJI_CONTENT;
  else root.GURUJI_CONTENT = GURUJI_CONTENT;
})(typeof window !== 'undefined' ? window : globalThis);
