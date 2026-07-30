const fs = require('fs');
const path = require('path');

// Base content folder
const baseContent = path.join(__dirname, '..', 'content');

// Define rich notes with detailed Q&A for Social with high-quality ad-free visual reels
const socialData = {
  history: {
    subject: "History",
    board_source: "CBSE_NCERT",
    chapterNumber: 1,
    chapter: "Nationalism in India",
    title: "History Notes: Nationalism in India",
    concepts: [
      {
        name: "Impact of First World War on India",
        real_life_application: "Understanding how wartime economies create steep price rises and inflation affecting common citizens.",
        purpose: "Learn how global military conflicts ripple into local colonial taxes, forced recruitment, and trigger political movements.",
        day_to_day_usage: [
          "Understanding tax rate spikes during economic crises",
          "Relating history to international trade blockades and modern oil inflation"
        ],
        video_embed: "https://www.youtube.com/embed/5F7JtP1EGFw?autoplay=1&mute=1&playlist=5F7JtP1EGFw&loop=1&controls=0&rel=0&modestbranding=1"
      },
      {
        name: "The Idea of Satyagraha",
        real_life_application: "Using peaceful, truth-based protests to appeal to the conscience of the oppressor rather than using physical force.",
        purpose: "Explore Mahatma Gandhi's core philosophy of non-violent resistance (Ahimsa).",
        day_to_day_usage: [
          "Resolving conflicts at school or home without arguments or aggression",
          "Understanding the power of peaceful advocacy in local assemblies"
        ],
        video_embed: "https://www.youtube.com/embed/S_B7sH3f1gY?autoplay=1&mute=1&playlist=S_B7sH3f1gY&loop=1&controls=0&rel=0&modestbranding=1"
      }
    ],
    theorems: [],
    exercises: {
      "qa_session_1": {
        "title": "History Q&A Notes",
        "objective": "Deep analytical comprehension of historical events",
        "problems": [
          {
            "id": "hist-qa-1",
            "book_source": "NCERT",
            "question": "Why did Mahatma Gandhi decide to withdraw the Non-Cooperation Movement in February 1922?",
            "difficulty": "MEDIUM",
            "solution": [
              "Chauri Chaura Incident: In February 1922, a peaceful demonstration of satyagrahis at Chauri Chaura in Gorakhpur, Uttar Pradesh, turned violent when the police fired upon the crowd. In retaliation, angry protesters set fire to a nearby police station, burning 22 policemen alive.",
              "Adherence to Non-Violence: Gandhi was a strict believer in total non-violence (Ahimsa). The incident deeply shocked him.",
              "Need for Training: He realized that the movement was turning violent in many places and that satyagrahis needed proper training before they could engage in massive national struggles.",
              "Immediate Withdrawal: Consequently, he suspended the movement immediately to prevent further violence and regroup."
            ]
          },
          {
            "id": "hist-qa-2",
            "book_source": "NCERT",
            "question": "What was the Rowlatt Act and why did Indians oppose it?",
            "difficulty": "HARD",
            "solution": [
              "Definition: The Rowlatt Act was passed by the Imperial Legislative Council in 1919 despite the united opposition of Indian members.",
              "Repressive Powers: It gave the British government enormous powers to repress political activities, and allowed the detention of political prisoners without trial for up to two years.",
              "Opposition Rationale: Indians opposed it because it violated basic civil liberties, denied the right to a fair trial, and was seen as highly authoritarian and unjust.",
              "Response: Mahatma Gandhi started a non-violent civil disobedience against this 'black act' with a strike (hartal) on April 6, 1919."
            ]
          }
        ]
      }
    }
  },
  civics: {
    subject: "Civics",
    board_source: "CBSE_NCERT",
    chapterNumber: 2,
    chapter: "Power Sharing",
    title: "Civics Notes: Power Sharing in Democracy",
    concepts: [
      {
        name: "Horizontal vs Vertical Power Sharing",
        real_life_application: "Dividing school administration responsibilities between teachers and subject experts (horizontal) vs headmasters and school board governors (vertical).",
        purpose: "Learn how modern democracies share power across organs and tiers to avoid centralized despotism.",
        day_to_day_usage: [
          "Understanding municipal corporation vs state government powers",
          "Respecting separation of powers in student bodies"
        ],
        video_embed: "https://www.youtube.com/embed/0G2z583Vf4E?autoplay=1&mute=1&playlist=0G2z583Vf4E&loop=1&controls=0&rel=0&modestbranding=1"
      }
    ],
    theorems: [],
    exercises: {
      "qa_session_1": {
        "title": "Civics Q&A Notes",
        "objective": "Understand democratic structures and conflict resolution",
        "problems": [
          {
            "id": "civ-qa-1",
            "book_source": "NCERT",
            "question": "Compare the ways in which Belgium and Sri Lanka dealt with cultural and linguistic diversity.",
            "difficulty": "HARD",
            "solution": [
              "Belgium's Accommodation Policy: Belgian leaders recognized regional and cultural differences. They amended their constitution four times between 1970 and 1993 to create a power-sharing model where Dutch and French-speaking ministers have equal representation in the central government. They created a community government to handle education and culture.",
              "Sri Lanka's Majoritarian Policy: In contrast, Sri Lankan leaders adopted majoritarian measures. In 1956, an Act was passed to recognize Sinhala as the only official language, disregarding Tamil. Government policies favored Sinhala applicants for university positions and jobs, causing alienation among Sri Lankan Tamils.",
              "Result: Belgium successfully avoided division, whereas Sri Lanka faced a long and devastating civil war."
            ]
          }
        ]
      }
    }
  },
  geography: {
    subject: "Geography",
    board_source: "CBSE_NCERT",
    chapterNumber: 3,
    chapter: "Resources and Development",
    title: "Geography Notes: Soil & Natural Resources",
    concepts: [
      {
        name: "Soil Classification & Formation",
        real_life_application: "Identifying which crop to plant based on garden soil texture and moisture content.",
        purpose: "Examine various types of soil distributed across India and their agricultural suitability.",
        day_to_day_usage: [
          "Choosing organic fertilizers appropriate for red vs clayey soils",
          "Understanding watershed management and check dams in dry regions"
        ],
        video_embed: "https://www.youtube.com/embed/E-sh99Fae90?autoplay=1&mute=1&playlist=E-sh99Fae90&loop=1&controls=0&rel=0&modestbranding=1"
      }
    ],
    theorems: [],
    exercises: {
      "qa_session_1": {
        "title": "Geography Q&A Notes",
        "objective": "Understand resource classification and soil characteristics",
        "problems": [
          {
            "id": "geo-qa-1",
            "book_source": "NCERT",
            "question": "What is Black Soil? Describe its key characteristics and geographical distribution in India.",
            "difficulty": "MEDIUM",
            "solution": [
              "Nomenclature: Black soil is also known as Regur soil or black cotton soil because it is ideal for growing cotton.",
              "Formation: Formed by the weathering of lava rocks from volcanic eruptions over millions of years.",
              "Properties: Highly clayey, extremely rich in moisture-holding capacity, and contains high amounts of calcium carbonate, magnesium, potash, and lime.",
              "Distribution: Found extensively in the Deccan trap region of Maharashtra, Saurashtra, Malwa, Madhya Pradesh, and Chhattisgarh."
            ]
          }
        ]
      }
    }
  },
  economics: {
    subject: "Economics",
    board_source: "CBSE_NCERT",
    chapterNumber: 4,
    chapter: "Sectors of the Indian Economy",
    title: "Economics Notes: Industrial & Employment Sectors",
    concepts: [
      {
        name: "Primary, Secondary, and Tertiary Sectors",
        real_life_application: "A farmer grows cotton (Primary), a textile mill spins it into cloth (Secondary), and a retail store transports and sells the clothes (Tertiary).",
        purpose: "Categorize economic activities to measure GDP contributions and employment rates.",
        day_to_day_usage: [
          "Understanding where household expenses go (food vs manufacturing vs services like internet/education)",
          "Identifying career paths in modern digital service sectors"
        ],
        video_embed: "https://www.youtube.com/embed/wzP_tDsbRoo?autoplay=1&mute=1&playlist=wzP_tDsbRoo&loop=1&controls=0&rel=0&modestbranding=1"
      }
    ],
    theorems: [],
    exercises: {
      "qa_session_1": {
        "title": "Economics Q&A Notes",
        "objective": "Analyze employment sectors and national production",
        "problems": [
          {
            "id": "econ-qa-1",
            "book_source": "NCERT",
            "question": "Explain the difference between the Organized Sector and the Unorganized Sector.",
            "difficulty": "MEDIUM",
            "solution": [
              "Organized Sector: Covers enterprises where the terms of employment are regular and secure. They are registered under government acts (like Factories Act, Shops and Establishment Act) and workers enjoy social security benefits like pensions, gratuity, fixed working hours, and paid leaves.",
              "Unorganized Sector: Consists of small and scattered units largely outside government control. Employment is insecure, working hours are irregular with no overtime pay, and there are no social security benefits or paid leaves."
            ]
          }
        ]
      }
    }
  }
};

// Write notes JSON files to respective directories
Object.entries(socialData).forEach(([subj, content]) => {
  const targetPath = path.join(baseContent, 'social', 'cbse_ncert', `${subj}.json`);
  fs.writeFileSync(targetPath, JSON.stringify(content, null, 2));
  console.log(`Successfully wrote detailed Q&A notes for Social: ${subj} to ${targetPath}`);
});
