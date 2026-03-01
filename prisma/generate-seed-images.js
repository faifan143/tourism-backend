// prisma/generate-seed-images.js
// Generates local SVG placeholder images for all seed entities
// Run: node prisma/generate-seed-images.js

const fs = require("fs");
const path = require("path");

const SEED_DIR = path.join(process.cwd(), "uploads", "seed");

// ── Helpers ──────────────────────────────────────────────────────────

const slug = (str) =>
  str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

/** Simple deterministic hash → hue (0-360) */
function hueFromString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return ((hash % 360) + 360) % 360;
}

/** Generate an 800×600 SVG with gradient background and label text */
function generateSvg(label, subtitle = "") {
  const hue = hueFromString(label);
  const hue2 = (hue + 40) % 360;

  // Escape XML special characters
  const esc = (s) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  const escapedLabel = esc(label);
  const escapedSubtitle = esc(subtitle);

  // Truncate long names for display
  const displayLabel =
    escapedLabel.length > 30
      ? escapedLabel.substring(0, 27) + "..."
      : escapedLabel;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:hsl(${hue},65%,45%)" />
      <stop offset="100%" style="stop-color:hsl(${hue2},55%,35%)" />
    </linearGradient>
  </defs>
  <rect width="800" height="600" fill="url(#bg)" />
  <text x="400" y="${subtitle ? 280 : 300}" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="32" font-weight="bold" fill="white" opacity="0.95">${displayLabel}</text>
  ${subtitle ? `<text x="400" y="330" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="18" fill="white" opacity="0.7">${escapedSubtitle}</text>` : ""}
</svg>`;
}

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function writeSvg(label, subtitle = "") {
  const fileName = `${slug(label)}.svg`;
  const filePath = path.join(SEED_DIR, fileName);
  fs.writeFileSync(filePath, generateSvg(label, subtitle), "utf-8");
  return fileName;
}

// ── Seed data (mirrors seed.js) ─────────────────────────────────────

const COUNTRIES = [
  {
    name: "United Arab Emirates",
    cities: [
      {
        name: "Dubai",
        places: [
          "Burj Khalifa", "The Dubai Mall", "Palm Jumeirah",
          "Dubai Marina", "Dubai Museum",
        ],
      },
      {
        name: "Abu Dhabi",
        places: ["Sheikh Zayed Grand Mosque", "Louvre Abu Dhabi", "Yas Island"],
      },
    ],
  },
  {
    name: "Turkey",
    cities: [
      {
        name: "Istanbul",
        places: ["Hagia Sophia", "Blue Mosque", "Grand Bazaar", "Bosphorus Cruise"],
      },
      {
        name: "Antalya",
        places: ["Kaleiçi Old Town", "Düden Waterfalls", "Antalya Beach"],
      },
    ],
  },
  {
    name: "Italy",
    cities: [
      {
        name: "Rome",
        places: ["Colosseum", "Vatican Museums", "Trevi Fountain", "Roman Forum"],
      },
      {
        name: "Venice",
        places: ["St. Mark's Square", "Grand Canal", "Rialto Bridge"],
      },
    ],
  },
  {
    name: "Japan",
    cities: [
      {
        name: "Tokyo",
        places: ["Shibuya Crossing", "Senso-ji Temple", "Tokyo Skytree", "Tsukiji Outer Market"],
      },
      {
        name: "Kyoto",
        places: ["Fushimi Inari Shrine", "Arashiyama Bamboo Grove", "Kinkaku-ji (Golden Pavilion)"],
      },
    ],
  },
  {
    name: "Malaysia",
    cities: [
      {
        name: "Kuala Lumpur",
        places: ["Petronas Twin Towers", "Batu Caves", "Central Market"],
      },
      {
        name: "Langkawi",
        places: ["Langkawi Sky Bridge", "Cenang Beach"],
      },
    ],
  },
];

const HOTELS = {
  Dubai: ["Burj Al Arab", "Atlantis The Palm"],
  "Abu Dhabi": ["Emirates Palace"],
  Istanbul: ["Four Seasons Hotel Istanbul at Sultanahmet"],
  Antalya: ["Mardan Palace"],
  Rome: ["Hotel de Russie"],
  Venice: ["The Gritti Palace"],
  Tokyo: ["The Ritz-Carlton Tokyo"],
  Kyoto: ["The Ritz-Carlton Kyoto"],
  "Kuala Lumpur": ["Mandarin Oriental Kuala Lumpur"],
  Langkawi: ["The Datai Langkawi"],
};

const TRIPS = {
  Dubai: ["Dubai Luxury Experience", "Dubai Shopping & Culture"],
  "Abu Dhabi": ["Abu Dhabi Cultural Journey"],
  Istanbul: ["Istanbul Historical Tour", "Istanbul Food & Culture"],
  Antalya: ["Antalya Beach Paradise"],
  Rome: ["Rome in 3 Days", "Rome Food & Wine Tour"],
  Venice: ["Venice Romance Package"],
  Tokyo: ["Tokyo Discovery Tour"],
  Kyoto: ["Kyoto Temple & Culture"],
  "Kuala Lumpur": ["Kuala Lumpur City Tour"],
  Langkawi: ["Langkawi Island Adventure"],
};

const ACTIVITIES_BY_TYPE = {
  museum: ["Guided Museum Tour", "Art Workshop", "Historical Lecture", "Interactive Exhibition"],
  nature: ["Nature Walk", "Hiking Trail", "Wildlife Watching", "Sunset Viewing"],
  adventure: ["Water Sports", "Rock Climbing", "Zip-lining", "Scuba Diving"],
  cultural: ["Cultural Workshop", "Traditional Cooking Class", "Local Crafts Workshop", "Cultural Performance"],
  shopping: ["Shopping Tour", "Market Exploration", "Local Product Tasting"],
  beaches: ["Beach Activities", "Water Sports", "Sunset Cruise", "Beach Volleyball"],
  food: ["Food Tour", "Cooking Class", "Wine Tasting", "Street Food Tasting"],
  landmarks: ["Guided Tour", "Photography Tour", "Sunrise/Sunset Visit"],
};

// ── Generate all images ─────────────────────────────────────────────

function main() {
  ensureDir(SEED_DIR);
  let count = 0;

  // Countries
  for (const country of COUNTRIES) {
    writeSvg(country.name, "Country");
    count++;

    for (const city of country.cities) {
      // City image (slug uses "country-city")
      writeSvg(`${country.name}-${city.name}`, "City");
      count++;

      for (const place of city.places) {
        // Place images (2 per place)
        writeSvg(place, "Place");
        writeSvg(`${place}-2`, "Place");
        count += 2;

        // Activity images — generate for all activity types to be safe
        for (const activities of Object.values(ACTIVITIES_BY_TYPE)) {
          for (const activity of activities) {
            const key = `${place}-${activity}`;
            const svgPath = path.join(SEED_DIR, `${slug(key)}.svg`);
            if (!fs.existsSync(svgPath)) {
              writeSvg(key, "Activity");
              count++;
            }
          }
        }
      }
    }
  }

  // Hotels
  for (const [, hotelNames] of Object.entries(HOTELS)) {
    for (const name of hotelNames) {
      writeSvg(name, "Hotel");
      count++;
    }
  }

  // Trips
  for (const [, tripNames] of Object.entries(TRIPS)) {
    for (const name of tripNames) {
      writeSvg(name, "Trip");
      count++;
    }
  }

  console.log(`✅ Generated ${count} SVG placeholder images in ${SEED_DIR}`);
}

main();
