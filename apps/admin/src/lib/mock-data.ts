export type Brand = {
  id: string;
  name: string;
  tagline: string;
  accent: string;
  cover: string;
  logoColor: string;
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
};

export const HUBS: Hub[] = [
  { id: "rosebank", name: "Rosebank Hub", area: "Rosebank, Johannesburg", etaMinutes: [25, 40] },
  { id: "sandton", name: "Sandton Hub", area: "Sandton Central, Johannesburg", etaMinutes: [20, 35] },
  { id: "melville", name: "Melville Hub", area: "Melville, Johannesburg", etaMinutes: [25, 45] },
  { id: "parkhurst", name: "Parkhurst Hub", area: "Parkhurst, Johannesburg", etaMinutes: [30, 45] },
  { id: "greenside", name: "Greenside Hub", area: "Greenside, Johannesburg", etaMinutes: [25, 40] },
];

export const BRANDS: Brand[] = [
  {
    id: "ember",
    name: "Brand A — Ember & Char",
    tagline: "Flame-grilled burgers, smashed thin and stacked tall.",
    accent: "from-orange-500/20 to-rose-500/20",
    logoColor: "#C2410C",
    cover:
      "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: "harvest",
    name: "Brand B — Harvest Bowls",
    tagline: "Grain bowls, crisp greens, and house-made dressings.",
    accent: "from-emerald-500/20 to-lime-500/20",
    logoColor: "#15803D",
    cover:
      "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: "noodlebar",
    name: "Brand C — Noodle Bar",
    tagline: "Hand-pulled noodles and slow-simmered broths.",
    accent: "from-amber-500/20 to-red-500/20",
    logoColor: "#B91C1C",
    cover:
      "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: "dough",
    name: "Brand D — Dough Society",
    tagline: "Sourdough pizzas fired in a 400°C deck oven.",
    accent: "from-yellow-500/20 to-orange-500/20",
    logoColor: "#A16207",
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

export const DELIVERY_FEE = 3500;
export const SERVICE_FEE = 1200;

export function getBrand(id: string) {
  return BRANDS.find((b) => b.id === id);
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
