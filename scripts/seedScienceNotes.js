const fs = require('fs');
const path = require('path');

// Base content folder
const baseContent = path.join(__dirname, '..', 'content');

// Define rich notes with detailed Q&A for Science (Physics, Chemistry, Biology)
const scienceData = {
  physics: {
    subject: "Physics",
    board_source: "CBSE_NCERT",
    chapterNumber: 1,
    chapter: "Light - Reflection and Refraction",
    title: "Science Notes: Light, Reflection, and Refraction",
    concepts: [
      {
        name: "Refraction & Optical Density",
        real_life_application: "A straw kept in a glass of water appears bent at the air-water interface because light changes speed when travelling from air to water.",
        purpose: "Explore light bending when moving across media of different refractive indices.",
        day_to_day_usage: [
          "Understanding lens behavior in optical glasses",
          "Explaining why swimming pools look shallower than they actually are"
        ],
        video_embed: "https://www.youtube.com/embed/y55tzg_jS0Y?autoplay=1&mute=1&playlist=y55tzg_jS0Y&loop=1&controls=0&rel=0&modestbranding=1"
      }
    ],
    theorems: [],
    exercises: {
      "qa_session_1": {
        "title": "Physics Q&A Notes",
        "objective": "Understand optical rules and calculations",
        "problems": [
          {
            "id": "phys-qa-1",
            "book_source": "NCERT",
            "question": "A concave mirror produces a three times magnified real image of an object placed at 10 cm in front of it. Where is the image located?",
            "difficulty": "MEDIUM",
            "solution": [
              "Given object distance u = -10 cm (using Cartesian sign convention).",
              "For a real image, magnification m is negative: m = -3.",
              "Magnification formula for mirrors: m = -v / u.",
              "Substitute the values: -3 = -v / (-10) => -3 = v / 10 => v = -30 cm.",
              "The image is located 30 cm in front of the mirror on the same side as the object."
            ]
          }
        ]
      }
    }
  },
  chemistry: {
    subject: "Chemistry",
    board_source: "CBSE_NCERT",
    chapterNumber: 2,
    chapter: "Chemical Reactions and Equations",
    title: "Science Notes: Chemical Reactions & Equations",
    concepts: [
      {
        name: "Exothermic vs Endothermic Reactions",
        real_life_application: "Digestion of food or respiration is exothermic (releases heat energy), whereas photosynthesis in plants is endothermic (absorbs solar energy).",
        purpose: "Classify reactions based on thermal energy absorption or release.",
        day_to_day_usage: [
          "Understanding how self-heating cans or ice packs work in first aid",
          "Explaining warmth generated during quicklime mixing with water"
        ],
        video_embed: "https://www.youtube.com/embed/Hh33dC52R0M?autoplay=1&mute=1&playlist=Hh33dC52R0M&loop=1&controls=0&rel=0&modestbranding=1"
      }
    ],
    theorems: [],
    exercises: {
      "qa_session_1": {
        "title": "Chemistry Q&A Notes",
        "objective": "Understand chemical equations and reaction types",
        "problems": [
          {
            "id": "chem-qa-1",
            "book_source": "NCERT",
            "question": "Why should a magnesium ribbon be cleaned with sandpaper before burning in air?",
            "difficulty": "EASY",
            "solution": [
              "Formation of Protective Layer: Magnesium is a highly reactive metal. When exposed to moist air, it reacts with oxygen to form a thin, stable protective layer of Magnesium Oxide (MgO) on its surface.",
              "Inhibition of Combustion: This white oxide layer prevents the magnesium ribbon from burning effectively when heated.",
              "Action of Sandpaper: Cleaning the ribbon with sandpaper removes this oxide layer, exposing the underlying pure magnesium metal to react readily with oxygen and burn with a dazzling white flame."
            ]
          }
        ]
      }
    }
  },
  biology: {
    subject: "Biology",
    board_source: "CBSE_NCERT",
    chapterNumber: 3,
    chapter: "Life Processes",
    title: "Science Notes: Life Processes & Metabolism",
    concepts: [
      {
        name: "Autotrophic vs Heterotrophic Nutrition",
        real_life_application: "Green plants synthesize sugar using sunlight, water, and CO2 (autotrophic), while animals consume plants or other organisms to acquire ready-made organic matter (heterotrophic).",
        purpose: "Explore how different living beings ingest or synthesize food to survive.",
        day_to_day_usage: [
          "Understanding agricultural yields based on sunlight availability",
          "Tracking calorie intake and digestion of consumed foods"
        ],
        video_embed: "https://www.youtube.com/embed/UP7aG8xip48?autoplay=1&mute=1&playlist=UP7aG8xip48&loop=1&controls=0&rel=0&modestbranding=1"
      }
    ],
    theorems: [],
    exercises: {
      "qa_session_1": {
        "title": "Biology Q&A Notes",
        "objective": "Understand body organ functions and metabolic pathways",
        "problems": [
          {
            "id": "bio-qa-1",
            "book_source": "NCERT",
            "question": "What is the function of digestive enzymes in the human body?",
            "difficulty": "EASY",
            "solution": [
              "Catalytic Action: Digestive enzymes act as biological catalysts that speed up chemical breakdown of complex food substances into simpler, soluble molecules.",
              "Salivary Amylase: Breakdown of complex starch into simple sugars (maltose) in the mouth.",
              "Pepsin & Trypsin: Breakdown of proteins into peptides and amino acids in the stomach and small intestine.",
              "Lipase: Emulsified fats are broken down into fatty acids and glycerol.",
              "Absorption: These smaller molecules are then easily absorbed through the intestinal walls into the bloodstream."
            ]
          }
        ]
      }
    }
  }
};

// Write notes JSON files to respective directories
Object.entries(scienceData).forEach(([subj, content]) => {
  const targetPath = path.join(baseContent, 'science', 'cbse_ncert', `${subj}.json`);
  fs.writeFileSync(targetPath, JSON.stringify(content, null, 2));
  console.log(`Successfully wrote detailed Q&A notes for Science: ${subj} to ${targetPath}`);
});
