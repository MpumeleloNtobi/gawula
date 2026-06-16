import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../src/modules/identity/password.util";

const prisma = new PrismaClient();

const COMPLEX_ID = "gawula-preview-complex";
const COMPLEX_SLUG = "gawula-preview";
const BRAND_SLUG = "gawula-preview-kitchen";
const OUTLET_ID = `${COMPLEX_ID}:demo`;

const STORE_EMAIL = process.env.PREVIEW_STORE_EMAIL ?? "preview-store@gawula.co.za";
const STORE_PASSWORD = process.env.PREVIEW_STORE_PASSWORD ?? "gawula-preview";

async function main() {
  if (!process.env.PREVIEW_STORE_PASSWORD) {
    console.warn(
      `PREVIEW_STORE_PASSWORD not set; using default demo password "${STORE_PASSWORD}". Set it to use your own.`,
    );
  }

  const complex = await prisma.complex.upsert({
    where: { slug: COMPLEX_SLUG },
    update: { status: "active" },
    create: {
      id: COMPLEX_ID,
      name: "Gawula Preview Mall",
      slug: COMPLEX_SLUG,
      centroidLat: -26.1076,
      centroidLng: 28.0567,
      deliveryRadiusKm: 5,
      baseDeliveryFeeCents: 4500,
      openingHours: complexHours("09:00", "21:00"),
      status: "active",
    },
  });

  const brand = await prisma.brand.upsert({
    where: { slug: BRAND_SLUG },
    update: { name: "Sample Kitchen" },
    create: {
      name: "Sample Kitchen",
      slug: BRAND_SLUG,
      logoColor: "#F0441A",
    },
  });

  const outlet = await prisma.outlet.upsert({
    where: { id: OUTLET_ID },
    update: { status: "active", tagline: STORE_TAGLINE, brandId: brand.id, complexId: complex.id },
    create: {
      id: OUTLET_ID,
      brandId: brand.id,
      complexId: complex.id,
      name: "Sample Kitchen",
      locationInMall: "Ground Floor, Preview Court",
      prepBufferMinutes: 2,
      commissionPct: 0.13,
      status: "active",
      tagline: STORE_TAGLINE,
    },
  });

  for (const item of MENU) {
    await prisma.item.upsert({
      where: { id: `${OUTLET_ID}:${item.slug}` },
      update: {
        name: item.name,
        description: item.description,
        priceCents: item.priceCents,
        prepTimeMinutes: item.prepTimeMinutes,
        category: item.category,
        available: true,
        archivedAt: null,
      },
      create: {
        id: `${OUTLET_ID}:${item.slug}`,
        outletId: outlet.id,
        name: item.name,
        description: item.description,
        priceCents: item.priceCents,
        prepTimeMinutes: item.prepTimeMinutes,
        available: true,
        category: item.category,
        modifiers: [],
      },
    });
  }

  await prisma.outletSettings.upsert({
    where: { outletId: OUTLET_ID },
    update: {},
    create: {
      outletId: OUTLET_ID,
      phone: "011 555 0100",
      email: STORE_EMAIL,
      addressLine: "Shop G01, Gawula Preview Mall, Johannesburg",
      hoursJson: settingsHours(),
      autoAcceptOrders: false,
      pauseNewOrders: false,
      showPrepTime: true,
      allowTipping: true,
    },
  });

  const passwordHash = await hashPassword(STORE_PASSWORD);
  await prisma.adminUser.upsert({
    where: { email: STORE_EMAIL },
    update: { name: "Sample Kitchen Manager", role: "partner", passwordHash, complexId: complex.id, outletId: OUTLET_ID },
    create: {
      email: STORE_EMAIL,
      name: "Sample Kitchen Manager",
      role: "partner",
      passwordHash,
      complexId: complex.id,
      outletId: OUTLET_ID,
    },
  });

  console.log("Preview store ready.");
  console.log(`  Outlet id:    ${OUTLET_ID}`);
  console.log(`  Public menu:  GET /api/outlets/${OUTLET_ID}/menu`);
  console.log(`  Store login:  ${STORE_EMAIL} / ${STORE_PASSWORD}`);
}

const STORE_TAGLINE = "A sample Gawula store for previewing the experience.";

interface MenuItem {
  slug: string;
  name: string;
  description: string;
  priceCents: number;
  prepTimeMinutes: number;
  category: string;
}

const MENU: MenuItem[] = [
  { slug: "smash-burger", name: "Smash Burger", description: "Two beef patties, cheese, pickles, house sauce.", priceCents: 11900, prepTimeMinutes: 8, category: "Mains" },
  { slug: "grilled-chicken", name: "Grilled Chicken Roll", description: "Flame-grilled chicken, slaw, peri mayo.", priceCents: 9900, prepTimeMinutes: 9, category: "Mains" },
  { slug: "veg-bowl", name: "Roast Veg Bowl", description: "Seasonal roast vegetables, grains, lemon dressing.", priceCents: 10500, prepTimeMinutes: 4, category: "Mains" },
  { slug: "fries", name: "Skin-on Fries", description: "Twice-cooked with smoked salt.", priceCents: 4500, prepTimeMinutes: 5, category: "Sides" },
  { slug: "cooldrink", name: "Sparkling Cooldrink", description: "Chilled 330ml can.", priceCents: 2500, prepTimeMinutes: 0, category: "Drinks" },
  { slug: "brownie", name: "Chocolate Brownie", description: "Warm fudge brownie, dark cocoa.", priceCents: 4900, prepTimeMinutes: 0, category: "Desserts" },
];

function complexHours(open: string, close: string) {
  return Object.fromEntries(Array.from({ length: 7 }, (_, i) => [i, { open, close }]));
}

function settingsHours() {
  const weekday = { open: "09:00", close: "21:00", closed: false };
  const weekend = { open: "10:00", close: "22:00", closed: false };
  return {
    mon: weekday,
    tue: weekday,
    wed: weekday,
    thu: weekday,
    fri: weekend,
    sat: weekend,
    sun: { open: "10:00", close: "20:00", closed: false },
  };
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
