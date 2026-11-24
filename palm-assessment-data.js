// Guruji Palmistry practitioner assessment checklist.
// Generated from Guruji_Palmistry_Selectable_Assessment_Checklist.xlsx by
// scripts/build-assessment-data.py — edit the workbook and re-run, not this file.
window.PALM_ASSESSMENT = {
 "title": "Guruji Palmistry | Selectable Practitioner Assessment Checklist",
 "hands": [
  "Left",
  "Right",
  "Both",
  "Not applicable"
 ],
 "statuses": [
  "Observed",
  "Not visible",
  "Not assessed",
  "Unclear"
 ],
 "confidence": [
  "High",
  "Medium",
  "Low"
 ],
 "defaultStatus": "Not assessed",
 "hint": "Select the closest visible characteristic.",
 "instructions": [
  [
   "This is the intended workflow",
   "You are the practitioner assessing the hand. For each parameter, select the visible characteristic from its dropdown in the Selected Value column."
  ],
  [
   "One row = one parameter",
   "Example: Palm → Palm shape → choose Square / Rectangular / Spatulate / Broad / Narrow etc."
  ],
  [
   "Hand selection",
   "Select Left or Right for each row. You can duplicate a row if you need to record a different value for the other hand."
  ],
  [
   "Multiple findings",
   "Where a feature has more than one marking, use Additional Selection / Description and Location / Exact Detail to record all relevant findings."
  ],
  [
   "Status",
   "Observed = assessed and identified; Not visible = cannot be seen; Not assessed = not checked; Unclear = ambiguous."
  ],
  [
   "Confidence",
   "High / Medium / Low indicates your confidence in the observation, not certainty about its traditional meaning."
  ],
  [
   "Coverage",
   "Includes Palm, Skin, Hand Type, Fingers, Thumb, Mounts, Major Lines, Minor Lines, Special Markings and Overall Review."
  ],
  [
   "Important",
   "This workbook records observations only. Interpretation and customer-facing life analysis should be completed separately and grounded in the selected observations."
  ]
 ],
 "details": [
  "Seeker Name",
  "Report Reference",
  "Date of Birth",
  "Date of Assessment",
  "Practitioner",
  "Dominant Hand",
  "Handedness confirmed",
  "Left hand assessed",
  "Right hand assessed",
  "Photo quality / limitations",
  "General practitioner notes"
 ],
 "fields": [
  {
   "id": "GP-001",
   "category": "Palm",
   "aspect": "Palm shape",
   "options": [
    "Square",
    "Rectangular",
    "Spatulate",
    "Broad",
    "Narrow",
    "Long / elongated",
    "Short",
    "Conical",
    "Mixed / combination",
    "Other",
    "Not assessable"
   ]
  },
  {
   "id": "GP-002",
   "category": "Palm",
   "aspect": "Palm breadth",
   "options": [
    "Very broad",
    "Broad",
    "Medium",
    "Narrow",
    "Very narrow",
    "Not assessable"
   ]
  },
  {
   "id": "GP-003",
   "category": "Palm",
   "aspect": "Palm length",
   "options": [
    "Short",
    "Medium",
    "Long",
    "Very long",
    "Not assessable"
   ]
  },
  {
   "id": "GP-004",
   "category": "Palm",
   "aspect": "Palm-to-finger proportion",
   "options": [
    "Palm longer than fingers",
    "Fingers longer than palm",
    "Approximately balanced",
    "Not assessable"
   ]
  },
  {
   "id": "GP-005",
   "category": "Palm",
   "aspect": "Palm fullness",
   "options": [
    "Flat",
    "Lean",
    "Moderately full",
    "Full",
    "Very fleshy",
    "Uneven",
    "Not assessable"
   ]
  },
  {
   "id": "GP-006",
   "category": "Palm",
   "aspect": "Palm firmness",
   "options": [
    "Soft",
    "Medium",
    "Firm",
    "Very firm",
    "Not assessed by touch"
   ]
  },
  {
   "id": "GP-007",
   "category": "Palm",
   "aspect": "Palm flexibility",
   "options": [
    "Very flexible",
    "Flexible",
    "Moderate",
    "Firm / resistant",
    "Rigid",
    "Not assessed"
   ]
  },
  {
   "id": "GP-008",
   "category": "Palm",
   "aspect": "Palm texture",
   "options": [
    "Fine",
    "Medium",
    "Coarse",
    "Rough",
    "Smooth",
    "Calloused",
    "Mixed",
    "Not assessable"
   ]
  },
  {
   "id": "GP-009",
   "category": "Palm",
   "aspect": "Palm surface",
   "options": [
    "Even",
    "Uneven",
    "Padded",
    "Depressed areas",
    "Raised areas",
    "Mixed",
    "Not assessable"
   ]
  },
  {
   "id": "GP-010",
   "category": "Palm",
   "aspect": "Palm colour / tone",
   "options": [
    "Pale",
    "Pink",
    "Reddish",
    "Yellowish",
    "Dusky",
    "Bluish tint",
    "Uneven tone",
    "Other",
    "Not assessable"
   ]
  },
  {
   "id": "GP-011",
   "category": "Palm",
   "aspect": "Palm perspiration",
   "options": [
    "Dry",
    "Normal",
    "Moist",
    "Excessively moist",
    "Not assessed"
   ]
  },
  {
   "id": "GP-012",
   "category": "Palm",
   "aspect": "Overall palm impression",
   "options": [
    "Balanced",
    "Delicate",
    "Robust",
    "Nervous / fine-lined appearance",
    "Fleshy",
    "Bony",
    "Mixed",
    "Other"
   ]
  },
  {
   "id": "GP-013",
   "category": "Skin",
   "aspect": "Skin texture",
   "options": [
    "Very fine",
    "Fine",
    "Medium",
    "Coarse",
    "Rough",
    "Smooth",
    "Thick",
    "Thin",
    "Mixed"
   ]
  },
  {
   "id": "GP-014",
   "category": "Skin",
   "aspect": "Skin elasticity",
   "options": [
    "High",
    "Good",
    "Moderate",
    "Low",
    "Not assessed"
   ]
  },
  {
   "id": "GP-015",
   "category": "Skin",
   "aspect": "Skin dryness",
   "options": [
    "Dry",
    "Normal",
    "Moist",
    "Very moist",
    "Variable",
    "Not assessed"
   ]
  },
  {
   "id": "GP-016",
   "category": "Skin",
   "aspect": "Skin thickness",
   "options": [
    "Thin",
    "Medium",
    "Thick",
    "Not assessed"
   ]
  },
  {
   "id": "GP-017",
   "category": "Skin",
   "aspect": "Skin markings",
   "options": [
    "No notable marks",
    "Scar",
    "Callus",
    "Mole",
    "Pigmentation",
    "Rash / irritation visible",
    "Wrinkling",
    "Multiple marks",
    "Other"
   ]
  },
  {
   "id": "GP-018",
   "category": "Skin",
   "aspect": "Crease pattern",
   "options": [
    "Fine creases",
    "Deep creases",
    "Dense fine lines",
    "Sparse lines",
    "Coarse creases",
    "Mixed"
   ]
  },
  {
   "id": "GP-019",
   "category": "Hand Type",
   "aspect": "Traditional hand classification",
   "options": [
    "Earth",
    "Air",
    "Fire",
    "Water",
    "Mixed Earth–Air",
    "Mixed Earth–Fire",
    "Mixed Earth–Water",
    "Mixed Air–Fire",
    "Mixed Air–Water",
    "Mixed Fire–Water",
    "Other / uncertain"
   ]
  },
  {
   "id": "GP-020",
   "category": "Hand Type",
   "aspect": "Overall proportion pattern",
   "options": [
    "Square palm / short fingers",
    "Square palm / long fingers",
    "Long palm / short fingers",
    "Long palm / long fingers",
    "Broad palm / short fingers",
    "Broad palm / long fingers",
    "Other"
   ]
  },
  {
   "id": "GP-021",
   "category": "Fingers",
   "aspect": "Jupiter / Index – relative length",
   "options": [
    "Very short",
    "Short",
    "Average",
    "Long",
    "Very long",
    "Compared with other fingers: longer",
    "Compared with other fingers: shorter",
    "Not assessable"
   ]
  },
  {
   "id": "GP-022",
   "category": "Fingers",
   "aspect": "Jupiter / Index – shape",
   "options": [
    "Straight",
    "Slightly curved",
    "Strongly curved",
    "Bent",
    "Crooked",
    "Tapering",
    "Other"
   ]
  },
  {
   "id": "GP-023",
   "category": "Fingers",
   "aspect": "Jupiter / Index – tip shape",
   "options": [
    "Square",
    "Rounded",
    "Conic",
    "Pointed",
    "Spatulate",
    "Clubbed",
    "Mixed",
    "Not clear"
   ]
  },
  {
   "id": "GP-024",
   "category": "Fingers",
   "aspect": "Jupiter / Index – joints",
   "options": [
    "Smooth / non-knotted",
    "Slightly knotted",
    "Pronounced upper joints",
    "Pronounced lower joints",
    "Both joints pronounced",
    "Uneven",
    "Not clear"
   ]
  },
  {
   "id": "GP-025",
   "category": "Fingers",
   "aspect": "Jupiter / Index – spacing",
   "options": [
    "Close-set",
    "Average spacing",
    "Wide-set",
    "Uneven spacing"
   ]
  },
  {
   "id": "GP-026",
   "category": "Fingers",
   "aspect": "Jupiter / Index – inclination",
   "options": [
    "Straight",
    "Leans towards middle finger",
    "Leans away from middle finger",
    "Leans towards ring finger",
    "Leans outward",
    "Other"
   ]
  },
  {
   "id": "GP-027",
   "category": "Fingers",
   "aspect": "Jupiter / Index – flexibility",
   "options": [
    "Very flexible",
    "Flexible",
    "Moderate",
    "Firm",
    "Rigid",
    "Not assessed"
   ]
  },
  {
   "id": "GP-028",
   "category": "Fingers",
   "aspect": "Jupiter / Index – phalange proportion",
   "options": [
    "Upper phalange longer",
    "Middle phalange longer",
    "Lower phalange longer",
    "Balanced",
    "Unequal / unusual",
    "Not assessable"
   ]
  },
  {
   "id": "GP-029",
   "category": "Fingers",
   "aspect": "Saturn / Middle – relative length",
   "options": [
    "Very short",
    "Short",
    "Average",
    "Long",
    "Very long",
    "Compared with other fingers: longer",
    "Compared with other fingers: shorter",
    "Not assessable"
   ]
  },
  {
   "id": "GP-030",
   "category": "Fingers",
   "aspect": "Saturn / Middle – shape",
   "options": [
    "Straight",
    "Slightly curved",
    "Strongly curved",
    "Bent",
    "Crooked",
    "Tapering",
    "Other"
   ]
  },
  {
   "id": "GP-031",
   "category": "Fingers",
   "aspect": "Saturn / Middle – tip shape",
   "options": [
    "Square",
    "Rounded",
    "Conic",
    "Pointed",
    "Spatulate",
    "Clubbed",
    "Mixed",
    "Not clear"
   ]
  },
  {
   "id": "GP-032",
   "category": "Fingers",
   "aspect": "Saturn / Middle – joints",
   "options": [
    "Smooth / non-knotted",
    "Slightly knotted",
    "Pronounced upper joints",
    "Pronounced lower joints",
    "Both joints pronounced",
    "Uneven",
    "Not clear"
   ]
  },
  {
   "id": "GP-033",
   "category": "Fingers",
   "aspect": "Saturn / Middle – spacing",
   "options": [
    "Close-set",
    "Average spacing",
    "Wide-set",
    "Uneven spacing"
   ]
  },
  {
   "id": "GP-034",
   "category": "Fingers",
   "aspect": "Saturn / Middle – inclination",
   "options": [
    "Straight",
    "Leans towards middle finger",
    "Leans away from middle finger",
    "Leans towards ring finger",
    "Leans outward",
    "Other"
   ]
  },
  {
   "id": "GP-035",
   "category": "Fingers",
   "aspect": "Saturn / Middle – flexibility",
   "options": [
    "Very flexible",
    "Flexible",
    "Moderate",
    "Firm",
    "Rigid",
    "Not assessed"
   ]
  },
  {
   "id": "GP-036",
   "category": "Fingers",
   "aspect": "Saturn / Middle – phalange proportion",
   "options": [
    "Upper phalange longer",
    "Middle phalange longer",
    "Lower phalange longer",
    "Balanced",
    "Unequal / unusual",
    "Not assessable"
   ]
  },
  {
   "id": "GP-037",
   "category": "Fingers",
   "aspect": "Apollo / Ring – relative length",
   "options": [
    "Very short",
    "Short",
    "Average",
    "Long",
    "Very long",
    "Compared with other fingers: longer",
    "Compared with other fingers: shorter",
    "Not assessable"
   ]
  },
  {
   "id": "GP-038",
   "category": "Fingers",
   "aspect": "Apollo / Ring – shape",
   "options": [
    "Straight",
    "Slightly curved",
    "Strongly curved",
    "Bent",
    "Crooked",
    "Tapering",
    "Other"
   ]
  },
  {
   "id": "GP-039",
   "category": "Fingers",
   "aspect": "Apollo / Ring – tip shape",
   "options": [
    "Square",
    "Rounded",
    "Conic",
    "Pointed",
    "Spatulate",
    "Clubbed",
    "Mixed",
    "Not clear"
   ]
  },
  {
   "id": "GP-040",
   "category": "Fingers",
   "aspect": "Apollo / Ring – joints",
   "options": [
    "Smooth / non-knotted",
    "Slightly knotted",
    "Pronounced upper joints",
    "Pronounced lower joints",
    "Both joints pronounced",
    "Uneven",
    "Not clear"
   ]
  },
  {
   "id": "GP-041",
   "category": "Fingers",
   "aspect": "Apollo / Ring – spacing",
   "options": [
    "Close-set",
    "Average spacing",
    "Wide-set",
    "Uneven spacing"
   ]
  },
  {
   "id": "GP-042",
   "category": "Fingers",
   "aspect": "Apollo / Ring – inclination",
   "options": [
    "Straight",
    "Leans towards middle finger",
    "Leans away from middle finger",
    "Leans towards ring finger",
    "Leans outward",
    "Other"
   ]
  },
  {
   "id": "GP-043",
   "category": "Fingers",
   "aspect": "Apollo / Ring – flexibility",
   "options": [
    "Very flexible",
    "Flexible",
    "Moderate",
    "Firm",
    "Rigid",
    "Not assessed"
   ]
  },
  {
   "id": "GP-044",
   "category": "Fingers",
   "aspect": "Apollo / Ring – phalange proportion",
   "options": [
    "Upper phalange longer",
    "Middle phalange longer",
    "Lower phalange longer",
    "Balanced",
    "Unequal / unusual",
    "Not assessable"
   ]
  },
  {
   "id": "GP-045",
   "category": "Fingers",
   "aspect": "Mercury / Little – relative length",
   "options": [
    "Very short",
    "Short",
    "Average",
    "Long",
    "Very long",
    "Compared with other fingers: longer",
    "Compared with other fingers: shorter",
    "Not assessable"
   ]
  },
  {
   "id": "GP-046",
   "category": "Fingers",
   "aspect": "Mercury / Little – shape",
   "options": [
    "Straight",
    "Slightly curved",
    "Strongly curved",
    "Bent",
    "Crooked",
    "Tapering",
    "Other"
   ]
  },
  {
   "id": "GP-047",
   "category": "Fingers",
   "aspect": "Mercury / Little – tip shape",
   "options": [
    "Square",
    "Rounded",
    "Conic",
    "Pointed",
    "Spatulate",
    "Clubbed",
    "Mixed",
    "Not clear"
   ]
  },
  {
   "id": "GP-048",
   "category": "Fingers",
   "aspect": "Mercury / Little – joints",
   "options": [
    "Smooth / non-knotted",
    "Slightly knotted",
    "Pronounced upper joints",
    "Pronounced lower joints",
    "Both joints pronounced",
    "Uneven",
    "Not clear"
   ]
  },
  {
   "id": "GP-049",
   "category": "Fingers",
   "aspect": "Mercury / Little – spacing",
   "options": [
    "Close-set",
    "Average spacing",
    "Wide-set",
    "Uneven spacing"
   ]
  },
  {
   "id": "GP-050",
   "category": "Fingers",
   "aspect": "Mercury / Little – inclination",
   "options": [
    "Straight",
    "Leans towards middle finger",
    "Leans away from middle finger",
    "Leans towards ring finger",
    "Leans outward",
    "Other"
   ]
  },
  {
   "id": "GP-051",
   "category": "Fingers",
   "aspect": "Mercury / Little – flexibility",
   "options": [
    "Very flexible",
    "Flexible",
    "Moderate",
    "Firm",
    "Rigid",
    "Not assessed"
   ]
  },
  {
   "id": "GP-052",
   "category": "Fingers",
   "aspect": "Mercury / Little – phalange proportion",
   "options": [
    "Upper phalange longer",
    "Middle phalange longer",
    "Lower phalange longer",
    "Balanced",
    "Unequal / unusual",
    "Not assessable"
   ]
  },
  {
   "id": "GP-053",
   "category": "Thumb",
   "aspect": "Thumb length",
   "options": [
    "Very short",
    "Short",
    "Average",
    "Long",
    "Very long",
    "Not assessable"
   ]
  },
  {
   "id": "GP-054",
   "category": "Thumb",
   "aspect": "Thumb setting",
   "options": [
    "High set",
    "Medium set",
    "Low set",
    "Not clear"
   ]
  },
  {
   "id": "GP-055",
   "category": "Thumb",
   "aspect": "Thumb opening angle",
   "options": [
    "Narrow",
    "Moderate",
    "Wide",
    "Very wide",
    "Not assessed"
   ]
  },
  {
   "id": "GP-056",
   "category": "Thumb",
   "aspect": "Thumb flexibility",
   "options": [
    "Very flexible",
    "Flexible",
    "Moderate",
    "Firm",
    "Rigid",
    "Not assessed"
   ]
  },
  {
   "id": "GP-057",
   "category": "Thumb",
   "aspect": "Thumb tip shape",
   "options": [
    "Square",
    "Rounded",
    "Conic",
    "Spatulate",
    "Pointed",
    "Other"
   ]
  },
  {
   "id": "GP-058",
   "category": "Thumb",
   "aspect": "Upper phalange (will) proportion",
   "options": [
    "Short",
    "Average",
    "Long",
    "Very long",
    "Balanced / proportionate",
    "Not assessable"
   ]
  },
  {
   "id": "GP-059",
   "category": "Thumb",
   "aspect": "Lower phalange (logic) proportion",
   "options": [
    "Short",
    "Average",
    "Long",
    "Very long",
    "Balanced / proportionate",
    "Not assessable"
   ]
  },
  {
   "id": "GP-060",
   "category": "Thumb",
   "aspect": "Thumb phalange ratio",
   "options": [
    "Upper longer",
    "Lower longer",
    "Approximately equal",
    "Not assessable"
   ]
  },
  {
   "id": "GP-061",
   "category": "Thumb",
   "aspect": "Thumb base / mount of Venus",
   "options": [
    "Well developed",
    "Moderate",
    "Flat",
    "Very full",
    "Not assessable"
   ]
  },
  {
   "id": "GP-062",
   "category": "Thumb",
   "aspect": "Thumb markings",
   "options": [
    "None notable",
    "Fine lines",
    "Cross",
    "Scar",
    "Other",
    "Unclear"
   ]
  },
  {
   "id": "GP-063",
   "category": "Mounts",
   "aspect": "Jupiter – development",
   "options": [
    "Flat",
    "Underdeveloped",
    "Normal / balanced",
    "Well developed",
    "Prominent",
    "Excessively prominent",
    "Uneven",
    "Not assessable"
   ]
  },
  {
   "id": "GP-064",
   "category": "Mounts",
   "aspect": "Jupiter – firmness",
   "options": [
    "Soft",
    "Medium",
    "Firm",
    "Hard",
    "Not assessed"
   ]
  },
  {
   "id": "GP-065",
   "category": "Mounts",
   "aspect": "Jupiter – texture",
   "options": [
    "Smooth",
    "Fine-lined",
    "Coarse-lined",
    "Grilled",
    "Mixed",
    "Not assessable"
   ]
  },
  {
   "id": "GP-066",
   "category": "Mounts",
   "aspect": "Jupiter – markings",
   "options": [
    "None notable",
    "Vertical lines",
    "Horizontal lines",
    "Cross",
    "Star",
    "Square",
    "Triangle",
    "Grille",
    "Island",
    "Circle",
    "Trident",
    "Multiple / mixed",
    "Other",
    "Unclear"
   ]
  },
  {
   "id": "GP-067",
   "category": "Mounts",
   "aspect": "Saturn – development",
   "options": [
    "Flat",
    "Underdeveloped",
    "Normal / balanced",
    "Well developed",
    "Prominent",
    "Excessively prominent",
    "Uneven",
    "Not assessable"
   ]
  },
  {
   "id": "GP-068",
   "category": "Mounts",
   "aspect": "Saturn – firmness",
   "options": [
    "Soft",
    "Medium",
    "Firm",
    "Hard",
    "Not assessed"
   ]
  },
  {
   "id": "GP-069",
   "category": "Mounts",
   "aspect": "Saturn – texture",
   "options": [
    "Smooth",
    "Fine-lined",
    "Coarse-lined",
    "Grilled",
    "Mixed",
    "Not assessable"
   ]
  },
  {
   "id": "GP-070",
   "category": "Mounts",
   "aspect": "Saturn – markings",
   "options": [
    "None notable",
    "Vertical lines",
    "Horizontal lines",
    "Cross",
    "Star",
    "Square",
    "Triangle",
    "Grille",
    "Island",
    "Circle",
    "Trident",
    "Multiple / mixed",
    "Other",
    "Unclear"
   ]
  },
  {
   "id": "GP-071",
   "category": "Mounts",
   "aspect": "Apollo / Sun – development",
   "options": [
    "Flat",
    "Underdeveloped",
    "Normal / balanced",
    "Well developed",
    "Prominent",
    "Excessively prominent",
    "Uneven",
    "Not assessable"
   ]
  },
  {
   "id": "GP-072",
   "category": "Mounts",
   "aspect": "Apollo / Sun – firmness",
   "options": [
    "Soft",
    "Medium",
    "Firm",
    "Hard",
    "Not assessed"
   ]
  },
  {
   "id": "GP-073",
   "category": "Mounts",
   "aspect": "Apollo / Sun – texture",
   "options": [
    "Smooth",
    "Fine-lined",
    "Coarse-lined",
    "Grilled",
    "Mixed",
    "Not assessable"
   ]
  },
  {
   "id": "GP-074",
   "category": "Mounts",
   "aspect": "Apollo / Sun – markings",
   "options": [
    "None notable",
    "Vertical lines",
    "Horizontal lines",
    "Cross",
    "Star",
    "Square",
    "Triangle",
    "Grille",
    "Island",
    "Circle",
    "Trident",
    "Multiple / mixed",
    "Other",
    "Unclear"
   ]
  },
  {
   "id": "GP-075",
   "category": "Mounts",
   "aspect": "Mercury – development",
   "options": [
    "Flat",
    "Underdeveloped",
    "Normal / balanced",
    "Well developed",
    "Prominent",
    "Excessively prominent",
    "Uneven",
    "Not assessable"
   ]
  },
  {
   "id": "GP-076",
   "category": "Mounts",
   "aspect": "Mercury – firmness",
   "options": [
    "Soft",
    "Medium",
    "Firm",
    "Hard",
    "Not assessed"
   ]
  },
  {
   "id": "GP-077",
   "category": "Mounts",
   "aspect": "Mercury – texture",
   "options": [
    "Smooth",
    "Fine-lined",
    "Coarse-lined",
    "Grilled",
    "Mixed",
    "Not assessable"
   ]
  },
  {
   "id": "GP-078",
   "category": "Mounts",
   "aspect": "Mercury – markings",
   "options": [
    "None notable",
    "Vertical lines",
    "Horizontal lines",
    "Cross",
    "Star",
    "Square",
    "Triangle",
    "Grille",
    "Island",
    "Circle",
    "Trident",
    "Multiple / mixed",
    "Other",
    "Unclear"
   ]
  },
  {
   "id": "GP-079",
   "category": "Mounts",
   "aspect": "Venus – development",
   "options": [
    "Flat",
    "Underdeveloped",
    "Normal / balanced",
    "Well developed",
    "Prominent",
    "Excessively prominent",
    "Uneven",
    "Not assessable"
   ]
  },
  {
   "id": "GP-080",
   "category": "Mounts",
   "aspect": "Venus – firmness",
   "options": [
    "Soft",
    "Medium",
    "Firm",
    "Hard",
    "Not assessed"
   ]
  },
  {
   "id": "GP-081",
   "category": "Mounts",
   "aspect": "Venus – texture",
   "options": [
    "Smooth",
    "Fine-lined",
    "Coarse-lined",
    "Grilled",
    "Mixed",
    "Not assessable"
   ]
  },
  {
   "id": "GP-082",
   "category": "Mounts",
   "aspect": "Venus – markings",
   "options": [
    "None notable",
    "Vertical lines",
    "Horizontal lines",
    "Cross",
    "Star",
    "Square",
    "Triangle",
    "Grille",
    "Island",
    "Circle",
    "Trident",
    "Multiple / mixed",
    "Other",
    "Unclear"
   ]
  },
  {
   "id": "GP-083",
   "category": "Mounts",
   "aspect": "Upper Mars – development",
   "options": [
    "Flat",
    "Underdeveloped",
    "Normal / balanced",
    "Well developed",
    "Prominent",
    "Excessively prominent",
    "Uneven",
    "Not assessable"
   ]
  },
  {
   "id": "GP-084",
   "category": "Mounts",
   "aspect": "Upper Mars – firmness",
   "options": [
    "Soft",
    "Medium",
    "Firm",
    "Hard",
    "Not assessed"
   ]
  },
  {
   "id": "GP-085",
   "category": "Mounts",
   "aspect": "Upper Mars – texture",
   "options": [
    "Smooth",
    "Fine-lined",
    "Coarse-lined",
    "Grilled",
    "Mixed",
    "Not assessable"
   ]
  },
  {
   "id": "GP-086",
   "category": "Mounts",
   "aspect": "Upper Mars – markings",
   "options": [
    "None notable",
    "Vertical lines",
    "Horizontal lines",
    "Cross",
    "Star",
    "Square",
    "Triangle",
    "Grille",
    "Island",
    "Circle",
    "Trident",
    "Multiple / mixed",
    "Other",
    "Unclear"
   ]
  },
  {
   "id": "GP-087",
   "category": "Mounts",
   "aspect": "Lower Mars – development",
   "options": [
    "Flat",
    "Underdeveloped",
    "Normal / balanced",
    "Well developed",
    "Prominent",
    "Excessively prominent",
    "Uneven",
    "Not assessable"
   ]
  },
  {
   "id": "GP-088",
   "category": "Mounts",
   "aspect": "Lower Mars – firmness",
   "options": [
    "Soft",
    "Medium",
    "Firm",
    "Hard",
    "Not assessed"
   ]
  },
  {
   "id": "GP-089",
   "category": "Mounts",
   "aspect": "Lower Mars – texture",
   "options": [
    "Smooth",
    "Fine-lined",
    "Coarse-lined",
    "Grilled",
    "Mixed",
    "Not assessable"
   ]
  },
  {
   "id": "GP-090",
   "category": "Mounts",
   "aspect": "Lower Mars – markings",
   "options": [
    "None notable",
    "Vertical lines",
    "Horizontal lines",
    "Cross",
    "Star",
    "Square",
    "Triangle",
    "Grille",
    "Island",
    "Circle",
    "Trident",
    "Multiple / mixed",
    "Other",
    "Unclear"
   ]
  },
  {
   "id": "GP-091",
   "category": "Mounts",
   "aspect": "Moon / Luna – development",
   "options": [
    "Flat",
    "Underdeveloped",
    "Normal / balanced",
    "Well developed",
    "Prominent",
    "Excessively prominent",
    "Uneven",
    "Not assessable"
   ]
  },
  {
   "id": "GP-092",
   "category": "Mounts",
   "aspect": "Moon / Luna – firmness",
   "options": [
    "Soft",
    "Medium",
    "Firm",
    "Hard",
    "Not assessed"
   ]
  },
  {
   "id": "GP-093",
   "category": "Mounts",
   "aspect": "Moon / Luna – texture",
   "options": [
    "Smooth",
    "Fine-lined",
    "Coarse-lined",
    "Grilled",
    "Mixed",
    "Not assessable"
   ]
  },
  {
   "id": "GP-094",
   "category": "Mounts",
   "aspect": "Moon / Luna – markings",
   "options": [
    "None notable",
    "Vertical lines",
    "Horizontal lines",
    "Cross",
    "Star",
    "Square",
    "Triangle",
    "Grille",
    "Island",
    "Circle",
    "Trident",
    "Multiple / mixed",
    "Other",
    "Unclear"
   ]
  },
  {
   "id": "GP-095",
   "category": "Mounts",
   "aspect": "Plain of Mars – development",
   "options": [
    "Flat",
    "Underdeveloped",
    "Normal / balanced",
    "Well developed",
    "Prominent",
    "Excessively prominent",
    "Uneven",
    "Not assessable"
   ]
  },
  {
   "id": "GP-096",
   "category": "Mounts",
   "aspect": "Plain of Mars – firmness",
   "options": [
    "Soft",
    "Medium",
    "Firm",
    "Hard",
    "Not assessed"
   ]
  },
  {
   "id": "GP-097",
   "category": "Mounts",
   "aspect": "Plain of Mars – texture",
   "options": [
    "Smooth",
    "Fine-lined",
    "Coarse-lined",
    "Grilled",
    "Mixed",
    "Not assessable"
   ]
  },
  {
   "id": "GP-098",
   "category": "Mounts",
   "aspect": "Plain of Mars – markings",
   "options": [
    "None notable",
    "Vertical lines",
    "Horizontal lines",
    "Cross",
    "Star",
    "Square",
    "Triangle",
    "Grille",
    "Island",
    "Circle",
    "Trident",
    "Multiple / mixed",
    "Other",
    "Unclear"
   ]
  },
  {
   "id": "GP-099",
   "category": "Major Lines",
   "aspect": "Life Line – visibility",
   "options": [
    "Absent / not seen",
    "Faint",
    "Moderately visible",
    "Clear",
    "Deep / prominent",
    "Fragmented",
    "Unclear"
   ]
  },
  {
   "id": "GP-100",
   "category": "Major Lines",
   "aspect": "Life Line – length",
   "options": [
    "Short",
    "Medium",
    "Long",
    "Very long",
    "Partial / cannot determine",
    "Not assessable"
   ]
  },
  {
   "id": "GP-101",
   "category": "Major Lines",
   "aspect": "Life Line – depth",
   "options": [
    "Very shallow",
    "Shallow",
    "Medium",
    "Deep",
    "Variable",
    "Not assessable"
   ]
  },
  {
   "id": "GP-102",
   "category": "Major Lines",
   "aspect": "Life Line – course",
   "options": [
    "Straight",
    "Gently curved",
    "Strongly curved",
    "Sloping downward",
    "Sloping upward",
    "Wavy",
    "Irregular",
    "Mixed",
    "Not assessable"
   ]
  },
  {
   "id": "GP-103",
   "category": "Major Lines",
   "aspect": "Life Line – continuity",
   "options": [
    "Unbroken",
    "Broken once",
    "Multiple breaks",
    "Chained",
    "Fragmented",
    "Islanded",
    "Faint / intermittent",
    "Not assessable"
   ]
  },
  {
   "id": "GP-104",
   "category": "Major Lines",
   "aspect": "Life Line – origin",
   "options": [
    "From inside / joined to adjacent line",
    "Separate origin",
    "From Mount of Jupiter",
    "From Mount of Moon",
    "From Mount of Venus",
    "From wrist / Rascettes",
    "From Plain of Mars",
    "Other",
    "Not clear"
   ]
  },
  {
   "id": "GP-105",
   "category": "Major Lines",
   "aspect": "Life Line – termination",
   "options": [
    "Towards Jupiter",
    "Towards Saturn",
    "Towards Apollo",
    "Towards Mercury",
    "Towards Mount of Moon",
    "Towards outer edge",
    "Towards wrist",
    "Forked ending",
    "Faded / indistinct",
    "Other",
    "Not clear"
   ]
  },
  {
   "id": "GP-106",
   "category": "Major Lines",
   "aspect": "Life Line – branches",
   "options": [
    "None visible",
    "Upward branches",
    "Downward branches",
    "Both upward and downward",
    "Fork at end",
    "Multiple branches",
    "Unclear"
   ]
  },
  {
   "id": "GP-107",
   "category": "Major Lines",
   "aspect": "Life Line – associated markings",
   "options": [
    "None notable",
    "Island",
    "Cross",
    "Star",
    "Square",
    "Triangle",
    "Break",
    "Chain",
    "Dot",
    "Fork",
    "Trident",
    "Multiple / mixed",
    "Other",
    "Unclear"
   ]
  },
  {
   "id": "GP-108",
   "category": "Major Lines",
   "aspect": "Head Line – visibility",
   "options": [
    "Absent / not seen",
    "Faint",
    "Moderately visible",
    "Clear",
    "Deep / prominent",
    "Fragmented",
    "Unclear"
   ]
  },
  {
   "id": "GP-109",
   "category": "Major Lines",
   "aspect": "Head Line – length",
   "options": [
    "Short",
    "Medium",
    "Long",
    "Very long",
    "Partial / cannot determine",
    "Not assessable"
   ]
  },
  {
   "id": "GP-110",
   "category": "Major Lines",
   "aspect": "Head Line – depth",
   "options": [
    "Very shallow",
    "Shallow",
    "Medium",
    "Deep",
    "Variable",
    "Not assessable"
   ]
  },
  {
   "id": "GP-111",
   "category": "Major Lines",
   "aspect": "Head Line – course",
   "options": [
    "Straight",
    "Gently curved",
    "Strongly curved",
    "Sloping downward",
    "Sloping upward",
    "Wavy",
    "Irregular",
    "Mixed",
    "Not assessable"
   ]
  },
  {
   "id": "GP-112",
   "category": "Major Lines",
   "aspect": "Head Line – continuity",
   "options": [
    "Unbroken",
    "Broken once",
    "Multiple breaks",
    "Chained",
    "Fragmented",
    "Islanded",
    "Faint / intermittent",
    "Not assessable"
   ]
  },
  {
   "id": "GP-113",
   "category": "Major Lines",
   "aspect": "Head Line – origin",
   "options": [
    "From inside / joined to adjacent line",
    "Separate origin",
    "From Mount of Jupiter",
    "From Mount of Moon",
    "From Mount of Venus",
    "From wrist / Rascettes",
    "From Plain of Mars",
    "Other",
    "Not clear"
   ]
  },
  {
   "id": "GP-114",
   "category": "Major Lines",
   "aspect": "Head Line – termination",
   "options": [
    "Towards Jupiter",
    "Towards Saturn",
    "Towards Apollo",
    "Towards Mercury",
    "Towards Mount of Moon",
    "Towards outer edge",
    "Towards wrist",
    "Forked ending",
    "Faded / indistinct",
    "Other",
    "Not clear"
   ]
  },
  {
   "id": "GP-115",
   "category": "Major Lines",
   "aspect": "Head Line – branches",
   "options": [
    "None visible",
    "Upward branches",
    "Downward branches",
    "Both upward and downward",
    "Fork at end",
    "Multiple branches",
    "Unclear"
   ]
  },
  {
   "id": "GP-116",
   "category": "Major Lines",
   "aspect": "Head Line – associated markings",
   "options": [
    "None notable",
    "Island",
    "Cross",
    "Star",
    "Square",
    "Triangle",
    "Break",
    "Chain",
    "Dot",
    "Fork",
    "Trident",
    "Multiple / mixed",
    "Other",
    "Unclear"
   ]
  },
  {
   "id": "GP-117",
   "category": "Major Lines",
   "aspect": "Heart Line – visibility",
   "options": [
    "Absent / not seen",
    "Faint",
    "Moderately visible",
    "Clear",
    "Deep / prominent",
    "Fragmented",
    "Unclear"
   ]
  },
  {
   "id": "GP-118",
   "category": "Major Lines",
   "aspect": "Heart Line – length",
   "options": [
    "Short",
    "Medium",
    "Long",
    "Very long",
    "Partial / cannot determine",
    "Not assessable"
   ]
  },
  {
   "id": "GP-119",
   "category": "Major Lines",
   "aspect": "Heart Line – depth",
   "options": [
    "Very shallow",
    "Shallow",
    "Medium",
    "Deep",
    "Variable",
    "Not assessable"
   ]
  },
  {
   "id": "GP-120",
   "category": "Major Lines",
   "aspect": "Heart Line – course",
   "options": [
    "Straight",
    "Gently curved",
    "Strongly curved",
    "Sloping downward",
    "Sloping upward",
    "Wavy",
    "Irregular",
    "Mixed",
    "Not assessable"
   ]
  },
  {
   "id": "GP-121",
   "category": "Major Lines",
   "aspect": "Heart Line – continuity",
   "options": [
    "Unbroken",
    "Broken once",
    "Multiple breaks",
    "Chained",
    "Fragmented",
    "Islanded",
    "Faint / intermittent",
    "Not assessable"
   ]
  },
  {
   "id": "GP-122",
   "category": "Major Lines",
   "aspect": "Heart Line – origin",
   "options": [
    "From inside / joined to adjacent line",
    "Separate origin",
    "From Mount of Jupiter",
    "From Mount of Moon",
    "From Mount of Venus",
    "From wrist / Rascettes",
    "From Plain of Mars",
    "Other",
    "Not clear"
   ]
  },
  {
   "id": "GP-123",
   "category": "Major Lines",
   "aspect": "Heart Line – termination",
   "options": [
    "Towards Jupiter",
    "Towards Saturn",
    "Towards Apollo",
    "Towards Mercury",
    "Towards Mount of Moon",
    "Towards outer edge",
    "Towards wrist",
    "Forked ending",
    "Faded / indistinct",
    "Other",
    "Not clear"
   ]
  },
  {
   "id": "GP-124",
   "category": "Major Lines",
   "aspect": "Heart Line – branches",
   "options": [
    "None visible",
    "Upward branches",
    "Downward branches",
    "Both upward and downward",
    "Fork at end",
    "Multiple branches",
    "Unclear"
   ]
  },
  {
   "id": "GP-125",
   "category": "Major Lines",
   "aspect": "Heart Line – associated markings",
   "options": [
    "None notable",
    "Island",
    "Cross",
    "Star",
    "Square",
    "Triangle",
    "Break",
    "Chain",
    "Dot",
    "Fork",
    "Trident",
    "Multiple / mixed",
    "Other",
    "Unclear"
   ]
  },
  {
   "id": "GP-126",
   "category": "Major Lines",
   "aspect": "Fate Line – visibility",
   "options": [
    "Absent / not seen",
    "Faint",
    "Moderately visible",
    "Clear",
    "Deep / prominent",
    "Fragmented",
    "Unclear"
   ]
  },
  {
   "id": "GP-127",
   "category": "Major Lines",
   "aspect": "Fate Line – length",
   "options": [
    "Short",
    "Medium",
    "Long",
    "Very long",
    "Partial / cannot determine",
    "Not assessable"
   ]
  },
  {
   "id": "GP-128",
   "category": "Major Lines",
   "aspect": "Fate Line – depth",
   "options": [
    "Very shallow",
    "Shallow",
    "Medium",
    "Deep",
    "Variable",
    "Not assessable"
   ]
  },
  {
   "id": "GP-129",
   "category": "Major Lines",
   "aspect": "Fate Line – course",
   "options": [
    "Straight",
    "Gently curved",
    "Strongly curved",
    "Sloping downward",
    "Sloping upward",
    "Wavy",
    "Irregular",
    "Mixed",
    "Not assessable"
   ]
  },
  {
   "id": "GP-130",
   "category": "Major Lines",
   "aspect": "Fate Line – continuity",
   "options": [
    "Unbroken",
    "Broken once",
    "Multiple breaks",
    "Chained",
    "Fragmented",
    "Islanded",
    "Faint / intermittent",
    "Not assessable"
   ]
  },
  {
   "id": "GP-131",
   "category": "Major Lines",
   "aspect": "Fate Line – origin",
   "options": [
    "From inside / joined to adjacent line",
    "Separate origin",
    "From Mount of Jupiter",
    "From Mount of Moon",
    "From Mount of Venus",
    "From wrist / Rascettes",
    "From Plain of Mars",
    "Other",
    "Not clear"
   ]
  },
  {
   "id": "GP-132",
   "category": "Major Lines",
   "aspect": "Fate Line – termination",
   "options": [
    "Towards Jupiter",
    "Towards Saturn",
    "Towards Apollo",
    "Towards Mercury",
    "Towards Mount of Moon",
    "Towards outer edge",
    "Towards wrist",
    "Forked ending",
    "Faded / indistinct",
    "Other",
    "Not clear"
   ]
  },
  {
   "id": "GP-133",
   "category": "Major Lines",
   "aspect": "Fate Line – branches",
   "options": [
    "None visible",
    "Upward branches",
    "Downward branches",
    "Both upward and downward",
    "Fork at end",
    "Multiple branches",
    "Unclear"
   ]
  },
  {
   "id": "GP-134",
   "category": "Major Lines",
   "aspect": "Fate Line – associated markings",
   "options": [
    "None notable",
    "Island",
    "Cross",
    "Star",
    "Square",
    "Triangle",
    "Break",
    "Chain",
    "Dot",
    "Fork",
    "Trident",
    "Multiple / mixed",
    "Other",
    "Unclear"
   ]
  },
  {
   "id": "GP-135",
   "category": "Major Lines",
   "aspect": "Sun / Apollo Line – visibility",
   "options": [
    "Absent / not seen",
    "Faint",
    "Moderately visible",
    "Clear",
    "Deep / prominent",
    "Fragmented",
    "Unclear"
   ]
  },
  {
   "id": "GP-136",
   "category": "Major Lines",
   "aspect": "Sun / Apollo Line – length",
   "options": [
    "Short",
    "Medium",
    "Long",
    "Very long",
    "Partial / cannot determine",
    "Not assessable"
   ]
  },
  {
   "id": "GP-137",
   "category": "Major Lines",
   "aspect": "Sun / Apollo Line – depth",
   "options": [
    "Very shallow",
    "Shallow",
    "Medium",
    "Deep",
    "Variable",
    "Not assessable"
   ]
  },
  {
   "id": "GP-138",
   "category": "Major Lines",
   "aspect": "Sun / Apollo Line – course",
   "options": [
    "Straight",
    "Gently curved",
    "Strongly curved",
    "Sloping downward",
    "Sloping upward",
    "Wavy",
    "Irregular",
    "Mixed",
    "Not assessable"
   ]
  },
  {
   "id": "GP-139",
   "category": "Major Lines",
   "aspect": "Sun / Apollo Line – continuity",
   "options": [
    "Unbroken",
    "Broken once",
    "Multiple breaks",
    "Chained",
    "Fragmented",
    "Islanded",
    "Faint / intermittent",
    "Not assessable"
   ]
  },
  {
   "id": "GP-140",
   "category": "Major Lines",
   "aspect": "Sun / Apollo Line – origin",
   "options": [
    "From inside / joined to adjacent line",
    "Separate origin",
    "From Mount of Jupiter",
    "From Mount of Moon",
    "From Mount of Venus",
    "From wrist / Rascettes",
    "From Plain of Mars",
    "Other",
    "Not clear"
   ]
  },
  {
   "id": "GP-141",
   "category": "Major Lines",
   "aspect": "Sun / Apollo Line – termination",
   "options": [
    "Towards Jupiter",
    "Towards Saturn",
    "Towards Apollo",
    "Towards Mercury",
    "Towards Mount of Moon",
    "Towards outer edge",
    "Towards wrist",
    "Forked ending",
    "Faded / indistinct",
    "Other",
    "Not clear"
   ]
  },
  {
   "id": "GP-142",
   "category": "Major Lines",
   "aspect": "Sun / Apollo Line – branches",
   "options": [
    "None visible",
    "Upward branches",
    "Downward branches",
    "Both upward and downward",
    "Fork at end",
    "Multiple branches",
    "Unclear"
   ]
  },
  {
   "id": "GP-143",
   "category": "Major Lines",
   "aspect": "Sun / Apollo Line – associated markings",
   "options": [
    "None notable",
    "Island",
    "Cross",
    "Star",
    "Square",
    "Triangle",
    "Break",
    "Chain",
    "Dot",
    "Fork",
    "Trident",
    "Multiple / mixed",
    "Other",
    "Unclear"
   ]
  },
  {
   "id": "GP-144",
   "category": "Major Lines",
   "aspect": "Mercury / Health Line – visibility",
   "options": [
    "Absent / not seen",
    "Faint",
    "Moderately visible",
    "Clear",
    "Deep / prominent",
    "Fragmented",
    "Unclear"
   ]
  },
  {
   "id": "GP-145",
   "category": "Major Lines",
   "aspect": "Mercury / Health Line – length",
   "options": [
    "Short",
    "Medium",
    "Long",
    "Very long",
    "Partial / cannot determine",
    "Not assessable"
   ]
  },
  {
   "id": "GP-146",
   "category": "Major Lines",
   "aspect": "Mercury / Health Line – depth",
   "options": [
    "Very shallow",
    "Shallow",
    "Medium",
    "Deep",
    "Variable",
    "Not assessable"
   ]
  },
  {
   "id": "GP-147",
   "category": "Major Lines",
   "aspect": "Mercury / Health Line – course",
   "options": [
    "Straight",
    "Gently curved",
    "Strongly curved",
    "Sloping downward",
    "Sloping upward",
    "Wavy",
    "Irregular",
    "Mixed",
    "Not assessable"
   ]
  },
  {
   "id": "GP-148",
   "category": "Major Lines",
   "aspect": "Mercury / Health Line – continuity",
   "options": [
    "Unbroken",
    "Broken once",
    "Multiple breaks",
    "Chained",
    "Fragmented",
    "Islanded",
    "Faint / intermittent",
    "Not assessable"
   ]
  },
  {
   "id": "GP-149",
   "category": "Major Lines",
   "aspect": "Mercury / Health Line – origin",
   "options": [
    "From inside / joined to adjacent line",
    "Separate origin",
    "From Mount of Jupiter",
    "From Mount of Moon",
    "From Mount of Venus",
    "From wrist / Rascettes",
    "From Plain of Mars",
    "Other",
    "Not clear"
   ]
  },
  {
   "id": "GP-150",
   "category": "Major Lines",
   "aspect": "Mercury / Health Line – termination",
   "options": [
    "Towards Jupiter",
    "Towards Saturn",
    "Towards Apollo",
    "Towards Mercury",
    "Towards Mount of Moon",
    "Towards outer edge",
    "Towards wrist",
    "Forked ending",
    "Faded / indistinct",
    "Other",
    "Not clear"
   ]
  },
  {
   "id": "GP-151",
   "category": "Major Lines",
   "aspect": "Mercury / Health Line – branches",
   "options": [
    "None visible",
    "Upward branches",
    "Downward branches",
    "Both upward and downward",
    "Fork at end",
    "Multiple branches",
    "Unclear"
   ]
  },
  {
   "id": "GP-152",
   "category": "Major Lines",
   "aspect": "Mercury / Health Line – associated markings",
   "options": [
    "None notable",
    "Island",
    "Cross",
    "Star",
    "Square",
    "Triangle",
    "Break",
    "Chain",
    "Dot",
    "Fork",
    "Trident",
    "Multiple / mixed",
    "Other",
    "Unclear"
   ]
  },
  {
   "id": "GP-153",
   "category": "Major Lines",
   "aspect": "Head–Life line relationship",
   "options": [
    "Joined at origin",
    "Slightly separated at origin",
    "Widely separated at origin",
    "Crossing / overlapping",
    "Unclear"
   ]
  },
  {
   "id": "GP-154",
   "category": "Major Lines",
   "aspect": "Heart–Head line spacing",
   "options": [
    "Wide gap",
    "Moderate gap",
    "Narrow gap",
    "Nearly joined",
    "Unclear"
   ]
  },
  {
   "id": "GP-155",
   "category": "Major Lines",
   "aspect": "Fate line interaction",
   "options": [
    "Crosses Head Line",
    "Crosses Heart Line",
    "Touches major line",
    "Runs independently",
    "Multiple interactions",
    "Not visible"
   ]
  },
  {
   "id": "GP-156",
   "category": "Minor Lines",
   "aspect": "Relationship / Union Lines – presence",
   "options": [
    "Not visible",
    "One",
    "Two",
    "Three",
    "More than three",
    "Present but unclear",
    "Not assessed"
   ]
  },
  {
   "id": "GP-157",
   "category": "Minor Lines",
   "aspect": "Relationship / Union Lines – clarity",
   "options": [
    "Faint",
    "Moderate",
    "Clear",
    "Deep",
    "Fragmented",
    "Not assessable"
   ]
  },
  {
   "id": "GP-158",
   "category": "Minor Lines",
   "aspect": "Relationship / Union Lines – formation",
   "options": [
    "Straight",
    "Curved",
    "Forked",
    "Chained",
    "Broken",
    "Wavy",
    "Vertical",
    "Horizontal",
    "Multiple / mixed",
    "Other",
    "Not clear"
   ]
  },
  {
   "id": "GP-159",
   "category": "Minor Lines",
   "aspect": "Relationship / Union Lines – length",
   "options": [
    "Short",
    "Medium",
    "Long",
    "Very long",
    "Partial / unclear"
   ]
  },
  {
   "id": "GP-160",
   "category": "Minor Lines",
   "aspect": "Relationship / Union Lines – markings",
   "options": [
    "None notable",
    "Cross",
    "Star",
    "Square",
    "Island",
    "Fork",
    "Break",
    "Dot",
    "Multiple / mixed",
    "Other",
    "Unclear"
   ]
  },
  {
   "id": "GP-161",
   "category": "Minor Lines",
   "aspect": "Children Lines – presence",
   "options": [
    "Not visible",
    "One",
    "Two",
    "Three",
    "More than three",
    "Present but unclear",
    "Not assessed"
   ]
  },
  {
   "id": "GP-162",
   "category": "Minor Lines",
   "aspect": "Children Lines – clarity",
   "options": [
    "Faint",
    "Moderate",
    "Clear",
    "Deep",
    "Fragmented",
    "Not assessable"
   ]
  },
  {
   "id": "GP-163",
   "category": "Minor Lines",
   "aspect": "Children Lines – formation",
   "options": [
    "Straight",
    "Curved",
    "Forked",
    "Chained",
    "Broken",
    "Wavy",
    "Vertical",
    "Horizontal",
    "Multiple / mixed",
    "Other",
    "Not clear"
   ]
  },
  {
   "id": "GP-164",
   "category": "Minor Lines",
   "aspect": "Children Lines – length",
   "options": [
    "Short",
    "Medium",
    "Long",
    "Very long",
    "Partial / unclear"
   ]
  },
  {
   "id": "GP-165",
   "category": "Minor Lines",
   "aspect": "Children Lines – markings",
   "options": [
    "None notable",
    "Cross",
    "Star",
    "Square",
    "Island",
    "Fork",
    "Break",
    "Dot",
    "Multiple / mixed",
    "Other",
    "Unclear"
   ]
  },
  {
   "id": "GP-166",
   "category": "Minor Lines",
   "aspect": "Travel Lines – presence",
   "options": [
    "Not visible",
    "One",
    "Two",
    "Three",
    "More than three",
    "Present but unclear",
    "Not assessed"
   ]
  },
  {
   "id": "GP-167",
   "category": "Minor Lines",
   "aspect": "Travel Lines – clarity",
   "options": [
    "Faint",
    "Moderate",
    "Clear",
    "Deep",
    "Fragmented",
    "Not assessable"
   ]
  },
  {
   "id": "GP-168",
   "category": "Minor Lines",
   "aspect": "Travel Lines – formation",
   "options": [
    "Straight",
    "Curved",
    "Forked",
    "Chained",
    "Broken",
    "Wavy",
    "Vertical",
    "Horizontal",
    "Multiple / mixed",
    "Other",
    "Not clear"
   ]
  },
  {
   "id": "GP-169",
   "category": "Minor Lines",
   "aspect": "Travel Lines – length",
   "options": [
    "Short",
    "Medium",
    "Long",
    "Very long",
    "Partial / unclear"
   ]
  },
  {
   "id": "GP-170",
   "category": "Minor Lines",
   "aspect": "Travel Lines – markings",
   "options": [
    "None notable",
    "Cross",
    "Star",
    "Square",
    "Island",
    "Fork",
    "Break",
    "Dot",
    "Multiple / mixed",
    "Other",
    "Unclear"
   ]
  },
  {
   "id": "GP-171",
   "category": "Minor Lines",
   "aspect": "Intuition Line – presence",
   "options": [
    "Not visible",
    "One",
    "Two",
    "Three",
    "More than three",
    "Present but unclear",
    "Not assessed"
   ]
  },
  {
   "id": "GP-172",
   "category": "Minor Lines",
   "aspect": "Intuition Line – clarity",
   "options": [
    "Faint",
    "Moderate",
    "Clear",
    "Deep",
    "Fragmented",
    "Not assessable"
   ]
  },
  {
   "id": "GP-173",
   "category": "Minor Lines",
   "aspect": "Intuition Line – formation",
   "options": [
    "Straight",
    "Curved",
    "Forked",
    "Chained",
    "Broken",
    "Wavy",
    "Vertical",
    "Horizontal",
    "Multiple / mixed",
    "Other",
    "Not clear"
   ]
  },
  {
   "id": "GP-174",
   "category": "Minor Lines",
   "aspect": "Intuition Line – length",
   "options": [
    "Short",
    "Medium",
    "Long",
    "Very long",
    "Partial / unclear"
   ]
  },
  {
   "id": "GP-175",
   "category": "Minor Lines",
   "aspect": "Intuition Line – markings",
   "options": [
    "None notable",
    "Cross",
    "Star",
    "Square",
    "Island",
    "Fork",
    "Break",
    "Dot",
    "Multiple / mixed",
    "Other",
    "Unclear"
   ]
  },
  {
   "id": "GP-176",
   "category": "Minor Lines",
   "aspect": "Ring of Solomon – presence",
   "options": [
    "Not visible",
    "One",
    "Two",
    "Three",
    "More than three",
    "Present but unclear",
    "Not assessed"
   ]
  },
  {
   "id": "GP-177",
   "category": "Minor Lines",
   "aspect": "Ring of Solomon – clarity",
   "options": [
    "Faint",
    "Moderate",
    "Clear",
    "Deep",
    "Fragmented",
    "Not assessable"
   ]
  },
  {
   "id": "GP-178",
   "category": "Minor Lines",
   "aspect": "Ring of Solomon – formation",
   "options": [
    "Straight",
    "Curved",
    "Forked",
    "Chained",
    "Broken",
    "Wavy",
    "Vertical",
    "Horizontal",
    "Multiple / mixed",
    "Other",
    "Not clear"
   ]
  },
  {
   "id": "GP-179",
   "category": "Minor Lines",
   "aspect": "Ring of Solomon – length",
   "options": [
    "Short",
    "Medium",
    "Long",
    "Very long",
    "Partial / unclear"
   ]
  },
  {
   "id": "GP-180",
   "category": "Minor Lines",
   "aspect": "Ring of Solomon – markings",
   "options": [
    "None notable",
    "Cross",
    "Star",
    "Square",
    "Island",
    "Fork",
    "Break",
    "Dot",
    "Multiple / mixed",
    "Other",
    "Unclear"
   ]
  },
  {
   "id": "GP-181",
   "category": "Minor Lines",
   "aspect": "Girdle of Venus – presence",
   "options": [
    "Not visible",
    "One",
    "Two",
    "Three",
    "More than three",
    "Present but unclear",
    "Not assessed"
   ]
  },
  {
   "id": "GP-182",
   "category": "Minor Lines",
   "aspect": "Girdle of Venus – clarity",
   "options": [
    "Faint",
    "Moderate",
    "Clear",
    "Deep",
    "Fragmented",
    "Not assessable"
   ]
  },
  {
   "id": "GP-183",
   "category": "Minor Lines",
   "aspect": "Girdle of Venus – formation",
   "options": [
    "Straight",
    "Curved",
    "Forked",
    "Chained",
    "Broken",
    "Wavy",
    "Vertical",
    "Horizontal",
    "Multiple / mixed",
    "Other",
    "Not clear"
   ]
  },
  {
   "id": "GP-184",
   "category": "Minor Lines",
   "aspect": "Girdle of Venus – length",
   "options": [
    "Short",
    "Medium",
    "Long",
    "Very long",
    "Partial / unclear"
   ]
  },
  {
   "id": "GP-185",
   "category": "Minor Lines",
   "aspect": "Girdle of Venus – markings",
   "options": [
    "None notable",
    "Cross",
    "Star",
    "Square",
    "Island",
    "Fork",
    "Break",
    "Dot",
    "Multiple / mixed",
    "Other",
    "Unclear"
   ]
  },
  {
   "id": "GP-186",
   "category": "Minor Lines",
   "aspect": "Sister / Support Lines – presence",
   "options": [
    "Not visible",
    "One",
    "Two",
    "Three",
    "More than three",
    "Present but unclear",
    "Not assessed"
   ]
  },
  {
   "id": "GP-187",
   "category": "Minor Lines",
   "aspect": "Sister / Support Lines – clarity",
   "options": [
    "Faint",
    "Moderate",
    "Clear",
    "Deep",
    "Fragmented",
    "Not assessable"
   ]
  },
  {
   "id": "GP-188",
   "category": "Minor Lines",
   "aspect": "Sister / Support Lines – formation",
   "options": [
    "Straight",
    "Curved",
    "Forked",
    "Chained",
    "Broken",
    "Wavy",
    "Vertical",
    "Horizontal",
    "Multiple / mixed",
    "Other",
    "Not clear"
   ]
  },
  {
   "id": "GP-189",
   "category": "Minor Lines",
   "aspect": "Sister / Support Lines – length",
   "options": [
    "Short",
    "Medium",
    "Long",
    "Very long",
    "Partial / unclear"
   ]
  },
  {
   "id": "GP-190",
   "category": "Minor Lines",
   "aspect": "Sister / Support Lines – markings",
   "options": [
    "None notable",
    "Cross",
    "Star",
    "Square",
    "Island",
    "Fork",
    "Break",
    "Dot",
    "Multiple / mixed",
    "Other",
    "Unclear"
   ]
  },
  {
   "id": "GP-191",
   "category": "Minor Lines",
   "aspect": "Influence Lines – presence",
   "options": [
    "Not visible",
    "One",
    "Two",
    "Three",
    "More than three",
    "Present but unclear",
    "Not assessed"
   ]
  },
  {
   "id": "GP-192",
   "category": "Minor Lines",
   "aspect": "Influence Lines – clarity",
   "options": [
    "Faint",
    "Moderate",
    "Clear",
    "Deep",
    "Fragmented",
    "Not assessable"
   ]
  },
  {
   "id": "GP-193",
   "category": "Minor Lines",
   "aspect": "Influence Lines – formation",
   "options": [
    "Straight",
    "Curved",
    "Forked",
    "Chained",
    "Broken",
    "Wavy",
    "Vertical",
    "Horizontal",
    "Multiple / mixed",
    "Other",
    "Not clear"
   ]
  },
  {
   "id": "GP-194",
   "category": "Minor Lines",
   "aspect": "Influence Lines – length",
   "options": [
    "Short",
    "Medium",
    "Long",
    "Very long",
    "Partial / unclear"
   ]
  },
  {
   "id": "GP-195",
   "category": "Minor Lines",
   "aspect": "Influence Lines – markings",
   "options": [
    "None notable",
    "Cross",
    "Star",
    "Square",
    "Island",
    "Fork",
    "Break",
    "Dot",
    "Multiple / mixed",
    "Other",
    "Unclear"
   ]
  },
  {
   "id": "GP-196",
   "category": "Minor Lines",
   "aspect": "Bracelets / Rascettes – presence",
   "options": [
    "Not visible",
    "One",
    "Two",
    "Three",
    "More than three",
    "Present but unclear",
    "Not assessed"
   ]
  },
  {
   "id": "GP-197",
   "category": "Minor Lines",
   "aspect": "Bracelets / Rascettes – clarity",
   "options": [
    "Faint",
    "Moderate",
    "Clear",
    "Deep",
    "Fragmented",
    "Not assessable"
   ]
  },
  {
   "id": "GP-198",
   "category": "Minor Lines",
   "aspect": "Bracelets / Rascettes – formation",
   "options": [
    "Straight",
    "Curved",
    "Forked",
    "Chained",
    "Broken",
    "Wavy",
    "Vertical",
    "Horizontal",
    "Multiple / mixed",
    "Other",
    "Not clear"
   ]
  },
  {
   "id": "GP-199",
   "category": "Minor Lines",
   "aspect": "Bracelets / Rascettes – length",
   "options": [
    "Short",
    "Medium",
    "Long",
    "Very long",
    "Partial / unclear"
   ]
  },
  {
   "id": "GP-200",
   "category": "Minor Lines",
   "aspect": "Bracelets / Rascettes – markings",
   "options": [
    "None notable",
    "Cross",
    "Star",
    "Square",
    "Island",
    "Fork",
    "Break",
    "Dot",
    "Multiple / mixed",
    "Other",
    "Unclear"
   ]
  },
  {
   "id": "GP-201",
   "category": "Minor Lines",
   "aspect": "Mystic Cross – presence",
   "options": [
    "Not visible",
    "One",
    "Two",
    "Three",
    "More than three",
    "Present but unclear",
    "Not assessed"
   ]
  },
  {
   "id": "GP-202",
   "category": "Minor Lines",
   "aspect": "Mystic Cross – clarity",
   "options": [
    "Faint",
    "Moderate",
    "Clear",
    "Deep",
    "Fragmented",
    "Not assessable"
   ]
  },
  {
   "id": "GP-203",
   "category": "Minor Lines",
   "aspect": "Mystic Cross – formation",
   "options": [
    "Straight",
    "Curved",
    "Forked",
    "Chained",
    "Broken",
    "Wavy",
    "Vertical",
    "Horizontal",
    "Multiple / mixed",
    "Other",
    "Not clear"
   ]
  },
  {
   "id": "GP-204",
   "category": "Minor Lines",
   "aspect": "Mystic Cross – length",
   "options": [
    "Short",
    "Medium",
    "Long",
    "Very long",
    "Partial / unclear"
   ]
  },
  {
   "id": "GP-205",
   "category": "Minor Lines",
   "aspect": "Mystic Cross – markings",
   "options": [
    "None notable",
    "Cross",
    "Star",
    "Square",
    "Island",
    "Fork",
    "Break",
    "Dot",
    "Multiple / mixed",
    "Other",
    "Unclear"
   ]
  },
  {
   "id": "GP-206",
   "category": "Minor Lines",
   "aspect": "Via Lasciva – presence",
   "options": [
    "Not visible",
    "One",
    "Two",
    "Three",
    "More than three",
    "Present but unclear",
    "Not assessed"
   ]
  },
  {
   "id": "GP-207",
   "category": "Minor Lines",
   "aspect": "Via Lasciva – clarity",
   "options": [
    "Faint",
    "Moderate",
    "Clear",
    "Deep",
    "Fragmented",
    "Not assessable"
   ]
  },
  {
   "id": "GP-208",
   "category": "Minor Lines",
   "aspect": "Via Lasciva – formation",
   "options": [
    "Straight",
    "Curved",
    "Forked",
    "Chained",
    "Broken",
    "Wavy",
    "Vertical",
    "Horizontal",
    "Multiple / mixed",
    "Other",
    "Not clear"
   ]
  },
  {
   "id": "GP-209",
   "category": "Minor Lines",
   "aspect": "Via Lasciva – length",
   "options": [
    "Short",
    "Medium",
    "Long",
    "Very long",
    "Partial / unclear"
   ]
  },
  {
   "id": "GP-210",
   "category": "Minor Lines",
   "aspect": "Via Lasciva – markings",
   "options": [
    "None notable",
    "Cross",
    "Star",
    "Square",
    "Island",
    "Fork",
    "Break",
    "Dot",
    "Multiple / mixed",
    "Other",
    "Unclear"
   ]
  },
  {
   "id": "GP-211",
   "category": "Minor Lines",
   "aspect": "Marriage / Affection markings – presence",
   "options": [
    "Not visible",
    "One",
    "Two",
    "Three",
    "More than three",
    "Present but unclear",
    "Not assessed"
   ]
  },
  {
   "id": "GP-212",
   "category": "Minor Lines",
   "aspect": "Marriage / Affection markings – clarity",
   "options": [
    "Faint",
    "Moderate",
    "Clear",
    "Deep",
    "Fragmented",
    "Not assessable"
   ]
  },
  {
   "id": "GP-213",
   "category": "Minor Lines",
   "aspect": "Marriage / Affection markings – formation",
   "options": [
    "Straight",
    "Curved",
    "Forked",
    "Chained",
    "Broken",
    "Wavy",
    "Vertical",
    "Horizontal",
    "Multiple / mixed",
    "Other",
    "Not clear"
   ]
  },
  {
   "id": "GP-214",
   "category": "Minor Lines",
   "aspect": "Marriage / Affection markings – length",
   "options": [
    "Short",
    "Medium",
    "Long",
    "Very long",
    "Partial / unclear"
   ]
  },
  {
   "id": "GP-215",
   "category": "Minor Lines",
   "aspect": "Marriage / Affection markings – markings",
   "options": [
    "None notable",
    "Cross",
    "Star",
    "Square",
    "Island",
    "Fork",
    "Break",
    "Dot",
    "Multiple / mixed",
    "Other",
    "Unclear"
   ]
  },
  {
   "id": "GP-216",
   "category": "Minor Lines",
   "aspect": "Other secondary lines – presence",
   "options": [
    "Not visible",
    "One",
    "Two",
    "Three",
    "More than three",
    "Present but unclear",
    "Not assessed"
   ]
  },
  {
   "id": "GP-217",
   "category": "Minor Lines",
   "aspect": "Other secondary lines – clarity",
   "options": [
    "Faint",
    "Moderate",
    "Clear",
    "Deep",
    "Fragmented",
    "Not assessable"
   ]
  },
  {
   "id": "GP-218",
   "category": "Minor Lines",
   "aspect": "Other secondary lines – formation",
   "options": [
    "Straight",
    "Curved",
    "Forked",
    "Chained",
    "Broken",
    "Wavy",
    "Vertical",
    "Horizontal",
    "Multiple / mixed",
    "Other",
    "Not clear"
   ]
  },
  {
   "id": "GP-219",
   "category": "Minor Lines",
   "aspect": "Other secondary lines – length",
   "options": [
    "Short",
    "Medium",
    "Long",
    "Very long",
    "Partial / unclear"
   ]
  },
  {
   "id": "GP-220",
   "category": "Minor Lines",
   "aspect": "Other secondary lines – markings",
   "options": [
    "None notable",
    "Cross",
    "Star",
    "Square",
    "Island",
    "Fork",
    "Break",
    "Dot",
    "Multiple / mixed",
    "Other",
    "Unclear"
   ]
  },
  {
   "id": "GP-221",
   "category": "Special Markings",
   "aspect": "Cross – presence",
   "options": [
    "Not seen",
    "Possible / unclear",
    "Clearly present"
   ]
  },
  {
   "id": "GP-222",
   "category": "Special Markings",
   "aspect": "Cross – location",
   "options": [
    "Jupiter mount",
    "Saturn mount",
    "Apollo mount",
    "Mercury mount",
    "Venus mount",
    "Upper Mars",
    "Lower Mars",
    "Moon mount",
    "Plain of Mars",
    "Life Line",
    "Head Line",
    "Heart Line",
    "Fate Line",
    "Sun Line",
    "Mercury Line",
    "Wrist / Rascettes",
    "Other / multiple",
    "Not clear"
   ]
  },
  {
   "id": "GP-223",
   "category": "Special Markings",
   "aspect": "Cross – definition",
   "options": [
    "Faint",
    "Moderate",
    "Well defined",
    "Deep / prominent",
    "Incomplete",
    "Not assessable"
   ]
  },
  {
   "id": "GP-224",
   "category": "Special Markings",
   "aspect": "Star – presence",
   "options": [
    "Not seen",
    "Possible / unclear",
    "Clearly present"
   ]
  },
  {
   "id": "GP-225",
   "category": "Special Markings",
   "aspect": "Star – location",
   "options": [
    "Jupiter mount",
    "Saturn mount",
    "Apollo mount",
    "Mercury mount",
    "Venus mount",
    "Upper Mars",
    "Lower Mars",
    "Moon mount",
    "Plain of Mars",
    "Life Line",
    "Head Line",
    "Heart Line",
    "Fate Line",
    "Sun Line",
    "Mercury Line",
    "Wrist / Rascettes",
    "Other / multiple",
    "Not clear"
   ]
  },
  {
   "id": "GP-226",
   "category": "Special Markings",
   "aspect": "Star – definition",
   "options": [
    "Faint",
    "Moderate",
    "Well defined",
    "Deep / prominent",
    "Incomplete",
    "Not assessable"
   ]
  },
  {
   "id": "GP-227",
   "category": "Special Markings",
   "aspect": "Square – presence",
   "options": [
    "Not seen",
    "Possible / unclear",
    "Clearly present"
   ]
  },
  {
   "id": "GP-228",
   "category": "Special Markings",
   "aspect": "Square – location",
   "options": [
    "Jupiter mount",
    "Saturn mount",
    "Apollo mount",
    "Mercury mount",
    "Venus mount",
    "Upper Mars",
    "Lower Mars",
    "Moon mount",
    "Plain of Mars",
    "Life Line",
    "Head Line",
    "Heart Line",
    "Fate Line",
    "Sun Line",
    "Mercury Line",
    "Wrist / Rascettes",
    "Other / multiple",
    "Not clear"
   ]
  },
  {
   "id": "GP-229",
   "category": "Special Markings",
   "aspect": "Square – definition",
   "options": [
    "Faint",
    "Moderate",
    "Well defined",
    "Deep / prominent",
    "Incomplete",
    "Not assessable"
   ]
  },
  {
   "id": "GP-230",
   "category": "Special Markings",
   "aspect": "Triangle – presence",
   "options": [
    "Not seen",
    "Possible / unclear",
    "Clearly present"
   ]
  },
  {
   "id": "GP-231",
   "category": "Special Markings",
   "aspect": "Triangle – location",
   "options": [
    "Jupiter mount",
    "Saturn mount",
    "Apollo mount",
    "Mercury mount",
    "Venus mount",
    "Upper Mars",
    "Lower Mars",
    "Moon mount",
    "Plain of Mars",
    "Life Line",
    "Head Line",
    "Heart Line",
    "Fate Line",
    "Sun Line",
    "Mercury Line",
    "Wrist / Rascettes",
    "Other / multiple",
    "Not clear"
   ]
  },
  {
   "id": "GP-232",
   "category": "Special Markings",
   "aspect": "Triangle – definition",
   "options": [
    "Faint",
    "Moderate",
    "Well defined",
    "Deep / prominent",
    "Incomplete",
    "Not assessable"
   ]
  },
  {
   "id": "GP-233",
   "category": "Special Markings",
   "aspect": "Circle – presence",
   "options": [
    "Not seen",
    "Possible / unclear",
    "Clearly present"
   ]
  },
  {
   "id": "GP-234",
   "category": "Special Markings",
   "aspect": "Circle – location",
   "options": [
    "Jupiter mount",
    "Saturn mount",
    "Apollo mount",
    "Mercury mount",
    "Venus mount",
    "Upper Mars",
    "Lower Mars",
    "Moon mount",
    "Plain of Mars",
    "Life Line",
    "Head Line",
    "Heart Line",
    "Fate Line",
    "Sun Line",
    "Mercury Line",
    "Wrist / Rascettes",
    "Other / multiple",
    "Not clear"
   ]
  },
  {
   "id": "GP-235",
   "category": "Special Markings",
   "aspect": "Circle – definition",
   "options": [
    "Faint",
    "Moderate",
    "Well defined",
    "Deep / prominent",
    "Incomplete",
    "Not assessable"
   ]
  },
  {
   "id": "GP-236",
   "category": "Special Markings",
   "aspect": "Island – presence",
   "options": [
    "Not seen",
    "Possible / unclear",
    "Clearly present"
   ]
  },
  {
   "id": "GP-237",
   "category": "Special Markings",
   "aspect": "Island – location",
   "options": [
    "Jupiter mount",
    "Saturn mount",
    "Apollo mount",
    "Mercury mount",
    "Venus mount",
    "Upper Mars",
    "Lower Mars",
    "Moon mount",
    "Plain of Mars",
    "Life Line",
    "Head Line",
    "Heart Line",
    "Fate Line",
    "Sun Line",
    "Mercury Line",
    "Wrist / Rascettes",
    "Other / multiple",
    "Not clear"
   ]
  },
  {
   "id": "GP-238",
   "category": "Special Markings",
   "aspect": "Island – definition",
   "options": [
    "Faint",
    "Moderate",
    "Well defined",
    "Deep / prominent",
    "Incomplete",
    "Not assessable"
   ]
  },
  {
   "id": "GP-239",
   "category": "Special Markings",
   "aspect": "Grille – presence",
   "options": [
    "Not seen",
    "Possible / unclear",
    "Clearly present"
   ]
  },
  {
   "id": "GP-240",
   "category": "Special Markings",
   "aspect": "Grille – location",
   "options": [
    "Jupiter mount",
    "Saturn mount",
    "Apollo mount",
    "Mercury mount",
    "Venus mount",
    "Upper Mars",
    "Lower Mars",
    "Moon mount",
    "Plain of Mars",
    "Life Line",
    "Head Line",
    "Heart Line",
    "Fate Line",
    "Sun Line",
    "Mercury Line",
    "Wrist / Rascettes",
    "Other / multiple",
    "Not clear"
   ]
  },
  {
   "id": "GP-241",
   "category": "Special Markings",
   "aspect": "Grille – definition",
   "options": [
    "Faint",
    "Moderate",
    "Well defined",
    "Deep / prominent",
    "Incomplete",
    "Not assessable"
   ]
  },
  {
   "id": "GP-242",
   "category": "Special Markings",
   "aspect": "Trident – presence",
   "options": [
    "Not seen",
    "Possible / unclear",
    "Clearly present"
   ]
  },
  {
   "id": "GP-243",
   "category": "Special Markings",
   "aspect": "Trident – location",
   "options": [
    "Jupiter mount",
    "Saturn mount",
    "Apollo mount",
    "Mercury mount",
    "Venus mount",
    "Upper Mars",
    "Lower Mars",
    "Moon mount",
    "Plain of Mars",
    "Life Line",
    "Head Line",
    "Heart Line",
    "Fate Line",
    "Sun Line",
    "Mercury Line",
    "Wrist / Rascettes",
    "Other / multiple",
    "Not clear"
   ]
  },
  {
   "id": "GP-244",
   "category": "Special Markings",
   "aspect": "Trident – definition",
   "options": [
    "Faint",
    "Moderate",
    "Well defined",
    "Deep / prominent",
    "Incomplete",
    "Not assessable"
   ]
  },
  {
   "id": "GP-245",
   "category": "Special Markings",
   "aspect": "Fork – presence",
   "options": [
    "Not seen",
    "Possible / unclear",
    "Clearly present"
   ]
  },
  {
   "id": "GP-246",
   "category": "Special Markings",
   "aspect": "Fork – location",
   "options": [
    "Jupiter mount",
    "Saturn mount",
    "Apollo mount",
    "Mercury mount",
    "Venus mount",
    "Upper Mars",
    "Lower Mars",
    "Moon mount",
    "Plain of Mars",
    "Life Line",
    "Head Line",
    "Heart Line",
    "Fate Line",
    "Sun Line",
    "Mercury Line",
    "Wrist / Rascettes",
    "Other / multiple",
    "Not clear"
   ]
  },
  {
   "id": "GP-247",
   "category": "Special Markings",
   "aspect": "Fork – definition",
   "options": [
    "Faint",
    "Moderate",
    "Well defined",
    "Deep / prominent",
    "Incomplete",
    "Not assessable"
   ]
  },
  {
   "id": "GP-248",
   "category": "Special Markings",
   "aspect": "Fish – presence",
   "options": [
    "Not seen",
    "Possible / unclear",
    "Clearly present"
   ]
  },
  {
   "id": "GP-249",
   "category": "Special Markings",
   "aspect": "Fish – location",
   "options": [
    "Jupiter mount",
    "Saturn mount",
    "Apollo mount",
    "Mercury mount",
    "Venus mount",
    "Upper Mars",
    "Lower Mars",
    "Moon mount",
    "Plain of Mars",
    "Life Line",
    "Head Line",
    "Heart Line",
    "Fate Line",
    "Sun Line",
    "Mercury Line",
    "Wrist / Rascettes",
    "Other / multiple",
    "Not clear"
   ]
  },
  {
   "id": "GP-250",
   "category": "Special Markings",
   "aspect": "Fish – definition",
   "options": [
    "Faint",
    "Moderate",
    "Well defined",
    "Deep / prominent",
    "Incomplete",
    "Not assessable"
   ]
  },
  {
   "id": "GP-251",
   "category": "Special Markings",
   "aspect": "Dot – presence",
   "options": [
    "Not seen",
    "Possible / unclear",
    "Clearly present"
   ]
  },
  {
   "id": "GP-252",
   "category": "Special Markings",
   "aspect": "Dot – location",
   "options": [
    "Jupiter mount",
    "Saturn mount",
    "Apollo mount",
    "Mercury mount",
    "Venus mount",
    "Upper Mars",
    "Lower Mars",
    "Moon mount",
    "Plain of Mars",
    "Life Line",
    "Head Line",
    "Heart Line",
    "Fate Line",
    "Sun Line",
    "Mercury Line",
    "Wrist / Rascettes",
    "Other / multiple",
    "Not clear"
   ]
  },
  {
   "id": "GP-253",
   "category": "Special Markings",
   "aspect": "Dot – definition",
   "options": [
    "Faint",
    "Moderate",
    "Well defined",
    "Deep / prominent",
    "Incomplete",
    "Not assessable"
   ]
  },
  {
   "id": "GP-254",
   "category": "Special Markings",
   "aspect": "Spot – presence",
   "options": [
    "Not seen",
    "Possible / unclear",
    "Clearly present"
   ]
  },
  {
   "id": "GP-255",
   "category": "Special Markings",
   "aspect": "Spot – location",
   "options": [
    "Jupiter mount",
    "Saturn mount",
    "Apollo mount",
    "Mercury mount",
    "Venus mount",
    "Upper Mars",
    "Lower Mars",
    "Moon mount",
    "Plain of Mars",
    "Life Line",
    "Head Line",
    "Heart Line",
    "Fate Line",
    "Sun Line",
    "Mercury Line",
    "Wrist / Rascettes",
    "Other / multiple",
    "Not clear"
   ]
  },
  {
   "id": "GP-256",
   "category": "Special Markings",
   "aspect": "Spot – definition",
   "options": [
    "Faint",
    "Moderate",
    "Well defined",
    "Deep / prominent",
    "Incomplete",
    "Not assessable"
   ]
  },
  {
   "id": "GP-257",
   "category": "Special Markings",
   "aspect": "Break – presence",
   "options": [
    "Not seen",
    "Possible / unclear",
    "Clearly present"
   ]
  },
  {
   "id": "GP-258",
   "category": "Special Markings",
   "aspect": "Break – location",
   "options": [
    "Jupiter mount",
    "Saturn mount",
    "Apollo mount",
    "Mercury mount",
    "Venus mount",
    "Upper Mars",
    "Lower Mars",
    "Moon mount",
    "Plain of Mars",
    "Life Line",
    "Head Line",
    "Heart Line",
    "Fate Line",
    "Sun Line",
    "Mercury Line",
    "Wrist / Rascettes",
    "Other / multiple",
    "Not clear"
   ]
  },
  {
   "id": "GP-259",
   "category": "Special Markings",
   "aspect": "Break – definition",
   "options": [
    "Faint",
    "Moderate",
    "Well defined",
    "Deep / prominent",
    "Incomplete",
    "Not assessable"
   ]
  },
  {
   "id": "GP-260",
   "category": "Special Markings",
   "aspect": "Chain – presence",
   "options": [
    "Not seen",
    "Possible / unclear",
    "Clearly present"
   ]
  },
  {
   "id": "GP-261",
   "category": "Special Markings",
   "aspect": "Chain – location",
   "options": [
    "Jupiter mount",
    "Saturn mount",
    "Apollo mount",
    "Mercury mount",
    "Venus mount",
    "Upper Mars",
    "Lower Mars",
    "Moon mount",
    "Plain of Mars",
    "Life Line",
    "Head Line",
    "Heart Line",
    "Fate Line",
    "Sun Line",
    "Mercury Line",
    "Wrist / Rascettes",
    "Other / multiple",
    "Not clear"
   ]
  },
  {
   "id": "GP-262",
   "category": "Special Markings",
   "aspect": "Chain – definition",
   "options": [
    "Faint",
    "Moderate",
    "Well defined",
    "Deep / prominent",
    "Incomplete",
    "Not assessable"
   ]
  },
  {
   "id": "GP-263",
   "category": "Special Markings",
   "aspect": "Branch – presence",
   "options": [
    "Not seen",
    "Possible / unclear",
    "Clearly present"
   ]
  },
  {
   "id": "GP-264",
   "category": "Special Markings",
   "aspect": "Branch – location",
   "options": [
    "Jupiter mount",
    "Saturn mount",
    "Apollo mount",
    "Mercury mount",
    "Venus mount",
    "Upper Mars",
    "Lower Mars",
    "Moon mount",
    "Plain of Mars",
    "Life Line",
    "Head Line",
    "Heart Line",
    "Fate Line",
    "Sun Line",
    "Mercury Line",
    "Wrist / Rascettes",
    "Other / multiple",
    "Not clear"
   ]
  },
  {
   "id": "GP-265",
   "category": "Special Markings",
   "aspect": "Branch – definition",
   "options": [
    "Faint",
    "Moderate",
    "Well defined",
    "Deep / prominent",
    "Incomplete",
    "Not assessable"
   ]
  },
  {
   "id": "GP-266",
   "category": "Special Markings",
   "aspect": "M – presence",
   "options": [
    "Not seen",
    "Possible / unclear",
    "Clearly present"
   ]
  },
  {
   "id": "GP-267",
   "category": "Special Markings",
   "aspect": "M – location",
   "options": [
    "Jupiter mount",
    "Saturn mount",
    "Apollo mount",
    "Mercury mount",
    "Venus mount",
    "Upper Mars",
    "Lower Mars",
    "Moon mount",
    "Plain of Mars",
    "Life Line",
    "Head Line",
    "Heart Line",
    "Fate Line",
    "Sun Line",
    "Mercury Line",
    "Wrist / Rascettes",
    "Other / multiple",
    "Not clear"
   ]
  },
  {
   "id": "GP-268",
   "category": "Special Markings",
   "aspect": "M – definition",
   "options": [
    "Faint",
    "Moderate",
    "Well defined",
    "Deep / prominent",
    "Incomplete",
    "Not assessable"
   ]
  },
  {
   "id": "GP-269",
   "category": "Special Markings",
   "aspect": "Mystic Cross – presence",
   "options": [
    "Not seen",
    "Possible / unclear",
    "Clearly present"
   ]
  },
  {
   "id": "GP-270",
   "category": "Special Markings",
   "aspect": "Mystic Cross – location",
   "options": [
    "Jupiter mount",
    "Saturn mount",
    "Apollo mount",
    "Mercury mount",
    "Venus mount",
    "Upper Mars",
    "Lower Mars",
    "Moon mount",
    "Plain of Mars",
    "Life Line",
    "Head Line",
    "Heart Line",
    "Fate Line",
    "Sun Line",
    "Mercury Line",
    "Wrist / Rascettes",
    "Other / multiple",
    "Not clear"
   ]
  },
  {
   "id": "GP-271",
   "category": "Special Markings",
   "aspect": "Mystic Cross – definition",
   "options": [
    "Faint",
    "Moderate",
    "Well defined",
    "Deep / prominent",
    "Incomplete",
    "Not assessable"
   ]
  },
  {
   "id": "GP-272",
   "category": "Special Markings",
   "aspect": "Other – presence",
   "options": [
    "Not seen",
    "Possible / unclear",
    "Clearly present"
   ]
  },
  {
   "id": "GP-273",
   "category": "Special Markings",
   "aspect": "Other – location",
   "options": [
    "Jupiter mount",
    "Saturn mount",
    "Apollo mount",
    "Mercury mount",
    "Venus mount",
    "Upper Mars",
    "Lower Mars",
    "Moon mount",
    "Plain of Mars",
    "Life Line",
    "Head Line",
    "Heart Line",
    "Fate Line",
    "Sun Line",
    "Mercury Line",
    "Wrist / Rascettes",
    "Other / multiple",
    "Not clear"
   ]
  },
  {
   "id": "GP-274",
   "category": "Special Markings",
   "aspect": "Other – definition",
   "options": [
    "Faint",
    "Moderate",
    "Well defined",
    "Deep / prominent",
    "Incomplete",
    "Not assessable"
   ]
  },
  {
   "id": "GP-275",
   "category": "Overall Review",
   "aspect": "Hand comparison",
   "options": [
    "Left and right broadly similar",
    "Right more developed",
    "Left more developed",
    "Significant differences",
    "Only one hand assessed",
    "Not compared"
   ]
  },
  {
   "id": "GP-276",
   "category": "Overall Review",
   "aspect": "Observation confidence",
   "options": [
    "High",
    "Medium",
    "Low"
   ]
  },
  {
   "id": "GP-277",
   "category": "Overall Review",
   "aspect": "Photo / assessment limitation",
   "options": [
    "None noted",
    "Palm cropped",
    "Fingers cropped",
    "Poor lighting",
    "Blurred image",
    "Obstructed by jewellery / objects",
    "Multiple limitations",
    "Other"
   ]
  }
 ]
};
