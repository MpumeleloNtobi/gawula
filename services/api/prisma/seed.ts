import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../src/modules/identity/password.util";

const prisma = new PrismaClient();

async function main() {
  if (process.env.NODE_ENV === "production" && process.env.ALLOW_PROD_SEED !== "true") {
    throw new Error(
      "Refusing to run QA seed in production. Set ALLOW_PROD_SEED=true to override (not recommended).",
    );
  }

  console.log("Seeding Foyer dev data…");

  const sandtonCity = await prisma.complex.upsert({
    where: { slug: "sandton-city" },
    update: {},
    create: {
      name: "Sandton City",
      slug: "sandton-city",
      centroidLat: -26.1076,
      centroidLng: 28.0567,
      deliveryRadiusKm: 5,
      baseDeliveryFeeCents: 4500,
      openingHours: weekdayHours("09:00", "21:00"),
      status: "active",
    },
  });

  const brands = await Promise.all(
    [
      { name: "Ember & Char", slug: "ember", logoColor: "#C2410C" },
      { name: "Harvest Bowls", slug: "harvest", logoColor: "#15803D" },
      { name: "Noodle Bar", slug: "noodlebar", logoColor: "#B91C1C" },
      { name: "Dough Society", slug: "dough", logoColor: "#A16207" },
    ].map((b) =>
      prisma.brand.upsert({ where: { slug: b.slug }, update: {}, create: b }),
    ),
  );

  for (const brand of brands) {
    const outlet = await prisma.outlet.upsert({
      where: { id: `${sandtonCity.id}:${brand.slug}` },
      update: {},
      create: {
        id: `${sandtonCity.id}:${brand.slug}`,
        brandId: brand.id,
        complexId: sandtonCity.id,
        name: brand.name,
        locationInMall: locationFor(brand.slug),
        prepBufferMinutes: 2,
        commissionPct: 0.13,
        status: "active",
        tagline: taglineFor(brand.slug),
      },
    });

    for (const item of itemsFor(brand.slug)) {
      await prisma.item.upsert({
        where: { id: `${outlet.id}:${item.slug}` },
        update: {},
        create: {
          id: `${outlet.id}:${item.slug}`,
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
  }

  const emberOutletId = `${sandtonCity.id}:ember`;
  await seedTestUsers(sandtonCity.id, emberOutletId);
  await seedSampleOrder(sandtonCity.id);

  console.log("Seed complete.");
}

async function seedSampleOrder(complexId: string) {
  const existing = await prisma.order.findUnique({ where: { id: "seed-order-1" } });
  if (existing) return;

  const customer = await prisma.customer.findUnique({ where: { email: "customer@qa.test" } });
  if (!customer) return;
  const address = await prisma.address.findFirst({ where: { customerId: customer.id } });
  if (!address) return;

  const emberOutletId = `${complexId}:ember`;
  const doughOutletId = `${complexId}:dough`;

  await prisma.order.create({
    data: {
      id: "seed-order-1",
      customerId: customer.id,
      complexId,
      addressId: address.id,
      status: "ready",
      foodSubtotalCents: 24400,
      deliveryFeeCents: 4500,
      serviceFeeCents: 0,
      tipCents: 1000,
      totalCents: 29900,
      paymentIntentId: "pi_sim_seed",
      subOrders: {
        create: [
          {
            outletId: emberOutletId,
            status: "ready",
            pickupCode: "742",
            readyAt: new Date(),
            foodSubtotalCents: 11900,
            commissionCents: 1547,
            orderItems: {
              create: {
                itemId: `${emberOutletId}:classic-smash`,
                qty: 1,
                modifiers: [],
                unitPriceCents: 11900,
                totalCents: 11900,
              },
            },
          },
          {
            outletId: doughOutletId,
            status: "ready",
            pickupCode: "318",
            readyAt: new Date(),
            foodSubtotalCents: 12500,
            commissionCents: 1625,
            orderItems: {
              create: {
                itemId: `${doughOutletId}:margherita`,
                qty: 1,
                modifiers: [],
                unitPriceCents: 12500,
                totalCents: 12500,
              },
            },
          },
        ],
      },
    },
  });

  console.log("Sample paid order seeded (seed-order-1) ready for dispatch.");
}

async function seedTestUsers(complexId: string, partnerOutletId: string) {
  const password = await hashPassword("qa-password");

  const customer = await prisma.customer.upsert({
    where: { email: "customer@qa.test" },
    update: { name: "Thandi Test", phone: "0820000001", passwordHash: password, emailVerifiedAt: new Date() },
    create: {
      email: "customer@qa.test",
      passwordHash: password,
      name: "Thandi Test",
      phone: "0820000001",
      emailVerifiedAt: new Date(),
    },
  });
  const existingAddress = await prisma.address.findFirst({ where: { customerId: customer.id } });
  if (!existingAddress) {
    await prisma.address.create({
      data: {
        customerId: customer.id,
        label: "Home",
        line1: "12 Maude Street",
        suburb: "Sandown",
        city: "Johannesburg",
        postalCode: "2196",
        lat: -26.1052,
        lng: 28.0561,
        instructions: "Leave at reception, call on arrival.",
      },
    });
  }

  const riderCustomer = await prisma.customer.upsert({
    where: { email: "rider@qa.test" },
    update: { name: "Sipho Rider", phone: "0820000002", passwordHash: password, emailVerifiedAt: new Date() },
    create: {
      email: "rider@qa.test",
      passwordHash: password,
      name: "Sipho Rider",
      phone: "0820000002",
      emailVerifiedAt: new Date(),
    },
  });

  await prisma.roleGrant.upsert({
    where: { customerId_role: { customerId: riderCustomer.id, role: "rider" } },
    update: {},
    create: { customerId: riderCustomer.id, role: "rider" },
  });

  await prisma.rider.upsert({
    where: { customerId: riderCustomer.id },
    update: { name: "Sipho Rider", phone: "0820000002", homeComplexId: complexId },
    create: {
      customerId: riderCustomer.id,
      name: "Sipho Rider",
      phone: "0820000002",
      vehicleType: "motorbike",
      homeComplexId: complexId,
      status: "offline",
    },
  });

  await prisma.adminUser.upsert({
    where: { email: "admin@qa.test" },
    update: { name: "Admin", role: "admin", passwordHash: password },
    create: { email: "admin@qa.test", name: "Admin", role: "admin", passwordHash: password },
  });

  await prisma.adminUser.upsert({
    where: { email: "partner@qa.test" },
    update: { name: "Ember & Char Manager", role: "partner", passwordHash: password, complexId, outletId: partnerOutletId },
    create: {
      email: "partner@qa.test",
      name: "Ember & Char Manager",
      role: "partner",
      passwordHash: password,
      complexId,
      outletId: partnerOutletId,
    },
  });

  console.log("Test users: customer@qa.test / rider@qa.test / partner@qa.test / admin@qa.test (password: qa-password)");
}

function weekdayHours(open: string, close: string) {
  return Object.fromEntries(Array.from({ length: 7 }, (_, i) => [i, { open, close }]));
}

function locationFor(slug: string): string {
  const map: Record<string, string> = {
    ember: "Level 2, Food Court",
    harvest: "Level 2, near escalator",
    noodlebar: "Level 1, east wing",
    dough: "Level 1, west entrance",
  };
  return map[slug] ?? "Food Court";
}

function taglineFor(slug: string): string {
  const map: Record<string, string> = {
    ember: "Flame-grilled burgers, smashed thin and stacked tall.",
    harvest: "Grain bowls, crisp greens, and house-made dressings.",
    noodlebar: "Hand-pulled noodles and slow-simmered broths.",
    dough: "Sourdough pizzas fired in a 400°C deck oven.",
  };
  return map[slug] ?? "";
}

interface SeedItem {
  slug: string;
  name: string;
  description: string;
  priceCents: number;
  prepTimeMinutes: number;
  category: string;
}

function itemsFor(brandSlug: string): SeedItem[] {
  const byBrand: Record<string, SeedItem[]> = {
    ember: [
      { slug: "classic-smash", name: "Classic Smash", description: "Two thin beef patties, melted cheese, pickles.", priceCents: 11900, prepTimeMinutes: 8, category: "Burgers" },
      { slug: "double-stack", name: "Double Stack", description: "Four smashed patties, double cheese, burnt-end mayo.", priceCents: 15500, prepTimeMinutes: 10, category: "Burgers" },
      { slug: "fries", name: "Skin-on Fries", description: "Twice-cooked with smoked salt and chipotle aioli.", priceCents: 5500, prepTimeMinutes: 5, category: "Sides" },
    ],
    harvest: [
      { slug: "mediterranean", name: "Mediterranean Grain Bowl", description: "Farro, charred broccolini, feta, lemon-tahini.", priceCents: 11500, prepTimeMinutes: 3, category: "Bowls" },
      { slug: "poke", name: "Citrus Poke Bowl", description: "Soy-cured salmon, sushi rice, yuzu dressing.", priceCents: 14900, prepTimeMinutes: 4, category: "Bowls" },
      { slug: "greens", name: "House Green Juice", description: "Cold-pressed cucumber, apple, ginger.", priceCents: 5500, prepTimeMinutes: 0, category: "Drinks" },
    ],
    noodlebar: [
      { slug: "tonkotsu", name: "Tonkotsu Ramen", description: "18-hour pork broth, hand-pulled noodles, soft egg.", priceCents: 13900, prepTimeMinutes: 6, category: "Ramen" },
      { slug: "yakisoba", name: "Yakisoba Stir-fry", description: "Wok-tossed noodles with cabbage and peppers.", priceCents: 11500, prepTimeMinutes: 7, category: "Stir-fry" },
      { slug: "gyoza", name: "Pork Gyoza", description: "Pan-fried dumplings with ginger pork.", priceCents: 7900, prepTimeMinutes: 5, category: "Sides" },
    ],
    dough: [
      { slug: "margherita", name: "Margherita", description: "San Marzano tomato, fior di latte, basil.", priceCents: 12500, prepTimeMinutes: 9, category: "Pizza" },
      { slug: "pepperoni", name: "Spicy Pepperoni", description: "Cup-and-char pepperoni, mozzarella, hot honey.", priceCents: 14500, prepTimeMinutes: 9, category: "Pizza" },
      { slug: "garlic", name: "Garlic Focaccia", description: "Slow-fermented focaccia with confit garlic.", priceCents: 6900, prepTimeMinutes: 0, category: "Sides" },
    ],
  };
  return byBrand[brandSlug] ?? [];
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
