const fs = require('fs');
const path = require('path');

const syllabusPath = path.join(__dirname, '..', 'data', 'syllabus.json');

const socialStudiesSubject = {
  "id": "social-studies",
  "name": "Social Studies",
  "description": "NCERT Class X Social Sciences covering History, Civics, Geography, and Economics.",
  "chapters": [
    {
      "id": "nationalism-in-india",
      "name": "Nationalism in India",
      "summary": "The Non-Cooperation Movement, Civil Disobedience Movement, and Salt Satyagraha.",
      "topics": [
        "Non-Cooperation Movement",
        "Salt Satyagraha & Civil Disobedience",
        "Sense of Collective Belonging"
      ],
      "theorems": [],
      "exercises": [
        {
          "id": "soc-1",
          "question": "Explain the significance of the Salt March led by Mahatma Gandhi in 1930.",
          "solution": "Salt was chosen because it was consumed by rich and poor alike, making salt tax an essential grievance unifying all Indians. Gandhi walked 240 miles from Sabarmati to Dandi, breaking the British salt monopoly law on 6 April 1930 and triggering the Civil Disobedience Movement nationwide."
        }
      ]
    },
    {
      "id": "resources-and-development",
      "name": "Resources and Development",
      "summary": "Classification of resources, land utilization, soil types in India, and conservation.",
      "topics": [
        "Resource Planning in India",
        "Soil Classification & Erosion Control",
        "Sustainable Development"
      ],
      "theorems": [],
      "exercises": [
        {
          "id": "soc-2",
          "question": "Differentiate between Black Soil and Alluvial Soil in India.",
          "solution": "Alluvial Soil is deposited by Indus, Ganga, and Brahmaputra rivers, ideal for wheat, paddy, and sugarcane (found in Northern Plains). Black Soil (Regur) is made of volcanic lava, highly moisture retentive, ideal for cotton cultivation (found in Deccan Trap)."
        }
      ]
    },
    {
      "id": "power-sharing",
      "name": "Power Sharing in Democracy",
      "summary": "Belgian and Sri Lankan models, horizontal and vertical power sharing.",
      "topics": [
        "Majoritarianism vs Accommodation",
        "Forms of Power Sharing",
        "Checks and Balances"
      ],
      "theorems": [],
      "exercises": [
        {
          "id": "soc-3",
          "question": "Why is power sharing desirable in democracies?",
          "solution": "Power sharing is desirable for two reasons: (1) Prudential reason: Reduces the possibility of conflict between social groups and ensures political stability. (2) Moral reason: Power sharing is the spirit of democracy; citizens have a right to be consulted on how they are governed."
        }
      ]
    },
    {
      "id": "sectors-of-indian-economy",
      "name": "Sectors of the Indian Economy",
      "summary": "Primary, Secondary, and Tertiary sectors; Organized vs Unorganized sectors.",
      "topics": [
        "Primary, Secondary, Tertiary Sectors",
        "Organized vs Unorganized Sector",
        "MGNREGA 2005"
      ],
      "theorems": [],
      "exercises": [
        {
          "id": "soc-4",
          "question": "Why is the Tertiary Sector growing rapidly in India?",
          "solution": "Tertiary sector (services) is growing rapidly because: (1) Basic services like hospitals, schools, post offices, and police stations are needed. (2) Development of agriculture and industry leads to development of transport, trade, and storage. (3) Rise in income levels demands tourism, shopping, and private schooling."
        }
      ]
    }
  ]
};

if (fs.existsSync(syllabusPath)) {
  const data = JSON.parse(fs.readFileSync(syllabusPath, 'utf8'));
  const existingIndex = data.subjects.findIndex(s => s.id === 'social-studies');
  if (existingIndex >= 0) {
    data.subjects[existingIndex] = socialStudiesSubject;
  } else {
    data.subjects.push(socialStudiesSubject);
  }
  fs.writeFileSync(syllabusPath, JSON.stringify(data, null, 2));
  console.log('Successfully updated data/syllabus.json with Social Studies!');
}
