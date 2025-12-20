// prisma/seed.js
require("dotenv").config();
const { PrismaClient, ReservationStatus, Role } = require("@prisma/client");
const bcrypt = require("bcrypt");

const prisma = new PrismaClient();

// Helpers -------------------------------------------------------------

const slug = (str) =>
  str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

const placeholderImage = (label) =>
  `https://picsum.photos/seed/${slug(label)}/800/600`;

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const pickN = (arr, n = 2) => [...arr].sort(() => 0.5 - Math.random()).slice(0, n);

const randPop = () => Math.floor(Math.random() * 200) + 50;
const randPrice = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

// Add days to date
const addDays = (date, days) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

// =====================================================================
// SEED DATA
// =====================================================================

// Countries + Cities with realistic data
const COUNTRIES = [
  {
    name: "United Arab Emirates",
    description: "Modern Gulf nation known for skyscrapers, luxury shopping, and rich culture. A perfect blend of tradition and innovation.",
    cities: [
      {
        name: "Dubai",
        description: "The City of Gold, featuring the world's tallest building, luxury resorts, and stunning architecture.",
        places: [
          {
            name: "Burj Khalifa",
            description: "World's tallest building with breathtaking views from the observation deck.",
            location: "1 Sheikh Mohammed bin Rashid Blvd, Dubai",
            categories: ["Landmarks", "Historical"],
            themes: ["Luxury", "Photography"],
          },
          {
            name: "The Dubai Mall",
            description: "One of the largest shopping malls in the world with over 1,200 retail outlets.",
            location: "Financial Centre Road, Dubai",
            categories: ["Shopping", "Food & Dining"],
            themes: ["Family-friendly", "Luxury"],
          },
          {
            name: "Palm Jumeirah",
            description: "Artificial archipelago shaped like a palm tree, home to luxury resorts and beaches.",
            location: "Palm Jumeirah, Dubai",
            categories: ["Beaches", "Luxury"],
            themes: ["Romantic", "Luxury"],
          },
          {
            name: "Dubai Marina",
            description: "Stunning waterfront district with skyscrapers, yachts, and vibrant nightlife.",
            location: "Dubai Marina, Dubai",
            categories: ["Nightlife", "Shopping"],
            themes: ["Photography", "Cultural immersion"],
          },
          {
            name: "Dubai Museum",
            description: "Housed in Al Fahidi Fort, showcasing Dubai's history and culture.",
            location: "Al Fahidi Fort, Bur Dubai",
            categories: ["Museums", "Historical", "Cultural"],
            themes: ["Cultural immersion", "Family-friendly"],
          },
        ],
      },
      {
        name: "Abu Dhabi",
        description: "Capital city known for the magnificent Sheikh Zayed Grand Mosque and cultural sites.",
        places: [
          {
            name: "Sheikh Zayed Grand Mosque",
            description: "One of the world's largest mosques, featuring stunning white marble architecture.",
            location: "Sheikh Rashid Bin Saeed Street, Abu Dhabi",
            categories: ["Landmarks", "Cultural", "Historical"],
            themes: ["Photography", "Cultural immersion"],
          },
          {
            name: "Louvre Abu Dhabi",
            description: "Universal museum showcasing art and civilization from around the world.",
            location: "Saadiyat Cultural District, Abu Dhabi",
            categories: ["Museums", "Cultural"],
            themes: ["Cultural immersion", "Family-friendly"],
          },
          {
            name: "Yas Island",
            description: "Entertainment hub with theme parks, beaches, and Formula 1 circuit.",
            location: "Yas Island, Abu Dhabi",
            categories: ["Adventure", "Beaches"],
            themes: ["Family-friendly", "Adventure"],
          },
        ],
      },
    ],
  },
  {
    name: "Turkey",
    description: "Where East meets West: rich history, delicious cuisine, stunning beaches, and warm hospitality.",
    cities: [
      {
        name: "Istanbul",
        description: "Historic city straddling two continents, home to magnificent mosques and bazaars.",
        places: [
          {
            name: "Hagia Sophia",
            description: "Iconic architectural marvel that has served as both a church and mosque.",
            location: "Sultan Ahmet, Fatih, Istanbul",
            categories: ["Historical", "Landmarks", "Cultural"],
            themes: ["Photography", "Cultural immersion"],
          },
          {
            name: "Blue Mosque",
            description: "17th-century mosque famous for its blue Iznik tiles and six minarets.",
            location: "Sultan Ahmet, Fatih, Istanbul",
            categories: ["Historical", "Cultural", "Landmarks"],
            themes: ["Photography", "Cultural immersion"],
          },
          {
            name: "Grand Bazaar",
            description: "One of the largest and oldest covered markets in the world with over 4,000 shops.",
            location: "Beyazıt, Fatih, Istanbul",
            categories: ["Shopping", "Cultural", "Historical"],
            themes: ["Cultural immersion", "Budget"],
          },
          {
            name: "Bosphorus Cruise",
            description: "Scenic boat ride along the Bosphorus Strait separating Europe and Asia.",
            location: "Eminönü, Istanbul",
            categories: ["Adventure", "Cultural"],
            themes: ["Romantic", "Photography"],
          },
        ],
      },
      {
        name: "Antalya",
        description: "Mediterranean resort city with beautiful beaches, ancient ruins, and luxury resorts.",
        places: [
          {
            name: "Kaleiçi Old Town",
            description: "Historic harbor district with narrow streets, Ottoman houses, and charming cafes.",
            location: "Kaleiçi, Antalya",
            categories: ["Historical", "Cultural"],
            themes: ["Photography", "Cultural immersion"],
          },
          {
            name: "Düden Waterfalls",
            description: "Stunning waterfalls cascading into the Mediterranean Sea.",
            location: "Düden Park, Antalya",
            categories: ["Nature", "Adventure"],
            themes: ["Family-friendly", "Photography"],
          },
          {
            name: "Antalya Beach",
            description: "Beautiful sandy beach with crystal-clear waters and beach clubs.",
            location: "Konyaaltı Beach, Antalya",
            categories: ["Beaches"],
            themes: ["Relaxation", "Family-friendly"],
          },
        ],
      },
    ],
  },
  {
    name: "Italy",
    description: "Land of art, history, breathtaking architecture, and the world's best cuisine.",
    cities: [
      {
        name: "Rome",
        description: "The Eternal City, home to ancient ruins, Renaissance art, and world-class cuisine.",
        places: [
          {
            name: "Colosseum",
            description: "Ancient amphitheater and iconic symbol of Rome, once hosting gladiator battles.",
            location: "Piazza del Colosseo, Rome",
            categories: ["Historical", "Landmarks"],
            themes: ["Photography", "Cultural immersion"],
          },
          {
            name: "Vatican Museums",
            description: "Extensive collection of art including the Sistine Chapel ceiling by Michelangelo.",
            location: "Vatican City, Rome",
            categories: ["Museums", "Cultural", "Historical"],
            themes: ["Cultural immersion", "Family-friendly"],
          },
          {
            name: "Trevi Fountain",
            description: "Baroque fountain where visitors toss coins to ensure their return to Rome.",
            location: "Piazza di Trevi, Rome",
            categories: ["Landmarks", "Cultural"],
            themes: ["Romantic", "Photography"],
          },
          {
            name: "Roman Forum",
            description: "Ancient ruins of the political and commercial heart of ancient Rome.",
            location: "Via della Salara Vecchia, Rome",
            categories: ["Historical", "Cultural"],
            themes: ["Cultural immersion", "Photography"],
          },
        ],
      },
      {
        name: "Venice",
        description: "The floating city of canals, gondolas, and romantic architecture.",
        places: [
          {
            name: "St. Mark's Square",
            description: "Main public square featuring St. Mark's Basilica and the Doge's Palace.",
            location: "Piazza San Marco, Venice",
            categories: ["Historical", "Landmarks", "Cultural"],
            themes: ["Photography", "Romantic"],
          },
          {
            name: "Grand Canal",
            description: "Main waterway of Venice, perfect for gondola rides and sightseeing.",
            location: "Grand Canal, Venice",
            categories: ["Adventure", "Cultural"],
            themes: ["Romantic", "Photography"],
          },
          {
            name: "Rialto Bridge",
            description: "Iconic stone bridge spanning the Grand Canal, one of Venice's symbols.",
            location: "Rialto Bridge, Venice",
            categories: ["Landmarks", "Historical"],
            themes: ["Photography", "Romantic"],
          },
        ],
      },
    ],
  },
  {
    name: "Japan",
    description: "High-tech meets tradition: temples, cherry blossoms, incredible food, and unique culture.",
    cities: [
      {
        name: "Tokyo",
        description: "Vibrant metropolis blending ultra-modern with traditional, from neon-lit streets to serene temples.",
        places: [
          {
            name: "Shibuya Crossing",
            description: "World's busiest pedestrian crossing, a symbol of Tokyo's energy.",
            location: "Shibuya, Tokyo",
            categories: ["Landmarks", "Cultural"],
            themes: ["Photography", "Cultural immersion"],
          },
          {
            name: "Senso-ji Temple",
            description: "Tokyo's oldest temple in Asakusa, surrounded by traditional shops.",
            location: "2 Chome-3-1 Asakusa, Taito City, Tokyo",
            categories: ["Historical", "Cultural"],
            themes: ["Cultural immersion", "Photography"],
          },
          {
            name: "Tokyo Skytree",
            description: "World's tallest tower offering panoramic views of the city.",
            location: "1 Chome-1-2 Oshiage, Sumida City, Tokyo",
            categories: ["Landmarks", "Adventure"],
            themes: ["Photography", "Family-friendly"],
          },
          {
            name: "Tsukiji Outer Market",
            description: "Famous fish market with fresh seafood and authentic Japanese cuisine.",
            location: "4 Chome-16-2 Tsukiji, Chuo City, Tokyo",
            categories: ["Food & Dining", "Cultural"],
            themes: ["Cultural immersion", "Food & Dining"],
          },
        ],
      },
      {
        name: "Kyoto",
        description: "Ancient capital with thousands of temples, gardens, and traditional geisha districts.",
        places: [
          {
            name: "Fushimi Inari Shrine",
            description: "Famous shrine with thousands of vermillion torii gates forming tunnel paths.",
            location: "68 Fukakusa Yabunouchicho, Fushimi Ward, Kyoto",
            categories: ["Cultural", "Historical"],
            themes: ["Photography", "Cultural immersion"],
          },
          {
            name: "Arashiyama Bamboo Grove",
            description: "Magical bamboo forest creating a serene walking path.",
            location: "Arashiyama, Ukyo Ward, Kyoto",
            categories: ["Nature", "Cultural"],
            themes: ["Photography", "Relaxation"],
          },
          {
            name: "Kinkaku-ji (Golden Pavilion)",
            description: "Zen temple covered in gold leaf, reflected in a tranquil pond.",
            location: "1 Kinkakujicho, Kita Ward, Kyoto",
            categories: ["Cultural", "Historical"],
            themes: ["Photography", "Cultural immersion"],
          },
        ],
      },
    ],
  },
  {
    name: "Malaysia",
    description: "Tropical paradise with rainforests, diverse cuisine, stunning islands, and multicultural heritage.",
    cities: [
      {
        name: "Kuala Lumpur",
        description: "Modern capital featuring the iconic Petronas Towers, vibrant markets, and diverse cuisine.",
        places: [
          {
            name: "Petronas Twin Towers",
            description: "Iconic twin skyscrapers, once the world's tallest buildings, with observation deck.",
            location: "Kuala Lumpur City Centre, Kuala Lumpur",
            categories: ["Landmarks", "Shopping"],
            themes: ["Photography", "Luxury"],
          },
          {
            name: "Batu Caves",
            description: "Limestone caves with colorful Hindu temple and 272 rainbow-colored steps.",
            location: "Batu Caves, Selangor",
            categories: ["Cultural", "Adventure"],
            themes: ["Cultural immersion", "Photography"],
          },
          {
            name: "Central Market",
            description: "Cultural market selling Malaysian crafts, souvenirs, and street food.",
            location: "Jalan Hang Kasturi, Kuala Lumpur",
            categories: ["Shopping", "Food & Dining", "Cultural"],
            themes: ["Budget", "Cultural immersion"],
          },
        ],
      },
      {
        name: "Langkawi",
        description: "Tropical island paradise with pristine beaches, lush rainforests, and duty-free shopping.",
        places: [
          {
            name: "Langkawi Sky Bridge",
            description: "Curved suspension bridge offering stunning views of the rainforest and ocean.",
            location: "Langkawi Sky Bridge, Langkawi",
            categories: ["Adventure", "Nature"],
            themes: ["Adventure", "Photography"],
          },
          {
            name: "Cenang Beach",
            description: "Popular beach with white sand, clear waters, and water sports activities.",
            location: "Pantai Cenang, Langkawi",
            categories: ["Beaches", "Adventure"],
            themes: ["Relaxation", "Family-friendly"],
          },
        ],
      },
    ],
  },
];

// Categories
const CATEGORIES = [
  "Nature",
  "Beaches",
  "Museums",
  "Historical",
  "Adventure",
  "Shopping",
  "Food & Dining",
  "Nightlife",
  "Cultural",
  "Landmarks",
];

// Themes
const THEMES = [
  "Photography",
  "Family-friendly",
  "Romantic",
  "Budget",
  "Luxury",
  "Cultural immersion",
  "Relaxation",
  "Road trips",
];

// Activity templates by category
const ACTIVITIES_BY_TYPE = {
  museum: [
    "Guided Museum Tour",
    "Art Workshop",
    "Historical Lecture",
    "Interactive Exhibition",
  ],
  nature: [
    "Nature Walk",
    "Hiking Trail",
    "Wildlife Watching",
    "Sunset Viewing",
  ],
  adventure: [
    "Water Sports",
    "Rock Climbing",
    "Zip-lining",
    "Scuba Diving",
  ],
  cultural: [
    "Cultural Workshop",
    "Traditional Cooking Class",
    "Local Crafts Workshop",
    "Cultural Performance",
  ],
  shopping: [
    "Shopping Tour",
    "Market Exploration",
    "Local Product Tasting",
  ],
  beaches: [
    "Beach Activities",
    "Water Sports",
    "Sunset Cruise",
    "Beach Volleyball",
  ],
  food: [
    "Food Tour",
    "Cooking Class",
    "Wine Tasting",
    "Street Food Tasting",
  ],
  landmarks: [
    "Guided Tour",
    "Photography Tour",
    "Sunrise/Sunset Visit",
  ],
};

// Hotels data
const HOTELS_DATA = {
  Dubai: [
    {
      name: "Burj Al Arab",
      description: "Iconic 7-star luxury hotel on an artificial island, symbol of Dubai's opulence.",
      pricePerNight: 2500,
      roomTypes: [
        { name: "Deluxe Suite", maxGuests: 2, pricePerNight: 2500, capacity: 5, description: "Luxurious suite with stunning sea views" },
        { name: "Panoramic Suite", maxGuests: 4, pricePerNight: 3500, capacity: 3, description: "Spacious suite with panoramic views" },
        { name: "Royal Suite", maxGuests: 6, pricePerNight: 5000, capacity: 2, description: "Ultra-luxurious royal suite" },
      ],
    },
    {
      name: "Atlantis The Palm",
      description: "Resort hotel with aquariums, water parks, and stunning beachfront location.",
      pricePerNight: 800,
      roomTypes: [
        { name: "Deluxe Room", maxGuests: 2, pricePerNight: 800, capacity: 10, description: "Comfortable room with ocean views" },
        { name: "Family Suite", maxGuests: 4, pricePerNight: 1200, capacity: 8, description: "Perfect for families" },
        { name: "Underwater Suite", maxGuests: 2, pricePerNight: 3000, capacity: 2, description: "Unique underwater experience" },
      ],
    },
  ],
  "Abu Dhabi": [
    {
      name: "Emirates Palace",
      description: "Luxurious palace hotel with private beach and world-class amenities.",
      pricePerNight: 600,
      roomTypes: [
        { name: "Deluxe Room", maxGuests: 2, pricePerNight: 600, capacity: 15, description: "Elegant room with palace views" },
        { name: "Palace Suite", maxGuests: 4, pricePerNight: 1500, capacity: 5, description: "Spacious palace suite" },
      ],
    },
  ],
  Istanbul: [
    {
      name: "Four Seasons Hotel Istanbul at Sultanahmet",
      description: "Luxury hotel in historic district, near major attractions.",
      pricePerNight: 400,
      roomTypes: [
        { name: "Deluxe Room", maxGuests: 2, pricePerNight: 400, capacity: 12, description: "Elegant room with city views" },
        { name: "Historic Suite", maxGuests: 3, pricePerNight: 800, capacity: 4, description: "Suite in historic building" },
      ],
    },
  ],
  Antalya: [
    {
      name: "Mardan Palace",
      description: "Ultra-luxury resort with private beach and Turkish bath.",
      pricePerNight: 500,
      roomTypes: [
        { name: "Sea View Room", maxGuests: 2, pricePerNight: 500, capacity: 10, description: "Room with Mediterranean views" },
        { name: "Beach Villa", maxGuests: 4, pricePerNight: 1200, capacity: 3, description: "Private beachfront villa" },
      ],
    },
  ],
  Rome: [
    {
      name: "Hotel de Russie",
      description: "Luxury hotel near Spanish Steps with beautiful gardens.",
      pricePerNight: 450,
      roomTypes: [
        { name: "Superior Room", maxGuests: 2, pricePerNight: 450, capacity: 10, description: "Elegant Roman accommodation" },
        { name: "Junior Suite", maxGuests: 3, pricePerNight: 750, capacity: 5, description: "Spacious suite in historic building" },
      ],
    },
  ],
  Venice: [
    {
      name: "The Gritti Palace",
      description: "Historic luxury hotel on Grand Canal with Venetian elegance.",
      pricePerNight: 600,
      roomTypes: [
        { name: "Canal View Room", maxGuests: 2, pricePerNight: 600, capacity: 8, description: "Room overlooking Grand Canal" },
        { name: "Palace Suite", maxGuests: 4, pricePerNight: 1500, capacity: 3, description: "Luxurious palace suite" },
      ],
    },
  ],
  Tokyo: [
    {
      name: "The Ritz-Carlton Tokyo",
      description: "Luxury hotel in Roppongi with stunning city views.",
      pricePerNight: 500,
      roomTypes: [
        { name: "Deluxe Room", maxGuests: 2, pricePerNight: 500, capacity: 12, description: "Modern room with skyline views" },
        { name: "Executive Suite", maxGuests: 4, pricePerNight: 1200, capacity: 4, description: "Spacious executive suite" },
      ],
    },
  ],
  Kyoto: [
    {
      name: "The Ritz-Carlton Kyoto",
      description: "Luxury hotel blending traditional Japanese aesthetics with modern comfort.",
      pricePerNight: 550,
      roomTypes: [
        { name: "Garden View Room", maxGuests: 2, pricePerNight: 550, capacity: 10, description: "Room with Japanese garden views" },
        { name: "Traditional Suite", maxGuests: 3, pricePerNight: 1300, capacity: 3, description: "Traditional Japanese-style suite" },
      ],
    },
  ],
  "Kuala Lumpur": [
    {
      name: "Mandarin Oriental Kuala Lumpur",
      description: "Luxury hotel with views of Petronas Towers.",
      pricePerNight: 300,
      roomTypes: [
        { name: "City View Room", maxGuests: 2, pricePerNight: 300, capacity: 15, description: "Room with city skyline views" },
        { name: "Tower View Suite", maxGuests: 4, pricePerNight: 800, capacity: 5, description: "Suite with Petronas Towers view" },
      ],
    },
  ],
  Langkawi: [
    {
      name: "The Datai Langkawi",
      description: "Beachfront resort nestled in ancient rainforest.",
      pricePerNight: 400,
      roomTypes: [
        { name: "Rainforest Villa", maxGuests: 2, pricePerNight: 400, capacity: 8, description: "Villa surrounded by nature" },
        { name: "Beach Villa", maxGuests: 4, pricePerNight: 1000, capacity: 4, description: "Beachfront villa with private pool" },
      ],
    },
  ],
};

// Trips data
const TRIPS_DATA = {
  Dubai: [
    {
      name: "Dubai Luxury Experience",
      description: "3-day luxury tour including Burj Khalifa, Palm Jumeirah, and desert safari.",
      price: 1500,
    },
    {
      name: "Dubai Shopping & Culture",
      description: "4-day trip exploring malls, souks, and cultural sites.",
      price: 800,
    },
  ],
  "Abu Dhabi": [
    {
      name: "Abu Dhabi Cultural Journey",
      description: "2-day tour of Grand Mosque, Louvre, and cultural sites.",
      price: 600,
    },
  ],
  Istanbul: [
    {
      name: "Istanbul Historical Tour",
      description: "3-day journey through Istanbul's most iconic historical sites.",
      price: 450,
    },
    {
      name: "Istanbul Food & Culture",
      description: "2-day culinary and cultural exploration.",
      price: 300,
    },
  ],
  Antalya: [
    {
      name: "Antalya Beach Paradise",
      description: "3-day beach vacation with water sports and relaxation.",
      price: 400,
    },
  ],
  Rome: [
    {
      name: "Rome in 3 Days",
      description: "Comprehensive tour of Colosseum, Vatican, and Roman landmarks.",
      price: 500,
    },
    {
      name: "Rome Food & Wine Tour",
      description: "2-day culinary adventure through Rome's best restaurants.",
      price: 350,
    },
  ],
  Venice: [
    {
      name: "Venice Romance Package",
      description: "2-day romantic getaway with gondola rides and fine dining.",
      price: 600,
    },
  ],
  Tokyo: [
    {
      name: "Tokyo Discovery Tour",
      description: "4-day exploration of modern and traditional Tokyo.",
      price: 700,
    },
  ],
  Kyoto: [
    {
      name: "Kyoto Temple & Culture",
      description: "3-day journey through Kyoto's temples and traditional culture.",
      price: 550,
    },
  ],
  "Kuala Lumpur": [
    {
      name: "Kuala Lumpur City Tour",
      description: "2-day tour of Petronas Towers, Batu Caves, and city highlights.",
      price: 250,
    },
  ],
  Langkawi: [
    {
      name: "Langkawi Island Adventure",
      description: "3-day island escape with beaches and nature activities.",
      price: 400,
    },
  ],
};

// Users
const USERS = [
  { email: "admin@example.com", password: "Admin123!", role: Role.ADMIN },
  { email: "john.doe@example.com", password: "User123!", role: Role.USER },
  { email: "sarah.smith@example.com", password: "User123!", role: Role.USER },
  { email: "mike.johnson@example.com", password: "User123!", role: Role.USER },
  { email: "emma.wilson@example.com", password: "User123!", role: Role.USER },
];

// =====================================================================
// MAIN SEED FUNCTION
// =====================================================================

async function main() {
  console.log("🌱 Starting comprehensive database seeding...\n");

  // Clear existing data (optional - uncomment if you want fresh seed)
  // console.log("⚠️  Clearing existing data...");
  // await prisma.tripReservation.deleteMany();
  // await prisma.reservation.deleteMany();
  // await prisma.trip.deleteMany();
  // await prisma.roomType.deleteMany();
  // await prisma.hotel.deleteMany();
  // await prisma.activity.deleteMany();
  // await prisma.place.deleteMany();
  // await prisma.city.deleteMany();
  // await prisma.country.deleteMany();
  // await prisma.userPreference.deleteMany();
  // await prisma.user.deleteMany();
  // await prisma.theme.deleteMany();
  // await prisma.category.deleteMany();

  // Users -------------------------------------------------------------
  console.log("👥 Creating users...");
  const createdUsers = [];
  for (const userData of USERS) {
    const hashed = await bcrypt.hash(userData.password, 12);
    const user = await prisma.user.upsert({
      where: { email: userData.email },
      update: { password: hashed, role: userData.role },
      create: {
        email: userData.email,
        password: hashed,
        role: userData.role,
      },
    });
    createdUsers.push(user);
    console.log(`  ✓ Created user: ${user.email} (${user.role})`);
  }
  const adminUser = createdUsers.find(u => u.role === Role.ADMIN);
  const regularUsers = createdUsers.filter(u => u.role === Role.USER);

  // Categories -------------------------------------------------------
  console.log("\n📂 Creating categories...");
  const createdCategories = [];
  for (const name of CATEGORIES) {
    const category = await prisma.category.upsert({
      where: { name },
      update: {},
      create: { name },
    });
    createdCategories.push(category);
  }
  console.log(`  ✓ Created ${createdCategories.length} categories`);

  // Themes -----------------------------------------------------------
  console.log("\n🎨 Creating themes...");
  const createdThemes = [];
  for (const name of THEMES) {
    const theme = await prisma.theme.upsert({
      where: { name },
      update: {},
      create: { name },
    });
    createdThemes.push(theme);
  }
  console.log(`  ✓ Created ${createdThemes.length} themes`);

  // Countries, Cities, Places, Activities ---------------------------
  console.log("\n🌍 Creating countries, cities, and places...");
  const cityMap = new Map(); // Store cities by name for later use
  const placeMap = new Map(); // Store places by name for later use
  const allActivities = [];
  const activitiesByCity = new Map(); // Map city names to their activities

  for (const countryData of COUNTRIES) {
    const country = await prisma.country.upsert({
      where: { name: countryData.name },
      update: { description: countryData.description },
      create: {
        name: countryData.name,
        description: countryData.description,
        imageUrl: placeholderImage(countryData.name),
      },
    });

    for (const cityData of countryData.cities) {
      const city = await prisma.city.upsert({
        where: { name: cityData.name },
        update: { description: cityData.description },
        create: {
          name: cityData.name,
          description: cityData.description,
          imageUrl: placeholderImage(`${countryData.name}-${cityData.name}`),
          countryId: country.id,
        },
      });
      cityMap.set(cityData.name, city);

      // Create places for this city
      for (const placeData of cityData.places) {
        const place = await prisma.place.upsert({
          where: { name: placeData.name },
          update: {
            description: placeData.description,
            location: placeData.location,
          },
          create: {
            name: placeData.name,
            description: placeData.description,
            location: placeData.location,
            imageUrls: [
              placeholderImage(placeData.name),
              placeholderImage(`${placeData.name}-2`),
            ],
            cityId: city.id,
            popularity: randPop(),
          },
        });
        placeMap.set(placeData.name, place);

        // Connect categories
        const placeCategories = createdCategories.filter(c =>
          placeData.categories.includes(c.name)
        );
        if (placeCategories.length > 0) {
          await prisma.place.update({
            where: { id: place.id },
            data: {
              categories: {
                connect: placeCategories.map(c => ({ id: c.id })),
              },
            },
          });
        }

        // Connect themes
        const placeThemes = pickN(createdThemes, Math.min(2, placeData.themes?.length || 2));
        if (placeThemes.length > 0) {
          await prisma.place.update({
            where: { id: place.id },
            data: {
              themes: {
                connect: placeThemes.map(t => ({ id: t.id })),
              },
            },
          });
        }

        // Create activities for this place
        const activityType = placeData.categories[0]?.toLowerCase() || "cultural";
        const activityTemplates = ACTIVITIES_BY_TYPE[activityType] || ACTIVITIES_BY_TYPE.cultural;
        const activitiesToCreate = pickN(activityTemplates, 2);

        for (const activityName of activitiesToCreate) {
          const activity = await prisma.activity.create({
            data: {
              name: `${placeData.name} - ${activityName}`,
              description: `${activityName} at ${placeData.name} in ${cityData.name}.`,
              imageUrl: placeholderImage(`${placeData.name}-${activityName}`),
              placeId: place.id,
            },
          });
          allActivities.push(activity);
          
          // Store activity by city
          if (!activitiesByCity.has(cityData.name)) {
            activitiesByCity.set(cityData.name, []);
          }
          activitiesByCity.get(cityData.name).push(activity);
        }
      }
    }
  }
  console.log(`  ✓ Created ${cityMap.size} cities and ${placeMap.size} places`);
  console.log(`  ✓ Created ${allActivities.length} activities`);

  // Hotels and Room Types --------------------------------------------
  console.log("\n🏨 Creating hotels and room types...");
  const hotelMap = new Map();
  const roomTypeMap = [];

  for (const [cityName, hotelDataArray] of Object.entries(HOTELS_DATA)) {
    const city = cityMap.get(cityName);
    if (!city) continue;

    for (const hotelData of hotelDataArray) {
      const hotel = await prisma.hotel.create({
        data: {
          name: hotelData.name,
          description: hotelData.description,
          imageUrl: placeholderImage(hotelData.name),
          cityId: city.id,
          pricePerNight: hotelData.pricePerNight,
        },
      });
      hotelMap.set(`${cityName}-${hotelData.name}`, hotel);

      // Create room types
      for (const roomTypeData of hotelData.roomTypes) {
        const roomType = await prisma.roomType.create({
          data: {
            name: roomTypeData.name,
            description: roomTypeData.description,
            maxGuests: roomTypeData.maxGuests,
            pricePerNight: roomTypeData.pricePerNight,
            capacity: roomTypeData.capacity,
            hotelId: hotel.id,
          },
        });
        roomTypeMap.push({ roomType, hotel, cityName });
      }
    }
  }
  console.log(`  ✓ Created ${hotelMap.size} hotels with room types`);

  // Trips ------------------------------------------------------------
  console.log("\n✈️  Creating trips...");
  const tripMap = new Map();

  for (const [cityName, tripDataArray] of Object.entries(TRIPS_DATA)) {
    const city = cityMap.get(cityName);
    if (!city) continue;

    for (const tripData of tripDataArray) {
      // Find a hotel in this city (optional)
      const cityHotels = Array.from(hotelMap.entries())
        .filter(([key]) => key.startsWith(`${cityName}-`))
        .map(([, hotel]) => hotel);
      const hotel = cityHotels.length > 0 ? pick(cityHotels) : null;

      // Get activities from places in this city
      const cityActivities = activitiesByCity.get(cityName) || [];
      const tripActivities = cityActivities.length > 0
        ? pickN(cityActivities, Math.min(Math.floor(Math.random() * 3) + 2, cityActivities.length))
        : pickN(allActivities, Math.min(3, allActivities.length));

      const trip = await prisma.trip.create({
        data: {
          name: tripData.name,
          description: tripData.description,
          imageUrl: placeholderImage(tripData.name),
          cityId: city.id,
          hotelId: hotel?.id,
          price: tripData.price,
          activities: {
            connect: tripActivities.map(a => ({ id: a.id })),
          },
        },
      });
      tripMap.set(`${cityName}-${tripData.name}`, trip);
    }
  }
  console.log(`  ✓ Created ${tripMap.size} trips`);

  // Reservations -----------------------------------------------------
  console.log("\n📅 Creating reservations...");
  let reservationCount = 0;

  // Create some hotel reservations
  for (let i = 0; i < 10; i++) {
    if (roomTypeMap.length === 0) break;
    
    const { roomType, hotel } = pick(roomTypeMap);
    const user = pick(regularUsers);
    const startDate = addDays(new Date(), Math.floor(Math.random() * 30) + 1);
    const endDate = addDays(startDate, Math.floor(Math.random() * 7) + 1);
    const guests = Math.floor(Math.random() * roomType.maxGuests) + 1;
    const nights = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
    const totalPrice = roomType.pricePerNight * nights * guests;
    const status = pick([ReservationStatus.PENDING, ReservationStatus.CONFIRMED, ReservationStatus.CANCELLED]);

    await prisma.reservation.create({
      data: {
        userId: user.id,
        roomTypeId: roomType.id,
        startDate,
        endDate,
        guests,
        totalPrice,
        status,
      },
    });
    reservationCount++;
  }
  console.log(`  ✓ Created ${reservationCount} hotel reservations`);

  // Create some trip reservations
  let tripReservationCount = 0;
  const allTrips = Array.from(tripMap.values());
  
  for (let i = 0; i < 8; i++) {
    if (allTrips.length === 0) break;
    
    const trip = pick(allTrips);
    const user = pick(regularUsers);
    const guests = Math.floor(Math.random() * 4) + 1;
    const status = pick([ReservationStatus.PENDING, ReservationStatus.CONFIRMED, ReservationStatus.CANCELLED]);

    await prisma.tripReservation.create({
      data: {
        userId: user.id,
        tripId: trip.id,
        guests,
        status,
      },
    });
    tripReservationCount++;
  }
  console.log(`  ✓ Created ${tripReservationCount} trip reservations`);

  // Summary ----------------------------------------------------------
  console.log("\n" + "=".repeat(50));
  console.log("✅ Seeding completed successfully!\n");
  console.log("Summary:");
  console.log(`  👥 Users: ${createdUsers.length} (1 admin, ${regularUsers.length} regular)`);
  console.log(`  📂 Categories: ${createdCategories.length}`);
  console.log(`  🎨 Themes: ${createdThemes.length}`);
  console.log(`  🌍 Countries: ${COUNTRIES.length}`);
  console.log(`  🏙️  Cities: ${cityMap.size}`);
  console.log(`  📍 Places: ${placeMap.size}`);
  console.log(`  🎯 Activities: ${allActivities.length}`);
  console.log(`  🏨 Hotels: ${hotelMap.size}`);
  console.log(`  ✈️  Trips: ${tripMap.size}`);
  console.log(`  📅 Reservations: ${reservationCount + tripReservationCount}`);
  console.log("\n" + "=".repeat(50));
  console.log("\n🔑 Login credentials:");
  console.log(`   Admin: admin@example.com / Admin123!`);
  console.log(`   Users: john.doe@example.com / User123!`);
  console.log(`          (and 3 more users with same password)\n`);
}

// Execute
main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
