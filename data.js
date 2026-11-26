// GURUJI - Palmistry, Astrology & Guidance Data Store

const GURUJI_DATA = {
  guru: {
    name: "Adiguru Swamiji",
    title: "Vedic Palmistry & Jyotish Acharya",
    status: "Online | Palmistry Consultant",
    experience: "32+ Years of Vedic Hastarekha & Kundali Shastra",
    avatar: "/assets/adiguru_swamiji_portrait.jpg",
    bio: "Initiated in the sacred lineage of Varanasi and Tirupati. Blessed over 40,000 seekers across India and 34 countries with accurate Hastarekha (Palmistry) interpretations, dosha remedies, and Vedic spiritual guidance."
  },

  services: [
    {
      id: "palmistry_reading",
      title: "Detailed Palm Analysis",
      sanskrit: "हस्त सामुद्रिक विश्लेषण",
      icon: "✋",
      price: 549,
      duration: "30 Mins",
      badge: "Most Popular",
      description: "Life path, nature, strengths, challenges and guidance from your hand lines.",
      included: [
        "In-depth analysis of 5 major lines & 7 mounts",
        "Clear guidance on career, finances & relationships",
        "Identification of auspicious marks (Fish, Lotus, Trident)",
        "30-min live 1-on-1 video/audio consultation",
        "Personalised 6-page PDF Hastarekha Report"
      ]
    },
    {
      id: "astrology_correlation",
      title: "Comprehensive Kundali Analysis",
      sanskrit: "कुंडली एवं ग्रह दशा",
      icon: "☸️",
      price: 549,
      duration: "30 Mins",
      badge: "Vedic Jyotish",
      description: "Deep astrological analysis based on your exact date, time, and place of birth.",
      included: [
        "Janam Kundali (Birth Chart) calculations",
        "Current Mahadasha & Antardasha analysis",
        "Planetary dosha checks (Manglik, Sade Sati, Kaal Sarp)",
        "30-min live consultation with Guruji",
        "Astrological remedies & Vedic mantra guidance"
      ]
    },
    {
      id: "combined_consultation",
      title: "Astro-Palmistry Correlation",
      sanskrit: "हस्तरेखा + जन्मकुंडली संगम",
      icon: "✨",
      price: 649,
      duration: "45 Mins",
      badge: "Highest Accuracy (Recommended)",
      description: "Palmistry and Astrology synthesized together for a deeper, comprehensive and accurate reading.",
      included: [
        "Cross-verification of palm lines against birth horoscope",
        "Pinpointed timeline of upcoming life transitions (Ages 25 to 65)",
        "Career, marriage, health, and family prosperity insights",
        "45-min extended consultation with Guruji",
        "Comprehensive 10-page Vedic Palmistry + Kundali Dossier",
        "Priority post-reading chat support for 14 days"
      ]
    }
  ],

  poojas: [
    {
      id: "ganapathi_homam",
      name: "Ganapathi Homam",
      sanskrit: "महा गणपति होमम्",
      price: 3100,
      duration: "45 mins ritual",
      image: "/assets/ganapathi_homam_card_1795167334513.jpg",
      purpose: "Removes hurdles in career, business, and auspicious beginnings.",
      deity: "Lord Ganesha",
      benefits: "Removes obstacles, brings intellect, wealth, and smooth career transition."
    },
    {
      id: "navagraha_shanti",
      name: "Navagraha Shanti",
      sanskrit: "नवग्रह शांति महापूजा",
      price: 5100,
      duration: "60 mins ritual",
      image: "/assets/navagraha_shanti_card_1795167350977.jpg",
      purpose: "Pacifies all 9 planetary afflictions and aligns destiny with cosmic harmony.",
      deity: "Navagraha Deities",
      benefits: "Balances planetary doshas, brings inner peace, protection from unforeseen troubles."
    },
    {
      id: "shani_shanti",
      name: "Shani Shanti",
      sanskrit: "शनि शांति एवं तैलाभिषेक",
      price: 2100,
      duration: "40 mins ritual",
      image: "/assets/shani_shanti_puja_card_1795167348933.jpg",
      purpose: "Mitigates hardship during Shani Sade Sati, Dhaiya, or Kantaka Shani periods.",
      deity: "Lord Shani Dev",
      benefits: "Relief from stress, delays, and career stagnation. Protection through mustard oil archana."
    },
    {
      id: "pitru_runa_vimochana",
      name: "Pitru Runa Vimochana",
      sanskrit: "पितृ ऋण विमोचन तर्पण",
      price: 5100,
      duration: "60 mins ritual",
      image: "/assets/pitru_runa_vimochana_puja_1795167355033.jpg",
      purpose: "Clears ancestral karmic debts to restore peace, fertility, and family harmony.",
      deity: "Ancestral Spirits & Lord Vishnu",
      benefits: "Removes Pitru Dosha, grants blessings of ancestors for lineage growth and prosperity."
    },
    {
      id: "ayushya_homam",
      name: "Ayushya Homam",
      sanskrit: "आयुष्य होमम्",
      price: 3100,
      duration: "45 mins ritual",
      image: "/assets/navagraha_shanti_card_1795167350977.jpg", // fallback high-res card
      purpose: "Invokes divine vitality, curing persistent illnesses and blessing long life.",
      deity: "Ayur Devata & Markandeya",
      benefits: "Enhanced physical vitality, recovery from prolonged sickness, mental clarity."
    },
    {
      id: "santana_prapti",
      name: "Santana Prapti",
      sanskrit: "संतान प्राप्ति गोपाल पूजा",
      price: 4100,
      duration: "50 mins ritual",
      image: "/assets/santana_prapti_pooja_bal_gopal_1795167365329.jpg",
      purpose: "For couples praying for healthy progeny, conception, and child wellbeing.",
      deity: "Santhana Gopala (Bal Krishna)",
      benefits: "Removes conception delays, grants healthy child birth and maternal wellness."
    }
  ],

  courses: [
    {
      id: "course_foundations",
      title: "Foundations of Hastarekha Shastra",
      duration: "4 Weeks (Live Weekend Batches)",
      level: "Beginner to Intermediate",
      price: 4999,
      topics: ["Hand Shapes & Vedic Elements", "Reading the 5 Primary Lines", "Understanding Mount Strengths", "Practical Palm Case Studies"]
    },
    {
      id: "course_advanced",
      title: "Vedic Palmistry & Kundali Synthesis",
      duration: "8 Weeks (Certification)",
      level: "Masterclass",
      price: 9999,
      topics: ["Age Timing via Palm Lines", "Correlating D1 Kundali with Palm Signs", "Special Yogas (Gajakesari, Hamsa)", "Remedial Shastra & Gemology"]
    }
  ],

  linesGuide: [
    {
      id: "heart_line",
      name: "Heart Line (Hridaya Rekha)",
      sanskrit: "हृदय रेखा",
      color: "#e11d48",
      meaning: "Runs horizontally across the top of the palm. Indicates emotional depth, capacity for devotion, relationship temperament, empathy, and cardiovascular vitality.",
      indications: "A long, curved line ending under Mount of Jupiter shows noble, idealistic love; branches indicate warm social rapport."
    },
    {
      id: "head_line",
      name: "Head Line (Masti-shka Rekha)",
      sanskrit: "मस्तिष्क रेखा",
      color: "#2563eb",
      meaning: "Traverses the middle palm. Reflects intellectual focus, analytical prowess, mental stamina, decision-making style, and creativity.",
      indications: "A gently sloping line toward the Mount of Moon signifies fertile artistic imagination and intuitive problem-solving."
    },
    {
      id: "life_line",
      name: "Life Line (Jeevan Rekha)",
      sanskrit: "जीवन रेखा",
      color: "#16a34a",
      meaning: "Encircles the base of the thumb (Mount of Venus). Embodies vitality, prana (life force energy), resilience against illness, and pivotal life milestones.",
      indications: "A wide sweeping curve indicates abundant vitality, adventurous spirit, and strong physical constitution."
    },
    {
      id: "fate_line",
      name: "Fate Line (Bhagya Rekha)",
      sanskrit: "भाग्य रेखा",
      color: "#9333ea",
      meaning: "Rises vertically from wrist toward Mount of Saturn. Denotes vocational trajectory, destiny, external fortune, and clarity of life purpose.",
      indications: "A sharp line starting at the wrist and ascending to Saturn indicates self-made success and early career clarity."
    },
    {
      id: "sun_line",
      name: "Sun Line (Surya Rekha / Apollo)",
      sanskrit: "सूर्य रेखा",
      color: "#f59e0b",
      meaning: "Runs upward below the ring finger. Bestows recognition, creative fame, charisma, public honors, and material prosperity.",
      indications: "Even a short, deep Sun line signifies public respect, successful artistic ventures, and auspicious golden period in mid-life."
    }
  ],

  mountsGuide: [
    { name: "Mount of Jupiter (Guru Parvat)", location: "Base of index finger", attributes: "Leadership, wisdom, moral character, high status" },
    { name: "Mount of Saturn (Shani Parvat)", location: "Base of middle finger", attributes: "Discipline, philosophy, career perseverance, karmic balance" },
    { name: "Mount of Sun (Surya Parvat)", location: "Base of ring finger", attributes: "Fame, creativity, radiance, artistic genius" },
    { name: "Mount of Mercury (Budha Parvat)", location: "Base of little finger", attributes: "Business acumen, speech, diplomacy, wit" },
    { name: "Mount of Venus (Shukra Parvat)", location: "Fleshy base of thumb", attributes: "Vitality, romance, aesthetic luxury, passion" },
    { name: "Mount of Moon (Chandra Parvat)", location: "Lower palm opposite thumb", attributes: "Intuition, imagination, foreign travel, peace of mind" }
  ],

  reviews: [
    {
      id: 1,
      name: "Srikar Babu G.",
      location: "Hyderabad, Telangana",
      rating: 5,
      date: "3 days ago",
      consultation: "Palmistry + Kundali Consultation",
      comment: "Guruji’s observation of my fate line splitting at age 32 was remarkably accurate. He guided me on whether to start my tech venture or stay in Europe. The written PDF report arrived within 4 hours. Immensely grateful for the clarity!",
      verified: true
    },
    {
      id: 2,
      name: "Ananya Deshmukh",
      location: "Bengaluru, Karnataka",
      rating: 5,
      date: "1 week ago",
      consultation: "Detailed Palm Analysis",
      comment: "Every line really tells a story! Guruji pointed out a stress mark on my Rahu mount that had been causing anxiety and suggested simple daily mantras. The session was warm, deeply spiritual and calming.",
      verified: true
    },
    {
      id: 3,
      name: "Rajeshwar Sharma",
      location: "Dallas, USA",
      rating: 5,
      date: "2 weeks ago",
      consultation: "Astro-Palmistry Correlation + Pooja Seva",
      comment: "Booking from the USA was seamless. Held my slot with ease, paid securely online, uploaded my hand photos, and joined the video session right on time. Guruji performed the Navagraha Shanti and I received the video recording & prasad details.",
      verified: true
    },
    {
      id: 4,
      name: "Kavitha Varma",
      location: "Vijayawada, AP",
      rating: 5,
      date: "Last month",
      consultation: "Palm Reading",
      comment: "Guruji speaks in fluent Telugu and English, explaining the traditional Hastarekha principles so clearly. The sample report on the website gave me confidence, but the real report was even more detailed!",
      verified: true
    }
  ],

  sampleReport: {
    clientName: "Srikar Babu G.",
    dob: "18 Jul 1994",
    tob: "06:45 AM",
    pob: "Hyderabad, Telangana",
    dominantHand: "Right Hand (Active Destiny)",
    passiveHand: "Left Hand (Innate Potential)",
    consultationId: "GURUJI-PLM-7843",
    dateOfAnalysis: "20 Nov 2026",
    sections: [
      {
        title: "1. Hand Morphology & Elemental Type",
        summary: "Your hand displays an Earth-Fire hybrid structure with square palm and long, well-articulated fingers. This indicates grounded pragmatic thinking coupled with entrepreneurial drive."
      },
      {
        title: "2. The Heart Line (Hridaya Rekha)",
        summary: "Terminating between the Mount of Jupiter and Saturn, displaying an auspicious trident (Trishula). You possess deep emotional loyalty, strong dharmic ethics in relationships, and resilience against heartbreak."
      },
      {
        title: "3. The Head Line (Masti-shka Rekha)",
        summary: "Long, distinct and gently sloping toward the upper Mount of Moon. Excellent strategic acumen, aptitude for high-level technology or financial leadership, and vivid creative visualization."
      },
      {
        title: "4. The Life Line & Vitality (Jeevan Rekha)",
        summary: "Deep and unobstructed, sweeping gracefully with high vitality. A distinct upward branch at age 32 indicates a major geographic relocation and elevation in material prosperity."
      },
      {
        title: "5. The Fate Line & Career Trajectory (Bhagya Rekha)",
        summary: "Originates independently near the wrist and strengthens significantly between ages 30 and 48. Independent success is indicated rather than inherited wealth."
      },
      {
        title: "6. Auspicious Vedic Symbols Identified",
        summary: "Trishula on Mount of Jupiter; Matsya (Fish symbol) near Ketu at the wrist indicating protection against sudden hazards; Lotus mark on upper Mount of Sun indicating public renown."
      },
      {
        title: "7. Prescribed Vedic Remedies & Mantras",
        summary: "1. Recite the Maha Mrityunjaya Mantra 108 times on Monday mornings. 2. Wear natural untreated Yellow Sapphire (Pukhraj) on index finger or 5-Mukhi authentic Rudraksha. 3. Perform Navagraha Shanti for Jupiter & Saturn alignment."
      }
    ]
  }
};
