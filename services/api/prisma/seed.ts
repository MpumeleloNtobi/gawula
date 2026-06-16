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
  await seedPickupOrder(sandtonCity.id);
  await seedQueueOrders(sandtonCity.id);
  await seedRiderHistory(sandtonCity.id);
  await seedOutletSettings(sandtonCity.id);
  await seedReviews(sandtonCity.id);
  await seedPromotions(sandtonCity.id);

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

async function seedPickupOrder(complexId: string) {
  const existing = await prisma.order.findUnique({ where: { id: "seed-order-2" } });
  if (existing) return;

  const customer = await prisma.customer.findUnique({ where: { email: "customer@qa.test" } });
  if (!customer) return;
  const address = await prisma.address.findFirst({ where: { customerId: customer.id } });
  if (!address) return;

  const emberOutletId = `${complexId}:ember`;

  await prisma.order.create({
    data: {
      id: "seed-order-2",
      customerId: customer.id,
      complexId,
      addressId: address.id,
      fulfilmentMode: "pickup",
      status: "preparing",
      foodSubtotalCents: 11900,
      deliveryFeeCents: 0,
      serviceFeeCents: 0,
      tipCents: 0,
      totalCents: 11900,
      paymentIntentId: "pi_sim_seed_pickup",
      subOrders: {
        create: [
          {
            outletId: emberOutletId,
            status: "preparing",
            pickupCode: "905",
            prepStartAt: new Date(),
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
        ],
      },
    },
  });

  console.log("Sample pickup order seeded (seed-order-2) preparing for in-store collection.");
}

async function seedQueueOrders(complexId: string) {
  const customer = await prisma.customer.findUnique({ where: { email: "customer@qa.test" } });
  if (!customer) return;
  const address = await prisma.address.findFirst({ where: { customerId: customer.id } });
  if (!address) return;

  const emberOutletId = `${complexId}:ember`;
  const doughOutletId = `${complexId}:dough`;

  const queue = [
    {
      id: "seed-queue-1",
      fulfilmentMode: "delivery" as const,
      deliveryFeeCents: 4500,
      tipCents: 0,
      pickupCode: "204",
      outletId: emberOutletId,
      itemId: `${emberOutletId}:double-stack`,
      qty: 1,
      unitPriceCents: 15500,
      placedMinsAgo: 2,
    },
    {
      id: "seed-queue-2",
      fulfilmentMode: "pickup" as const,
      deliveryFeeCents: 0,
      tipCents: 0,
      pickupCode: "511",
      outletId: doughOutletId,
      itemId: `${doughOutletId}:pepperoni`,
      qty: 2,
      unitPriceCents: 14500,
      placedMinsAgo: 5,
    },
    {
      id: "seed-queue-3",
      fulfilmentMode: "delivery" as const,
      deliveryFeeCents: 4500,
      tipCents: 1500,
      pickupCode: "877",
      outletId: emberOutletId,
      itemId: `${emberOutletId}:buttermilk`,
      qty: 1,
      unitPriceCents: 12500,
      placedMinsAgo: 9,
    },
    {
      id: "seed-queue-4",
      fulfilmentMode: "pickup" as const,
      deliveryFeeCents: 0,
      tipCents: 0,
      pickupCode: "639",
      outletId: doughOutletId,
      itemId: `${doughOutletId}:funghi`,
      qty: 1,
      unitPriceCents: 15500,
      placedMinsAgo: 14,
    },
  ];

  for (const q of queue) {
    if (await prisma.order.findUnique({ where: { id: q.id } })) continue;
    const foodSubtotalCents = q.unitPriceCents * q.qty;
    await prisma.order.create({
      data: {
        id: q.id,
        customerId: customer.id,
        complexId,
        addressId: address.id,
        fulfilmentMode: q.fulfilmentMode,
        status: "pending",
        foodSubtotalCents,
        deliveryFeeCents: q.deliveryFeeCents,
        serviceFeeCents: 0,
        tipCents: q.tipCents,
        totalCents: foodSubtotalCents + q.deliveryFeeCents + q.tipCents,
        paymentIntentId: `pi_sim_${q.id}`,
        placedAt: new Date(Date.now() - q.placedMinsAgo * 60000),
        subOrders: {
          create: [
            {
              outletId: q.outletId,
              status: "pending",
              pickupCode: q.pickupCode,
              foodSubtotalCents,
              commissionCents: Math.round(foodSubtotalCents * 0.13),
              orderItems: {
                create: {
                  itemId: q.itemId,
                  qty: q.qty,
                  modifiers: [],
                  unitPriceCents: q.unitPriceCents,
                  totalCents: foodSubtotalCents,
                },
              },
            },
          ],
        },
      },
    });
  }

  console.log("Queue orders seeded (seed-queue-1..4) pending acceptance.");
}

async function seedRiderHistory(complexId: string) {
  if (await prisma.order.findUnique({ where: { id: "seed-rh-0" } })) return;

  const riderCustomer = await prisma.customer.findUnique({ where: { email: "rider@qa.test" } });
  const customer = await prisma.customer.findUnique({ where: { email: "customer@qa.test" } });
  if (!riderCustomer || !customer) return;

  const rider = await prisma.rider.findUnique({ where: { customerId: riderCustomer.id } });
  const address = await prisma.address.findFirst({ where: { customerId: customer.id } });
  if (!rider || !address) return;

  const emberOutletId = `${complexId}:ember`;
  const now = new Date();

  const at = (date: Date, hour: number) => {
    const d = new Date(date);
    d.setHours(hour, 0, 0, 0);
    return d;
  };

  const events: { when: Date; earningsCents: number }[] = [];

  for (const [hour, fee] of [
    [8, 5200],
    [9, 4800],
    [11, 6100],
    [12, 5500],
    [14, 4500],
    [17, 7000],
    [19, 6300],
    [20, 5800],
  ] as const) {
    events.push({ when: at(now, hour), earningsCents: fee });
  }

  for (let day = 1; day <= 6; day += 1) {
    const base = new Date(now.getTime() - day * 86400000);
    for (const [hour, fee] of [
      [12, 5000],
      [18, 6200],
      [20, 5400],
    ] as const) {
      events.push({ when: at(base, hour), earningsCents: fee + day * 100 });
    }
  }

  for (let month = 1; month <= 5; month += 1) {
    const base = new Date(now.getFullYear(), now.getMonth() - month, 1);
    for (let i = 0; i < 4; i += 1) {
      const d = new Date(base);
      d.setDate(5 + i * 6);
      events.push({ when: at(d, 13 + i), earningsCents: 4800 + i * 400 + month * 150 });
    }
  }

  let n = 0;
  for (const event of events) {
    await prisma.order.create({
      data: {
        id: `seed-rh-${n}`,
        customerId: customer.id,
        complexId,
        addressId: address.id,
        status: "delivered",
        foodSubtotalCents: 18000,
        deliveryFeeCents: event.earningsCents,
        serviceFeeCents: 0,
        tipCents: 0,
        totalCents: 18000 + event.earningsCents,
        paymentIntentId: `pi_sim_rh_${n}`,
        placedAt: new Date(event.when.getTime() - 40 * 60000),
        subOrders: {
          create: [
            {
              outletId: emberOutletId,
              status: "collected",
              pickupCode: String(100 + (n % 800)),
              riderCollectedAt: event.when,
              foodSubtotalCents: 18000,
              commissionCents: 2340,
            },
          ],
        },
        trip: {
          create: {
            riderId: rider.id,
            status: "delivered",
            claimedAt: new Date(event.when.getTime() - 30 * 60000),
            deliveredAt: event.when,
            earningsCents: event.earningsCents,
          },
        },
      },
    });
    n += 1;
  }

  console.log(`Rider delivery history seeded (${events.length} delivered trips for rider@qa.test).`);
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
    update: {
      name: "Sipho Rider",
      phone: "0820000002",
      homeComplexId: complexId,
      homeAddress: "14 Rivonia Road, Sandton, Johannesburg",
      vehicleBrand: "Honda",
      vehicleColour: "Red",
      vehicleReg: "CA 123 456",
    },
    create: {
      customerId: riderCustomer.id,
      name: "Sipho Rider",
      phone: "0820000002",
      vehicleType: "motorbike",
      vehicleBrand: "Honda",
      vehicleColour: "Red",
      vehicleReg: "CA 123 456",
      homeComplexId: complexId,
      homeAddress: "14 Rivonia Road, Sandton, Johannesburg",
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

async function seedOutletSettings(complexId: string) {
  const defaults = [
    { slug: "ember", phone: "011 555 0142", email: "manager@ember.qa.test", addressLine: "Shop F12, Sandton City Food Court, Level 2" },
    { slug: "harvest", phone: "011 555 0173", email: "manager@harvest.qa.test", addressLine: "Shop F18, Sandton City Food Court, Level 2" },
    { slug: "noodlebar", phone: "011 555 0184", email: "manager@noodlebar.qa.test", addressLine: "Shop E04, Sandton City East Wing, Level 1" },
    { slug: "dough", phone: "011 555 0199", email: "manager@dough.qa.test", addressLine: "Shop W02, Sandton City West Entrance, Level 1" },
  ];

  for (const def of defaults) {
    const outletId = `${complexId}:${def.slug}`;
    await prisma.outletSettings.upsert({
      where: { outletId },
      update: {},
      create: {
        outletId,
        phone: def.phone,
        email: def.email,
        addressLine: def.addressLine,
        hoursJson: weeklyHoursDefault(),
        autoAcceptOrders: false,
        pauseNewOrders: false,
        showPrepTime: true,
        allowTipping: true,
      },
    });
  }
}

async function seedReviews(complexId: string) {
  const emberOutletId = `${complexId}:ember`;
  const customer = await prisma.customer.findUnique({ where: { email: "customer@qa.test" } });
  if (!customer) return;
  const address = await prisma.address.findFirst({ where: { customerId: customer.id } });
  if (!address) return;
  const partner = await prisma.adminUser.findUnique({ where: { email: "partner@qa.test" } });

  const reviewSeeds = [
    { orderId: "seed-review-order-1", subOrderId: "seed-review-suborder-1", rating: 5, text: "Best smash burger in Sandton. Crispy edges, perfect cheese pull.", reply: "Thanks so much! See you again soon." },
    { orderId: "seed-review-order-2", subOrderId: "seed-review-suborder-2", rating: 4, text: "Loved the fries. Burger arrived a little cool but flavour was on point.", reply: null },
    { orderId: "seed-review-order-3", subOrderId: "seed-review-suborder-3", rating: 5, text: "Quick pickup, friendly staff, double stack was unreal.", reply: null },
  ];

  for (const r of reviewSeeds) {
    const existing = await prisma.order.findUnique({ where: { id: r.orderId } });
    if (!existing) {
      await prisma.order.create({
        data: {
          id: r.orderId,
          customerId: customer.id,
          complexId,
          addressId: address.id,
          status: "delivered",
          foodSubtotalCents: 11900,
          deliveryFeeCents: 4500,
          serviceFeeCents: 0,
          tipCents: 0,
          totalCents: 16400,
          paymentIntentId: `pi_sim_${r.orderId}`,
          subOrders: {
            create: [
              {
                id: r.subOrderId,
                outletId: emberOutletId,
                status: "delivered",
                pickupCode: "000",
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
            ],
          },
        },
      });
    }

    const review = await prisma.review.upsert({
      where: { subOrderId: r.subOrderId },
      update: {},
      create: {
        subOrderId: r.subOrderId,
        outletId: emberOutletId,
        customerId: customer.id,
        rating: r.rating,
        text: r.text,
      },
    });

    if (r.reply && partner) {
      await prisma.reviewReply.upsert({
        where: { reviewId: review.id },
        update: {},
        create: {
          reviewId: review.id,
          authorId: partner.id,
          text: r.reply,
        },
      });
    }
  }

  console.log("Storefront settings + sample reviews seeded.");
}

async function seedPromotions(complexId: string) {
  const emberOutletId = `${complexId}:ember`;
  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;

  const promos = [
    {
      id: "seed-promo-ember-spend",
      type: "fixed",
      percentOff: 0,
      amountOffCents: 5000,
      minSpendCents: 25000,
      paused: false,
      startAt: null,
      endAt: null,
    },
    {
      id: "seed-promo-ember-lunch",
      type: "percentage",
      percentOff: 15,
      amountOffCents: 0,
      minSpendCents: 0,
      paused: false,
      startAt: null,
      endAt: new Date(now + 14 * day),
    },
    {
      id: "seed-promo-ember-weekend",
      type: "percentage",
      percentOff: 20,
      amountOffCents: 0,
      minSpendCents: 15000,
      paused: false,
      startAt: new Date(now + 3 * day),
      endAt: new Date(now + 5 * day),
    },
    {
      id: "seed-promo-ember-free-delivery",
      type: "free_delivery",
      minSpendCents: 20000,
      paused: false,
      startAt: null,
      endAt: null,
    },
    {
      id: "seed-promo-ember-free-fries",
      type: "free_item",
      freeItemId: `${emberOutletId}:fries`,
      minSpendCents: 25000,
      paused: false,
      startAt: null,
      endAt: null,
    },
    {
      id: "seed-promo-ember-bogo",
      type: "bogo",
      buyItemId: `${emberOutletId}:double-stack`,
      getItemId: `${emberOutletId}:classic-smash`,
      buyQuantity: 1,
      getQuantity: 1,
      percentOff: 100,
      paused: false,
      startAt: null,
      endAt: null,
    },
    {
      id: "seed-promo-ember-happy-hour",
      type: "happy_hour",
      percentOff: 20,
      days: [1, 2, 3, 4, 5],
      startTime: "14:00",
      endTime: "17:00",
      paused: false,
      startAt: null,
      endAt: null,
    },
    {
      id: "seed-promo-ember-sides",
      type: "item_discount",
      percentOff: 15,
      category: "Sides",
      paused: false,
      startAt: null,
      endAt: null,
    },
    {
      id: "seed-promo-ember-buy-save",
      type: "buy_save",
      buyItemId: `${emberOutletId}:classic-smash`,
      buyQuantity: 2,
      amountOffCents: 2500,
      paused: false,
      startAt: null,
      endAt: null,
    },
  ];

  for (const p of promos) {
    await prisma.promotion.upsert({
      where: { id: p.id },
      update: {},
      create: { outletId: emberOutletId, ...p },
    });
  }

  console.log("Sample promotions seeded.");
}

function weeklyHoursDefault() {
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
      { slug: "buttermilk", name: "Buttermilk Chicken", description: "24-hour brined chicken thigh, slaw, dill pickles, tangy ranch.", priceCents: 12500, prepTimeMinutes: 9, category: "Chicken" },
      { slug: "fries", name: "Skin-on Fries", description: "Twice-cooked with smoked salt and chipotle aioli.", priceCents: 5500, prepTimeMinutes: 5, category: "Sides" },
      { slug: "onion-rings", name: "Beer-battered Onion Rings", description: "Sweet onions in a crisp lager batter with smoky BBQ dip.", priceCents: 5900, prepTimeMinutes: 5, category: "Sides" },
      { slug: "shake", name: "Salted Caramel Shake", description: "Vanilla blended with house salted caramel and shortbread.", priceCents: 6500, prepTimeMinutes: 3, category: "Shakes" },
    ],
    harvest: [
      { slug: "mediterranean", name: "Mediterranean Grain Bowl", description: "Farro, charred broccolini, feta, lemon-tahini.", priceCents: 11500, prepTimeMinutes: 3, category: "Bowls" },
      { slug: "poke", name: "Citrus Poke Bowl", description: "Soy-cured salmon, sushi rice, yuzu dressing.", priceCents: 14900, prepTimeMinutes: 4, category: "Bowls" },
      { slug: "caesar", name: "Charred Caesar", description: "Grilled romaine, parmesan crisp, sourdough croutons, anchovy dressing.", priceCents: 10500, prepTimeMinutes: 3, category: "Salads" },
      { slug: "buddha", name: "Roast Pumpkin Buddha Bowl", description: "Spiced pumpkin, quinoa, kale, pickled red onion, almond dukkah.", priceCents: 11200, prepTimeMinutes: 4, category: "Bowls" },
      { slug: "greens", name: "House Green Juice", description: "Cold-pressed cucumber, apple, ginger.", priceCents: 5500, prepTimeMinutes: 0, category: "Drinks" },
      { slug: "soup", name: "Roasted Tomato Soup", description: "Slow-roasted plum tomatoes, basil oil, grilled sourdough cheese toast.", priceCents: 8900, prepTimeMinutes: 3, category: "Soup" },
    ],
    noodlebar: [
      { slug: "tonkotsu", name: "Tonkotsu Ramen", description: "18-hour pork broth, hand-pulled noodles, soft egg.", priceCents: 13900, prepTimeMinutes: 6, category: "Ramen" },
      { slug: "spicymiso", name: "Spicy Miso Ramen", description: "Rich miso broth with chilli oil, minced pork, corn, bamboo shoots.", priceCents: 13500, prepTimeMinutes: 6, category: "Ramen" },
      { slug: "yakisoba", name: "Yakisoba Stir-fry", description: "Wok-tossed noodles with cabbage and peppers.", priceCents: 11500, prepTimeMinutes: 7, category: "Stir-fry" },
      { slug: "gyoza", name: "Pork Gyoza", description: "Pan-fried dumplings with ginger pork.", priceCents: 7900, prepTimeMinutes: 5, category: "Sides" },
      { slug: "bao", name: "Crispy Chicken Bao", description: "Steamed buns, panko chicken, kewpie mayo, quick pickle.", priceCents: 8900, prepTimeMinutes: 5, category: "Sides" },
      { slug: "edamame", name: "Charred Edamame", description: "Wok-charred with garlic butter, sesame, chilli flakes.", priceCents: 5500, prepTimeMinutes: 4, category: "Sides" },
    ],
    dough: [
      { slug: "margherita", name: "Margherita", description: "San Marzano tomato, fior di latte, basil.", priceCents: 12500, prepTimeMinutes: 9, category: "Pizza" },
      { slug: "pepperoni", name: "Spicy Pepperoni", description: "Cup-and-char pepperoni, mozzarella, hot honey.", priceCents: 14500, prepTimeMinutes: 9, category: "Pizza" },
      { slug: "funghi", name: "Wild Mushroom", description: "Roasted mushrooms, taleggio, thyme, truffle oil on a white base.", priceCents: 15500, prepTimeMinutes: 9, category: "Pizza" },
      { slug: "prosciutto", name: "Prosciutto & Rocket", description: "Cured prosciutto, fresh rocket, shaved parmesan, lemon oil.", priceCents: 15900, prepTimeMinutes: 9, category: "Pizza" },
      { slug: "garlic", name: "Garlic Focaccia", description: "Slow-fermented focaccia with confit garlic.", priceCents: 6900, prepTimeMinutes: 0, category: "Sides" },
      { slug: "tiramisu", name: "Espresso Tiramisu", description: "Mascarpone, espresso-soaked savoiardi, dark cocoa dust.", priceCents: 7500, prepTimeMinutes: 0, category: "Desserts" },
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
