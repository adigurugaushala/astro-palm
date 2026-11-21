/* Guruji Palmistry — Telugu and Hindi for the interface.
 *
 * How this works: every string below is keyed by its exact English text. After
 * each render the page is walked and any text node, placeholder, aria-label or
 * title whose trimmed text matches a key is swapped for the chosen language.
 * Nothing is guessed — a string with no entry stays in English, so devotees
 * never see half-machine-translated sentences.
 *
 * Long-form writing (articles, course lessons, Guruji's readings) stays in
 * English for now; the banner under the switcher says so in the chosen
 * language.
 */
(function () {
  'use strict';

  const DICT = {
    te: {
      // Header and navigation
      'Home': 'హోమ్',
      'About Guruji': 'గురుజీ గురించి',
      'Services': 'సేవలు',
      'Reiki Healing': 'రేకి హీలింగ్',
      'Courses': 'కోర్సులు',
      'Resources': 'వనరులు',
      'FAQs': 'తరచూ అడిగే ప్రశ్నలు',
      'Contact': 'సంప్రదించండి',
      'Book': 'బుక్ చేయండి',
      'Book Now': 'ఇప్పుడే బుక్ చేయండి',
      'Track Status': 'స్థితిని చూడండి',
      'Track status': 'స్థితిని చూడండి',
      'Search the site': 'సైట్‌లో వెతకండి',
      'Search': 'వెతకండి',
      'Help': 'సహాయం',
      'Astro-Palmistry': 'జ్యోతిష్య-హస్తసాముద్రికం',
      'Palm Analysis': 'హస్త విశ్లేషణ',
      'Kundali Analysis': 'కుండలి విశ్లేషణ',
      'Puja & Seva': 'పూజ & సేవ',
      'Japa & Mantra': 'జపం & మంత్రం',
      'Muhurta': 'ముహూర్తం',
      'Mantras & Stotras': 'మంత్రాలు & స్తోత్రాలు',
      'Palmistry Guide': 'హస్తసాముద్రిక మార్గదర్శి',
      'All services': 'అన్ని సేవలు',
      'Healing & Learning': 'హీలింగ్ & అభ్యాసం',
      'Detailed Palm Analysis': 'వివరమైన హస్త విశ్లేషణ',
      'Puja & Graha Shanti': 'పూజ & గ్రహ శాంతి',
      'Astro-Palmistry Correlation': 'జ్యోతిష్య-హస్తసాముద్రిక సమన్వయం',
      // Footer and policies
      'Privacy Policy': 'గోప్యతా విధానం',
      'Terms & Conditions': 'నిబంధనలు & షరతులు',
      'Cancellation & Refund': 'రద్దు & వాపసు',
      'Send an enquiry': 'విచారణ పంపండి',
      'Payments by Cashfree': 'చెల్లింపులు Cashfree ద్వారా',
      // Common actions
      'Continue': 'కొనసాగించండి',
      'Cancel': 'రద్దు చేయండి',
      'Send': 'పంపండి',
      'Save': 'భద్రపరచండి',
      'Close': 'మూసివేయండి',
      'Back': 'వెనుకకు',
      'Next': 'తరువాత',
      'Read more': 'మరింత చదవండి',
      'Learn more': 'మరింత తెలుసుకోండి',
      'View all': 'అన్నీ చూడండి',
      'Enrol now': 'ఇప్పుడే చేరండి',
      'Enrol': 'చేరండి',
      'Register interest': 'ఆసక్తిని నమోదు చేయండి',
      'Notify me when it opens': 'ప్రారంభమైనప్పుడు తెలియజేయండి',
      'Book again': 'మళ్ళీ బుక్ చేయండి',
      'All courses': 'అన్ని కోర్సులు',
      'Contact us': 'మమ్మల్ని సంప్రదించండి',
      'My booking': 'నా బుకింగ్',
      // Forms
      'Your name': 'మీ పేరు',
      'Full Name': 'పూర్తి పేరు',
      'Mobile Number': 'మొబైల్ నంబర్',
      'Email': 'ఇమెయిల్',
      '10-digit mobile': '10 అంకెల మొబైల్',
      'Mobile number': 'మొబైల్ నంబర్',
      'Booking or enquiry reference': 'బుకింగ్ లేదా విచారణ రిఫరెన్స్',
      'Date of Birth': 'పుట్టిన తేదీ',
      'Time of Birth': 'పుట్టిన సమయం',
      'Place of Birth': 'పుట్టిన ప్రదేశం',
      'Gotram': 'గోత్రం',
      'Message': 'సందేశం',
      // Tracking and status
      'Track Your Booking or Enquiry': 'మీ బుకింగ్ లేదా విచారణ స్థితి',
      'Consultation': 'సంప్రదింపు',
      'Pooja Seva': 'పూజా సేవ',
      'Course': 'కోర్సు',
      'Devotee': 'భక్తులు',
      'Amount': 'మొత్తం',
      'Service': 'సేవ',
      'Lessons': 'పాఠాలు',
      'Consultation slot': 'సంప్రదింపు సమయం',
      'Pooja date & slot': 'పూజ తేదీ & సమయం',
      'Booked': 'బుక్ అయింది',
      'Payment confirmed': 'చెల్లింపు నిర్ధారించబడింది',
      'Details received': 'వివరాలు అందాయి',
      'Reading completed': 'పఠనం పూర్తయింది',
      'Enrolled': 'చేరారు',
      'Lessons open': 'పాఠాలు తెరిచి ఉన్నాయి',
      'In progress': 'జరుగుతోంది',
      'Course complete': 'కోర్సు పూర్తయింది',
      'Completed': 'పూర్తయింది',
      'Cancelled': 'రద్దు చేయబడింది',
      'Scheduled': 'షెడ్యూల్ చేయబడింది',
      'Upload palm photos': 'అరచేతి ఫోటోలు అప్‌లోడ్ చేయండి',
      'Open your lessons': 'మీ పాఠాలను తెరవండి',
      // Session and chat
      'Consultation room': 'సంప్రదింపు గది',
      'Your consultation room': 'మీ సంప్రదింపు గది',
      'Your consultation': 'మీ సంప్రదింపు',
      'Join session': 'సెషన్‌లో చేరండి',
      'Join with video': 'వీడియోతో చేరండి',
      'Audio only': 'ఆడియో మాత్రమే',
      'Before you join': 'చేరే ముందు',
      'Back to my booking': 'నా బుకింగ్‌కు తిరిగి',
      'Rejoin': 'మళ్ళీ చేరండి',
      'Check again': 'మళ్ళీ చూడండి',
      'Chat with Guruji': 'గురుజీతో చాట్',
      'Write to Guruji…': 'గురుజీకి రాయండి…',
      'Who is joining?': 'ఎవరు చేరుతున్నారు?',
      'Who is learning?': 'ఎవరు నేర్చుకుంటున్నారు?',
      'The room is open now.': 'గది ఇప్పుడు తెరిచి ఉంది.',
      'Your room is not open yet': 'మీ గది ఇంకా తెరవలేదు',
      'This session has ended': 'ఈ సెషన్ ముగిసింది',
      'You have left the session': 'మీరు సెషన్ నుండి బయటకు వచ్చారు',
      'See your Kundali': 'మీ కుండలిని చూడండి',
      'Download your reading': 'మీ పఠనాన్ని డౌన్‌లోడ్ చేయండి',
      // Courses
      'Your course': 'మీ కోర్సు',
      'Start today — self-paced': 'ఈ రోజే ప్రారంభించండి — మీ వేగంతో',
      'Remember': 'గుర్తుంచుకోండి',
      'Practice': 'సాధన',
      'Mark complete': 'పూర్తయినట్లు గుర్తించండి',
      'Mark as not done': 'పూర్తి కాలేదని గుర్తించండి',
      'Next lesson': 'తదుపరి పాఠం',
      'Previous': 'మునుపటి',
      'Curriculum': 'పాఠ్యాంశాలు',
      'Learning outcomes': 'నేర్చుకునే ఫలితాలు',
      'Duration': 'వ్యవధి',
      'Mode': 'విధానం',
      'Instructor': 'బోధకులు',
      'Certificate': 'ధృవపత్రం',
      // Kundali
      'Kundali': 'కుండలి',
      'North Indian': 'ఉత్తర భారత',
      'South Indian': 'దక్షిణ భారత',
      'Graha': 'గ్రహం',
      'Rashi': 'రాశి',
      'Degree': 'డిగ్రీ',
      'Nakshatra': 'నక్షత్రం',
      'Pada': 'పాదం',
      'Bhava': 'భావం',
      'Lord': 'అధిపతి',
      'From': 'నుండి',
      'To': 'వరకు',
      'now': 'ప్రస్తుతం',
      // Notices
      'Guidance · Healing · Devotion · Learning': 'మార్గదర్శనం · హీలింగ్ · భక్తి · అభ్యాసం',
      'Articles, course lessons and Guruji’s written readings stay in English for now.':
        'వ్యాసాలు, కోర్సు పాఠాలు మరియు గురుజీ రాసే పఠనాలు ప్రస్తుతానికి ఆంగ్లంలోనే ఉంటాయి.'
    },

    hi: {
      'Home': 'होम',
      'About Guruji': 'गुरुजी के बारे में',
      'Services': 'सेवाएँ',
      'Reiki Healing': 'रेकी हीलिंग',
      'Courses': 'पाठ्यक्रम',
      'Resources': 'संसाधन',
      'FAQs': 'अक्सर पूछे जाने वाले प्रश्न',
      'Contact': 'संपर्क',
      'Book': 'बुक करें',
      'Book Now': 'अभी बुक करें',
      'Track Status': 'स्थिति देखें',
      'Track status': 'स्थिति देखें',
      'Search the site': 'साइट में खोजें',
      'Search': 'खोजें',
      'Help': 'सहायता',
      'Astro-Palmistry': 'ज्योतिष-हस्तरेखा',
      'Palm Analysis': 'हस्त विश्लेषण',
      'Kundali Analysis': 'कुंडली विश्लेषण',
      'Puja & Seva': 'पूजा और सेवा',
      'Japa & Mantra': 'जप और मंत्र',
      'Muhurta': 'मुहूर्त',
      'Mantras & Stotras': 'मंत्र और स्तोत्र',
      'Palmistry Guide': 'हस्तरेखा मार्गदर्शिका',
      'All services': 'सभी सेवाएँ',
      'Healing & Learning': 'हीलिंग और शिक्षा',
      'Detailed Palm Analysis': 'विस्तृत हस्त विश्लेषण',
      'Puja & Graha Shanti': 'पूजा और ग्रह शांति',
      'Astro-Palmistry Correlation': 'ज्योतिष-हस्तरेखा सहसंबंध',
      'Privacy Policy': 'गोपनीयता नीति',
      'Terms & Conditions': 'नियम और शर्तें',
      'Cancellation & Refund': 'रद्दीकरण और रिफ़ंड',
      'Send an enquiry': 'पूछताछ भेजें',
      'Payments by Cashfree': 'भुगतान Cashfree द्वारा',
      'Continue': 'जारी रखें',
      'Cancel': 'रद्द करें',
      'Send': 'भेजें',
      'Save': 'सहेजें',
      'Close': 'बंद करें',
      'Back': 'वापस',
      'Next': 'आगे',
      'Read more': 'और पढ़ें',
      'Learn more': 'और जानें',
      'View all': 'सभी देखें',
      'Enrol now': 'अभी नामांकन करें',
      'Enrol': 'नामांकन करें',
      'Register interest': 'रुचि दर्ज करें',
      'Notify me when it opens': 'शुरू होने पर सूचित करें',
      'Book again': 'फिर से बुक करें',
      'All courses': 'सभी पाठ्यक्रम',
      'Contact us': 'हमसे संपर्क करें',
      'My booking': 'मेरी बुकिंग',
      'Your name': 'आपका नाम',
      'Full Name': 'पूरा नाम',
      'Mobile Number': 'मोबाइल नंबर',
      'Email': 'ईमेल',
      '10-digit mobile': '10 अंकों का मोबाइल',
      'Mobile number': 'मोबाइल नंबर',
      'Booking or enquiry reference': 'बुकिंग या पूछताछ संदर्भ',
      'Date of Birth': 'जन्म तिथि',
      'Time of Birth': 'जन्म समय',
      'Place of Birth': 'जन्म स्थान',
      'Gotram': 'गोत्र',
      'Message': 'संदेश',
      'Track Your Booking or Enquiry': 'अपनी बुकिंग या पूछताछ देखें',
      'Consultation': 'परामर्श',
      'Pooja Seva': 'पूजा सेवा',
      'Course': 'पाठ्यक्रम',
      'Devotee': 'भक्त',
      'Amount': 'राशि',
      'Service': 'सेवा',
      'Lessons': 'पाठ',
      'Consultation slot': 'परामर्श समय',
      'Pooja date & slot': 'पूजा तिथि और समय',
      'Booked': 'बुक हुआ',
      'Payment confirmed': 'भुगतान की पुष्टि',
      'Details received': 'विवरण प्राप्त',
      'Reading completed': 'पठन पूर्ण',
      'Enrolled': 'नामांकित',
      'Lessons open': 'पाठ उपलब्ध',
      'In progress': 'जारी है',
      'Course complete': 'पाठ्यक्रम पूर्ण',
      'Completed': 'पूर्ण',
      'Cancelled': 'रद्द',
      'Scheduled': 'निर्धारित',
      'Upload palm photos': 'हथेली की तस्वीरें अपलोड करें',
      'Open your lessons': 'अपने पाठ खोलें',
      'Consultation room': 'परामर्श कक्ष',
      'Your consultation room': 'आपका परामर्श कक्ष',
      'Your consultation': 'आपका परामर्श',
      'Join session': 'सत्र में शामिल हों',
      'Join with video': 'वीडियो के साथ जुड़ें',
      'Audio only': 'केवल ऑडियो',
      'Before you join': 'जुड़ने से पहले',
      'Back to my booking': 'मेरी बुकिंग पर वापस',
      'Rejoin': 'फिर से जुड़ें',
      'Check again': 'फिर देखें',
      'Chat with Guruji': 'गुरुजी से चैट',
      'Write to Guruji…': 'गुरुजी को लिखें…',
      'Who is joining?': 'कौन जुड़ रहा है?',
      'Who is learning?': 'कौन सीख रहा है?',
      'The room is open now.': 'कक्ष अब खुला है।',
      'Your room is not open yet': 'आपका कक्ष अभी खुला नहीं है',
      'This session has ended': 'यह सत्र समाप्त हो गया',
      'You have left the session': 'आप सत्र से बाहर आ गए हैं',
      'See your Kundali': 'अपनी कुंडली देखें',
      'Download your reading': 'अपना पठन डाउनलोड करें',
      'Your course': 'आपका पाठ्यक्रम',
      'Start today — self-paced': 'आज ही शुरू करें — अपनी गति से',
      'Remember': 'याद रखें',
      'Practice': 'अभ्यास',
      'Mark complete': 'पूर्ण चिह्नित करें',
      'Mark as not done': 'अपूर्ण चिह्नित करें',
      'Next lesson': 'अगला पाठ',
      'Previous': 'पिछला',
      'Curriculum': 'पाठ्यक्रम सामग्री',
      'Learning outcomes': 'सीखने के परिणाम',
      'Duration': 'अवधि',
      'Mode': 'माध्यम',
      'Instructor': 'शिक्षक',
      'Certificate': 'प्रमाणपत्र',
      'Kundali': 'कुंडली',
      'North Indian': 'उत्तर भारतीय',
      'South Indian': 'दक्षिण भारतीय',
      'Graha': 'ग्रह',
      'Rashi': 'राशि',
      'Degree': 'अंश',
      'Nakshatra': 'नक्षत्र',
      'Pada': 'पाद',
      'Bhava': 'भाव',
      'Lord': 'स्वामी',
      'From': 'से',
      'To': 'तक',
      'now': 'अभी',
      'Guidance · Healing · Devotion · Learning': 'मार्गदर्शन · हीलिंग · भक्ति · शिक्षा',
      'Articles, course lessons and Guruji’s written readings stay in English for now.':
        'लेख, पाठ्यक्रम के पाठ और गुरुजी के लिखित पठन फ़िलहाल अंग्रेज़ी में ही रहेंगे।'
    }
  };

  const LANGS = [
    { id: 'en', label: 'English', short: 'EN' },
    { id: 'te', label: 'తెలుగు', short: 'తె' },
    { id: 'hi', label: 'हिन्दी', short: 'हि' }
  ];
  const NOTE = 'Articles, course lessons and Guruji’s written readings stay in English for now.';
  const SKIP_TAGS = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'CODE', 'PRE', 'TEXTAREA', 'SVG']);

  let current = 'en';
  let observer = null;
  let scheduled = false;

  const dict = () => DICT[current] || null;

  function translateElement(root) {
    const d = dict();
    if (!d || !root) return;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        const parent = node.parentElement;
        if (!parent || SKIP_TAGS.has(parent.tagName) || parent.closest('[data-no-i18n]')) return NodeFilter.FILTER_REJECT;
        return node.nodeValue.trim() ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
      }
    });
    const jobs = [];
    let n;
    while ((n = walker.nextNode())) jobs.push(n);
    for (const node of jobs) {
      const raw = node.nodeValue;
      const key = raw.trim();
      const hit = d[key];
      if (hit && hit !== key) {
        if (!node.__en) node.__en = raw;
        node.nodeValue = raw.replace(key, hit);
      }
    }
    const attrs = ['placeholder', 'aria-label', 'title', 'value'];
    const els = root.querySelectorAll ? root.querySelectorAll('[placeholder],[aria-label],[title]') : [];
    els.forEach(el => {
      if (el.closest('[data-no-i18n]')) return;
      attrs.forEach(a => {
        const v = el.getAttribute(a);
        if (!v) return;
        const hit = d[v.trim()];
        if (hit) {
          if (!el.dataset['en' + a.replace(/-/g, '')]) el.dataset['en' + a.replace(/-/g, '')] = v;
          el.setAttribute(a, hit);
        }
      });
    });
  }

  function schedule() {
    if (current === 'en' || scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => { scheduled = false; translateElement(document.body); });
  }

  function setLang(lang, { reload = true } = {}) {
    if (!DICT[lang] && lang !== 'en') return;
    const changingFromTranslated = current !== 'en' && current !== lang;
    current = lang;
    try { localStorage.setItem('guruji_lang', lang); } catch (e) { /* private mode */ }
    document.documentElement.lang = lang === 'en' ? 'en-IN' : lang;
    paintSwitcher();
    paintNote();
    if (lang === 'en' || changingFromTranslated) {
      // The page is rebuilt from the English source when switching back or across.
      if (reload) { location.reload(); return; }
    }
    translateElement(document.body);
    startObserver();
  }

  function startObserver() {
    if (observer || current === 'en') return;
    observer = new MutationObserver(schedule);
    observer.observe(document.body, { childList: true, subtree: true });
  }

  function paintSwitcher() {
    document.querySelectorAll('[data-lang-switch]').forEach(box => {
      box.innerHTML = LANGS.map(l =>
        `<button type="button" class="lang-switch__btn${l.id === current ? ' is-active' : ''}" lang="${l.id}" data-lang="${l.id}" aria-pressed="${l.id === current}">${box.dataset.langSwitch === 'short' ? l.short : l.label}</button>`
      ).join('');
      box.setAttribute('data-no-i18n', '');
    });
  }

  function paintNote() {
    const text = current === 'en' ? '' : (DICT[current][NOTE] || NOTE);
    document.querySelectorAll('[data-lang-note]').forEach(el => {
      el.textContent = text;
      el.hidden = !text;
      el.setAttribute('data-no-i18n', '');
    });
  }

  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-lang]');
    if (!btn) return;
    e.preventDefault();
    setLang(btn.getAttribute('data-lang'));
  });

  function boot() {
    let saved = null;
    try { saved = localStorage.getItem('guruji_lang'); } catch (e) { /* ignore */ }
    const fromUrl = new URLSearchParams(location.search).get('lang');
    const lang = (fromUrl && DICT[fromUrl] ? fromUrl : null) || (saved && (DICT[saved] || saved === 'en') ? saved : 'en');
    current = lang;
    document.documentElement.lang = lang === 'en' ? 'en-IN' : lang;
    paintSwitcher();
    paintNote();
    if (lang !== 'en') { translateElement(document.body); startObserver(); }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();

  window.GurujiI18n = { setLang, langs: LANGS, get current() { return current; }, translate: translateElement, DICT };
})();
