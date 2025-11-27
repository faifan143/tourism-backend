// prisma/seed.js
require("dotenv").config();
const { PrismaClient } = require("@prisma/client");
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

// =====================================================================
// SEED DATA
// =====================================================================

// Countries + Cities
const COUNTRIES = [
  {
    name: "United Arab Emirates",
    description: "Modern Gulf nation known for skyscrapers, luxury, and culture.",
    cities: [
      { name: "Dubai", description: "Luxury, tourism, skyscrapers." },
      { name: "Abu Dhabi", description: "Capital with culture & islands." },
      { name: "Sharjah", description: "Heritage and Islamic arts." },
    ],
  },
  {
    name: "Turkey",
    description: "Where East meets West: culture, food, and beaches.",
    cities: [
      { name: "Istanbul", description: "Historic & cosmopolitan." },
      { name: "Ankara", description: "Capital city with modern districts." },
      { name: "Antalya", description: "Resorts, beaches, tourism." },
    ],
  },
  {
    name: "Italy",
    description: "Land of art, history, architecture, and amazing food.",
    cities: [
      { name: "Rome", description: "Ancient ruins & world-class museums." },
      { name: "Milan", description: "Fashion & business capital." },
      { name: "Venice", description: "Canals, boats, and romance." },
    ],
  },
  {
    name: "Japan",
    description: "High-tech, tradition, nature, temples, and culture.",
    cities: [
      { name: "Tokyo", description: "Electric, modern, iconic." },
      { name: "Kyoto", description: "Temples, shrines, gardens." },
      { name: "Osaka", description: "Food capital of Japan." },
    ],
  },
  {
    name: "Malaysia",
    description: "Rainforests, multicultural food, islands.",
    cities: [
      { name: "Kuala Lumpur", description: "Capital city full of culture." },
      { name: "Penang", description: "Street food and rich heritage." },
      { name: "Langkawi", description: "Island paradise with clear beaches." },
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

// Places base templates
const PLACES_TEMPLATE = [
  "Central Park",
  "Old Town",
  "City Museum",
  "Main Beach",
  "Iconic Tower",
  "Historic Market",
  "National Park",
  "Grand Mosque",
  "Skyline Viewpoint",
  "Botanical Garden",
];

// Activities template
const ACTIVITIES_TEMPLATE = [
  "Guided Tour",
  "Photography Session",
  "Boat Ride",
  "Street Food Tasting",
  "Museum Pass",
  "Hiking Trail",
  "Sunset Cruise",
  "City Walking Tour",
  "Cultural Workshop",
];

// =====================================================================
// MAIN SEED FUNCTION
// =====================================================================

async function main() {
  console.log("🌱 Seeding database...");

  // Admin user ------------------------------------------------------
  const adminEmail = "admin@example.com";
  const adminPassword = "Admin123!";
  const hashed = await bcrypt.hash(adminPassword, 10);

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: { password: hashed, role: "ADMIN" },
    create: { email: adminEmail, password: hashed, role: "ADMIN" },
  });

  console.log("✓ Admin user created.");

  // Categories -------------------------------------------------------
  for (const name of CATEGORIES) {
    await prisma.category.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }
  console.log("✓ Categories created.");

  // Themes -----------------------------------------------------------
  for (const name of THEMES) {
    await prisma.theme.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }
  console.log("✓ Themes created.");

  // Countries, Cities, Places, Activities ---------------------------
  for (const country of COUNTRIES) {
    const ctry = await prisma.country.upsert({
      where: { name: country.name },
      update: {},
      create: {
        name: country.name,
        description: country.description,
        imageUrl: placeholderImage(country.name),
      },
    });

    for (const city of country.cities) {
      const cty = await prisma.city.upsert({
        where: { name: city.name },
        update: {},
        create: {
          name: city.name,
          description: city.description,
          imageUrl: placeholderImage(`${country.name}-${city.name}`),
          countryId: ctry.id,
        },
      });

      // Places (4–5 per city)
      const selection = pickN(PLACES_TEMPLATE, 5);

      for (const pname of selection) {
        const placeName = `${city.name} ${pname}`;
        const place = await prisma.place.create({
          data: {
            name: placeName,
            description: `Explore ${placeName} in ${city.name}.`,
            location: city.name,
            imageUrls: [placeholderImage(placeName)],
            cityId: cty.id,
            popularity: randPop(),
          },
        });

        // Assign categories + themes
        const cats = await prisma.category.findMany();
        const thms = await prisma.theme.findMany();

        await prisma.place.update({
          where: { id: place.id },
          data: {
            categories: {
              connect: pickN(cats, 2).map((c) => ({ id: c.id })),
            },
            themes: {
              connect: pickN(thms, 2).map((t) => ({ id: t.id })),
            },
          },
        });

        // Activities
        const acts = pickN(ACTIVITIES_TEMPLATE, 3);
        for (const a of acts) {
          await prisma.activity.create({
            data: {
              name: a,
              description: `${a} at ${place.name}.`,
              imageUrl: placeholderImage(`${place.name}-${a}`),
              placeId: place.id,
            },
          });
        }
      }
    }
  }

  console.log("✓ Countries, cities, places, and activities created.");
  console.log("🌱 Seeding finished successfully!");
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

