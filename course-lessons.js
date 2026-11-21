// Guruji Palmistry — course lesson bodies.
// Server-only: this file is never served to the browser, so lesson text stays
// behind an enrolment. The public outline (titles, minutes, summaries) is
// exposed by /api/courses/:slug/outline.

const COURSES = {
  'introduction-to-palmistry': {
    price: 0,
    blurb: 'A free, self-paced first course. Five short lessons you can read on any phone, with one small practice after each.',
    lessons: [
      {
        id: 'l1',
        title: 'What palmistry is, and what it is not',
        minutes: 10,
        summary: 'Where Hasta Samudrika Shastra comes from, and the honest limits of a reading.',
        body: [
          'Palmistry in the Indian tradition is called Hasta Samudrika Shastra — the study of the hand as one part of the wider study of the body. It is old, practical and observational: generations of readers looked at many hands, noticed what travelled with what, and wrote it down. It sits beside Jyotisha (Vedic astrology) rather than inside it, and the two are often read together because they describe the same life from two directions.',
          'A hand is read as a record of tendency, not as a sentence. The shape of the palm and fingers shows the grain of a person — how they take in the world, how they spend energy, where effort feels natural. The lines show how that energy has been flowing, and they do change: skin is living tissue, and the fine lines of the hand redraw themselves over years as habits, health and attention change.',
          'This is the first thing to be clear about with anyone whose hand you read. Palmistry does not fix a date of death, name a disease, promise a marriage, or decide a child\'s career. A reader who claims those things is either guessing or frightening people for money. The tradition itself is more modest: it describes what is likely if nothing changes, so that the person can choose to change it.',
          'The useful question to hold in your mind as you learn is never "what will happen to this person?" but "what does this hand make easy, and what does it make hard?" That question has honest answers, and it is the one that actually helps someone.',
          'Guruji\'s own rule, repeated through every course here, is short: guidance, not fear; awareness, not dependency. If a reading leaves someone more afraid or more dependent on the reader than when they sat down, the reading failed, however accurate it was.'
        ],
        keyPoints: [
          'Hasta Samudrika Shastra is observational and descriptive, not fatalistic.',
          'Shape shows temperament; lines show the flow of energy, and lines change.',
          'A reading names tendencies and choices, never fixed dates or diagnoses.'
        ],
        practice: 'Write down, in two sentences, what you would say to someone who asks you "how long will I live?" — before you know any palmistry at all. Keep it; compare it with your answer at the end of the course.'
      },
      {
        id: 'l2',
        title: 'Which hand to read, and why both matter',
        minutes: 8,
        summary: 'Dominant and non-dominant hands, and how to compare them.',
        body: [
          'Both hands are read, always. The common shorthand — "left for women, right for men" — is a later simplification and it is not how a careful reader works. What matters is which hand the person uses.',
          'The non-dominant hand is read as the inherited hand: the temperament, constitution and family pattern a person started with. The dominant hand is the worked hand: what they have made of that material through choice, effort, environment and habit.',
          'The reading lives in the difference between them. Two hands that look almost the same suggest a life running close to its original grain — steady, consistent, perhaps unexamined. Two hands that differ markedly suggest a person who has moved a long way from where they began: through study, migration, illness, discipline or deliberate change. Neither is better. The gap is simply information about how much the person has reshaped themselves, and in which direction.',
          'A practical consequence: when the dominant hand shows a stronger, clearer line than the non-dominant one, the tradition reads that as a capacity the person has built. When the dominant hand shows a weaker or more broken version, it points to something inherited that has been spent, neglected or strained. This is where a reading becomes genuinely useful, because it is exactly the kind of thing a person can act on.',
          'Ask which hand they write with before you look at anything. If they are ambidextrous, ask which hand they use for small, fiddly tasks — threading a needle, unlocking a door — and treat that as dominant.'
        ],
        keyPoints: [
          'Read both hands; dominance decides which is which, not gender.',
          'Non-dominant = inherited material. Dominant = what has been made of it.',
          'The difference between the two hands is the most informative part of the pair.'
        ],
        practice: 'Photograph both of your own palms in daylight, flat and relaxed, and set them side by side on a screen. List three visible differences. You will use these photographs again in Lesson 5.'
      },
      {
        id: 'l3',
        title: 'Hand shapes at a glance',
        minutes: 12,
        summary: 'The four elemental hand types and how to judge them in a few seconds.',
        body: [
          'Before any line is read, the hand is classified by shape. The widely used scheme sorts hands into four elemental types by comparing the palm and the fingers.',
          'An Earth hand has a square palm with short fingers and thick, firm skin. It belongs to people who are practical, physical and steady — they trust what they can handle and build, and they tire of abstraction quickly. A Fire hand has a long, rectangular palm with short fingers. It reads as drive, appetite and impatience: plenty of energy to start things, less for maintenance.',
          'An Air hand has a square palm with long fingers and often fine, dry skin. It reads as a thinking, talking, analysing temperament — comfortable with ideas and language, sometimes living at a distance from the body. A Water hand has a long palm with long, flexible fingers and soft skin. It reads as feeling, intuition and receptivity: strongly affected by people and atmosphere, needing recovery time.',
          'To judge the palm, measure from the wrist crease to the base of the fingers against the width of the palm at its widest. Roughly equal is "square"; noticeably longer than wide is "long". To judge the fingers, compare the middle finger with the palm length: a middle finger shorter than the palm counts as short fingers, about equal or longer counts as long.',
          'Most hands are mixtures, and saying so out loud is a sign of a careful reader rather than a weak one. The shape is a first frame: it tells you what kind of person is in front of you, which is the context every line is then read inside. The same deep, straight head line means something different on a Water hand than on an Earth hand.'
        ],
        keyPoints: [
          'Earth: square palm, short fingers, firm skin — practical and steady.',
          'Fire: long palm, short fingers — energetic, impatient, enterprising.',
          'Air: square palm, long fingers — analytical, verbal, detached.',
          'Water: long palm, long fingers, soft skin — receptive, emotional, intuitive.'
        ],
        practice: 'Classify three hands you can see today — your own and two from family or friends, with their permission. Note palm length against width, and middle finger against palm.'
      },
      {
        id: 'l4',
        title: 'The four major lines',
        minutes: 15,
        summary: 'Life, head, heart and fate: where they run and what their quality means.',
        body: [
          'Four lines carry most of a basic reading. The life line curves around the ball of the thumb, from between thumb and index finger down towards the wrist. The head line crosses the palm from the same starting area towards the far edge. The heart line runs above it, across the upper palm below the fingers. The fate line, when present, rises up the middle of the palm towards the middle finger.',
          'The life line does not measure lifespan — this is the single most common misunderstanding, and worth correcting out loud every time. It describes vitality, physical constitution and the broad shape of a life: a wide, generous curve suggests strong physical energy and an outward life; a line hugging the thumb suggests a more guarded, conserving constitution.',
          'The head line describes how a person thinks. Straight and clear across the palm reads as practical, direct thinking; sloping down towards the wrist reads as imaginative and associative. A long line suggests thoroughness, a short one suggests decisiveness, and the quality — deep and unbroken against feathery or chained — says more about mental steadiness than the length does.',
          'The heart line describes how a person loves and handles feeling. Rising high towards the fingers reads as warm and demonstrative; running flatter and straighter reads as contained, loyal and slow to show. Where it ends matters: under the index finger suggests high standards in love, under the middle finger a more self-directed attachment, and curving up between the two is the usual, balanced ending.',
          'The fate line is the line of direction and circumstance — work, duty, the sense of being carried by a path. Many good lives show a faint fate line or none at all, which reads as a life shaped by the person\'s own repeated choices rather than by one strong track. Breaks and restarts in it mark changes of direction, not failures.',
          'In every case, read quality before meaning: deep, clear and unbroken says the energy runs freely; thin, chained, broken or islanded says it is interrupted or strained. Beginners rush to interpret shapes and forget that the texture of the line is where most of the information actually sits.'
        ],
        keyPoints: [
          'The life line shows vitality and constitution, never length of life.',
          'Head line = how one thinks; heart line = how one feels and attaches.',
          'A faint or absent fate line is common and is not a bad sign.',
          'Depth and continuity matter more than length.'
        ],
        practice: 'On your own dominant palm, trace each of the four lines with a fingertip and say aloud which it is. Note for each one: deep or faint, continuous or broken.'
      },
      {
        id: 'l5',
        title: 'Taking palm photographs a reader can actually use',
        minutes: 10,
        summary: 'Light, angle and the four images every remote reading needs.',
        body: [
          'Most readings now begin with photographs, and a bad photograph wastes everyone\'s time. The fine lines that carry the detail are shallow, so they disappear under flash and under hard overhead light.',
          'Use daylight, indirect: near a window, out of direct sun, in the middle of the day. Turn the phone flash off. Rest the hand on a plain, dark, non-reflective surface, relaxed and slightly cupped rather than stretched flat — stretching pulls the skin and flattens the very lines you need.',
          'Four images make a complete set. The full left palm and the full right palm, each filling the frame from wrist crease to fingertips. The side of the palm along the little-finger edge, which carries the marriage and travel markings. And the backs of both hands, which show the nails and the finger shape — useful for health indications and for confirming the hand type.',
          'Hold the camera parallel to the palm, not at an angle, and about twenty to twenty-five centimetres away. Tap the screen on the centre of the palm so the phone focuses and exposes there. Take three of each and keep the sharpest; a phone in a steady hand beats an expensive camera held badly.',
          'Finally, note the person\'s age, the hand they write with, and anything recent and physical — a surgery, a long illness, heavy manual work — since all of these change what the skin shows. A reader who has these four photographs and those three facts can do real work; one who has a single blurred photograph is guessing politely.'
        ],
        keyPoints: [
          'Indirect daylight, no flash, plain dark background.',
          'Relaxed, slightly cupped hand — never stretched flat.',
          'Four images: left palm, right palm, little-finger side, backs of both hands.',
          'Send age, dominant hand and any recent physical change with the photographs.'
        ],
        practice: 'Take the full four-image set of your own hands using the guidance above and compare them with the photographs you took in Lesson 2. Keep the better set — this is what you would send to a reader.'
      }
    ]
  }
};

/** Public outline: no lesson bodies. */
function courseOutline(slug) {
  const c = COURSES[slug];
  if (!c) return null;
  return {
    slug,
    price: c.price || 0,
    blurb: c.blurb || '',
    lessonCount: c.lessons.length,
    minutes: c.lessons.reduce((s, l) => s + (l.minutes || 0), 0),
    lessons: c.lessons.map(l => ({ id: l.id, title: l.title, minutes: l.minutes, summary: l.summary }))
  };
}

/** Full lessons, for an enrolled devotee only. */
function courseLessons(slug) {
  const c = COURSES[slug];
  return c ? c.lessons : null;
}

const selfPacedSlugs = () => Object.keys(COURSES);

module.exports = { COURSES, courseOutline, courseLessons, selfPacedSlugs };
