import { SHOPS_NEAR_YOU, shopSlug } from "@/components/nearby-shop-data";

export type StoreLocation = {
  id: string;
  name: string;
  type: "mall" | "complex" | "cluster";
  area: string;
  coordinates: { lat: number; lng: number };
  proximityGroupId: string;
  proximityLabel: string;
  routeIds: string[];
  pickupPoint: string;
  rating: number;
  hasOffer: boolean;
};

export type FulfillmentRoute = {
  id: string;
  name: string;
  locationIds: string[];
  radiusKm: number;
  label: string;
};

export type Brand = {
  id: string;
  name: string;
  tagline: string;
  accent: string;
  cover: string;
  logoColor: string;
  logoUrl?: string;
  storeLocationId: string;
};

export type ModifierGroup = {
  id: string;
  name: string;
  required: boolean;
  options: { id: string; name: string; priceDelta: number }[];
};

export type MenuItem = {
  id: string;
  brandId: string;
  name: string;
  description: string;
  price: number;
  image: string;
  tags?: string[];
  modifiers?: ModifierGroup[];
};

export type Hub = {
  id: string;
  name: string;
  area: string;
  etaMinutes: [number, number];
  coordinates: { lat: number; lng: number };
};

export const HUBS: Hub[] = [
  { id: "rosebank", name: "Rosebank Hub", area: "Rosebank, Johannesburg", etaMinutes: [25, 40], coordinates: { lat: -26.1467, lng: 28.0436 } },
  { id: "sandton", name: "Sandton Hub", area: "Sandton Central, Johannesburg", etaMinutes: [20, 35], coordinates: { lat: -26.1076, lng: 28.0567 } },
  { id: "melville", name: "Melville Hub", area: "Melville, Johannesburg", etaMinutes: [25, 45], coordinates: { lat: -26.1779, lng: 28.0094 } },
  { id: "parkhurst", name: "Parkhurst Hub", area: "Parkhurst, Johannesburg", etaMinutes: [30, 45], coordinates: { lat: -26.1383, lng: 28.0144 } },
  { id: "greenside", name: "Greenside Hub", area: "Greenside, Johannesburg", etaMinutes: [25, 40], coordinates: { lat: -26.1517, lng: 28.0033 } },
];

export const STORE_LOCATIONS: StoreLocation[] = [
  {
    id: "mall-of-africa-food-court",
    name: "Mall of Africa Food Court",
    type: "mall",
    area: "Waterfall",
    coordinates: { lat: -26.0158, lng: 28.1071 },
    proximityGroupId: "waterfall-cluster",
    proximityLabel: "Waterfall cluster",
    routeIds: ["waterfall-loop"],
    pickupPoint: "Entrance 22 food court pickup",
    rating: 4.6,
    hasOffer: true,
  },
  {
    id: "waterfall-corner",
    name: "Waterfall Corner",
    type: "complex",
    area: "Waterfall",
    coordinates: { lat: -26.0277, lng: 28.0909 },
    proximityGroupId: "waterfall-cluster",
    proximityLabel: "Waterfall cluster",
    routeIds: ["waterfall-loop"],
    pickupPoint: "Main parking pickup bay",
    rating: 4.3,
    hasOffer: false,
  },
  {
    id: "the-zone-rosebank",
    name: "The Zone @ Rosebank",
    type: "mall",
    area: "Rosebank",
    coordinates: { lat: -26.1453, lng: 28.0415 },
    proximityGroupId: "rosebank-cluster",
    proximityLabel: "Rosebank cluster",
    routeIds: ["rosebank-loop"],
    pickupPoint: "Bath Avenue rideshare bay",
    rating: 4.8,
    hasOffer: true,
  },
];

export const FULFILLMENT_ROUTES: FulfillmentRoute[] = [
  {
    id: "waterfall-loop",
    name: "Waterfall mall and complex route",
    locationIds: ["mall-of-africa-food-court", "waterfall-corner"],
    radiusKm: 4,
    label: "Planned Waterfall route",
  },
  {
    id: "rosebank-loop",
    name: "Rosebank mall route",
    locationIds: ["the-zone-rosebank"],
    radiusKm: 3,
    label: "Rosebank mall route",
  },
];

export const BRANDS: Brand[] = [
  {
    id: "ember",
    name: "Brand A — Ember & Char",
    tagline: "Flame-grilled burgers, smashed thin and stacked tall.",
    accent: "from-orange-500/20 to-rose-500/20",
    logoColor: "#C2410C",
    logoUrl:
      "https://tb-static.uber.com/prod/image-proc/processed_images/8afaa06be6ac16c9db21645160262082/a3a76b0a0c26aa379cf413f8c825764f.png",
    storeLocationId: "mall-of-africa-food-court",
    cover:
      "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: "harvest",
    name: "Brand B — Harvest Bowls",
    tagline: "Grain bowls, crisp greens, and house-made dressings.",
    accent: "from-emerald-500/20 to-lime-500/20",
    logoColor: "#15803D",
    logoUrl:
      "https://tb-static.uber.com/prod/image-proc/processed_images/f988cd34d6e6017827397fe8a7d67146/c3ac94fc1809fad838eecc532a15cdbe.png",
    storeLocationId: "mall-of-africa-food-court",
    cover:
      "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: "noodlebar",
    name: "Brand C — Noodle Bar",
    tagline: "Hand-pulled noodles and slow-simmered broths.",
    accent: "from-amber-500/20 to-red-500/20",
    logoColor: "#B91C1C",
    logoUrl:
      "https://tb-static.uber.com/prod/image-proc/processed_images/9eb1381f9042369ace7a33d629993cbd/c3ac94fc1809fad838eecc532a15cdbe.png",
    storeLocationId: "the-zone-rosebank",
    cover:
      "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: "dough",
    name: "Brand D — Dough Society",
    tagline: "Sourdough pizzas fired in a 400°C deck oven.",
    accent: "from-yellow-500/20 to-orange-500/20",
    logoColor: "#A16207",
    logoUrl:
      "https://tb-static.uber.com/prod/image-proc/processed_images/74753f1ab8e756a5b60abdd8f5375fa3/cdbf718e74f23061854f430977faed8b.png",
    storeLocationId: "waterfall-corner",
    cover:
      "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=1200&q=80",
  },
];

const sizeModifier: ModifierGroup = {
  id: "size",
  name: "Size",
  required: true,
  options: [
    { id: "regular", name: "Regular", priceDelta: 0 },
    { id: "large", name: "Large", priceDelta: 2500 },
  ],
};

const extrasModifier: ModifierGroup = {
  id: "extras",
  name: "Extras",
  required: false,
  options: [
    { id: "cheese", name: "Extra cheese", priceDelta: 1500 },
    { id: "bacon", name: "Smoked bacon", priceDelta: 2000 },
    { id: "avo", name: "Sliced avocado", priceDelta: 1800 },
    { id: "chilli", name: "House chilli oil", priceDelta: 800 },
  ],
};

export const MENU_ITEMS: MenuItem[] = [
  // Ember & Char
  {
    id: "ember-classic-smash",
    brandId: "ember",
    name: "Classic Smash",
    description: "Two thin beef patties, melted cheese, pickles, and house sauce on a toasted milk bun.",
    price: 11900,
    image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=900&q=80",
    tags: ["Bestseller"],
    modifiers: [sizeModifier, extrasModifier],
  },
  {
    id: "ember-double-stack",
    brandId: "ember",
    name: "Double Stack",
    description: "Four smashed patties, double cheese, caramelised onions, and burnt-end mayo.",
    price: 15500,
    image: "https://images.unsplash.com/photo-1550317138-10000687a72b?auto=format&fit=crop&w=900&q=80",
    modifiers: [extrasModifier],
  },
  {
    id: "ember-buttermilk",
    brandId: "ember",
    name: "Buttermilk Chicken",
    description: "24-hour brined chicken thigh, slaw, dill pickles, and tangy ranch.",
    price: 12500,
    image: "https://images.unsplash.com/photo-1606755962773-d324e0a13086?auto=format&fit=crop&w=900&q=80",
    modifiers: [extrasModifier],
  },
  {
    id: "ember-fries",
    brandId: "ember",
    name: "Skin-on Fries",
    description: "Twice-cooked, dusted with smoked salt and served with chipotle aioli.",
    price: 5500,
    image: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: "ember-onion-rings",
    brandId: "ember",
    name: "Beer-battered Onion Rings",
    description: "Sweet onions in a crisp lager batter with smoky BBQ dip.",
    price: 5900,
    image: "https://images.unsplash.com/photo-1639024471283-03518883512d?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: "ember-shake",
    brandId: "ember",
    name: "Salted Caramel Shake",
    description: "Slow-churned vanilla blended with house salted caramel and shortbread crumbs.",
    price: 6500,
    image: "https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&w=900&q=80",
  },

  // Harvest Bowls
  {
    id: "harvest-mediterranean",
    brandId: "harvest",
    name: "Mediterranean Grain Bowl",
    description: "Warm farro, charred broccolini, roasted peppers, feta, and lemon-tahini.",
    price: 11500,
    image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=900&q=80",
    tags: ["Vegetarian"],
    modifiers: [sizeModifier],
  },
  {
    id: "harvest-poke",
    brandId: "harvest",
    name: "Citrus Poke Bowl",
    description: "Soy-cured salmon, sushi rice, edamame, avocado, and yuzu dressing.",
    price: 14900,
    image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=900&q=80",
    tags: ["Bestseller"],
    modifiers: [sizeModifier],
  },
  {
    id: "harvest-caesar",
    brandId: "harvest",
    name: "Charred Caesar",
    description: "Grilled romaine, parmesan crisp, sourdough croutons, and anchovy dressing.",
    price: 10500,
    image: "https://images.unsplash.com/photo-1550304943-4f24f54ddde9?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: "harvest-buddha",
    brandId: "harvest",
    name: "Roast Pumpkin Buddha Bowl",
    description: "Spiced pumpkin, quinoa, kale, pickled red onion, and almond dukkah.",
    price: 11200,
    image: "https://images.unsplash.com/photo-1543352634-99a5d50ae78e?auto=format&fit=crop&w=900&q=80",
    tags: ["Vegan"],
  },
  {
    id: "harvest-greens",
    brandId: "harvest",
    name: "House Green Juice",
    description: "Cold-pressed cucumber, apple, ginger, lemon, and mint.",
    price: 5500,
    image: "https://images.unsplash.com/photo-1622597167136-cebf4cf3c2a2?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: "harvest-soup",
    brandId: "harvest",
    name: "Roasted Tomato Soup",
    description: "Slow-roasted plum tomatoes, basil oil, and a grilled sourdough cheese toast.",
    price: 8900,
    image: "https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=900&q=80",
  },

  // Noodle Bar
  {
    id: "noodle-tonkotsu",
    brandId: "noodlebar",
    name: "Tonkotsu Ramen",
    description: "18-hour pork bone broth, hand-pulled noodles, soft egg, and spring onion.",
    price: 13900,
    image: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=900&q=80",
    tags: ["Bestseller"],
    modifiers: [extrasModifier],
  },
  {
    id: "noodle-spicymiso",
    brandId: "noodlebar",
    name: "Spicy Miso Ramen",
    description: "Rich miso broth with chilli oil, minced pork, corn, and bamboo shoots.",
    price: 13500,
    image: "https://images.unsplash.com/photo-1591814468924-caf88d1232e1?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: "noodle-yakisoba",
    brandId: "noodlebar",
    name: "Yakisoba Stir-fry",
    description: "Wok-tossed noodles with cabbage, peppers, and tangy yakisoba glaze.",
    price: 11500,
    image: "https://images.unsplash.com/photo-1552611052-33e04de081de?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: "noodle-gyoza",
    brandId: "noodlebar",
    name: "Pork Gyoza (6)",
    description: "Pan-fried dumplings with ginger pork filling and black-vinegar dipper.",
    price: 7900,
    image: "https://images.unsplash.com/photo-1496116218417-1a781b1c416c?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: "noodle-bao",
    brandId: "noodlebar",
    name: "Crispy Chicken Bao",
    description: "Steamed buns, panko chicken, kewpie mayo, and quick pickle.",
    price: 8900,
    image: "https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: "noodle-edamame",
    brandId: "noodlebar",
    name: "Charred Edamame",
    description: "Wok-charred with garlic butter, sesame, and chilli flakes.",
    price: 5500,
    image: "https://images.unsplash.com/photo-1542816417-0983c9c9ad53?auto=format&fit=crop&w=900&q=80",
  },

  // Dough Society
  {
    id: "dough-margherita",
    brandId: "dough",
    name: "Margherita",
    description: "San Marzano tomato, fior di latte, basil, and extra-virgin olive oil.",
    price: 12500,
    image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=900&q=80",
    tags: ["Bestseller"],
    modifiers: [sizeModifier],
  },
  {
    id: "dough-pepperoni",
    brandId: "dough",
    name: "Spicy Pepperoni",
    description: "Cup-and-char pepperoni, mozzarella, and a drizzle of hot honey.",
    price: 14500,
    image: "https://images.unsplash.com/photo-1628840042765-356cda07504e?auto=format&fit=crop&w=900&q=80",
    modifiers: [sizeModifier],
  },
  {
    id: "dough-funghi",
    brandId: "dough",
    name: "Wild Mushroom",
    description: "Roasted mushrooms, taleggio, thyme, and truffle oil on a white base.",
    price: 15500,
    image: "https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: "dough-prosciutto",
    brandId: "dough",
    name: "Prosciutto & Rocket",
    description: "Cured prosciutto, fresh rocket, shaved parmesan, and lemon oil.",
    price: 15900,
    image: "https://images.unsplash.com/photo-1571066811602-716837d681de?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: "dough-garlic",
    brandId: "dough",
    name: "Garlic Focaccia",
    description: "Slow-fermented focaccia with confit garlic, rosemary, and flaky salt.",
    price: 6900,
    image: "https://images.unsplash.com/photo-1586444248902-2f64eddc13df?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: "dough-tiramisu",
    brandId: "dough",
    name: "Espresso Tiramisu",
    description: "Mascarpone, espresso-soaked savoiardi, and dark cocoa dust.",
    price: 7500,
    image: "https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?auto=format&fit=crop&w=900&q=80",
  },
];

export const RESTAURANT_BRAND_IDS = BRANDS.map((brand) => brand.id);

const img = (id: string) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=900&q=80`;

const PHOTO = {
  bread: img("1509440159596-0249088772ff"),
  croissant: img("1555507036-ab1f4038808a"),
  milk: img("1550583724-b2692b85b150"),
  yoghurt: img("1488477181946-6428a0291777"),
  salad: img("1512621776951-a57141f2eefd"),
  pie: img("1621955964441-c173e01c135b"),
  crisps: img("1566478989037-eec170784d0b"),
  nuts: img("1599599810769-bcde5a160d32"),
  banana: img("1571771894821-ce9b6c11b08e"),
  tomato: img("1561136594-7f68413baa99"),
  cola: img("1554866585-cd94860890b7"),
  energy: img("1622543925917-763c34d1a86e"),
  cable: img("1583863788434-e58a36330cf0"),
  chocolate: img("1511381939415-e44015466834"),
  water: img("1560023907-5f339617ea30"),
  noodles: img("1569718212165-3a8278d5f624"),
  beer: img("1608270586620-248524c67de9"),
  wine: img("1510812431401-41d2bd2722f3"),
  spirits: img("1569529465841-dfecdab7503b"),
  popcorn: img("1505686994434-e3cc5abf1330"),
  coffee: img("1461023058943-07fcbe16d735"),
  sandwich: img("1528735602780-2552fd46c7af"),
  icedtea: img("1499638673689-79a0b5115d87"),
  medicine: img("1584308666744-24d5c474f2ae"),
  steak: img("1546833999-b9f581a1996d"),
  chicken: img("1604503468506-a8da13d82791"),
  mince: img("1603048588665-791ca8aea617"),
  sausage: img("1597393353415-b3730f3719fe"),
  biltong: img("1606851091851-e8c8c0fca5ba"),
  sanitiser: img("1584483766114-2cea6facdf57"),
  lipbalm: img("1586495777744-4413f21062fa"),
  sachet: img("1550572017-edd951b55104"),
};

type NearbyProductSeed = { name: string; description: string; price: number; image: string };
type NearbyCategorySeed = { title: string; items: NearbyProductSeed[] };

const NEARBY_CATALOG: Record<string, NearbyCategorySeed[]> = {
  "woolworths-foodstop": [
    {
      title: "Bakery",
      items: [
        { name: "Seed loaf", description: "Stone-baked loaf with sunflower and pumpkin seeds", price: 4290, image: PHOTO.bread },
        { name: "Butter croissants (4)", description: "All-butter croissants, baked fresh in store", price: 2150, image: PHOTO.croissant },
        { name: "Sourdough loaf", description: "Slow-proved sourdough with a crisp crust", price: 4790, image: PHOTO.bread },
        { name: "Almond croissants", description: "Filled with frangipane and toasted almonds", price: 3290, image: PHOTO.croissant },
        { name: "Ciabatta rolls (6)", description: "Soft Italian-style rolls for sandwiches", price: 2790, image: PHOTO.bread },
        { name: "Banana bread loaf", description: "Moist banana loaf with a hint of cinnamon", price: 3590, image: PHOTO.bread },
      ],
    },
    {
      title: "Fridge",
      items: [
        { name: "Free-range milk 1L", description: "Full-cream milk from free-range Jersey herds", price: 2790, image: PHOTO.milk },
        { name: "Greek-style yoghurt", description: "Thick double-cream yoghurt, 1kg tub", price: 3450, image: PHOTO.yoghurt },
        { name: "Low-fat milk 2L", description: "Smooth low-fat milk for everyday use", price: 3290, image: PHOTO.milk },
        { name: "Vanilla yoghurt 6-pack", description: "Creamy vanilla yoghurt in lunchbox tubs", price: 3990, image: PHOTO.yoghurt },
        { name: "Fresh cream 250ml", description: "Pouring cream for desserts and sauces", price: 2490, image: PHOTO.milk },
        { name: "Berry yoghurt 1kg", description: "Smooth yoghurt rippled with mixed berries", price: 3650, image: PHOTO.yoghurt },
      ],
    },
    {
      title: "Ready meals",
      items: [
        { name: "Roast chicken salad", description: "Roast chicken, baby leaves, and a lemon dressing", price: 6990, image: PHOTO.salad },
        { name: "Chicken and mushroom pie", description: "Flaky pastry pie with a creamy filling", price: 4590, image: PHOTO.pie },
        { name: "Beef lasagne", description: "Layered pasta with slow-cooked beef ragù", price: 7290, image: PHOTO.pie },
        { name: "Greek salad bowl", description: "Cucumber, olives, feta, and ripe tomato", price: 5990, image: PHOTO.salad },
        { name: "Butter chicken bowl", description: "Mild butter chicken with basmati rice", price: 7490, image: PHOTO.salad },
        { name: "Vegetable quiche", description: "Roasted vegetable and cheddar quiche", price: 4990, image: PHOTO.pie },
      ],
    },
  ],
  spar: [
    {
      title: "Cupboard",
      items: [
        { name: "White bread", description: "Soft sliced loaf, baked daily", price: 1990, image: PHOTO.bread },
        { name: "Long-life milk 1L", description: "Full-cream UHT milk for the pantry", price: 2290, image: PHOTO.milk },
        { name: "Instant noodles", description: "Quick-cook noodles with a savoury sachet", price: 1190, image: PHOTO.noodles },
        { name: "Ground coffee 250g", description: "Medium-roast filter coffee", price: 6990, image: PHOTO.coffee },
        { name: "Still water 1.5L", description: "Bottled spring water for the home", price: 1290, image: PHOTO.water },
        { name: "Chocolate spread", description: "Smooth hazelnut and cocoa spread", price: 4490, image: PHOTO.chocolate },
      ],
    },
    {
      title: "Snacks",
      items: [
        { name: "Salted crisps", description: "Crinkle-cut potato crisps, sharing bag", price: 2490, image: PHOTO.crisps },
        { name: "Mixed nuts", description: "Roasted almonds, cashews, and peanuts", price: 4990, image: PHOTO.nuts },
        { name: "Salted popcorn", description: "Lightly salted popcorn, sharing bag", price: 2290, image: PHOTO.popcorn },
        { name: "Chocolate slab", description: "Creamy milk chocolate slab", price: 2790, image: PHOTO.chocolate },
        { name: "Beef biltong 100g", description: "Air-dried beef biltong, lean cut", price: 5990, image: PHOTO.biltong },
        { name: "Trail mix", description: "Nuts, seeds, and dried cranberries", price: 3990, image: PHOTO.nuts },
      ],
    },
    {
      title: "Fresh produce",
      items: [
        { name: "Bananas 1kg", description: "Ripe and ready Cavendish bananas", price: 2790, image: PHOTO.banana },
        { name: "Tomatoes 1kg", description: "Vine-ripened round tomatoes", price: 3290, image: PHOTO.tomato },
        { name: "Cherry tomatoes 250g", description: "Sweet snacking cherry tomatoes", price: 2490, image: PHOTO.tomato },
        { name: "Mixed salad leaves", description: "Washed baby leaves, ready to serve", price: 2990, image: PHOTO.salad },
        { name: "Baby bananas 500g", description: "Small, extra-sweet finger bananas", price: 2190, image: PHOTO.banana },
        { name: "Roma tomatoes 500g", description: "Firm plum tomatoes for cooking", price: 2690, image: PHOTO.tomato },
      ],
    },
  ],
  cityfuel: [
    {
      title: "On the go",
      items: [
        { name: "Beef pie", description: "Hot savoury pie with a tender beef filling", price: 3990, image: PHOTO.pie },
        { name: "Boerewors roll", description: "Grilled farmstyle boerewors on a fresh roll", price: 4590, image: PHOTO.sandwich },
        { name: "Chicken pie", description: "Creamy chicken filling in flaky pastry", price: 3890, image: PHOTO.pie },
        { name: "Toasted sandwich", description: "Ham and cheese toastie, made to order", price: 4290, image: PHOTO.sandwich },
        { name: "Steak pie", description: "Peppered steak pie with a golden crust", price: 4190, image: PHOTO.pie },
        { name: "Biltong 50g", description: "Lean air-dried beef biltong", price: 3490, image: PHOTO.biltong },
      ],
    },
    {
      title: "Drinks",
      items: [
        { name: "Cola 500ml", description: "Chilled classic cola", price: 1890, image: PHOTO.cola },
        { name: "Energy drink", description: "Sugar-free energy boost, 440ml can", price: 2790, image: PHOTO.energy },
        { name: "Still water 500ml", description: "Chilled spring water with a sports cap", price: 1290, image: PHOTO.water },
        { name: "Iced tea 500ml", description: "Chilled peach iced tea", price: 1990, image: PHOTO.icedtea },
        { name: "Cold brew coffee", description: "Slow-steeped cold brew, 250ml", price: 3490, image: PHOTO.coffee },
        { name: "Sparkling water 500ml", description: "Naturally carbonated spring water", price: 1490, image: PHOTO.water },
      ],
    },
    {
      title: "Essentials",
      items: [
        { name: "Charging cable", description: "Braided USB-C cable for on-the-road top-ups", price: 9990, image: PHOTO.cable },
        { name: "Bottled water 1.5L", description: "Spring water for the journey", price: 1690, image: PHOTO.water },
        { name: "Mints", description: "Sugar-free peppermints", price: 1290, image: PHOTO.chocolate },
        { name: "Crisps", description: "Single-serve salted crisps", price: 1590, image: PHOTO.crisps },
        { name: "Chocolate bar", description: "Smooth milk chocolate slab", price: 1690, image: PHOTO.chocolate },
        { name: "Instant noodles", description: "Quick-cook noodles with a savoury sachet", price: 1290, image: PHOTO.noodles },
      ],
    },
  ],
  "yassir-express": [
    {
      title: "Convenience",
      items: [
        { name: "Crisps multipack", description: "Six single-serve packs for sharing", price: 4990, image: PHOTO.crisps },
        { name: "Chocolate bar", description: "Smooth milk chocolate slab", price: 1690, image: PHOTO.chocolate },
        { name: "Still water 750ml", description: "Spring water with a sports cap", price: 1490, image: PHOTO.water },
        { name: "Instant noodles", description: "Quick-cook noodles with a savoury sachet", price: 1290, image: PHOTO.noodles },
        { name: "Biltong 100g", description: "Air-dried beef biltong, lean cut", price: 5990, image: PHOTO.biltong },
        { name: "Mixed nuts", description: "Roasted almonds, cashews, and peanuts", price: 4990, image: PHOTO.nuts },
        { name: "Popcorn", description: "Lightly salted popcorn, sharing bag", price: 2290, image: PHOTO.popcorn },
        { name: "Energy drink", description: "Sugar-free energy boost, 440ml can", price: 2790, image: PHOTO.energy },
      ],
    },
    {
      title: "Drinks",
      items: [
        { name: "Cola 500ml", description: "Chilled classic cola", price: 1890, image: PHOTO.cola },
        { name: "Iced tea 500ml", description: "Chilled peach iced tea", price: 1990, image: PHOTO.icedtea },
        { name: "Cold brew coffee", description: "Slow-steeped cold brew, 250ml", price: 3490, image: PHOTO.coffee },
        { name: "Sparkling water 500ml", description: "Naturally carbonated spring water", price: 1490, image: PHOTO.water },
        { name: "Still water 1.5L", description: "Bottled spring water to share", price: 1690, image: PHOTO.water },
        { name: "Chocolate milk 300ml", description: "Chilled chocolate-flavoured milk", price: 1890, image: PHOTO.milk },
      ],
    },
  ],
  "tops-at-spar": [
    {
      title: "Beer",
      items: [
        { name: "Lager 6-pack", description: "Crisp South African lager, 330ml bottles", price: 11990, image: PHOTO.beer },
        { name: "Craft ale 500ml", description: "Hoppy local craft ale", price: 3290, image: PHOTO.beer },
        { name: "Pilsner 6-pack", description: "Light, refreshing pilsner, 330ml bottles", price: 12490, image: PHOTO.beer },
        { name: "Stout 440ml", description: "Smooth, full-bodied dry stout", price: 2890, image: PHOTO.beer },
        { name: "Light lager 6-pack", description: "Easy-drinking low-alcohol lager", price: 10990, image: PHOTO.beer },
        { name: "Apple cider 6-pack", description: "Crisp, semi-sweet apple cider", price: 12990, image: PHOTO.beer },
      ],
    },
    {
      title: "Wine",
      items: [
        { name: "Cabernet Sauvignon", description: "Full-bodied Stellenbosch red", price: 8990, image: PHOTO.wine },
        { name: "Chenin Blanc", description: "Crisp, fruity Western Cape white", price: 7990, image: PHOTO.wine },
        { name: "Merlot", description: "Soft, plummy easy-drinking red", price: 8490, image: PHOTO.wine },
        { name: "Sauvignon Blanc", description: "Zesty white with citrus notes", price: 8290, image: PHOTO.wine },
        { name: "Rosé", description: "Dry, pale rosé with summer berry notes", price: 7690, image: PHOTO.wine },
        { name: "Cap Classique", description: "Méthode Cap Classique sparkling wine", price: 14990, image: PHOTO.wine },
      ],
    },
    {
      title: "Spirits",
      items: [
        { name: "Gin 750ml", description: "Classic London dry gin", price: 23990, image: PHOTO.spirits },
        { name: "Vodka 750ml", description: "Triple-distilled premium vodka", price: 21990, image: PHOTO.spirits },
        { name: "Whisky 750ml", description: "Blended Scotch whisky", price: 32990, image: PHOTO.spirits },
        { name: "Brandy 750ml", description: "Smooth potstill South African brandy", price: 25990, image: PHOTO.spirits },
        { name: "Spiced rum 750ml", description: "Warm spiced golden rum", price: 24990, image: PHOTO.spirits },
        { name: "Tequila 750ml", description: "Silver tequila for mixing", price: 28990, image: PHOTO.spirits },
      ],
    },
  ],
  "liquor-city": [
    {
      title: "Beer",
      items: [
        { name: "Premium lager 6-pack", description: "Smooth premium lager, 330ml bottles", price: 12990, image: PHOTO.beer },
        { name: "Craft IPA 500ml", description: "Citrusy, hop-forward India pale ale", price: 3490, image: PHOTO.beer },
        { name: "Pilsner 6-pack", description: "Light, refreshing pilsner, 330ml bottles", price: 12490, image: PHOTO.beer },
        { name: "Amber ale 440ml", description: "Malty amber ale with a caramel note", price: 2990, image: PHOTO.beer },
        { name: "Apple cider 6-pack", description: "Crisp, semi-sweet apple cider", price: 12990, image: PHOTO.beer },
        { name: "Stout 440ml", description: "Smooth, full-bodied dry stout", price: 2890, image: PHOTO.beer },
      ],
    },
    {
      title: "Wine",
      items: [
        { name: "Pinotage", description: "Rich, smoky South African red", price: 9490, image: PHOTO.wine },
        { name: "Sauvignon Blanc", description: "Zesty white with citrus notes", price: 8490, image: PHOTO.wine },
        { name: "Shiraz", description: "Peppery, full-bodied Swartland red", price: 8990, image: PHOTO.wine },
        { name: "Chardonnay", description: "Lightly wooded white with stone fruit", price: 8790, image: PHOTO.wine },
        { name: "Rosé", description: "Dry, pale rosé with summer berry notes", price: 7690, image: PHOTO.wine },
        { name: "Merlot", description: "Soft, plummy easy-drinking red", price: 8490, image: PHOTO.wine },
      ],
    },
    {
      title: "Spirits",
      items: [
        { name: "Whisky 750ml", description: "Blended Scotch whisky", price: 32990, image: PHOTO.spirits },
        { name: "Spiced rum 750ml", description: "Warm spiced golden rum", price: 24990, image: PHOTO.spirits },
        { name: "Gin 750ml", description: "Classic London dry gin", price: 23990, image: PHOTO.spirits },
        { name: "Vodka 750ml", description: "Triple-distilled premium vodka", price: 21990, image: PHOTO.spirits },
        { name: "Brandy 750ml", description: "Smooth potstill South African brandy", price: 25990, image: PHOTO.spirits },
        { name: "Tequila 750ml", description: "Silver tequila for mixing", price: 28990, image: PHOTO.spirits },
      ],
    },
  ],
  "blue-bottle-liquors": [
    {
      title: "Wine",
      items: [
        { name: "Shiraz", description: "Peppery, full-bodied Swartland red", price: 8990, image: PHOTO.wine },
        { name: "Cap Classique", description: "Méthode Cap Classique sparkling wine", price: 14990, image: PHOTO.wine },
        { name: "Pinotage", description: "Rich, smoky South African red", price: 9490, image: PHOTO.wine },
        { name: "Chenin Blanc", description: "Crisp, fruity Western Cape white", price: 7990, image: PHOTO.wine },
        { name: "Merlot", description: "Soft, plummy easy-drinking red", price: 8490, image: PHOTO.wine },
        { name: "Rosé", description: "Dry, pale rosé with summer berry notes", price: 7690, image: PHOTO.wine },
      ],
    },
    {
      title: "Spirits",
      items: [
        { name: "Vodka 750ml", description: "Triple-distilled premium vodka", price: 21990, image: PHOTO.spirits },
        { name: "Brandy 750ml", description: "Smooth potstill South African brandy", price: 25990, image: PHOTO.spirits },
        { name: "Gin 750ml", description: "Classic London dry gin", price: 23990, image: PHOTO.spirits },
        { name: "Whisky 750ml", description: "Blended Scotch whisky", price: 32990, image: PHOTO.spirits },
        { name: "Spiced rum 750ml", description: "Warm spiced golden rum", price: 24990, image: PHOTO.spirits },
        { name: "Tequila 750ml", description: "Silver tequila for mixing", price: 28990, image: PHOTO.spirits },
      ],
    },
    {
      title: "Mixers",
      items: [
        { name: "Tonic 4-pack", description: "Indian tonic water, 200ml bottles", price: 4990, image: PHOTO.water },
        { name: "Soda water 4-pack", description: "Crisp soda water, 200ml bottles", price: 4490, image: PHOTO.water },
        { name: "Cola 1.5L", description: "Classic cola for mixing", price: 2290, image: PHOTO.cola },
        { name: "Lemonade 1.5L", description: "Cloudy lemonade, lightly sparkling", price: 2190, image: PHOTO.water },
        { name: "Ginger ale 4-pack", description: "Dry ginger ale, 200ml bottles", price: 4690, image: PHOTO.water },
        { name: "Sparkling water 1L", description: "Naturally carbonated spring water", price: 1690, image: PHOTO.water },
      ],
    },
  ],
  "uber-eats-market": [
    {
      title: "Snacks",
      items: [
        { name: "Trail mix", description: "Nuts, seeds, and dried cranberries", price: 3990, image: PHOTO.nuts },
        { name: "Popcorn", description: "Lightly salted popcorn, sharing bag", price: 2490, image: PHOTO.popcorn },
        { name: "Salted crisps", description: "Crinkle-cut potato crisps, sharing bag", price: 2490, image: PHOTO.crisps },
        { name: "Beef biltong 100g", description: "Air-dried beef biltong, lean cut", price: 5990, image: PHOTO.biltong },
        { name: "Mixed nuts", description: "Roasted almonds, cashews, and peanuts", price: 4990, image: PHOTO.nuts },
        { name: "Chocolate slab", description: "Creamy milk chocolate slab", price: 2790, image: PHOTO.chocolate },
      ],
    },
    {
      title: "Drinks",
      items: [
        { name: "Sparkling water", description: "Naturally carbonated spring water", price: 1490, image: PHOTO.water },
        { name: "Cold brew coffee", description: "Slow-steeped cold brew, 250ml", price: 3490, image: PHOTO.coffee },
        { name: "Iced tea 500ml", description: "Chilled peach iced tea", price: 1990, image: PHOTO.icedtea },
        { name: "Cola 440ml", description: "Ice-cold cola can", price: 1790, image: PHOTO.cola },
        { name: "Energy drink", description: "Sugar-free energy boost, 440ml can", price: 2790, image: PHOTO.energy },
        { name: "Still water 750ml", description: "Spring water with a sports cap", price: 1490, image: PHOTO.water },
      ],
    },
    {
      title: "Sweet treats",
      items: [
        { name: "Dark chocolate", description: "70% cocoa dark chocolate slab", price: 2990, image: PHOTO.chocolate },
        { name: "Milk chocolate slab", description: "Creamy milk chocolate slab", price: 2790, image: PHOTO.chocolate },
        { name: "Almond croissants", description: "Filled with frangipane and toasted almonds", price: 3290, image: PHOTO.croissant },
        { name: "Banana bread loaf", description: "Moist banana loaf with a hint of cinnamon", price: 3590, image: PHOTO.bread },
        { name: "Caramel popcorn", description: "Sweet, crunchy caramel popcorn", price: 2690, image: PHOTO.popcorn },
        { name: "Chocolate croissants (4)", description: "Buttery croissants with chocolate batons", price: 3390, image: PHOTO.croissant },
      ],
    },
  ],
  "engen-quickshop": [
    {
      title: "On the go",
      items: [
        { name: "Steak and kidney pie", description: "Hearty pie with a rich gravy filling", price: 3990, image: PHOTO.pie },
        { name: "Toasted sandwich", description: "Ham and cheese toastie, made to order", price: 4290, image: PHOTO.sandwich },
        { name: "Chicken pie", description: "Creamy chicken filling in flaky pastry", price: 3890, image: PHOTO.pie },
        { name: "Boerewors roll", description: "Grilled farmstyle boerewors on a fresh roll", price: 4590, image: PHOTO.sandwich },
        { name: "Beef pie", description: "Hot savoury pie with a tender beef filling", price: 3990, image: PHOTO.pie },
        { name: "Biltong 50g", description: "Lean air-dried beef biltong", price: 3490, image: PHOTO.biltong },
      ],
    },
    {
      title: "Drinks",
      items: [
        { name: "Iced tea", description: "Chilled peach iced tea, 500ml", price: 1990, image: PHOTO.icedtea },
        { name: "Cola 440ml", description: "Ice-cold cola can", price: 1790, image: PHOTO.cola },
        { name: "Energy drink", description: "Sugar-free energy boost, 440ml can", price: 2790, image: PHOTO.energy },
        { name: "Still water 500ml", description: "Chilled spring water with a sports cap", price: 1290, image: PHOTO.water },
        { name: "Cold brew coffee", description: "Slow-steeped cold brew, 250ml", price: 3490, image: PHOTO.coffee },
        { name: "Sparkling water 500ml", description: "Naturally carbonated spring water", price: 1490, image: PHOTO.water },
      ],
    },
    {
      title: "Essentials",
      items: [
        { name: "Chewing gum", description: "Sugar-free mint gum", price: 1290, image: PHOTO.chocolate },
        { name: "Charging cable", description: "Braided USB-C cable for quick top-ups", price: 9990, image: PHOTO.cable },
        { name: "Mints", description: "Sugar-free peppermints", price: 1290, image: PHOTO.chocolate },
        { name: "Crisps", description: "Single-serve salted crisps", price: 1590, image: PHOTO.crisps },
        { name: "Instant noodles", description: "Quick-cook noodles with a savoury sachet", price: 1290, image: PHOTO.noodles },
        { name: "Chocolate bar", description: "Smooth milk chocolate slab", price: 1690, image: PHOTO.chocolate },
      ],
    },
  ],
  "over-the-counter": [
    {
      title: "Health",
      items: [
        { name: "Paracetamol (24s)", description: "Pain and fever relief tablets", price: 3990, image: PHOTO.medicine },
        { name: "Vitamin C (30s)", description: "1000mg effervescent tablets", price: 6990, image: PHOTO.medicine },
        { name: "Ibuprofen (16s)", description: "Anti-inflammatory pain relief tablets", price: 4490, image: PHOTO.medicine },
        { name: "Antihistamine (10s)", description: "Non-drowsy allergy relief tablets", price: 5290, image: PHOTO.medicine },
        { name: "Cough syrup 100ml", description: "Soothing syrup for dry coughs", price: 5990, image: PHOTO.medicine },
        { name: "Multivitamin (30s)", description: "Daily multivitamin and mineral tablets", price: 8990, image: PHOTO.medicine },
      ],
    },
    {
      title: "Personal care",
      items: [
        { name: "Hand sanitiser 100ml", description: "70% alcohol gel, pocket size", price: 2990, image: PHOTO.sanitiser },
        { name: "Lip balm", description: "Moisturising balm with SPF 15", price: 2490, image: PHOTO.lipbalm },
        { name: "Hand wash 250ml", description: "Gentle antibacterial hand wash", price: 3490, image: PHOTO.sanitiser },
        { name: "SPF lip balm", description: "Protective lip balm with SPF 30", price: 2790, image: PHOTO.lipbalm },
        { name: "Antibacterial gel 50ml", description: "Quick-dry sanitising gel", price: 1990, image: PHOTO.sanitiser },
        { name: "Moisturising balm", description: "Nourishing balm for dry lips", price: 2390, image: PHOTO.lipbalm },
      ],
    },
    {
      title: "Wellness",
      items: [
        { name: "Rehydrate sachets", description: "Electrolyte sachets, pack of six", price: 4990, image: PHOTO.sachet },
        { name: "Vitamin C sachets", description: "Effervescent vitamin C drink sachets", price: 5490, image: PHOTO.sachet },
        { name: "Immune boost sachets", description: "Zinc and vitamin C support sachets", price: 5990, image: PHOTO.sachet },
        { name: "Energy sachets", description: "B-vitamin energy drink sachets", price: 5290, image: PHOTO.sachet },
        { name: "Magnesium sachets", description: "Magnesium drink sachets for recovery", price: 6290, image: PHOTO.sachet },
        { name: "Electrolyte sachets", description: "Hydration sachets with added minerals", price: 4790, image: PHOTO.sachet },
      ],
    },
  ],
  "butcher-s-bike": [
    {
      title: "Beef",
      items: [
        { name: "Rump steak 300g", description: "Aged rump steak, hand-cut", price: 8990, image: PHOTO.steak },
        { name: "Beef mince 500g", description: "Lean freshly ground beef mince", price: 6490, image: PHOTO.mince },
        { name: "Sirloin steak 300g", description: "Tender sirloin with a fine marble", price: 9490, image: PHOTO.steak },
        { name: "Beef short rib 500g", description: "Meaty short rib for slow braising", price: 8290, image: PHOTO.steak },
        { name: "Stewing beef 500g", description: "Cubed beef for hearty stews and curries", price: 5990, image: PHOTO.mince },
        { name: "Fillet steak 250g", description: "Lean, tender centre-cut fillet", price: 12990, image: PHOTO.steak },
      ],
    },
    {
      title: "Poultry",
      items: [
        { name: "Chicken breasts 500g", description: "Free-range deboned chicken breasts", price: 7490, image: PHOTO.chicken },
        { name: "Chicken thighs 500g", description: "Juicy bone-in chicken thighs", price: 5990, image: PHOTO.chicken },
        { name: "Whole chicken 1.2kg", description: "Free-range whole chicken for roasting", price: 8990, image: PHOTO.chicken },
        { name: "Chicken wings 700g", description: "Plump wings for the grill or oven", price: 5490, image: PHOTO.chicken },
        { name: "Chicken drumsticks 600g", description: "Family-pack chicken drumsticks", price: 5290, image: PHOTO.chicken },
        { name: "Chicken mince 500g", description: "Lean ground chicken for lighter meals", price: 5790, image: PHOTO.mince },
      ],
    },
    {
      title: "Braai",
      items: [
        { name: "Farmstyle boerewors 500g", description: "Coarse-ground boerewors with coriander", price: 5990, image: PHOTO.sausage },
        { name: "Marinated lamb chops 400g", description: "Loin chops in a rosemary marinade", price: 11990, image: PHOTO.steak },
        { name: "Pork sausages 500g", description: "Thick farmstyle pork bangers", price: 5490, image: PHOTO.sausage },
        { name: "BBQ pork ribs 600g", description: "Sticky basted pork ribs for the grill", price: 9990, image: PHOTO.steak },
        { name: "Beef sosaties 400g", description: "Skewered beef in a mild curry marinade", price: 7990, image: PHOTO.steak },
        { name: "Chicken sosaties 400g", description: "Skewered chicken with apricot and spice", price: 6990, image: PHOTO.chicken },
      ],
    },
  ],
};

const NEARBY_STORE_LOCATIONS: StoreLocation[] = [];
const NEARBY_BRANDS: Brand[] = [];
const NEARBY_MENU_ITEMS: MenuItem[] = [];
export const NEARBY_STORE_MENUS: Record<string, { title: string; items: MenuItem[] }[]> = {};

for (const shop of SHOPS_NEAR_YOU) {
  const slug = shopSlug(shop.name);
  const categories = NEARBY_CATALOG[slug];
  if (!categories) continue;

  const locationId = `nearby-${slug}`;
  NEARBY_STORE_LOCATIONS.push({
    id: locationId,
    name: shop.name,
    type: "cluster",
    area: shop.area,
    coordinates: shop.coordinates,
    proximityGroupId: `${slug}-standalone`,
    proximityLabel: `${shop.area} pickup`,
    routeIds: [],
    pickupPoint: `${shop.name} collection point`,
    rating: 4.5,
    hasOffer: Boolean(shop.badge),
  });

  NEARBY_BRANDS.push({
    id: slug,
    name: shop.name,
    tagline: "",
    accent: "",
    cover: categories[0]?.items[0]?.image ?? "",
    logoColor: shop.logoColor,
    logoUrl: shop.logoUrl,
    storeLocationId: locationId,
  });

  NEARBY_STORE_MENUS[slug] = categories.map((category, categoryIndex) => ({
    title: category.title,
    items: category.items.map((seed, itemIndex) => {
      const item: MenuItem = {
        id: `${slug}-${categoryIndex}-${itemIndex}`,
        brandId: slug,
        name: seed.name,
        description: seed.description,
        price: seed.price,
        image: seed.image,
      };
      NEARBY_MENU_ITEMS.push(item);
      return item;
    }),
  }));
}

BRANDS.push(...NEARBY_BRANDS);
MENU_ITEMS.push(...NEARBY_MENU_ITEMS);

export function getNearbyStoreMenu(slug: string) {
  return NEARBY_STORE_MENUS[slug] ?? [];
}

export function categorySlug(title: string) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function getNearbyStoreCategory(slug: string, category: string) {
  return getNearbyStoreMenu(slug).find((entry) => categorySlug(entry.title) === category);
}

export const DELIVERY_FEE = 3500;
export const SERVICE_FEE = 1200;

const BESTSELLER_TAG = "bestseller";

export const MOST_LIKED_BADGES: Record<string, string> = {
  "harvest-mediterranean": "#1 most liked",
  "harvest-poke": "#2 most liked",
  "harvest-buddha": "#3 most liked",
};

export function getDisplayTags(item: Pick<MenuItem, "tags">) {
  return (item.tags ?? []).filter((tag) => tag.toLowerCase() !== BESTSELLER_TAG);
}

export function getMostLikedBadge(item: Pick<MenuItem, "id" | "tags">) {
  return MOST_LIKED_BADGES[item.id] ?? (item.tags?.some((tag) => tag.toLowerCase() === BESTSELLER_TAG) ? "#1 most liked" : undefined);
}

export function getBrand(id: string) {
  return BRANDS.find((b) => b.id === id);
}

export function getBrandDisplayName(id: string) {
  const brand = getBrand(id);
  return brand?.name.split("—")[1]?.trim() ?? brand?.name ?? "Store";
}

export function getStoreLocation(id: string) {
  return (
    STORE_LOCATIONS.find((location) => location.id === id) ??
    NEARBY_STORE_LOCATIONS.find((location) => location.id === id)
  );
}

export function getBrandLocation(brandId: string) {
  const brand = getBrand(brandId);
  return brand ? getStoreLocation(brand.storeLocationId) : undefined;
}

export function getFulfillmentRoute(id: string) {
  return FULFILLMENT_ROUTES.find((route) => route.id === id);
}

export function brandsCanShareOrder(firstBrandId: string, secondBrandId: string) {
  return Boolean(getBrandLocation(firstBrandId) && getBrandLocation(secondBrandId));
}

export function getCompatibleBrands(brandId: string) {
  return BRANDS.filter((brand) => brandsCanShareOrder(brandId, brand.id));
}

export function getItem(id: string) {
  return MENU_ITEMS.find((m) => m.id === id);
}

// ── Foyer domain aliases ────────────────────────────────────────────────────
// The Foyer architecture distinguishes Brand (parent identity) from Outlet
// (per-complex location) and uses Complex instead of Hub. These aliases let
// new code use Foyer language while the prototype pages continue to compile.
// The mock data collapses Brand and Outlet 1:1 — real Outlet/Brand split
// arrives with the live catalog API in M1.
export type Outlet = Brand;
export type Complex = Hub;
export const OUTLETS = BRANDS;
export const COMPLEXES = HUBS;
export const getOutlet = getBrand;
export const getComplex = (id: string) => HUBS.find((h) => h.id === id);
